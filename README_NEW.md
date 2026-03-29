# eCommerce API with NestJS

A complete eCommerce API built with NestJS, PostgreSQL, Prisma, JWT authentication, API Key validation, and role-based access control.

## 🚀 Features

- **Authentication & Authorization**
  - JWT t### Access admin panel (requires API key + JWT + ADMIN role):
```bash
curl -X GET http://localhost:3000/admin/users \
  -H "Authorization: Bearer <jwt_token>" \
  -H "x-api-key: <api_key>"
```

### Get products with pagination and filters (public endpoint):
```bash
# Get all products (default pagination)
curl -X GET http://localhost:3000/api/v1/products

# Get products with custom pagination
curl -X GET "http://localhost:3000/api/v1/products?page=1&take=5"

# Search products by name
curl -X GET "http://localhost:3000/api/v1/products?search=laptop"

# Filter by minimum star rating
curl -X GET "http://localhost:3000/api/v1/products?startRating=4"

# Combine filters
curl -X GET "http://localhost:3000/api/v1/products?search=mouse&startRating=3&page=1&take=3"
```

Example response with pagination:
```json
{
  "data": [
    {
      "id": "product-id",
      "name": "Laptop Gaming",
      "description": "High-performance gaming laptop",
      "price": "1299.99",
      "stock": 10,
      "startRating": 5,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "take": 10,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```ased authentication
  - API Key validation for admin routes
  - Role-based access control (USER, ADMIN)
  - Guards for JWT, API Key, and Roles

- **User Management**
  - User registration and login
  - Password hashing with bcryptjs
  - User CRUD operations (admin only)

- **Product Management**
  - Product CRUD operations
  - Stock management
  - Product catalog

- **Admin Panel**
  - Protected with API Key + JWT + ADMIN role
  - Full user and product management
  - Complete CRUD operations

- **Database**
  - PostgreSQL with Prisma ORM
  - Database migrations and seeding
  - Type-safe database queries

## 🛠 Technology Stack

- **Backend**: NestJS (Node.js framework)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + Passport
- **Validation**: class-validator, class-transformer
- **Language**: TypeScript

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ecommerce-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example environments/dev/.env
# Edit environments/dev/.env with your configuration
```

4. Set up the database:
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed the database
npm run seed
```



## 🚦 Running the Application

### Development
```bash
npm run start:dev
```

### Local
```bash
npm run start:local
```

### Production
```bash
npm run build
npm run start:prod
```

## 🐳 Docker Support

The project includes multi-environment Docker configuration:

### Development
```bash
docker build -f environments/dev/Dockerfile -t ecommerce-api:dev .
docker run -p 3000:3000 ecommerce-api:dev
```

### Local
```bash
docker build -f environments/local/Dockerfile -t ecommerce-api:local .
docker run -p 3000:3000 ecommerce-api:local
```

### Production
```bash
docker build -f environments/prod/Dockerfile -t ecommerce-api:prod .
docker run -p 3000:3000 ecommerce-api:prod
```

## 📁 Project Structure

```
ecommerce-api/
├── environments/
│   ├── dev/
│   │   ├── .env
│   │   └── Dockerfile
│   ├── local/
│   │   ├── .env
│   │   └── Dockerfile
│   └── prod/
│       ├── .env
│       └── Dockerfile
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── auth/
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   ├── user/
│   ├── product/
│   ├── admin/
│   ├── prisma/
│   ├── app.module.ts
│   └── main.ts
├── .env.example
└── package.json
```

## 🔐 Authentication & Authorization

### JWT Authentication
- Register: `POST /auth/register`
- Login: `POST /auth/login`
- Profile: `GET /auth/profile` (requires JWT)

### API Key + Role-based Access
Admin routes require:
1. Valid API Key in `x-api-key` header
2. Valid JWT token in `Authorization: Bearer <token>` header
3. ADMIN role

## 📊 API Endpoints

### Public Routes
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Protected Routes (JWT required)
- `GET /auth/profile` - Get user profile

### Public Routes
- `GET /products` - List products with pagination and filters
  - Query parameters:
    - `page` (number, default: 1) - Page number
    - `take` (number, default: 10, max: 100) - Items per page
    - `search` (string) - Search by product name or price
    - `startRating` (number, 0-5) - Filter by minimum star rating
  - Response includes pagination metadata

### Admin Routes (API Key + JWT + ADMIN role required)
- `GET /admin/users` - List all users
- `POST /admin/users` - Create user
- `GET /admin/users/:id` - Get user by ID
- `PATCH /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Delete user
- `GET /admin/products` - List all products
- `POST /admin/products` - Create product
- `GET /admin/products/:id` - Get product by ID
- `PATCH /admin/products/:id` - Update product
- `DELETE /admin/products/:id` - Delete product

## 🗄 Database Schema

### User Model
- `id` - Primary key
- `email` - Unique email address
- `password` - Hashed password
- `name` - User's full name
- `role` - USER | ADMIN
- `createdAt` - Creation timestamp

### Product Model
- `id` - Primary key
- `name` - Product name
- `description` - Product description (optional)
- `price` - Product price
- `stock` - Available quantity
- `startRating` - Star rating (0-5, optional)
- `createdAt` - Creation timestamp

## 🧪 Testing the API

### Register a new user:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### Login:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Access admin panel (requires API key + JWT + ADMIN role):
```bash
curl -X GET http://localhost:3000/admin/users \
  -H "Authorization: Bearer <jwt-token>" \
  -H "x-api-key: <api-key>"
```

## 📝 Environment Variables

Required environment variables (see `.env.example`):

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing
- `API_KEY` - API key for admin access
- `NODE_ENV` - Environment (dev/local/prod)
- `PORT` - Application port (default: 3000)

## 🔄 Development Scripts

- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:local` - Start in local mode
- `npm run start:prod` - Start in production mode
- `npm run build` - Build the application
- `npm run seed` - Seed the database with test data
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run lint` - Run ESLint


##info
npm run prisma:studio

## 🛡 Security Features

- Password hashing with bcryptjs
- JWT token authentication
- API Key validation
- Role-based access control
- Request validation with class-validator
- CORS enabled
- Global validation pipes

## ⚠️ Important Notes

- The seeder creates test users with hashed passwords and assigns roles
- **Test credentials**:
  - **Admin**: admin@ecommerce.com / admin123 (Role: Administrator)
  - **User**: user@ecommerce.com / user123 (Role: User)  
  - **Moderator**: moderator@ecommerce.com / moderator123 (Role: Moderator)
- All passwords are properly hashed with bcrypt
- The seeder creates a complete roles and permissions system:
  - 7 modules (users, products, orders, carts, payments, roles, permissions)
  - 35 permissions (create, read, update, delete, view for each module)
  - 3 roles with different permission levels
- In production, ensure all passwords are properly hashed
- Change default JWT_SECRET and API_KEY in production
- Set up proper database connection for each environment

## 🔐 Roles & Permissions System

The API includes a comprehensive role-based access control system:

### **Roles Created:**
- **Administrator**: Full system access (all 35 permissions)
- **User**: Limited access (view products, manage own cart/orders)
- **Moderator**: Intermediate access (manage products and orders)

### **Modules & Permissions:**
Each module has 5 permission types: `create`, `read`, `update`, `delete`, `view`
- **Users Module**: User management
- **Products Module**: Product catalog management
- **Orders Module**: Order processing
- **Carts Module**: Shopping cart operations
- **Payments Module**: Payment processing
- **Roles Module**: Role management
- **Permissions Module**: Permission management

## 📄 License

This project is licensed under the MIT License.
