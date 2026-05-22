const sqlite3 = require("sqlite3").verbose();
const env = require("./env");

const db = new sqlite3.Database(env.databaseFile, (err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

function addColumnIfMissing(tableName, columnName, columnDefinition) {
  db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
    if (err) {
      console.error(`Could not inspect ${tableName} table:`, err.message);
      return;
    }

    const hasColumn = columns.some((column) => column.name === columnName);

    if (!hasColumn) {
      db.run(
        `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`,
        (alterErr) => {
          if (alterErr) {
            console.error(
              `Could not add ${columnName} column:`,
              alterErr.message,
            );
          } else {
            console.log(`${columnName} column added to ${tableName} table.`);
          }
        },
      );
    }
  });
}

function runDatabaseMigrations() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year INTEGER NOT NULL,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        body TEXT NOT NULL,
        price INTEGER NOT NULL,
        mileage INTEGER NOT NULL,
        location TEXT NOT NULL DEFAULT '',
        destination TEXT NOT NULL,
        exterior TEXT,
        interior TEXT,
        engine TEXT,
        transmission TEXT,
        image TEXT,
        badge TEXT,
        status TEXT DEFAULT 'Available',
        featured INTEGER DEFAULT 0,
        features TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS interest_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        destination_country TEXT,
        vehicle_interested_in TEXT NOT NULL,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS vehicle_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        destination_country TEXT,
        preferred_make TEXT,
        preferred_model TEXT,
        year_range TEXT,
        budget TEXT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });

  addColumnIfMissing("vehicles", "status", "TEXT DEFAULT 'Available'");
  addColumnIfMissing("vehicles", "featured", "INTEGER DEFAULT 0");
  addColumnIfMissing("vehicles", "location", "TEXT DEFAULT ''");
}

module.exports = {
  db,
  runDatabaseMigrations,
};
