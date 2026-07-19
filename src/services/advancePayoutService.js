const Payout = require("../models/Payout");
const User = require("../models/User");
const Sale = require("../models/Sale");

const ADVANCE_PERCENTAGE = 10;

async function processAdvancePayouts() {
    const pendingSales = await Sale.find({
        status: "pending"
    });

    const results = [];

    for(const sale of pendingSales){
        try {
            const existingPayout = await Payout.findOne({
                saleId: sale._id
            });

            if(existingPayout){
                if(existingPayout.advanceStatus === "paid"){
                    results.push({
                        saleId: sale._id,
                        status: "skipped",
                        message: "Advance payout already paid"
                    });
                    continue;
                }

                if(existingPayout.advanceStatus === "processing"){
                    results.push({
                        saleId: sale._id,
                        status: "skipped",
                        message: "Advance payout is already processing"
                    });

                    continue;
                }
            }

            const user = await User.findOne({
                userId: sale.userId
            });

            if(!user){
                results.push({
                    saleId: sale._id,
                    status: "failed",
                    message: "User Not Found"
                });

                continue;
            }

            const advanceAmount = (sale.earning*ADVANCE_PERCENTAGE)/100;

            let payout;

            if(existingPayout){
                existingPayout.advancePayment = advanceAmount;
                existingPayout.advanceStatus = "paid";
                existingPayout.advancePaidAt = new Date();

                payout = await existingPayout.save();
            } else {
                payout = await Payout.create({
                    saleId: sale._id,
                    userId: sale.userId,
                    earning: sale.earning,
                    advancePayment: advanceAmount,
                    advanceStatus: "paid",
                    advancePaidAt: new Date()
                });
            }

            user.withdrawableBalance += advanceAmount;

            await user.save();

            results.push({
                saleId: sale._id,
                status: "paid",
                advancePayment: advanceAmount,
                payoutId: payout._id
            });
        } catch(err){
            results.push({
                saleId: sale._id,
                status: "failed",
                message: err.message
            });
        }
    }

    return results;
}

module.exports = {
    processAdvancePayouts
};