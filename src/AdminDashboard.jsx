import { useEffect, useMemo, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  BarChart3,
  Camera,
  Car,
  CheckCircle2,
  ChevronDown,
  Crown,
  Edit3,
  Eye,
  Gauge,
  Globe2,
  ImagePlus,
  Inbox,
  Loader2,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getApiBaseUrl = () => API_URL.replace("/api", "");

const resolveImageUrl = (imageUrl) => {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("http")) return imageUrl;
  if (imageUrl.startsWith("/uploads")) return `${getApiBaseUrl()}${imageUrl}`;
  return imageUrl;
};

const formatCurrency = (value) => {
  const number = Number(value || 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(number);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
};

const sanitizePhone = (value) => value.replace(/[^\d+\s()-]/g, "");

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

const makes = [
  "Mercedes-Benz",
  "BMW",
  "Lexus",
  "Toyota",
  "Land Rover",
  "Range Rover",
  "Porsche",
  "Bentley",
  "Rolls-Royce",
  "Cadillac",
  "Audi",
  "Tesla",
  "Genesis",
  "Lincoln",
];

const bodyTypes = [
  "SUV",
  "Sedan",
  "Coupe",
  "Convertible",
  "Pickup",
  "Truck",
  "Van",
  "Wagon",
];

const destinations = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "Liberia",
  "Sierra Leone",
  "Cameroon",
  "United Arab Emirates",
  "Worldwide",
];

const colors = [
  "Black",
  "White",
  "Pearl White",
  "Silver",
  "Gray",
  "Graphite",
  "Blue",
  "Red",
  "Burgundy",
  "Green",
  "Gold",
  "Brown",
];

const interiors = [
  "Black Leather",
  "Brown Leather",
  "Beige Leather",
  "White Leather",
  "Red Leather",
  "Tan Leather",
  "Two-Tone Leather",
];

const transmissions = ["Automatic", "Manual", "CVT", "Dual-Clutch"];

const engines = [
  "V4",
  "V6",
  "V8",
  "V12",
  "Hybrid",
  "Plug-in Hybrid",
  "Electric",
  "Turbocharged",
];

const statuses = ["Available", "Available Soon", "Reserved", "Sold"];

const badges = [
  "New Arrival",
  "Featured",
  "Premium Pick",
  "Hot Deal",
  "Export Ready",
  "Low Mileage",
  "Luxury Selection",
];

const years = Array.from({ length: 18 }, (_, index) =>
  String(new Date().getFullYear() + 1 - index),
);
const adminPages = [
  {
    key: "overview",
    path: "/admin/overview",
    label: "Overview",
    title: "Business Overview",
    icon: BarChart3,
  },
  {
    key: "inventory",
    path: "/admin/inventory",
    label: "Inventory",
    title: "Vehicle Inventory",
    icon: Car,
  },
  {
    key: "messages",
    path: "/admin/messages",
    label: "Interest Messages",
    title: "Customer Interest",
    icon: Inbox,
  },
  {
    key: "requests",
    path: "/admin/requests",
    label: "Vehicle Requests",
    title: "Custom Requests",
    icon: Send,
  },
];

