#include <WiFi.h>
#include <HTTPClient.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "RFIDHandler.h"

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Network credentials
const char* ssid = "Unilorin.Cloud";
const char* password = "3ncrypti0n123";

// Server configuration
const char* serverHost = "172.27.244.167";  // Your new IP address
const int serverPort = 3000;
const char* apiKey = "local-development-key";  // From your .env file
String deviceId;  // Will be set to MAC address
String macAddress;

// Global objects
WebSocketsClient webSocket;
bool wsConnected = false;

// WiFi and WebSocket settings
const unsigned long WIFI_TIMEOUT = 30000;  // 30 seconds
const unsigned long WIFI_RETRY_DELAY = 5000;
const int MAX_WIFI_RETRIES = 3;
const unsigned long WS_RECONNECT_INTERVAL = 5000;  // 5 seconds
unsigned long wifiStartTime = 0;
int wifiRetryCount = 0;
unsigned long lastWsReconnectAttempt = 0;

void displayInit() {
    Wire.begin(21, 22);  // SDA, SCL
    
    if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
        Serial.println(F("SSD1306 allocation failed"));
        return;
    }
    
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.cp437(true);
    
    // Show initial boot message
    display.clearDisplay();
    display.setCursor(0,0);
    display.println(F("Initializing..."));
    display.display();
    delay(1000);
}

void updateDisplay(const char* line1 = "", const char* line2 = "", const char* line3 = "", const char* line4 = "") {
    display.clearDisplay();
    display.setCursor(0,0);
    
    if (strlen(line1) > 0) {
        display.println(line1);
    }
    if (strlen(line2) > 0) {
        display.println(line2);
    }
    if (strlen(line3) > 0) {
        display.println(line3);
    }
    if (strlen(line4) > 0) {
        display.println(line4);
    }
    
    display.display();
}

void setup() {
    Serial.begin(115200);
    delay(3000);
    
    Serial.println("\n=== RFID Handler Class Test ===");
    Serial.println("If you see this message, serial is working correctly!");
    
    // Initialize OLED
    displayInit();
    updateDisplay("Starting up...", "Initializing", "WiFi connection");
    
    initializeWiFi();
    
    if (WiFi.status() == WL_CONNECTED) {
        macAddress = WiFi.macAddress();
        deviceId = macAddress;
        
        String ipAddr = WiFi.localIP().toString();
        updateDisplay("WiFi Connected", ipAddr.c_str(), macAddress.c_str());
        delay(2000);
        
        initializeRFID();
        initializeWebSocket();
    }
}

void initializeWiFi() {
  Serial.println("\nPreparing WiFi connection...");
  
  // Disconnect from any previous WiFi
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  delay(1000);
  
  // Set WiFi mode
  WiFi.mode(WIFI_STA);
  delay(1000);
  
  Serial.println("WiFi settings:");
  Serial.print("SSID: ");
  Serial.println(ssid);
  Serial.print("Password length: ");
  Serial.println(strlen(password));
  
  wifiRetryCount = 0;
  while (wifiRetryCount < MAX_WIFI_RETRIES) {
    Serial.printf("\nAttempting WiFi connection (Attempt %d of %d)...\n", wifiRetryCount + 1, MAX_WIFI_RETRIES);
    
    WiFi.begin(ssid, password);
    wifiStartTime = millis();
    
    // Wait for connection or timeout
    while (WiFi.status() != WL_CONNECTED && (millis() - wifiStartTime < WIFI_TIMEOUT)) {
      delay(500);
      Serial.print(".");
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\nWiFi connected successfully!");
      Serial.print("IP address: ");
      Serial.println(WiFi.localIP());
      Serial.print("Signal strength (RSSI): ");
      Serial.print(WiFi.RSSI());
      Serial.println(" dBm");
      return;
    }
    
    // If we get here, connection failed
    Serial.println("\nWiFi connection failed!");
    Serial.print("Status code: ");
    Serial.println(WiFi.status());
    
    switch (WiFi.status()) {
      case WL_NO_SSID_AVAIL:
        Serial.println("SSID not found");
        break;
      case WL_CONNECT_FAILED:
        Serial.println("Wrong password");
        break;
      case WL_IDLE_STATUS:
        Serial.println("WiFi idle");
        break;
      default:
        Serial.println("Unknown error");
        break;
    }
    
    wifiRetryCount++;
    if (wifiRetryCount < MAX_WIFI_RETRIES) {
      Serial.printf("Waiting %d seconds before retry...\n", WIFI_RETRY_DELAY/1000);
      delay(WIFI_RETRY_DELAY);
    }
  }
  
  Serial.println("\nFailed to connect to WiFi after all retries!");
  Serial.println("Please check your WiFi credentials and signal strength.");
  Serial.println("Restarting ESP32...");
  delay(3000);
  ESP.restart();
}

