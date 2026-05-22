const express = require("express");

const {
  loginAdmin,
  getAdminSession,
} = require("../controllers/adminController");
const {
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = require("../controllers/vehicleController");
const {
  getInterestMessages,
  getVehicleRequests,
} = require("../controllers/requestController");
const { uploadVehicleImages } = require("../controllers/uploadController");

const { upload } = require("../config/upload");
const { authenticateAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", loginAdmin);

router.get("/me", authenticateAdmin, getAdminSession);

router.get("/interest-messages", authenticateAdmin, getInterestMessages);
router.get("/vehicle-requests", authenticateAdmin, getVehicleRequests);

router.post(
  "/upload",
  authenticateAdmin,
  upload.array("images", 10),
  uploadVehicleImages,
);

router.post("/vehicles", authenticateAdmin, createVehicle);
router.put("/vehicles/:id", authenticateAdmin, updateVehicle);
router.delete("/vehicles/:id", authenticateAdmin, deleteVehicle);

module.exports = router;
