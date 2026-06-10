# -*- coding: utf-8 -*-
"""
Hotel & Restaurant Management System - Billing Module
Handles corporate invoicing, taxes, GST calculation, and cash/card ledgers.
"""

from decorators import log_bill_generation

class Bill:
    """Class representing structural financial transactions and room clearances."""

    # Pre-configured tax percentage constant
    GST_PERCENTAGE = 18.0  # 18% standard luxury hotel GST in India

    def __init__(self, bill_id: str, customer_id: str, room_charges: float, food_charges: float):
        self._bill_id = bill_id
        self._customer_id = customer_id
        # Privately encapsulated indicators as per prompt constraints
        self.__room_charges = room_charges
        self.__food_charges = food_charges
        self.__tax = 0.0
        self.__total_amount = 0.0
        self.generate_bill()

    @property
    def bill_id(self) -> str:
        return self._bill_id

    @property
    def customer_id(self) -> str:
        return self._customer_id

    @property
    def room_charges(self) -> float:
        return self.__room_charges

    @property
    def food_charges(self) -> float:
        return self.__food_charges

    @property
    def tax(self) -> float:
        return self.__tax

    @property
    def total_amount(self) -> float:
        return self.__total_amount

    @staticmethod
    def calculate_gst(subtotal: float) -> float:
        """
        Static Method to determine structural GST.
        Fulfills syllabus requirement: 'Static Methods: Utility methods such as GST calculation.'
        """
        return subtotal * (Bill.GST_PERCENTAGE / 100.0)

    def calculate_tax(self) -> float:
        """Determines the tax portion of the bill."""
        subtotal = self.__room_charges + self.__food_charges
        self.__tax = self.calculate_gst(subtotal)
        return self.__tax

    @log_bill_generation
    def generate_bill(self) -> float:
        """Calculates final billing total including regional tax charges."""
        subtotal = self.__room_charges + self.__food_charges
        self.calculate_tax()
        self.__total_amount = subtotal + self.__tax
        return self.__total_amount

    def print_invoice(self) -> str:
        """Generates dynamic printable text receipts."""
        invoice = (f"\n==================================================\n"
                   f"              HOTEL ROYAL PALACE INVOICE          \n"
                   f"==================================================\n"
                   f"  Invoice Ref : {self._bill_id}\n"
                   f"  Register ID : {self._customer_id}\n"
                   f"--------------------------------------------------\n"
                   f"  Room Rental charges : ${self.__room_charges:,.2f}\n"
                   f"  Kitchen Food Orders : ${self.__food_charges:,.2f}\n"
                   f"  ----------------------------------------------\n"
                   f"  Subtotal Summary    : ${self.__room_charges + self.__food_charges:,.2f}\n"
                   f"  GST Calculated ({self.GST_PERCENTAGE}%) : ${self.__tax:,.2f}\n"
                   f"--------------------------------------------------\n"
                   f"  GRAND TOTAL PAYABLE : ${self.__total_amount:,.2f}\n"
                   f"==================================================\n")
        return invoice

    def __str__(self):
        return f"Invoice {self._bill_id} | Guest {self._customer_id} | Total Amount: ${self.__total_amount:.2f}"

    def __repr__(self):
        return f"Bill(id='{self._bill_id}', guest='{self._customer_id}', total={self.__total_amount})"
