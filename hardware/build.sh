#!/bin/bash

# Check if arduino-cli is installed
if ! command -v arduino-cli &> /dev/null; then
    echo "arduino-cli is not installed. Installing..."
    curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh
fi

# Initialize arduino-cli
arduino-cli core update-index
arduino-cli core install esp32:esp32

# Install required libraries
arduino-cli lib install "Adafruit GFX Library"
arduino-cli lib install "Adafruit SSD1306"
arduino-cli lib install "Adafruit Fingerprint Sensor Library"
arduino-cli lib install "MFRC522"
arduino-cli lib install "ArduinoJson"

# Compile the sketch
echo "Compiling AMS_Hardware.ino..."
arduino-cli compile --fqbn esp32:esp32:esp32 AMS_Hardware.ino

# Check compilation status
if [ $? -eq 0 ]; then
    echo "Compilation successful!"
    echo "To upload the code, run: arduino-cli upload -p <PORT> --fqbn esp32:esp32:esp32 AMS_Hardware.ino"
else
    echo "Compilation failed!"
fi 