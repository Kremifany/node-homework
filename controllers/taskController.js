const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const pool = require("../db/pg-pool");

const create = async (req, res) => {
  if (!req.body) req.body = {};
  const {error, value} = taskSchema.validate(req.body, {abortEarly: false})
    if(error) return res.status(400).json({message: error.message});
  const task  = await pool.query(`INSERT INTO tasks (title, is_completed, user_id)
  VALUES ( $1, $2, $3 ) RETURNING id, title, is_completed`,
  [value.title, value.isCompleted, global.user_id]);
    return res.status(201).json(task.rows[0]);
}


const deleteTask = async (req,res) => {
    const taskToFind = parseInt(req.params?.id); // if there are no params, the ? makes sure that you
//if task Id was not sent             // get a null
if (!taskToFind) {
  return res.status(400).json({message: "The task ID passed is not valid."})
}
 const userTasks = await pool.query("SELECT id, title, is_completed FROM tasks WHERE user_id = $1",
  [global.user_id]
)
// console.log(userTasks);
const taskExists = userTasks.rows.find(task => task.id === taskToFind);
if(!taskExists){
  return res.status(StatusCodes.NOT_FOUND).json({message: "That task was not found or user not owns it"});
}   
const taskDeleted = await pool.query("DELETE FROM tasks WHERE id = $1",[taskToFind])
return res.json(taskDeleted);;
}
// const taskIndex = global.tasks.findIndex((task) => task.id === taskToFind && task.userId === global.user_id.email);
// // we get the index, not the task, so that we can splice it out
// if (taskIndex === -1) { // if no such task or not logged in user owns it
//   return res.status(StatusCodes.NOT_FOUND).json({message: "That task was not found or user not owns it"}); 
//   // else it's a 404.
// }

// const task = { userId: global.user_id.email, ...global.tasks[taskIndex] }; //creates task to return in response
// global.tasks.splice(taskIndex, 1); // do the delete
// return res.json(task); // return the entry just deleted.  The default status code, OK, is returned
// }


// Get all tasks for logged in user
const index = async(req,res) => {

  const userTasks = await pool.query("SELECT id, title, is_completed FROM tasks WHERE user_id = $1",
  [global.user_id]
);
    if(!userTasks.rows||userTasks.rows.length===0){
        return res.status(404).json( { message : "No tasks were find for logged in user" }); // return empty array if no tasks found
    }
    return res.json(userTasks.rows);
}


const update = async (req,res) => {  if (!req.body) req.body = {};
  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error)
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });

  const taskIdToUpdate = parseInt(req.params?.id); // if there are no params, the ? makes sure that you
  if (!taskIdToUpdate) {
    return res
      .status(404)
      .json({ message: "The task ID passed is not valid." });
  }

  const oldKeys = Object.keys(value);
  const keys = oldKeys.map((key) =>
    key === "isCompleted" ? "is_completed" : key
  );
  const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
  const idParm = `$${keys.length + 1}`;
  const userParm = `$${keys.length + 2}`;
  const updatedTask = await pool.query(
    `UPDATE tasks SET ${setClauses} 
  WHERE id = ${idParm} AND user_id = ${userParm} RETURNING id, title, is_completed`,
    [...Object.values(value), req.params.id, global.user_id]
  );
  if (updatedTask.rowCount === 0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "That task was not found or user not owns it" });
  }
  return res.json(updatedTask.rows[0]);
}   

const show = async (req,res) => {
    const taskIdToShow = parseInt(req.params?.id);
    if (!taskIdToShow) {
      return res.status(400).json({message: "The task ID passed is not valid."})
    }
    const task = await pool.query("SELECT id, title, is_completed FROM tasks WHERE id = $1 AND user_id = $2",
    [taskIdToShow, global.user_id]);
    if(task.rows.length === 0){
      return res.status(StatusCodes.NOT_FOUND).json({message: "That task was not found or user not owns it"});
    }
    return res.json(task.rows[0]);  
}


module.exports = { create, deleteTask, index, update, show };
