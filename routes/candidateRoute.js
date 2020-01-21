const express = require('express');
// const app = express();

const Candidate = require('../models/candidate');
const Accessor = require('../models/accessor')
const route = express.Router();
const sendMail = require('./invitationMail');
const jwt = require('jsonwebtoken');
const jwtPrivateKey = "promotion tracking";
const jwtExpirySeconds = 600;

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
    const { surname, other, email} = req.body;
    Candidate.create(req.body, (error, data) => {
        if(error){
            return next(error)
        }
        else{
            const token = jwt.sign({fname: surname, lname: other, email: email},
                                    jwtPrivateKey, 
                                    {algorithm:'HS256', expiresIn: jwtExpirySeconds});

            if(token){
                console.log("token: "+token);
                res.cookie('token', token, {httpOnly: true, secure:false ,maxAge: jwtExpirySeconds * 1000})
                sendMail(data); //sends the mail
                res.status(200);
            }else{
                res.status(401).end();
            }
            res.json(data);
        }
    });

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
            console.log(error);
            return next(error);
        }else{
            res.json(data);
            console.log('Update Succesfully');
        }
    }
    )
});

route.delete('/delete-candidate/:id', (req,res, next)=> {
    Candidate.findByIdAndRemove(req.params.id, (err, data)=> {
        if(err){
            console.log('User could not be found and deleted')
            console.log(err)

            return next(err);
        }
        else{
            res.json({msg: data})
        }
    })
});

route.put("/verify-invite/:id", (req, res, next) => {
    const newStatus = "invitation received"
    Candidate.findOneAndUpdate({"_id":req.params.id, "accessor._id": req.query.accessorId}, {
        $set: {
            "accessor.$.status": newStatus
        }
    }, (err, data) => {
        if(err) console.log(err);
        else{
            res.json(data);
            console.log(data.accessor +" has accepted the invitation");
        }
    })
})

const verifyMail = (req, res) => {
    const token = req.cookies.token

    if(!token){
        res.status(401).end()
    }
    let payload
    try{
        payload = jwt.verify(token, jwtPrivateKey);
    } catch(e){
        if(e instanceof jwt.JsonWebTokenError){
           return res.status(401).end()
        }
        return res.status(400).end()
    }
    console.log(payload);
    Candidate.findOne({email: payload.email}, (err, data) => {
        if(err){
            return res.status(400).send(err);
        }else if(!data){
            return res.status(404).send(err);
        } else{
            sendMail(data);
            return res.status(200).json(data);
        }
    })
}

module.exports = route;