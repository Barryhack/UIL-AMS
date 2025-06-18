#include "DisplayHandler.h"

DisplayHandler::DisplayHandler() : lastUpdate(0), blinkState(false), currentScreen("") {
  display = new Adafruit_SSD1306(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
}

DisplayHandler::~DisplayHandler() {
  delete display;
}

bool DisplayHandler::init() {
  Wire.begin(OLED_SDA, OLED_SCL);
  
  if(!display->begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 allocation failed"));
    return false;
  }
  
  display->clearDisplay();
  display->setTextColor(SSD1306_WHITE);
  display->display();
  
  Serial.println("Display initialized successfully");
  return true;
}

void DisplayHandler::update() {
  if (millis() - lastUpdate > 500) { // Update every 500ms
    blinkState = !blinkState;
    lastUpdate = millis();
  }
}

void DisplayHandler::showBootScreen() {
  display->clearDisplay();
  display->setTextSize(2);
  display->setCursor(10, 10);
  display->println("ATTENDANCE");
  display->setCursor(25, 30);
  display->println("SYSTEM");
  
  display->setTextSize(1);
  display->setCursor(0, 50);
  display->print("v1.0 - Initializing...");
  
  display->display();
  currentScreen = "boot";
}

void DisplayHandler::showMainScreen(bool wifiConnected, SystemState state) {
  display->clearDisplay();
  display->setTextSize(1);
  
  // Header
  display->setCursor(0, 0);
  display->println("=== ATTENDANCE SYSTEM ===");
  
  // WiFi status with signal strength
  display->setCursor(0, 15);
  display->print("WiFi: ");
  if (wifiConnected) {
    display->print("Connected");
    // Add signal strength bars here
  } else {
    display->print("Offline");
  }
  
  // System status
  display->setCursor(0, 28);
  display->print("Status: ");
  switch (state) {
    case SYSTEM_READY:
      display->print("Ready");
      break;
    case SYSTEM_SCANNING_FINGERPRINT:
    case SYSTEM_SCANNING_RFID:
      if (blinkState) display->print("SCANNING");
      break;
    case SYSTEM_PROCESSING:
      display->print("Processing");
      break;
    default:
      display->print("Unknown");
  }
  
  // Instructions
  display->setCursor(0, 45);
  display->print("Place finger or card");
  display->setCursor(0, 55);
  display->print("to begin scan");
  
  display->display();
  currentScreen = "main";
}

void DisplayHandler::showMessage(String title, String message) {
  display->clearDisplay();
  display->setTextSize(1);
  
  // Title
  display->setCursor(0, 0);
  display->println(title);
  
  // Separator line
  display->drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);
  
  // Message
  display->setCursor(0, 20);
  display->println(message);
  
  display->display();
  currentScreen = "message";
}

void DisplayHandler::showScanProgress(String method, int progress) {
  display->clearDisplay();
  display->setTextSize(2);
  
  // Title
  display->setCursor(0, 0);
  display->println("SCANNING");
  
  // Method
  display->setTextSize(1);
  display->setCursor(0, 20);
  method.toUpperCase();
  display->print("Method: ");
  display->println(method);
  
  // Progress bar
  int barWidth = 100;
  int barHeight = 8;
  int barX = 14;
  int barY = 35;
  
  display->drawRect(barX, barY, barWidth, barHeight, SSD1306_WHITE);
  int fillWidth = (progress * barWidth) / 100;
  display->fillRect(barX + 1, barY + 1, fillWidth, barHeight - 2, SSD1306_WHITE);
  
  // Progress percentage
  display->setCursor(barX + barWidth + 5, barY);
  display->print(progress);
  display->print("%");
  
  // Instructions
  display->setCursor(0, 50);
  if (method == "fingerprint") {
    display->print("Place finger firmly");
  } else if (method == "rfid") {
    display->print("Hold card steady");
  }
  
  display->display();
  currentScreen = "progress";
}

void DisplayHandler::showSuccess(String userId, String method) {
  display->clearDisplay();
  display->setTextSize(1);
  
  // Success checkmark
  display->drawLine(10, 15, 15, 20, SSD1306_WHITE);
  display->drawLine(15, 20, 25, 10, SSD1306_WHITE);
  
  // Success title
  display->setCursor(30, 10);
  display->println("ACCESS GRANTED");
  
  // User info
  display->setCursor(0, 25);
  display->print("User: ");
  display->println(userId);
  
  display->setCursor(0, 35);
  method.toUpperCase();
  display->print("Method: ");
  display->println(method);
  
  // Timestamp
  display->setCursor(0, 45);
  display->print("Time: ");
  display->println(String(millis() / 1000) + "s");
  
  display->display();
  currentScreen = "success";
}

void DisplayHandler::showError(String errorType, String details) {
  display->clearDisplay();
  display->setTextSize(1);
  
  // Error icon (simple X)
  display->drawLine(10, 10, 20, 20, SSD1306_WHITE);
  display->drawLine(20, 10, 10, 20, SSD1306_WHITE);
  
  // Error title
  display->setCursor(25, 10);
  display->println("ERROR");
  
  // Error type
  display->setCursor(0, 25);
  display->println(errorType);
  
  // Details
  display->setCursor(0, 40);
  display->println(details);
  
  display->display();
  currentScreen = "error";
}

void DisplayHandler::showCountdown(int seconds) {
  display->clearDisplay();
  display->setTextSize(3);
  
  // Center the countdown number
  display->setCursor(55, 20);
  display->println(seconds);
  
  display->setTextSize(1);
  display->setCursor(30, 50);
  display->print("Switching to RFID");
  
  display->display();
  currentScreen = "countdown";
}

void DisplayHandler::showNetworkInfo(String ssid, String ip, int signal) {
  display->clearDisplay();
  display->setTextSize(1);
  
  display->setCursor(0, 0);
  display->println("=== NETWORK INFO ===");
  
  display->setCursor(0, 15);
  display->print("SSID: ");
  display->println(ssid);
  
  display->setCursor(0, 25);
  display->print("IP: ");
  display->println(ip);
  
  display->setCursor(0, 35);
  display->print("Signal: ");
  display->print(signal);
  display->println(" dBm");
  
  display->display();
  currentScreen = "network";
}

void DisplayHandler::clear() {
  display->clearDisplay();
  display->display();
}

void DisplayHandler::setBrightness(int level) {
  // OLED brightness control if supported
  display->ssd1306_command(SSD1306_SETCONTRAST);
  display->ssd1306_command(level);
}
