"use strict";

/*
 * Purpose: For socket communication
 * Authur : Sorav Garg
 * Company: Mobiweb Technology Pvt. Ltd.
*/

/* Load node js modules */
var mobiweb      = require('mobiweb-nodejs-modules'),
	appRoot      = require('app-root-path'),
	async        = require('async'),
	model        = require(appRoot + '/lib/model.js'),
	database     = require(appRoot + '/config/database.js'),
	constant     = require(appRoot + '/config/constant.js'),
	notification = require(appRoot + '/lib/notification.js'),
	custom       = require(appRoot + '/lib/custom.js'),
	streams      = require(appRoot + '/lib/streams.js')(),
	roomNo       = require(appRoot + "/index.js").roomNo,
	userRooms    = require(appRoot + "/index.js").userRooms,
	io           = require(appRoot + "/index.js").io,
	queryBuilder = require(appRoot + '/lib/query-builder.js').QueryBuilder(),
	callLimit    = constant.daily_call_limit,
	callStatusUpdateLimit = 35000, // In Miliseconds (35 seconds)
	callDisconnectLimit = 10, // seconds (After 10 seconds + (10 seconds ping pong interval) user will remove from room, while reconnecting call)
	callNotification;

class Socket {
    constructor(socket) {
    	var self = this;
    	var handshakeQuery = socket.handshake.query;

    	/* Note:- User ID IS Custom Socket ID (socketCustomId == userID) */
    	var socketCustomId = (!handshakeQuery.uid) ? '' : parseInt(handshakeQuery.uid);
    	console.log('socketCustomId',socketCustomId);
    	if(!socketCustomId) return;

    	/* For User Login */
		let userIdKey = socketCustomId;

    	/* Manage if user already in room */
    	self.isUserExistInAnyRoom(function(respType,roomName,totalUsers){

    		if(respType === 1)
    		{
    			if(userRooms.has(roomName))
		    	{
		    		let roomDataObj      = userRooms.get(roomName);
		    		let usersDataObj = roomDataObj.userData;
		    		let totalUsersCount = parseInt(usersDataObj.length);
	    			let userData    = new Array();
					let roomData    = new Object();
					if(totalUsersCount > 0){
	    				for (var i = 0; i < totalUsersCount; i++) 
	    				{
    						let isDisconnectLimitExceed = self.isDisconnectLimitExceed(usersDataObj[i].isDisconnected,usersDataObj[i].disconnectedTime);
    						let userRow = {};
                            userRow.userID   = usersDataObj[i].userID;
                            userRow.userName = usersDataObj[i].userName;
                            userRow.isOpenForAllCalls = parseInt(usersDataObj[i].isOpenForAllCalls);
                            userRow.isGroupChatEnable = parseInt(usersDataObj[i].isGroupChatEnable);
                            userRow.isCallOwner       = parseInt(usersDataObj[i].isCallOwner);
                            if(usersDataObj[i].userID === userIdKey){
                            	userRow.isDisconnected    = 0;
                            	userRow.disconnectedTime  = '';
                            }else{
                            	userRow.isDisconnected    = parseInt(usersDataObj[i].isDisconnected);
                            	userRow.disconnectedTime  = usersDataObj[i].disconnectedTime;
                            }
                            userRow.userCallHoldStatus = usersDataObj[i].userCallHoldStatus;
                            if(!isDisconnectLimitExceed){
                            	userRow.isUserRemoved  = 0;
                            }else{
                            	userRow.isUserRemoved  = 1;
                            	self.updateUserCallEndTime(roomDataObj.callHistoryID,usersDataObj[i].userID);
                            }
                            userRow.addedDateTime      = usersDataObj[i].addedDateTime;
                            userRow.userOriginalImg    = usersDataObj[i].userOriginalImg;
                            userRow.userThumbnailImg   = usersDataObj[i].userThumbnailImg;
                            userData.push(userRow);
	    					if(i === parseInt(totalUsersCount - 1))
	    					{
	    						console.log('userDataLoginEvent',userData);
	    						roomData.roomName      = roomDataObj.roomName;
	    						roomData.moduleName    = roomDataObj.moduleName;
		                        roomData.callHistoryID = roomDataObj.callHistoryID;
		                        roomData.userData      = self.removeDuplicateUsers(userData);
		                        roomData.createdDate   = roomDataObj.createdDate; // UTC Time
		                        roomData.callStartedDateTime = roomDataObj.callStartedDateTime;
		                        roomData.currentTime    = custom.getCurrentTime();
		                        userRooms.set(roomName, roomData);

		                        /* Destroy room */
								self.destroyRoom(roomName);	
	    					}
	    				}
	    			}else{
	    				roomData.roomName      = roomDataObj.roomName;
	    				roomData.moduleName    = roomDataObj.moduleName;
                        roomData.callHistoryID = roomDataObj.callHistoryID;
                        roomData.userData      = self.removeDuplicateUsers(userData);
                        roomData.createdDate   = roomDataObj.createdDate; // UTC Time
                        roomData.callStartedDateTime = roomDataObj.callStartedDateTime;
                        roomData.currentTime    = custom.getCurrentTime();
                        userRooms.set(roomName, roomData);

                        /* Destroy room */
						self.destroyRoom(roomName);
	    			}
		    	}

    		}
    	},userIdKey);
	
    	/**
		 * Events for WebRTC
		*/
    	socket.emit('id', socket.id);

	    socket.on('message', function (details) {
	      var userID  = parseInt(details.to); // USER ID

	      /* Get user socket id */
	      var userSocketID = self.getUserSocketID(userID);
	      if(!userSocketID){
	      	return;
	      }
	      var otherClient = io.sockets.connected[userSocketID];

	      if (!otherClient) {
	        return;
	      }
	        delete details.to;
	        details.from = socketCustomId;
	        otherClient.emit('message', details);
	    });

	    /**
		 * Events for add stream
		*/
	    socket.on('readyToStream', function(options) {
	      console.log('-- ' + socket.id + ' is ready to stream --');
	      streams.addStream(socket.id, options.name); 
	    });
	    
	    /**
		 * Events for update socket id
		*/
	    socket.on('update', function(options) {
	      streams.update(socket.id, options.name);
	    });

	    socket.on('leave', function(){
	    	console.log('------- Remove Stream Called -------');
	    	console.log('socketId',socket.id);
	    	streams.removeStream(socket.id);
	    });

		/* To detect disconnected users (Pre-defined event, called automatically) */
		socket.on('disconnect', function () {
			console.log('----------User Disconnect-----------');

			/* Get socket id */
		    let socketId = socket.id;

		    /* Manage user in room */
		    if(socketCustomId && !self.isUserSocketConnected(socketCustomId))
		    {
		    	console.log('disconnected')
		    	let disconnectedUserId = parseInt(socketCustomId);

		    	self.isUserExistInAnyRoom(function(respType,roomName,totalUsers){
		    		if(respType === 1)
		    		{
		    			if(userRooms.has(roomName))
		    			{
		    				let roomDataObj  = userRooms.get(roomName);
			    			let usersDataObj = roomDataObj.userData;
			    			let totalUsersCount = parseInt(usersDataObj.length);
			    			let userData    = new Array();
							let roomData    = new Object();
			    			if(totalUsersCount > 0){
				    			for (var i = 0; i < totalUsersCount; i++) 
			    				{
			    					let isDisconnectLimitExceed = self.isDisconnectLimitExceed(usersDataObj[i].isDisconnected,usersDataObj[i].disconnectedTime);
		    						let userRow = {};
		                            userRow.userID   = usersDataObj[i].userID;
		                            userRow.userName = usersDataObj[i].userName;
		                            userRow.isOpenForAllCalls = parseInt(usersDataObj[i].isOpenForAllCalls);
		                            userRow.isGroupChatEnable = parseInt(usersDataObj[i].isGroupChatEnable);
		                            userRow.isCallOwner       = parseInt(usersDataObj[i].isCallOwner);
		                            if(usersDataObj[i].userID === disconnectedUserId){
		                            	userRow.isDisconnected    = 1;
		                            	userRow.disconnectedTime  = custom.getCurrentTime();
		                            }else{
		                            	userRow.isDisconnected    = parseInt(usersDataObj[i].isDisconnected);
		                            	userRow.disconnectedTime  = usersDataObj[i].disconnectedTime;
		                            }
		                            if(!isDisconnectLimitExceed){
			                            userRow.isUserRemoved = 0;
		                            }else{
		                            	userRow.isUserRemoved = 1;
		                            	self.updateUserCallEndTime(roomDataObj.callHistoryID,usersDataObj[i].userID);
		                            }
		                            userRow.userCallHoldStatus = usersDataObj[i].userCallHoldStatus;
		                            userRow.addedDateTime      = usersDataObj[i].addedDateTime;
		                            userRow.userOriginalImg    = usersDataObj[i].userOriginalImg;
		                            userRow.userThumbnailImg   = usersDataObj[i].userThumbnailImg;
		                            userData.push(userRow);
			    					if(i === parseInt(totalUsersCount - 1))
			    					{
			    						console.log('userDataDisconnect',userData);
			    						roomData.roomName      = roomDataObj.roomName;
			    						roomData.moduleName    = roomDataObj.moduleName;
				                        roomData.callHistoryID = roomDataObj.callHistoryID;
				                        roomData.userData      = self.removeDuplicateUsers(userData);
				                        roomData.createdDate   = roomDataObj.createdDate; // UTC Time
				                        roomData.callStartedDateTime = roomDataObj.callStartedDateTime;
				                        roomData.currentTime    = custom.getCurrentTime();
				                        userRooms.set(roomName, roomData);

				                        /* Destroy room */
										self.destroyRoom(roomName);
			    					}
			    				}
			    			}else{
			    				roomData.roomName      = roomDataObj.roomName;
			    				roomData.moduleName    = roomDataObj.moduleName;
		                        roomData.callHistoryID = roomDataObj.callHistoryID;
		                        roomData.userData      = self.removeDuplicateUsers(userData);
		                        roomData.createdDate   = roomDataObj.createdDate; // UTC Time
		                        roomData.callStartedDateTime = roomDataObj.callStartedDateTime;
		                        roomData.currentTime    = custom.getCurrentTime();
		                        userRooms.set(roomName, roomData);

		                        /* Destroy room */
								self.destroyRoom(roomName);
			    			}
		    			}
		    		}
		    	},disconnectedUserId);
		    }

		    /* Remove stream */
			streams.removeStream(socketId);
		});

		/**
		 * To manage user calling create room & join room
		 * @param {integer} senderUserID
		 * @param {integer} receiverUserID
		 * @param {string}  senderUserName
		 * @param {string}  receiverUserName
		 * @param {string}  moduleName
		*/
		socket.on('user-calling', function (userData,callBack) {
			console.log('----------- User Calling --------------');

			if (userData.senderUserID && userData.receiverUserID && userData.senderUserName && userData.receiverUserName && userData.moduleName) {
				let senderUserID   = parseInt(userData.senderUserID);
				let receiverUserID = parseInt(userData.receiverUserID);
				let senderUserName   = userData.senderUserName;
				let receiverUserName = userData.receiverUserName;
				let moduleName       = userData.moduleName;
				let callLimit        = constant.daily_call_limit;

				/* To check if user is logged-out */
				model.getAllWhere(function(err,userResp){
					if(err){
	                	return callBack(custom.dbErrorResponse());
	                }else{
	                	if(userResp != ""){
	                		if(parseInt(userResp[0].isUserLoggedOut) === 0){
	                			/* To check if user is blocked */
								custom.isUserBlocked(function(respType,blockResp){
									if(respType === 1){
										return callBack({
							            			"code":200,
									                "status": 0,
									                "response": {},
									                "message": receiverUserName + " has blocked you",
									            });
									}else{
										let callCompletedTime = custom.getCurrentTime();

										/* To check call already taken for same day */
										let callQuery = 'SELECT * FROM ' + constant.call_history + ' AS `CH` INNER JOIN ' + constant.call_history_users + ' AS `CHU` ON `CH`.`callHistoryID` = `CHU`.`callHistoryID` WHERE `CH`.`callSenderUserID` = ' + senderUserID + ' AND `CH`.`callHistoryModuleName` = "' + moduleName + '" AND `CHU`.`callUserID` = ' + receiverUserID + ' AND `CH`.`callStatus` = "FINISHED" AND DATE_FORMAT(`CH`.`callInitiateTime`, "%Y-%m-%d") = "' + custom.changeDateFormat(custom.getCurrentTime(),'yyyy-mm-dd') + '"';
										model.customQuery(function(err,callResp){
											if(err){
							                    return callBack(custom.dbErrorResponse());
							                }else{
							                	var totalCalls = 0;
							                	if(callResp != ""){
							                		totalCalls = parseInt(callResp.length);
							                	}

							                	/* Check Daily Limit */
							                	if(totalCalls >= callLimit){
							                		console.log('------ User Call Daily Limit Exceeds ------');
										        	return callBack({
									            			"code":200,
											                "status": 0,
											                "response": {totalCalls:totalCalls},
											                "message": "Sorry !! you can take maximum " + callLimit + " calls in a day with same user.",
											            });
							                	}else{

							                		/* To check if sender is already on another call Or manage auto remove */
													self.isUserExistInAnyRoom(function(respType,roomName,totalUsers){
														if(respType === 1)
														{
															/* Remove user from room */
															self.destroyUserFromRoom(roomName,senderUserID);
															if(totalUsers <= 1)
															{
																/* Destroy room */
																self.destroyRoom(roomName);
															}
														}

														/* To check if receiver is already on another call Or manage auto remove */
														self.autoRemoveUserFromRoom(function(respType,userStatus){

															if(parseInt(respType) === 11 && userStatus === 'ALIVE'){ // Reconnecting

																/* Insert Call History */
												   				database.pool.getConnection(function(err, connection) {

												   					/* Begin transaction */
											                        connection.beginTransaction(function(err) {
											                            if (err) {
											                                return callBack(custom.dbErrorResponse());
											                            }

											                            /* Insert Data Into Call History Table */
											                            let callHistoryObj = {};
											                            callHistoryObj.callHistoryModuleName = moduleName;
											                            callHistoryObj.callSenderUserID	     = senderUserID;
											                            callHistoryObj.callRecieverUserID    = receiverUserID;
											                            callHistoryObj.callInitiateTime      = custom.getCurrentTime();
											                            // callHistoryObj.callCompletedTime     = callCompletedTime;
											                            callHistoryObj.callSenderStatus      = 'AUTO_CANCEL';
											                            callHistoryObj.callStatus            = 'MISSED_CALL';
											                            let callHistoryQuery = queryBuilder.insert(constant.call_history,callHistoryObj);
											                            queryBuilder.reset_query(callHistoryQuery);
											                            connection.query(callHistoryQuery, function(err, result) {
											                                if (err) {
											                                    connection.rollback(function() {
											                                        return callBack(custom.dbErrorResponse(err.sqlMessage));
											                                    });
											                                }

											                            /* Get Call History ID */
										                            	var callHistoryID = parseInt(result.insertId);
										                            	userData.callHistoryID = callHistoryID;

											                            /* Insert Data Into Call History Users Table (Sender) */
											                            let callHistoryUsersObj1 = {};
											                            callHistoryUsersObj1.callHistoryID     = callHistoryID;
											                            callHistoryUsersObj1.callUserID	       = senderUserID;
											                            callHistoryUsersObj1.isCallOwner	   = 1;
											                            callHistoryUsersObj1.callUserAddedDate = custom.getCurrentTime();
											                            callHistoryUsersObj1.callUserStatus	   = 'MISSED_CALL';
											                            let callHistoryUsersQuery1 = queryBuilder.insert(constant.call_history_users,callHistoryUsersObj1);
											                            queryBuilder.reset_query(callHistoryUsersQuery1);
											                            connection.query(callHistoryUsersQuery1, function(err, result) {
											                                if (err) {
											                                    connection.rollback(function() {
											                                        return callBack(custom.dbErrorResponse(err.sqlMessage));
											                                    });
											                                }

											                            /* Commit Queries */
											                            connection.commit(function(err) {
										                                    if (err) {
										                                        connection.rollback(function() {
										                                            return callBack(custom.dbErrorResponse());
										                                        });
										                                    }
										                                    connection.release();

										                                    /* Send push notification to receiver  */
																        	let notificationMsg = 'Missed video call from ' + senderUserName;
																        	let extraParams = {};
																        	extraParams.notificationType      = 'MISSED_CALL';
																        	extraParams.callSenderUserID      = senderUserID;
																        	extraParams.callHistoryModuleName = moduleName;
																        	notification.sendPushNotifications(notificationMsg,receiverUserID,extraParams);

											                            });
											                            });
											                            });
											                        });
												   				});

																return callBack({
													            			"code":200,
															                "status": 0,
															                "response": {isUserBusy:1},
															                "message": receiverUserName + " busy on another call",
															            });
															}else{ // Dead entry

										                		/* Get both user details */
																let bothUsers = new Array();
																bothUsers.push(senderUserID);
																bothUsers.push(receiverUserID);

																let selectQuery = "SELECT * FROM " + constant.user_details + " WHERE userId IN (" + bothUsers.join() + ")";
																model.customQuery(function(err,userDetails){
																	if(err){
													                    return callBack(custom.dbErrorResponse());
													                }else{
													                	if(userDetails != "" && parseInt(userDetails.length) >= 2){

													                		let senderDetails   = new Array();
													                		let receiverDetails = new Array();
													                		if(senderUserID === userDetails[0].userId){
													                			senderDetails = userDetails[0];
													                		}else{
													                			senderDetails = userDetails[1];
													                		}

													                		if(receiverUserID === userDetails[0].userId){
													                			receiverDetails = userDetails[0];
													                		}else{
													                			receiverDetails = userDetails[1];
													                		}

													                		/* To check receiver details */
													                		if(parseInt(receiverDetails.isOpenForAllCalls) === 1){

													                			/* To Create Room */
																	        	var roomName = "room-"+roomNo;
																	        	console.log('roomName',roomName);
																	        	roomNo++;

																	        	/* Manage caller data */
																	        	let userData    = new Array();
																	        	let roomData    = new Object();
																	        	let responseObj = {};
																	        	responseObj.code = 200;
																				responseObj.status = 1;
																				responseObj.message = senderUserName + " is calling you";

																				/* Insert Call History */
																   				database.pool.getConnection(function(err, connection) {

																   					/* Begin transaction */
															                        connection.beginTransaction(function(err) {
															                            if (err) {
															                                return callBack(custom.dbErrorResponse());
															                            }

															                            /* Insert Data Into Call History Table */
															                            let callHistoryObj = {};
															                            callHistoryObj.callHistoryModuleName = moduleName;
															                            callHistoryObj.callSenderUserID	     = senderUserID;
															                            callHistoryObj.callRecieverUserID    = receiverUserID;
															                            callHistoryObj.callInitiateTime      = custom.getCurrentTime();
															                            callHistoryObj.callSenderStatus      = 'CALL_INITIATED';
															                            callHistoryObj.callStatus            = 'INITIATED';
															                            let callHistoryQuery = queryBuilder.insert(constant.call_history,callHistoryObj);
															                            queryBuilder.reset_query(callHistoryQuery);
															                            connection.query(callHistoryQuery, function(err, result) {
															                                if (err) {
															                                    connection.rollback(function() {
															                                        return callBack(custom.dbErrorResponse(err.sqlMessage));
															                                    });
															                                }

															                            /* Get Call History ID */
														                            	var callHistoryID = parseInt(result.insertId);

															                            /* Insert Data Into Call History Users Table (Receiver) */
															                            let callHistoryUsersObj = {};
															                            callHistoryUsersObj.callHistoryID     = callHistoryID;
															                            callHistoryUsersObj.callUserID	      = receiverUserID;
															                            callHistoryUsersObj.callUserAddedDate = custom.getCurrentTime();
															                            callHistoryUsersObj.callUserStatus	  = 'INITIATED';
															                            let callHistoryUsersQuery = queryBuilder.insert(constant.call_history_users,callHistoryUsersObj);
															                            queryBuilder.reset_query(callHistoryUsersQuery);
															                            connection.query(callHistoryUsersQuery, function(err, result) {
															                                if (err) {
															                                    connection.rollback(function() {
															                                        return callBack(custom.dbErrorResponse(err.sqlMessage));
															                                    });
															                                }

															                            /* Insert Data Into Call History Users Table (Sender) */
															                            let callHistoryUsersObj1 = {};
															                            callHistoryUsersObj1.callHistoryID     = callHistoryID;
															                            callHistoryUsersObj1.callUserID	       = senderUserID;
															                            callHistoryUsersObj1.callUserAddedDate = custom.getCurrentTime();
															                            callHistoryUsersObj1.isCallOwner	   = 1;
															                            callHistoryUsersObj1.callUserStatus	   = 'INITIATED';
															                            let callHistoryUsersQuery1 = queryBuilder.insert(constant.call_history_users,callHistoryUsersObj1);
															                            queryBuilder.reset_query(callHistoryUsersQuery1);
															                            connection.query(callHistoryUsersQuery1, function(err, result) {
															                                if (err) {
															                                    connection.rollback(function() {
															                                        return callBack(custom.dbErrorResponse(err.sqlMessage));
															                                    });
															                                }

															                            /* Commit Queries */
															                            connection.commit(function(err) {
														                                    if (err) {
														                                        connection.rollback(function() {
														                                            return callBack(custom.dbErrorResponse());
														                                        });
														                                    }
														                                    connection.release();


														                                    /* Push user data */
														                                    let userRow = {};
														                                    userRow.userID   = senderUserID;
														                                    userRow.userName = senderUserName;
														                                    userRow.isOpenForAllCalls  = parseInt(senderDetails.isOpenForAllCalls);
														                                    userRow.isGroupChatEnable  = parseInt(senderDetails.isGroupChatEnable);
														                                    userRow.isDisconnected     = 0;
														                                    userRow.userCallHoldStatus = 0;
														                                    userRow.isCallOwner        = 1;
														                                    userRow.isUserRemoved      = 0;
														                                    userRow.disconnectedTime   = '';
														                                    userRow.addedDateTime      = custom.getCurrentTime(); // UTC Time
														                                    userRow.userOriginalImg    = (!senderDetails.userImage) ? '' : constant.base_url + senderDetails.userImage;
														                                    userRow.userThumbnailImg   = (!senderDetails.userImageThumbnail) ? '' : constant.base_url + senderDetails.userImageThumbnail;
														                                    userData.push(userRow);

														                                    console.log('userDataUserCalling',userData);
														                                    let callDateTime = custom.getCurrentTime();

														                                    /* Join Room */
														                                    roomData.roomName      = roomName;
														                                    roomData.moduleName    = moduleName;
														                                    roomData.callHistoryID = callHistoryID;
														                                    roomData.userData      = self.removeDuplicateUsers(userData);
														                                    roomData.createdDate   = callDateTime; // UTC Time
														                                    roomData.callStartedDateTime = "";
														                                    roomData.currentTime    = custom.getCurrentTime();
														                                    userRooms.set(roomName, roomData);
																							roomData.senderUserID    = senderUserID;
																							roomData.senderUserName  = senderUserName;
																							roomData.senderUserOriginalImage = (!senderDetails.userImage) ? '' : constant.base_url + senderDetails.userImage;
																							roomData.senderUserThumbnailImage = (!senderDetails.userImageThumbnail) ? '' : constant.base_url + senderDetails.userImageThumbnail;
																							responseObj.response = roomData;

																							/* Update Call history status after 35 seconds (Backgroud Process) */
																							setTimeout(function(){
																								console.log('setTimeout triggered');

																								/* Update call status limit */
																								model.updateData(function(err,updateResp){
																									if(err){
																										console.log('Update call status error call history id 1',callHistoryID);
																									}else{
																										console.log('Update call status success 1');
																									}
																								},constant.call_history,{callStatus:'MISSED_CALL'},{callStatus:'INITIATED',callHistoryID:callHistoryID})

																								/* Update call user status */
																								model.updateData(function(err,updateResp){
																									if(err){
																										console.log('Update call status error call history id 2',callHistoryID);
																									}else{
																										console.log('Update call status success 2');
																									}
																								},constant.call_history_users,{callUserStatus:'MISSED_CALL'},{callUserStatus:'INITIATED',callHistoryID:callHistoryID})
																							},callStatusUpdateLimit);

														                                    /* Send push notification to receiver  */
																				        	if (self.isUserSocketConnected(receiverUserID)) {
																			   					let receiverUserSocketID = self.getUserSocketID(receiverUserID);
																			   					socket.to(receiverUserSocketID).emit('user-calling', responseObj);

																			   					console.log('responseObj',responseObj);

																					        	/* Return response */
																					        	return callBack(responseObj);
																					        }else{
																					        	responseObj.notificationType = "USER_CALLING";

																					        	/* Send push notification when receiver user socket is not connected */
																					        	let notificationMsg = senderUserName + ' is calling you';
																					        	// notification.sendPushNotifications(notificationMsg,receiverUserID,responseObj);
																					        	self.sendCallingNotification(notificationMsg,receiverUserID,responseObj,callDateTime,callHistoryID);

																			   					console.log('responseObj',responseObj);
																					        	console.log('------ User is offline ------');
																					        	return callBack(responseObj);
																					        }

															                            });
															                            });
															                            });
															                            });
															                        });
																   				});

													                		}else{
													                			return callBack({
																		            			"code":200,
																				                "status": 0,
																				                "response": {},
																				                "message": "You can not make call with " + receiverUserName
																				            });
													                		}
													                	}else{
													                		return callBack({
																            			"code":200,
																		                "status": 0,
																		                "response": {},
																		                "message": "User details not found",
																		            });
													                	}
													                }
													            },selectQuery);
															}
														},receiverUserID);
													},senderUserID);
							                	}
							                }
							            },callQuery);
									}
								},senderUserID,receiverUserID);
	                		}else{
	                			return callBack({
				            			"code":200,
						                "status": 0,
						                "response": {},
						                "message": "User is offline",
						            });
	                		}
	                	}else{
	                		return callBack({
				            			"code":200,
						                "status": 0,
						                "response": {},
						                "message": "User details not found",
						            });
	                	}
	                }
				},constant.user_details,{userId:receiverUserID});
			}else{
	            return callBack({
	            			"code":200,
			                "status": 0,
			                "response": {},
			                "message": "Invalid parameters",
			            });
			}
		});

		/**
		 * To join user room
		 * @param {integer} userID
		 * @param {integer} callHistoryID
		 * @param {string}  userName
		 * @param {string}  roomName
		*/
		socket.on('join-room', function (userData,callBack) {
			console.log('----------- User Join Room --------------');

			if (userData.userID && userData.callHistoryID && userData.userName && userData.roomName) {
				let userID   = parseInt(userData.userID);
				let callHistoryID = parseInt(userData.callHistoryID);
				let userName = userData.userName;
				let roomName = userData.roomName;

				/* To check if room is exist */
				if(userRooms.has(roomName)){

					if(self.isUserSocketConnected(userID)){

						/* Check Call History ID */
						model.getAllWhere(function(err,callHistoryResp){
							if(err){
		                    	return callBack(custom.dbErrorResponse());
			                }else{
			                	if(callHistoryResp == ""){
			                		return callBack({
					            			"code":200,
							                "status": 0,
							                "response": {},
							                "message": "Invalid Call History ID.",
							            });
			                	}else{

			                		/* Get connected users count in room */
			                		let customCountQuery = 'SELECT COUNT(*) AS total_users FROM `call_history_users` WHERE `callHistoryID` = ' + callHistoryID + ' AND `callUserID` != ' + userID;
			                		model.customQuery(function(err,countResp){
			                			if(err){
					                    	return callBack(custom.dbErrorResponse());
						                }else{

						                	let groupCount = parseInt(countResp[0].total_users);

						                	/* To check group call users limit */
							        		if(groupCount >= constant.group_call_users_limit){
							        			console.log('------ Group call user limit exceeds ------');
									        	return callBack({
								            			"code":200,
										                "status": 0,
										                "response": {},
										                "message": "Only " + constant.group_call_users_limit + ' users can take a group call.',
										            });
							        		}else{
							        			/* Get user details */
						                		model.getAllWhere(function(err,userDetails){
						                			if(err){
								                    	return callBack(custom.dbErrorResponse());
									                }else{
									                	if(userDetails == ""){
									                		return callBack({
											            			"code":200,
													                "status": 0,
													                "response": {},
													                "message": "Invalid User ID.",
													            });
									                	}else{

									                		/* Update call status (Background Process) */
									                		if(parseInt(groupCount) === 1)
									                		{
									                			/* Update Call Status */
																model.updateData(function(err,resp){
																	console.log('Update Call Status');
																	if(err){
													                    return callBack(custom.dbErrorResponse());
													                }
													            },constant.call_history,{callStatus:"STARTED",callJoinedTime:custom.getCurrentTime()},{callHistoryID:callHistoryID});
									                		}

									                		/* To check already added user */
									                		model.getAllWhere(function(err,callHistoryResp){
									                			if(err){
												                    return callBack(custom.dbErrorResponse());
												                }else{
												                	if(callHistoryResp == ""){ // INSERT 

												                		/* Insert call history user */
												                		let callHistoryUserObj = {};
												                		callHistoryUserObj.callHistoryID  = callHistoryID;
												                		callHistoryUserObj.callUserID     = userID;
												                		callHistoryUserObj.callUserAddedDate = custom.getCurrentTime();
												                		callHistoryUserObj.callUserStatus = 'STARTED';
												                		model.insertData(function(err,insertResp){
																			if(err){
															                    return callBack(custom.dbErrorResponse());
															                }else{

															                	/* Manage caller data */
																	        	let userData    = new Array();
																	        	let roomData    = new Object();
																	        	let responseObj = {};
																	        	responseObj.code = 200;
																				responseObj.status = 1;
																				responseObj.message = userName + " has joined room";

																				/* Get Room Data */
																				let roomDataObj  = userRooms.get(roomName);
																				if(roomDataObj != "" && roomDataObj.userData != "")
																				{
																					let usersDataObj = roomDataObj.userData;
																					for (var i = 0; i < parseInt(usersDataObj.length); i++) 
																					{
																						let userRow = {};
													                                    userRow.userID   = usersDataObj[i].userID;
													                                    userRow.userName = usersDataObj[i].userName;
													                                    userRow.isOpenForAllCalls  = parseInt(usersDataObj[i].isOpenForAllCalls);
													                                    userRow.isGroupChatEnable  = parseInt(usersDataObj[i].isGroupChatEnable);
													                                    userRow.isDisconnected     = parseInt(usersDataObj[i].isDisconnected);
													                                    userRow.isCallOwner        = parseInt(usersDataObj[i].isCallOwner);
													                                    userRow.userCallHoldStatus = usersDataObj[i].userCallHoldStatus;
													                                    userRow.isUserRemoved      = usersDataObj[i].isUserRemoved;
													                                    userRow.disconnectedTime   = usersDataObj[i].disconnectedTime;
													                                    userRow.addedDateTime      = usersDataObj[i].addedDateTime;
													                                    userRow.userOriginalImg    = usersDataObj[i].userOriginalImg;
													                                    userRow.userThumbnailImg   = usersDataObj[i].userThumbnailImg;
													                                    userData.push(userRow);
																					}
																				}

																				/* Push user data */
											                                    let userRow = {};
											                                    userRow.userID   = userID;
											                                    userRow.userName = userName;
											                                    userRow.isOpenForAllCalls  = parseInt(userDetails[0].isOpenForAllCalls);
											                                    userRow.isGroupChatEnable  = parseInt(userDetails[0].isGroupChatEnable);
											                                    userRow.isDisconnected     = 0;
											                                    userRow.userCallHoldStatus = 0;
											                                    userRow.isCallOwner        = 0;
											                                    userRow.isUserRemoved      = 0;
											                                    userRow.disconnectedTime   = '';
											                                    userRow.addedDateTime      = custom.getCurrentTime(); // UTC Time
											                                    userRow.userOriginalImg    = (!userDetails[0].userImage) ? '' : constant.base_url + userDetails[0].userImage;
											                                    userRow.userThumbnailImg   = (!userDetails[0].userImageThumbnail) ? '' : constant.base_url + userDetails[0].userImageThumbnail;
											                                    userData.push(userRow);

																				roomData.roomName      = roomName;
											                                    roomData.callHistoryID = callHistoryID;
											                                    roomData.userData      = self.removeDuplicateUsers(userData);
											                                    roomData.moduleName    = roomDataObj.moduleName;
											                                    roomData.createdDate   = roomDataObj.createdDate; // UTC Time
											                                    roomData.callStartedDateTime = (roomDataObj.callStartedDateTime != "") ? roomDataObj.callStartedDateTime : custom.getCurrentTime();
											                                    roomData.currentTime    = custom.getCurrentTime();
											                                    userRooms.set(roomName, roomData);
																				responseObj.response = roomData;
																				console.log('userDataJoinRoom2',userData);

																				/* Emit response to other users */
																				let usersCount = parseInt(userData.length);
																				if(usersCount > 0)
																				{	
																					for (var j = 0; j < usersCount; j++) 
																					{
																						let receiverUserID = userData[j].userID;
																						if(receiverUserID != userID)
																						{
																							let receiverUserSocketID = self.getUserSocketID(receiverUserID);
																			   				socket.to(receiverUserSocketID).emit('join-room', responseObj);
																						}
																					}
																				}
																				console.log('responseObj',responseObj);
																				return callBack(responseObj);
															                }
															            },constant.call_history_users,callHistoryUserObj);
												                	}else{ // UPDATE

												                		/* Update call history user */
												                		let callHistoryUserObj = {};
												                		callHistoryUserObj.callUserStatus = 'STARTED';
												                		model.updateData(function(err,updateResp){
																			if(err){
															                    return callBack(custom.dbErrorResponse());
															                }else{

															                	/* Manage caller data */
																	        	let userData    = new Array();
																	        	let roomData    = new Object();
																	        	let responseObj = {};
																	        	responseObj.code = 200;
																				responseObj.status = 1;
																				responseObj.message = userName + " has joined room";

																				/* Get Room Data */
																				let roomDataObj  = userRooms.get(roomName);
																				if(roomDataObj != "" && roomDataObj.userData != "")
																				{
																					let usersDataObj = roomDataObj.userData;
																					for (var i = 0; i < parseInt(usersDataObj.length); i++) 
																					{
																						let userRow = {};
													                                    userRow.userID   = usersDataObj[i].userID;
													                                    userRow.userName = usersDataObj[i].userName;
													                                    userRow.isOpenForAllCalls  = parseInt(usersDataObj[i].isOpenForAllCalls);
													                                    userRow.isGroupChatEnable  = parseInt(usersDataObj[i].isGroupChatEnable);
													                                    userRow.isDisconnected     = parseInt(usersDataObj[i].isDisconnected);
													                                    userRow.isCallOwner        = parseInt(usersDataObj[i].isCallOwner);
													                                    userRow.disconnectedTime   = usersDataObj[i].disconnectedTime;
													                                    userRow.isUserRemoved      = usersDataObj[i].isUserRemoved;
													                                    userRow.userCallHoldStatus = usersDataObj[i].userCallHoldStatus;
													                                    userRow.addedDateTime      = usersDataObj[i].addedDateTime;
													                                    userRow.userOriginalImg    = usersDataObj[i].userOriginalImg;
													                                    userRow.userThumbnailImg   = usersDataObj[i].userThumbnailImg;
													                                    userData.push(userRow);
																					}
																				}

																				/* Push user data */
											                                    let userRow = {};
											                                    userRow.userID   = userID;
											                                    userRow.userName = userName;
											                                    userRow.isOpenForAllCalls  = parseInt(userDetails[0].isOpenForAllCalls);
											                                    userRow.isGroupChatEnable  = parseInt(userDetails[0].isGroupChatEnable);
											                                    userRow.isDisconnected     = 0;
											                                    userRow.userCallHoldStatus = 0;
											                                    userRow.isCallOwner        = 0;
											                                    userRow.isUserRemoved      = 0;
											                                    userRow.disconnectedTime   = '';
											                                    userRow.addedDateTime      = custom.getCurrentTime(); // UTC Time
											                                    userRow.userOriginalImg    = (!userDetails[0].userImage) ? '' : constant.base_url + userDetails[0].userImage;
											                                    userRow.userThumbnailImg   = (!userDetails[0].userImageThumbnail) ? '' : constant.base_url + userDetails[0].userImageThumbnail;
											                                    userData.push(userRow);

																				roomData.roomName      = roomName;
											                                    roomData.callHistoryID = callHistoryID;
											                                    roomData.userData      = self.removeDuplicateUsers(userData);
											                                    roomData.moduleName    = roomDataObj.moduleName;
											                                    roomData.createdDate   = roomDataObj.createdDate; // UTC Time
											                                    roomData.callStartedDateTime = custom.getCurrentTime();
											                                    roomData.currentTime    = custom.getCurrentTime();
											                                    userRooms.set(roomName, roomData);
																				responseObj.response = roomData;
																				console.log('userDataJoinRoom3',userData);

																				/* Emit response to other users */
																				let usersCount = parseInt(userData.length);
																				if(usersCount > 0)
																				{	
																					for (var j = 0; j < usersCount; j++) 
																					{
																						let receiverUserID = userData[j].userID;
																						if(receiverUserID != userID)
																						{
																							let receiverUserSocketID = self.getUserSocketID(receiverUserID);
																			   				socket.to(receiverUserSocketID).emit('join-room', responseObj);
																						}
																					}
																				}
																				console.log('responseObj',responseObj);
																				return callBack(responseObj);
															                }
															            },constant.call_history_users,callHistoryUserObj,{callHistoryID:callHistoryID,callUserID:userID});
												                	}

												                	/* Update call history user */
											                		let callHistoryUserObj = {};
											                		callHistoryUserObj.callUserStatus = 'STARTED';
											                		model.updateData(function(err,updateResp){
														            },constant.call_history_users,callHistoryUserObj,{callHistoryID:callHistoryID,isCallOwner:1,callUserStatus:'INITIATED'});
												                }
									                		},constant.call_history_users,{callHistoryID:callHistoryID,callUserID:userID});
									                	}
									                }
						                		},constant.user_details,{userId:userID});
							        		}
						                }
			                		},customCountQuery);
			                	}
			                }
						},constant.call_history,{callHistoryID:callHistoryID});
					}else{
						return callBack({
		            			"code":200,
				                "status": 0,
				                "response": {},
				                "message": "User is offline",
				            });
					}
				}else{
					return callBack({
		            			"code":200,
				                "status": 0,
				                "response": {},
				                "message": "Call already declined.",
				            });
				}
			}else{
	            return callBack({
	            			"code":200,
			                "status": 0,
			                "response": {},
			                "message": "Invalid parameters",
			            });
			}
		});

		/**
		 * To decline call Or reject call
		 * @param {integer} callDeclineUserID
		 * @param {integer} callOpponentUserID
		 * @param {integer} callHistoryID
		 * @param {integer} isSelfDecline (0 - No, 1 - Yes)
		 * @param {string}  callDeclineUserName
		 * @param {string}  callOpponentUserName
		 * @param {string}  roomName
		*/
		socket.on('decline-call', function (userData,callBack) {
			console.log('----------- User Decline Call --------------');
			if (userData.callDeclineUserID && userData.callOpponentUserID && userData.callHistoryID && userData.callDeclineUserName && userData.callOpponentUserName && userData.roomName) {
				let callDeclineUserID    = parseInt(userData.callDeclineUserID);
				let callOpponentUserID   = parseInt(userData.callOpponentUserID);
				let callHistoryID        = parseInt(userData.callHistoryID);
				let callDeclineUserName  = userData.callDeclineUserName;
				let callOpponentUserName = userData.callOpponentUserName;
				let roomName             = userData.roomName;
				let isSelfDecline        = (!userData.isSelfDecline) ? 0 : parseInt(userData.isSelfDecline);

				/* To check if room is exist */
				if(userRooms.has(roomName)){

					/* Get room data */
					let roomDataObj     = userRooms.get(roomName);
					let usersDataObj    = roomDataObj.userData;
		    		let noOfUsersInRoom = parseInt(usersDataObj.length);

					if(noOfUsersInRoom <= 1){

						/* Destroy Room */
						self.destroyRoom(roomName);

						/* Update Call Status */
						model.updateData(function(err,resp){
							if(err){
			                    return callBack(custom.dbErrorResponse());
			                }
			            },constant.call_history,{callStatus:"DECLINE_CALL"},{callHistoryID:callHistoryID});

					}
					let activeUsers = new Array();
					let userData    = new Array();
					let roomData    = new Object();

					for (var i = 0; i < noOfUsersInRoom; i++) 
    				{
						let isDisconnectLimitExceed = self.isDisconnectLimitExceed(usersDataObj[i].isDisconnected,usersDataObj[i].disconnectedTime);
						let userRow = {};
                        userRow.userID   = usersDataObj[i].userID;
                        userRow.userName = usersDataObj[i].userName;
                        userRow.isOpenForAllCalls = parseInt(usersDataObj[i].isOpenForAllCalls);
                        userRow.isGroupChatEnable = parseInt(usersDataObj[i].isGroupChatEnable);
                        userRow.isCallOwner       = parseInt(usersDataObj[i].isCallOwner);
                    	userRow.isDisconnected    = parseInt(usersDataObj[i].isDisconnected);
                    	userRow.disconnectedTime  = usersDataObj[i].disconnectedTime;
                        userRow.userCallHoldStatus = usersDataObj[i].userCallHoldStatus;
                        if(usersDataObj[i].userID != callDeclineUserID){
                        	activeUsers.push(usersDataObj[i].userID);
                        	userRow.isUserRemoved  = 0;
                        }else{
                        	userRow.isUserRemoved  = 1;
                        	self.updateUserCallEndTime(roomDataObj.callHistoryID,usersDataObj[i].userID);
                        }
                        userRow.addedDateTime      = usersDataObj[i].addedDateTime;
                        userRow.userOriginalImg    = usersDataObj[i].userOriginalImg;
                        userRow.userThumbnailImg   = usersDataObj[i].userThumbnailImg;
                        userData.push(userRow);
    					if(i === parseInt(noOfUsersInRoom - 1))
    					{
    						roomData.roomName      = roomDataObj.roomName;
    						roomData.moduleName    = roomDataObj.moduleName;
	                        roomData.callHistoryID = roomDataObj.callHistoryID;
	                        roomData.userData      = self.removeDuplicateUsers(userData);
	                        roomData.createdDate   = roomDataObj.createdDate; // UTC Time
	                        roomData.callStartedDateTime = roomDataObj.callStartedDateTime;
	                        roomData.currentTime    = custom.getCurrentTime();
	                        userRooms.set(roomName, roomData);

	                        /* To check active users */
	                        if(parseInt(activeUsers.length) <= 1)
	                        {
	                        	/* Destroy Room */
								self.destroyRoom(roomName);
	                        }

	                        /* Manage caller data */
				        	let responseObj = {};
				        	responseObj.code = 200;
							responseObj.status = 1;
							responseObj.response = roomData;
							responseObj.message = "Call declined successfully";

							responseObj.notificationType = "DECLINE_CALL";
							if(isSelfDecline === 1){ // Sender declined call
					        	var notificationMsg = 'Missed video call from ' + callDeclineUserName;
					        	
					        	/* Send push notification */
					        	notification.sendPushNotifications(notificationMsg,callOpponentUserID,responseObj);
							}else{
					        	var notificationMsg = callDeclineUserName + ' is busy right now';
					        	
					        	/* Send push notification */
					        	notification.sendPushNotifications(notificationMsg,callOpponentUserID,responseObj);
							}

							/* Emit to sender */
							let senderUserSocketID = self.getUserSocketID(callOpponentUserID);
							socket.to(senderUserSocketID).emit('decline-call', responseObj);

							/* Update user call status */
							model.updateData(function(err,updateResp){
							},constant.call_history_users,{callUserStatus:'DECLINE_CALL'},{callUserStatus:'INITIATED',callHistoryID:callHistoryID,callUserID:callDeclineUserID});

							/* Update user call (owner) status */
							model.updateData(function(err,updateResp){
							},constant.call_history_users,{callUserStatus:'DECLINE_CALL'},{callUserStatus:'INITIATED',callHistoryID:callHistoryID,isCallOwner:1});

							/* Return response */
							return callBack(responseObj);
    					}
    				}
				}else{
					return callBack({
		            			"code":200,
				                "status": 0,
				                "response": {},
				                "message": "Call already declined.",
				            });
				}
			}else{
	            return callBack({
	            			"code":200,
			                "status": 0,
			                "response": {},
			                "message": "Invalid parameters",
			            });
			}
		});

		/**
		 * To leave user room
		 * @param {integer} userID
		 * @param {integer} callHistoryID
		 * @param {integer} callDuration
		 * @param {string}  userName
		 * @param {string}  roomName
		*/
		socket.on('leave-room', function (userData,callBack) {
			console.log('----------- User Leave Room --------------');
			if (userData.userID && userData.callHistoryID && userData.callDuration && userData.userName && userData.roomName) {
				let userID        = parseInt(userData.userID);
				let callHistoryID = parseInt(userData.callHistoryID);
				let callDuration  = parseInt(userData.callDuration);
				let userName = userData.userName;
				let roomName = userData.roomName;

				/* To check if room is exist */
				if(userRooms.has(roomName)){

					/* Get room data */
					let roomDataObj = userRooms.get(roomName);

					/* Get no of users in room with custom array */
					let noOfUsersInRoom = self.getNoOfUsersInRoom(roomName);

					if(noOfUsersInRoom <= 2){

						/* Update call status */
						model.updateData(function(err,updateResp){
							if(err){
								return callBack(custom.dbErrorResponse());
							}else{
								console.log('success');							
							}
						},constant.call_history,{callStatus:"FINISHED",callCompletedTime:custom.getCurrentTime()},{callHistoryID:callHistoryID});
					}

					/* Update call user status */
					model.updateData(function(err,updateResp1){
						if(err){
							console.log('err',err);
						}

						let userData    = new Array();
			        	let roomData    = new Object();
			        	let responseObj = {};
			        	responseObj.code = 200;
						responseObj.status = 1;
						responseObj.message = userName + " has left from room";

						if(roomDataObj != "" && roomDataObj.userData != ""){
							var usersDataObj = roomDataObj.userData;
							for (var i = 0; i < parseInt(usersDataObj.length); i++) 
							{
								let userRow = {};
			                    userRow.userID   = usersDataObj[i].userID;
			                    userRow.userName = usersDataObj[i].userName;
			                    userRow.isOpenForAllCalls  = parseInt(usersDataObj[i].isOpenForAllCalls);
			                    userRow.isGroupChatEnable  = parseInt(usersDataObj[i].isGroupChatEnable);
			                    userRow.isDisconnected     = parseInt(usersDataObj[i].isDisconnected);
			                    userRow.isCallOwner        = parseInt(usersDataObj[i].isCallOwner);
			                    userRow.disconnectedTime   = usersDataObj[i].disconnectedTime;
			                    userRow.userCallHoldStatus = usersDataObj[i].userCallHoldStatus;
			                    if(usersDataObj[i].userID != userID){
			                    	userRow.isUserRemoved = usersDataObj[i].isUserRemoved;
			                    }else{
			                    	userRow.isUserRemoved = 1;
			                    	self.updateUserCallEndTime(roomDataObj.callHistoryID,usersDataObj[i].userID);
			                    }
			                    userRow.addedDateTime      = usersDataObj[i].addedDateTime;
			                    userRow.userOriginalImg    = usersDataObj[i].userOriginalImg;
			                    userRow.userThumbnailImg   = usersDataObj[i].userThumbnailImg;
			                    userData.push(userRow);
								if(i === (parseInt(usersDataObj.length) - 1))
								{
									roomData.roomName      = roomName;
				                    roomData.callHistoryID = callHistoryID;
				                    roomData.userData      = self.removeDuplicateUsers(userData);
				                    roomData.moduleName    = roomDataObj.moduleName;
				                    roomData.createdDate   = roomDataObj.createdDate; // UTC Time
				                    roomData.callStartedDateTime = roomDataObj.callStartedDateTime;
				                    roomData.currentTime    = custom.getCurrentTime();
				                    userRooms.set(roomName, roomData);
									responseObj.response = roomData;

									/* Emit to other users */
									var usersDataObj = roomDataObj.userData;
									if(usersDataObj != "")
									{
										for (var i = 0; i < parseInt(usersDataObj.length); i++) 
										{
											let receiverUserID = usersDataObj[i].userID;
											if(receiverUserID != userID && parseInt(usersDataObj[i].isUserRemoved) === 0)
											{
												let receiverUserSocketID = self.getUserSocketID(receiverUserID);
								   				socket.to(receiverUserSocketID).emit('leave-room', responseObj);
											}
										}
									}
									
									/* Destroy room */
									self.destroyRoom(roomName);

									console.log('responseObj',responseObj);
									return callBack(responseObj);
								}
							}
						}else{
							roomData.roomName      = roomName;
		                    roomData.callHistoryID = callHistoryID;
		                    roomData.userData      = self.removeDuplicateUsers(userData);
		                    roomData.moduleName    = roomDataObj.moduleName;
		                    roomData.createdDate   = roomDataObj.createdDate; // UTC Time
		                    roomData.callStartedDateTime = roomDataObj.callStartedDateTime;
		                    roomData.currentTime    = custom.getCurrentTime();
		                    userRooms.set(roomName, roomData);
							responseObj.response = roomData;

							/* Emit to other users */
							var usersDataObj = roomDataObj.userData;
							if(usersDataObj != "")
							{
								for (var i = 0; i < parseInt(usersDataObj.length); i++) 
								{
									let receiverUserID = usersDataObj[i].userID;
									if(receiverUserID != userID)
									{
										let receiverUserSocketID = self.getUserSocketID(receiverUserID);
						   				socket.to(receiverUserSocketID).emit('leave-room', responseObj);
									}
								}
							}

							/* Destroy room */
							self.destroyRoom(roomName);

							console.log('responseObj',responseObj);
							return callBack(responseObj);
						}
					},constant.call_history_users,{callUserStatus:"FINISHED",callUserTotalDuration:callDuration,callUserTerminatedDate:custom.getCurrentTime()},{callHistoryID:callHistoryID,callUserID:userID});
				}else{
					return callBack({
		            			"code":200,
				                "status": 0,
				                "response": {},
				                "message": "Call already declined.",
				            });
				}
			}else{
	            return callBack({
	            			"code":200,
			                "status": 0,
			                "response": {},
			                "message": "Invalid parameters",
			            });
			}
		});

		/**
		 * To remove user from room
		 * @param {integer} ownerID
		 * @param {integer} userID
		 * @param {integer} callHistoryID
		 * @param {integer} callDuration
		 * @param {string}  userName
		 * @param {string}  roomName
		*/
		socket.on('remove-user-from-room', function (userData,callBack) {
			console.log('----------- Remove User From Room --------------');
			if (userData.ownerID && userData.userID && userData.callHistoryID && userData.callDuration && userData.userName && userData.roomName) {
				let ownerID       = parseInt(userData.ownerID);
				let userID        = parseInt(userData.userID);
				let callHistoryID = parseInt(userData.callHistoryID);
				let callDuration  = parseInt(userData.callDuration);
				let userName = userData.userName;
				let roomName = userData.roomName;

				/* To check if room is exist */
				if(userRooms.has(roomName)){

					/* Get room data */
					let roomDataObj = userRooms.get(roomName);

					/* Get no of users in room with custom array */
					let noOfUsersInRoom = self.getNoOfUsersInRoom(roomName);

					if(noOfUsersInRoom <= 2){

						/* Update call status */
						model.updateData(function(err,updateResp){
							if(err){
								return callBack(custom.dbErrorResponse());
							}else{
								console.log('success');								
							}
						},constant.call_history,{callStatus:"FINISHED",callCompletedTime:custom.getCurrentTime()},{callHistoryID:callHistoryID});
					}

					/* Update call user status */
					model.updateData(function(err,updateResp1){
						if(err){
							return callBack(custom.dbErrorResponse());
						}

						let userData    = new Array();
			        	let roomData    = new Object();
			        	let responseObj = {};
			        	responseObj.code = 200;
						responseObj.status = 1;
						responseObj.message = userName + " has removed from room";

						if(roomDataObj != "" && roomDataObj.userData != ""){
							var usersDataObj = roomDataObj.userData;
							for (var i = 0; i < parseInt(usersDataObj.length); i++) 
							{
								let userRow = {};
			                    userRow.userID   = usersDataObj[i].userID;
			                    userRow.userName = usersDataObj[i].userName;
			                    userRow.isOpenForAllCalls  = parseInt(usersDataObj[i].isOpenForAllCalls);
			                    userRow.isGroupChatEnable  = parseInt(usersDataObj[i].isGroupChatEnable);
			                    userRow.isDisconnected     = parseInt(usersDataObj[i].isDisconnected);
			                    userRow.isCallOwner        = parseInt(usersDataObj[i].isCallOwner);
			                    userRow.disconnectedTime   = usersDataObj[i].disconnectedTime;
			                    if(usersDataObj[i].userID != userID){
			                    	userRow.isUserRemoved   = 0;
			                    }else{
			                    	userRow.isUserRemoved   = 1;
			                    	self.updateUserCallEndTime(roomDataObj.callHistoryID,usersDataObj[i].userID);
			                    }
			                    userRow.userCallHoldStatus = usersDataObj[i].userCallHoldStatus;
			                    userRow.addedDateTime      = usersDataObj[i].addedDateTime;
			                    userRow.userOriginalImg    = usersDataObj[i].userOriginalImg;
			                    userRow.userThumbnailImg   = usersDataObj[i].userThumbnailImg;
			                    userData.push(userRow);
								if(i === (parseInt(usersDataObj.length) - 1))
								{
									roomData.roomName      = roomName;
				                    roomData.callHistoryID = callHistoryID;
				                    roomData.userData      = self.removeDuplicateUsers(userData);
				                    roomData.moduleName    = roomDataObj.moduleName;
				                    roomData.createdDate   = roomDataObj.createdDate; // UTC Time
				                    roomData.callStartedDateTime = roomDataObj.callStartedDateTime;
				                    roomData.currentTime    = custom.getCurrentTime();
				                    userRooms.set(roomName, roomData);
									responseObj.response = roomData;
									console.log('userDataRemoveFromUser',userData);

									/* Emit to other users */
									var usersDataObj = roomDataObj.userData;
									if(usersDataObj != "")
									{
										for (var i = 0; i < parseInt(usersDataObj.length); i++) 
										{
											let receiverUserID = usersDataObj[i].userID;
											if(receiverUserID != userID)
											{
												let receiverUserSocketID = self.getUserSocketID(receiverUserID);
								   				socket.to(receiverUserSocketID).emit('leave-room', responseObj);
											}
										}
									}
									
									/* Destroy room */
									self.destroyRoom(roomName);

									console.log('responseObj',responseObj);
									return callBack(responseObj);
								}
							}
						}else{
							roomData.roomName      = roomName;
		                    roomData.callHistoryID = callHistoryID;
		                    roomData.userData      = self.removeDuplicateUsers(userData);
		                    roomData.moduleName    = roomDataObj.moduleName;
		                    roomData.createdDate   = roomDataObj.createdDate; // UTC Time
		                    roomData.callStartedDateTime = roomDataObj.callStartedDateTime;
		                    roomData.currentTime    = custom.getCurrentTime();
		                    userRooms.set(roomName, roomData);
							responseObj.response = roomData;
							console.log('userDataRemoveFromUser2',userData);

							/* Emit to other users */
							var usersDataObj = roomDataObj.userData;
							if(usersDataObj != "")
							{
								for (var i = 0; i < parseInt(usersDataObj.length); i++) 
								{
									let receiverUserID = usersDataObj[i].userID;
									if(receiverUserID != userID && receiverUserID != ownerID)
									{
										let receiverUserSocketID = self.getUserSocketID(receiverUserID);
						   				socket.to(receiverUserSocketID).emit('leave-room', responseObj);
									}
								}
							}

							/* Destroy room */
							self.destroyRoom(roomName);

							console.log('responseObj',responseObj);
							return callBack(responseObj);
						}
					},constant.call_history_users,{callUserStatus:"FINISHED",callUserTotalDuration:callDuration,callUserTerminatedDate:custom.getCurrentTime()},{callHistoryID:callHistoryID,callUserID:userID});
				}else{
					return callBack({
		            			"code":200,
				                "status": 0,
				                "response": {},
				                "message": "Call already declined.",
				            });
				}
			}else{
	            return callBack({
	            			"code":200,
			                "status": 0,
			                "response": {},
			                "message": "Invalid parameters",
			            });
			}
		});

		/**
		 * To Call On Hold
		 * @param {integer} userID
		 * @param {string}  userName
		 * @param {string}  roomName
		 * @param {integer} callHoldStatus [0,1]
		*/
		socket.on('call-on-hold', function (userData,callBack) {
			console.log('----------- User Call On Hold --------------');

			if (userData.userID && userData.userName && userData.roomName) {
				let userID   = parseInt(userData.userID);
				let userName = userData.userName;
				let roomName = userData.roomName;
				let callHoldStatus = (!userData.callHoldStatus) ? 0 : userData.callHoldStatus;

				/* To check if room is exist */
				if(userRooms.has(roomName)){

					/* Get Room Data */
					let roomDataObj   = userRooms.get(roomName);
					let usersDataObj  = roomDataObj.userData;

					let userData    = new Array();
		        	let roomData    = new Object();
		        	let responseObj = {};
		        	responseObj.code = 200;
					responseObj.status = 1;
					if(parseInt(callHoldStatus) === 1){
						responseObj.message = userName + " call on hold";
					}else{
						responseObj.message = userName + " call on unhold";
					}

					if(roomDataObj != "" && usersDataObj != "")
					{
						for (var i = 0; i < parseInt(usersDataObj.length); i++) 
						{
							let userRow = {};
		                    userRow.userID   = usersDataObj[i].userID;
		                    userRow.userName = usersDataObj[i].userName;
		                    userRow.isOpenForAllCalls  = parseInt(usersDataObj[i].isOpenForAllCalls);
		                    userRow.isGroupChatEnable  = parseInt(usersDataObj[i].isGroupChatEnable);
		                    userRow.isDisconnected     = parseInt(usersDataObj[i].isDisconnected);
		                    userRow.isCallOwner        = parseInt(usersDataObj[i].isCallOwner);
		                    userRow.disconnectedTime   = usersDataObj[i].disconnectedTime;
		                    userRow.isUserRemoved      = usersDataObj[i].isUserRemoved;
		                    userRow.userCallHoldStatus = usersDataObj[i].userCallHoldStatus;
		                    userRow.addedDateTime      = usersDataObj[i].addedDateTime;
		                    userRow.userOriginalImg    = usersDataObj[i].userOriginalImg;
		                    userRow.userThumbnailImg   = usersDataObj[i].userThumbnailImg;
		                    userData.push(userRow);
						}
					}

					roomData.roomName      = roomName;
                    roomData.callHistoryID = roomDataObj.callHistoryID;
                    roomData.userData      = self.removeDuplicateUsers(userData);
                    roomData.moduleName    = roomDataObj.moduleName;
                    roomData.createdDate   = roomDataObj.createdDate; // UTC Time
                    roomData.callStartedDateTime = roomDataObj.callStartedDateTime;
                    roomData.currentTime    = custom.getCurrentTime();
                    userRooms.set(roomName, roomData);
					responseObj.response   = roomData;
					responseObj.holdUserId = userID;
					responseObj.callHoldStatus = callHoldStatus;

					/* Emit response to other users */
					if(roomDataObj != "" && usersDataObj != "")
					{	
						for (var j = 0; j < parseInt(usersDataObj.length); j++) 
						{
							let receiverUserID = usersDataObj[j].userID;
							if(receiverUserID != userID)
							{
								let receiverUserSocketID = self.getUserSocketID(receiverUserID);
				   				socket.to(receiverUserSocketID).emit('call-on-hold', responseObj);
							}
						}
					}
					return callBack(responseObj);
				}else{
					return callBack({
		            			"code":200,
				                "status": 0,
				                "response": {},
				                "message": "Call already declined.",
				            });
				}
			}else{
	            return callBack({
	            			"code":200,
			                "status": 0,
			                "response": {},
			                "message": "Invalid parameters",
			            });
			}
		});

		/**
		 * To add people into group
		 * @param {integer} senderUserID
		 * @param {integer} recieverUserID
		 * @param {string}  senderUserName
		 * @param {string}  recieverUserName
		 * @param {integer} callHistoryID
		 * @param {string}  roomName
		 * @param {string}  moduleName
		*/
		socket.on('add-people-into-group', function (userData,callBack) {
			console.log('----------- Add People Into Group --------------');
			console.log('userData',userData);
			if (userData.senderUserID && userData.recieverUserID && userData.callHistoryID && userData.senderUserName && userData.recieverUserName && userData.roomName && userData.moduleName) {
				let senderUserID     = parseInt(userData.senderUserID);
				let receiverUserID   = parseInt(userData.recieverUserID);
				let callHistoryID    = parseInt(userData.callHistoryID);
				let senderUserName   = userData.senderUserName;
				let receiverUserName = userData.recieverUserName;
				let roomName         = userData.roomName;
				let moduleName       = userData.moduleName;

				/* To check if room is exist */
				console.log('userRooms',userRooms)
				if(userRooms.has(roomName)){

					/* To check if user is logged-out */
					model.getAllWhere(function(err,userResp){
						if(err){
		                	return callBack(custom.dbErrorResponse());
		                }else{
		                	if(userResp != ""){
		                		if(parseInt(userResp[0].isUserLoggedOut) === 0){

		                			/* To check if user is blocked */
									custom.isUserBlocked(function(respType,blockResp){
										if(respType === 1){
											return callBack({
								            			"code":200,
										                "status": 0,
										                "response": {},
										                "message": receiverUserName + " has blocked you",
										            });
										}else{

											/* To check call already taken for same day */
											let callQuery = 'SELECT * FROM ' + constant.call_history + ' AS `CH` INNER JOIN ' + constant.call_history_users + ' AS `CHU` ON `CH`.`callHistoryID` = `CHU`.`callHistoryID` WHERE `CH`.`callSenderUserID` = ' + senderUserID + ' AND `CH`.`callHistoryModuleName` = "' + moduleName + '" AND `CHU`.`callUserID` = ' + receiverUserID + ' AND `CH`.`callStatus` = "FINISHED" AND DATE_FORMAT(`CH`.`callInitiateTime`, "%Y-%m-%d") = "' + custom.changeDateFormat(custom.getCurrentTime(),'yyyy-mm-dd') + '"';
											model.customQuery(function(err,callResp){
												if(err){
								                    return callBack(custom.dbErrorResponse());
								                }else{
								                	var totalCalls = 0;
								                	if(callResp != ""){
								                		totalCalls = parseInt(callResp.length);
								                	}

								                	/* Check Daily Limit */
								                	if(totalCalls >= callLimit){
								                		console.log('------ User Call Daily Limit Exceeds ------');
											        	return callBack({
										            			"code":200,
												                "status": 0,
												                "response": {totalCalls:totalCalls},
												                "message": "Sorry !! you can take maximum " + callLimit + " calls in a day with same user.",
												            });
								                	}else{

								                		/* To check if receiver is already on another call Or manage auto remove */
														self.autoRemoveUserFromRoom(function(respType,userStatus){
															if(parseInt(respType) === 0 && userStatus === 'ALIVE'){
																return callBack({
													            			"code":200,
															                "status": 0,
															                "response": {isUserBusy:1},
															                "message": receiverUserName + " busy on another call",
															            });
															}else{

																/* Get connected users count in room */
																let customCountQuery = 'SELECT COUNT(*) AS total_users FROM `call_history_users` WHERE `callHistoryID` = ' + callHistoryID + ' AND `callUserID` != ' + receiverUserID;
										                		model.customQuery(function(err,countResp){
										                			if(err){
												                    	return callBack(custom.dbErrorResponse());
													                }else{

													                	let groupCount = parseInt(countResp[0].total_users);

													                	/* To check group call users limit */
														        		if(groupCount >= constant.group_call_users_limit){
														        			console.log('------ Group call user limit exceeds ------');
																        	return callBack({
															            			"code":200,
																	                "status": 0,
																	                "response": {},
																	                "message": "Only " + constant.group_call_users_limit + ' users can take a group call.',
																	            });
														        		}else{

														        			/* Check allowed calls status */
														        			model.getAllWhere(function(err,receiverDetailsObj){
														        				if(err){
															                    	return callBack(custom.dbErrorResponse());
																                }else{
																                	if(receiverDetailsObj != ""){

																                		let receiverDetails = receiverDetailsObj[0];
																                		
																                		/* To check receiver details */
													                					if(parseInt(receiverDetails.isOpenForAllCalls) === 1 && parseInt(receiverDetails.isGroupChatEnable) === 1){

													                						/* Manage caller data */
																				        	let userData    = new Array();
																				        	let roomData    = new Object();
																				        	let responseObj = {};
																				        	responseObj.code = 200;
																							responseObj.status = 1;
																							responseObj.message = senderUserName + " is calling you";

																							/* Get Room Data */
																							let roomDataObj  = userRooms.get(roomName);
																							roomDataObj.senderUserID    = senderUserID;
																							roomDataObj.senderUserName  = senderUserName;
																							roomDataObj.senderUserOriginalImage = (!userData.userImage) ? '' : constant.base_url + userData.userImage;
																							roomDataObj.senderUserThumbnailImage = (!userData.userImageThumbnail) ? '' : constant.base_url + userData.userImageThumbnail;
																							responseObj.response = roomDataObj;

																							/* Send push notification to receiver  */
																							console.log('receiverUserID',receiverUserID);
																				        	if (self.isUserSocketConnected(receiverUserID)) {
																			   					let receiverUserSocketID = self.getUserSocketID(receiverUserID);
																			   					socket.to(receiverUserSocketID).emit('user-calling', responseObj);
																			   					console.log('responseObj',responseObj);

																					        	/* Return response */
																					        	return callBack(responseObj);
																					        }else{
																					        	responseObj.notificationType = "USER_CALLING";

																					        	/* Send push notification when receiver user socket is not connected */
																					        	let notificationMsg = senderUserName + ' is calling you';
																					        	// notification.sendPushNotifications(notificationMsg,receiverUserID,responseObj);

																					        	self.sendCallingNotification(notificationMsg,receiverUserID,responseObj,custom.getCurrentTime(),callHistoryID);
																			   					console.log('responseObj',responseObj);
																					        	return callBack(responseObj);
																					        }

													                					}else{
													                						return callBack({
																				            			"code":200,
																						                "status": 0,
																						                "response": {},
																						                "message": "You can not make call with " + receiverUserName
																						            });
													                					}
																                	}else{
																                		return callBack({
																			            			"code":200,
																					                "status": 0,
																					                "response": {},
																					                "message": "User details not found",
																					            });
																                	}
																                }
														        			},constant.user_details,{userId:receiverUserID});
														        		}
													                }
													            },customCountQuery);
															}
														},receiverUserID);
								                	}
								                }
							            	},callQuery);
										}
									},senderUserID,receiverUserID);
		                		}else{
		                			return callBack({
						            			"code":200,
								                "status": 0,
								                "response": {},
								                "message": "User is offline",
								            });
		                		}
		                	}else{
		                		return callBack({
						            			"code":200,
								                "status": 0,
								                "response": {},
								                "message": "User details not found",
								            });
		                	}
		                }
		            },constant.user_details,{userId:receiverUserID});

					
				}else{
					return callBack({
		            			"code":200,
				                "status": 0,
				                "response": {},
				                "message": "Call already declined.",
				            });
				}
			}else{
	            return callBack({
	            			"code":200,
			                "status": 0,
			                "response": {},
			                "message": "Invalid parameters",
			            });
			}
		});

		/**
		 * To Re Join User
		 * @param {string}  roomName
		*/
		socket.on('rejoin-room', function (userData,callBack) {
			console.log('----------- User Re Join Room --------------');

			if (userData.roomName) {
				let roomName = userData.roomName;

				/* To check if room is exist */
				if(userRooms.has(roomName)){

					let responseObj = {};
		        	responseObj.code = 200;
					responseObj.status = 1;
					responseObj.message = "User re-joined successfully";
					let roomDataObj  = userRooms.get(roomName);
	    			let usersDataObj = roomDataObj.userData;
	    			let totalUsersCount = parseInt(usersDataObj.length);
	    			let userData    = new Array();
					let roomData    = new Object();
	    			if(totalUsersCount > 0){
	    				for (var i = 0; i < totalUsersCount; i++) 
	    				{
	    					let isDisconnectLimitExceed = self.isDisconnectLimitExceed(usersDataObj[i].isDisconnected,usersDataObj[i].disconnectedTime);
    						let userRow = {};
                            userRow.userID   = usersDataObj[i].userID;
                            userRow.userName = usersDataObj[i].userName;
                            userRow.isOpenForAllCalls  = parseInt(usersDataObj[i].isOpenForAllCalls);
                            userRow.isGroupChatEnable  = parseInt(usersDataObj[i].isGroupChatEnable);
                            userRow.isCallOwner        = parseInt(usersDataObj[i].isCallOwner);
                        	userRow.isDisconnected     = parseInt(usersDataObj[i].isDisconnected);
                        	userRow.disconnectedTime   = usersDataObj[i].disconnectedTime;
                        	if(!isDisconnectLimitExceed){
                        		userRow.isUserRemoved   = 0;
                        	}else{
                        		userRow.isUserRemoved   = 1;
                        		self.updateUserCallEndTime(roomDataObj.callHistoryID,usersDataObj[i].userID);
                        	}
                        	userRow.userCallHoldStatus = usersDataObj[i].userCallHoldStatus;
                            userRow.addedDateTime      = usersDataObj[i].addedDateTime;
                            userRow.userOriginalImg    = usersDataObj[i].userOriginalImg;
                            userRow.userThumbnailImg   = usersDataObj[i].userThumbnailImg;
                            userData.push(userRow);
	    					if(i === parseInt(totalUsersCount - 1))
	    					{
	    						roomData.roomName      = roomDataObj.roomName;
	    						roomData.moduleName    = roomDataObj.moduleName;
		                        roomData.callHistoryID = roomDataObj.callHistoryID;
		                        roomData.userData      = self.removeDuplicateUsers(userData);
		                        roomData.createdDate   = roomDataObj.createdDate; // UTC Time
		                        roomData.callStartedDateTime = roomDataObj.callStartedDateTime;
		                        roomData.currentTime    = custom.getCurrentTime();
		                        userRooms.set(roomName, roomData);
		                        responseObj.response = roomData;
		                        return callBack(responseObj);
	    					}
	    				}
	    			}else{
	    				roomData.roomName      = roomDataObj.roomName;
	    				roomData.moduleName    = roomDataObj.moduleName;
                        roomData.callHistoryID = roomDataObj.callHistoryID;
                        roomData.userData      = self.removeDuplicateUsers(userData);
                        roomData.createdDate   = roomDataObj.createdDate; // UTC Time
                        roomData.callStartedDateTime = roomDataObj.callStartedDateTime;
                        roomData.currentTime    = custom.getCurrentTime();
                        userRooms.set(roomName, roomData);
                        responseObj.response = roomData;
                        return callBack(responseObj);
	    			}
				}else{
					return callBack({
		            			"code":200,
				                "status": 0,
				                "response": {},
				                "message": "Call already declined.",
				            });
				}
			}else{
	            return callBack({
	            			"code":200,
			                "status": 0,
			                "response": {},
			                "message": "Invalid parameters",
			            });
			}
		});
		
		/**
		 * To User Busy Event
		 * @param {integer}  callOwnerUserId
		 * @param {string}   busyUserName
		 * @param {string}   senderUserName
		 * @param {integer}  receiverUserID
		 * @param {string}   callDateTime
		 * @param {integer}  callHistoryID
		*/
		socket.on('user-busy', function (userData,callBack) {
	     	
			if (userData.callOwnerUserId && userData.busyUserName) {
				let callOwnerUserId = parseInt(userData.callOwnerUserId);
				let busyUserName    = userData.busyUserName;
				let senderUserName  = userData.senderUserName;
				let receiverUserID = parseInt(userData.receiverUserID);
				let callDateTime  = userData.callDateTime;
				let callHistoryID = parseInt(userData.callHistoryID);

				/* Emit to user */
				let emitMsg = busyUserName + " is busy on another call";
		     	let userSocketID = self.getUserSocketID(callOwnerUserId);
				socket.to(userSocketID).emit('user-busy', {isUserBusy:1,message:emitMsg});


		    	/* Send push notification when receiver user socket is not connected */
		    	// let notificationMsg = senderUserName + ' is calling you';
		    	// self.sendCallingNotification(notificationMsg,receiverUserID,{isUserBusy:1},callDateTime,callHistoryID);

		     	return callBack({
	    			"code":200,
	                "status": 0,
	                "response": {isUserBusy:1},
	                "message": emitMsg
	            });

	     	}else{
	            return callBack({
	            			"code":200,
			                "status": 0,
			                "response": {},
			                "message": "Invalid parameters",
			            });
			}
	    });	
    }

