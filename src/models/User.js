const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
            trim: true// this removes unwanted spaces like "   Gaurav_Giri   " => "Gaurav Giri"
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            lowercase: true
        },

        withdrawableBalance: {
            type: Number,
            required: true,
            default: 0,
            min: 0
        },

        lastWithdrawalAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);


const User = mongoose.model("User", userSchema);

module.exports = User;