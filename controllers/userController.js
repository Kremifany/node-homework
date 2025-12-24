
const StatusCodes = require("http-status-codes")
const { userSchema } = require("../validation/userSchema")
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const pool = require("../db/pg-pool");


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
//     console.log(
//   "RAW BODY:",
//   Object.entries(req.body).map(([k, v]) => [k, JSON.stringify(v), v?.length])
// );
    const {error, value} = userSchema.validate(req.body, {abortEarly: false})
    if(error){ return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }
    let user = null;
    value.hashed_password = await hashPassword(value.password);
try {
    user = await pool.query(`INSERT INTO users (email, name, hashed_password) 
      VALUES ($1, $2, $3) RETURNING id, email, name`,
      [value.email, value.name, value.hashed_password]
    );
    global.user_id = user.rows[0].id;
    // console.log("status 201 - user created: ", user.rows[0]);
    return  res.status(StatusCodes.CREATED).json({
      name: user.rows[0].name,
      email: user.rows[0].email
      
    });
  } catch (e) { // the email might already be registered
  if (e.code === "23505") { // this means the unique constraint for email was violated
    return res.status(400).json({ message: "Email is already registered." });
    // here you return the 400 and the error message. 
    // Use a return statement, so that 
    // you don't keep going in this function
  }
  return next(e); // all other errors get passed to the error handler
}
}
// otherwise newUser now contains the new user.  You can return a 201 and the appropriate
// object.  Be sure to also set global.user_id with the id of the user record you just created. 

//LOGON FUNCTION
const logon = async (req, res) => {
  
  if (!req.body) req.body = {};
    // const foundUser = global.users.find((el) => req.body.email === el.email )
    if (!req.body || !req.body.email || !req.body.password) {
      return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Email and password are required." });
    }
    const email = req.body.email;
    const password = req.body.password;
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if(result.rows.length === 0){
      return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({message: "Authentication Failed"})
    }
    const foundUser = result.rows[0];//database user
    try{ 
      
    if(foundUser){
        // console.log("Found user for authentication: ", foundUser);
        // console.log("req.body.password: ", password);
          const isMatch = await comparePassword(password, foundUser.hashed_password)
          if(isMatch) {
            global.user_id = foundUser.id;
            // console.log("Authentication succesfull: ", foundUser);
            return res
            .status(StatusCodes.OK)
            .json({ name : foundUser.name,  email : foundUser.email});
            }
            // else{
            // return res.status(StatusCodes.UNAUTHORIZED).json({message: "Authentication Failed"})
            // }
       
        }
      // }else{
        return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({message: "Authentication Failed"})
   
      }catch(err){
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error processing logon." });
         }  
        } 

const logoff = (req, res) =>{
    global.user_id = null;
    res.sendStatus(200)
}

module.exports = { register, logon, logoff };