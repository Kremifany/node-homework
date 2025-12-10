const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

const create = (req, res) => {
  if (!req.body) req.body = {};
  const {error, value} = taskSchema.validate(req.body, {abortEarly: false})
    if(error) return res.status(400).json({message: error.message});
    const newTask = {...value, id: taskCounter(), userId: global.user_id.email,isCompleted: false};
    global.tasks.push(newTask);
    const { userId, ...sanitizedTask } = newTask;// make a copy without userId 
// we don't send back the userId! This statement removes it.
    res.status(201).json(sanitizedTask);
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

const index = (req,res) => {
    const userTasks = global.tasks.filter((task) => task.userId === global.user_id.email)
    if(!userTasks||userTasks.length===0){
        //console.log("No tasks found for user ", global.user_id.email);
        return res.status(404).json( { message : "No tasks were find for logged in user" }); // return empty array if no tasks found
    }
    const sanitizedTasks = userTasks.map(({userId, ...taskWithoutUserId}) => taskWithoutUserId);
    console.log("Returning tasks for user ", global.user_id.email, sanitizedTasks);
    res.json(sanitizedTasks);
}

const update = (req,res) => {
    const taskIdToUpdate = parseInt(req.params?.id);
    if (!taskIdToUpdate) {
      return res.status(400).json({message: "The task ID passed is not valid."})
    }
    const {error, value} = patchTaskSchema.validate(req.body, {abortEarly: false})
    if(error) return res.status(400).json({message: error.message});
    const taskIndex = global.tasks.findIndex((task) => task.id === taskIdToUpdate && task.userId === global.user_id.email);
    if (taskIndex === -1) {
      return res.status(StatusCodes.NOT_FOUND).json({message: "That task was not found or user not owns it"});
    }
    Object.assign(global.tasks[taskIndex], value)
    // const updatedTask = { ..., ...req.body, userId: global.user_id.email };
    // global.tasks[taskIndex] = updatedTask;
    const { userId, ...sanitizedTask } = global.tasks[taskIndex];
    res.json(sanitizedTask);  
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
