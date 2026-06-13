const mongoose = require("mongoose")

const tokenBlacklistSchema = new mongoose.Schema({
    token:{
        type:String,
        required:[true,"Token is required for blacklisting"],
        unique:true
    }
},
   
{
    timestamps:true
    })

tokenBlacklistSchema.index({createdAt:1},{
expireAfterSeconds:60*60*24*3
})

const tokenBlacklistModel = mongoose.model("TokenBlacklist",tokenBlacklistSchema)

module.exports = tokenBlacklistModel