	/**
	 * To remove duplicate users from room
	 * @param {object} usersData
	*/
    removeDuplicateUsers(usersData) 
    {
    	if(usersData != ""){
    		let userIds      = new Array();
    		let usersDataNew = new Array();

    		/* Get users length */
    		let usersLength = parseInt(usersData.length);
    		for (var i = 0; i < usersLength; i++) 
    		{
    			let userID = usersData[i].userID;
    			if (userIds.indexOf(userID) <= -1) 
    			{
    				usersDataNew.push(usersData[i]);
    				userIds.push(userID);
    			}
    			if(i === parseInt(usersLength - 1))
    			{
    				return usersDataNew;
    			}
    		}
    	}else{
    		return new Array();
    	}
	}

    /**
	 * To Check if user exist in particular room
	 * @param {string} roomName
	 * @param {integer} userID
	*/
    isUserExistInRoom(roomName,userID) 
    {
    	if(userRooms.has(roomName)){
    		/* Get room users data */
    		let roomUsersData = userRooms.get(roomName).userData;
    		console.log('userRooms',userRooms);
    		console.log('roomUsersData',roomUsersData);
    		let totalUsers    = parseInt(roomUsersData.length);
    		if(totalUsers > 0){
    			let index = 0;
    			for(var key in roomUsersData) 
	    		{
    				if(parseInt(key) === parseInt(userID))
    				{
    					return true;
    				}
    				index = index + 1;
    				if(parseInt(index) === totalUsers)
    				{
    					return false;
    				}
    			}
    		}else{
    			return false;
    		}
    	}else{
    		return false;
    	}
    }

