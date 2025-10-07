Helwan Smart Campus — Prototype (MVP)
-------------------------------------
This bundle contains a minimal prototype (frontend + backend) for demonstration.
Language: Arabic (RTL) by default but components are ready for localization.

What is included:
- backend/ : Node.js + Express skeleton (auth, courses, attendance QR endpoints)
- frontend/ : Vite + React minimal app (Login, Dashboard, Courses, Attendance QR generator & scanner demo)
- docker-compose.yml : runs backend and mongodb (frontend is dev-only here)
- .env.sample files and seed data

HOW TO RUN (locally):
1. Backend:
   - cd backend
   - npm install
   - copy .env.sample -> .env and edit (MONGO_URI, JWT_SECRET)
   - npm run dev   (or: node index.js)

2. Frontend (dev server):
   - cd frontend
   - npm install
   - npm run dev
   - open http://localhost:5173

This prototype is intended for demo and presentation. It is NOT production hardened.
See project document for full specs and roadmap.

Prepared for: جامعة حلوان الأهلية — Helwan Smart Campus (Prototype)
Prepared by: Momen Ayman (project owner)
