#include "RFIDHandler.h"

RFIDHandler::RFIDHandler(int ss, int rst, int mosi, int miso, int sck) 
  : ssPin(ss), rstPin(rst), mosiPin(mosi), misoPin(miso), sckPin(sck), initialized(false) {
  rfid = new MFRC522(ssPin, rstPin);
}

RFIDHandler::~RFIDHandler() {
  delete rfid;
}

bool RFIDHandler::init() {
  SPI.begin(sckPin, misoPin, mosiPin, ssPin);
  rfid->PCD_Init();
  
  // Test if RFID reader is working
  byte version = rfid->PCD_ReadRegister(rfid->VersionReg);
  if (version == 0x00 || version == 0xFF) {
    Serial.println("RFID reader not found");
    initialized = false;
    return false;
  } else {
    Serial.println("RFID reader found! Version: 0x" + String(version, HEX));
    initialized = true;
    return true;
  }
}

void RFIDHandler::update() {
  // Periodic maintenance if needed
}

String RFIDHandler::scanCard() {
  if (!initialized) return "";
  
  if (!rfid->PICC_IsNewCardPresent() || !rfid->PICC_ReadCardSerial()) {
    return "";
  }
  
  String cardId = "";
  for (byte i = 0; i < rfid->uid.size; i++) {
    cardId += String(rfid->uid.uidByte[i] < 0x10 ? "0" : "");
    cardId += String(rfid->uid.uidByte[i], HEX);
  }
  cardId.toUpperCase();
  
  Serial.println("RFID card detected: " + cardId);
  
  rfid->PICC_HaltA();
  rfid->PCD_StopCrypto1();
  
  return cardId;
}

bool RFIDHandler::isCardPresent() {
  if (!initialized) return false;
  return rfid->PICC_IsNewCardPresent();
}

String RFIDHandler::getCardType() {
  if (!initialized) return "";
  
  MFRC522::PICC_Type piccType = rfid->PICC_GetType(rfid->uid.sak);
  return String(rfid->PICC_GetTypeName(piccType));
}

bool RFIDHandler::isInitialized() {
  return initialized;
}
