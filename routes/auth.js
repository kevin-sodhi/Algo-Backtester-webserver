const express = require('express');
const router = express.Router();
const User = require('../models/User'); //  clint-side validation
// PBKDF2 hasher
const hasher = require('pbkdf2-password')();

// SIGNUP PAGE

// GET /signup --> show the signup page
router.get('/signup', (req, res) => {
  res.render('signup', {
    title: 'Create account',
    hideNav: true,           
    pageClass: 'signup-page',
    formData: {}
  });
});

// POST /signup -> save user to MongoDB
router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1) READ: check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists in database");
      return res.status(400).render('signup', {
        title: 'Sign up',
        error: 'An account with that email already exists.',
        formData: { name, email },
        hideNav: true
      });
    }
    // 2) HASH + SALT the password using PBKDF2
    hasher({ password }, async (err, pass, salt, hash) => {
      if (err) return next(err);
      // 3) WRITE: create user with hash + salt
      try {
        // User model
        const user = new User({name,email,hash,salt});
        await user.save();
        console.log("User created in database with hashed password");
        // Redirect to login
        res.redirect('/login');
      } catch (saveErr) {
        return next(saveErr);
      }
    });
  } catch (err) {
    next(err);
  }
});




// LOGIN PAGE
// GET /login -> show login page
router.get('/login', async (req, res) => {
  res.render('login', {
    title: 'Log in',
    hideNav: true,           // hides base.pug header/nav
    pageClass: 'login-page',
    formData: {},
    error: null
  });
});

// POST /login -> check credentials against MongoDB
router.post('/login', async (req, res, next) => {
  try{
    const {email,password} = req.body;
    // READ: find user by email
    const user = await User.findOne({ email });
      if (!user) {
      console.log("Login failed: user not found");
      return res.status(401).render('login', {
        title: 'Login',
        error: 'Invalid email or password.',
        formData: { email },
        hideNav: true
      });
    }
    // Recompute hash using stored salt and entered password
    hasher({ password, salt: user.salt }, (err, pass, salt, hash) => {
      if (err) return next(err);

      if (hash !== user.hash) {
        console.log("Login failed: wrong password");
        return res.status(401).render('login', {
          title: 'Login',
          error: 'Invalid email or password.',
          formData: { email },
          hideNav: true
        });
      }

      console.log("User access granted (password OK)");

      // Create session
      req.session.user = {
        id: user._id,
        name: user.name,
        email: user.email
      };

      res.redirect('/old-home');
    });
  } catch (err) {
    next(err);
  }
});

// LOGOUT
router.get('/logout', (req, res, next) => {
  if (!req.session) {
    return res.redirect('/login');
  }

  req.session.destroy(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
  console.log("User Log out successful")
});




module.exports = router;