// const createError = require('http-errors');
require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
// const logger = require('morgan');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const usersRouter = require('./routes/users');
const candidateRouter = require('./routes/candidateRoute');
// let mailRouter = require('./routes/invitationMail');
const app = express();
let port = process.env.PORT || 3000




const url = 'mongodb://localhost:27017/PC'
mongoose.connect(url, {useNewUrlParser: true})
.then(() => {
  console.log('connected to server')
},
error => {
  console.log('error while connecting to server')
})

let corsOptions = {
  origin: 'http://localhost:4200',
  optionsSuccessStatus: 200
}

// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*")
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
//   next();
// });
app.use(express.static(path.join(__dirname, '/public')));
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');

app.use(cors(corsOptions));
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());


app.use('/users', usersRouter);
app.use('/api', candidateRouter);
// app.use('/mail', mailRouter);

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
