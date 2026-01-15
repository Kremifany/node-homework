const express = require("express");

const router = express.Router();
const { register, logon, logoff, show } = require("../controllers/userController");

router.route("/").post(register);

router.route("/logon").post(logon);

router.route("/logoff").post(logoff);

router.route("/:id").get(show);

module.exports = router;