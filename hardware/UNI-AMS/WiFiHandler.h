#ifndef WIFI_HANDLER_H
#define WIFI_HANDLER_H

#include <WiFi.h>
#include <HTTPClient.h>

class WiFiHandler {
private:
  const char* ssid;
  const char* password;
  bool connected;
  unsigned long lastConnectionCheck;
  unsigned long reconnectAttempts;
  
public:
  WiFiHandler(const char* wifiSSID, const char* wifiPassword);
  bool init();
  void update();
  bool isConnected();
  int getSignalStrength();
  String getIPAddress();
  String getMACAddress();
  bool sendHTTPRequest(String url, String payload, String& response);
  void handleConnectionLost();
  void handleConnectionRestored();
};

#endif
