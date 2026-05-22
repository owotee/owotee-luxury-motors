const express = require("express");
const {
  getAllVehicles,
  getVehicleById,
} = require("../controllers/vehicleController");

const router = express.Router();

router.get("/", getAllVehicles);
router.get("/:id", getVehicleById);

module.exports = router;
