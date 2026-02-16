# How to Create Database Using Command Line

## Method 1: Using psql Command

Open PowerShell and run:

```powershell
# Connect to PostgreSQL (enter your password when prompted)
psql -U postgres -h localhost

# Once connected, run:
CREATE DATABASE f2b_portal;

# Exit psql
\q
```

## Method 2: Using pgAdmin (GUI)

1. Open **pgAdmin** from Start Menu
2. Right-click **"Servers"** → **"Create"** → **"Server"**
3. Enter connection details:
   - **Name**: PostgreSQL
   - **Host**: localhost
   - **Port**: 5432
   - **Username**: postgres
   - **Password**: (your PostgreSQL password)
4. Click **"Save"**
5. Expand **"Databases"**
6. Right-click **"Databases"** → **"Create"** → **"Database"**
7. Name: `f2b_portal`
8. Click **"Save"**

Done! ✅
