const express = require('express');
// const app = express();

const Candidate = require('../models/candidate');
// const Accessor = require('../models/accessor');
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
    Candidate.aggregate([
        {$sort: {"date": -1}}
        ], (err, data) => {
            if(err){
                next(err);
                res.status(400).end();
            }else{
                res.status(200);
                res.json(data);
        }
    })
});

route.get('/candidates-dash', (req, res, next)=> {
    Candidate.aggregate([
        {$sort: {"date": -1}},
        {$limit: 4}], (err, data) => {
            if(err){
                next(err);
                res.status(400).end();
            }else{
                res.status(200);
                res.json(data);
            }
        })
});

//On add candidate, accessor status sets to paper sent by default, email gets sent to confirm if paper has been sent to the admin 
route.post('/add-candidate', (req, res, next)=> {
    const type = "invitation";
    console.log(req.body);
    const { surname, other, dep, email, accessor} = req.body;
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

            //add candidate notification
            const message = `${surname} ${other} of ${dep} account created with ${accessor.length} of 3 accessors`
            Notification.create({ownerId: data._id, message: message}, (err, data) => {
                if (err){
                    res.status(400).end();
                    return next(err);
                }else{
                    console.log(data.date);
                    pusher.trigger('notifications', 'new-notification', {
                        message: data.message,
                        date: data.date
                    });
                }
            });
            res.json(data);
            res.status(200).end();
        }
    });

    //res.send({name: 'Mike'});
});

route.get('/candidate/:id', (req,res,next) => {
    Candidate.findById(req.params.id, (error, data) => {
        if(error){
            next(error)
            res.status(400).end()
        }
        else{
            res.json(data)
            res.status(200).end();
        }
    })
});

route.get('/get-accessor/:id', (req, res, next) => {
    Candidate.findOne({"_id":req.params.id, "accessor._id": req.query.accessorId}, (err, data) => {
       if(err){
            next(error)
            res.status(400).end()
       }else{
            const { accessor } = data;
            accessorName = accessor.find(x => x._id == req.query.accessorId).accessorname;
            console.log(accessorName);
            return res.json({name: accessorName});
       }
    });
});

route.get('/notifications', (req, res, next) => {
    Notification.find({}).then(data => {
        res.json(data);
        res.status(200).end();
    }).catch(err => {
        console.log(err);
        next(err);
        res.status(401).end()
    })
});

route.get('/notifications-dash', (req, res, next)=> {
    Notification.aggregate([
        {$sort: {"date": -1}},
        {$limit: 6}], (err, data) => {
            if(err){
                next(err);
                res.status(400).end();
            }else{
                res.status(200);
                res.json(data);
            }
        })
});