function AdminDashboard() {
  const [token, setToken] = useState(
    localStorage.getItem("owoteeAdminToken") || "",
  );
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  const [vehicles, setVehicles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [requests, setRequests] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = useMemo(() => {
    const currentPage = adminPages.find((page) =>
      location.pathname.startsWith(page.path),
    );

    return currentPage?.key || "overview";
  }, [location.pathname]);

  const activePage = useMemo(() => {
    return adminPages.find((page) => page.key === activeTab) || adminPages[0];
  }, [activeTab]);

  const goToAdminPage = (pageKey) => {
    navigate(`/admin/${pageKey}`);
    setSidebarOpen(false);
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const [inventorySearch, setInventorySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [uploading, setUploading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const authedFetch = async (endpoint, options = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  };

  const clearAlerts = () => {
    setError("");
    setNotice("");
  };

  const loadDashboard = async () => {
    if (!token) return;

    setLoading(true);
    clearAlerts();

    try {
      const [vehiclesData, messagesData, requestsData] = await Promise.all([
        fetch(`${API_URL}/vehicles`).then((res) => res.json()),
        authedFetch("/admin/interest-messages"),
        authedFetch("/admin/vehicle-requests"),
      ]);

      setVehicles(vehiclesData.vehicles || []);
      setMessages(messagesData.messages || []);
      setRequests(requestsData.requests || []);
    } catch (err) {
      setError(err.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [token]);

  const stats = useMemo(() => {
    const available = vehicles.filter(
      (vehicle) => vehicle.status === "Available",
    ).length;
    const availableSoon = vehicles.filter(
      (vehicle) => vehicle.status === "Available Soon",
    ).length;
    const reserved = vehicles.filter(
      (vehicle) => vehicle.status === "Reserved",
    ).length;
    const sold = vehicles.filter((vehicle) => vehicle.status === "Sold").length;
    const featured = vehicles.filter((vehicle) => vehicle.featured).length;

    return {
      total: vehicles.length,
      available,
      availableSoon,
      reserved,
      sold,
      featured,
      messages: messages.length,
      requests: requests.length,
    };
  }, [vehicles, messages, requests]);

  const filteredVehicles = useMemo(() => {
    const searchValue = inventorySearch.toLowerCase().trim();

    return vehicles.filter((vehicle) => {
      const matchesSearch =
        !searchValue ||
        `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.body} ${vehicle.destination} ${vehicle.exterior}`
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "All" || vehicle.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [vehicles, inventorySearch, statusFilter]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginLoading(true);
    clearAlerts();

    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid login.");
      }

      localStorage.setItem("owoteeAdminToken", data.token);
      setToken(data.token);
      navigate("/admin/overview", { replace: true });
      setNotice("Login successful.");
    } catch (err) {
      setError(err.message || "Unable to login.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("owoteeAdminToken");
    setToken("");
    setVehicles([]);
    setMessages([]);
    setRequests([]);
  };

  const openCreateEditor = () => {
    setEditingVehicleId(null);
    setVehicleForm(emptyVehicleForm);
    setEditorOpen(true);
    clearAlerts();
  };

  const openEditEditor = (vehicle) => {
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
      badge: vehicle.badge || "",
      status: vehicle.status || "Available",
      featured: Boolean(vehicle.featured),
      features: Array.isArray(vehicle.features)
        ? vehicle.features.join(", ")
        : vehicle.features || "",
    });

    setEditorOpen(true);
    clearAlerts();
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingVehicleId(null);
    setVehicleForm(emptyVehicleForm);
  };

  const handleVehicleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setVehicleForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    setUploading(true);
    clearAlerts();

    try {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch(`${API_URL}/admin/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Image upload failed.");
      }

      const existingImages = vehicleForm.image
        ? vehicleForm.image
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      const updatedImages = [...existingImages, ...(data.imageUrls || [])];

      setVehicleForm((previous) => ({
        ...previous,
        image: updatedImages.join(", "),
      }));

      setNotice("Image uploaded successfully.");
    } catch (err) {
      setError(err.message || "Unable to upload image.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const removeImage = (imageToRemove) => {
    const updatedImages = vehicleForm.image
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item && item !== imageToRemove);

    setVehicleForm((previous) => ({
      ...previous,
      image: updatedImages.join(", "),
    }));
  };

  const handleSaveVehicle = async (event) => {
    event.preventDefault();

    setSaving(true);
    clearAlerts();

    const payload = {
      ...vehicleForm,
      price: Number(vehicleForm.price),
      mileage: Number(vehicleForm.mileage),
      year: Number(vehicleForm.year),
    };

    try {
      if (editingVehicleId) {
        await authedFetch(`/admin/vehicles/${editingVehicleId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        setNotice("Vehicle updated successfully.");
      } else {
        await authedFetch("/admin/vehicles", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setNotice("Vehicle added successfully.");
      }

      closeEditor();
      await loadDashboard();
      navigate("/admin/inventory");
    } catch (err) {
      setError(err.message || "Unable to save vehicle.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVehicle = async (vehicle) => {
    const confirmed = window.confirm(
      `Delete ${vehicle.year} ${vehicle.make} ${vehicle.model}? This cannot be undone.`,
    );

    if (!confirmed) return;

    clearAlerts();

    try {
      await authedFetch(`/admin/vehicles/${vehicle.id}`, {
        method: "DELETE",
      });

      setNotice("Vehicle deleted successfully.");
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Unable to delete vehicle.");
    }
  };

  if (!token) {
    return (
      <section className="min-h-screen bg-[#080808] text-white">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10">
          <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative hidden min-h-[680px] overflow-hidden bg-gradient-to-br from-[#111] via-[#19140b] to-black p-10 lg:block">
              <div className="absolute inset-0 opacity-30">
                <div className="absolute left-20 top-20 h-64 w-64 rounded-full bg-yellow-500 blur-[120px]" />
                <div className="absolute bottom-24 right-14 h-72 w-72 rounded-full bg-white blur-[150px]" />
              </div>

              <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                  <div className="mb-10 inline-flex items-center gap-3 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm text-yellow-200">
                    <Crown size={18} />
                    234 Luxury Motors Admin
                  </div>

                  <h1 className="max-w-xl text-5xl font-black leading-tight tracking-tight">
                    Command center for luxury exports.
                  </h1>

                  <p className="mt-6 max-w-lg text-lg leading-8 text-white/70">
                    Manage premium inventory, customer interest, custom sourcing
                    requests, featured vehicles, and export-ready listings from
                    one polished dashboard.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <LoginFeature icon={Car} label="Inventory" />
                  <LoginFeature icon={Globe2} label="Exports" />
                  <LoginFeature icon={ShieldCheck} label="Secure Admin" />
                </div>
              </div>
            </div>

            <div className="flex min-h-[680px] items-center justify-center p-6 sm:p-10">
              <form
                onSubmit={handleLogin}
                className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl sm:p-8"
              >
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400 text-black shadow-lg shadow-yellow-500/20">
                    <Crown size={30} />
                  </div>

                  <h2 className="text-3xl font-black tracking-tight">
                    Admin Login
                  </h2>

                  <p className="mt-2 text-sm text-white/60">
                    Sign in to manage 234 Luxury Motors.
                  </p>
                </div>

                {error && <Alert type="error" message={error} />}

                <div className="space-y-4">
                  <InputField
                    label="Username"
                    name="username"
                    value={loginForm.username}
                    onChange={(event) =>
                      setLoginForm((previous) => ({
                        ...previous,
                        username: event.target.value,
                      }))
                    }
                    icon={UserRound}
                    placeholder="Enter admin username"
                    required
                  />

                  <InputField
                    label="Password"
                    name="password"
                    type="password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((previous) => ({
                        ...previous,
                        password: event.target.value,
                      }))
                    }
                    icon={ShieldCheck}
                    placeholder="Enter admin password"
                    required
                  />

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-4 font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loginLoading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <ShieldCheck size={20} />
                    )}
                    Login to Dashboard
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen overflow-x-hidden bg-[#f5f1ea] text-[#161616]">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-80 transform border-r border-black/10 bg-[#0b0b0b] text-white transition duration-300 lg:static lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-black">
                  <Crown size={25} />
                </div>

                <div>
                  <p className="text-lg font-black leading-tight">Owotee</p>
                  <p className="text-xs uppercase tracking-[0.28em] text-yellow-300">
                    Admin
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-xl p-2 text-white/70 hover:bg-white/10 lg:hidden"
              >
                <X size={22} />
              </button>
            </div>

            <nav className="flex-1 space-y-2 p-4">
              <SidebarButton
                icon={BarChart3}
                label="Overview"
                active={activeTab === "overview"}
                onClick={() => goToAdminPage("overview")}
              />

              <SidebarButton
                icon={Car}
                label="Inventory"
                active={activeTab === "inventory"}
                count={vehicles.length}
                onClick={() => goToAdminPage("inventory")}
              />

              <SidebarButton
                icon={Inbox}
                label="Interest Messages"
                active={activeTab === "messages"}
                count={messages.length}
                onClick={() => goToAdminPage("messages")}
              />

              <SidebarButton
                icon={Send}
                label="Vehicle Requests"
                active={activeTab === "requests"}
                count={requests.length}
                onClick={() => goToAdminPage("requests")}
              />
            </nav>

            <div className="border-t border-white/10 p-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 font-bold text-white/80 transition hover:bg-white/10"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <button
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        )}

        <main className="min-w-0 flex-1 overflow-x-hidden">
          <header className="sticky top-0 z-20 border-b border-black/10 bg-[#f5f1ea]/90 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-2xl bg-black p-3 text-white lg:hidden"
                >
                  <Menu size={20} />
                </button>

                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-black/50">
                    Dashboard
                  </p>
                  <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                    {activePage.title}
                  </h1>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={loadDashboard}
                  disabled={loading}
                  className="hidden rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-black shadow-sm transition hover:bg-black hover:text-white sm:flex"
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </button>

                <button
                  onClick={openCreateEditor}
                  className="flex items-center gap-2 rounded-2xl bg-black px-3 py-3 text-sm font-black text-white shadow-lg transition hover:bg-yellow-400 hover:text-black sm:px-4"
                >
                  <Plus size={18} />
                  Add Vehicle
                </button>
              </div>
            </div>
          </header>

          <div className="w-full max-w-full overflow-x-hidden px-3 py-5 sm:px-6 lg:px-8">
            {error && <Alert type="error" message={error} />}
            {notice && <Alert type="success" message={notice} />}

            <Routes>
              <Route index element={<Navigate to="overview" replace />} />

              <Route
                path="overview"
                element={
                  <OverviewPanel
                    stats={stats}
                    vehicles={vehicles}
                    messages={messages}
                    requests={requests}
                    openCreateEditor={openCreateEditor}
                    goToAdminPage={goToAdminPage}
                  />
                }
              />

              <Route
                path="inventory"
                element={
                  <InventoryPanel
                    vehicles={filteredVehicles}
                    inventorySearch={inventorySearch}
                    setInventorySearch={setInventorySearch}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    openCreateEditor={openCreateEditor}
                    openEditEditor={openEditEditor}
                    handleDeleteVehicle={handleDeleteVehicle}
                  />
                }
              />

              <Route
                path="messages"
                element={<MessagesPanel messages={messages} />}
              />

              <Route
                path="requests"
                element={<RequestsPanel requests={requests} />}
              />

              <Route path="*" element={<Navigate to="overview" replace />} />
            </Routes>
          </div>
        </main>
      </div>

      {editorOpen && (
        <VehicleEditor
          vehicleForm={vehicleForm}
          handleVehicleChange={handleVehicleChange}
          handleSaveVehicle={handleSaveVehicle}
          closeEditor={closeEditor}
          editingVehicleId={editingVehicleId}
          uploading={uploading}
          handleImageUpload={handleImageUpload}
          removeImage={removeImage}
          saving={saving}
        />
      )}
    </section>
  );
}

function LoginFeature({ icon: Icon, label }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
      <Icon className="mb-4 text-yellow-300" size={26} />
      <p className="font-black">{label}</p>
    </div>
  );
}

function Alert({ type, message }) {
  const isError = type === "error";

  return (
    <div
      className={`mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-green-200 bg-green-50 text-green-700"
      }`}
    >
      {isError ? <X size={18} /> : <CheckCircle2 size={18} />}
      <p>{message}</p>
    </div>
  );
}

function SidebarButton({ icon: Icon, label, active, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left font-bold transition ${
        active
          ? "bg-yellow-400 text-black shadow-lg shadow-yellow-500/20"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      <span className="flex items-center gap-3">
        <Icon size={20} />
        {label}
      </span>

      {typeof count === "number" && (
        <span
          className={`rounded-full px-2 py-1 text-xs ${
            active ? "bg-black text-white" : "bg-white/10 text-white/70"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function OverviewPanel({
  stats,
  vehicles,
  messages,
  requests,
  openCreateEditor,
  goToAdminPage,
}) {
  const latestVehicles = vehicles.slice(0, 4);
  const latestMessages = messages.slice(0, 3);
  const latestRequests = requests.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Car}
          label="Total Vehicles"
          value={stats.total}
          detail="All listed inventory"
        />
        <StatCard
          icon={CheckCircle2}
          label="Available"
          value={stats.available}
          detail="Ready for buyers"
        />
        <StatCard
          icon={Star}
          label="Featured"
          value={stats.featured}
          detail="Homepage highlights"
        />
        <StatCard
          icon={MessageSquare}
          label="New Leads"
          value={stats.messages + stats.requests}
          detail="Messages and requests"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="max-w-full overflow-hidden rounded-[1.5rem] border border-black/10 bg-black p-5 text-white shadow-xl sm:rounded-[2rem] sm:p-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-300">
                <Sparkles size={18} />
                Luxury Export Operations
              </div>

              <h2 className="max-w-full break-words text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                Manage listings with a cleaner, faster workflow.
              </h2>

              <p className="mt-3 max-w-full break-words text-sm leading-7 text-white/65 sm:max-w-2xl sm:text-base">
                Add premium cars, mark featured inventory, track buyer interest,
                and handle custom sourcing requests from one executive-style
                panel.
              </p>
            </div>

            <button
              onClick={openCreateEditor}
              className="flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-4 font-black text-black transition hover:bg-yellow-300 md:w-auto"
            >
              <Plus size={20} />
              Add Vehicle
            </button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MiniMetric label="Available Soon" value={stats.availableSoon} />
            <MiniMetric label="Reserved" value={stats.reserved} />
            <MiniMetric label="Sold" value={stats.sold} />
            <MiniMetric label="Requests" value={stats.requests} />
          </div>
        </div>

        <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-black">Quick Actions</h3>

          <div className="space-y-3">
            <QuickAction
              icon={Car}
              label="View Inventory"
              onClick={() => goToAdminPage("inventory")}
            />
            <QuickAction
              icon={Inbox}
              label="Read Messages"
              onClick={() => goToAdminPage("messages")}
            />
            <QuickAction
              icon={Send}
              label="View Requests"
              onClick={() => goToAdminPage("requests")}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <RecentCard title="Recent Inventory" icon={Car}>
          {latestVehicles.length ? (
            latestVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex items-center gap-3 rounded-2xl bg-black/[0.03] p-3"
              >
                <VehicleThumb vehicle={vehicle} />
                <div className="min-w-0">
                  <p className="truncate font-black">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                  <p className="text-sm text-black/55">
                    {formatCurrency(vehicle.price)} · {vehicle.status}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <EmptyState text="No vehicles yet." />
          )}
        </RecentCard>

        <RecentCard title="Latest Messages" icon={Inbox}>
          {latestMessages.length ? (
            latestMessages.map((message) => (
              <LeadPreview
                key={message.id}
                title={message.full_name}
                subtitle={message.vehicle_interested_in}
                meta={message.phone}
              />
            ))
          ) : (
            <EmptyState text="No interest messages yet." />
          )}
        </RecentCard>

        <RecentCard title="Latest Requests" icon={Send}>
          {latestRequests.length ? (
            latestRequests.map((request) => (
              <LeadPreview
                key={request.id}
                title={request.full_name}
                subtitle={`${request.preferred_make || "Any make"} ${request.preferred_model || ""}`}
                meta={request.budget || request.phone}
              />
            ))
          ) : (
            <EmptyState text="No custom requests yet." />
          )}
        </RecentCard>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-yellow-300">
          <Icon size={22} />
        </div>
        <ChevronDown className="text-black/30" size={18} />
      </div>

      <p className="text-4xl font-black">{value}</p>
      <p className="mt-1 font-black">{label}</p>
      <p className="mt-2 text-sm text-black/50">{detail}</p>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className="text-2xl font-black text-yellow-300">{value}</p>
      <p className="text-sm text-white/60">{label}</p>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl border border-black/10 bg-[#f7f3ed] p-4 font-black transition hover:bg-black hover:text-white"
    >
      <span className="flex items-center gap-3">
        <Icon size={20} />
        {label}
      </span>
      <Eye size={18} />
    </button>
  );
}

function RecentCard({ title, icon: Icon, children }) {
  return (
    <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-black">{title}</h3>
        <Icon className="text-black/40" size={20} />
      </div>

      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InventoryPanel({
  vehicles,
  inventorySearch,
  setInventorySearch,
  statusFilter,
  setStatusFilter,
  openCreateEditor,
  openEditEditor,
  handleDeleteVehicle,
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35"
              size={20}
            />
            <input
              value={inventorySearch}
              onChange={(event) => setInventorySearch(event.target.value)}
              placeholder="Search by make, model, destination, color..."
              className="w-full rounded-2xl border border-black/10 bg-[#f7f3ed] py-4 pl-12 pr-4 font-semibold outline-none transition focus:border-black"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-2xl border border-black/10 bg-[#f7f3ed] px-4 py-4 font-bold outline-none"
          >
            <option value="All">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <button
            onClick={openCreateEditor}
            className="flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 font-black text-white transition hover:bg-yellow-400 hover:text-black"
          >
            <Plus size={18} />
            Add Vehicle
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        {vehicles.length ? (
          vehicles.map((vehicle) => (
            <InventoryCard
              key={vehicle.id}
              vehicle={vehicle}
              onEdit={() => openEditEditor(vehicle)}
              onDelete={() => handleDeleteVehicle(vehicle)}
            />
          ))
        ) : (
          <div className="xl:col-span-2 2xl:col-span-3">
            <EmptyLarge
              icon={Car}
              title="No vehicles found"
              text="Try another search or add a new vehicle listing."
            />
          </div>
        )}
      </div>
    </div>
  );
}

function InventoryCard({ vehicle, onEdit, onDelete }) {
  const image = getVehicleImages(vehicle)[0];

  return (
    <article className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-56 overflow-hidden bg-black">
        {image ? (
          <img
            src={resolveImageUrl(image)}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/50">
            <Camera size={42} />
          </div>
        )}

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {vehicle.badge && <Pill label={vehicle.badge} />}
          {vehicle.featured && <Pill label="Featured" dark />}
        </div>

        <StatusBadge status={vehicle.status} />
      </div>

      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-black/40">
              {vehicle.body}
            </p>
            <h3 className="mt-1 text-2xl font-black leading-tight">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
          </div>

          <p className="shrink-0 rounded-2xl bg-[#f7f3ed] px-3 py-2 text-sm font-black">
            #{vehicle.id}
          </p>
        </div>

        <p className="mb-4 text-3xl font-black">
          {formatCurrency(vehicle.price)}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Spec
            icon={Gauge}
            label="Mileage"
            value={`${formatNumber(vehicle.mileage)} mi`}
          />
          <Spec
            icon={Globe2}
            label="Destination"
            value={vehicle.destination || "N/A"}
          />
          <Spec
            icon={Sparkles}
            label="Exterior"
            value={vehicle.exterior || "N/A"}
          />
          <Spec
            icon={ShieldCheck}
            label="Transmission"
            value={vehicle.transmission || "N/A"}
          />
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-black px-4 py-3 font-black text-white transition hover:bg-yellow-400 hover:text-black"
          >
            <Edit3 size={18} />
            Edit
          </button>

          <button
            onClick={onDelete}
            className="flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-black text-red-600 transition hover:bg-red-600 hover:text-white"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}

function VehicleEditor({
  vehicleForm,
  handleVehicleChange,
  handleSaveVehicle,
  closeEditor,
  editingVehicleId,
  uploading,
  handleImageUpload,
  removeImage,
  saving,
}) {
  const images = vehicleForm.image
    ? vehicleForm.image
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[#f5f1ea] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-[#f5f1ea]/95 p-5 backdrop-blur-xl">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-black/50">
              Vehicle Editor
            </p>
            <h2 className="text-2xl font-black">
              {editingVehicleId ? "Edit Vehicle Listing" : "Add New Vehicle"}
            </h2>
          </div>

          <button
            onClick={closeEditor}
            className="rounded-2xl bg-black p-3 text-white transition hover:bg-red-600"
          >
            <X size={22} />
          </button>
        </div>

        <form
          onSubmit={handleSaveVehicle}
          className="grid gap-6 p-5 lg:grid-cols-[0.85fr_1.15fr]"
        >
          <div className="space-y-5">
            <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-black">Vehicle Images</h3>
                <ImagePlus className="text-black/40" size={22} />
              </div>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-black/20 bg-[#f7f3ed] px-5 py-8 text-center transition hover:border-black hover:bg-white">
                {uploading ? (
                  <Loader2 className="mb-3 animate-spin text-black" size={34} />
                ) : (
                  <UploadCloud className="mb-3 text-black" size={34} />
                )}

                <span className="font-black">
                  {uploading ? "Uploading images..." : "Upload vehicle images"}
                </span>
                <span className="mt-1 text-sm text-black/50">
                  JPG, PNG, or WEBP. First image becomes the main display image.
                </span>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {images.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {images.map((image, index) => (
                    <div
                      key={image}
                      className="group relative overflow-hidden rounded-2xl border border-black/10 bg-black"
                    >
                      <img
                        src={resolveImageUrl(image)}
                        alt={`Vehicle ${index + 1}`}
                        className="h-32 w-full object-cover"
                      />

                      {index === 0 && (
                        <span className="absolute left-2 top-2 rounded-full bg-yellow-400 px-2 py-1 text-xs font-black text-black">
                          Main
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => removeImage(image)}
                        className="absolute right-2 top-2 rounded-full bg-red-600 p-2 text-white opacity-0 transition group-hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <TextAreaField
                label="Image URLs"
                name="image"
                value={vehicleForm.image}
                onChange={handleVehicleChange}
                placeholder="Image URLs will appear here after upload. You can also paste external image URLs separated by commas."
              />
            </div>

            <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-lg font-black">Listing Settings</h3>

              <div className="space-y-4">
                <ComboField
                  label="Status"
                  name="status"
                  value={vehicleForm.status}
                  onChange={handleVehicleChange}
                  options={statuses}
                  required
                />

                <ComboField
                  label="Badge"
                  name="badge"
                  value={vehicleForm.badge}
                  onChange={handleVehicleChange}
                  options={badges}
                  placeholder="New Arrival, Hot Deal, Export Ready..."
                />

                <label className="flex items-center justify-between rounded-2xl border border-black/10 bg-[#f7f3ed] p-4">
                  <span>
                    <span className="block font-black">
                      Feature on Homepage
                    </span>
                    <span className="text-sm text-black/50">
                      Highlight this vehicle in featured sections.
                    </span>
                  </span>

                  <input
                    type="checkbox"
                    name="featured"
                    checked={vehicleForm.featured}
                    onChange={handleVehicleChange}
                    className="h-5 w-5 accent-black"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-lg font-black">Vehicle Details</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <ComboField
                  label="Year"
                  name="year"
                  value={vehicleForm.year}
                  onChange={handleVehicleChange}
                  options={years}
                  required
                />

                <ComboField
                  label="Make"
                  name="make"
                  value={vehicleForm.make}
                  onChange={handleVehicleChange}
                  options={makes}
                  required
                />

                <InputField
                  label="Model"
                  name="model"
                  value={vehicleForm.model}
                  onChange={handleVehicleChange}
                  placeholder="e.g. GLS 580"
                  required
                />

                <ComboField
                  label="Body Type"
                  name="body"
                  value={vehicleForm.body}
                  onChange={handleVehicleChange}
                  options={bodyTypes}
                  required
                />

                <InputField
                  label="Price"
                  name="price"
                  type="number"
                  value={vehicleForm.price}
                  onChange={handleVehicleChange}
                  placeholder="95000"
                  required
                />

                <InputField
                  label="Mileage"
                  name="mileage"
                  type="number"
                  value={vehicleForm.mileage}
                  onChange={handleVehicleChange}
                  placeholder="12000"
                  required
                />

                <ComboField
                  label="Destination"
                  name="destination"
                  value={vehicleForm.destination}
                  onChange={handleVehicleChange}
                  options={destinations}
                  required
                />

                <ComboField
                  label="Exterior Color"
                  name="exterior"
                  value={vehicleForm.exterior}
                  onChange={handleVehicleChange}
                  options={colors}
                  required
                />

                <ComboField
                  label="Interior"
                  name="interior"
                  value={vehicleForm.interior}
                  onChange={handleVehicleChange}
                  options={interiors}
                />

                <ComboField
                  label="Transmission"
                  name="transmission"
                  value={vehicleForm.transmission}
                  onChange={handleVehicleChange}
                  options={transmissions}
                />

                <ComboField
                  label="Engine"
                  name="engine"
                  value={vehicleForm.engine}
                  onChange={handleVehicleChange}
                  options={engines}
                />

                <InputField
                  label="Features"
                  name="features"
                  value={vehicleForm.features}
                  onChange={handleVehicleChange}
                  placeholder="Panoramic roof, Massage seats, CarPlay"
                />
              </div>
            </div>

            <div className="sticky bottom-5 rounded-[2rem] border border-black/10 bg-white p-4 shadow-2xl">
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="flex-1 rounded-2xl border border-black/10 px-5 py-4 font-black transition hover:bg-black hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-4 font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <CheckCircle2 size={20} />
                  )}
                  {editingVehicleId ? "Save Changes" : "Publish Vehicle"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function MessagesPanel({ messages }) {
  if (!messages.length) {
    return (
      <EmptyLarge
        icon={Inbox}
        title="No interest messages yet"
        text="Customer messages from vehicle pages will appear here."
      />
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {messages.map((message) => (
        <LeadCard
          key={message.id}
          icon={MessageSquare}
          title={message.full_name}
          subtitle={message.vehicle_interested_in}
          phone={message.phone}
          email={message.email}
          destination={message.destination_country}
          message={message.message}
          createdAt={message.created_at}
        />
      ))}
    </div>
  );
}

function RequestsPanel({ requests }) {
  if (!requests.length) {
    return (
      <EmptyLarge
        icon={Send}
        title="No custom vehicle requests yet"
        text="Customer sourcing requests will appear here."
      />
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {requests.map((request) => (
        <LeadCard
          key={request.id}
          icon={Send}
          title={request.full_name}
          subtitle={`${request.preferred_make || "Any make"} ${request.preferred_model || ""}`}
          phone={sanitizePhone(request.phone || "")}
          email={request.email}
          destination={request.destination_country}
          budget={request.budget}
          message={request.message}
          createdAt={request.created_at}
          extra={[
            ["Year Range", request.year_range],
            ["Preferred Make", request.preferred_make],
            ["Preferred Model", request.preferred_model],
          ]}
        />
      ))}
    </div>
  );
}

function LeadCard({
  icon: Icon,
  title,
  subtitle,
  phone,
  email,
  destination,
  budget,
  message,
  createdAt,
  extra = [],
}) {
  return (
    <article className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-yellow-300">
            <Icon size={22} />
          </div>

          <div>
            <h3 className="text-xl font-black">{title}</h3>
            <p className="text-sm font-semibold text-black/55">
              {subtitle || "No vehicle specified"}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-[#f7f3ed] px-3 py-1 text-xs font-black text-black/60">
          {createdAt ? new Date(createdAt).toLocaleDateString() : "New"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <LeadInfo icon={UserRound} label="Phone" value={phone} />
        <LeadInfo icon={Mail} label="Email" value={email || "N/A"} />
        <LeadInfo
          icon={Globe2}
          label="Destination"
          value={destination || "N/A"}
        />
        {budget && <LeadInfo icon={Sparkles} label="Budget" value={budget} />}

        {extra
          .filter((item) => item[1])
          .map(([label, value]) => (
            <LeadInfo key={label} icon={Car} label={label} value={value} />
          ))}
      </div>

      {message && (
        <div className="mt-4 rounded-2xl bg-[#f7f3ed] p-4">
          <p className="text-sm font-black text-black/50">Message</p>
          <p className="mt-1 leading-7 text-black/75">{message}</p>
        </div>
      )}
    </article>
  );
}

function LeadInfo({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-[#f7f3ed] p-3">
      <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-black/40">
        <Icon size={14} />
        {label}
      </div>
      <p className="font-black">{value || "N/A"}</p>
    </div>
  );
}

function InputField({
  label,
  icon: Icon,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-black/70">
        {label}
      </span>

      <div className="relative">
        {Icon && (
          <Icon
            className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35"
            size={18}
          />
        )}

        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full rounded-2xl border border-black/10 bg-[#f7f3ed] px-4 py-4 font-semibold outline-none transition focus:border-black ${
            Icon ? "pl-11" : ""
          }`}
        />
      </div>
    </label>
  );
}

function ComboField({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  required,
}) {
  const listId = `${name}-list`;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-black/70">
        {label}
      </span>

      <input
        list={listId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder || `Select or type ${label.toLowerCase()}`}
        required={required}
        className="w-full rounded-2xl border border-black/10 bg-[#f7f3ed] px-4 py-4 font-semibold outline-none transition focus:border-black"
      />

      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </label>
  );
}

function TextAreaField({ label, name, value, onChange, placeholder }) {
  return (
    <label className="mt-4 block">
      <span className="mb-2 block text-sm font-black text-black/70">
        {label}
      </span>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-2xl border border-black/10 bg-[#f7f3ed] px-4 py-4 font-semibold outline-none transition focus:border-black"
      />
    </label>
  );
}

function VehicleThumb({ vehicle }) {
  const image = getVehicleImages(vehicle)[0];

  return (
    <div className="h-14 w-16 shrink-0 overflow-hidden rounded-2xl bg-black">
      {image ? (
        <img
          src={resolveImageUrl(image)}
          alt={`${vehicle.make} ${vehicle.model}`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-white/40">
          <Camera size={20} />
        </div>
      )}
    </div>
  );
}

function LeadPreview({ title, subtitle, meta }) {
  return (
    <div className="rounded-2xl bg-black/[0.03] p-4">
      <p className="font-black">{title || "Unknown customer"}</p>
      <p className="mt-1 text-sm text-black/55">
        {subtitle || "No detail provided"}
      </p>
      <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-black/35">
        {meta || "No contact"}
      </p>
    </div>
  );
}

function Spec({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-[#f7f3ed] p-3">
      <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-black/40">
        <Icon size={14} />
        {label}
      </div>
      <p className="truncate font-black">{value}</p>
    </div>
  );
}

function Pill({ label, dark }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${
        dark ? "bg-black text-yellow-300" : "bg-yellow-400 text-black"
      }`}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Available: "bg-green-500 text-white",
    "Available Soon": "bg-blue-500 text-white",
    Reserved: "bg-orange-500 text-white",
    Sold: "bg-red-600 text-white",
  };

  return (
    <span
      className={`absolute bottom-4 right-4 rounded-full px-3 py-1 text-xs font-black ${
        styles[status] || "bg-black text-white"
      }`}
    >
      {status || "Available"}
    </span>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/15 p-5 text-center text-sm font-semibold text-black/45">
      {text}
    </div>
  );
}

function EmptyLarge({ icon: Icon, title, text }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-black/15 bg-white p-10 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-black text-yellow-300">
        <Icon size={30} />
      </div>

      <h3 className="text-2xl font-black">{title}</h3>
      <p className="mt-2 max-w-md text-black/55">{text}</p>
    </div>
  );
}

function getVehicleImages(vehicle) {
  if (!vehicle?.image) return [];

  return vehicle.image
    .split(",")
    .map((image) => image.trim())
    .filter(Boolean);
}

export default AdminDashboard;
