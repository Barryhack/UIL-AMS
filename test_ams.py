import requests
import time

# Base URL of the ESP32 web server
BASE_URL = "http://192.168.60.229"

# Test 1: Root page
def test_root():
    print("Test 1 (Root Page):", end=" ")
    try:
        response = requests.get(BASE_URL)
        if response.status_code == 200 and "UNILORIN AMS" in response.text:
            print("PASS")
        else:
            print("FAIL")
    except Exception as e:
        print(f"FAIL: {e}")

# Test 2: Add Student
def test_add_student():
    print("Test 2 (Add Student):", end=" ")
    try:
        data = {
            "matric_number": "TEST001",
            "name": "Test Student",
            "fingerprint_id": "12345",
            "rfid_id": "67890"
        }
        response = requests.post(f"{BASE_URL}/add_student", json=data)
        if response.status_code == 200:
            print("PASS")
        else:
            print("FAIL")
    except Exception as e:
        print(f"FAIL: {e}")

# Test 3: Mark Attendance
def test_mark_attendance():
    print("Test 3 (Mark Attendance):", end=" ")
    try:
        data = {
            "matric_number": "TEST001",
            "timestamp": "2024-03-20 10:00:00"
        }
        response = requests.post(f"{BASE_URL}/mark_attendance", json=data)
        if response.status_code == 200:
            print("PASS")
        else:
            print("FAIL")
    except Exception as e:
        print(f"FAIL: {e}")

# Test 4: View Attendance Report
def test_attendance_report():
    print("Test 4 (Attendance Report):", end=" ")
    try:
        response = requests.get(f"{BASE_URL}/attendance_report?date=2024-03-20")
        if response.status_code == 200:
            print("PASS")
        else:
            print("FAIL")
    except Exception as e:
        print(f"FAIL: {e}")

# Test 5: Fingerprint Scan
def test_fingerprint_scan():
    print("Test 5 (Fingerprint Scan):", end=" ")
    try:
        # Simulate admin interface requesting fingerprint scan
        response = requests.post(f"{BASE_URL}/scan_fingerprint", json={"command": "start_scan"})
        if response.status_code == 200:
            # Simulate hardware response
            fingerprint_data = {
                "fingerprint_id": "12345",
                "status": "success",
                "message": "Fingerprint captured successfully"
            }
            response = requests.post(f"{BASE_URL}/fingerprint_data", json=fingerprint_data)
            if response.status_code == 200:
                print("PASS")
            else:
                print("FAIL")
        else:
            print("FAIL")
    except Exception as e:
        print(f"FAIL: {e}")

# Test 6: RFID Scan
def test_rfid_scan():
    print("Test 6 (RFID Scan):", end=" ")
    try:
        # Simulate admin interface requesting RFID scan
        response = requests.post(f"{BASE_URL}/scan_rfid", json={"command": "start_scan"})
        if response.status_code == 200:
            # Simulate hardware response
            rfid_data = {
                "rfid_id": "67890",
                "status": "success",
                "message": "RFID card read successfully"
            }
            response = requests.post(f"{BASE_URL}/rfid_data", json=rfid_data)
            if response.status_code == 200:
                print("PASS")
            else:
                print("FAIL")
        else:
            print("FAIL")
    except Exception as e:
        print(f"FAIL: {e}")

# Test 7: Hardware Status
def test_hardware_status():
    print("Test 7 (Hardware Status):", end=" ")
    try:
        response = requests.get(f"{BASE_URL}/hardware_status")
        if response.status_code == 200:
            print("PASS")
        else:
            print("FAIL")
    except Exception as e:
        print(f"FAIL: {e}")

# Run all tests
if __name__ == "__main__":
    print("Running automated tests...")
    test_root()
    test_add_student()
    test_mark_attendance()
    test_attendance_report()
    test_fingerprint_scan()
    test_rfid_scan()
    test_hardware_status()
    print("Tests completed.") 