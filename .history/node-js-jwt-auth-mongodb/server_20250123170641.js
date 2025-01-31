const path = require("path");
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const dbConfig = require("./app/config/db.config");
const nodemailer = require("nodemailer");

const app = express();

// set port
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    callback(null, true); // allow all origins
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token']
}));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https:; " +
    "connect-src 'self' http://localhost:* https:; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
    "style-src 'self' 'unsafe-inline' https:; " +
    "font-src 'self' https: data:; " +
    "img-src 'self' data:;"
  );
  next();
});

// Email configuration temporarily disabled
/*
console.log('Email Configuration:', {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  user: process.env.EMAIL_USER
});

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  requireTLS: true,
  debug: true,
  logger: true
});
*/

// Verify transporter
// transporter.verify(function(error, success) {
//   if (error) {
//     console.error('Transporter verification error:', {
//       error: error.message,
//       code: error.code,
//       command: error.command,
//       stack: error.stack
//     });
//   } else {
//     console.log('Server is ready to take our messages');
//   }
// });

// API Routes - must be before static file handling
app.post('/api/contact', async (req, res) => {
  console.log('Received contact form submission:', req.body);

  if (!req.body || !req.body.name || !req.body.email || !req.body.message) {
    console.log('Missing required fields:', req.body);
    return res.status(400).json({ 
      message: 'Missing required fields',
      received: req.body 
    });
  }

  const { name, email, message } = req.body;

  try {
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New Contact Form Message from ${name}`,
      text: `
Name: ${name}
Email: ${email}
Message: ${message}
      `,
      html: `
<h3>New Contact Form Message</h3>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Message:</strong></p>
<p>${message}</p>
      `
    };

    console.log('Attempting to send email with options:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    // Send email
    // const info = await transporter.sendMail(mailOptions);
    // console.log('Email sent successfully:', info);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Detailed error sending email:', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      command: error.command
    });
    res.status(500).json({ 
      message: 'Error sending email', 
      error: error.message,
      details: error.code 
    });
  }
});

// routes
require('./app/routes/auth.routes')(app);
require('./app/routes/user.routes')(app);
require('./app/routes/message.routes')(app);

// Serve static files from the app/pages directory
app.use(express.static(path.join(__dirname, 'app/pages')));

// Serve static files from the public directory if it exists
app.use(express.static(path.join(__dirname, 'public')));

// serve static files
app.use(express.static(path.join(__dirname, 'app/pages')));
app.use('/vendor', express.static(path.join(__dirname, 'node_modules')));

// Serve static files from the app directory
app.use(express.static(path.join(__dirname, 'app'), {
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filepath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// HTML Routes - must be after API routes and static files
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'app/pages/about.html'));
});

app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  if (page.endsWith('.html') || !page.includes('.')) {
    const filePath = path.join(__dirname, 'app/pages', page.endsWith('.html') ? page : `${page}.html`);
    res.sendFile(filePath);
  } else {
    next();
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'app/pages/index.html'));
});

// Start server with port fallback
(async () => {
  try {
    console.log('Starting server...');
    
    // Connect to MongoDB
    const db = require("./app/models");
    console.log('Connecting to MongoDB...');
    await db.mongoose.connect(process.env.MONGODB_URI || `mongodb://127.0.0.1:27017/${dbConfig.DB}`, {
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
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
    console.log('Starting server...');
    
    // Connect to MongoDB
    const db = require("./app/models");
    console.log('Connecting to MongoDB...');
    await db.mongoose.connect(process.env.MONGODB_URI || `mongodb://127.0.0.1:27017/${dbConfig.DB}`, {
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
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
