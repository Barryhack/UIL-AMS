#ifndef WebSocketHandler_h
#define WebSocketHandler_h

#include <WebSocketsClient.h>
#include "config.h"

class WebSocketHandler {
public:
    static bool begin();
    static void end();
    static void loop();
    static void sendMessage(const char* message);
    static void broadcastMessage(const char* message);
    static bool isConnected();
    
private:
    static WebSocketsClient* webSocket;
    static bool initialized;
    static bool wasConnected;
    static unsigned long lastPing;
    
    static void webSocketEvent(WStype_t type, uint8_t* payload, size_t length);
    static void handleFingerprint(uint8_t* payload, size_t length);
    static void handleRFID(uint8_t* payload, size_t length);
    static void handleSync(uint8_t* payload, size_t length);
    static void sendPing();
    static void onConnected();
    static void onDisconnected();
};

#endif 