void initializeRFID() {
  Serial.println("\n1. Initializing RFID Handler...");
  if (RFIDHandler::begin()) {
    Serial.println("   SUCCESS: RFID Handler initialized!");
  } else {
    Serial.println("   ERROR: RFID Handler initialization failed!");
    Serial.println("   Check your connections:");
    Serial.println("   - RST -> GPIO4");
    Serial.println("   - SDA -> GPIO5");
    Serial.println("   - MOSI -> GPIO23");
    Serial.println("   - MISO -> GPIO19");
    Serial.println("   - SCK -> GPIO18");
    Serial.println("   - 3.3V and GND connected");
    Serial.println("\nRestarting in 5 seconds...");
    delay(5000);
    ESP.restart();
  }
}

void initializeWebSocket() {
    Serial.println("\nInitializing WebSocket connection...");
    updateDisplay("Connecting to", "Server...", serverHost);
    
    Serial.print("Server: ");
    Serial.println(serverHost);
    Serial.print("Port: ");
    Serial.println(serverPort);
    
    // Initialize WebSocket with correct path
    String wsPath = "/ws";
    Serial.print("WebSocket Path: ");
    Serial.println(wsPath);
    
    // Use non-SSL connection
    webSocket.begin(serverHost, serverPort, wsPath);
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(5000);  // 5 seconds
    
    // Set WebSocket headers
    String headers = "x-api-key: " + String(apiKey) + "\r\n";
    headers += "x-device-id: " + deviceId + "\r\n";
    headers += "x-mac-address: " + macAddress + "\r\n";
    
    Serial.println("Headers being sent:");
    Serial.println(headers);
    
    webSocket.setExtraHeaders(headers.c_str());
    
    // Enable more debug output with shorter intervals
    webSocket.enableHeartbeat(5000, 3000, 2);
    Serial.println("WebSocket initialization complete");
}

void loop() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("\nWiFi connection lost!");
        updateDisplay("Error", "WiFi Lost", "Reconnecting...");
        initializeWiFi();
        return;
    }

    webSocket.loop();
    
    // Check server connection periodically
    static unsigned long lastCheck = 0;
    static unsigned long lastReconnectAttempt = 0;
    unsigned long currentMillis = millis();
    
    // Try to reconnect WebSocket every 10 seconds if disconnected
    if (!wsConnected && (currentMillis - lastReconnectAttempt >= 10000)) {
        lastReconnectAttempt = currentMillis;
        Serial.println("\nAttempting WebSocket reconnection...");
        
        // Check if server is reachable first
        HTTPClient http;
        String url = String("http://") + serverHost + ":" + serverPort + "/api/ping";
        http.begin(url);
        int httpCode = http.GET();
        
        if (httpCode == 200) {
            Serial.println("Server is reachable, attempting WebSocket connection");
            webSocket.begin(serverHost, serverPort, "/ws");
        } else {
            Serial.printf("Server not reachable (HTTP %d), waiting before retry\n", httpCode);
            updateDisplay("Server Error", String(httpCode).c_str(), "Waiting...");
        }
        
        http.end();
    }
    
    // Check server connection every 30 seconds
    if (currentMillis - lastCheck > 30000) {
        lastCheck = currentMillis;
        checkServerConnection();
    }
    
    // Check for serial commands
    if (Serial.available()) {
        char cmd = Serial.read();
        switch (cmd) {
            case 'w':
                writeTest();
                break;
            case 'r':
                readTest();
                break;
            case 'q':
                RFIDHandler::end();
                updateDisplay("System", "Shutting down...");
                Serial.println("Test ended.");
                while(1) {}
                break;
        }
    }
    
    // Check for cards
    if (RFIDHandler::isCardPresent()) {
        String uid = RFIDHandler::readCardID();
        Serial.print("\nCard detected! UID: ");
        Serial.println(uid);
        
        // Update display with card info
        updateDisplay("Card Detected!", uid.c_str(), wsConnected ? "Sending..." : "Offline");
        
        if (wsConnected) {
            DynamicJsonDocument doc(200);
            doc["type"] = "rfid_scan";
            doc["uid"] = uid;
            doc["deviceId"] = deviceId;
            doc["timestamp"] = millis();
            String jsonString;
            serializeJson(doc, jsonString);
            
            if (webSocket.sendTXT(jsonString)) {
                Serial.println("Card data sent to server successfully");
                updateDisplay("Card Detected!", uid.c_str(), "Data Sent", "Successfully");
            } else {
                Serial.println("Failed to send card data to server");
                updateDisplay("Card Detected!", uid.c_str(), "Send Failed", "Check connection");
            }
        } else {
            Serial.println("WebSocket not connected - card data not sent");
            updateDisplay("Card Detected!", uid.c_str(), "Offline Mode", "Can't send data");
            // Try to reconnect WebSocket
            if (millis() - lastWsReconnectAttempt > WS_RECONNECT_INTERVAL) {
                Serial.println("Attempting to reconnect WebSocket...");
                initializeWebSocket();
            }
        }
        delay(2000);  // Show the result for 2 seconds
    }
    
    // Update status display periodically
    static unsigned long lastDisplayUpdate = 0;
    if (millis() - lastDisplayUpdate >= 5000) {  // Update every 5 seconds
        String status = wsConnected ? "Connected" : "Offline";
        String ip = WiFi.localIP().toString();
        updateDisplay("RFID Reader", status.c_str(), ip.c_str(), "Waiting for card...");
        lastDisplayUpdate = millis();
    }
    
    // Print a dot every second to show the program is running
    static unsigned long lastDot = 0;
    if (millis() - lastDot >= 1000) {
        if (wsConnected) {
            Serial.print("+");  // Connected
        } else {
            Serial.print(".");  // Not connected
        }
        lastDot = millis();
    }
}

