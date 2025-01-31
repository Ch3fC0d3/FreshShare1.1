const db = require("../models");
const Message = db.message;
const User = db.user;

// Send a new message
exports.sendMessage = async (req, res) => {
    try {
        const { recipient, content } = req.body;

        // Find recipient user
        const recipientUser = await User.findOne({ username: recipient });
        if (!recipientUser) {
            return res.status(404).send({ message: "Recipient not found." });
        }

        // Create new message
        const message = new Message({
            sender: req.userId,
            recipient: recipientUser._id,
            content: content,
            timestamp: new Date(),
            read: false
        });

        await message.save();

        res.status(200).send({ message: "Message sent successfully!" });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// Get all messages for current user
exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.userId },
                { recipient: req.userId }
            ]
        })
        .populate('sender', 'username')
        .populate('recipient', 'username')
        .sort({ timestamp: -1 });

        res.status(200).send(messages);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// Get a specific message
exports.getMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id)
            .populate('sender', 'username')
            .populate('recipient', 'username');

        if (!message) {
            return res.status(404).send({ message: "Message not found." });
        }

        // Check if user has permission to view this message
        if (message.sender.toString() !== req.userId && 
            message.recipient.toString() !== req.userId) {
            return res.status(403).send({ message: "Access denied." });
        }

        res.status(200).send(message);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).send({ message: "Message not found." });
        }

        // Check if user is the recipient
        if (message.recipient.toString() !== req.userId) {
            return res.status(403).send({ message: "Access denied." });
        }

        message.read = true;
        await message.save();

        res.status(200).send({ message: "Message marked as read." });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};
