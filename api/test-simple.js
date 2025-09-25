export default function handler(req, res) {
    res.json({ message: 'Simple test working!', timestamp: new Date().toISOString() });
}
