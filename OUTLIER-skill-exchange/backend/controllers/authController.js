const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, location, gender, preferredGenderFilter, facelessSessionAllowed, availability } = req.body;
    if (!name || !email || !password || !location || !gender) {
      return res.status(400).json({ message: 'name, email, password, location and gender are required' });
    }
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email, password: hashedPassword, location, gender,
      preferredGenderFilter, facelessSessionAllowed, availability
    });
    res.status(201).json({ _id: user.id, name: user.name, email: user.email, token: generateToken(user._id) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password are required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({ _id: user.id, name: user.name, email: user.email, token: generateToken(user._id) });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser };
