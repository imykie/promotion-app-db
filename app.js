// var createError = require('http-errors');
var express = require('express');
// var path = require('path');
var cookieParser = require('cookie-parser');
// var logger = require('morgan');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors');
var usersRouter = require('./routes/users');
var candidateRouter = require('./routes/candidateRoute');
let mailRouter = require('./routes/invitationMail');
var app = express();
let port = process.env.PORT || 3000




var url = 'mongodb://localhost:27017/PC'
mongoose.connect(url, {useNewUrlParser: true})
.then(() => {
  console.log('connected to server')
},
error=>{
  console.log('error connected to server')
})

var corsOptions = {
  origin: 'http://localhost:4200',
  optionsSuccessStatus: 200
}

// app.set('view engine', 'ejs');
app.use(cors(corsOptions));
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());


app.use('/users', usersRouter);
app.use('/api', candidateRouter);
app.use('/mail', mailRouter);

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// error handler
// app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  // res.locals.message = err.message;
  // res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  // res.status(err.status || 500);
  // res.render('error');
// });

app.listen(port, () => {
  console.log('App running on ' +port)
})
// module.exports = app;
