const mongoose = require("mongoose"); 

const postSchema = mongoose.Schema({
    user:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    }],
    date:{
        type:Date,
        default:Date.now
    },
    title:String,
    content:String,
    likes: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
    },
    image:{
        type:String,
        default:"default.png"
    } 
})

module.exports = mongoose.model("post",postSchema);