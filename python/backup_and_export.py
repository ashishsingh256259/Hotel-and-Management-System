# -*- coding: utf-8 -*-
"""
Hotel & Restaurant Management System - Data Exporter & Backup Engine
Developed in Python to demonstrate database migration and pipeline conversion (JSON to CSV).
"""

import os
import json
import csv
from datetime import datetime

# Path Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_PATH = os.path.join(BASE_DIR, 'data', 'database.json')
EXPORTS_DIR = os.path.join(BASE_DIR, 'python', 'exports')
BACKUPS_DIR = os.path.join(BASE_DIR, 'python', 'backups')

def load_database():
    if not os.path.exists(DATABASE_PATH):
        print(f"[Error] Source database.json does not exist at {DATABASE_PATH}")
        return None
    try:
        with open(DATABASE_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[Error] Failed to read database: {e}")
        return None

def create_backup():
    data = load_database()
    if not data:
        return False
    
    os.makedirs(BACKUPS_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = os.path.join(BACKUPS_DIR, f"database_backup_{timestamp}.json")
    
    try:
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print(f"[Backup Success] Full JSON database saved to: \n  {backup_file}")
        return True
    except Exception as e:
        print(f"[Error] Failed to write backup: {e}")
        return False

def export_to_csv():
    data = load_database()
    if not data:
        return
    
    os.makedirs(EXPORTS_DIR, exist_ok=True)
    print("\nStarting CSV Data Export Pipeline...")
    print("-" * 50)
    
    # 1. Export Rooms
    rooms = data.get("rooms", [])
    if rooms:
        rooms_csv = os.path.join(EXPORTS_DIR, 'rooms_catalog.csv')
        headers = ["id", "roomNumber", "roomType", "pricePerNight", "capacity", "status"]
        try:
            with open(rooms_csv, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=headers, extrasaction='ignore')
                writer.writeheader()
                for r in rooms:
                    writer.writerow(r)
            print(f" [+] Exported {len(rooms)} Rooms to: {rooms_csv}")
        except Exception as e:
            print(f" [!] Error exporting Rooms: {e}")

    # 2. Export Customers
    customers = data.get("customers", [])
    if customers:
        customers_csv = os.path.join(EXPORTS_DIR, 'registered_guests.csv')
        headers = ["id", "name", "email", "phone", "idProof", "loyaltyPoints", "createdAt"]
        try:
            with open(customers_csv, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=headers, extrasaction='ignore')
                writer.writeheader()
                for c in customers:
                    writer.writerow(c)
            print(f" [+] Exported {len(customers)} Guests to: {customers_csv}")
        except Exception as e:
            print(f" [!] Error exporting Customers: {e}")

    # 3. Export Bookings
    bookings = data.get("bookings", [])
    if bookings:
        bookings_csv = os.path.join(EXPORTS_DIR, 'bookings_ledger.csv')
        headers = ["id", "customerId", "customerName", "roomId", "roomNumber", "checkIn", "checkOut", "totalAmount", "status", "createdAt"]
        try:
            with open(bookings_csv, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=headers, extrasaction='ignore')
                writer.writeheader()
                for b in bookings:
                    writer.writerow(b)
            print(f" [+] Exported {len(bookings)} Bookings to: {bookings_csv}")
        except Exception as e:
            print(f" [!] Error exporting Bookings: {e}")

    # 4. Export Bills
    bills = data.get("bills", [])
    if bills:
        bills_csv = os.path.join(EXPORTS_DIR, 'billing_ledger.csv')
        headers = ["id", "bookingId", "customerName", "roomTotal", "servicesTotal", "foodOrdersTotal", "taxes", "grandTotal", "status", "paidAt"]
        try:
            with open(bills_csv, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=headers, extrasaction='ignore')
                writer.writeheader()
                for b in bills:
                    writer.writerow(b)
            print(f" [+] Exported {len(bills)} Invoices to: {bills_csv}")
        except Exception as e:
            print(f" [!] Error exporting Bills: {e}")

    print("-" * 50)
    print(f"[Pipeline Complete] All structural records exported to: \n  {EXPORTS_DIR}")

if __name__ == "__main__":
    create_backup()
    export_to_csv()
