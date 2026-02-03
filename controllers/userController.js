
const StatusCodes = require("http-status-codes")
const { userSchema } = require("../validation/userSchema")
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const  prisma  = require("../db/prisma");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");


async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}



const cookieFlags = (req) => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only when HTTPS is available
    sameSite: "Strict",
  };
};

//how your JWT token generation and signing process:
const setJwtCookie = (req, res, user) => {
  // Sign JWT
  const payload = { id: user.id, csrfToken: randomUUID(), roles: user.roles || [] };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiration
  // Set cookie.  Note that the cookie flags have to be different in production and in test.
  res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 }); // 1 hour expiration
  return payload.csrfToken; // this is needed in the body returned by logon() or register()
};


async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
 }

// You can now modify logon() and register()each return an appropriate body with
// a name, an email, and the csrfToken, and so that they no longer reference a global user ID.
//REGISTER FUNCTION
const register =  async(req, res, next) => {
  if (!req.body) req.body = {};
  console.log("RAW BODY:",Object.entries(req.body).map(([k, v]) => [k, JSON.stringify(v), v?.length]));
  let isPerson = false;
  if (req.body.recaptchaToken) {
    const token = req.body.recaptchaToken;
    const params = new URLSearchParams();
    params.append("secret", process.env.RECAPTCHA_SECRET);
    params.append("response", token);
    params.append("remoteip", req.ip);
    const response = await fetch(
      // might throw an error that would cause a 500 from the error handler
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        body: params.toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    const data = await response.json();
    if (data.success) isPerson = true;
    delete req.body.recaptchaToken;
  } else if (
    process.env.RECAPTCHA_BYPASS &&
    req.get("X-Recaptcha-Test") === process.env.RECAPTCHA_BYPASS
  ) {
    // might be a test environment
    isPerson = true;
  }
  if (!isPerson) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "We can't tell if you're a person or a bot." });
  }
  const {error, value} = userSchema.validate(req.body, {abortEarly: false})
  if(error){ return res.status(400).json({
    message: "Validation failed",
    details: error.details,
  });
  }
  const hashedPassword = await hashPassword(value.password);
  value.password = null; // remove plain password
  const name = value.name;
  const email = value.email;
////
try {
  const result = await prisma.$transaction(async (tx) => {
    // Create user account (similar to Assignment 6, but using tx instead of prisma)
    const newUser = await tx.user.create({
      data: { email, name, hashedPassword },
      select: { id: true, email: true, name: true }
    });

    // Create 3 welcome tasks using createMany
    const welcomeTaskData = [
      { title: "Complete your profile", userId: newUser.id, priority: "medium" },
      { title: "Add your first task", userId: newUser.id, priority: "high" },
      { title: "Explore the app", userId: newUser.id, priority: "low" }
    ];
    await tx.task.createMany({ data: welcomeTaskData });

    // Fetch the created tasks to return them
    const welcomeTasks = await tx.task.findMany({
      where: {
        userId: newUser.id,
        title: { in: welcomeTaskData.map(t => t.title) }
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        userId: true,
        priority: true
      }
    });    
    return { user: newUser, welcomeTasks };
  });

  // // Store the user ID globally for session managem
  // // ent (not secure for production)
  // global.user_id = result.user.id;
  const csrfToken = setJwtCookie(req, res, result.user);
  // Send response with status 201
  res.status(201);
  res.json({
    csrfToken: csrfToken,
    user: result.user,
    welcomeTasks: result.welcomeTasks,
    transactionStatus: "success"
  });
  return;
} catch (err) {
  if (err.code === "P2002") {
    // send the appropriate error back -- the email was already registered
    return res.status(400).json({ error: "Email already registered" });
  } else {
    return next(err); // the error handler takes care of other errors
  }
}
}
//LOGON FUNCTION
const logon = async (req, res) => {
  
  if (!req.body) req.body = {};
    if (!req.body || !req.body.email || !req.body.password) {
      return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Email and password are required." });
    }
    
  const email = req.body.email.toLowerCase() // Joi validation always converts the email to lower case
                            // but you don't want logon to fail if the user types mixed case
  const user = await prisma.user.findUnique({ where: { email }});
                            // also Prisma findUnique can't do a case insensitive search
  
    const password = req.body.password;
    if (!user) {
      return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({message: "Authentication Failed"})
    }
    try{ 
      
    if(user){
        console.log("Found user for authentication: ", user);
        console.log("req.body.password: ", password);
        const storedHash = user?.hashedPassword || user?.hashed_password;
        if (!storedHash) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Authentication Failed (No password set)" });
        }
          const isMatch = await comparePassword(password, storedHash)
          if(isMatch) {
            const csrfToken = setJwtCookie(req, res, user);
            console.log("Authentication succesfull: ", user);
            return res
            .status(StatusCodes.OK)
            .json({ name : user.name,  email : user.email, roles: user.roles, csrfToken : csrfToken});
          }
        }
        return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({message: "Authentication Failed"})
   
      }catch(err){
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error processing logon."+err.message });
      }  
}

const logoff = (req, res) =>{
    res.clearCookie("jwt", cookieFlags(req))
    res.sendStatus(200)
}

const show = async (req, res) => {
  const userId = parseInt(req.params.id);
  
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      Task: {
        where: { isCompleted: false },
        select: { 
          id: true, 
          title: true, 
          priority: true,
          createdAt: true 
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json(user);
};

module.exports = { register, logon, logoff, show };