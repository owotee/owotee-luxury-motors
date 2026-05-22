import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import multer from "multer";
import pg from "pg";
import { put } from "@vercel/blob";

const { Pool } = pg;

const app = express();

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.DATABASE_POSTGRES_URL ||
  process.env.POSTGRES_URL;

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "change_this_to_a_long_random_secret_before_final_production";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "owotee_admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "owotee_password";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl:
    DATABASE_URL && !DATABASE_URL.includes("localhost")
      ? { rejectUnauthorized: false }
      : false,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and WEBP images are allowed."));
    }
  },
});

let databaseReadyPromise = null;

function prepareFeatures(features) {
  if (Array.isArray(features)) return features;

  if (typeof features === "string") {
    return features
      .split(",")
      .map((feature) => feature.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeVehicle(vehicle) {
  if (!vehicle) return vehicle;

  return {
    ...vehicle,
    featured: vehicle.featured === true || vehicle.featured === 1,
    features: Array.isArray(vehicle.features) ? vehicle.features : [],
  };
}

async function initDatabase() {
  if (!DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is missing. Connect Neon Postgres to this Vercel project.",
    );
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id SERIAL PRIMARY KEY,
      year INTEGER NOT NULL,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      body TEXT NOT NULL,
      price INTEGER NOT NULL,
      mileage INTEGER NOT NULL,
      location TEXT DEFAULT '',
      destination TEXT NOT NULL,
      exterior TEXT,
      interior TEXT,
      engine TEXT,
      transmission TEXT,
      image TEXT,
      badge TEXT,
      status TEXT DEFAULT 'Available',
      featured BOOLEAN DEFAULT false,
      features JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS interest_messages (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      destination_country TEXT,
      vehicle_interested_in TEXT NOT NULL,
      message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS vehicle_requests (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      destination_country TEXT,
      preferred_make TEXT,
      preferred_model TEXT,
      year_range TEXT,
      budget TEXT,
      message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function ensureDatabaseReady(req, res, next) {
  try {
    if (!databaseReadyPromise) {
      databaseReadyPromise = initDatabase();
    }

    await databaseReadyPromise;
    next();
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message || "Database initialization failed.",
    });
  }
}

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
    res.status(401).json({
      success: false,
      message: "Invalid or expired admin token. Please log in again.",
    });
  }
}

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

app.use(cors());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(ensureDatabaseReady);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "234 Motors API is running on Vercel.",
  });
});

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

app.get("/api/admin/me", authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    admin: req.admin,
  });
});

app.get("/api/vehicles", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM vehicles
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      vehicles: result.rows.map(normalizeVehicle),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicles.",
      error: error.message,
    });
  }
});

app.get("/api/vehicles/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT *
        FROM vehicles
        WHERE id = $1
      `,
      [req.params.id],
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    res.json({
      success: true,
      vehicle: normalizeVehicle(result.rows[0]),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle.",
      error: error.message,
    });
  }
});

app.post(
  "/api/admin/upload",
  authenticateAdmin,
  upload.array("images", 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No images uploaded.",
        });
      }

      const imageUrls = [];

      for (const file of req.files) {
        const safeOriginalName = file.originalname
          .replace(/\s+/g, "-")
          .replace(/[^a-zA-Z0-9.-]/g, "");

        const filename = `vehicles/${Date.now()}-${Math.round(
          Math.random() * 1e9,
        )}-${safeOriginalName}`;

        const blob = await put(filename, file.buffer, {
          access: "public",
          contentType: file.mimetype,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        imageUrls.push(blob.url);
      }

      res.status(201).json({
        success: true,
        message: "Images uploaded successfully.",
        imageUrls,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: error.message || "Image upload failed.",
      });
    }
  },
);

app.post("/api/admin/vehicles", authenticateAdmin, async (req, res) => {
  try {
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

    const result = await pool.query(
      `
        INSERT INTO vehicles (
          year, make, model, body, price, mileage, location, destination,
          exterior, interior, engine, transmission, image, badge, status,
          featured, features
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15,
          $16, $17
        )
        RETURNING id
      `,
      [
        Number(year),
        make,
        model,
        body,
        Number(price),
        Number(mileage),
        "",
        destination,
        exterior,
        interior || "",
        engine || "",
        transmission || "",
        image || "",
        badge || "",
        status || "Available",
        Boolean(featured),
        JSON.stringify(prepareFeatures(features)),
      ],
    );

    res.status(201).json({
      success: true,
      message: "Vehicle added successfully.",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to add vehicle.",
      error: error.message,
    });
  }
});

app.put("/api/admin/vehicles/:id", authenticateAdmin, async (req, res) => {
  try {
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

    const result = await pool.query(
      `
        UPDATE vehicles
        SET
          year = $1,
          make = $2,
          model = $3,
          body = $4,
          price = $5,
          mileage = $6,
          location = $7,
          destination = $8,
          exterior = $9,
          interior = $10,
          engine = $11,
          transmission = $12,
          image = $13,
          badge = $14,
          status = $15,
          featured = $16,
          features = $17
        WHERE id = $18
        RETURNING id
      `,
      [
        Number(year),
        make,
        model,
        body,
        Number(price),
        Number(mileage),
        "",
        destination,
        exterior,
        interior || "",
        engine || "",
        transmission || "",
        image || "",
        badge || "",
        status || "Available",
        Boolean(featured),
        JSON.stringify(prepareFeatures(features)),
        req.params.id,
      ],
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    res.json({
      success: true,
      message: "Vehicle updated successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update vehicle.",
      error: error.message,
    });
  }
});

app.delete("/api/admin/vehicles/:id", authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `
        DELETE FROM vehicles
        WHERE id = $1
        RETURNING id
      `,
      [req.params.id],
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    res.json({
      success: true,
      message: "Vehicle deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete vehicle.",
      error: error.message,
    });
  }
});

app.post("/api/interest", async (req, res) => {
  try {
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

    const result = await pool.query(
      `
        INSERT INTO interest_messages (
          full_name, phone, email, destination_country,
          vehicle_interested_in, message
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [
        fullName,
        phone,
        email || "",
        destinationCountry || "",
        vehicleInterestedIn,
        message || "",
      ],
    );

    res.status(201).json({
      success: true,
      message: "Interest message saved successfully.",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to save interest message.",
      error: error.message,
    });
  }
});

app.post("/api/vehicle-request", async (req, res) => {
  try {
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

    const result = await pool.query(
      `
        INSERT INTO vehicle_requests (
          full_name, phone, email, destination_country,
          preferred_make, preferred_model, year_range, budget, message
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `,
      [
        fullName,
        phone,
        email || "",
        destinationCountry || "",
        preferredMake || "",
        preferredModel || "",
        yearRange || "",
        budget || "",
        message || "",
      ],
    );

    res.status(201).json({
      success: true,
      message: "Vehicle request saved successfully.",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to save vehicle request.",
      error: error.message,
    });
  }
});

app.get("/api/admin/interest-messages", authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM interest_messages
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      messages: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch interest messages.",
      error: error.message,
    });
  }
});

app.get("/api/admin/vehicle-requests", authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM vehicle_requests
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      requests: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle requests.",
      error: error.message,
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: err.message || "Internal server error.",
  });
});

export default app;
