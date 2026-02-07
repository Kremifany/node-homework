const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const { querySchema } = require("../validation/querySchema");
const prisma  = require("../db/prisma");
const buildSelect = require("../utils/buildSelect");

//CREATE TASK
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
    data: { title, isCompleted, priority, userId : req.user.id },
    select: { id: true, title: true, isCompleted: true, priority: true } // specify the column values to return
  });
    return  res.status(StatusCodes.CREATED).json(task);
} catch (err) {
      return next(err);
  }
};

//DELETE TASK
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
      userId: req.user.id,
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

//INDEX TASKS
// Get all tasks for logged in user
const index = async(req,res,next) => { 
// Parse pagination parameters
console.log("Task Controller\n")


const { error, value} = querySchema.validate(req.query, {abortEarly: false, convert: true});
if(error) return res.status(400).json({message: error.message});
const { page , limit, find } = value;

const skip = (page - 1) * limit;
let selectFields = {};
// Build where clause with optional search filter
const whereClause = { userId: req.user.id };

  whereClause.title = {
    contains: find,        // Matches %find% pattern
    mode: 'insensitive'              // Case-insensitive search (ILIKE in PostgreSQL)
  };

if (req.query.fields) {
  selectFields = buildSelect(req.query.fields);
  if(!Object.keys(selectFields).every(key => ['id','title','isCompleted','priority','createdAt'].includes(key))) {
    return res.status(400).json({message: "Invalid field(s) in query parameters."})
  }
} else 
  {
  selectFields = { 
    id: true,
    title: true, 
    isCompleted: true,
    priority: true,
    createdAt: true,
  }
} 
// Get tasks with pagination and eager loading
try{
const tasks = await prisma.task.findMany({
  where: whereClause,
  select: { 
    ...selectFields,
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
if(tasks.length === 0) {
    return res.status(404).json({ message: "No tasks found."})
}

// Get total count for pagination metadata
const totalTasks = await prisma.task.count({
  where: whereClause
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
} catch (err) {
  if (err.code === "P2025" ) {
    return res.status(404).json({ message: "The task was not found."})
  } else {
    return next(err); // pass other errors to the global error handler
  } 
}
}


//UPDATE TASK
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
      userId: req.user.id,
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

//SHOW TASK
const show = async (req,res,next) => {
    const taskIdToShow = parseInt(req.params?.id);
    if (!taskIdToShow) {
      return res.status(400).json({message: "The task ID passed is not valid."})
    }
    try {
    const task = await prisma.task.findUnique({
    where: {
      id: taskIdToShow,
      userId: req.user.id,
    },
    select: { title: true, isCompleted: true, id: true,  User: {
      select: {
        name: true,
        email: true
      }
    } }});
    if (!task) {
      return res.status(404).json({ message: "The task was not found."})
    } 
  return res.json(task);
} catch (err) {
  if (err.code === "P2025" ) {
    return res.status(404).json({ message: "The task was not found."})
  } else {
    return next(err); // pass other errors to the global error handler
  }
} 
}

// Bulk create with validation
const bulkCreate = async (req, res, next) => {
  const { tasks } = req.body;

  // Validate the tasks array
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ 
      error: "Invalid request data. Expected an array of tasks." 
    });
  }

  // Validate all tasks before insertion
  const validTasks = [];
  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }
    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted || false,
      priority: value.priority || 'medium',
      userId: req.user.id
    });
  }

  // Use createMany for batch insertion
  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false
    });

    res.status(201).json({
      message: "success!",
      tasksCreated: result.count,
      totalRequested: validTasks.length
    });
  } catch (err) {
    return next(err);
  }
};

// Bulk update/delete specified by filter and specific ids of tasks

const bulkMutate = async (req, res, next) => {
  if (!req.body) req.body = {};
  const whereClause = { userId: req.user.id };
  const { isCompleted, priority } = req.query ?? {};//filters
  const { ids, ...data } = req.body;
  const isDelete = req.method === "DELETE";//determine if it's delete or update

  //filter by isCompleted
  if (isCompleted !== undefined) {
    if (!["true", "false"].includes(isCompleted)) {
      return res.status(400).json({ message: "Invalid isCompleted filter value." });
    }
    whereClause.isCompleted = isCompleted === "true";
  }
  //filter by priority
  if (priority !== undefined) {
    const allowedPriorities = ["low", "medium", "high"];
    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({ message: "Invalid priority filter value." });
    }
    whereClause.priority = priority;
  }

  if (ids !== undefined) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array is empty or not an array." });
    }
    //filter by ids
    whereClause.id = { in: ids };
  }

  if (!whereClause.id && isCompleted === undefined && priority === undefined) {
    return res.status(400).json({ message: "No filter criteria were provided for the bulk operation." });
  }

  try {
    if (isDelete) {
      const result = await prisma.task.deleteMany({ where: whereClause });
      if (!result.count) {
        return res.status(404).json({ message: "No tasks matched the supplied criteria." });
      }
      return res.status(200).json({ deleted: result.count });
    }

    const { patchTaskSchema } = require('../validation/taskSchema');

    const { error } = patchTaskSchema.validate(data, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: "Invalid update data.", details: error.details });
    }

    //BULK UPDATE 


    const result = await prisma.task.updateMany({ where: whereClause, data: data });
    if (!result.count) {
      return res.status(404).json({ message: "No tasks matched the supplied criteria." });
    }
    return res.status(200).json({ updated: result.count });
  } catch (err) {
    return next(err);
  }
};

module.exports = { create, deleteTask, index, update, show, bulkCreate, bulkMutate };
