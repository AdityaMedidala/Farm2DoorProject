const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
mongoose.connect('mongodb://localhost:27017/vegetables', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

const vegetableSchema = new mongoose.Schema({
    name: String,
    description: String,
    imageUrl: String,
    price: Number,
    quantity: { type: Number, default: 0 }
});

const Vegetable = mongoose.model('Vegetable', vegetableSchema);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/mainpage', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mainpage.html'));
});

app.get('/api/vegetables', async (req, res) => {
    try {
        const vegetables = await Vegetable.find();
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

app.post('/api/checkout', async (req, res) => {
    const { items } = req.body;
    
    let total = 0;
    let vegetablesUpdated = [];
    
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
            
            total += item.price * item.quantity;
            vegetablesUpdated.push(vegetable);
        }
        
        res.json({
            total,
            vegetables: vegetablesUpdated,
            message: 'Checkout successful'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: `Error during checkout: ${err.message}` });
    }
});