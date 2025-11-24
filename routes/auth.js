const express = require('express');
const router = express.Router();

// LOGIN PAGE
router.get('/login', (req, res) => {
  res.render('login', {
    title: 'Log in',
    hideNav: true,           // hides base.pug header/nav
    pageClass: 'login-page'
  });
});

// SIGNUP PAGE
router.get('/signup', (req, res) => {
  res.render('signup', {
    title: 'Create account',
    hideNav: true,           // also hide base.pug nav
    pageClass: 'signup-page'
  });
});


module.exports = router;