import { useEffect, useMemo, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import {
  Car,
  ChevronLeft,
  ChevronRight,
  Crown,
  FileText,
  Gauge,
  Globe2,
  Home,
  List,
  Mail,
  Menu,
  MessageCircle,
  Phone,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import AdminDashboard from "./AdminDashboard.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BUSINESS_EMAIL = "info@234motors.com";
const BUSINESS_PHONE_DISPLAY = "469-967-0440";
const BUSINESS_WHATSAPP_NUMBER = "14699670440";
const PRICE_DISCLAIMER =
  "Listed prices do not include shipping, clearing, customs, duty, port charges, processing fees, or destination-related costs.";

const fallbackVehicles = [
  {
    id: 1,
    year: 2023,
    make: "Mercedes-Benz",
    model: "G-Class G 550",
    body: "SUV",
    price: 139500,
    mileage: 12400,
    destination: "Nigeria",
    exterior: "Obsidian Black",
    interior: "Black Leather",
    engine: "4.0L V8",
    transmission: "Automatic",
    image:
      "https://images.unsplash.com/photo-1617814076668-3b9304f4a3a9?auto=format&fit=crop&w=1200&q=80, https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80",
    badge: "High Demand",
    status: "Available",
    featured: true,
    features: ["AMG Styling", "Leather Interior", "Sunroof", "Premium Audio"],
  },
  {
    id: 2,
    year: 2023,
    make: "Lexus",
    model: "LX 600 Premium",
    body: "SUV",
    price: 104950,
    mileage: 16105,
    destination: "Nigeria",
    exterior: "Atomic Silver",
    interior: "Tan Leather",
    engine: "3.4L Twin-Turbo V6",
    transmission: "Automatic",
    image:
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80, https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80",
    badge: "Export Favorite",
    status: "Available",
    featured: true,
    features: [
      "4WD",
      "Mark Levinson Audio",
      "Luxury Seating",
      "Rear Entertainment",
    ],
  },
  {
    id: 3,
    year: 2024,
    make: "Range Rover",
    model: "Sport HSE",
    body: "SUV",
    price: 96500,
    mileage: 9440,
    destination: "Nigeria",
    exterior: "Santorini Black",
    interior: "Ebony Leather",
    engine: "3.0L Mild Hybrid",
    transmission: "Automatic",
    image:
      "https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1200&q=80, https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80",
    badge: "New Arrival",
    status: "Available Soon",
    featured: false,
    features: [
      "Meridian Sound",
      "Air Suspension",
      "Digital Cockpit",
      "Cooled Seats",
    ],
  },
];

const formatPrice = (price) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price || 0);
};

const formatMileage = (mileage) => {
  return new Intl.NumberFormat("en-US").format(mileage || 0);
};

const sanitizePhone = (value) => {
  return value.replace(/[^\d+\s()-]/g, "");
};

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

function getVehicleImages(vehicle) {
  if (Array.isArray(vehicle.images) && vehicle.images.length > 0) {
    return vehicle.images.map(resolveImageUrl);
  }

  const imageText = vehicle.image || "";

  const images = imageText
    .split(",")
    .map((image) => image.trim())
    .filter(Boolean)
    .map(resolveImageUrl);

  return images.length > 0
    ? images
    : [
        "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80",
      ];
}

function getStatusClass(status) {
  if (status === "Sold") {
    return "bg-red-500 text-white";
  }

  if (status === "Reserved") {
    return "bg-orange-400 text-black";
  }

  if (status === "Available Soon") {
    return "bg-blue-400 text-black";
  }

  return "bg-green-500 text-black";
}

