const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const accessorSchema = new Schema({
    accessorname:{type:String},
    accessoremail:{type:String},
    university: {type:String},
    email:{type: String},
    status: {
        type: String,
        enum: ['invitationsent', 'applicationsent','papersent','paperrecieved']
    }
})

const accessor = mongoose.model('Accessor', accessorSchema);
module.exports = accessor;