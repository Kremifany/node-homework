const express = require("express");

const router = express.Router();

const { getUserAnalytics }  = require("../controllers/analyticsController");
const { getUsersWithStats } = require("../controllers/analyticsController");
const { searchTasks } = require ("../controllers/analyticsController");


router.route("/users").get(getUsersWithStats);
router.route("/users/:id").get(getUserAnalytics);
router.route("/tasks/search").get(searchTasks);

module.exports = router;