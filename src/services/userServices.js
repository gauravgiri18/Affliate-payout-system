const User = require("../models/User");
const Sale = require("../models/Sale");
const Payout = require("../models/Payout");
const Withdrawal = require("../models/Withdrawal");

async function getUserById(userId) {
  const user = await User.findOne({
    userId
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

async function getUserSales(userId) {
  const user = await User.findOne({
    userId
  });

  if (!user) {
    throw new Error("User not found");
  }

  return Sale.find({
    userId
  }).sort({
    createdAt: -1
  });
}

async function getUserWithdrawals(userId) {
  const user = await User.findOne({
    userId
  });

  if (!user) {
    throw new Error("User not found");
  }

  return Withdrawal.find({
    userId
  }).sort({
    createdAt: -1
  });
}

async function getUserPayoutSummary(userId) {
  const user = await User.findOne({
    userId
  });

  if (!user) {
    throw new Error("User not found");
  }

  const payouts = await Payout.find({
    userId
  });

  const summary = payouts.reduce(
    (result, payout) => {
      result.totalAdvancePaid +=
        payout.advanceStatus === "paid"
          ? payout.advancePayment
          : 0;

      result.totalFinalAmount +=
        payout.finalStatus === "paid"
          ? payout.finalAmount
          : 0;

      if (payout.finalAmount > 0) {
        result.totalApprovedFinalAmount +=
          payout.finalAmount;
      }

      if (payout.finalAmount < 0) {
        result.totalRejectedAdjustment +=
          payout.finalAmount;
      }

      return result;
    },
    {
      totalAdvancePaid: 0,
      totalFinalAmount: 0,
      totalApprovedFinalAmount: 0,
      totalRejectedAdjustment: 0
    }
  );

  return {
    userId,
    withdrawableBalance: user.withdrawableBalance,
    ...summary
  };
}

module.exports = {
  getUserById,
  getUserSales,
  getUserWithdrawals,
  getUserPayoutSummary
};