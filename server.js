const path = require("path");
require('dotenv').config();
console.log('Email User:', process.env.EMAIL_USER);
console.log('Email Pass exists:', !!process.env.EMAIL_PASS);
const express = require("express");
const cors = require("cors");
const dbConfig = require("./app/config/db.config");
const sgMail = require('@sendgrid/mail');
const jwt = require("jsonwebtoken");
const db = require("./app/models");
const User = db.user;

const app = express();

// parse requests of content-type - application/json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// set port - force 3001 for development
const PORT = 3001;

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    callback(null, true); // allow all origins
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token']
}));

// Content Security Policy middleware
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https:; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; " +
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net data:; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' http://localhost:* https:; " +
    "frame-src 'self'"
  );
  next();
});

// Serve static files from app/pages directory
app.use(express.static(path.join(__dirname, 'app', 'pages'), {
    setHeaders: function (res, filepath) {
        if (filepath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
        // Set correct MIME types for CSS and JS files
        if (filepath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (filepath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// HTML Routes - must be before the catch-all route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'pages', 'index.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'pages', 'contact.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'pages', 'about.html'));
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['x-access-token'] || req.headers['authorization'];
  
  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  const tokenString = token.replace('Bearer ', '');

  jwt.verify(tokenString, process.env.JWT_SECRET || "your-secret-key", (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    req.userId = decoded.id;
    next();
  });
};

// Profile endpoint
app.get('/api/user/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }
    res.status(200).send(user);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// Routes for authentication pages
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'pages', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'pages', 'signup.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'pages', 'dashboard.html'));
});

// API Routes
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    console.log('Contact form submission:', { name, email, subject });

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email credentials not found in environment');
      return res.status(500).json({ message: 'Email service not properly configured' });
    }

    sgMail.setApiKey(process.env.EMAIL_PASS);

    // Create email content
    const msg = {
      to: process.env.EMAIL_USER,
      from: {
        name: 'FreshShare Contact',
        email: process.env.EMAIL_USER
      },
      subject: `Contact Form: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    };

    console.log('Attempting to send email to:', msg.to);
    
    // Send email
    await sgMail.send(msg);
    console.log('Email sent successfully');
    res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending email:', {
      message: error.message,
      code: error.code,
      response: error.response
    });
    res.status(500).json({ 
      message: 'Failed to send message',
      error: error.message,
      details: error.response || error.code
    });
  }
});

// Load routes
require('./app/routes/auth.routes')(app);
require('./app/routes/user.routes')(app);
require('./app/routes/message.routes')(app);

// Serve the marketplace page
app.get('/marketplace', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'pages', 'shopping.html'));
});

// Handle all other routes - serve index.html for client-side routing
app.get('*', (req, res) => {
    if (req.path.includes('.')) {
        res.status(404).send('Not found');
    } else {
        res.sendFile(path.join(__dirname, 'app', 'pages', 'index.html'));
    }
});

// Connect to MongoDB and start server
const initializeServer = async () => {
    const db = require("./app/models");
    db.mongoose.set('strictQuery', true);
    
    console.log('Connecting to MongoDB...');
    try {
        await db.mongoose.connect(process.env.MONGODB_URI || `mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        console.log('Successfully connected to MongoDB.');

        // Initialize roles
        const Role = db.role;
        const count = await Role.estimatedDocumentCount();
        if (count === 0) {
            await Promise.all([
                new Role({ name: "user" }).save(),
                new Role({ name: "moderator" }).save(),
                new Role({ name: "admin" }).save()
            ]);
            console.log("Added default roles");
        }

        // Start the Express server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};

// Start the server
initializeServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
