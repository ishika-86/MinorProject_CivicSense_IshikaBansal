# 🏙️ CivicSense.city — Smart Civic Complaint Management System

**Real-Time · AI-Powered · Multi-Role · Emergency Alert System**
*Built for Gwalior, Madhya Pradesh, India*

---

## 🚀 Quick Start (3 steps)

### Step 1 — Install dependencies
```bash
npm run install:all
```

### Step 2 — Configure MongoDB
Edit `server/.env`:
```
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/civicsense
JWT_SECRET=your_secret_key_here
```
> Free MongoDB Atlas: https://mongodb.com/atlas

### Step 3 — Run
```bash
npm run dev
```
- **Frontend:** http://localhost:5173
- **Backend:**  http://localhost:5000
- **Health:**   http://localhost:5000/api/health

---

## 🔐 Demo Credentials

Use **Quick Demo Login** buttons on the login page, or:

| Role    | Email                         | Password     |
|---------|------------------------------|--------------|
| Citizen | citizen@demo.civicsense.city | Demo@123456! |
| Admin   | admin@demo.civicsense.city   | Demo@123456! |
| Officer | officer@demo.civicsense.city | Demo@123456! |

**Registration codes:**
- Admin:   `CIVIC_ADMIN_2024`
- Officer: `CIVIC_OFFICER_2024`

---

## 🔑 Google Sign-In Setup (optional)

The Google button is included in the UI. To activate:

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Google Authentication
3. Add to `client/src/pages/auth/Login.jsx`:
```js
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
// Replace the handleGoogle function with actual Firebase flow
```
4. Send the Google token to `/api/auth/google` (add this route to auth.js)

---

## 🌐 Features

| Feature | Details |
|---|---|
| **Auth** | Register (3 roles), login, JWT, demo login, Google button, lockout after 5 attempts |
| **Citizen** | Dashboard, raise complaint with GPS+photos, anonymous option, timeline, upvote/bookmark/reopen/feedback |
| **Admin** | Stats, complaint table (filter/search/bulk), assign modal, analytics (4 chart types), AI insights |
| **Officer** | Kanban board + list + card views, status update + proof upload, performance stats |
| **Emergency** | Auto-detect 5 categories → geo-targeted Socket.io broadcast → animated red alert overlay |
| **Community** | Reddit-style posts, upvote/downvote, nested comments, convert→complaint |
| **Chatbot** | AI intent detection (Hindi+English), emergency keyword triggers, quick-reply flows |
| **Maps** | Leaflet + OpenStreetMap with priority-colored markers, emergency pulse rings |
| **Real-time** | Socket.io for notifications, emergency alerts, live feeds |

---

## 📁 Structure

```
civicsense/
├── client/src/
│   ├── components/     emergency/, layout/, maps/, ui/
│   ├── hooks/          useSocket.jsx   ← JSX (critical!)
│   ├── lib/            axios.js
│   ├── pages/          auth/, public/, citizen/, admin/, officer/, shared/
│   └── store/          authStore.js, appStore.js
├── server/
│   ├── controllers/    auth, complaint, admin, officer, community, profile
│   ├── middleware/      auth, errorHandler, upload
│   ├── models/          User, Complaint, + index (Notification, Post, EmergencyLog…)
│   ├── routes/          all routes
│   ├── socket/          socketHandler.js
│   └── utils/           logger.js, emergencyDetector.js
└── package.json        (root — run both with concurrently)
```

---

## ⚡ Socket.io Events

| Event | Direction | Description |
|---|---|---|
| `emergency_alert` | Server→All | Emergency broadcast |
| `notification` | Server→User | Personal notification |
| `new_complaint` | Server→Admin | New complaint filed |
| `complaint_status_changed` | Server→Citizen | Status update |
| `new_assignment` | Server→Officer | New task assigned |

---

*Made with ❤️ for Gwalior, MP — CivicSense.city 2024*
