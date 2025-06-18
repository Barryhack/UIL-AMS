#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <SD.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <Adafruit_Fingerprint.h>
#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// Pin Definitions
#define FINGERPRINT_RX 16  // TX2
#define FINGERPRINT_TX 17  // RX2
#define OLED_SDA 21
#define OLED_SCL 22
#define BUZZER_PIN 32
#define SD_CS 33
#define SD_MOSI 27
#define SD_MISO 26  // Changed from 27 to 26 to avoid conflict
#define SD_SCK 25
#define RFID_SS 5
#define RFID_RST 4
#define RFID_MOSI 23
#define RFID_MISO 19
#define RFID_SCK 18

// OLED Display Configuration
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

// WiFi Credentials
const char* ssid = "HUAWEI-5G-YqYd";
const char* password = "6C7AZkXn";

// API Configuration
const char* serverUrl = "http://your-server-url/api/attendance";

// System Configuration
#define MAX_FINGERPRINT_ATTEMPTS 2
#define SYNC_INTERVAL 300000  // 5 minutes
#define HEARTBEAT_INTERVAL 60000  // 1 minute
#define DISPLAY_RETRY_COUNT 3

// Initialize Components
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
MFRC522 rfid(RFID_SS, RFID_RST);
SoftwareSerial fingerSerial(FINGERPRINT_RX, FINGERPRINT_TX);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&fingerSerial);

// Global Variables
bool isWiFiConnected = false;
bool isSDCardInitialized = false;
bool isFingerprintInitialized = false;
bool isRFIDInitialized = false;
bool isDisplayInitialized = false;
int fingerprintAttempts = 0;
unsigned long lastSyncTime = 0;
unsigned long lastHeartbeat = 0;
bool isScanning = false;

// Musical Notes (in Hz)
const int BUZZER_C = 262;
const int BUZZER_E = 330;
const int BUZZER_G = 392;

// Initialize I2C with retry mechanism
bool initI2C() {
  int retryCount = 0;
  const int maxRetries = 3;
  
  while (retryCount < maxRetries) {
    Wire.begin(OLED_SDA, OLED_SCL);
    Wire.setClock(100000);  // Set to 100kHz
    delay(100);  // Add delay after I2C initialization
    
    // Test I2C communication
    Wire.beginTransmission(SCREEN_ADDRESS);
    if (Wire.endTransmission() == 0) {
      Serial.println("I2C initialized successfully");
      return true;
    }
    
    Serial.printf("I2C initialization attempt %d failed, retrying...\n", retryCount + 1);
    retryCount++;
    delay(100);
  }
  
  Serial.println("I2C initialization failed after multiple attempts");
  return false;
}

// Initialize SPI for SD Card and RFID
bool initSPI() {
  // First try to initialize SPI for RFID
  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  SPI.setFrequency(4000000);  // Try 4MHz first
  SPI.setDataMode(SPI_MODE0);
  SPI.setBitOrder(MSBFIRST);
  
  // Test SPI communication
  byte testByte = 0x55;  // Test pattern
  SPI.beginTransaction(SPISettings(4000000, MSBFIRST, SPI_MODE0));
  digitalWrite(RFID_SS, LOW);
  byte response = SPI.transfer(testByte);
  digitalWrite(RFID_SS, HIGH);
  SPI.endTransaction();
  
  Serial.printf("SPI Test Response: 0x%02X\n", response);
  return true;
}

