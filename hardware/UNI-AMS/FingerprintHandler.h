#ifndef FINGERPRINT_HANDLER_H
#define FINGERPRINT_HANDLER_H

#include <Adafruit_Fingerprint.h>
#include <HardwareSerial.h>

class FingerprintHandler {
private:
  HardwareSerial* serial;
  Adafruit_Fingerprint* finger;
  int rxPin, txPin;
  bool initialized;
  
public:
  FingerprintHandler(int rx, int tx);
  ~FingerprintHandler();
  bool init();
  void update();
  int scanFingerprint();
  bool enrollFingerprint(int id);
  bool deleteFingerprint(int id);
  int getFingerprintCount();
  bool isInitialized();
};

#endif
