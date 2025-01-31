const { authJwt } = require("../utils");
const controller = require("../controllers/message.controller");

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    app.post(
        "/api/messages/send",
        [authJwt.verifyToken],
        controller.sendMessage
    );

    app.get(
        "/api/messages",
        [authJwt.verifyToken],
        controller.getMessages
    );

    app.get(
        "/api/messages/:id",
        [authJwt.verifyToken],
        controller.getMessage
    );

    app.put(
        "/api/messages/:id/read",
        [authJwt.verifyToken],
        controller.markAsRead
    );
};
