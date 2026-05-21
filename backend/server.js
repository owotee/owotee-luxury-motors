const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;
const DATABASE_FILE = "./owotee_luxury_motors.db";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "owotee_admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "owotee_password";

const UPLOADS_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

const db = new sqlite3.Database(DATABASE_FILE, (err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

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
      location TEXT NOT NULL,
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

addColumnIfMissing("vehicles", "status", "TEXT DEFAULT 'Available'");
addColumnIfMissing("vehicles", "featured", "INTEGER DEFAULT 0");

function parseFeatures(features) {
  try {
    return features ? JSON.parse(features) : [];
  } catch {
    return [];
  }
}

function prepareFeatures(features) {
  if (Array.isArray(features)) {
    return JSON.stringify(features);
  }

  if (typeof features === "string") {
    const featureArray = features
      .split(",")
      .map((feature) => feature.trim())
      .filter((feature) => feature.length > 0);

    return JSON.stringify(featureArray);
  }

  return JSON.stringify([]);
}

function normalizeVehicle(vehicle) {
  return {
    ...vehicle,
    status: vehicle.status || "Available",
    featured: vehicle.featured === 1 || vehicle.featured === true,
    features: parseFeatures(vehicle.features),
  };
}

// Seed sample vehicles only if database is empty
db.get("SELECT COUNT(*) AS count FROM vehicles", (err, row) => {
  if (err) {
    console.error("Could not count vehicles:", err.message);
    return;
  }

  if (row.count === 0) {
    const vehicles = [
      {
        year: 2023,
        make: "Mercedes-Benz",
        model: "G-Class G 550",
        body: "SUV",
        price: 139500,
        mileage: 12400,
        location: "",
        destination: "Nigeria",
        exterior: "Obsidian Black",
        interior: "Black Leather",
        engine: "4.0L V8",
        transmission: "Automatic",
        image:
          "https://images.unsplash.com/photo-1617814076668-3b9304f4a3a9?auto=format&fit=crop&w=1200&q=80, https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80",
        badge: "High Demand",
        status: "Available",
        featured: 1,
        features: JSON.stringify([
          "AMG Styling",
          "Leather Interior",
          "Sunroof",
          "Premium Audio",
        ]),
      },
      {
        year: 2023,
        make: "Lexus",
        model: "LX 600 Premium",
        body: "SUV",
        price: 104950,
        mileage: 16105,
        location: "",
        destination: "Nigeria",
        exterior: "Atomic Silver",
        interior: "Tan Leather",
        engine: "3.4L Twin-Turbo V6",
        transmission: "Automatic",
        image:
          "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80, https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80",
        badge: "Export Favorite",
        status: "Available",
        featured: 1,
        features: JSON.stringify([
          "4WD",
          "Mark Levinson Audio",
          "Luxury Seating",
          "Rear Entertainment",
        ]),
      },
      {
        year: 2024,
        make: "Range Rover",
        model: "Sport HSE",
        body: "SUV",
        price: 96500,
        mileage: 9440,
        location: "",
        destination: "Nigeria",
        exterior: "Santorini Black",
        interior: "Ebony Leather",
        engine: "3.0L Mild Hybrid",
        transmission: "Automatic",
        image:
          "https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1200&q=80, https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80",
        badge: "New Arrival",
        status: "Available Soon",
        featured: 0,
        features: JSON.stringify([
          "Meridian Sound",
          "Air Suspension",
          "Digital Cockpit",
          "Cooled Seats",
        ]),
      },
    ];

    const insertVehicle = db.prepare(`
      INSERT INTO vehicles (
        year, make, model, body, price, mileage, location, destination,
        exterior, interior, engine, transmission, image, badge, status,
        featured, features
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    vehicles.forEach((vehicle) => {
      insertVehicle.run(
        vehicle.year,
        vehicle.make,
        vehicle.model,
        vehicle.body,
        vehicle.price,
        vehicle.mileage,
        vehicle.location,
        vehicle.destination,
        vehicle.exterior,
        vehicle.interior,
        vehicle.engine,
        vehicle.transmission,
        vehicle.image,
        vehicle.badge,
        vehicle.status,
        vehicle.featured,
        vehicle.features,
      );
    });

    insertVehicle.finalize();
    console.log("Sample luxury vehicles added to database.");
  }
});

// Image upload setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const safeOriginalName = file.originalname
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9.-]/g, "");

    const uniqueName = `${Date.now()}-${safeOriginalName}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, and WEBP images are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// Admin login route
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
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
    JWT_SECRET,
    {
      expiresIn: "8h",
    },
  );

  res.json({
    success: true,
    message: "Admin login successful.",
    token,
  });
});

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Admin authorization token is required.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired admin token. Please log in again.",
    });
  }
}

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Owotee Luxury Motors API is running.",
  });
});

// Public: Get all vehicles
app.get("/api/vehicles", (req, res) => {
  db.all("SELECT * FROM vehicles ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch vehicles.",
        error: err.message,
      });
    }

    res.json({
      success: true,
      vehicles: rows.map(normalizeVehicle),
    });
  });
});

// Public: Get one vehicle
app.get("/api/vehicles/:id", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM vehicles WHERE id = ?", [id], (err, vehicle) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch vehicle.",
        error: err.message,
      });
    }

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    res.json({
      success: true,
      vehicle: normalizeVehicle(vehicle),
    });
  });
});

