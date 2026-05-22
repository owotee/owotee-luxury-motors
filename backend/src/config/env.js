const path = require("path");
require("dotenv").config();

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",

  jwtSecret: process.env.JWT_SECRET || "fallback_secret_key",
  adminUsername: process.env.ADMIN_USERNAME || "owotee_admin",
  adminPassword: process.env.ADMIN_PASSWORD || "owotee_password",

  databaseFile:
    process.env.DATABASE_FILE ||
    path.join(__dirname, "../../owotee_luxury_motors.db"),
};

module.exports = env;
