#ifndef ATTENDANCE_MANAGER_H
#define ATTENDANCE_MANAGER_H

#include "SDCardHandler.h"
#include "DataSyncManager.h"
#include "WiFiHandler.h"

class AttendanceManager {
private:
  SDCardHandler* sdHandler;
  DataSyncManager* syncManager;
  WiFiHandler* wifiHandler;
  
  String generateTimestamp();
  String getDeviceId();
  
public:
  AttendanceManager(SDCardHandler* sd, WiFiHandler* wifi);
  ~AttendanceManager();
  bool init();
  void update();
  
  // Attendance operations
  bool recordAttendance(String userId, String method, int confidence = 0);
  bool getAttendanceHistory(std::vector<AttendanceRecord>& records, String userId = "");
  bool deleteAttendanceRecord(String userId, String timestamp);
  
  // Enrollment operations
  bool enrollUser(String userId, String method, String data);
  bool updateUserEnrollment(String userId, String method, String newData);
  bool deleteUserEnrollment(String userId, String method = "");
  bool isUserEnrolled(String userId, String method);
  
  // Statistics
  int getTotalAttendanceRecords();
  int getUnsyncedRecordCount();
  int getEnrolledUserCount();
  
  // Sync operations
  bool performSync();
  bool isSyncInProgress();
  SyncStatistics getSyncStats();
};

#endif
