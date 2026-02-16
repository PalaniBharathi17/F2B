# Database Schema Explanation

## ✅ Tables Will Be Created Automatically

When you run the server, it will automatically create these tables:

1. **users** - Stores user accounts (farmers and buyers)
2. **farmer_profiles** - Stores farmer-specific information and trust scores
3. **products** - Stores product listings (with image URL)
4. **orders** - Stores order information
5. **reviews** - Stores reviews and ratings

## 📸 How Images Work

**Current Setup (Recommended):**
- Images are stored as **files** in the `uploads/` folder
- The **image path/URL** is stored in the database (`image_url` field)
- This is the best practice because:
  - Faster performance
  - Smaller database size
  - Easy to serve images via HTTP
  - Better for scaling

**Example:**
- Image file: `uploads/1234567890.jpg`
- Database stores: `/uploads/1234567890.jpg`
- Frontend displays: `http://localhost:8080/uploads/1234567890.jpg`

## 🗄️ Database Tables Structure

### users table
- id, name, email, phone, password, user_type, city, state, created_at, updated_at

### farmer_profiles table
- id, user_id, farm_name, farm_size_acres, rating_average, total_orders, completed_orders, trust_score, badge

### products table
- id, farmer_id, crop_name, quantity, unit, price_per_unit, description, city, state, **image_url**, status, created_at, updated_at

### orders table
- id, product_id, buyer_id, farmer_id, quantity, total_price, status, delivery_address, created_at, updated_at

### reviews table
- id, order_id, reviewer_id, reviewee_id, rating, comment, created_at

---

## 🚀 To Create Tables: Just Run the Server!

The migrations run automatically when you start the server.
