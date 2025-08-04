const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByEmail, findUserByPhone, createUser } = require('../models/userModel');

const register = async (req, res) => {
    const { name, phone, email, password } = req.body;
  
    if (!name || !phone || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    try {
      // Check if email or phone already exists
      const existingUser = await findUserByEmail(email);
      if (existingUser) return res.status(409).json({ message: 'Email already in use' });
  
      const existingPhone = await findUserByPhone(phone);
      if (existingPhone) return res.status(409).json({ message: 'Phone number already in use' });
  
      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = await createUser(name, phone, email, hashedPassword);
  
      // Generate JWT token
      const token = jwt.sign(
        { id: userId, email, role: 'creator' }, // You can fetch and use real role if needed
        process.env.JWT_SECRET,
        { expiresIn: '2d' }
      );
  
      // Respond with token
      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: userId,
          name,
          email,
          phone,
          role: 'creator'
        }
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  };

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ message: 'Email and password are required' });

    try {
        const user = await findUserByEmail(email);
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone_number,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { register, login };