function getVehicleWhatsAppLink(vehicle) {
  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const message = encodeURIComponent(
    `Hello 234 Motors, I am interested in the ${vehicleName}.`,
  );

  return `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${message}`;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route
          path="/*"
          element={
            <>
              <Website />
              <Analytics />
              <SpeedInsights />
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function Website() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [make, setMake] = useState("All");
  const [body, setBody] = useState("All");
  const [destination, setDestination] = useState("All");
  const [maxPrice, setMaxPrice] = useState("All");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [interestVehicle, setInterestVehicle] = useState("");
  const [vehiclesFromApi, setVehiclesFromApi] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [interestSubmitting, setInterestSubmitting] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  const [interestForm, setInterestForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    destinationCountry: "",
    vehicleInterestedIn: "",
    message: "",
  });

  const [requestForm, setRequestForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    destinationCountry: "",
    preferredMake: "",
    preferredModel: "",
    yearRange: "",
    budget: "",
    message: "",
  });

  const [formStatus, setFormStatus] = useState("");

  useEffect(() => {
    async function fetchVehicles() {
      try {
        const response = await fetch(`${API_URL}/vehicles`);
        const data = await response.json();

        if (data.success) {
          setVehiclesFromApi(data.vehicles);
        }
      } catch (error) {
        console.error("Failed to fetch vehicles:", error);
      } finally {
        setLoadingVehicles(false);
      }
    }

    fetchVehicles();
  }, []);

  const vehicleList =
    vehiclesFromApi.length > 0 ? vehiclesFromApi : fallbackVehicles;

  const makes = ["All", ...new Set(vehicleList.map((vehicle) => vehicle.make))];
  const bodyTypes = [
    "All",
    ...new Set(vehicleList.map((vehicle) => vehicle.body)),
  ];
  const destinations = [
    "All",
    ...new Set(
      vehicleList.map((vehicle) => vehicle.destination).filter(Boolean),
    ),
  ];

  const filteredVehicles = useMemo(() => {
    return vehicleList.filter((vehicle) => {
      const searchText =
        `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.body} ${vehicle.destination} ${vehicle.exterior}`.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());
      const matchesMake = make === "All" || vehicle.make === make;
      const matchesBody = body === "All" || vehicle.body === body;
      const matchesDestination =
        destination === "All" || vehicle.destination === destination;
      const matchesPrice =
        maxPrice === "All" || vehicle.price <= Number(maxPrice);

      return (
        matchesSearch &&
        matchesMake &&
        matchesBody &&
        matchesDestination &&
        matchesPrice
      );
    });
  }, [search, make, body, destination, maxPrice, vehicleList]);

  const setVehicleInterest = (vehicle) => {
    const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

    setInterestVehicle(vehicleName);

    setInterestForm((previousForm) => ({
      ...previousForm,
      vehicleInterestedIn: vehicleName,
    }));
  };

  const handleVehicleInterest = (vehicle) => {
    setVehicleInterest(vehicle);
    navigate("/contact");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleInterestSubmit = async (e) => {
    e.preventDefault();
    setFormStatus("Sending interest message...");
    setInterestSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/interest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...interestForm,
          vehicleInterestedIn:
            interestForm.vehicleInterestedIn || interestVehicle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit message.");
      }

      setFormStatus("Your message was sent successfully.");

      setInterestForm({
        fullName: "",
        phone: "",
        email: "",
        destinationCountry: "",
        vehicleInterestedIn: "",
        message: "",
      });

      setInterestVehicle("");
    } catch (error) {
      setFormStatus(error.message);
    } finally {
      setInterestSubmitting(false);
    }
  };

  const handleVehicleRequestSubmit = async (e) => {
    e.preventDefault();
    setFormStatus("Sending vehicle request...");
    setRequestSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/vehicle-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit vehicle request.");
      }

      setFormStatus("Your vehicle request was sent successfully.");

      setRequestForm({
        fullName: "",
        phone: "",
        email: "",
        destinationCountry: "",
        preferredMake: "",
        preferredModel: "",
        yearRange: "",
        budget: "",
        message: "",
      });
    } catch (error) {
      setFormStatus(error.message);
    } finally {
      setRequestSubmitting(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    "Hello 234 Motors, I am interested in a luxury vehicle shipped to Africa.",
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              vehicles={vehicleList}
              onView={setSelectedVehicle}
              onInterest={handleVehicleInterest}
            />
          }
        />

        <Route path="/about" element={<AboutPage />} />

        <Route
          path="/inventory"
          element={
            <InventoryPage
              search={search}
              setSearch={setSearch}
              make={make}
              setMake={setMake}
              body={body}
              setBody={setBody}
              destination={destination}
              setDestination={setDestination}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              makes={makes}
              bodyTypes={bodyTypes}
              destinations={destinations}
              filteredVehicles={filteredVehicles}
              loadingVehicles={loadingVehicles}
              onView={setSelectedVehicle}
              onInterest={handleVehicleInterest}
            />
          }
        />

        <Route
          path="/request"
          element={
            <RequestVehiclePage
              requestForm={requestForm}
              setRequestForm={setRequestForm}
              formStatus={formStatus}
              submitting={requestSubmitting}
              onSubmit={handleVehicleRequestSubmit}
            />
          }
        />

        <Route
          path="/contact"
          element={
            <ContactPage
              interestForm={interestForm}
              setInterestForm={setInterestForm}
              interestVehicle={interestVehicle}
              setInterestVehicle={setInterestVehicle}
              formStatus={formStatus}
              whatsappMessage={whatsappMessage}
              submitting={interestSubmitting}
              onSubmit={handleInterestSubmit}
            />
          }
        />

        <Route
          path="*"
          element={
            <HomePage
              vehicles={vehicleList}
              onView={setSelectedVehicle}
              onInterest={handleVehicleInterest}
            />
          }
        />
      </Routes>

      <Footer />

      {selectedVehicle && (
        <VehicleModal
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          onInterest={() => {
            setVehicleInterest(selectedVehicle);
            setSelectedVehicle(null);
            navigate("/contact");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
    </main>
  );
}

function BrandMark() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-yellow-400/40 bg-yellow-400 text-black shadow-lg shadow-yellow-400/10">
        <Crown size={22} />
      </div>

      <div className="leading-tight">
        <p className="text-lg font-black tracking-tight">
          234 <span className="text-yellow-400">Motors</span>
        </p>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
          Luxury Auto Exports
        </p>
      </div>
    </Link>
  );
}

function PageContainer({ children, className = "" }) {
  return (
    <div
      className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}
    >
      {children}
    </div>
  );
}

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/about", label: "About", icon: ShieldCheck },
    { to: "/inventory", label: "Inventory", icon: List },
    { to: "/request", label: "Request Vehicle", icon: FileText },
    { to: "/contact", label: "Contact", icon: MessageCircle },
  ];

  return (
    <header className="sticky top-0 z-[999] border-b border-white/10 bg-black/95 backdrop-blur">
      <PageContainer className="flex items-center justify-between py-2.5">
        <BrandMark />

        <nav className="hidden items-center gap-6 text-sm font-bold text-gray-300 lg:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 hover:text-yellow-400 ${
                    isActive ? "text-yellow-400" : ""
                  }`
                }
              >
                <Icon size={17} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        <Link
          to="/contact"
          className="hidden rounded-full bg-yellow-400 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-300 lg:inline-block"
        >
          Message Us
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-full border border-white/20 p-3 text-white lg:hidden"
          aria-label="Open mobile menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </PageContainer>

      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-black lg:hidden">
          <PageContainer className="py-4">
            <div className="grid gap-3">
              {navLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-2xl px-4 py-3 font-bold ${
                        isActive
                          ? "bg-yellow-400 text-black"
                          : "bg-white/5 text-gray-200"
                      }`
                    }
                  >
                    <Icon size={18} />
                    {link.label}
                  </NavLink>
                );
              })}
            </div>
          </PageContainer>
        </div>
      )}
    </header>
  );
}

