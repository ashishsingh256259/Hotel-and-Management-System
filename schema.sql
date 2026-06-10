-- ==========================================
-- HOTEL & RESTAURANT MANAGEMENT SYSTEM
-- PRODUCTION-READY MYSQL SCHEMA
-- ==========================================

-- Create Database
CREATE DATABASE IF NOT EXISTS hotel_management_db;
USE hotel_management_db;

-- Enable Foreign Key constraints
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------
-- 1. Table: users
-- Core Authentication Table for Admin & Client portals
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) NOT NULL,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
  `customer_id` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 2. Table: rooms
-- Physical inventory of hotel rooms
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS `rooms` (
  `id` VARCHAR(50) NOT NULL,
  `room_number` VARCHAR(10) NOT NULL UNIQUE,
  `room_type` ENUM('Standard', 'Deluxe', 'Suite') NOT NULL DEFAULT 'Standard',
  `price_per_night` DECIMAL(10, 2) NOT NULL,
  `capacity` INT NOT NULL DEFAULT 2,
  `status` ENUM('Available', 'Occupied') NOT NULL DEFAULT 'Available',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_room_number` (`room_number`),
  INDEX `idx_room_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 3. Table: customers
-- Guest directories
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `address` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_customer_email` (`email`),
  INDEX `idx_customer_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 4. Table: bookings
-- Guest room stay reservations
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` VARCHAR(50) NOT NULL,
  `customer_id` VARCHAR(50) NOT NULL,
  `room_number` VARCHAR(10) NOT NULL,
  `check_in_date` DATE NOT NULL,
  `check_out_date` DATE NOT NULL,
  `number_of_days` INT NOT NULL,
  `total_amount` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('Booked', 'Checked-In', 'Checked-Out', 'Cancelled') NOT NULL DEFAULT 'Booked',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_booking_dates` (`check_in_date`, `check_out_date`),
  INDEX `idx_booking_status` (`status`),
  CONSTRAINT `fk_bookings_customer` 
    FOREIGN KEY (`customer_id`) 
    REFERENCES `customers` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_room` 
    FOREIGN KEY (`room_number`) 
    REFERENCES `rooms` (`room_number`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 5. Table: food_items
-- Culinary restaurant menu list
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS `food_items` (
  `id` VARCHAR(50) NOT NULL,
  `food_name` VARCHAR(100) NOT NULL,
  `category` ENUM('Starter', 'Main Course', 'Dessert', 'Beverage') NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `availability` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_food_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 6. Table: food_orders
-- Customer meal orders
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS `food_orders` (
  `id` VARCHAR(50) NOT NULL,
  `customer_id` VARCHAR(50) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `total_amount` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('Pending', 'Served', 'Cancelled') NOT NULL DEFAULT 'Pending',
  `order_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_order_status` (`status`),
  CONSTRAINT `fk_orders_customer` 
    FOREIGN KEY (`customer_id`) 
    REFERENCES `customers` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 6b. Table: food_order_details
-- Join table for individual items in a food order
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS `food_order_details` (
  `order_id` VARCHAR(50) NOT NULL,
  `food_item_id` VARCHAR(50) NOT NULL,
  `food_name` VARCHAR(100) NOT NULL,
  `quantity` INT NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (`order_id`, `food_item_id`),
  CONSTRAINT `fk_details_order` 
    FOREIGN KEY (`order_id`) 
    REFERENCES `food_orders` (`id`) 
    ON DELETE CASCADE,
  CONSTRAINT `fk_details_food` 
    FOREIGN KEY (`food_item_id`) 
    REFERENCES `food_items` (`id`) 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 7. Table: bills
-- Fiscal receipts automatically compiled upon checkout
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS `bills` (
  `id` VARCHAR(50) NOT NULL,
  `invoice_number` VARCHAR(30) NOT NULL UNIQUE,
  `invoice_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `customer_id` VARCHAR(50) NOT NULL,
  `booking_id` VARCHAR(50) NULL,
  `room_charges` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `food_charges` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `gst_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- 18% GST Rate
  `grand_total` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('Paid', 'Unpaid') NOT NULL DEFAULT 'Unpaid',
  PRIMARY KEY (`id`),
  INDEX `idx_invoice_no` (`invoice_number`),
  INDEX `idx_bill_status` (`status`),
  CONSTRAINT `fk_bills_customer` 
    FOREIGN KEY (`customer_id`) 
    REFERENCES `customers` (`id`) 
    ON DELETE CASCADE,
  CONSTRAINT `fk_bills_booking` 
    FOREIGN KEY (`booking_id`) 
    REFERENCES `bookings` (`id`) 
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add users backlink constraint to verify role-based linkage
ALTER TABLE `users` 
  ADD CONSTRAINT `fk_users_customer` 
  FOREIGN KEY (`customer_id`) 
  REFERENCES `customers` (`id`) 
  ON DELETE CASCADE;
