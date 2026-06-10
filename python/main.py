# -*- coding: utf-8 -*-
"""
Hotel & Restaurant Management System - Main Execution Runner
Implements the exact menu-driven terminal interface requested in the specifications.
Provides rich ASCII menus, advanced error safeguards, and links all OOP subsystems.
"""

import os
import sys
from datetime import datetime

# Import Exception and Module Systems
from exceptions import (
    HotelException,
    InvalidRoomNumberError,
    RoomNotAvailableError,
    InvalidCustomerIDError,
    InvalidOrderIDError,
    InvalidBillAmountError,
    MissingFilesError,
    IncorrectUserInputError
)

from hotel import Hotel
from room import DeluxeRoom, StandardRoom
from customer import Customer
from employee import Employee
from food_item import FoodItem
from order import Order
from bill import Bill

# Path Configurations
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "..", "data", "database.json")

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def get_str_input(prompt: str) -> str:
    val = input(prompt).strip()
    if not val:
        raise IncorrectUserInputError("Input field cannot be empty.")
    return val

def get_int_input(prompt: str) -> int:
    try:
        return int(input(prompt).strip())
    except ValueError:
        raise IncorrectUserInputError("Invalid entry! Positive integer required.")

def get_float_input(prompt: str) -> float:
    try:
        return float(input(prompt).strip())
    except ValueError:
        raise IncorrectUserInputError("Invalid entry! Numeric value required.")

def print_separator(char="═", length=65):
    print(char * length)

