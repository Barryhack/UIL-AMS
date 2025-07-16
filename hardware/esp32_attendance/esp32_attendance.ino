#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <MFRC522.h>
#include <Adafruit_Fingerprint.h>
#include <Adafruit_SSD1306.h>
#include <SD.h>
#include <SPI.h>
#include <Wire.h>
#include <ArduinoWebsockets.h>
using namespace websockets;

// Network credentials
const char* ssid = "Galaxy S20 FE 35AF";
const char* password = "ollk2898";

// API configuration
const char* apiEndpoint = "https://uil-ams.onrender.com";
const char* apiKey = "509cc08fdb241fbf694e5888db0b82b0";
const char* deviceId = "";
const char* macAddress = "";

// Pin definitions
#define FINGERPRINT_RX 16
#define FINGERPRINT_TX 17
#define RFID_SS_PIN 5
#define RFID_RST_PIN 4
#define RFID_MOSI_PIN 23
#define RFID_MISO_PIN 19
#define RFID_SCK_PIN 18
#define SD_CS_PIN 33
#define SD_MOSI_PIN 27
#define SD_MISO_PIN 26
#define SD_SCK_PIN 25
#define BUZZER_PIN 32
#define LED_RED 14
#define LED_YELLOW 15
#define LED_GREEN 13

// Display configuration
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&Serial2);

// Operational modes
enum DeviceMode {
  BOOT_UP,
  CONNECTING,
  ONLINE_MODE,
  OFFLINE_MODE,
  ENROLL_MODE,
  SCAN_MODE,
  SESSION_MODE
};

DeviceMode currentMode = BOOT_UP;
bool isOnline = false;
bool wsConnected = false;
unsigned long lastSync = 0;
const unsigned long syncInterval = 300000; // 5 minutes

WebsocketsClient wsClient;
String deviceIdStr = "";
String macAddressStr = "";
const char* wsServer = "wss://websocket-usjg.onrender.com/api/ws";
const char* wsApiKey = "local-development-key";

// Session management
bool sessionActive = false;
String currentSessionId = "";
unsigned long sessionStartTime = 0;
unsigned long sessionEndTime = 0;

// Scan modes
bool scanFingerprintMode = false;
bool scanRFIDMode = false;
bool enrollFingerprintMode = false;
int enrollFingerprintId = 0;

unsigned long lastStatusUpdate = 0;
const unsigned long statusUpdateInterval = 5000; // 5 seconds

// Function prototypes
void beep(int duration);
void beepSuccess();
void beepError();
void beepWarning();
void setLEDStatus();
void initializeComponents();
void connectToWiFi();
void setupWebSocket();
void handleWebSocketMessage(const String& msg);
void handleEnrollment();
void handleFingerprintScan();
void handleRFIDScan();
void handleAttendanceRecording(String id, String method);
void saveToSD(String data);
void syncWithServer();
uint8_t getFingerprintEnroll();
int getFingerprintID();
String getRFIDTag();
void enterOnlineMode();
void enterOfflineMode();
void enterSessionMode(String sessionId);
void exitSessionMode();
void handleOnlineMode();
void handleOfflineMode();
void handleSessionMode();
void displayBootUp();
void displayStatus();
void displayMessage(String message, bool clear = true);

void setup() {
  Serial.begin(115200);
  delay(1000);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(LED_GREEN, LOW);
  displayBootUp();
  beepSuccess();
  initializeComponents();
  connectToWiFi();
  if (isOnline) setupWebSocket();
  if (isOnline && wsConnected) enterOnlineMode();
  else enterOfflineMode();
}

void loop() {
  unsigned long currentTime = millis();
  if (wsConnected) wsClient.poll();
  
  // Check if session has expired
  if (sessionActive && sessionEndTime > 0 && currentTime >= sessionEndTime) {
    Serial.println("[Session] Session expired, ending automatically");
    exitSessionMode();
  }
  
  if (currentTime - lastStatusUpdate >= statusUpdateInterval) {
    displayStatus();
    lastStatusUpdate = currentTime;
  }
  switch (currentMode) {
    case ONLINE_MODE: handleOnlineMode(); break;
    case OFFLINE_MODE: handleOfflineMode(); break;
    case ENROLL_MODE: handleEnrollment(); break;
    case SCAN_MODE:
      if (scanFingerprintMode) handleFingerprintScan();
      else if (scanRFIDMode) handleRFIDScan();
      break;
    case SESSION_MODE: handleSessionMode(); break;
    default: break;
  }
  if (isOnline && currentTime - lastSync >= syncInterval) syncWithServer();
  delay(100);
}

