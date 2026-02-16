# 🚀 How to Run Both Frontend and Backend

## Step-by-Step Guide

### Step 1: Start the Backend Server

Open **Terminal/PowerShell Window #1** and run:

```powershell
go run cmd/server/main.go
```

**You should see:**
```
Running database migrations...
Database migrations completed successfully
Server starting on port 8080
API available at http://localhost:8080/api/v1
```

**Keep this terminal window open!** The backend must stay running.

---

### Step 2: Start the Frontend Server

Open a **NEW Terminal/PowerShell Window #2** and run:

```powershell
npm run dev
```

**You should see:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Keep this terminal window open too!**

---

### Step 3: Access Your Application

1. **Frontend**: Open browser → `http://localhost:5173`
2. **Backend API**: `http://localhost:8080/api/v1`

---

## ✅ Quick Checklist

- [ ] Backend running on port 8080
- [ ] Frontend running on port 5173
- [ ] Database tables created (check pgAdmin)
- [ ] Can access frontend in browser
- [ ] Can test backend API

---

## 🧪 Test the Connection

### Test Backend:
```powershell
curl http://localhost:8080/health
```

### Test Frontend:
Open browser → `http://localhost:5173`

---

## 🔧 Troubleshooting

### Backend won't start:
- Check `.env` file has correct PostgreSQL password
- Make sure database `f2b_portal` exists
- Check port 8080 is not in use

### Frontend won't start:
- Run `npm install` first
- Check port 5173 is not in use

### Frontend can't connect to backend:
- Make sure backend is running
- Check CORS settings in `.env` (`FRONTEND_URL=http://localhost:5173`)
- Check browser console for errors

---

## 📝 Important Notes

1. **Keep both terminals open** - Closing them stops the servers
2. **Backend must start first** - Database migrations run on startup
3. **Frontend connects to backend** - Make sure backend is running before using frontend

---

## 🎯 Next Steps After Both Are Running

1. Test user registration from frontend
2. Test login functionality
3. Create products as a farmer
4. Browse products as a buyer
5. Place orders
