#include "WebSocketHandler.h"
#include "DisplayHandler.h"
#include "FingerprintHandler.h"
#include "RFIDHandler.h"
#include "APIHandler.h"
#include <ArduinoJson.h>
#include <WebSocketsClient.h>

WebSocketsClient* WebSocketHandler::webSocket = nullptr;
bool WebSocketHandler::initialized = false;
bool WebSocketHandler::wasConnected = false;
unsigned long WebSocketHandler::lastPing = 0;
const unsigned long PING_INTERVAL = 25000; // Send ping every 25 seconds
const unsigned long CONNECTION_TIMEOUT = 10000; // 10 seconds connection timeout

bool WebSocketHandler::begin() {
    if (initialized) return true;
    
    Serial.println("\nInitializing WebSocket connection...");
    DisplayHandler::showMessage("Server", "Connecting to", SERVER_URL);
    
    webSocket = new WebSocketsClient();
    
    // Connect to the web app's WebSocket server
    String wsUrl = String(SERVER_URL);
    wsUrl.replace("http://", "");  // Remove http:// if present
    wsUrl.replace("/api", "");     // Remove /api if present
    
    // Extract host and port
    int colonPos = wsUrl.indexOf(':');
    String host = colonPos > 0 ? wsUrl.substring(0, colonPos) : wsUrl;
    int port = colonPos > 0 ? wsUrl.substring(colonPos + 1).toInt() : 3000;
    
    Serial.println("WebSocket settings:");
    Serial.printf("Host: %s\n", host.c_str());
    Serial.printf("Port: %d\n", port);
    
    // Configure WebSocket client with basic settings
    webSocket->begin(host.c_str(), port, "/ws");
    webSocket->onEvent(webSocketEvent);
    webSocket->setReconnectInterval(5000);
    
    // Set only essential headers
    String headers = "x-device-id: " + WiFi.macAddress();
    webSocket->setExtraHeaders(headers.c_str());
    
    // Disable any compression or extensions
    webSocket->disableHeartbeat();
    webSocket->enableHeartbeat(0, 0, 0);  // Completely disable heartbeat
    
    // Wait for initial connection
    unsigned long startTime = millis();
    while (!webSocket->isConnected() && (millis() - startTime < CONNECTION_TIMEOUT)) {
        webSocket->loop();
        delay(100);
    }
    
    initialized = true;
    Serial.println("WebSocket client initialized");
    return true;
}

void WebSocketHandler::end() {
    if (webSocket) {
        webSocket->disconnect();
        delete webSocket;
        webSocket = nullptr;
    }
    initialized = false;
    wasConnected = false;
}

void WebSocketHandler::loop() {
    if (!initialized || !webSocket) return;
    
    webSocket->loop();
    
    // Handle connection state changes
    bool isConnected = webSocket->isConnected();
    if (isConnected && !wasConnected) {
        // Just connected
        onConnected();
    } else if (!isConnected && wasConnected) {
        // Just disconnected
        onDisconnected();
    }
    wasConnected = isConnected;
    
    // Send periodic ping if connected
    if (isConnected && (millis() - lastPing >= PING_INTERVAL)) {
        sendPing();
    }
}

void WebSocketHandler::sendPing() {
    if (!initialized || !webSocket || !webSocket->isConnected()) return;
    
    // Send a simple ping message
    webSocket->sendTXT("{\"type\":\"ping\"}");
    lastPing = millis();
}

void WebSocketHandler::onConnected() {
    Serial.println("\nWebSocket connected!");
    Serial.println("Connection details:");
    Serial.printf("Server: %s\n", SERVER_URL);
    Serial.printf("Port: %d\n", 3000);
    
    DisplayHandler::showMessage("WebSocket", "Connected!", SERVER_URL);
    
    // Send initial hello message with device ID
    StaticJsonDocument<200> doc;
    doc["type"] = "hello";
    doc["deviceId"] = WiFi.macAddress();
    
    String helloMsg;
    serializeJson(doc, helloMsg);
    sendMessage(helloMsg.c_str());
}

void WebSocketHandler::onDisconnected() {
    Serial.println("\nWebSocket disconnected");
    Serial.println("Last known state:");
    Serial.printf("Server: %s\n", SERVER_URL);
    Serial.printf("Port: %d\n", 3000);
    
    DisplayHandler::showMessage("WebSocket", "Disconnected", "Retrying...");
}