route.put('/update/:id', (req,res,next)=> {
    Candidate.findByIdAndUpdate(req.params.id, {
      $set: {
          accessor: req.body.accessor
      }  
    },{ new: true},
    (error, data)=> {
        if(error){
            console.log(error);
            next(error);
            res.status(400).end()
        }else{
            //update notification
            const { surname, other, dep } = data;
            const message = `${surname} ${other}, ${dep} details updated!`
            Notification.create({ownerId: data._id, message: message}, (err, data) => {
                if (err) return next(err);
                else{
                    pusher.trigger('notifications', 'updated', {
                        message: message,
                        date: data.date
                    });
                }
            });
            res.json(data);
            console.log('Update Succesfully');
            res.status(200).end();
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
            //delete candidate notification
            const { surname, other } = data;
            const message = `${surname} ${other} has been deleted`
            Notification.create({ownerId: data._id, message: message}, (err, data) => {
                if (err) return next(err);
                else{
                    pusher.trigger('notifications', 'deleted', {
                        message: message,
                        date: data.date
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
    invitationSent(req, res).then((result) => {
        if(result.status){
            Candidate.findOneAndUpdate({"_id":req.params.id, "accessor._id": req.query.accessorId}, {
                $set: {
                    "accessor.$.status": newStatus
                }
            }, {new: true}).then((data) => {
                // if(err) {
                //     console.log(err, " receiving invitation failed");
                //     next(err);
                //     res.status(400).end();
                // }else{
                    //invitation accepted notification
                    console.log(data);
                    const { surname, other, dep, accessor } = data;
                    const accessorName = accessor.find(x => x._id == req.query.accessorId).accessorname;
                    const message = `${accessorName} of ${surname} ${other}, ${dep} has responded. Invitation accepted`;
        
                    Notification.create({ownerId: data._id, message: message}, (err, data) => {
                        if (err) return next(err);
                        else{
                            pusher.trigger('notifications', 'invitation', {
                                message: message,
                                date: data.date
                            });
                        }
                    });
                    
                    console.log(accessor);
                    let notRespondedMessage = new String();
                    let hasNotRespondedList = new Array();
                    accessor.filter(x => x.status == 'invitation sent').map(x => {
                    notRespondedMessage = `${x.accessorname} of ${surname} ${other} is yet to respond.`;
                    hasNotRespondedList.push(notRespondedMessage);
                    console.log(hasNotRespondedList);
                    Notification.create({ownerId: data._id, message: notRespondedMessage}, (err, data) => {
                        if (err) return next(err);
                        else{
                            pusher.trigger('notifications', 'not-accepted', {
                                message: notRespondedMessage
                            });
                        }
                    })});
        
                    res.json({status: result.status, message:message, hasNotResponded: hasNotRespondedList});
                    console.log(data.accessor +" has accepted the invitation");
                    res.status(200).end();
                // }
            }).catch(err => {
                console.log(err);
            })
        }else{
            console.log(result.status, result.message);
            res.json({message: result.message, status: result.status})
            res.status(401).end();
        }
    }).catch(err => {
        throw err;
    })
    
})

route.put("/send-papers/:id", (req, res, next) => {
    const type = "verification";
    const newStatus = "paper sent";
    invitationAccepted(req, res).then(result => {
        if(result.status){
            Candidate.findOneAndUpdate({"_id": req.params.id, "accessor._id": req.query.accessorId}, 
            {$set: {"accessor.$.status": newStatus}},{new:true},
            (err, data) => {
                if(err) {
                    console.log(err, "sending papers failed");
                    next(err);
                    res.status(400).end();
                }else{
                    // sendMail(data, type); //sends mail to verify if paper accepted
                    //send papers notifications
                    const { surname, other, accessor } = data;
                    const accessorName = accessor.find(x => x._id == req.query.accessorId).accessorname;
                    const message = `Papers has been sent to ${accessorName} of ${surname} ${other}`;
                    Notification.create({ownerId: data._id, message: message}, (err, data) => {
                        if (err){
                            res.status(400).end();
                            return next(err);
                        }else{
                            pusher.trigger('notifications', 'paper-sent', {
                                message: message,
                                date: data.date
                            });
                        }
                    });
                    res.status(200);
                    res.json(data);
                    console.log(req.query.accessorId +" paper has been sent");
                }
            })
        }else{
            console.log(result.status, result.message);
            res.json({message: result.message, status: result.status})
            res.status(401).end();
        }
    }).catch(err => {
        throw err;
    })
})

route.put("/verify-papers/:id", (req, res ,next) => {
    const newStatus = "paper received"
    paperSent(req, res).then(result => {
        if(result.status){
            Candidate.findOneAndUpdate({"_id":req.params.id, "accessor._id": req.query.accessorId}, {
                $set: {
                    "accessor.$.status": newStatus
                }
            },{new:true}, (err, data) => {
                if(err) {
                    console.log(err, " paper reception failed");
                    next(err);
                    res.status(400).end();
                }else{
        
                    //paper received notification
                    const { surname, other, accessor } = data;
                    const accessorName = accessor.find(x => x._id == req.query.accessorId).accessorname;
                    const message = `Papers has been received by ${accessorName} of ${surname} ${other}`;
                            Notification.create({ownerId: data._id, message: message}, (err, data) => {
                                if (err){
                                    res.status(400).end();
                                    return next(err);
                                }else{
                                    pusher.trigger('notifications', 'verify-papers', {
                                        message: message,
                                        date: data.date
                                    });
                                }
                            });
                    res.json({data:data, status: result.status, message:message});
                    console.log(data.accessor +" paper accepted");
                    res.status(200).end();
                }
            });
        }else{
            console.log(result.status, result.message);
            res.json({message: result.message, status: result.status})
            res.status(401).end();
        }
    }).catch(err => {
        throw err;
    })
    
});

//final function if paper approved or declined!

route.put("/final-status/:id", (req, res) => {
    paperReceived(req, res).then((result) => {
        if(result.status){
            Candidate.findOneAndUpdate({"_id":req.params.id, "accessor._id": req.query.accessorId}, {
                $set: {"accessor.$.approved": req.query.status}
            },{new:true}, (err, data) => {
                if(err){
                    console.log(err);
                    next(err);
                    res.status(400).end();
                }else{
                    //paper approved or disproved notification
                    console.log(new Boolean(req.query.status));
                    const { surname, other, accessor } = data;
                    const accessorName = accessor.find(x => x._id == req.query.accessorId).accessorname;
                    const status = accessor.find(x => x._id == req.query.accessorId).approved;
                    let finalStatus = (status)? "approved":"disproved";
                    const message = `${surname} ${other} papers has been ${finalStatus} by ${accessorName}`;
                            Notification.create({ownerId: data._id, message: message}, (err, data) => {
                                if (err){
                                    res.status(400).end();
                                    return next(err);
                                }else{
                                    pusher.trigger('notifications', 'final-status', {
                                        message: message,
                                        date: data.date
                                    });
                                }
                            });
                    res.json({data:data, message:message});
                    res.status(200).end();
                }
            });
        }else{
            console.log(result.status, result.message);
            res.json({message: result.message, status: result.status})
            res.status(401).end();
        }
    }).catch(err => {
        throw err;
    })
})

//a promise that checks if invitation has been sent by the accessor
const invitationSent = (req, res) => {
    return new Promise((resolve, reject) => {
        Candidate.findOne({_id: req.params.id, "accessor._id": req.query.accessorId},{"accessor.$.status": "invitation sent"},
            (err, data) => {
                let status = new Boolean(false);
                let message = new String();
                if(err) {
                    console.log(err);
                    res.status(401);
                    reject(err);
                }else{
                    // res.json(data);
                    console.log(data);
                    if(data.accessor[0].status == "invitation sent"){
                        message = "Invitation has been sent, proceeding...";
                        console.log(message);
                        status = true;
                    }else if(data.accessor[0].status == "invitation received"){
                        message = "Invitation has already been received, this process has been passed";
                        console.log(message);
                        status = false;
                    }else{
                        message = "Something is wrong, check the accessor status then you may process to the next step neccessary";
                        console.log(message);
                        status = false;
                    }
                    resolve({status:status, message:message});
                }
            })
        });
}

const invitationAccepted = (req, res) => {
    return new Promise((resolve, reject) => {
        Candidate.findOne({_id: req.params.id, "accessor._id": req.query.accessorId},{"accessor.$.status": "invitation sent"},
            (err, data) => {
                let status = new Boolean(false);
                let message = new String();
                if(err) {
                    console.log(err);
                    res.status(401);
                    reject(err);
                }else{
                    // res.json(data);
                    console.log(data);
                    if(data.accessor[0].status == "invitation received"){
                        message = "Invitation has been received";
                        console.log(message);
                        status = true;
                    }else if(data.accessor[0].status == "invitation sent"){
                        message = "Accessors needs to receive invitation before you can proceed";
                        console.log(message);
                        status = false;
                    }else if(data.accessor[0].status == "paper sent"){
                        message = "paper has already been sent to this accessor";
                        console.log(message);
                        status = false;
                    } else{
                        message = "Something is wrong, check the accessor status then you may process to the next step neccessary"
                        console.log(message);
                        status = false;
                    }
                    resolve({status:status, message:message});
                }
            });
    })
    
}

const paperSent = (req, res) => {
    return new Promise((resolve, reject) => {
        Candidate.findOne({_id: req.params.id, "accessor._id": req.query.accessorId},{"accessor.$.status": "paper sent"},
            (err, data) => {
                let status = new Boolean(false);
                let message = new String();
                if(err) {
                    console.log(err);
                    res.status(401);
                    reject(err);
                }else{
                    // res.json(data);
                    console.log(data);
                    if(data.accessor[0].status == "paper sent"){
                        message = "Paper has been sent, you may proceed";
                        console.log(message);
                        status = true;
                    }else if(data.accessor[0].status == "invitation sent"){
                        message = "Accessor needs to receive invitation then send papers before you can proceed";
                        console.log(message);
                        status = false;
                    }else if(data.accessor[0].status == "invitation received"){
                        message = "You need to send papers before you can proceed";
                        console.log(message);
                        status = false;
                        
                    }else if(data.accessor[0].status == "paper received"){
                        message = "Papers has already been received for this accessor";
                        console.log(message);
                        status = false;
                    }else{
                        message = "Something is wrong, check the accessor status then you may process to the next step neccessary";
                        console.log(message);
                        status = false;
                    }
                    resolve({status:status, message:message});
                }
            });
    })
    
}

const paperReceived = (req, res) => {
    return new Promise((resolve, reject) => {
        Candidate.findOne({_id: req.params.id, "accessor._id": req.query.accessorId},{"accessor.$.status": "paper received"},
            (err, data) => {
                let status = new Boolean(false);
                let message = new String();
                if(err) {
                    console.log(err);
                    res.status(401);
                    reject(err);
                }else{
                    // res.json(data);
                    console.log(data)
                    if(data.accessor[0].status == "paper received"){
                        message = "Paper has been received";
                        console.log(message);
                        status = true;
                    }else if(data.accessor[0].status == "paper sent"){
                        message = "Papers needs to be received and examined before you can proceed";
                        console.log(message);
                        status = false;
                    }else{
                        message = "Something is wrong, check the accessor status then you may process to the next step neccessary"
                        console.log(message);
                        status = false;
                    }
                    resolve({status:status, message:message});
                }
            });
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