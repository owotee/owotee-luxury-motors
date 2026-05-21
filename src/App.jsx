import { useEffect, useMemo, useState } from "react";
import AdminDashboard from "./AdminDashboard.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const vehicles = [
  {
    id: 1,
    year: 2023,
    make: "Mercedes-Benz",
    model: "G-Class G 550",
    body: "SUV",
    price: 139500,
    mileage: 12400,
    location: "Dallas, Texas",
    destination: "Nigeria",
    exterior: "Obsidian Black",
    interior: "Black Leather",
    engine: "4.0L V8",
    transmission: "Automatic",
    image:
      "https://images.unsplash.com/photo-1617814076668-3b9304f4a3a9?auto=format&fit=crop&w=1200&q=80",
    badge: "High Demand",
    status: "Available",
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
    location: "Houston, Texas",
    destination: "Nigeria",
    exterior: "Atomic Silver",
    interior: "Tan Leather",
    engine: "3.4L Twin-Turbo V6",
    transmission: "Automatic",
    image:
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80",
    badge: "Export Favorite",
    status: "Available",
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
    location: "Atlanta, Georgia",
    destination: "Nigeria",
    exterior: "Santorini Black",
    interior: "Ebony Leather",
    engine: "3.0L Mild Hybrid",
    transmission: "Automatic",
    image:
      "https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1200&q=80",
    badge: "New Arrival",
    status: "Available",
    features: [
      "Meridian Sound",
      "Air Suspension",
      "Digital Cockpit",
      "Cooled Seats",
    ],
  },
  {
    id: 4,
    year: 2022,
    make: "BMW",
    model: "X7 xDrive40i",
    body: "SUV",
    price: 68950,
    mileage: 28620,
    location: "Chicago, Illinois",
    destination: "Nigeria",
    exterior: "Mineral White",
    interior: "Coffee Leather",
    engine: "3.0L Turbo I6",
    transmission: "Automatic",
    image:
      "https://images.unsplash.com/photo-1556189250-72ba954cfc2b?auto=format&fit=crop&w=1200&q=80",
    badge: "Family Luxury",
    status: "Available",
    features: ["Panoramic Roof", "3rd Row", "Heated Seats", "Premium Package"],
  },
];

const formatPrice = (price) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
};

const formatMileage = (mileage) => {
  return new Intl.NumberFormat("en-US").format(mileage);
};

function getStatusClass(status) {
  if (status === "Sold") {
    return "bg-red-500 text-white";
  }

  if (status === "Reserved") {
    return "bg-orange-400 text-black";
  }

  return "bg-green-500 text-black";
}

function App() {
  const isAdminPage = window.location.pathname === "/admin";

  if (isAdminPage) {
    return <AdminDashboard />;
  }

  return <MainWebsite />;
}

