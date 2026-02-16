# 🚀 QUICK START - Next Steps After PostgreSQL Installation

## ✅ Step 1: Create the Database

### Method 1: Using pgAdmin (GUI - Recommended for beginners)

1. **Open pgAdmin** (it should be installed with PostgreSQL)
2. **Connect to PostgreSQL server:**
   - Right-click on "Servers" → "Create" → "Server"
   - Name: `PostgreSQL` (or any name)
   - Host: `localhost`
   - Port: `5432`
   - Username: `postgres`
   - Password: (the password you set during installation)
   - Click "Save"

3. **Create the database:**
   - Right-click on "Databases" → "Create" → "Database"
   - Name: `f2b_portal`
   - Click "Save"

### Method 2: Using Command Line (psql)

Open PowerShell and run:

```powershell
# Connect to PostgreSQL (replace 'yourpassword' with your actual password)
psql -U postgres -h localhost

# When prompted, enter your PostgreSQL password
# Then run:
CREATE DATABASE f2b_portal;

# Exit psql
\q
```

---

## ✅ Step 2: Create .env File

Run this command in PowerShell (in your project directory):

```powershell
copy env.example .env
```

Then **edit the `.env` file** and update these values:

```env
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
JWT_SECRET=any-random-secret-key-change-this
```

**Important:** Replace `YOUR_POSTGRES_PASSWORD_HERE` with the password you set when installing PostgreSQL!

---

## ✅ Step 3: Run the Server

In PowerShell, run:

```powershell
go run cmd/server/main.go
```

**You should see:**
```
Server starting on port 8080
API available at http://localhost:8080/api/v1
```

**If you see errors:**
- Database connection error → Check your `.env` file has the correct password
- Port already in use → Change `PORT=8081` in `.env`

---

## ✅ Step 4: Test the API

Open a **NEW PowerShell window** and test:

```powershell
# Test health endpoint
curl http://localhost:8080/health

# Should return: {"status":"ok"}
```

**Test Registration:**
```powershell
curl -X POST http://localhost:8080/api/v1/auth/register -H "Content-Type: application/json" -d '{\"name\":\"Test Farmer\",\"email\":\"test@example.com\",\"phone\":\"9876543210\",\"password\":\"password123\",\"user_type\":\"farmer\",\"city\":\"Delhi\",\"state\":\"Delhi\"}'
```

---

## 🎯 Summary - Do These 3 Things:

1. ✅ **Create database** `f2b_portal` in PostgreSQL (using pgAdmin or psql)
2. ✅ **Create `.env` file** (copy from `env.example` and update password)
3. ✅ **Run server** (`go run cmd/server/main.go`)

That's it! Your backend will be running! 🚀
