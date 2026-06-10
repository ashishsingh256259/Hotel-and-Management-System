# -*- coding: utf-8 -*-
"""
Hotel & Restaurant Management System - Rooms module
Defines Abstraction, Inheritance, Polymorphism, and Encapsulation for Room structures.
"""

from abc import ABC, abstractmethod

class Room(ABC):
    """Abstract Base Class representing a customizable Hotel Room."""

    def __init__(self, room_id: str, room_number: str, room_type: str, room_price: float, availability_status: str):
        # Encapsulation via protected/private fields
        self._room_id = room_id
        self._room_number = room_number
        self._room_type = room_type
        self._room_price = room_price
        self._availability_status = availability_status  # "Available", "Occupied", "Under Maintenance"

    # Properties for getter / setter structures to demonstrate encapsulation
    @property
    def room_id(self):
        return self._room_id

    @property
    def room_number(self):
        return self._room_number

    @property
    def room_type(self):
        return self._room_type

    @property
    def room_price(self):
        return self._room_price

    @room_price.setter
    def room_price(self, price: float):
        if price >= 0:
            self._room_price = price
        else:
            raise ValueError("Room price cannot be negative!")

    @property
    def availability_status(self):
        return self._availability_status

    @availability_status.setter
    def availability_status(self, status: str):
        self._availability_status = status

    @abstractmethod
    def display_room_details(self) -> str:
        """Abstract method to print specific polymorphic room characteristics."""
        pass

    @abstractmethod
    def calculate_room_charge(self, days: int) -> float:
        """Abstract method calculating price based on stay length & custom amenities."""
        pass

    def book_room(self):
        """Standard method to book the room."""
        if self._availability_status == "Available":
            self._availability_status = "Occupied"
            return True
        return False

    def __str__(self):
        """Magic Method __str__ for clean string representations."""
        return f"Room {self._room_number} ({self._room_type}) - Price: ${self._room_price}/night - Status: {self._availability_status}"

    def __repr__(self):
        """Magic Method __repr__ for machine debugging serialization."""
        return f"Room(id='{self._room_id}', number='{self._room_number}', type='{self._room_type}', price={self._room_price}, status='{self._availability_status}')"


class DeluxeRoom(Room):
    """Derived Class representing Deluxe suites inheriting from Abstract Room."""

    def __init__(self, room_id: str, room_number: str, room_price: float, availability_status: str,
                 wifi: bool = True, minibar: bool = True, complimentary_breakfast: bool = True):
        super().__init__(room_id, room_number, "Deluxe", room_price, availability_status)
        self.wifi = wifi
        self.minibar = minibar
        self.complimentary_breakfast = complimentary_breakfast

    def display_room_details(self) -> str:
        wifi_str = "Included" if self.wifi else "Not Provided"
        minibar_str = "Equipped" if self.minibar else "Empty"
        breakfast_str = "Included (Free)" if self.complimentary_breakfast else "Chargeable"
        return (f"--- DELUXE SUITE DETAILED DIAGNOSIS ---\n"
                f"  * Suite Suite Number: {self.room_number}\n"
                f"  * Nightly Base Rent : ${self.room_price:.2f}\n"
                f"  * Status / Occupancy: {self.availability_status}\n"
                f"  * WiFi Service      : {wifi_str}\n"
                f"  * Private Minibar   : {minibar_str}\n"
                f"  * Premium Breakfast : {breakfast_str}\n"
                f"----------------------------------------")

    def calculate_room_charge(self, days: int) -> float:
        # Deluxe rooms have dynamic amenity costs added to baseline pricing
        base_charge = self.room_price * days
        amenities_charge = 0.0
        if self.minibar:
            amenities_charge += 45.0 * days  # $45 per day service charge
        if self.complimentary_breakfast:
            amenities_charge += 20.0 * days  # $20 per day catering adjustment
        return base_charge + amenities_charge


class StandardRoom(Room):
    """Derived Class representing budget-friendly standard rooms inheriting from Abstract Room."""

    def __init__(self, room_id: str, room_number: str, room_price: float, availability_status: str,
                 television: bool = True, air_conditioning: bool = True):
        super().__init__(room_id, room_number, "Standard", room_price, availability_status)
        self.television = television
        self.air_conditioning = air_conditioning

    def display_room_details(self) -> str:
        tv_str = "Yes" if self.television else "No"
        ac_str = "Yes (Split AC)" if self.air_conditioning else "Normal Fan Only"
        return (f"--- STANDARD RESIDENCE DETAILED DIAGNOSIS ---\n"
                f"  * Room Room Number: {self.room_number}\n"
                f"  * Nightly Base Rent: ${self.room_price:.2f}\n"
                f"  * Status / Tenant  : {self.availability_status}\n"
                f"  * Color Television  : {tv_str}\n"
                f"  * Air Conditioning  : {ac_str}\n"
                f"---------------------------------------------")

    def calculate_room_charge(self, days: int) -> float:
        base_charge = self.room_price * days
        addons = 0.0
        if self.air_conditioning:
            addons += 15.0 * days  # $15/day AC utility charge
        return base_charge + addons
