const Sale = require("../models/Sale");
const User = require("../models/User");
const Payout = require("../models/Payout");

async function reconcileSale(saleId, newStatus) {
    if(!["approved", "rejected"].includes(newStatus)) {
        throw new Error(
            "Invalid status. Status must be approved or rejected"
        );
    }

    const sale = await Sale.findById(saleId);

    if(!sale){
        throw new Error("Sale not found");
    }

    if(sale.status != "pending"){
        throw new Error(
            `Sale has already been reconciled with status: ${sale.status}`
        );
    }

    const payout = await Payout.findOne({
        saleId: sale._id
    });

    if(!payout) {
        throw new Error(
            "Payout record not found. Process the advance payout first"
        );
    }

    if(payout.advanceStatus !== "paid"){
        throw new Error(
            "Advance payout has not been successfully paid"
        );
    }

    if(payout.finalStatus === "paid"){
        throw new Error(
            "Final payout has already been processed"
        );
    }

    const user = await User.findOne({
        userId: sale.userId
    });

    if(!user){
        throw new Error("User not found");
    }

    let finalAmount;

    if(newStatus == "approved"){
        finalAmount = sale.earning - payout.advancePayment;
    } else {
        finalAmount = -payout.advancePayment;
    }

    user.withdrawableBalance += finalAmount;

    await user.save();

    sale.status = newStatus;
    sale.reconciledAt = new Date();

    await sale.save();

    payout.finalAmount = finalAmount;
    payout.reconciliationAdjustment = finalAmount;
    payout.finalStatus = "paid";
    payout.finalPaidAt = new Date();

    await payout.save();

    return {
        saleId: sale._id,
        userId: sale.userId,
        status: sale.status,
        earning: sale.earning,
        advancePayment: payout.advancePayment,
        finalAmount,
        newWithdrawableBalance: user.withdrawableBalance
    };
}

module.exports = { reconcileSale };