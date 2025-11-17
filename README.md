# The Sweet Stop
# The Sweet Stop 🍬  
**Live Demo:** [https://your-frontend.vercel.app  ](https://the-sweet-stop-82ls.vercel.app/login)
**Backend API:** [https://your-backend.vercel.app/api](https://the-sweet-stop.vercel.app/)

## Tools Used:
- GitHub Copilot
- ChatGPT

## How I Used Them:
- GitHub Copilot helped with autocompleting code snippets and suggesting improvements.
- ChatGPT was instrumental in brainstorming solutions, debugging issues, generating test cases, and assisting with TDD workflows.

## Reflection on AI Workflow:
Using ChatGPT alongside GitHub Copilot enhanced my development process significantly. ChatGPT's ability to understand complex problems and provide detailed explanations complemented Copilot’s code suggestions, making the workflow more efficient and effective.

# 🍬 The Sweet Stop — A Sweet Shop Management System

Welcome to **The Sweet Stop**, a fully tested full‑stack web application built using **TDD (Test‑Driven Development)**.  
This project includes:

- A complete **Node.js + Express API**  
- A **React + Vite** frontend  
- **Role‑based authentication**  
- **Inventory & Category management**  
- And a clean, modern UI for both Users and Admins

---

## 📸 Screenshots

> *(Add your screenshots here once deployed — sample placeholders below)*.

- **Login Page**
  <img width="2196" height="1602" alt="image" src="https://github.com/user-attachments/assets/8f8fa753-4464-47c6-b04f-abcbaf46aef7" />

- **Signup Page**
  <img width="2270" height="1602" alt="image" src="https://github.com/user-attachments/assets/096136e0-3612-47a4-bb09-b18a124b081a" />

  
- **User Dashboard**
  <img width="2326" height="1600" alt="image" src="https://github.com/user-attachments/assets/38bf750a-22ac-405d-8172-462a4256a913" />
  
- **Admin Dashboard**
  <img width="2300" height="1606" alt="image" src="https://github.com/user-attachments/assets/0e155d40-9223-480d-8b6c-0e9877146da2" />



---

## ✨ Features

### 🔐 Authentication
- Secure registration & login using **JWT**
- Password hashing with **bcryptjs**

### 🧑‍💼 Role-Based Access
- **User:** Browse sweets, buy items
- **Admin:** Full CRUD on sweets & categories

### 🍭 Sweet Management (Admin)
- Add new sweets (name, category, price, quantity, unit, and image URL)
- Edit sweets
- Delete sweets
- Restock items

### 📦 Category Manager (Admin)
- Create category
- Edit category
- Delete category *(only if not used by any sweet)*
- Orphan category cleanup

### 🛒 User Dashboard
- Search sweets by name  
- Filter by category  
- Filter by max price  
- Purchase sweets with preset quantities  
- Mobile‑friendly responsive UI  

### 💸 Purchase Flow
- Unit‑aware purchasing: piece, kg, g, ltr, ml  
- Auto‑suggested presets (e.g., 1kg, 0.5kg, 250g)

---

## 🛠️ Tech Stack

### **Backend**
- Node.js  
- Express.js  
- MongoDB + Mongoose  
- JWT Authentication  
- Jest + Supertest for TDD  
- mongodb-memory-server for in‑memory test DB

### **Frontend**
- React 18  
- Vite  
- Tailwind CSS  
- Axios  
- React Router v6  
- React Context API (Auth)

---

## 🧪 Test Report (TDD)

This project was built entirely using **Test-Driven Development (TDD)**.  
Below is the real output from running the full backend test suite:


```
> backend@1.0.0 test
> cross-env NODE_ENV=test NODE_OPTIONS=--experimental-vm-modules jest --runInBand

(node:22893) ExperimentalWarning: VM Modules is an experimental feature and might change at any time

 PASS  tests/sweets.purchase.test.js
 PASS  tests/sweets.update.test.js
 PASS  tests/sweets.search.test.js
 PASS  tests/sweets.restock.test.js
 PASS  tests/sweets.delete.test.js
 PASS  tests/sweets.create.test.js
 PASS  tests/auth-login.test.js
 PASS  tests/sweets.list.test.js
 PASS  tests/admin.middleware.test.js
 PASS  tests/auth.test.js
 PASS  tests/auth.middleware.test.js

Test Suites: 11 passed, 11 total
Tests:       51 passed, 51 total
Snapshots:   0 total
Time:        10.968 s
Ran all test suites.
```

--Screenshot of test result-
<img width="1346" height="642" alt="image" src="https://github.com/user-attachments/assets/06791e89-09bf-48f4-9d24-2b6289ce57c7" />



## 🚀 Setup Instructions

### ✅ Prerequisites
- Node.js **v18+**
- MongoDB running locally **OR** Atlas cluster

---

## 1️⃣ Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```
MONGO_URI=mongodb://127.0.0.1:27017/sweetshop
PORT=5050
JWT_SECRET=your_super_secret_key_here
```

Run server:

```bash
npm run dev
```

API runs at: **http://localhost:5050**

---

## 2️⃣ Frontend Setup

From project root:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🧪 Running Tests (Backend – TDD)

```bash
cd backend
npm test
```

Expected output:

```
8 passed, 36 tests total
All suites green ✔️
```

---

## 🤖 My AI Usage 

For this project, I used AI tools responsibly as a **development assistant**, not a replacement for understanding.

### 🧰 Tools Used
- **GitHub Copilot** – in-editor coding assistant 
- **ChatGPT** – frontend UI refinement, React best practices  

### 📌 How AI Helped Me
- **Frontend scaffolding:** Copilot generated initial JSX & component skeletons (SweetFormModal, Register, Dashboard UI layout).
- **Backend CRUD logic:** Copilot suggested repeated controller patterns which I refined manually.
- **Bug fixing:** I used AI to debug search filters and was able to introduce debouncing to avoid excessive API calls.
- **UI Improvement:** ChatGPT helped refine card layouts, spacing, contrasts, and responsive styles.

### 🙇 What I Learned
AI is powerful, but:
- It **never replaces careful code review**
- All security-sensitive sections (authentication, roles, controller validation) were **reviewed and rewritten by me**
- TDD helped validate every feature before integration

AI accelerated the process, but **engineering judgement** ensured quality.


---

## 🎉 Thank You!

If you're a recruiter viewing this project:  
You can log in directly using the credentials provided in the deployed version — no signup needed.
