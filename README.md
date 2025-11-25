Gabriel Mwila 2410234, 
Bristol Shalowa 2421003, 
Sibongile Tembo 2410291

EventFlow Pro 🎪
A full-stack event management application with real-time updates, role-based access control, and modern web technologies.

https://img.shields.io/badge/EventFlow-Pro-brightgreen
https://img.shields.io/badge/Node.js-18+-green
https://img.shields.io/badge/PostgreSQL-Database-blue
https://img.shields.io/badge/Deployed-Render-orange

🚀 Live Demo
Live Application: https://eventflow-pro.onrender.com
API Documentation: https://eventflow-pro.onrender.com/swagger

📖 Overview
EventFlow Pro is a collaborative event management system that allows users to create, manage, and RSVP to events with real-time updates. Built as a monolith application demonstrating modern web development principles and production deployment.

✨ Features
🔐 Authentication & Authorization
JWT-based authentication with secure password hashing

Role-based access control (Admin, Organizer, Attendee)

Protected API routes with middleware validation

📅 Event Management
Create, read, update, delete events

Event approval system (Admin role required)

Rich event details (title, description, date, location)

Organizer-specific event management

🤝 RSVP System
Three RSVP statuses: Going, Maybe, Not Going

Prevent duplicate RSVPs with unique constraints

RSVP tracking and management

⚡ Real-time Updates
WebSocket integration for live updates

Instant notifications for new events and RSVPs

Multi-client synchronization without page refresh

🛠️ Technical Features
Auto-generated API documentation with Swagger

Production-ready deployment on Render

PostgreSQL database with Prisma ORM

RESTful API architecture

🏗️ Architecture
text
EventFlow Pro/
├── 📁 src/
│ ├── 📁 controllers/ # Business logic handlers
│ ├── 📁 middleware/ # Authentication & validation
│ ├── 📁 routes/ # API route definitions
│ ├── 📁 services/ # External integrations
│ ├── 📁 utils/ # Helper functions
│ ├── 📁 prisma/ # Database schema & client
│ └── 🚀 index.ts # Main server entry point
├── 📁 public/ # Frontend assets (HTML, CSS, JS)
├── 📁 prisma/ # Database migrations
├── ⚙️ simple-server.cjs # Production server
├── 📦 package.json # Dependencies and scripts
└── 🌐 render.yaml # Deployment configuration
🛠️ Technology Stack
Backend
Runtime: Node.js

Framework: Express.js

Database: PostgreSQL with Prisma ORM

Authentication: JWT + bcrypt

Real-time: WebSockets

Frontend
Core: Vanilla JavaScript (ES6+)

Styling: Modern CSS3 with Flexbox/Grid

Templating: DOM manipulation

Real-time: Native WebSocket API

Deployment & DevOps
Platform: Render

Database: Render PostgreSQL

CI/CD: Automated GitHub deployments

Monitoring: Render logging and health checks

🚀 Quick Start
Prerequisites
Node.js 18+

PostgreSQL database

Git

Local Development
Clone the repository

bash
git clone https://github.com/yourusername/eventflow-pro.git
cd eventflow-pro
Install dependencies

bash
npm install
Environment setup

bash
cp .env.example .env

# Edit .env with your database and JWT settings

Database setup

bash
npx prisma generate
npx prisma db push
Start development server

bash
npm run dev
Access the application

Frontend: http://localhost:3001

API Docs: http://localhost:3001/swagger

Production Deployment
The application is configured for automatic deployment to Render:

Push to GitHub - Render automatically deploys from main branch

Environment variables are set in Render dashboard

PostgreSQL database is automatically provisioned

Health checks ensure service availability

📚 API Documentation
Comprehensive API documentation is available at /swagger when the server is running:

Key Endpoints
Method Endpoint Description Auth Required
POST /api/auth/signup User registration No
POST /api/auth/login User authentication No
GET /api/events Get all events Yes
POST /api/events Create new event Organizer+
PUT /api/events/:id Update event Organizer/Admin
POST /api/events/:id/rsvp RSVP to event Attendee+
PUT /api/events/:id/approve Approve event Admin
👥 User Roles
🎯 Attendee
Browse approved events

RSVP to events (Going/Maybe/Not Going)

View real-time updates

🎪 Organizer
All Attendee permissions

Create and manage own events

View RSVPs for created events

👑 Admin
All Organizer permissions

Approve/reject events

Manage all users and content

System administration

🔒 Security Features
Password hashing with bcrypt

JWT token authentication

Role-based route protection

Input validation and sanitization

CORS configuration

SQL injection prevention via Prisma ORM

Environment variable protection

🌟 Design Principles Applied
SOLID Principles
Single Responsibility: Controllers handle specific business logic

Open/Closed: Extensible through middleware and plugins

Liskov Substitution: Consistent interfaces across components

Interface Segregation: Focused, specific API endpoints

Dependency Inversion: Prisma client dependency injection

Separation of Concerns
Clear separation between routes, controllers, and services

Middleware for cross-cutting concerns

Database operations isolated in Prisma client

🐛 Troubleshooting
Common Issues
Database connection failed:

Check DATABASE_URL environment variable

Verify PostgreSQL service is running

Run npx prisma db push to create tables

Build failures on Render:

Check Render logs for specific error messages

Verify all dependencies in package.json

Ensure Prisma schema is valid

Authentication issues:

Verify JWT_SECRET is set

Check token expiration times

Validate password hashing

📈 Performance Optimizations
Database indexing on frequently queried fields

Eager loading of related data with Prisma

WebSocket connection pooling

Efficient client-side rendering

Production build optimizations

🤝 Contributing
Fork the repository

Create a feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🎓 Academic Context
This project was developed as a demonstration of:

Full-stack web development

Modern software architecture patterns

Production deployment and DevOps

Real-time web applications

Database design and optimization

Security best practices

📞 Support
For support and questions:

Check the API Documentation

Open an issue on GitHub

Review the deployment logs in Render dashboard

Built with ❤️ using Modern Web Technologies

EventFlow Pro - Making event management seamless and real-time 🎉
