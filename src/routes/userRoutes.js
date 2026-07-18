const express = require("express");
const User = require("../models/User");

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const {userId, name, email} = req.body;

        const user = await User.create({
            userId,
            name,
            email
        });

        res.status(201).json({
            success: true,
            data: user
        });

    } catch(err){
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;