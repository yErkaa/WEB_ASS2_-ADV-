# Project Name: WEB_ASS2

## Overview
This project is a web application designed to provide a structured and secure platform for managing user-generated content. The system is built using Node.js with Express.js for the backend, MongoDB as the database, and follows a RESTful API architecture.

## Features
- User authentication (JWT-based login and registration)
- CRUD operations for posts and comments
- Role-based access control (Admin/User)
- Data validation and security mechanisms
- MongoDB with schema modeling and indexing

## Technologies Used
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ORM)
- **Authentication**: JWT, bcrypt
- **Frontend**: HTML, CSS, JavaScript
- **Deployment**: MongoDB Atlas

## Database Schema
 User Schema

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" }
});

Post Schema
javascript
const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  likes: { type: Number, default: 0 }
});


## API Endpoints
### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and receive a JWT token

### Posts
- `GET /posts` - Fetch all posts
- `POST /posts` - Create a new post (Authenticated users only)
- `PUT /posts/:id` - Update a post
- `DELETE /posts/:id` - Delete a post

### Comments
- `POST /comments` - Add a comment
- `DELETE /comments/:id` - Delete a comment

## Installation Guide
1. Clone the repository:
```bash
git clone https://github.com/yErkaa/WEB_ASS2_-ADV-.git
```
2. Install dependencies:
```bash
cd WEB_ASS2_-ADV-
npm install
```
3. Configure environment variables (`.env` file):
```plaintext
MONGO_URI=mongodb+srv://Yerka:Adilek123@cluster0.i3f08.mongodb.net/learning_places?retryWrites=true&w=majority
JWT_SECRET=supersecretkey12345
```
4. Run the application:
```bash
npm start
```

## Security Measures
- Password hashing using bcrypt
- JWT-based authentication
- Input validation with Express Validator

## Deployment
- The project is deployed on MongoDB Atlas.

## Future Improvements
- Implement aggregation pipelines for analytics
- Enhance role-based access control
- Optimize database queries with indexing

## Contributors    SE2318
Aldongar Yerkin
Mendiyarov Dias

