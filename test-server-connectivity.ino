#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// WiFi credentials
const char* ssid = "Galaxy S20 FE 35AF";
const char* password = "ollk2898";

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("=== Server Connectivity Test ===");
  
  // Connect to WiFi
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    
    // Test 1: Simple HTTP GET to a known working site
    Serial.println("\n--- Test 1: HTTP to httpbin.org ---");
    testHTTP("http://httpbin.org/get");
    
    // Test 2: HTTPS to httpbin.org
    Serial.println("\n--- Test 2: HTTPS to httpbin.org ---");
    testHTTPS("https://httpbin.org/get");
    
    // Test 3: HTTP to your server
    Serial.println("\n--- Test 3: HTTP to your server ---");
    testHTTP("http://unilorin-ams.onrender.com/");
    
    // Test 4: HTTPS to your server
    Serial.println("\n--- Test 4: HTTPS to your server ---");
    testHTTPS("https://unilorin-ams.onrender.com/");
    
    // Test 5: Direct IP test (if we can get it)
    Serial.println("\n--- Test 5: DNS resolution test ---");
    testDNS();
    
  } else {
    Serial.println("\nWiFi connection failed!");
  }
}

void loop() {
  delay(10000);
  Serial.println("Test complete. Restart to run again.");
}

void testHTTP(const char* url) {
  HTTPClient http;
  Serial.print("Testing: ");
  Serial.println(url);
  
  http.begin(url);
  http.setTimeout(10000);
  
  int httpCode = http.GET();
  Serial.print("HTTP Response code: ");
  Serial.println(httpCode);
  
  if (httpCode > 0) {
    String payload = http.getString();
    Serial.print("Response: ");
    Serial.println(payload.substring(0, 200)); // First 200 chars
  } else {
    Serial.print("Error: ");
    Serial.println(http.errorToString(httpCode));
  }
  
  http.end();
  delay(2000);
}

void testHTTPS(const char* url) {
  HTTPClient http;
  WiFiClientSecure client;
  
  Serial.print("Testing: ");
  Serial.println(url);
  
  // Try with insecure SSL first
  client.setInsecure();
  client.setTimeout(10000);
  
  if (!http.begin(client, url)) {
    Serial.println("HTTP begin failed");
    return;
  }
  
  http.setTimeout(10000);
  int httpCode = http.GET();
  
  Serial.print("HTTPS Response code: ");
  Serial.println(httpCode);
  
  if (httpCode > 0) {
    String payload = http.getString();
    Serial.print("Response: ");
    Serial.println(payload.substring(0, 200)); // First 200 chars
  } else {
    Serial.print("Error: ");
    Serial.println(http.errorToString(httpCode));
  }
  
  http.end();
  delay(2000);
}

void testDNS() {
  Serial.println("Testing DNS resolution...");
  
  IPAddress ip;
  if (WiFi.hostByName("unilorin-ams.onrender.com", ip)) {
    Serial.print("DNS resolved: ");
    Serial.println(ip);
  } else {
    Serial.println("DNS resolution failed!");
  }
  
  if (WiFi.hostByName("unilorin-ams-ws-server.onrender.com", ip)) {
    Serial.print("WebSocket server DNS resolved: ");
    Serial.println(ip);
  } else {
    Serial.println("WebSocket server DNS resolution failed!");
  }
} 