const OLD_API = "http://3.137.207.41/api";
const OLD_BASE = "http://3.137.207.41";
const NEW_API = "https://www.234motors.com/api";

const ADMIN_USERNAME = "owotee_admin";
const ADMIN_PASSWORD = "owotee_password";

async function readJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed: ${url}`);
  }

  return data;
}

function splitImages(imageField) {
  if (!imageField) return [];

  return imageField
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function uploadOldImageToBlob(imageUrl, token) {
  let sourceUrl = imageUrl;

  if (imageUrl.startsWith("/uploads")) {
    sourceUrl = `${OLD_BASE}${imageUrl}`;
  }

  if (!sourceUrl.includes("/uploads")) {
    return imageUrl;
  }

  console.log(`Downloading old image: ${sourceUrl}`);

  const imageResponse = await fetch(sourceUrl);

  if (!imageResponse.ok) {
    console.warn(`Could not download image: ${sourceUrl}`);
    return imageUrl;
  }

  const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

  const arrayBuffer = await imageResponse.arrayBuffer();
  const filename =
    sourceUrl.split("/").pop()?.split("?")[0] || `vehicle-${Date.now()}.jpg`;

  const formData = new FormData();
  formData.append(
    "images",
    new Blob([arrayBuffer], { type: contentType }),
    filename,
  );

  if (!token) {
    throw new Error("No admin token found after login.");
  }

  const uploadResponse = await fetch(`${NEW_API}/admin/upload`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const uploadData = await uploadResponse.json().catch(() => ({}));

  if (!uploadResponse.ok) {
    throw new Error(uploadData.message || "Blob upload failed.");
  }

  return uploadData.imageUrls[0];
}

async function main() {
  console.log("Logging into new Vercel admin...");

  const loginData = await readJson(`${NEW_API}/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    }),
  });

  const token = loginData.token;

  if (!token) {
    console.log("Login response:", loginData);
    throw new Error("Login worked but no token was returned.");
  }

  console.log("Admin token received.");

  const oldData = await readJson(`${OLD_API}/vehicles`);
  const oldVehicles = oldData.vehicles || [];

  console.log(`Found ${oldVehicles.length} old vehicles.`);

  for (const vehicle of oldVehicles) {
    console.log(`Migrating: ${vehicle.year} ${vehicle.make} ${vehicle.model}`);

    const oldImages = splitImages(vehicle.image);
    const newImages = [];

    for (const image of oldImages) {
      const newImageUrl = await uploadOldImageToBlob(image, token);
      newImages.push(newImageUrl);
    }

    const payload = {
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      body: vehicle.body,
      price: vehicle.price,
      mileage: vehicle.mileage,
      destination: vehicle.destination || "Nigeria",
      exterior: vehicle.exterior || "Black",
      interior: vehicle.interior || "",
      engine: vehicle.engine || "",
      transmission: vehicle.transmission || "Automatic",
      image: newImages.join(", "),
      badge: vehicle.badge || "",
      status: vehicle.status || "Available",
      featured: Boolean(vehicle.featured),
      features: Array.isArray(vehicle.features)
        ? vehicle.features.join(", ")
        : vehicle.features || "",
    };

    await readJson(`${NEW_API}/admin/vehicles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("Imported successfully.");
  }

  console.log("Migration complete.");
}

main().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});
