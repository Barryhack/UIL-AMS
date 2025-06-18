#ifndef WEB_SERVER_HANDLER_H
#define WEB_SERVER_HANDLER_H

#include <WebServer.h>
#include <ArduinoJson.h>
#include "SystemConfig.h"

// Forward declarations
class AttendanceManager;
class FingerprintHandler;
class RFIDHandler;

class WebServerHandler {
private:
  WebServer* server;
  AttendanceManager* attendanceManager;
  FingerprintHandler* fingerprintHandler;
  RFIDHandler* rfidHandler;
  int port;
  bool initialized;
  
  // Route handlers
  void handleRoot();
  void handleScanFingerprint();
  void handleScanRFID();
  void handleStopScan();
  void handleStatus();
  void handleEnroll();
  void handleAttendanceHistory();
  void handleNotFound();
  
  // Utility methods
  void sendJsonResponse(int code, const String& message);
  void sendJsonResponse(int code, const DynamicJsonDocument& doc);
  void enableCORS();
  
public:
  WebServerHandler(AttendanceManager* attendance, FingerprintHandler* fingerprint, RFIDHandler* rfid, int serverPort = 80);
  ~WebServerHandler();
  bool init();
  void handleClient();
  bool isInitialized();
  String getServerURL();
};

#endif
