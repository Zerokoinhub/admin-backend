# ZeroKoin Admin Panel Backend

A professional Node.js backend for the ZeroKoin Admin Panel.

## Features

- User Authentication (Register/Login)
- Role-based Authorization
- MongoDB Database Integration
- JWT Authentication
- Input Validation
- Error Handling
- Security Middleware

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/zerokoin-admin
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user

### Users
- GET `/api/users` - Get all users (Admin only)
- GET `/api/users/:id` - Get user by ID
- PUT `/api/users/:id` - Update user
- DELETE `/api/users/:id` - Delete user

## Project Structure

```
├── app.js              # Main application file
├── package.json        # Project dependencies
├── .env               # Environment variables
├── models/            # Database models
│   └── user.model.js
├── controllers/       # Route controllers
│   └── auth.controller.js
├── routes/           # API routes
│   └── auth.routes.js
└── middleware/       # Custom middleware
    └── auth.middleware.js
```

## Security Features

- Password hashing using bcrypt
- JWT authentication
- Input validation
- CORS enabled
- Helmet security headers
- Rate limiting
- Error handling middleware

## Development

The project uses nodemon for development, which automatically restarts the server when changes are detected.

To start development:
```bash
npm run dev
```

For production:
```bash
npm start
``` 