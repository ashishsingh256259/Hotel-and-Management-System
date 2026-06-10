# -*- coding: utf-8 -*-
"""
Hotel & Restaurant Management System - Admin Terminal CLI
Interactive command-line tool written in Python to manage database records.
Provides a native Python CLI interface for demonstration or administrator queries.
"""

import os
import json
import sys
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_PATH = os.path.join(BASE_DIR, 'data', 'database.json')

def clear_screen():
    # Clears terminal screen cross-platform
    os.system('cls' if os.name == 'nt' else 'clear')

def load_database():
    if not os.path.exists(DATABASE_PATH):
        print(f"[Error] Database file not found at {DATABASE_PATH}")
        return None
    try:
        with open(DATABASE_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[Error] Failed to read database: {e}")
        return None

def save_database(data):
    try:
        with open(DATABASE_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print("[Success] Changes saved to database.json successfully.")
        return True
    except Exception as e:
        print(f"[Error] Failed to save database: {e}")
        return False

def show_menu():
    print("\n" + "╔" + "═"*54 + "╗")
    print("║     HOTEL & RESTAURANT ADMIN CONTROL - PYTHON CLI     ║")
    print("╠" + "═"*54 + "╣")
    print("║  1. View All Rooms (Suite Catalog)                   ║")
    print("║  2. View Real-Time Business Intelligence & Reports   ║")
    print("║  3. Search Active Guest Booking Records              ║")
    print("║  4. Add New Room Inventory                           ║")
    print("║  5. Create Secure JSON Database Backup               ║")
    print("║  6. Run Predictive Dynamic Pricing & Forecaster     ║")
    print("║  7. About the Hybrid Architecture (Report Helpers)   ║")
    print("║  0. Exit Administrative Command Console             ║")
    print("╚" + "═"*54 + "╝")

def view_rooms(data):
    rooms = data.get("rooms", [])
    print("\n" + "="*70)
    print(f"{'ROOM #':<10} | {'ROOM TYPE':<15} | {'PRICE/NIGHT':<12} | {'CAPACITY':<10} | {'STATUS':<15}")
    print("="*70)
    for r in rooms:
        print(f"{r.get('roomNumber', 'N/A'):<10} | {r.get('roomType', 'N/A'):<15} | ${r.get('pricePerNight', 0):<11} | {r.get('capacity', 0):<10} | {r.get('status', 'N/A'):<15}")
    print("="*70)
    input("\nPress [Enter] to return to the admin panel...")

def view_analytics(data):
    from analytics_engine import generate_analytics
    generate_analytics()
    input("\nPress [Enter] to return to the admin panel...")

def search_bookings(data):
    bookings = data.get("bookings", [])
    query = input("\nEnter Guest Name or Room Number to query: ").strip().lower()
    if not query:
        return

    results = []
    for b in bookings:
        name = b.get("customerName", "").lower()
        rm = b.get("roomNumber", "").lower()
        if query in name or query in rm:
            results.append(b)

    if not results:
        print("\n[Notice] No reservations matching that query were found.")
    else:
        print("\n" + "="*76)
        print(f"{'GUEST NAME':<20} | {'ROOM':<6} | {'CHECK-IN':<12} | {'CHECK-OUT':<12} | {'STATUS':<12}")
        print("="*76)
        for b in results:
            print(f"{b.get('customerName', 'N/A')[:20]:<20} | {b.get('roomNumber', 'N/A'):<6} | {b.get('checkIn', 'N/A')[:10]:<12} | {b.get('checkOut', 'N/A')[:10]:<12} | {b.get('status', 'N/A'):<12}")
        print("="*76)
    input("\nPress [Enter] to return to the admin panel...")

def add_room(data):
    print("\n--- ADD NEW ROOM INVENTORY ---")
    rm_num = input("Enter Room Number (e.g. 104, 305): ").strip()
    if not rm_num:
        return
    
    # Check duplicate
    for r in data.get("rooms", []):
        if r.get("roomNumber") == rm_num:
            print(f"[Error] Room {rm_num} already exists!")
            input("\nPress [Enter] to return...")
            return

    r_type = input("Enter Room Type (Standard/Deluxe/Suite): ").strip()
    try:
        r_price = int(input("Enter Price per night ($): "))
        r_cap = int(input("Enter Max Occupancy: "))
    except ValueError:
        print("[Error] Pricing and capacity must be valid integers!")
        input("\nPress [Enter] to return...")
        return

    new_id = f"r_{int(datetime.now().timestamp())}"
    new_room = {
        "id": new_id,
        "roomNumber": rm_num,
        "roomType": r_type,
        "pricePerNight": r_price,
        "capacity": r_cap,
        "status": "Available",
        "imageUrl": "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80"
    }

    data["rooms"].append(new_room)
    if save_database(data):
        print(f"[Success] Room {rm_num} successfully added to inventory.")
    input("\nPress [Enter] to return to the admin panel...")

def create_backup_menu():
    from backup_and_export import create_backup, export_to_csv
    print("\nExecuting Comprehensive Database Backup & Export Pipeline...")
    create_backup()
    export_to_csv()
    input("\nBackup Completed! Press [Enter] to return to main menu...")

def show_architectural_overview():
    clear_screen()
    print("="*70)
    print("     COLLEGE PROJECT ARCHITECTURE REPORT DEFINITIONS ")
    print("="*70)
    print("""
This project runs on a HYBRID MULTI-STACK ENTERPRISE ARCHITECTURE.

1. High-Performance Mobile/Web Client:
   - Built on React 18 with TypeScript and Vite.
   - Beautiful, fully animated interactive interface with dashboard analytics,
     live room floor plans, and housekeeping status managers.

2. Full-Stack Node.js Application Server (Express API):
   - Handles operational business logic, custom authentication middleware (JWT),
     services routing, and REST APIs.

3. Background Analytics & Administrator CLI System (PYTHON MODULE):
   - Built with advanced Python 3 scripts to process business intelligence (BI)
     and parse local transactional databases into reports.
   - Allows offline system configurations and pipeline ETL (Extract, Transform,
     Load) processing by exporting complex system states into CSV.

This dual TypeScript-Python architecture represents standard modern hybrid software
used in high-availability enterprise applications. Include these notes in your 
project notebook!
""")
    input("Press [Enter] to return to the admin panel...")

def main():
    while True:
        clear_screen()
        data = load_database()
        if not data:
            print("[Critical] DB missing. Exiting CLI.")
            break
        
        show_menu()
        choice = input("\nEnter choice (0-7): ").strip()
        
        if choice == '1':
            view_rooms(data)
        elif choice == '2':
            view_analytics(data)
        elif choice == '3':
            search_bookings(data)
        elif choice == '4':
            add_room(data)
        elif choice == '5':
            create_backup_menu()
        elif choice == '6':
            from demand_forecaster import run_price_forecaster
            run_price_forecaster()
            input("\nPress [Enter] to return to the admin panel...")
        elif choice == '7':
            show_architectural_overview()
        elif choice == '0':
            print("\nExiting System Admin CLI... System secure.")
            break
        else:
            print("\n[Invalid Selection] Please choose a number from 0 to 7.")
            input("Press [Enter] to retry...")

if __name__ == "__main__":
    main()
