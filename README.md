# Edu Feedback Galaxy

## 🚀 Project Overview

**Edu Feedback Galaxy** is a next-generation, AI-powered educational platform designed to revolutionize the way students, teachers, and administrators interact with feedback, quizzes, and learning analytics. The system leverages advanced AI (Gemini, Google APIs), real-time multiplayer quiz battles, document-based quiz generation, and a robust authentication and leaderboard system to create a dynamic, engaging, and data-driven educational experience.

---

## 👤 Author Details

- **Project Owner:** Dronadula Sri Nikhil
- **Contact:** dronasrinikhil@gmail.com
- **Year:** 2025
- **Location:** HYD

---

## 🏗️ Main Features

### 1. **AI Quiz Arena**
- **AI-Powered Quiz Generation:** Generate quizzes from topics or uploaded documents using Gemini AI.
- **Multiplayer Battles:** Real-time quiz battles with live scoring, power-ups, and winner determination.
- **Adaptive Game Modes:** Classic, Speed, Survival, and Multiplayer modes.
- **Power-Ups:** Time Freeze, 50/50, Extra Life, Double Points, AI Hint.
- **Achievements & Leaderboard:** Track progress, unlock achievements, and compete globally.

### 2. **Document Uploader**
- Upload files (PDF, DOCX, TXT) to generate custom quizzes from your own study materials.
- AI parses and creates meaningful, context-aware questions.

### 3. **Authentication & User Management**
- JWT and Firebase authentication (email/password, Google OAuth).
- Role-based access: Student, Teacher, HOD, Admin.
- Secure session management and profile editing.

### 4. **Feedback System**
- Students can submit feedback on courses and teachers.
- Teachers and admins can view analytics and respond.
- AI-powered feedback analysis and suggestions.

### 5. **Learning Analytics**
- Track attendance, quiz stats, streaks, coins, and XP.
- Visual dashboards for students, teachers, and HODs.
- AI-generated insights and recommendations.

### 6. **Course & Student Management**
- Teachers can create/manage courses, enroll students, and track progress.
- Students can view enrolled courses, attendance, and feedback history.

### 7. **Modern UI/UX**
- Built with React, Vite, Tailwind CSS, Framer Motion, and shadcn/ui.
- Responsive, accessible, and visually engaging.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend:** Node.js, Express, MongoDB (Mongoose), Socket.io
- **AI Integration:** Google Gemini API, Gemini Pro, Gemini Flash
- **Authentication:** JWT, Firebase, Google OAuth
- **File Uploads:** Multer, custom document parsing
- **Testing:** Manual and automated validation scripts

---

## ⚡ Quick Start

1. **Clone the Repository**
   ```bash
   git clone <your-repo-url>
   cd edu-feedback-galaxy-main
   ```
2. **Install Dependencies**
   ```bash
   npm install
   ```
3. **Configure Environment**
   - Copy `.env.example` to `.env` and fill in your API keys and MongoDB URI.
   - Example:
     ```env
     GEMINI_API_KEY=your_gemini_api_key
     MONGODB_URI=mongodb://localhost:27017/edu-feedback-galaxy
     JWT_SECRET=your_jwt_secret
     ```
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
