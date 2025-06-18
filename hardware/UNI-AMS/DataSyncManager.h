#ifndef DATA_SYNC_MANAGER_H
#define DATA_SYNC_MANAGER_H

#include <ArduinoJson.h>
#include <HTTPClient.h>
#include "SDCardHandler.h"
#include "WiFiHandler.h"

enum SyncStatus {
  SYNC_IDLE,
  SYNC_IN_PROGRESS,
  SYNC_SUCCESS,
  SYNC_FAILED,
  SYNC_PARTIAL
};

struct SyncStatistics {
  int totalRecords;
  int syncedRecords;
  int failedRecords;
  unsigned long lastSyncTime;
  unsigned long totalSyncTime;
  String lastError;
};

class DataSyncManager {
private:
  SDCardHandler* sdHandler;
  WiFiHandler* wifiHandler;
  String serverURL;
  SyncStatus currentStatus;
  SyncStatistics stats;
  unsigned long lastSyncAttempt;
  unsigned long syncInterval;
  int maxRetries;
  int currentRetries;
  
  // Sync methods
  bool syncAttendanceRecords();
  bool syncEnrollmentData();
  bool syncSystemLogs();
  bool syncConfiguration();
  
  // HTTP communication
  bool sendAttendanceRecord(const AttendanceRecord& record);
  bool sendEnrollmentData(const EnrollmentData& data);
  bool sendSystemLog(const SystemLog& log);
  bool downloadConfiguration(DynamicJsonDocument& config);
  bool downloadEnrollmentUpdates();
  
  // Conflict resolution
  bool resolveConflicts();
  bool handleSyncConflict(String recordId, String localData, String serverData);
  
  // Error handling
  void handleSyncError(String error);
  bool shouldRetrySync();
  
public:
  DataSyncManager(SDCardHandler* sd, WiFiHandler* wifi, String serverUrl);
  bool init();
  void update();
  
  // Manual sync operations
  bool performFullSync();
  bool performIncrementalSync();
  bool syncSpecificRecord(String userId, String timestamp);
  
  // Sync control
  void setSyncInterval(unsigned long interval);
  void enableAutoSync(bool enable);
  bool isSyncInProgress();
  
  // Statistics and monitoring
  SyncStatistics getSyncStatistics();
  void resetSyncStatistics();
  String getSyncStatusString();
  
  // Configuration
  void setMaxRetries(int retries);
  void setServerURL(String url);
  
  // Callbacks for status updates
  void onSyncStart();
  void onSyncComplete(bool success);
  void onSyncProgress(int current, int total);
};

#endif
