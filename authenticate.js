var passport = require('passport');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var LocalStrategy = require('passport-local').Strategy;
var jwt = require('jsonwebtoken');
var User = require('./models/user');
var config = require('./config');

exports.local = passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.getToken = function(user) {
	return jwt.sign(user, config.secretKey, 
		{expiresIn: 3600});
}

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

 