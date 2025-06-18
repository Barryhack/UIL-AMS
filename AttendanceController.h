#ifndef ATTENDANCE_CONTROLLER_H
#define ATTENDANCE_CONTROLLER_H

#include <Arduino.h>
#include "StorageHandler.h"
#include "WebSocketHandler.h"

class AttendanceController {
private:
    StorageHandler* storage;
    WebSocketHandler* ws;
    String currentCourseCode;
    bool isRegistrationMode;
    
public:
    AttendanceController(StorageHandler* storage, WebSocketHandler* ws) 
        : storage(storage), ws(ws), isRegistrationMode(false) {}
    
    void setCourseCode(const String& code) {
        currentCourseCode = code;
    }
    
    void setRegistrationMode(bool enable) {
        isRegistrationMode = enable;
    }
    
    bool isInRegistrationMode() const {
        return isRegistrationMode;
    }
    
    bool logFingerprint(uint8_t id, const String& name) {
        if (currentCourseCode.length() > 0) {
            AttendanceRecord record;
            record.studentId = String(id);
            record.studentName = name;
            record.courseCode = currentCourseCode;
            record.timestamp = millis();
            record.type = "fingerprint";
            
            bool saved = storage->logAttendance(record);
            if (saved && ws != nullptr) {
                ws->sendAttendanceData(name, currentCourseCode);
            }
            return saved;
        }
        return false;
    }
    
    bool logRFID(const String& cardId, const String& name) {
        if (currentCourseCode.length() > 0) {
            AttendanceRecord record;
            record.studentId = cardId;
            record.studentName = name;
            record.courseCode = currentCourseCode;
            record.timestamp = millis();
            record.type = "rfid";
            
            bool saved = storage->logAttendance(record);
            if (saved && ws != nullptr) {
                ws->sendAttendanceData(name, currentCourseCode);
            }
            return saved;
        }
        return false;
    }
    
    String getCurrentCourse() const {
        return currentCourseCode;
    }
};

#endif // ATTENDANCE_CONTROLLER_H 