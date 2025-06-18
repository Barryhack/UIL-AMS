#include <SPI.h>
#include <MFRC522.h>

#define RFID_SS   5
#define RFID_RST  4
#define RFID_MOSI 23
#define RFID_MISO 19
#define RFID_SCK  18

MFRC522 rfid(RFID_SS, RFID_RST);

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("Starting RFID test...");
  SPI.begin(RFID_SCK, RFID_MISO, RFID_MOSI, RFID_SS);
  delay(100);

  rfid.PCD_Init();
  byte version = rfid.PCD_ReadRegister(rfid.VersionReg);
  Serial.printf("RFID Version: 0x%02X\n", version);
  if (version == 0x91 || version == 0x92) {
    Serial.println("RFID module initialized successfully!");
  } else {
    Serial.println("RFID initialization failed! Check wiring and power.");
  }
}

void loop() {} 