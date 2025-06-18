#include "DataSyncManager.h"
#include "BuzzerHandler.h"
#include "DisplayHandler.h"

extern DisplayHandler* displayHandler;
extern BuzzerHandler* buzzerHandler;

DataSyncManager::DataSyncManager(SDCardHandler* sd, WiFiHandler* wifi, String serverUrl) 
  : sdHandler(sd), wifiHandler(wifi), serverURL(serverUrl), 
    currentStatus(SYNC_IDLE), lastSyncAttempt(0), syncInterval(30000), 
    maxRetries(3), currentRetries(0) {
  
  // Initialize statistics
  stats.totalRecords = 0;
  stats.syncedRecords = 0;
  stats.failedRecords = 0;
  stats.lastSyncTime = 0;
  stats.totalSyncTime = 0;
  stats.lastError = "";
}

bool DataSyncManager::init() {
  if (!sdHandler || !wifiHandler) {
    return false;
  }
  
  // Load sync configuration
  DynamicJsonDocument config(1024);
  if (sdHandler->loadConfiguration(config)) {
    if (config.containsKey("sync")) {
      syncInterval = config["sync"]["interval"].as<unsigned long>();
      maxRetries = config["sync"]["max_retries"].as<int>();
      serverURL = config["sync"]["server_url"].as<String>();
    }
  }
  
  sdHandler->writeLog("INFO", "DataSyncManager", "Data sync manager initialized");
  return true;
}

void DataSyncManager::update() {
  // Only sync if WiFi is connected and not currently syncing
  if (!wifiHandler->isConnected() || currentStatus == SYNC_IN_PROGRESS) {
    return;
  }
  
  // Check if it's time for automatic sync
  if (millis() - lastSyncAttempt > syncInterval) {
    performIncrementalSync();
    lastSyncAttempt = millis();
  }
}

bool DataSyncManager::performFullSync() {
  if (!wifiHandler->isConnected()) {
    handleSyncError("No internet connection");
    return false;
  }
  
  currentStatus = SYNC_IN_PROGRESS;
  onSyncStart();
  
  unsigned long syncStartTime = millis();
  bool success = true;
  
  sdHandler->writeLog("INFO", "DataSyncManager", "Starting full sync");
  
  // Sync attendance records
  if (!syncAttendanceRecords()) {
    success = false;
    sdHandler->writeLog("ERROR", "DataSyncManager", "Failed to sync attendance records");
  }
  
  // Sync enrollment data
  if (!syncEnrollmentData()) {
    success = false;
    sdHandler->writeLog("ERROR", "DataSyncManager", "Failed to sync enrollment data");
  }
  
  // Sync system logs
  if (!syncSystemLogs()) {
    success = false;
    sdHandler->writeLog("ERROR", "DataSyncManager", "Failed to sync system logs");
  }
  
  // Download configuration updates
  DynamicJsonDocument config(1024);
  if (downloadConfiguration(config)) {
    sdHandler->saveConfiguration(config);
  }
  
  // Download enrollment updates
  downloadEnrollmentUpdates();
  
  stats.totalSyncTime = millis() - syncStartTime;
  stats.lastSyncTime = millis();
  
  currentStatus = success ? SYNC_SUCCESS : SYNC_FAILED;
  onSyncComplete(success);
  
  if (success) {
    currentRetries = 0;
    sdHandler->writeLog("INFO", "DataSyncManager", "Full sync completed successfully");
  } else {
    currentRetries++;
    sdHandler->writeLog("ERROR", "DataSyncManager", "Full sync failed");
  }
  
  return success;
}

bool DataSyncManager::performIncrementalSync() {
  if (!wifiHandler->isConnected()) {
    return false;
  }
  
  // Only sync unsynced records
  std::vector<AttendanceRecord> unsyncedRecords;
  if (!sdHandler->getAttendanceRecords(unsyncedRecords, true)) {
    return false;
  }
  
  if (unsyncedRecords.empty()) {
    return true; // Nothing to sync
  }
  
  currentStatus = SYNC_IN_PROGRESS;
  onSyncStart();
  
  int syncedCount = 0;
  int totalCount = unsyncedRecords.size();
  
  for (const auto& record : unsyncedRecords) {
    if (sendAttendanceRecord(record)) {
      sdHandler->markRecordAsSynced(record.userId, record.timestamp);
      syncedCount++;
      onSyncProgress(syncedCount, totalCount);
    }
  }
  
  stats.syncedRecords += syncedCount;
  stats.failedRecords += (totalCount - syncedCount);
  stats.lastSyncTime = millis();
  
  bool success = (syncedCount == totalCount);
  currentStatus = success ? SYNC_SUCCESS : SYNC_PARTIAL;
  onSyncComplete(success);
  
  return success;
}

