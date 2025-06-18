#include "RFIDHandler.h"

// Initialize static members
MFRC522 RFIDHandler::mfrc522(SS_PIN, RST_PIN);

bool RFIDHandler::begin() {
    Serial.println("\nInitializing RFID Handler...");
    
    // Print pin configuration
    Serial.println("Pin Configuration:");
    Serial.println(" - RST:   GPIO" + String(RST_PIN));
    Serial.println(" - SS:    GPIO" + String(SS_PIN));
    Serial.println(" - MOSI:  GPIO23");
    Serial.println(" - MISO:  GPIO19");
    Serial.println(" - SCK:   GPIO18");
    Serial.println(" - BUZZER: GPIO" + String(BUZZER_PIN));
    
    // Initialize SPI bus with explicit pins
    SPI.end(); // End any previous SPI connection
    delay(100);
    
    Serial.println("\nInitializing SPI bus...");
    SPI.begin(18, 19, 23, SS_PIN); // SCK, MISO, MOSI, SS
    delay(100);
    Serial.println("SPI bus initialized");
    
    // Initialize MFRC522
    Serial.println("Initializing MFRC522...");
    mfrc522.PCD_Init();
    delay(100);
    
    // Test if MFRC522 is responding
    byte version = mfrc522.PCD_ReadRegister(MFRC522::VersionReg);
    Serial.print("\nMFRC522 Firmware Version: 0x");
    Serial.println(version, HEX);
    
    if (version == 0x00 || version == 0xFF) {
        Serial.println("Warning: Invalid version. Check your connections!");
        return false;
    }
    
    // Setup buzzer pin
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW);
    Serial.println("Buzzer pin initialized");
    
    // Test buzzer
    Serial.println("Testing buzzer...");
    beep(500);  // Longer initial test beep
    Serial.println("Buzzer test complete");
    
    // Additional initialization steps
    Serial.println("\nConfiguring MFRC522...");
    
    // Reset MFRC522
    mfrc522.PCD_Reset();
    delay(50);
    
    // Configure MFRC522
    mfrc522.PCD_SetAntennaGain(MFRC522::RxGain_max);
    Serial.println("Antenna gain set to maximum");
    
    // Configure the internal timer
    mfrc522.PCD_WriteRegister(MFRC522::TModeReg, 0x80);    // TAuto=1; timer starts automatically
    mfrc522.PCD_WriteRegister(MFRC522::TPrescalerReg, 0xA9);   // TPreScaler = TModeReg[3..0]:TPrescalerReg
    mfrc522.PCD_WriteRegister(MFRC522::TReloadRegH, 0x03);    // Reload timer
    mfrc522.PCD_WriteRegister(MFRC522::TReloadRegL, 0xE8);
    Serial.println("Timer configured");
    
    // Configure modulation and CRC
    mfrc522.PCD_WriteRegister(MFRC522::TxASKReg, 0x40);     // Force 100% ASK modulation
    mfrc522.PCD_WriteRegister(MFRC522::ModeReg, 0x3D);      // CRC Initial value 0x6363
    Serial.println("Modulation and CRC configured");
    
    // Turn on the antenna
    mfrc522.PCD_AntennaOn();
    delay(50);
    
    // Check antenna power
    if (mfrc522.PCD_ReadRegister(MFRC522::TxControlReg) & 0x03) {
        Serial.println("Antenna is ON");
    } else {
        Serial.println("WARNING: Antenna is OFF!");
    }
    
    // Print key register values
    Serial.println("\nKey Register Values:");
    Serial.print("Command Reg: 0x");
    Serial.println(mfrc522.PCD_ReadRegister(MFRC522::CommandReg), HEX);
    Serial.print("Control Reg: 0x");
    Serial.println(mfrc522.PCD_ReadRegister(MFRC522::ControlReg), HEX);
    Serial.print("Status1 Reg: 0x");
    Serial.println(mfrc522.PCD_ReadRegister(MFRC522::Status1Reg), HEX);
    Serial.print("Status2 Reg: 0x");
    Serial.println(mfrc522.PCD_ReadRegister(MFRC522::Status2Reg), HEX);
    Serial.print("FIFO Level Reg: 0x");
    Serial.println(mfrc522.PCD_ReadRegister(MFRC522::FIFOLevelReg), HEX);
    
    Serial.println("\nMFRC522 initialization complete!");
    Serial.println("Ready to detect cards.");
    return true;
}

