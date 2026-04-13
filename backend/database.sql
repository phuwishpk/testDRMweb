-- Create Database
CREATE DATABASE IF NOT EXISTS simple_web_db;

-- Use Database
USE simple_web_db;

-- Create Table
CREATE TABLE IF NOT EXISTS items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert Sample Data
INSERT INTO items (name, description) VALUES 
('Sample Item 1', 'This is a sample item 1'),
('Sample Item 2', 'This is a sample item 2'),
('Sample Item 3', 'This is a sample item 3');
