<<<<<<< HEAD
var JwtStrategy = require('passport-jwt').Strategy;
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken');
var User = require('./models/users');

=======
var passport = require('passport');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var LocalStrategy = require('passport-local').Strategy;
var jwt = require('jsonwebtoken');
var User = require('./models/user');
>>>>>>> 9b20b0acb07a6294db4fea38fbc82e7a0b4f65e9
var config = require('./config');

exports.local = passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.getToken = function(user) {
	return jwt.sign(user, config.secretKey, 
		{expiresIn: 3600});
}
<<<<<<< HEAD
    
var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(new JwtStrategy(opts, 
	(jwt_payload, done) => {
		/* The done above takes three parameters which include err, user, any */
		 console.log("JWT payload", jwt_payload);
		 User.findOne({_id: jwt_payload._id}, (err, user) => {
		 	if (err) {
		 		return done(err, false);
		 	}
		 	else if (user) {
		 		console.log(user, 'user')
		 		return done(null, user);
		 	}
		 	else{
		 		return done(null, false);
		 	}
		 });
	}));

	exports.verifyUser = passport.authenticate('jwt', {session: false});
=======

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken;
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    User.findOne({_id : jwt_payload._id}, (err, user) => {
        if(err){
            return done(err, false);
        }
        else if(user){
            console.log(user, 'user');
            return done(null, user)
        }
        else{
            return done(null, false);
        }
    });
}));

exports.verifyUser = passport.authenticate('jwt', {session: false});

 
>>>>>>> 9b20b0acb07a6294db4fea38fbc82e7a0b4f65e9
