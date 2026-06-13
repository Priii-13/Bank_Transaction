const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blackList.model")

async function authMiddleware(req,res,next){
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if(!token){
        return res.status(401).json({
            message:"Unauthorized access,token is missing"
        })
    }

    const isBlacklisted = await tokenBlacklistModel.findOne({token})

    if(isBlacklisted){
        return res.status(401).json({
            message:"Unauthorized access, token is blacklisted"
        })
    }

    try{
    const decoded = jwt.verify(token,process.env.JWT_SECRET)

    const user = await userModel.findById(decoded.userId)

    req.user = user

    return next()
    }
    catch(err){
    return res.status(401).json({
        message:"Unauthorized access,token is missing"
    })
    }

}

async function authSystemUserMiddleware(req,res,next){
    console.log("authSystemUserMiddleware HIT");
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if(!token){
        return res.status(401).json({
            message:"Unauthorized access,token is missing"
        })
    }

    const isBlacklisted = await tokenBlacklistModel.findOne({token})
    if(isBlacklisted){
        return res.status(401).json({
            message:"Unauthorized access, token is blacklisted"
        })
    }

    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET)

        const user = await userModel.findById(decoded.userId).select("+systemUser")

        if(!user.systemUser){
            return res.status(403).json({
                message:"Forbidden access, user is not a system user"
            })
        }

        req.user = user
        return next()
     
    }
    catch(err){
        return res.status(401).json({
            message:"Unauthorized access,token is missing"
        })

}

}

async function userLogoutController(req,res){
const token = req.cookies.token || req.headers.authorization?.split(" ")[1]
if(!token){
    return res.status(400).json({
        message:"Token is missing"
    })

}


await tokenBlacklistModel.create({
    token:token,
})
res.clearCookie("token")
return res.status(200).json({
    message:"Logged out successfully"

})
}
module.exports = {authMiddleware,
    authSystemUserMiddleware,
    userLogoutController
}