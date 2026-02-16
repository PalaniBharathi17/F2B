# F2B Portal - Go Backend

A high-performance farmer-to-buyer marketplace backend built with Go, Gin, and PostgreSQL.

## 🚀 Features

- **Fast & Efficient**: Built with Go for high performance and low memory usage
- **JWT Authentication**: Secure token-based authentication
- **Product Management**: CRUD operations for product listings
- **Order Management**: Complete order lifecycle management
- **Trust Score System**: Novel trust calculation based on ratings and completion rate
- **Image Upload**: Product image upload with automatic resizing
- **Search & Filter**: Advanced search and filtering capabilities
- **Email Notifications**: SMTP-based email notifications
- **RESTful API**: Clean REST API design

## 📋 Prerequisites

- Go 1.21 or higher
- PostgreSQL 12 or higher
- (Optional) SMTP server for email notifications

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd f2b-portal-go
```

### 2. Install dependencies

```bash
go mod download
```

### 3. Setup PostgreSQL

```bash
# Create database
sudo -u postgres psql
CREATE DATABASE f2b_portal;
\q
```

### 4. Configure environment variables

Copy `env.example` to `.env` and update the values:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=f2b_portal
DB_SSLMODE=disable

# JWT
JWT_SECRET=your-super-secret-key-change-this-in-production

# Server
PORT=8080

# Email (Gmail SMTP) - Optional
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### 5. Run the server

```bash
go run cmd/server/main.go
```

The server will start on `http://localhost:8080`

## 📁 Project Structure

```
f2b-portal-go/
├── cmd/
│   └── server/
│       └── main.go              # Entry point
├── internal/
│   ├── api/
│   │   ├── handlers/            # HTTP handlers
│   │   │   ├── auth.go
│   │   │   ├── products.go
│   │   │   ├── orders.go
│   │   │   ├── users.go
│   │   │   └── upload.go
│   │   ├── middleware/
│   │   │   ├── auth.go          # JWT middleware
│   │   │   └── cors.go
│   │   └── routes.go            # Route definitions
│   ├── models/                  # Database models
│   │   ├── user.go
│   │   ├── product.go
│   │   ├── order.go
│   │   └── review.go
│   ├── repository/              # Database operations
│   │   ├── user_repo.go
│   │   ├── product_repo.go
│   │   └── order_repo.go
│   ├── service/                 # Business logic
│   │   ├── auth_service.go
│   │   ├── product_service.go
│   │   ├── order_service.go
│   │   ├── trust_score.go
│   │   └── email_service.go
│   └── utils/
│       ├── jwt.go
│       ├── validator.go
│       └── image.go
├── pkg/
│   └── config/
│       ├── config.go            # Configuration
│       └── database.go          # Database setup
├── uploads/                     # Product images
├── go.mod
├── go.sum
├── .env
└── README.md
```

## 🔌 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user (protected)

### Products

- `GET /api/v1/products` - Get all products (with filters)
- `GET /api/v1/products/:id` - Get product by ID
- `GET /api/v1/products/search?q=query` - Search products
- `POST /api/v1/products` - Create product (farmer only)
- `PUT /api/v1/products/:id` - Update product (farmer only)
- `DELETE /api/v1/products/:id` - Delete product (farmer only)
- `GET /api/v1/products/my/listings` - Get my products (farmer only)

### Orders

- `POST /api/v1/orders` - Create order (buyer only)
- `GET /api/v1/orders/:id` - Get order by ID
- `GET /api/v1/orders/my/orders` - Get my orders (buyer only)
- `GET /api/v1/orders/farmer/orders` - Get farmer orders (farmer only)
- `PUT /api/v1/orders/:id/status` - Update order status
- `DELETE /api/v1/orders/:id` - Cancel order

### Users

- `GET /api/v1/users/:id/trust-score` - Get farmer trust score

### Upload

- `POST /api/v1/upload/image` - Upload single image
- `POST /api/v1/upload/images` - Upload multiple images

## 📝 Example API Calls

### Register User

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ramesh Kumar",
    "email": "ramesh@example.com",
    "phone": "9876543210",
    "password": "password123",
    "user_type": "farmer",
    "city": "Delhi",
    "state": "Delhi"
  }'
```

### Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ramesh@example.com",
    "password": "password123"
  }'
```

### Create Product (with JWT)

```bash
curl -X POST http://localhost:8080/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "crop_name": "Tomato",
    "quantity": 100,
    "unit": "kg",
    "price_per_unit": 30,
    "description": "Fresh red tomatoes",
    "city": "Delhi",
    "state": "Delhi"
  }'
```

### Search Products

```bash
curl "http://localhost:8080/api/v1/products/search?q=tomato&city=Delhi&min_price=20&max_price=50&sort_by=price_asc&page=1&limit=20"
```

## 🎯 Trust Score System

The trust score is calculated using the formula:

```
Trust Score = (Average Rating × 0.6) + (Completion Rate × 0.4)
```

Where:
- **Average Rating**: Average of all reviews (0-5 stars normalized to 0-1)
- **Completion Rate**: completed_orders / total_orders

Badge assignment:
- **GOLD**: 0.8 - 1.0
- **SILVER**: 0.6 - 0.79
- **BRONZE**: Below 0.6

## 🧪 Testing

### Health Check

```bash
curl http://localhost:8080/health
```

### Test with Postman

Import the API endpoints into Postman or use curl commands provided above.

## 🚀 Deployment

### Build for production

```bash
go build -o server cmd/server/main.go
./server
```

### Docker (Optional)

Create a `Dockerfile`:

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o server cmd/server/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/server .
COPY --from=builder /app/uploads ./uploads
CMD ["./server"]
```

### Free Hosting Options

1. **Railway.app**: Connect GitHub repo and deploy
2. **Render.com**: Connect GitHub repo and deploy
3. **Fly.io**: Use `fly launch` command

## 🔒 Security Notes

- Always change `JWT_SECRET` in production
- Use strong database passwords
- Enable SSL for database connections in production
- Set proper CORS origins
- Validate all user inputs
- Use HTTPS in production

## 📚 Dependencies

- **Gin**: Web framework
- **GORM**: ORM for database operations
- **PostgreSQL**: Database
- **JWT**: Authentication tokens
- **bcrypt**: Password hashing
- **imaging**: Image processing
- **gomail**: Email sending

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Troubleshooting

### Port already in use

```bash
# Find process using port 8080
sudo lsof -i :8080

# Kill process
kill -9 <PID>
```

### Database connection error

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Restart if needed
sudo systemctl restart postgresql
```

### CORS errors

Make sure `FRONTEND_URL` in `.env` matches your frontend URL.

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using Go**
