# -*- coding: utf-8 -*-
"""
Hotel & Restaurant Management System - Predictive Dynamic Pricing & Demand Forecaster
Developed in Python to demonstrate real-time data analysis, predictive rules, 
and revenue yield management strategies for high-occupancy cycles.
"""

import os
import json
from datetime import datetime

# Path Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_PATH = os.path.join(BASE_DIR, 'data', 'database.json')

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

def run_price_forecaster():
    data = load_database()
    if not data:
        return

    rooms = data.get("rooms", [])
    bookings = data.get("bookings", [])
    
    total_rooms = len(rooms)
    occupied_count = len([r for r in rooms if r.get("status") == "Occupied"])
    occupancy_rate = (occupied_count / total_rooms * 100) if total_rooms > 0 else 0

    print("\n" + "="*70)
    print("      DEEP REVENUE MANAGEMENT - AI-POWERED DEMAND FORECASTER (PYTHON)")
    print("="*70)
    print(f"Analysis Timestamp  : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Current Occupancy   : {occupancy_rate:.2f}% ({occupied_count}/{total_rooms} Rooms Booked)")
    
    # 1. Determine demand index
    if occupancy_rate >= 80:
        demand_level = "CRITICAL / SEVERE PEAK"
        multiplier = 1.35  # +35% price hike recommend
        recommendation = "Demand is extremely high. Recommend immediate +35% dynamic price hike on vacant stock to optimize room yield."
    elif occupancy_rate >= 50:
        demand_level = "HIGH / MODERATE PEAK"
        multiplier = 1.15  # +15% dynamic price recommendation
        recommendation = "Steady bookings stream. Recommend a standard +15% dynamic pricing surge to capture premium tier customers."
    elif occupancy_rate >= 20:
        demand_level = "STABLE / STANDARD DEMAND"
        multiplier = 1.00  # Baseline
        recommendation = "Standard occupancy. Maintain base catalog prices. Offer standard loyalty loyalty points bonuses."
    else:
        demand_level = "CRITICAL LOW DEMAND"
        multiplier = 0.85  # Introduce promotional rate (-15% discount recommendation)
        recommendation = "Occupancy below target threshold. Recommend a quick promotional discount of -15% via dynamic email dispatch."

    print(f"Identified Demand Status: \033[93m{demand_level}\033[0m")
    print(f"Recommended Multiplier   : {multiplier:.2f}x")
    print("-" * 70)
    print(f"EXECUTIVE ACTION PLAN:")
    print(f"  * {recommendation}")
    print("-" * 70)

    # Calculate individual room dynamic prices
    print(f"{'ROOM #':<8} | {'TYPE':<12} | {'BASE PRICE':<12} | {'FORECAST OPTIMAL PRICE':<25} | {'SURGE/DISCOUNT'}")
    print("-" * 70)
    
    room_statistics = {}
    for r in rooms:
        r_type = r.get("roomType", "Standard")
        base_price = r.get("pricePerNight", 100)
        optimal_price = int(base_price * multiplier)
        diff = optimal_price - base_price
        diff_str = f"+${diff}" if diff >= 0 else f"-${abs(diff)}"
        
        status_color = "\033[92m" if diff >= 0 else "\033[91m"
        reset_color = "\033[0m"
        
        print(f"{r.get('roomNumber'):<8} | {r_type:<12} | ${base_price:<11} | ${optimal_price:<23} | {status_color}{diff_str:<12}{reset_color}")
        
        if r_type not in room_statistics:
            room_statistics[r_type] = {"sum_base": 0, "sum_opt": 0, "count": 0}
        room_statistics[r_type]["sum_base"] += base_price
        room_statistics[r_type]["sum_opt"] += optimal_price
        room_statistics[r_type]["count"] += 1

    print("-" * 70)
    print("DEMAND TYPE GROUPED AVERAGES:")
    print("-" * 70)
    for r_type, stats in room_statistics.items():
        base_avg = stats["sum_base"] / stats["count"]
        opt_avg = stats["sum_opt"] / stats["count"]
        print(f" [>] {r_type:<10} Suites : Average Base: ${base_avg:.2f} | Recommended Optimal Standard: ${opt_avg:.2f}")

    # Write suggestions report
    reports_dir = os.path.join(BASE_DIR, 'python', 'reports')
    os.makedirs(reports_dir, exist_ok=True)
    report_file = os.path.join(reports_dir, 'pricing_demand_forecast.txt')
    
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("="*80 + "\n")
        f.write("             DYNAMIC PRICE OPTIMIZATION & FORECASTING INSIGHTS REPORT\n")
        f.write("="*80 + "\n")
        f.write(f"Analyzed DateTime  : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Calculated Capacity Status : {occupied_count}/{total_rooms} rooms booked ({occupancy_rate:.2f}% occupancy)\n")
        f.write(f"Predictive Demand Level    : {demand_level} (Price Scaling: {multiplier:.2f}x)\n")
        f.write("-" * 80 + "\n")
        f.write(f"REVENUE EXECUTIVE SUMMARY:\n")
        f.write(f"   - {recommendation}\n\n")
        f.write("INDIVIDUAL ROOM PRICE RECOMMENDATIONS:\n")
        f.write(f"{'Room Number':<15} | {'Room Type':<20} | {'Current Base':<15} | {'Optimal Dynamic Price'}\n")
        f.write("-" * 80 + "\n")
        for r in rooms:
            f.write(f"{r.get('roomNumber'):<15} | {r.get('roomType'):<20} | ${r.get('pricePerNight', 100):<14} | ${int(r.get('pricePerNight', 100) * multiplier)}\n")
        f.write("="*80 + "\n")
        f.write("Report compiled using Python Dynamic Yield Algorithms.\n")

    print(f"\n[Success] Predictive revenue report generated at: \n  {report_file}\n")

if __name__ == "__main__":
    run_price_forecaster()
