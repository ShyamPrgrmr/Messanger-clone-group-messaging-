const mongoose = require('mongoose');
const schema = mongoose.Schema;

const User = {
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    pass:{
        type:String,
        required:true
    }
} 

module.exports = mongoose.model('User', User);