function HeroImage() {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-zinc-900 via-black to-zinc-950 px-6 text-center sm:h-80 lg:h-[420px]">
        <div>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400 text-black">
            <Car size={32} />
          </div>

          <p className="text-sm font-black uppercase tracking-[0.25em] text-yellow-400">
            Luxury Vehicle Preview
          </p>

          <p className="mt-2 text-sm text-gray-400">
            Vehicle image will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <img
      src="/homepage-car.jpg"
      alt="Luxury car"
      className="h-64 w-full rounded-[1.5rem] object-cover sm:h-80 lg:h-[420px]"
      onError={() => setImageFailed(true)}
      loading="eager"
    />
  );
}

function HomePage({ vehicles = [], onView, onInterest }) {
  const featuredVehicles =
    vehicles.filter((vehicle) => vehicle.featured).length > 0
      ? vehicles.filter((vehicle) => vehicle.featured).slice(0, 3)
      : vehicles.slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden py-8 sm:py-12 lg:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(234,179,8,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(22,101,52,0.25),transparent_35%)]"></div>

        <PageContainer className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Luxury Vehicles from the U.S. to Africa.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-gray-300 sm:text-lg">
              Browse premium vehicles sourced in the United States and request
              shipping to Nigeria or other African destinations.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/inventory"
                className="rounded-full bg-yellow-400 px-8 py-4 text-center font-bold text-black transition hover:bg-yellow-300"
              >
                Browse Vehicles
              </Link>

              <Link
                to="/request"
                className="rounded-full border border-white/20 px-8 py-4 text-center font-bold text-white transition hover:bg-white hover:text-black"
              >
                Request a Vehicle
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-2 sm:gap-4">
              <Stat icon={Car} number="U.S." label="Vehicle Sourcing" />
              <Stat icon={Globe2} number="Africa" label="Shipping Focus" />
              <Stat icon={ShieldCheck} number="NG" label="Nigeria Priority" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur">
            <HeroImage />

            <div className="mt-4 rounded-[1.5rem] bg-black/70 p-5">
              <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-yellow-400">
                <Truck size={17} />
                Premium Export Support
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Browse. Choose. Message Us.
              </h2>

              <p className="mt-2 text-gray-300">
                Tell us which vehicle you want and the destination country. We
                will respond with next steps.
              </p>
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="bg-zinc-950 py-16">
        <PageContainer>
          <SectionHeading
            eyebrow="Featured Inventory"
            title="Luxury vehicles ready for serious buyers"
            text="Preview selected vehicles, view their details, or message us directly about the one you want. Listed prices exclude shipping, clearing, customs, duty, port charges, and processing fees."
          />

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featuredVehicles.map((vehicle, index) => (
              <div
                key={vehicle.id}
                className={index > 0 ? "hidden md:block" : ""}
              >
                <VehicleCard
                  vehicle={vehicle}
                  onView={() => onView(vehicle)}
                  onInterest={() => onInterest(vehicle)}
                />
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/inventory"
              className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-8 py-4 font-bold text-black hover:bg-yellow-300"
            >
              View Full Inventory
              <ChevronRight size={18} />
            </Link>
          </div>
        </PageContainer>
      </section>

      <HowItWorks />
    </>
  );
}

