#ifndef SYSTEM_CONFIG_H
#define SYSTEM_CONFIG_H

// Pin Definitions
#define FINGERPRINT_RX 16
#define FINGERPRINT_TX 17
#define OLED_SDA 21
#define OLED_SCL 22
#define BUZZER_PIN 32
#define SD_CS 33
#define SD_MOSI 27
#define SD_MISO 26
#define SD_SCK 25
#define RFID_SS 5
#define RFID_RST 4
#define RFID_MOSI 23
#define RFID_MISO 19
#define RFID_SCK 18

// Display settings
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

// WiFi credentials
#define WIFI_SSID "Galaxy S20 FE 35AF"
#define WIFI_PASSWORD "ollk2898"

// Server settings
#define SERVER_URL "http://your-web-app.com/api"
#define SERVER_PORT 80

// Timing constants
#define FINGERPRINT_TIMEOUT 10000
#define RFID_TIMEOUT 15000
#define SYNC_INTERVAL 30000

// System states
enum SystemState {
  SYSTEM_INITIALIZING,
  SYSTEM_READY,
  SYSTEM_SCANNING_FINGERPRINT,
  SYSTEM_SCANNING_RFID,
  SYSTEM_PROCESSING,
  SYSTEM_ERROR
};

// Forward declarations
void startFingerprintScan();
void startRFIDScan();
void stopScanning();
SystemState getSystemState();

#endif
