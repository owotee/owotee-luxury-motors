function uploadVehicleImages(req, res) {
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
}

module.exports = {
  uploadVehicleImages,
};
