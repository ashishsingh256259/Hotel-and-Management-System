# -*- coding: utf-8 -*-
"""
Hotel & Restaurant Management System - Analytics Engine
Developed in Python for Administrative Reporting and Intelligence.
"""

import os
import json
import csv
from datetime import datetime

# Path Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_PATH = os.path.join(BASE_DIR, 'data', 'database.json')
REPORTS_DIR = os.path.join(BASE_DIR, 'python', 'reports')

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

def generate_analytics():
    data = load_database()
    if not data:
        return

    print("\n" + "="*60)
    print("      HOTEL & RESTAURANT MANAGEMENT SYSTEM (PYTHON BI INTERFACE) ")
    print("="*60)

    # 1. Rooms Metrics
    rooms = data.get("rooms", [])
    total_rooms = len(rooms)
    occupied_rooms = len([r for r in rooms if r.get("status") == "Occupied"])
    available_rooms = len([r for r in rooms if r.get("status") == "Available"])
    maintenance_rooms = len([r for r in rooms if r.get("status") == "Under Maintenance"])
    occupancy_rate = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0

    # 2. Customers & Bookings Metrics
    customers = data.get("customers", [])
    bookings = data.get("bookings", [])
    total_customers = len(customers)
    total_bookings = len(bookings)
    confirmed_bookings = len([b for b in bookings if b.get("status") == "Confirmed"])
    checked_in_bookings = len([b for b in bookings if b.get("status") == "Checked In"])
    cancelled_bookings = len([b for b in bookings if b.get("status") == "Cancelled"])

    # 3. Revenue Metrics
    bills = data.get("bills", [])
    total_revenue = 0
    pending_revenue = 0
    paid_count = 0
    pending_count = 0
    for bill in bills:
        total = bill.get("grandTotal", 0)
        if bill.get("status") == "Paid":
            total_revenue += total
            paid_count += 1
        else:
            pending_revenue += total
            pending_count += 1

    # 4. Service Audit (Ratings)
    feedbacks = data.get("feedbacks", [])
    reviews = data.get("reviews", [])
    all_room_ratings = []
    all_food_ratings = []
    all_staff_ratings = []

    for f in feedbacks:
        if "roomRating" in f: all_room_ratings.append(f["roomRating"])
        if "foodRating" in f: all_food_ratings.append(f["foodRating"])
        if "staffRating" in f: all_staff_ratings.append(f["staffRating"])
    for r in reviews:
        if "rating" in r: all_room_ratings.append(r["rating"])

    avg_room_rating = sum(all_room_ratings) / len(all_room_ratings) if all_room_ratings else 0
    avg_food_rating = sum(all_food_ratings) / len(all_food_ratings) if all_food_ratings else 0
    avg_staff_rating = sum(all_staff_ratings) / len(all_staff_ratings) if all_staff_ratings else 0

    # 5. Operational Status
    housekeeping = data.get("housekeepingTasks", [])
    pending_hk = len([t for t in housekeeping if t.get("status") in ["Pending", "In Progress"]])
    completed_hk = len([t for t in housekeeping if t.get("status") == "Completed"])

    complaints = data.get("complaints", [])
    active_complaints = len([c for c in complaints if c.get("status") in ["Pending", "Investigating"]])
    resolved_complaints = len([c for c in complaints if c.get("status") == "Resolved"])

    # Print Dashboard to Terminal
    print(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 60)
    print(f" [1] ROOM RESIDENCE STATISTICS:")
    print(f"     * Total Room Inventory   : {total_rooms}")
    print(f"     * Occupied Rooms         : {occupied_rooms}")
    print(f"     * Vacant/Available Rooms : {available_rooms}")
    print(f"     * Rooms in Maintenance   : {maintenance_rooms}")
    print(f"     * Real-time Occupancy    : {occupancy_rate:.2f}%")
    print("-" * 60)
    print(f" [2] GUEST & RESERVATION METRICS:")
    print(f"     * Registered Profiles    : {total_customers} Customers")
    print(f"     * Historic Bookings Count: {total_bookings}")
    print(f"     * Active Checked-In      : {checked_in_bookings}")
    print(f"     * Future Confirmed Stays : {confirmed_bookings}")
    print(f"     * Cancelled Bookings     : {cancelled_bookings}")
    print("-" * 60)
    print(f" [3] FINANCIAL LEDGER OVERVIEW:")
    print(f"     * Actual Settled Revenue : ${total_revenue:,.2f} ({paid_count} Transactions)")
    print(f"     * Outstanding/Unpaid Ledger: ${pending_revenue:,.2f} ({pending_count} Bills Outstanding)")
    print(f"     * Estimated Gross Volume  : ${total_revenue + pending_revenue:,.2f}")
    print("-" * 60)
    print(f" [4] QUALITY AUDIT (Average User Scores out of 5):")
    print(f"     * Room Comfort & Quality : {avg_room_rating:.2f} / 5.0")
    print(f"     * Dining & Catering Service: {avg_food_rating:.2f} / 5.0")
    print(f"     * Hospitality & Staff Care : {avg_staff_rating:.2f} / 5.0")
    print("-" * 60)
    print(f" [5] SERVICE OPERATIONS METRICS:")
    print(f"     * Pending Housekeeping   : {pending_hk} Rooms")
    print(f"     * Completed Cleanings    : {completed_hk} Rooms")
    print(f"     * Active Grievances      : {active_complaints} Complaints")
    print(f"     * Resolved Grievances    : {resolved_complaints} Resolved")
    print("=" * 60)

    # Save report to reports directory
    os.makedirs(REPORTS_DIR, exist_ok=True)
    report_file = os.path.join(REPORTS_DIR, 'hotel_business_report.txt')
    
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("="*80 + "\n")
        f.write("             HOTEL & RESTAURANT MANAGEMENT SYSTEM - ANALYTICS REPORT\n")
        f.write("="*80 + "\n")
        f.write(f"Generated on : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Source File  : {DATABASE_PATH}\n")
        f.write("-" * 80 + "\n\n")
        
        f.write("1. ROOM INVENTORY MANAGEMENT\n")
        f.write(f"   - Total Corporate Suites Available : {total_rooms}\n")
        f.write(f"   - Rooms Under Reservation / Stays  : {occupied_rooms}\n")
        f.write(f"   - Rooms Ready for New Booking      : {available_rooms}\n")
        f.write(f"   - Rooms Flagged for Maintenance    : {maintenance_rooms}\n")
        f.write(f"   - Active Hotel Occupancy Rate       : {occupancy_rate:.2f}%\n\n")
        
        f.write("2. CUSTOMER & CUSTOMER TOUCHPOINTS\n")
        f.write(f"   - Unique Customers Registered      : {total_customers}\n")
        f.write(f"   - Cumulative Booking Transactions  : {total_bookings}\n")
        f.write(f"   - Live Active Check-Ins            : {checked_in_bookings}\n")
        f.write(f"   - Confirmed Future Arrivals       : {confirmed_bookings}\n\n")
        
        f.write("3. FINANCIAL SETTLEMENT SUMMARY\n")
        f.write(f"   - Completed Financial Settlements   : ${total_revenue:,.2f} (Paid bills: {paid_count})\n")
        f.write(f"   - Pending Receivables             : ${pending_revenue:,.2f} (Unpaid bills: {pending_count})\n")
        f.write(f"   - Total Expected Revenue Pool      : ${total_revenue + pending_revenue:,.2f}\n\n")
        
        f.write("4. QUALITY & EXPERIENCE SCORES\n")
        f.write(f"   - Rooms and Suites Experience      : {avg_room_rating:.2f} / 5.0\n")
        f.write(f"   - Gastronomy / In-room Service     : {avg_food_rating:.2f} / 5.0\n")
        f.write(f"   - Frontdesk & Service Staff Audit  : {avg_staff_rating:.2f} / 5.0\n\n")
        
        f.write("5. COMPLIANCE & ESCALATION STATS\n")
        f.write(f"   - Outstanding Housekeeping Tasks   : {pending_hk}\n")
        f.write(f"   - Active Complaints in Pipeline    : {active_complaints}\n")
        f.write(f"   - Total Resolved Queries           : {resolved_complaints}\n")
        f.write("="*80 + "\n")
        f.write("Report compiled successfully by Python BI Module.\n")

    print(f"\n[Success] Highly detailed business report exported to: \n{report_file}\n")

if __name__ == "__main__":
    generate_analytics()
