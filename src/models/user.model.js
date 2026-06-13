const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required:[true,"email is required for creating user"],
        trim:true,
        lowercase:true,
        match:[/^\S+@\S+\.\S+$/,
            "Invalid Email address"
        ],
        unique:[true,"email already exists"]
    },
    name:{
    type:String,
    required:[true,"Name is required for creating a account"]

    },
    password:{
        type:String,
        required:[true,"Password is required for creating an account"],
        minlength:[6,"password should contain more than 6 characters"],
        select:false
    },
    systemUser:{
        type:Boolean,
        default:false,
        immutable:true,
        select:false
    }

    },{
        timestamps:true
    })

    userSchema.pre("save",async function(){
    if(!this.isModified("password")){
        return next()
    }
    const hash = await bcrypt.hash(this.password,10)
    this.password = hash
    return 

    })

    userSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password,this.password)
    }

    const userModel = mongoose.model("user",userSchema)

    module.exports = userModel
