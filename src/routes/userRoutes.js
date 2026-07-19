const express = require("express");
const User = require("../models/User");

const { getUserById, getUserSales, getUserWithdrawals, getUserPayoutSummary } = require("../services/userServices");

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



router.get("/:userId/sales", async (req, res) => {
    try {
        const sales = await getUserSales(
            req.params.userId
        );

        res.status(200).json({
            success: true,
            data: sales
        });
    } catch (err) {
        res.status(404).json({
            success: false,
            message: err.message
        });
    }
});

router.get("/:userId/withdrawals", async (req, res) => {
    try {
        const withdrawals = await getUserWithdrawals(
            req.params.userId
        );

        res.status(200).json({
            success: true,
            data: withdrawals
        });
    } catch (err) {
        res.status(404).json({
            success: false,
            message: err.message
        });
    }
});

router.get("/:userId/payout-summary", async (req, res) => {
    try {
        const summary = await getUserPayoutSummary( req.params.userId);

        res.status(200).json({
            success: true,
            data: summary
        });
    } catch (err) {
        res.status(404).json({
            success: false,
            message: err.message
        });
    }
})

router.get("/:userId", async (req, res) => {
    try {
        const user = await getUserById(
            req.params.userId
        );

        res.status(200).json({
            success: true,
            data: user
        });
    } catch(err) {
        res.status(404).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;