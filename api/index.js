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

app.set("trust proxy", 1);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

app.use(morgan("tiny"));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.DATABASE_POSTGRES_URL ||
  process.env.POSTGRES_URL;

const JWT_SECRET =
  process.env.JWT_SECRET || "local-development-secret-change-in-vercel";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "owotee_admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "owotee_password";

const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes("localhost")
        ? false
        : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  : null;

let databaseReadyPromise = null;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image uploads are allowed."));
      return;
    }

    cb(null, true);
  },
});

function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

async function initializeDatabase() {
  if (!pool) {
    throw new Error(
      "Database connection is missing. Add DATABASE_URL in Vercel environment variables.",
    );
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id SERIAL PRIMARY KEY,
      year INTEGER,
      make TEXT,
      model TEXT,
      body TEXT,
      price INTEGER,
      mileage INTEGER,
      location TEXT DEFAULT '',
      destination TEXT DEFAULT '',
      exterior TEXT DEFAULT '',
      interior TEXT DEFAULT '',
      engine TEXT DEFAULT '',
      transmission TEXT DEFAULT '',
      image TEXT DEFAULT '',
      badge TEXT DEFAULT 'Luxury',
      status TEXT DEFAULT 'Available',
      featured BOOLEAN DEFAULT false,
      features JSONB DEFAULT '[]',
      carousel_category TEXT DEFAULT 'auto',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    ALTER TABLE vehicles
    ADD COLUMN IF NOT EXISTS location TEXT DEFAULT ''
  `);

  await pool.query(`
    ALTER TABLE vehicles
    ADD COLUMN IF NOT EXISTS destination TEXT DEFAULT ''
  `);

  await pool.query(`
    ALTER TABLE vehicles
    ADD COLUMN IF NOT EXISTS exterior TEXT DEFAULT ''
  `);

  await pool.query(`
    ALTER TABLE vehicles
    ADD COLUMN IF NOT EXISTS interior TEXT DEFAULT ''
  `);

  await pool.query(`
    ALTER TABLE vehicles
    ADD COLUMN IF NOT EXISTS engine TEXT DEFAULT ''
  `);

  await pool.query(`
    ALTER TABLE vehicles
    ADD COLUMN IF NOT EXISTS transmission TEXT DEFAULT ''
  `);

  await pool.query(`
    ALTER TABLE vehicles
    ADD COLUMN IF NOT EXISTS image TEXT DEFAULT ''
  `);

  await pool.query(`
    ALTER TABLE vehicles
    ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT 'Luxury'
  `);

  await pool.query(`
    ALTER TABLE vehicles
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Available'
  `);

  await pool.query(`
    ALTER TABLE vehicles
    ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false
  `);

  await pool.query(`
    ALTER TABLE vehicles
    ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'
  `);

  await pool.query(`
    ALTER TABLE vehicles
    ADD COLUMN IF NOT EXISTS carousel_category TEXT DEFAULT 'auto'
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS interest_messages (
      id SERIAL PRIMARY KEY,
      vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
      vehicle_title TEXT DEFAULT '',
      name TEXT DEFAULT '',
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      destination TEXT DEFAULT '',
      message TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    ALTER TABLE interest_messages
    ADD COLUMN IF NOT EXISTS vehicle_id INTEGER
  `);

  await pool.query(`
    ALTER TABLE interest_messages
    ADD COLUMN IF NOT EXISTS vehicle_title TEXT DEFAULT ''
  `);

  await pool.query(`
    ALTER TABLE interest_messages
    ADD COLUMN IF NOT EXISTS name TEXT DEFAULT ''
  `);

  await pool.query(`
    ALTER TABLE interest_messages
    ADD COLUMN IF NOT EXISTS email TEXT DEFAULT ''
  `);

  await pool.query(`
    ALTER TABLE interest_messages
    ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT ''
  `);

  await pool.query(`
    ALTER TABLE interest_messages
    ADD COLUMN IF NOT EXISTS destination TEXT DEFAULT ''
  `);

  await pool.query(`
    ALTER TABLE interest_messages
    ADD COLUMN IF NOT EXISTS message TEXT DEFAULT ''
  `);

  await pool.query(`
    ALTER TABLE interest_messages
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS vehicle_requests (
      id SERIAL PRIMARY KEY,
      name TEXT DEFAULT '',
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      make TEXT DEFAULT '',
      model TEXT DEFAULT '',
      year_range TEXT DEFAULT '',
      budget TEXT DEFAULT '',
      destination TEXT DEFAULT '',
      message TEXT DEFAULT '',
      status TEXT DEFAULT 'New',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function ensureDatabase() {
  if (!databaseReadyPromise) {
    databaseReadyPromise = initializeDatabase().catch((error) => {
      databaseReadyPromise = null;
      throw error;
    });
  }

  return databaseReadyPromise;
}

function withDatabase(handler) {
  return asyncHandler(async (req, res, next) => {
    await ensureDatabase();
    await handler(req, res, next);
  });
}

function getTokenFromRequest(req) {
  const header = req.headers.authorization || "";

  if (header.startsWith("Bearer ")) {
    return header.slice(7);
  }

  return null;
}

function requireAdmin(req, res, next) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Admin authentication is required.",
    });
  }

  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired admin token.",
    });
  }
}

