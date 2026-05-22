const { db } = require("../config/database");

function submitInterestMessage(req, res) {
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
}

function submitVehicleRequest(req, res) {
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
}

function getInterestMessages(req, res) {
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
}

function getVehicleRequests(req, res) {
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
}

module.exports = {
  submitInterestMessage,
  submitVehicleRequest,
  getInterestMessages,
  getVehicleRequests,
};
