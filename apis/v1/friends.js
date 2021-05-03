"use strict";

/*
 * Purpose : For Friends Rest API
 * Package : Friends
 * Company : Mobiweb Technology Pvt. Ltd.
 * Developed By  : Sorav Garg
*/

module.exports = function(app, database, notification, constant,custom) {

	/* Load custom modules */
    var appRoot = require('app-root-path'),
    	async   = require('async'),
		model   = require(appRoot + '/lib/model.js'),
		constant= require(appRoot + '/config/constant.js'),
		database= require(appRoot + '/config/database.js'),
		custom  = require(appRoot + '/lib/custom.js'),
		model   = require(appRoot + '/lib/model.js'),
		notification = require(appRoot + '/lib/notification.js'),
		queryBuilder = require(appRoot + '/lib/query-builder.js').QueryBuilder();

	/* To get users listing */
	app.post('/users/listing', function(req, res) {

		let locale   = req.headers.locale;
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
			    	notInUserIds.push(masterUserId);

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

			    	/* Get friends users  */
			    	let myQuery = "SELECT * FROM `friends` WHERE (`userId` = "+masterUserId+" OR `friendId` = "+masterUserId+") AND `friendStatus` = 'ACCEPT'";
			    	model.customQuery(function(err,friendsUsersResp){
			    		if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(friendsUsersResp != ""){
		                		for (var i = 0; i < parseInt(friendsUsersResp.length); i++) 
							    {
							    	if(parseInt(friendsUsersResp[i].userId) === masterUserId){
							    		notInUserIds.push(parseInt(friendsUsersResp[i].friendId));
							    	}else{
							    		notInUserIds.push(parseInt(friendsUsersResp[i].userId));
							    	}
							    }
							    callback(null, userDetailsObj,notInUserIds);
		                	}else{
		                		callback(null, userDetailsObj,notInUserIds);
		                	}
		                }
			    	},myQuery);

			    },
			    function(userDetailsObj,notInUserIds, callback) {

			    	/* To remove duplicate values */
			    	notInUserIds = Array.from(new Set(notInUserIds));

			    	/* To get offset */
			    	let offset = custom.getOffset(pageNo);

			    	/* To get users */
			    	var userQuery = "SELECT * FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND `UD`.`isPreferencesAdded` = 1 AND  `U`.`userType` = 'NORMAL_USER' AND `U`.`masterUserId` NOT IN("+notInUserIds.join()+") ORDER BY `UD`.`userFirstName` ASC ";
			    	model.customQuery(function(err,usersObj){
			    		if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	let totalUsers = parseInt(usersObj.length);
		                	if(offset > 0){
					    		userQuery += "LIMIT " + offset + "," + constant.results_limit;
					    	}else{
					    		userQuery += "LIMIT " + constant.results_limit
					    	}
					        model.customQuery(function(err,usersObj){
					        	if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(usersObj != ""){
				                		callback(null, userDetailsObj, usersObj,totalUsers);
				                	}else{
				                		return res.send({
										            "code": 200,
										            "response": [],
										            "status": 0,
										            "message": custom.lang(locale,"Users not found.")
										        });
				                	}
				                }
					        },userQuery);
		                }
		            },userQuery);
			    }
			], function (err,userDetailsObj,usersObj,totalUsers) {
				let masterUserId = parseInt(userDetailsObj[0].masterUserId);

				/* For Asynchronous Iteration */
			    custom.publicUsersCollection(usersObj,masterUserId, function(err,resp){
			    	if(err){
			    		return res.send({
						            "code": 200,
						            "response": {},
						            "status": 0,
						            "message": custom.lang(locale,constant.general_error)
						        });
			    	}else{
			    		return res.send({
						            "code": 200,
						            "response": resp,
						            "status": 1,
						            "totalCount":totalUsers,
						            "message": custom.lang(locale,"success")
						        });
			    	}
			    }); 
			});
		}	
	});

	/* To get friend profile details */
	app.post('/friend/profile-details', function(req, res) {
		let locale = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("userId").trim();
		req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('userId', custom.lang(locale,'User Id field is require')).notEmpty();
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
	    	let userId = parseInt(req.sanitize('userId').escape().trim());
	    	let skillObj  = [];

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,loggedInUserDetailsObj) {
				if(parseInt(respType) === 0){
					return res.send(loggedInUserDetailsObj);
				}else{

					/* To get user details */
					custom.getUserProfileDetails(function(respType,userDtailsObj) {
						if(parseInt(respType) === 0){
							return res.send(userDtailsObj);
						}else{
							let masterUserId = parseInt(loggedInUserDetailsObj[0].userId);
							let friendId = userId;
							var friendModuleId = 0;
		                    var senderId = 0;
		                    var recieverId  = 0;
		                    var blockStatus = 0;
		                    var friendStatus = "NONE";

							/* Check user is already friend or pending request */
					    	let friendQuery = 'SELECT * FROM `friends` WHERE (`userId` = '+masterUserId+' AND `friendId` = '+friendId+') OR (`userId` = '+friendId+' AND `friendId` = '+masterUserId+')';
					        model.customQuery(function(err,friendRespObj){
					        	if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(friendRespObj != "")
				                	{
				                		friendModuleId = friendRespObj[0].masterFriendId;
				                		senderId       = friendRespObj[0].userId;
				                		recieverId     = friendRespObj[0].friendId;
				                		friendStatus   = friendRespObj[0].friendStatus;
				                	}

				                	/* Get user block status */
				                	model.getAllWhere(function(err,blockResp){
				                		if(err){
						                    return res.send(custom.dbErrorResponse());
						                }else{
						                	if(blockResp != "")
						                	{
						                		blockStatus = 1;
						                	}
						                	
						                	/* To get user profile response */
											let profileResponse = custom.getUserProfileResponse(userDtailsObj);
											profileResponse.friendModuleId = friendModuleId;
											profileResponse.senderId       = senderId;
											profileResponse.recieverId     = recieverId;
											profileResponse.friendStatus   = friendStatus;
											profileResponse.blockStatus    = blockStatus;

											/* To get main skills */
											model.getAllWhere(function(err,skillResp){
												if(err){
								                    return res.send(custom.dbErrorResponse());
								                }else{
								                	if(skillResp != ""){
								                		for (var i = 0; i < parseInt(skillResp.length); i++) 
													    {
													    	let row = {};
													    	row.skillID         = parseInt(skillResp[i].skillID);
													    	row.skillName       = custom.nullChecker(skillResp[i].skillName);
													    	skillObj.push(row);

													    	if(i === (parseInt(skillResp.length) - 1))
													    	{
													    		return res.send({
																            "code": 200,
																            "response": profileResponse,
																            "mainSkills": skillObj,
																            "status": 1,
																            "message": custom.lang(locale,'success')
																        });
													    	}
													    }
								                	}else{
								                		return res.send({
														            "code": 200,
														            "response": profileResponse,
														            "mainSkills": skillObj,
														            "status": 1,
														            "message": custom.lang(locale,'success')
														        });
								                	}
								                }
											},constant.skills,{skillUserID:userId,isMainSkill:1});
						                }
				                	},constant.block_users,{userBlockUserId:masterUserId,userBlockFriendId:friendId});
				                }
				            },friendQuery);
						}
					},userId);
				}
			},userLoginSessionKey,timezone);
		}
	});

	/* To get friend gallery images */
	app.post('/friend/gallery-images', function(req, res) {
		let locale = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userId").trim();
		req.sanitize("pageNo").trim();
	    req.check('userId', custom.lang(locale,'User Id field is require')).notEmpty();
	    req.check('pageNo', custom.lang(locale,'Required page number')).notEmpty();
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
			let userId   = parseInt(req.sanitize('userId').escape().trim());
			let pageNo   = parseInt(req.sanitize('pageNo').escape().trim());

			async.waterfall([
			    function(callback) {

			    	/* To get offset */
			    	let offset = custom.getOffset(pageNo);

			    	/* To get user gallery images */
			    	model.getCount(function(err,totalImagesCount){
			    		if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	let totalImages = parseInt(totalImagesCount);
		                	model.getAllWhere(function(err,galleryImagesObj){
					        	if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(galleryImagesObj != ""){
				                		callback(null, galleryImagesObj,totalImages);
				                	}else{
				                		return res.send({
										            "code": 200,
										            "response": [],
										            "status": 0,
										            "message": custom.lang(locale,"Gallery images not found.")
										        });
				                	}
				                }
					        },constant.user_gallery_images,{userId:userId},'userGalleryImageId','DESC','*',constant.results_limit,offset);
		                }
			    	},constant.user_gallery_images,{userId:userId});
			        
			    }
			], function (err,galleryImagesObj,totalImages) {
			    let responseObj = [];
			    for (var i = 0; i < parseInt(galleryImagesObj.length); i++) 
			    {
			    	let row = {};
			    	row.userGalleryImageId  = parseInt(galleryImagesObj[i].userGalleryImageId);
			    	row.userOriginalImage   = constant.base_url + galleryImagesObj[i].userOriginalImage;
			    	row.userThumbnailImage  = constant.base_url + galleryImagesObj[i].userThumbnailImage;
			    	row.userGalleryImageCreatedDate  = custom.changeDateFormat(galleryImagesObj[i].userGalleryImageCreatedDate);
			    	responseObj.push(row);
			    }
			    return res.send({
					            "code": 200,
					            "response": responseObj,
					            "status": 1,
					            "totalCount":totalImages,
					            "message": custom.lang(locale,"success")
					        });
			});
		}
	});

	/**
	 * To send friend request
	 * @param {string}  userLoginSessionKey
	 * @param {integer} friendId
	 * @param {string}  friendNote (Optional)
	 */
	app.post('/friend/send-request', function(req, res) {
		let locale = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("friendId").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('friendId', custom.lang(locale,'Require Friend Id')).notEmpty();
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
			let friendId   = parseInt(req.sanitize('friendId').escape().trim());
			let friendNote = (!req.body.friendNote) ? '' : req.sanitize('friendNote').escape().trim();

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					let masterUserId = parseInt(respObj[0].masterUserId);

					/* Check self request */
					if(masterUserId === friendId)
					{
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'You can not send request to your self.')
							        });
					}

					async.waterfall([
					    function(callback) {

					    	/* Check user is already blocked */
					    	let blockQuery = 'SELECT * FROM `block_users` WHERE (`userBlockUserId` = '+masterUserId+' AND `userBlockFriendId` = '+friendId+') OR (`userBlockUserId` = '+friendId+' AND `userBlockFriendId` = '+masterUserId+')';
					        model.customQuery(function(err,blockRespObj){
					        	if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(blockRespObj != ""){
				                		return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,'You can not send request to this user.')
											        });
				                	}else{
				                		callback(null,respObj,masterUserId)
				                	}
				                }
				            },blockQuery);
					    },
					    function(userDetailsObj,masterUserId, callback) {
					        
					        /* Check user is already friend or pending request */
					    	let friendQuery = 'SELECT * FROM `friends` WHERE (`userId` = '+masterUserId+' AND `friendId` = '+friendId+') OR (`userId` = '+friendId+' AND `friendId` = '+masterUserId+')';
					        model.customQuery(function(err,friendRespObj){
					        	if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(friendRespObj != "" && friendRespObj[0].friendStatus == "PENDING"){
				                		return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,'Your friend request already is pending.')
											        });
				                	}else if(friendRespObj != "" && friendRespObj[0].friendStatus == "ACCEPT"){
				                		return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,'You are already friend of this user.')
											        });
				                	}else{
				                		callback(null,respObj,masterUserId,friendRespObj)
				                	}
				                }
				            },friendQuery);
					    }
					], function (err, userDetailsObj,masterUserId,friendRespObj) {
					   	
					   	database.pool.getConnection(function(err, connection) {

					   		/* Begin transaction */
	                        connection.beginTransaction(function(err) {
	                            if (err) {
	                                return res.send(custom.dbErrorResponse());
	                            }

		                        /* Insert friend request */
							   	let friendDataObj = {};
							   	friendDataObj.userId = masterUserId;
							   	friendDataObj.friendId   = friendId;
							   	friendDataObj.friendNote = friendNote;
							   	friendDataObj.friendRequestSentTime = custom.getCurrentTime();
		                        let i1 = queryBuilder.insert(constant.friends,friendDataObj);
		                        queryBuilder.reset_query(i1);
		                        connection.query(i1, function(err, friendResp) {
			                        if (err) {
			                            connection.rollback(function() {
			                                return res.send(custom.dbErrorResponse(err.sqlMessage));
			                            });
			                        }
			                        if(!friendResp){
			                        	return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,'Failed to send friend request.')
											        });
			                        }
			                        var friendModuleId = parseInt(friendResp.insertId);

			                    /* Insert friend request notification */
							   	let notificationDataObj = {};
		                		notificationDataObj.notificationUserId   = masterUserId;
		                		notificationDataObj.notificationFriendId = friendId;
		                		notificationDataObj.friendModuleId       = friendModuleId;
		                		notificationDataObj.notificationType     = 'SEND_FRIEND_REQUEST';
		                		notificationDataObj.notificationMessage  = 'has sent a friend request';
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
		                        let u1 = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + friendId;
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
			                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " has sent a friend request";
			                            let extraParams = {};
			                            extraParams.friendModuleId = friendModuleId;
			                            extraParams.friendNote     = friendNote;
			                            extraParams.senderId       = userDetailsObj[0].userId;
			                            extraParams.moduleName     = 'FRIENDLY';
			                            extraParams.notificationType = 'SEND_FRIEND_REQUEST';
			                            notification.sendPushNotifications(userMessage,friendId,extraParams);

			                            /* Return user response */
					            		return res.send({"code" : 200, "response" : {friendModuleId:friendModuleId},"status" : 1,"message" : custom.lang(locale,'Friend request sent sucessfully.')});
			                        }
		                    	});
		                    	});
		                    	});
		                    	});
	                    	});
					   	});
					});
				}
			},userLoginSessionKey,timezone);
		}
	});

	/**
	 * To accept friend request
	 * @param {string} userLoginSessionKey
	 * @param {integer} friendModuleId
	 */
	app.post('/friend/accept-request', function(req, res) {
		let locale = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("friendModuleId").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('friendModuleId', custom.lang(locale,'Require Friend Module Id')).notEmpty();
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
			let friendModuleId = parseInt(req.sanitize('friendModuleId').escape().trim());

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					async.waterfall([
					    function(callback) {

					    	/* To check friendModuleId */
					    	model.getAllWhere(function(err,friendModuleResp){
					    		if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(friendModuleResp != ""){
				                		if(friendModuleResp[0].friendStatus == "ACCEPT"){
					                		return res.send({
												            "code": 200,
												            "response": {},
												            "status": 0,
												            "message": custom.lang(locale,'You are already friend of this user.')
												        });
					                	}else if(friendModuleResp[0].friendStatus == "PENDING"){
				                			callback(null,respObj,friendModuleResp)
					                	}
				                	}else{
				                		return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,'Friend request has been already cancelled.')
											        });
				                	}
				                }
					    	},constant.friends,{masterFriendId:friendModuleId});
					    },
					   	function(userDetailsObj,friendModuleResp, callback) {
					   		let masterUserId = parseInt(userDetailsObj[0].masterUserId); // friend id
					   		let userId		 = parseInt(friendModuleResp[0].userId);
					   		let friendId	 = parseInt(friendModuleResp[0].friendId);

					   		/* Check self request */
					   		if(masterUserId === userId){
					   			return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'You can`t accept request your self.')
									        });
					   		}else{
					   			callback(null,userDetailsObj,friendModuleResp,masterUserId);
					   		}
					   	}
					], function (err, userDetailsObj,friendModuleResp,masterUserId) {
					   	
					   	database.pool.getConnection(function(err, connection) {

					   		/* Begin transaction */
	                        connection.beginTransaction(function(err) {
	                            if (err) {
	                                return res.send(custom.dbErrorResponse());
	                            }

		                        /* Update friend request status */
							   	let friendDataObj = {};
							   	friendDataObj.friendStatus = 'ACCEPT';
							   	friendDataObj.friendRequestResponseTime = custom.getCurrentTime();
		                        let u1 = queryBuilder.update(constant.friends,friendDataObj,{masterFriendId:friendModuleId});
		                        queryBuilder.reset_query(u1);
		                        connection.query(u1, function(err, friendResp) {
			                        if (err) {
			                            connection.rollback(function() {
			                                return res.send(custom.dbErrorResponse(err.sqlMessage));
			                            });
			                        }

			                    /* Insert friend request accept notification */
			                    let friendIdSender = parseInt(friendModuleResp[0].userId);
							   	let notificationDataObj = {};
		                		notificationDataObj.notificationUserId   = masterUserId;
		                		notificationDataObj.notificationFriendId = friendIdSender;
		                		notificationDataObj.friendModuleId       = friendModuleId;
		                		notificationDataObj.notificationType     = 'ACCEPT_FRIEND_REQUEST';
		                		notificationDataObj.notificationMessage  = 'has accepted your friend request';
		                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
		                        let i1 = queryBuilder.insert(constant.notifications,notificationDataObj);
		                        queryBuilder.reset_query(i1);
		                        connection.query(i1, function(err, resp) {
			                        if (err) {
			                            connection.rollback(function() {
			                                return res.send(custom.dbErrorResponse(err.sqlMessage));
			                            });
			                        }

			                    /* Update friend badges */
		                        let u1 = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + friendIdSender;
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

			                            let userId		 = parseInt(friendModuleResp[0].userId);
					   					let friendId	 = parseInt(friendModuleResp[0].friendId);

			                            /* Check user is already blocked */
								    	let blockQuery = 'SELECT * FROM `block_users` WHERE (`userBlockUserId` = '+userId+' AND `userBlockFriendId` = '+friendId+') OR (`userBlockUserId` = '+friendId+' AND `userBlockFriendId` = '+userId+')';
								        model.customQuery(function(err,blockRespObj){
								        	if(err){
							                    return res.send(custom.dbErrorResponse());
							                }else{
							                	if(blockRespObj == ""){
							                		/* To send push notifications */
						                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " has accepted your friend request";
						                            let extraParams = {};
						                            extraParams.friendModuleId = friendModuleId;
						                            extraParams.recieverId = userDetailsObj[0].userId;
						                            extraParams.notificationType = 'ACCEPT_FRIEND_REQUEST';
						                            extraParams.moduleName = 'FRIENDLY';
						                            notification.sendPushNotifications(userMessage,friendIdSender,extraParams);
							                	}
							                	/* Return user response */
					            				return res.send({"code" : 200, "response" : {},"status" : 1,"message" : custom.lang(locale,'Friend request accepted sucessfully.')});
							                }
							            },blockQuery);
			                        }
		                    	});
		                    	});
		                    	});
		                    	});
	                    	});
					   	});
					});
				}
			},userLoginSessionKey,timezone);
		}
	});

	/**
	 * To reject friend request
	 * @param {string} userLoginSessionKey
	 * @param {integer} friendModuleId
	 */
	app.post('/friend/reject-request', function(req, res) {
		let locale = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("friendModuleId").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('friendModuleId', custom.lang(locale,'Require Friend Module Id')).notEmpty();
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
			let friendModuleId = parseInt(req.sanitize('friendModuleId').escape().trim());

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					async.waterfall([
					    function(callback) {

					    	/* To check friendModuleId */
					    	model.getAllWhere(function(err,friendModuleResp){
					    		if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(friendModuleResp != ""){
				                		if(friendModuleResp[0].friendStatus == "ACCEPT"){
					                		return res.send({
												            "code": 200,
												            "response": {},
												            "status": 0,
												            "message": custom.lang(locale,'You are already friend of this user.')
												        });
					                	}else if(friendModuleResp[0].friendStatus == "PENDING"){
				                			callback(null,respObj,friendModuleResp)
					                	}
				                	}else{
				                		return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,'Invalid friend module ID.')
											        });
				                	}
				                }
					    	},constant.friends,{masterFriendId:friendModuleId});
					    },
					   	function(userDetailsObj,friendModuleResp, callback) {
					   		let masterUserId = parseInt(userDetailsObj[0].masterUserId); // friend id
					   		let userId		 = parseInt(friendModuleResp[0].userId);
					   		let friendId	 = parseInt(friendModuleResp[0].friendId);

					   		/* Check self request */
					   		if(masterUserId === userId){
					   			return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'You can`t reject request your self.')
									        });
					   		}else{
					   			callback(null,userDetailsObj,friendModuleResp,masterUserId);
					   		}
					   	}
					], function (err, userDetailsObj,friendModuleResp,masterUserId) {
					   	
					   	/* Delete request */
					   	model.deleteData(function(err,resp){
					   		if(err){
			                    return res.send(custom.dbErrorResponse());
			                }else{
			                	if(parseInt(resp.affectedRows) > 0){
				            		return res.send({
										            "code": 200,
										            "response": {},
										            "status": 1,
										            "message": custom.lang(locale,'Friend request rejected successfully.')
										        });
				            	}else{
				            		return res.send({
										            "code": 200,
										            "response": {},
										            "status": 0,
										            "message": custom.lang(locale,constant.general_error)
										        });
				            	}
			                }	
					   	},constant.friends,{masterFriendId:friendModuleId});
					});
				}
			},userLoginSessionKey,timezone);
		}
	});
	
	/**
	 * To get my friends list
	 * @param {string} userLoginSessionKey
	 * @param {integer} pageNo
	 */
	app.post('/friend/my-friends-listing', function(req, res) {

		let locale = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("pageNo").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('pageNo', custom.lang(locale,'Required page number')).notEmpty();
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
			    	notInUserIds.push(masterUserId);

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

			    	/* To remove duplicate values */
			    	notInUserIds = Array.from(new Set(notInUserIds));

			    	/* To get offset */
			    	let offset = custom.getOffset(pageNo);

			    	/* To get users */
			    	var userQuery = "SELECT * FROM `friends` AS `F` INNER JOIN `user_details` AS `UD` ON `F`.`userId` = `UD`.`userId` OR `F`.`friendId` = `UD`.`userId` WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND `UD`.`isPreferencesAdded` = 1 AND `F`.`friendStatus` = 'ACCEPT' AND (`F`.`userId` = "+masterUserId+" OR `F`.`friendId` = "+masterUserId+") AND `UD`.`userId` NOT IN ("+notInUserIds.join()+") ORDER BY `UD`.`userFirstName` ASC ";
			    	model.customQuery(function(err,usersObj){
			    		if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	let totalFriends = parseInt(usersObj.length);
		                	if(offset > 0){
					    		userQuery += "LIMIT " + offset + "," + constant.results_limit;
					    	}else{
					    		userQuery += "LIMIT " + constant.results_limit
					    	}
					        model.customQuery(function(err,usersObj){
					        	if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(usersObj != ""){
				                		callback(null, userDetailsObj, usersObj,totalFriends);
				                	}else{
				                		return res.send({
										            "code": 200,
										            "response": [],
										            "status": 0,
										            "message": custom.lang(locale,"Friends not found.")
										        });
				                	}
				                }
					        },userQuery);
		                }
		            },userQuery);
			    }
			], function (err,userDetailsObj,usersObj,totalFriends) {
			    let responseObj = [];
			    for (var i = 0; i < parseInt(usersObj.length); i++) 
			    {
			    	let row = {};
			    	row.masterUserId   = parseInt(usersObj[i].userId);
			    	row.friendModuleId = parseInt(usersObj[i].masterFriendId);
			    	row.senderId       = parseInt(usersObj[i].userId);
			    	row.recieverId     = parseInt(usersObj[i].friendId);
			    	row.userFirstName  = custom.nullChecker(usersObj[i].userFirstName);
			    	row.userLastName   = custom.nullChecker(usersObj[i].userLastName);
			    	row.userJobHeading = custom.nullChecker(usersObj[i].userJobHeading);
			    	row.onlineStatus   = custom.nullChecker(usersObj[i].onlineStatus);
                    row.userRating     = custom.parseNumber(usersObj[i].userRating);
                    row.noOfReviews    = parseInt(usersObj[i].noOfReviews);
                    row.noOfRedFlags   = parseInt(usersObj[i].noOfRedFlags);
                    row.isGroupChatEnable       = parseInt(usersObj[i].isGroupChatEnable);
                    row.isOpenForAllCalls       = parseInt(usersObj[i].isOpenForAllCalls);
                    row.isOpenForScheduledCalls = parseInt(usersObj[i].isOpenForScheduledCalls);
			    	row.userMood       = custom.nullChecker(usersObj[i].userMood);
			    	row.userImage   = (usersObj[i].userImage) ? constant.base_url + usersObj[i].userImage : "";
			    	row.userImageThumbnail  = (usersObj[i].userImageThumbnail) ? constant.base_url + usersObj[i].userImageThumbnail : "";
			    	responseObj.push(row);
			    }
			    return res.send({
					            "code": 200,
					            "response": responseObj,
					            "status": 1,
					            "totalCount":totalFriends,
					            "message": custom.lang(locale,"success")
					        });
			});
		}	
	});

	/**
	 * To get report flag categories
	 * @param {string} userLoginSessionKey
	 */
	app.post('/report/categories', function(req, res) {

		let locale = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    let errors = req.validationErrors();
	    if (errors) {
	        res.send({
	            "code": 200,
	            "response": [],
	            "status": 0,
	            "message": custom.manageValidationMessages(errors)
	        });
	    } else {
			let userLoginSessionKey   = req.sanitize('userLoginSessionKey').escape().trim();

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					/* Get categories */
					model.getAll(function(err,resp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(resp != ""){
		                		let responseObj = [];
							    for (var i = 0; i < parseInt(resp.length); i++) 
							    {
							    	let row = {};
							    	row.reportFlagCategoryID   = parseInt(resp[i].reportFlagCategoryID);
							    	row.reportFlagCategoryName  = custom.nullChecker(resp[i].reportFlagCategoryName);
							    	responseObj.push(row);
							    }
							    return res.send({
									            "code": 200,
									            "response": responseObj,
									            "status": 1,
									            "message": custom.lang(locale,"success")
									        });
		                	}else{
		                		return res.send({
									            "code": 200,
									            "response": [],
									            "status": 0,
									            "message": custom.lang(locale,"Categories not found")
									        });
		                	}
		                }
					},constant.report_flag_categories,'reportFlagCategoryName','ASC');
				}
			},userLoginSessionKey,timezone);
		}	
	});

	/**
	 * To unfriend user
	 * @param {string} userLoginSessionKey
	 * @param {integer} friendModuleId
	 */
	app.post('/friend/unfriend', function(req, res) {
		let locale = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("friendModuleId").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('friendModuleId', custom.lang(locale,'Require Friend Module Id')).notEmpty();
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
			let friendModuleId = parseInt(req.sanitize('friendModuleId').escape().trim());

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					async.waterfall([
					    function(callback) {

					    	/* To check friendModuleId */
					    	model.getAllWhere(function(err,friendModuleResp){
					    		if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(friendModuleResp != ""){
				                		if(friendModuleResp[0].friendStatus == "PENDING"){
					                		return res.send({
												            "code": 200,
												            "response": {},
												            "status": 0,
												            "message": custom.lang(locale,'You request is already in pending mode.')
												        });
					                	}else if(friendModuleResp[0].friendStatus == "ACCEPT"){
				                			callback(null,respObj,friendModuleResp)
					                	}
				                	}else{
				                		return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,'Friend details not found, Or user already unfriend.')
											        });
				                	}
				                }
					    	},constant.friends,{masterFriendId:friendModuleId});
					    },
					   	function(userDetailsObj,friendModuleResp, callback) {
					   		let masterUserId = parseInt(userDetailsObj[0].masterUserId); // friend id
					   		let userId		 = parseInt(friendModuleResp[0].userId);
					   		let friendId	 = parseInt(friendModuleResp[0].friendId);
				   			callback(null,userDetailsObj,friendModuleResp,masterUserId);
					   	}
					], function (err, userDetailsObj,friendModuleResp,masterUserId) {
					   	
					   	/* Delete request */
					   	model.deleteData(function(err,resp){
					   		if(err){
			                    return res.send(custom.dbErrorResponse());
			                }else{
			                	if(parseInt(resp.affectedRows) > 0){
				            		return res.send({
										            "code": 200,
										            "response": {},
										            "status": 1,
										            "message": custom.lang(locale,'User unfriend successfully.')
										        });
				            	}else{
				            		return res.send({
										            "code": 200,
										            "response": {},
										            "status": 0,
										            "message": custom.lang(locale,constant.general_error)
										        });
				            	}
			                }	
					   	},constant.friends,{masterFriendId:friendModuleId});
					});
				}
			},userLoginSessionKey,timezone);
		}
	});

	/**
	 * To cancel friend request
	 * @param {string} userLoginSessionKey
	 * @param {integer} friendModuleId
	 */
	app.post('/friend/cancel-request', function(req, res) {
		let locale = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("friendModuleId").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('friendModuleId', custom.lang(locale,'Require Friend Module Id')).notEmpty();
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
			let friendModuleId = parseInt(req.sanitize('friendModuleId').escape().trim());

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					async.waterfall([
					    function(callback) {

					    	/* To check friendModuleId */
					    	model.getAllWhere(function(err,friendModuleResp){
					    		if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(friendModuleResp != ""){
				                		if(friendModuleResp[0].friendStatus == "PENDING"){
					                		callback(null,respObj,friendModuleResp);
					                	}else if(friendModuleResp[0].friendStatus == "ACCEPT"){
				                			return res.send({
												            "code": 200,
												            "response": {},
												            "status": 0,
												            "message": custom.lang(locale,'You already friend of this user')
												        });
					                	}
				                	}else{
				                		return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,'Friend details not found, Or request already cancelled.')
											        });
				                	}
				                }
					    	},constant.friends,{masterFriendId:friendModuleId});
					    },
					   	function(userDetailsObj,friendModuleResp, callback) {
					   		let masterUserId = parseInt(userDetailsObj[0].masterUserId); // friend id
					   		let userId		 = parseInt(friendModuleResp[0].userId);
					   		let friendId	 = parseInt(friendModuleResp[0].friendId);
				   			callback(null,userDetailsObj,friendModuleResp,masterUserId);
					   	}
					], function (err, userDetailsObj,friendModuleResp,masterUserId) {
					   	
					   	/* Delete request */
					   	model.deleteData(function(err,resp){
					   		if(err){
			                    return res.send(custom.dbErrorResponse());
			                }else{
			                	if(parseInt(resp.affectedRows) > 0){
				            		return res.send({
										            "code": 200,
										            "response": {},
										            "status": 1,
										            "message": custom.lang(locale,'Friend request cancelled successfully.')
										        });
				            	}else{
				            		return res.send({
										            "code": 200,
										            "response": {},
										            "status": 0,
										            "message": custom.lang(locale,constant.general_error)
										        });
				            	}
			                }	
					   	},constant.friends,{masterFriendId:friendModuleId});
					});
				}
			},userLoginSessionKey,timezone);
		}
	});

	


}