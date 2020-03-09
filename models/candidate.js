var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var accessorSchema = new Schema({
    
    accessorname:{type:String},
    accessoremail:{type:String},
    university: {type:String},
    phone:{type: Number},
    status: {
        type: String,
        enum: ['invitation sent', 'invitation accepted','publication sent','publication received', 'publication returned']
    },
    date: {
        type: Date, default: Date.now
    }
    // approved: {
    //     type: Boolean,
    //     default: false
    // },
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