# 🏛️ FixMyCampus – AI-Powered Campus Problem Solver

**FixMyCampus** is a modern, responsive full-stack web application designed for universities, colleges, and educational institutes to autonomously detect, triage, dispatch, and track campus facility issues.

Built with a complete working model, real database persistence (MongoDB / Resilient Embedded Document Store), AI-driven duplicate detection, automated priority triage, QR-code based spot reporting, and an interactive 3D hero visualizer prepared for Spline 3D elements.

---

## 🌟 Key Features

### 1. 🎓 Student & Admin Role-Based Authentication
- **Role-Based Access Control**: Distinguishes between **Students**, **Facility Administrators**, and **Field Technicians**.
- **JWT Authentication**: Secure Bearer tokens with encrypted passwords (`bcryptjs`).
- **⚡ 1-Click Demo Logins**: Test instantly with pre-configured accounts without manual typing:
  - 🎓 **Student**: `student@campus.edu` (Kavya Sharma, CS Dept)
  - 🛡️ **Administrator**: `admin@campus.edu` (Dr. Arthur Vance, Dean of Infrastructure)
  - 🔧 **Technician**: `tech@campus.edu` (Rajesh Kumar, Senior Electrician)

### 2. 📝 Issue Submission with Photo & Geolocation
- **Rich Complaint Form**: Title, detailed descriptions, category picker with icons.
- **Location Selector**: Campus building, wing/block, floor number, room/lab designation.
- **Auto GPS Detection**: 1-click geolocation tagger logging latitude & longitude.
- **Photo Evidence**: Camera snap simulation, drag-and-drop file upload, live thumbnail preview, and quick test samples.

### 3. 🤖 AI Duplicate Detection & Priority Classification
- **Real-Time Duplicate Guard**: Compares incoming issues in real-time against active tickets using Jaccard token overlap, location proximity, and category matching. Alerts students if a similar issue exists with a 1-click **"+1 Me Too / Upvote"** option to prevent duplicate tickets.
- **Automated Urgency Classification**: NLP heuristic engine scans for safety risks (sparking, fire, smoke, water leaks, gas, lab hazards) vs operational impact (exam halls, Wi-Fi down) to automatically assign:
  - **Priority**: `Critical` (< 2h SLA), `High` (< 6h SLA), `Medium` (24h SLA), `Low` (48h SLA)
  - **AI Confidence Score** (e.g. 98%)
  - **Automated Department Routing** (Electrical, Plumbing, IT Services, Housekeeping)
  - **Diagnostic Reasoning**

### 4. 📱 QR Code-Based Issue Reporting
- **Instant Optical Scanner Modal**: Pre-configured room barcodes (AI Lab 304, Silent Reading Hall, Laser Lab 102, Cafeteria, Hostel Dispenser) for 1-click auto-fill.
- **Campus QR Placard Hub**: Generates high-resolution printable QR posters and downloadable PNGs for classroom doors and lab benches.
- **Custom QR Generator**: Admins can register new rooms and generate unique barcodes on the fly.

### 5. ⏱️ Real-Time Status Tracking & Audit Timeline
- **Full Life-Cycle Transitions**: `Submitted` ➔ `Under Review` ➔ `Assigned` ➔ `In Progress` ➔ `Resolved` ➔ `Closed`.
- **Audit Stepper Timeline**: Step-by-step timestamped log with user and role attributions.
- **Interactive Discussion Thread**: Real-time comments between students, admins, and technicians.
- **Student Upvoting ("Me Too")**: Students endorse issues to raise urgency and priority rank.

### 6. 🛡️ Admin Command Center
- **Dual View Modes**: Switch between **Filterable Table View** and **Kanban Board**.
- **Field Technician Dispatch**: Assign specific staff (electricians, plumbers, IT engineers) with one click.
- **Resolution Verification**: Technicians attach inspection notes and photo proof before marking tickets resolved.
- **Export Reports**: Instant CSV download for maintenance logs.

### 7. 📊 Analytics Dashboard & SLA Telemetry
- **Operational KPIs**: Total volume, active hazards, average turnaround duration (hours), and overall resolution rate.
- **Visual Category Charts**: Resolution rate progress bars by facility category.
- **AI Priority Breakdown**: Distribution across Critical, High, Medium, and Low tiers.
- **Campus Hotspot Severity Heatmap**: Ranked list of campus buildings with risk indicators (High, Medium, Low) and hazard counts.

### 8. 🔔 In-App Notification Center
- Real-time unread badge counter in top navigation.
- Notification feed for status transitions, technician dispatch, resolution alerts, and hazard warnings.
- Mark as read and mark all read capabilities.

