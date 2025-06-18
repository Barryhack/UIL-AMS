#include "SDCardHandler.h"

SDCardHandler::SDCardHandler(int cs, int mosi, int miso, int sck) 
  : csPin(cs), mosiPin(mosi), misoPin(miso), sckPin(sck), initialized(false) {
  dataPath = "/data";
  logPath = "/logs";
  configPath = "/config";
  backupPath = "/backup";
}

bool SDCardHandler::init() {
  SPI.begin(sckPin, misoPin, mosiPin, csPin);
  
  if (!SD.begin(csPin)) {
    Serial.println("SD Card initialization failed!");
    return false;
  }
  
  // Check card type and size
  uint8_t cardType = SD.cardType();
  if (cardType == CARD_NONE) {
    Serial.println("No SD card attached");
    return false;
  }
  
  Serial.print("SD Card Type: ");
  if (cardType == CARD_MMC) {
    Serial.println("MMC");
  } else if (cardType == CARD_SD) {
    Serial.println("SDSC");
  } else if (cardType == CARD_SDHC) {
    Serial.println("SDHC");
  } else {
    Serial.println("UNKNOWN");
  }
  
  uint64_t cardSize = SD.cardSize() / (1024 * 1024);
  Serial.printf("SD Card Size: %lluMB\n", cardSize);
  
  // Create directory structure
  if (!createDirectoryStructure()) {
    Serial.println("Failed to create directory structure");
    return false;
  }
  
  initialized = true;
  writeLog("INFO", "SDCardHandler", "SD Card initialized successfully");
  
  return true;
}

void SDCardHandler::update() {
  static unsigned long lastMaintenance = 0;
  
  // Perform maintenance every hour
  if (millis() - lastMaintenance > 3600000) {
    performMaintenance();
    lastMaintenance = millis();
  }
}

bool SDCardHandler::createDirectoryStructure() {
  // Create main directories
  if (!SD.exists(dataPath)) {
    if (!SD.mkdir(dataPath)) {
      Serial.println("Failed to create data directory");
      return false;
    }
  }
  
  if (!SD.exists(logPath)) {
    if (!SD.mkdir(logPath)) {
      Serial.println("Failed to create log directory");
      return false;
    }
  }
  
  if (!SD.exists(configPath)) {
    if (!SD.mkdir(configPath)) {
      Serial.println("Failed to create config directory");
      return false;
    }
  }
  
  if (!SD.exists(backupPath)) {
    if (!SD.mkdir(backupPath)) {
      Serial.println("Failed to create backup directory");
      return false;
    }
  }
  
  // Create initial files if they don't exist
  String attendanceFile = dataPath + "/attendance.json";
  if (!SD.exists(attendanceFile)) {
    File file = SD.open(attendanceFile, FILE_WRITE);
    if (file) {
      file.println("[]"); // Empty JSON array
      file.close();
    }
  }
  
  String enrollmentFile = dataPath + "/enrollment.json";
  if (!SD.exists(enrollmentFile)) {
    File file = SD.open(enrollmentFile, FILE_WRITE);
    if (file) {
      file.println("[]"); // Empty JSON array
      file.close();
    }
  }
  
  return true;
}

bool SDCardHandler::storeAttendanceRecord(const AttendanceRecord& record) {
  if (!initialized || !validateAttendanceRecord(record)) {
    return false;
  }
  
  String filename = dataPath + "/attendance.json";
  
  // Read existing records
  DynamicJsonDocument doc(8192);
  String content = readFromFile(filename);
  
  if (content.length() > 0) {
    DeserializationError error = deserializeJson(doc, content);
    if (error) {
      writeLog("ERROR", "SDCardHandler", "Failed to parse attendance file: " + String(error.c_str()));
      return false;
    }
  } else {
    doc.to<JsonArray>();
  }
  
  // Add new record
  JsonObject newRecord = doc.createNestedObject();
  newRecord["userId"] = record.userId;
  newRecord["timestamp"] = record.timestamp;
  newRecord["method"] = record.method;
  newRecord["synced"] = record.synced;
  newRecord["deviceId"] = record.deviceId;
  newRecord["confidence"] = record.confidence;
  
  // Write back to file
  String output;
  serializeJson(doc, output);
  
  if (writeToFile(filename, output, false)) {
    writeLog("INFO", "SDCardHandler", "Attendance record stored: " + record.userId);
    return true;
  }
  
  return false;
}

