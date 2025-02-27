const path = require("path");
require('dotenv').config();
console.log('Email User:', process.env.EMAIL_USER);
console.log('Email Pass exists:', !!process.env.EMAIL_PASS);
const express = require("express");
const cors = require("cors");
const dbConfig = require("./app/config/db.config");
const sgMail = require('@sendgrid/mail');
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');
const db = require("./app/models");
const User = db.user;
const expressLayouts = require('express-ejs-layouts');

const app = express();

// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/layout');
app.use(expressLayouts);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Use cookie parser
app.use(cookieParser());

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

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    // For web routes, if no token redirect to login
    if (req.path.startsWith('/api/')) {
        // API routes use token from headers
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
    } else {
        // Web routes use session/cookie
        const token = req.cookies?.token || req.headers['x-access-token'] || req.headers['authorization'];
        
        if (!token) {
            return res.redirect('/login');
        }

        const tokenString = token.replace('Bearer ', '');

        jwt.verify(tokenString, process.env.JWT_SECRET || "your-secret-key", (err, decoded) => {
            if (err) {
                return res.redirect('/login');
            }
            req.userId = decoded.id;
            next();
        });
    }
};

// Middleware to make user data available to all views
app.use(async (req, res, next) => {
    const token = req.cookies?.token || req.headers['x-access-token'] || req.headers['authorization'];
    
    if (token) {
        const tokenString = token.replace('Bearer ', '');
        try {
            const decoded = jwt.verify(tokenString, process.env.JWT_SECRET || "your-secret-key");
            const user = await User.findById(decoded.id);
            res.locals.user = user;
        } catch (err) {
            res.locals.user = null;
        }
    } else {
        res.locals.user = null;
    }
    next();
});

// Routes
require('./app/routes/auth.routes')(app);
require('./app/routes/user.routes')(app);
require('./app/routes/message.routes')(app);

// Dashboard route
app.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate("roles", "-__v");
    if (!user) {
      return res.redirect('/login');
    }
    
    res.render('pages/dashboard', {
      title: 'Dashboard - Fresh Share',
      user: {
        username: user.username,
        email: user.email,
        roles: user.roles.map(role => role.name)
      },
      layout: 'layouts/layout'
    });
  } catch (err) {
    console.error('Error rendering dashboard:', err);
    res.redirect('/login');
  }
});

// HTML Routes - must be before the catch-all route
app.get('/', (req, res) => {
    res.render('pages/index', { 
        title: 'FreshShare - Share Fresh Food with Your Community',
        user: req.user,
        layout: 'layouts/layout'
    });
});

app.get('/login', (req, res) => {
    if (req.user) {
        return res.redirect('/dashboard');
    }
    res.render('pages/login', { 
        title: 'Login - FreshShare',
        user: null,
        layout: 'layouts/layout'
    });
});

app.get('/signup', (req, res) => {
    if (req.user) {
        return res.redirect('/dashboard');
    }
    res.render('pages/signup', { 
        title: 'Sign Up - FreshShare',
        user: null,
        layout: 'layouts/layout'
    });
});

app.get('/contact', (req, res) => {
    res.render('pages/contact', {
        title: 'Contact Us - FreshShare',
        user: req.user,
        layout: 'layouts/layout'
    });
});

app.get('/about', (req, res) => {
    res.render('pages/about', {
        title: 'About Us - FreshShare',
        user: req.user,
        layout: 'layouts/layout'
    });
});

app.get('/marketplace', (req, res) => {
    res.render('pages/marketplace', { 
        title: 'Marketplace - FreshShare',
        user: req.user,
        layout: 'layouts/layout'
    });
});

app.get('/community', (req, res) => {
    res.render('pages/community', { 
        title: 'Community - FreshShare',
        user: req.user,
        layout: 'layouts/layout'
    });
});

app.get('/forum', (req, res) => {
    res.render('pages/forum', {
        title: 'Community Forum - FreshShare',
        user: req.user,
        layout: 'layouts/layout'
    });
});

app.get('/groups', (req, res) => {
    res.render('pages/groups', {
        title: 'Groups - FreshShare',
        user: req.user,
        layout: 'layouts/layout'
    });
});

// Profile endpoint
app.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.redirect('/login');
        }
        res.render('pages/profile', {
            title: 'Profile - FreshShare',
            user: user,
            layout: 'layouts/layout'
        });
    } catch (err) {
        console.error('Error loading profile:', err);
        res.redirect('/login');
    }
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
require('./app/routes/message.routes')(app);

// Handle all other routes - serve index.html for client-side routing
app.get('*', (req, res) => {
    if (req.path.startsWith('/pages/')) {
        // Redirect /pages/something to /something
        res.redirect(req.path.replace('/pages/', '/'));
    } else if (req.path.includes('.')) {
        res.status(404).send('Not found');
    } else {
        res.render('pages/index', { 
            title: 'FreshShare - Share Fresh Food with Your Community',
            user: req.user,
            layout: 'layouts/layout'
        });
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