// Initialize SD Card
bool initSDCard() {
  Serial.println("\nInitializing SD Card...");
  Serial.println("Pin Configuration:");
  Serial.printf(" - CS:   GPIO%d\n", SD_CS);
  Serial.printf(" - MOSI: GPIO%d\n", SD_MOSI);
  Serial.printf(" - MISO: GPIO%d\n", SD_MISO);
  Serial.printf(" - SCK:  GPIO%d\n", SD_SCK);
  
  // Reset SD card CS pin
  pinMode(SD_CS, OUTPUT);
  digitalWrite(SD_CS, HIGH);
  delay(100);
  
  // Initialize SD card with explicit SPI configuration
  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  delay(100);
  
  if(!SD.begin(SD_CS)) {
    Serial.println("SD Card initialization failed!");
    Serial.println("Please check:");
    Serial.println("1. SD card is inserted");
    Serial.println("2. SD card is formatted as FAT32");
    Serial.println("3. All connections are secure");
  } else {
    Serial.println("SD Card initialized successfully");
    uint8_t cardType = SD.cardType();
    if(cardType == CARD_MMC) {
      Serial.println("Card type: MMC");
    } else if(cardType == CARD_SD) {
      Serial.println("Card type: SDSC");
    } else if(cardType == CARD_SDHC) {
      Serial.println("Card type: SDHC");
    } else {
      Serial.println("Card type: UNKNOWN");
    }
    uint64_t cardSize = SD.cardSize() / (1024 * 1024);
    Serial.printf("Card size: %lluMB\n", cardSize);
  }
  delay(100);
  
  return true;
}

// Initialize RFID
bool initRFID() {
  Serial.println("\nInitializing RFID module...");
  Serial.println("Pin Configuration:");
  Serial.printf(" - SS:   GPIO%d\n", RFID_SS);
  Serial.printf(" - RST:  GPIO%d\n", RFID_RST);
  Serial.printf(" - MOSI: GPIO%d\n", RFID_MOSI);
  Serial.printf(" - MISO: GPIO%d\n", RFID_MISO);
  Serial.printf(" - SCK:  GPIO%d\n", RFID_SCK);
  
  // Reset RFID CS pin
  pinMode(RFID_SS, OUTPUT);
  digitalWrite(RFID_SS, HIGH);
  delay(100);
  
  // Initialize RFID with explicit SPI configuration
  SPI.begin(RFID_SCK, RFID_MISO, RFID_MOSI, RFID_SS);
  delay(100);
  
  rfid.PCD_Init();
  byte version = rfid.PCD_ReadRegister(rfid.VersionReg);
  if(version == 0x00 || version == 0xFF) {
    Serial.println("RFID initialization failed!");
    Serial.println("Please check:");
    Serial.println("1. All connections are secure");
    Serial.println("2. Module is powered (3.3V)");
    Serial.println("3. No other device is using the SPI bus");
  } else {
    Serial.printf("RFID Version: 0x%02X\n", version);
    Serial.println("RFID initialized successfully");
  }
  delay(100);
  
  return true;
}

// Initialize WiFi
bool initWiFi() {
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected successfully");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    return true;
  }
  Serial.println("WiFi connection failed");
  return false;
}

// Handler Classes
class WiFiHandler {
  private:
    bool isConnected = false;
    int rssi = 0;
    
  public:
    bool connect() {
      WiFi.begin(ssid, password);
      int attempts = 0;
      while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        attempts++;
      }
      isConnected = (WiFi.status() == WL_CONNECTED);
      if (isConnected) {
        rssi = WiFi.RSSI();
      }
      return isConnected;
    }
    
    bool sendData(String endpoint, String data) {
      if (!isConnected) return false;
      
      HTTPClient http;
      http.begin(serverUrl + endpoint);
      http.addHeader("Content-Type", "application/json");
      int httpCode = http.POST(data);
      http.end();
      
      return (httpCode == HTTP_CODE_OK);
    }
    
    int getSignalStrength() {
      if (isConnected) {
        rssi = WiFi.RSSI();
      }
      return rssi;
    }
    
    bool isOnline() {
      return isConnected;
    }
};

class DisplayHandler {
  private:
    Adafruit_SSD1306* display;
    int scanAngle = 0;
    int retryCount = 0;
    
  public:
    DisplayHandler(Adafruit_SSD1306* disp) {
      display = disp;
    }
    
    bool initialize() {
      Wire.begin(OLED_SDA, OLED_SCL);
      Wire.setClock(100000);  // Set to 100kHz
      
      while (retryCount < DISPLAY_RETRY_COUNT) {
        if(display->begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
          display->clearDisplay();
          display->setTextSize(2);
          display->setTextColor(SSD1306_WHITE);
          display->setCursor(0,0);
          display->println("AMS");
          display->display();
          isDisplayInitialized = true;
          return true;
        }
        retryCount++;
        delay(100);
      }
      return false;
    }
    
