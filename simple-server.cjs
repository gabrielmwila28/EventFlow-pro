// simple-server.cjs - WORKING VERSION WITH SWAGGER
const http = require('http');
const { WebSocketServer } = require('ws');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret';

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

// Create HTTP server
const server = http.createServer();
const wss = new WebSocketServer({ server });

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

  // ==================== SWAGGER DOCUMENTATION ====================
  if (req.method === 'GET' && req.url === '/swagger') {
    const swaggerHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>EventFlow Pro API Documentation</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3/swagger-ui.css" />
        <style>
          body { margin: 0; padding: 0; }
          #swagger-ui { padding: 20px; }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@3/swagger-ui-bundle.js"></script>
        <script>
          const spec = {
            openapi: '3.0.0',
            info: {
              title: 'EventFlow Pro API',
              version: '1.0.0',
              description: 'A complete event management system with real-time updates and role-based access control'
            },
            servers: [
              {
                url: 'https://eventflow-pro.onrender.com',
                description: 'Production server'
              }
            ],
            paths: {
              '/health': {
                get: {
                  summary: 'Health check',
                  description: 'Check if the API is running',
                  responses: {
                    '200': {
                      description: 'API is healthy',
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object',
                            properties: {
                              status: { type: 'string' },
                              message: { type: 'string' },
                              timestamp: { type: 'string', format: 'date-time' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              '/test-db': {
                get: {
                  summary: 'Test database connection',
                  description: 'Check database connectivity and get sample data counts',
                  responses: {
                    '200': {
                      description: 'Database connection successful',
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object',
                            properties: {
                              status: { type: 'string' },
                              userCount: { type: 'integer' },
                              eventCount: { type: 'integer' },
                              timestamp: { type: 'string', format: 'date-time' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              '/signup': {
                post: {
                  summary: 'User registration',
                  description: 'Create a new user account',
                  requestBody: {
                    required: true,
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          required: ['email', 'password'],
                          properties: {
                            email: { type: 'string', format: 'email', example: 'user@example.com' },
                            password: { type: 'string', example: 'password123' },
                            role: { type: 'string', enum: ['ADMIN', 'ORGANIZER', 'ATTENDEE'], default: 'ATTENDEE' }
                          }
                        }
                      }
                    }
                  },
                  responses: {
                    '201': {
                      description: 'User created successfully'
                    },
                    '400': {
                      description: 'Invalid input'
                    },
                    '409': {
                      description: 'User already exists'
                    }
                  }
                }
              },
              '/login': {
                post: {
                  summary: 'User authentication',
                  description: 'Login with email and password',
                  requestBody: {
                    required: true,
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          required: ['email', 'password'],
                          properties: {
                            email: { type: 'string', format: 'email', example: 'user@example.com' },
                            password: { type: 'string', example: 'password123' }
                          }
                        }
                      }
                    }
                  },
                  responses: {
                    '200': {
                      description: 'Login successful'
                    },
                    '401': {
                      description: 'Invalid credentials'
                    }
                  }
                }
              },
              '/events': {
                get: {
                  summary: 'Get all events',
                  description: 'Retrieve all approved events (all events for admins)',
                  security: [{ bearerAuth: [] }],
                  responses: {
                    '200': {
                      description: 'Events retrieved successfully'
                    },
                    '401': {
                      description: 'Unauthorized'
                    }
                  }
                },
                post: {
                  summary: 'Create event',
                  description: 'Create a new event (Organizer and Admin only)',
                  security: [{ bearerAuth: [] }],
                  requestBody: {
                    required: true,
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          required: ['title', 'description', 'date', 'location'],
                          properties: {
                            title: { type: 'string', example: 'Tech Conference 2024' },
                            description: { type: 'string', example: 'Annual technology conference' },
                            date: { type: 'string', format: 'date-time', example: '2024-12-15T09:00:00Z' },
                            location: { type: 'string', example: 'Convention Center' }
                          }
                        }
                      }
                    }
                  },
                  responses: {
                    '201': {
                      description: 'Event created successfully'
                    },
                    '403': {
                      description: 'Insufficient permissions'
                    }
                  }
                }
              }
            },
            components: {
              securitySchemes: {
                bearerAuth: {
                  type: 'http',
                  scheme: 'bearer',
                  bearerFormat: 'JWT'
                }
              }
            },
            security: [{ bearerAuth: [] }]
          };

          SwaggerUIBundle({
            spec: spec,
            dom_id: '#swagger-ui',
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIBundle.presets.auth
            ],
            layout: 'BaseLayout'
          });
        </script>
      </body>
    </html>
    `;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(swaggerHtml);
    return;
  }

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

  // [KEEP ALL YOUR EXISTING ROUTES EXACTLY AS THEY ARE]
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

  // [KEEP ALL YOUR OTHER ROUTES EXACTLY AS THEY WERE]
  // Get All Events
  if (req.method === 'GET' && req.url === '/events') {
    console.log('🎯 GET /events endpoint hit');
    
    try {
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

      const where = decoded.role === 'ADMIN' ? {} : { approved: true };
      console.log('🔍 Query filter:', JSON.stringify(where));

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
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Failed to fetch events',
        message: error.message
      }));
    }
    return;
  }

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

  // [KEEP ALL YOUR OTHER ROUTES - they should work exactly as before]

  // Not found
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('🎉 SERVER RUNNING WITH SWAGGER DOCS!');
  console.log('📍 http://localhost:' + PORT);
  console.log('📚 Swagger Docs: http://localhost:' + PORT + '/swagger');
  console.log('🔌 WebSocket: ws://localhost:' + PORT);
  console.log('\n✅ KEY ENDPOINTS:');
  console.log('   GET  /health');
  console.log('   GET  /swagger');
  console.log('   GET  /test-db');
  console.log('   POST /signup');
  console.log('   POST /login');
  console.log('   GET  /events');
  console.log('   POST /events');
});