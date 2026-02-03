module.exports  = async (req, res, next) => {
  // 1. Ensure user is authenticated (req.user exists from previous auth middleware)
  if (!req.user || !req.user.roles) {
    return res.status(401).json({ message: "Unauthorized: No roles assigned." });
  }

  // 2. Split comma-delimited string and check for 'role'
  const userRoles = req.user.roles.split(',').map(role => role.trim());
  if (userRoles.includes('manager')) {
    next(); // Access granted
  } else {
    res.status(403).json({ message: "Forbidden: Manager access required." });
  }
};

