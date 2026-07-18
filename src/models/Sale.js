const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            trim: true,
            index: true
        },

        brand: {
            type: String,
            required: true,
            enum: ["brand_1", "brand_2", "brand_3"],
            trim: true
        },

        earning: {
            type: Number,
            required: true,
            min: 0
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
            index: true
        },

        reconciledAt: {
            type: Date,
            default: null
        }
  },
  {
    timestamps: true
  }

)

const Sale = mongoose.model("Sale", saleSchema);

module.exports = Sale;