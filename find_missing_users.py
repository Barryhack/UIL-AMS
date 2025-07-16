import csv

# Read all user IDs from User_fixed.csv
user_ids = set()
with open('User_fixed.csv', newline='', encoding='utf-8') as userfile:
    reader = csv.DictReader(userfile)
    for row in reader:
        user_ids.add(row['id'])

# Find missing userIds in AuditLog_fixed.csv
missing_user_ids = set()
with open('AuditLog_fixed.csv', newline='', encoding='utf-8') as auditfile:
    reader = csv.DictReader(auditfile)
    for row in reader:
        uid = row.get('userId')
        if uid and uid not in user_ids:
            missing_user_ids.add(uid)

if missing_user_ids:
    print("Missing userIds in User_fixed.csv (referenced in AuditLog_fixed.csv):")
    for uid in missing_user_ids:
        print(uid)
else:
    print("No missing userIds. All userIds in AuditLog_fixed.csv are present in User_fixed.csv.") 