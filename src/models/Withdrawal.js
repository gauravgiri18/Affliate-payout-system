const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        amount: {
            type: Number,
            required: true,
            min: 1
        },
        status: {
            type: String,
            enum: [
                "initiated",
                "processing",
                "completed",
                "failed",
                "cancelled",
                "rejected"
            ],
            default: "initiated",
            index: true
        },
        
        failureReason: {
            type: String,
            default: null,
            trim: true
        },
        //balanceRestored is fro withdrawal recovery | withdrawal->20 {fails} then we add 20 to user balance and if teh payment provider send the same failure twice we must not add 20 twice to user's balance  -> A failed withdrawal can restore the balance only once.
        balanceRestored: {
            type: Boolean,
            default: false
        },
        processedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema);

module.exports = Withdrawal;