void checkServerConnection() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi disconnected. Reconnecting...");
        updateDisplay("Error", "WiFi Lost", "Reconnecting...");
        WiFi.begin(ssid, password);
        return;
    }
    
    HTTPClient http;
    String url = String("http://") + serverHost + ":" + serverPort + "/api/ping";
    
    http.begin(url);
    http.addHeader("x-api-key", apiKey);
    http.addHeader("x-device-id", deviceId);
    http.addHeader("x-mac-address", macAddress);
    
    Serial.print("\nChecking server connection: ");
    Serial.println(url);
    updateDisplay("Checking Server", url.c_str());
    
    int httpCode = http.GET();
    String payload = http.getString();
    
    Serial.print("HTTP Response code: ");
    Serial.println(httpCode);
    Serial.print("Response: ");
    Serial.println(payload);
    
    if (httpCode == 200) {
        Serial.println("Server connection OK");
        updateDisplay("Server Status", "Connected", url.c_str());
    } else {
        String error = "HTTP Error: " + String(httpCode);
        Serial.printf("Server connection failed: %d\n", httpCode);
        Serial.println("Please check:");
        Serial.println("1. Server is running");
        Serial.println("2. IP address is correct");
        Serial.println("3. Port 3000 is open");
        Serial.println("4. No firewall blocking");
        
        updateDisplay("Server Error", error.c_str(), "Check Config");
    }
    
    http.end();
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_DISCONNECTED: {
            wsConnected = false;
            Serial.println("\nWebSocket disconnected");
            Serial.println("Last known state:");
            Serial.print("Server: ");
            Serial.println(serverHost);
            Serial.print("Port: ");
            Serial.println(serverPort);
            updateDisplay("WebSocket", "Disconnected", "Retrying...");
            break;
        }
            
        case WStype_CONNECTED: {
            wsConnected = true;
            Serial.println("\nWebSocket connected!");
            Serial.println("Connection details:");
            Serial.print("Server: ");
            Serial.println(serverHost);
            Serial.print("Port: ");
            Serial.println(serverPort);
            updateDisplay("WebSocket", "Connected!", serverHost);
            
            // Send test message
            String testMsg = "{\"type\":\"hello\",\"deviceId\":\"" + deviceId + "\"}";
            Serial.println("Sending test message: " + testMsg);
            webSocket.sendTXT(testMsg);
            break;
        }
            
        case WStype_TEXT: {
            Serial.println("\nReceived WebSocket message:");
            Serial.println((char*)payload);
            updateDisplay("Message", "Received", (char*)payload);
            break;
        }
            
        case WStype_ERROR: {
            Serial.println("\nWebSocket error occurred");
            Serial.println("Connection details:");
            Serial.print("Server: ");
            Serial.println(serverHost);
            Serial.print("Port: ");
            Serial.println(serverPort);
            updateDisplay("WebSocket", "Error", "Check Server");
            break;
        }
            
        case WStype_PING: {
            Serial.println("\nReceived WebSocket ping");
            updateDisplay("WebSocket", "Ping", "Connection OK");
            break;
        }
            
        case WStype_PONG: {
            Serial.println("\nReceived WebSocket pong");
            updateDisplay("WebSocket", "Pong", "Connection OK");
            break;
        }
    }
}

void writeTest() {
  Serial.println("\nWrite Test:");
  Serial.println("Place a card to write test data...");
  
  unsigned long startTime = millis();
  while (millis() - startTime < 5000) {  // 5 second timeout
    if (RFIDHandler::isCardPresent()) {
      String testData = "Test " + String(millis());
      if (RFIDHandler::writeCardData(testData)) {
        Serial.print("Successfully wrote: ");
        Serial.println(testData);
      } else {
        Serial.println("Write failed!");
      }
      return;
    }
    delay(100);
  }
  Serial.println("Timeout waiting for card!");
}

void readTest() {
  Serial.println("\nRead Test:");
  Serial.println("Place a card to read data...");
  
  unsigned long startTime = millis();
  while (millis() - startTime < 5000) {  // 5 second timeout
    if (RFIDHandler::isCardPresent()) {
      String data = RFIDHandler::readCardData();
      if (data.length() > 0) {
        Serial.print("Read data: ");
        Serial.println(data);
      } else {
        Serial.println("No data read or empty block!");
      }
      return;
    }
    delay(100);
  }
  Serial.println("Timeout waiting for card!");
} 