
const StatusCodes = require("http-status-codes")
const { userSchema } = require("../validation/userSchema")
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
// const pool = require("../db/pg-pool");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

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
  const {error, value} = userSchema.validate(req.body, {abortEarly: false})
  if(error){ return res.status(400).json({
    message: "Validation failed",
    details: error.details,
  });
  }
  let user = null;
  const hashedPassword = await hashPassword(value.password);
  value.password = null; // remove plain password
  const name = value.name;
  const email = value.email;

try {
  user = await prisma.user.create({
    data: { name, email, hashedPassword },
    select: { name: true, email: true, id: true} // specify the column values to return
  });
  global.user_id = user.id;
    console.log("status 201 - user created: ", user);
    return  res.status(StatusCodes.CREATED).json({
      name: user.name,
      email: user.email
    });
} catch (err) {
    if (err.name === "PrismaClientKnownRequestError" && err.code == "P2002") {
      // send the appropriate error back -- the email was already registered
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "That email is already registered." });
    } else {
      return next(err); // the error handler takes care of other erors
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
        const storedHash = user.hashedPassword || user.hashed_password;
        if (!storedHash) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Authentication Failed (No password set)" });
        }
          const isMatch = await comparePassword(password, storedHash)
          if(isMatch) {
            global.user_id = user.id;
            console.log("Authentication succesfull: ", user);
            return res
            .status(StatusCodes.OK)
            .json({ name : user.name,  email : user.email});
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
    global.user_id = null;
    res.sendStatus(200)
}

module.exports = { register, logon, logoff };