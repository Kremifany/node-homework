const express = require("express");

const router = express.Router();
const { register, logon, logoff, show } = require("../controllers/userController");
const jwtMiddleware = require("../middleware/jwtMiddleware");


router.route("/").post(register);

router.use(jwtMiddleware);

router.route("/logon").post(logon);

router.route("/logoff").post(logoff);

router.route("/:id").get(show);

module.exports = router;