function AboutPage() {
  const problems = [
    {
      icon: Search,
      title: "Finding the right vehicle is stressful",
      text: "Many buyers know the type of car they want, but finding a clean, reliable, well-priced luxury vehicle in the U.S. market can be difficult from overseas.",
    },
    {
      icon: ShieldCheck,
      title: "Trust is a major concern",
      text: "International buyers often worry about vehicle condition, hidden issues, unreliable sellers, fake listings, and unclear communication during the buying process.",
    },
    {
      icon: Truck,
      title: "Export can be confusing",
      text: "Buying a car is only one part of the process. Export preparation, documentation, shipping coordination, and destination planning can become overwhelming.",
    },
  ];

  const services = [
    {
      icon: Car,
      title: "Luxury Vehicle Sourcing",
      text: "We help clients find premium vehicles from the U.S. market, including SUVs, executive sedans, sports cars, and high-end luxury models.",
    },
    {
      icon: FileText,
      title: "Vehicle Details & Buyer Support",
      text: "We help simplify the decision-making process by giving buyers a clear way to review vehicles, request more information, and communicate interest.",
    },
    {
      icon: Globe2,
      title: "Africa-Focused Export Support",
      text: "Our business is built around buyers shipping vehicles to Africa, especially Nigeria, with a process designed around international needs.",
    },
    {
      icon: MessageCircle,
      title: "Direct Communication",
      text: "Clients can contact us directly through the website or WhatsApp about a listed vehicle or request a specific vehicle that is not currently listed.",
    },
  ];

  return (
    <section className="bg-black text-white">
      <div className="relative overflow-hidden py-10 sm:py-14 lg:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(234,179,8,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(22,101,52,0.2),transparent_36%)]"></div>

        <PageContainer className="relative">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-yellow-400 sm:text-sm">
              <Crown size={16} />
              About 234 Motors
            </div>

            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
              A better way to buy luxury vehicles for export.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-gray-300 sm:text-lg">
              234 Motors helps clients source premium vehicles from the United
              States and connect with a smoother export-focused buying process
              for Nigeria and other African destinations.
            </p>
          </div>
        </PageContainer>
      </div>

      <section className="bg-zinc-950 py-12 sm:py-16">
        <PageContainer>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-400">
                The Problem We Solve
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                Buying a luxury vehicle from another country should not feel
                risky.
              </h2>

              <p className="mt-5 leading-8 text-gray-400">
                Many buyers in Nigeria and across Africa want access to quality
                vehicles from the U.S., but the process can be difficult. Buyers
                have to deal with vehicle searches, seller trust, condition
                questions, communication delays, and export preparation.
              </p>

              <p className="mt-4 leading-8 text-gray-400">
                234 Motors exists to make that process clearer. We give clients
                a simple way to browse available vehicles, request specific
                models, and start a direct conversation about the vehicle they
                want.
              </p>
            </div>

            <div className="grid gap-4">
              {problems.map((problem) => {
                const Icon = problem.icon;

                return (
                  <div
                    key={problem.title}
                    className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5"
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400 text-black">
                      <Icon size={22} />
                    </div>

                    <h3 className="text-xl font-black">{problem.title}</h3>

                    <p className="mt-3 leading-7 text-gray-400">
                      {problem.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="bg-black py-12 sm:py-16">
        <PageContainer>
          <SectionHeading
            eyebrow="What We Do"
            title="We connect serious buyers with premium U.S. vehicles"
            text="Our role is to make luxury vehicle sourcing easier, clearer, and more direct for buyers who want vehicles shipped to Africa."
          />

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <div
                  key={service.title}
                  className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 transition hover:border-yellow-400/50"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-black">
                    <Icon size={23} />
                  </div>

                  <h3 className="text-xl font-black">{service.title}</h3>

                  <p className="mt-3 text-sm leading-7 text-gray-400">
                    {service.text}
                  </p>
                </div>
              );
            })}
          </div>
        </PageContainer>
      </section>

      <section className="bg-zinc-950 py-12 sm:py-16">
        <PageContainer>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-[2rem] border border-white/10 bg-black p-6">
              <p className="text-4xl font-black text-yellow-400">01</p>
              <h3 className="mt-4 text-2xl font-black">Browse</h3>
              <p className="mt-3 leading-7 text-gray-400">
                View available luxury vehicles, compare key details, and choose
                the vehicle you are interested in.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-black p-6">
              <p className="text-4xl font-black text-yellow-400">02</p>
              <h3 className="mt-4 text-2xl font-black">Message Us</h3>
              <p className="mt-3 leading-7 text-gray-400">
                Contact us directly about a listed vehicle or send a request for
                a specific make, model, year, and budget.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-black p-6">
              <p className="text-4xl font-black text-yellow-400">03</p>
              <h3 className="mt-4 text-2xl font-black">Plan Export</h3>
              <p className="mt-3 leading-7 text-gray-400">
                We support the next steps around vehicle details, purchase
                coordination, and export preparation for African destinations.
              </p>
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="bg-black py-12 sm:py-16">
        <PageContainer>
          <div className="overflow-hidden rounded-[2rem] border border-yellow-400/20 bg-yellow-400 p-6 text-black sm:p-8 lg:p-10">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em]">
                  Ready to start?
                </p>

                <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                  Browse inventory or request the exact vehicle you want.
                </h2>

                <p className="mt-4 max-w-2xl font-semibold leading-7 text-black/70">
                  Whether you already know the vehicle you want or need help
                  finding options, 234 Motors gives you a direct path to start
                  the conversation.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  to="/inventory"
                  className="rounded-full bg-black px-8 py-4 text-center font-black text-white hover:bg-zinc-900"
                >
                  Browse Vehicles
                </Link>

                <Link
                  to="/request"
                  className="rounded-full border border-black px-8 py-4 text-center font-black text-black hover:bg-black hover:text-white"
                >
                  Request Vehicle
                </Link>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>
    </section>
  );
}

