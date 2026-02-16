# ✅ Database Created! Next Steps

## Step 1: Update .env File

Open the `.env` file in your project root and update these values:

1. **DB_PASSWORD** - Change `yourpassword` to your actual PostgreSQL password
2. **JWT_SECRET** - Change to any random string (e.g., `my-secret-key-12345`)

Example:
```env
DB_PASSWORD=your_actual_postgres_password_here
JWT_SECRET=my-random-secret-key-12345
```

## Step 2: Run the Server

After updating `.env`, run:

```powershell
go run cmd/server/main.go
```

You should see:
```
Server starting on port 8080
API available at http://localhost:8080/api/v1
```

## Step 3: Test It

Open a NEW PowerShell window and test:

```powershell
# Health check
curl http://localhost:8080/health

# Should return: {"status":"ok"}
```

## Step 4: Test Registration

```powershell
curl -X POST http://localhost:8080/api/v1/auth/register -H "Content-Type: application/json" -d '{\"name\":\"Test Farmer\",\"email\":\"test@example.com\",\"phone\":\"9876543210\",\"password\":\"password123\",\"user_type\":\"farmer\",\"city\":\"Delhi\",\"state\":\"Delhi\"}'
```

---

## 🎯 Quick Checklist

- ✅ Database `f2b_portal` created
- ⏳ Update `.env` file with PostgreSQL password
- ⏳ Run server: `go run cmd/server/main.go`
- ⏳ Test: `curl http://localhost:8080/health`
