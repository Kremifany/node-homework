const express = require("express");

const router = express.Router();
const {create, index, deleteTask, update, show, bulkCreate } = require("../controllers/taskController");
const jwtMiddleware = require("../middleware/jwtMiddleware");

router.use(jwtMiddleware);

router.route("/").get(index);

router.route("/").post(create);

router.route("/bulk").post(bulkCreate);

router.route("/:id").delete(deleteTask);

router.route("/:id").patch(update); 

router.route("/:id").get(show);



module.exports = router;