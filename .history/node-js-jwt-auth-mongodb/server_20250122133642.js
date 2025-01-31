require('dotenv').config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const dbConfig = require("./app/config/db.config");
const nodemailer = require("nodemailer");

const app = express();

// set port
const PORT = process.env.PORT || 3000;
var corsOptions = {
  origin: `http://localhost:${PORT}`
};

app.use(cors(corsOptions));

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "connect-src 'self' ws://127.0.0.1:* wss://127.0.0.1:*; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com https://cdn.jsdelivr.net; " +
    "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com; " +
    "img-src 'self' data:;"
  );
  next();
});

// Add CORS headers for all responses
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", corsOptions.origin);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// parse requests of content-type - application/json
app.use(express.json());
app.e
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

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

// Serve pages directly
app.use(express.static(path.join(__dirname, 'app/pages')));

// Route for about page
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'app/pages/about.html'));
});

// Route for all HTML pages
app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  if (page.endsWith('.html') || !page.includes('.')) {
    const filePath = path.join(__dirname, 'app/pages', page.endsWith('.html') ? page : `${page}.html`);
    res.sendFile(filePath);
  } else {
    next();
  }
});

// Handle root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'app/pages/index.html'));
});

const db = require("./app/models");
const Role = db.role;
const User = db.user;

db.mongoose
  .connect(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(async () => {
    console.log("Successfully connected to MongoDB.");
    
    // Ensure indexes are created
    try {
      await User.syncIndexes();
      console.log("Database indexes synchronized successfully");
    } catch (error) {
      console.error("Error synchronizing indexes:", error);
    }
    
    // Initialize roles
    initial();
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit();
  });

// routes
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);

// Contact form endpoint
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Create a transporter using SMTP
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",  // You'll need to update this with your SMTP server
      port: 587,
      secure: false,
      auth: {
        user: "your-email@gmail.com",  // Replace with your email
        pass: "your-app-password"      // Replace with your app password
      }
    });

    // Email content
    const mailOptions = {
      from: email,
      to: "gabriel@pellegini.us",
      subject: `New Contact Form Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <h3>New Contact Form Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <h4>Message:</h4>
        <p>${message}</p>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Message sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

// listen for requests
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

function initial() {
  Role.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      new Role({
        name: "user"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'user' to roles collection");
      });

      new Role({
        name: "moderator"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'moderator' to roles collection");
      });

      new Role({
        name: "admin"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'admin' to roles collection");
      });
    }
  });
}