void WebSocketHandler::sendMessage(const char* message) {
    if (!initialized || !webSocket) return;
    
    if (!webSocket->isConnected()) {
        Serial.println("Cannot send message: WebSocket not connected");
        return;
    }
    
    // Send raw text without any formatting
    webSocket->sendTXT(message, strlen(message));
}

void WebSocketHandler::broadcastMessage(const char* message) {
    sendMessage(message);  // In client mode, just send the message
}

bool WebSocketHandler::isConnected() {
    return initialized && webSocket && webSocket->isConnected();
}

void WebSocketHandler::webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
    switch (type) {
        case WStype_DISCONNECTED:
            Serial.println("WebSocket disconnected");
            DisplayHandler::showMessage("Server disconnected");
            break;
            
        case WStype_CONNECTED:
            Serial.println("WebSocket connected");
            DisplayHandler::showMessage("Server connected");
            break;
            
        case WStype_TEXT: {
            if (length == 0) return;
            
            Serial.println("Received WebSocket message");
            StaticJsonDocument<200> doc;
            DeserializationError error = deserializeJson(doc, (char*)payload);
            
            if (error) {
                sendMessage("{\"error\": \"Invalid JSON\"}");
                return;
            }
            
            const char* command = doc["command"];
            if (!command) {
                sendMessage("{\"error\": \"Missing command\"}");
                return;
            }
            
            Serial.print("Processing command: ");
            Serial.println(command);
            
            if (strcmp(command, "fingerprint") == 0) {
                handleFingerprint((uint8_t*)payload, length);
            }
            else if (strcmp(command, "rfid") == 0) {
                handleRFID((uint8_t*)payload, length);
            }
            else if (strcmp(command, "sync") == 0) {
                handleSync((uint8_t*)payload, length);
            }
            else {
                sendMessage("{\"error\": \"Unknown command\"}");
            }
            break;
        }
            
        default:
            break;
    }
}

void WebSocketHandler::handleFingerprint(uint8_t* payload, size_t length) {
    StaticJsonDocument<200> doc;
    deserializeJson(doc, payload, length);
    
    const char* action = doc["action"];
    if (!action) {
        sendMessage("{\"error\": \"Missing action\"}");
        return;
    }
    
    if (strcmp(action, "scan") == 0) {
        DisplayHandler::showMessage("Place finger on\nsensor...");
        int fingerprintID = FingerprintHandler::scanFingerprint();
        if (fingerprintID >= 0) {
            DisplayHandler::showMessage("Fingerprint\nscanned!");
            char response[50];
            snprintf(response, sizeof(response), "{\"success\": true, \"id\": %d}", fingerprintID);
            sendMessage(response);
        } else {
            DisplayHandler::showError("Scan failed!");
            sendMessage("{\"error\": \"Scan failed\"}");
        }
    }
    else if (strcmp(action, "enroll") == 0) {
        uint16_t id = doc["id"] | 0;
        if (id == 0) {
            sendMessage("{\"error\": \"Invalid ID\"}");
            return;
        }
        
        DisplayHandler::showMessage("Enrolling new\nfingerprint...");
        if (FingerprintHandler::enrollFingerprint(id)) {
            DisplayHandler::showMessage("Enrollment\nsuccessful!");
            sendMessage("{\"success\": true}");
        } else {
            DisplayHandler::showError("Enrollment\nfailed!");
            sendMessage("{\"error\": \"Enrollment failed\"}");
        }
    }
}

void WebSocketHandler::handleRFID(uint8_t* payload, size_t length) {
    StaticJsonDocument<200> doc;
    deserializeJson(doc, payload, length);
    
    const char* action = doc["action"];
    if (!action) {
        sendMessage("{\"error\": \"Missing action\"}");
        return;
    }
    
    if (strcmp(action, "scan") == 0) {
        DisplayHandler::showMessage("Place RFID card\nnear reader...");
        String cardID = RFIDHandler::readCardID();
        if (cardID.length() > 0) {
            DisplayHandler::showMessage("Card scanned!");
            char response[100];
            snprintf(response, sizeof(response), "{\"success\": true, \"cardId\": \"%s\"}", cardID.c_str());
            sendMessage(response);
        } else {
            DisplayHandler::showError("No card found!");
            sendMessage("{\"error\": \"No card present\"}");
        }
    }
}

void WebSocketHandler::handleSync(uint8_t* payload, size_t length) {
    if (APIHandler::syncLocalToServer()) {
        sendMessage("{\"success\": true}");
    } else {
        sendMessage("{\"error\": \"Sync failed\"}");
    }
} 