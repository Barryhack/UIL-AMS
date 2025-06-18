#ifndef RFID_HANDLER_H
#define RFID_HANDLER_H

#include <MFRC522.h>
#include <SPI.h>

class RFIDHandler {
public:
    static bool begin();
    static void end();
    static bool isCardPresent();
    static String readCardID();
    static bool writeCardData(String data);
    static String readCardData();

private:
    static MFRC522 mfrc522;
    static const byte RST_PIN = 4;    // GPIO4
    static const byte SS_PIN = 5;     // GPIO5
    static const byte BUZZER_PIN = 32; // GPIO32
    
    static void beep(unsigned int duration = 100);
    static bool authenticateCard();
};

#endif 