const accountModel = require("../models/account.model")

async function createAccountController(req,res){
    const user = req.user;

    const account = await accountModel.create({
        userId: user._id,
    })

    res.status(201).json({
        account
    })
}

async function getAccountController(req,res){
    const account = await accountModel.findOne({ userId: req.user._id })

    if (!account) {
        return res.status(404).json({
            message: "No account found for this user"
        })
    }

    return res.status(200).json({
        account
    })
}

async function getAccountBalanceController(req,res){
    const {accountId} = req.params
    const account = await accountModel.findOne({
        _id: accountId,
        userId: req.user._id

})

if(!account){
    return res.status(404).json({
        message:"Account not found"
    })
}

const balance = await account.getBalance();
res.status(200).json({
    accountId:account._id,
    balance:balance
})
}
module.exports = {
    createAccountController,
    getAccountController,
    getAccountBalanceController
}