    void showBootScreen() {
      if (!display) return;
      
      display->clearDisplay();
      display->setTextSize(2);
      display->setCursor(0,0);
      display->println("AMS");
      display->setTextSize(1);
      display->setCursor(0,20);
      display->println("Initializing...");
      display->display();
    }
    
    void showMainMenu(bool isOnline, int rssi) {
      display->clearDisplay();
      display->setTextSize(1);
      display->setCursor(0,0);
      display->println("AMS Status");
      display->setCursor(0,10);
      display->print("WiFi: ");
      display->println(isOnline ? "Connected" : "Offline");
      if (isOnline) {
        display->setCursor(0,20);
        display->print("Signal: ");
        display->print(rssi);
        display->println(" dBm");
      }
      display->display();
    }
    
    void showScanningAnimation() {
      display->clearDisplay();
      display->setTextSize(1);
      display->setCursor(0,0);
      display->println("Scanning...");
      
      // Draw radar-like animation
      int centerX = SCREEN_WIDTH/2;
      int centerY = SCREEN_HEIGHT/2;
      int radius = 20;
      
      display->drawCircle(centerX, centerY, radius, SSD1306_WHITE);
      float angle = scanAngle * PI / 180;
      int endX = centerX + radius * cos(angle);
      int endY = centerY + radius * sin(angle);
      display->drawLine(centerX, centerY, endX, endY, SSD1306_WHITE);
      
      scanAngle = (scanAngle + 10) % 360;
      display->display();
    }
    
    void showSuccess(String message) {
      display->clearDisplay();
      display->setTextSize(1);
      display->setCursor(0,0);
      display->println("Success!");
      display->setCursor(0,20);
      display->println(message);
      display->display();
    }
    
    void showError(String message) {
      display->clearDisplay();
      display->setTextSize(1);
      display->setCursor(0,0);
      display->println("Error!");
      display->setCursor(0,20);
      display->println(message);
      display->display();
    }
};

class BuzzerHandler {
  private:
    int pin;
    
  public:
    BuzzerHandler(int buzzerPin) {
      pin = buzzerPin;
      pinMode(pin, OUTPUT);
    }
    
    void playBootupMelody() {
      tone(pin, BUZZER_C, 100);
      delay(100);
      tone(pin, BUZZER_E, 100);
      delay(100);
      tone(pin, BUZZER_G, 100);
      delay(100);
      noTone(pin);
    }
    
    void playSuccessSound() {
      tone(pin, BUZZER_E, 100);
      delay(100);
      tone(pin, BUZZER_G, 100);
      delay(100);
      tone(pin, BUZZER_C, 200);
      delay(200);
      noTone(pin);
    }
    
    void playErrorSound() {
      tone(pin, BUZZER_G, 100);
      delay(100);
      tone(pin, BUZZER_E, 100);
      delay(100);
      tone(pin, BUZZER_C, 200);
      delay(200);
      noTone(pin);
    }
    
    void playScanningBeep() {
      tone(pin, BUZZER_C, 50);
      delay(50);
      tone(pin, BUZZER_E, 50);
      delay(50);
      noTone(pin);
    }
    
    void playHeartbeat() {
      tone(pin, BUZZER_C, 50);
      delay(50);
      noTone(pin);
    }
};

class FingerprintHandler {
  private:
    Adafruit_Fingerprint* sensor;
    int attempts = 0;
    
  public:
    FingerprintHandler(Adafruit_Fingerprint* fp) {
      sensor = fp;
    }
    
    bool verify() {
      uint8_t result = sensor->getImage();
      if (result != FINGERPRINT_OK) return false;
      
      result = sensor->fingerFastSearch();
      if (result == FINGERPRINT_OK) {
        attempts = 0;
        return true;
      }
      
      attempts++;
      return false;
    }
    
    int getAttempts() {
      return attempts;
    }
    
    void resetAttempts() {
      attempts = 0;
    }
};

class RFIDHandler {
  private:
    MFRC522* reader;
    
  public:
    RFIDHandler(MFRC522* rfid) {
      reader = rfid;
    }
    
