const jwt = require("jsonwebtoken");
const env = require("../config/env");

function loginAdmin(req, res) {
  const { username, password } = req.body;

  if (username !== env.adminUsername || password !== env.adminPassword) {
    return res.status(401).json({
      success: false,
      message: "Invalid admin username or password.",
    });
  }

  const token = jwt.sign(
    {
      username,
      role: "admin",
    },
    env.jwtSecret,
    {
      expiresIn: "8h",
    },
  );

  res.json({
    success: true,
    message: "Admin login successful.",
    token,
  });
}

function getAdminSession(req, res) {
  res.json({
    success: true,
    admin: req.admin,
  });
}

module.exports = {
  loginAdmin,
  getAdminSession,
};
