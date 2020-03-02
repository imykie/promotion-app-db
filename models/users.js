const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const User = new Schema({
   
},{
    collection: 'users'
})

User.plugin(passportLocalMongoose);


// module.exports = mongoose.model('User', User);
const user = mongoose.model("User", User);
module.exports = user;