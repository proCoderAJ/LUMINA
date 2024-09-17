const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const connectDB = require('./db');
const User = require('./User');
const path = require('path');
const cors = require('cors');
require('dotenv').config();  // For loading environment variables

// Initialize Express app
const app = express();

// Use CORS middleware
app.use(cors());

// Connect to the database
connectDB();

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

// Serve the images folder as static
app.use('/image', express.static(path.join(__dirname, 'image')));

// Secret key for signing the JWT (moved to environment variable for security)
const jwtSecret = process.env.JWT_SECRET || 'your_secret_key';

// Generate JWT function
function generateToken(user) {
  const payload = {
    id: user._id,  // Use MongoDB ObjectId
    email: user.email,
    firstname: user.firstname
  };

  // Sign the token (expiresIn set to 1 hour)
  return jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
}

// Route for handling user signup
app.post('/signup', async (req, res) => {
  const { firstname, email, password, repeatPassword } = req.body;

  console.log(`Signup attempt: ${email}, Password: ${password}, RepeatPassword: ${repeatPassword}`);

  if (password !== repeatPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      firstname,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Automatically login the user after signup by generating JWT
    const token = generateToken(user);
    res.cookie('token', token, { httpOnly: true });

    res.redirect('index.html');
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  console.log(`Login attempt: ${email}, Password: ${password}`);

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Match the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT on successful login
    const token = generateToken(user);

    res.cookie('token', token, { httpOnly: true });

    // Redirect to the index page after successful login
    res.redirect('index.html');
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Protected route example (e.g., for dashboard)
app.get('/dashboard', (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ error: 'Access Denied: No Token Provided' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    res.json({ message: 'Welcome to your dashboard', user: decoded });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid Token' });
  }
});

// Custom error handler middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
