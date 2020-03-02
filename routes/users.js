var express = require('express');
var router = express.Router();
var User = require('../models/users');
var bodyParser = require('body-parser');
var passport = require('passport');
var authenticate = require('../authenticate');


/* GET users listing. */
router.get('/', function(req, res, next) {
  User.find({})
  .then(users => {
    res.statusCode = 200;
    res.setHeader('Content-Type' ,'application/json')
    res.json(users);
  }, 
  err=> next(err))
});

router.get('/login/:id', (req, res, next) => {
  User.findById(req.params.id, (err, data) => {
    if(err) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json')
      res.json({err: err})
    }else{
      res.json(data);
    }
  })
});

router.post('/signup', (req, res, next) => {
    User.register(new User({username : req.body.username}), req.body.password, (err, user) => {
      if(err){
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.json({err: err})
      }else{
        passport.authenticate('local')(req, res, ()=> {
          res.statusCoden= 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({success: true, status: 'Registration Successful', user: user})
        });
      }
    });
})

router.post('/login', passport.authenticate('local') ,(req, res) => {
  var token = authenticate.getToken({_id: req.user._id});
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({success: true,  token: token, status: 'Log in Successful'})
});

router.get('/logout', (req, res, next) => {
  if(req.session){
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/');
  }else{
    var err = new Error('You are not Logged in');
    err.status = 403;
    next(err);
  }
});

module.exports = router;
