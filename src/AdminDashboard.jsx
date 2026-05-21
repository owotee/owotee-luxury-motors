import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const emptyVehicleForm = {
  year: "",
  make: "",
  model: "",
  body: "",
  price: "",
  mileage: "",
  location: "",
  destination: "",
  exterior: "",
  interior: "",
  engine: "",
  transmission: "",
  image: "",
  badge: "",
  status: "Available",
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
      setStatus(
        "Failed to load admin data. Make sure the backend is running on port 5000.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleFormChange = (e) => {
    const { name, value } = e.target;

    setVehicleForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
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
      "location",
      "destination",
    ];

    for (const field of requiredFields) {
      if (!String(vehicleForm[field]).trim()) {
        return `Please fill in ${field}.`;
      }
    }

    if (Number.isNaN(Number(vehicleForm.year))) {
      return "Year must be a number.";
    }

    if (Number.isNaN(Number(vehicleForm.price))) {
      return "Price must be a number. Do not include commas or dollar signs.";
    }

    if (Number.isNaN(Number(vehicleForm.mileage))) {
      return "Mileage must be a number. Do not include commas.";
    }

    return "";
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
      location: vehicle.location || "",
      destination: vehicle.destination || "",
      exterior: vehicle.exterior || "",
      interior: vehicle.interior || "",
      engine: vehicle.engine || "",
      transmission: vehicle.transmission || "",
      image: vehicle.image || "",
      badge: vehicle.badge || "",
      status: vehicle.status || "Available",
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
              Manage vehicle inventory, customer interest messages, and custom
              vehicle requests.
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
                  editingVehicleId={editingVehicleId}
                  saving={saving}
                  onChange={handleVehicleFormChange}
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

function InventoryAdmin({
  vehicles,
  vehicleForm,
  editingVehicleId,
  saving,
  onChange,
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
          Fill the required fields and click the button. Price and mileage
          should be numbers only.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <input
            className="input"
            name="year"
            placeholder="Year, e.g. 2023"
            value={vehicleForm.year}
            onChange={onChange}
          />
          <input
            className="input"
            name="make"
            placeholder="Make, e.g. Mercedes-Benz"
            value={vehicleForm.make}
            onChange={onChange}
          />
          <input
            className="input"
            name="model"
            placeholder="Model, e.g. GLS 580"
            value={vehicleForm.model}
            onChange={onChange}
          />
          <input
            className="input"
            name="body"
            placeholder="Body Type, e.g. SUV"
            value={vehicleForm.body}
            onChange={onChange}
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
          <input
            className="input"
            name="location"
            placeholder="U.S. Location, e.g. Dallas, Texas"
            value={vehicleForm.location}
            onChange={onChange}
          />
          <input
            className="input"
            name="destination"
            placeholder="Destination, e.g. Nigeria"
            value={vehicleForm.destination}
            onChange={onChange}
          />
          <input
            className="input"
            name="exterior"
            placeholder="Exterior Color"
            value={vehicleForm.exterior}
            onChange={onChange}
          />
          <input
            className="input"
            name="interior"
            placeholder="Interior Color"
            value={vehicleForm.interior}
            onChange={onChange}
          />
          <input
            className="input"
            name="engine"
            placeholder="Engine"
            value={vehicleForm.engine}
            onChange={onChange}
          />
          <input
            className="input"
            name="transmission"
            placeholder="Transmission"
            value={vehicleForm.transmission}
            onChange={onChange}
          />
          <input
            className="input md:col-span-2"
            name="image"
            placeholder="Image URL"
            value={vehicleForm.image}
            onChange={onChange}
          />
          <input
            className="input md:col-span-2"
            name="badge"
            placeholder="Badge, e.g. New Arrival"
            value={vehicleForm.badge}
            onChange={onChange}
          />
          <select
            className="input md:col-span-2"
            name="status"
            value={vehicleForm.status}
            onChange={onChange}
          >
            <option value="Available">Available</option>
            <option value="Reserved">Reserved</option>
            <option value="Sold">Sold</option>
          </select>
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
                  </div>

                  <h3 className="mt-1 text-xl font-black">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>

                  <p className="mt-1 text-gray-400">
                    ${Number(vehicle.price).toLocaleString()} ·{" "}
                    {Number(vehicle.mileage).toLocaleString()} mi ·{" "}
                    {vehicle.location} · {vehicle.destination}
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
