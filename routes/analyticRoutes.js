const express = require("express");

const router = express.Router();
const { userProductivity }  = require("../controllers/analyticController");
const { usersTaskStats } = require("../controllers/analyticController");

router.route("/users").get(usersTaskStats);
router.route("/users/:id").get(userProductivity);

module.exports = router;