#ifndef DISPLAY_MANAGER_H
#define DISPLAY_MANAGER_H

#include <Adafruit_SSD1306.h>

class DisplayManager {
private:
    Adafruit_SSD1306* display;
    unsigned long lastUpdate;
    String currentScreen;
    bool blinkState;
public:
    DisplayManager(Adafruit_SSD1306* disp);
    void showBootScreen();
    void showMainMenu();
    void showNetworkInfo();
    void showScanAnimation(String method);
    void update();
};

extern DisplayManager* displayMgr;

#endif // DISPLAY_MANAGER_H 