const { userSchema } = require("../validation/userSchema");
const { StatusCodes } = require("http-status-codes");
const { createUser, verifyUserPassword } = require("../services/userService");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");

const setJwtCookie = (req, res, user) => {
  // Sign JWT
  const payload = { id: user.id, csrfToken: randomUUID() }; 
  req.user = payload; // this is a convenient way to return the csrf token to the caller.
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiration

  // Set cookie.  Note that the cookie flags have to be different in production and in test.
  res.cookie("jwt", token, {
    ...(process.env.NODE_ENV === "production" && { domain: req.hostname }), // add domain into cookie for production only
    // httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 3600000, // 1 hour expiration.  Ends up as max-age 3600 in the cookie.
  });
  return payload.csrfToken; // this is needed in the body returned by logon() or register()
};

const logon = async (req, res) => {
  const { user, isValid } = await verifyUserPassword(
    req?.body?.email,
    req?.body?.password,
  );
  if (!isValid) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed." });
  }
  const csrfToken = setJwtCookie(req, res, user);
  res
    .status(StatusCodes.OK)
    .json({ name: user.name, csrfToken });
};

const register = async (req, res) => {
  if (!req.body) req.body = {};
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
  let user = null;
  try {
    user = await createUser(value);
  } catch (e) {
    if (e.name === "PrismaClientKnownRequestError" && e.code == "P2002") {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "A user record already exists with that email." });
    } else {
      throw e;
    }
  }
  const csrfToken = setJwtCookie(req, res, user);
  return res
    .status(StatusCodes.CREATED)
    .json({ name: value.name, csrfToken });
};

const logoff = async (req, res) => {
  // res.clearCookie("jwt");
  res.sendStatus(StatusCodes.OK);
};

module.exports = { logon, register, logoff };
