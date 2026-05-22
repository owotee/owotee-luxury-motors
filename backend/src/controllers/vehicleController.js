const { db } = require("../config/database");
const { normalizeVehicle, prepareFeatures } = require("../utils/vehicleUtils");

function getAllVehicles(req, res) {
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
}

function getVehicleById(req, res) {
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
}

function createVehicle(req, res) {
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
      status || "Available",
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
}

function updateVehicle(req, res) {
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
      status || "Available",
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
}

function deleteVehicle(req, res) {
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
}

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};
