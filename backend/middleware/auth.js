const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid or expired token.' });
    }
};

const validateUserInputs = (name, email, password, address) => {
    if (!name || name.length < 20 || name.length > 60) {
        return 'Name must be between 20 and 60 characters.';
    }
    if (!address || address.length > 400) {
        return 'Address must not exceed 400 characters.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return 'Invalid email address format.';
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,16}$/;
    if (!password || !passwordRegex.test(password)) {
        return 'Password must be 8-16 characters long and include at least one uppercase letter and one special character.';
    }
    return null;
};

module.exports = { verifyToken, validateUserInputs };