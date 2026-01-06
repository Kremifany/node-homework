const express = require("express");

const router = express.Router();
const { userProductivity }  = require("../controllers/analyticsController");
const { usersTaskStats } = require("../controllers/analyticsController");

router.route("/users").get(usersTaskStats);
router.route("/users/:id").get(userProductivity);

module.exports = router;