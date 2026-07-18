const mongoose = require("mongoose");

async function connectDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("Database connected successfully");
    } catch(e) {
        console.error("Database Connection failed");
        console.error(e.message);
        process.exit(1);
    }
}

module.exports = connectDatabase;