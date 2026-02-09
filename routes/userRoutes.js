const express = require("express");

const router = express.Router();
const { register, logon, logoff, show, googleLogon } = require("../controllers/userController");
const jwtMiddleware = require("../middleware/jwtMiddleware");


router.route("/register").post(register);

router.route("/logon").post(logon);

router.route("/googleLogon").post(googleLogon)

router.use(jwtMiddleware);

router.route("/logoff").post(logoff);

router.route("/:id").get(show);

module.exports = router;