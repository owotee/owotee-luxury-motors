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

module.exports = {
  parseFeatures,
  prepareFeatures,
  normalizeVehicle,
};