function cleanString(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
}

function toInteger(value) {
  if (value === undefined || value === null || value === "") return null;

  const cleaned = String(value).replace(/[^\d]/g, "");
  const parsed = Number.parseInt(cleaned, 10);

  return Number.isNaN(parsed) ? null : parsed;
}

function toBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  if (typeof value === "string") {
    return ["true", "1", "yes", "on", "featured"].includes(value.toLowerCase());
  }

  return false;
}

function normalizeFeatures(features) {
  if (Array.isArray(features)) {
    return features.map((item) => cleanString(item)).filter(Boolean);
  }

  if (!features) return [];

  if (typeof features === "string") {
    const trimmed = features.trim();

    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return normalizeFeatures(parsed);
      }
    } catch (error) {
      // Continue to comma-separated fallback.
    }

    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeCarouselCategory(value) {
  const category = cleanString(value || "auto").toLowerCase();

  const allowedCategories = [
    "auto",
    "luxury_suvs",
    "executive_sedans",
    "sports_exotic",
    "none",
  ];

  return allowedCategories.includes(category) ? category : "auto";
}

function formatVehicleTitle(vehicle) {
  return [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");
}

function normalizeVehicleRow(row) {
  if (!row) return null;

  return {
    ...row,
    price: row.price === null ? null : Number(row.price),
    mileage: row.mileage === null ? null : Number(row.mileage),
    featured: Boolean(row.featured),
    features: Array.isArray(row.features) ? row.features : [],
    carousel_category: row.carousel_category || "auto",
  };
}

function getVehiclePayload(payload = {}) {
  return {
    year: toInteger(payload.year),
    make: cleanString(payload.make),
    model: cleanString(payload.model),
    body: cleanString(payload.body || payload.bodyType || payload.body_type),
    price: toInteger(payload.price),
    mileage: toInteger(payload.mileage),
    location: cleanString(payload.location),
    destination: cleanString(payload.destination),
    exterior: cleanString(payload.exterior),
    interior: cleanString(payload.interior),
    engine: cleanString(payload.engine),
    transmission: cleanString(payload.transmission || "Automatic"),
    image: cleanString(payload.image || payload.imageUrl || payload.image_url),
    badge: cleanString(payload.badge || "Luxury"),
    status: cleanString(payload.status || "Available"),
    featured: toBoolean(payload.featured),
    features: normalizeFeatures(payload.features),
    carousel_category: normalizeCarouselCategory(
      payload.carousel_category || payload.carouselCategory,
    ),
  };
}

const router = express.Router();

router.get(
  "/health",
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      message: "234 Motors API is running on Vercel.",
      databaseConfigured: Boolean(pool),
      timestamp: new Date().toISOString(),
    });
  }),
);

