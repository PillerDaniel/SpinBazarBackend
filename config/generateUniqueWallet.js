const generateRandomAddress = require("../config/randomAddresGenerator");
const Wallet = require("../models/Wallet");

const generateUniqueWallet = async (uId) => {
  let created = false;
  let wallet;

  while (!created) {
    try {
      wallet = await Wallet.create({
        user: uId,
        usdtAddress: generateRandomAddress(34),
        ltcAddress: generateRandomAddress(34),
        btcAddress: generateRandomAddress(34),
      });

      created = true;
    } catch (err) {
      //MongoError: E11000 duplicate key error collection
      if (err.code === 11000) {
        console.log("Duplicate address");
      } else {
        throw err;
      }
    }
  }
  return wallet;
};

module.exports = generateUniqueWallet;
