const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const pool = require("../db/pg-pool");
const { object } = require("joi");

const create = async (req, res) => {
  if (!req.body) req.body = {};
  const {error, value} = taskSchema.validate(req.body, {abortEarly: false})
    if(error) return res.status(400).json({message: error.message});
  const task  = await pool.query(`INSERT INTO tasks (title, is_completed, user_id)
  VALUES ( $1, $2, $3 ) RETURNING id, title, is_completed`,
  [value.title, value.is_completed, global.user_id]);
    res.status(201).json(task);
}


const deleteTask = (req,res) => {
    const taskToFind = parseInt(req.params?.id); // if there are no params, the ? makes sure that you
//if task Id was not sent             // get a null
if (!taskToFind) {
  return res.status(400).json({message: "The task ID passed is not valid."})
}
const taskIndex = global.tasks.findIndex((task) => task.id === taskToFind && task.userId === global.user_id.email);
// we get the index, not the task, so that we can splice it out
if (taskIndex === -1) { // if no such task or not logged in user owns it
  return res.status(StatusCodes.NOT_FOUND).json({message: "That task was not found or user not owns it"}); 
  // else it's a 404.
}

const task = { userId: global.user_id.email, ...global.tasks[taskIndex] }; //creates task to return in response
global.tasks.splice(taskIndex, 1); // do the delete
return res.json(task); // return the entry just deleted.  The default status code, OK, is returned
}

const index = async(req,res) => {
  const userTasks = await pool.query("SELECT id, title, is_completed FROM tasks WHERE user_id = $1",
  [global.user_id]
)
    if(!userTasks||userTasks.length===0){
        return res.status(404).json( { message : "No tasks were find for logged in user" }); // return empty array if no tasks found
    }
    res.json(userTasks.rows);
}



const update = async (req,res) => {
    const taskIdToUpdate = parseInt(req.params?.id);
    if (!taskIdToUpdate) {
      return res.status(400).json({message: "The task ID passed is not valid."})
    }
    const {error, updates} = patchTaskSchema.validate(req.body, {abortEarly: false})
    if(error) return res.status(400).json({message: error.message});
const taskChange = new Map(Object.entries(updates));
const keys = taskChange.keys(updates);
const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
const idParm = `$${keys.length + 1}`;
const userParm = `$${keys.length + 2}`;
const updatedTask = await pool.query(`UPDATE tasks ${setClauses} 
  WHERE id = ${idParm} AND user_id = ${userParm} RETURNING id, title, is_completed`, 
  [...taskChange.values(), req.params.id, global.user_id]);



    res.json(updatedTask);  
}

const show = (req,res) => {
    const taskIdToShow = parseInt(req.params?.id);
    if (!taskIdToShow) {
      return res.status(400).json({message: "The task ID passed is not valid."})
    }
    const taskIndex = global.tasks.findIndex((task) => task.id === taskIdToShow && task.userId === global.user_id.email);
    if (taskIndex === -1) {
      return res.status(StatusCodes.NOT_FOUND).json({message: "That task was not found or user not owns it"});
    }
    const { userId, ...sanitizedTask } = global.tasks[taskIndex];
    res.json(sanitizedTask);  
}


module.exports = { create, deleteTask, index, update, show };