void displayBootUp() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("UNILORIN AMS");
  display.println("Hardware Controller");
  display.println("Initializing...");
  display.display();
  delay(1000);
  display.setCursor(0, 24);
  display.println("Checking components:");
  display.display();
  delay(500);
}

void displayStatus() {
  if (currentMode == ENROLL_MODE || currentMode == SCAN_MODE) return;
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("UNILORIN AMS");
  display.println("Status: " + String(currentMode == ONLINE_MODE ? "ONLINE" : "OFFLINE"));
  if (sessionActive) {
    display.println("Session: " + currentSessionId);
    unsigned long sessionDuration = (millis() - sessionStartTime) / 1000;
    display.printf("Duration: %02lu:%02lu", sessionDuration / 60, sessionDuration % 60);
  } else {
    display.println("Ready for attendance");
  }
  display.println("WiFi: " + String(isOnline ? "Connected" : "Disconnected"));
  display.println("WS: " + String(wsConnected ? "Connected" : "Disconnected"));
  display.display();
}

void displayMessage(String message, bool clear) {
  if (clear) display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(message);
  display.display();
}

void beep(int duration) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(duration);
  digitalWrite(BUZZER_PIN, LOW);
}
void beepSuccess() { beep(100); delay(50); beep(100); }
void beepError() { for (int i = 0; i < 3; i++) { beep(70); delay(70); } }
void beepWarning() { beep(200); delay(100); beep(200); }

void setLEDStatus() {
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(LED_GREEN, LOW);
  switch (currentMode) {
    case ONLINE_MODE: digitalWrite(LED_GREEN, HIGH); break;
    case OFFLINE_MODE: digitalWrite(LED_YELLOW, HIGH); break;
    case ENROLL_MODE:
    case SCAN_MODE:
    case SESSION_MODE: digitalWrite(LED_GREEN, HIGH); break;
    default: digitalWrite(LED_YELLOW, HIGH); break;
  }
}

void initializeComponents() {
  Wire.begin(21, 22);
  delay(500);
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println("SSD1306 allocation failed");
    while (1);
  }
  displayMessage("OLED: OK"); delay(500);
  Serial2.begin(57600, SERIAL_8N1, 16, 17);
  delay(1000);
  bool sensorFound = finger.verifyPassword();
  if (sensorFound) displayMessage("Fingerprint: OK");
  else { displayMessage("Fingerprint: ERROR"); beepError(); }
  delay(500);
  SPI.begin(SD_SCK_PIN, SD_MISO_PIN, SD_MOSI_PIN, SD_CS_PIN);
  if (SD.begin(SD_CS_PIN)) displayMessage("SD Card: OK");
  else { displayMessage("SD Card: ERROR"); beepError(); }
  delay(500);
  SPI.begin(RFID_SCK_PIN, RFID_MISO_PIN, RFID_MOSI_PIN, RFID_SS_PIN);
  rfid.PCD_Init();
  displayMessage("RFID: OK"); delay(500);
}