### 9. 🎨 Modern UI, Dark/Light Mode & Active Spline 3D Hero
- Built with Tailwind CSS and glassmorphism styling.
- Smooth dark/light mode toggle with persistence.
- **Interactive Spline 3D Hero**: Powered by `@splinetool/react-spline` rendering `https://prod.spline.design/XXu4OLqSxdALqRgh/scene.splinecode` with smooth interactive physics, camera gestures, responsive scaling, and streaming asset indicators.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Three.js, Canvas Confetti, Vite
- **Backend**: Node.js, Express.js, TypeScript, JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`), QR Code Engine (`qrcode`)
- **Database**:
  - Direct connection to **MongoDB** (Mongoose) when `MONGODB_URI` is supplied.
  - **Built-in Resilient Document Store** fallback (`backend/data/db.json`) ensuring 100% out-of-the-box functionality with zero initial setup.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher) — *Bundled runtime also provided in `.tools/node`*

### One-Click Launch (Windows)
Double-click `start-dev.bat` or run:
```powershell
.\start-dev.ps1
```

### Manual Command-Line Launch

1. **Start Backend API** (Port 5000):
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend App** (Port 5173):
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser at:
   - Frontend: `http://localhost:5173`
   - Backend API Health: `http://localhost:5000/api/health`

---

## 🔑 Demo Credentials

| Role | Email | Password | Quick Action |
|---|---|---|---|
| **Student** | `student@campus.edu` | `student123` | Click **⚡ 1-Click Demo** ➔ **Student** |
| **Administrator** | `admin@campus.edu` | `admin123` | Click **⚡ 1-Click Demo** ➔ **Administrator** |
| **Technician** | `tech@campus.edu` | `tech123` | Click **⚡ 1-Click Demo** ➔ **Technician** |

---

## 🎨 Adding Your Spline 3D Model Later

The hero section was specifically built with maximum flexibility for Spline 3D:
1. In the application hero section, click the **"3D Config"** button.
2. Enter your Spline 3D scene URL (for example `https://my.spline.design/your-scene/`) and click **"Apply Spline"**.
3. Alternatively, in `frontend/src/components/SplineHeroSection.tsx`, pass the `splineSceneUrl` prop or install `@splinetool/react-spline` to mount any `.splinecode` directly!

---

## 📁 Project Structure

```
3D WEBSITE/
├── backend/
│   ├── src/
│   │   ├── types/index.ts            # Data models & schemas
│   │   ├── services/
│   │   │   ├── aiClassifier.ts       # AI Priority, SLA & department routing
│   │   │   ├── duplicateDetector.ts  # Token & location similarity engine
│   │   │   └── db.ts                 # Dual-mode MongoDB & document store
│   │   ├── models/seedData.ts        # Pre-seeded campus tickets, users & spots
│   │   ├── routes/
│   │   │   ├── auth.ts               # Login, register, demo auth
│   │   │   ├── complaints.ts         # CRUD, upvote, assign, resolve
│   │   │   ├── analytics.ts          # Operational metrics & hotspots
│   │   │   ├── qr.ts                 # QR spots generator & resolver
│   │   │   └── notifications.ts      # Real-time alert notifications
│   │   └── index.ts                  # Express server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx            # Navigation, dark mode & alerts
│   │   │   ├── SplineHeroSection.tsx # 3D WebGL Canvas & Spline embed slot
│   │   │   ├── ComplaintCard.tsx     # Card with status & upvote button
│   │   │   ├── ComplaintFormModal.tsx# AI duplicate guard & GPS grabber
│   │   │   ├── ComplaintDetailModal.tsx # Full timeline & technician actions
│   │   │   ├── QRScannerModal.tsx    # Optical scanner & quick room chips
│   │   │   ├── QRCodeManager.tsx     # Printable QR facility placards
│   │   │   ├── AdminDashboard.tsx    # Kanban & Table dispatch hub
│   │   │   ├── AnalyticsDashboard.tsx# Incident charts & severity maps
│   │   │   └── AuthModal.tsx         # Sign in, register & 1-click demos
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── ThemeContext.tsx
│   │   │   └── NotificationContext.tsx
│   │   ├── services/api.ts           # Typed API service
│   │   ├── App.tsx                   # Main layout & router
│   │   ├── index.css                 # Tailwind & Glassmorphism styles
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── start-dev.bat                     # 1-Click launcher for Windows
├── start-dev.ps1                     # PowerShell launcher
└── README.md
```
