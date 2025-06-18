#include <Arduino.h>
#include "display_manager.h"

// Enhanced Display Manager for ESP32 Attendance System

DisplayManager::DisplayManager(Adafruit_SSD1306* disp) : display(disp), lastUpdate(0), blinkState(false) {}

void DisplayManager::showBootScreen() {
  display->clearDisplay();
  display->setTextSize(2);
  display->setTextColor(SSD1306_WHITE);
  display->setCursor(10, 10);
  display->println("ATTENDANCE");
  display->setCursor(25, 30);
  display->println("SYSTEM");
  
  // Version info
  display->setTextSize(1);
  display->setCursor(0, 50);
  display->print("v1.0 - Initializing...");
  
  display->display();
}

void DisplayManager::showMainMenu() {
  display->clearDisplay();
  display->setTextSize(1);
  display->setTextColor(SSD1306_WHITE);
  
  // Header
  display->setCursor(0, 0);
  display->println("=== ATTENDANCE SYSTEM ===");
  
  // Status indicators with icons
  display->setCursor(0, 15);
  display->print("WiFi: ");
  if (isOnline) {
    display->print("Connected ");
    // WiFi strength bars
    int strength = map(WiFi.RSSI(), -100, -50, 0, 4);
    for (int i = 0; i < 4; i++) {
      if (i < strength) {
        display->fillRect(100 + (i * 3), 20 - (i * 2), 2, 2 + (i * 2), SSD1306_WHITE);
      } else {
        display->drawRect(100 + (i * 3), 20 - (i * 2), 2, 2 + (i * 2), SSD1306_WHITE);
      }
    }
  } else {
    display->print("Offline");
    // X mark
    display->drawLine(100, 15, 105, 20, SSD1306_WHITE);
    display->drawLine(105, 15, 100, 20, SSD1306_WHITE);
  }
  
  // System status
  display->setCursor(0, 28);
  display->print("Status: ");
  if (scanningMode) {
    if (blinkState) display->print("SCANNING");
    blinkState = !blinkState;
  } else {
    display->print("Ready");
  }
  
  // Instructions
  display->setCursor(0, 45);
  display->print("Place finger or card");
  display->setCursor(0, 55);
  display->print("to begin scan");
  
  display->display();
}

void DisplayManager::showNetworkInfo() {
  display->clearDisplay();
  display->setTextSize(1);
  display->setTextColor(SSD1306_WHITE);
  
  display->setCursor(0, 0);
  display->println("=== NETWORK INFO ===");
  
  display->setCursor(0, 15);
  display->print("SSID: ");
  display->println(WiFi.SSID());
  
  display->setCursor(0, 25);
  display->print("IP: ");
  display->println(WiFi.localIP());
  
  display->setCursor(0, 35);
  display->print("Signal: ");
  display->print(WiFi.RSSI());
  display->println(" dBm");
  
  display->setCursor(0, 45);
  display->print("MAC: ");
  display->println(WiFi.macAddress().substring(12)); // Last 6 chars
  
  display->setCursor(0, 55);
  display->print("Free Heap: ");
  display->print(ESP.getFreeHeap() / 1024);
  display->println("KB");
  
  display->display();
}

void DisplayManager::showScanAnimation(String method) {
  static int animFrame = 0;
  display->clearDisplay();
  display->setTextSize(1);
  display->setTextColor(SSD1306_WHITE);
  
  // Title
  display->setCursor(0, 0);
  display->println("=== SCANNING ===");
  
  // Method
  display->setCursor(0, 15);
  display->print("Method: ");
  display->println(method.toUpperCase());
  
  // Animated scanning indicator
  display->setCursor(0, 30);
  display->print("Scanning");
  for (int i = 0; i < (animFrame % 4); i++) {
    display->print(".");
  }
  
  // Animated radar-like circle
  int centerX = 64;
  int centerY = 45;
  int radius = 15;
  
  display->drawCircle(centerX, centerY, radius, SSD1306_WHITE);
  display->drawCircle(centerX, centerY, radius - 5, SSD1306_WHITE);
  display->drawCircle(centerX, centerY, radius - 10, SSD1306_WHITE);
  
  // Rotating line
  float angle = (animFrame * 15) * PI / 180;
  int x2 = centerX + (radius * cos(angle));
  int y2 = centerY + (radius * sin(angle));
  display->drawLine(centerX, centerY, x2, y2, SSD1306_WHITE);
  
  animFrame++;
  display->display();
}

void DisplayManager::update() {
  if (millis() - lastUpdate > 500) { // Update every 500ms
    if (scanningMode) {
      showScanAnimation(currentCommand);
    } else {
      showMainMenu();
    }
    lastUpdate = millis();
  }
}

// Global display manager instance
DisplayManager* displayMgr;
