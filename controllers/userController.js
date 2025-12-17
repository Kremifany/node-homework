
const StatusCodes = require("http-status-codes")
const { userSchema } = require("../validation/userSchema")
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

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

const register =  async(req, res) => {
    if (!req.body) req.body = {};
    const {error, value} = userSchema.validate(req.body, {abortEarly: false})
    if(error) return res.status(400).json({message: error.message});

    const { password } = value;
    if (password) {
      try{  
        const hashedPassword = await hashPassword(password)
        if(hashedPassword){
          value.password = hashedPassword;
          console.log("value",value)
          console.log("Registering new user: ", value);
          global.users.push(value);
          global.user_id = value;  // After the registration step, the user is set to logged on.
          const { password, ...sanitizedUser } = value;
          console.log("Registered new user without password ", sanitizedUser);
          return res.status(201).json(sanitizedUser);
        }
      }
      catch(error){
        if (error instanceof Error) {
          console.error("Error hashing password:", error.message);
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error processing registration." });
        } else {
          const err = new Error("Unknown error during password hashing");   
          console.error("Error hashing password:", err);
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error processing registration." });
        };
      } 
    }
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "Password is required." });
}

const logon = async (req, res) => {
    const foundUser = global.users.find((el) => req.body.email === el.email )
    try{ 
    if(foundUser){
        console.log("Found user for authentication: ", foundUser);
        console.log("req.body.password", req.body.password);
        
          const isMatch = await comparePassword(req.body.password, foundUser.password)
          if(isMatch) {
            global.user_id = foundUser;
            console.log("Authentication succesfull: ", foundUser);
            return res.status(StatusCodes.OK).json({"name": foundUser.name, "email": foundUser.email});
            }else{
            return res.status(StatusCodes.UNAUTHORIZED).json({message: "Authentication Failed"})
            }
       
       
      }else{
        return res.status(StatusCodes.UNAUTHORIZED).json({message: "Authentication Failed"})
    }
      }catch{
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error processing logon." });
         }
}   

const logoff = (req, res) =>{
    global.user_id = null;
    res.sendStatus(200)
}

module.exports = { register, logon, logoff };