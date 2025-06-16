# Edu Feedback Galaxy

## 🚀 Project Overview

**Edu Feedback Galaxy** is a next-generation, AI-powered educational platform with a cyberpunk-inspired, animated interface. It revolutionizes feedback, quizzes, and analytics for students, teachers, and admins. The system features advanced AI (Gemini, Google APIs), real-time multiplayer quiz battles, document-based quiz generation, and a robust authentication and leaderboard system—all in a visually stunning, futuristic UI.

---

## 👤 Author Details

- **Project Owner:** Dronadula Sri Nikhil
- **Contact:** dronasrinikhil@gmail.com
- **Year:** 2025
- **Location:** HYD

---

## 🏗️ Main Features

- **Cyberpunk/AI Animated UI:** Matrix rain, parallax, holographic effects, and secret puzzles.
- **Master Console:** Real-time admin dashboard with system state, overlays, logs, and AI assistant.
- **AI Quiz Arena:** Gemini-powered quiz generation, multiplayer battles, power-ups, and leaderboards.
- **Document Uploader:** Upload files (PDF, DOCX, TXT) to generate custom quizzes.
- **Authentication:** JWT, Firebase, Google OAuth, role-based access.
- **Feedback System:** AI-powered feedback, analytics, and suggestions.
- **Learning Analytics:** Visual dashboards, streaks, coins, XP, and AI insights.
- **Course & Student Management:** Full CRUD for teachers/admins.
- **Legal & Privacy:** Cyberpunk-styled Privacy Policy and Terms, with real contact info.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend:** Node.js, Express, MongoDB (Mongoose), Socket.io
- **AI Integration:** Google Gemini API, Gemini Pro, Gemini Flash
- **Authentication:** JWT, Firebase, Google OAuth
- **File Uploads:** Multer, custom document parsing

---

## ⚡ Quick Start

1. **Clone the Repository**
   ```bash
   git clone https://github.com/SRINIKHIL2005/EDUGALXY.git
   cd EDUGALXY
   ```
2. **Install Dependencies**
   ```bash
   npm install
   ```
3. **Configure Environment**
   - Copy `.env.example` to `.env` and fill in your API keys and MongoDB URI.
4. **Start the Application**
   ```bash
   npm run dev
   # Or start frontend/backend separately:
   npm run dev:frontend
   npm run dev:backend
   ```
5. **Access the App**
   - Frontend: [http://localhost:8080](http://localhost:8080)
   - Backend: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🌐 Live Demo

> **[Live Page Coming Soon!](https://github.com/SRINIKHIL2005/EDUGALXY)**
> (Deploy to Vercel, Netlify, or your preferred platform. See below for deployment instructions.)

---

## 📦 GitHub & Deployment Best Practices

- **Do NOT commit `node_modules` or `.env` files.**
- All dependencies are managed via `package.json` and `package-lock.json`.
- The `.gitignore` is set up to keep your repo clean and secure.
- For deployment, push your code to GitHub and connect to Vercel, Netlify, or your own server.

---

## 🚀 How to Deploy (Vercel/Netlify/Other)

1. **Push your code to GitHub.**
2. **Connect your repo to Vercel, Netlify, or your preferred host.**
3. **Set environment variables** in the host dashboard (copy from your local `.env`).
4. **Build and deploy.**
5. **Update the Live Demo link above with your deployed URL!**

---

## 📂 Project Structure

```
├── server/           # Express backend, AI endpoints, MongoDB models
├── src/              # React frontend, pages, components, contexts
├── public/           # Static assets
├── .env              # Environment variables
├── package.json      # Project dependencies and scripts
├── vite.config.ts    # Vite configuration
├── tsconfig*.json    # TypeScript configs
└── ...
```

---

## 🧩 Key Files & Directories

- `server/server.js` — Main Express server, AI endpoints, Socket.io
- `server/models/user.model.js` — User schema (roles, stats, achievements)
- `server/routes/auth.routes.js` — Auth endpoints (JWT, Google, Firebase)
- `src/pages/ai/AIQuizArena.tsx` — Main AI Quiz Arena logic (multiplayer, power-ups, quiz flow)
- `src/components/quiz/DocumentUploader.tsx` — File upload and quiz generation
- `src/contexts/AuthContext.tsx` — Auth logic, token management
- `src/pages/feedback/` — Feedback forms, analytics, and results

---

## 🧪 Testing & Validation

- **Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Diagnostic:** Open `diagnostic.html` in your browser for system tests
- **Manual Testing:**
  - Login/register as student/teacher
  - Generate quizzes (topic & file upload)
  - Play multiplayer battles
  - Submit/view feedback
  - Check analytics and leaderboard

---

## 🛡️ Security & Best Practices

- All sensitive endpoints require JWT authentication
- CORS configured for local development
- Passwords hashed with bcrypt
- Environment variables for all secrets
- Input validation and error handling throughout

---

## 📈 Roadmap & Future Ideas

- More AI models and quiz types
- Enhanced multiplayer matchmaking
- Mobile app version
- Gamification: badges, daily challenges
- Teacher/HOD analytics dashboards
- More file formats for quiz generation

---

## 🤝 Contributing

Pull requests and suggestions are welcome! Please open an issue or contact the maintainer for major changes.

---

## 📄 License

[MIT License] — See LICENSE file for details.

---

## 🙏 Acknowledgements

- Google Gemini API
- React, Vite, Tailwind, shadcn/ui
- All contributors and testers

---

**Edu Feedback Galaxy — AI-powered learning for the next generation!**