bool DataSyncManager::syncAttendanceRecords() {
  std::vector<AttendanceRecord> records;
  if (!sdHandler->getAttendanceRecords(records, true)) {
    return false;
  }
  
  int syncedCount = 0;
  for (const auto& record : records) {
    if (sendAttendanceRecord(record)) {
      sdHandler->markRecordAsSynced(record.userId, record.timestamp);
      syncedCount++;
      onSyncProgress(syncedCount, records.size());
    }
  }
  
  stats.syncedRecords += syncedCount;
  stats.failedRecords += (records.size() - syncedCount);
  
  return syncedCount == records.size();
}

bool DataSyncManager::sendAttendanceRecord(const AttendanceRecord& record) {
  DynamicJsonDocument doc(512);
  doc["userId"] = record.userId;
  doc["timestamp"] = record.timestamp;
  doc["method"] = record.method;
  doc["deviceId"] = record.deviceId;
  doc["confidence"] = record.confidence;
  
  String payload;
  serializeJson(doc, payload);
  
  String response;
  String url = serverURL + "/attendance";
  
  return wifiHandler->sendHTTPRequest(url, payload, response);
}

bool DataSyncManager::downloadConfiguration(DynamicJsonDocument& config) {
  String response;
  String url = serverURL + "/config/" + wifiHandler->getMACAddress();
  
  if (wifiHandler->sendHTTPRequest(url, "", response)) {
    DeserializationError error = deserializeJson(config, response);
    return !error;
  }
  
  return false;
}

bool DataSyncManager::downloadEnrollmentUpdates() {
  String response;
  String url = serverURL + "/enrollment/updates/" + wifiHandler->getMACAddress();
  
  if (wifiHandler->sendHTTPRequest(url, "", response)) {
    DynamicJsonDocument doc(2048);
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error && doc.containsKey("enrollments")) {
      JsonArray enrollments = doc["enrollments"];
      
      for (JsonObject enrollment : enrollments) {
        EnrollmentData data;
        data.userId = enrollment["userId"].as<String>();
        data.method = enrollment["method"].as<String>();
        data.data = enrollment["data"].as<String>();
        data.timestamp = enrollment["timestamp"].as<String>();
        data.active = enrollment["active"].as<bool>();
        
        sdHandler->storeEnrollmentData(data);
      }
      
      return true;
    }
  }
  
  return false;
}

void DataSyncManager::onSyncStart() {
  if (displayHandler) {
    displayHandler->showMessage("Syncing Data", "Please wait...");
  }
  
  sdHandler->writeLog("INFO", "DataSyncManager", "Sync started");
}

void DataSyncManager::onSyncComplete(bool success) {
  if (displayHandler) {
    if (success) {
      displayHandler->showMessage("Sync Complete", "Data synchronized");
    } else {
      displayHandler->showMessage("Sync Failed", "Check connection");
    }
  }
  
  if (buzzerHandler) {
    if (success) {
      buzzerHandler->playSuccess();
    } else {
      buzzerHandler->playError();
    }
  }
  
  String message = success ? "Sync completed successfully" : "Sync failed";
  sdHandler->writeLog("INFO", "DataSyncManager", message);
}

void DataSyncManager::onSyncProgress(int current, int total) {
  if (displayHandler) {
    String message = "Syncing " + String(current) + "/" + String(total);
    displayHandler->showMessage("Sync Progress", message);
  }
}

SyncStatistics DataSyncManager::getSyncStatistics() {
  return stats;
}

String DataSyncManager::getSyncStatusString() {
  switch (currentStatus) {
    case SYNC_IDLE: return "Idle";
    case SYNC_IN_PROGRESS: return "In Progress";
    case SYNC_SUCCESS: return "Success";
    case SYNC_FAILED: return "Failed";
    case SYNC_PARTIAL: return "Partial";
    default: return "Unknown";
  }
}

void DataSyncManager::setSyncInterval(unsigned long interval) {
  syncInterval = interval;
}

void DataSyncManager::setMaxRetries(int retries) {
  maxRetries = retries;
}

void DataSyncManager::setServerURL(String url) {
  serverURL = url;
}

bool DataSyncManager::isSyncInProgress() {
  return currentStatus == SYNC_IN_PROGRESS;
}

void DataSyncManager::handleSyncError(String error) {
  stats.lastError = error;
  currentStatus = SYNC_FAILED;
  sdHandler->writeLog("ERROR", "DataSyncManager", "Sync error: " + error);
}
