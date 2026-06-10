# -*- coding: utf-8 -*-
"""
Hotel & Restaurant Management System - Logging Decorators
Fulfills advanced academic specifications for functional decorators.
"""

import functools
import logging
from datetime import datetime

# Configure standard terminal logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

def log_room_booking(func):
    """Decorator to log room booking/reservation executions."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        logging.info("--> [Triggered Decorator] Attempting to execute Room Booking action...")
        start_time = datetime.now()
        try:
            result = func(*args, **kwargs)
            duration = (datetime.now() - start_time).total_seconds()
            logging.info(f"--> [Decorator Log] Room Booking operation completed successfully. Result: {result} (Time: {duration:.4f}s)")
            return result
        except Exception as e:
            logging.error(f"--> [Decorator Exception] Room Booking operation threw exception: '{e}'")
            raise e
    return wrapper

def log_food_ordering(func):
    """Decorator to log custom food ordering transactions."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        logging.info("--> [Triggered Decorator] Initiating Fresh Restaurant Food Order...")
        try:
            result = func(*args, **kwargs)
            logging.info(f"--> [Decorator Log] Food Order booked. Reference generated successfully.")
            return result
        except Exception as e:
            logging.error(f"--> [Decorator Exception] Food Order failed: '{e}'")
            raise e
    return wrapper

def log_bill_generation(func):
    """Decorator to log checkout invoice computations."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        logging.info("--> [Triggered Decorator] Compiling financial figures for checkout invoice generation...")
        try:
            result = func(*args, **kwargs)
            logging.info("--> [Decorator Log] Bill compiled and tax structures mapped successfully.")
            return result
        except Exception as e:
            logging.error(f"--> [Decorator Exception] Bill Calculation crashed or aborted: '{e}'")
            raise e
    return wrapper
