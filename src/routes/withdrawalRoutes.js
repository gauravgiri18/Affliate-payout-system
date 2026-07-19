const express = require("express");

const { initiateWithdrawal, updateWithdrawalStatus } = require("../services/withdrawalService");

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { userId, amount } = req.body;

        const result = await initiateWithdrawal(userId, amount);

        res.status(201).json ({
            success: true,
            message: "Withdrawal initiated successfully",
            data: result
        });
    } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
    }
});

router.patch("/:withdrawalId/status", async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { status, failureReason } = req.body;

    const result = await updateWithdrawalStatus(
      withdrawalId,
      status,
      failureReason
    );

    res.status(200).json({
      success: true,
      message: "Withdrawal status updated successfully",
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;