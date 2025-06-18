#include "APIHandler.h"
#include <HTTPClient.h>
#include <ArduinoJson.h>

String APIHandler::makeRequest(const char* endpoint, const char* method, const char* body) {
    // ... existing code ...
}

bool APIHandler::sendHeartbeat() {
    StaticJsonDocument<200> doc;
    doc["device_id"] = DEVICE_ID;
    doc["status"] = "alive";
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    String endpoint = String(API_BASE_URL) + "/heartbeat";
    String response = makeRequest(endpoint.c_str(), "POST", jsonString.c_str());
    
    return response.length() > 0;
}

bool APIHandler::updateStatus(const char* status, const char* details) {
    StaticJsonDocument<200> doc;
    doc["device_id"] = DEVICE_ID;
    doc["status"] = status;
    doc["details"] = details;
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    String endpoint = String(API_BASE_URL) + "/status";
    String response = makeRequest(endpoint.c_str(), "POST", jsonString.c_str());
    
    return response.length() > 0;
} 