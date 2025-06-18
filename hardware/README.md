# Attendance Management System - Hardware

This is the hardware component of the Attendance Management System, designed to work with ESP32 microcontroller.

## Hardware Components

- ESP32 Development Board
- RFID-RC522 Module
- Fingerprint Sensor (R307)
- OLED Display (SSD1306)
- SD Card Module
- Buzzer

## Pin Configuration

### Fingerprint Module
- RX: TX2 (GPIO16)
- TX: RX2 (GPIO17)

### OLED Display
- SDA: GPIO21
- SCL: GPIO22

### Buzzer
- Pin: GPIO32

### SD Card Module
- CS: GPIO33
- MOSI: GPIO27
- MISO: GPIO27
- SCK: GPIO25

### RFID Module
- SS: GPIO5
- RST: GPIO4
- MOSI: GPIO23
- MISO: GPIO19
- SCK: GPIO18

## Required Libraries

1. SPI
2. MFRC522
3. Wire
4. Adafruit_GFX
5. Adafruit_SSD1306
6. SD
7. WiFi
8. HTTPClient
9. Adafruit_Fingerprint
10. SoftwareSerial

## Installation

1. Install the Arduino IDE
2. Install ESP32 board support in Arduino IDE
3. Install all required libraries through Arduino Library Manager
4. Open `AMS_Hardware.ino` in Arduino IDE
5. Select your ESP32 board from Tools > Board menu
6. Select the correct port from Tools > Port menu
7. Upload the code to your ESP32

## Configuration

Before uploading, make sure to:

1. Update the WiFi credentials in the code:
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

2. Update the server URL in the code:
```cpp
const char* serverUrl = "http://your-server-url/api/attendance";
```

## Features

- RFID card reading
- Fingerprint authentication
- OLED display feedback
- SD card logging
- WiFi connectivity
- Buzzer feedback
- System status monitoring

## Troubleshooting

1. If the display doesn't initialize:
   - Check the I2C connections
   - Verify the display address (default: 0x3C)

2. If the RFID module doesn't work:
   - Check the SPI connections
   - Verify the module is properly powered

3. If the fingerprint sensor doesn't respond:
   - Check the serial connections
   - Verify the sensor is properly powered
   - Make sure the baud rate is set to 57600

4. If the SD card isn't detected:
   - Check the SPI connections
   - Verify the card is properly formatted (FAT32)
   - Make sure the CS pin is correctly connected

5. If WiFi connection fails:
   - Verify the credentials
   - Check if the ESP32 is within range
   - Ensure the WiFi network is 2.4GHz (ESP32 doesn't support 5GHz)

## Logging

The system logs all events to the SD card in a file named `log.txt`. This includes:
- System startup
- Component initialization status
- Attendance records
- Error messages
- WiFi connection status

## Power Requirements

- Input Voltage: 5V
- Current Consumption: ~500mA (peak)
- Recommended Power Supply: 5V/1A or higher

## Safety Notes

1. Always power off the system before making any connections
2. Double-check all connections before powering on
3. Use appropriate power supply to avoid damage
4. Keep the system away from water and moisture
5. Handle the fingerprint sensor with care to avoid damage 