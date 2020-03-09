const express = require('express');
const Candidate = require('../models/candidate');
const Notification = require('../models/notification');
const route = express.Router();
const jwt = require('jsonwebtoken');
const jwtPrivateKey = "promotion tracking";
const jwtExpirySeconds = 600;
const Pusher = require('pusher');
const notificationMail = require('./notificationMail');
const Faculty = require('../models/faculty');

const pusher = new Pusher({
    appId: '935842',
    key: '0a39b2a0e988f558331f',
    secret: '41c0664fbfb0168774c3',
    cluster: 'eu',
    encrypted: true
  });


route.post('/add-departments', (req, res, next) => {
    Faculty.create(req.body, (err, data) => {
        if(err){
            res.status(400).end();
            console.log(err)
            return next(error)
        }else{
            res.status(200);
            console.log(data);
            return res.json(data);
        }
        
    })
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
            // notificationMail({data:data, message: message});
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
            // notificationMail({data:data, message: message});
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
            // notificationMail({data:data, message: message});
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

// verify invite and updates status to invitation accepted
route.put("/verify-invite/:id", (req, res, next) => {
    const newStatus = "invitation accepted"
    invitationSent(req, res).then((result) => {
        if(result.status){
            Candidate.findOneAndUpdate({"_id":req.params.id, "accessor._id": req.query.accessorId}, {
                $set: {
                    "accessor.$.status": newStatus,
                    "accessor.$.date":  new Date().toISOString()
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
                    // notificationMail({data:data, message: message});
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
        
                    res.json({data: data, status: result.status, message:message, hasNotResponded: hasNotRespondedList});
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
    const newStatus = "publication sent";
    invitationAccepted(req, res).then(result => {
        if(result.status){
            Candidate.findOneAndUpdate({"_id": req.params.id, "accessor._id": req.query.accessorId}, 
            {$set: {
                "accessor.$.status": newStatus,
                "accessor.$.date":  new Date().toISOString()
            }},{new:true},
            (err, data) => {
                if(err) {
                    console.log(err, "publication sending failed");
                    next(err);
                    res.status(400).end();
                }else{
                    // sendMail(data, type); //sends mail to verify if paper accepted
                    //send papers notifications
                    const { surname, other, accessor } = data;
                    const accessorName = accessor.find(x => x._id == req.query.accessorId).accessorname;
                    const message = `Publications has been sent to ${accessorName} of ${surname} ${other}`;

                    // notificationMail({data:data, message: message});
                    Notification.create({ownerId: data._id, message: message}, (err, data) => {
                        if (err){
                            res.status(400).end();
                            return next(err);
                        }else{
                            pusher.trigger('notifications', 'publication-sent', {
                                message: message,
                                date: data.date
                            });
                        }
                    });
                    res.status(200);
                    res.json({data: data, status: result.status, message:message});
                    console.log(req.query.accessorId +" publication has been sent");
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
    const newStatus = "publication received"
    paperSent(req, res).then(result => {
        if(result.status){
            Candidate.findOneAndUpdate({"_id":req.params.id, "accessor._id": req.query.accessorId}, {
                $set: {
                    "accessor.$.status": newStatus,
                    "accessor.$.date":  new Date().toISOString()

                }
            },{new:true}, (err, data) => {
                if(err) {
                    console.log(err, " publication reception failed");
                    next(err);
                    res.status(400).end();
                }else{
        
                    //publication received notification
                    const { surname, other, accessor } = data;
                    const accessorName = accessor.find(x => x._id == req.query.accessorId).accessorname;
                    const message = `Publications has been received by ${accessorName} of ${surname} ${other}`;
                    // notificationMail({data:data, message: message});
                            Notification.create({ownerId: data._id, message: message}, (err, data) => {
                                if (err){
                                    res.status(400).end();
                                    return next(err);
                                }else{
                                    pusher.trigger('notifications', 'verify-publication', {
                                        message: message,
                                        date: data.date
                                    });
                                }
                            });
                    res.json({data:data, status: result.status, message:message});
                    console.log(data.accessor +" publication received");
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

//publication returned...
route.put("/return-publication/:id", (req, res ,next) => {
    const newStatus = "publication returned"
    paperReceived(req, res).then(result => {
        if(result.status){
            Candidate.findOneAndUpdate({"_id":req.params.id, "accessor._id": req.query.accessorId}, {
                $set: {
                    "accessor.$.status": newStatus,
                    "accessor.$.date":  new Date().toISOString()

                }
            },{new:true}, (err, data) => {
                if(err) {
                    console.log(err, " publication reception failed");
                    next(err);
                    res.status(400).end();
                }else{
        
                    //publication returned notification
                    const { surname, other, accessor } = data;
                    const accessorName = accessor.find(x => x._id == req.query.accessorId).accessorname;
                    const message = `Publications has been returned by ${accessorName} of ${surname} ${other}`;
                    // notificationMail({data:data, message: message});
                            Notification.create({ownerId: data._id, message: message}, (err, data) => {
                                if (err){
                                    res.status(400).end();
                                    return next(err);
                                }else{
                                    pusher.trigger('notifications', 'publication-returned', {
                                        message: message,
                                        date: data.date
                                    });
                                }
                            });
                    res.json({data:data, status: result.status, message:message});
                    console.log(data.accessor +" publication received");
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
route.put("/final-status/:id", (req, res, next) => {
    paperReceived(req, res).then((result) => {
        if(result.status){
            Candidate.findOneAndUpdate({"_id":req.params.id, "accessor._id": req.query.accessorId}, {
                $set: {
                    "accessor.$.approved": req.query.status,
                    "accessor.$.date":  new Date().toISOString()
            }
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
                    // notificationMail({data:data, message: message});

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


//departments api starts here
route.get('/departments', (req, res, next) => {
    Faculty.find({}, (err, data) => {
        if(err){
            res.status(400).end();
            return next(err)
        }else{
            res.status(200);
            return res.json(data);
        }
    })
});

route.put('/add-department/:id', (req, res, next) => {
    Faculty.update(
        {_id: req.params.id}, 
        {$push: 
            {departments: 
                { $each: [
                    { name: req.body.department }
                ]}}},
        {new:true},
        (err, data) => {
        if(err){
            res.status(400).end();
            console.log(err)
            return next(err)
        }else{
            res.status(200);
            console.log(data);
            return res.json(data);
        }
    })
});

route.put('/delete-department/:id', (req, res, next) => {
    Faculty.update(
        {_id: req.params.id}, 
        {$pull: 
            {departments: 
                    {_id: req.query.dep_id}
                }},
                {new: true},
        // { new: true},
        (err, data) => {
        if (err){
            res.status(400).end();
            return next(err);
        }else{
            res.status(200);
            return res.json(data)
        }
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
                    if(data.accessor[0].status == "invitation accepted"){
                        message = "Invitation has been accepted";
                        console.log(message);
                        status = true;
                    }else if(data.accessor[0].status == "invitation sent"){
                        message = "Assessor needs to receive invitation before you can proceed";
                        console.log(message);
                        status = false;
                    }else if(data.accessor[0].status == "publication sent"){
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
        Candidate.findOne({_id: req.params.id, "accessor._id": req.query.accessorId},{"accessor.$.status": "publicationaper sent"},
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
                    if(data.accessor[0].status == "publication sent"){
                        message = "Publications has been sent, you may proceed";
                        console.log(message);
                        status = true;
                    }else if(data.accessor[0].status == "invitation sent"){
                        message = "Assessor needs to receive invitation then send papers before you can proceed";
                        console.log(message);
                        status = false;
                    }else if(data.accessor[0].status == "invitation accepted"){
                        message = "You need to send papers before you can proceed";
                        console.log(message);
                        status = false;
                        
                    }else if(data.accessor[0].status == "publication received"){
                        message = "Publications has already been received for this assessor";
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
        Candidate.findOne({_id: req.params.id, "accessor._id": req.query.accessorId},{"accessor.$.status": "publication received"},
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
                    if(data.accessor[0].status == "publication received"){
                        message = "Publication has been received";
                        console.log(message);
                        status = true;
                    }else if(data.accessor[0].status == "publication sent"){
                        message = "Publications needs to be received and examined before you can proceed";
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