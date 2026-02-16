# 🔧 Fix Database Password Error

## Error Message:
```
password authentication failed for user "postgres"
```

## Solution:

### Step 1: Check Your .env File

Open the `.env` file in your project root and check the `DB_PASSWORD` line.

It should look like:
```env
DB_PASSWORD=your_actual_postgres_password
```

### Step 2: Update the Password

**Important:** Replace `yourpassword` or `your_actual_postgres_password` with the **actual password** you set when installing PostgreSQL.

Example:
```env
DB_PASSWORD=MyPostgresPassword123
```

### Step 3: Save and Try Again

1. Save the `.env` file
2. Run the backend again:
   ```powershell
   go run cmd/server/main.go
   ```

---

## 🔍 How to Find Your PostgreSQL Password

If you forgot your PostgreSQL password:

### Option 1: Reset Password in pgAdmin
1. Open **pgAdmin**
2. Right-click on **PostgreSQL** server → **Properties**
3. Go to **Connection** tab
4. You can see or reset the password there

### Option 2: Reset via Command Line
```powershell
# Connect to PostgreSQL
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres

# Then run:
ALTER USER postgres WITH PASSWORD 'your_new_password';

# Exit
\q
```

Then update `.env` with the new password.

---

## ✅ After Fixing Password

Run the backend again:
```powershell
go run cmd/server/main.go
```

You should see:
```
Running database migrations...
Database migrations completed successfully
Server starting on port 8080
```
