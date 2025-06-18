#include <SPI.h>
#include <SD.h>

#define SD_CS   33
#define SD_MOSI 27
#define SD_MISO 26
#define SD_SCK  25

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("Starting SD card test...");
  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  delay(100);

  if (!SD.begin(SD_CS)) {
    Serial.println("SD Card initialization failed!");
    Serial.println("Check wiring, power, and card format (FAT32).");
  } else {
    Serial.println("SD Card initialized successfully!");
    uint8_t cardType = SD.cardType();
    if (cardType == CARD_MMC) Serial.println("Card type: MMC");
    else if (cardType == CARD_SD) Serial.println("Card type: SDSC");
    else if (cardType == CARD_SDHC) Serial.println("Card type: SDHC");
    else Serial.println("Card type: UNKNOWN");
    uint64_t cardSize = SD.cardSize() / (1024 * 1024);
    Serial.printf("Card size: %lluMB\n", cardSize);
  }
}

void loop() {} 