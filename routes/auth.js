const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
router.get('/register', (req, res) => {
  res.render('register', { error: req.flash('error'), success: req.flash('success') });
});
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    req.flash('error', 'All fields are required.');
    return res.redirect('/register');
  }
  try {
    const existing = await User.findOne({ username });
    if (existing) {
      req.flash('error', 'Username already exists.');
      return res.redirect('/register');
    }
    const newUser = new User({
      username,
      passwordHash: bcrypt.hashSync(password, 10)
    });
    await newUser.save();
    req.flash('success', 'Registration successful. Please log in.');
    res.redirect('/login');
  } catch (err) {
    req.flash('error', 'Registration failed.');
    res.redirect('/register');
  }
});
router.get('/login', (req, res) => {
  res.render('login', { error: req.flash('error'), success: req.flash('success') });
});
router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));
router.get('/logout', (req, res) => {
  req.logout(() => {
    req.flash('success', 'Logged out successfully.');
    res.redirect('/login');
  });
});
module.exports = router;
