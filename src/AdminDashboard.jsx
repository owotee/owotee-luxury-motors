import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const vehicleMakes = [
  "Mercedes-Benz",
  "Lexus",
  "Range Rover",
  "BMW",
  "Porsche",
  "Cadillac",
  "Audi",
  "Bentley",
  "Rolls-Royce",
  "Toyota",
  "Land Rover",
  "McLaren",
  "Lamborghini",
  "Ferrari",
];

const modelsByMake = {
  "Mercedes-Benz": [
    "G-Class G 550",
    "G-Class AMG G 63",
    "S 580 4MATIC",
    "GLS 580",
    "GLE 350",
    "GLE 53 AMG",
    "Maybach GLS 600",
  ],
  Lexus: ["LX 600 Premium", "LX 600 F Sport", "GX 550", "RX 500h", "LS 500"],
  "Range Rover": [
    "Range Rover Sport HSE",
    "Range Rover Autobiography",
    "Range Rover Vogue",
    "Range Rover Velar",
    "Range Rover Evoque",
  ],
  BMW: [
    "X7 xDrive40i",
    "X7 M60i",
    "X5 xDrive40i",
    "740i",
    "760i",
    "M850 xDrive",
  ],
  Porsche: ["Cayenne Platinum", "Cayenne S", "Panamera", "Macan GTS"],
  Cadillac: ["Escalade Premium Luxury", "Escalade Sport", "Escalade ESV"],
  Audi: ["Q8", "Q7", "A8L", "RS Q8"],
  Bentley: ["Bentayga", "Continental GT", "Flying Spur"],
  "Rolls-Royce": ["Cullinan", "Ghost", "Phantom", "Wraith"],
  Toyota: ["Land Cruiser VX", "Land Cruiser GR Sport", "Sequoia Capstone"],
  "Land Rover": ["Defender 110", "Defender 130", "Discovery"],
  McLaren: ["720S", "750S", "Artura", "GT"],
  Lamborghini: ["Urus", "Huracan", "Aventador", "Revuelto"],
  Ferrari: ["Roma", "Portofino", "F8 Tributo", "SF90 Stradale"],
};

const years = Array.from({ length: 17 }, (_, index) => String(2026 - index));

const bodyTypes = [
  "SUV",
  "Sedan",
  "Coupe",
  "Truck",
  "Convertible",
  "Electric Luxury",
  "Performance SUV",
  "Sports Car",
  "Supercar",
];

const colors = [
  "Black",
  "White",
  "Silver",
  "Gray",
  "Blue",
  "Red",
  "Green",
  "Brown",
  "Beige",
  "Tan",
  "Gold",
  "Pearl White",
  "Obsidian Black",
  "Santorini Black",
  "Atomic Silver",
  "Crystal White",
];

const interiors = [
  "Black Leather",
  "Brown Leather",
  "Tan Leather",
  "Beige Leather",
  "Red Leather",
  "White Leather",
  "Ebony Leather",
  "Coffee Leather",
  "Nappa Leather",
];

const transmissions = ["Automatic", "Manual", "Single-Speed"];

const engines = [
  "2.0L Turbo",
  "3.0L Turbo I6",
  "3.0L Mild Hybrid",
  "3.4L Twin-Turbo V6",
  "4.0L V8",
  "4.0L V8 Biturbo",
  "5.7L V8",
  "6.2L V8",
  "Electric",
  "Hybrid",
];

const destinations = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "Cameroon",
  "Benin",
  "Togo",
  "Ivory Coast",
  "Senegal",
];

const statuses = ["Available", "Available Soon", "Reserved", "Sold"];

const badges = [
  "New Arrival",
  "High Demand",
  "Export Favorite",
  "Executive SUV",
  "Luxury Pick",
  "Performance",
  "Family Luxury",
  "Reserved",
  "Sold",
];

const emptyVehicleForm = {
  year: "",
  make: "",
  model: "",
  body: "",
  price: "",
  mileage: "",
  destination: "Nigeria",
  exterior: "",
  interior: "",
  engine: "",
  transmission: "Automatic",
  image: "",
  badge: "New Arrival",
  status: "Available",
  featured: false,
  features: "",
};

