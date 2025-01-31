const db = require("../models");
const User = db.user;

exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.userBoard = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate("roles", "-__v");
    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    const authorities = user.roles.map(role => "ROLE_" + role.name.toUpperCase());

    res.status(200).send({
      id: user._id,
      username: user.username,
      email: user.email,
      street: user.street,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode,
      phoneNumber: user.phoneNumber,
      roles: authorities
    });
  } catch (err) {
    console.error("Error in userBoard:", err);
    res.status(500).send({ message: err.message });
  }
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

exports.moderatorBoard = (req, res) => {
  res.status(200).send("Moderator Content.");
};

exports.updateProfile = async (req, res) => {
  try {
    console.log("Updating profile for user:", req.userId);
    console.log("Update data:", req.body);

    // Validate request body
    const { street, city, state, zipCode, phoneNumber } = req.body;
    if (!street && !city && !state && !zipCode && !phoneNumber) {
      return res.status(400).send({ message: "No update data provided" });
    }

    // Build update object with only provided fields
    const updates = {};
    if (street !== undefined) updates.street = street;
    if (city !== undefined) updates.city = city;
    if (state !== undefined) updates.state = state;
    if (zipCode !== undefined) updates.zipCode = zipCode;
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;

    // Find and update the user
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true }
    ).populate("roles", "-__v");

    if (!user) {
      console.log("User not found:", req.userId);
      return res.status(404).send({ message: "User not found." });
    }

    console.log("User updated successfully:", user);

    // Get roles
    const authorities = user.roles.map(role => "ROLE_" + role.name.toUpperCase());

    // Send response
    res.status(200).send({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        street: user.street,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        phoneNumber: user.phoneNumber,
        roles: authorities
      }
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).send({ message: err.message });
  }
};

// Add search functionality
exports.searchUsers = async (req, res) => {
  try {
    const query = {};
    
    // Add search conditions based on provided parameters
    if (req.query.street) {
      query.street = { $regex: req.query.street, $options: 'i' };
    }
    if (req.query.city) {
      query.city = { $regex: req.query.city, $options: 'i' };
    }
    if (req.query.state) {
      query.state = { $regex: req.query.state, $options: 'i' };
    }
    if (req.query.zipCode) {
      query.zipCode = { $regex: req.query.zipCode, $options: 'i' };
    }

    const users = await User.find(query)
      .select('-password') // Exclude password from results
      .limit(20); // Limit results for performance

    res.status(200).send(users);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get list of users for messaging
exports.getUsers = async (req, res) => {
  try {
    // Get current user ID from token
    const currentUserId = req.userId;
    
    // Find all users except the current user
    const users = await User.find(
      { _id: { $ne: currentUserId } },
      'username email'
    );
    
    res.status(200).send(users);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
