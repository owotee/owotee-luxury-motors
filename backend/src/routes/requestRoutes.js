const express = require("express");
const {
  submitInterestMessage,
  submitVehicleRequest,
} = require("../controllers/requestController");

const router = express.Router();

router.post("/interest", submitInterestMessage);
router.post("/vehicle-request", submitVehicleRequest);

module.exports = router;
