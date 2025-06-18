#include "AttendanceManager.h"

extern class DisplayHandler* displayHandler;
extern class BuzzerHandler* buzzerHandler;

AttendanceManager::AttendanceManager(SDCardHandler* sd, WiFiHandler* wifi) 
  : sdHandler(sd), wifiHandler(wifi), syncManager(nullptr) {}

AttendanceManager::~AttendanceManager() {
  if (syncManager) {
    delete syncManager;
  }
}

bool AttendanceManager::init() {
  if (!sdHandler || !wifiHandler) {
    return false;
  }
  
  // Initialize sync manager
  syncManager = new DataSyncManager(sdHandler, wifiHandler, SERVER_URL);
  if (!syncManager->init()) {
    sdHandler->writeLog("ERROR", "AttendanceManager", "Failed to initialize sync manager");
    return false;
  }
  
  sdHandler->writeLog("INFO", "AttendanceManager", "Attendance manager initialized");
  return true;
}

void AttendanceManager::update() {
  if (syncManager) {
    syncManager->update();
  }
}

bool AttendanceManager::recordAttendance(String userId, String method, int confidence) {
  if (!sdHandler) return false;
  
  AttendanceRecord record;
  record.userId = userId;
  record.timestamp = generateTimestamp();
  record.method = method;
  record.synced = false;
  record.deviceId = getDeviceId();
  record.confidence = confidence;
  
  bool stored = sdHandler->storeAttendanceRecord(record);
  
  if (stored) {
    // Try immediate sync if online
    if (wifiHandler->isConnected() && syncManager) {
      syncManager->syncSpecificRecord(userId, record.timestamp);
    }
    
    sdHandler->writeLog("INFO", "AttendanceManager", 
                       "Attendance recorded: " + userId + " (" + method + ")");
  }
  
  return stored;
}

bool AttendanceManager::enrollUser(String userId, String method, String data) {
  if (!sdHandler) return false;
  
  EnrollmentData enrollment;
  enrollment.userId = userId;
  enrollment.method = method;
  enrollment.data = data;
  enrollment.timestamp = generateTimestamp();
  enrollment.active = true;
  
  bool stored = sdHandler->storeEnrollmentData(enrollment);
  
  if (stored) {
    sdHandler->writeLog("INFO", "AttendanceManager", 
                       "User enrolled: " + userId + " (" + method + ")");
  }
  
  return stored;
}

bool AttendanceManager::isUserEnrolled(String userId, String method) {
  if (!sdHandler) return false;
  
  std::vector<EnrollmentData> enrollments;
  if (sdHandler->getEnrollmentData(enrollments, method)) {
    for (const auto& enrollment : enrollments) {
      if (enrollment.userId == userId && enrollment.active) {
        return true;
      }
    }
  }
  
  return false;
}

int AttendanceManager::getUnsyncedRecordCount() {
  if (!sdHandler) return -1;
  return sdHandler->getUnsyncedRecordCount();
}

bool AttendanceManager::performSync() {
  if (!syncManager) return false;
  return syncManager->performFullSync();
}

bool AttendanceManager::isSyncInProgress() {
  if (!syncManager) return false;
  return syncManager->isSyncInProgress();
}

SyncStatistics AttendanceManager::getSyncStats() {
  if (!syncManager) {
    SyncStatistics empty = {};
    return empty;
  }
  return syncManager->getSyncStatistics();
}

String AttendanceManager::generateTimestamp() {
  // In production, use NTP time
  return String(millis());
}

String AttendanceManager::getDeviceId() {
  if (wifiHandler) {
    return wifiHandler->getMACAddress();
  }
  return "UNKNOWN";
}
