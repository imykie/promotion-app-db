const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Notification = new Schema({
    ownerId:{
        type: String,
        required: true
    },
    message: {
        type: String,
        require: true
    },
    read: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now
    }
})

const notification = mongoose.model("Notification", Notification);
module.exports = notification;