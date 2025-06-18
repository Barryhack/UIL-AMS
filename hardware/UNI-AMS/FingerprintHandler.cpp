#include "FingerprintHandler.h"

FingerprintHandler::FingerprintHandler(int rx, int tx) 
  : rxPin(rx), txPin(tx), initialized(false) {
  serial = new HardwareSerial(2);
  finger = new Adafruit_Fingerprint(serial);
}

FingerprintHandler::~FingerprintHandler() {
  delete finger;
  delete serial;
}

bool FingerprintHandler::init() {
  serial->begin(57600, SERIAL_8N1, rxPin, txPin);
  
  if (finger->verifyPassword()) {
    Serial.println("Fingerprint sensor found!");
    initialized = true;
    return true;
  } else {
    Serial.println("Fingerprint sensor not found");
    initialized = false;
    return false;
  }
}

void FingerprintHandler::update() {
  // Periodic maintenance if needed
}

int FingerprintHandler::scanFingerprint() {
  if (!initialized) return -2;
  
  uint8_t p = finger->getImage();
  if (p != FINGERPRINT_OK) return 0;
  
  p = finger->image2Tz();
  if (p != FINGERPRINT_OK) return -1;
  
  p = finger->fingerFastSearch();
  if (p == FINGERPRINT_OK) {
    Serial.println("Fingerprint found! ID: " + String(finger->fingerID) + 
                   " Confidence: " + String(finger->confidence));
    return finger->fingerID;
  } else {
    Serial.println("Fingerprint not found");
    return -1;
  }
}

bool FingerprintHandler::enrollFingerprint(int id) {
  if (!initialized) return false;
  
  // Implementation for fingerprint enrollment
  // This would involve multiple steps of image capture and template creation
  Serial.println("Enrolling fingerprint ID: " + String(id));
  
  // Simplified enrollment process
  uint8_t p = finger->getImage();
  if (p != FINGERPRINT_OK) return false;
  
  p = finger->image2Tz(1);
  if (p != FINGERPRINT_OK) return false;
  
  // In a real implementation, you'd capture multiple images
  // and create a template
  
  return true;
}

bool FingerprintHandler::deleteFingerprint(int id) {
  if (!initialized) return false;
  
  uint8_t p = finger->deleteModel(id);
  return (p == FINGERPRINT_OK);
}

int FingerprintHandler::getFingerprintCount() {
  if (!initialized) return -1;
  
  finger->getTemplateCount();
  return finger->templateCount;
}

bool FingerprintHandler::isInitialized() {
  return initialized;
}