    String readCard() {
      if (!reader->PICC_IsNewCardPresent() || !reader->PICC_ReadCardSerial()) {
        return "";
      }
      
      String cardId = "";
      for (byte i = 0; i < reader->uid.size; i++) {
        cardId += String(reader->uid.uidByte[i], HEX);
      }
      
      reader->PICC_HaltA();
      reader->PCD_StopCrypto1();
      
      return cardId;
    }
};

class SDCardHandler {
  private:
    int csPin;
    
  public:
    SDCardHandler(int pin) {
      csPin = pin;
    }
    
    bool initialize() {
      return SD.begin(csPin);
    }
    
    bool logEvent(String event) {
      File logFile = SD.open("/log.txt", FILE_APPEND);
      if (!logFile) return false;
      
      logFile.println(String(millis()) + ": " + event);
      logFile.close();
      return true;
    }
    
    bool storeAttendance(String id, String method) {
      File dataFile = SD.open("/attendance.csv", FILE_APPEND);
      if (!dataFile) return false;
      
      dataFile.println(String(millis()) + "," + id + "," + method);
      dataFile.close();
      return true;
    }
};

// Initialize Handlers
WiFiHandler wifiHandler;
DisplayHandler displayHandler(&display);
BuzzerHandler buzzerHandler(BUZZER_PIN);
FingerprintHandler fingerprintHandler(&finger);
RFIDHandler rfidHandler(&rfid);
SDCardHandler sdCardHandler(SD_CS);

void setup() {
  // Wait for serial connection
  Serial.begin(115200);
  delay(1000);  // Give time for serial to connect
  
  Serial.println("\n\n=== AMS System Starting ===");
  
  // Initialize I2C first
  Serial.println("\nInitializing I2C...");
  Wire.begin(OLED_SDA, OLED_SCL);
  delay(100);
  
  // Initialize display
  Serial.println("Initializing display...");
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("Display initialization failed!");
  } else {
    Serial.println("Display initialized successfully");
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0,0);
    display.println("AMS Starting...");
    display.display();
  }
  delay(100);

  // Initialize SD Card
  Serial.println("\nInitializing SD Card...");
  Serial.println("Pin Configuration:");
  Serial.printf(" - CS:   GPIO%d\n", SD_CS);
  Serial.printf(" - MOSI: GPIO%d\n", SD_MOSI);
  Serial.printf(" - MISO: GPIO%d\n", SD_MISO);
  Serial.printf(" - SCK:  GPIO%d\n", SD_SCK);
  
  // Reset SD card CS pin
  pinMode(SD_CS, OUTPUT);
  digitalWrite(SD_CS, HIGH);
  delay(100);
  
  // Initialize SD card with explicit SPI configuration
  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  delay(100);
  
  if(!SD.begin(SD_CS)) {
    Serial.println("SD Card initialization failed!");
    Serial.println("Please check:");
    Serial.println("1. SD card is inserted");
    Serial.println("2. SD card is formatted as FAT32");
    Serial.println("3. All connections are secure");
  } else {
    Serial.println("SD Card initialized successfully");
    uint8_t cardType = SD.cardType();
    if(cardType == CARD_MMC) {
      Serial.println("Card type: MMC");
    } else if(cardType == CARD_SD) {
      Serial.println("Card type: SDSC");
    } else if(cardType == CARD_SDHC) {
      Serial.println("Card type: SDHC");
    } else {
      Serial.println("Card type: UNKNOWN");
    }
    uint64_t cardSize = SD.cardSize() / (1024 * 1024);
    Serial.printf("Card size: %lluMB\n", cardSize);
  }
  delay(100);

  // Initialize RFID
  Serial.println("\nInitializing RFID module...");
  Serial.println("Pin Configuration:");
  Serial.printf(" - SS:   GPIO%d\n", RFID_SS);
  Serial.printf(" - RST:  GPIO%d\n", RFID_RST);
  Serial.printf(" - MOSI: GPIO%d\n", RFID_MOSI);
  Serial.printf(" - MISO: GPIO%d\n", RFID_MISO);
  Serial.printf(" - SCK:  GPIO%d\n", RFID_SCK);
  
  // Reset RFID CS pin
  pinMode(RFID_SS, OUTPUT);
  digitalWrite(RFID_SS, HIGH);
  delay(100);
  
  // Initialize RFID with explicit SPI configuration
  SPI.begin(RFID_SCK, RFID_MISO, RFID_MOSI, RFID_SS);
  delay(100);
  
  rfid.PCD_Init();
  byte version = rfid.PCD_ReadRegister(rfid.VersionReg);
  if(version == 0x00 || version == 0xFF) {
    Serial.println("RFID initialization failed!");
    Serial.println("Please check:");
    Serial.println("1. All connections are secure");
    Serial.println("2. Module is powered (3.3V)");
    Serial.println("3. No other device is using the SPI bus");
  } else {
    Serial.printf("RFID Version: 0x%02X\n", version);
    Serial.println("RFID initialized successfully");
  }
  delay(100);

  // Initialize fingerprint sensor
  Serial.println("\nInitializing fingerprint sensor...");
  fingerSerial.begin(57600);
  delay(100);
  if(finger.verifyPassword()) {
    Serial.println("Fingerprint sensor initialized successfully");
  } else {
    Serial.println("Fingerprint sensor not found!");
  }
  
  // Initialize WiFi
  Serial.println("\nInitializing WiFi...");
  WiFi.begin(ssid, password);
  int attempts = 0;
  while(WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if(WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected successfully");
    Serial.printf("IP address: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\nWiFi connection failed");
  }

  Serial.println("\n=== System Initialization Complete ===\n");
}

