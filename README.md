EventFlow Pro
A full-stack monolith event management application with real-time updates and role-based access control.

Features
User Authentication - JWT-based auth with password hashing

Role-Based Access Control - Admin, Organizer, and Attendee roles

Event Management - Create, update, delete, and approve events

RSVP System - RSVP with status (Going, Maybe, Not Going)

Real-time Updates - WebSocket integration for live updates

API Documentation - Auto-generated Swagger docs

Email Integration - Ethereal API for mock email notifications

Tech Stack
Backend: Elysia.js (Bun runtime)

Database: PostgreSQL with Prisma ORM

Hosting: Neon (Database) + Render (Application)

Authentication: JWT + bcrypt

Realtime: WebSockets

Email: Ethereal + Nodemailer

Quick Start
Install dependencies

bash
bun install
Environment Setup

bash
cp .env.example .env

# Configure DATABASE_URL, JWT_SECRET, ETHEREAL_EMAIL, ETHEREAL_PASSWORD

Database Setup

bash
npx prisma generate
npx prisma migrate dev --name init
Start Development Server

bash
bun run dev
API Documentation
Access auto-generated Swagger docs at /swagger when server is running.

Deployment
Deployed on Render with PostgreSQL database hosted on Neon.
