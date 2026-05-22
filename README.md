# 234 Luxury Motors

234 Luxury Motors is a full-stack luxury vehicle sourcing and export website. The platform allows clients to browse luxury vehicles sourced from the United States and message the business about vehicles they are interested in shipping to Africa, especially Nigeria.

This project includes a public customer-facing website, a backend API, a SQLite database, and a secured admin dashboard for managing vehicle inventory and customer requests.

---

## Project Overview

234 Luxury Motors helps clients:

- Browse available luxury vehicles
- Search and filter inventory
- View vehicle details
- Message the business about a specific vehicle
- Submit a custom vehicle request
- Contact the business through WhatsApp
- Request vehicle sourcing from the U.S. market

The website does **not** include financing, trade-in, or test-drive features because the business model focuses on buying luxury vehicles in the United States and shipping them to Africa.

---

## Features

### Public Website

- Luxury homepage design
- Mobile-responsive layout
- 234 Luxury Motors logo integration
- Searchable vehicle inventory
- Filter vehicles by make, body type, destination, and price
- Vehicle detail popup/modal
- “I’m Interested” button for each vehicle
- Custom vehicle request form
- WhatsApp contact button
- How-it-works section
- Footer with business information

### Vehicle Status

Vehicles can be marked as:

- Available
- Reserved
- Sold

When a vehicle is marked as **Sold**, the public inventory disables the “I’m Interested” button.

### Admin Dashboard

The admin dashboard allows the business owner to:

- Log in securely
- View all vehicles
- Add new vehicles
- Edit existing vehicles
- Delete vehicles
- View customer interest messages
- View custom vehicle requests
- Manage vehicle availability status

### Backend API

The backend provides API routes for:

- Fetching vehicles
- Submitting interest messages
- Submitting custom vehicle requests
- Admin login
- Admin inventory management
- Admin message/request viewing

---

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- JavaScript

### Backend

- Node.js
- Express.js
- SQLite
- JSON Web Token authentication
- dotenv
- CORS

### Database

- SQLite database file
- Tables:
  - vehicles
  - interest_messages
  - vehicle_requests

---

## Project Structure

```text
owotee-luxury-motors/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   └── owotee_luxury_motors.db
│
├── public/
│   └── owotee-logo.png
│
├── src/
│   ├── App.jsx
│   ├── AdminDashboard.jsx
│   ├── main.jsx
│   └── index.css
│
├── .env
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
