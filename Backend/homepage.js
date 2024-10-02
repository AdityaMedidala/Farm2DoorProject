const express = require('express');
const path = require('path');
const app = express();
app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'homepage.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname,'frontend', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'signup.html'));
});