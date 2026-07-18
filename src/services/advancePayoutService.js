const Payout = require("../models/Payout");
const User = require("../models/User");
const Sale = require("../models/Sale");

const advancePercentage = 10;

async function processAdvancePayouts() {
    const pendingSales = await Sale.find({
        status: "pending"
    });

    const result = [];

    for(const sale of pendingSales){
        const existingPayout = await Payout.findOne({
            saleId: sale._id,
            advanceStatus: "paid"
        });
        if(existingPayout){
            result.push({
                saleId: sale._id,
                status: "skipped",
                message: "Advance payout already paid"
            })

            continue;
        }

        const advanceAmount = (sale.earning * advancePercentage)/ 100;

        const user = await User.findOne({
            userId: sale.userId
        });

        if(!user){//this is not possible but we are making this condition if it happende
            result.push({
                saleId: sale._id,
                status: "failed",
                message: "User not found"
            });

            continue;
        }

        const payout = await Payout.create({
            saleId: sale._id,
            userId: sale.userId,
            earning: sale.earning,
            advancePayment: advanceAmount,
            advanceStatus: "paid",
            advancePaidAt: new Date()
        });

        user.withdrawableBalance += advanceAmount;

        await user.save();

        result.push({
            saleId: sale._id,
            status: "paid",
            advanceAmount,
            payoutId: payout._id
        });

        return result

    }
}

module.exports = {
    processAdvancePayouts
}