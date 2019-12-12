var express = require('express');
var app = express();

var Candidate = require('../models/canidate');


var candidateRouter = express.Router();

candidateRoute.route('/add-candidate').post((req, res, next)=> {
    Candidate.create(req.body, (error, data) => {
        if(error){
            return next(error)
        }
        else{
            return res.json(data)
        }
    })
});

module.exports = candidateRouter;