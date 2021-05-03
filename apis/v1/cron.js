"use strict";

/*
 * Purpose : For Cron Rest API
 * Package : Cron
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
		cron         = require('node-cron'),
		queryBuilder = require(appRoot + '/lib/query-builder.js').QueryBuilder();

	/* To delete 30 Days old notifications && pending order [Run once in a day at 10 PM]
	*/
	cron.schedule('0 22 * * *', function(){

		/* Query to delete 30 days old notifications */
		let deleteQuery = 'DELETE FROM ' + constant.notifications + ' WHERE notificationSentTime + INTERVAL 30 DAY <= NOW()';
		database.getConn(deleteQuery, function(err, resp) {
            if (err) {
                console.log('Delete notification error',custom.getCurrentTime());
            } else {
                console.log('Delete notification success',custom.getCurrentTime());
            }
        });

        /* Delete all pending orders */
        let orderIDs = new Array();
        let orderQuery = "SELECT *,TIMESTAMPDIFF(HOUR, orderDateTime, '" + custom.getCurrentTime() + "') AS time_diff FROM " + constant.orders + " WHERE `orderPaymentStatus` = 'PENDING' HAVING time_diff > 10";
        model.customQuery(function(err,orderResp){
    		if(err){
                console.log('Get pending orders data error', custom.getCurrentTime());
            }else{
            	if(parseInt(orderResp.length) > 0)
            	{
            		for (var i = 0; i < parseInt(orderResp.length); i++) 
            		{
            			orderIDs.push(orderResp[i].orderID);
            			if(i === (parseInt(orderResp.length) - 1))
            			{
            				if(orderIDs != "")
            				{
            					/* Delete orders */
            					let deleteQuery1 = 'DELETE FROM ' + constant.orders + ' WHERE orderID IN (' + orderIDs.join() + ')';
								database.getConn(deleteQuery1, function(err, resp) {
						            if (err) {
						                console.log('Delete orders error',custom.getCurrentTime());
						            } else {
						                console.log('Delete orders success',custom.getCurrentTime());
						            }
						        });
            				}
            			}
            		}
            	}
            }
        },orderQuery);
	});

	/* To send notifications for scheduled calls (Before 1 Hour Ago) [Run every hour]
	*/
	cron.schedule('0 * * * *', function(){
		console.log('call schedule reminder triggered');

		/* Get scheduled calls */
		var callScheduleQuery = "SELECT * FROM " + constant.schedule_calls + " AS `C` WHERE `C`.`callGlobalStatus` = 'ACCEPT' AND `C`.`isScheduledCallMutuallyConfirmed` = 1 AND `C`.`isNotificationSent` = 0 AND CONCAT(TRIM(`C`.callScheduleDate), ' ', TRIM(`C`.callScheduleTime)) >= '" + custom.getCurrentTime() + "' GROUP BY `C`.`callScheduleID` ORDER BY `C`.`callScheduleDate`, `C`.`callScheduleTime` ASC LIMIT 100";
    	model.customQuery(function(err,scheduledCallsResp){
    		if(err){
                console.log('To send notifications for scheduled calls error', custom.getCurrentTime());
            }else{
            	if(scheduledCallsResp != ""){
            		let responseObj = [];
            		for (var i = 0; i < parseInt(scheduledCallsResp.length); i++) 
	                {
	                	let callScheduleDate = custom.changeDateFormat(scheduledCallsResp[i].callScheduleDate,'yyyy-mm-dd');
	                	let callScheduleTime = scheduledCallsResp[i].callScheduleTime;
	                	let callScheduleModuleName = scheduledCallsResp[i].callScheduleModuleName;
	                	let callScheduleUserID   = parseInt(scheduledCallsResp[i].callScheduleUserID);
                		let callScheduleFriendID = parseInt(scheduledCallsResp[i].callScheduleFriendID);
                		let callScheduleID = parseInt(scheduledCallsResp[i].callScheduleID);
	                	let callScheduleDateTime = callScheduleDate + " " + callScheduleTime;
	                	let currentTime = custom.getCurrentTime();
	                	console.log('currentTime',currentTime);
	                	console.log('callScheduleDateTime',callScheduleDateTime);

	                	(function(i,callScheduleDateTime,currentTime,callScheduleUserID,callScheduleFriendID,callScheduleID,callScheduleModuleName) {

	                		/* Get Both User Details */
	                		let userIds = [];
	                		userIds.push(callScheduleUserID);
	                		userIds.push(callScheduleFriendID);
	                		let userDetailsQuery = "SELECT * FROM " + constant.user_details + " WHERE userEmailVerified = 1 AND isUserBlocked = 0 AND isUserDeactivated = 0 AND userId IN ("+userIds.join()+")";
	                		database.getConn(userDetailsQuery, function (err, userDetailsResp) {
	                            if(err){
	                                console.log('Database error - Get Scheduled Calls Data');
	                            }else{
	                            	if(userDetailsResp != "")
	                            	{

	                            		for (var j = 0; j < parseInt(userDetailsResp.length); j++) 
	                					{
	                						/* Get user timezone */
	                						let userTimeZone = (!userDetailsResp[j].userTimeZone) ? constant.default_timezone :  userDetailsResp[j].userTimeZone;

	                						/* Get schedule date time according to user timezone */
						                	let convertedCallDateTime = custom.timezoneConversion(userTimeZone,callScheduleDateTime);
						                	console.log('convertedCallDateTime',convertedCallDateTime);

						                	/* Get current date time according to user timezone */
						                	let convertedCurrentDateTime = custom.timezoneConversion(userTimeZone,currentTime);
						                	console.log('convertedCurrentDateTime',convertedCurrentDateTime);

						                	/* Get hours difference between call scheduled datetime & current datetime */
						                	let hoursDiff = custom.getDateTimeDifference(convertedCurrentDateTime,convertedCallDateTime,'hours');
						                	console.log('hoursDiff',hoursDiff);
						                		
						                	let userName = userDetailsResp[j].userFirstName + " " + userDetailsResp[j].userLastName;
						                	console.log('userName',userName);

						                	if(hoursDiff <= 1){
						                		let userID   = parseInt(userDetailsResp[j].userId);
						                		let friendID = '';
						                		if(userID  === callScheduleUserID){
						                			friendID = callScheduleFriendID;
						                		}else{
						                			friendID = callScheduleUserID;
						                		}


						                		/* To check block request */
						                		model.getAllWhere(function(err,blockResp){
						                			if(err){
						                				console.log('Database error - Block User');
						                			}else{
						                				if(blockResp == ""){

						                					/* Get scheduled call details */
						                					model.getAllWhere(function(err,callScheduledDetails){
						                						if(err){
									                				console.log('Database error - Get scheduled call details');
									                			}else{
									                				if(callScheduledDetails != ""){

									                					/* Insert call scheduled reminder notification */
																	   	let notificationDataObj = {};
												                		notificationDataObj.notificationUserId   = userID;
												                		notificationDataObj.notificationFriendId = friendID;
												                		notificationDataObj.callScheduleModuleID = callScheduleID;
												                		notificationDataObj.notificationModule   = callScheduleModuleName;
												                		notificationDataObj.notificationType     = 'SCHEDULED_CALL_REMINDER';
												                		notificationDataObj.actionStatus         = 'SCHEDULED_CALL_REMINDER';
												                		notificationDataObj.notificationMessage  = 'You had scheduled a call with';
												                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
												                		notificationDataObj.notificationParams   = JSON.stringify({callScheduleDate:custom.changeDateFormat(callScheduledDetails[0].callScheduleDate,'yyyy-mm-dd'),callScheduleTime:callScheduledDetails[0].callScheduleTime,callGlobalStatus:callScheduledDetails[0].callGlobalStatus,callScheduleUserStatus:callScheduledDetails[0].callScheduleUserStatus,callScheduleFriendStatus:callScheduledDetails[0].callScheduleFriendStatus,callNote:callScheduledDetails[0].callNote});
												                		model.insertData(function(err,insertResp){
												                			if(err){
												                				console.log('Database error - Insert Notification Scheduled Call Reminder');
												                			}
												                		},constant.notifications,notificationDataObj);

												                		/* Update friend badges */
			                        									let u1 = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + friendID;
			                        									model.customQuery(function(err,badgesUpdateResp){
			                        										if(err){
												                				console.log('Database error - Update Badges Dating Review');
												                			}
			                        									},u1);

									                					/* To send push notifications */
											                            let userMessage = " You had scheduled a call with " + userName;
											                            let extraParams = {};
											                            extraParams.callScheduleModuleID = callScheduleID;
											                            extraParams.callScheduleUserID   = userID;
											                            extraParams.callScheduleFriendID = friendID;
											                            extraParams.moduleName = callScheduleModuleName;
											                            extraParams.notificationType = 'SCHEDULED_CALL_REMINDER';
											                            notification.sendPushNotifications(userMessage,friendID,extraParams);

											                            /* Update notification flag */
												                		model.updateData(function(err,updateRes){
												                			if(err){
												                				console.log('Database error - Update Notification Flag');
												                			}
												                			console.log('updateRes',updateRes);
												                		},constant.schedule_calls,{isNotificationSent:1},{callScheduleID:callScheduleID});

									                				}else{
									                					console.log('Scheduled call details not found');
									                				}
									                			}
						                					},constant.schedule_calls,{callScheduleID:callScheduleID});
						                				}else{
						                					console.log('Cron Job - User is blocked');
						                				}
						                			}
						                		},constant.block_users,{userBlockUserId:friendID,userBlockFriendId:userID});
						                	}else{
						                		console.log(userName + ' hour limit exceeds');
						                	}
	                					}
	                            	}
	                            }
		                		if (i === parseInt(scheduledCallsResp.length - 1)) {
	                              console.log('Cron Job - Scheduled calls completed at ' + custom.getCurrentTime());
	                            }
	                        });
	                	})(i,callScheduleDateTime,currentTime,callScheduleUserID,callScheduleFriendID,callScheduleID,callScheduleModuleName);
	                }
            	}else{
            		console.log('Cron Job - Scheduled calls not found');
            	}
            }
    	},callScheduleQuery);
	});

	/* To send notifications for dating review (After 24 Hours) [Run every hour]
	   24 hours difference
	   run eveny hour
	   limit
	   debug
	*/
	cron.schedule('0 * * * *', function(){
		console.log('date review reminder triggered');

		/* Get scheduled dates */
		var datesScheduleQuery = "SELECT * FROM " + constant.schedule_dating + " AS `D` WHERE `D`.`datingGlobalStatus` = 'ACCEPT' AND `D`.`isScheduledDateMutuallyConfirmed` = 1 AND `D`.`isNotificationSent` = 0 AND CONCAT(TRIM(`D`.datingScheduleDate), ' ', TRIM(`D`.datingScheduleTime),':00') >= '" + custom.getCurrentTime() + "' GROUP BY `D`.`datingScheduleID` ORDER BY `D`.`datingScheduleDate`, `D`.`datingScheduleTime` ASC LIMIT 10";
		console.log('datesScheduleQuery',datesScheduleQuery)
    	model.customQuery(function(err,scheduledDateResp){
    		if(err){
                console.log('To send notifications for dating review error', custom.getCurrentTime());
            }else{
            	if(scheduledDateResp != ""){
            		let responseObj = [];
            		for (var i = 0; i < parseInt(scheduledDateResp.length); i++) 
	                {
	                	let datingScheduleDate = custom.changeDateFormat(scheduledDateResp[i].datingScheduleDate,'yyyy-mm-dd');
	                	let datingScheduleTime = scheduledDateResp[i].datingScheduleTime;
	                	let datingScheduleModuleName = scheduledDateResp[i].datingScheduleModuleName;
	                	let datingScheduleUserID   = parseInt(scheduledDateResp[i].datingScheduleUserID);
                		let datingScheduleFriendID = parseInt(scheduledDateResp[i].datingScheduleFriendID);
                		let datingScheduleID = parseInt(scheduledDateResp[i].datingScheduleID);
	                	let datesScheduledDateTime = datingScheduleDate + " " + datingScheduleTime + ":00";
	                	let currentTime = custom.getCurrentTime();
	                	console.log('currentTime' + i,currentTime);
	                	console.log('scheduledDateResp[i].datingScheduleDate' + i,scheduledDateResp[i].datingScheduleDate);
	                	console.log('datesScheduledDateTime' + i,datesScheduledDateTime);

	                	(function(i,datesScheduledDateTime,currentTime,datingScheduleUserID,datingScheduleFriendID,datingScheduleID,datingScheduleModuleName) {

	                		/* Get Both User Details */
	                		let userIds = [];
	                		userIds.push(datingScheduleUserID);
	                		userIds.push(datingScheduleFriendID);
	                		let userDetailsQuery = "SELECT * FROM " + constant.user_details + " WHERE userEmailVerified = 1 AND isUserBlocked = 0 AND isUserDeactivated = 0 AND userId IN ("+userIds.join()+")";
	                		database.getConn(userDetailsQuery, function (err, userDetailsResp) {
	                            if(err){
	                                console.log('Database error - Get Scheduled Dates Data');
	                            }else{
	                            	if(userDetailsResp != "")
	                            	{

	                            		for (var j = 0; j < parseInt(userDetailsResp.length); j++) 
	                					{
	                						/* Get user timezone */
	                						let userTimeZone = (!userDetailsResp[j].userTimeZone) ? constant.default_timezone :  userDetailsResp[j].userTimeZone;

	                						/* Get schedule date time according to user timezone */
						                	let convertedDateScheduleDateTime = custom.timezoneConversion(userTimeZone,datesScheduledDateTime);
						                	console.log('convertedDateScheduleDateTime' + i,convertedDateScheduleDateTime);

						                	/* Get current date time according to user timezone */
						                	let convertedCurrentDateTime = custom.timezoneConversion(userTimeZone,currentTime);
						                	console.log('convertedCurrentDateTime' + i,convertedCurrentDateTime);

						                	/* Get date time after 24 hours of scheduled date time */
						                	let twentyFourHoursDateTime = custom.changeDateFormat(moment(convertedDateScheduleDateTime).add(1, 'minutes'));
						                	console.log('twentyFourHoursDateTime' + i,twentyFourHoursDateTime);

						                	let userName = userDetailsResp[j].userFirstName + " " + userDetailsResp[j].userLastName;
						                	console.log('userName' + i,userName);

						                	/* Get hours difference between call scheduled datetime & current datetime */
						                	let hoursDiff = custom.getDateTimeDifference(convertedCurrentDateTime,twentyFourHoursDateTime,'minutes');
						                	console.log('hoursDiff',hoursDiff);

						                	if(convertedCurrentDateTime >= twentyFourHoursDateTime || hoursDiff <= 1){
						                		let userID   = parseInt(userDetailsResp[j].userId);
						                		let friendID = 0;
						                		if(userID  === datingScheduleUserID){
						                			friendID = datingScheduleFriendID;
						                		}else{
						                			friendID = datingScheduleUserID;
						                		}

						                		/* To check block request */
						                		model.getAllWhere(function(err,blockResp){
						                			if(err){
						                				console.log('Database error - Block User');
						                			}else{
						                				if(blockResp == ""){

						                					/* Get dating details */
						                					model.getAllWhere(function(err,dateScheduleDetails){
						                						if(err){
									                				console.log('Database error - Get scheduled date details');
									                			}else{
									                				if(dateScheduleDetails != ""){

									                					/* Insert date scheduled review notification */
																	   	let notificationDataObj = {};
												                		notificationDataObj.notificationUserId   = userID;
												                		notificationDataObj.notificationFriendId = friendID;
												                		notificationDataObj.dateScheduleModuleID = datingScheduleID;
												                		notificationDataObj.notificationModule   = datingScheduleModuleName;
												                		notificationDataObj.notificationType     = 'SCHEDULED_DATE_REVIEW_REMINDER';
												                		notificationDataObj.notificationMessage  = 'How was you Date Yesterday with';
												                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
												                		notificationDataObj.notificationParams   = JSON.stringify({datingScheduleDate:custom.changeDateFormat(dateScheduleDetails[0].datingScheduleDate,'yyyy-mm-dd'),datingScheduleTime:dateScheduleDetails[0].datingScheduleTime + ":00",datingGlobalStatus:dateScheduleDetails[0].datingGlobalStatus,datingScheduleUserStatus:dateScheduleDetails[0].datingScheduleUserStatus,datingScheduleFriendStatus:dateScheduleDetails[0].datingScheduleFriendStatus,datingLocation:dateScheduleDetails[0].datingLocation,datingLocationLatitude:dateScheduleDetails[0].datingLocationLatitude,datingLocationLongitude:dateScheduleDetails[0].datingLocationLongitude,datingAfterMath:dateScheduleDetails[0].datingAfterMath,datesNote:dateScheduleDetails[0].datesNote});
												                		model.insertData(function(err,insertResp){
												                			if(err){
												                				console.log('Database error - Insert Notification Dating Review');
												                			}
												                		},constant.notifications,notificationDataObj);

												                		/* Update friend badges */
			                        									let u1 = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + friendID;
			                        									model.customQuery(function(err,badgesUpdateResp){
			                        										if(err){
												                				console.log('Database error - Update Badges Dating Review');
												                			}
			                        									},u1);

									                					/* To send push notifications */
											                            let userMessage = "How was you Date Yesterday with " + userName + " ?";
											                            let extraParams = {};
											                            extraParams.datingScheduleModuleID = datingScheduleID;
											                            extraParams.datingScheduleUserID   = userID;
											                            extraParams.datingScheduleFriendID = friendID;
											                            extraParams.moduleName = datingScheduleModuleName;
											                            extraParams.notificationType = 'SCHEDULED_DATE_REVIEW_REMINDER';
											                            notification.sendPushNotifications(userMessage,friendID,extraParams);

											                            /* Update notification flag */
												                		model.updateData(function(err,updateRes){
												                			if(err){
												                				console.log('Database error - Update Notification Flag');
												                			}
												                			console.log('updateRes',updateRes);
												                		},constant.schedule_dating,{isNotificationSent:1},{datingScheduleID:datingScheduleID});

									                				}else{
									                					console.log('Scheduled date details not found');
									                				}
									                			}
						                					},constant.schedule_dating,{datingScheduleID:datingScheduleID});
						                				}else{
						                					console.log('Cron Job - User is blocked');
						                				}
						                			}
						                		},constant.block_users,{userBlockUserId:friendID,userBlockFriendId:userID});
						                	}else{
						                		console.log(userName + ' 24 hours limit exceeds');
						                	}
	                					}
	                            	}
	                            }
		                		if (i === parseInt(scheduledDateResp.length - 1)) {
	                              console.log('Cron Job - Scheduled calls completed at ' + custom.getCurrentTime());
	                            }
	                        });
	                	})(i,datesScheduledDateTime,currentTime,datingScheduleUserID,datingScheduleFriendID,datingScheduleID,datingScheduleModuleName);
	                }
            	}else{
            		console.log('Cron Job - Scheduled dates not found');
            	}
            }
    	},datesScheduleQuery);
	});

	/* To manage upload image count after 5 dates completed  [Run every hour] */
	cron.schedule('0 * * * *', function(){

		let datingQuery = "SELECT `UD`.`userId` AS `userId`,`UD1`.`userId` AS `friendId`,`UD`.`isDatingImagesCountAdded` AS `isUserDatingImagesCountAdded`,`UD1`.`isDatingImagesCountAdded` AS `isFriendDatingImagesCountAdded` FROM " + constant.schedule_dating + " AS `D` INNER JOIN " + constant.user_details + " AS `UD` ON `UD`.`userId` = `D`.`datingScheduleUserID` INNER JOIN " + constant.user_details + " AS `UD1` ON `UD1`.`userId` = `D`.`datingScheduleFriendID` WHERE IF(`D`.`datingScheduleUserID` = `UD1`.`userId`, `UD`.`isDatingImagesCountAdded`,`UD1`.`isDatingImagesCountAdded`) = 0 AND `D`.`datingGlobalStatus` = 'ACCEPT' AND CONCAT(TRIM(`D`.datingScheduleDate), ' ', TRIM(`D`.datingScheduleTime)) < '" + custom.getCurrentTime() + "' GROUP BY `D`.`datingScheduleID` ORDER BY `D`.`datingScheduleID` DESC LIMIT 10  ";
		model.customQuery(function(err,datingResp){
			if(err){
				console.log('dating upload image count error',err);
			}else{
				if(parseInt(datingResp.length) > 0)
				{
					let updateCountUserIds = new Array();
					for (var i = 0; i < parseInt(datingResp.length); i++) 
					{
						let userId   = parseInt(datingResp[i].userId);
						let friendId = parseInt(datingResp[i].friendId);

						/* Manage Upload Images Count (User) */
						if(parseInt(datingResp[i].isUserDatingImagesCountAdded) === 0 && updateCountUserIds.indexOf(userId) < 0)
						{
							/* Get completed dates count */
                        	let s1 = "SELECT COUNT(*) AS `total_completed_dates` FROM " + constant.schedule_dating + " WHERE `datingGlobalStatus` = 'ACCEPT' AND ( `datingScheduleUserID` = " + userId + " OR `datingScheduleFriendID` = " + userId + " ) AND CONCAT(TRIM(datingScheduleDate), ' ', TRIM(datingScheduleTime)) < '" + custom.getCurrentTime() + "'";
                        	model.customQuery(function(err,userCompletedDates){
                            	if(err){
                            		console.log('User completed dates count error',err);
                            	}else{
                            		console.log('User total_completed_dates',userCompletedDates[0].total_completed_dates);
                            		if(userCompletedDates[0].total_completed_dates && parseInt(userCompletedDates[0].total_completed_dates) >= constant.dates_complete_limit)
                            		{
                            			/* Update user allowed images count */
			                            let u1 = "UPDATE (`"+constant.user_details+"`) SET `isDatingImagesCountAdded` = 1, `noOfAllowedImages` = noOfAllowedImages + " + constant.allowed_images_count + " WHERE `userId` = " + userId + ' AND `isDatingImagesCountAdded` = 0';
			                            model.customQuery(function(err,updateResp){
			                            	if(err){
			                            		console.log('User update allowed images error',err);
			                            	}else{

			                            		if(parseInt(updateResp.affectedRows) > 0)
			                            		{
				                            		updateCountUserIds.push(userId);
				                            		console.log('updateCountUserIds',updateCountUserIds);
				                            		console.log('User update allowed images success');

				                            		/* Insert history */
				                            		let allowedImagesObj = {};
				                            		allowedImagesObj.allowedImageUserID   = userId;
				                            		allowedImagesObj.allowedImageModule   = 'DATING';
				                            		allowedImagesObj.allowedImageCount    = constant.allowed_images_count;
				                            		allowedImagesObj.allowedImageDateTime = custom.getCurrentTime();
				                            		model.insertData(function(err,insertResp){
				                            			if(err){
						                            		console.log('User insert allowed image history error',err);
						                            	}else{
						                            		console.log('User insert allowed image history success');
						                            	}
				                            		},constant.allowed_images_history,allowedImagesObj);

						                            /* Insert images count notification */
						                            let notiMsg = 'Congratulation !! you had successfully completed ' + constant.dates_complete_limit + ' dates, now you can upload ' + constant.allowed_images_count + ' more images';
												   	let notificationDataObj1 = {};
							                		notificationDataObj1.notificationUserId   = userId;
							                		notificationDataObj1.notificationFriendId = userId;
							                		notificationDataObj1.notificationParams   = JSON.stringify({allowedImageCount:constant.allowed_images_count,allowedImageDateTime:custom.getCurrentTime()});
							                		notificationDataObj1.notificationModule   = 'GLOBAL';
							                		notificationDataObj1.notificationType     = 'COMPLETED_5_DATES';
							                		notificationDataObj1.notificationMessage  = notiMsg;
							                		notificationDataObj1.notificationSentTime = custom.getCurrentTime();
							                		model.insertData(function(err,notificationResp){
						                            	if(err){
						                            		console.log('User allowed image app notification error',err);
						                            	}else{
						                            		console.log('User allowed image app notification success');
						                            	}
						                            },constant.notifications,notificationDataObj1);

						                            /* Update user badges */
						                            let updateQuery1 = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + userId;
						                            model.customQuery(function(err,badgesResp){
						                            	if(err){
						                            		console.log('User allowed image notification badges error',err);
						                            	}else{
						                            		console.log('User allowed image notification badges success');
						                            	}
						                            },updateQuery1);

						                            /* To send push notifications */
						                            let extraParams1 = {};
						                            extraParams1.userId            = userId;
						                            extraParams1.moduleName        = 'GLOBAL';
						                            extraParams1.notificationType  = 'COMPLETED_5_DATES';
						                            notification.sendPushNotifications(notiMsg,userId,extraParams1);
					                        	}
			                            	}
			                            },u1);
                            		}
                            	}
                            },s1);
						}

						/* Manage Upload Images Count (Friend) */
						if(parseInt(datingResp[i].isFriendDatingImagesCountAdded) === 0 && updateCountUserIds.indexOf(friendId) < 0)
						{
							/* Get completed dates count */
                        	let s2 = "SELECT COUNT(*) AS `total_completed_dates` FROM " + constant.schedule_dating + " WHERE `datingGlobalStatus` = 'ACCEPT' AND ( `datingScheduleUserID` = " + friendId + " OR `datingScheduleFriendID` = " + friendId + " ) AND CONCAT(TRIM(datingScheduleDate), ' ', TRIM(datingScheduleTime)) < '" + custom.getCurrentTime() + "'";
                        	model.customQuery(function(err,friendCompletedDates){
                            	if(err){
                            		console.log('Friend completed dates count error',err);
                            	}else{
                            		console.log('Friend total_completed_dates',friendCompletedDates[0].total_completed_dates);
                            		if(friendCompletedDates[0].total_completed_dates && parseInt(friendCompletedDates[0].total_completed_dates) >= constant.dates_complete_limit)
                            		{
                            			/* Update friend allowed images count */
			                            let u2 = "UPDATE (`"+constant.user_details+"`) SET `isDatingImagesCountAdded` = 1, `noOfAllowedImages` = noOfAllowedImages + " + constant.allowed_images_count + " WHERE `userId` = " + friendId + ' AND `isDatingImagesCountAdded` = 0';
			                            model.customQuery(function(err,updateResp){
			                            	if(err){
			                            		console.log('Friend update allowed images error',err);
			                            	}else{
			                            		if(parseInt(updateResp.affectedRows) > 0)
			                            		{
				                            		updateCountUserIds.push(friendId);
				                            		console.log('updateCountUserIds',updateCountUserIds);
				                            		console.log('Friend update allowed images success');

				                            		/* Insert history */
				                            		let allowedImagesObj1 = {};
				                            		allowedImagesObj1.allowedImageUserID   = friendId;
				                            		allowedImagesObj1.allowedImageModule   = 'DATING';
				                            		allowedImagesObj1.allowedImageCount    = constant.allowed_images_count;
				                            		allowedImagesObj1.allowedImageDateTime = custom.getCurrentTime();
				                            		model.insertData(function(err,insertResp){
				                            			if(err){
						                            		console.log('Friend insert allowed image history error',err);
						                            	}else{
						                            		console.log('Friend insert allowed image history success');
						                            	}
				                            		},constant.allowed_images_history,allowedImagesObj1);

						                            /* Insert images count notification */
						                            let notiMsg1 = 'Congratulation !! you had successfully completed ' + constant.dates_complete_limit + ' dates, now you can upload ' + constant.allowed_images_count + ' more images';
												   	let notificationDataObj2 = {};
							                		notificationDataObj2.notificationUserId   = friendId;
							                		notificationDataObj2.notificationFriendId = friendId;
							                		notificationDataObj2.notificationParams   = JSON.stringify({allowedImageCount:constant.allowed_images_count,allowedImageDateTime:custom.getCurrentTime()});
							                		notificationDataObj2.notificationModule   = 'GLOBAL';
							                		notificationDataObj2.notificationType     = 'COMPLETED_5_DATES';
							                		notificationDataObj2.notificationMessage  = notiMsg1;
							                		notificationDataObj2.notificationSentTime = custom.getCurrentTime();
							                		model.insertData(function(err,notificationResp){
						                            	if(err){
						                            		console.log('Friend allowed image app notification error',err);
						                            	}else{
						                            		console.log('Friend allowed image app notification success');
						                            	}
						                            },constant.notifications,notificationDataObj2);

						                            /* Update friend badges */
						                            let updateQuery2 = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + friendId;
						                            model.customQuery(function(err,badgesResp){
						                            	if(err){
						                            		console.log('Friend allowed image notification badges error',err);
						                            	}else{
						                            		console.log('Friend allowed image notification badges success');
						                            	}
						                            },updateQuery2);

						                            /* To send push notifications */
						                            let extraParams2 = {};
						                            extraParams2.userId            = friendId;
						                            extraParams2.moduleName        = 'GLOBAL';
						                            extraParams2.notificationType  = 'COMPLETED_5_DATES';
						                            notification.sendPushNotifications(notiMsg1,friendId,extraParams2);
					                        	}
			                            	}
			                            },u2);
                            		}
                            	}
                            },s2);
						}
					}
				}
			}
		},datingQuery);
	});

	/* To send notifications for scheduled dates (Before 1 Hour Ago) [Run every hour]
	*/
	cron.schedule('0 * * * *', function(){
		console.log('date schedule reminder triggered');

		/* Get scheduled calls */
		var dateScheduledQuery = "SELECT * FROM " + constant.schedule_dating + " AS `C` WHERE `C`.`datingGlobalStatus` = 'ACCEPT' AND `C`.`isScheduledDateMutuallyConfirmed` = 1 AND `C`.`isScheduleNotificationSent` = 0 AND CONCAT(TRIM(`C`.datingScheduleDate), ' ', TRIM(`C`.datingScheduleTime),':00') >= '" + custom.getCurrentTime() + "' GROUP BY `C`.`datingScheduleID` ORDER BY `C`.`datingScheduleDate`, `C`.`datingScheduleTime` ASC LIMIT 100";
    	model.customQuery(function(err,scheduledDatesResp){
    		if(err){
                console.log('To send notifications for scheduled calls error', custom.getCurrentTime());
            }else{
            	if(scheduledDatesResp != ""){
            		let responseObj = [];
            		for (var i = 0; i < parseInt(scheduledDatesResp.length); i++) 
	                {
	                	let datingScheduleDate = custom.changeDateFormat(scheduledDatesResp[i].datingScheduleDate,'yyyy-mm-dd');
	                	let datingScheduleTime = scheduledDatesResp[i].datingScheduleTime;
	                	let dateScheduleModuleName = 'DATING';
	                	let datingScheduleUserID   = parseInt(scheduledDatesResp[i].datingScheduleUserID);
                		let datingScheduleFriendID = parseInt(scheduledDatesResp[i].datingScheduleFriendID);
                		let datingScheduleID = parseInt(scheduledDatesResp[i].datingScheduleID);
	                	let datingScheduleDateTime = datingScheduleDate + " " + datingScheduleTime + ":00";
	                	let currentTime = custom.getCurrentTime();
	                	console.log('currentTime',currentTime);
	                	console.log('datingScheduleDateTime',datingScheduleDateTime);

	                	(function(i,datingScheduleDateTime,currentTime,datingScheduleUserID,datingScheduleFriendID,datingScheduleID,dateScheduleModuleName) {

	                		/* Get Both User Details */
	                		let userIds = [];
	                		userIds.push(datingScheduleUserID);
	                		userIds.push(datingScheduleFriendID);
	                		let userDetailsQuery = "SELECT * FROM " + constant.user_details + " WHERE userEmailVerified = 1 AND isUserBlocked = 0 AND isUserDeactivated = 0 AND userId IN ("+userIds.join()+")";
	                		database.getConn(userDetailsQuery, function (err, userDetailsResp) {
	                            if(err){
	                                console.log('Database error - Get Scheduled Dating Data');
	                            }else{
	                            	if(userDetailsResp != "")
	                            	{

	                            		for (var j = 0; j < parseInt(userDetailsResp.length); j++) 
	                					{
	                						/* Get user timezone */
	                						let userTimeZone = (!userDetailsResp[j].userTimeZone) ? constant.default_timezone :  userDetailsResp[j].userTimeZone;

	                						/* Get schedule date time according to user timezone */
						                	let convertedDatingDateTime = custom.timezoneConversion(userTimeZone,datingScheduleDateTime);
						                	console.log('convertedDatingDateTime',convertedDatingDateTime);

						                	/* Get current date time according to user timezone */
						                	let convertedCurrentDateTime = custom.timezoneConversion(userTimeZone,currentTime);
						                	console.log('convertedCurrentDateTime',convertedCurrentDateTime);

						                	/* Get hours difference between dating scheduled datetime & current datetime */
						                	let hoursDiff = custom.getDateTimeDifference(convertedCurrentDateTime,convertedDatingDateTime,'minutes');
						                	console.log('hoursDiff',hoursDiff);
						                		
						                	let userName = userDetailsResp[j].userFirstName + " " + userDetailsResp[j].userLastName;
						                	console.log('userName',userName);

						                	if(hoursDiff <= 2){
						                		let userID   = parseInt(userDetailsResp[j].userId);
						                		let friendID = '';
						                		if(userID  === datingScheduleUserID){
						                			friendID = datingScheduleFriendID;
						                		}else{
						                			friendID = datingScheduleUserID;
						                		}


						                		/* To check block request */
						                		model.getAllWhere(function(err,blockResp){
						                			if(err){
						                				console.log('Database error - Block User');
						                			}else{
						                				if(blockResp == ""){

						                					/* Get scheduled call details */
						                					model.getAllWhere(function(err,datingScheduledDetails){
						                						if(err){
									                				console.log('Database error - Get scheduled Dating details');
									                			}else{
									                				if(datingScheduledDetails != ""){

									                					/* Insert call scheduled reminder notification */
																	   	let notificationDataObj = {};
												                		notificationDataObj.notificationUserId   = userID;
												                		notificationDataObj.notificationFriendId = friendID;
												                		notificationDataObj.dateScheduleModuleID = datingScheduleID;
												                		notificationDataObj.notificationModule   = dateScheduleModuleName;
												                		notificationDataObj.notificationType     = 'SCHEDULED_DATING_REMINDER';
												                		notificationDataObj.actionStatus         = 'SCHEDULED_DATING_REMINDER';
												                		notificationDataObj.notificationMessage  = 'You had scheduled a date with';
												                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
												                		notificationDataObj.notificationParams   = JSON.stringify({datingScheduleDate:custom.changeDateFormat(datingScheduledDetails[0].datingScheduleDate,'yyyy-mm-dd'),datingScheduleTime:datingScheduledDetails[0].datingScheduleTime,callGlobalStatus:datingScheduledDetails[0].callGlobalStatus,callScheduleUserStatus:datingScheduledDetails[0].callScheduleUserStatus,callScheduleFriendStatus:datingScheduledDetails[0].callScheduleFriendStatus,datingLocation:datingScheduledDetails[0].datingLocation,datingLocationLatitude:datingScheduledDetails[0].datingLocationLatitude,datingLocationLongitude:datingScheduledDetails[0].datingLocationLongitude,datingAfterMath:datingScheduledDetails[0].datingAfterMath,datesNote:datingScheduledDetails[0].datesNote});
												                		model.insertData(function(err,insertResp){
												                			if(err){
												                				console.log('Database error - Insert Notification Scheduled Dating Reminder');
												                			}
												                		},constant.notifications,notificationDataObj);

												                		/* Update friend badges */
			                        									let u1 = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + friendID;
			                        									model.customQuery(function(err,badgesUpdateResp){
			                        										if(err){
												                				console.log('Database error - Update Badges Dating Scheduled');
												                			}
			                        									},u1);

									                					/* To send push notifications */
											                            let userMessage = " You had scheduled a date with " + userName;
											                            let extraParams = {};
											                            extraParams.dateScheduleModuleID = datingScheduleID;
											                            extraParams.datingScheduleUserID   = userID;
											                            extraParams.datingScheduleFriendID = friendID;
											                            extraParams.moduleName = dateScheduleModuleName;
											                            extraParams.notificationType = 'SCHEDULED_DATING_REMINDER';
											                            notification.sendPushNotifications(userMessage,friendID,extraParams);

											                            /* Update notification flag */
												                		model.updateData(function(err,updateRes){
												                			if(err){
												                				console.log('Database error - Update Notification Flag');
												                			}
												                		},constant.schedule_dating,{isScheduleNotificationSent:1},{datingScheduleID:datingScheduleID});

									                				}else{
									                					console.log('Scheduled dating details not found');
									                				}
									                			}
						                					},constant.schedule_dating,{datingScheduleID:datingScheduleID});
						                				}else{
						                					console.log('Cron Job - User is blocked');
						                				}
						                			}
						                		},constant.block_users,{userBlockUserId:friendID,userBlockFriendId:userID});

						                		
						                	}else{
						                		console.log(userName + ' hour limit exceeds');
						                	}
	                					}
	                            	}
	                            }
		                		if (i === parseInt(scheduledDatesResp.length - 1)) {
	                              console.log('Cron Job - Scheduled dating completed at ' + custom.getCurrentTime());
	                            }
	                        });
	                	})(i,datingScheduleDateTime,currentTime,datingScheduleUserID,datingScheduleFriendID,datingScheduleID,dateScheduleModuleName);
	                }
            	}else{
            		console.log('Cron Job - Scheduled dates not found');
            	}
            }
    	},dateScheduledQuery);
	});
	

	


}