router.post(
  "/admin/login",
  asyncHandler(async (req, res) => {
    const username = cleanString(req.body.username);
    const password = cleanString(req.body.password);

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin username or password.",
      });
    }

    const token = jwt.sign(
      {
        username: ADMIN_USERNAME,
        role: "admin",
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.json({
      success: true,
      message: "Login successful.",
      token,
      admin: {
        username: ADMIN_USERNAME,
      },
    });
  }),
);

router.get(
  "/admin/me",
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      admin: {
        username: req.admin.username || ADMIN_USERNAME,
        role: req.admin.role || "admin",
      },
    });
  }),
);

router.get(
  "/vehicles",
  withDatabase(async (req, res) => {
    const result = await pool.query(`
      SELECT *
      FROM vehicles
      ORDER BY created_at DESC, id DESC
    `);

    const vehicles = result.rows.map(normalizeVehicleRow);

    res.json({
      success: true,
      vehicles,
      data: vehicles,
    });
  }),
);

router.get(
  "/vehicles/:id",
  withDatabase(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(
      `
        SELECT *
        FROM vehicles
        WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    const vehicle = normalizeVehicleRow(result.rows[0]);

    res.json({
      success: true,
      vehicle,
      data: vehicle,
    });
  }),
);

router.post(
  "/admin/upload",
  requireAdmin,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({
        success: false,
        message:
          "Blob storage token is missing. Add BLOB_READ_WRITE_TOKEN in Vercel.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file was uploaded.",
      });
    }

    const safeOriginalName = req.file.originalname
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .toLowerCase();

    const fileName = `vehicles/${Date.now()}-${safeOriginalName}`;

    const blob = await put(fileName, req.file.buffer, {
      access: "public",
      contentType: req.file.mimetype,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    res.json({
      success: true,
      message: "Image uploaded successfully.",
      url: blob.url,
      image: blob.url,
      imageUrl: blob.url,
      blob,
    });
  }),
);

router.post(
  "/admin/vehicles",
  requireAdmin,
  withDatabase(async (req, res) => {
    const vehicle = getVehiclePayload(req.body);

    const result = await pool.query(
      `
        INSERT INTO vehicles (
          year,
          make,
          model,
          body,
          price,
          mileage,
          location,
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
          carousel_category
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16,
          $17::jsonb, $18
        )
        RETURNING *
      `,
      [
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
        JSON.stringify(vehicle.features),
        vehicle.carousel_category,
      ],
    );

    const createdVehicle = normalizeVehicleRow(result.rows[0]);

    res.status(201).json({
      success: true,
      message: "Vehicle created successfully.",
      vehicle: createdVehicle,
      data: createdVehicle,
    });
  }),
);

router.put(
  "/admin/vehicles/:id",
  requireAdmin,
  withDatabase(async (req, res) => {
    const { id } = req.params;
    const vehicle = getVehiclePayload(req.body);

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
          features = $17::jsonb,
          carousel_category = $18
        WHERE id = $19
        RETURNING *
      `,
      [
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
        JSON.stringify(vehicle.features),
        vehicle.carousel_category,
        id,
      ],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    const updatedVehicle = normalizeVehicleRow(result.rows[0]);

    res.json({
      success: true,
      message: "Vehicle updated successfully.",
      vehicle: updatedVehicle,
      data: updatedVehicle,
    });
  }),
);

