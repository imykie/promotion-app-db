var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var accessorSchema = new Schema({
    name:{type:String},
    university: {type:String},
    email:{type: String},
    status: {
        type: String,
        enum: ['invitationsent', 'applicationsent','papersent','paperrecieved']
    }
})

var candidateSchema = new Schema({
    surname:{type: String},
    other:{type: String},
    email :{type: String},
    faculty: {type: String},
    department:{type: String},
    level: {type: String},
    date: {type: date},
    accessor: [accessorSchema]
},{
        collection: 'candidates'
 })

module.exports = mongoose.model('Candidate', candidateSchema);