"use strict";

/*
 * Purpose : For Review Rest API
 * Package : Review
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
		notification = require(appRoot + '/lib/notification.js'),
		queryBuilder = require(appRoot + '/lib/query-builder.js').QueryBuilder();


	/* To give user call review
	 * @param {string}  userLoginSessionKey
	 * @param {integer} callHistoryID
	 * @param {integer} callReviewRating
	 * @param {string}  callReviewMessage
	*/
	app.post('/call/review', function(req, res) {

		let locale = req.headers.locale;
		let userTimeZone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("callHistoryID").trim();
		req.sanitize("callReviewRating").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('callHistoryID', custom.lang(locale,'The Call history id is required')).notEmpty();
	    req.check('callReviewRating', custom.lang(locale,'Call review rating is required')).notEmpty();
	    let errors = req.validationErrors();
	    if (errors) {
	        res.send({
	            "code": 200,
	            "response": {},
	            "status": 0,
	            "message": custom.manageValidationMessages(errors)
	        });
	    } else {
			let userLoginSessionKey   = req.sanitize('userLoginSessionKey').escape().trim();
			let callHistoryID         = parseInt(req.sanitize('callHistoryID').escape().trim());
			let callReviewRating      = parseInt(req.sanitize('callReviewRating').escape().trim());
			let callReviewMessage     = (!req.body.callReviewMessage) ? '' : req.body.callReviewMessage;

	        async.waterfall([
			    function(callback) {
			    	/* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							let masterUserId = parseInt(respObj[0].masterUserId);
							callback(null, respObj,masterUserId);
						}
					},userLoginSessionKey,userTimeZone);
			    },
			    function(userDetailsObj,masterUserId, callback) {
					
					/* Check if call history id is valid or not */
			        model.getAllWhere(function(err,callHistoryResp){
			        	if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(callHistoryResp == ""){
		                		return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Invalid call history id.')
									        });
		                	}else{

		                		/* To check if review already gave or not */
		                		var isReviewAlreadyDone = 0;
		                		if(callHistoryResp[0].callSenderUserID === masterUserId){
		                			isReviewAlreadyDone = callHistoryResp[0].IsSenderCallReviewDone;
		                		}else{
		                			isReviewAlreadyDone = callHistoryResp[0].IsRecieverCallReviewDone;
		                		}
		                		if(parseInt(isReviewAlreadyDone) === 0){
		                			callback(null, userDetailsObj,masterUserId,callHistoryResp);	
		                		}else{
		                			return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Review already done.')
									        });
		                		}
		                	}
		                }
		            },constant.call_history,{callHistoryID:callHistoryID});	    	
			    }, function (userDetailsObj,masterUserId,callHistoryResp,callback) {
			    	
			    	var friendID = '';
                    if(callHistoryResp[0].callSenderUserID === masterUserId){
                    	friendID = callHistoryResp[0].callRecieverUserID;
                    }else{
                    	friendID = callHistoryResp[0].callSenderUserID;
                    }

                    /* Check user is already blocked */
			    	let blockQuery = 'SELECT * FROM ' + constant.block_users + ' WHERE (`userBlockUserId` = '+masterUserId+' AND `userBlockFriendId` = '+friendID+') OR (`userBlockUserId` = '+friendID+' AND `userBlockFriendId` = '+masterUserId+')';
			        model.customQuery(function(err,blockRespObj){
			        	if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(blockRespObj != ""){
		                		return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'You can not give review on this call.')
									        });
		                	}else{
		                		callback(null, userDetailsObj,masterUserId,callHistoryResp);	
		                	}
		                }
		            },blockQuery);
			    }
			], function (err,userDetailsObj,masterUserId,callHistoryResp) {

				database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Insert call review data */	   
						let callReviewObj = {};
						callReviewObj.callReviewUserID        = masterUserId;
						callReviewObj.callReviewCallHistoryID = callHistoryID;
						callReviewObj.callReviewRating        = callReviewRating;
						callReviewObj.callReviewMessage       = callReviewMessage;
						callReviewObj.callReviewDateTime      = custom.getCurrentTime();
                        let i1 = queryBuilder.insert(constant.call_review,callReviewObj);
                        queryBuilder.reset_query(i1);
                        connection.query(i1, function(err, reviewResp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }
	                        if(!reviewResp){
	                        	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Failed to give a review.')
									        });
	                        }
	                        var callReviewID = parseInt(reviewResp.insertId);

	                    /* Update review call details */
	                    let callReviewHistoryObj = {};
	                    if(callHistoryResp[0].callSenderUserID === masterUserId){
	                    	callReviewHistoryObj.IsSenderCallReviewDone   = 1;
	                    	callReviewHistoryObj.senderCallReview = callReviewRating;
	                    	callReviewHistoryObj.senderCallReviewMessage = callReviewMessage;
	                    	callReviewHistoryObj.senderCallReviewDateTime = custom.getCurrentTime();
	                    }else{
	                    	callReviewHistoryObj.IsRecieverCallReviewDone   = 1;
	                    	callReviewHistoryObj.recieverCallReview = callReviewRating;
	                    	callReviewHistoryObj.recieverCallReviewMessage = callReviewMessage;
	                    	callReviewHistoryObj.recieverCallReviewDateTime = custom.getCurrentTime();
	                    }
	                    	callReviewHistoryObj.recieverCallReview = callReviewRating;
                        let u = queryBuilder.update(constant.call_history,callReviewHistoryObj,{callHistoryID:callHistoryID});
                        queryBuilder.reset_query(u);
                        connection.query(u, function(err, resp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }

	                    var friendID = '';
	                    if(callHistoryResp[0].callSenderUserID === masterUserId){
	                    	friendID = callHistoryResp[0].callRecieverUserID;
	                    }else{
	                    	friendID = callHistoryResp[0].callSenderUserID;
	                    }

	                    /* Insert call review request notification */
					   	let notificationDataObj = {};
                		notificationDataObj.notificationUserId   = masterUserId;
                		notificationDataObj.notificationFriendId = friendID;
                		notificationDataObj.callHistoryModuleID  = callHistoryID;
                		notificationDataObj.notificationModule   = callHistoryResp[0].callHistoryModuleName;
                		notificationDataObj.notificationType     = 'USER_CALL_REVIEW';
                		notificationDataObj.notificationMessage  = 'has gave a call review';
                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
                        let i2 = queryBuilder.insert(constant.notifications,notificationDataObj);
                        queryBuilder.reset_query(i2);
                        connection.query(i2, function(err, resp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }

	                    /* Update friend badges */
                        let u1 = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + friendID;
                        queryBuilder.reset_query(u1);
                        connection.query(u1, function(err, resp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }

                    	connection.commit(function(err) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse());
	                            });
	                        }else{
	                            connection.release();

	                            /* To send push notifications */
	                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " has gave a call review";
	                            let extraParams = {};
	                            extraParams.callHistoryModuleID  = callHistoryID;
	                            extraParams.callScheduleUserID   = masterUserId;
	                            extraParams.callScheduleFriendID = friendID;
	                            extraParams.moduleName = callHistoryResp[0].callHistoryModuleName;
	                            extraParams.notificationType = 'USER_CALL_REVIEW';
	                            notification.sendPushNotifications(userMessage,friendID,extraParams);

	                            /* Return user response */
			            		return res.send({"code" : 200, "response" : {callHistoryModuleID:callHistoryID},"status" : 1,"message" : custom.lang(locale,'Call review successfully done.')});
	                        }
                    	});
                    	});
                    	});
                    	});
                    	});
                	});
				}); 
			});
		}	
	});

	/* To give user dating review
	 * @param {string}  userLoginSessionKey
	 * @param {integer} datingScheduleID
	 * @param {integer} datingReviewRating
	 * @param {string}  datingReviewMessage
	*/
	app.post('/dating/review', function(req, res) {

		let locale = req.headers.locale;
		let userTimeZone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("datingScheduleID").trim();
		req.sanitize("datingReviewRating").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('datingScheduleID', custom.lang(locale,'The Dating schedule id is required')).notEmpty();
	    req.check('datingReviewRating', custom.lang(locale,'Dating review rating is required')).notEmpty();
	    let errors = req.validationErrors();
	    if (errors) {
	        res.send({
	            "code": 200,
	            "response": {},
	            "status": 0,
	            "message": custom.manageValidationMessages(errors)
	        });
	    } else {
			let userLoginSessionKey   = req.sanitize('userLoginSessionKey').escape().trim();
			let datingScheduleID      = parseInt(req.sanitize('datingScheduleID').escape().trim());
			let datingReviewRating    = parseInt(req.sanitize('datingReviewRating').escape().trim());
			let datingReviewMessage   = (!req.body.datingReviewMessage) ? '' : req.body.datingReviewMessage;

	        async.waterfall([
			    function(callback) {
			    	/* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							let masterUserId = parseInt(respObj[0].masterUserId);
							callback(null, respObj,masterUserId);
						}
					},userLoginSessionKey,userTimeZone);
			    },
			    function(userDetailsObj,masterUserId, callback) {
					
					/* Check if dating history id is valid or not */
			        model.getAllWhere(function(err,datingResp){
			        	if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(datingResp == ""){
		                		return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Invalid dating schedule id.')
									        });
		                	}else{

		                		/* To check if review already gave or not */
		                		var isReviewAlreadyDone = 0;
		                		if(datingResp[0].datingScheduleUserID === masterUserId){
		                			isReviewAlreadyDone = datingResp[0].IsSenderDatingReviewDone;
		                		}else{
		                			isReviewAlreadyDone = datingResp[0].IsRecieverDatingReviewDone;
		                		}
		                		if(parseInt(isReviewAlreadyDone) === 0){
		                			callback(null, userDetailsObj,masterUserId,datingResp);	
		                		}else{
		                			return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Review already done.')
									        });
		                		}
		                	}
		                }
		            },constant.schedule_dating,{datingScheduleID:datingScheduleID});	    	
			    }, function (userDetailsObj,masterUserId,datingResp,callback) {
			    	
			    	var friendID = '';
                    if(datingResp[0].datingScheduleUserID === masterUserId){
                    	friendID = datingResp[0].datingScheduleFriendID;
                    }else{
                    	friendID = datingResp[0].datingScheduleUserID;
                    }

                    /* Check user is already blocked */
			    	let blockQuery = 'SELECT * FROM ' + constant.block_users + ' WHERE (`userBlockUserId` = '+masterUserId+' AND `userBlockFriendId` = '+friendID+') OR (`userBlockUserId` = '+friendID+' AND `userBlockFriendId` = '+masterUserId+')';
			        model.customQuery(function(err,blockRespObj){
			        	if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(blockRespObj != ""){
		                		return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'You can not give review on this date.')
									        });
		                	}else{
		                		callback(null, userDetailsObj,masterUserId,datingResp);	
		                	}
		                }
		            },blockQuery);
			    }
			], function (err,userDetailsObj,masterUserId,datingResp) {

				database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Insert date review data */	   
						let dateReviewObj = {};
						dateReviewObj.datingReviewUserID         = masterUserId;
						dateReviewObj.datingReviewDateScheduleID = datingScheduleID;
						dateReviewObj.datingReviewRating         = datingReviewRating;
						dateReviewObj.datingReviewMessage        = datingReviewMessage;
						dateReviewObj.datingReviewDateTime       = custom.getCurrentTime();
                        let i1 = queryBuilder.insert(constant.dating_review,dateReviewObj);
                        queryBuilder.reset_query(i1);
                        connection.query(i1, function(err, reviewResp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }
	                        if(!reviewResp){
	                        	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Failed to give a review.')
									        });
	                        }
	                        var datingReviewID = parseInt(reviewResp.insertId);

	                    /* Update review date details */
	                    let dateReviewDateScheduleObj = {};
	                    if(datingResp[0].datingScheduleUserID === masterUserId){
	                    	dateReviewDateScheduleObj.IsSenderDatingReviewDone   = 1;
	                    	dateReviewDateScheduleObj.senderDatingReview = datingReviewRating;
	                    	dateReviewDateScheduleObj.senderDatingReviewMessage = datingReviewMessage;
	                    	dateReviewDateScheduleObj.senderDatingReviewDateTime = custom.getCurrentTime();
	                    }else{
	                    	dateReviewDateScheduleObj.IsRecieverDatingReviewDone   = 1;
	                    	dateReviewDateScheduleObj.recieverDatingReview = datingReviewRating;
	                    	dateReviewDateScheduleObj.recieverDatingReviewMessage = datingReviewMessage;
	                    	dateReviewDateScheduleObj.recieverDatingReviewDateTime = custom.getCurrentTime();
	                    }
	                    dateReviewDateScheduleObj.isNotificationSent = 1;
                        let u = queryBuilder.update(constant.schedule_dating,dateReviewDateScheduleObj,{datingScheduleID:datingScheduleID});
                        queryBuilder.reset_query(u);
                        connection.query(u, function(err, resp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }

	                    var friendID = '';
	                    if(datingResp[0].datingScheduleUserID === masterUserId){
	                    	friendID = datingResp[0].datingScheduleFriendID;
	                    }else{
	                    	friendID = datingResp[0].datingScheduleUserID;
	                    }

	                    /* Insert date review request notification */
					   	let notificationDataObj = {};
                		notificationDataObj.notificationUserId   = masterUserId;
                		notificationDataObj.notificationFriendId = friendID;
                		notificationDataObj.dateScheduleModuleID = datingScheduleID;
                		notificationDataObj.notificationModule   = 'DATING';
                		notificationDataObj.notificationType     = 'USER_DATE_REVIEW';
                		notificationDataObj.notificationMessage  = 'has gave a dating review';
                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
                        let i2 = queryBuilder.insert(constant.notifications,notificationDataObj);
                        queryBuilder.reset_query(i2);
                        connection.query(i2, function(err, resp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }

	                    /* Update friend badges */
                        let u1 = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + friendID;
                        queryBuilder.reset_query(u1);
                        connection.query(u1, function(err, resp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }

                    	connection.commit(function(err) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse());
	                            });
	                        }else{
	                            connection.release();

	                            /* To send push notifications */
	                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " has gave a dating review";
	                            let extraParams = {};
	                            extraParams.dateScheduleModuleID = datingScheduleID;
	                            extraParams.callScheduleUserID   = masterUserId;
	                            extraParams.callScheduleFriendID = friendID;
	                            extraParams.moduleName = 'DATING';
	                            extraParams.notificationType = 'USER_DATE_REVIEW';
	                            notification.sendPushNotifications(userMessage,friendID,extraParams);

	                            /* Return user response */
			            		return res.send({"code" : 200, "response" : {dateScheduleModuleID:datingScheduleID},"status" : 1,"message" : custom.lang(locale,'Dating review successfully done.')});
	                        }
                    	});
                    	});
                    	});
                    	});
                    	});
                	});
				}); 
			});
		}	
	});

	/* To give user job review
	 * @param {string}  userLoginSessionKey
	 * @param {integer} jobID
	 * @param {integer} jobReviewRating
	 * @param {string}  jobReviewMessage
	*/
	app.post('/job/review', function(req, res) {

		let locale = req.headers.locale;
		let userTimeZone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("jobID").trim();
		req.sanitize("jobReviewRating").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('jobID', custom.lang(locale,'The Job id field is required')).notEmpty();
	    req.check('jobReviewRating', custom.lang(locale,'Job review rating is required')).notEmpty();
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
			let jobID               = parseInt(req.sanitize('jobID').escape().trim());
			let jobReviewRating     = parseInt(req.sanitize('jobReviewRating').escape().trim());
			let jobReviewMessage    = (!req.body.jobReviewMessage) ? '' : req.body.jobReviewMessage;

	        async.waterfall([
			    function(callback) {
			    	/* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							let masterUserId = parseInt(respObj[0].masterUserId);
							callback(null, respObj,masterUserId);
						}
					},userLoginSessionKey,userTimeZone);
			    },
			    function(userDetailsObj,masterUserId, callback) {
					
					/* Validate job details */
			        model.getAllWhere(function(err,jobResp){
			        	if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(jobResp == ""){
		                		return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Invalid Job id.')
									        });
		                	}else{
		                		if(jobResp[0].jobGlobalStatus === 'COMPLETED'){

		                			/* To check if review already gave or not */
			                		model.getAllWhere(function(err,reviewResp){
			                			if(err){
						                    return res.send(custom.dbErrorResponse());
						                }else{
						                	if(reviewResp != ""){
						                		return res.send({
												            "code": 200,
												            "response": {},
												            "status": 0,
												            "message": custom.lang(locale,'Review already done.')
												        });
						                	}else{
						                		callback(null, userDetailsObj,masterUserId,jobResp);	
						                	}
						                }
			                		},constant.jobs_review,{jobReviewUserID:masterUserId,jobReviewParentID:jobID});
		                		}else{
		                			return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'You can not give review for this job.')
									        });
		                		}
		                	}
		                }
		            },constant.jobs,{jobID:jobID});	    	
			    }, function (userDetailsObj,masterUserId,jobResp,callback) {
			    	
			    	var friendID = '';
                    if(jobResp[0].jobHirerUserID === masterUserId){
                    	friendID = jobResp[0].jobProviderUserID;
                    }else{
                    	friendID = jobResp[0].jobHirerUserID;
                    }

                    /* Check user is already blocked */
			    	let blockQuery = 'SELECT * FROM ' + constant.block_users + ' WHERE (`userBlockUserId` = '+masterUserId+' AND `userBlockFriendId` = '+friendID+') OR (`userBlockUserId` = '+friendID+' AND `userBlockFriendId` = '+masterUserId+')';
			        model.customQuery(function(err,blockRespObj){
			        	if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(blockRespObj != ""){
		                		return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'You can not give review for this job.')
									        });
		                	}else{
		                		/* Get friends details */
		                		custom.getUserProfileDetails(function(respType,friendsDetails){
		                			if(respType === 0){
		                				return friendsDetails;
		                			}else{
		                				callback(null, userDetailsObj,masterUserId,jobResp,friendsDetails);	
		                			}
		                		},friendID);
		                	}
		                }
		            },blockQuery);
			    }
			], function (err,userDetailsObj,masterUserId,jobResp,friendsDetails) {

				database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Insert job review data */	   
						let jobReviewObj = {};
						jobReviewObj.jobReviewUserID   = masterUserId;
						jobReviewObj.jobReviewParentID = jobID;
						jobReviewObj.jobReviewRating   = jobReviewRating;
						jobReviewObj.jobReviewMessage  = jobReviewMessage;
						jobReviewObj.jobReviewDateTime = custom.getCurrentTime();
                        let i1 = queryBuilder.insert(constant.jobs_review,jobReviewObj);
                        queryBuilder.reset_query(i1);
                        connection.query(i1, function(err, reviewResp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }
	                        if(!reviewResp){
	                        	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Failed to give a review.')
									        });
	                        }
	                        var jobReviewID = parseInt(reviewResp.insertId);
		                    var friendID = '';
		                    if(jobResp[0].jobHirerUserID === masterUserId){
		                    	friendID = jobResp[0].jobProviderUserID;
		                    }else{
		                    	friendID = jobResp[0].jobHirerUserID;
		                    }

                    	connection.commit(function(err) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse());
	                            });
	                        }else{
	                            connection.release();

	                            // BACKGROUD PROCESS (IN QUEUE)

	                            /* Update user overall review */
				                let userRatingAvg = 0;
				                let userCurrentRating = friendsDetails[0].userRating;
				                let noOfReviews       = parseInt(friendsDetails[0].noOfReviews);
				                let totalRating       = custom.parseNumber(jobReviewRating + userCurrentRating);
				                let totalReviews      = noOfReviews + 1;
				                userRatingAvg		  = totalRating / totalReviews;
		                        let u1 = "UPDATE (`"+constant.user_details+"`) SET `noOfReviews` = noOfReviews + 1, `userRating` = " + custom.parseNumber(userRatingAvg) + " WHERE `userId` = " + friendID;
		                        model.customQuery(function(err,reviewResp){
		                        	if(err){
	                            		console.log('Job Review overall error',err);
	                            	}else{
	                            		console.log('Job Review overall success');
	                            	}
		                        },u1);

		                        /* Update job review */
		                        model.updateData(function(err,jobReviewResp){
		                        	if(err){
	                            		console.log('Job Review app notification error',err);
	                            	}else{
	                            		console.log('Job Review app notification success');
	                            	}
		                        },constant.jobs,{jobReview:jobReviewRating},{jobID:jobID});

	                            /* Insert job request notification */
							   	let notificationDataObj = {};
		                		notificationDataObj.notificationUserId   = masterUserId;
		                		notificationDataObj.notificationFriendId = friendID;
		                		notificationDataObj.jobModuleID          = jobID;
		                		notificationDataObj.notificationModule   = 'PROVIDER';
		                		notificationDataObj.notificationType     = 'USER_JOB_REVIEW';
		                		notificationDataObj.notificationMessage  = 'has submitted a job review.';
		                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
		                		model.insertData(function(err,notificationResp){
	                            	if(err){
	                            		console.log('Job Review app notification error',err);
	                            	}else{
	                            		console.log('Job Review app notification success');
	                            	}
	                            },constant.notifications,notificationDataObj);

	                            /* Update friend badges */
	                            let updateQuery = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + friendID;
	                            model.customQuery(function(err,badgesResp){
	                            	if(err){
	                            		console.log('Job Review app notification badges error',err);
	                            	}else{
	                            		console.log('Job Review app notification badges success');
	                            	}
	                            },updateQuery);

	                            /* To send push notifications */
	                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " has submitted a job review.";
	                            let extraParams = {};
	                            extraParams.jobModuleID       = jobID;
	                            extraParams.jobHirerUserID    = jobResp[0].jobHirerUserID;
	                            extraParams.jobProviderUserID = jobResp[0].jobProviderUserID;
	                            extraParams.moduleName        = 'PROVIDER';
	                            extraParams.notificationType  = 'USER_JOB_REVIEW';
	                            notification.sendPushNotifications(userMessage,friendID,extraParams);

	                            /* Return user response */
			            		return res.send({"code" : 200, "response" : {jobModuleID:jobID},"status" : 1,"message" : custom.lang(locale,'Job review successfully done.')});
	                        }
                    	});
                    	});
                	});
				}); 
			});
		}	
	});

	/* To get job review listing
	 * @param {integer} userID
	 * @param {integer} pageNo
	*/
	app.post('/job-review/list', function(req, res) {

		let locale = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userID").trim();
		req.sanitize("pageNo").trim();
	    req.check('userID', custom.lang(locale,'The User Id field is required')).notEmpty();
	    req.check('pageNo', custom.lang(locale,'Require page number')).notEmpty();
	    req.check('pageNo', custom.lang(locale,'Page number minimum value should be 1')).minValue(1);
	    let errors = req.validationErrors();
	    if (errors) {
	        res.send({
	            "code": 200,
	            "response": {},
	            "status": 0,
	            "message": custom.manageValidationMessages(errors)
	        });
	    } else {
			let userID       = parseInt(req.sanitize('userID').escape().trim());
			let pageNo       = parseInt(req.sanitize('pageNo').escape().trim());
			let moduleName   = 'PROVIDER';

			async.waterfall([
			    function(callback) {
					custom.getUserProfileDetails(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							callback(null, respObj);
						}
					},userID);
			    },
			    function(userDetailsObj, callback) {

			    	let masterUserId = parseInt(userDetailsObj[0].masterUserId);
			    	var notInUserIds = [];
			    	notInUserIds.push(0);

			    	/* Get blocked users  */
			    	model.getAllWhere(function(err,blockedUsersResp){
			    		if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(blockedUsersResp != ""){
		                		for (var i = 0; i < parseInt(blockedUsersResp.length); i++) 
							    {
							    	notInUserIds.push(parseInt(blockedUsersResp[i].userBlockFriendId));
							    }
							    callback(null, userDetailsObj,notInUserIds,masterUserId);
		                	}else{
		                		callback(null, userDetailsObj,notInUserIds,masterUserId);
		                	}
		                }
			    	},constant.block_users,{userBlockUserId:masterUserId});
			    },
			    function(userDetailsObj,notInUserIds,masterUserId, callback) {

			    	notInUserIds.push(masterUserId);

			    	/* To remove duplicate values */
			    	notInUserIds = Array.from(new Set(notInUserIds));

			    	/* To get offset */
			    	let offset = custom.getOffset(pageNo);

			    	/* To get users */
			    	var reviewQuery = "SELECT * FROM " + constant.jobs + " AS `J` INNER JOIN " + constant.jobs_review + " AS `JR` ON `J`.`jobID` = `JR`.`jobReviewParentID` WHERE (`J`.`jobHirerUserID` = " + masterUserId + " OR `J`.`jobProviderUserID` = " + masterUserId + ") AND `JR`.`jobReviewUserID` != " + masterUserId + " GROUP BY `J`.`jobID` ORDER BY `JR`.`jobReviewID` DESC ";
			    	model.customQuery(function(err,reviewsResp){
			    		if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	let totalReviews = parseInt(reviewsResp.length);
		                	if(offset > 0){
					    		reviewQuery += "LIMIT " + offset + "," + constant.results_limit;
					    	}else{
					    		reviewQuery += "LIMIT " + constant.results_limit
					    	}
					        model.customQuery(function(err,reviewRespObj){
					        	if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(reviewRespObj != ""){
				                		callback(null, userDetailsObj, reviewRespObj,totalReviews);
				                	}else{
				                		return res.send({
										            "code": 200,
										            "response": [],
										            "status": 0,
										            "message": custom.lang(locale,"Reviews not found.")
										        });
				                	}
				                }
					        },reviewQuery);
		                }
		            },reviewQuery);
			    }
			], function (err,userDetailsObj,reviewRespObj,totalReviews) {
				let masterUserId = parseInt(userDetailsObj[0].masterUserId);
				let responseObj  = [];
				for (var i = 0; i < parseInt(reviewRespObj.length); i++) 
                {
                	let row = {};
                	row.jobTitle          = custom.nullChecker(reviewRespObj[i].jobTitle);
                    row.jobDescprition    = custom.nullChecker(reviewRespObj[i].jobDescprition);
                    row.jobID             = parseInt(reviewRespObj[i].jobID);
                    row.jobReviewID       = parseInt(reviewRespObj[i].jobReviewID);
                    row.jobReviewRating   = parseInt(reviewRespObj[i].jobReviewRating);
                    row.jobReviewMessage  = custom.nullChecker(reviewRespObj[i].jobReviewMessage);
                    row.jobReviewDateTime = custom.changeDateFormat(reviewRespObj[i].jobReviewDateTime);
                	responseObj.push(row);
                	if (i === parseInt(reviewRespObj.length - 1)) {
                      return res.send({
						            "code": 200,
						            "response": responseObj,
						            "status": 1,
						            "totalCount": totalReviews,
						            "message": custom.lang(locale,"success.")
						        });
                    }
                }
			});
		}	
	});


}