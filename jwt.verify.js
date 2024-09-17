function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).send({ error: 'Access denied' });
  
    jwt.verify(token, jwtSecret, (err, user) => {
      if (err) return res.status(403).send({ error: 'Invalid token' });
  
      req.user = user; // Attach the user to the request
      next(); // Proceed to the next middleware/route handler
    });
  }
  
  // Example of using the middleware in a protected route
  app.get('/protected', authenticateToken, (req, res) => {
    res.status(200).send('Welcome to the protected route');
  });
  