var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');

var indexRouter = require('./routes/index');
var devicesRouter = require('./routes/devices');
var photonRouter = require('./routes/photon');
var usersRouter = require('./routes/users');
var activityRouter = require('./routes/activity');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// This is to enable cross-origin access
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
});

/*app.use(function(req, res, next){
    var data = "";
    req.on('data', function(chunk){ data += chunk})
    req.on('end', function(){
        console.log(data);
        next();
    });
});*/

app.use(logger('dev'));

// The following allows use to send a JSON response using .json() instead of
// .send(JSON.stringify())
//
// Note: Recent express versions automatically install this.
app.use(express.json());

// The following will URL query strings. Key/value
// pairs will be accessible using req.query.key
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


// The following will parse JSON data passed in the body. Key/value
// pairs will be accessible using req.body.key
//
// Note: Recent express versions automatically install this.
app.use(bodyParser.json());

// The following will parse URL encoded parameters. Key/value
// pairs will be accessible using req.params.key
//
// Note: Recent express versions automatically install this.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/devices', devicesRouter);
app.use('/photon', photonRouter);
app.use('/users', usersRouter);
app.use('/activity', activityRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    console.log(req.body);
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