bool SDCardHandler::getAttendanceRecords(std::vector<AttendanceRecord>& records, bool unsyncedOnly) {
  if (!initialized) return false;
  
  String filename = dataPath + "/attendance.json";
  String content = readFromFile(filename);
  
  if (content.length() == 0) return true; // Empty file is valid
  
  DynamicJsonDocument doc(8192);
  DeserializationError error = deserializeJson(doc, content);
  
  if (error) {
    writeLog("ERROR", "SDCardHandler", "Failed to parse attendance file");
    return false;
  }
  
  records.clear();
  JsonArray array = doc.as<JsonArray>();
  
  for (JsonObject obj : array) {
    AttendanceRecord record;
    record.userId = obj["userId"].as<String>();
    record.timestamp = obj["timestamp"].as<String>();
    record.method = obj["method"].as<String>();
    record.synced = obj["synced"].as<bool>();
    record.deviceId = obj["deviceId"].as<String>();
    record.confidence = obj["confidence"].as<int>();
    
    if (!unsyncedOnly || !record.synced) {
      records.push_back(record);
    }
  }
  
  return true;
}

bool SDCardHandler::markRecordAsSynced(String userId, String timestamp) {
  if (!initialized) return false;
  
  String filename = dataPath + "/attendance.json";
  String content = readFromFile(filename);
  
  DynamicJsonDocument doc(8192);
  DeserializationError error = deserializeJson(doc, content);
  
  if (error) return false;
  
  JsonArray array = doc.as<JsonArray>();
  bool found = false;
  
  for (JsonObject obj : array) {
    if (obj["userId"].as<String>() == userId && 
        obj["timestamp"].as<String>() == timestamp) {
      obj["synced"] = true;
      found = true;
      break;
    }
  }
  
  if (found) {
    String output;
    serializeJson(doc, output);
    return writeToFile(filename, output, false);
  }
  
  return false;
}

int SDCardHandler::getUnsyncedRecordCount() {
  std::vector<AttendanceRecord> records;
  if (getAttendanceRecords(records, true)) {
    return records.size();
  }
  return -1;
}

bool SDCardHandler::storeEnrollmentData(const EnrollmentData& data) {
  if (!initialized || !validateEnrollmentData(data)) {
    return false;
  }
  
  String filename = dataPath + "/enrollment.json";
  
  // Read existing data
  DynamicJsonDocument doc(4096);
  String content = readFromFile(filename);
  
  if (content.length() > 0) {
    DeserializationError error = deserializeJson(doc, content);
    if (error) {
      writeLog("ERROR", "SDCardHandler", "Failed to parse enrollment file");
      return false;
    }
  } else {
    doc.to<JsonArray>();
  }
  
  // Check if user already exists for this method
  JsonArray array = doc.as<JsonArray>();
  bool updated = false;
  
  for (JsonObject obj : array) {
    if (obj["userId"].as<String>() == data.userId && 
        obj["method"].as<String>() == data.method) {
      // Update existing record
      obj["data"] = data.data;
      obj["timestamp"] = data.timestamp;
      obj["active"] = data.active;
      updated = true;
      break;
    }
  }
  
  if (!updated) {
    // Add new record
    JsonObject newData = doc.createNestedObject();
    newData["userId"] = data.userId;
    newData["method"] = data.method;
    newData["data"] = data.data;
    newData["timestamp"] = data.timestamp;
    newData["active"] = data.active;
  }
  
  // Write back to file
  String output;
  serializeJson(doc, output);
  
  if (writeToFile(filename, output, false)) {
    writeLog("INFO", "SDCardHandler", "Enrollment data stored: " + data.userId + " (" + data.method + ")");
    return true;
  }
  
  return false;
}

bool SDCardHandler::writeLog(String level, String component, String message) {
  if (!initialized) return false;
  
  String timestamp = String(millis()); // In production, use real timestamp
  String filename = logPath + "/system.log";
  
  DynamicJsonDocument logEntry(512);
  logEntry["timestamp"] = timestamp;
  logEntry["level"] = level;
  logEntry["component"] = component;
  logEntry["message"] = message;
  
  String logLine;
  serializeJson(logEntry, logLine);
  logLine += "\n";
  
  return writeToFile(filename, logLine, true);
}

bool SDCardHandler::saveConfiguration(const DynamicJsonDocument& config) {
  if (!initialized) return false;
  
  String filename = configPath + "/system.json";
  String output;
  serializeJson(config, output);
  
  if (writeToFile(filename, output, false)) {
    writeLog("INFO", "SDCardHandler", "Configuration saved");
    return true;
  }
  
  return false;
}

