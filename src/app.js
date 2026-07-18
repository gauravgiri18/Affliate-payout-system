require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDatabase = require("./config/database");
const userRoutes = require("./routes/userRoutes");
const saleRoutes = require("./routes/saleRoute");
const payoutRoutes = require("./routes/payoutRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/payouts", payoutRoutes);

app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "Affliate payout system is running"
    });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    await connectDatabase();

    app.listen(PORT, () => {
        console.log(`Server Running on port ${PORT}`);
    })
}

startServer();