    /**
	 * To remove User from room
	 * @param {string}  roomName
	 * @param {integer} userID
	*/
    removeUserFromRoom(roomName,userID) 
    {
    	var userID = parseInt(userID);
    	var self   = this;
    	if(userRooms.has(roomName)){
    		
    		/* Get room users data */
    		let roomDataObj  = userRooms.get(roomName);
    		let usersDataObj = roomDataObj.userData;
    		console.log('usersDataObjRemoveUserFromRoom',usersDataObj);
    		let totalUsers    = parseInt(usersDataObj.length);
    		let userData      = new Array();
			let roomData      = new Object();
    		if(totalUsers > 0){

    			for (var i = 0; i < totalUsers; i++) 
			   	{
					let userRow = {};
                    userRow.userID   = usersDataObj[i].userID;
                    userRow.userName = usersDataObj[i].userName;
                    userRow.isOpenForAllCalls  = parseInt(usersDataObj[i].isOpenForAllCalls);
                    userRow.isGroupChatEnable  = parseInt(usersDataObj[i].isGroupChatEnable);
                    userRow.isCallOwner        = parseInt(usersDataObj[i].isCallOwner);
                	userRow.isDisconnected     = parseInt(usersDataObj[i].isDisconnected);
                	userRow.disconnectedTime   = usersDataObj[i].disconnectedTime;
                	if(usersDataObj[i].userID != userID){
                		userRow.isUserRemoved   = usersDataObj[i].isUserRemoved;
                	}else{
                		userRow.isUserRemoved   = 1;
                		self.updateUserCallEndTime(roomDataObj.callHistoryID,usersDataObj[i].userID);
                	}
                	userRow.userCallHoldStatus = usersDataObj[i].userCallHoldStatus;
                    userRow.addedDateTime      = usersDataObj[i].addedDateTime;
                    userRow.userOriginalImg    = usersDataObj[i].userOriginalImg;
                    userRow.userThumbnailImg   = usersDataObj[i].userThumbnailImg;
                    userData.push(userRow);
    				if(i === parseInt(totalUsers - 1))
    				{
    					roomData.roomName      = roomDataObj.roomName;
    					roomData.moduleName    = roomDataObj.moduleName;
                        roomData.callHistoryID = roomDataObj.callHistoryID;
                        roomData.userData      = self.removeDuplicateUsers(userData);
                        roomData.createdDate   = roomDataObj.createdDate; // UTC Time
                        roomData.callStartedDateTime = roomDataObj.callStartedDateTime;
                        roomData.currentTime    = custom.getCurrentTime();
                        userRooms.set(roomName, roomData);

                        let roomDataObj1  = userRooms.get(roomName);
                        console.log('roomDataObj1',roomDataObj1);
    					let usersDataObj1 = roomDataObj.userData;
                        console.log('usersDataObj1',usersDataObj1);
        				return true;
    				}
			   	}
    		}else{
    			roomData.roomName      = roomDataObj.roomName;
    			roomData.moduleName    = roomDataObj.moduleName;
                roomData.callHistoryID = roomDataObj.callHistoryID;
                roomData.userData      = userData;
                roomData.createdDate   = roomDataObj.createdDate; // UTC Time
                roomData.callStartedDateTime = roomDataObj.callStartedDateTime;
                roomData.currentTime    = custom.getCurrentTime();
                userRooms.set(roomName, roomData);
    			return false;
    		}
    	}else{
    		return false;
    	}
    }

