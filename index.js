"use strict";

/*
 * Purpose: Running node.js and initialize. 
 * Authur : Sorav Garg
 * Company: Mobiweb Technology Pvt. Ltd.
*/
const app                = require('express')(),
	  express            = require('express'),
	  fs                 = require('fs'),
	  options 			 =  {
							  key: fs.readFileSync('/etc/apache2/ssl/quicklove.pro.key'),
							  cert: fs.readFileSync('/etc/apache2/ssl/8811f2fcfc6eed6f.crt')
							},
	  server             = require('https').createServer(options,app),
	  io                 = require('socket.io')(server,{
	  						 pingInterval: 10000, // In MS (1S = 1000 MS)
  							 pingTimeout : 10000
	  						}),
	  redis              = require('socket.io-redis'),
	  database           = require('./config/database.js'),
	  bodyParser         = require('body-parser'),
	  upload             = require('multer')(),
	  dateTime           = require('date-time'),
	  expressValidator   = require('express-validator'),
	  notification       = require('./lib/notification.js'),
	  custom             = require('./lib/custom.js'),
	  i18n               = require("i18n"),
	  constant           = require('./config/constant.js');
	  
/* For Validation */
app.use(expressValidator({
	customValidators: {

		/* For In List Validation */
		inList: function(value,allowed_values){
			if (allowed_values.indexOf(value) >= 0) {
			    return true;
			} else {
			    return false;
			}
		},

		/* To check minimum value */
		minValue: function(value,minValueLimit){
			if (parseInt(value) >= parseInt(minValueLimit)) {
			    return true;
			} else {
			    return false;
			}
		},

		/* To check maximum value */
		maxValue: function(value,maxValueLimit){
			if (parseInt(value) <= parseInt(maxValueLimit)) {
			    return true;
			} else {
			    return false;
			}
		}
	}
}));

/* To initialize langugage translation */
app.use(i18n.init);

i18n.configure({
    locales:['en', 'de'],
    defaultLocale: constant.default_lang,
    register: global,
    directory: __dirname + '/locales'
});

/* To set view engine */
app.set('view engine', 'ejs');

/* To set port */
app.set('port', process.env.PORT || 9595);

/* To handle invalid JSON data request */
app.use(bodyParser.json({limit: '50mb'}));
app.use((err, req, res, next) => {
    console.error(err); 
    let jsonErrResp = {};
  	  jsonErrResp.code = 400;
  	  jsonErrResp.response = {};
  	  jsonErrResp.status = 0;
  	  jsonErrResp.message = 'Invalid JSON request';
    if(err.status === 400)
      return res.send(jsonErrResp);
    return next(err); // if it's not a 400, let the default error handling do it. 
});

/* For parsing urlencoded data */
app.use(bodyParser.urlencoded({limit: '50mb', extended: true }));

/* For socket communicatrion */
app.get('/socket', function(req, res){
  res.sendFile(__dirname + '/socket.html');
});

var userRooms   = new Map(); // To manage custom user rooms
var roomNo = 1;
io.adapter(redis({ host: 'localhost', port: 6379 }));
io.on('connection', function (socket) { 
	console.log('----------- Socket Connection --------------');
	const Socket = require('./lib/socket.js'); 
	socket.on('chatmessage', function(data){
	    socket.broadcast.emit('chatmessage', data);
	});
	new Socket(socket); 
});

/* To Listen Port */
server.listen(app.get('port'), function () {
  console.log(`Express server listening on port ${app.get('port')}`);
});

app.use(function(req, res, next) {
  // res.header("Access-Control-Allow-Origin", "*");
  // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  // next();

  // CORS headers
	var responseSettings = {
		"AccessControlAllowOrigin": req.headers.origin,
		"AccessControlAllowHeaders": "Content-Type,X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5,  Date, X-Api-Version, X-File-Name",
		"AccessControlAllowMethods": "POST, GET, PUT, DELETE, OPTIONS",
		"AccessControlAllowCredentials": true
	};
		// Set custom headers for CORS
	res.header("Access-Control-Allow-Credentials", responseSettings.AccessControlAllowCredentials);
	res.header("Access-Control-Allow-Origin",  responseSettings.AccessControlAllowOrigin);
	res.header("Access-Control-Allow-Headers", (req.headers['access-control-request-headers']) ? req.headers['access-control-request-headers'] : "x-requested-with");
	res.header("Access-Control-Allow-Methods", (req.headers['access-control-request-method']) ? req.headers['access-control-request-method'] : responseSettings.AccessControlAllowMethods);
	if ('OPTIONS' == req.method) {
		res.send(200).end();
	}
	else {
		next();
	}
});

/* For admin panel assets */
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/uploads'));

require('events').EventEmitter.prototype._maxListeners = 100;

// process.on('uncaughtException', function(err, req, res) {
//   console.error('Process uncaughtException error:', err.message, '\n');
// });

// Error Handler
// app.use(express.errorHandler());

require('./app/routes')(app);
require('./apis/v1/user.js')(app, database, notification, constant,custom);
require('./apis/v1/friends.js')(app, database, notification, constant,custom);
require('./apis/v1/calls.js')(app, database, notification, constant,custom);
require('./apis/v1/review.js')(app, database, notification, constant,custom);
require('./apis/v1/dating.js')(app, database, notification, constant,custom);
require('./apis/v1/cron.js')(app, database, notification, constant,custom);
require('./apis/v1/provider.js')(app, database, notification, constant,custom);
require('./apis/v1/skill.js')(app, database, notification, constant,custom);
require('./apis/v1/products.js')(app, database, notification, constant,custom);
require('./apis/v1/videos.js')(app, database, notification, constant,custom);
require('./apis/v1/jobs.js')(app, database, notification, constant,custom);
require('./apis/v1/wallet.js')(app, database, notification, constant,custom);
require('./apis/v1/report.js')(app, database, notification, constant,custom);
require('./admin/admin.js')(app, database, constant,custom);

module.exports = { app, io,roomNo,userRooms };

/* End of file index.js */
/* Location: ./index.js */
