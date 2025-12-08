const express = require("express");
const router = express.Router();
const dogs = require("../dogData.js");
const { ValidationError,NotFoundError  } = require("../errors/errors");

router.get("/dogs", (req, res) => {
	res.json(dogs);
});

router.post("/adopt", (req, res) => {
    const { name, address, email, dogName } = req.body;
    if (!name || !email || !dogName) {
        throw new ValidationError("Missing required fields")
    }
    let foundDog = dogs.find((e) => e.name === dogName);
    if(!foundDog || foundDog.status === "available"){ 
        throw new NotFoundError("Resource not found or not available");
  }
    return res.status(201).json({
        message: `Adoption request received. We will contact you at ${email} for further details.`,
    });
});

router.get("/error", (req, res) => {
	throw new Error("Test error");
});

module.exports = router;
