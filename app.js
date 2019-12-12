var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors');
var usersRouter = require('./routes/users');
var candidateRouter = require('./routes/candidateRoute');
var app = express();




var url = 'localhost://mongodb:27017/PC'
mongoose.connect(url, {useNewUrlParser: true})
.then(()=> {
  console.log('connected to server')
},
error=>{
  console.log('error connected to server')
})

app.use(cors());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'dist/Promo-Tracking')));
app.use('/', express.static(path.join(__dirname, 'dist/Promo-Tracking')));


app.use('/users', usersRouter);
app.use('/api', candidateRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
