# 🌐 AWS Route 53 Clone

A modern, full-stack DNS and Domain Management web application inspired by AWS Route 53. Built with **Next.js 16**, **Tailwind CSS**, **FastAPI**, and **SQLAlchemy**.

---

## 📌 Features

- **Hosted Zones Management:**
  - Create, view, update, and delete Public and Private Hosted Zones.
  - Track domain names, zone types, descriptions, and creation dates.
- **DNS Records Management:**
  - Full CRUD operations for DNS records associated with hosted zones.
  - Supported record types: `A`, `AAAA`, `CNAME`, `MX`, `TXT`, `NS`, `SOA`, `SRV`, `PTR`.
  - Configurable Time-to-Live (TTL) values.
  - Routing policy selection (Simple, Weighted, Latency, Failover, Geolocation, Multivalue answer).
- **Modern Cloud Console UI:**
  - AWS Management Console-inspired clean, dark/light responsive interface.
  - Interactive modals, breadcrumbs, search, and pagination.
- **Authentication & Security:**
  - Modular authentication provider with session state handling.
  - Configurable CORS middleware.

---

## 🏗️ Architecture & Tech Stack

```
AWS-Route53-clone/
├── frontend/             # Next.js 16 (App Router) + TypeScript + Tailwind CSS
│   ├── app/              # Application routes & layouts
│   ├── components/       # Reusable UI components & modals
│   ├── hooks/            # Custom React hooks (useHostedZones, useDnsRecords)
│   ├── lib/              # API clients & utilities
│   └── types/            # TypeScript type definitions
│
├── backend/              # Python FastAPI REST API
│   ├── app/
│   │   ├── api/          # Route handlers & endpoints (auth, hosted zones, dns records)
│   │   ├── database/     # SQLAlchemy database connection & session
│   │   ├── models/       # Database models (User, HostedZone, DNSRecord)
│   │   └── schemas/      # Pydantic schemas for request/response validation
│   └── requirements.txt  # Python dependencies
│
└── README.md             # Project documentation
```

### Tech Stack:
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend:** FastAPI, Python 3.10+, SQLAlchemy, Pydantic, Uvicorn.
- **Database:** SQLite (default for development), PostgreSQL-compatible via SQLAlchemy.

---

## ⚙️ Environment Variables (`.env`)

### Is `.env` necessary?
- **For Local Development:** Sensible defaults are set in the codebase (`http://localhost:8000/api` and `sqlite:///./route53_clone.db`), but `.env` allows you to customize ports, URLs, and database paths without changing code.
- **For Production / Deployment:** **Yes, `.env` is essential.** In production:
  - The frontend needs `NEXT_PUBLIC_API_BASE_URL` to point to your live backend domain instead of `localhost:8000`.
  - The backend needs `CORS_ORIGINS` to allow requests from your deployed frontend domain.
  - If using a cloud database (PostgreSQL on Neon/Supabase/Render), `DATABASE_URL` is required.

> ⚠️ **Security Notice:** Never commit actual `.env` files with production credentials or secret keys to GitHub. Keep `.env` in `.gitignore` and commit `.env.example` as a template.

### Configuration Reference

#### Frontend (`frontend/.env.local`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the backend API | `http://localhost:8000/api` |

#### Backend (`backend/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./route53_clone.db` |
| `CORS_ORIGINS` | Comma-separated allowed CORS origins | `http://localhost:3000` |
| `HOST` | Server bind host | `0.0.0.0` |
| `PORT` | Server bind port | `8000` |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm / pnpm / yarn
- Python 3.10+

---

### 1. Backend Setup

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   - **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create your environment file:
   ```bash
   cp .env.example .env
   ```

5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend will be running at: `http://localhost:8000`
   Interactive API Swagger docs: `http://localhost:8000/docs`

---

### 2. Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your environment file:
   ```bash
   cp .env.example .env.local
   ```

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   The frontend will be running at: `http://localhost:3000`

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user |
| `POST` | `/api/auth/logout` | Logout user |
| `GET` | `/api/hosted-zones/` | List all hosted zones |
| `POST` | `/api/hosted-zones/` | Create a new hosted zone |
| `GET` | `/api/hosted-zones/{id}` | Get details of a hosted zone |
| `PUT` | `/api/hosted-zones/{id}` | Update an existing hosted zone |
| `DELETE`| `/api/hosted-zones/{id}` | Delete a hosted zone |
| `GET` | `/api/hosted-zones/{id}/records` | List DNS records for a hosted zone |
| `POST` | `/api/hosted-zones/{id}/records` | Create a new DNS record in a zone |
| `PUT` | `/api/hosted-zones/{id}/records/{rec_id}` | Update a DNS record |
| `DELETE`| `/api/hosted-zones/{id}/records/{rec_id}` | Delete a DNS record |

---

## 🚢 Deployment Guide

- **Frontend:** Recommended on **[Vercel](https://vercel.com/)**. Connect your GitHub repository, set root directory to `frontend`, and configure `NEXT_PUBLIC_API_BASE_URL` with your live backend URL.
- **Backend:** Recommended on **[Render](https://render.com/)** or **[Railway](https://railway.app/)**.
  - *If using SQLite:* Attach a Persistent Disk / Volume to ensure the `.db` file persists across deployments.
  - *If using PostgreSQL:* Provision a free database on [Neon](https://neon.tech/) or [Supabase](https://supabase.com/) and set the `DATABASE_URL` environment variable.
