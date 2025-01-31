const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const config = require('./app/config/db.config.js');

const url = `mongodb://${config.HOST}:${config.PORT}/${config.DB}`;

// Role model
const Role = mongoose.model(
  "Role",
  new mongoose.Schema({
    name: String
  })
);

// User model
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role"
      }
    ]
  })
);

async function initDB() {
  try {
    await mongoose.connect(url);
    console.log("Connected to MongoDB.");

    // Clear existing roles and users
    await Role.deleteMany({});
    await User.deleteMany({});

    // Create roles
    const roles = await Role.insertMany([
      { name: "user" },
      { name: "admin" }
    ]);
    console.log("Added roles to database");

    // Create test user
    const user = new User({
      username: "test",
      email: "test@example.com",
      password: bcrypt.hashSync("test123", 8),
    });

    // Assign user role
    const userRole = roles.find(role => role.name === "user");
    user.roles = [userRole._id];

    await user.save();
    console.log("Added test user to database");
    console.log("Test user credentials:");
    console.log("Username: test");
    console.log("Password: test123");

    await mongoose.disconnect();
    console.log("Database initialization complete.");
  } catch (err) {
    console.error("Error:", err);
  }
}

initDB();
