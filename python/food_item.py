# -*- coding: utf-8 -*-
"""
Hotel & Restaurant Management System - Food Item Module
Defines restaurant dishes, items, classes, and price adjustments.
"""

class FoodItem:
    """Class representing restaurant culinary dishes."""

    def __init__(self, food_id: str, food_name: str, category: str, price: float):
        self._food_id = food_id
        self._food_name = food_name
        self._category = category  # e.g., Starter, Main Course, Dessert, Beverage
        self._price = price

    @property
    def food_id(self) -> str:
        return self._food_id

    @property
    def food_name(self) -> str:
        return self._food_name

    @property
    def category(self) -> str:
        return self._category

    @property
    def price(self) -> float:
        return self._price

    @price.setter
    def price(self, new_price: float):
        if new_price >= 0:
            self._price = new_price
        else:
            raise ValueError("Dish price cannot be negative!")

    def display_food(self) -> str:
        """Formatted presentation of restaurant menu dishes."""
        return f"[{self._food_id}] {self._food_name} ({self._category}) - Price: ${self._price:.2f}"

    def update_price(self, new_price: float):
        """Updates the price of the food item."""
        self.price = new_price

    def __str__(self):
        return f"{self._food_name} [${self._price:.2f}]"

    def __repr__(self):
        return f"FoodItem(id='{self._food_id}', name='{self._food_name}', price={self._price})"
