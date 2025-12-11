
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

const register =  (req, res) => {
    if (!req.body) req.body = {};
    const {error, value} = userSchema.validate(req.body, {abortEarly: false})
    if(error) return res.status(400).json({message: error.message});

    const { password } = value;
    if (password) {
      hashPassword(password)
        .then((hashedPassword) => {
          value.password = hashedPassword;
          console.log("value",value)
          console.log("Registering new user: ", value);
          global.users.push(value);
          global.user_id = value;  // After the registration step, the user is set to logged on.
          const { password, ...sanitizedUser } = value;
          console.log("Registered new user without password ", sanitizedUser);
          return res.status(201).json(sanitizedUser);
        })
        .catch((err) => {
          console.error("Error hashing password:", err);
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error processing registration." });
        });
    }
    
    
}

const logon = (req, res) => {
    const foundUser = global.users.find((el) => req.body.email === el.email )
    
    if(foundUser){
        console.log("Found user for authentication: ", foundUser);
        console.log("req.body.password", req.body.password);
        comparePassword(req.body.password, foundUser.password)
         .then((isMatch) => {if(isMatch) {
            global.user_id = foundUser;
            console.log("Authentication succesfull: ", foundUser);
            return res.status(StatusCodes.OK).json({"name": foundUser.name, "email": foundUser.email});
            }
        return res.status(StatusCodes.UNAUTHORIZED).json({message: "Authentication Failed"})
        })

         .catch((err) => {
            console.error("Error comparing password:", err);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error processing logon." });
         });
        }else{
        return res.status(StatusCodes.UNAUTHORIZED).json({message: "Authentication Failed"})
    }
}   

const logoff = (req, res) =>{
    global.user_id = null;
    res.sendStatus(200)
}

module.exports = { register, logon, logoff };