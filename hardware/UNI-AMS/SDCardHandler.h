#ifndef SDCARD_HANDLER_H
#define SDCARD_HANDLER_H

#include <SD.h>
#include <SPI.h>
#include <ArduinoJson.h>
#include "SystemConfig.h"

struct AttendanceRecord {
  String userId;
  String timestamp;
  String method;
  bool synced;
  String deviceId;
  int confidence; // For fingerprint confidence score
};

struct EnrollmentData {
  String userId;
  String method;
  String data;
  String timestamp;
  bool active;
};

struct SystemLog {
  String timestamp;
  String level; // INFO, WARN, ERROR, DEBUG
  String component;
  String message;
};

class SDCardHandler {
private:
  int csPin, mosiPin, misoPin, sckPin;
  bool initialized;
  String dataPath;
  String logPath;
  String configPath;
  String backupPath;
  
  // File management
  bool createDirectoryStructure();
  bool writeToFile(String filename, String data, bool append = true);
  String readFromFile(String filename);
  bool fileExists(String filename);
  bool deleteFile(String filename);
  
  // Data validation
  bool validateAttendanceRecord(const AttendanceRecord& record);
  bool validateEnrollmentData(const EnrollmentData& data);
  
  // Backup management
  bool createBackup(String sourceFile, String backupFile);
  bool restoreFromBackup(String backupFile, String targetFile);
  
public:
  SDCardHandler(int cs, int mosi, int miso, int sck);
  bool init();
  void update();
  
  // Attendance management
  bool storeAttendanceRecord(const AttendanceRecord& record);
  bool getAttendanceRecords(std::vector<AttendanceRecord>& records, bool unsyncedOnly = false);
  bool markRecordAsSynced(String userId, String timestamp);
  bool deleteAttendanceRecord(String userId, String timestamp);
  int getUnsyncedRecordCount();
  
  // Enrollment management
  bool storeEnrollmentData(const EnrollmentData& data);
  bool getEnrollmentData(std::vector<EnrollmentData>& data, String method = "");
  bool updateEnrollmentData(String userId, const EnrollmentData& newData);
  bool deleteEnrollmentData(String userId, String method);
  
  // System logging
  bool writeLog(String level, String component, String message);
  bool getLogs(std::vector<SystemLog>& logs, String level = "", int maxRecords = 100);
  bool clearLogs(String level = "");
  
  // Configuration management
  bool saveConfiguration(const DynamicJsonDocument& config);
  bool loadConfiguration(DynamicJsonDocument& config);
  
  // Data export/import
  bool exportData(String filename, String dataType);
  bool importData(String filename, String dataType);
  
  // Storage statistics
  unsigned long getTotalSpace();
  unsigned long getUsedSpace();
  unsigned long getFreeSpace();
  int getFileCount(String directory);
  
  // Maintenance
  bool performMaintenance();
  bool compactDatabase();
  bool createSystemBackup();
  bool restoreSystemBackup();
  
  // Status
  bool isInitialized();
  String getLastError();
};

#endif