function MainWebsite() {
  const [search, setSearch] = useState("");
  const [make, setMake] = useState("All");
  const [body, setBody] = useState("All");
  const [destination, setDestination] = useState("All");
  const [maxPrice, setMaxPrice] = useState("All");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [interestVehicle, setInterestVehicle] = useState("");
  const [vehiclesFromApi, setVehiclesFromApi] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

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

  const vehicleList = vehiclesFromApi.length > 0 ? vehiclesFromApi : vehicles;

  const makes = ["All", ...new Set(vehicleList.map((vehicle) => vehicle.make))];
  const bodyTypes = [
    "All",
    ...new Set(vehicleList.map((vehicle) => vehicle.body)),
  ];
  const destinations = [
    "All",
    ...new Set(vehicleList.map((vehicle) => vehicle.destination)),
  ];

  const filteredVehicles = useMemo(() => {
    return vehicleList.filter((vehicle) => {
      const searchText =
        `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.body} ${vehicle.location} ${vehicle.destination}`.toLowerCase();

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

  const openInterestForm = (vehicle) => {
    const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

    setInterestVehicle(vehicleName);

    setInterestForm((prev) => ({
      ...prev,
      vehicleInterestedIn: vehicleName,
    }));

    document.getElementById("message")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleInterestSubmit = async (e) => {
    e.preventDefault();
    setFormStatus("Sending interest message...");

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
    }
  };

  const handleVehicleRequestSubmit = async (e) => {
    e.preventDefault();
    setFormStatus("Sending vehicle request...");

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
    }
  };

  const whatsappMessage = encodeURIComponent(
    "Hello Owotee Luxury Motors, I am interested in a luxury vehicle shipped to Africa.",
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="relative overflow-hidden px-4 py-16 sm:px-6 md:px-10 lg:px-20 lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(234,179,8,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(22,101,52,0.25),transparent_35%)]"></div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.35em] text-yellow-400">
              Owotee Luxury Motors
            </p>

            <h1 className="max-w-4xl text-4xl font-black leading-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Luxury Vehicles from the U.S. to Africa.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-gray-300 sm:text-lg">
              We help clients find premium vehicles in the United States and
              arrange export support to Nigeria and other African destinations.
              Browse available vehicles or message us to source a specific
              model.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href="#inventory"
                className="rounded-full bg-yellow-400 px-8 py-4 text-center font-bold text-black transition hover:bg-yellow-300"
              >
                Browse Vehicles
              </a>

              <a
                href="#request"
                className="rounded-full border border-white/20 px-8 py-4 text-center font-bold text-white transition hover:bg-white hover:text-black"
              >
                Request a Vehicle
              </a>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
              <Stat number="U.S." label="Vehicle Sourcing" />
              <Stat number="Africa" label="Shipping Focus" />
              <Stat number="NG" label="Nigeria Priority" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur">
            <img
              src="https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1400&q=80"
              alt="Luxury car"
              className="h-64 w-full rounded-[1.5rem] object-cover sm:h-80 lg:h-[420px]"
            />

            <div className="mt-4 rounded-[1.5rem] bg-black/70 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-yellow-400">
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
        </div>
      </section>

      <section
        id="inventory"
        className="bg-zinc-950 px-4 py-16 sm:px-6 md:px-10 lg:px-20 lg:py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
              Available Inventory
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
              Search Luxury Vehicles
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-gray-400">
              Browse luxury vehicles available for U.S. purchase and export
              support to Nigeria and other African destinations.
            </p>
          </div>

          <div className="mb-10 rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <input
                type="text"
                placeholder="Search make, model, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-2xl border border-white/10 bg-black px-4 py-4 text-white outline-none placeholder:text-gray-500"
              />

              <select
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="rounded-2xl border border-white/10 bg-black px-4 py-4 text-white outline-none"
              >
                {makes.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <select
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="rounded-2xl border border-white/10 bg-black px-4 py-4 text-white outline-none"
              >
                {bodyTypes.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="rounded-2xl border border-white/10 bg-black px-4 py-4 text-white outline-none"
              >
                {destinations.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="rounded-2xl border border-white/10 bg-black px-4 py-4 text-white outline-none"
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
            <p className="font-semibold text-gray-400">
              {loadingVehicles
                ? "Loading vehicles..."
                : `${filteredVehicles.length} vehicles found`}
            </p>

            <a
              href="#request"
              className="rounded-full border border-yellow-400 px-5 py-3 text-center text-sm font-bold text-yellow-400 hover:bg-yellow-400 hover:text-black"
            >
              Do not see your vehicle?
            </a>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onView={() => setSelectedVehicle(vehicle)}
                onInterest={() => openInterestForm(vehicle)}
              />
            ))}
          </div>

          {filteredVehicles.length === 0 && !loadingVehicles && (
            <div className="rounded-[2rem] border border-dashed border-white/20 p-12 text-center">
              <h3 className="text-2xl font-black">No vehicles found.</h3>

              <p className="mt-2 text-gray-400">
                Try another search or submit a custom vehicle request.
              </p>
            </div>
          )}
        </div>
      </section>

      <HowItWorks />

      <section
        id="request"
        className="bg-black px-4 py-16 sm:px-6 md:px-10 lg:px-20 lg:py-20"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
              Request a Vehicle
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
              Looking for a specific luxury vehicle?
            </h2>

            <p className="mt-5 max-w-xl text-base leading-8 text-gray-300 sm:text-lg">
              If you do not see the exact vehicle you want, send us the make,
              model, year range, budget, and destination. Owotee Luxury Motors
              can help source premium vehicles from the U.S. market.
            </p>
          </div>

          <form
            onSubmit={handleVehicleRequestSubmit}
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
                placeholder="Phone / WhatsApp"
                value={requestForm.phone}
                onChange={(e) =>
                  setRequestForm({ ...requestForm, phone: e.target.value })
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
              className="mt-5 w-full rounded-full bg-yellow-400 px-8 py-4 font-bold text-black hover:bg-yellow-300"
            >
              Submit Vehicle Request
            </button>

            {formStatus && (
              <p className="mt-4 rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-gray-300">
                {formStatus}
              </p>
            )}
          </form>
        </div>
      </section>

      <section
        id="message"
        className="bg-zinc-950 px-4 py-16 sm:px-6 md:px-10 lg:px-20 lg:py-20"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
              Message Us
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
              Interested in a vehicle?
            </h2>

            <p className="mt-5 max-w-xl text-base leading-8 text-gray-300 sm:text-lg">
              Send us your name, contact information, destination country, and
              the vehicle you are interested in. We will respond with
              availability and next steps.
            </p>

            <a
              href={`https://wa.me/14695550198?text=${whatsappMessage}`}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-block rounded-full bg-green-500 px-8 py-4 font-bold text-black hover:bg-green-400"
            >
              Message on WhatsApp
            </a>
          </div>

          <form
            onSubmit={handleInterestSubmit}
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
                placeholder="Phone / WhatsApp"
                value={interestForm.phone}
                onChange={(e) =>
                  setInterestForm({ ...interestForm, phone: e.target.value })
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
              className="mt-5 w-full rounded-full bg-yellow-400 px-8 py-4 font-bold text-black hover:bg-yellow-300"
            >
              Send Message
            </button>

            {formStatus && (
              <p className="mt-4 rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-gray-300">
                {formStatus}
              </p>
            )}
          </form>
        </div>
      </section>

      <Footer />

      {selectedVehicle && (
        <VehicleModal
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          onInterest={() => {
            openInterestForm(selectedVehicle);
            setSelectedVehicle(null);
          }}
        />
      )}
    </main>
  );
}

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 md:px-10 lg:px-20">
        <a href="#" className="flex items-center gap-3">
          <div className="flex h-12 w-24 items-center justify-center overflow-hidden rounded-xl bg-white px-2 sm:h-14 sm:w-32">
            <img
              src="/owotee-logo.png"
              alt="Owotee Luxury Motors Logo"
              className="h-full w-full object-contain"
            />
          </div>
        </a>

        <nav className="hidden items-center gap-8 text-sm font-bold text-gray-300 md:flex">
          <a href="#inventory" className="hover:text-yellow-400">
            Inventory
          </a>
          <a href="#request" className="hover:text-yellow-400">
            Request Vehicle
          </a>
          <a href="#message" className="hover:text-yellow-400">
            Message Us
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-white md:hidden"
        >
          Menu
        </button>

        <a
          href="#message"
          className="hidden rounded-full bg-yellow-400 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-300 md:inline-block"
        >
          Contact
        </a>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-black px-4 py-4 md:hidden">
          <div className="grid gap-3">
            <a
              href="#inventory"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-2xl bg-white/5 px-4 py-3 font-bold text-gray-200"
            >
              Inventory
            </a>

            <a
              href="#request"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-2xl bg-white/5 px-4 py-3 font-bold text-gray-200"
            >
              Request Vehicle
            </a>

            <a
              href="#message"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-2xl bg-yellow-400 px-4 py-3 text-center font-bold text-black"
            >
              Message Us
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function Stat({ number, label }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-2xl font-black text-yellow-400">{number}</p>
      <p className="mt-1 text-sm text-gray-400">{label}</p>
    </div>
  );
}

function VehicleCard({ vehicle, onView, onInterest }) {
  const vehicleStatus = vehicle.status || "Available";
  const isSold = vehicleStatus === "Sold";
  const vehicleFeatures = Array.isArray(vehicle.features)
    ? vehicle.features
    : [];

  return (
    <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-xl transition hover:-translate-y-1 hover:border-yellow-400/50">
      <div className="relative h-60 overflow-hidden">
        <img
          src={vehicle.image}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="h-full w-full object-cover transition duration-500 hover:scale-105"
        />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
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
      </div>

      <div className="p-5">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500">
          {vehicle.body}
        </p>

        <h3 className="mt-2 text-2xl font-black">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h3>

        <p className="mt-2 text-3xl font-black text-yellow-400">
          {formatPrice(vehicle.price)}
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-300 sm:grid-cols-2">
          <Info
            label="Mileage"
            value={`${formatMileage(vehicle.mileage)} mi`}
          />
          <Info label="Location" value={vehicle.location} />
          <Info label="Destination" value={vehicle.destination} />
          <Info label="Transmission" value={vehicle.transmission} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {vehicleFeatures.slice(0, 3).map((feature) => (
            <span
              key={feature}
              className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-gray-300"
            >
              {feature}
            </span>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onView}
            className="rounded-full border border-white/20 px-5 py-3 font-bold text-white hover:bg-white hover:text-black"
          >
            View Details
          </button>

          <button
            type="button"
            onClick={onInterest}
            disabled={isSold}
            className="rounded-full bg-yellow-400 px-5 py-3 font-bold text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-300"
          >
            {isSold ? "Sold" : "I’m Interested"}
          </button>
        </div>
      </div>
    </article>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <p className="text-xs uppercase tracking-widest text-gray-500">{label}</p>
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
          <img
            src={vehicle.image}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="h-64 w-full object-cover sm:h-80 lg:h-full lg:min-h-[380px]"
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
                label="Mileage"
                value={`${formatMileage(vehicle.mileage)} mi`}
              />
              <Info label="Location" value={vehicle.location} />
              <Info label="Destination" value={vehicle.destination} />
              <Info label="Exterior" value={vehicle.exterior} />
              <Info label="Interior" value={vehicle.interior} />
              <Info label="Engine" value={vehicle.engine} />
              <Info label="Transmission" value={vehicle.transmission} />
              <Info label="Body" value={vehicle.body} />
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

            <p className="mt-6 leading-7 text-gray-300">
              This vehicle is listed for U.S. purchase and export support.
              Message Owotee Luxury Motors with your destination country for
              availability, sourcing details, and next steps.
            </p>

            <button
              type="button"
              onClick={onInterest}
              disabled={isSold}
              className="mt-6 w-full rounded-full bg-yellow-400 px-8 py-4 font-bold text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-300"
            >
              {isSold
                ? "This Vehicle Is Sold"
                : "Message Us About This Vehicle"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "Browse or Request",
      text: "Search available luxury vehicles or request a specific make and model.",
    },
    {
      title: "Confirm Vehicle Details",
      text: "We confirm availability, pricing, condition, and U.S. location.",
    },
    {
      title: "Purchase Support",
      text: "We help coordinate the U.S. buying process for the selected vehicle.",
    },
    {
      title: "Export Preparation",
      text: "The vehicle is prepared for export and shipping documentation support.",
    },
    {
      title: "Ship to Africa",
      text: "We support shipment to Nigeria and other African destinations.",
    },
  ];

  return (
    <section className="bg-black px-4 py-16 sm:px-6 md:px-10 lg:px-20 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
            How It Works
          </p>

          <h2 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
            From U.S. Inventory to African Roads
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-5"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 font-black text-black">
                {index + 1}
              </div>

              <h3 className="text-xl font-black">{step.title}</h3>

              <p className="mt-3 text-sm leading-6 text-gray-400">
                {step.text}
              </p>
            </div>
          ))}
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
          <div className="mb-4 flex h-20 w-44 items-center justify-center overflow-hidden rounded-2xl bg-white px-3">
            <img
              src="/owotee-logo.png"
              alt="Owotee Luxury Motors Logo"
              className="h-full w-full object-contain"
            />
          </div>

          <p className="mt-2 text-gray-400">
            Luxury vehicles sourced in the U.S. and shipped to Africa.
          </p>
        </div>

        <div className="text-gray-400">
          <p>Focus Destination: Nigeria</p>
          <p>Email: info@owoteeluxurymotors.com</p>
          <p>WhatsApp: +1 469 555 0198</p>
        </div>
      </div>
    </footer>
  );
}

export default App;
