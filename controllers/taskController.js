const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const prisma  = require("../db/prisma");

const create = async (req, res, next) => {
  if (!req.body) req.body = {};
  const {error, value} = taskSchema.validate(req.body, {abortEarly: false})
    if(error) return res.status(400).json({message: error.message});
  let task = null;
  const title = value.title;
  const isCompleted = value.isCompleted;
  const priority = value.priority;

try {
  task = await prisma.task.create({
    data: { title, isCompleted, priority, userId : global.user_id },
    select: { id: true, title: true, isCompleted: true, priority: true } // specify the column values to return
  });
    console.log("status 201 - task created: ", task);
    return  res.status(StatusCodes.CREATED).json(task);
} catch (err) {
      return next(err);
  }
};


const deleteTask = async (req,res,next) => {
    const taskToDelete = parseInt(req.params?.id); // if there are no params, the ? makes sure that you
//if task Id was not sent             // get a null
if (!taskToDelete) {
  return res.status(400).json({message: "The task ID passed is not valid."})
}

try {
const task = await prisma.task.delete({
    where: {
      id: taskToDelete,
      userId: global.user_id,
    },
    select: { title: true, isCompleted: true, priority: true, id: true }});
  return res.json(task);
} catch (err) {
  if (err.code === "P2025" ) {
    return res.status(404).json({ message: "The task was not found."})
  } else {
    return next(err); // pass other errors to the global error handler
  }
}
}

// Get all tasks for logged in user
const index = async(req,res) => { 
// Parse pagination parameters
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const skip = (page - 1) * limit;

// Get tasks with pagination and eager loading
const tasks = await prisma.task.findMany({
  where: { userId: global.user_id },
  select: { 
    id: true,
    title: true, 
    isCompleted: true,
    priority: true,
    createdAt: true,
    User: {
      select: {
        name: true,
        email: true
      }
    }
  },
  skip: skip,
  take: limit,
  orderBy: { createdAt: 'desc' }
});

// Get total count for pagination metadata
const totalTasks = await prisma.task.count({
  where: { userId: global.user_id }
});

const pagination = {
  page,//1
  limit,//10
  total: totalTasks,
  pages: Math.ceil(totalTasks / limit),
  hasNext: page * limit < totalTasks,
  hasPrev: page > 1
};

  // Return tasks with pagination information
  res.status(200).json({
  tasks,
  pagination
});
};

const update = async (req,res,next) => {  
  if (!req.body) req.body = {};
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
try {
const task = await prisma.task.update({
    data: value,
    where: {
      id: taskIdToUpdate,
      userId: global.user_id,
    },
    select: { title: true, isCompleted: true, priority: true, id: true }});
  return res.json(task);
} catch (err) {
  if (err.code === "P2025" ) {
    return res.status(404).json({ message: "The task was not found."})
  } else {
    return next(err); // pass other errors to the global error handler
  }
}  
}
const show = async (req,res,next) => {
    const taskIdToShow = parseInt(req.params?.id);
    if (!taskIdToShow) {
      return res.status(400).json({message: "The task ID passed is not valid."})
    }
    try {
    const task = await prisma.task.findUnique({
    where: {
      id: taskIdToShow,
      userId: global.user_id,
    },
    select: { title: true, isCompleted: true, id: true }});
  return res.json(task);
} catch (err) {
  if (err.code === "P2025" ) {
    return res.status(404).json({ message: "The task was not found."})
  } else {
    return next(err); // pass other errors to the global error handler
  }
}  
}


module.exports = { create, deleteTask, index, update, show };
