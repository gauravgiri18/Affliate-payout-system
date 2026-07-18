const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
    {
        saleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Sale",
            required: true,
            unique: true
        },

        userId: {
            type: String,
            required: true,
            trim: true,
            index: true
        },

        earning: {
            type: Number,
            required: true,
            min: 0
        },

        advancePayment: {
            type: Number,
            required: true,
            min: 0
        },

        advanceStatus: {
            type: String,
            enum: ["not_paid", "processing", "paid", "failed"],
            default: "not_paid",
            index: true
        },

        advancePaidAt: {
            type: Date,
            default: null
        },

        finalAmount: {
            type: Number,
            default: 0
        },

        finalStatus: {
            type: String,
            enum: ["not_calculated", "calculated", "paid"],
            default: "not_calculated"
        },

        reconciliationAdjustment: {
            type: Number,
            default: 0
        },

        finalPaidAt: {
            type: Date,
            default: null
        }

    },
    {
        timestamps: true
    }
);

const Payout = mongoose.model("Payout", payoutSchema);

module.exports = Payout;