#include "WebServerHandler.h"
#include "AttendanceManager.h"
#include "FingerprintHandler.h"
#include "RFIDHandler.h"

// External references to global functions
extern void startFingerprintScan();
extern void startRFIDScan();
extern void stopScanning();
extern SystemState getSystemState();

WebServerHandler::WebServerHandler(AttendanceManager* attendance, FingerprintHandler* fingerprint, RFIDHandler* rfid, int serverPort) 
  : attendanceManager(attendance), fingerprintHandler(fingerprint), rfidHandler(rfid), port(serverPort), initialized(false) {
  server = new WebServer(port);
}

WebServerHandler::~WebServerHandler() {
  if (server) {
    delete server;
  }
}

bool WebServerHandler::init() {
  if (!server) return false;
  
  // Setup routes
  server->on("/", HTTP_GET, [this]() { handleRoot(); });
  server->on("/scan-fingerprint", HTTP_POST, [this]() { handleScanFingerprint(); });
  server->on("/scan-rfid", HTTP_POST, [this]() { handleScanRFID(); });
  server->on("/stop-scan", HTTP_POST, [this]() { handleStopScan(); });
  server->on("/status", HTTP_GET, [this]() { handleStatus(); });
  server->on("/enroll", HTTP_POST, [this]() { handleEnroll(); });
  server->on("/attendance", HTTP_GET, [this]() { handleAttendanceHistory(); });
  server->onNotFound([this]() { handleNotFound(); });
  
  server->begin();
  initialized = true;
  
  Serial.println("Web server started on port " + String(port));
  return true;
}

void WebServerHandler::handleClient() {
  if (server && initialized) {
    server->handleClient();
  }
}

void WebServerHandler::handleRoot() {
  String html = R"(
    <!DOCTYPE html>
    <html>
    <head>
      <title>UNI-AMS Control Panel</title>
      <style>
        body { font-family: Arial; text-align: center; margin: 20px; }
        .button { 
          background-color: #4CAF50;
          border: none;
          color: white;
          padding: 15px 32px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 16px;
          margin: 4px 2px;
          cursor: pointer;
          border-radius: 4px;
        }
        .status {
          margin: 20px;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <h1>UNI-AMS Control Panel</h1>
      <div>
        <button class="button" onclick="scanFingerprint()">Scan Fingerprint</button>
        <button class="button" onclick="scanRFID()">Scan RFID</button>
        <button class="button" onclick="stopScan()">Stop Scan</button>
      </div>
      <div class="status" id="status">
        System Status: Ready
      </div>
      <script>
        function scanFingerprint() {
          fetch('/scan/fingerprint')
            .then(response => response.text())
            .then(data => {
              document.getElementById('status').innerHTML = 'Scanning Fingerprint...';
            });
        }
        
        function scanRFID() {
          fetch('/scan/rfid')
            .then(response => response.text())
            .then(data => {
              document.getElementById('status').innerHTML = 'Scanning RFID...';
            });
        }
        
        function stopScan() {
          fetch('/scan/stop')
            .then(response => response.text())
            .then(data => {
              document.getElementById('status').innerHTML = 'Scan Stopped';
            });
        }
        
        function getStatus() {
          fetch('/status')
            .then(response => response.json())
            .then(data => {
              document.getElementById('status').innerHTML = 'System Status: ' + data.status;
            });
        }
        
        setInterval(getStatus, 5000);
      </script>
    </body>
    </html>
  )";
  
  server->send(200, "text/html", html);
}

void WebServerHandler::handleScanFingerprint() {
  enableCORS();
  
  startFingerprintScan();
  
  DynamicJsonDocument doc(256);
  doc["status"] = "scanning";
  doc["method"] = "fingerprint";
  doc["message"] = "Fingerprint scan started";
  
  sendJsonResponse(200, doc);
}