function InventoryPage({
  search,
  setSearch,
  make,
  setMake,
  body,
  setBody,
  destination,
  setDestination,
  maxPrice,
  setMaxPrice,
  makes,
  bodyTypes,
  destinations,
  filteredVehicles,
  loadingVehicles,
  onView,
  onInterest,
}) {
  const inputClass =
    "h-13 w-full rounded-2xl border border-white/10 bg-black px-4 text-sm font-semibold text-white outline-none placeholder:text-gray-500 sm:h-14 sm:text-base";

  const selectClass =
    "h-13 w-full rounded-2xl border border-white/10 bg-black px-4 text-sm font-semibold text-white outline-none sm:h-14 sm:text-base";

  return (
    <section className="bg-zinc-950 py-10 sm:py-16 lg:py-20">
      <PageContainer>
        <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-10">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-yellow-400 sm:text-sm">
            Available Inventory
          </p>

          <h1 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl md:text-5xl">
            Search Luxury Vehicles
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg sm:leading-8">
            Browse luxury vehicles available for U.S. purchase and export
            support to Nigeria and other African destinations.
          </p>
        </div>

        <div className="mb-8 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 sm:rounded-[2rem] sm:p-5">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <label className="relative md:col-span-2 lg:col-span-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                type="text"
                placeholder="Search make, model, color..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${inputClass} pl-11`}
              />
            </label>

            <select
              value={make}
              onChange={(e) => setMake(e.target.value)}
              className={`hidden md:block ${selectClass}`}
            >
              {makes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <select
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={`hidden md:block ${selectClass}`}
            >
              {bodyTypes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className={`hidden md:block ${selectClass}`}
            >
              {destinations.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <select
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className={`hidden md:block ${selectClass}`}
            >
              <option value="All">Any Price</option>
              <option value="75000">Under $75,000</option>
              <option value="100000">Under $100,000</option>
              <option value="125000">Under $125,000</option>
              <option value="150000">Under $150,000</option>
            </select>
          </div>
        </div>

        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm font-semibold text-gray-400 sm:text-base">
            {loadingVehicles
              ? "Loading vehicles..."
              : `${filteredVehicles.length} vehicles found`}
          </p>

          <Link
            to="/request"
            className="rounded-full border border-yellow-400 px-5 py-3 text-center text-sm font-bold text-yellow-400 hover:bg-yellow-400 hover:text-black"
          >
            Do not see your vehicle?
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onView={() => onView(vehicle)}
              onInterest={() => onInterest(vehicle)}
            />
          ))}
        </div>

        {filteredVehicles.length === 0 && !loadingVehicles && (
          <div className="rounded-[2rem] border border-dashed border-white/20 p-8 text-center sm:p-12">
            <h3 className="text-2xl font-black">No vehicles found.</h3>

            <p className="mt-2 text-gray-400">
              Try another search or submit a custom vehicle request.
            </p>
          </div>
        )}
      </PageContainer>
    </section>
  );
}
function RequestVehiclePage({
  requestForm,
  setRequestForm,
  formStatus,
  submitting,
  onSubmit,
}) {
  return (
    <section className="bg-black px-4 py-16 sm:px-6 md:px-10 lg:px-20 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Request a Vehicle"
            title="Looking for a specific luxury vehicle?"
            text="If you do not see the exact vehicle you want, send us the make, model, year range, budget, and destination. 234 Motors can help source premium vehicles from the U.S. market."
          />

          <div className="mt-8 grid gap-4">
            <IconText icon={Search} title="Tell us what you want" />
            <IconText icon={ShieldCheck} title="We confirm vehicle details" />
            <IconText icon={Truck} title="We support export preparation" />
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="input"
              placeholder="Full Name"
              value={requestForm.fullName}
              onChange={(e) =>
                setRequestForm({ ...requestForm, fullName: e.target.value })
              }
            />

            <input
              className="input"
              type="tel"
              inputMode="tel"
              placeholder="Phone / WhatsApp"
              value={requestForm.phone}
              onChange={(e) =>
                setRequestForm({
                  ...requestForm,
                  phone: sanitizePhone(e.target.value),
                })
              }
            />

            <input
              className="input"
              placeholder="Email Address"
              value={requestForm.email}
              onChange={(e) =>
                setRequestForm({ ...requestForm, email: e.target.value })
              }
            />

            <input
              className="input"
              placeholder="Destination Country"
              value={requestForm.destinationCountry}
              onChange={(e) =>
                setRequestForm({
                  ...requestForm,
                  destinationCountry: e.target.value,
                })
              }
            />

            <input
              className="input"
              placeholder="Preferred Make"
              value={requestForm.preferredMake}
              onChange={(e) =>
                setRequestForm({
                  ...requestForm,
                  preferredMake: e.target.value,
                })
              }
            />

            <input
              className="input"
              placeholder="Preferred Model"
              value={requestForm.preferredModel}
              onChange={(e) =>
                setRequestForm({
                  ...requestForm,
                  preferredModel: e.target.value,
                })
              }
            />

            <input
              className="input"
              placeholder="Year Range"
              value={requestForm.yearRange}
              onChange={(e) =>
                setRequestForm({ ...requestForm, yearRange: e.target.value })
              }
            />

            <input
              className="input"
              placeholder="Budget"
              value={requestForm.budget}
              onChange={(e) =>
                setRequestForm({ ...requestForm, budget: e.target.value })
              }
            />

            <textarea
              className="input min-h-32 md:col-span-2"
              placeholder="Tell us exactly what you want..."
              value={requestForm.message}
              onChange={(e) =>
                setRequestForm({ ...requestForm, message: e.target.value })
              }
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-yellow-400 px-8 py-4 font-bold text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={18} />
            {submitting ? "Sending..." : "Submit Vehicle Request"}
          </button>

          {formStatus && <StatusMessage message={formStatus} />}
        </form>
      </div>
    </section>
  );
}