    /**
	 * To destroy user from room
	 * @param {string}  roomName
	 * @param {integer} userID
	*/
    destroyUserFromRoom(roomName,userID) 
    {
    	var userID = parseInt(userID);
    	var self   = this;
    	if(userRooms.has(roomName)){
    		
    		/* Get room users data */
    		let roomDataObj  = userRooms.get(roomName);
    		let usersDataObj = roomDataObj.userData;
    		let totalUsers    = parseInt(usersDataObj.length);
    		let userData      = new Array();
			let roomData      = new Object();
    		if(totalUsers > 0){

    			for (var i = 0; i < totalUsers; i++) 
			   	{
			   		if(usersDataObj[i].userID != userID)
			   		{
						let userRow = {};
	                    userRow.userID   = usersDataObj[i].userID;
	                    userRow.userName = usersDataObj[i].userName;
	                    userRow.isOpenForAllCalls  = parseInt(usersDataObj[i].isOpenForAllCalls);
	                    userRow.isGroupChatEnable  = parseInt(usersDataObj[i].isGroupChatEnable);
	                    userRow.isCallOwner        = parseInt(usersDataObj[i].isCallOwner);
	                	userRow.isDisconnected     = parseInt(usersDataObj[i].isDisconnected);
	                	userRow.disconnectedTime   = usersDataObj[i].disconnectedTime;
	                	userRow.isUserRemoved      = usersDataObj[i].isUserRemoved;
	                	userRow.userCallHoldStatus = usersDataObj[i].userCallHoldStatus;
	                    userRow.addedDateTime      = usersDataObj[i].addedDateTime;
	                    userRow.userOriginalImg    = usersDataObj[i].userOriginalImg;
	                    userRow.userThumbnailImg   = usersDataObj[i].userThumbnailImg;
	                    userData.push(userRow);
	                }
	                if(i === parseInt(totalUsers - 1))
					{
						console.log('userDataDestroyUserFromRoomMethod',userData);
						
						roomData.roomName      = roomDataObj.roomName;
    					roomData.moduleName    = roomDataObj.moduleName;
                        roomData.callHistoryID = roomDataObj.callHistoryID;
                        roomData.userData      = self.removeDuplicateUsers(userData);
                        roomData.createdDate   = roomDataObj.createdDate; // UTC Time
                        roomData.callStartedDateTime = roomDataObj.callStartedDateTime;
                        roomData.currentTime    = custom.getCurrentTime();
                        userRooms.set(roomName, roomData);
        				return true;
					}
				}
    		}else{
    			roomData.roomName      = roomDataObj.roomName;
    			roomData.moduleName    = roomDataObj.moduleName;
                roomData.callHistoryID = roomDataObj.callHistoryID;
                roomData.userData      = userData;
                roomData.createdDate   = roomDataObj.createdDate; // UTC Time
                roomData.callStartedDateTime = roomDataObj.callStartedDateTime;
                roomData.currentTime    = custom.getCurrentTime();
                userRooms.set(roomName, roomData);
    			return false;
    		}
    	}else{
    		return false;
    	}
    }