void connectToWiFi() {
  displayMessage("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) { delay(500); Serial.print("."); attempts++; }
  if (WiFi.status() == WL_CONNECTED) {
    isOnline = true;
    deviceIdStr = WiFi.macAddress();
    macAddressStr = WiFi.macAddress();
    displayMessage("WiFi: Connected"); beepSuccess();
  } else {
    isOnline = false;
    displayMessage("WiFi: Failed"); beepWarning();
  }
}

void setupWebSocket() {
  if (!isOnline) return;
  wsClient.addHeader("x-device-id", deviceIdStr);
  wsClient.addHeader("x-mac-address", macAddressStr);
  wsClient.addHeader("x-api-key", wsApiKey);
  wsClient.onEvent([](WebsocketsEvent event, String data) {
    if (event == WebsocketsEvent::ConnectionOpened) {
      wsConnected = true;
      Serial.println("[WebSocket] Connected!");
      beepSuccess();
      StaticJsonDocument<128> doc;
      doc["type"] = "hello";
      doc["deviceId"] = deviceIdStr;
      String msg;
      serializeJson(doc, msg);
      wsClient.send(msg);
    } else if (event == WebsocketsEvent::ConnectionClosed) {
      wsConnected = false;
      Serial.println("[WebSocket] Disconnected!");
      beepWarning();
    }
  });
  wsClient.onMessage([](WebsocketsMessage message) { handleWebSocketMessage(message.data()); });
  Serial.print("[WebSocket] Connecting to: "); Serial.println(wsServer);
  wsClient.connect(wsServer);
}

void handleWebSocketMessage(const String& msg) {
  Serial.print("[WebSocket] Received: "); Serial.println(msg);
  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, msg);
  if (err) { Serial.println("JSON parsing failed"); return; }
  if (!doc.containsKey("command")) return;
  String cmd = doc["command"].as<String>();
  if (cmd == "start_session") {
    String sessionId = doc["sessionId"] | "";
    unsigned long duration = doc["duration"] | 7200000; // Default 2 hours if not provided
    enterSessionMode(sessionId, duration);
  } else if (cmd == "stop_session") {
    exitSessionMode();
  } else if (cmd == "fingerprint" && doc.containsKey("action")) {
    String action = doc["action"].as<String>();
    if (action == "enroll") {
      enrollFingerprintId = doc["id"] | 0;
      currentMode = ENROLL_MODE;
      enrollFingerprintMode = true;
      displayMessage("Enroll Fingerprint");
      beepSuccess();
    } else if (action == "scan") {
      currentMode = SCAN_MODE;
      scanFingerprintMode = true;
      displayMessage("Scan Fingerprint");
      beepSuccess();
    }
  } else if (cmd == "rfid" && doc.containsKey("action")) {
    String action = doc["action"].as<String>();
    if (action == "scan") {
      currentMode = SCAN_MODE;
      scanRFIDMode = true;
      displayMessage("Scan RFID Card");
      beepSuccess();
    }
  } else if (cmd == "sync") {
    syncWithServer();
  }
}

