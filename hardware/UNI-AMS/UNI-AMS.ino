#include "WiFiHandler.h"
#include "DisplayHandler.h"
#include "BuzzerHandler.h"
#include "FingerprintHandler.h"
#include "RFIDHandler.h"
#include "SDCardHandler.h"
#include "WebServerHandler.h"
#include "AttendanceManager.h"
#include "SystemConfig.h"

// Global handler instances
WiFiHandler* wifiHandler;
DisplayHandler* displayHandler;
BuzzerHandler* buzzerHandler;
FingerprintHandler* fingerprintHandler;
RFIDHandler* rfidHandler;
SDCardHandler* sdCardHandler;
WebServerHandler* webServerHandler;
AttendanceManager* attendanceManager;

// System state
SystemState currentState = SYSTEM_INITIALIZING;
unsigned long lastUpdate = 0;
const unsigned long UPDATE_INTERVAL = 100; // 100ms update cycle

void setup() {
  Serial.begin(115200);
  Serial.println("Starting ESP32 Attendance System...");
  
  // Initialize all handlers
  initializeSystem();
  
  // System ready
  currentState = SYSTEM_READY;
  displayHandler->showMessage("System Ready", "Waiting for scan");
  buzzerHandler->playBootup();
  
  Serial.println("System initialization complete!");
}

void loop() {
  unsigned long currentTime = millis();
  
  if (currentTime - lastUpdate >= UPDATE_INTERVAL) {
    // Update all handlers
    updateSystem();
    lastUpdate = currentTime;
  }
  
  // Handle web server requests (needs frequent handling)
  webServerHandler->handleClient();
  
  delay(10); // Small delay to prevent watchdog issues
}

void initializeSystem() {
  // Initialize display first for user feedback
  displayHandler = new DisplayHandler();
  if (!displayHandler->init()) {
    Serial.println("Display initialization failed!");
    return;
  }
  displayHandler->showBootScreen();
  
  // Initialize buzzer
  buzzerHandler = new BuzzerHandler(BUZZER_PIN);
  if (!buzzerHandler->init()) {
    Serial.println("Buzzer initialization failed!");
    return;
  }
  
  // Initialize SD card
  displayHandler->showMessage("Initializing", "SD Card...");
  sdCardHandler = new SDCardHandler(SD_CS, SD_MOSI, SD_MISO, SD_SCK);
  if (!sdCardHandler->init()) {
    displayHandler->showError("SD Card Error", "Check connection");
    buzzerHandler->playError();
    Serial.println("SD Card initialization failed!");
    delay(3000);
    return;
  }
  
  // Initialize fingerprint sensor
  displayHandler->showMessage("Initializing", "Fingerprint sensor...");
  fingerprintHandler = new FingerprintHandler(FINGERPRINT_RX, FINGERPRINT_TX);
  if (!fingerprintHandler->init()) {
    displayHandler->showError("Fingerprint Error", "Check connection");
    buzzerHandler->playError();
    Serial.println("Fingerprint sensor initialization failed!");
    delay(3000);
    return;
  }
  
  // Initialize RFID
  displayHandler->showMessage("Initializing", "RFID reader...");
  rfidHandler = new RFIDHandler(RFID_SS, RFID_RST, RFID_MOSI, RFID_MISO, RFID_SCK);
  if (!rfidHandler->init()) {
    displayHandler->showError("RFID Error", "Check connection");
    buzzerHandler->playError();
    Serial.println("RFID reader initialization failed!");
    delay(3000);
    return;
  }
  
  // Initialize WiFi
  displayHandler->showMessage("Connecting", "WiFi...");
  wifiHandler = new WiFiHandler(WIFI_SSID, WIFI_PASSWORD);
  if (!wifiHandler->init()) {
    displayHandler->showError("WiFi Error", "Check connection");
    buzzerHandler->playError();
    Serial.println("WiFi initialization failed!");
    delay(3000);
    return;
  }
  
  // Initialize attendance manager
  attendanceManager = new AttendanceManager(sdCardHandler, wifiHandler);
  if (!attendanceManager->init()) {
    displayHandler->showError("Attendance Manager Error", "Check connection");
    buzzerHandler->playError();
    Serial.println("Attendance Manager initialization failed!");
    delay(3000);
    return;
  }
  
  // Initialize web server
  webServerHandler = new WebServerHandler(attendanceManager, fingerprintHandler, rfidHandler);
  if (!webServerHandler->init()) {
    displayHandler->showError("Web Server Error", "Check connection");
    buzzerHandler->playError();
    Serial.println("Web Server initialization failed!");
    delay(3000);
    return;
  }
  
  Serial.println("All handlers initialized successfully");
}

void updateSystem() {
  // Update all handlers
  wifiHandler->update();
  displayHandler->update();
  fingerprintHandler->update();
  rfidHandler->update();
  attendanceManager->update();
  
  // Handle system state changes
  handleSystemState();
}

