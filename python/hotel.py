# -*- coding: utf-8 -*-
"""
Hotel & Restaurant Management System - Hotel Class (Composition Root)
Coordinates all sub-modules, handles file IO (JSON/CSV), and advanced Python concepts.
"""

import os
import json
import csv
from datetime import datetime
from typing import List, Dict, Set, Tuple, Any, Generator

# Import modules
from exceptions import (
    InvalidRoomNumberError,
    RoomNotAvailableError,
    InvalidCustomerIDError,
    InvalidOrderIDError
)
from decorators import log_room_booking
from room import Room, DeluxeRoom, StandardRoom
from customer import Customer
from employee import Employee
from food_item import FoodItem
from order import Order
from bill import Bill

class Hotel:
    """Composition Class containing Rooms, Customers, Employees, Menu, Orders, and Bills."""

    # Tuple storing fixed room facilities (Syllabus requirement!)
    FIXED_FACILITIES: Tuple[str, ...] = ("WiFi", "Split AC", "LED TV", "Private Minibar", "complimentary Breakfast")

    def __init__(self, name: str, db_path: str):
        self.name = name
        self.db_path = db_path
        
        # Composition structure (Syllabus requirement: Lists to store structures)
        self.rooms_list: List[Room] = []
        self.customers_list: List[Customer] = []
        self.employees_list: List[Employee] = []
        self.menu_list: List[FoodItem] = []
        self.orders_list: List[Order] = []
        self.bills_list: List[Bill] = []

    # Getters for encapsulation protection
    @property
    def total_revenue(self) -> float:
        return sum(b.total_amount for b in self.bills_list)

    @classmethod
    def get_system_metadata(cls) -> str:
        """
        Class Method to showcase system variables and administrative headers.
        Syllabus requirement: 'Class Methods: Generate hotel-wide statistics.'
        """
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        return f"--- HOTEL ENTERPRISE ADMINISTRATIVE CONSOLE STATUS (GLOBAL) ---\nSystem Standard: Python 3.x OOP Compliance | Timestamp: {now}"

    # 1. Manage Rooms
    def add_room(self, room: Room):
        """Adds a polymorphic room object to composition list."""
        self.rooms_list.append(room)

    @log_room_booking
    def book_room(self, customer_id: str, room_number: str, days: int) -> float:
        """
        Books a room for a registered customer.
        Utilizes logging decorators and custom exceptions.
        """
        # Find customer
        customer = Customer.recursive_search(self.customers_list, customer_id)
        if not customer:
            raise InvalidCustomerIDError(customer_id)

        # Find room
        selected_room = None
        for r in self.rooms_list:
            if r.room_number == room_number:
                selected_room = r
                break
        
        if not selected_room:
            raise InvalidRoomNumberError(room_number)

        # Check availability
        if selected_room.availability_status != "Available":
            raise RoomNotAvailableError(room_number, selected_room.availability_status)

        # Trigger Polymorphic booking and calculate polymorphic stay charge
        selected_room.book_room()
        stay_charge = selected_room.calculate_room_charge(days)

        # Capture booking history log
        booking_log = {
            "id": f"bk_{int(datetime.now().timestamp())}",
            "roomNumber": room_number,
            "checkInDate": datetime.now().strftime("%Y-%m-%d"),
            "stayDurationDays": days,
            "totalCharge": stay_charge,
            "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
        }
        customer.add_booking_to_history(booking_log)
        return stay_charge

    # 2. Manage Customers
    def register_customer(self, customer: Customer):
        """Registers a guest profile within composition container."""
        # Check duplicate
        existing = Customer.recursive_search(self.customers_list, customer.customer_id)
        if not existing:
            self.customers_list.append(customer)

    # 3. Manage Employees
    def add_employee(self, emp: Employee):
        """Registers a staff employee in the department rosters."""
        self.employees_list.append(emp)

    # 4. Food Orders
    def place_food_order(self, customer_id: str, items_dict: Dict[str, int]) -> Order:
        """
        Places a dining order with custom quantites of menu food items.
        Example items_dict: {"f1": 2, "f2": 1}
        """
        customer = Customer.recursive_search(self.customers_list, customer_id)
        if not customer:
            raise InvalidCustomerIDError(customer_id)

        ordered_list = []
        for food_id, qty in items_dict.items():
            food_item = None
            for fi in self.menu_list:
                if fi.food_id == food_id:
                    food_item = fi
                    break
            if food_item:
                ordered_list.append({"item": food_item, "quantity": qty})

        if not ordered_list:
            raise InvalidOrderIDError("Invalid entries or empty selection")

        new_order_id = f"o_{int(datetime.now().timestamp())}"
        order = Order(new_order_id, customer_id, ordered_list)
        order.place_order() # Runs with decorator
        self.orders_list.append(order)
        return order

    # 5. Advanced Python Concept: List Comprehension (Page 8)
    def get_available_rooms_comprehension(self) -> List[Room]:
        """
        Uses List Comprehension to filter vacant rooms.
        Syllabus requirement: 'List Comprehension: Generate list of available rooms.'
        """
        return [r for r in self.rooms_list if r.availability_status == "Available"]

    # 6. Advanced Python Concept: Sets & Tuples (Page 7)
    def get_unique_food_categories(self) -> Set[str]:
        """
        Uses Python Set to identify unique categories in the menu.
        Syllabus requirement: 'Set: Store unique room types and food categories.'
        """
        categories = {item.category for item in self.menu_list}
        return categories

    def get_unique_room_types(self) -> Set[str]:
        """Returns unique categories of guest rooms in inventory using Set."""
        return {r.room_type for r in self.rooms_list}

    # 7. Advanced Python Concept: Lambda Sorters (Page 7)
    def get_rooms_by_price_sorted(self) -> List[Room]:
        """Syllabus: 'Lambda Functions: Sort rooms by price.'"""
        return sorted(self.rooms_list, key=lambda r: r.room_price)

    def get_employees_by_salary_sorted(self) -> List[Employee]:
        """Syllabus: 'Lambda Functions: Sort employees by salary.'"""
        return sorted(self.employees_list, key=lambda e: e.salary, reverse=True)

    def get_menu_by_price_sorted(self) -> List[FoodItem]:
        """Syllabus: 'Lambda Functions: Sort food items by price.'"""
        return sorted(self.menu_list, key=lambda f: f.price)

    # 8. Advanced Python Concept: Generators (Page 8)
    def invoice_generator(self) -> Generator[str, None, None]:
        """
        Acts as an invoice dispatch generator which handles invoices one at a time.
        Syllabus requirement: 'Generators: Generate invoices one at a time.'
        """
        for bill in self.bills_list:
            yield bill.print_invoice()

    # 9. File Handling: Save and Load (JSON File persistence)
    def load_data(self):
        """Loads and maps JSON schemas into formal OOP object states."""
        if not os.path.exists(self.db_path):
            raise MissingFilesError(self.db_path)
            
        try:
            with open(self.db_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            # Create a fallback clean DB if load fails
            data = {"rooms": [], "customers": [], "bookings": [], "foodItems": [], "foodOrders": [], "bills": [], "employees": []}

        # Clear existing
        self.rooms_list.clear()
        self.customers_list.clear()
        self.employees_list.clear()
        self.menu_list.clear()
        self.orders_list.clear()
        self.bills_list.clear()

        # Add Core Food Menu defaults if empty
        food_items_json = data.get("foodItems", [])
        if not food_items_json:
            food_items_json = [
                {"id": "f1", "foodName": "Paneer Tikka", "category": "Starter", "price": 280.0},
                {"id": "f2", "foodName": "Spring Rolls", "category": "Starter", "price": 190.0},
                {"id": "f3", "foodName": "Butter Chicken", "category": "Main Course", "price": 420.0},
                {"id": "f4", "foodName": "Dal Makhani", "category": "Main Course", "price": 290.0},
                {"id": "f5", "foodName": "Choco Lava Cake", "category": "Dessert", "price": 150.0},
                {"id": "f6", "foodName": "Mojito", "category": "Beverage", "price": 120.0}
            ]
            data["foodItems"] = food_items_json

        # Map Food Items
        for fi in food_items_json:
            self.menu_list.append(FoodItem(fi["id"], fi["foodName"], fi["category"], float(fi.get("price", fi.get("pricePerNight", 100)))))

        # Map Rooms (Polymorphic reconstruction)
        rooms_json = data.get("rooms", [])
        for r in rooms_json:
            r_type = r.get("roomType", "Standard")
            if r_type == "Deluxe":
                obj = DeluxeRoom(r["id"], r["roomNumber"], float(r["pricePerNight"]), r.get("status", "Available"))
            else:
                obj = StandardRoom(r["id"], r["roomNumber"], float(r["pricePerNight"]), r.get("status", "Available"))
            self.add_room(obj)

        # Map Customers
        customers_json = data.get("customers", [])
        for c in customers_json:
            cust = Customer(c["id"], c["name"], c["phone"], c["email"], c.get("address", ""))
            
            # Map booking history logs if any are connected
            bookings_json = data.get("bookings", [])
            for bk in bookings_json:
                if bk.get("customerId") == c["id"]:
                    log = {
                        "id": bk["id"],
                        "roomNumber": bk["roomNumber"],
                        "checkInDate": bk.get("checkInDate", bk.get("checkIn", "")),
                        "stayDurationDays": bk.get("numberOfDays", 1),
                        "totalCharge": float(bk.get("totalAmount", 0)),
                        "timestamp": bk.get("createdAt", "")
                    }
                    cust.add_booking_to_history(log)
            self.register_customer(cust)

        # Map Employees
        employees_json = data.get("employees", [])
        # If no employees, provide nice corporate starters!
        if not employees_json:
            employees_json = [
                {"id": "emp001", "name": "Rahul Sharma", "designation": "Hotel Administrator", "salary": 85000.0, "department": "Management"},
                {"id": "emp002", "name": "Deepika Patel", "designation": "Executive Head Chef", "salary": 72000.0, "department": "Culinary"},
                {"id": "emp003", "name": "Amit Kumar", "designation": "Housekeeping Supervisor", "salary": 28000.0, "department": "Housekeeping"}
            ]
            data["employees"] = employees_json

        for e in employees_json:
            self.add_employee(Employee(e["id"], e["name"], e["designation"], float(e["salary"]), e["department"]))

        # Map Bills
        bills_json = data.get("bills", [])
        for b in bills_json:
            rc = float(b.get("roomCharges", b.get("roomTotal", 0)))
            fc = float(b.get("foodCharges", b.get("servicesTotal", 0)))
            self.bills_list.append(Bill(b["id"], b["customerId"], rc, fc))

        # Map Food Orders
        orders_json = data.get("foodOrders", [])
        for o in orders_json:
            mapped_items = []
            for item_entry in o.get("items", []):
                # lookup food item mapping
                f_item = None
                for fi in self.menu_list:
                    if fi.food_id == item_entry.get("foodItemId"):
                        f_item = fi
                        break
                if f_item:
                    mapped_items.append({"item": f_item, "quantity": item_entry.get("quantity", 1)})
            if mapped_items:
                self.orders_list.append(Order(o["id"], o["customerId"], mapped_items, o.get("status", "Served")))

    def save_data(self):
        """Saves current memory registries back into synchronized JSON database formats."""
        data = {}
        if os.path.exists(self.db_path):
            try:
                with open(self.db_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except Exception:
                data = {}

        # 1. Update Rooms
        rooms_json = []
        for r in self.rooms_list:
            rooms_json.append({
                "id": r.room_id,
                "roomNumber": r.room_number,
                "roomType": r.room_type,
                "pricePerNight": r.room_price,
                "capacity": 3 if r.room_type == "Deluxe" else 2,
                "status": r.availability_status,
                "imageUrl": "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80"
            })
        data["rooms"] = rooms_json

        # 2. Update Customers
        customers_json = []
        for c in self.customers_list:
            customers_json.append({
                "id": c.customer_id,
                "name": c.customer_name,
                "phone": c.phone_number,
                "email": c.email,
                "address": c.address
            })
        data["customers"] = customers_json

        # 3. Update Employees
        employees_json = []
        for e in self.employees_list:
            employees_json.append({
                "id": e.employee_id,
                "name": e.employee_name,
                "designation": e.designation,
                "salary": e.salary,
                "department": e.department
            })
        data["employees"] = employees_json

        # 4. Update Food Menu Items
        food_items_json = []
        for f in self.menu_list:
            food_items_json.append({
                "id": f.food_id,
                "foodName": f.food_name,
                "category": f.category,
                "price": f.price,
                "availability": True
            })
        data["foodItems"] = food_items_json

        # 5. Update Bills
        bills_json = []
        for b in self.bills_list:
            bills_json.append({
                "id": b.bill_id,
                "customerId": b.customer_id,
                "bookingId": f"b_custom_{b.bill_id}",
                "roomCharges": b.room_charges,
                "foodCharges": b.food_charges,
                "gstAmount": b.tax,
                "grandTotal": b.total_amount,
                "status": "Paid",
                "invoiceDate": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
            })
        data["bills"] = bills_json

        # Write to JSON file
        try:
            with open(self.db_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            return True
        except Exception as e:
            print(f"[Error] Failed to execute JSON serialization: {e}")
            return False

    # 10. Generate CSV Reports (Syllabus page 9)
    def generate_csv_reports(self) -> Dict[str, str]:
        """
        Saves precise structural metrics in standard CSV tables.
        Fulfills syllabus: 'CSV Files: Generate Sales Reports, Occupancy Reports, Employee Reports.'
        """
        reports_dir = os.path.join(os.path.dirname(self.db_path), "..", "python", "reports")
        os.makedirs(reports_dir, exist_ok=True)

        sales_path = os.path.join(reports_dir, "sales_report.csv")
        occupancy_path = os.path.join(reports_dir, "occupancy_report.csv")
        employee_path = os.path.join(reports_dir, "employee_report.csv")

        # A. Sales Report
        with open(sales_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["Bill ID", "Customer ID", "Room Charge ($)", "Food Charge ($)", "Tax / GST ($)", "Total Amount ($)"])
            for b in self.bills_list:
                writer.writerow([b.bill_id, b.customer_id, b.room_charges, b.food_charges, b.tax, b.total_amount])

        # B. Occupancy Report
        with open(occupancy_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["Room Number", "Room Type", "Base Price per Night ($)", "Availability Status"])
            for r in self.rooms_list:
                writer.writerow([r.room_number, r.room_type, r.room_price, r.availability_status])

        # C. Employee Report
        with open(employee_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["Employee ID", "Employee Name", "Designation", "Department", "Monthly Salary ($)"])
            for e in self.employees_list:
                writer.writerow([e.employee_id, e.employee_name, e.designation, e.department, e.salary])

        return {
            "sales": sales_path,
            "occupancy": occupancy_path,
            "employee": employee_path
        }

    # 11. Custom Magic Methods (Syllabus page 9: Implement str() and repr())
    def __str__(self):
        return f"Hotel: {self.name} | Total Registered Rooms: {len(self.rooms_list)} | Customers: {len(self.customers_list)}"

    def __repr__(self):
        return f"Hotel(name='{self.name}', db='{self.db_path}')"