async function readResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {
      success: false,
      message: text || "Server returned an invalid response.",
    };
  }
}

function getApiBaseUrl() {
  return API_URL.replace("/api", "");
}

function resolveImageUrl(imageUrl) {
  if (!imageUrl) {
    return "";
  }

  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/uploads")) {
    return `${getApiBaseUrl()}${imageUrl}`;
  }

  return imageUrl;
}

function getImageList(imageText) {
  return imageText
    ? imageText
        .split(",")
        .map((image) => image.trim())
        .filter(Boolean)
    : [];
}

function AdminDashboard() {
  const [token, setToken] = useState(
    () => localStorage.getItem("owoteeAdminToken") || "",
  );

  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  const [activeTab, setActiveTab] = useState("inventory");
  const [vehicles, setVehicles] = useState([]);
  const [interestMessages, setInterestMessages] = useState([]);
  const [vehicleRequests, setVehicleRequests] = useState([]);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const modelOptions = useMemo(() => {
    return modelsByMake[vehicleForm.make] || [];
  }, [vehicleForm.make]);

  useEffect(() => {
    if (token) {
      loadAdminData(token);
    }
  }, [token]);

  const authHeaders = (adminToken = token) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminToken}`,
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus("Logging in...");

    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginForm),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      localStorage.setItem("owoteeAdminToken", data.token);
      setToken(data.token);
      setStatus("Login successful.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("owoteeAdminToken");
    setToken("");
    setStatus("");
    setVehicles([]);
    setInterestMessages([]);
    setVehicleRequests([]);
  };

  const loadAdminData = async (adminToken = token) => {
    try {
      setLoading(true);

      const vehiclesResponse = await fetch(`${API_URL}/vehicles`);

      const interestResponse = await fetch(
        `${API_URL}/admin/interest-messages`,
        {
          headers: authHeaders(adminToken),
        },
      );

      const requestsResponse = await fetch(
        `${API_URL}/admin/vehicle-requests`,
        {
          headers: authHeaders(adminToken),
        },
      );

      const vehiclesData = await readResponse(vehiclesResponse);
      const interestData = await readResponse(interestResponse);
      const requestsData = await readResponse(requestsResponse);

      if (vehiclesData.success) {
        setVehicles(vehiclesData.vehicles || []);
      }

      if (interestData.success) {
        setInterestMessages(interestData.messages || []);
      } else if (interestResponse.status === 401) {
        handleLogout();
        setStatus("Session expired. Please log in again.");
      }

      if (requestsData.success) {
        setVehicleRequests(requestsData.requests || []);
      }
    } catch (error) {
      console.error(error);
      setStatus("Failed to load admin data. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    setVehicleForm((previousForm) => {
      if (name === "make") {
        return {
          ...previousForm,
          make: value,
          model: "",
        };
      }

      return {
        ...previousForm,
        [name]: type === "checkbox" ? checked : value,
      };
    });
  };

  const resetVehicleForm = () => {
    setVehicleForm(emptyVehicleForm);
    setEditingVehicleId(null);
    setStatus("");
  };

  const validateVehicleForm = () => {
    const requiredFields = [
      "year",
      "make",
      "model",
      "body",
      "price",
      "mileage",
      "destination",
      "exterior",
    ];

    for (const field of requiredFields) {
      if (!String(vehicleForm[field]).trim()) {
        return `Please fill in ${field}.`;
      }
    }

    if (Number.isNaN(Number(vehicleForm.price))) {
      return "Price must be a number. Do not include commas or dollar signs.";
    }

    if (Number.isNaN(Number(vehicleForm.mileage))) {
      return "Mileage must be a number. Do not include commas.";
    }

    return "";
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) {
      return;
    }

    const formData = new FormData();

    files.forEach((file) => {
      formData.append("images", file);
    });

    try {
      setUploadingImages(true);
      setStatus("Uploading images...");

      const response = await fetch(`${API_URL}/admin/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await readResponse(response);

      if (response.status === 401) {
        handleLogout();
        throw new Error("Session expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(data.message || "Image upload failed.");
      }

      const uploadedImages = data.imageUrls || [];

      setVehicleForm((previousForm) => {
        const existingImages = getImageList(previousForm.image);
        const allImages = [...existingImages, ...uploadedImages];

        return {
          ...previousForm,
          image: allImages.join(", "),
        };
      });

      setStatus("Images uploaded successfully.");
    } catch (error) {
      console.error(error);
      setStatus(error.message);
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = (imageToRemove) => {
    setVehicleForm((previousForm) => {
      const remainingImages = getImageList(previousForm.image).filter(
        (image) => image !== imageToRemove,
      );

      return {
        ...previousForm,
        image: remainingImages.join(", "),
      };
    });
  };

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateVehicleForm();

    if (validationError) {
      setStatus(validationError);
      return;
    }

    const vehiclePayload = {
      ...vehicleForm,
      year: Number(vehicleForm.year),
      price: Number(vehicleForm.price),
      mileage: Number(vehicleForm.mileage),
    };

    const isEditing = Boolean(editingVehicleId);

    const url = isEditing
      ? `${API_URL}/admin/vehicles/${editingVehicleId}`
      : `${API_URL}/admin/vehicles`;

    const method = isEditing ? "PUT" : "POST";

    try {
      setSaving(true);
      setStatus(isEditing ? "Updating vehicle..." : "Adding vehicle...");

      const response = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(vehiclePayload),
      });

      const data = await readResponse(response);

      if (response.status === 401) {
        handleLogout();
        throw new Error("Session expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(data.message || "Vehicle save failed.");
      }

      setStatus(
        data.message ||
          (isEditing
            ? "Vehicle updated successfully."
            : "Vehicle added successfully."),
      );

      setVehicleForm(emptyVehicleForm);
      setEditingVehicleId(null);
      await loadAdminData();
    } catch (error) {
      console.error(error);
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditVehicle = (vehicle) => {
    setActiveTab("inventory");
    setEditingVehicleId(vehicle.id);

    setVehicleForm({
      year: vehicle.year || "",
      make: vehicle.make || "",
      model: vehicle.model || "",
      body: vehicle.body || "",
      price: vehicle.price || "",
      mileage: vehicle.mileage || "",
      destination: vehicle.destination || "Nigeria",
      exterior: vehicle.exterior || "",
      interior: vehicle.interior || "",
      engine: vehicle.engine || "",
      transmission: vehicle.transmission || "Automatic",
      image: vehicle.image || "",
      badge: vehicle.badge || "New Arrival",
      status: vehicle.status || "Available",
      featured: Boolean(vehicle.featured),
      features: Array.isArray(vehicle.features)
        ? vehicle.features.join(", ")
        : vehicle.features || "",
    });

    setStatus(`Editing ${vehicle.year} ${vehicle.make} ${vehicle.model}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteVehicle = async (vehicleId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this vehicle?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setStatus("Deleting vehicle...");

      const response = await fetch(`${API_URL}/admin/vehicles/${vehicleId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const data = await readResponse(response);

      if (response.status === 401) {
        handleLogout();
        throw new Error("Session expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(data.message || "Delete failed.");
      }

      setStatus(data.message || "Vehicle deleted successfully.");
      await loadAdminData();
    } catch (error) {
      console.error(error);
      setStatus(error.message);
    }
  };

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl"
        >
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
            Owotee Luxury Motors
          </p>

          <h1 className="mt-3 text-4xl font-black">Admin Login</h1>

          <p className="mt-3 text-gray-400">
            Enter your admin username and password to manage inventory and
            customer messages.
          </p>

          <div className="mt-8 grid gap-4">
            <input
              className="input"
              placeholder="Username"
              value={loginForm.username}
              onChange={(e) =>
                setLoginForm({ ...loginForm, username: e.target.value })
              }
            />

            <input
              className="input"
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm({ ...loginForm, password: e.target.value })
              }
            />
          </div>

          <button
            type="submit"
            className="mt-5 w-full rounded-full bg-yellow-400 px-6 py-4 font-bold text-black hover:bg-yellow-300"
          >
            Login
          </button>

          {status && (
            <p className="mt-4 rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-gray-300">
              {status}
            </p>
          )}

          <a
            href="/"
            className="mt-5 block text-center text-sm font-bold text-gray-400 hover:text-yellow-400"
          >
            Back to Website
          </a>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-zinc-950 px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-black">
              Owotee <span className="text-yellow-400">Admin Dashboard</span>
            </h1>

            <p className="mt-2 text-gray-400">
              Manage inventory, uploaded images, customer messages, and vehicle
              requests.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/"
              className="rounded-full border border-white/20 px-6 py-3 text-center font-bold hover:bg-white hover:text-black"
            >
              Back to Website
            </a>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-red-500 px-6 py-3 font-bold text-white hover:bg-red-400"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap gap-3">
            <TabButton
              active={activeTab === "inventory"}
              onClick={() => setActiveTab("inventory")}
            >
              Inventory
            </TabButton>

            <TabButton
              active={activeTab === "interest"}
              onClick={() => setActiveTab("interest")}
            >
              Interest Messages
            </TabButton>

            <TabButton
              active={activeTab === "requests"}
              onClick={() => setActiveTab("requests")}
            >
              Vehicle Requests
            </TabButton>
          </div>

          {status && (
            <div className="mb-6 rounded-2xl border border-white/10 bg-zinc-950 px-5 py-4 text-gray-300">
              {status}
            </div>
          )}

          {loading ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center">
              Loading admin data...
            </div>
          ) : (
            <>
              {activeTab === "inventory" && (
                <InventoryAdmin
                  vehicles={vehicles}
                  vehicleForm={vehicleForm}
                  modelOptions={modelOptions}
                  editingVehicleId={editingVehicleId}
                  saving={saving}
                  uploadingImages={uploadingImages}
                  onChange={handleVehicleFormChange}
                  onImageUpload={handleImageUpload}
                  onRemoveImage={handleRemoveImage}
                  onSubmit={handleVehicleSubmit}
                  onReset={resetVehicleForm}
                  onEdit={handleEditVehicle}
                  onDelete={handleDeleteVehicle}
                />
              )}

              {activeTab === "interest" && (
                <InterestMessages messages={interestMessages} />
              )}

              {activeTab === "requests" && (
                <VehicleRequests requests={vehicleRequests} />
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-yellow-400 px-5 py-3 font-bold text-black"
          : "rounded-full border border-white/20 px-5 py-3 font-bold text-white hover:bg-white hover:text-black"
      }
    >
      {children}
    </button>
  );
}

function ComboField({ name, value, onChange, options, placeholder }) {
  const listId = `${name}-options`;

  return (
    <div>
      <input
        className="input"
        name={name}
        value={value}
        onChange={onChange}
        list={listId}
        placeholder={placeholder}
      />

      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </div>
  );
}

function InventoryAdmin({
  vehicles,
  vehicleForm,
  modelOptions,
  editingVehicleId,
  saving,
  uploadingImages,
  onChange,
  onImageUpload,
  onRemoveImage,
  onSubmit,
  onReset,
  onEdit,
  onDelete,
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <form
        onSubmit={onSubmit}
        className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
      >
        <h2 className="text-2xl font-black">
          {editingVehicleId ? "Edit Vehicle" : "Add New Vehicle"}
        </h2>

        <p className="mt-2 text-gray-400">
          Use dropdown suggestions or type your own values. Upload one or more
          images from your device.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ComboField
            name="year"
            value={vehicleForm.year}
            onChange={onChange}
            options={years}
            placeholder="Select or type Year"
          />

          <ComboField
            name="make"
            value={vehicleForm.make}
            onChange={onChange}
            options={vehicleMakes}
            placeholder="Select or type Make"
          />

          <ComboField
            name="model"
            value={vehicleForm.model}
            onChange={onChange}
            options={modelOptions}
            placeholder={
              vehicleForm.make
                ? "Select or type Model"
                : "Select make first or type model"
            }
          />

          <ComboField
            name="body"
            value={vehicleForm.body}
            onChange={onChange}
            options={bodyTypes}
            placeholder="Select or type Body Type"
          />

          <input
            className="input"
            name="price"
            placeholder="Price, e.g. 115000"
            value={vehicleForm.price}
            onChange={onChange}
          />

          <input
            className="input"
            name="mileage"
            placeholder="Mileage, e.g. 14500"
            value={vehicleForm.mileage}
            onChange={onChange}
          />

          <ComboField
            name="destination"
            value={vehicleForm.destination}
            onChange={onChange}
            options={destinations}
            placeholder="Select or type Destination"
          />

          <ComboField
            name="exterior"
            value={vehicleForm.exterior}
            onChange={onChange}
            options={colors}
            placeholder="Select or type Exterior Color"
          />

          <ComboField
            name="interior"
            value={vehicleForm.interior}
            onChange={onChange}
            options={interiors}
            placeholder="Select or type Interior Color"
          />

          <ComboField
            name="engine"
            value={vehicleForm.engine}
            onChange={onChange}
            options={engines}
            placeholder="Select or type Engine"
          />

          <ComboField
            name="transmission"
            value={vehicleForm.transmission}
            onChange={onChange}
            options={transmissions}
            placeholder="Select or type Transmission"
          />

          <ComboField
            name="status"
            value={vehicleForm.status}
            onChange={onChange}
            options={statuses}
            placeholder="Select or type Status"
          />

          <ComboField
            name="badge"
            value={vehicleForm.badge}
            onChange={onChange}
            options={badges}
            placeholder="Select or type Badge"
          />

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black p-4 font-bold text-gray-200">
            <input
              type="checkbox"
              name="featured"
              checked={vehicleForm.featured}
              onChange={onChange}
              className="h-5 w-5 accent-yellow-400"
            />
            Feature this vehicle on homepage
          </label>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-gray-300">
              Upload Vehicle Images
            </label>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onImageUpload}
              className="input"
            />

            <p className="mt-2 text-sm text-gray-500">
              Upload multiple images. The first image will be the main display
              image.
            </p>

            {uploadingImages && (
              <p className="mt-2 text-sm font-bold text-yellow-400">
                Uploading images...
              </p>
            )}
          </div>

          <textarea
            className="input min-h-28 md:col-span-2"
            name="image"
            placeholder="Image paths or URLs will appear here. You can also paste URLs separated by commas."
            value={vehicleForm.image}
            onChange={onChange}
          />

          <ImagePreviewManager
            imageText={vehicleForm.image}
            onRemoveImage={onRemoveImage}
          />

          <textarea
            className="input min-h-28 md:col-span-2"
            name="features"
            placeholder="Features separated by commas, e.g. Leather, Sunroof, Premium Audio"
            value={vehicleForm.features}
            onChange={onChange}
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-yellow-400 px-6 py-4 font-bold text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : editingVehicleId
                ? "Update Vehicle"
                : "Add Vehicle"}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-white/20 px-6 py-4 font-bold hover:bg-white hover:text-black"
          >
            Clear Form
          </button>
        </div>
      </form>

      <div>
        <h2 className="mb-5 text-2xl font-black">Current Inventory</h2>

        <div className="grid gap-4">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <p className="text-sm font-bold uppercase tracking-widest text-yellow-400">
                      {vehicle.badge || "Inventory"}
                    </p>

                    <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-bold text-gray-300">
                      {vehicle.status || "Available"}
                    </span>

                    {vehicle.featured && (
                      <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black">
                        Featured
                      </span>
                    )}
                  </div>

                  <h3 className="mt-1 text-xl font-black">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>

                  <p className="mt-1 text-gray-400">
                    ${Number(vehicle.price).toLocaleString()} ·{" "}
                    {Number(vehicle.mileage).toLocaleString()} mi ·{" "}
                    {vehicle.destination} · {vehicle.exterior}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => onEdit(vehicle)}
                    className="rounded-full border border-white/20 px-5 py-3 font-bold hover:bg-white hover:text-black"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(vehicle.id)}
                    className="rounded-full bg-red-500 px-5 py-3 font-bold text-white hover:bg-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {vehicles.length === 0 && (
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-8 text-center text-gray-400">
              No vehicles found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ImagePreviewManager({ imageText, onRemoveImage }) {
  const images = getImageList(imageText);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="md:col-span-2">
      <p className="mb-3 text-sm font-bold text-gray-300">
        Uploaded / Added Images
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image, index) => (
          <div
            key={`${image}-${index}`}
            className="overflow-hidden rounded-2xl border border-white/10 bg-black"
          >
            <img
              src={resolveImageUrl(image)}
              alt={`Vehicle preview ${index + 1}`}
              className="h-36 w-full object-cover"
            />

            <div className="p-3">
              <p className="truncate text-xs text-gray-500">{image}</p>

              {index === 0 && (
                <p className="mt-1 text-xs font-bold text-yellow-400">
                  Main display image
                </p>
              )}

              <button
                type="button"
                onClick={() => onRemoveImage(image)}
                className="mt-3 w-full rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-400"
              >
                Remove Image
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InterestMessages({ messages }) {
  return (
    <section>
      <h2 className="mb-5 text-2xl font-black">Interested Customers</h2>

      <div className="grid gap-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <AdminInfo label="Name" value={message.full_name} />
              <AdminInfo label="Phone / WhatsApp" value={message.phone} />
              <AdminInfo
                label="Email"
                value={message.email || "Not provided"}
              />
              <AdminInfo
                label="Destination"
                value={message.destination_country || "Not provided"}
              />
              <AdminInfo
                label="Vehicle"
                value={message.vehicle_interested_in}
              />
              <AdminInfo label="Date" value={message.created_at} />
            </div>

            <div className="mt-4 rounded-2xl bg-black p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500">
                Message
              </p>

              <p className="mt-2 text-gray-300">
                {message.message || "No message provided."}
              </p>
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-8 text-center text-gray-400">
            No interest messages yet.
          </div>
        )}
      </div>
    </section>
  );
}

