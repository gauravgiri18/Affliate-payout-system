const express = require("express");
const Sale = require("../models/Sale");
const User = require("../models/User");

const { reconcileSale } = require("../services/reconciliationService");

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { userId, brand, earning} = req.body;
        const user = await User.findOne({userId});

        if(!user){
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });
        }

        const sale = await Sale.create({
            userId,
            brand,
            earning
        });

        res.status(201).json({
            success: true,
            data: sale
        })
    } catch(err){
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
});

router.patch("/:saleId/reconcile", async (req, res) => {
    try {
        const { saleId } = req.params;
        const { status } = req.body;

        const result = await reconcileSale(saleId, status);

        res.status(200). json({
            success: true,
            message: "Sale reconciled successfully",
            data: result
        });
    } catch(err) {
        res.status(400).json({
            success: false,
            message: err.message
        })
    }
})

module.exports = router;