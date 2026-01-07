const express = require("express");

const router = express.Router();

const { userProductivity }  = require("../controllers/analyticsController");
const { usersTaskStats } = require("../controllers/analyticsController");
const { taskSearch } = require ("../controllers/analyticsController");


router.route("/users").get(usersTaskStats);
router.route("/users/:id").get(userProductivity);
router.route("/tasks/search").get(taskSearch);

module.exports = router;