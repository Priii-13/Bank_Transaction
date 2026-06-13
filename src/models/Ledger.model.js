const mongoose = require("mongoose")

const ledgerSchema = new mongoose.Schema({
    account:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"Ledger must be associated with an account"],
        index:true,
        immutable:true
    },
    amount:{
     type:Number,
     required:[true,"Ammount is required for creating a ledger entry"],
     immutable:true
    },
    transaction:{
        type:mongoose.Schema.ObjectId,
        ref:"transaction",
        required:[true,"Ledger must be associated with a transaction"],
        index:true,
        immutable:true
    },
    type:{
     type:String,
     enum:{
        values:["DEBIT","CREDIT"],
        message:"Type can be either DEBIT or CREDIT"
     },
        required:[true,"Ledger type is required "],
        immutable:true
    }


})

function preventLedgerModification(){
   throw new Error("Ledger entries cannot be modified or deleted") 
}

ledgerSchema.pre("findOneAndUpdate",preventLedgerModification)
ledgerSchema.pre("findOneAndDelete",preventLedgerModification)
ledgerSchema.pre("remove",preventLedgerModification)
ledgerSchema.pre("updateOne",preventLedgerModification)
ledgerSchema.pre("deleteOne",preventLedgerModification)
ledgerSchema.pre("updateMany",preventLedgerModification)
ledgerSchema.pre("deleteMany",preventLedgerModification)
ledgerSchema.pre("findOneAndReplace",preventLedgerModification)

const LedgerModel = mongoose.model("Ledger",ledgerSchema)

module.exports = LedgerModel