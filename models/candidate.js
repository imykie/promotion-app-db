var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var accessorSchema = new Schema({
    
    accessorname:{type:String},
    accessoremail:{type:String},
    university: {type:String},
    phone:{type: Number},
    status: {
        type: String,
        enum: ['invitation sent', 'invitation received','paper sent','paper received']
    },
    approved: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date, default: Date.now
    }
})

var candidateSchema = new Schema({
    surname:{type: String},
    other:{type: String},
    email :{type: String},
    number :{type: Number},
    fac: {type: String},
    dep:{type: String},
    lev: {type: String},
    date: {type: Date, default: Date.now},
    accessor: [accessorSchema]
},{
        collection: 'candidates'
 })

module.exports = mongoose.model('Candidate', candidateSchema);