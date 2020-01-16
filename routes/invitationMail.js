let nodemailer = require('nodemailer');
let xoauth2 = require('xoauth2');
let express = require('express');
let router = express.Router();

router.post('/invite', (req, res) => {
    let response;
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
    
    let mailOptions = {
        from: `Promotion Tracker <${senderMail}>`,
        to: 'tundexmike@gmail.com',
        subject: "This is subject",
        text: "This is email content",
        html: ""
    }

    transporter.sendMail(mailOptions, function(err, res) {
        if (err) {
            console.log(err);}
        else {
            console.log(res);
            response = res;
            }
        transporter.close();
    });
    return res.json(response);
})

module.exports = router;