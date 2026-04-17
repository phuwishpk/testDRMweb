-- NOTE:
-- Import this file into your existing database (เช่น เลือกฐานข้อมูล `thaifordrmdb` ใน phpMyAdmin ก่อน)
-- ไฟล์นี้จะสร้าง "ตาราง" เท่านั้น (ไม่สร้าง database) เพื่อให้ import บน hosting ได้ง่ายขึ้น

-- Create Table (เดิม)
CREATE TABLE IF NOT EXISTS items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CMS Tables

-- Admin (มีเพียง 1 user: admin)
CREATE TABLE IF NOT EXISTS admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_admins_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Uploaded images (media library)
CREATE TABLE IF NOT EXISTS media (
  id INT PRIMARY KEY AUTO_INCREMENT,
  file_path VARCHAR(500) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_media_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Posts
-- content_json เก็บเป็น blocks (text/link/image) เพื่อกำหนดขนาด/ตำแหน่งรูปได้
CREATE TABLE IF NOT EXISTS posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category ENUM('thai_forum','news','event') NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(160) NOT NULL,
  summary TEXT,
  content_json JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_posts_slug (slug),
  INDEX idx_posts_category_published (category, published_at),
  INDEX idx_posts_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comments (ผู้ชมภายนอกคอมเมนต์ได้โดยไม่ต้องล็อกอิน)
CREATE TABLE IF NOT EXISTS comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  author_name VARCHAR(80) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_hash CHAR(64) NULL,
  INDEX idx_comments_post_created (post_id, created_at),
  CONSTRAINT fk_comments_post
    FOREIGN KEY (post_id) REFERENCES posts(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Sample Data
INSERT INTO items (name, description) VALUES 
('Sample Item 1', 'This is a sample item 1'),
('Sample Item 2', 'This is a sample item 2'),
('Sample Item 3', 'This is a sample item 3');
