const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
  try {
    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      street: req.body.street || "",
      city: req.body.city || "",
      state: req.body.state || "",
      zipCode: req.body.zipCode || "",
      phoneNumber: req.body.phoneNumber || ""
    });

    // Save the user
    const savedUser = await user.save();

    if (req.body.roles) {
      const roles = await Role.find({ name: { $in: req.body.roles } });
      savedUser.roles = roles.map(role => role._id);
      await savedUser.save();
    } else {
      const role = await Role.findOne({ name: "user" });
      savedUser.roles = [role._id];
      await savedUser.save();
    }

    res.send({ message: "User was registered successfully!" });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error registering user." });
  }
};

exports.signin = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username })
      .populate("roles", "-__v");

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!"
      });
    }

    const token = jwt.sign({ id: user.id },
      config.secret,
      {
        algorithm: 'HS256',
        expiresIn: 86400 // 24 hours
      });

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
      roles: authorities,
      accessToken: token
    });
  } catch (err) {
    res.status(500).send({ message: err.message || "Error during login." });
  }
};
