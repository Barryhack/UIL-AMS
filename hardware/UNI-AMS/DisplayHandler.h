#ifndef DISPLAY_HANDLER_H
#define DISPLAY_HANDLER_H

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "SystemConfig.h"

class DisplayHandler {
private:
  Adafruit_SSD1306* display;
  unsigned long lastUpdate;
  bool blinkState;
  String currentScreen;
  
public:
  DisplayHandler();
  ~DisplayHandler();
  bool init();
  void update();
  void showBootScreen();
  void showMainScreen(bool wifiConnected, SystemState state);
  void showMessage(String title, String message);
  void showScanProgress(String method, int progress);
  void showSuccess(String userId, String method);
  void showError(String errorType, String details);
  void showCountdown(int seconds);
  void showNetworkInfo(String ssid, String ip, int signal);
  void clear();
  void setBrightness(int level);
};

#endif