function ContactPage({
  interestForm,
  setInterestForm,
  interestVehicle,
  setInterestVehicle,
  formStatus,
  whatsappMessage,
  submitting,
  onSubmit,
}) {
  return (
    <section className="bg-zinc-950 px-4 py-16 sm:px-6 md:px-10 lg:px-20 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Message Us"
            title="Interested in a vehicle?"
            text="Send us your name, contact information, destination country, and the vehicle you are interested in. We will respond with availability and next steps."
          />

          <div className="mt-8 grid gap-4">
            <IconText
              icon={Phone}
              title={`WhatsApp: ${BUSINESS_PHONE_DISPLAY}`}
            />
            <IconText icon={Mail} title={BUSINESS_EMAIL} />
            <IconText icon={Globe2} title="Focus Destination: Nigeria" />
          </div>

          <a
            href={`https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${whatsappMessage}`}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-green-500 px-8 py-4 font-bold text-black hover:bg-green-400"
          >
            <MessageCircle size={20} />
            Message on WhatsApp
          </a>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6"
        >
          <div className="grid gap-4">
            <input
              className="input"
              placeholder="Full Name"
              value={interestForm.fullName}
              onChange={(e) =>
                setInterestForm({ ...interestForm, fullName: e.target.value })
              }
            />

            <input
              className="input"
              type="tel"
              inputMode="tel"
              placeholder="Phone / WhatsApp"
              value={interestForm.phone}
              onChange={(e) =>
                setInterestForm({
                  ...interestForm,
                  phone: sanitizePhone(e.target.value),
                })
              }
            />

            <input
              className="input"
              placeholder="Email Address"
              value={interestForm.email}
              onChange={(e) =>
                setInterestForm({ ...interestForm, email: e.target.value })
              }
            />

            <input
              className="input"
              placeholder="Destination Country"
              value={interestForm.destinationCountry}
              onChange={(e) =>
                setInterestForm({
                  ...interestForm,
                  destinationCountry: e.target.value,
                })
              }
            />

            <input
              className="input"
              value={interestForm.vehicleInterestedIn || interestVehicle}
              onChange={(e) => {
                setInterestVehicle(e.target.value);
                setInterestForm({
                  ...interestForm,
                  vehicleInterestedIn: e.target.value,
                });
              }}
              placeholder="Vehicle Interested In"
            />

            <textarea
              className="input min-h-36"
              placeholder="Message"
              value={interestForm.message}
              onChange={(e) =>
                setInterestForm({ ...interestForm, message: e.target.value })
              }
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-yellow-400 px-8 py-4 font-bold text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={18} />
            {submitting ? "Sending..." : "Send Message"}
          </button>

          {formStatus && <StatusMessage message={formStatus} />}
        </form>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, text, align = "center" }) {
  const alignment = align === "left" ? "text-left" : "text-center mx-auto";

  return (
    <div className={`mb-10 max-w-3xl ${alignment}`}>
      <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
        {eyebrow}
      </p>

      <h2 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
        {title}
      </h2>

      {text && <p className="mt-4 text-base leading-8 text-gray-400">{text}</p>}
    </div>
  );
}

function Stat({ icon: Icon, number, label }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
      <Icon size={18} className="mb-2 text-yellow-400 sm:h-6 sm:w-6" />

      <p className="text-lg font-black text-yellow-400 sm:text-2xl">{number}</p>

      <p className="mt-1 text-[11px] leading-4 text-gray-400 sm:text-sm">
        {label}
      </p>
    </div>
  );
}

function VehicleImagePlaceholder({ vehicle }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-900 via-black to-zinc-950 px-6 text-center">
      <div>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 text-black">
          <Car size={28} />
        </div>

        <p className="text-sm font-black uppercase tracking-[0.25em] text-yellow-400">
          Image Coming Soon
        </p>

        <p className="mt-2 text-sm text-gray-400">
          {vehicle?.year} {vehicle?.make} {vehicle?.model}
        </p>
      </div>
    </div>
  );
}

