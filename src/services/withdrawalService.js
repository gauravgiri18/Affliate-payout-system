const mongoose = require("mongoose");

const User = require("../models/User");
const Withdrawal = require("../models/Withdrawal");

const WITHDRAWAL_COOLDOWN_MS = 24*60*60*1000;

async function initiateWithdrawal(userId, amount) {
    if(!userId){
        throw new Error("userId is required");
    }

    if(typeof amount != "number" || amount <= 0) {
        throw new Error("Withdrawal amount must be a number greater than zero");
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();
        const user = await User.findOne({
            userId
        }).session(session);

        if(!user){
            throw new Error("User not found");
        }

        if(user.lastWithdrawalAt){
            const timeSinceLastWithdrawal = Date.now()-user.lastWithdrawalAt.getTime();

            if(timeSinceLastWithdrawal < WITHDRAWAL_COOLDOWN_MS) {
                throw new Error("Only one withdrawal is allowed every 24 hours");
            }
        }

        if(amount > user.withdrawableBalance) {
            throw new Error("Withdrawal amount exceeds withdrawable balance");
        }

        user.withdrawableBalance -= amount;
        user.lastWithdrawalAt = new Date();

        await user.save({ session });

        const withdrawal = await Withdrawal.create(
            [
                {
                    userId,
                    amount,
                    status: "initiated"
                }
            ],
            { session }
        );

        await session.commitTransaction();

        return{
            withdrawal: withdrawal[0],
            remainingBalance: user.withdrawableBalance
        };
    } catch(err) {
        await session.abortTransaction();
        throw err;
    } finally {
        await session.endSession();
    }
}



async function updateWithdrawalStatus(withdrawalId, newStatus, failureReason = null) {
    const failureStatuses = [
        "failed",
        "cancelled",
        "rejected"
    ];

    const validStatuses = [
        "processing",
        "completed",
        "failed",
        "cancelled",
        "rejected"
    ];

    if (!validStatuses.includes(newStatus)) {
        throw new Error(
        "Invalid withdrawal status"
        );
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const withdrawal = await Withdrawal.findById(
            withdrawalId
        ).session(session);

        if (!withdrawal) {
            throw new Error("Withdrawal not found");
        }

        const finalStatuses = [
            "completed",
            "failed",
            "cancelled",
            "rejected"
        ];

        if (finalStatuses.includes(withdrawal.status)) {
            throw new Error(
                `Withdrawal has already reached final status: ${withdrawal.status}`
            );
        }

        const user = await User.findOne({
            userId: withdrawal.userId
        }).session(session);

        if (!user) {
            throw new Error("User not found");
        }

        withdrawal.status = newStatus;
        withdrawal.failureReason = failureReason;
        withdrawal.processedAt = new Date();

        if (failureStatuses.includes(newStatus) &&!withdrawal.balanceRestored ) {
            user.withdrawableBalance += withdrawal.amount;

            user.lastWithdrawalAt = null;

            withdrawal.balanceRestored = true;
        }

        await user.save({ session });
        await withdrawal.save({ session });

        await session.commitTransaction();

        return {
            withdrawal,
            restoredAmount:
                failureStatuses.includes(newStatus)
                ? withdrawal.amount
                : 0,
            currentBalance: user.withdrawableBalance
        };


    } catch(err){
        await session.abortTransaction();
        throw err;
    } finally {
        await session.endSession();
    }

}

module.exports = { initiateWithdrawal, updateWithdrawalStatus };