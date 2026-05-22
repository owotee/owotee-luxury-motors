const app = require("./app");
const env = require("./config/env");
const { runDatabaseMigrations } = require("./config/database");

runDatabaseMigrations();

app.listen(env.port, () => {
  console.log(`234 Luxury Motors backend running on port ${env.port}`);
});