void enterOnlineMode() {
  currentMode = ONLINE_MODE;
  displayMessage("Online Mode");
  setLEDStatus();
  beepSuccess();
}
void enterOfflineMode() {
  currentMode = OFFLINE_MODE;
  displayMessage("Offline Mode");
  setLEDStatus();
  beepWarning();
}
void enterSessionMode(String sessionId, unsigned long duration = 7200000) {
  currentMode = SESSION_MODE;
  sessionActive = true;
  currentSessionId = sessionId;
  sessionStartTime = millis();
  sessionEndTime = sessionStartTime + duration;
  displayMessage("Session Started\nID: " + sessionId + "\nDuration: " + String(duration/60000) + "min\nRecording attendance...");
  setLEDStatus();
  beepSuccess();
}
void exitSessionMode() {
  sessionActive = false;
  currentSessionId = "";
  sessionStartTime = 0;
  sessionEndTime = 0;
  if (isOnline && wsConnected) currentMode = ONLINE_MODE;
  else currentMode = OFFLINE_MODE;
  displayMessage("Session Ended");
  setLEDStatus();
  beepSuccess();
}
void handleOnlineMode() {}
void handleOfflineMode() {
  int fingerprintId = getFingerprintID();
  if (fingerprintId >= 0) handleAttendanceRecording(String(fingerprintId), "fingerprint");
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String rfidTag = getRFIDTag();
    handleAttendanceRecording(rfidTag, "rfid");
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
  }
}
void handleSessionMode() {
  int fingerprintId = getFingerprintID();
  if (fingerprintId >= 0) handleAttendanceRecording(String(fingerprintId), "fingerprint");
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String rfidTag = getRFIDTag();
    handleAttendanceRecording(rfidTag, "rfid");
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
  }
}
void handleEnrollment() {
  if (!enrollFingerprintMode) return;
  uint8_t result = getFingerprintEnroll();
  if (result == FINGERPRINT_OK) {
    beepSuccess();
    StaticJsonDocument<128> doc;
    doc["type"] = "fingerprint_result";
    doc["success"] = true;
    doc["fingerprintId"] = enrollFingerprintId;
    doc["timestamp"] = millis();
    doc["deviceId"] = deviceIdStr;
    String msg;
    serializeJson(doc, msg);
    wsClient.send(msg);
    displayMessage("Enrollment Success!");
    Serial.printf("[FP] Fingerprint enrolled successfully with ID: %d\n", enrollFingerprintId);
  } else {
    beepError();
    StaticJsonDocument<128> doc;
    doc["type"] = "fingerprint_result";
    doc["success"] = false;
    doc["error"] = "Enrollment failed";
    doc["timestamp"] = millis();
    doc["deviceId"] = deviceIdStr;
    String msg;
    serializeJson(doc, msg);
    wsClient.send(msg);
    displayMessage("Enrollment Failed!");
    Serial.println("[FP] Fingerprint enrollment failed");
  }
  enrollFingerprintMode = false;
  currentMode = isOnline && wsConnected ? ONLINE_MODE : OFFLINE_MODE;
  setLEDStatus();
}
void handleFingerprintScan() {
  if (!scanFingerprintMode) return;
  int id = getFingerprintID();
  if (id >= 0) {
    beepSuccess();
    StaticJsonDocument<128> doc;
    doc["type"] = "fingerprint_result";
    doc["success"] = true;
    doc["fingerprintId"] = id;
    doc["timestamp"] = millis();
    doc["deviceId"] = deviceIdStr;
    String msg;
    serializeJson(doc, msg);
    wsClient.send(msg);
    displayMessage("Fingerprint Sent!");
    scanFingerprintMode = false;
    currentMode = isOnline && wsConnected ? ONLINE_MODE : OFFLINE_MODE;
    setLEDStatus();
  } else {
    beepError();
    displayMessage("Fingerprint Not Recognized!");
    delay(1000);
    scanFingerprintMode = false;
    currentMode = isOnline && wsConnected ? ONLINE_MODE : OFFLINE_MODE;
    setLEDStatus();
  }
}
void handleRFIDScan() {
  if (!scanRFIDMode) return;
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    beepSuccess();
    String tag = getRFIDTag();
    StaticJsonDocument<128> doc;
    doc["type"] = "rfid_result";
    doc["success"] = true;
    doc["cardId"] = tag;
    doc["timestamp"] = millis();
    doc["deviceId"] = deviceIdStr;
    String msg;
    serializeJson(doc, msg);
    wsClient.send(msg);
    displayMessage("RFID Sent!");
    scanRFIDMode = false;
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    currentMode = isOnline && wsConnected ? ONLINE_MODE : OFFLINE_MODE;
    setLEDStatus();
  } else {
    beepError();
    displayMessage("RFID Not Recognized!");
    delay(1000);
    scanRFIDMode = false;
    currentMode = isOnline && wsConnected ? ONLINE_MODE : OFFLINE_MODE;
    setLEDStatus();
  }
}
void handleAttendanceRecording(String id, String method) {
  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceIdStr;
  doc["verificationId"] = id;
  doc["method"] = method;
  doc["timestamp"] = millis();
  if (sessionActive) doc["sessionId"] = currentSessionId;
  String jsonString;
  serializeJson(doc, jsonString);
  if (isOnline && wsConnected) {
    doc["type"] = "attendance_record";
    serializeJson(doc, jsonString);
    wsClient.send(jsonString);
    displayMessage("Attendance\nRecorded!\nOnline");
    beepSuccess();
  } else {
    saveToSD(jsonString);
    displayMessage("Attendance\nRecorded!\nOffline");
    beepSuccess();
  }
}
void saveToSD(String data) {
  File dataFile = SD.open("/attendance.log", FILE_APPEND);
  if (dataFile) { dataFile.println(data); dataFile.close(); }
}
void syncWithServer() {
  if (!SD.exists("/attendance.log")) { lastSync = millis(); return; }
  File dataFile = SD.open("/attendance.log");
  if (dataFile) {
    HTTPClient http;
    http.begin(String(apiEndpoint) + "/sync");
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", apiKey);
    http.addHeader("x-device-id", deviceIdStr);
    http.addHeader("x-mac-address", macAddressStr);
    StaticJsonDocument<1024> doc;
    JsonArray records = doc.createNestedArray("records");
    while (dataFile.available()) {
      String line = dataFile.readStringUntil('\n');
      records.add(serialized(line));
    }
    String jsonString;
    serializeJson(doc, jsonString);
    int httpCode = http.POST(jsonString);
    if (httpCode == 200) {
      dataFile.close();
      SD.remove("/attendance.log");
      displayMessage("Sync: Success");
      beepSuccess();
    } else {
      displayMessage("Sync: Failed");
      beepError();
    }
    http.end();
  }
  lastSync = millis();
}
uint8_t getFingerprintEnroll() {
  int p = -1;
  Serial.printf("Waiting for valid finger to enroll as #%d\n", enrollFingerprintId);
  displayMessage("Place finger...");
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    switch (p) {
      case FINGERPRINT_OK: Serial.println("Image taken"); break;
      case FINGERPRINT_NOFINGER: Serial.print("."); break;
      case FINGERPRINT_PACKETRECIEVEERR: Serial.println("Communication error"); beepError(); return p;
      case FINGERPRINT_IMAGEFAIL: Serial.println("Imaging error"); beepError(); return p;
      default: Serial.println("Unknown error"); beepError(); return p;
    }
    delay(100);
  }
  p = finger.image2Tz(1);
  switch (p) {
    case FINGERPRINT_OK: Serial.println("Image converted"); break;
    case FINGERPRINT_IMAGEMESS: Serial.println("Image too messy"); beepError(); return p;
    case FINGERPRINT_PACKETRECIEVEERR: Serial.println("Communication error"); beepError(); return p;
    case FINGERPRINT_FEATUREFAIL: Serial.println("Could not find fingerprint features"); beepError(); return p;
    case FINGERPRINT_INVALIDIMAGE: Serial.println("Could not find fingerprint features"); beepError(); return p;
    default: Serial.println("Unknown error"); beepError(); return p;
  }
  Serial.println("Remove finger");
  displayMessage("Remove finger...");
  delay(2000);
  p = 0;
  while (p != FINGERPRINT_NOFINGER) { p = finger.getImage(); }
  Serial.printf("ID %d\n", enrollFingerprintId);
  p = -1;
  Serial.println("Place same finger again");
  displayMessage("Place finger again...");
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    switch (p) {
      case FINGERPRINT_OK: Serial.println("Image taken"); break;
      case FINGERPRINT_NOFINGER: Serial.print("."); break;
      case FINGERPRINT_PACKETRECIEVEERR: Serial.println("Communication error"); beepError(); return p;
      case FINGERPRINT_IMAGEFAIL: Serial.println("Imaging error"); beepError(); return p;
      default: Serial.println("Unknown error"); beepError(); return p;
    }
    delay(100);
  }
  p = finger.image2Tz(2);
  switch (p) {
    case FINGERPRINT_OK: Serial.println("Image converted"); break;
    case FINGERPRINT_IMAGEMESS: Serial.println("Image too messy"); beepError(); return p;
    case FINGERPRINT_PACKETRECIEVEERR: Serial.println("Communication error"); beepError(); return p;
    case FINGERPRINT_FEATUREFAIL: Serial.println("Could not find fingerprint features"); beepError(); return p;
    case FINGERPRINT_INVALIDIMAGE: Serial.println("Could not find fingerprint features"); beepError(); return p;
    default: Serial.println("Unknown error"); beepError(); return p;
  }
  Serial.printf("Creating model for #%d\n", enrollFingerprintId);
  p = finger.createModel();
  if (p == FINGERPRINT_OK) { Serial.println("Prints matched!"); }
  else if (p == FINGERPRINT_PACKETRECIEVEERR) { Serial.println("Communication error"); beepError(); return p; }
  else if (p == FINGERPRINT_ENROLLMISMATCH) { Serial.println("Fingerprints did not match"); beepError(); return p; }
  else { Serial.println("Unknown error"); beepError(); return p; }
  Serial.printf("ID %d\n", enrollFingerprintId);
  p = finger.storeModel(enrollFingerprintId);
  if (p == FINGERPRINT_OK) { Serial.println("Stored!"); return FINGERPRINT_OK; }
  else if (p == FINGERPRINT_PACKETRECIEVEERR) { Serial.println("Communication error"); beepError(); return p; }
  else if (p == FINGERPRINT_BADLOCATION) { Serial.println("Could not store in that location"); beepError(); return p; }
  else if (p == FINGERPRINT_FLASHERR) { Serial.println("Error writing to flash"); beepError(); return p; }
  else { Serial.println("Unknown error"); beepError(); return p; }
}
int getFingerprintID() {
  uint8_t p = finger.getImage();
  if (p != FINGERPRINT_OK) { beepError(); return -1; }
  p = finger.image2Tz();
  if (p != FINGERPRINT_OK) { beepError(); return -1; }
  p = finger.fingerFastSearch();
  if (p != FINGERPRINT_OK) { beepError(); return -1; }
  Serial.printf("Found ID #%d, confidence %d\n", finger.fingerID, finger.confidence);
  return finger.fingerID;
}
String getRFIDTag() {
  String tag = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    tag += (rfid.uid.uidByte[i] < 0x10 ? "0" : "");
    tag += String(rfid.uid.uidByte[i], HEX);
  }
  tag.toUpperCase();
  return tag;
} 