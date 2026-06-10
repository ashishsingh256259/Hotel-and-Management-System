# -*- coding: utf-8 -*-
"""
Hotel & Restaurant Management System - Order Module
Models restaurant dining orders and handles statuses.
"""

from typing import List, Dict, Any
from decorators import log_food_ordering
from food_item import FoodItem

class Order:
    """Class representing dynamic kitchen or dining room food orders."""

    def __init__(self, order_id: str, customer_id: str, ordered_items: List[Dict[str, Any]], order_status: str = "Pending"):
        self._order_id = order_id
        self._customer_id = customer_id
        # ordered_items is a list of dict: {"item": FoodItem, "quantity": int}
        self._ordered_items = ordered_items
        self._order_status = order_status  # "Pending", "Served", "Cancelled"
        self._total_amount = self.calculate_total()

    @property
    def order_id(self) -> str:
        return self._order_id

    @property
    def customer_id(self) -> str:
        return self._customer_id

    @property
    def ordered_items(self) -> List[Dict[str, Any]]:
        return self._ordered_items

    @property
    def total_amount(self) -> float:
        return self._total_amount

    @property
    def order_status(self) -> str:
        return self._order_status

    @order_status.setter
    def order_status(self, status: str):
        self._order_status = status

    def calculate_total(self) -> float:
        """Calculates cumulative sum of items multiplied by quantities."""
        total = 0.0
        for entry in self._ordered_items:
            item = entry["item"]
            qty = entry["quantity"]
            total += item.price * qty
        self._total_amount = total
        return total

    @log_food_ordering
    def place_order(self) -> str:
        """Processes the order placement."""
        self._order_status = "Served"
        return f"Order {self._order_id} placed successfully. Status: {self._order_status}."

    def cancel_order(self) -> bool:
        """Cancels order if not already served."""
        if self._order_status == "Pending":
            self._order_status = "Cancelled"
            return True
        return False

    def __str__(self):
        item_summary = ", ".join([f"{entry['item'].food_name} x {entry['quantity']}" for entry in self._ordered_items])
        return f"Order ID: {self._order_id} | Customer: {self._customer_id} | Items: [{item_summary}] | Total: ${self._total_amount:.2f}"

    def __repr__(self):
        return f"Order(id='{self._order_id}', customer='{self._customer_id}', total={self._total_amount})"
