const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend'))); 

mongoose.connect('mongodb://localhost:27017/otp_login', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const UserSchema = new mongoose.Schema({
    username: String,
    password: String
});

const User = mongoose.model('User', UserSchema);

// Serve the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'login.html'), function(err) {
        if (err) {
            res.status(500).send(err);  
        }
    });
});


// Handle login POST request
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        console.log(`Attempting login for user: ${username}`);
        const user = await User.findOne({ username });

        if (!user) {
            console.log(`User not found: ${username}`);
            return res.status(404).json({ message: 'User not found. Please register.' });
        }

        if (password !== user.password) {
            console.log(`Invalid password for user: ${username}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log(`Login successful for user: ${username}`);
        res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});