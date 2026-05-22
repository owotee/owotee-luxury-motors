const app = require("./app");
const env = require("./config/env");
const { runDatabaseMigrations } = require("./config/database");

runDatabaseMigrations();

app.listen(env.port, () => {
  console.log(`Owotee Luxury Motors backend running on port ${env.port}`);
});
