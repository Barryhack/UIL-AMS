#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <MFRC522.h>
#include <Adafruit_Fingerprint.h>
#include <Adafruit_SSD1306.h>
#include <SD.h>
#include <SPI.h>

// Network credentials
const char* ssid = "Galaxy S20 FE 35AF";
const char* password = "ollk2898";

// API configuration
const char* apiEndpoint = "http://your-server:3000/api/hardware";
const char* apiKey = "your-hardware-api-key";
const char* deviceId = "your-device-id";
const char* macAddress = "your-mac-address";

// Pin definitions
#define FINGERPRINT_RX 16
#define FINGERPRINT_TX 17
#define RFID_SS_PIN 5
#define RFID_RST_PIN 22
#define SD_CS_PIN 15
#define LED_RED 25
#define LED_YELLOW 26
#define LED_GREEN 27

// Display configuration
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

// Initialize components
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&Serial2);
MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Global variables
bool isOnline = false;
unsigned long lastSync = 0;
const unsigned long syncInterval = 300000; // 5 minutes
const int maxRetries = 3;
int failedScans = 0;

void setup() {
  // Initialize serial communication
  Serial.begin(115200);
  Serial2.begin(57600);

  // Initialize pins
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);

  // Initialize display
  if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("SSD1306 allocation failed"));
    for(;;);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  displayMessage("Initializing...");

  // Initialize SD card
  if(!SD.begin(SD_CS_PIN)) {
    Serial.println("SD card initialization failed!");
    displayMessage("SD Card Failed!");
    delay(2000);
  }

  // Initialize fingerprint sensor
  finger.begin(57600);
  if (finger.verifyPassword()) {
    Serial.println("Fingerprint sensor connected!");
  } else {
    Serial.println("Fingerprint sensor not found!");
    displayMessage("Fingerprint Error!");
    delay(2000);
  }

  // Initialize RFID reader
  SPI.begin();
  rfid.PCD_Init();

  // Connect to WiFi
  connectToWiFi();
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    isOnline = false;
    connectToWiFi();
  }

  // Sync with server periodically
  if (isOnline && millis() - lastSync >= syncInterval) {
    syncWithServer();
  }

  // Main attendance verification loop
  if (failedScans < maxRetries) {
    // Try fingerprint first
    displayMessage("Place finger...");
    int fingerprintResult = getFingerprintID();
    
    if (fingerprintResult >= 0) {
      // Fingerprint matched
      verifyAttendance(String(fingerprintResult), "FINGERPRINT");
      failedScans = 0;
    } else {
      failedScans++;
      if (failedScans >= maxRetries) {
        // Switch to RFID after max fingerprint failures
        displayMessage("Scan RFID tag");
        digitalWrite(LED_YELLOW, HIGH);
      }
    }
  } else {
    // RFID fallback
    if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
      String rfidTag = getRFIDTag();
      verifyAttendance(rfidTag, "RFID");
      rfid.PICC_HaltA();
      rfid.PCD_StopCrypto1();
      failedScans = 0;
    }
  }

  delay(100);
}

void connectToWiFi() {
  displayMessage("Connecting WiFi...");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    isOnline = true;
    displayMessage("WiFi Connected!");
    digitalWrite(LED_GREEN, HIGH);
    delay(1000);
    digitalWrite(LED_GREEN, LOW);
  } else {
    isOnline = false;
    displayMessage("Offline Mode");
    digitalWrite(LED_YELLOW, HIGH);
    delay(1000);
    digitalWrite(LED_YELLOW, LOW);
  }
}

void verifyAttendance(String id, String method) {
  StaticJsonDocument<200> doc;
  doc["deviceId"] = deviceId;
  doc["verificationId"] = id;
  doc["method"] = method;
  doc["timestamp"] = millis();

  if (isOnline) {
    // Send to server
    HTTPClient http;
    http.begin(String(apiEndpoint) + "/verify");
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", apiKey);
    http.addHeader("x-device-id", deviceId);
    http.addHeader("x-mac-address", macAddress);

    String jsonString;
    serializeJson(doc, jsonString);
    
    int httpCode = http.POST(jsonString);
    
    if (httpCode == 200) {
      displaySuccess();
    } else {
      saveToSD(jsonString);
      displayError("Server Error");
    }
    
    http.end();
  } else {
    // Save to SD card for later sync
    saveToSD(jsonString);
    displaySuccess();
  }
}

void saveToSD(String data) {
  File dataFile = SD.open("/attendance.log", FILE_APPEND);
  if (dataFile) {
    dataFile.println(data);
    dataFile.close();
  }
}

void syncWithServer() {
  if (!SD.exists("/attendance.log")) {
    lastSync = millis();
    return;
  }

  File dataFile = SD.open("/attendance.log");
  if (dataFile) {
    HTTPClient http;
    http.begin(String(apiEndpoint) + "/sync");
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", apiKey);
    http.addHeader("x-device-id", deviceId);
    http.addHeader("x-mac-address", macAddress);

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
      // Delete the file after successful sync
      dataFile.close();
      SD.remove("/attendance.log");
    }
    
    http.end();
  }
  
  lastSync = millis();
}

int getFingerprintID() {
  uint8_t p = finger.getImage();
  if (p != FINGERPRINT_OK) return -1;

  p = finger.image2Tz();
  if (p != FINGERPRINT_OK) return -1;

  p = finger.fingerFastSearch();
  if (p != FINGERPRINT_OK) return -1;
  
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

void displayMessage(String message) {
  display.clearDisplay();
  display.setCursor(0,0);
  display.println(message);
  display.display();
}

void displaySuccess() {
  digitalWrite(LED_GREEN, HIGH);
  displayMessage("Attendance\nRecorded!");
  delay(1000);
  digitalWrite(LED_GREEN, LOW);
}

void displayError(String error) {
  digitalWrite(LED_RED, HIGH);
  displayMessage("Error:\n" + error);
  delay(1000);
  digitalWrite(LED_RED, LOW);
} 