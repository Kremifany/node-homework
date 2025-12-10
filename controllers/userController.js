
const StatusCodes = require("http-status-codes")
const { userSchema } = require("../validation/userSchema")


const register = (req, res) => {
    if (!req.body) req.body = {};
 
    const newUser = {...req.body};
    const {error, value} = userSchema.validate(newUser, {abortEarly: false})
    if(error) return res.status(400).json({message: error.message});
    
    // this makes a copy of

    console.log("Registering new user: ", newUser);
    global.users.push(value);
    global.user_id = value;  // After the registration step, the user is set to logged on.
    delete req.body.password;
    console.log("Registered new user without password ", req.body);
    return res.status(201).json(req.body);
}

const logon = (req, res) => {
    const foundUser = global.users.find((el) => req.body.email === el.email )
    if(foundUser&&foundUser.password == req.body.password){
       global.user_id = foundUser;
       console.log("Authentication succesfull: ", foundUser);
        return res.status(StatusCodes.OK).json({"name": foundUser.name, "email": foundUser.email});
    }
    else{
        return res.status(StatusCodes.UNAUTHORIZED).json({message: "Authentication Failed"})
    }
}

const logoff = (req, res) =>{
    global.user_id = null;
    res.sendStatus(200)
}

module.exports = { register, logon, logoff };