function VehicleImageSlider({ vehicle, className }) {
  const images = getVehicleImages(vehicle);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [failedImages, setFailedImages] = useState([]);

  const workingImages = images.filter((image) => !failedImages.includes(image));
  const safeIndex =
    workingImages.length > 0
      ? Math.min(currentIndex, workingImages.length - 1)
      : 0;

  const currentImage = workingImages[safeIndex];

  const markImageAsFailed = (image) => {
    setFailedImages((previous) =>
      previous.includes(image) ? previous : [...previous, image],
    );

    setCurrentIndex(0);
  };

  const goPrevious = () => {
    if (workingImages.length <= 1) return;

    setCurrentIndex((current) =>
      current === 0 ? workingImages.length - 1 : current - 1,
    );
  };

  const goNext = () => {
    if (workingImages.length <= 1) return;

    setCurrentIndex((current) =>
      current === workingImages.length - 1 ? 0 : current + 1,
    );
  };

  const handleTouchEnd = (e) => {
    if (touchStart === null || workingImages.length <= 1) return;

    const touchEnd = e.changedTouches[0].clientX;
    const difference = touchStart - touchEnd;

    if (difference > 50) {
      goNext();
    }

    if (difference < -50) {
      goPrevious();
    }

    setTouchStart(null);
  };

  return (
    <div
      className={`relative overflow-hidden bg-black ${className}`}
      onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
      onTouchEnd={handleTouchEnd}
    >
      {currentImage ? (
        <img
          src={currentImage}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="h-full w-full object-cover"
          onError={() => markImageAsFailed(currentImage)}
          loading="lazy"
        />
      ) : (
        <VehicleImagePlaceholder vehicle={vehicle} />
      )}

      {workingImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrevious}
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur hover:bg-black"
            aria-label="Previous image"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            onClick={goNext}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur hover:bg-black"
            aria-label="Next image"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {workingImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition ${
                  index === safeIndex ? "w-6 bg-yellow-400" : "w-2 bg-white/60"
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function WhatsAppIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16.04 3C8.86 3 3.02 8.84 3.02 16.02c0 2.3.6 4.54 1.75 6.52L3 29l6.62-1.73a12.94 12.94 0 0 0 6.42 1.68h.01c7.18 0 13.02-5.84 13.02-13.02C29.07 8.84 23.23 3 16.04 3Zm0 23.7h-.01c-1.94 0-3.84-.52-5.5-1.5l-.4-.24-3.93 1.03 1.05-3.83-.26-.4a10.7 10.7 0 0 1-1.64-5.73c0-5.9 4.8-10.7 10.7-10.7 2.85 0 5.54 1.12 7.56 3.14a10.63 10.63 0 0 1 3.13 7.56c0 5.9-4.8 10.68-10.7 10.68Zm5.87-8.02c-.32-.16-1.9-.94-2.2-1.04-.3-.11-.51-.16-.73.16-.21.32-.84 1.04-1.03 1.25-.19.22-.38.24-.7.08-.32-.16-1.36-.5-2.6-1.6-.96-.86-1.6-1.92-1.8-2.24-.18-.32-.02-.49.14-.65.14-.14.32-.38.48-.57.16-.19.21-.32.32-.54.11-.21.05-.4-.03-.56-.08-.16-.73-1.76-1-2.4-.26-.63-.53-.54-.73-.55h-.62c-.21 0-.56.08-.86.4-.3.32-1.13 1.1-1.13 2.68s1.16 3.12 1.32 3.33c.16.21 2.28 3.48 5.52 4.88.77.33 1.37.53 1.84.68.77.25 1.48.21 2.04.13.62-.09 1.9-.78 2.17-1.53.27-.75.27-1.4.19-1.53-.08-.13-.3-.21-.62-.37Z" />
    </svg>
  );
}

function VehicleCard({ vehicle, onView, onInterest }) {
  const vehicleStatus = vehicle.status || "Available";
  const isSold = vehicleStatus === "Sold";
  const vehicleFeatures = Array.isArray(vehicle.features)
    ? vehicle.features
    : [];

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black shadow-xl transition hover:-translate-y-1 hover:border-yellow-400/50">
      <div className="relative">
        <VehicleImageSlider vehicle={vehicle} className="h-48 sm:h-52" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-yellow-400 px-3 py-1.5 text-[11px] font-black text-black">
            {vehicle.badge || "Luxury"}
          </span>

          <span
            className={`rounded-full px-3 py-1.5 text-[11px] font-black ${getStatusClass(
              vehicleStatus,
            )}`}
          >
            {vehicleStatus}
          </span>
        </div>
      </div>

      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
          {vehicle.body}
        </p>

        <h3 className="mt-2 line-clamp-2 min-h-[3.5rem] text-xl font-black leading-tight">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h3>

        <div className="mt-3">
          <p className="text-2xl font-black text-yellow-400">
            {formatPrice(vehicle.price)}
          </p>

          <p className="mt-1 text-xs font-semibold leading-5 text-gray-500">
            Price excludes shipping, clearing, customs, duty, port charges, and
            processing fees.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <CompactSpec
            icon={Gauge}
            label="Mileage"
            value={`${formatMileage(vehicle.mileage)} mi`}
          />

          <CompactSpec
            icon={Globe2}
            label="Destination"
            value={vehicle.destination}
          />

          <CompactSpec icon={Car} label="Color" value={vehicle.exterior} />

          <CompactSpec
            icon={Settings}
            label="Trans."
            value={vehicle.transmission}
          />
        </div>

        {vehicleFeatures.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {vehicleFeatures.slice(0, 3).map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold text-gray-300"
              >
                {feature}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onView}
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white hover:text-black"
            >
              View Details
            </button>

            <a
              href={getVehicleWhatsAppLink(vehicle)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-full bg-green-500 px-5 py-3 text-center text-sm font-bold text-black hover:bg-green-400"
            >
              <WhatsAppIcon size={18} />
              WhatsApp
            </a>
          </div>

          <button
            type="button"
            onClick={onInterest}
            disabled={isSold}
            className="rounded-full bg-yellow-400 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-300"
          >
            {isSold ? "Sold" : "I’m Interested"}
          </button>
        </div>
      </div>
    </article>
  );
}

function CompactSpec({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] p-3">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500">
        {Icon && <Icon size={13} />}
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-bold text-gray-200">
        {value || "Not listed"}
      </p>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500">
        {Icon && <Icon size={14} />}
        {label}
      </p>
      <p className="mt-1 font-semibold">{value || "Not listed"}</p>
    </div>
  );
}

function VehicleModal({ vehicle, onClose, onInterest }) {
  const vehicleStatus = vehicle.status || "Available";
  const isSold = vehicleStatus === "Sold";
  const vehicleFeatures = Array.isArray(vehicle.features)
    ? vehicle.features
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-[2rem] border border-white/10 bg-zinc-950">
        <div className="grid lg:grid-cols-2">
          <VehicleImageSlider
            vehicle={vehicle}
            className="h-64 sm:h-80 lg:h-full lg:min-h-[420px]"
          />

          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-yellow-400 px-4 py-2 text-xs font-black text-black">
                  {vehicle.badge || "Luxury"}
                </span>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-black ${getStatusClass(
                    vehicleStatus,
                  )}`}
                >
                  {vehicleStatus}
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/20 px-4 py-2 font-bold hover:bg-white hover:text-black"
              >
                Close
              </button>
            </div>

            <h2 className="mt-6 text-3xl font-black sm:text-4xl">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h2>

            <p className="mt-3 text-3xl font-black text-yellow-400">
              {formatPrice(vehicle.price)}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Info
                icon={Gauge}
                label="Mileage"
                value={`${formatMileage(vehicle.mileage)} mi`}
              />
              <Info
                icon={Globe2}
                label="Destination"
                value={vehicle.destination}
              />
              <Info
                icon={Car}
                label="Exterior Color"
                value={vehicle.exterior}
              />
              <Info icon={Car} label="Interior" value={vehicle.interior} />
              <Info icon={Settings} label="Engine" value={vehicle.engine} />
              <Info
                icon={Settings}
                label="Transmission"
                value={vehicle.transmission}
              />
              <Info icon={Car} label="Body" value={vehicle.body} />
            </div>

            <div className="mt-6">
              <p className="mb-3 font-bold text-yellow-400">Key Features</p>

              <div className="flex flex-wrap gap-2">
                {vehicleFeatures.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full border border-white/10 px-3 py-2 text-sm text-gray-300"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a
                href={getVehicleWhatsAppLink(vehicle)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-full bg-green-500 px-8 py-4 text-center font-bold text-black hover:bg-green-400"
              >
                <WhatsAppIcon size={20} />
                WhatsApp
              </a>

              <button
                type="button"
                onClick={onInterest}
                disabled={isSold}
                className="rounded-full bg-yellow-400 px-8 py-4 font-bold text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-300"
              >
                {isSold ? "This Vehicle Is Sold" : "Message Us"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconText({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-black">
        <Icon size={19} />
      </div>

      <p className="font-bold text-gray-200">{title}</p>
    </div>
  );
}

function StatusMessage({ message }) {
  return (
    <p className="mt-4 rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-gray-300">
      {message}
    </p>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: "Browse or Request",
      text: "Search available luxury vehicles or request a specific make and model.",
    },
    {
      icon: ShieldCheck,
      title: "Confirm Details",
      text: "We confirm availability, pricing, condition, and vehicle details.",
    },
    {
      icon: Car,
      title: "Purchase Support",
      text: "We help coordinate the U.S. buying process for the selected vehicle.",
    },
    {
      icon: FileText,
      title: "Export Preparation",
      text: "The vehicle is prepared for export and shipping documentation support.",
    },
    {
      icon: Truck,
      title: "Ship to Africa",
      text: "We support shipment to Nigeria and other African destinations.",
    },
  ];

  return (
    <section className="bg-black px-4 py-16 sm:px-6 md:px-10 lg:px-20 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="How It Works"
          title="From U.S. Inventory to African Roads"
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={step.title}
                className="rounded-[2rem] border border-white/10 bg-white/5 p-5"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 font-black text-black">
                  <Icon size={22} />
                </div>

                <p className="text-sm font-black text-yellow-400">
                  Step {index + 1}
                </p>

                <h3 className="mt-2 text-xl font-black">{step.title}</h3>

                <p className="mt-3 text-sm leading-6 text-gray-400">
                  {step.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black px-4 py-10 sm:px-6 md:px-10 lg:px-20">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <BrandMark />

          <p className="mt-4 text-gray-400">
            Luxury vehicles sourced in the U.S. and shipped to Africa.
          </p>
        </div>

        <div className="grid gap-2 text-gray-400">
          <p className="flex items-center gap-2">
            <Globe2 size={17} />
            Focus Destination: Nigeria
          </p>
          <p className="flex items-center gap-2">
            <Mail size={17} />
            {BUSINESS_EMAIL}
          </p>
          <p className="flex items-center gap-2">
            <Phone size={17} />
            {BUSINESS_PHONE_DISPLAY}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default App;
