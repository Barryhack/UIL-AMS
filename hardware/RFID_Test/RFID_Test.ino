#include <SPI.h>
#include <MFRC522.h>

// Pin definitions
#define RST_PIN   4   // RST/Reset   -> GPIO4
#define SS_PIN    5   // SDA/SS      -> GPIO5
#define MOSI_PIN  23  // MOSI        -> GPIO23
#define MISO_PIN  19  // MISO        -> GPIO19
#define SCK_PIN   18  // SCK         -> GPIO18
#define BUZZER_PIN 32 // Buzzer      -> GPIO32

MFRC522 mfrc522(SS_PIN, RST_PIN);  // Create MFRC522 instance

void setup() {
  Serial.begin(9600);
  delay(1000);
  
  // Initialize buzzer
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  
  // Quick buzzer test
  beep(100);  // Short beep to confirm power
  delay(500);
  
  Serial.println("\n=== RFID Test with Buzzer ===");
  
  // Hardware reset sequence
  Serial.println("1. Performing hardware reset...");
  pinMode(RST_PIN, OUTPUT);
  digitalWrite(RST_PIN, LOW);
  delay(100);
  digitalWrite(RST_PIN, HIGH);
  delay(100);
  beep(50);  // Confirmation beep
  
  // Initialize SPI with conservative settings
  Serial.println("2. Initializing SPI bus...");
  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);
  SPI.setFrequency(1000000);  // Try 1MHz
  SPI.setDataMode(SPI_MODE0);
  delay(100);
  beep(50);  // Confirmation beep
  
  // Initialize MFRC522
  Serial.println("3. Initializing MFRC522...");
  mfrc522.PCD_Init();
  delay(100);
  
  // Soft reset the module
  Serial.println("4. Performing soft reset...");
  mfrc522.PCD_Reset();
  delay(100);
  
  // Check MFRC522 firmware version
  byte v = mfrc522.PCD_ReadRegister(MFRC522::VersionReg);
  Serial.print("5. Firmware Version: 0x");
  Serial.println(v, HEX);
  
  // Read additional registers for debugging
  byte command = mfrc522.PCD_ReadRegister(MFRC522::CommandReg);
  byte mode = mfrc522.PCD_ReadRegister(MFRC522::ModeReg);
  byte txControl = mfrc522.PCD_ReadRegister(MFRC522::TxControlReg);
  
  Serial.println("\nRegister Values:");
  Serial.printf("Command Register (0x01): 0x%02X\n", command);
  Serial.printf("Mode Register (0x11): 0x%02X\n", mode);
  Serial.printf("TxControl Register (0x14): 0x%02X\n", txControl);
  
  if (v == 0x91 || v == 0x92) {
    Serial.println("\nMFRC522 detected successfully!");
    beep(100);
    delay(100);
    beep(100);  // Double beep for success
  } else {
    Serial.println("\nWARNING: Unknown version or no MFRC522 detected");
    Serial.println("Check your wiring:");
    Serial.println(" - RST -> GPIO4");
    Serial.println(" - SDA -> GPIO5");
    Serial.println(" - MOSI -> GPIO23");
    Serial.println(" - MISO -> GPIO19");
    Serial.println(" - SCK -> GPIO18");
    Serial.println(" - 3.3V and GND connected");
    Serial.println("\nTroubleshooting steps:");
    Serial.println("1. Verify power supply is 3.3V");
    Serial.println("2. Check all connections are secure");
    Serial.println("3. Try a different RFID module if available");
    Serial.println("4. Check if module is damaged");
    
    // Error pattern: three short beeps
    beep(50);
    delay(50);
    beep(50);
    delay(50);
    beep(50);
  }
  
  Serial.println("\nReady to scan cards!");
  Serial.println("Place a card near the reader...");
}

void loop() {
  // Clear any old card data
  if (mfrc522.PICC_IsNewCardPresent()) {
    Serial.println("\nCard detected!");
    beep(200);  // Longer beep for card detection
    
    if (mfrc522.PICC_ReadCardSerial()) {
      Serial.print("Card UID: ");
      for (byte i = 0; i < mfrc522.uid.size; i++) {
        Serial.print(mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " ");
        Serial.print(mfrc522.uid.uidByte[i], HEX);
      }
      Serial.println();
      
      // Get card type
      MFRC522::PICC_Type piccType = mfrc522.PICC_GetType(mfrc522.uid.sak);
      Serial.print("Card type: ");
      Serial.println(mfrc522.PICC_GetTypeName(piccType));
      
      // Halt PICC and stop encryption
      mfrc522.PICC_HaltA();
      mfrc522.PCD_StopCrypto1();
    }
  }
  
  // Print a dot every second to show the program is running
  static unsigned long lastDot = 0;
  if (millis() - lastDot >= 1000) {
    Serial.print(".");
    lastDot = millis();
  }
}

void beep(int duration) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(duration);
  digitalWrite(BUZZER_PIN, LOW);
} 