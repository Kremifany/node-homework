
const StatusCodes = require("http-status-codes")

const register = (req, res) => {
    const newUser = {...req.body};
     // this makes a copy
    console.log("Registering new user: ", newUser);
    global.users.push(newUser);
    global.user_id = newUser;  // After the registration step, the user is set to logged on.
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