export default function handler(req, res) {
    res.json({ message: "API is working!", timestamp: new Date().toISOString() });
}