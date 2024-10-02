const express = require('express');
const path = require('path');
const app = express();
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes for different HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});