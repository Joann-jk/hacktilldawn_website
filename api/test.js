module.exports = (req, res) => {
    res.json({ message: "API is working!", timestamp: new Date().toISOString() });
};