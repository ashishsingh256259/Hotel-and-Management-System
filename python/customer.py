# -*- coding: utf-8 -*-
"""
Hotel & Restaurant Management System - Customer Module
Encapsulates guest records, histories, and recursive lookup algorithms.
"""

from typing import List, Dict, Any

class Customer:
    """Class representing registered hotel customers."""

    def __init__(self, customer_id: str, customer_name: str, phone_number: str, email: str, address: str = ""):
        # Encapsulated attributes
        self._customer_id = customer_id
        self._customer_name = customer_name
        self._phone_number = phone_number
        self._email = email
        self._address = address
        self._booking_history: List[Dict[str, Any]] = []

    # Getters and Setters demonstrating encapsulation
    @property
    def customer_id(self) -> str:
        return self._customer_id

    @property
    def customer_name(self) -> str:
        return self._customer_name

    @customer_name.setter
    def customer_name(self, name: str):
        if name.strip():
            self._customer_name = name
        else:
            raise ValueError("Customer name cannot be empty.")

    @property
    def phone_number(self) -> str:
        return self._phone_number

    @phone_number.setter
    def phone_number(self, phone: str):
        self._phone_number = phone

    @property
    def email(self) -> str:
        return self._email

    @email.setter
    def email(self, mail: str):
        self._email = mail

    @property
    def address(self) -> str:
        return self._address

    @address.setter
    def address(self, addr: str):
        self._address = addr

    @property
    def booking_history(self) -> List[Dict[str, Any]]:
        return self._booking_history

    def register_customer(self) -> str:
        """Confirms and returns registration status details."""
        return f"Customer '{self._customer_name}' registered successfully with ID: {self._customer_id}."

    def update_details(self, name: str, phone: str, email: str, address: str = ""):
        """Saves updated demographic info to instance profile."""
        self.customer_name = name
        self.phone_number = phone
        self.email = email
        self.address = address

    def view_booking_history(self) -> List[Dict[str, Any]]:
        """Returns the booking history records."""
        return self._booking_history

    def add_booking_to_history(self, booking_record: Dict[str, Any]):
        """Adds a historic reservation log."""
        self._booking_history.append(booking_record)

    @classmethod
    def recursive_search(cls, customers_list: list, target_id: str, index: int = 0) -> Any:
        """
        Recursively searches the customer records list for a specific ID.
        This fulfills the critical user-defined recursive function requirement!
        """
        # Base Case 1: Index out of bounds (not found)
        if index >= len(customers_list):
            return None
        
        # Base Case 2: Matching record found
        customer = customers_list[index]
        if customer.customer_id == target_id:
            return customer
            
        # Recursive Step: Check next index
        return cls.recursive_search(customers_list, target_id, index + 1)

    def __str__(self):
        return f"Customer ID: {self._customer_id} | Name: {self._customer_name} | Contact: {self._phone_number}"

    def __repr__(self):
        return f"Customer(id='{self._customer_id}', name='{self._customer_name}', email='{self._email}')"
