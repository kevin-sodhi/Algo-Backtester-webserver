// middleware/requireAuth.js
// ------------------------------------------------------
// This middleware protects routes that should only be accessible to logged-in users.
// HOW IT WORKS:
// - It checks if req.session.user exists.
// - If there is no user in the session, it assumes the
//   user is not logged in and redirects them to /login.
// - If there is a user, it calls next() and lets the
//   request continue to the actual route handler.
//
// WHERE I USE IT:
// used it in routes/home.js 
//
// This supports cookie-based sessions handled server-side
// with express-session (req.session is provided by that).

function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    // Not logged in -> redirect to login
    return res.redirect('/login');
  }

  // User is logged in, continue to the route
  next();
}

module.exports = requireAuth;