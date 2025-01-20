const express = require("express");
const cors = require("cors");
const path = require("path");
const dbConfig = require("./app/config/db.config");

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
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; font-src 'self' data: https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; img-src 'self' data:;"
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

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Serve static files from the pages directory
app.use(express.static(path.join(__dirname, 'app/pages')));

// Serve static assets from the assets directory
app.use('/assets', express.static(path.join(__dirname, 'app/assets')));

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

// simple route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'app/pages/login.html'));
});

// routes
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);

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
