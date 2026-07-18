const express = require("express");

const {processAdvancePayouts} = require("../services/advancePayoutService");

const router = express.Router();

router.post("/advance/process", async (req, res) => {
    try {
        const results = await processAdvancePayouts();

        res.status(200).json({
            success: true,
            message: "Advance payout process completed",
            data: results
        });
    } catch(err){
        res.status(500).json({
            success: "fail",
            message: err.message
        });
    }
});

module.exports = router;