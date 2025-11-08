# Smart QR Attendance System

A full-stack web application that simplifies attendance tracking using **QR codes**.  
Built with a modern stack — **React + TypeScript** on the frontend and **Python (FastAPI / Flask)** with **Supabase / PostgreSQL** on the backend.  
Fast, secure, and real-time.

---

##  Features

✅ **QR Code Attendance** — Each student scans a unique QR code to mark attendance.  
✅ **Real-Time Data Sync** — Attendance records update instantly across devices.  
✅ **Role-Based Access** — Separate dashboards for teachers and students.  
✅ **Analytics Dashboard** — Track attendance trends and daily summaries.  
✅ **Modern UI** — Clean, responsive interface built with Tailwind CSS and shadcn-ui.  

---

## Tech Stack

### **Frontend**
- React (with Vite and TypeScript)
- Tailwind CSS
- shadcn/ui components
- Axios for API communication

### **Backend**
- Python (FastAPI or Flask)
- Supabase (or PostgreSQL)
- JWT Authentication
- RESTful APIs for student, teacher, and attendance modules

### **Tools & Dev Environment**
- npm / bun for dependency management  
- Git & GitHub for version control  
- Deployed via **Vercel / Render / Netlify**

---

##  Installation & Setup

To run the project locally:

```bash
# Step 1: Clone the repository
git clone https://github.com/Sab0507G/smart-qr-attendance-system.git

# Step 2: Navigate into the project directory
cd smart-qr-attendance-system

# Step 3: Install dependencies
npm install

# Step 4: Create a .env file and add your credentials
touch .env
# Add Supabase / Backend API URLs and keys here

# Step 5: Start the frontend development server
npm run dev
