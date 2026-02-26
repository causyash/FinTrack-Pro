// Check if user is admin
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as admin' });
    }
};

// Check if user has specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Role ${req.user.role} is not authorized to access this resource` 
            });
        }

        next();
    };
};

// Check if user is accessing their own resource or is admin
const ownerOrAdmin = (paramName = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const resourceUserId = req.params[paramName] || req.body.user;
        
        if (req.user.role === 'admin' || req.user._id.toString() === resourceUserId) {
            next();
        } else {
            res.status(403).json({ message: 'Not authorized to access this resource' });
        }
    };
};

module.exports = { adminOnly, authorize, ownerOrAdmin };