router.delete(
  "/admin/vehicles/:id",
  requireAdmin,
  withDatabase(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(
      `
        DELETE FROM vehicles
        WHERE id = $1
        RETURNING id
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    res.json({
      success: true,
      message: "Vehicle deleted successfully.",
      deletedId: Number(id),
    });
  }),
);

router.post(
  "/interest",
  withDatabase(async (req, res) => {
    const vehicleId = req.body.vehicle_id || req.body.vehicleId || null;

    const vehicleTitle = cleanString(
      req.body.vehicle_title || req.body.vehicleTitle,
    );

    const name = cleanString(req.body.name);
    const email = cleanString(req.body.email);
    const phone = cleanString(req.body.phone);
    const destination = cleanString(req.body.destination);
    const message = cleanString(req.body.message);

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required.",
      });
    }

    let finalVehicleTitle = vehicleTitle;

    if (vehicleId && !finalVehicleTitle) {
      const vehicleResult = await pool.query(
        `
          SELECT year, make, model
          FROM vehicles
          WHERE id = $1
        `,
        [vehicleId],
      );

      if (vehicleResult.rowCount > 0) {
        finalVehicleTitle = formatVehicleTitle(vehicleResult.rows[0]);
      }
    }

    const result = await pool.query(
      `
        INSERT INTO interest_messages (
          vehicle_id,
          vehicle_title,
          name,
          email,
          phone,
          destination,
          message
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
      [
        vehicleId ? Number(vehicleId) : null,
        finalVehicleTitle,
        name,
        email,
        phone,
        destination,
        message,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Interest message sent successfully.",
      interest: result.rows[0],
      data: result.rows[0],
    });
  }),
);

router.post(
  "/vehicle-request",
  withDatabase(async (req, res) => {
    const name = cleanString(req.body.name);
    const email = cleanString(req.body.email);
    const phone = cleanString(req.body.phone);
    const make = cleanString(req.body.make);
    const model = cleanString(req.body.model);
    const yearRange = cleanString(req.body.year_range || req.body.yearRange);
    const budget = cleanString(req.body.budget);
    const destination = cleanString(req.body.destination);
    const message = cleanString(req.body.message || req.body.notes);

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required.",
      });
    }

    const result = await pool.query(
      `
        INSERT INTO vehicle_requests (
          name,
          email,
          phone,
          make,
          model,
          year_range,
          budget,
          destination,
          message
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `,
      [
        name,
        email,
        phone,
        make,
        model,
        yearRange,
        budget,
        destination,
        message,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Vehicle request sent successfully.",
      request: result.rows[0],
      data: result.rows[0],
    });
  }),
);

router.get(
  "/admin/interest-messages",
  requireAdmin,
  withDatabase(async (req, res) => {
    const result = await pool.query(`
      SELECT
        interest_messages.*,
        vehicles.year AS vehicle_year,
        vehicles.make AS vehicle_make,
        vehicles.model AS vehicle_model,
        vehicles.image AS vehicle_image
      FROM interest_messages
      LEFT JOIN vehicles ON vehicles.id = interest_messages.vehicle_id
      ORDER BY interest_messages.created_at DESC, interest_messages.id DESC
    `);

    const messages = result.rows.map((row) => ({
      ...row,
      vehicle: row.vehicle_make
        ? {
            id: row.vehicle_id,
            year: row.vehicle_year,
            make: row.vehicle_make,
            model: row.vehicle_model,
            image: row.vehicle_image,
            title: [row.vehicle_year, row.vehicle_make, row.vehicle_model]
              .filter(Boolean)
              .join(" "),
          }
        : null,
    }));

    res.json({
      success: true,
      messages,
      data: messages,
    });
  }),
);

router.get(
  "/admin/vehicle-requests",
  requireAdmin,
  withDatabase(async (req, res) => {
    const result = await pool.query(`
      SELECT *
      FROM vehicle_requests
      ORDER BY created_at DESC, id DESC
    `);

    res.json({
      success: true,
      requests: result.rows,
      data: result.rows,
    });
  }),
);

app.use("/api", router);
app.use("/", router);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
    path: req.path,
  });
});

app.use((error, req, res, next) => {
  console.error("API Error:", error);

  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Something went wrong on the server.",
  });
});

export default app;
