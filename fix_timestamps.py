import csv
import datetime
import os

def convert_timestamp(value):
    try:
        # Only convert if it's a 13-digit number (milliseconds)
        if value.isdigit() and len(value) == 13:
            ts = int(value) / 1000
            return datetime.datetime.utcfromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')
    except Exception:
        pass
    return value

# Keywords to look for in column names
date_keywords = ['timestamp', 'created', 'updated']

for filename in os.listdir('.'):
    if filename.endswith('.csv'):
        with open(filename, newline='', encoding='utf-8') as infile:
            reader = csv.DictReader(infile)
            fieldnames = reader.fieldnames
            if not fieldnames:
                print(f"Skipping {filename}: no header row detected.")
                continue
            rows = []
            for row in reader:
                for field in fieldnames:
                    if any(keyword in field.lower() for keyword in date_keywords):
                        row[field] = convert_timestamp(row[field])
                rows.append(row)

        # Write to a new file with _fixed.csv suffix
        fixed_filename = filename.replace('.csv', '_fixed.csv')
        with open(fixed_filename, 'w', newline='', encoding='utf-8') as outfile:
            writer = csv.DictWriter(outfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

        print(f"Processed {filename} -> {fixed_filename}") 