void handleSystemState() {
  static SystemState previousState = SYSTEM_INITIALIZING;
  
  if (currentState != previousState) {
    Serial.print("State change: ");
    Serial.print(previousState);
    Serial.print(" -> ");
    Serial.println(currentState);
    onStateChange(previousState, currentState);
    previousState = currentState;
  }
  
  // State-specific logic
  switch (currentState) {
    case SYSTEM_READY:
      handleReadyState();
      break;
    case SYSTEM_SCANNING_FINGERPRINT:
      handleFingerprintScanning();
      break;
    case SYSTEM_SCANNING_RFID:
      handleRFIDScanning();
      break;
    case SYSTEM_PROCESSING:
      handleProcessing();
      break;
    case SYSTEM_ERROR:
      handleError();
      break;
    default:
      Serial.println("Unknown state!");
      break;
  }
}

void handleReadyState() {
  displayHandler->showMainScreen(wifiHandler->isConnected(), currentState);
}

void handleFingerprintScanning() {
  static int failedAttempts = 0;
  static unsigned long scanStartTime = 0;
  
  if (scanStartTime == 0) {
    scanStartTime = millis();
    buzzerHandler->playScanning();
    displayHandler->showScanProgress("fingerprint", 0);
  }
  
  // Update progress
  unsigned long elapsed = millis() - scanStartTime;
  int progress = min(95, (int)(elapsed / 50));
  displayHandler->showScanProgress("fingerprint", progress);
  
  // Check for fingerprint
  int fingerprintId = fingerprintHandler->scanFingerprint();
  
  if (fingerprintId > 0) {
    // Success
    attendanceManager->recordAttendance(String(fingerprintId), "fingerprint");
    displayHandler->showSuccess(String(fingerprintId), "fingerprint");
    buzzerHandler->playSuccess();
    currentState = SYSTEM_PROCESSING;
    scanStartTime = 0;
    failedAttempts = 0;
  } else if (fingerprintId == -1) {
    // Failed scan
    failedAttempts++;
    scanStartTime = 0;
    
    if (failedAttempts >= 2) {
      // Switch to RFID
      displayHandler->showMessage("Switching to RFID", "Present card...");
      buzzerHandler->playModeSwitch();
      currentState = SYSTEM_SCANNING_RFID;
      failedAttempts = 0;
    } else {
      displayHandler->showError("Try Again", "Fingerprint not found");
      buzzerHandler->playError();
      delay(2000);
      scanStartTime = millis(); // Restart scan
    }
  } else if (elapsed > FINGERPRINT_TIMEOUT) {
    // Timeout
    displayHandler->showError("Timeout", "Please try again");
    buzzerHandler->playError();
    currentState = SYSTEM_READY;
    scanStartTime = 0;
    failedAttempts = 0;
  }
}

void handleRFIDScanning() {
  static unsigned long scanStartTime = 0;
  
  if (scanStartTime == 0) {
    scanStartTime = millis();
    buzzerHandler->playScanning();
    displayHandler->showScanProgress("rfid", 0);
  }
  
  // Update progress
  unsigned long elapsed = millis() - scanStartTime;
  int progress = min(95, (int)(elapsed / 100));
  displayHandler->showScanProgress("rfid", progress);
  
  // Check for RFID card
  String cardId = rfidHandler->scanCard();
  
  if (cardId != "") {
    // Success
    attendanceManager->recordAttendance(cardId, "rfid");
    displayHandler->showSuccess(cardId, "rfid");
    buzzerHandler->playSuccess();
    currentState = SYSTEM_PROCESSING;
    scanStartTime = 0;
  } else if (elapsed > RFID_TIMEOUT) {
    // Timeout
    displayHandler->showError("Timeout", "No card detected");
    buzzerHandler->playError();
    currentState = SYSTEM_READY;
    scanStartTime = 0;
  }
}

void handleProcessing() {
  static unsigned long processStartTime = 0;
  
  if (processStartTime == 0) {
    processStartTime = millis();
  }
  
  // Show success for 3 seconds
  if (millis() - processStartTime > 3000) {
    currentState = SYSTEM_READY;
    processStartTime = 0;
  }
}

void handleError() {
  // Error handling logic
  static unsigned long errorStartTime = 0;
  
  if (errorStartTime == 0) {
    errorStartTime = millis();
  }
  
  // Auto-recover after 5 seconds
  if (millis() - errorStartTime > 5000) {
    currentState = SYSTEM_READY;
    errorStartTime = 0;
  }
}

void onStateChange(SystemState from, SystemState to) {
  Serial.println("State change: " + String(from) + " -> " + String(to));
  
  // State transition logic
  switch (to) {
    case SYSTEM_SCANNING_FINGERPRINT:
      displayHandler->showMessage("Scan Fingerprint", "Place finger on sensor");
      break;
    case SYSTEM_SCANNING_RFID:
      displayHandler->showMessage("Scan RFID", "Present card to reader");
      break;
    case SYSTEM_READY:
      displayHandler->showMessage("System Ready", "Waiting for scan");
      break;
  }
}

// Public functions for web server callbacks
void startFingerprintScan() {
  currentState = SYSTEM_SCANNING_FINGERPRINT;
}

void startRFIDScan() {
  currentState = SYSTEM_SCANNING_RFID;
}

void stopScanning() {
  currentState = SYSTEM_READY;
}

SystemState getSystemState() {
  return currentState;
}