// Public: Submit interest message
app.post("/api/interest", (req, res) => {
  const {
    fullName,
    phone,
    email,
    destinationCountry,
    vehicleInterestedIn,
    message,
  } = req.body;

  if (!fullName || !phone || !vehicleInterestedIn) {
    return res.status(400).json({
      success: false,
      message: "Full name, phone, and vehicle interested in are required.",
    });
  }

  const sql = `
    INSERT INTO interest_messages (
      full_name, phone, email, destination_country, vehicle_interested_in, message
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [fullName, phone, email, destinationCountry, vehicleInterestedIn, message],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to save interest message.",
          error: err.message,
        });
      }

      res.status(201).json({
        success: true,
        message: "Interest message saved successfully.",
        id: this.lastID,
      });
    },
  );
});

// Public: Submit custom vehicle request
app.post("/api/vehicle-request", (req, res) => {
  const {
    fullName,
    phone,
    email,
    destinationCountry,
    preferredMake,
    preferredModel,
    yearRange,
    budget,
    message,
  } = req.body;

  if (!fullName || !phone) {
    return res.status(400).json({
      success: false,
      message: "Full name and phone are required.",
    });
  }

  const sql = `
    INSERT INTO vehicle_requests (
      full_name, phone, email, destination_country,
      preferred_make, preferred_model, year_range, budget, message
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [
      fullName,
      phone,
      email,
      destinationCountry,
      preferredMake,
      preferredModel,
      yearRange,
      budget,
      message,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to save vehicle request.",
          error: err.message,
        });
      }

      res.status(201).json({
        success: true,
        message: "Vehicle request saved successfully.",
        id: this.lastID,
      });
    },
  );
});

// Admin: Check admin session
app.get("/api/admin/me", authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    admin: req.admin,
  });
});

// Admin: Upload vehicle images
app.post(
  "/api/admin/upload",
  authenticateAdmin,
  upload.array("images", 10),
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images uploaded.",
      });
    }

    const imageUrls = req.files.map((file) => `/uploads/${file.filename}`);

    res.status(201).json({
      success: true,
      message: "Images uploaded successfully.",
      imageUrls,
    });
  },
);

// Admin: View submitted interest messages
app.get("/api/admin/interest-messages", authenticateAdmin, (req, res) => {
  db.all(
    "SELECT * FROM interest_messages ORDER BY created_at DESC",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch interest messages.",
          error: err.message,
        });
      }

      res.json({
        success: true,
        messages: rows,
      });
    },
  );
});

// Admin: View submitted custom vehicle requests
app.get("/api/admin/vehicle-requests", authenticateAdmin, (req, res) => {
  db.all(
    "SELECT * FROM vehicle_requests ORDER BY created_at DESC",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch vehicle requests.",
          error: err.message,
        });
      }

      res.json({
        success: true,
        requests: rows,
      });
    },
  );
});

// Admin: Add a new vehicle
app.post("/api/admin/vehicles", authenticateAdmin, (req, res) => {
  const {
    year,
    make,
    model,
    body,
    price,
    mileage,
    destination,
    exterior,
    interior,
    engine,
    transmission,
    image,
    badge,
    status,
    featured,
    features,
  } = req.body;

  if (
    !year ||
    !make ||
    !model ||
    !body ||
    !price ||
    !mileage ||
    !destination ||
    !exterior
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Year, make, model, body, price, mileage, destination, and exterior color are required.",
    });
  }

  const vehicleStatus = status || "Available";

  const sql = `
    INSERT INTO vehicles (
      year, make, model, body, price, mileage, location, destination,
      exterior, interior, engine, transmission, image, badge, status,
      featured, features
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [
      year,
      make,
      model,
      body,
      price,
      mileage,
      "",
      destination,
      exterior,
      interior,
      engine,
      transmission,
      image,
      badge,
      vehicleStatus,
      featured ? 1 : 0,
      prepareFeatures(features),
    ],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to add vehicle.",
          error: err.message,
        });
      }

      res.status(201).json({
        success: true,
        message: "Vehicle added successfully.",
        id: this.lastID,
      });
    },
  );
});

// Admin: Update vehicle
app.put("/api/admin/vehicles/:id", authenticateAdmin, (req, res) => {
  const { id } = req.params;

  const {
    year,
    make,
    model,
    body,
    price,
    mileage,
    destination,
    exterior,
    interior,
    engine,
    transmission,
    image,
    badge,
    status,
    featured,
    features,
  } = req.body;

  if (
    !year ||
    !make ||
    !model ||
    !body ||
    !price ||
    !mileage ||
    !destination ||
    !exterior
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Year, make, model, body, price, mileage, destination, and exterior color are required.",
    });
  }

  const vehicleStatus = status || "Available";

  const sql = `
    UPDATE vehicles
    SET
      year = ?,
      make = ?,
      model = ?,
      body = ?,
      price = ?,
      mileage = ?,
      location = ?,
      destination = ?,
      exterior = ?,
      interior = ?,
      engine = ?,
      transmission = ?,
      image = ?,
      badge = ?,
      status = ?,
      featured = ?,
      features = ?
    WHERE id = ?
  `;

  db.run(
    sql,
    [
      year,
      make,
      model,
      body,
      price,
      mileage,
      "",
      destination,
      exterior,
      interior,
      engine,
      transmission,
      image,
      badge,
      vehicleStatus,
      featured ? 1 : 0,
      prepareFeatures(features),
      id,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to update vehicle.",
          error: err.message,
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found.",
        });
      }

      res.json({
        success: true,
        message: "Vehicle updated successfully.",
      });
    },
  );
});

// Admin: Delete vehicle
app.delete("/api/admin/vehicles/:id", authenticateAdmin, (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM vehicles WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete vehicle.",
        error: err.message,
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    res.json({
      success: true,
      message: "Vehicle deleted successfully.",
    });
  });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Something went wrong.",
    });
  }

  next();
});

app.listen(PORT, () => {
  console.log(`Owotee Luxury Motors backend running on port ${PORT}`);
});