def main_cli_loop():
    # Instantiate central composition controller
    hotel_system = Hotel("Hotel Royal Palace", DB_FILE)
    
    # Try dynamic load at startup
    try:
        hotel_system.load_data()
        print(f"[Database Sync] Core records synchronized successfully from {DB_FILE}")
    except Exception as e:
        print(f"[Warning] Failed to read database on boot. Fallback schemas active. details: {e}")

    while True:
        clear_screen()
        print_separator("╔")
        print("║      ★  HOTEL & RESTAURANT HYBRID MANAGEMENT CORE  ★      ║")
        print("║                   (COLLEGE PROJECT PORTAL)                ║")
        print_separator("╠")
        print("║  1. Customer Profiles Hub                              ║")
        print("║  2. Room Inventory & Facility Catalog                 ║")
        print("║  3. Dynamic Room Reservation & Check-Ins              ║")
        print("║  4. Culinary Kitchen & Menu Customization              ║")
        print("║  5. Full Gastronomy Food Ordering Service              ║")
        print("║  6. Commercial POS billing & Receipts Generator       ║")
        print("║  7. Human Resources (Employee Database Control)        ║")
        print("║  8. Generate Analytical Audits & CSV Backups          ║")
        print("║  9. Save Current State to Local Database              ║")
        print("║ 10. Load/Re-sync Database state                       ║")
        print("║ 11. Complete Administrative Exit                       ║")
        print_separator("╚")
        print(Hotel.get_system_metadata())
        print(f"Active Memory: {len(hotel_system.rooms_list)} Rooms | {len(hotel_system.customers_list)} Customers | {len(hotel_system.employees_list)} Staff")
        print_separator("─")

        try:
            choice = input("Enter administrative routine selection (1-11): ").strip()
            
            if choice == "1":
                # Customer management
                clear_screen()
                print("==================================================")
                print("             CUSTOMER MANAGEMENT SYSTEM           ")
                print("==================================================")
                print(" 1. Register New Guest Profile")
                print(" 2. Update Guest Contact Details")
                print(" 3. Secure Search Guest Profile (Recursive Algorithm)")
                print(" 4. View Booking Logs History")
                print(" 5. Return to Main Dashboard")
                print("==================================================")
                sub_ch = input("Select operation: ").strip()

                if sub_ch == "1":
                    name = get_str_input("Enter Guest Name: ")
                    phone = get_str_input("Enter Guest Phone: ")
                    email = get_str_input("Enter Email: ")
                    address = get_str_input("Enter Address: ")
                    
                    new_id = f"c_{int(datetime.now().timestamp())}"
                    new_cust = Customer(new_id, name, phone, email, address)
                    hotel_system.register_customer(new_cust)
                    print(f"\n[Success] Registered! ID: {new_id}")
                    
                elif sub_ch == "2":
                    cid = get_str_input("Enter target Customer ID to update: ")
                    cust = Customer.recursive_search(hotel_system.customers_list, cid)
                    if not cust:
                        raise InvalidCustomerIDError(cid)
                    print(f"\nEditing particulars for: {cust.customer_name}")
                    name = get_str_input("Enter New Name: ")
                    phone = get_str_input("Enter New Phone: ")
                    email = get_str_input("Enter New Email: ")
                    address = get_str_input("Enter New Address: ")
                    cust.update_details(name, phone, email, address)
                    print("\n[Success] Profile updated in runtime storage.")

                elif sub_ch == "3":
                    # Recursive Search Showcase!
                    cid = get_str_input("Enter Customer ID to recursively search: ")
                    print("\n[Diagnostic] Running binary recursive lookup across records...")
                    cust = Customer.recursive_search(hotel_system.customers_list, cid)
                    if cust:
                        print("\n>>> MATCHING RECORD CORRESPONDENCE FOUND <<<")
                        print(cust)
                        print(f"Address Saved: {cust.address}")
                    else:
                        print(f"\n[Search Notice] No guest found matching search query ID: {cid}")

                elif sub_ch == "4":
                    cid = get_str_input("Enter Customer ID to fetch history: ")
                    cust = Customer.recursive_search(hotel_system.customers_list, cid)
                    if not cust:
                        raise InvalidCustomerIDError(cid)
                    history = cust.view_booking_history()
                    if not history:
                        print("\n[Guest Alert] No billing reservation logs have been booked for this account.")
                    else:
                        print(f"\n--- ROOM STAY LOGS FOR: {cust.customer_name} ---")
                        for h in history:
                            print(f" * Stay Ref: {h.get('id')} | Room {h.get('roomNumber')} | Duration: {h.get('stayDurationDays')} days | Rent: ${h.get('totalCharge')}")
                
            elif choice == "2":
                # Room Management
                clear_screen()
                print("==================================================")
                print("              ROOM INVENTORY MANAGEMENT           ")
                print("==================================================")
                print(" 1. Print Complete Room Inventory")
                print(" 2. Add New Suite Inventory")
                print(" 3. View Vacant Rooms (List Comprehension filter)")
                print(" 4. Sorted Catalog view (Lambda Price Filter)")
                print(" 5. Return to Main Dashboard")
                print("==================================================")
                sub_ch = input("Select operation: ").strip()

                if sub_ch == "1":
                    print("\n--- CORPORATE ROOM SUITES METRICS ---")
                    for r in hotel_system.rooms_list:
                        print(f"Suite {r.room_number:<4} | Type: {r.room_type:<10} | Nightly Rate: ${r.room_price:<5} | Occupancy: {r.availability_status}")
                    
                elif sub_ch == "2":
                    rm_num = get_str_input("Enter Room Suite Number (e.g., 401, 502): ")
                    # Duplicate validation
                    for rm in hotel_system.rooms_list:
                        if rm.room_number == rm_num:
                            raise IncorrectUserInputError(f"Room {rm_num} already exists in records.")
                            
                    print("\nSelect Suite Class Hierarchy: ")
                    print("  1. Deluxe Suite  (Includes complimentary minibar and morning breakfasts)")
                    print("  2. Standard Suite (Budget friendly, local air conditioning options)")
                    class_ch = input("Enter choice (1-2): ").strip()
                    
                    price = get_float_input("Enter Base Price per night Rent ($): ")
                    new_id = f"r_{int(datetime.now().timestamp())}"
                    
                    if class_ch == "1":
                        r_obj = DeluxeRoom(new_id, rm_num, price, "Available")
                    else:
                        r_obj = StandardRoom(new_id, rm_num, price, "Available")
                    hotel_system.add_room(r_obj)
                    print(f"\n[Success] Polymorphic {r_obj.__class__.__name__} added successfully to inventory.")

                elif sub_ch == "3":
                    # Uses List Comprehension
                    vacant = hotel_system.get_available_rooms_comprehension()
                    print("\n--- AVAILABLE VACANT ROOM LIST (COMPREHENSION QUERY) ---")
                    if not vacant:
                        print("[Inventory Notice] All suites are booked today! Yield levels optimal.")
                    for r in vacant:
                        print(f" Room: {r.room_number:<5} | Class: {r.room_type:<10} | rent: ${r.room_price}/night")

                elif sub_ch == "4":
                    # Uses Lambda Sorter
                    sorted_rooms = hotel_system.get_rooms_by_price_sorted()
                    print("\n--- SUITES CATALOG SORTED BY LEAST PRICE (LAMBDA SORTER) ---")
                    for r in sorted_rooms:
                        print(f" Room: {r.room_number:<5} | Class: {r.room_type:<10} | Price: ${r.room_price}/night")

            elif choice == "3":
                # Room Booking
                clear_screen()
                print("==================================================")
                print("                  ROOM RESERVATIONS               ")
                print("==================================================")
                cid = get_str_input("Enter registered Customer Profile ID: ")
                # Check exist
                cust = Customer.recursive_search(hotel_system.customers_list, cid)
                if not cust:
                    raise InvalidCustomerIDError(cid)
                    
                rm_num = get_str_input("Enter vacant Room Number to book: ")
                days = get_int_input("Enter total Stay Duration (number of days): ")

                stay_total = hotel_system.book_room(cid, rm_num, days)
                print(f"\n[Success] stay booked successfully! total base checkout charge generated: ${stay_total:.2f}")

            elif choice == "4":
                # Restaurant Management
                clear_screen()
                print("==================================================")
                print("            RESTAURANT MENU CONFIGURATION         ")
                print("==================================================")
                print(" 1. View Complete Food Menu (Sorted by Price Lambda)")
                print(" 2. Add New Food Item and Gastronomy Category")
                print(" 3. Print Unique Gastronomy Categories (Set utility)")
                print(" 4. Return to Main Dashboard")
                print("==================================================")
                sub_ch = input("Select operation: ").strip()

                if sub_ch == "1":
                    # Sort menu via Lambda
                    items = hotel_system.get_menu_by_price_sorted()
                    print("\n--- KITCHEN FOOD MENU REGISTER (PRICE ASCENDING) ---")
                    for item in items:
                        print(f" [{item.food_id}] {item.food_name:<30} | Series: {item.category:<12} | Price: ${item.price:.2f}")
                    
                elif sub_ch == "2":
                    name = get_str_input("Enter dish Name: ")
                    cat = get_str_input("Enter food category (Starter/Main Course/Dessert/Beverage): ")
                    price = get_float_input("Enter sale Price ($): ")
                    new_id = f"f_{int(datetime.now().timestamp())}"
                    hotel_system.menu_list.append(FoodItem(new_id, name, cat, price))
                    print("\n[Success] Culinary items added to system menu.")

                elif sub_ch == "3":
                    # Uses Set
                    cats = hotel_system.get_unique_food_categories()
                    print("\n--- REGISTERED FOOD CATEGORIES (SET INTEGRITY) ---")
                    for c in cats:
                        print(f" -> {c}")

            elif choice == "5":
                # Food Ordering
                clear_screen()
                print("==================================================")
                print("            RESTAURANT FOOD ORDER DESK            ")
                print("==================================================")
                cid = get_str_input("Enter Customer Profile ID placing order: ")
                cust = Customer.recursive_search(hotel_system.customers_list, cid)
                if not cust:
                    raise InvalidCustomerIDError(cid)

                print("\n--- AVAILABLE KITCHEN DISHES ---")
                for item in hotel_system.menu_list:
                    print(f"  [{item.food_id}] {item.food_name:<28} - cost: ${item.price:.2f}")
                print_separator("─", 50)

                order_dict = {}
                while True:
                    f_id = input("Enter Food ID to add (or leave blank to process final card): ").strip()
                    if not f_id:
                        break
                    
                    # Verify validity
                    valid = False
                    for fi in hotel_system.menu_list:
                        if fi.food_id == f_id:
                            valid = True
                            break
                    if not valid:
                        print("[Error] No matching Food ID in records.")
                        continue
                        
                    qty = get_int_input(f"Enter quantity of item: ")
                    order_dict[f_id] = order_dict.get(f_id, 0) + qty
                
                if order_dict:
                    order_obj = hotel_system.place_food_order(cid, order_dict)
                    print(f"\n[Success] Kitchen order dispatched! Items served. total meal cost: ${order_obj.total_amount:.2f}")
                else:
                    print("\n[Alert] Order cancelled. No items were selected.")

            elif choice == "6":
                # Billing management
                clear_screen()
                print("==================================================")
                print("              COMMERCIAL BILLING & POS            ")
                print("==================================================")
                print(" 1. Process Final Settlement Invoice (Check-Out)")
                print(" 2. Stream historical bills sequentially (Generator yield)")
                print(" 3. Return to Main Dashboard")
                print("==================================================")
                sub_ch = input("Select operation: ").strip()

                if sub_ch == "1":
                    cid = get_str_input("Enter customer Profile ID checking out: ")
                    cust = Customer.recursive_search(hotel_system.customers_list, cid)
                    if not cust:
                        raise InvalidCustomerIDError(cid)

                    print("\nChecking pending stays and food balances...")
                    # Calculate room charges from history logs
                    room_charges = sum(log.get("totalCharge", 0.0) for log in cust.booking_history)
                    
                    # Calculate food charges
                    food_charges = sum(o.total_amount for o in hotel_system.orders_list if o.customer_id == cid)
                    
                    if room_charges == 0 and food_charges == 0:
                        raise InvalidBillAmountError(0.0)

                    new_bill_id = f"bill_{int(datetime.now().timestamp())}"
                    billing_trans = Bill(new_bill_id, cid, room_charges, food_charges)
                    
                    hotel_system.bills_list.append(billing_trans)
                    print(billing_trans.print_invoice())
                    
                    # Vacate room associated
                    for log in cust.booking_history:
                        rm_n = log.get("roomNumber")
                        for r in hotel_system.rooms_list:
                            if r.room_number == rm_n:
                                r.availability_status = "Available"

                elif sub_ch == "2":
                    # Uses Generator yield
                    print("\n--- STREAMING HISTORICAL BILL METRICS ONE-BY-ONE (GENERATOR) ---")
                    inv_stream = hotel_system.invoice_generator()
                    has_bills = False
                    for idx, bill_text in enumerate(inv_stream, 1):
                        has_bills = True
                        print(f"\n[Generator Invoice Output #{idx}]")
                        print(bill_text)
                        input("Press [Enter] to stream next receipt...")
                    if not has_bills:
                        print("\n[Sales Notice] No compiled billing transactions found in local memory.")

            elif choice == "7":
                # Employee management
                clear_screen()
                print("==================================================")
                print("              HUMAN RESOURCES PORTAL              ")
                print("==================================================")
                print(" 1. Register Corporate Employee Record")
                print(" 2. View Employees list sorted by compensation (Lambda)")
                print(" 3. Return to Main Dashboard")
                print("==================================================")
                sub_ch = input("Select operation: ").strip()

                if sub_ch == "1":
                    name = get_str_input("Enter employee Name: ")
                    desig = get_str_input("Enter Job Designation: ")
                    salary = get_float_input("Enter monthly salary base pay ($): ")
                    dept = get_str_input("Enter Assigned Department: ")
                    
                    new_id = f"emp00{len(hotel_system.employees_list) + 1}"
                    emp_obj = Employee(new_id, name, desig, salary, dept)
                    hotel_system.add_employee(emp_obj)
                    print(f"\n[Success] Hired! Employee ID allocated: {new_id}")
                    print(emp_obj.display_employee())
                    
                elif sub_ch == "2":
                    # Sort via Lambda
                    sorted_emp = hotel_system.get_employees_by_salary_sorted()
                    print("\n--- HUMAN RESOURCES DATABASE ROSTER (HIGHEST COMPENSATIONS) ---")
                    for idx, emp in enumerate(sorted_emp, 1):
                        print(f" #{idx} | {emp.employee_name:<16} | {emp.designation:<22} | Dept: {emp.department:<12} | Salary: ${emp.salary:,.2f}/mo")

            elif choice == "8":
                # Generate Reports
                clear_screen()
                print("Executing Advanced System Diagnostic Audit & CSV Export Pipeline...")
                filepaths = hotel_system.generate_csv_reports()
                print("\n" + "="*50)
                print("     SUCCESSFULLY EXPORTED STRUCTURED BUSINESS REPORTS ")
                print("="*50)
                print(f"  [+] Corporate Sales Ledger Export : {filepaths['sales']}")
                print(f"  [+] Room Occupancy Logs Export    : {filepaths['occupancy']}")
                print(f"  [+] Human Resource Payroll Export : {filepaths['employee']}")
                print("="*50)
                
            elif choice == "9":
                # Save data
                if hotel_system.save_data():
                    print(f"\n[Database Sync] Successfully pushed state records down into transactional schemas at {DB_FILE}!")
                else:
                    print("\n[Database error] Failed to finalize serializations.")
                    
            elif choice == "10":
                # Load data
                hotel_system.load_data()
                print(f"\n[Database Sync] Re-loaded state database successfully from {DB_FILE}!")
                
            elif choice == "11":
                # Exit
                print("\n[Administrative Dispatch] Saving changes to persistent database files before final exit...")
                hotel_system.save_data()
                print("\nProcess Completed. System securely offline. Goodbye!")
                break
                
            else:
                print("\n[Alert] Invalid menu entry. Choose a number from 1 to 11.")

        except HotelException as he:
            print(f"\n[HOTEL SYSTEM ERROR ENCOUNTERED]")
            print(f" >>> {he}")
        except IncorrectUserInputError as uie:
            print(f"\n[VALIDATION WARNING]")
            print(f" >>> {uie}")
        except Exception as e:
            print(f"\n[CRITICAL UNHANDLED ERROR ACCIDENT]")
            print(f" >>> Fatal Details: {e}")
            
        input("\nPress [Enter] to continue...")

if __name__ == "__main__":
    main_cli_loop()
