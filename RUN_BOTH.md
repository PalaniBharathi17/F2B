# 🚀 Run Both Frontend and Backend

## Quick Start Guide

### Option 1: Using PowerShell Scripts (Easiest)

**Terminal 1 - Backend:**
```powershell
.\start-backend.ps1
```

**Terminal 2 - Frontend:**
```powershell
.\start-frontend.ps1
```

---

### Option 2: Manual Commands

**Open TWO separate PowerShell/Terminal windows:**

#### Terminal 1 - Backend Server:
```powershell
go run cmd/server/main.go
```

**Expected Output:**
```
Running database migrations...
Database migrations completed successfully
Server starting on port 8080
API available at http://localhost:8080/api/v1
```

#### Terminal 2 - Frontend Server:
```powershell
npm run dev
```

**Expected Output:**
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

---

## ✅ Verify Everything is Running

### 1. Check Backend:
Open browser: `http://localhost:8080/health`
Should see: `{"status":"ok"}`

### 2. Check Frontend:
Open browser: `http://localhost:5173`
Should see: Your React app

---

## 📋 Important Notes

1. **Keep BOTH terminals open** - Closing them stops the servers
2. **Backend must start first** - It creates database tables on startup
3. **Frontend uses mock data currently** - You'll need to integrate API calls later

---

## 🔧 Troubleshooting

### Backend Issues:
- **Database error?** → Check `.env` file has correct PostgreSQL password
- **Port 8080 in use?** → Change `PORT=8081` in `.env`

### Frontend Issues:
- **Port 5173 in use?** → Vite will automatically use next available port
- **Dependencies missing?** → Run `npm install` first

---

## 🎯 Next Steps After Both Are Running

1. ✅ Backend running → Test API: `curl http://localhost:8080/health`
2. ✅ Frontend running → Open `http://localhost:5173`
3. ⏳ Integrate frontend with backend API (update API calls in frontend)
4. ⏳ Test user registration/login from frontend
5. ⏳ Test creating products, orders, etc.

---

## 📝 Current Status

- ✅ Backend API ready (Go + PostgreSQL)
- ✅ Frontend UI ready (React + Vite)
- ⏳ Frontend-Backend integration needed (currently using mock data)

---

**Ready to start? Run the commands above in two separate terminals!**