void RFIDHandler::end() {
    mfrc522.PCD_AntennaOff();
    mfrc522.PCD_SoftPowerDown();
    SPI.end();
}

bool RFIDHandler::isCardPresent() {
    if (!mfrc522.PICC_IsNewCardPresent()) {
        return false;
    }
    
    if (!mfrc522.PICC_ReadCardSerial()) {
        return false;
    }
    
    Serial.println("Card detected!");
    return true;
}

String RFIDHandler::readCardID() {
    String cardID = "";
    
    for (byte i = 0; i < mfrc522.uid.size; i++) {
        if (mfrc522.uid.uidByte[i] < 0x10) {
            cardID += "0";
        }
        cardID += String(mfrc522.uid.uidByte[i], HEX);
    }
    cardID.toUpperCase();
    
    beep(); // Beep to indicate successful read
    mfrc522.PICC_HaltA(); // Stop reading
    
    return cardID;
}

bool RFIDHandler::writeCardData(String data) {
    if (!authenticateCard()) {
        return false;
    }
    
    byte buffer[16];
    memset(buffer, 0, 16); // Clear buffer
    
    // Convert String to bytes (max 16 bytes)
    size_t maxLength = 16;
    size_t dataLength = static_cast<size_t>(data.length() + 1);
    size_t bytesToWrite = (dataLength < maxLength) ? dataLength : maxLength;
    
    data.getBytes(buffer, bytesToWrite);
    
    // Write to block 4 (first data block in first sector)
    MFRC522::StatusCode status = mfrc522.MIFARE_Write(4, buffer, 16);
    
    if (status != MFRC522::STATUS_OK) {
        Serial.println("Write failed");
        mfrc522.PICC_HaltA();
        return false;
    }
    
    beep(200); // Longer beep for write operation
    mfrc522.PICC_HaltA();
    return true;
}

String RFIDHandler::readCardData() {
    if (!authenticateCard()) {
        return "";
    }
    
    byte buffer[18];
    byte size = sizeof(buffer);
    
    // Read block 4
    MFRC522::StatusCode status = mfrc522.MIFARE_Read(4, buffer, &size);
    
    if (status != MFRC522::STATUS_OK) {
        Serial.println("Read failed");
        mfrc522.PICC_HaltA();
        return "";
    }
    
    String result = "";
    for (byte i = 0; i < 16; i++) {
        if (buffer[i] == 0) break; // Stop at null terminator
        result += (char)buffer[i];
    }
    
    beep(); // Beep to indicate successful read
    mfrc522.PICC_HaltA();
    return result;
}

void RFIDHandler::beep(unsigned int duration) {
    Serial.println("Beeping buzzer...");
    for(int i = 0; i < 3; i++) {  // Triple beep for better audibility
        digitalWrite(BUZZER_PIN, HIGH);
        delay(duration);
        digitalWrite(BUZZER_PIN, LOW);
        delay(50);  // Short pause between beeps
    }
    Serial.println("Beep complete");
}

bool RFIDHandler::authenticateCard() {
    MFRC522::MIFARE_Key key;
    for (byte i = 0; i < 6; i++) key.keyByte[i] = 0xFF;
    
    // Authenticate using key A
    MFRC522::StatusCode status = mfrc522.PCD_Authenticate(
        MFRC522::PICC_CMD_MF_AUTH_KEY_A,
        4, // Block to authenticate
        &key,
        &(mfrc522.uid)
    );
    
    if (status != MFRC522::STATUS_OK) {
        Serial.println("Authentication failed");
        mfrc522.PICC_HaltA();
        return false;
    }
    
    return true;
} 