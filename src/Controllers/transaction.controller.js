const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/Ledger.model")
const emailService = require("../services/email.service")
const accountModel = require("../models/account.model")
const mongoose = require("mongoose")

async function createTransaction(req,res){

    // 1. Validate request 
    const { fromAccount, toAccount, amount, idempotencyKey, idemPotencyKey } = req.body
    const key = idempotencyKey || idemPotencyKey

    if(!fromAccount || !toAccount || !amount || !key){
        return res.status(400).json({
            message:"fromAccount, toAccount, amount and idempotencyKey are required "
        })
    }

    const fromUserAccount = await accountModel.findOne({_id:fromAccount,
    })

    const toUserAccount = await accountModel.findOne({_id:toAccount})
    
    if(!fromUserAccount || !toUserAccount){
        return res.status(400).json({
            message:"From account or To account not found"
        })
    }

    //2. Validate idempotency key

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idemPotencyKey: key
    })

    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExists
            })
        }

        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(202).json({
                message: "Transaction is still processing"
            })
        }

        if (isTransactionAlreadyExists.status === "FAILED") {
            return res.status(400).json({
                message: "Transaction processing failed previously, please retry"
            })
        }

        if (isTransactionAlreadyExists.status === "REVERSED") {
            return res.status(400).json({
                message: "Transaction was reversed previously, please retry"
            })
        }
    }

//3. Check account status

if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE"){
    return res.status(400).json({
        message:"Both from and to accounts must be active to process the transaction"
})
}

//4.Derive sender balance from ledger
const balance = await fromUserAccount.getBalance()

    if(balance < amount){
        return res.status(400).json({
            message:`Insufficient balance . Current balance is ${balance}.Requested amount is ${amount}`
        })
    }

    let transaction;
   
   try {
     //5. Create transaction (PENDING)
     const session = await mongoose.startSession()
   session.startTransaction()
   transaction= (await transactionModel.create([{
       fromAccount,
       toAccount,
       amount,
       idemPotencyKey,
       status: "PENDING"
     }], { session }))[0]

     const debitLedgerEntry = await ledgerModel.create([{
       account: fromAccount,
       amount: amount,
       transaction: transaction._id,
       type: "DEBIT"
     }], { session })

     await (()=>{
     return new Promise((resolve)=> setTimeout(resolve, 15*1000))

     })()

     const creditLedgerEntry = await ledgerModel.create([{
       account: toAccount,
       amount: amount,
       transaction: transaction._id,
       type: "CREDIT"
     }], { session })

     await transactionModel.findOneAndUpdate(
       { _id: transaction._id },
       { status: "COMPLETED" },
       { session }
     )

     await session.commitTransaction()
     session.endSession()
   } catch (error) {

     return res.status(400).json({
       message: "Transaction is pending due to some issue, please retry after some time",
       
     })
   } 

   //10. Send email notification
   await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)

   return res.status(201).json({
     message: "Transaction completed successfully",
     transaction: transaction
   })
}

async function createInitialFundsTransaction(req,res){
     console.log("createInitialFundsTransaction HIT");
    const {toAccount,amount,idemPotencyKey} = req.body

    if(!toAccount || !amount || !idemPotencyKey){
        return res.status(400).json({
            message:"toAccount, amount and idemPotencyKey are required"
        })
    }
    const toUserAccount = await accountModel.findOne({_id:toAccount})

  

if(!toUserAccount){
    return res.status(400).json({
        message:"To account not found"
    })
}

let fromUserAccount = await accountModel.findOne({
    $or: [
        { userId: req.user._id },
        { user: req.user._id }
    ]
})

if(!fromUserAccount){
    fromUserAccount = await accountModel.create({
        userId: req.user._id
    })
}

     const session = await mongoose.startSession()

     session.startTransaction()

     const transaction = await transactionModel({
        fromAccount:fromUserAccount._id,
        toAccount,
        amount,
        idemPotencyKey,
        status:"PENDING"})

        const debitLedgerEntry = await ledgerModel.create([{
            account:fromUserAccount._id,
            amount:amount,
            transaction:transaction._id,
            type:"DEBIT"
        }],{session})

        const creditLedgerEntry = await ledgerModel.create([{
            account:toUserAccount._id,
            amount:amount,
            transaction:transaction._id,
            type:"CREDIT"
        }],{session})

        transaction.status = "COMPLETED"
        await transaction.save({session})

        await session.commitTransaction()
        session.endSession()

        return res.status(201).json({
            message:"Initial funds transaction completed successfully",
            transaction:transaction
        })


        }







module.exports = {
    createTransaction,
    createInitialFundsTransaction
}
