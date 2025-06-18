#include "WiFiHandler.h"
#include "BuzzerHandler.h"
#include "DisplayHandler.h"
#include "SystemConfig.h"

extern BuzzerHandler* buzzerHandler;
extern DisplayHandler* displayHandler;

WiFiHandler::WiFiHandler(const char* wifiSSID, const char* wifiPassword) 
  : ssid(wifiSSID), password(wifiPassword), connected(false), 
    lastConnectionCheck(0), reconnectAttempts(0) {}

bool WiFiHandler::init() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  Serial.print("Connecting to WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    connected = true;
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    
    if (buzzerHandler) buzzerHandler->playNetworkConnected();
    if (displayHandler) displayHandler->showMessage("WiFi Connected", WiFi.localIP().toString());
    
    return true;
  } else {
    connected = false;
    Serial.println("\nWiFi connection failed - running offline");
    
    if (buzzerHandler) buzzerHandler->playNetworkDisconnected();
    if (displayHandler) displayHandler->showMessage("Offline Mode", "No WiFi connection");
    
    return false;
  }
}

void WiFiHandler::update() {
  // Check connection every 10 seconds
  if (millis() - lastConnectionCheck > 10000) {
    bool wasConnected = connected;
    connected = (WiFi.status() == WL_CONNECTED);
    
    if (!wasConnected && connected) {
      handleConnectionRestored();
    } else if (wasConnected && !connected) {
      handleConnectionLost();
    }
    
    // Try to reconnect if disconnected
    if (!connected && reconnectAttempts < 3) {
      Serial.println("Attempting to reconnect...");
      WiFi.reconnect();
      reconnectAttempts++;
    }
    
    lastConnectionCheck = millis();
  }
}

bool WiFiHandler::isConnected() {
  return connected;
}

int WiFiHandler::getSignalStrength() {
  return WiFi.RSSI();
}

String WiFiHandler::getIPAddress() {
  return WiFi.localIP().toString();
}

String WiFiHandler::getMACAddress() {
  return WiFi.macAddress();
}

bool WiFiHandler::sendHTTPRequest(String url, String payload, String& response) {
  if (!connected) return false;
  
  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST(payload);
  
  if (httpResponseCode == 200) {
    response = http.getString();
    http.end();
    return true;
  } else {
    Serial.println("HTTP request failed: " + String(httpResponseCode));
    http.end();
    return false;
  }
}

void WiFiHandler::handleConnectionLost() {
  Serial.println("WiFi connection lost");
  reconnectAttempts = 0;
  
  if (buzzerHandler) buzzerHandler->playNetworkDisconnected();
  if (displayHandler) displayHandler->showMessage("Offline Mode", "Connection lost");
}

void WiFiHandler::handleConnectionRestored() {
  Serial.println("WiFi connection restored");
  reconnectAttempts = 0;
  
  if (buzzerHandler) buzzerHandler->playNetworkConnected();
  if (displayHandler) displayHandler->showMessage("Online", "Connection restored");
}
