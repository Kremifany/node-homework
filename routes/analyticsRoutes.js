const express = require("express");

const router = express.Router();

const { getUserAnalytics }  = require("../controllers/analyticsController");
const { getUsersWithStats } = require("../controllers/analyticsController");
const { searchTasks } = require ("../controllers/analyticsController");
const roleMiddleware = require("../middleware/roleMiddleware");
const jwtMiddleware = require("../middleware/jwtMiddleware");

router.use(jwtMiddleware);
router.use(roleMiddleware);

router.route("/users").get(getUsersWithStats);
router.route("/users/:id").get(getUserAnalytics);
router.route("/tasks/search").get(searchTasks);

module.exports = router;