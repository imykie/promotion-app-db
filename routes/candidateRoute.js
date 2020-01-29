const express = require('express');
// const app = express();

const Candidate = require('../models/candidate');
const Accessor = require('../models/accessor')
const Notification = require('../models/notification');
const route = express.Router();
const sendMail = require('./invitationMail');
const jwt = require('jsonwebtoken');
const jwtPrivateKey = "promotion tracking";
const jwtExpirySeconds = 600;
const Pusher = require('pusher');

const pusher = new Pusher({
    appId: '935842',
    key: '0a39b2a0e988f558331f',
    secret: '41c0664fbfb0168774c3',
    cluster: 'eu',
    encrypted: true
  });

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

//On add candidate, accessor status sets to paper sent by default, email gets sent to confirm if paper has been sent to the admin 
route.post('/add-candidate', (req, res, next)=> {
    const type = "invitation";
    console.log(req.body);
    const { surname, other, email, accessor} = req.body;
    Candidate.create(req.body, (error, data) => {
        if(error){
            res.status(400).end()
            return next(error)
        }
        else{
            const token = jwt.sign({fname: surname, lname: other, email: email},
                                    jwtPrivateKey, 
                                    {algorithm:'HS256', expiresIn: jwtExpirySeconds});

            if(token){
                console.log("token: "+token);
                res.cookie('token', token, {httpOnly: true, secure:false ,maxAge: jwtExpirySeconds * 1000})
                // sendMail(data, type); //sends invitation verification mail
                res.status(200);
            }else{
                res.status(401).end();
            }
            const message = `${surname} ${other} has been created with ${accessor.length} accessors`
            Notification.create({ownerId: data._id, message: message}, (err, data) => {
                if (err){
                    res.status(400).end();
                    return next(err);
                }else{
                    pusher.trigger('notifications', 'new-notification', {
                        message: message
                    });
                }
            });
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
            const { surname, other } = data;
            const message = `${surname} ${other} has been deleted`
            Notification.create({ownerId: data._id, message: message}, (err, data) => {
                if (err) return next(err);
                else{
                    pusher.trigger('notifications', 'del-notification', {
                        message: message
                    });
                }
            });
            res.json({msg: data})
        }
    })
});

// verify invite and updates status to invitation received
route.put("/verify-invite/:id", (req, res, next) => {
    const newStatus = "invitation received"
    Candidate.findOneAndUpdate({"_id":req.params.id, "accessor._id": req.query.accessorId}, {
        $set: {
            "accessor.$.status": newStatus
        }
    }, (err, data) => {
        if(err) {
            console.log(err, " receiving invitation failed");
            next(err);
            res.status(400).end();
        }else{
            const { surname, other, dep, accessor } = data;
            const accessorName = accessor.find(x => x._id == req.query.accessorId).accessorname;
            // const accessorCount = accessor.filter(x => x.status = newStatus).map(x => x.accessorname);
            const message = `${accessorName} of ${surname}, ${dep} has responded. Invitation accepted`
            Notification.create({ownerId: data._id, message: message}, (err, data) => {
                if (err) return next(err);
                else{
                    pusher.trigger('notifications', 'invitation-accepted', {
                        message: message
                    });
                }
            });
            res.json(data);
            console.log(data.accessor +" has accepted the invitation");
            res.status(200).end();
        }
    })
})

route.put("/send-papers/:id", (req, res, next) => {
    const type = "verification";
    const newStatus = "paper sent";
    invitationAccepted(req, res).then(result => {
        if(result){
            Candidate.findOneAndUpdate({"_id": req.params.id, "accessor._id": req.query.accessorId}, 
            {$set: {"accessor.$.status": newStatus}},
            (err, data) => {
                if(err) {
                    console.log(err, "sending papers failed");
                    next(err);
                    res.status(400).end();
                }else{
                    sendMail(data, type); //sends mail to verify if paper accepted
                    res.status(200);
                    res.json(data);
                    console.log(req.query.accessorId +" paper has been sent");
                }
            })
        }else{
            console.log("accessor papers sending failed");
            res.status(401).end();
        }
    }).catch(err => {
        throw err;
    })
})

route.put("/verify-papers/:id", (req, res ,next) => {
    const newStatus = "paper received"
    Candidate.findOneAndUpdate({"_id":req.params.id, "accessor._id": req.query.accessorId}, {
        $set: {
            "accessor.$.status": newStatus
        }
    }, (err, data) => {
        if(err) {
            console.log(err, " paper reception failed");
            next(err);
            res.status(400).end();
        }else{
            res.json(data);
            console.log(data.accessor +" paper accepted");
            res.status(200).end();
        }
    })
});

//final function if paper approved or declined!

route.put("/final-status/:id", (req, res) => {
    Candidate.findOneAndDelete({"_id":req.params.id, "accessor._id": req.query.accessorId}, {
        $set: {"accessor.$.status": req.query.result}
    }, (err, data) => {
        if(err){
            console.log(err);
            next(err);
            res.status(400).end();
        }else{
            res.json(data);
            res.status(200).end();
        }
    })
})
//checks if invitation has been accepted by the accessor
const invitationAccepted = (req, res) => {
    return new Promise((resolve, reject) => {
        Candidate.findOne({_id: req.params.id, "accessor._id": req.query.accessorId},{"accessor.$.status": "invitation sent"},
            (err, data) => {
                let status = new Boolean(false);
                if(err) {
                    console.log(err);
                    res.status(401);
                    reject(err);
                }else{
                    // res.json(data);
                    if(data.accessor[0].status == "invitation received"){
                        console.log("Invitation has been received");
                        status = true;
                    }else if(data.accessor[0].status == "paper sent"){
                        console.log("Paper has already been sent");
                        status = false;
                    }else{
                        console.log("Invitation has not been received");
                        status = false;
                    }
                    resolve(status);
                }
            })
    })
    
}

// const verifyMail = (req, res) => {
//     const token = req.cookies.token

//     if(!token){
//         res.status(401).end()
//     }
//     let payload
//     try{
//         payload = jwt.verify(token, jwtPrivateKey);
//     } catch(e){
//         if(e instanceof jwt.JsonWebTokenError){
//            return res.status(401).end()
//         }
//         return res.status(400).end()
//     }
//     console.log(payload);
//     Candidate.findOne({email: payload.email}, (err, data) => {
//         if(err){
//             return res.status(400).send(err);
//         }else if(!data){
//             return res.status(404).send(err);
//         } else{
//             sendMail(data);
//             return res.status(200).json(data);
//         }
//     })
// }

module.exports = route;