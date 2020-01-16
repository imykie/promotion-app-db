var express = require('express');
// var app = express();

var Candidate = require('../models/candidate');
var route = express.Router();
let sendMail = require('./invitationMail');

route.get('/candidates-list', (req, res, next)=> {
    Candidate.find((error, data)=> {
        if(error){
            return next(error);
        }
        else{
            return res.json(data);
        }
    })
})

route.post('/add-candidate', (req, res, next)=> {
    console.log(req.body);
    Candidate.create(req.body, (error, data) => {
        if(error){
            return next(error)
        }
        else{
            return res.json(data)
        }
    })

    //res.send({name: 'Mike'});
});

route.get('/candidate/:id', (req,res,next) => {
    Candidate.findById(req.params.id, (error, data) => {
        if(error){
            next(error)
        }
        else{
            res.json(data)
        }
    })
});

route.put('/update/:id', (req,res,next)=> {
    Candidate.findByIdAndUpdate(req.params.id, {
      $set: {
          accessor: req.body.accessor
      }  
    },
    (error, data)=> {
        if(error){
            return next(error);
            console.log(error)
        }else{
            res.json(data);
            console.log('Update Succesfully');
        }
    }
    )
})

route.delete('/delete-candidate/:id', (req,res, next)=> {
    Candidate.findByIdAndRemove(req.params.id, (err, data)=> {
        if(err){
            return next(err);
            console.log('User could not be found and deleted')
            console.log(err)
        }
        else{
            res.json({msg: data})
        }
    })
})

module.exports = route;