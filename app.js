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
const invitationReminder = require('./routes/invitationRemainder');
const papersReminder = require('./routes/papersRemainder');
// let mailRouter = require('./routes/invitationMail');
const app = express();
let port = process.env.PORT || 8080;
const passport = require('passport');
const authenticate = require('./authenticate')
const config = require('./config');


// 'mongodb+srv://mikeking:mikeking@cluster0-u8mop.mongodb.net/test?retryWrites=true&w=majority'
const url = config.mongoUrl;
mongoose.connect(url, {useNewUrlParser: true})
.then(() => {
  console.log('connected to server')
},
error => {
  console.log('error while connecting to server')
})

// let corsOptions = {
//   origin: 'http://localhost:4200',
//   optionsSuccessStatus: 200
// }

// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*")
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
//   next();
// });
app.use(cors());
app.use(express.static(path.join(__dirname, '/public')));
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');

// app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.raw({ limit: '50mb' }));
app.use(bodyParser.text({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '/public/index.html'));
// })

app.use('/users', usersRouter);
app.use('/api', candidateRouter);
invitationReminder();
papersReminder();
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
