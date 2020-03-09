const mongoose = require('mongoose');
const Schema = mongoose.Schema

const DepartmentSchema = new Schema({
    name: {
        type: String
    }
})

const FacultySchema = new Schema({
    name: {
        type: String
    },
    departments: [DepartmentSchema]
},{
    collection: 'faculties'
});

const faculty = mongoose.model('Faculty', FacultySchema);
module.exports = faculty;

