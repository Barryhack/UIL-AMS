#ifndef RFID_HANDLER_H
#define RFID_HANDLER_H

#include <SPI.h>
#include <MFRC522.h>

class RFIDHandler {
private:
  MFRC522* rfid;
  int ssPin, rstPin;
  int mosiPin, misoPin, sckPin;
  bool initialized;
  
public:
  RFIDHandler(int ss, int rst, int mosi, int miso, int sck);
  ~RFIDHandler();
  bool init();
  void update();
  String scanCard();
  bool isCardPresent();
  String getCardType();
  bool isInitialized();
};

#endif
