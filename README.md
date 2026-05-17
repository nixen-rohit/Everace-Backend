# Everace E-Commerce Backend API

A robust, production-ready e-commerce backend API built with Node.js, Express, and MySQL. Features authentication, admin panel, product management, and more.

## 🚀 Features

- **Authentication & Authorization**
  - User registration and login
  - JWT-based authentication (Access + Refresh tokens)
  - Role-based access control (User/Admin)
  - Password hashing with bcrypt
  - Secure logout and token revocation

- **Admin Panel**
  - User management (CRUD operations)
  - Admin statistics dashboard
  - Role management
  - User activation/deactivation

- **Product Management**
  - Create, read, update, delete products
  - Image upload with Multer
  - Product tagging system (predefined + custom tags)
  - Search and filter products
  - Stock management
  - Category management

- **API Documentation**
  - Interactive Swagger/OpenAPI documentation
  - Request/response schemas
  - Easy API testing

- **Security Features**
  - CORS configuration
  - HTTP-only cookies for refresh tokens
  - Rate limiting ready
  - SQL injection prevention (parameterized queries)
  - XSS protection

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn package manager

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with mysql2
- **Authentication**: JWT, bcryptjs
- **File Upload**: Multer
- **Documentation**: Swagger/OpenAPI
- **Language**: ES6+ JavaScript (ES Modules)

## 📦 Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/everace-backend.git
cd everace-backend
```

.env

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=data base name
DB_PORT=3306

# JWT Secrets (Generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Bcrypt Salt Rounds
BCRYPT_SALT_ROUNDS=10

# Server
PORT=5000
NODE_ENV=development

# CORS
CLIENT_URL=http://localhost:3000(frontend url)

 

