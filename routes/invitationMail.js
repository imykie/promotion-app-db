const nodemailer = require('nodemailer');
const xoauth2 = require('xoauth2');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
// let express = require('express');
// let router = express.Router();

// router.post('/invite', (req, res) => {

function invitationMail(user, type){

    let response;
    const filePath = (type == "invitation")? "../public/ejs/mailContent.ejs" :"../public/ejs/paperVerification.ejs";
    const lecturerId = user._id
    const lecturerName = user.surname +' '+user.other;
    const mailTitle = (type == "invitation")? "Invitation of " +lecturerName+ " sent": "Verification of papers of " +lecturerName;

    console.log(lecturerName, user._id);
    const senderMail = 'michaelolatunji2020@gmail.com';

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        secure: 'true',
        port: '465',
        auth: {
            type:'OAuth2',
            user: senderMail,
            clientId:'712937696870-ij154aupj8v3dpi65lms4vtmdeqolsll.apps.googleusercontent.com',
            clientSecret:'fPtJLfzIiLRAnQ2fXueVTDe8',
            refreshToken: '1//04Ema_XT3ziXECgYIARAAGAQSNwF-L9Ir7RAHDyk1Uqco0Ew_Moq-vXSagv6Hg7neHlnogZDyzGlNwexrXycw6n5W74l0tYqrG3s'
            // AccessToken: 'ya29.Il-5B-20JBPYqZZfnMiRubUFpmGFNqaTxotsck9sc2l26rLM4IhFbfW2z-1yUtxWA9ws7SIzLPOJ2X6iGVPnnvnx_mbqko_6u5PU7gOhuGYQgxUHasZ6Rk1gTYs9xdpZFw'
        }

    })
    // const templateString = fs.readFileSync(path.join(__dirname, "../views/mailContent.ejs"), 'utf-8');
    ejs.renderFile(path.join(__dirname, filePath), {user:user}, (err, data) => {
        if(err){
            console.log(err);
            // res.status(401).send(err);
        }else{
            user.accessor.map((item) => { return console.log(item.accessorname) })
            let mailOptions = {
                from: `Promotion Tracker <${senderMail}>`,
                to: 'tupskey@gmail.com',
                subject: mailTitle,
                // text: `http://localhost:3000/api/verify-invite/${lecturerId}?accessorId=${user.accessor[0]._id}`
                // html: ejs.render(templateString)
                html: data
            }
            console.log("html data: "+mailOptions.html)
            transporter.sendMail(mailOptions, function(err, res) {
                if (err) {
                    console.log(err);
                    res.status(401).send(err);
                }else {
                        console.log(res, res.response, res.messageId);
                        // res.status(200);
                    }
                transporter.close();
                // return res.json(response);
            });
        }
    })
    

    
    
}
// })

module.exports = invitationMail;