from flask import Flask, request, jsonify
import json
import time
from datetime import datetime

app = Flask(__name__)

# In-memory storage for demonstration
students = {}
attendance_records = {}
hardware_status = {
    "fingerprint_scanner": "ready",
    "rfid_reader": "ready"
}

@app.route('/')
def root():
    return "UNILORIN AMS"

@app.route('/add_student', methods=['POST'])
def add_student():
    data = request.json
    students[data['matric_number']] = {
        'name': data['name'],
        'fingerprint_id': data['fingerprint_id'],
        'rfid_id': data['rfid_id']
    }
    return jsonify({"status": "success", "message": "Student added successfully"})

@app.route('/mark_attendance', methods=['POST'])
def mark_attendance():
    data = request.json
    date = datetime.now().strftime('%Y-%m-%d')
    if date not in attendance_records:
        attendance_records[date] = []
    attendance_records[date].append({
        'matric_number': data['matric_number'],
        'timestamp': data['timestamp']
    })
    return jsonify({"status": "success", "message": "Attendance marked successfully"})

@app.route('/attendance_report', methods=['GET'])
def attendance_report():
    date = request.args.get('date')
    if date in attendance_records:
        return jsonify({"status": "success", "data": attendance_records[date]})
    return jsonify({"status": "error", "message": "No attendance records found for this date"})

@app.route('/scan_fingerprint', methods=['POST'])
def scan_fingerprint():
    # This endpoint is called when admin clicks "Scan Fingerprint"
    hardware_status['fingerprint_scanner'] = 'scanning'
    # In a real implementation, this would trigger the hardware to start scanning
    return jsonify({"status": "success", "message": "Fingerprint scanning started"})

@app.route('/fingerprint_data', methods=['POST'])
def fingerprint_data():
    # This endpoint receives data from the hardware after successful scan
    data = request.json
    hardware_status['fingerprint_scanner'] = 'ready'
    # Update the form with the fingerprint data
    return jsonify({
        "status": "success",
        "message": "Fingerprint data received",
        "data": data
    })

@app.route('/scan_rfid', methods=['POST'])
def scan_rfid():
    # This endpoint is called when admin clicks "Scan RFID Card"
    hardware_status['rfid_reader'] = 'scanning'
    # In a real implementation, this would trigger the hardware to start scanning
    return jsonify({"status": "success", "message": "RFID scanning started"})

@app.route('/rfid_data', methods=['POST'])
def rfid_data():
    # This endpoint receives data from the hardware after successful scan
    data = request.json
    hardware_status['rfid_reader'] = 'ready'
    # Update the form with the RFID data
    return jsonify({
        "status": "success",
        "message": "RFID data received",
        "data": data
    })

@app.route('/hardware_status', methods=['GET'])
def get_hardware_status():
    return jsonify(hardware_status)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80) 