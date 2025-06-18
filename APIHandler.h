#ifndef APIHANDLER_H
#define APIHANDLER_H

#include <Arduino.h>
#include <HTTPClient.h>

class APIHandler {
private:
    static const char* API_BASE_URL;
    static const char* DEVICE_ID;
    
    static String makeRequest(const char* endpoint, const char* method, const char* body);

public:
    static bool sendHeartbeat();
    static bool updateStatus(const char* status, const char* details);
    static bool executeCommand(const char* command, const char* params);
};

#endif // APIHANDLER_H 