void loop() {
  // Handle Heartbeat
  if (millis() - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    buzzerHandler.playHeartbeat();
    lastHeartbeat = millis();
  }

  // Handle Auto-Sync
  if (isWiFiConnected && millis() - lastSyncTime >= SYNC_INTERVAL) {
    syncAttendanceData();
    lastSyncTime = millis();
  }

  // Main operation loop
  if (isScanning) {
    displayHandler.showScanningAnimation();
    buzzerHandler.playScanningBeep();
  }

  // Try Fingerprint First
  if (fingerprintHandler.getAttempts() < MAX_FINGERPRINT_ATTEMPTS) {
    if (fingerprintHandler.verify()) {
      handleSuccessfulAuth("FINGERPRINT", String(finger.fingerID));
    }
  } else {
    // Fallback to RFID
    String cardId = rfidHandler.readCard();
    if (cardId != "") {
      handleSuccessfulAuth("RFID", cardId);
      fingerprintHandler.resetAttempts();
    }
  }
  
  delay(100);
}

void handleSuccessfulAuth(String method, String id) {
  isScanning = false;
  displayHandler.showSuccess("Welcome!");
  buzzerHandler.playSuccessSound();
  
  // Store attendance
  if (isWiFiConnected) {
    if (wifiHandler.sendData("/attendance", "{\"method\":\"" + method + "\",\"id\":\"" + id + "\"}")) {
      displayHandler.showSuccess("Attendance Recorded");
    } else {
      displayHandler.showError("Server Error");
      sdCardHandler.storeAttendance(id, method);
    }
  } else {
    sdCardHandler.storeAttendance(id, method);
    displayHandler.showSuccess("Stored Offline");
  }
}

void syncAttendanceData() {
  if (!isWiFiConnected) return;
  
  File dataFile = SD.open("/attendance.csv", FILE_READ);
  if (!dataFile) return;
  
  while (dataFile.available()) {
    String line = dataFile.readStringUntil('\n');
    if (wifiHandler.sendData("/sync", line)) {
      // Remove synced data
      // Implementation needed
    }
  }
  
  dataFile.close();
}

void performSystemCheck() {
  String status = "System Status:\n";
  status += "WiFi: " + String(isWiFiConnected ? "OK" : "FAIL") + "\n";
  status += "SD Card: " + String(isSDCardInitialized ? "OK" : "FAIL") + "\n";
  status += "RFID: " + String(isRFIDInitialized ? "OK" : "FAIL") + "\n";
  status += "Fingerprint: " + String(isFingerprintInitialized ? "OK" : "FAIL");
  
  displayHandler.showMainMenu(isWiFiConnected, wifiHandler.getSignalStrength());
  sdCardHandler.logEvent("System Check: " + status);
} 