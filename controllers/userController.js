
const StatusCodes = require("http-status-codes")
const { userSchema } = require("../validation/userSchema")
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const  prisma  = require("../db/prisma");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}


// Cookie flags for setting and clearing cookies
function cookieFlags(req) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only when HTTPS is available
    sameSite: "Strict",
  };
}

// how your JWT token generation and signing process:
//1. Create a payload that includes the user's ID, a CSRF token, and any roles the user has.
//2. Sign the JWT using a secret key stored in an environment variable, with an expiration time of 1 hour.
//3. Set the JWT as a cookie in the response, using appropriate cookie flags for security.
//4. Return the CSRF token to the client in the response body for use in subsequent requests.

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
// Use a transaction to create the user and the welcome tasks atomically
// This ensures that either both the user and tasks are created, or neither are, maintaining data integrity
// Also, it reduces the number of database calls
// Note: Prisma transactions can be used with async/await as shown below
// See https://www.prisma.io/docs/concepts/components/prisma-client/transactions for more details
// Here we create the user, then create the welcome tasks, and finally return both the user and the created tasks
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

// Set JWT cookie and return response with CSRF token and user info 
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
//GOOGLE LOGON FUNCTION
const googleLogon = async (req, res, next) => {
  if (!req.body || !req.body.code) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "Authorization code is required." });
  }
  const code = req.body.code;
  try {
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    const { tokens } = await client.getToken(code);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email?.trim();
    if (!email) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Google did not provide an email. Please grant email permission and try again.",
      });
    }
    const normalizedEmail = email.toLowerCase();
    const name = (payload.name || "User").trim();

    // Check if user already exists
    let existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    
    if (existingUser) {
      // User exists - just log them in (like simple logon)
      const csrfToken = setJwtCookie(req, res, existingUser);
      return res.status(StatusCodes.OK).json({
        name: existingUser.name,
        email: existingUser.email,
        roles: existingUser.roles,
        csrfToken: csrfToken,
      });
    }

    // New user - create with transaction and welcome tasks (like register)
    const placeholderHash = "google-oauth-no-password";
    
    const result = await prisma.$transaction(async (tx) => {
      // Create user account
      const newUser = await tx.user.create({
        data: { email: normalizedEmail, name, hashedPassword: placeholderHash },
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

    // Set JWT cookie and return response with CSRF token and user info
    // Response format matches register endpoint: { user, csrfToken, welcomeTasks, transactionStatus }
    const csrfToken = setJwtCookie(req, res, result.user);
    return res.status(StatusCodes.CREATED).json({
      csrfToken: csrfToken,
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: "success"
    });
  } catch (err) {
    return next(err);
  }
};
//LOG OFF FUNCTION
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

module.exports = { register, logon, logoff, show, googleLogon };