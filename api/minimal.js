module.exports = (req, res) => {
  res.status(200).json({ 
    message: 'Minimal API working!', 
    method: req.method,
    timestamp: new Date().toISOString()
  });
};
