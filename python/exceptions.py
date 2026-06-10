# -*- coding: utf-8 -*-
"""
Hotel & Restaurant Management System - Custom Exception Handling
Extremely detailed custom exception classes to fulfill procedural and OOP requirements.
"""

class HotelException(Exception):
    """Base exception for the Hotel & Restaurant Management System."""
    pass

class InvalidRoomNumberError(HotelException):
    """Raised when a room number is invalid or does not exist."""
    def __init__(self, room_number):
        super().__init__(f"Invalid Room Number Error: Room '{room_number}' does not exist in inventory.")

class RoomNotAvailableError(HotelException):
    """Raised when a room is booked/occupied but requested for reservation."""
    def __init__(self, room_number, status):
        super().__init__(f"Room Not Available Error: Room '{room_number}' is currently '{status}' and cannot be booked.")

class InvalidCustomerIDError(HotelException):
    """Raised when a customer ID is invalid or cannot be found."""
    def __init__(self, customer_id):
        super().__init__(f"Invalid Customer ID Error: Customer with ID '{customer_id}' was not found.")

class InvalidOrderIDError(HotelException):
    """Raised when an order ID is invalid or cannot be found."""
    def __init__(self, order_id):
        super().__init__(f"Invalid Order ID Error: Restaurant order with ID '{order_id}' was not found.")

class InvalidBillAmountError(HotelException):
    """Raised when calculation results in negative or erroneous bill values."""
    def __init__(self, amount):
        super().__init__(f"Invalid Bill Amount Error: Calculated negative or invalid checkout sum: ${amount:.2f}")

class MissingFilesError(HotelException):
    """Raised when critical database files or reports are missing."""
    def __init__(self, filepath):
        super().__init__(f"Missing Files Error: Critical database path '{filepath}' could not be located.")

class IncorrectUserInputError(HotelException):
    """Raised when terminal inputs fail validation constraints."""
    def __init__(self, message):
        super().__init__(f"Incorrect User Input: {message}")