    /**
	 * To destroy room
	 * @param {string} roomName
	*/
    destroyRoom(roomName) 
    {
    	if(userRooms.has(roomName)){

    		/* Get user room data */
    		let roomData      = userRooms.get(roomName);
    		let roomUsersData = roomData.userData;
    		let totalUsers    = parseInt(roomUsersData.length);
    		let userRemovedCount = 0;
    		if(totalUsers > 1){
    			for (var i = 0; i < totalUsers; i++) 
	    		{
	    			let userData = roomUsersData[i];
	    			if(userData && parseInt(userData.isUserRemoved) === 1)
	    			{
	    				userRemovedCount = userRemovedCount + 1;
	    			}
	    			if(i === (parseInt(totalUsers) - 1))
	    			{
	    				/* Last user in room */
	    				if((totalUsers - parseInt(userRemovedCount)) <= 1)
    					{
    						/* Update Call End Time */
	    					let callHistoryID = (!roomData.callHistoryID) ? 0 : roomData.callHistoryID;
	    					let updateQuery   = 'UPDATE `call_history` SET `callStatus` = "FINISHED", `callCompletedTime` = "'+custom.getCurrentTime()+'" WHERE `callHistoryID` = '+callHistoryID+' AND `callCompletedTime` IS NULL AND callStatus NOT IN ("MISSED_CALL","INITIATED","DECLINE_CALL")';
	    					model.customQuery(function(err,updateResp){
	    						if(err){
				                    console.log('updateCallEndTime',err);
				                }else{
				                	console.log('updateCallEndTime',updateResp);
				                }
	    					},updateQuery);

	    					/* To update user call status */
	    					model.updateData(function(err,updateUserStatus){
	    					},constant.call_history_users,{callUserStatus:"FINISHED"},{callHistoryID:callHistoryID,callUserStatus:"STARTED"});
    					}

	    				if(parseInt(userRemovedCount) === totalUsers){

	    					/* Destroy room */
				    		userRooms.delete(roomName);
				    		return true;
	    				}else{
	    					return false;
	    				}
	    			}
	    		}
    		}else{

    			/* Update Call End Time */
				let callHistoryID = (!roomData.callHistoryID) ? 0 : roomData.callHistoryID;
				let updateQuery   = 'UPDATE `call_history` SET `callStatus` = "FINISHED", `callCompletedTime` = "'+custom.getCurrentTime()+'" WHERE `callHistoryID` = '+callHistoryID+' AND `callCompletedTime` IS NULL AND callStatus NOT IN ("MISSED_CALL","INITIATED","DECLINE_CALL")';
				model.customQuery(function(err,updateResp){
					if(err){
	                    console.log('updateCallEndTime',err);
	                }else{
	                	console.log('updateCallEndTime',updateResp);
	                }
				},updateQuery);

				/* To update user call status */
				model.updateData(function(err,updateUserStatus){
				},constant.call_history_users,{callUserStatus:"FINISHED"},{callHistoryID:callHistoryID,callUserStatus:"STARTED"});

    			/* Destroy room */
	    		userRooms.delete(roomName);
	    		return true;
    		}
    	}else{
    		return false;
    	}
    }