function VehicleRequests({ requests }) {
  return (
    <section>
      <h2 className="mb-5 text-2xl font-black">Custom Vehicle Requests</h2>

      <div className="grid gap-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <AdminInfo label="Name" value={request.full_name} />
              <AdminInfo label="Phone / WhatsApp" value={request.phone} />
              <AdminInfo
                label="Email"
                value={request.email || "Not provided"}
              />
              <AdminInfo
                label="Destination"
                value={request.destination_country || "Not provided"}
              />
              <AdminInfo
                label="Preferred Make"
                value={request.preferred_make || "Not provided"}
              />
              <AdminInfo
                label="Preferred Model"
                value={request.preferred_model || "Not provided"}
              />
              <AdminInfo
                label="Year Range"
                value={request.year_range || "Not provided"}
              />
              <AdminInfo
                label="Budget"
                value={request.budget || "Not provided"}
              />
              <AdminInfo label="Date" value={request.created_at} />
            </div>

            <div className="mt-4 rounded-2xl bg-black p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500">
                Request Details
              </p>

              <p className="mt-2 text-gray-300">
                {request.message || "No additional message provided."}
              </p>
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-8 text-center text-gray-400">
            No custom vehicle requests yet.
          </div>
        )}
      </div>
    </section>
  );
}

function AdminInfo({ label, value }) {
  return (
    <div className="rounded-2xl bg-black p-4">
      <p className="text-xs uppercase tracking-widest text-gray-500">{label}</p>
      <p className="mt-1 font-semibold text-gray-200">{value}</p>
    </div>
  );
}

export default AdminDashboard;
