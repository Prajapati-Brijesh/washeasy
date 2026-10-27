# 🧺 WashEasy – Full-Stack Laundry Web Application (MERN Ready)

> **Live Production Ready:** Node.js Express REST API, MongoDB Database, React Component Architecture, Responsive for iPhone Safari & Google Chrome.

---

## 📱 How to Open on iPhone (Right Now!)

Your computer is connected to your **iPhone Personal Hotspot**:
1. Make sure your server is running: `node server.js`
2. Find your computer's IP address: `172.20.10.3`
3. On your **iPhone Safari**, open:
   ```text
   http://172.20.10.3:3000
   ```
4. The full website will load directly on your iPhone with complete mobile responsive touch controls!

---

## 🚀 1. Deploy Live to GitHub (GitHub Pages)

A complete Git repository is already initialized in this directory.

### Step 1: Create a GitHub Repository
1. Go to [https://github.com/new](https://github.com/new)
2. Repository name: `washeasy`
3. Choose **Public** and click **Create repository**

### Step 2: Push Your Code
Open your terminal and run:
```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/washeasy.git
git branch -M main
git push -u origin main
```

### Step 3: Enable Free GitHub Pages
1. In your GitHub repo, go to **Settings ➔ Pages**.
2. Under **Build and deployment > Source**, select **Deploy from a branch**.
3. Select branch **`main`** and click **Save**.
4. Within 1 minute, your live website will be accessible globally at:
   👉 **`https://YOUR_GITHUB_USERNAME.github.io/washeasy/`**

---

## ⚡ 2. Instant Free Live URL on Vercel / Netlify (30 Seconds)

### Option A: Netlify Drop (No Terminal Needed)
1. Visit **[https://app.netlify.com/drop](https://app.netlify.com/drop)**
2. Drag and drop this whole `londry` folder onto the page.
3. You will immediately get a live HTTPS URL:
   👉 `https://washeasy.netlify.app`

### Option B: Vercel CLI
`vercel.json` is already configured in this repo!
```bash
npx vercel
```
Follow the prompts to get an instant live production link:
👉 `https://washeasy.vercel.app`

---

## 🍃 3. Connect to Cloud MongoDB (MongoDB Atlas)

The server supports **Mongoose MongoDB Schemas** (`models/User.js`, `models/Order.js`) with an automatic fallback to local JSON persistence if MongoDB is not yet configured.

### Connect Your Free MongoDB Atlas Cluster:
1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free M0 cluster.
2. In Database Access, create a database user and password.
3. In Network Access, allow IP `0.0.0.0/0` (Allow access from anywhere).
4. Click **Connect ➔ Connect your application** and copy the URI.
5. Create a `.env` file in this directory:
   ```env
   PORT=3000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/washeasy?retryWrites=true&w=majority
   JWT_SECRET=washeasy_super_secret_2026
   ```
6. Start the server:
   ```bash
   node server.js
   ```
7. The server will automatically connect to MongoDB and log:
   `[MongoDB] Connected to Cloud Database successfully!`

---

## 🛠️ Project Structure

```text
├── index.html          # Main Home Page
├── services.html       # Dedicated Services Page
├── pricing.html        # Pricing Packages & Rate Card
├── calculator.html     # Interactive Price Estimator
├── gallery.html        # Before & After Transformations
├── track.html          # Real-time Order Tracking
├── contact.html        # Contact Form & Location Map
├── style.css           # Modern Luxury Stylesheet (Responsive)
├── app.js              # Client-side Logic & API Bridge
├── server.js           # Full-Stack Node.js Express REST API
├── vercel.json         # Vercel Deployment Configuration
├── netlify.toml        # Netlify Deployment Configuration
├── .env.example        # Environment Variables Template
├── .github/workflows/  # Automated GitHub Actions CI/CD
├── models/             # MongoDB Mongoose Models (User, Order)
│   ├── User.js
│   └── Order.js
└── src/                # React 18 Component Source Code
    ├── App.jsx
    └── main.jsx
```

---

## 📡 REST API Endpoints

- `GET /api/health` – Server & Database status check
- `POST /api/auth/signup` – Register new customer
- `POST /api/auth/login` – Login & retrieve customer profile
- `POST /api/orders` – Place order (persisted to MongoDB)
- `GET /api/orders/:id` – Track live order timeline (Confirmed, Picked Up, Washing, Packed, Delivered)
- `GET /api/orders` – List all orders

