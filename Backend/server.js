const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = 800;

const vegetablesDB = mongoose.createConnection('mongodb://localhost:27017/vegetables');
const usersDB = mongoose.createConnection('mongodb://localhost:27017/otp_login');
const customersDB = mongoose.createConnection('mongodb://localhost:27017/customers');

vegetablesDB.on('connected', () => console.log('Connected to vegetables database'));
usersDB.on('connected', () => console.log('Connected to users database'));
customersDB.on('connected', () => console.log('Connected to customers database'));

const CustomerSchema = new mongoose.Schema({
    name: String,
    address: String,
    orderDate: { type: Date, default: Date.now },
    orderDetails: [{
        vegetableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vegetable' },
        name: String,
        quantity: Number,
        price: Number
    }],
    totalAmount: Number
});

const Customer = customersDB.model('Customer', CustomerSchema);
//User Schema
const UserSchema = new mongoose.Schema({
    username: String,
    password: String
});

const User = usersDB.model('User', UserSchema);

// Vegetable Schema
const VegetableSchema = new mongoose.Schema({
    name: String,
    quantity: Number,
    price: Number
});

const Vegetable = vegetablesDB.model('Vegetable', VegetableSchema);

// Middleware
app.use(express.static(path.join(__dirname,'frontend')));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'homepage.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'signup.html'));
});

app.get('/Mainpage', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'Mainpage.html'));
});

app.get('/api/vegetables', async (req, res) => {
    try {
        const vegetables = await Vegetable.find();
        console.log('Vegetables:', vegetables); // Add this line
        res.json(vegetables);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error retrieving vegetables' });
    }
});


app.post('/api/cart/add', async (req, res) => {
    const { vegetableId, quantity } = req.body;
    
    try {
        const vegetable = await Vegetable.findById(vegetableId);
        if (!vegetable) {
            return res.status(404).json({ error: 'Vegetable not found' });
        }
        
        if (vegetable.quantity < quantity) {
            return res.status(400).json({ error: 'Not enough stock', availableQuantity: vegetable.quantity });
        }
        
        vegetable.quantity -= quantity;
        await vegetable.save();
        
        res.json({ message: 'Vegetable added to cart', vegetable });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating vegetable stock' });
    }
});


app.post('/api/cart/remove', async (req, res) => {
    const { vegetableId, quantity } = req.body;
    
    try {
        const vegetable = await Vegetable.findById(vegetableId);
        if (!vegetable) {
            return res.status(404).json({ error: 'Vegetable not found' });
        }
        
        vegetable.quantity += quantity;
        await vegetable.save();
        
        res.json({ message: 'Vegetable removed from cart', vegetable });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating vegetable stock' });
    }
});

app.post('/api/checkout', async (req, res) => {
    const { items, name, address } = req.body;
    
    let totalAmount = 0;
    let orderDetails = [];
    
    try {
        for (const item of items) {
            const vegetable = await Vegetable.findById(item.id);
            if (!vegetable) {
                return res.status(404).json({ error: `Vegetable ${item.id} not found` });
            }
            
            if (vegetable.quantity < item.quantity) {
                return res.status(400).json({ error: `Not enough stock for ${vegetable.name}`, availableQuantity: vegetable.quantity });
            }
            
            vegetable.quantity -= item.quantity;
            await vegetable.save();
            
            const itemTotal = item.price * item.quantity;
            totalAmount += itemTotal;
            orderDetails.push({
                vegetableId: item.id,
                name: vegetable.name,
                quantity: item.quantity,
                price: item.price
            });
        }
        
        const newCustomer = new Customer({
            name,
            address,
            orderDetails,
            totalAmount
        });
        const savedCustomer = await newCustomer.save();
        console.log('Saved customer:', savedCustomer);
        
        res.json({
            totalAmount,
            orderDetails,
            message: 'Checkout successful',
            redirectUrl: 'http://localhost:800/'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: `Error during checkout: ${err.message}` });
    }
});

// Login route
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

        // Compare plain text passwords (Note: This is not secure, use hashing in production)
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

app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const newUser = new User({ username, password });
        await newUser.save();

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

