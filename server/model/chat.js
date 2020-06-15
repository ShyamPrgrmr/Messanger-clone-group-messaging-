const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Chat = new Schema({
    user:{
        type:Schema.Types.ObjectId,
        required:true
    },
    username:{
        type:String,
        required:true
    },
    msg:{
        type:String,
        required:true
    },
    time:{
        type:String
    }
},{ timestamps: true });

module.exports = mongoose.model('Chat', Chat);