void WebServerHandler::handleScanRFID() {
  enableCORS();
  
  startRFIDScan();
  
  DynamicJsonDocument doc(256);
  doc["status"] = "scanning";
  doc["method"] = "rfid";
  doc["message"] = "RFID scan started";
  
  sendJsonResponse(200, doc);
}

void WebServerHandler::handleStopScan() {
  enableCORS();
  
  stopScanning();
  
  DynamicJsonDocument doc(256);
  doc["status"] = "stopped";
  doc["message"] = "Scan stopped";
  
  sendJsonResponse(200, doc);
}

void WebServerHandler::handleStatus() {
  enableCORS();
  
  DynamicJsonDocument doc(512);
  doc["online"] = WiFi.status() == WL_CONNECTED;
  doc["scanning"] = (getSystemState() == SYSTEM_SCANNING_FINGERPRINT || getSystemState() == SYSTEM_SCANNING_RFID);
  doc["status"] = "ready"; // Simplified status
  doc["wifi_strength"] = WiFi.RSSI();
  doc["free_heap"] = ESP.getFreeHeap();
  doc["uptime"] = millis();
  
  if (attendanceManager) {
    doc["unsynced_records"] = attendanceManager->getUnsyncedRecordCount();
  }
  
  sendJsonResponse(200, doc);
}

void WebServerHandler::handleEnroll() {
  enableCORS();
  
  if (!server->hasArg("plain")) {
    sendJsonResponse(400, "No data provided");
    return;
  }
  
  DynamicJsonDocument doc(512);
  DeserializationError error = deserializeJson(doc, server->arg("plain"));
  
  if (error) {
    sendJsonResponse(400, "Invalid JSON data");
    return;
  }
  
  String userId = doc["userId"].as<String>();
  String method = doc["method"].as<String>();
  String data = doc["data"].as<String>();
  
  if (userId.isEmpty() || method.isEmpty() || data.isEmpty()) {
    sendJsonResponse(400, "Missing required fields");
    return;
  }
  
  if (attendanceManager && attendanceManager->enrollUser(userId, method, data)) {
    DynamicJsonDocument response(256);
    response["status"] = "success";
    response["message"] = "User enrolled successfully";
    sendJsonResponse(200, response);
  } else {
    sendJsonResponse(500, "Failed to enroll user");
  }
}

void WebServerHandler::handleAttendanceHistory() {
  enableCORS();
  
  DynamicJsonDocument doc(2048);
  doc["attendance"] = JsonArray();
  
  if (attendanceManager) {
    std::vector<AttendanceRecord> records;
    if (attendanceManager->getAttendanceHistory(records)) {
      JsonArray attendance = doc["attendance"];
      
      for (const auto& record : records) {
        JsonObject entry = attendance.createNestedObject();
        entry["userId"] = record.userId;
        entry["timestamp"] = record.timestamp;
        entry["method"] = record.method;
        entry["synced"] = record.synced;
        entry["deviceId"] = record.deviceId;
      }
    }
  }
  
  sendJsonResponse(200, doc);
}

void WebServerHandler::handleNotFound() {
  enableCORS();
  sendJsonResponse(404, "Endpoint not found");
}

void WebServerHandler::sendJsonResponse(int code, const String& message) {
  DynamicJsonDocument doc(256);
  doc["message"] = message;
  sendJsonResponse(code, doc);
}

void WebServerHandler::sendJsonResponse(int code, const DynamicJsonDocument& doc) {
  String response;
  serializeJson(doc, response);
  server->send(code, "application/json", response);
}

void WebServerHandler::enableCORS() {
  server->sendHeader("Access-Control-Allow-Origin", "*");
  server->sendHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  server->sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

bool WebServerHandler::isInitialized() {
  return initialized;
}

String WebServerHandler::getServerURL() {
  if (WiFi.status() == WL_CONNECTED) {
    return "http://" + WiFi.localIP().toString() + ":" + String(port);
  }
  return "";
}