    /**
	 * To update user call end time
	 * @param {integer} callHistoryID
	 * @param {integer} callUserID
	*/
    updateUserCallEndTime(callHistoryID,callUserID) 
    {
		/* Get User call details */
		model.getAllWhere(function(err,callDetails){
			if(err){
                console.log('updateCallEndTimeError',err);
            }else{
            	if(callDetails != "")
            	{
            		let currentTime            = custom.getCurrentTime();
            		let callUserAddedDate      = custom.changeDateFormat(callDetails[0].callUserAddedDate);

            		/* Update User call end time */
            		let updateObj = {};
            		updateObj.callUserTerminatedDate = currentTime;
            		updateObj.callUserTotalDuration  = custom.getDateTimeDifference(callUserAddedDate,currentTime,'seconds');;
					model.updateData(function(err,updateResp){
						if(err){
		                    console.log('updateCallEndTimeError',err);
		                }else{
		                	console.log('updatedSuccessfully',updateResp);
		                }
					},constant.call_history_users,updateObj,{callHistoryUsersID:callDetails[0].callHistoryUsersID});
            	}
            }
		},constant.call_history_users,{callHistoryID:callHistoryID,callUserID:callUserID});
    }

    /**
	 * To destroy empty room
	 * @param {string} roomName
	*/
    destroyEmptyRoom(roomName) 
    {
    	if(userRooms.has(roomName)){

    		/* Get user room data */
    		let roomUsersData = userRooms.get(roomName).userData;
    		let totalUsers    = parseInt(roomUsersData.length);
    		if(totalUsers <= 1){

    			/* Destroy room */
	    		userRooms.delete(roomName);
	    		return true;
    		}else{
    			return false;
    		}
    	}else{
    		return false;
    	}
    }

