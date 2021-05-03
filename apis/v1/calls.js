"use strict";

/*
 * Purpose : For Calls Rest API
 * Package : Calls
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

	/* To get users call history
	 * @param {string}  userLoginSessionKey
	 * @param {integer} pageNo
	 * @param {string}  moduleName
	*/
	app.post('/calls/history', function(req, res) {

		let locale = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("pageNo").trim();
		req.sanitize("moduleName").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('pageNo', custom.lang(locale,'Require page number')).notEmpty();
	    req.check('pageNo', custom.lang(locale,'Page number minimum value should be 1')).minValue(1);
	    req.check('moduleName', custom.lang(locale,'Require module name')).notEmpty();
    	req.check('moduleName', custom.lang(locale,'Select valid module name')).inList(["FRIENDLY","DATING","PROVIDER"]);
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
			let moduleName            = req.sanitize('moduleName').escape().trim();

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
			    	var callHistoryQuery = "SELECT * FROM " + constant.call_history + " AS `C` LEFT JOIN " + constant.user_details + " AS `UD` ON `C`.`callSenderUserID` = `UD`.`userId` OR `C`.`callRecieverUserID` = `UD`.`userId` INNER JOIN " + constant.call_history_users + " AS `CH` ON `CH`.`callHistoryID` = `C`.`callHistoryID`  WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND `C`.`callStatus` NOT IN ('INITIATED','STARTED') AND `C`.`callHistoryModuleName` = '"+moduleName+"' AND `CH`.`callUserID` = " + masterUserId + " AND `UD`.`userId` NOT IN ("+notInUserIds.join()+") GROUP BY `C`.`callHistoryID` ORDER BY `C`.`callInitiateTime` DESC ";
			    	model.customQuery(function(err,callHistoryObj){
			    		if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	let totalCalls = parseInt(callHistoryObj.length);
		                	if(offset > 0){
					    		callHistoryQuery += "LIMIT " + offset + "," + constant.results_limit;
					    	}else{
					    		callHistoryQuery += "LIMIT " + constant.results_limit
					    	}
					        model.customQuery(function(err,usersObj){
					        	if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(usersObj != ""){
				                		callback(null, userDetailsObj, usersObj,totalCalls);
				                	}else{
				                		return res.send({
										            "code": 200,
										            "response": [],
										            "status": 0,
										            "message": custom.lang(locale,"Call history not found.")
										        });
				                	}
				                }
					        },callHistoryQuery);
		                }
		            },callHistoryQuery);
			    }
			], function (err,userDetailsObj,usersObj,totalCalls) {
				let masterUserId = parseInt(userDetailsObj[0].masterUserId);
				let responseObj  = [];
				var inserted = 0;
				for (var i = 0; i < parseInt(usersObj.length); i++) 
                {
                	let callHistoryID  = parseInt(usersObj[i].callHistoryID);
                	let callUsersHistory = [];
                	let row = {};
                	row.callHistoryID  = custom.nullChecker(usersObj[i].callHistoryID);
                	row.masterUserId   = custom.nullChecker(usersObj[i].userId);
                    row.userFirstName  = custom.nullChecker(usersObj[i].userFirstName);
                    row.userLastName   = custom.nullChecker(usersObj[i].userLastName);
                    row.userMood       = custom.nullChecker(usersObj[i].userMood);
                    row.callHistoryModuleName = custom.nullChecker(usersObj[i].callHistoryModuleName);
                    row.callSenderUserID = custom.nullChecker(usersObj[i].callSenderUserID);
                    row.callRecieverUserID = custom.nullChecker(usersObj[i].callRecieverUserID);
                    row.userRoomName = custom.nullChecker(usersObj[i].userRoomName);
                    row.userRoomName = custom.nullChecker(usersObj[i].userRoomName);
                    row.callInitiateTime = custom.changeDateFormat(usersObj[i].callInitiateTime);
                    row.callJoinedTime = (usersObj[i].callJoinedTime) ? custom.changeDateFormat(usersObj[i].callJoinedTime) : '';
                    row.callCompletedTime = (usersObj[i].callCompletedTime) ? custom.changeDateFormat(usersObj[i].callCompletedTime) : '';
                    row.IsSenderCallReviewDone = parseInt(usersObj[i].IsSenderCallReviewDone);
                    row.IsRecieverCallReviewDone = parseInt(usersObj[i].IsRecieverCallReviewDone);
                    row.senderCallReview = (!usersObj[i].senderCallReview) ? 0 : parseInt(usersObj[i].senderCallReview);
                    row.recieverCallReview = (!usersObj[i].recieverCallReview) ? 0 : parseInt(usersObj[i].recieverCallReview);
                    row.senderCallReviewMessage = custom.nullChecker(usersObj[i].senderCallReviewMessage);
                    row.recieverCallReviewMessage = custom.nullChecker(usersObj[i].recieverCallReviewMessage);
                    row.callStatus = custom.nullChecker(usersObj[i].callStatus);
                    row.userImage      = (usersObj[i].userImage) ? constant.base_url + usersObj[i].userImage : "";
                    row.userImageThumbnail  = (usersObj[i].userImageThumbnail) ? constant.base_url + usersObj[i].userImageThumbnail : "";
                    row.callDuration = 0;
                    row.callUsersHistory = [];
                    if(row.callJoinedTime && row.callCompletedTime)
                    {
                    	row.callDuration = custom.getDateTimeDifference(row.callJoinedTime,row.callCompletedTime,'seconds');
                    }

                    (function(i,callHistoryID,callUsersHistory) {

                    	/* Get call history users*/
                        let callUsersQuery = 'SELECT * FROM ' + constant.call_history_users + ' AS CHU INNER JOIN ' + constant.user_details + ' AS UD ON UD.userId = CHU.callUserID WHERE `callHistoryID` = ' + callHistoryID + ' ORDER BY CHU.callHistoryUsersID DESC ';
                        database.getConn(callUsersQuery, function (err, callUsersObj) {
                            if(err){
                                return res.send(custom.dbErrorResponse());
                            }else{
                                if(callUsersObj != "")
	                            {
	                            	if(parseInt(callUsersObj.length) > 0)
							    	{
							    		for (var j = 0; j < parseInt(callUsersObj.length); j++) 
							    		{
							    			let callRow = {};
							    			callRow.isCallOwner = parseInt(callUsersObj[j].isCallOwner);
							    			callRow.callUserID  = parseInt(callUsersObj[j].callUserID);
							    			callRow.callUserTotalDuration  = 0;
							    			callRow.callUserAddedDate      = (callUsersObj[j].callUserAddedDate) ? custom.changeDateFormat(callUsersObj[j].callUserAddedDate) : '';
							    			callRow.callUserTerminatedDate = (callUsersObj[j].callUserTerminatedDate) ? custom.changeDateFormat(callUsersObj[j].callUserTerminatedDate) : '';
							    			callRow.callUserStatus         = custom.nullChecker(callUsersObj[j].callUserStatus);
							    			callRow.userFirstName          = custom.nullChecker(callUsersObj[j].userFirstName);
							    			callRow.userLastName           = custom.nullChecker(callUsersObj[j].userLastName);
							    			callRow.userImage              = (callUsersObj[j].userImage) ? constant.base_url + callUsersObj[j].userImage : "";
                							callRow.userImageThumbnail     = (callUsersObj[j].userImageThumbnail) ? constant.base_url + callUsersObj[j].userImageThumbnail : "";
                							if(callRow.callUserAddedDate && callRow.callUserTerminatedDate)
						                    {
						                    	callRow.callUserTotalDuration = custom.getDateTimeDifference(callRow.callUserAddedDate,callRow.callUserTerminatedDate,'seconds');
						                    }
					  		    			callUsersHistory.push(callRow);
							    		}
							    	}
	                            }
	                            row.callUsersHistory = callUsersHistory;
                                responseObj.push(row);
                            }
                            if(++inserted === parseInt(usersObj.length)) {
                              	return res.send({
								            "code": 200,
								            "response": responseObj,
								            "totalCount": totalCalls,
								            "status": 1,
								            "message": custom.lang(locale,"success.")
								        });
                            }
                        });
                    })(i,callHistoryID,callUsersHistory);
                }
			});
		}	
	});

	/* To schedule user calls
	 * @param {string}  userLoginSessionKey
	 * @param {integer} friendID
	 * @param {string}  moduleName
	 * @param {string}  callScheduleDate
	 * @param {string}  callScheduleTime
	 * @param {string}  callNote (Optional)
	*/
	app.post('/call/schedule', function(req, res) {

		let locale = req.headers.locale;
		let userTimeZone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("friendID").trim();
		req.sanitize("moduleName").trim();
		req.sanitize("callScheduleDate").trim();
		req.sanitize("callScheduleTime").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('friendID', custom.lang(locale,'The Friend id is required')).notEmpty();
	    req.check('moduleName', custom.lang(locale,'Require module name')).notEmpty();
    	req.check('moduleName', custom.lang(locale,'Select valid module name')).inList(["FRIENDLY","DATING","PROVIDER"]);
	    req.check('callScheduleDate', custom.lang(locale,'Call schedule date is required')).notEmpty();
	    req.check('callScheduleTime', custom.lang(locale,'Call schedule time is required')).notEmpty();
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
			let moduleName            = req.sanitize('moduleName').escape().trim();
			let callScheduleDate      = req.sanitize('callScheduleDate').escape().trim();
			let callScheduleTime      = req.sanitize('callScheduleTime').escape().trim();
			let isValidDate           = custom.validateDateTime(callScheduleDate,'YYYY-MM-DD');
			let isValidTime           = custom.validateDateTime(callScheduleTime,'HH:mm');
			let callNote              = (!req.body.callNote) ? '' : req.sanitize('callNote').escape().trim();

			/* Validate call schedule date */
	        if(!isValidDate){
	            return res.send({
	                        "code": 200,
	                        "response": {},
	                        "status": 0,
	                        "message": custom.lang(locale,'Invalid Call schedule date format, should be (YYYY-MM-DD)')
	                    });
	        }

	        /* Validate call schedule time */
	        if(!isValidTime){
	            return res.send({
	                        "code": 200,
	                        "response": {},
	                        "status": 0,
	                        "message": custom.lang(locale,'Invalid Call schedule time format, should be (HH:mm)')
	                    });
	        }

	        /* Validate future date time */
	        let callScheduleDateTime = callScheduleDate + " " + callScheduleTime + ":00";
	        let currentDateTime      = custom.getCurrentTime();
	        if(currentDateTime > callScheduleDateTime)
	        {
	        	return res.send({
	                        "code": 200,
	                        "response": {},
	                        "status": 0,
	                        "message": custom.lang(locale,'Call schedule date time must be future date time')
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

							/*if(parseInt(respObj[0].isOpenForScheduledCalls) === 0)
							{
								return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'You can not schedule call with this user.')
									        });
							}*/

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
											            "message": custom.lang(locale,'You can not schedule call with this user.')
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
					
					/* Check if call already scheduled */
			    	let scheduleQuery = 'SELECT * FROM ' + constant.schedule_calls + ' WHERE `isScheduledCallMutuallyConfirmed` = 1 AND callGlobalStatus = "ACCEPT" AND `callScheduleDate` = "' + custom.changeDateFormat(callScheduleDate,'yyyy-mm-dd') + '" AND `callScheduleTime` = "' + callScheduleTime + '" AND ((`callScheduleUserID` = ' + friendID + ' OR `callScheduleFriendID` = ' + masterUserId + ') OR (`callScheduleUserID` = ' + masterUserId + ' OR `callScheduleFriendID` = ' + friendID + '))';
			        model.customQuery(function(err,scheduleQuery){
			        	if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(scheduleQuery != ""){
		                		return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Call already scheduled in same datetime period.')
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

                        /* Insert call schedule data */	   
						let callScheduleObj = {};
						callScheduleObj.callScheduleModuleName = moduleName;
						callScheduleObj.callScheduleUserID     = masterUserId;
						callScheduleObj.callScheduleFriendID   = friendID;
						callScheduleObj.callScheduleDate       = callScheduleDate;
						callScheduleObj.callNote               = callNote;
						callScheduleObj.callScheduleTimeZone   = (userTimeZone) ? userTimeZone : constant.default_timezone;
						callScheduleObj.callScheduleTime       = callScheduleTime;
						callScheduleObj.callScheduleUserStatus = 'ACCEPT';
						callScheduleObj.callScheduleUserResponseDateTime = custom.getCurrentTime();
						callScheduleObj.userCallRequestTime    = custom.getCurrentTime();
                        let i1 = queryBuilder.insert(constant.schedule_calls,callScheduleObj);
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
									            "message": custom.lang(locale,'Failed to schedule call.')
									        });
	                        }
	                        var callScheduleID = parseInt(callResp.insertId);

	                    /* Insert call schedule request notification */
					   	let notificationDataObj = {};
                		notificationDataObj.notificationUserId   = masterUserId;
                		notificationDataObj.notificationFriendId = friendID;
                		notificationDataObj.callScheduleModuleID = callScheduleID;
                		notificationDataObj.notificationModule   = moduleName;
                		notificationDataObj.actionStatus         = 'PENDING';
                		notificationDataObj.notificationType     = 'SCHEDULE_CALL';
                		notificationDataObj.notificationMessage  = 'has scheduled a call';
                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
                		notificationDataObj.notificationParams   = JSON.stringify({callScheduleDate:callScheduleDate,callScheduleTime:callScheduleTime + ":00",callGlobalStatus:'PENDING',callScheduleUserStatus:'ACCEPT',callScheduleFriendStatus:'PENDING',callNote:callNote});
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
	                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " has scheduled a call";
	                            let extraParams = {};
	                            extraParams.callScheduleModuleID = callScheduleID;
	                            extraParams.callScheduleUserID   = masterUserId;
	                            extraParams.callScheduleFriendID = friendID;
	                            extraParams.moduleName = moduleName;
	                            extraParams.notificationType = 'SCHEDULE_CALL';
	                            notification.sendPushNotifications(userMessage,friendID,extraParams);

	                            /* Return user response */
			            		return res.send({"code" : 200, "response" : {callScheduleModuleID:callScheduleID},"status" : 1,"message" : custom.lang(locale,'Call scheduled sucessfully.')});
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

	/* To accept scheduled call
	 * @param {string}  userLoginSessionKey
	 * @param {integer} callScheduleModuleID
	 * @param {integer} notificationId (Optional)
	*/
	app.post('/scheduled-call/accept', function(req, res) {

		let locale = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("callScheduleModuleID").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('callScheduleModuleID', custom.lang(locale,'The Call schedule module id required')).notEmpty();
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
			let callScheduleModuleID  = parseInt(req.sanitize('callScheduleModuleID').escape().trim());
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
					        model.getAllWhere(function(err,callScheduleDetails){
					        	if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(callScheduleDetails == ""){
				                		return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,'Invalid call schedule module id.')
											        });
				                	}else{
				                		callback(null, respObj,masterUserId,callScheduleDetails);
				                	}
				                }
				            },constant.schedule_calls,{callScheduleID:callScheduleModuleID});
						}
					},userLoginSessionKey,timezone);
			    },
			    function(userDetailsObj,masterUserId,callScheduleDetails, callback) {
					
					let callScheduleUserID   = parseInt(callScheduleDetails[0].callScheduleUserID);
					let callScheduleFriendID = parseInt(callScheduleDetails[0].callScheduleFriendID);
					let isScheduledCallMutuallyConfirmed = parseInt(callScheduleDetails[0].isScheduledCallMutuallyConfirmed);
					let isUserCallReviewDone = parseInt(callScheduleDetails[0].isUserCallReviewDone);
			        let callScheduleUserStatus   = callScheduleDetails[0].callScheduleUserStatus;
			        let callScheduleFriendStatus = callScheduleDetails[0].callScheduleFriendStatus;

					/* To validate call schedule future date */
			        let callScheduleDate = custom.changeDateFormat(callScheduleDetails[0].callScheduleDate,'yyyy-mm-dd');
			        let callScheduleTime = callScheduleDetails[0].callScheduleTime;
			        let callGlobalStatus = callScheduleDetails[0].callGlobalStatus;
			        let currentDateTime  = custom.getCurrentTime();
			        let callScheduleDateTime  = callScheduleDate + " " + callScheduleTime + ":00";
					if(isUserCallReviewDone === 1){
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled call already finished.')
							        });
					}else if(isScheduledCallMutuallyConfirmed === 1){
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled call already accepted.')
							        });
					}else if(currentDateTime > callScheduleDateTime){
			        	return res.send({
			                        "code": 200,
			                        "response": {},
			                        "status": 0,
			                        "message": custom.lang(locale,'Scheduled call has past date, you can`t accept this call.')
			                    });
			        }else if(callScheduleUserID === masterUserId && callScheduleUserStatus === 'ACCEPT'){
			        	return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled call already accepted.')
							        });
					}else if(callScheduleFriendID === masterUserId && callScheduleFriendStatus === 'ACCEPT'){
			        	return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled call already accepted.')
							        });
					}else if(callGlobalStatus === 'AUTO_REJECT' || callGlobalStatus === 'REJECT'){
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled call already rejected.')
							        });
					}else if(callGlobalStatus === 'CANCELLED'){
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled call already cancelled.')
							        });
					}else if(callGlobalStatus === "PENDING"){
						callback(null, userDetailsObj,masterUserId,callScheduleDetails);
					}else{
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Failed please try again.')
							        });
					}
						    	
			    }
			], function (err,userDetailsObj,masterUserId,callScheduleDetails) {

				database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Update call schedule data */	  
                        var isUserAcceptedCall   = 0; 
                        var isFriendAcceptedCall = 0; 
                        var callScheduleUserStatus   = callScheduleDetails[0].callScheduleUserStatus; 
                        var callScheduleFriendStatus = callScheduleDetails[0].callScheduleFriendStatus; 
                        var callGlobalStatus         = callScheduleDetails[0].callGlobalStatus; 
                        if(callScheduleDetails[0].callScheduleUserStatus === 'ACCEPT')
                        {
                        	isUserAcceptedCall = 1;
                        }
                        if(callScheduleDetails[0].callScheduleFriendStatus === 'ACCEPT')
                        {
                        	isFriendAcceptedCall = 1;
                        }
						let callScheduleObj = {};
						if(callScheduleDetails[0].callScheduleUserID === masterUserId && callScheduleDetails[0].callScheduleUserStatus === 'PENDING')
						{
							isUserAcceptedCall = 1;
							callScheduleUserStatus = 'ACCEPT';
							callScheduleObj.callScheduleUserStatus = 'ACCEPT';
							callScheduleObj.callScheduleUserResponseDateTime = custom.getCurrentTime();
						}
						if(callScheduleDetails[0].callScheduleFriendID === masterUserId && callScheduleDetails[0].callScheduleFriendStatus === 'PENDING')
						{
							isFriendAcceptedCall = 1;
							callScheduleFriendStatus = 'ACCEPT';
							callScheduleObj.callScheduleFriendStatus = 'ACCEPT';
							callScheduleObj.callScheduleFriendResponseDateTime = custom.getCurrentTime();
						}
						if(isUserAcceptedCall === 1 && isFriendAcceptedCall === 1)
						{
							callScheduleObj.isScheduledCallMutuallyConfirmed = 1;
							callScheduleObj.callGlobalStatus = 'ACCEPT';
							callGlobalStatus = 'ACCEPT';
						}	
                        let i1 = queryBuilder.update(constant.schedule_calls,callScheduleObj,{callScheduleID:callScheduleModuleID});
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
									            "message": custom.lang(locale,'Failed to accept scheduled call.')
									        });
	                        }

	                    /* Insert accept scheduled call notification */
	                    var notificationUserId   = '';
	                    var notificationFriendId = '';
	                    if(callScheduleDetails[0].callScheduleUserID === masterUserId){
	                    	notificationUserId   = callScheduleDetails[0].callScheduleUserID;
	                    	notificationFriendId = callScheduleDetails[0].callScheduleFriendID;
						}else{
							notificationUserId   = callScheduleDetails[0].callScheduleFriendID;
	                    	notificationFriendId = callScheduleDetails[0].callScheduleUserID;
						}
					   	let notificationDataObj = {};
                		notificationDataObj.notificationUserId   = notificationUserId;
                		notificationDataObj.notificationFriendId = notificationFriendId;
                		notificationDataObj.callScheduleModuleID = callScheduleModuleID;
                		notificationDataObj.notificationModule   = callScheduleDetails[0].callScheduleModuleName;
                		notificationDataObj.notificationType     = 'ACCPET_SCHEDULED_CALL';
                		notificationDataObj.notificationMessage  = 'has accepted your call request';
                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
                		notificationDataObj.notificationParams   = JSON.stringify({callScheduleDate:custom.changeDateFormat(callScheduleDetails[0].callScheduleDate,'yyyy-mm-dd'),callScheduleTime:callScheduleDetails[0].callScheduleTime,callGlobalStatus:callGlobalStatus,callScheduleUserStatus:callScheduleUserStatus,callScheduleFriendStatus:callScheduleFriendStatus,callNote:custom.nullChecker(callScheduleDetails[0].callNote)});
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
			                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " has accepted your call request";
			                            let extraParams = {};
			                            extraParams.callScheduleModuleID = callScheduleModuleID;
			                            extraParams.callScheduleUserID   = notificationUserId;
			                            extraParams.callScheduleFriendID = notificationFriendId;
			                            extraParams.moduleName = callScheduleDetails[0].callScheduleModuleName;
			                            extraParams.callGlobalStatus = callScheduleDetails[0].callGlobalStatus;
			                            extraParams.notificationType = 'ACCPET_SCHEDULED_CALL';
			                            notification.sendPushNotifications(userMessage,notificationFriendId,extraParams);
	                            	}
	                            },notificationUserId,notificationFriendId);

	                            /* Auto reject other calls request in same time */
	                            if(isUserAcceptedCall === 1 && isFriendAcceptedCall === 1)
								{
									let bothUsers  = new Array(0);
									bothUsers.push(notificationUserId);
									bothUsers.push(notificationFriendId);
							    	let scheduleQuery = 'SELECT * FROM ' + constant.schedule_calls + ' WHERE `callScheduleDate` = "' + custom.changeDateFormat(callScheduleDetails[0].callScheduleDate,'yyyy-mm-dd') + '" AND `callScheduleTime` = "' + callScheduleDetails[0].callScheduleTime + '" AND `callScheduleID` != ' + callScheduleModuleID + ' AND (`callScheduleUserID` IN (' + bothUsers.join() + ' )OR `callScheduleFriendID` IN (' + bothUsers.join() + '))';
							        model.customQuery(function(err,scheduledCallResp){
							        	if(err){
						                    return res.send(custom.dbErrorResponse());
						                }else{
						                	if(scheduledCallResp != "")
						                	{
						                	  let totalScheduledCalls = parseInt(scheduledCallResp.length);
						                	  if(totalScheduledCalls > 0)
						                	  {
						                	  	for (var i = 0; i < totalScheduledCalls; i++) 
						                	  	{
						                	  		var callScheduleObj = {};
						                	  		callScheduleObj.callGlobalStatus = 'AUTO_REJECT';	

						                	  		/* Update auto reject call status */
						                	  		model.updateData(function(err,updateResp){
						                	  			if(err){
										                    return res.send(custom.dbErrorResponse());
										                }else{
										                	console.log('affectedRows',parseInt(updateResp.affectedRows));
										                }
						                	  		},constant.schedule_calls,callScheduleObj,{callScheduleID:scheduledCallResp[i].callScheduleID});
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
			            		return res.send({"code" : 200, "response" : {callScheduleModuleID:callScheduleModuleID},"status" : 1,"message" : custom.lang(locale,'Call request accepted sucessfully.')});
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

	/* To reject scheduled call
	 * @param {string}  userLoginSessionKey
	 * @param {integer} callScheduleModuleID
	 * @param {integer} notificationId (Optional)
	*/
	app.post('/scheduled-call/reject', function(req, res) {

		let locale   = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("callScheduleModuleID").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('callScheduleModuleID', custom.lang(locale,'The Call schedule module id required')).notEmpty();
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
			let callScheduleModuleID  = parseInt(req.sanitize('callScheduleModuleID').escape().trim());
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
					        model.getAllWhere(function(err,callScheduleDetails){
					        	if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(callScheduleDetails == ""){
				                		return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,'Invalid call schedule module id.')
											        });
				                	}else{
				                		callback(null, respObj,masterUserId,callScheduleDetails);
				                	}
				                }
				            },constant.schedule_calls,{callScheduleID:callScheduleModuleID});
						}
					},userLoginSessionKey,timezone);
			    },
			    function(userDetailsObj,masterUserId,callScheduleDetails, callback) {
					
					let callScheduleUserID   = parseInt(callScheduleDetails[0].callScheduleUserID);
					let callScheduleFriendID = parseInt(callScheduleDetails[0].callScheduleFriendID);
					let isScheduledCallMutuallyConfirmed = parseInt(callScheduleDetails[0].isScheduledCallMutuallyConfirmed);
					let isUserCallReviewDone = parseInt(callScheduleDetails[0].isUserCallReviewDone);
			        let callScheduleUserStatus   = callScheduleDetails[0].callScheduleUserStatus;
			        let callScheduleFriendStatus = callScheduleDetails[0].callScheduleFriendStatus;

					/* To validate call schedule future date */
			        let callScheduleDate = callScheduleDetails[0].callScheduleDate;
			        let currentDateTime  = custom.changeDateFormat(custom.getCurrentTime(),'yyyy-mm-dd');
			        let isFutureDateTime = moment(callScheduleDate).isAfter(currentDateTime); 
					if(isUserCallReviewDone === 1){
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled call already finished.')
							        });
					}else if(isScheduledCallMutuallyConfirmed === 1){
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled call already accepted.')
							        });
					}else if(callScheduleUserID === masterUserId && callScheduleUserStatus === 'REJECT'){
			        	return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled call already rejected.')
							        });
					}else if(callScheduleFriendID === masterUserId && callScheduleFriendStatus === 'REJECT'){
			        	return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled call already rejected.')
							        });
					}else if(callScheduleDetails[0].callGlobalStatus === "PENDING"){
						callback(null, userDetailsObj,masterUserId,callScheduleDetails);
					}else{
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Failed please try again.')
							        });
					}
						    	
			    }
			], function (err,userDetailsObj,masterUserId,callScheduleDetails) {

				database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Update call schedule data */	  
						let callScheduleObj = {};
						let callScheduleUserStatus   = callScheduleDetails[0].callScheduleUserStatus;
						let callScheduleFriendStatus = callScheduleDetails[0].callScheduleFriendStatus;
						if(callScheduleDetails[0].callScheduleUserID === masterUserId && callScheduleDetails[0].callScheduleUserStatus === 'PENDING')
						{
							callScheduleUserStatus = 'REJECT';
							callScheduleObj.callScheduleUserStatus = 'REJECT';
							callScheduleObj.callScheduleUserResponseDateTime = custom.getCurrentTime();
						}
						if(callScheduleDetails[0].callScheduleFriendID === masterUserId && callScheduleDetails[0].callScheduleFriendStatus === 'PENDING')
						{
							callScheduleFriendStatus = 'REJECT';
							callScheduleObj.callScheduleFriendStatus = 'REJECT';
							callScheduleObj.callScheduleFriendResponseDateTime = custom.getCurrentTime();
						}
						callScheduleObj.callGlobalStatus = 'REJECT';
                        let i1 = queryBuilder.update(constant.schedule_calls,callScheduleObj,{callScheduleID:callScheduleModuleID});
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
									            "message": custom.lang(locale,'Failed to reject scheduled call.')
									        });
	                        }

	                    /* Insert reject scheduled call notification */
	                    var notificationUserId   = '';
	                    var notificationFriendId = '';
	                    if(callScheduleDetails[0].callScheduleUserID === masterUserId){
	                    	notificationUserId   = callScheduleDetails[0].callScheduleUserID;
	                    	notificationFriendId = callScheduleDetails[0].callScheduleFriendID;
						}else{
							notificationUserId   = callScheduleDetails[0].callScheduleFriendID;
	                    	notificationFriendId = callScheduleDetails[0].callScheduleUserID;
						}
					   	let notificationDataObj = {};
                		notificationDataObj.notificationUserId   = notificationUserId;
                		notificationDataObj.notificationFriendId = notificationFriendId;
                		notificationDataObj.callScheduleModuleID = callScheduleModuleID;
                		notificationDataObj.notificationModule   = callScheduleDetails[0].callScheduleModuleName;
                		notificationDataObj.notificationType     = 'REJECT_SCHEDULED_CALL';
                		notificationDataObj.notificationMessage  = 'has rejected your call request';
                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
                		notificationDataObj.notificationParams   = JSON.stringify({callScheduleDate:custom.changeDateFormat(callScheduleDetails[0].callScheduleDate,'yyyy-mm-dd'),callScheduleTime:callScheduleDetails[0].callScheduleTime,callGlobalStatus:callScheduleObj.callGlobalStatus,callScheduleUserStatus:callScheduleUserStatus,callScheduleFriendStatus:callScheduleFriendStatus,callNote:custom.nullChecker(callScheduleDetails[0].callNote)});
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
			                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " has rejected your call request";
			                            let extraParams = {};
			                            extraParams.callScheduleModuleID = callScheduleModuleID;
			                            extraParams.callScheduleUserID   = notificationUserId;
			                            extraParams.callScheduleFriendID = notificationFriendId;
			                            extraParams.moduleName = callScheduleDetails[0].callScheduleModuleName;
			                            extraParams.callGlobalStatus = callScheduleDetails[0].callGlobalStatus;
			                            extraParams.notificationType = 'REJECT_SCHEDULED_CALL';
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
			            		return res.send({"code" : 200, "response" : {callScheduleModuleID:callScheduleModuleID},"status" : 1,"message" : custom.lang(locale,'Call request rejected sucessfully.')});
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

	/* To cancel scheduled call
	 * @param {string}  userLoginSessionKey
	 * @param {integer} callScheduleModuleID
	 * @param {integer} notificationId (Optional)
	*/
	app.post('/scheduled-call/cancel', function(req, res) {

		let locale   = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("callScheduleModuleID").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('callScheduleModuleID', custom.lang(locale,'The Call schedule module id required')).notEmpty();
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
			let callScheduleModuleID  = parseInt(req.sanitize('callScheduleModuleID').escape().trim());
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
					        model.getAllWhere(function(err,callScheduleDetails){
					        	if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(callScheduleDetails == ""){
				                		return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,'Invalid call schedule module id.')
											        });
				                	}else{
				                		callback(null, respObj,masterUserId,callScheduleDetails);
				                	}
				                }
				            },constant.schedule_calls,{callScheduleID:callScheduleModuleID});
						}
					},userLoginSessionKey,timezone);
			    },
			    function(userDetailsObj,masterUserId,callScheduleDetails, callback) {
					
					let callScheduleUserID   = parseInt(callScheduleDetails[0].callScheduleUserID);
					let callScheduleFriendID = parseInt(callScheduleDetails[0].callScheduleFriendID);
					let isScheduledCallMutuallyConfirmed = parseInt(callScheduleDetails[0].isScheduledCallMutuallyConfirmed);
					let isUserCallReviewDone = parseInt(callScheduleDetails[0].isUserCallReviewDone);
			        let callScheduleUserStatus   = callScheduleDetails[0].callScheduleUserStatus;
			        let callScheduleFriendStatus = callScheduleDetails[0].callScheduleFriendStatus;

					/* To validate call schedule future date */
			        let callScheduleDate = callScheduleDetails[0].callScheduleDate;
			        let currentDateTime  = custom.changeDateFormat(custom.getCurrentTime(),'yyyy-mm-dd');
			        let isFutureDateTime = moment(callScheduleDate).isAfter(currentDateTime); 
					if(isUserCallReviewDone === 1){
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled call already finished.')
							        });
					}else if(callScheduleUserID === masterUserId && callScheduleUserStatus === 'CANCELLED'){
			        	return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled call already cancelled.')
							        });
					}else if(callScheduleFriendID === masterUserId && callScheduleFriendStatus === 'CANCELLED'){
			        	return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled call already cancelled.')
							        });
					}else if(callScheduleDetails[0].callGlobalStatus === "ACCEPT"){
						callback(null, userDetailsObj,masterUserId,callScheduleDetails);
					}else{
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Failed please try again.')
							        });
					}
						    	
			    }
			], function (err,userDetailsObj,masterUserId,callScheduleDetails) {

				database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Update call schedule data */	  
						let callScheduleObj = {};
						let callScheduleUserStatus   = callScheduleDetails[0].callScheduleUserStatus;
						let callScheduleFriendStatus = callScheduleDetails[0].callScheduleFriendStatus;
						if(callScheduleDetails[0].callScheduleUserID === masterUserId && callScheduleDetails[0].callScheduleUserStatus === 'PENDING')
						{
							callScheduleUserStatus = 'CANCELLED';
							callScheduleObj.callScheduleUserStatus = 'CANCELLED';
							callScheduleObj.callScheduleUserResponseDateTime = custom.getCurrentTime();
						}
						if(callScheduleDetails[0].callScheduleFriendID === masterUserId && callScheduleDetails[0].callScheduleFriendStatus === 'PENDING')
						{
							callScheduleFriendStatus = 'CANCELLED';
							callScheduleObj.callScheduleFriendStatus = 'CANCELLED';
							callScheduleObj.callScheduleFriendResponseDateTime = custom.getCurrentTime();
						}
						callScheduleObj.callGlobalStatus = 'CANCELLED';
                        let i1 = queryBuilder.update(constant.schedule_calls,callScheduleObj,{callScheduleID:callScheduleModuleID});
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
									            "message": custom.lang(locale,'Failed to cancel scheduled call.')
									        });
	                        }

	                    /* Insert reject scheduled call notification */
	                    var notificationUserId   = '';
	                    var notificationFriendId = '';
	                    if(callScheduleDetails[0].callScheduleUserID === masterUserId){
	                    	notificationUserId   = callScheduleDetails[0].callScheduleUserID;
	                    	notificationFriendId = callScheduleDetails[0].callScheduleFriendID;
						}else{
							notificationUserId   = callScheduleDetails[0].callScheduleFriendID;
	                    	notificationFriendId = callScheduleDetails[0].callScheduleUserID;
						}
					   	let notificationDataObj = {};
                		notificationDataObj.notificationUserId   = notificationUserId;
                		notificationDataObj.notificationFriendId = notificationFriendId;
                		notificationDataObj.callScheduleModuleID = callScheduleModuleID;
                		notificationDataObj.notificationModule   = callScheduleDetails[0].callScheduleModuleName;
                		notificationDataObj.notificationType     = 'CANCEL_SCHEDULED_CALL';
                		notificationDataObj.notificationMessage  = 'has cancelled your call request';
                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
                		notificationDataObj.notificationParams   = JSON.stringify({callScheduleDate:custom.changeDateFormat(callScheduleDetails[0].callScheduleDate,'yyyy-mm-dd'),callScheduleTime:callScheduleDetails[0].callScheduleTime,callGlobalStatus:callScheduleObj.callGlobalStatus,callScheduleUserStatus:callScheduleUserStatus,callScheduleFriendStatus:callScheduleFriendStatus,callNote:custom.nullChecker(callScheduleDetails[0].callNote)});
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
			                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " has cancelled your call request";
			                            let extraParams = {};
			                            extraParams.callScheduleModuleID = callScheduleModuleID;
			                            extraParams.callScheduleUserID   = notificationUserId;
			                            extraParams.callScheduleFriendID = notificationFriendId;
			                            extraParams.moduleName = callScheduleDetails[0].callScheduleModuleName;
			                            extraParams.callGlobalStatus = callScheduleDetails[0].callGlobalStatus;
			                            extraParams.notificationType = 'CANCEL_SCHEDULED_CALL';
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
			            		return res.send({"code" : 200, "response" : {callScheduleModuleID:callScheduleModuleID},"status" : 1,"message" : custom.lang(locale,'Call request cancelled sucessfully.')});
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

	/* To get scheduled calls list
	 * @param {string}  userLoginSessionKey
	 * @param {integer} pageNo
	 * @param {string}  moduleName
	*/
	app.post('/scheduled-call/list', function(req, res) {

		let locale = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("pageNo").trim();
		req.sanitize("moduleName").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('pageNo', custom.lang(locale,'Require page number')).notEmpty();
	    req.check('pageNo', custom.lang(locale,'Page number minimum value should be 1')).minValue(1);
	    req.check('moduleName', custom.lang(locale,'Require module name')).notEmpty();
    	req.check('moduleName', custom.lang(locale,'Select valid module name')).inList(["FRIENDLY","DATING","PROVIDER"]);
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
			let moduleName            = req.sanitize('moduleName').escape().trim();

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
			    	var callScheduleQuery = "SELECT * FROM " + constant.schedule_calls + " AS `C` INNER JOIN " + constant.user_details + " AS `UD` ON `C`.`callScheduleUserID` = `UD`.`userId` OR `C`.`callScheduleFriendID` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND `C`.`callGlobalStatus` = 'ACCEPT' AND `C`.`callScheduleModuleName` = '"+moduleName+"' AND (`C`.`callScheduleUserID` = " + masterUserId + " OR `C`.`callScheduleFriendID` = " + masterUserId + ") AND CONCAT(TRIM(`C`.callScheduleDate), ' ', TRIM(`C`.callScheduleTime)) >= '" + custom.getCurrentTime() + "'  AND `UD`.`userId` NOT IN ("+notInUserIds.join()+") GROUP BY `C`.`callScheduleID` ORDER BY `C`.`callScheduleDate`, `C`.`callScheduleTime` ASC ";
			    	model.customQuery(function(err,callScheduledObj){
			    		if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	let totalScheduledCalls = parseInt(callScheduledObj.length);
		                	if(offset > 0){
					    		callScheduleQuery += "LIMIT " + offset + "," + constant.results_limit;
					    	}else{
					    		callScheduleQuery += "LIMIT " + constant.results_limit
					    	}
					        model.customQuery(function(err,usersObj){
					        	if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(usersObj != ""){
				                		callback(null, userDetailsObj, usersObj,totalScheduledCalls);
				                	}else{
				                		return res.send({
										            "code": 200,
										            "response": [],
										            "status": 0,
										            "message": custom.lang(locale,"Scheduled calls not found.")
										        });
				                	}
				                }
					        },callScheduleQuery);
		                }
		            },callScheduleQuery);
			    }
			], function (err,userDetailsObj,usersObj,totalScheduledCalls) {
				let masterUserId = parseInt(userDetailsObj[0].masterUserId);
				let responseObj  = [];
				for (var i = 0; i < parseInt(usersObj.length); i++) 
                {
                	let row = {};
                	row.masterUserId   = custom.nullChecker(usersObj[i].userId);
                    row.userFirstName  = custom.nullChecker(usersObj[i].userFirstName);
                    row.userLastName   = custom.nullChecker(usersObj[i].userLastName);
                    row.userMood       = custom.nullChecker(usersObj[i].userMood);
                    row.callScheduleModuleName = custom.nullChecker(usersObj[i].callScheduleModuleName);
                    row.callScheduleUserID = custom.nullChecker(usersObj[i].callScheduleUserID);
                    row.callScheduleFriendID = custom.nullChecker(usersObj[i].callScheduleFriendID);
                    row.callScheduleModuleID = custom.nullChecker(usersObj[i].callScheduleID);
                    row.callScheduleDate = custom.changeDateFormat(usersObj[i].callScheduleDate,'yyyy-mm-dd');
                    row.callScheduleTime = custom.nullChecker(usersObj[i].callScheduleTime);
                    row.callNote = custom.nullChecker(usersObj[i].callNote);
                    row.userCallRequestTime = custom.changeDateFormat(usersObj[i].userCallRequestTime);
                    row.userCallReview = custom.nullChecker(usersObj[i].userCallReview);
                    row.userImage      = (usersObj[i].userImage) ? constant.base_url + usersObj[i].userImage : "";
                    row.userImageThumbnail  = (usersObj[i].userImageThumbnail) ? constant.base_url + usersObj[i].userImageThumbnail : "";
                	responseObj.push(row);
                	if (i === parseInt(usersObj.length - 1)) {
                      return res.send({
						            "code": 200,
						            "response": responseObj,
						            "status": 1,
						            "totalCount": totalScheduledCalls,
						            "message": custom.lang(locale,"success.")
						        });
                    }
                }
			});
		}	
	});

	/* To re-schedule user calls
	 * @param {string}  userLoginSessionKey
	 * @param {integer} callScheduleModuleID
	 * @param {string}  callReScheduleDate
	 * @param {string}  callReScheduleTime
	 * @param {integer} notificationId (Optional)
	 * @param {string}  callNote (Optional)
	*/
	app.post('/call/re-schedule', function(req, res) {

		let locale = req.headers.locale;
		let userTimeZone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("callScheduleModuleID").trim();
		req.sanitize("callReScheduleDate").trim();
		req.sanitize("callReScheduleTime").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('callScheduleModuleID', custom.lang(locale,'The Call schedule module id required')).notEmpty();
	    req.check('callReScheduleDate', custom.lang(locale,'Call re-schedule date is required')).notEmpty();
	    req.check('callReScheduleTime', custom.lang(locale,'Call re-schedule time is required')).notEmpty();
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
			let callScheduleModuleID  = parseInt(req.sanitize('callScheduleModuleID').escape().trim());
			let callReScheduleDate    = req.sanitize('callReScheduleDate').escape().trim();
			let callReScheduleTime    = req.sanitize('callReScheduleTime').escape().trim();
			let isValidDate           = custom.validateDateTime(callReScheduleDate,'YYYY-MM-DD');
			let isValidTime           = custom.validateDateTime(callReScheduleTime,'HH:mm');
			let notificationId        = (!req.body.notificationId) ? 0 : parseInt(req.body.notificationId);
			let callNote              = (!req.body.callNote) ? '' : req.sanitize('callNote').escape().trim();

			/* Validate call re-schedule date */
	        if(!isValidDate){
	            return res.send({
	                        "code": 200,
	                        "response": {},
	                        "status": 0,
	                        "message": custom.lang(locale,'Invalid Call re-schedule date format, should be (YYYY-MM-DD)')
	                    });
	        }

	        /* Validate call re-schedule time */
	        if(!isValidTime){
	            return res.send({
	                        "code": 200,
	                        "response": {},
	                        "status": 0,
	                        "message": custom.lang(locale,'Invalid Call re-schedule time format, should be (HH:mm)')
	                    });
	        }

	        /* Validate future date time */
	        let callReScheduleDateTime = callReScheduleDate + " " + callReScheduleTime + ":00";
	        let currentDateTime        = custom.getCurrentTime();
	        if(currentDateTime > callReScheduleDateTime)
	        {
	        	return res.send({
	                        "code": 200,
	                        "response": {},
	                        "status": 0,
	                        "message": custom.lang(locale,'Call re-schedule date time must be future date time')
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
					        model.getAllWhere(function(err,callScheduleDetails){
					        	if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(callScheduleDetails == ""){
				                		return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,'Invalid call schedule module id.')
											        });
				                	}else{
				                		let oldCallScheduleDetails = custom.changeDateFormat(callScheduleDetails[0].callScheduleDate,'yyyy-mm-dd') + " " + callScheduleDetails[0].callScheduleTime;
				                		if(oldCallScheduleDetails === callReScheduleDateTime){
				                			return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,'Call re-schedule date time can not be same.')
											        });
				                		}else{
				                			callback(null, respObj,masterUserId,callScheduleDetails);
				                		}
				                	}
				                }
				            },constant.schedule_calls,{callScheduleID:callScheduleModuleID});
						}
					},userLoginSessionKey,userTimeZone);
			    },
			    function(userDetailsObj,masterUserId,callScheduleDetails, callback) {
					
					let callScheduleUserID   = parseInt(callScheduleDetails[0].callScheduleUserID);
					let callScheduleFriendID = parseInt(callScheduleDetails[0].callScheduleFriendID);
					let isScheduledCallMutuallyConfirmed = parseInt(callScheduleDetails[0].isScheduledCallMutuallyConfirmed);
					let isUserCallReviewDone = parseInt(callScheduleDetails[0].isUserCallReviewDone);
			        let callScheduleUserStatus   = callScheduleDetails[0].callScheduleUserStatus;
			        let callScheduleFriendStatus = callScheduleDetails[0].callScheduleFriendStatus;

					/* To validate call schedule future date */
			        let callScheduleDate = custom.changeDateFormat(callScheduleDetails[0].callScheduleDate,'yyyy-mm-dd');
			        let callScheduleTime = callScheduleDetails[0].callScheduleTime;
			        let callGlobalStatus = callScheduleDetails[0].callGlobalStatus;
			        let currentDateTime  = custom.getCurrentTime();
			        let callScheduleDateTime  = callScheduleDate + " " + callScheduleTime + ":00";
					if(isUserCallReviewDone === 1){
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Scheduled call already finished.')
							        });
					}else if(currentDateTime > callScheduleDateTime){
			        	return res.send({
			                        "code": 200,
			                        "response": {},
			                        "status": 0,
			                        "message": custom.lang(locale,'Scheduled call has past date, you can`t re-schedule this call.')
			                    });
			        }else if(callGlobalStatus === 'PENDING' || callGlobalStatus === 'ACCEPT'){
						callback(null, userDetailsObj,masterUserId,callScheduleDetails);
			        }else if(callGlobalStatus === 'CANCELLED'){
						return res.send({
			                        "code": 200,
			                        "response": {},
			                        "status": 0,
			                        "message": custom.lang(locale,'Call already cancelled.')
			                    });
			        }else{
			        	return res.send({
			                        "code": 200,
			                        "response": {},
			                        "status": 0,
			                        "message": custom.lang(locale,'Failed, please try again.')
			                    });
			        }
			    },
			    function(userDetailsObj,masterUserId,callScheduleDetails, callback) {

			    	var friendID = '';
			    	if(callScheduleDetails[0].callScheduleUserID === masterUserId){
			    		friendID = callScheduleDetails[0].callScheduleFriendID;
			    	}else{
			    		friendID = callScheduleDetails[0].callScheduleUserID;

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
									            "message": custom.lang(locale,'You can not re-schedule call with this user.')
									        });
		                	}else{
		                		callback(null, userDetailsObj,masterUserId,callScheduleDetails,friendID);
		                	}
		                }
		            },blockQuery);
			    },
			    function(userDetailsObj,masterUserId,callScheduleDetails,friendID, callback) {

			    	/* Check if call already scheduled */
			    	let scheduleQuery = 'SELECT * FROM ' + constant.schedule_calls + ' WHERE `isScheduledCallMutuallyConfirmed` = 1 AND callGlobalStatus = "ACCEPT" AND `callScheduleDate` = "' + custom.changeDateFormat(callReScheduleDate,'yyyy-mm-dd') + '" AND `callScheduleTime` = "' + callReScheduleTime + '" AND ((`callScheduleUserID` = ' + friendID + ' OR `callScheduleFriendID` = ' + masterUserId + ') OR (`callScheduleUserID` = ' + masterUserId + ' OR `callScheduleFriendID` = ' + friendID + '))';
			        model.customQuery(function(err,scheduleQuery){
			        	if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(scheduleQuery != ""){
		                		return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Call already scheduled in same datetime period.')
									        });
		                	}else{
		                		callback(null, userDetailsObj,masterUserId,callScheduleDetails,friendID);
		                	}
		                }
		            },scheduleQuery);
			    }
			], function (err,userDetailsObj,masterUserId,callScheduleDetails,friendID) {

				database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Insert call reschedule data */	   
						let callReScheduleObj = {};
						callReScheduleObj.callScheduleID                = callScheduleModuleID;
						callReScheduleObj.callReScheduleDate            = callReScheduleDate;
						callReScheduleObj.callReScheduleTime            = callReScheduleTime;
						callReScheduleObj.callReScheduleRequestUserID   = masterUserId;
						callReScheduleObj.callReScheduleRequestDateTime = custom.getCurrentTime();
                        let i1 = queryBuilder.insert(constant.reschedule_calls,callReScheduleObj);
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
									            "message": custom.lang(locale,'Failed to re-schedule call.')
									        });
	                        }
	                        var callReScheduleID = parseInt(callResp.insertId);

	                    /* Update schedule call details */
	                    let callScheduleUpdateObj = {};
	                    callScheduleUpdateObj.callScheduleDate = callReScheduleDate;
	                    callScheduleUpdateObj.callScheduleTime = callReScheduleTime;
	                    callScheduleUpdateObj.callScheduleTimeZone   = (userTimeZone) ? userTimeZone : constant.default_timezone;
	                    callScheduleUpdateObj.isCallRescheduled = 1;
	                    callScheduleUpdateObj.isScheduledCallMutuallyConfirmed = 0;
	                    callScheduleUpdateObj.callGlobalStatus = 'PENDING';
	                    callScheduleUpdateObj.callNote = callNote;
	                    callScheduleUpdateObj.lastRescheduleCallRequestTime = custom.getCurrentTime();
	                    if(callScheduleDetails[0].callScheduleUserID === masterUserId){
	                    	callScheduleUpdateObj.callScheduleUserStatus   = 'ACCEPT';
	                    	callScheduleUpdateObj.callScheduleFriendStatus = 'PENDING';
	                    }else{
	                    	callScheduleUpdateObj.callScheduleUserStatus   = 'PENDING';
	                    	callScheduleUpdateObj.callScheduleFriendStatus = 'ACCEPT';
	                    }
                        let u = queryBuilder.update(constant.schedule_calls,callScheduleUpdateObj,{callScheduleID:callScheduleModuleID});
                        queryBuilder.reset_query(u);
                        connection.query(u, function(err, resp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }

	                    /* Insert call schedule request notification */
					   	let notificationDataObj = {};
                		notificationDataObj.notificationUserId   = masterUserId;
                		notificationDataObj.notificationFriendId = friendID;
                		notificationDataObj.callScheduleModuleID = callScheduleModuleID;
                		notificationDataObj.notificationModule   = callScheduleDetails[0].callScheduleModuleName;
                		notificationDataObj.notificationType     = 'RE_SCHEDULE_CALL';
                		notificationDataObj.actionStatus         = 'PENDING';
                		notificationDataObj.notificationMessage  = 'has re-scheduled a call';
                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
                		notificationDataObj.notificationParams   = JSON.stringify({callScheduleDate:callReScheduleDate,callScheduleTime:callReScheduleTime + ":00",callGlobalStatus:'PENDING',callScheduleUserStatus:callScheduleUpdateObj.callScheduleUserStatus,callScheduleFriendStatus:callScheduleUpdateObj.callScheduleFriendStatus,callNote:callNote});
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
	                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " has re-scheduled a call";
	                            let extraParams = {};
	                            extraParams.callScheduleModuleID = callScheduleModuleID;
	                            extraParams.callScheduleUserID   = masterUserId;
	                            extraParams.callScheduleFriendID = friendID;
	                            extraParams.moduleName = callScheduleDetails[0].callScheduleModuleName;
	                            extraParams.notificationType = 'RE_SCHEDULE_CALL';
	                            notification.sendPushNotifications(userMessage,friendID,extraParams);

	                            /* Update Old Notification */
						        if(notificationId > 0)
						        {
						        	model.updateData(function(err,updateNotiResp){
						        	},constant.notifications,{actionStatus:"RE_SCHEDULED"},{notificationId:notificationId});
						        }

	                            /* Return user response */
			            		return res.send({"code" : 200, "response" : {callScheduleModuleID:callScheduleModuleID},"status" : 1,"message" : custom.lang(locale,'Call re-scheduled sucessfully.')});
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

}