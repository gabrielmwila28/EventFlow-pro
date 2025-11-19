// simple-server.cjs - COMPLETE WORKING SERVER WITH ALL FEATURES + SWAGGER
const http = require('http');
const { WebSocketServer } = require('ws');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Create Express app for Swagger
const app = express();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret';

// ==================== SWAGGER SETUP ====================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EventFlow Pro API',
      version: '1.0.0',
      description: 'A complete event management system with real-time updates and role-based access control',
      contact: {
        name: 'EventFlow Pro Support',
        url: 'https://github.com/gabrielmwila28/EventFlow-pro'
      },
    },
    servers: [
      {
        url: `https://eventflow-pro.onrender.com`,
        description: 'Production server',
      },
      {
        url: `http://localhost:${process.env.PORT || 3001}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['ADMIN', 'ORGANIZER', 'ATTENDEE'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            location: { type: 'string' },
            approved: { type: 'boolean' },
            organizerId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        RSVP: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            eventId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['GOING', 'MAYBE', 'NOT_GOING'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ['./simple-server.cjs'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Create HTTP server with Express app
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Store connected WebSocket clients
const clients = new Set();

// Email transporter (Ethereal) with fallback
let emailTransporter;
try {
  emailTransporter = nodemailer.createTransporter({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: process.env.ETHEREAL_USERNAME,
      pass: process.env.ETHEREAL_PASSWORD,
    },
  });
  console.log('✅ Email transporter configured');
} catch (emailError) {
  console.warn('⚠️ Email transporter not configured:', emailError.message);
  emailTransporter = null;
}

// Broadcast function for real-time updates
function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === 1) { // 1 = OPEN
      client.send(message);
    }
  });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket connection');
  clients.add(ws);
  
  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
    clients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    clients.delete(ws);
  });
});

console.log('🚀 Starting enhanced server with WebSocket support...');

// HTTP request handler
server.on('request', async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`📨 ${req.method} ${req.url}`);

 // Serve static files
if (req.method === 'GET') {
    // Serve HTML file
    if (req.url === '/' || req.url === '/index.html') {
        try {
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(__dirname, 'public', 'index.html');
            const content = fs.readFileSync(filePath, 'utf8');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
            return;
        } catch (error) {
            // Continue to API routes if file not found
        }
    }
    
    // Serve JS file
    if (req.url === '/app.js') {
        try {
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(__dirname, 'public', 'app.js');
            const content = fs.readFileSync(filePath, 'utf8');
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            res.end(content);
            return;
        } catch (error) {
            // Continue to API routes if file not found
        }
    }
    
    // Serve CSS file
    if (req.url === '/styles.css') {
        try {
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(__dirname, 'public', 'styles.css');
            const content = fs.readFileSync(filePath, 'utf8');
            res.writeHead(200, { 'Content-Type': 'text/css' });
            res.end(content);
            return;
        } catch (error) {
            // Continue to API routes if file not found
        }
    }
}

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check if the API is running
 *     responses:
 *       200:
 *         description: API is healthy
 */
// Health check
if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'OK', 
      message: 'Server with WebSocket is working!',
      timestamp: new Date().toISOString(),
      websocketClients: clients.size
    }));
    return;
  }

/**
 * @swagger
 * /test-db:
 *   get:
 *     summary: Test database connection
 *     description: Check database connectivity and get sample data counts
 *     responses:
 *       200:
 *         description: Database connection successful
 *       500:
 *         description: Database connection failed
 */
// Test database
if (req.method === 'GET' && req.url === '/test-db') {
    try {
      const userCount = await prisma.user.count();
      const eventCount = await prisma.event.count();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'Database connected!',
        userCount,
        eventCount,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'Database error',
        error: error.message 
      }));
    }
    return;
  }

  // WebSocket test endpoint
  if (req.method === 'GET' && req.url === '/ws-test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'WebSocket server is running',
      connectedClients: clients.size
    }));
    return;
  }

  // Debug events endpoint
  if (req.method === 'GET' && req.url === '/debug-events') {
    console.log('🔍 DEBUG: /debug-events endpoint hit');
    
    try {
      const authHeader = req.headers['authorization'];
      console.log('🔍 DEBUG: Auth header:', authHeader);
      
      if (!authHeader) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No auth header', receivedHeaders: req.headers }));
        return;
      }
      
      const token = authHeader.replace('Bearer ', '');
      console.log('🔍 DEBUG: Token received:', token.substring(0, 20) + '...');
      
      // Try to verify token
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('🔍 DEBUG: Token decoded successfully:', decoded);
      } catch (jwtError) {
        console.error('🔍 DEBUG: JWT verification failed:', jwtError.message);
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'JWT verification failed', details: jwtError.message }));
        return;
      }
      
      // Try database query
      const events = await prisma.event.findMany({
        take: 5, // Limit for testing
        include: {
          organizer: { select: { email: true } }
        }
      });
      
      console.log('🔍 DEBUG: Database query successful, found:', events.length, 'events');
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        events: events,
        message: 'Debug endpoint working' 
      }));
      
    } catch (error) {
      console.error('🔍 DEBUG: /debug-events error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Debug endpoint failed',
        message: error.message,
        stack: error.stack
      }));
    }
    return;
  }

  // Test endpoint
  if (req.method === 'GET' && req.url === '/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Test endpoint is working!',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Events test endpoint
  if (req.method === 'GET' && req.url === '/events-test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Events test endpoint is working!',
      timestamp: new Date().toISOString()
    }));
    return;
  }

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [ADMIN, ORGANIZER, ATTENDEE]
 *                 default: ATTENDEE
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input or missing fields
 *       409:
 *         description: User already exists
 */
// User Signup with Email
if (req.method === 'POST' && req.url === '/signup') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { email, password, role = 'ATTENDEE' } = JSON.parse(body);
        
        console.log('🔍 Creating user:', email);

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'User already exists' }));
          return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
          data: { email, password: hashedPassword, role }
        });

        // Send welcome email
        try {
          const emailInfo = await emailTransporter.sendMail({
            from: '"Event App" <noreply@eventapp.com>',
            to: email,
            subject: 'Welcome to Event App! 🎉',
            html: `
              <h1>Welcome to Event App!</h1>
              <p>Your account has been created successfully.</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Role:</strong> ${role}</p>
              <p>You can now login and start managing events!</p>
              <hr>
              <p><em>This is a test email from Ethereal.</em></p>
            `
          });
          console.log('📧 Welcome email sent:', nodemailer.getTestMessageUrl(emailInfo));
        } catch (emailError) {
          console.error('❌ Email error (non-critical):', emailError.message);
        }

        const token = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        console.log('✅ User created:', email);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'User created successfully!', 
          user: { id: user.id, email: user.email, role: user.role },
          token 
        }));
      } catch (error) {
        console.error('❌ Signup error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error', details: error.message }));
      }
    });
    return;
  }

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Authenticate user
 *     description: Login with email and password to receive JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid credentials
 */
// User Login
if (req.method === 'POST' && req.url === '/login') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { email, password } = JSON.parse(body);

        console.log('🔍 Login attempt:', email);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid email or password' }));
          return;
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid email or password' }));
          return;
        }

        const token = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        console.log('✅ Login successful:', email);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Login successful!', 
          user: { id: user.id, email: user.email, role: user.role },
          token 
        }));
      } catch (error) {
        console.error('❌ Login error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error', details: error.message }));
      }
    });
    return;
  }

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get all events
 *     description: Retrieve all events (approved only for non-admins)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *       401:
 *         description: Unauthorized
 */
// Get All Events - SINGLE VERSION (REMOVED DUPLICATE)
if (req.method === 'GET' && req.url === '/events') {
    console.log('🎯 GET /events endpoint hit');
    
    try {
      // Debug: Log all headers
      console.log('📋 Request headers:', req.headers);
      
      const authHeader = req.headers['authorization'];
      console.log('🔐 Authorization header:', authHeader ? 'Present' : 'Missing');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ No valid Bearer token found');
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No token provided' }));
        return;
      }

      const token = authHeader.slice(7);
      console.log('🔑 Token length:', token.length);
      
      // Enhanced JWT verification with better error handling
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Token verified for user:', decoded.email, 'role:', decoded.role, 'userId:', decoded.userId);
      } catch (jwtError) {
        console.error('❌ JWT verification failed:', jwtError.message);
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid token', details: jwtError.message }));
        return;
      }

      // Build query based on user role
      const where = decoded.role === 'ADMIN' ? {} : { approved: true };
      console.log('🔍 Query filter:', JSON.stringify(where));

      // Test database connection first
      try {
        console.log('🗄️ Testing database connection...');
        await prisma.$queryRaw`SELECT 1`;
        console.log('✅ Database connection OK');
      } catch (dbError) {
        console.error('❌ Database connection failed:', dbError);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database connection failed', details: dbError.message }));
        return;
      }

      // Fetch events
      console.log('📂 Fetching events from database...');
      const events = await prisma.event.findMany({
        where,
        include: {
          organizer: { select: { email: true } },
          rsvps: {
            include: {
              user: { select: { email: true } }
            }
          }
        },
        orderBy: { date: 'asc' }
      });

      console.log('✅ Successfully fetched', events.length, 'events');
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'Events fetched successfully',
        count: events.length,
        events
      }));

    } catch (error) {
      console.error('💥 GET /events - Unhandled error:', error);
      console.error('🔍 Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Failed to fetch events',
        message: error.message,
        code: error.code,
        // Only include stack in development
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }));
    }
    return;
  }

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event
 *     description: Create a new event (Organizer and Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - date
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *                 example: Tech Conference 2024
 *               description:
 *                 type: string
 *                 example: Annual technology conference
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-12-15T09:00:00Z
 *               location:
 *                 type: string
 *                 example: Convention Center, New York
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Invalid input or missing fields
 *       403:
 *         description: Insufficient permissions
 */
// Create Event with WebSocket broadcast
if (req.method === 'POST' && req.url === '/events') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No token provided' }));
          return;
        }

        const token = authHeader.slice(7);
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if user is organizer or admin
        if (decoded.role !== 'ORGANIZER' && decoded.role !== 'ADMIN') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Requires ORGANIZER or ADMIN role' }));
          return;
        }

        const { title, description, date, location } = JSON.parse(body);
        
        if (!title || !description || !date || !location) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing required fields' }));
          return;
        }

        // Auto-approve if admin
        const approved = decoded.role === 'ADMIN';

        const event = await prisma.event.create({
          data: {
            title,
            description,
            date: new Date(date),
            location,
            organizerId: decoded.userId,
            approved
          },
          include: {
            organizer: { select: { email: true } },
            rsvps: true
          }
        });

        console.log(`✅ Event created: ${title}`);
        
        // Broadcast real-time update
        broadcast({
          type: 'EVENT_CREATED',
          event,
          timestamp: new Date().toISOString()
        });

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'Event created successfully' + (approved ? ' and approved' : ' (pending approval)'),
          event
        }));
      } catch (error) {
        console.error('❌ Event creation error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to create event', details: error.message }));
      }
    });
    return;
  }

  // Approve Event (Admin only) with WebSocket broadcast
  if (req.method === 'PUT' && req.url.includes('/approve')) {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No token provided' }));
        return;
      }

      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, JWT_SECRET);

      // Check if user is admin
      if (decoded.role !== 'ADMIN') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Requires ADMIN role' }));
        return;
      }

      // Extract event ID from URL - better parsing for /events/:id/approve
      const urlParts = req.url.split('/');
      const eventId = urlParts[2]; // events/[id]/approve

      if (!eventId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Event ID is required' }));
        return;
      }

      const event = await prisma.event.update({
        where: { id: eventId },
        data: { approved: true },
        include: {
          organizer: { select: { email: true } },
          rsvps: true
        }
      });

      console.log(`✅ Event approved: ${event.title}`);
      
      // Broadcast real-time update
      broadcast({
        type: 'EVENT_APPROVED',
        event,
        timestamp: new Date().toISOString()
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'Event approved successfully', 
        event 
      }));
    } catch (error) {
      console.error('❌ Event approval error:', error);
      if (error.code === 'P2025') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Event not found' }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to approve event', details: error.message }));
      }
    }
    return;
  }

  // RSVP to Event with WebSocket broadcast
  if (req.method === 'POST' && req.url.includes('/rsvp')) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No token provided' }));
          return;
        }

        const token = authHeader.slice(7);
        const decoded = jwt.verify(token, JWT_SECRET);

        // Extract event ID from URL (remove /rsvp from the end)
        const eventId = req.url.split('/')[2].replace('/rsvp', '');
        const { status = 'GOING' } = JSON.parse(body);

        // Check if event exists
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Event not found' }));
          return;
        }

        // Check if event is approved (unless admin)
        if (!event.approved && decoded.role !== 'ADMIN') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Event not approved yet' }));
          return;
        }

        // Create or update RSVP
        const rsvp = await prisma.rSVP.upsert({
          where: {
            userId_eventId: {
              userId: decoded.userId,
              eventId: eventId
            }
          },
          update: { status },
          create: {
            userId: decoded.userId,
            eventId: eventId,
            status
          },
          include: {
            user: { select: { email: true } },
            event: { 
              select: { 
                title: true,
                id: true
              } 
            }
          }
        });

        console.log(`✅ RSVP ${status} for event: ${rsvp.event.title}`);
        
        // Broadcast real-time update
        broadcast({
          type: 'RSVP_UPDATED',
          rsvp,
          eventId: eventId,
          timestamp: new Date().toISOString()
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: `RSVP ${status} successfully`,
          rsvp 
        }));
      } catch (error) {
        console.error('❌ RSVP error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to RSVP', details: error.message }));
      }
    });
    return;
  }

  // Get Event RSVPs
  if (req.method === 'GET' && req.url.includes('/rsvps')) {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No token provided' }));
        return;
      }

      // Extract event ID from URL (remove /rsvps from the end)
      const eventId = req.url.split('/')[2].replace('/rsvps', '');

      const rsvps = await prisma.rSVP.findMany({
        where: { eventId: eventId },
        include: {
          user: { select: { email: true, role: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'RSVPs fetched successfully',
        rsvps 
      }));
    } catch (error) {
      console.error('❌ Get RSVPs error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch RSVPs', details: error.message }));
    }
    return;
  }

  // Update Event with WebSocket broadcast
  if (req.method === 'PUT' && req.url.startsWith('/events/') && !req.url.includes('/approve')) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No token provided' }));
          return;
        }

        const token = authHeader.slice(7);
        const decoded = jwt.verify(token, JWT_SECRET);

        // Extract event ID from URL
        const eventId = req.url.split('/')[2];

        // Check if event exists and user has permission
        const existingEvent = await prisma.event.findUnique({
          where: { id: eventId },
          include: { organizer: true }
        });

        if (!existingEvent) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Event not found' }));
          return;
        }

        // Check if user is organizer of this event or admin
        if (existingEvent.organizerId !== decoded.userId && decoded.role !== 'ADMIN') {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not authorized to update this event' }));
          return;
        }

        const { title, description, date, location } = JSON.parse(body);
        
        const event = await prisma.event.update({
          where: { id: eventId },
          data: {
            ...(title && { title }),
            ...(description && { description }),
            ...(date && { date: new Date(date) }),
            ...(location && { location })
          },
          include: {
            organizer: { select: { email: true } },
            rsvps: true
          }
        });

        console.log(`✅ Event updated: ${event.title}`);
        
        // Broadcast real-time update
        broadcast({
          type: 'EVENT_UPDATED',
          event,
          timestamp: new Date().toISOString()
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'Event updated successfully',
          event
        }));
      } catch (error) {
        console.error('❌ Event update error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to update event', details: error.message }));
      }
    });
    return;
  }

  // Delete Event with WebSocket broadcast
  if (req.method === 'DELETE' && req.url.startsWith('/events/')) {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No token provided' }));
        return;
      }

      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, JWT_SECRET);

      // Extract event ID from URL
      const eventId = req.url.split('/')[2];

      // Check if event exists and user has permission
      const existingEvent = await prisma.event.findUnique({
        where: { id: eventId },
        include: { organizer: true }
      });

      if (!existingEvent) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Event not found' }));
        return;
      }

      // Check if user is organizer of this event or admin
      if (existingEvent.organizerId !== decoded.userId && decoded.role !== 'ADMIN') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not authorized to delete this event' }));
        return;
      }

      await prisma.event.delete({
        where: { id: eventId }
      });

      console.log(`✅ Event deleted: ${existingEvent.title}`);
      
      // Broadcast real-time update
      broadcast({
        type: 'EVENT_DELETED',
        eventId: eventId,
        eventTitle: existingEvent.title,
        timestamp: new Date().toISOString()
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'Event deleted successfully'
      }));
    } catch (error) {
      console.error('❌ Event delete error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to delete event', details: error.message }));
    }
    return;
  }

  // Not found
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('🎉 ENHANCED SERVER RUNNING WITH WEBSOCKETS!');
  console.log('📍 http://localhost:' + PORT);
  console.log('🔌 WebSocket: ws://localhost:' + PORT);
  console.log('📚 Swagger Docs: http://localhost:' + PORT + '/swagger');
  console.log('\n✅ TEST THESE ENDPOINTS:');
  console.log('   GET  http://localhost:' + PORT + '/health');
  console.log('   GET  http://localhost:' + PORT + '/swagger');
  console.log('   GET  http://localhost:' + PORT + '/test-db');
  console.log('   POST http://localhost:' + PORT + '/signup');
  console.log('   POST http://localhost:' + PORT + '/login');
  console.log('   POST http://localhost:' + PORT + '/events');
  console.log('   GET  http://localhost:' + PORT + '/events');
  console.log('   PUT  http://localhost:' + PORT + '/events/:id/approve');
  console.log('   POST http://localhost:' + PORT + '/events/:id/rsvp');
  console.log('   GET  http://localhost:' + PORT + '/events/:id/rsvps');
  console.log('   PUT  http://localhost:' + PORT + '/events/:id');
  console.log('   DELETE http://localhost:' + PORT + '/events/:id');
  console.log('\n🔌 REAL-TIME UPDATES: Connect to ws://localhost:' + PORT + ' for live events/RSVP updates');
});