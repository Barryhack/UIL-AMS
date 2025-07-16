import psycopg2
import csv
import os

# Database connection settings
conn = psycopg2.connect(
    dbname="postgres",
    user="postgres",
    password="Melonie@2018",
    host="localhost"
)
cur = conn.cursor()

def import_csv(table, csv_file, columns=None):
    if not os.path.exists(csv_file):
        print(f"File not found: {csv_file}")
        return
    with open(csv_file, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        if not rows:
            print(f"No data in {csv_file}")
            return
        if columns is None:
            columns = reader.fieldnames
        placeholders = ','.join(['%s'] * len(columns))
        colnames = ','.join(f'"{col}"' for col in columns)
        for row in rows:
            values = [row.get(col) for col in columns]
            try:
                cur.execute(f'INSERT INTO "{table}" ({colnames}) VALUES ({placeholders}) ON CONFLICT DO NOTHING', values)
            except Exception as e:
                print(f"Error inserting into {table}: {e}\nRow: {row}")
        print(f"Imported {len(rows)} rows into {table}")

# Import order: User -> Course -> CourseDevice -> CourseEnrollment -> Device -> DeviceCommand -> DeviceRegistration -> DeviceStatus -> DeviceVerification -> Attendance -> AttendanceRecord -> AttendanceSession -> AuditLog -> BiometricData -> Justification -> Location -> Notification -> RFIDTag -> Schedule -> Session

import_csv('User', 'User_fixed.csv')
import_csv('Course', 'Course_fixed.csv')
import_csv('CourseDevice', 'CourseDevice_fixed.csv')
import_csv('CourseEnrollment', 'CourseEnrollment_fixed.csv')
import_csv('Device', 'Device_fixed.csv')
import_csv('DeviceCommand', 'DeviceCommand_fixed.csv')
import_csv('DeviceRegistration', 'DeviceRegistration_fixed.csv')
import_csv('DeviceStatus', 'DeviceStatus_fixed.csv')
import_csv('DeviceVerification', 'DeviceVerification_fixed.csv')
import_csv('Attendance', 'Attendance_fixed.csv')
import_csv('AttendanceRecord', 'AttendanceRecord_fixed.csv')
import_csv('AttendanceSession', 'AttendanceSession_fixed.csv')
import_csv('AuditLog', 'AuditLog_fixed.csv')
import_csv('BiometricData', 'BiometricData_fixed.csv')
import_csv('Justification', 'Justification_fixed.csv')
import_csv('Location', 'Location_fixed.csv')
import_csv('Notification', 'Notification_fixed.csv')
import_csv('RFIDTag', 'RFIDTag_fixed.csv')
import_csv('Schedule', 'Schedule_fixed.csv')
import_csv('Session', 'Session_fixed.csv')

conn.commit()
cur.close()
conn.close()
print("Seeding complete.") 