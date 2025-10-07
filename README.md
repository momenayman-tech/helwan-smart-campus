
Helwan National University – Smart Campus
=======================================

This bundle is a ready-to-upload prototype (Frontend + Backend) designed for deployment on Render.com
with MongoDB Atlas as the database. The project includes:
- Frontend: React + Vite + Tailwind (RTL) — folder: frontend
- Backend: Node.js + Express — folder: backend
- Docker-compose for local testing (optional)
- .env.example files and deployment instructions

---

Quick steps to publish to GitHub and deploy on Render (recommended flow):

1) Create a GitHub repository (e.g. helwan-smart-campus) and push the contents of this folder:

   git init
   git add .
   git commit -m "Initial commit - Helwan Smart Campus"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/helwan-smart-campus.git
   git push -u origin main

2) Create a free cluster on MongoDB Atlas and get the connection string (replace <username>, <password>, and ensure IP access).

3) On Render.com:
   - Create a new Web Service for the backend:
     * Connect your GitHub repo
     * Root Directory: backend
     * Build Command: npm install
     * Start Command: npm start
     * Environment variables (set on Render):
       - MONGO_URI (Atlas connection string)
       - JWT_SECRET (choose a secret value)
   - Create a new Static Site for the frontend:
     * Connect GitHub repo
     * Root: frontend
     * Build Command: npm run build
     * Publish Directory: dist
     * Add Environment variable (on Render static site settings):
       - VITE_API_URL -> https://<your-backend-render-url>

4) After deploy, open the frontend URL provided by Render. It will connect to the backend API.

Notes:
- This prototype is for demonstration and needs production hardening for security & scale.
- If you want, I can guide you through each Render step while you're on the Render dashboard.
- Default demo accounts exist in backend/seed.json; you can insert demo users manually into MongoDB Atlas if needed.

Prepared for: Helwan National University – Smart Campus