    /**
	 * To Check if user exist in any room (In All Rooms)
	 * @param {object}  callBack
	 * @param {integer} userID
	*/
    isUserExistInAnyRoom(callBack,userID) 
    {
    	let self = this;
    	let userRoomsLength = parseInt(userRooms.size);
    	console.log('userRoomsDataAnyRoom',userRooms);
    	if(userRoomsLength > 0){

    		/* Check in all rooms */
    		let myIndex = 0;
    		userRooms.forEach(function(resp,index) {
    			console.log('indexRoom',index);

    			/* Get user room data */
    			let roomUsersData = userRooms.get(index).userData;
    			let roomCreatedDate = (!userRooms.get(index).createdDate) ? '' : userRooms.get(index).createdDate;
    			let isRoomTerminated = self.isRoomTerminated(roomCreatedDate);
    			if(!isRoomTerminated){
    				console.log('Room not terminated',index);
    				let totalUsers    = parseInt(roomUsersData.length);
	    			if(totalUsers > 0)
	    			{
		       			for (var i = 0; i < totalUsers; i++) 
				   		{
				   			if(roomUsersData[i].userID === userID && parseInt(roomUsersData[i].isUserRemoved) === 0)
	    					{
	    						return callBack(1,index,totalUsers);
	    					}
				   		}
	    			}
    			}else{
    				console.log('Room terminated',index);
    				/* Destroy Room */
    				self.destroyRoom(index);
    			}
    			myIndex = myIndex + 1;
				if(parseInt(myIndex) === userRoomsLength)
				{
					return callBack(0,'',0);
				}
    		});
    	}else{
    		return callBack(0,'',0);
    	}
    }

