const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// MySQL Connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

// Routes

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// GET all items
app.get('/api/items', (req, res) => {
  connection.query('SELECT * FROM items', (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(results);
    }
  });
});

// GET item by ID
app.get('/api/items/:id', (req, res) => {
  const id = req.params.id;
  connection.query('SELECT * FROM items WHERE id = ?', [id], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      if (results.length > 0) {
        res.json(results[0]);
      } else {
        res.status(404).json({ message: 'Item not found' });
      }
    }
  });
});

// POST - create new item
app.post('/api/items', (req, res) => {
  const { name, description } = req.body;
  const query = 'INSERT INTO items (name, description) VALUES (?, ?)';
  
  connection.query(query, [name, description], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json({ 
        id: result.insertId, 
        name, 
        description,
        message: 'Item created successfully' 
      });
    }
  });
});

// PUT - update item
app.put('/api/items/:id', (req, res) => {
  const id = req.params.id;
  const { name, description } = req.body;
  const query = 'UPDATE items SET name = ?, description = ? WHERE id = ?';
  
  connection.query(query, [name, description, id], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'Item updated successfully' });
    }
  });
});

// DELETE - delete item
app.delete('/api/items/:id', (req, res) => {
  const id = req.params.id;
  connection.query('DELETE FROM items WHERE id = ?', [id], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'Item deleted successfully' });
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