bool SDCardHandler::loadConfiguration(DynamicJsonDocument& config) {
  if (!initialized) return false;
  
  String filename = configPath + "/system.json";
  String content = readFromFile(filename);
  
  if (content.length() == 0) {
    // Create default configuration
    config["wifi"]["ssid"] = WIFI_SSID;
    config["wifi"]["password"] = WIFI_PASSWORD;
    config["server"]["url"] = SERVER_URL;
    config["server"]["port"] = SERVER_PORT;
    config["system"]["buzzer_enabled"] = true;
    config["system"]["display_brightness"] = 255;
    config["system"]["fingerprint_timeout"] = FINGERPRINT_TIMEOUT;
    config["system"]["rfid_timeout"] = RFID_TIMEOUT;
    
    saveConfiguration(config);
    return true;
  }
  
  DeserializationError error = deserializeJson(config, content);
  if (error) {
    writeLog("ERROR", "SDCardHandler", "Failed to parse configuration file");
    return false;
  }
  
  return true;
}

unsigned long SDCardHandler::getTotalSpace() {
  if (!initialized) return 0;
  return SD.totalBytes();
}

unsigned long SDCardHandler::getUsedSpace() {
  if (!initialized) return 0;
  return SD.usedBytes();
}

unsigned long SDCardHandler::getFreeSpace() {
  if (!initialized) return 0;
  return getTotalSpace() - getUsedSpace();
}

bool SDCardHandler::performMaintenance() {
  if (!initialized) return false;
  
  writeLog("INFO", "SDCardHandler", "Starting maintenance routine");
  
  // Clean old log files (keep last 7 days worth)
  // In a real implementation, you'd implement date-based cleanup
  
  // Compact database files
  compactDatabase();
  
  // Create backup
  createSystemBackup();
  
  writeLog("INFO", "SDCardHandler", "Maintenance routine completed");
  return true;
}

bool SDCardHandler::compactDatabase() {
  // Remove deleted/inactive records to save space
  writeLog("INFO", "SDCardHandler", "Compacting database");
  
  // For enrollment data, remove inactive records older than 30 days
  String enrollmentFile = dataPath + "/enrollment.json";
  String content = readFromFile(enrollmentFile);
  
  if (content.length() > 0) {
    DynamicJsonDocument doc(4096);
    DeserializationError error = deserializeJson(doc, content);
    
    if (!error) {
      JsonArray array = doc.as<JsonArray>();
      JsonArray newArray = doc.createNestedArray("temp");
      
      for (JsonObject obj : array) {
        if (obj["active"].as<bool>()) {
          newArray.add(obj);
        }
      }
      
      // Replace old array with compacted one
      doc.remove("temp");
      doc.set(newArray);
      
      String output;
      serializeJson(doc, output);
      writeToFile(enrollmentFile, output, false);
    }
  }
  
  return true;
}

bool SDCardHandler::createSystemBackup() {
  if (!initialized) return false;
  
  String timestamp = String(millis());
  String backupDir = backupPath + "/backup_" + timestamp;
  
  if (!SD.mkdir(backupDir)) {
    writeLog("ERROR", "SDCardHandler", "Failed to create backup directory");
    return false;
  }
  
  // Backup attendance data
  createBackup(dataPath + "/attendance.json", backupDir + "/attendance.json");
  
  // Backup enrollment data
  createBackup(dataPath + "/enrollment.json", backupDir + "/enrollment.json");
  
  // Backup configuration
  createBackup(configPath + "/system.json", backupDir + "/system.json");
  
  writeLog("INFO", "SDCardHandler", "System backup created: " + backupDir);
  return true;
}

// Helper methods
bool SDCardHandler::writeToFile(String filename, String data, bool append) {
  File file = SD.open(filename, append ? FILE_APPEND : FILE_WRITE);
  if (!file) {
    return false;
  }
  
  size_t bytesWritten = file.print(data);
  file.close();
  
  return bytesWritten == data.length();
}

String SDCardHandler::readFromFile(String filename) {
  File file = SD.open(filename);
  if (!file) {
    return "";
  }
  
  String content = file.readString();
  file.close();
  
  return content;
}

bool SDCardHandler::fileExists(String filename) {
  return SD.exists(filename);
}

bool SDCardHandler::validateAttendanceRecord(const AttendanceRecord& record) {
  return !record.userId.isEmpty() && 
         !record.timestamp.isEmpty() && 
         (record.method == "fingerprint" || record.method == "rfid");
}

bool SDCardHandler::validateEnrollmentData(const EnrollmentData& data) {
  return !data.userId.isEmpty() && 
         !data.method.isEmpty() && 
         !data.data.isEmpty();
}

bool SDCardHandler::createBackup(String sourceFile, String backupFile) {
  if (!fileExists(sourceFile)) return false;
  
  String content = readFromFile(sourceFile);
  return writeToFile(backupFile, content, false);
}

bool SDCardHandler::isInitialized() {
  return initialized;
}

String SDCardHandler::getLastError() {
  // In a real implementation, you'd track the last error
  return "No error information available";
}