    /**
	 * To Check if call history id already exist in any room
	 * @param {object}  callBack
	 * @param {integer} callHistoryID
	*/
    isCallHistoryIdExist(callBack,callHistoryID) 
    {
    	let self = this;
    	let userRoomsLength = parseInt(userRooms.size);
    	if(userRoomsLength > 0){

    		/* Check in all rooms */
    		let myIndex = 0;
    		userRooms.forEach(function(resp,index) {

    			/* Get user room data */
    			let roomData = userRooms.get(index);
    			if(roomData.callHistoryID && (parseInt(roomData.callHistoryID) === callHistoryID))
    			{
    				return callBack(1); // EXIST
    			}
    			myIndex = myIndex + 1;
				if(parseInt(myIndex) === userRoomsLength)
				{
					return callBack(0);
				}
    		});
    	}else{
    		return callBack(0);
    	}
    }

    /**
	 * To get user data from room
	 * @param {integer} userID
	 * @param {string}  roomName
	*/
    getUserDataFromRoom(userID,roomName) 
    {
    	let roomUsersData = userRooms.get(roomName).userData;
    	let totalUsers    = parseInt(roomUsersData.length);
    	if(totalUsers > 0){
    		for (var i = 0; i < totalUsers; i++) 
    		{
    			let userData = roomUsersData[i];
    			if(userData && parseInt(userData.userID) === userID)
    			{
    				return userData;
    			}
    			if(i === (parseInt(totalUsers) - 1))
    			{
    				return {};
    			}
    		}
    	}else{
    		return {};
    	}
    }

    /**
	 * To check if user disconnect limit has exceeded
	 * @param {integer} isDisconnected [0,1]
	 * @param {string}  disconnectedTime
	*/
    isDisconnectLimitExceed(isDisconnected,disconnectedTime) 
    {
    	if(parseInt(isDisconnected) === 1){

    		/* Get disconnect datetime difference*/
    		let timeDifference = custom.getDateTimeDifference(disconnectedTime,custom.getCurrentTime(),'seconds');
    		if(timeDifference >= callDisconnectLimit){
    			return true;
    		}else{
    			return false;
    		}
    	}else{
    		console.log('false');
    		return false;
    	}
    }

    /**
	 * To check if room is terminated or destroy
	 * @param {string}  roomCreatedDateTime
	*/
    isRoomTerminated(roomCreatedDateTime) 
    {
    	if(!roomCreatedDateTime) return true;
		let timeDifference = custom.getDateTimeDifference(roomCreatedDateTime,custom.getCurrentTime(),'minutes');
		if(timeDifference >= constant.call_limit){
			return true;
		}else{
			return false;
		}
    }

    /**
	 * To auto remove user from room
	 * @param {object}  callBack
	 * @param {integer} userID
	*/
    autoRemoveUserFromRoom(callBack,userID) 
    {
    	let self = this;

    	/* To check if user exist in room */
    	this.isUserExistInAnyRoom(function(respType,roomName,totalUsers){
    		if(parseInt(respType) === 1){

    			/* Get user data from room */
    			let userData = self.getUserDataFromRoom(userID,roomName);
    			console.log('userData',userData);
    			if(userData){
    				let isDisconnectLimitExceed = self.isDisconnectLimitExceed(userData.isDisconnected,userData.disconnectedTime);
    				console.log('isDisconnectLimitExceed',isDisconnectLimitExceed);
    				if(isDisconnectLimitExceed){
    					let removeUserFromRoom = self.removeUserFromRoom(roomName,userID);
    					console.log('removeUserFromRoom',removeUserFromRoom);
    					if(removeUserFromRoom){
    						return callBack(1,'DEAD');
    					}else{
    						return callBack(0,'DEAD');
    					}
    				}else{
    					return callBack(0,'ALIVE');
    				}
    			}else{
    				return callBack(0,'DEAD');
    			}
    		}else{
    			return callBack(0,'DEAD');
    		}
    	},userID);
    }

    /**
	 * To get no of users in a room
	 * @param {string}  roomName
	*/
    getNoOfUsersInRoom(roomName) 
    {
    	if(userRooms.has(roomName)){
    		
    		/* Get room users data */
    		let roomUsersData = userRooms.get(roomName).userData;
    		return parseInt(roomUsersData.length);
    	}else{
    		return 0;
    	}
    }

    /**
	 * To check if user socket is connected or not
	 * @param {integer}  userID
	*/
    isUserSocketConnected(userID) 
    {
    	var clients  = io.sockets.clients();
    	let clientSocketObj = clients.connected;
    	let socketIds = Object.keys(clientSocketObj);
    	if(parseInt(socketIds.length) > 0){
    		let index = 0;
    		for(var key in clientSocketObj) 
		    {
		    	let clientObjHandshakeData      = clientSocketObj[key];
		    	if(clientObjHandshakeData != undefined && clientObjHandshakeData != "" && clientObjHandshakeData != null)
		    	{
		    		let clientObjHandshakeDataQuery = clientObjHandshakeData.handshake;
		    		if(clientObjHandshakeDataQuery != undefined && clientObjHandshakeDataQuery != "" && clientObjHandshakeDataQuery != null)
		    		{
		    			let queryObj = clientObjHandshakeDataQuery.query;
		    			if(queryObj != undefined && queryObj.uid != undefined && queryObj.uid == userID)
		    			{
		    				return true;
		    			}
		    		}
		    	}
		    	index = index + 1;
				if(parseInt(index) === parseInt(socketIds.length))
				{
					return false;
				}
		    }
    	}else{
    		return false;
    	}
    }

    /**
	 * To Get User Socket ID
	 * @param {integer} userID
	*/
    getUserSocketID(userID) 
    {
		var clients  = io.sockets.clients();
    	let clientSocketObj = clients.connected;
    	let socketIds = Object.keys(clientSocketObj);
    	if(parseInt(socketIds.length) > 0){
    		let index = 0;
    		for(var key in clientSocketObj) 
		    {
		    	let clientObjHandshakeData      = clientSocketObj[key];
		    	if(clientObjHandshakeData != undefined && clientObjHandshakeData != "" && clientObjHandshakeData != null)
		    	{
		    		let clientObjHandshakeDataQuery = clientObjHandshakeData.handshake;
		    		if(clientObjHandshakeDataQuery != undefined && clientObjHandshakeDataQuery != "" && clientObjHandshakeDataQuery != null)
		    		{
		    			let queryObj = clientObjHandshakeDataQuery.query;
		    			if(queryObj != undefined && queryObj.uid != undefined && queryObj.uid == userID)
		    			{
		    				return key;
		    			}
		    		}
		    	}
		    	index = index + 1;
				if(parseInt(index) === parseInt(socketIds.length))
				{
					return '';
				}
		    }
    	}else{
    		return '';
    	}
	}

	/**
	 * To Get Connected Client Sockets
	*/
    getConnectedClientSockets() 
    {
		let clients  = io.sockets.clients();
    	let clientSocketObj = (!clients.connected) ? {} : clients.connected;
    	let socketIds = (!clients.connected) ? new Array() : Object.keys(clientSocketObj);
    	let response = {};
    	response.totalConnectedSockets = parseInt(socketIds.length);
    	response.connectedSocketIds    = socketIds ;
    	return response;
    }

	/**
	 * To send user calling notification
	 * @param {string} userMessage
	 * @param {integer} userId
	 * @param {object} extraParams
	 * @param {datetime} callDateTime
	 * @param {integer} callHistoryID
	*/
    sendCallingNotification(userMessage,userId,extraParams = {},callDateTime,callHistoryID) 
    {
    	let notification = require(appRoot + '/lib/notification.js');
    	let expiryTime   = 2; // seconds
    	let maxSendLimit = 30; // seconds
    	let self = this;

    	/* Get User Details */
    	model.getAllWhere(function(err,userDetails){
    		if(err){
    			console.log('sendPushNotificationsError',err);
    			return;
    		}else{
    			if(userDetails != "" && parseInt(userDetails[0].userEmailVerified) === 1 && parseInt(userDetails[0].isUserBlocked) === 0 && parseInt(userDetails[0].isUserDeactivated) === 0 && parseInt(userDetails[0].isRedFlagBlock) === 0){

    				/* Check membership status */
    				custom.isMembershipActive(function(respType){
    					if(respType === 1)
    					{
    						/* User Badges (Notification Count) */
		    				let userBadges = parseInt(userDetails[0].userBadges);
		    				extraParams.userBadges = userBadges;
		    				console.log('extraParams',extraParams);

		    				/* To get user devices history */
		    				model.getAllWhere(function(err,userDevicesObj){
		    					if(err){
					    			console.log('sendPushNotificationsError',err);
					    			return;
					    		}else{
					    			if(userDevicesObj != ""){
					    				let totalDevices = parseInt(userDevicesObj.length);
					    				if(totalDevices > 0)
					    				{
					    					/* Send notification to users on all logged in devices */
					    					for (var i = 0; i < totalDevices; i++) 
					    					{
					    						/* To get user device type */
					    						let userDeviceType = userDevicesObj[i].userDeviceType;
					    						if(userDeviceType === 'ANDROID'){

					    							/* Send notification on android */
					    							notification.sendAndroidNotification(function(err,androidNotificationResp){
					    							},userDevicesObj[i].userDeviceToken,userMessage,extraParams);
					    						}else{
					    							/* Send notification on ios */
					    							notification.sendIOSNotification(function(err,iosNotificationResp){
					    							},userDevicesObj[i].userDeviceToken,userMessage,userBadges,extraParams,expiryTime,callHistoryID);

					    							/* Send continus notification till 30 seconds */
					    							self.callSetInterval(userId,callDateTime,userDevicesObj[i].userDeviceToken,userMessage,userBadges,extraParams,expiryTime,callHistoryID);
					    						}
					    					}
					    				}
					    			}else{
					    				/* When user is logged out or didn`t login yet */
					    				console.log('sendPushNotificationsError','User device history not found');
					    			}
					    		}
		    				},constant.users_device_history,{userId:userId});
    					}
    				},userDetails[0].isPaidMembeship,userDetails[0].isFacebookVerified,userDetails[0].isTwitterVerified,userDetails[0].isInstagramVerified,userDetails[0].userRegistrationDate);
    				
    				
    			}else{
    				console.log('sendPushNotificationsError','User details not found');
    			}
    		}
    	},constant.user_details,{userId:userId});
	}

	callSetInterval(userId,callDateTime,userDeviceToken,userMessage,userBadges,extraParams,expiryTime,callHistoryID)
	{
		let self = this;
		callNotification = setInterval(function(){ self.sendIOSCallNotification(userId,callDateTime,userDeviceToken,userMessage,userBadges,extraParams,expiryTime,callHistoryID) }, 2000);
	}

	/**
	 * To send call notification for IOS users
	 * @param {integer} userId
	 * @param {datetime}callDateTime
	 * @param {string}  userDeviceToken
	 * @param {string}  userMessage
	 * @param {string}  userBadges
	 * @param {string}  extraParams
	 * @param {string}  expiryTime
	 * @param {integer} callHistoryID
	*/
    sendIOSCallNotification(userId,callDateTime,userDeviceToken,userMessage,userBadges,extraParams,expiryTime,callHistoryID) 
    {
    	let notification = require(appRoot + '/lib/notification.js');
    	let self = this;

    	/* Get user online status */
		let isUserSocketConnected = self.isUserSocketConnected(userId);
		if(!isUserSocketConnected){ // OFFLINE

			/*  Get date time difference */
			let currentTime = custom.getCurrentTime();
			let dateTimeDifference = custom.getDateTimeDifference(callDateTime,currentTime,'seconds');
			if(dateTimeDifference < 30){

				/* To check call is declined or not */
				self.isCallHistoryIdExist(function(respType){
					if(respType === 1){
						
						/* Send Notification */
						notification.sendIOSNotification(function(err,iosNotificationResp){
						},userDeviceToken,userMessage,userBadges,extraParams,expiryTime,callHistoryID);
					}else{
						clearInterval(callNotification);
					}
				},callHistoryID);
			}else{
				clearInterval(callNotification);
			}
		}else{
			clearInterval(callNotification);
		}
	}

}

module.exports = Socket;

/* End of file socket.js */
/* Location: ./lib/socket.js */