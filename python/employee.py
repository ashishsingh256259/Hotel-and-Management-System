# -*- coding: utf-8 -*-
"""
Hotel & Restaurant Management System - Employee Module
Models organizational hierarchy, roles, and employee records using OOP principles.
"""

class Employee:
    """Class representing hotel administrative and service personnel."""

    def __init__(self, employee_id: str, employee_name: str, designation: str, salary: float, department: str):
        self._employee_id = employee_id
        self._employee_name = employee_name
        self._designation = designation
        # Private attribute to protect salary info (Encapsulation requirement!)
        self.__salary = salary
        self._department = department

    # Getters and Setters for salary
    @property
    def employee_id(self) -> str:
        return self._employee_id

    @property
    def employee_name(self) -> str:
        return self._employee_name

    @employee_name.setter
    def employee_name(self, name: str):
        self._employee_name = name

    @property
    def designation(self) -> str:
        return self._designation

    @designation.setter
    def designation(self, desig: str):
        self._designation = desig

    @property
    def department(self) -> str:
        return self._department

    @department.setter
    def department(self, dept: str):
        self._department = dept

    # Secure salary access
    @property
    def salary(self) -> float:
        return self.__salary

    @salary.setter
    def salary(self, value: float):
        if value >= 0:
            self.__salary = value
        else:
            raise ValueError("Employee salary cannot be negative.")

    def add_employee(self) -> str:
        """Saves employee profile status."""
        return f"Employee {self._employee_name} ({self._designation}) joined department: {self._department}."

    def update_employee(self, name: str, designation: str, salary: float, department: str):
        """Updates employee demographic and position information."""
        self._employee_name = name
        self._designation = designation
        self.salary = salary # triggers setter validation
        self._department = department

    def display_employee(self) -> str:
        """Formatted organizational presentation of the employee card."""
        return (f"=== EMPLOYEE PROFILE: {self._employee_id} ===\n"
                f"  * Name       : {self._employee_name}\n"
                f"  * Position   : {self._designation}\n"
                f"  * Department : {self._department}\n"
                f"  * Monthly Pay: ${self.salary:,.2f}\n"
                f"=====================================")

    def __str__(self):
        return f"{self._employee_id} | {self._employee_name} ({self._designation}) - Dept: {self._department}"

    def __repr__(self):
        return f"Employee(id='{self._employee_id}', name='{self._employee_name}', dept='{self._department}')"
