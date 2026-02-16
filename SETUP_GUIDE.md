# 🚀 F2B Portal Backend - Setup Guide

## Step-by-Step Setup Instructions

### ✅ Step 1: Install Dependencies (DONE - Go is installed!)

You already have Go installed. Now install the project dependencies:

```bash
go mod tidy
```

---

### ✅ Step 2: Setup PostgreSQL Database

#### Option A: Install PostgreSQL (if not installed)

**Windows:**
1. Download from: https://www.postgresql.org/download/windows/
2. Install PostgreSQL (remember the password you set!)
3. PostgreSQL will run on port 5432 by default

**Or use Docker:**
```bash
docker run --name f2b-postgres -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=f2b_portal -p 5432:5432 -d postgres
```

#### Option B: Create Database

1. Open **pgAdmin** (comes with PostgreSQL) or use **psql** command line
2. Create a new database called `f2b_portal`

**Using psql:**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE f2b_portal;

# Exit
\q
```

---

### ✅ Step 3: Create .env File

Create a `.env` file in the project root with your database credentials:

```bash
# Copy the example file
copy env.example .env
```

Then edit `.env` and update these values:

```env
# Database - UPDATE THESE!
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_actual_postgres_password
DB_NAME=f2b_portal
DB_SSLMODE=disable

# JWT - CHANGE THIS!
JWT_SECRET=change-this-to-a-random-secret-key-in-production

# Server
PORT=8080

# Email (Optional - leave empty if not using)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

**Important:** Replace `your_actual_postgres_password` with your PostgreSQL password!

---

### ✅ Step 4: Run the Server

```bash
go run cmd/server/main.go
```

You should see:
```
Server starting on port 8080
API available at http://localhost:8080/api/v1
```

**If you see database connection errors:**
- Check PostgreSQL is running
- Verify `.env` file has correct database credentials
- Make sure database `f2b_portal` exists

---

### ✅ Step 5: Test the API

Open a new terminal and test the health endpoint:

```bash
curl http://localhost:8080/health
```

You should get: `{"status":"ok"}`

**Test Registration:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test Farmer\",\"email\":\"test@example.com\",\"phone\":\"9876543210\",\"password\":\"password123\",\"user_type\":\"farmer\",\"city\":\"Delhi\",\"state\":\"Delhi\"}"
```

**Test Login:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

---

### ✅ Step 6: Connect Frontend

Your React frontend is already in the `src/` folder. Update your frontend API calls to point to:

```
http://localhost:8080/api/v1
```

**Example frontend API call:**
```javascript
const response = await fetch('http://localhost:8080/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password })
});
```

---

## 🐛 Troubleshooting

### Error: "Failed to connect to database"
- ✅ Check PostgreSQL is running: `pg_isready` or check Windows Services
- ✅ Verify `.env` file exists and has correct credentials
- ✅ Make sure database `f2b_portal` exists

### Error: "Port 8080 already in use"
- ✅ Change `PORT` in `.env` to another port (e.g., `8081`)
- ✅ Or kill the process using port 8080

### Error: "module not found"
- ✅ Run: `go mod tidy`
- ✅ Make sure you're in the project root directory

### CORS Errors from Frontend
- ✅ Check `FRONTEND_URL` in `.env` matches your frontend URL
- ✅ Default is `http://localhost:5173` (Vite default)

---

## 📋 Quick Checklist

- [ ] Go installed ✅ (You have it!)
- [ ] PostgreSQL installed and running
- [ ] Database `f2b_portal` created
- [ ] `.env` file created with correct credentials
- [ ] Dependencies installed (`go mod tidy`)
- [ ] Server runs without errors
- [ ] Health endpoint works (`/health`)
- [ ] Can register a user
- [ ] Can login and get JWT token
- [ ] Frontend connected to backend API

---

## 🎯 Next Steps After Setup

1. **Test all API endpoints** using Postman or curl
2. **Update your React frontend** to use the real API instead of mock data
3. **Add more features** as needed
4. **Deploy** to production when ready

---

## 📚 API Documentation

See `README.md` for complete API documentation with all endpoints.

---

**Need help?** Check the `README.md` file for more details!
