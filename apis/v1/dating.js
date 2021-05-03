"use strict";

/*
 * Purpose : For Dating Rest API
 * Package : Dating
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
		moment       = require('moment'),
		queryBuilder = require(appRoot + '/lib/query-builder.js').QueryBuilder();

	/* To schedule user date
	 * @param {string}  userLoginSessionKey
	 * @param {integer} friendID
	 * @param {string}  datingScheduleDate
	 * @param {string}  datingScheduleTime
	 * @param {string}  datingLocation
	 * @param {string}  datingLocationLatitude
	 * @param {string}  datingLocationLongitude
	 * @param {string}  datingAfterMath
	 * @param {string}  datesNote (Optional)
	*/
	app.post('/date/schedule', function(req, res) {

		let locale = req.headers.locale;
		let userTimeZone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("friendID").trim();
		req.sanitize("datingScheduleDate").trim();
		req.sanitize("datingScheduleTime").trim();
		req.sanitize("datingLocation").trim();
		req.sanitize("datingAfterMath").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('friendID', custom.lang(locale,'The Friend id is required')).notEmpty();
	    req.check('datingScheduleDate', custom.lang(locale,'Date schedule date is required')).notEmpty();
	    req.check('datingScheduleTime', custom.lang(locale,'Date schedule time is required')).notEmpty();
	    req.check('datingLocation', custom.lang(locale,'Date location field is required')).notEmpty();
	    req.check('datingAfterMath', custom.lang(locale,'Date after math field is required')).notEmpty();
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
			let friendID              = parseInt(req.sanitize('friendID').escape().trim());
			let datingScheduleDate    = req.sanitize('datingScheduleDate').escape().trim();
			let datingScheduleTime    = req.sanitize('datingScheduleTime').escape().trim();
			let datingLocation        = req.body.datingLocation;
			let datingAfterMath       = req.body.datingAfterMath;
			let datingLocationLatitude  = (!req.body.datingLocationLatitude) ? '' : req.body.datingLocationLatitude;
			let datingLocationLongitude= (!req.body.datingLocationLongitude) ? '' : req.body.datingLocationLongitude;
			let isValidDate           = custom.validateDateTime(datingScheduleDate,'YYYY-MM-DD');
			let isValidTime           = custom.validateDateTime(datingScheduleTime,'HH:mm');
			let datesNote             = (!req.body.datesNote) ? '' : req.sanitize('datesNote').escape().trim();

			/* Validate date schedule date */
	        if(!isValidDate){
	            return res.send({
	                        "code": 200,
	                        "response": {},
	                        "status": 0,
	                        "message": custom.lang(locale,'Invalid Dating schedule date format, should be (YYYY-MM-DD)')
	                    });
	        }

	        /* Validate date schedule time */
	        if(!isValidTime){
	            return res.send({
	                        "code": 200,
	                        "response": {},
	                        "status": 0,
	                        "message": custom.lang(locale,'Invalid Dating schedule time format, should be (HH:mm)')
	                    });
	        }

	        /* Validate future date time */
	        let datingScheduleDateTime = datingScheduleDate + " " + datingScheduleTime + ":00";
	        let currentDateTime        = custom.getCurrentTime();
	        if(currentDateTime > datingScheduleDateTime)
	        {
	        	return res.send({
	                        "code": 200,
	                        "response": {},
	                        "status": 0,
	                        "message": custom.lang(locale,'Dating schedule date time must be future date time')
	                    });
	        }

	        async.waterfall([
			    function(callback) {
			    	/* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							let masterUserId = parseInt(respObj[0].masterUserId);

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
											            "message": custom.lang(locale,'You can not schedule date with this user.')
											        });
				                	}else{
				                		callback(null, respObj,masterUserId);
				                	}
				                }
				            },blockQuery);
						}
					},userLoginSessionKey,userTimeZone);
			    },
			    function(userDetailsObj,masterUserId, callback) {
					
					/* Check if date already scheduled */
			    	let scheduleQuery = 'SELECT * FROM ' + constant.schedule_dating + ' WHERE `isScheduledDateMutuallyConfirmed` = 1  AND datingGlobalStatus = "ACCEPT"  AND `datingScheduleDate` = "' + custom.changeDateFormat(datingScheduleDate,'yyyy-mm-dd') + '" AND `datingScheduleTime` = "' + datingScheduleTime + '" AND ((`datingScheduleUserID` = ' + friendID + ' OR `datingScheduleFriendID` = ' + masterUserId + ') OR (`datingScheduleUserID` = ' + masterUserId + ' OR `datingScheduleFriendID` = ' + friendID + '))';
			        model.customQuery(function(err,scheduleQuery){
			        	if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(scheduleQuery != ""){
		                		return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Date already scheduled in same datetime period.')
									        });
		                	}else{
		                		callback(null, userDetailsObj,masterUserId);	
		                	}
		                }
		            },scheduleQuery);	    	
			    }
			], function (err,userDetailsObj,masterUserId) {

				database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Insert date schedule data */	   
						let dateScheduleObj = {};
						dateScheduleObj.datingScheduleModuleName = 'DATING';
						dateScheduleObj.datingScheduleUserID     = masterUserId;
						dateScheduleObj.datingScheduleFriendID   = friendID;
						dateScheduleObj.datingLocation           = datingLocation;
						dateScheduleObj.datingLocationLatitude   = datingLocationLatitude;
						dateScheduleObj.datingLocationLongitude  = datingLocationLongitude;
						dateScheduleObj.datingAfterMath          = datingAfterMath;
						dateScheduleObj.datesNote                = datesNote;
						dateScheduleObj.datingScheduleDate       = datingScheduleDate;
						dateScheduleObj.datingScheduleTimeZone   = (userTimeZone) ? userTimeZone : constant.default_timezone;
						dateScheduleObj.datingScheduleTime       = datingScheduleTime;
						dateScheduleObj.datingScheduleUserStatus = 'ACCEPT';
						dateScheduleObj.datingScheduleUserResponseDateTime = custom.getCurrentTime();
						dateScheduleObj.userDateRequestTime    = custom.getCurrentTime();
                        let i1 = queryBuilder.insert(constant.schedule_dating,dateScheduleObj);
                        queryBuilder.reset_query(i1);
                        connection.query(i1, function(err, callResp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }
	                        if(!callResp){
	                        	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Failed to schedule your date.')
									        });
	                        }
	                        var datingScheduleID = parseInt(callResp.insertId);

	                    /* Insert date schedule request notification */
					   	let notificationDataObj = {};
                		notificationDataObj.notificationUserId   = masterUserId;
                		notificationDataObj.notificationFriendId = friendID;
                		notificationDataObj.dateScheduleModuleID = datingScheduleID;
                		notificationDataObj.notificationModule   = 'DATING';
                		notificationDataObj.actionStatus         = 'PENDING';
                		notificationDataObj.notificationType     = 'SCHEDULE_DATE';
                		notificationDataObj.notificationMessage  = 'has scheduled a date with you';
                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
						notificationDataObj.notificationParams   = JSON.stringify({datingScheduleDate:datingScheduleDate,datingScheduleTime:datingScheduleTime + ":00",datingGlobalStatus:'PENDING',datingScheduleUserStatus:'ACCEPT',datingScheduleFriendStatus:'PENDING',datingLocation:datingLocation,datingLocationLatitude:datingLocationLatitude,datingLocationLongitude:datingLocationLongitude,datingAfterMath:datingAfterMath,datesNote:datesNote});
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
	                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " has scheduled a date with you";
	                            let extraParams = {};
	                            extraParams.dateScheduleModuleID = datingScheduleID;
	                            extraParams.datingScheduleUserID   = masterUserId;
	                            extraParams.datingScheduleFriendID = friendID;
	                            extraParams.moduleName = 'DATING';
	                            extraParams.notificationType = 'SCHEDULE_DATE';
	                            notification.sendPushNotifications(userMessage,friendID,extraParams);

	                            /* Return user response */
			            		return res.send({"code" : 200, "response" : {dateScheduleModuleID:datingScheduleID},"status" : 1,"message" : custom.lang(locale,'Your date scheduled sucessfully.')});
	                        }
                    	});
                    	});
                    	});
                    	});
                	});
				}); 
			});
		}	
	});

	/* To accept scheduled date
	 * @param {string}  userLoginSessionKey
	 * @param {integer} dateScheduleModuleID
	 * @param {integer} notificationId (Optional)
	*/
	app.post('/scheduled-date/accept', function(req, res) {

		let locale = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("dateScheduleModuleID").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('dateScheduleModuleID', custom.lang(locale,'The Date schedule module id required')).notEmpty();
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
			let dateScheduleModuleID  = parseInt(req.sanitize('dateScheduleModuleID').escape().trim());
			let notificationId        = (!req.body.notificationId) ? 0 : parseInt(req.body.notificationId);

	        async.waterfall([
			    function(callback) {
			    	/* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							let masterUserId = parseInt(respObj[0].masterUserId);

							/* Get schedule date details */
					        model.getAllWhere(function(err,dateScheduleDetails){
					        	if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(dateScheduleDetails == ""){
				                		return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,'Invalid date schedule module id.')
											        });
				                	}else{
				                		callback(null, respObj,masterUserId,dateScheduleDetails);
				                	}
				                }
				            },constant.schedule_dating,{datingScheduleID:dateScheduleModuleID});
						}
					},userLoginSessionKey,timezone);
			    },
			    function(userDetailsObj,masterUserId,dateScheduleDetails, callback) {
					
					let datingScheduleUserID   = parseInt(dateScheduleDetails[0].datingScheduleUserID);
					let datingScheduleFriendID = parseInt(dateScheduleDetails[0].datingScheduleFriendID);
					let isScheduledDateMutuallyConfirmed = parseInt(dateScheduleDetails[0].isScheduledDateMutuallyConfirmed);
					let isUserDateReviewDone = parseInt(dateScheduleDetails[0].isUserDateReviewDone);
			        let datingScheduleUserStatus   = dateScheduleDetails[0].datingScheduleUserStatus;
			        let datingScheduleFriendStatus = dateScheduleDetails[0].datingScheduleFriendStatus;

					/* To validate date schedule future date */
			        let datingScheduleDate = custom.changeDateFormat(dateScheduleDetails[0].datingScheduleDate,'yyyy-mm-dd');
			        let datingScheduleTime = dateScheduleDetails[0].datingScheduleTime;
			        let datingGlobalStatus = dateScheduleDetails[0].datingGlobalStatus;
			        let currentDateTime    = custom.getCurrentTime();
			        let datingScheduleDateTime  = datingScheduleDate + " " + datingScheduleTime + ":00";
					if(isUserDateReviewDone === 1){
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled date already completed.')
							        });
					}else if(isScheduledDateMutuallyConfirmed === 1){
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled date already accepted.')
							        });
					}else if(currentDateTime > datingScheduleDateTime){
			        	return res.send({
			                        "code": 200,
			                        "response": {},
			                        "status": 0,
			                        "message": custom.lang(locale,'Scheduled date has past date, you can`t accept this date.')
			                    });
			        }else if(datingScheduleUserID === masterUserId && datingScheduleUserStatus === 'ACCEPT'){
			        	return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled date already accepted.')
							        });
					}else if(datingScheduleFriendID === masterUserId && datingScheduleFriendStatus === 'ACCEPT'){
			        	return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled date already accepted.')
							        });
					}else if(datingGlobalStatus === 'AUTO_REJECT' || datingGlobalStatus === 'REJECT'){
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled date already rejected.')
							        });
					}else if(datingGlobalStatus === 'CANCELLED'){
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled date already cancelled.')
							        });
					}else if(datingGlobalStatus === "PENDING"){
						callback(null, userDetailsObj,masterUserId,dateScheduleDetails);
					}else{
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Failed please try again.')
							        });
					}
						    	
			    }
			], function (err,userDetailsObj,masterUserId,dateScheduleDetails) {

				database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Update date schedule data */	  
                        var isUserAcceptedDate   = 0; 
                        var isFriendAcceptedDate = 0; 
                        var datingScheduleUserStatus = dateScheduleDetails[0].datingScheduleUserStatus; 
                        var datingScheduleFriendStatus = dateScheduleDetails[0].datingScheduleFriendStatus; 
                        var datingGlobalStatus = dateScheduleDetails[0].datingGlobalStatus; 
                        if(dateScheduleDetails[0].datingScheduleUserStatus === 'ACCEPT')
                        {
                        	isUserAcceptedDate = 1;
                        }
                        if(dateScheduleDetails[0].datingScheduleFriendStatus === 'ACCEPT')
                        {
                        	isFriendAcceptedDate = 1;
                        }
						let dateScheduleObj = {};
						if(dateScheduleDetails[0].datingScheduleUserID === masterUserId && dateScheduleDetails[0].datingScheduleUserStatus === 'PENDING')
						{
							isUserAcceptedDate = 1;
							datingScheduleUserStatus = 'ACCEPT';
							dateScheduleObj.datingScheduleUserStatus = 'ACCEPT';
							dateScheduleObj.datingScheduleUserResponseDateTime = custom.getCurrentTime();
						}
						if(dateScheduleDetails[0].datingScheduleFriendID === masterUserId && dateScheduleDetails[0].datingScheduleFriendStatus === 'PENDING')
						{
							isFriendAcceptedDate = 1;
							datingScheduleFriendStatus = 'ACCEPT';
							dateScheduleObj.datingScheduleFriendStatus = 'ACCEPT';
							dateScheduleObj.datingScheduleFriendResponseDateTime = custom.getCurrentTime();
						}
						if(isUserAcceptedDate === 1 && isFriendAcceptedDate === 1)
						{
							dateScheduleObj.isScheduledDateMutuallyConfirmed = 1;
							dateScheduleObj.datingGlobalStatus = 'ACCEPT';
							datingGlobalStatus = 'ACCEPT';
						}	
                        let i1 = queryBuilder.update(constant.schedule_dating,dateScheduleObj,{datingScheduleID:dateScheduleModuleID});
                        queryBuilder.reset_query(i1);
                        connection.query(i1, function(err, callResp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }
	                        if(!callResp){
	                        	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Failed to accept scheduled date request.')
									        });
	                        }

	                    /* Insert accept scheduled date notification */
	                    var notificationUserId   = '';
	                    var notificationFriendId = '';
	                    if(dateScheduleDetails[0].datingScheduleUserID === masterUserId){
	                    	notificationUserId   = dateScheduleDetails[0].datingScheduleUserID;
	                    	notificationFriendId = dateScheduleDetails[0].datingScheduleFriendID;
						}else{
							notificationUserId   = dateScheduleDetails[0].datingScheduleFriendID;
	                    	notificationFriendId = dateScheduleDetails[0].datingScheduleUserID;
						}
					   	let notificationDataObj = {};
                		notificationDataObj.notificationUserId   = notificationUserId;
                		notificationDataObj.notificationFriendId = notificationFriendId;
                		notificationDataObj.dateScheduleModuleID = dateScheduleModuleID;
                		notificationDataObj.notificationModule   = 'DATING';
                		notificationDataObj.notificationType     = 'ACCPET_SCHEDULED_DATE';
                		notificationDataObj.notificationMessage  = 'has accepted your dating request';
                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
                		notificationDataObj.notificationParams   = JSON.stringify({datingScheduleDate:custom.changeDateFormat(dateScheduleDetails[0].datingScheduleDate,'yyyy-mm-dd'),datingScheduleTime:dateScheduleDetails[0].datingScheduleTime + ":00",datingGlobalStatus:datingGlobalStatus,datingScheduleUserStatus:datingScheduleUserStatus,datingScheduleFriendStatus:datingScheduleFriendStatus,datingLocation:dateScheduleDetails[0].datingLocation,datingLocationLatitude:dateScheduleDetails[0].datingLocationLatitude,datingLocationLongitude:dateScheduleDetails[0].datingLocationLongitude,datingAfterMath:dateScheduleDetails[0].datingAfterMath,datesNote:custom.nullChecker(dateScheduleDetails[0].datesNote)});
                        let i2 = queryBuilder.insert(constant.notifications,notificationDataObj);
                        queryBuilder.reset_query(i2);
                        connection.query(i2, function(err, resp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }

	                    /* Update friend badges */
                        let u1 = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + notificationFriendId;
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

	                            /* To check block user request */
	                            custom.isUserBlocked(function(respType,respDetails){
	                            	if(respType === 0){
	                            		return res.send(custom.dbErrorResponse());
	                            	}else if(respType === 2){
	                            		/* To send push notifications */
			                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " has accepted your dating request";
			                            let extraParams = {};
			                            extraParams.dateScheduleModuleID = dateScheduleModuleID;
			                            extraParams.datingScheduleUserID   = notificationUserId;
			                            extraParams.datingScheduleFriendID = notificationFriendId;
			                            extraParams.moduleName = 'DATING';
			                            extraParams.datingGlobalStatus = dateScheduleDetails[0].datingGlobalStatus;
			                            extraParams.notificationType = 'ACCPET_SCHEDULED_DATE';
			                            notification.sendPushNotifications(userMessage,notificationFriendId,extraParams);
	                            	}
	                            },notificationUserId,notificationFriendId);

	                            /* Auto reject other dates request in same time */
	                            if(isUserAcceptedDate === 1 && isFriendAcceptedDate === 1)
								{
									let bothUsers  = new Array(0);
									bothUsers.push(notificationUserId);
									bothUsers.push(notificationFriendId);
							    	let scheduleQuery = 'SELECT * FROM ' + constant.schedule_dating + ' WHERE `datingScheduleDate` = "' + custom.changeDateFormat(dateScheduleDetails[0].datingScheduleDate,'yyyy-mm-dd') + '" AND `datingScheduleTime` = "' + dateScheduleDetails[0].datingScheduleTime + '" AND `datingScheduleID` != ' + dateScheduleModuleID + ' AND (`datingScheduleUserID` IN (' + bothUsers.join() + ' )OR `datingScheduleFriendID` IN (' + bothUsers.join() + '))';
							    	console.log('scheduleQuery',scheduleQuery);
							        model.customQuery(function(err,scheduledDateResp){
							        	if(err){
						                    return res.send(custom.dbErrorResponse());
						                }else{
						                	if(scheduledDateResp != "")
						                	{
						                	  let totalScheduledDates = parseInt(scheduledDateResp.length);
						                	  if(totalScheduledDates > 0)
						                	  {
						                	  	for (var i = 0; i < totalScheduledDates; i++) 
						                	  	{
						                	  		var dateScheduleObj = {};
						                	  		dateScheduleObj.datingGlobalStatus = 'AUTO_REJECT';	

						                	  		/* Update auto reject date status */
						                	  		model.updateData(function(err,updateResp){
						                	  			if(err){
										                    return res.send(custom.dbErrorResponse());
										                }else{
										                	console.log('affectedRows',parseInt(updateResp.affectedRows));
										                }
						                	  		},constant.schedule_dating,dateScheduleObj,{datingScheduleID:scheduledDateResp[i].datingScheduleID});
						                	  	}
						                	  }
						                	}
						                }
						            },scheduleQuery);	
						        }

						        /* Update Old Notification */
						        if(notificationId > 0)
						        {
						        	model.updateData(function(err,updateNotiResp){
						        	},constant.notifications,{actionStatus:"ACCEPT"},{notificationId:notificationId});
						        }
	                           
	                            /* Return user response */
			            		return res.send({"code" : 200, "response" : {dateScheduleModuleID:dateScheduleModuleID},"status" : 1,"message" : custom.lang(locale,'Date request accepted sucessfully.')});
	                        }
                    	});
                    	});
                    	});
                    	});
                	});
				}); 
			});
		}	
	});

	/* To reject scheduled date
	 * @param {string}  userLoginSessionKey
	 * @param {integer} dateScheduleModuleID
	 * @param {integer} notificationId (Optional)
	*/
	app.post('/scheduled-date/reject', function(req, res) {

		let locale   = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("dateScheduleModuleID").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('dateScheduleModuleID', custom.lang(locale,'The Date schedule module id required')).notEmpty();
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
			let dateScheduleModuleID  = parseInt(req.sanitize('dateScheduleModuleID').escape().trim());
			let notificationId        = (!req.body.notificationId) ? 0 : parseInt(req.body.notificationId);

	        async.waterfall([
			    function(callback) {
			    	/* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							let masterUserId = parseInt(respObj[0].masterUserId);

							/* Get schedule call details */
					        model.getAllWhere(function(err,dateScheduleDetails){
					        	if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(dateScheduleDetails == ""){
				                		return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,'Invalid date schedule module id.')
											        });
				                	}else{
				                		callback(null, respObj,masterUserId,dateScheduleDetails);
				                	}
				                }
				            },constant.schedule_dating,{datingScheduleID:dateScheduleModuleID});
						}
					},userLoginSessionKey,timezone);
			    },
			    function(userDetailsObj,masterUserId,dateScheduleDetails, callback) {
					
					let datingScheduleUserID   = parseInt(dateScheduleDetails[0].datingScheduleUserID);
					let datingScheduleFriendID = parseInt(dateScheduleDetails[0].datingScheduleFriendID);
					let isScheduledDateMutuallyConfirmed = parseInt(dateScheduleDetails[0].isScheduledDateMutuallyConfirmed);
					let isUserDateReviewDone = parseInt(dateScheduleDetails[0].isUserDateReviewDone);
			        let datingScheduleUserStatus   = dateScheduleDetails[0].datingScheduleUserStatus;
			        let datingScheduleFriendStatus = dateScheduleDetails[0].datingScheduleFriendStatus;

					/* To validate date schedule future date */
			        let datingScheduleDate = dateScheduleDetails[0].datingScheduleDate;
			        let currentDateTime  = custom.changeDateFormat(custom.getCurrentTime(),'yyyy-mm-dd');
			        let isFutureDateTime = moment(datingScheduleDate).isAfter(currentDateTime); 
					if(isUserDateReviewDone === 1){
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled date already completed.')
							        });
					}else if(isScheduledDateMutuallyConfirmed === 1){
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled date already accepted.')
							        });
					}else if(datingScheduleUserID === masterUserId && datingScheduleUserStatus === 'REJECT'){
			        	return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled date already rejected.')
							        });
					}else if(datingScheduleFriendID === masterUserId && datingScheduleFriendStatus === 'REJECT'){
			        	return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled date already rejected.')
							        });
					}else if(dateScheduleDetails[0].datingGlobalStatus === "PENDING"){
						callback(null, userDetailsObj,masterUserId,dateScheduleDetails);
					}else{
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Failed please try again.')
							        });
					}
						    	
			    }
			], function (err,userDetailsObj,masterUserId,dateScheduleDetails) {

				database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Update date schedule data */	  
						let dateScheduleObj = {};
						let datingScheduleUserStatus   = dateScheduleDetails[0].datingScheduleUserStatus;
						let datingScheduleFriendStatus = dateScheduleDetails[0].datingScheduleFriendStatus;
						if(dateScheduleDetails[0].datingScheduleUserID === masterUserId && dateScheduleDetails[0].datingScheduleUserStatus === 'PENDING')
						{
							datingScheduleUserStatus = 'REJECT';
							dateScheduleObj.datingScheduleUserStatus = 'REJECT';
							dateScheduleObj.datingScheduleUserResponseDateTime = custom.getCurrentTime();
						}
						if(dateScheduleDetails[0].datingScheduleFriendID === masterUserId && dateScheduleDetails[0].datingScheduleFriendStatus === 'PENDING')
						{
							datingScheduleFriendStatus = 'REJECT';
							dateScheduleObj.datingScheduleFriendStatus = 'REJECT';
							dateScheduleObj.datingScheduleFriendResponseDateTime = custom.getCurrentTime();
						}
						dateScheduleObj.datingGlobalStatus = 'REJECT';
                        let i1 = queryBuilder.update(constant.schedule_dating,dateScheduleObj,{datingScheduleID:dateScheduleModuleID});
                        queryBuilder.reset_query(i1);
                        connection.query(i1, function(err, callResp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }
	                        if(!callResp){
	                        	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Failed to reject scheduled date.')
									        });
	                        }

	                    /* Insert reject scheduled date notification */
	                    var notificationUserId   = '';
	                    var notificationFriendId = '';
	                    if(dateScheduleDetails[0].datingScheduleUserID === masterUserId){
	                    	notificationUserId   = dateScheduleDetails[0].datingScheduleUserID;
	                    	notificationFriendId = dateScheduleDetails[0].datingScheduleFriendID;
						}else{
							notificationUserId   = dateScheduleDetails[0].datingScheduleFriendID;
	                    	notificationFriendId = dateScheduleDetails[0].datingScheduleUserID;
						}
					   	let notificationDataObj = {};
                		notificationDataObj.notificationUserId   = notificationUserId;
                		notificationDataObj.notificationFriendId = notificationFriendId;
                		notificationDataObj.dateScheduleModuleID = dateScheduleModuleID;
                		notificationDataObj.notificationModule   = 'DATING';
                		notificationDataObj.notificationType     = 'REJECT_SCHEDULED_DATE';
                		notificationDataObj.notificationMessage  = 'has rejected your dating request';
                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
                		notificationDataObj.notificationParams   = JSON.stringify({datingScheduleDate:custom.changeDateFormat(dateScheduleDetails[0].datingScheduleDate,'yyyy-mm-dd'),datingScheduleTime:dateScheduleDetails[0].datingScheduleTime + ":00",datingGlobalStatus:dateScheduleObj.datingGlobalStatus,datingScheduleUserStatus:datingScheduleUserStatus,datingScheduleFriendStatus:datingScheduleFriendStatus,datingLocation:dateScheduleDetails[0].datingLocation,datingLocationLatitude:dateScheduleDetails[0].datingLocationLatitude,datingLocationLongitude:dateScheduleDetails[0].datingLocationLongitude,datingAfterMath:dateScheduleDetails[0].datingAfterMath,datesNote:custom.nullChecker(dateScheduleDetails[0].datesNote)});
                        let i2 = queryBuilder.insert(constant.notifications,notificationDataObj);
                        queryBuilder.reset_query(i2);
                        connection.query(i2, function(err, resp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }

	                    /* Update friend badges */
                        let u1 = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + notificationFriendId;
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

	                            /* To check block user request */
	                            custom.isUserBlocked(function(respType,respDetails){
	                            	if(respType === 0){
	                            		return res.send(custom.dbErrorResponse());
	                            	}else if(respType === 2){
	                            		/* To send push notifications */
			                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " has rejected your dating request";
			                            let extraParams = {};
			                            extraParams.dateScheduleModuleID = dateScheduleModuleID;
			                            extraParams.datingScheduleUserID   = notificationUserId;
			                            extraParams.datingScheduleFriendID = notificationFriendId;
			                            extraParams.moduleName = 'DATING';
			                            extraParams.datingGlobalStatus = dateScheduleDetails[0].datingGlobalStatus;
			                            extraParams.notificationType = 'REJECT_SCHEDULED_DATE';
			                            notification.sendPushNotifications(userMessage,notificationFriendId,extraParams);
	                            	}
	                            },notificationUserId,notificationFriendId);

	                            /* Update Old Notification */
						        if(notificationId > 0)
						        {
						        	model.updateData(function(err,updateNotiResp){
						        	},constant.notifications,{actionStatus:"REJECT"},{notificationId:notificationId});
						        }
	                           
	                            /* Return user response */
			            		return res.send({"code" : 200, "response" : {dateScheduleModuleID:dateScheduleModuleID},"status" : 1,"message" : custom.lang(locale,'Date request rejected sucessfully.')});
	                        }
                    	});
                    	});
                    	});
                    	});
                	});
				}); 
			});
		}	
	});

	/* To cancel scheduled date
	 * @param {string}  userLoginSessionKey
	 * @param {integer} dateScheduleModuleID
	 * @param {integer} notificationId (Optional)
	*/
	app.post('/scheduled-date/cancel', function(req, res) {

		let locale   = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("dateScheduleModuleID").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('dateScheduleModuleID', custom.lang(locale,'The Date schedule module id required')).notEmpty();
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
			let dateScheduleModuleID  = parseInt(req.sanitize('dateScheduleModuleID').escape().trim());
			let notificationId        = (!req.body.notificationId) ? 0 : parseInt(req.body.notificationId);

	        async.waterfall([
			    function(callback) {
			    	/* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							let masterUserId = parseInt(respObj[0].masterUserId);

							/* Get schedule call details */
					        model.getAllWhere(function(err,dateScheduleDetails){
					        	if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(dateScheduleDetails == ""){
				                		return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,'Invalid date schedule module id.')
											        });
				                	}else{
				                		callback(null, respObj,masterUserId,dateScheduleDetails);
				                	}
				                }
				            },constant.schedule_dating,{datingScheduleID:dateScheduleModuleID});
						}
					},userLoginSessionKey,timezone);
			    },
			    function(userDetailsObj,masterUserId,dateScheduleDetails, callback) {
					
					let datingScheduleUserID   = parseInt(dateScheduleDetails[0].datingScheduleUserID);
					let datingScheduleFriendID = parseInt(dateScheduleDetails[0].datingScheduleFriendID);
					let isScheduledDateMutuallyConfirmed = parseInt(dateScheduleDetails[0].isScheduledDateMutuallyConfirmed);
					let isUserDateReviewDone = parseInt(dateScheduleDetails[0].isUserDateReviewDone);
			        let datingScheduleUserStatus   = dateScheduleDetails[0].datingScheduleUserStatus;
			        let datingScheduleFriendStatus = dateScheduleDetails[0].datingScheduleFriendStatus;

					/* To validate date schedule future date */
			        let datingScheduleDate = dateScheduleDetails[0].datingScheduleDate;
			        let currentDateTime  = custom.changeDateFormat(custom.getCurrentTime(),'yyyy-mm-dd');
			        let isFutureDateTime = moment(datingScheduleDate).isAfter(currentDateTime); 
					if(isUserDateReviewDone === 1){
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled date already finished.')
							        });
					}else if(datingScheduleUserID === masterUserId && datingScheduleUserStatus === 'CANCELLED'){
			        	return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled date already cancelled.')
							        });
					}else if(datingScheduleFriendID === masterUserId && datingScheduleFriendStatus === 'CANCELLED'){
			        	return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled date already cancelled.')
							        });
					}else if(dateScheduleDetails[0].datingGlobalStatus === "ACCEPT"){
						callback(null, userDetailsObj,masterUserId,dateScheduleDetails);
					}else{
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Failed please try again.')
							        });
					}
						    	
			    }
			], function (err,userDetailsObj,masterUserId,dateScheduleDetails) {

				database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Update date schedule data */	  
						let dateScheduleObj = {};
						let datingScheduleUserStatus   = dateScheduleDetails[0].datingScheduleUserStatus;
						let datingScheduleFriendStatus = dateScheduleDetails[0].datingScheduleFriendStatus;
						if(dateScheduleDetails[0].datingScheduleUserID === masterUserId && dateScheduleDetails[0].datingScheduleUserStatus === 'PENDING')
						{
							datingScheduleUserStatus = 'CANCELLED';
							dateScheduleObj.datingScheduleUserStatus = 'CANCELLED';
							dateScheduleObj.datingScheduleUserResponseDateTime = custom.getCurrentTime();
						}
						if(dateScheduleDetails[0].datingScheduleFriendID === masterUserId && dateScheduleDetails[0].datingScheduleFriendStatus === 'PENDING')
						{
							datingScheduleFriendStatus = 'CANCELLED';
							dateScheduleObj.datingScheduleFriendStatus = 'CANCELLED';
							dateScheduleObj.datingScheduleFriendResponseDateTime = custom.getCurrentTime();
						}
						dateScheduleObj.datingGlobalStatus = 'CANCELLED';
                        let i1 = queryBuilder.update(constant.schedule_dating,dateScheduleObj,{datingScheduleID:dateScheduleModuleID});
                        queryBuilder.reset_query(i1);
                        connection.query(i1, function(err, callResp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }
	                        if(!callResp){
	                        	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Failed to cancel scheduled date.')
									        });
	                        }

	                    /* Insert reject scheduled date notification */
	                    var notificationUserId   = '';
	                    var notificationFriendId = '';
	                    if(dateScheduleDetails[0].datingScheduleUserID === masterUserId){
	                    	notificationUserId   = dateScheduleDetails[0].datingScheduleUserID;
	                    	notificationFriendId = dateScheduleDetails[0].datingScheduleFriendID;
						}else{
							notificationUserId   = dateScheduleDetails[0].datingScheduleFriendID;
	                    	notificationFriendId = dateScheduleDetails[0].datingScheduleUserID;
						}
					   	let notificationDataObj = {};
                		notificationDataObj.notificationUserId   = notificationUserId;
                		notificationDataObj.notificationFriendId = notificationFriendId;
                		notificationDataObj.dateScheduleModuleID = dateScheduleModuleID;
                		notificationDataObj.notificationModule   = 'DATING';
                		notificationDataObj.notificationType     = 'CANCEL_SCHEDULED_DATE';
                		notificationDataObj.notificationMessage  = 'has cancelled your dating request';
                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
                		notificationDataObj.notificationParams   = JSON.stringify({datingScheduleDate:custom.changeDateFormat(dateScheduleDetails[0].datingScheduleDate,'yyyy-mm-dd'),datingScheduleTime:dateScheduleDetails[0].datingScheduleTime + ":00",datingGlobalStatus:dateScheduleObj.datingGlobalStatus,datingScheduleUserStatus:datingScheduleUserStatus,datingScheduleFriendStatus:datingScheduleFriendStatus,datingLocation:dateScheduleDetails[0].datingLocation,datingLocationLatitude:dateScheduleDetails[0].datingLocationLatitude,datingLocationLongitude:dateScheduleDetails[0].datingLocationLongitude,datingAfterMath:dateScheduleDetails[0].datingAfterMath,datesNote:custom.nullChecker(dateScheduleDetails[0].datesNote)});
                        let i2 = queryBuilder.insert(constant.notifications,notificationDataObj);
                        queryBuilder.reset_query(i2);
                        connection.query(i2, function(err, resp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }

	                    /* Update friend badges */
                        let u1 = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + notificationFriendId;
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

	                            /* To check block user request */
	                            custom.isUserBlocked(function(respType,respDetails){
	                            	if(respType === 0){
	                            		return res.send(custom.dbErrorResponse());
	                            	}else if(respType === 2){
	                            		/* To send push notifications */
			                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " has cancelled your dating request";
			                            let extraParams = {};
			                            extraParams.dateScheduleModuleID = dateScheduleModuleID;
			                            extraParams.datingScheduleUserID   = notificationUserId;
			                            extraParams.datingScheduleFriendID = notificationFriendId;
			                            extraParams.moduleName = 'DATING';
			                            extraParams.datingGlobalStatus = dateScheduleDetails[0].datingGlobalStatus;
			                            extraParams.notificationType = 'CANCEL_SCHEDULED_DATE';
			                            notification.sendPushNotifications(userMessage,notificationFriendId,extraParams);
	                            	}
	                            },notificationUserId,notificationFriendId);

	                            /* Update Old Notification */
						        if(notificationId > 0)
						        {
						        	model.updateData(function(err,updateNotiResp){
						        	},constant.notifications,{actionStatus:"CANCELLED"},{notificationId:notificationId});
						        }
	                           
	                            /* Return user response */
			            		return res.send({"code" : 200, "response" : {dateScheduleModuleID:dateScheduleModuleID},"status" : 1,"message" : custom.lang(locale,'Date request cancelled sucessfully.')});
	                        }
                    	});
                    	});
                    	});
                    	});
                	});
				}); 
			});
		}	
	});

	/* To re-schedule user date
	 * @param {string}  userLoginSessionKey
	 * @param {integer} dateScheduleModuleID
	 * @param {string}  datingScheduleDate
	 * @param {string}  datingScheduleTime
	 * @param {string}  datingLocation
	 * @param {string}  datingLocationLatitude
	 * @param {string}  datingLocationLongitude
	 * @param {string}  datingAfterMath
	 * @param {integer} notificationId (Optional)
	 * @param {string}  datesNote (Optional)
	*/
	app.post('/date/re-schedule', function(req, res) {

		let locale = req.headers.locale;
		let userTimeZone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("dateScheduleModuleID").trim();
		req.sanitize("datingScheduleDate").trim();
		req.sanitize("datingScheduleTime").trim();
		req.sanitize("datingLocation").trim();
		req.sanitize("datingAfterMath").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('dateScheduleModuleID', custom.lang(locale,'The Date schedule module id required')).notEmpty();
	    req.check('datingScheduleDate', custom.lang(locale,'Date re-schedule date is required')).notEmpty();
	    req.check('datingScheduleTime', custom.lang(locale,'Date re-schedule time is required')).notEmpty();
	    req.check('datingLocation', custom.lang(locale,'Date location field is required')).notEmpty();
	    req.check('datingAfterMath', custom.lang(locale,'Date after math field is required')).notEmpty();
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
			let dateScheduleModuleID  = parseInt(req.sanitize('dateScheduleModuleID').escape().trim());
			let datingScheduleDate    = req.sanitize('datingScheduleDate').escape().trim();
			let datingScheduleTime    = req.sanitize('datingScheduleTime').escape().trim();
			let datingLocation        = req.body.datingLocation;
			let datingAfterMath       = req.body.datingAfterMath;
			let datingLocationLatitude  = (!req.body.datingLocationLatitude) ? '' : req.body.datingLocationLatitude;
			let datingLocationLongitude = (!req.body.datingLocationLongitude) ? '' : req.body.datingLocationLongitude;
			let isValidDate             = custom.validateDateTime(datingScheduleDate,'YYYY-MM-DD');
			let isValidTime             = custom.validateDateTime(datingScheduleTime,'HH:mm');
			let notificationId          = (!req.body.notificationId) ? 0 : parseInt(req.body.notificationId);
			let datesNote               = (!req.body.datesNote) ? '' : req.sanitize('datesNote').escape().trim();

			/* Validate date re-schedule date */
	        if(!isValidDate){
	            return res.send({
	                        "code": 200,
	                        "response": {},
	                        "status": 0,
	                        "message": custom.lang(locale,'Invalid Date re-schedule date format, should be (YYYY-MM-DD)')
	                    });
	        }

	        /* Validate date re-schedule time */
	        if(!isValidTime){
	            return res.send({
	                        "code": 200,
	                        "response": {},
	                        "status": 0,
	                        "message": custom.lang(locale,'Invalid Date re-schedule time format, should be (HH:mm)')
	                    });
	        }

	        /* Validate future date time */
	        let datingReScheduleDateTime = datingScheduleDate + " " + datingScheduleTime + ":00";
	        let currentDateTime        = custom.getCurrentTime();
	        if(currentDateTime > datingReScheduleDateTime)
	        {
	        	return res.send({
	                        "code": 200,
	                        "response": {},
	                        "status": 0,
	                        "message": custom.lang(locale,'Dating re-schedule date time must be future date time')
	                    });
	        }

	        async.waterfall([
			    function(callback) {
			    	/* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							let masterUserId = parseInt(respObj[0].masterUserId);

							/* Get schedule call details */
					        model.getAllWhere(function(err,dateScheduleDetails){
					        	if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(dateScheduleDetails == ""){
				                		return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,'Invalid date schedule module id.')
											        });
				                	}else{
				                		callback(null, respObj,masterUserId,dateScheduleDetails);
				                	}
				                }
				            },constant.schedule_dating,{datingScheduleID:dateScheduleModuleID});
						}
					},userLoginSessionKey,userTimeZone);
			    },
			    function(userDetailsObj,masterUserId,dateScheduleDetails, callback) {
					
					let datingScheduleUserID   = parseInt(dateScheduleDetails[0].datingScheduleUserID);
					let datingScheduleFriendID = parseInt(dateScheduleDetails[0].datingScheduleFriendID);
					let isScheduledDateMutuallyConfirmed = parseInt(dateScheduleDetails[0].isScheduledDateMutuallyConfirmed);
					let isUserDateReviewDone = parseInt(dateScheduleDetails[0].isUserDateReviewDone);
			        let datingScheduleUserStatus   = dateScheduleDetails[0].datingScheduleUserStatus;
			        let datingScheduleFriendStatus = dateScheduleDetails[0].datingScheduleFriendStatus;

					/* To validate call schedule future date */
			        let datingScheduleDate = custom.changeDateFormat(dateScheduleDetails[0].datingScheduleDate,'yyyy-mm-dd');
			        let datingScheduleTime = dateScheduleDetails[0].datingScheduleTime;
			        let datingGlobalStatus = dateScheduleDetails[0].datingGlobalStatus;
			        let currentDateTime    = custom.getCurrentTime();
			        let datingScheduleDateTime  = datingScheduleDate + " " + datingScheduleTime + ":00";
					if(isUserDateReviewDone === 1){
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled date already completed.')
							        });
					}else if(currentDateTime > datingScheduleDateTime){
			        	return res.send({
			                        "code": 200,
			                        "response": {},
			                        "status": 0,
			                        "message": custom.lang(locale,'Scheduled date has past date, you can`t re-schedule this date.')
			                    });
			        }else if(datingGlobalStatus === 'PENDING' || datingGlobalStatus === 'ACCEPT'){
						callback(null, userDetailsObj,masterUserId,dateScheduleDetails);
			        }else{
			        	return res.send({
			                        "code": 200,
			                        "response": {},
			                        "status": 0,
			                        "message": custom.lang(locale,'Faile, please try again.')
			                    });
			        }
			    },
			    function(userDetailsObj,masterUserId,dateScheduleDetails, callback) {

			    	var friendID = '';
			    	if(dateScheduleDetails[0].datingScheduleUserID === masterUserId){
			    		friendID = dateScheduleDetails[0].datingScheduleFriendID;
			    	}else{
			    		friendID = dateScheduleDetails[0].datingScheduleUserID;

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
									            "message": custom.lang(locale,'You can not re-schedule date with this user.')
									        });
		                	}else{
		                		callback(null, userDetailsObj,masterUserId,dateScheduleDetails,friendID);
		                	}
		                }
		            },blockQuery);
			    },
			    function(userDetailsObj,masterUserId,dateScheduleDetails,friendID, callback) {

			    	/* Check if call already scheduled */
			    	let scheduleQuery = 'SELECT * FROM ' + constant.schedule_dating + ' WHERE `isScheduledDateMutuallyConfirmed` = 1  AND datingGlobalStatus = "ACCEPT"  AND `datingScheduleDate` = "' + custom.changeDateFormat(datingScheduleDate,'yyyy-mm-dd') + '" AND `datingScheduleTime` = "' + datingScheduleTime + '" AND ((`datingScheduleUserID` = ' + friendID + ' OR `datingScheduleFriendID` = ' + masterUserId + ') OR (`datingScheduleUserID` = ' + masterUserId + ' OR `datingScheduleFriendID` = ' + friendID + '))';
			        model.customQuery(function(err,scheduleQuery){
			        	if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(scheduleQuery != ""){
		                		return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Date already scheduled in same datetime period.')
									        });
		                	}else{
		                		callback(null, userDetailsObj,masterUserId,dateScheduleDetails,friendID);
		                	}
		                }
		            },scheduleQuery);
			    }
			], function (err,userDetailsObj,masterUserId,dateScheduleDetails,friendID) {

				database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Insert date reschedule data */	   
						let dateReScheduleObj = {};
						dateReScheduleObj.datingScheduleID                = dateScheduleModuleID;
						dateReScheduleObj.datingReScheduleDate            = datingScheduleDate;
						dateReScheduleObj.datingReScheduleTime            = datingScheduleTime;
						dateReScheduleObj.datingReScheduleLocation        = datingLocation;
						dateReScheduleObj.datingReScheduleLocationLatitude= datingLocationLatitude;
						dateReScheduleObj.datingReScheduleLongitude       = datingLocationLongitude;
						dateReScheduleObj.datingReScheduleAfterMath       = datingAfterMath;
						dateReScheduleObj.datingReScheduleRequestUserID   = masterUserId;
						dateReScheduleObj.datingReScheduleRequestDateTime = custom.getCurrentTime();
                        let i1 = queryBuilder.insert(constant.reschedule_dating,dateReScheduleObj);
                        queryBuilder.reset_query(i1);
                        connection.query(i1, function(err, callResp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }
	                        if(!callResp){
	                        	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Failed to re-schedule date.')
									        });
	                        }
	                        var datingReScheduleID = parseInt(callResp.insertId);

	                    /* Update schedule date details */
	                    let dateScheduleUpdateObj = {};
	                    dateScheduleUpdateObj.datingScheduleDate        = datingScheduleDate;
	                    dateScheduleUpdateObj.datingScheduleTime        = datingScheduleTime;
	                    dateReScheduleObj.datingLocation                = datingLocation;
	                    dateReScheduleObj.datesNote                     = datesNote;
						dateReScheduleObj.datingLocationLatitude        = datingLocationLatitude;
						dateReScheduleObj.datingLocationLongitude       = datingLocationLongitude;
						dateReScheduleObj.datingAfterMath               = datingAfterMath;
	                    dateScheduleUpdateObj.datingScheduleTimeZone    = (userTimeZone) ? userTimeZone : constant.default_timezone;
	                    dateScheduleUpdateObj.isDateRescheduled = 1;
	                    dateScheduleUpdateObj.isScheduledDateMutuallyConfirmed = 0;
	                    dateScheduleUpdateObj.datingGlobalStatus = 'PENDING';
	                    dateScheduleUpdateObj.lastRescheduleDateRequestTime = custom.getCurrentTime();
	                    if(dateScheduleDetails[0].datingScheduleUserID === masterUserId){
	                    	dateScheduleUpdateObj.datingScheduleUserStatus   = 'ACCEPT';
	                    	dateScheduleUpdateObj.datingScheduleFriendStatus = 'PENDING';
	                    }else{
	                    	dateScheduleUpdateObj.datingScheduleUserStatus   = 'PENDING';
	                    	dateScheduleUpdateObj.datingScheduleFriendStatus = 'ACCEPT';
	                    }
                        let u = queryBuilder.update(constant.schedule_dating,dateScheduleUpdateObj,{datingScheduleID:dateScheduleModuleID});
                        queryBuilder.reset_query(u);
                        connection.query(u, function(err, resp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }

	                    /* Insert date schedule request notification */
					   	let notificationDataObj = {};
                		notificationDataObj.notificationUserId   = masterUserId;
                		notificationDataObj.notificationFriendId = friendID;
                		notificationDataObj.dateScheduleModuleID = dateScheduleModuleID;
                		notificationDataObj.notificationModule   = 'DATING';
                		notificationDataObj.actionStatus         = 'PENDING';
                		notificationDataObj.notificationType     = 'RE_SCHEDULE_DATE';
                		notificationDataObj.notificationMessage  = 'has re-scheduled a date';
                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
                		notificationDataObj.notificationParams   = JSON.stringify({datingScheduleDate:datingScheduleDate,datingScheduleTime:datingScheduleTime + ":00",datingGlobalStatus:'PENDING',datingScheduleUserStatus:dateScheduleUpdateObj.datingScheduleUserStatus,datingScheduleFriendStatus:dateScheduleUpdateObj.datingScheduleFriendStatus,datingLocation:datingLocation,datingLocationLatitude:datingLocationLatitude,datingLocationLongitude:datingLocationLongitude,datingAfterMath:datingAfterMath,datesNote:datesNote});
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
	                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " has re-scheduled a date";
	                            let extraParams = {};
	                            extraParams.dateScheduleModuleID   = dateScheduleModuleID;
	                            extraParams.datingScheduleUserID   = masterUserId;
	                            extraParams.datingScheduleFriendID = friendID;
	                            extraParams.moduleName = 'DATING';
	                            extraParams.notificationType = 'RE_SCHEDULE_DATE';
	                            notification.sendPushNotifications(userMessage,friendID,extraParams);

	                            /* Update Old Notification */
						        if(notificationId > 0)
						        {
						        	model.updateData(function(err,updateNotiResp){
						        	},constant.notifications,{actionStatus:"RE_SCHEDULED"},{notificationId:notificationId});
						        }

	                            /* Return user response */
			            		return res.send({"code" : 200, "response" : {dateScheduleModuleID:dateScheduleModuleID},"status" : 1,"message" : custom.lang(locale,'Date re-scheduled sucessfully.')});
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


	/* To get scheduled upcoming dates list
	 * @param {string}  userLoginSessionKey
	 * @param {integer} pageNo
	*/
	app.post('/upcoming-dates/list', function(req, res) {

		let locale = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("pageNo").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
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
			let userLoginSessionKey   = req.sanitize('userLoginSessionKey').escape().trim();
			let pageNo                = parseInt(req.sanitize('pageNo').escape().trim());
			let moduleName            = 'DATING';

			async.waterfall([
			    function(callback) {
			    	/* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							callback(null, respObj);
						}
					},userLoginSessionKey,timezone);
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
			    	var dateScheduleQuery = "SELECT * FROM " + constant.schedule_dating + " AS `D` INNER JOIN " + constant.user_details + " AS `UD` ON `D`.`datingScheduleUserID` = `UD`.`userId` OR `D`.`datingScheduleFriendID` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND `D`.`datingGlobalStatus` = 'ACCEPT' AND `D`.`datingScheduleModuleName` = '"+moduleName+"' AND (`D`.`datingScheduleUserID` = " + masterUserId + " OR `D`.`datingScheduleFriendID` = " + masterUserId + ") AND CONCAT(TRIM(`D`.datingScheduleDate), ' ', TRIM(`D`.datingScheduleTime)) >= '" + custom.getCurrentTime() + "'  AND `UD`.`userId` NOT IN ("+notInUserIds.join()+") GROUP BY `D`.`datingScheduleID` ORDER BY `D`.`datingScheduleDate`, `D`.`datingScheduleTime` ASC ";
			    	model.customQuery(function(err,dateScheduledObj){
			    		if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	let totalScheduledDates = parseInt(dateScheduledObj.length);
		                	if(offset > 0){
					    		dateScheduleQuery += "LIMIT " + offset + "," + constant.results_limit;
					    	}else{
					    		dateScheduleQuery += "LIMIT " + constant.results_limit
					    	}
					        model.customQuery(function(err,usersObj){
					        	if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(usersObj != ""){
				                		callback(null, userDetailsObj, usersObj,totalScheduledDates);
				                	}else{
				                		return res.send({
										            "code": 200,
										            "response": [],
										            "status": 0,
										            "message": custom.lang(locale,"Upcoming dates not found.")
										        });
				                	}
				                }
					        },dateScheduleQuery);
		                }
		            },dateScheduleQuery);
			    }
			], function (err,userDetailsObj,usersObj,totalScheduledDates) {
				let masterUserId = parseInt(userDetailsObj[0].masterUserId);
				let responseObj  = [];
				for (var i = 0; i < parseInt(usersObj.length); i++) 
                {
                	let row = {};
                	row.masterUserId   = custom.nullChecker(usersObj[i].userId);
                    row.userFirstName  = custom.nullChecker(usersObj[i].userFirstName);
                    row.userLastName   = custom.nullChecker(usersObj[i].userLastName);
                    row.userMood       = custom.nullChecker(usersObj[i].userMood);
                    row.datingScheduleModuleName = custom.nullChecker(usersObj[i].datingScheduleModuleName);
                    row.datingScheduleUserID = custom.nullChecker(usersObj[i].datingScheduleUserID);
                    row.datingScheduleFriendID = custom.nullChecker(usersObj[i].datingScheduleFriendID);
                    row.datingScheduleModuleID = custom.nullChecker(usersObj[i].datingScheduleID);
                    row.datingScheduleDate = custom.changeDateFormat(usersObj[i].datingScheduleDate,'yyyy-mm-dd');
                    row.datingScheduleTime = custom.nullChecker(usersObj[i].datingScheduleTime);
                    row.datingLocation = custom.nullChecker(usersObj[i].datingLocation);
                    row.datesNote      = custom.nullChecker(usersObj[i].datesNote);
                    row.datingLocationLatitude = custom.nullChecker(usersObj[i].datingLocationLatitude);
                    row.datingLocationLongitude = custom.nullChecker(usersObj[i].datingLocationLongitude);
                    row.datingAfterMath = custom.nullChecker(usersObj[i].datingAfterMath);
                    row.userDateRequestTime = custom.changeDateFormat(usersObj[i].userDateRequestTime);
                    row.userDateReview = custom.nullChecker(usersObj[i].userDateReview);
                    row.IsSenderDatingReviewDone         = (usersObj[0].IsSenderDatingReviewDone) ? parseInt(usersObj[0].IsSenderDatingReviewDone) : 0;
        			row.IsRecieverDatingReviewDone       = (usersObj[0].IsRecieverDatingReviewDone) ? parseInt(usersObj[0].IsRecieverDatingReviewDone) : 0;
        			row.senderDatingReview               = (usersObj[0].senderDatingReview) ? parseInt(usersObj[0].senderDatingReview) : 0;
        			row.recieverDatingReview             = (usersObj[0].recieverDatingReview) ? parseInt(usersObj[0].recieverDatingReview) :0;
                    row.userImage      = (usersObj[i].userImage) ? constant.base_url + usersObj[i].userImage : "";
                    row.userImageThumbnail  = (usersObj[i].userImageThumbnail) ? constant.base_url + usersObj[i].userImageThumbnail : "";
                	responseObj.push(row);
                	if (i === parseInt(usersObj.length - 1)) {
                      return res.send({
						            "code": 200,
						            "response": responseObj,
						            "status": 1,
						            "totalCount": totalScheduledDates,
						            "message": custom.lang(locale,"success.")
						        });
                    }
                }
			});
		}	
	});

	/* To get scheduled past dates list
	 * @param {string}  userLoginSessionKey
	 * @param {integer} pageNo
	*/
	app.post('/past-dates/list', function(req, res) {

		let locale = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("pageNo").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
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
			let userLoginSessionKey   = req.sanitize('userLoginSessionKey').escape().trim();
			let pageNo                = parseInt(req.sanitize('pageNo').escape().trim());
			let moduleName            = 'DATING';

			async.waterfall([
			    function(callback) {
			    	/* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							callback(null, respObj);
						}
					},userLoginSessionKey,timezone);
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
			    	var dateScheduleQuery = "SELECT * FROM " + constant.schedule_dating + " AS `D` INNER JOIN " + constant.user_details + " AS `UD` ON `D`.`datingScheduleUserID` = `UD`.`userId` OR `D`.`datingScheduleFriendID` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND `D`.`datingGlobalStatus` = 'ACCEPT' AND `D`.`datingScheduleModuleName` = '"+moduleName+"' AND (`D`.`datingScheduleUserID` = " + masterUserId + " OR `D`.`datingScheduleFriendID` = " + masterUserId + ") AND CONCAT(TRIM(`D`.datingScheduleDate), ' ', TRIM(`D`.datingScheduleTime)) < '" + custom.getCurrentTime() + "'  AND `UD`.`userId` NOT IN ("+notInUserIds.join()+") GROUP BY `D`.`datingScheduleID` ORDER BY `D`.`datingScheduleDate` DESC ";
			    	model.customQuery(function(err,dateScheduledObj){
			    		if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	let totalScheduledDates = parseInt(dateScheduledObj.length);
		                	if(offset > 0){
					    		dateScheduleQuery += "LIMIT " + offset + "," + constant.results_limit;
					    	}else{
					    		dateScheduleQuery += "LIMIT " + constant.results_limit
					    	}
					        model.customQuery(function(err,usersObj){
					        	if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(usersObj != ""){
				                		callback(null, userDetailsObj, usersObj,totalScheduledDates);
				                	}else{
				                		return res.send({
										            "code": 200,
										            "response": [],
										            "status": 0,
										            "message": custom.lang(locale,"Past dates not found.")
										        });
				                	}
				                }
					        },dateScheduleQuery);
		                }
		            },dateScheduleQuery);
			    }
			], function (err,userDetailsObj,usersObj,totalScheduledDates) {
				let masterUserId = parseInt(userDetailsObj[0].masterUserId);
				let responseObj  = [];
				for (var i = 0; i < parseInt(usersObj.length); i++) 
                {
                	let row = {};
                	row.masterUserId   = custom.nullChecker(usersObj[i].userId);
                    row.userFirstName  = custom.nullChecker(usersObj[i].userFirstName);
                    row.userLastName   = custom.nullChecker(usersObj[i].userLastName);
                    row.userMood       = custom.nullChecker(usersObj[i].userMood);
                    row.datingScheduleModuleName = custom.nullChecker(usersObj[i].datingScheduleModuleName);
                    row.datingScheduleUserID = custom.nullChecker(usersObj[i].datingScheduleUserID);
                    row.datingScheduleFriendID = custom.nullChecker(usersObj[i].datingScheduleFriendID);
                    row.datingScheduleModuleID = custom.nullChecker(usersObj[i].datingScheduleID);
                    row.datingScheduleDate = custom.changeDateFormat(usersObj[i].datingScheduleDate,'yyyy-mm-dd');
                    row.datingScheduleTime = custom.nullChecker(usersObj[i].datingScheduleTime);
                    row.datingLocation = custom.nullChecker(usersObj[i].datingLocation);
                    row.datesNote      = custom.nullChecker(usersObj[i].datesNote);
                    row.datingLocationLatitude = custom.nullChecker(usersObj[i].datingLocationLatitude);
                    row.datingLocationLongitude = custom.nullChecker(usersObj[i].datingLocationLongitude);
                    row.datingAfterMath = custom.nullChecker(usersObj[i].datingAfterMath);
                    row.userDateRequestTime = custom.changeDateFormat(usersObj[i].userDateRequestTime);
                    row.userDateReview = custom.nullChecker(usersObj[i].userDateReview);
                    row.IsSenderDatingReviewDone         = (usersObj[i].IsSenderDatingReviewDone) ? parseInt(usersObj[i].IsSenderDatingReviewDone) : 0;
        			row.IsRecieverDatingReviewDone       = (usersObj[i].IsRecieverDatingReviewDone) ? parseInt(usersObj[i].IsRecieverDatingReviewDone) : 0;
        			row.senderDatingReview               = (usersObj[i].senderDatingReview) ? parseInt(usersObj[i].senderDatingReview) : 0;
        			row.recieverDatingReview             = (usersObj[i].recieverDatingReview) ? parseInt(usersObj[i].recieverDatingReview) :0;
                    row.senderDatingReviewMessage        = custom.nullChecker(usersObj[i].senderDatingReviewMessage);
                    row.recieverDatingReviewMessage      = custom.nullChecker(usersObj[i].recieverDatingReviewMessage);
                    row.userImage      = (usersObj[i].userImage) ? constant.base_url + usersObj[i].userImage : "";
                    row.userImageThumbnail  = (usersObj[i].userImageThumbnail) ? constant.base_url + usersObj[i].userImageThumbnail : "";
                	responseObj.push(row);
                	if (i === parseInt(usersObj.length - 1)) {
                      return res.send({
						            "code": 200,
						            "response": responseObj,
						            "status": 1,
						            "totalCount": totalScheduledDates,
						            "message": custom.lang(locale,"success.")
						        });
                    }
                }
			});
		}	
	});

}