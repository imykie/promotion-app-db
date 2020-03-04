const nodemailer = require('nodemailer');
const xoauth2 = require('xoauth2');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

function invitationMail(user){

    let response;
    const filePath =  "../public/ejs/notifications.ejs";
    const lecturerId = user.data._id
    const lecturerName = user.data.surname +' '+user.data.other;
    const mailTitle = `Notification on ${lecturerName} of ${user.data.fac}, department of ${user.data.dep}`;

    console.log(lecturerName, user.data._id);
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
    ejs.renderFile(path.join(__dirname, filePath), {user:user.data, message: user.message}, (err, data) => {
        if(err){
            console.log(err);
            // res.status(401).send(err);
        }else{
            // user.data.accessor.map((item) => { return console.log(item.accessorname) })
            let mailOptions = {
                from: `Promotion Tracker <${senderMail}>`,
                to: ['tundexmike@gmail.com', 'tupskey@gmail.com'],
                subject: mailTitle,
                html: data
            }
            console.log("html data: "+mailOptions.html)
            transporter.sendMail(mailOptions, function(err, res) {
                if (err) {
                    console.log(err);
                    res.status(401).send(err);
                }else {
                        console.log(res, res.response, res.messageId);
                    }
                transporter.close();
            });
        }
    })
    

    
    
}
// })

module.exports = invitationMail;