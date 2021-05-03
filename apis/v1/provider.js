"use strict";

/*
 * Purpose : For Provider Rest API
 * Package : Provider
 * Company : Mobiweb Technology Pvt. Ltd.
 * Developed By  : Sorav Garg
*/

module.exports = function(app, database, notification, constant,custom) {

	/* Load custom modules */
    var appRoot  = require('app-root-path'),
    	async    = require('async'),
		model    = require(appRoot + '/lib/model.js'),
		constant = require(appRoot + '/config/constant.js'),
		database = require(appRoot + '/config/database.js'),
		custom   = require(appRoot + '/lib/custom.js'),
		model    = require(appRoot + '/lib/model.js'),
		multer   = require('multer'),
		ejs      = require('ejs'),
		path     = require('path'),
		notification = require(appRoot + '/lib/notification.js'),
		queryBuilder = require(appRoot + '/lib/query-builder.js').QueryBuilder();

	/* Set services file destination path */
	var uploadPath = './uploads/services/';
	var storage    = multer.diskStorage({
		destination: function(req, file, callback) {
			callback(null, uploadPath)
		},
		filename: function(req, file, callback) {
			let uploadedFileName = 'service-'+ Date.now() + '-' + custom.getGuid() + path.extname(file.originalname);
			callback(null, uploadedFileName)
		}
	});
	var uploadService  = multer({ storage:storage });

	/* To set user service image upload template */
	app.get('/provider/add-service', function(req, res) {
		res.render('apis/file-upload/gallery-image')
	});

	/* To add provider service
	 * @param {string}  userLoginSessionKey
	 * @param {file}    userFile
	 * @param {string}  serviceName
	 * @param {string}  serviceDescprition
	 * @param {float}   servicePrice
	 * @param {string}  serviceType
	*/
	app.post('/provider/add-service',uploadService.any(), function(req, res) {
		let uploadPath = './uploads/services/';
	    let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
		if(req.files == "")
		{
			return  res.send({
					            "code": 200,
					            "response": {},
					            "status": 0,
					            "message":custom.lang(locale,'Failed to upload service image.') 
					        });
		}
    	let uploadedFileName = (req.files != "") ? req.files[0].filename : ''; 
    	let uploadedFilePath = (req.files != "") ? req.files[0].path : '';
    	req.sanitize("userLoginSessionKey").trim();
    	req.sanitize("serviceName").trim();
    	req.sanitize("serviceDescprition").trim();
    	req.sanitize("servicePrice").trim();
    	req.sanitize("serviceType").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('serviceName', custom.lang(locale,'The Service name field is required')).notEmpty();
	    req.check('serviceDescprition', custom.lang(locale,'The Service descprition field is required')).notEmpty();
	    req.check('servicePrice', custom.lang(locale,'The Service price field is required')).notEmpty();
	    req.check('servicePrice', custom.lang(locale,'The Service price field minimum value should be 1')).minValue(1);
	    req.check('serviceType', custom.lang(locale,'The Service type field is required')).notEmpty();
	    req.check('serviceType', custom.lang(locale,'Please select valid service type')).inList(["FIXED","HOURLY"]);
	    let errors = req.validationErrors();
	    if (errors) {
	    	
	    	/* To delete uploaded file */
	    	custom.unlinkFile(uploadedFilePath);
	        res.send({
	            "code": 200,
	            "response": {},
	            "status": 0,
	            "message": custom.manageValidationMessages(errors)
	        });
	    } else {
	    	let userLoginSessionKey   = req.sanitize('userLoginSessionKey').escape().trim();
	    	let serviceName           = req.sanitize('serviceName').escape().trim();
	    	let serviceDescprition    = req.sanitize('serviceDescprition').escape().trim();
	    	let servicePrice   		  = req.sanitize('servicePrice').escape().trim();
	    	let serviceType           = req.sanitize('serviceType').escape().trim();
	    	async.waterfall([
			    function(callback) {
			        /* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							/* To delete uploaded file */
			                custom.unlinkFile(uploadedFilePath);
							return res.send(respObj);
						}else{
							callback(null, respObj);
						}
					},userLoginSessionKey,timezone);
			    },
			    function(userDetailsObj, callback) {

			        /* Generate uploaded image thumbnail */
					custom.getImgThumbnail(function(respType,resp){
						if(parseInt(respType) === 0){
			                /* To delete uploaded file */
			                custom.unlinkFile(uploadedFilePath);
			                return res.send(resp);
						}else{
							let thumbnailUploadedImgPath = resp;
							callback(null, userDetailsObj,thumbnailUploadedImgPath);
						}
					},uploadedFilePath,uploadPath,250);
			    }
			], function (err, userDetailsObj,thumbnailUploadedImgPath) {
			    
			    var insertDataObj = {};
				insertDataObj.serviceUserID         = userDetailsObj[0].userId;
				insertDataObj.serviceName           = serviceName;
				insertDataObj.serviceDescprition    = serviceDescprition;
				insertDataObj.servicePrice          = servicePrice;
				insertDataObj.serviceType           = serviceType;
				insertDataObj.serviceOriginalImage  = uploadedFilePath;
				insertDataObj.serviceThumbnailImage = thumbnailUploadedImgPath;
				insertDataObj.serviceAddedDate      = custom.getCurrentTime();
				model.insertData(function(err,resp){
                    if(err){
                    	/* To delete uploaded files */
			            custom.unlinkFile(uploadedFilePath);
			            custom.unlinkFile(thumbnailUploadedImgPath);
                        return res.send(custom.dbErrorResponse());
                    }else{
                    	var lid = parseInt(resp.insertId);
                    	if(lid > 0){
                    		return  res.send({
						            "code": 200,
						            "response": {},
						            "status": 1,
						            "message":custom.lang(locale,'Service created successfully.') 
						        });
                    	}else{
                    		/* To delete uploaded files */
				            custom.unlinkFile(uploadedFilePath);
				            custom.unlinkFile(thumbnailUploadedImgPath);
	                        return  res.send({
								            "code": 200,
								            "response": {},
								            "status": 0,
								            "message":custom.lang(locale,'Failed to add service.') 
								        });
                    	}
                    }
                },constant.services,insertDataObj);
			});
	    }
			
	});

	/* To get service listing & details
	 * @param {integer} userID
	   @param {integer} pageNo (optional)
	 * @param {integer}  serviceID (optional)
	*/
	app.post('/service/listing-details', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
		let serviceID = (!req.body.serviceID) ? '' : req.body.serviceID;
		req.sanitize("userID").trim();
		if(serviceID){
			req.sanitize("serviceID").trim();
		}else{
			req.sanitize("pageNo").trim();
		}
	    req.check('userID', custom.lang(locale,'The User ID field is required')).notEmpty();
	    if(serviceID){
	    	req.check('serviceID', custom.lang(locale,'The service id field is require')).notEmpty();
	    }else{
	    	req.check('pageNo', custom.lang(locale,'Required page number')).notEmpty();
	    	req.check('pageNo', custom.lang(locale,'Page number minimum value should be 1')).minValue(1);
	    }
	    let errors = req.validationErrors();
	    if (errors) {
	        res.send({
	            "code": 200,
	            // "response": {},
	            "status": 0,
	            "message": custom.manageValidationMessages(errors)
	        });
	    } else {
			let userID   	= parseInt(req.sanitize('userID').escape().trim());
			let pageNo      = (!req.body.pageNo) ? '' : req.body.pageNo;;
			let serviceID   = (!req.body.serviceID) ? '' : req.body.serviceID;;
			if(serviceID){
				serviceID = parseInt(req.sanitize('serviceID').escape().trim());
			}else{
				pageNo    = parseInt(req.sanitize('pageNo').escape().trim());
			}

			async.waterfall([
			    function(callback) {
			    	let respObj = [];
			    	respObj.push({userId:userID});
			    	callback(null, respObj);
			    },
			    function(userDetailsObj, callback) {
			    	if(serviceID){

			    		/* To get user service details */
				        model.getAllWhere(function(err,servicesObj){
				        	if(err){
			                    return res.send(custom.dbErrorResponse());
			                }else{
			                	if(servicesObj != ""){
			                		callback(null, userDetailsObj, servicesObj,'DETAILS',1);
			                	}else{
			                		return res.send({
									            "code": 200,
									            // "response": {},
									            "status": 0,
									            "message": custom.lang(locale,"Service details not found.")
									        });
			                	}
			                }
				        },constant.services,{serviceUserID:userDetailsObj[0].userId,serviceID:serviceID});
			    	}else{
			    		model.getCount(function(err,totalServices){
			    			if(err){
			                    return res.send(custom.dbErrorResponse());
			                }else{
			                	if(parseInt(totalServices) > 0){

			                		/* To get offset */
							    	let offset = custom.getOffset(pageNo);

							    	/* To get user services */
							        model.getAllWhere(function(err,servicesObj){
							        	if(err){
						                    return res.send(custom.dbErrorResponse());
						                }else{
						                	if(servicesObj != ""){
						                		callback(null, userDetailsObj, servicesObj,'LIST',totalServices);
						                	}else{
						                		return res.send({
												            "code": 200,
												            // "response": [],
												            "status": 0,
												            "message": custom.lang(locale,"Services not found.")
												        });
						                	}
						                }
							        },constant.services,{serviceUserID:userDetailsObj[0].userId},'serviceID','DESC','*',constant.results_limit,offset);
			                	}else{
			                		return res.send({
									            "code": 200,
									            // "response": [],
									            "status": 0,
									            "message": custom.lang(locale,"Services not found.")
									        });
			                	}
			                }
			    		},constant.services,{serviceUserID:userDetailsObj[0].userId});
			    	}
			    }
			], function (err,userDetailsObj,servicesObj,resultType,totalServices) {
			    if(resultType === 'LIST'){ // LIST

			    	let responseObj = [];
				    for (var i = 0; i < parseInt(servicesObj.length); i++) 
				    {
				    	let row = {};
				    	row.serviceID              = parseInt(servicesObj[i].serviceID);
				    	row.serviceName            = custom.nullChecker(servicesObj[i].serviceName);
				    	row.serviceDescprition     = custom.nullChecker(servicesObj[i].serviceDescprition);
				    	row.servicePrice           = custom.nullChecker(servicesObj[i].servicePrice);
				    	row.serviceType            = custom.nullChecker(servicesObj[i].serviceType);
				    	row.serviceOriginalImage   = constant.base_url + servicesObj[i].serviceOriginalImage;
				    	row.serviceThumbnailImage  = constant.base_url + servicesObj[i].serviceThumbnailImage;
				    	row.serviceAddedDate  	   = custom.changeDateFormat(servicesObj[i].serviceAddedDate);
				    	responseObj.push(row);
				    }
				    return res.send({
						            "code": 200,
						            "response": responseObj,
						            "totalCount": totalServices,
						            "status": 1,
						            "message": "success"
						        });
			    }else{ // DETAILS
			    	let responseObj = {};
			    	responseObj.serviceID              = parseInt(servicesObj[0].serviceID);
			    	responseObj.serviceName            = custom.nullChecker(servicesObj[0].serviceName);
			    	responseObj.serviceDescprition     = custom.nullChecker(servicesObj[0].serviceDescprition);
			    	responseObj.servicePrice           = custom.nullChecker(servicesObj[0].servicePrice);
			    	responseObj.serviceType            = custom.nullChecker(servicesObj[0].serviceType);
			    	responseObj.serviceOriginalImage   = constant.base_url + servicesObj[0].serviceOriginalImage;
			    	responseObj.serviceThumbnailImage  = constant.base_url + servicesObj[0].serviceThumbnailImage;
			    	responseObj.serviceAddedDate  	   = custom.changeDateFormat(servicesObj[0].serviceAddedDate);
			    	return res.send({
						            "code": 200,
						            "response": responseObj,
						            "status": 1,
						            "message": "success"
						        });
			    }
			});
		}
	});

	/* To delete service
	 * @param {string}  userLoginSessionKey
	 * @param {integer}  serviceID
	*/
	app.post('/service/delete', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("serviceID").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('serviceID', custom.lang(locale,'The service id field is require')).notEmpty();
	    let errors = req.validationErrors();
	    if (errors) {
	        res.send({
	            "code": 200,
	            "response": {},
	            "status": 0,
	            "message": custom.manageValidationMessages(errors)
	        });
	    } else {
			let userLoginSessionKey = req.sanitize('userLoginSessionKey').escape().trim();
			let serviceID = parseInt(req.sanitize('serviceID').escape().trim());

			async.waterfall([
			    function(callback) {
			    	/* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							res.send(respObj);
							return false;
						}else{
							callback(null, respObj);
						}
					},userLoginSessionKey,timezone);
			    }
			], function (err,userDetailsObj) {
			    
			    /* To delete service */
			    model.deleteData(function(err,resp){
			    	if(err){
	                    return res.send(custom.dbErrorResponse());
	                }else{
	                	if(parseInt(resp.affectedRows) > 0){
	                		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 1,
							            "message": custom.lang(locale,"Service deleted successfully.")
							        });
	                	}else{
	                		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,"Failed to delete service.")
							        });
	                	}
	                }
			    },constant.services,{serviceID:serviceID,serviceUserID:userDetailsObj[0].userId});
			});
		}
	});

	/* To edit provider service
	 * @param {string}  userLoginSessionKey
	 * @param {file}    userFile
	 * @param {string}  serviceName
	 * @param {integer} serviceID
	 * @param {string}  serviceDescprition
	 * @param {float}   servicePrice
	 * @param {string}  serviceType
	*/
	app.post('/provider/edit-service',uploadService.any(), function(req, res) {
		let fileArray  = req.files;
		let timezone   = req.headers.timezone;
		let locale     = req.headers.locale;
		let uploadedFileName = '';
		let uploadedFilePath = '';
		let thumbnailUploadedImgPath = '';
		let uploadPath   = './uploads/services/';
		if(fileArray != ""){
			uploadedFileName = (req.files != "") ? req.files[0].filename : ''; 
    	    uploadedFilePath = (req.files != "") ? req.files[0].path : '';
		}
		req.sanitize("userLoginSessionKey").trim();
    	req.sanitize("serviceID").trim();
    	req.sanitize("serviceName").trim();
    	req.sanitize("serviceDescprition").trim();
    	req.sanitize("servicePrice").trim();
    	req.sanitize("serviceType").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('serviceID', custom.lang(locale,'The Service id field is required')).notEmpty();
	    req.check('serviceName', custom.lang(locale,'The Service name field is required')).notEmpty();
	    req.check('serviceDescprition', custom.lang(locale,'The Service descprition field is required')).notEmpty();
	    req.check('servicePrice', custom.lang(locale,'The Service price field is required')).notEmpty();
	    req.check('servicePrice', custom.lang(locale,'The Service price field minimum value should be 1')).minValue(1);
	    req.check('serviceType', custom.lang(locale,'The Service type field is required')).notEmpty();
	    req.check('serviceType', custom.lang(locale,'Please select valid service type')).inList(["FIXED","HOURLY"]);
	    let errors = req.validationErrors();
	    if (errors) {
	    	if(fileArray != ""){
		    	/* To delete uploaded file */
		    	custom.unlinkFile(uploadedFilePath);
		    }
	        res.send({
	            "code": 200,
	            "response": {},
	            "status": 0,
	            "message": custom.manageValidationMessages(errors)
	        });
	    } else {
	    	let userLoginSessionKey   = req.sanitize('userLoginSessionKey').escape().trim();
	    	let serviceID             = parseInt(req.sanitize('serviceID').escape().trim());
	    	let serviceName           = req.sanitize('serviceName').escape().trim();
	    	let serviceDescprition    = req.sanitize('serviceDescprition').escape().trim();
	    	let servicePrice   		  = req.sanitize('servicePrice').escape().trim();
	    	let serviceType           = req.sanitize('serviceType').escape().trim();
	    	async.waterfall([
			    function(callback) {
			        /* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							if(fileArray != ""){
						    	/* To delete uploaded file */
						    	custom.unlinkFile(uploadedFilePath);
						    }
							return res.send(respObj);
						}else{
							callback(null, respObj);
						}
					},userLoginSessionKey,timezone);
			    },
			    function(userDetailsObj, callback) {

			    	if(uploadedFilePath != "" && uploadedFileName != ""){
			    		/* Generate uploaded image thumbnail */
						custom.getImgThumbnail(function(respType,resp){
							if(parseInt(respType) === 0){
						    	/* To delete uploaded file */
						    	custom.unlinkFile(uploadedFilePath);
				                return res.send(resp);
							}else{
								let thumbnailUploadedImgPath = resp;
								callback(null, userDetailsObj,thumbnailUploadedImgPath);
							}
						},uploadedFilePath,uploadPath,250);
			    	}else{
			    		callback(null, userDetailsObj,'');
			    	}
			    }
			], function (err, userDetailsObj,thumbnailUploadedImgPath) {
			    
			    var updateDataObj = {};
				updateDataObj.serviceName           = serviceName;
				updateDataObj.serviceDescprition    = serviceDescprition;
				updateDataObj.servicePrice          = servicePrice;
				updateDataObj.serviceType           = serviceType;
				if(uploadedFilePath != "" && uploadedFileName != "")
				{
					updateDataObj.serviceOriginalImage  = uploadedFilePath;
					updateDataObj.serviceThumbnailImage = thumbnailUploadedImgPath;
				}
				model.updateData(function(err,resp){
                    if(err){
                    	if(uploadedFilePath != "" && uploadedFileName != "")
						{
	                    	/* To delete uploaded files */
				            custom.unlinkFile(uploadedFilePath);
				            custom.unlinkFile(thumbnailUploadedImgPath);
				        }
                        return res.send(custom.dbErrorResponse());
                    }else{
                    	if(parseInt(resp.changedRows) > 0){
                    		return  res.send({
							            "code": 200,
							            "response": {},
							            "status": 1,
							            "message":custom.lang(locale,'Service updated successfully.') 
							        });
                    	}else{
                    		return  res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message":custom.lang(locale,'Failed Or We didn`t find any changes.') 
							        });
                    	}
                    }
                },constant.services,updateDataObj,{serviceID:serviceID});
			});
	    }
	});

	/* To become a provider
	 * @param {string} userLoginSessionKey
	*/
	app.post('/become-a-provider', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
		req.sanitize("userLoginSessionKey").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    let errors = req.validationErrors();
	    if (errors) {
	        res.send({
	            "code": 200,
	            "response": {},
	            "status": 0,
	            "message": custom.manageValidationMessages(errors)
	        });
	    } else {
			let userLoginSessionKey = req.sanitize('userLoginSessionKey').escape().trim();

			async.waterfall([
			    function(callback) {
			    	/* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							res.send(respObj);
							return false;
						}else{
							callback(null, respObj);
						}
					},userLoginSessionKey,timezone);
			    }
			], function (err,userDetailsObj) {
			    
			    /* To update flag */
			    model.updateData(function(err,resp){
			    	if(err){
	                    return res.send(custom.dbErrorResponse());
	                }else{
	                	return res.send({
							            "code": 200,
							            "response": {},
							            "status": 1,
							            "message": custom.lang(locale,"success.")
							        });
	                }
			    },constant.user_details,{isBecomeProvider:1},{userId:userDetailsObj[0].userId});
			});
		}
	});


}