"use strict";

/*
 * Purpose : For User Rest Api
 * Package : Users
 * Company : Mobiweb Technology Pvt. Ltd.
 * Developed By  : Sorav Garg
*/

module.exports = function(app, database, notification, constant,custom) {

	/* Load custom modules */
    var mobiweb = require('mobiweb-nodejs-modules'),
    	appRoot = require('app-root-path'),
    	async   = require('async'),
		model   = require(appRoot + '/lib/model.js'),
		notification = require(appRoot + '/lib/notification.js'),
		custom  = require(appRoot + '/lib/custom.js');

	app.post('/send/mail',function(req,res){
		var AWS = require('aws-sdk');


		/* Initialize AWS S3 Bucket Configurations */
	    AWS.config.update({
	      accessKeyId: 'AKIAJP4BV7PWE472XPXQ',
	      secretAccessKey: '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',
	      region:'us-east-1'
	    });
	    console.log('req.body',req.body);

	    let mailObj = {};
	    	mailObj.to_email = req.body.to_email;
	    	mailObj.subject  = req.body.subject;
	    	mailObj.message  = req.body.message;

	    /* Send Mail */
	    custom.sendEmailCallBack(mailObj,function(type,response){
	    	return res.send(response);
	    });
	});

	/* To get ICE server details (For Video Calling) 
		* @param {string} userLoginSessionKey
	*/
	app.post('/ice-servers/list',function(req,res){

		let userLoginSessionKey  = (!req.body.userLoginSessionKey) ? '' : req.sanitize('userLoginSessionKey').escape().trim();

		/* To validate user login session key */
		custom.handleLoggedInUser(function(respType,respObj) {
			if(parseInt(respType) === 0){
				return res.send(respObj);
			}else{
				var https = require("https");
				var options1 = {
				      host: "global.xirsys.net",
				      path: "/_turn/MyFirstApp",
				      method: "PUT",
				      headers: {
				          "Authorization": "Basic " + new Buffer("QuickloveApp:ccbc38d0-f999-11e7-a2c9-605f5f1f6dd9").toString("base64")
				      }
				};
				var httpreq = https.request(options1, function(httpres) {
				      var str = "";
				      httpres.on("data", function(data){ str += data; });
				      httpres.on("error", function(e){ console.log("error: ",e); });
				      httpres.on("end", function(){ 
				      	  console.log(str);
				          return res.send({
								            "code": 200,
								            "response": (typeof str === 'string') ? JSON.parse(str) : str,
								            "status": 1,
								            "message": 'success'
								        });
				      });
				});
				httpreq.end();
			}
		},userLoginSessionKey);
	})

	/* For User Registration */
	app.post('/user/signup', function (req,res) {
        mobiweb.userSignup(req,res);
	});

	/* For User Login */
	app.post('/user/login', function (req,res) {
        mobiweb.userLogin(req,res);
	});

	/* To verify user account */
	app.post('/user/verify-account', function (req,res) {
        mobiweb.verifyAccount(req,res);
	});

	/* To re-send accout verification code */
	app.post('/user/resend-account-verification-code', function (req,res) {
        mobiweb.resendAccountVerificationCode(req,res);
	});

	/* To forgot password */
	app.post('/user/forgot-password', function (req,res) {
        mobiweb.forgotPassword(req,res);
	});

	/* To verify forgot password code */
	app.post('/user/verify-forgot-password-code', function (req,res) {
        mobiweb.verifyForgotPasswordCode(req,res);
	});

	/* To reset user password */
	app.post('/user/reset-password', function (req,res) {
        mobiweb.resetPassword(req,res);
	});

	/* To re-send forgot password code */
	app.post('/user/resend-forgot-password-code', function (req,res) {
        mobiweb.resendForgotPasswordCode(req,res);
	});

	/* To check social login for new & old users */
	app.post('/user/check-social-login', function (req,res) {
        mobiweb.checkSocialLogin(req,res);
	});

	/* To user social login */
	app.post('/user/social-login', function (req,res) {
        mobiweb.socialLogin(req,res);
	});

	/* To get pages content */
	app.post('/get-content', function (req,res) {
        mobiweb.getContent(req,res);
	});

	/* To view loggedin user profile */
	app.post('/user/view-profile', function (req,res) {
        mobiweb.viewProfile(req,res);
	});

	/* To enable & disable group chat */
	app.post('/user/enable-disable-group-chat', function (req,res) {
		let timezone = req.headers.timezone;
        req.sanitize("userLoginSessionKey").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('isGroupChatEnable', 'The group chat should be 0 Or 1').inList(["0","1"]);
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
			let isGroupChatEnable   = req.sanitize('isGroupChatEnable').escape().trim();

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					res.send(respObj);
					return false;
				}else{
					/* Update user data */
		            var dataObj = {};
		            dataObj.isGroupChatEnable = isGroupChatEnable;
		            model.updateData(function(err,resp){
		                if(err){
		                    res.send(custom.dbErrorResponse());
		                    return false;
		                }else{
		                	/* 0 - disable, 1 - enable */
		                	if(parseInt(isGroupChatEnable) === 0){
		                		var successMsg = 'Group chat disabled successfully.';
		                	}else{
		                		var successMsg = 'Group chat enabled successfully.';
		                	}
		                    res.send({
					            "code": 200,
					            "response": {},
					            "status": 1,
					            "message": successMsg
					        });
					        return false;
		                }
		            },constant.user_details,dataObj,{userId:respObj[0].userId});
				}
			},userLoginSessionKey,timezone);
		}
	});

	/* To set user moods */
	app.post('/user/set-moods', function (req,res) {
		let timezone = req.headers.timezone;
        req.sanitize("userLoginSessionKey").trim();
        req.sanitize("userMood").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('userMood', 'Enter moods').notEmpty();
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
			let userMood            = req.sanitize('userMood').escape().trim();

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					res.send(respObj);
					return false;
				}else{
					/* Update user data */
		            var dataObj = {};
		            dataObj.userMood = userMood;
		            model.updateData(function(err,resp){
		                if(err){
		                    res.send(custom.dbErrorResponse());
		                    return false;
		                }else{
		                    res.send({
					            "code": 200,
					            "response": {},
					            "status": 1,
					            "message": 'User moods added successfully.'
					        });
					        return false;
		                }
		            },constant.user_details,dataObj,{userId:respObj[0].userId});
				}
			},userLoginSessionKey,timezone);
		}
	});

	/* To update user profile */
	app.post('/user/update-profile', function (req,res) {
        mobiweb.updateProfile(req,res);
	});

	/* To verify user social account */
	app.post('/user/verify-social-account', function (req,res) {
        mobiweb.verifySocialAccount(req,res);
	});

	/* To re-send social accout verification code */
	app.post('/user/resend-social-account-verification-code', function (req,res) {
        mobiweb.resendSocialAccountVerificationCode(req,res);
	});

	/* To set user profile image upload template */
	app.get('/user/upload-user-image', function(req, res) {
		res.render('apis/file-upload/user-image')
	});

	/* To upload user profile & cover images */
	app.post('/user/upload-user-image', function(req, res) {
		mobiweb.uploadUserImage(req,res);		
	});

	/* To set user gallery image upload template */
	app.get('/user/upload-gallery-images', function(req, res) {
		res.render('apis/file-upload/gallery-image')
	});

	/* To upload user gallery images */
	app.post('/user/upload-gallery-images', function(req, res) {
		mobiweb.uploadGalleryImage(req,res);		
	});

	/* To get user gallery images */
	app.post('/user/gallery-images-listing', function(req, res) {
		mobiweb.galleryImagesListing(req,res);		
	});

	/* To delete user gallery image */
	app.post('/user/delete-gallery-image', function(req, res) {
		mobiweb.deleteGalleryImage(req,res);		
	});

	/* To manage user settings */
	app.post('/user/manage-settings', function (req,res) {
		let timezone = req.headers.timezone;
        req.sanitize("userLoginSessionKey").trim();
        req.sanitize("settingType").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('settingType', 'Required setting type').notEmpty();
	    req.check('settingType', 'Please select valid setting type').inList(['HIDE_PROVIDER_PROFILE', 'OPEN_FOR_ALL_CALLS','OPEN_FOR_SCHEDULED_CALLS']);
	    req.check('settingValue', 'The setting value should be 0 Or 1').inList(["0","1"]);
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
			let settingType         = req.sanitize('settingType').escape().trim();
			let settingValue        = req.sanitize('settingValue').escape().trim();

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					res.send(respObj);
					return false;
				}else{
					/* Update user data */
		            var dataObj = {};
		            if(settingType === 'HIDE_PROVIDER_PROFILE'){
		            	dataObj.isHideProfileAsProvider = settingValue;
		            }else if(settingType === 'OPEN_FOR_ALL_CALLS'){
		            	dataObj.isOpenForAllCalls = settingValue;
		            }else if(settingType === 'OPEN_FOR_SCHEDULED_CALLS'){
		            	dataObj.isOpenForScheduledCalls = settingValue;
		            }
		            model.updateData(function(err,resp){
		                if(err){
		                    res.send(custom.dbErrorResponse());
		                    return false;
		                }else{
		                    res.send({
					            "code": 200,
					            "response": {},
					            "status": 1,
					            "message": custom.lang(req.headers.locale,'Setting updated successfully.')
					        });
					        return false;
		                }
		            },constant.user_details,dataObj,{userId:respObj[0].userId});
				}
			},userLoginSessionKey,timezone);
		}
	});

	/* To contact us */
	app.post('/user/contact-us', function(req, res) {
		mobiweb.contactUs(req,res);		
	});

	/* To change user password */
	app.post('/user/change-password', function(req, res) {
		mobiweb.changePassword(req,res);		
	});

	/* To user logout */
	app.post('/user/logout', function(req, res) {
		mobiweb.logout(req,res);		
	});

	/* To check social id to verify social accounts */
	app.post('/user/check-social-id-to-verify-social-account', function(req, res) {
		mobiweb.checkSocialIdToVerifySocialAccounts(req,res);		
	});

	/* To verify user social accounts */
	app.post('/user/verify-my-social-accounts', function(req, res) {
		mobiweb.verifyUsersocialAccounts(req,res);		
	});

	/* To verify email id for user social accounts verification */
	app.post('/user/verify-email-for-social-verification', function(req, res) {
		mobiweb.verifyEmailIdForSocialVerification(req,res);		
	});

	/* To re-send code for email id social verification */
	app.post('/user/resend-code-for-emailid-social-verification', function(req, res) {
		mobiweb.resendCodeForEmailIdSocialVerification(req,res);		
	});

	/* To get preferences keywords */
	app.post('/user/get-preferences-keywords', function(req, res) {
		mobiweb.getPreferencesKeywords(req,res);		
	});

	/* To set user preferences */
	app.post('/user/set-preferences', function(req, res) {
		mobiweb.setPreferences(req,res);		
	});

	/* To get user preferences */
	app.post('/user/get-preferences', function(req, res) {
		mobiweb.getPreferences(req,res);		
	});

	/**
	 * To block & unblock user
	 * @param {string} userLoginSessionKey
	 * @param {integer} friendId
	 */
	app.post('/user/block-unblock', function(req, res) {
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
			let friendId = parseInt(req.sanitize('friendId').escape().trim());

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					let masterUserId = parseInt(respObj[0].masterUserId);

					/* Check self block request */
					if(masterUserId === friendId)
					{
						return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'You can not block your self.')
							        });
					}

					/* Get already block details */
					model.getAllWhere(function(err,blockRespObj){
						if(err){
			                return res.send(custom.dbErrorResponse());
			            }else{
			            	if(blockRespObj != ''){

			            		/* Delete request for unblock */
			            		model.deleteData(function(err,resp){
			            			if(err){
						                return res.send(custom.dbErrorResponse());
						            }else{
						            	if(parseInt(resp.affectedRows) > 0){
						            		return res.send({
												            "code": 200,
												            "response": {},
												            "status": 1,
												            "message": custom.lang(locale,'User unblocked successfully.')
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
			            		},constant.block_users,{userBlockId:blockRespObj[0].userBlockId});
			            	}else{

			            		/* Check If Any Job Is Running Between Them */
			            		let jobQuery = "SELECT * FROM "+constant.jobs+" WHERE jobGlobalStatus IN ('PENDING','CANCELED') AND ((jobHirerUserID = "+masterUserId+" AND jobProviderUserID = "+friendId+") OR (jobHirerUserID = "+friendId+" AND jobProviderUserID = "+masterUserId+"))";
			            		model.customQuery(function(err,jobResp){
			            			if(err){
						                return res.send(custom.dbErrorResponse());
						            }else{
						            	if(jobResp != ""){

						            		/* Get Friend Details */
						            		model.getAllWhere(function(err,friendDetails){
						            			if(err){
									                return res.send(custom.dbErrorResponse());
									            }else{
									            	if(friendDetails != ""){
									            		let friendName = friendDetails[0].userFirstName + " " + friendDetails[0].userLastName;
									            		let jobMsg     = custom.lang(locale,'One or more jobs are active with') + " " + friendName + ". " + custom.lang(locale,'Please complete the job first.');
									            		return res.send({
															            "code": 200,
															            "response": {},
															            "status": 0,
															            "message": jobMsg
															        });
									            	}else{
									            		return res.send({
														            "code": 200,
														            "response": {},
														            "status": 0,
														            "message": 'User details not found'
														        });
									            	}
									            }
						            		},constant.user_details,{userId:friendId});
						            	}else{

						            		/* Insert request for block */
						            		let blockObj = {};
						            		blockObj.userBlockUserId   = masterUserId;
						            		blockObj.userBlockFriendId = friendId;
						            		blockObj.userBlockDateTime = custom.getCurrentTime();

						            		model.insertData(function(err,resp){
						            			if(err){
									                return res.send(custom.dbErrorResponse());
									            }else{
									            	if(parseInt(resp.affectedRows) > 0){
									            		return res.send({
															            "code": 200,
															            "response": {},
															            "status": 1,
															            "message": custom.lang(locale,'User blocked successfully.')
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
						            		},constant.block_users,blockObj);
						            	}
						            }
			            		},jobQuery);
			            	}
			            }
					},constant.block_users,{userBlockUserId:masterUserId,userBlockFriendId:friendId});
				}
			},userLoginSessionKey,timezone);
		}
	});

	/**
	 * To get blocked users listing
	 * @param {string} userLoginSessionKey
	 * @param {integer} pageNo
	 */
	app.post('/user/blocked-users', function(req, res) {
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
			let userLoginSessionKey = req.sanitize('userLoginSessionKey').escape().trim();
			let pageNo = parseInt(req.sanitize('pageNo').escape().trim());

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					let masterUserId = parseInt(respObj[0].masterUserId);

					/* To get offset */
			    	let offset = custom.getOffset(pageNo);

					/* get blocked users list */
					var userQuery = "SELECT * FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId` INNER JOIN `block_users` AS `BU` ON `BU`.`userBlockFriendId` = `U`.`masterUserId` WHERE `BU`.`userBlockUserId`= " + masterUserId + " AND `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = 'NORMAL_USER' ORDER BY `UD`.`userFirstName` ASC ";
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
				                		let responseObj = [];
									    for (var i = 0; i < parseInt(usersObj.length); i++) 
									    {
									    	let row = {};
									    	row.masterUserId   = parseInt(usersObj[i].masterUserId);
									    	row.userBlockId    = parseInt(usersObj[i].userBlockId);
									    	row.userEmail      = custom.nullChecker(usersObj[i].userEmail);
									    	row.userFirstName  = custom.nullChecker(usersObj[i].userFirstName);
									    	row.userLastName   = custom.nullChecker(usersObj[i].userLastName);
									    	row.userMood       = custom.nullChecker(usersObj[i].userMood);
									    	row.userOriginalImage   = (usersObj[i].userImage) ? constant.base_url + usersObj[i].userImage : "";
									    	row.userImageThumbnail  = (usersObj[i].userImageThumbnail) ? constant.base_url + usersObj[i].userImageThumbnail : "";
									    	row.userBlockDateTime   = custom.changeDateFormat(usersObj[i].userBlockDateTime,constant.app_date_format);
									    	responseObj.push(row);
									    }
									    return res.send({
											            "code": 200,
											            "response": responseObj,
											            "status": 1,
											            "totalCount":totalUsers,
											            "message": custom.lang(locale,"success")
											        });
				                	}else{
				                		return res.send({
										            "code": 200,
										            "response": [],
										            "status": 0,
										            "message": custom.lang(locale,"No blocked users found.")
										        });
				                	}
				                }
					        },userQuery);
		               	}
		            },userQuery);
			    	
				}
			},userLoginSessionKey,timezone);
		}
	});

	/**
	 * To update device info
	 * @param {string} userLoginSessionKey
	 * @param {string} userDeviceId
	 * @param {string} userDeviceToken
	 * @param {string} userDeviceType
	 */
	app.post('/user/update-device-info', function(req, res) {
		let locale = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("userDeviceId").trim();
		req.sanitize("userDeviceToken").trim();
		req.sanitize("userDeviceType").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('userDeviceId', custom.lang(locale,'Require Device Id')).notEmpty();
	    req.check('userDeviceToken', custom.lang(locale,'Require Device Token')).notEmpty();
	    req.check('userDeviceType', custom.lang(locale,'Require Device Type')).notEmpty();
	    req.check('userDeviceType', custom.lang(locale,'The user device type field must be one of ANDROID,IOS')).inList(['ANDROID', 'IOS']);
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
			let userDeviceId        = req.sanitize('userDeviceId').escape().trim();
			let userDeviceToken     = req.sanitize('userDeviceToken').escape().trim();
			let userDeviceType      = req.sanitize('userDeviceType').escape().trim();

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					let masterUserId = parseInt(respObj[0].masterUserId);
					
					/* Check device id history */
					model.getAllWhere(function(err,deviceResp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(deviceResp != ""){

		                		/* update device info*/
			            		let deviceObj = {};
			            		deviceObj.userDeviceToken    = userDeviceToken;
			            		deviceObj.deviceModifiedDate = custom.getCurrentTime();
			            		model.updateData(function(err,resp){
			            			if(err){
						                return res.send(custom.dbErrorResponse());
						            }else{
						            	return res.send({
											            "code": 200,
											            "response": {},
											            "status": 1,
											            "message": custom.lang(locale,'Device Info updated successfully.')
											        });
						            }
			            		},constant.users_device_history,deviceObj,{userDeviceHistoryId:deviceResp[0].userDeviceHistoryId});
		                	}else{

		                		/* Insert device info*/
			            		let deviceObj = {};
			            		deviceObj.userId             = masterUserId;
			            		deviceObj.userDeviceToken    = userDeviceToken;
			            		deviceObj.userDeviceType     = userDeviceType;
			            		deviceObj.userDeviceId       = userDeviceId;
			            		deviceObj.deviceAddedDate    = custom.getCurrentTime();
			            		deviceObj.deviceModifiedDate = custom.getCurrentTime();
			            		model.insertData(function(err,resp){
			            			if(err){
						                return res.send(custom.dbErrorResponse());
						            }else{
						            	if(parseInt(resp.affectedRows) > 0){
						            		return res.send({
												            "code": 200,
												            "response": {},
												            "status": 1,
												            "message": custom.lang(locale,'Device Info updated successfully.')
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
			            		},constant.users_device_history,deviceObj);
		                	}
		                }
					},constant.users_device_history,{userDeviceId:userDeviceId});					
				}
			},userLoginSessionKey,timezone);
		}
	});

	/**
	 * To get user notifications
	 * @param {string} userLoginSessionKey
	 * @param {integer} pageNo
	 * @param {string} moduleName
	 */
	app.post('/user/notifications', function(req, res) {
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
			let userLoginSessionKey = req.sanitize('userLoginSessionKey').escape().trim();
			let pageNo = parseInt(req.sanitize('pageNo').escape().trim());
			let moduleName = (req.body.moduleName) ? req.body.moduleName : 'FRIENDLY';

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					async.waterfall([
					    function(callback) {
					        let masterUserId = parseInt(respObj[0].masterUserId);
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
									    callback(null, respObj,notInUserIds);
				                	}else{
				                		callback(null, respObj,notInUserIds);
				                	}
				                }
					    	},constant.block_users,{userBlockUserId:masterUserId});
					    }
					], function (err, userDetailsObj,notInUserIds) {

					   	let masterUserId = parseInt(userDetailsObj[0].masterUserId);

						/* To get offset */
				    	let offset = custom.getOffset(pageNo);

						/* Get notification */
						var myQuery = 'SELECT * FROM `notifications` AS `N` INNER JOIN `user_details` AS `UD` ON `N`.`notificationUserId` = `UD`.`userId` WHERE `N`.`notificationUserId` NOT IN ('+notInUserIds.join()+') AND `N`.`notificationFriendId` = '+masterUserId+' AND `N`.`notificationModule` = "' + moduleName + '" ORDER BY `N`.`notificationId` DESC'
						model.customQuery(function(err,notificationObj){
				    		if(err){
			                    return res.send(custom.dbErrorResponse());
			                }else{
			                	let totalNotifications = parseInt(notificationObj.length);

								if(offset > 0){
						    		myQuery += " LIMIT " + offset + "," + constant.results_limit;
						    	}else{
						    		myQuery += " LIMIT " + constant.results_limit
						    	}
								model.customQuery(function(err,notificationsRespObj){
									if(err){
					                    return res.send(custom.dbErrorResponse());
					                }else{
					                	if(notificationsRespObj != ""){
					                		let moment = require('moment');
					                		let responseObj = [];
										    
										    async.waterfall([
									            function(callback) {
									            	var inserted = 0;
									                for (var i = 0; i < parseInt(notificationsRespObj.length); i++) 
									                {
									                    let row = {};
												    	let notificationDetails = {};
												    	let notificationType    = notificationsRespObj[i].notificationType;
												    	let actionStatus        = custom.nullChecker(notificationsRespObj[i].actionStatus);
												    	let friendModuleId      = notificationsRespObj[i].friendModuleId;
												    	let callScheduleModuleID = notificationsRespObj[i].callScheduleModuleID;
												    	let callHistoryModuleID  = notificationsRespObj[i].callHistoryModuleID;
												    	let dateScheduleModuleID = notificationsRespObj[i].dateScheduleModuleID;
												    	let jobModuleID          = notificationsRespObj[i].jobModuleID;
												    	let orderModuleID        = notificationsRespObj[i].orderModuleID;
												    	let reportModuleID       = notificationsRespObj[i].reportModuleID;
												    	let txnModuleID          = notificationsRespObj[i].txnModuleID;
												    	let contactModuleId      = notificationsRespObj[i].contactModuleId;
												    	let notificationParams   = (!notificationsRespObj[i].notificationParams) ? {} : JSON.parse(notificationsRespObj[i].notificationParams);
												    	let l = custom.changeDateFormat(notificationsRespObj[i].notificationSentTime);
												    	row.notificationId       = parseInt(notificationsRespObj[i].notificationId);
												    	row.notificationUserId   = parseInt(notificationsRespObj[i].notificationUserId);
												    	row.notificationFriendId = parseInt(notificationsRespObj[i].notificationFriendId);
												    	row.notificationType     = custom.nullChecker(notificationsRespObj[i].notificationType);
												    	row.notificationSentTime = custom.nullChecker(l);
												    	row.notificationParams   = notificationParams;
												    	row.userFirstName        = custom.nullChecker(notificationsRespObj[i].userFirstName);
												    	row.actionStatus         = custom.nullChecker(notificationsRespObj[i].actionStatus);
												    	row.userLastName         = custom.nullChecker(notificationsRespObj[i].userLastName);
												    	if(notificationType === 'SCHEDULED_DATE_REVIEW_REMINDER' || notificationType === 'SCHEDULED_CALL_REMINDER' || notificationType === 'SCHEDULED_DATING_REMINDER'){
												    		row.notificationMessage  = custom.nullChecker(notificationsRespObj[i].notificationMessage + " " + notificationsRespObj[i].userFirstName + " " + notificationsRespObj[i].userLastName);
												    	}else if(notificationType === 'COMPLETED_10_JOBS' || notificationType === 'COMPLETED_5_DATES' || notificationType === 'REPORT_FLAG' || notificationType === 'PURCHASE_MEMBERSHIP' || notificationType === 'TXN_DISPUTE' || notificationType === 'TXN_DISPUTE_REQUEST_REJECTED' || notificationType === 'TXN_DISPUTE_AMOUNT_REFUNDED' || notificationType === 'CONTACT_US_REPLY' || notificationType === 'ADMIN_NOTIFICATION'){
												    		row.notificationMessage  = custom.nullChecker(notificationsRespObj[i].notificationMessage);
												    	}else if(notificationType === 'SCHEDULE_CALL' && actionStatus === 'PENDING'){
												    		row.notificationMessage  = custom.nullChecker(notificationsRespObj[i].userFirstName) + " " + custom.nullChecker(notificationsRespObj[i].userLastName) + " has sent you a schedule call request.";
												    	}else if(notificationType === 'SCHEDULE_CALL' && actionStatus === 'ACCEPT'){
												    		row.notificationMessage  = "Your call has been scheduled with " + custom.nullChecker(notificationsRespObj[i].userFirstName) + " " + custom.nullChecker(notificationsRespObj[i].userLastName);
												    	}else if(notificationType === 'ACCPET_SCHEDULED_CALL'){
												    		row.notificationMessage  = "Your call has been scheduled with " + custom.nullChecker(notificationsRespObj[i].userFirstName) + " " + custom.nullChecker(notificationsRespObj[i].userLastName);
												    	}else if(notificationType === 'SCHEDULE_CALL' && actionStatus === 'REJECT'){
												    		row.notificationMessage  = "You have rejected scheduled call request of " + custom.nullChecker(notificationsRespObj[i].userFirstName) + " " + custom.nullChecker(notificationsRespObj[i].userLastName);
												    	}else if(notificationType === 'REJECT_SCHEDULED_CALL'){
												    		row.notificationMessage  = custom.nullChecker(notificationsRespObj[i].userFirstName) + " " + custom.nullChecker(notificationsRespObj[i].userLastName) + " has rejected your schedule call request.";
												    	}else if(notificationType === 'COMPLETED_JOB'){
												    		row.notificationMessage  = 'Congrats, '+custom.nullChecker(notificationsRespObj[i].userFirstName) + " " + custom.nullChecker(notificationsRespObj[i].userLastName) + " has completed the";
												    	}else{
												    		row.notificationMessage  = custom.nullChecker(notificationsRespObj[i].userFirstName) + " " + custom.nullChecker(notificationsRespObj[i].userLastName) + " " + custom.nullChecker(notificationsRespObj[i].notificationMessage);
												    	}
												    	if(notificationType === 'TXN_DISPUTE_REQUEST_REJECTED' || notificationType === 'TXN_DISPUTE_AMOUNT_REFUNDED'){
												    		row.userImage            = constant.base_url + constant.logo_path;
												    		row.userImageThumbnail   = constant.base_url + constant.logo_path;
												    	}else{
												    		row.userImage            = (!notificationsRespObj[i].userImage) ? '' : constant.base_url + notificationsRespObj[i].userImage;
												    		row.userImageThumbnail   = (!notificationsRespObj[i].userImageThumbnail) ? '' : constant.base_url + notificationsRespObj[i].userImageThumbnail;
												    	}
												    	row.timeAgo = custom.nullChecker(moment([l]).fromNow());
									                    (function(i,notificationType,friendModuleId,callScheduleModuleID,callHistoryModuleID,dateScheduleModuleID,jobModuleID,orderModuleID,reportModuleID,notificationParams,txnModuleID,contactModuleId) {
									                        if(notificationType === 'SEND_FRIEND_REQUEST' || notificationType === 'ACCEPT_FRIEND_REQUEST'){

													    		/* Check user is already friend or pending request */
										                        let friendQuery = 'SELECT * FROM ' + constant.friends + ' WHERE `masterFriendId` = ' + friendModuleId;
										                        database.getConn(friendQuery, function (err, friendRespObj) {
										                            if(err){
										                                return callback(err,friendRespObj);
										                            }else{
										                                if(friendRespObj != "")
										                                {
										                                    notificationDetails.friendModuleId = custom.nullChecker(friendRespObj[0].masterFriendId);
												                			notificationDetails.friendStatus   = custom.nullChecker(friendRespObj[0].friendStatus);
												                			notificationDetails.friendNote     = custom.nullChecker(friendRespObj[0].friendNote);
										                                }
										                                row.details = notificationDetails;
										                                responseObj.push(row);
										                            }
										                            if (++inserted === parseInt(notificationsRespObj.length)) {
										                              callback(null, responseObj);
										                            }
										                        });
													    	}else if(notificationType === 'SCHEDULE_CALL' || notificationType === 'ACCPET_SCHEDULED_CALL' || notificationType === 'REJECT_SCHEDULED_CALL' || notificationType === 'CANCEL_SCHEDULED_CALL' || notificationType === 'RE_SCHEDULE_CALL' || notificationType === 'SCHEDULED_CALL_REMINDER'){

													    		/* Get scheduled calls details */
										                        let callScheduleQuery = 'SELECT * FROM ' + constant.schedule_calls + ' WHERE `callScheduleID` = ' + callScheduleModuleID;
										                        database.getConn(callScheduleQuery, function (err, callScheduleRespObj) {
										                            if(err){
										                                return callback(err,callScheduleRespObj);
										                            }else{
										                                if(callScheduleRespObj != "")
										                                {
												                			notificationDetails.callScheduleModuleID     = (callScheduleRespObj[0].callScheduleID) ? parseInt(callScheduleRespObj[0].callScheduleID) : 0;
												                			notificationDetails.callScheduleModuleName   = custom.nullChecker(callScheduleRespObj[0].callScheduleModuleName);
												                			notificationDetails.callScheduleUserID       = (callScheduleRespObj[0].callScheduleUserID) ? parseInt(callScheduleRespObj[0].callScheduleUserID) : 0;
												                			notificationDetails.callScheduleFriendID     = (callScheduleRespObj[0].callScheduleFriendID) ? parseInt(callScheduleRespObj[0].callScheduleFriendID) : 0;
												                			notificationDetails.isCallRescheduled        = (callScheduleRespObj[0].isCallRescheduled) ? parseInt(callScheduleRespObj[0].isCallRescheduled) : 0;
												                			notificationDetails.callScheduleDate         = custom.nullChecker(custom.changeDateFormat(callScheduleRespObj[0].callScheduleDate,'yyyy-mm-dd'));
												                			notificationDetails.callScheduleTime         = custom.nullChecker(callScheduleRespObj[0].callScheduleTime);
												                			notificationDetails.callGlobalStatus         = custom.nullChecker(callScheduleRespObj[0].callGlobalStatus);
												                			notificationDetails.callNote                 = custom.nullChecker(callScheduleRespObj[0].callNote);
												                			notificationDetails.callScheduleUserStatus   = custom.nullChecker(callScheduleRespObj[0].callScheduleUserStatus);
												                			notificationDetails.callScheduleFriendStatus = custom.nullChecker(callScheduleRespObj[0].callScheduleFriendStatus);
												                			notificationDetails.isScheduledCallMutuallyConfirmed = (callScheduleRespObj[0].isScheduledCallMutuallyConfirmed) ? parseInt(callScheduleRespObj[0].isScheduledCallMutuallyConfirmed) : 0;
												                			notificationDetails.userCallRequestTime      = custom.nullChecker(custom.changeDateFormat(callScheduleRespObj[0].userCallRequestTime));
										                                }
										                                row.details = notificationDetails;
										                                responseObj.push(row);
										                            }
										                            if (++inserted === parseInt(notificationsRespObj.length)) {
										                              callback(null, responseObj);
										                            }
										                        });
													    	}else if(notificationType === 'USER_CALL_REVIEW'){

													    		/* Get call history details */
										                        let callHistoryQuery = 'SELECT * FROM ' + constant.call_history + ' WHERE `callHistoryID` = ' + callHistoryModuleID;
										                        database.getConn(callHistoryQuery, function (err, callHistoryRespObj) {
										                            if(err){
										                                return callback(err,callHistoryRespObj);
										                            }else{
										                                if(callHistoryRespObj != "")
										                                {
												                			notificationDetails.callHistoryModuleID      = (callHistoryRespObj[0].callHistoryID) ? parseInt(callHistoryRespObj[0].callHistoryID) : 0;
												                			notificationDetails.callHistoryModuleName    = custom.nullChecker(callHistoryRespObj[0].callHistoryModuleName);
												                			notificationDetails.callSenderUserID         = (callHistoryRespObj[0].callSenderUserID) ? parseInt(callHistoryRespObj[0].callSenderUserID) : 0;
												                			notificationDetails.callRecieverUserID       = (callHistoryRespObj[0].callRecieverUserID) ? parseInt(callHistoryRespObj[0].callRecieverUserID) : 0;
												                			notificationDetails.isGroupCall              = (callHistoryRespObj[0].isGroupCall) ? parseInt(callHistoryRespObj[0].isGroupCall) : 0;
												                			notificationDetails.callInitiateTime         = custom.nullChecker(custom.changeDateFormat(callHistoryRespObj[0].callInitiateTime,'yyyy-mm-dd'));
												                			notificationDetails.callDuration             = (callHistoryRespObj[0].callDuration) ? parseInt(callHistoryRespObj[0].callDuration) : 0; // In Seconds
												                			notificationDetails.IsSenderCallReviewDone   = (callHistoryRespObj[0].IsSenderCallReviewDone) ? parseInt(callHistoryRespObj[0].IsSenderCallReviewDone) : 0;
												                			notificationDetails.IsRecieverCallReviewDone = (callHistoryRespObj[0].IsRecieverCallReviewDone) ? parseInt(callHistoryRespObj[0].IsRecieverCallReviewDone) : 0;
												                			notificationDetails.senderCallReview         = (callHistoryRespObj[0].senderCallReview) ? parseInt(callHistoryRespObj[0].senderCallReview) : 0;
												                			notificationDetails.recieverCallReview       = (callHistoryRespObj[0].recieverCallReview) ? parseInt(callHistoryRespObj[0].recieverCallReview) : 0;
												                			notificationDetails.senderCallReviewMessage  = custom.nullChecker(callHistoryRespObj[0].senderCallReviewMessage);
												                			notificationDetails.recieverCallReviewMessage= custom.nullChecker(callHistoryRespObj[0].recieverCallReviewMessage);
												                			notificationDetails.callStatus               = custom.nullChecker(callHistoryRespObj[0].callStatus);
										                                }
										                                row.details = notificationDetails;
										                                responseObj.push(row);
										                            }
										                            if (++inserted === parseInt(notificationsRespObj.length)) {
										                              callback(null, responseObj);
										                            }
										                        });
													    	}else if(notificationType === 'SCHEDULE_DATE' || notificationType === 'ACCPET_SCHEDULED_DATE' || notificationType === 'REJECT_SCHEDULED_DATE' || notificationType === 'CANCEL_SCHEDULED_DATE' || notificationType === 'RE_SCHEDULE_DATE' || notificationType === 'USER_DATE_REVIEW' || notificationType === 'SCHEDULED_DATE_REVIEW_REMINDER' || notificationType === 'SCHEDULED_DATING_REMINDER'){

													    		/* Get scheduled dates details */
										                        let callScheduleQuery = 'SELECT * FROM ' + constant.schedule_dating + ' WHERE `datingScheduleID` = ' + dateScheduleModuleID;
										                        database.getConn(callScheduleQuery, function (err, dateScheduleRespObj) {
										                            if(err){
										                                return callback(err,dateScheduleRespObj);
										                            }else{
										                                if(dateScheduleRespObj != "")
										                                {
												                			notificationDetails.dateScheduleModuleID             = (dateScheduleRespObj[0].datingScheduleID) ? parseInt(dateScheduleRespObj[0].datingScheduleID) : 0;
												                			notificationDetails.datingScheduleModuleName         = custom.nullChecker(dateScheduleRespObj[0].datingScheduleModuleName);
												                			notificationDetails.datingScheduleUserID             = (dateScheduleRespObj[0].datingScheduleUserID) ? parseInt(dateScheduleRespObj[0].datingScheduleUserID) : 0;
												                			notificationDetails.datingScheduleFriendID           = (dateScheduleRespObj[0].datingScheduleFriendID) ? parseInt(dateScheduleRespObj[0].datingScheduleFriendID) : 0;
												                			notificationDetails.isDateRescheduled                = (dateScheduleRespObj[0].isDateRescheduled) ? parseInt(dateScheduleRespObj[0].isDateRescheduled) : 0;
												                			notificationDetails.datingScheduleDate               = custom.nullChecker(custom.changeDateFormat(dateScheduleRespObj[0].datingScheduleDate,'yyyy-mm-dd'));
												                			notificationDetails.datingScheduleTime               = custom.nullChecker(dateScheduleRespObj[0].datingScheduleTime) + ":00";
												                			notificationDetails.datingLocation                   = custom.nullChecker(dateScheduleRespObj[0].datingLocation);
												                			notificationDetails.datingLocationLatitude           = custom.nullChecker(dateScheduleRespObj[0].datingLocationLatitude);
												                			notificationDetails.datingLocationLongitude          = custom.nullChecker(dateScheduleRespObj[0].datingLocationLongitude);
												                			notificationDetails.datingAfterMath                  = custom.nullChecker(dateScheduleRespObj[0].datingAfterMath);
												                			notificationDetails.datingGlobalStatus               = custom.nullChecker(dateScheduleRespObj[0].datingGlobalStatus);
												                			notificationDetails.datingScheduleUserStatus         = custom.nullChecker(dateScheduleRespObj[0].datingScheduleUserStatus);
												                			notificationDetails.datingScheduleFriendStatus       = custom.nullChecker(dateScheduleRespObj[0].datingScheduleFriendStatus);
												                			notificationDetails.datesNote                        = custom.nullChecker(dateScheduleRespObj[0].datesNote);
												                			notificationDetails.isScheduledDateMutuallyConfirmed = (dateScheduleRespObj[0].isScheduledDateMutuallyConfirmed) ? parseInt(dateScheduleRespObj[0].isScheduledDateMutuallyConfirmed) : 0;
												                			notificationDetails.IsSenderDatingReviewDone         = (dateScheduleRespObj[0].IsSenderDatingReviewDone) ? parseInt(dateScheduleRespObj[0].IsSenderDatingReviewDone) : 0;
												                			notificationDetails.IsRecieverDatingReviewDone       = (dateScheduleRespObj[0].IsRecieverDatingReviewDone) ? parseInt(dateScheduleRespObj[0].IsRecieverDatingReviewDone) : 0;
												                			notificationDetails.senderDatingReview               = (dateScheduleRespObj[0].senderDatingReview) ? parseInt(dateScheduleRespObj[0].senderDatingReview) : 0;
												                			notificationDetails.recieverDatingReview             = (dateScheduleRespObj[0].recieverDatingReview) ? parseInt(dateScheduleRespObj[0].recieverDatingReview) : 0;
												                			notificationDetails.senderDatingReviewMessage        = custom.nullChecker(dateScheduleRespObj[0].senderDatingReviewMessage);
												                			notificationDetails.recieverDatingReviewMessage      = custom.nullChecker(dateScheduleRespObj[0].recieverDatingReviewMessage);
												                			notificationDetails.userDateRequestTime      	     = custom.nullChecker(custom.changeDateFormat(dateScheduleRespObj[0].userDateRequestTime));
										                                }
										                                row.details = notificationDetails;
										                                responseObj.push(row);
										                            }
										                            if (++inserted === parseInt(notificationsRespObj.length)) {
										                              callback(null, responseObj);
										                            }
										                        });
													    	}else if(notificationType === 'HIRE_PROVIDER' || notificationType === 'MODIFY_JOB' || notificationType === 'ACCEPT_JOB' || notificationType === 'COMPLETED_JOB' || notificationType === 'RELEASE_JOB_MILESTONE' || notificationType === 'CANCEL_JOB' || notificationType === 'ACCEPT_JOB_PAST_START_DATE' || notificationType === 'DISPUTE_JOB' || notificationType === 'MUTUALLY_CANCEL_JOB' || notificationType === 'REJECT_CANCEL_JOB' || notificationType === 'ACCEPT_CANCEL_JOB' || notificationType === 'MUTUALLY_CANCEL_JOB_ACCEPTED' || notificationType === 'MUTUALLY_CANCEL_JOB_REJECTED'){

													    		/* Get job history details */
										                        let jobQuery = 'SELECT * FROM ' + constant.jobs + ' WHERE `jobID` = ' + jobModuleID;
										                        database.getConn(jobQuery, function (err, jobDetailsObj) {
										                            if(err){
										                                return callback(err,jobDetailsObj);
										                            }else{
										                                if(jobDetailsObj != "")
										                                {
												                			notificationDetails.jobID             = parseInt(jobDetailsObj[0].jobID);
												                			notificationDetails.jobCustomID       = custom.nullChecker(jobDetailsObj[0].jobCustomID);
												                			notificationDetails.jobHirerUserID    = custom.nullChecker(jobDetailsObj[0].jobHirerUserID);
												                			notificationDetails.jobProviderUserID = custom.nullChecker(jobDetailsObj[0].jobProviderUserID);
												                			notificationDetails.jobTitle          = custom.nullChecker(jobDetailsObj[0].jobTitle);
												                			notificationDetails.jobDescprition    = custom.nullChecker(jobDetailsObj[0].jobDescprition);
												                			notificationDetails.jobMode           = custom.nullChecker(jobDetailsObj[0].jobMode);
												                			notificationDetails.jobAddress        = custom.nullChecker(jobDetailsObj[0].jobAddress);
												                			notificationDetails.jobLatitude       = custom.nullChecker(jobDetailsObj[0].jobLatitude);
												                			notificationDetails.jobLongitude      = custom.nullChecker(jobDetailsObj[0].jobLongitude);
												                			notificationDetails.jobStartDate      = custom.nullChecker(jobDetailsObj[0].jobStartDate);
												                			notificationDetails.jobEndDate        = custom.nullChecker(jobDetailsObj[0].jobEndDate);
												                			notificationDetails.jobPaymentMethod  = custom.nullChecker(jobDetailsObj[0].jobPaymentMethod);
												                			notificationDetails.jobAgreedAmount   = parseInt(jobDetailsObj[0].jobAgreedAmount);
												                			notificationDetails.jobAdvanceAmount  = parseInt(jobDetailsObj[0].jobAdvanceAmount);
												                			notificationDetails.jobHireDateTime   = custom.changeDateFormat(jobDetailsObj[0].jobHireDateTime);
												                			notificationDetails.jobGlobalStatus   = custom.nullChecker(jobDetailsObj[0].jobGlobalStatus);
												                			notificationDetails.jobAcceptStatus   = custom.nullChecker(jobDetailsObj[0].jobAcceptStatus);
												                			notificationDetails.jobDisputed       = parseInt(jobDetailsObj[0].jobDisputed);
												                			notificationDetails.jobDisputeStatus  = custom.nullChecker(jobDetailsObj[0].jobDisputeStatus);
												                			notificationDetails.jobCancelReason   = custom.nullChecker(jobDetailsObj[0].jobCancelReason);
												                			if(notificationType === 'HIRE_PROVIDER' || notificationType === 'RELEASE_JOB_MILESTONE'){
												                				row.notificationMessage += " "+custom.nullChecker(jobDetailsObj[0].jobTitle);
												                			}else if(notificationType === 'COMPLETED_JOB'){
												                				row.notificationMessage += " "+custom.nullChecker(jobDetailsObj[0].jobTitle)+" job.";
												                			}
										                                }
										                                row.details = notificationDetails;
										                                responseObj.push(row);
										                            }
										                            if (++inserted === parseInt(notificationsRespObj.length)) {
										                              callback(null, responseObj);
										                            }
										                        });
													    	}else if(notificationType === 'PURCHASE_PRODUCT'){

													    		/* Get order history details */
										                        let orderQuery = 'SELECT * FROM ' + constant.orders + ' AS `O` INNER JOIN ' + constant.order_products + ' AS `OP` ON `O`.`orderID` = `OP`.`orderParentID` WHERE `O`.`orderID` = ' + orderModuleID;
										                        database.getConn(orderQuery, function (err, orderDetailsObj) {
										                            if(err){
										                                return callback(err,orderDetailsObj);
										                            }else{
										                                if(orderDetailsObj != "")
										                                {
												                			notificationDetails.orderID                 = parseInt(orderDetailsObj[0].orderID);
												                			notificationDetails.orderCustomID           = custom.nullChecker(orderDetailsObj[0].orderCustomID);
												                			notificationDetails.orderUserID             = parseInt(orderDetailsObj[0].orderUserID);
												                			notificationDetails.orderProductOwnerUserID = parseInt(orderDetailsObj[0].orderProductOwnerUserID);
												                			notificationDetails.orderTotalAmount        = custom.parseNumber(orderDetailsObj[0].orderTotalAmount);
												                			notificationDetails.orderProviderAmount     = custom.parseNumber(orderDetailsObj[0].orderProviderAmount);
												                			notificationDetails.orderFullName           = custom.nullChecker(orderDetailsObj[0].orderFullName);
												                			notificationDetails.orderContactNo          = custom.nullChecker(orderDetailsObj[0].orderContactNo);
												                			notificationDetails.orderShippingAddress    = custom.nullChecker(orderDetailsObj[0].orderShippingAddress);
												                			notificationDetails.orderLandmark           = custom.nullChecker(orderDetailsObj[0].orderLandmark);
												                			notificationDetails.orderCity               = custom.nullChecker(orderDetailsObj[0].orderCity);
												                			notificationDetails.orderState              = custom.nullChecker(orderDetailsObj[0].orderState);
												                			notificationDetails.orderCountry            = custom.nullChecker(orderDetailsObj[0].orderCountry);
												                			notificationDetails.orderZipCode            = custom.nullChecker(orderDetailsObj[0].orderZipCode);
												                			notificationDetails.orderDateTime           = custom.changeDateFormat(orderDetailsObj[0].orderDateTime);
												                			notificationDetails.orderPaymentGatewayAmount = custom.nullChecker(orderDetailsObj[0].orderPaymentGatewayAmount);
												                			notificationDetails.orderWalletAmount         = custom.nullChecker(orderDetailsObj[0].orderWalletAmount);
												                			notificationDetails.orderPaymentDateTime      = (!orderDetailsObj[0].orderPaymentDateTime) ? '' : custom.changeDateFormat(orderDetailsObj[0].orderPaymentDateTime);
												                			notificationDetails.orderPaymentStatus        = custom.nullChecker(orderDetailsObj[0].orderPaymentStatus);
												                			notificationDetails.orderPaymentTxnID         = custom.nullChecker(orderDetailsObj[0].orderPaymentTxnID);
												                			notificationDetails.orderProductName          = custom.nullChecker(orderDetailsObj[0].orderProductName);
												                			notificationDetails.orderProductPrice         = custom.parseNumber(orderDetailsObj[0].orderProductPrice);
												                			notificationDetails.orderProductDescprition   = custom.nullChecker(orderDetailsObj[0].orderProductDescprition);
										                                }
										                                row.details = notificationDetails;
										                                responseObj.push(row);
										                            }
										                            if (++inserted === parseInt(notificationsRespObj.length)) {
										                              callback(null, responseObj);
										                            }
										                        });
													    	}else if(notificationType === 'REPORT_FLAG' || notificationType === 'ADMIN_REMOVE_RED_FLAG'){

													    		/* Get report flag details */
										                        let reportQuery = 'SELECT * FROM ' + constant.report_users + ' AS `R` INNER JOIN ' + constant.user_details + ' AS `UD` ON `R`.`userReportUserId` = `UD`.`userId` WHERE `R`.`userReportId` = ' + reportModuleID;
										                        database.getConn(reportQuery, function (err, reportDetailsObj) {
										                            if(err){
										                                return callback(err,reportDetailsObj);
										                            }else{
										                                if(reportDetailsObj != "")
										                                {
												                			notificationDetails.userReportId             = parseInt(reportDetailsObj[0].userReportId);
												                			notificationDetails.isAdminRemovedRedFlag    = parseInt(reportDetailsObj[0].isAdminRemovedRedFlag);
												                			notificationDetails.userReportUserId         = parseInt(reportDetailsObj[0].userReportUserId);
												                			notificationDetails.userReportFriendId       = parseInt(reportDetailsObj[0].userReportFriendId);
												                			notificationDetails.userReportCategory       = custom.nullChecker(reportDetailsObj[0].userReportCategory);
												                			notificationDetails.userReportDescprition    = custom.nullChecker(reportDetailsObj[0].userReportDescprition);
												                			notificationDetails.adminRemoveReportFlagReason = custom.nullChecker(reportDetailsObj[0].adminRemoveReportFlagReason);
												                			notificationDetails.userReportImage          = (!reportDetailsObj[0].userReportImage) ? new Array() : JSON.parse(reportDetailsObj[0].userReportImage);
												                			notificationDetails.userReportImageThumbnail = (!reportDetailsObj[0].userReportImageThumbnail) ? new Array() : JSON.parse(reportDetailsObj[0].userReportImageThumbnail);
												                			notificationDetails.userReportDateTime       = (!reportDetailsObj[0].userReportDateTime) ? '' : custom.changeDateFormat(reportDetailsObj[0].userReportDateTime);
												                			notificationDetails.adminRemoveReportFlagDateTime = (!reportDetailsObj[0].adminRemoveReportFlagDateTime) ? '' : custom.changeDateFormat(reportDetailsObj[0].adminRemoveReportFlagDateTime);
										                                }
										                                row.details = notificationDetails;
										                                responseObj.push(row);
										                            }
										                            if (++inserted === parseInt(notificationsRespObj.length)) {
										                              callback(null, responseObj);
										                            }
										                        });
													    	}else if(notificationType === 'USER_JOB_REVIEW'){

													    		/* Get review details */
										                        let reviewQuery = 'SELECT * FROM ' + constant.jobs_review + ' AS `JR` INNER JOIN ' + constant.user_details + ' AS `UD` ON `JR`.`jobReviewUserID` = `UD`.`userId` INNER JOIN ' + constant.jobs + ' AS `J` ON `J`.`jobID` = `JR`.`jobReviewParentID` WHERE `JR`.`jobReviewUserID` != ' + masterUserId + ' AND `JR`.`jobReviewParentID` = ' + jobModuleID;
										                        database.getConn(reviewQuery, function (err, reviewDetailsQuery) {
										                            if(err){
										                                return callback(err,reviewDetailsQuery);
										                            }else{
										                                if(reviewDetailsQuery != "")
										                                {
												                			notificationDetails.jobTitle                = custom.nullChecker(reviewDetailsQuery[0].jobTitle);
												                			notificationDetails.jobDescprition          = custom.nullChecker(reviewDetailsQuery[0].jobDescprition);
												                			notificationDetails.jobID                   = parseInt(reviewDetailsQuery[0].jobID);
												                			notificationDetails.jobReviewID             = parseInt(reviewDetailsQuery[0].jobReviewID);
												                			notificationDetails.jobReviewUserID         = parseInt(reviewDetailsQuery[0].jobReviewUserID);
												                			notificationDetails.jobReviewParentID       = parseInt(reviewDetailsQuery[0].jobReviewParentID);
												                			notificationDetails.jobReviewRating         = parseInt(reviewDetailsQuery[0].jobReviewRating);
												                			notificationDetails.jobReviewMessage        = custom.nullChecker(reviewDetailsQuery[0].jobReviewMessage);
												                			notificationDetails.jobReviewDateTime       = custom.changeDateFormat(reviewDetailsQuery[0].jobReviewDateTime);
										                                }
										                                row.details = notificationDetails;
										                                responseObj.push(row);
										                            }
										                            if (++inserted === parseInt(notificationsRespObj.length)) {
										                              callback(null, responseObj);
										                            }
										                        });
													    	}else if(notificationType === 'COMPLETED_10_JOBS' || notificationType === 'COMPLETED_5_DATES' || notificationType === 'PURCHASE_MEMBERSHIP' || notificationType === 'ADMIN_NOTIFICATION'){
													    		row.details = notificationParams;
										                        responseObj.push(row);
										                        if (++inserted === parseInt(notificationsRespObj.length)) {
									                              callback(null, responseObj);
									                            }
													    	}else if(notificationType === 'TXN_DISPUTE' || notificationType === 'TXN_DISPUTE_REQUEST_REJECTED' || notificationType === 'TXN_DISPUTE_AMOUNT_REFUNDED'){

													    		/* Get transaction details */
										                        let txnQuery = 'SELECT * FROM ' + constant.transactions + ' AS `T` INNER JOIN ' + constant.txn_disputes + ' AS `TD` ON `T`.`transactionID` = `TD`.`disputeTxnID` WHERE `T`.`transactionID` = ' + txnModuleID;
										                        database.getConn(txnQuery, function (err, txnDetailsResp) {
										                            if(err){
										                                return callback(err,txnDetailsResp);
										                            }else{
										                                if(txnDetailsResp != "")
										                                {
												                			notificationDetails.transactionID            = parseInt(txnDetailsResp[0].transactionID);
												                			notificationDetails.disputeID                = parseInt(txnDetailsResp[0].disputeID);
												                			notificationDetails.transactionUserID        = parseInt(txnDetailsResp[0].transactionUserID);
												                			notificationDetails.transactionCustomID      = custom.nullChecker(txnDetailsResp[0].transactionCustomID);
												                			notificationDetails.transactionAmount        = custom.parseNumber(txnDetailsResp[0].transactionAmount);
												                			notificationDetails.transactionStatus        = custom.nullChecker(txnDetailsResp[0].transactionStatus);
												                			notificationDetails.transactionModuleName    = custom.nullChecker(txnDetailsResp[0].transactionModuleName);
												                			notificationDetails.transactionMessage       = custom.nullChecker(txnDetailsResp[0].transactionMessage);
												                			notificationDetails.transactionDisputed      = parseInt(txnDetailsResp[0].transactionDisputed);
												                			notificationDetails.transactionDisputeStatus = custom.nullChecker(txnDetailsResp[0].transactionDisputeStatus);
												                			notificationDetails.disputeStatus            = custom.nullChecker(txnDetailsResp[0].disputeStatus);
												                			notificationDetails.disputeReason            = custom.nullChecker(txnDetailsResp[0].disputeReason);
												                			notificationDetails.disputeDateTime          = custom.changeDateFormat(txnDetailsResp[0].disputeDateTime);
												                			notificationDetails.transactionDateTime      = custom.changeDateFormat(txnDetailsResp[0].transactionDateTime);
												                			notificationDetails.disputeResponseDateTime  = (!txnDetailsResp[0].disputeResponseDateTime) ? '' : custom.changeDateFormat(txnDetailsResp[0].disputeResponseDateTime);
												                			notificationDetails.disputeExtraParams       = (!txnDetailsResp[0].disputeExtraParams) ? {} : JSON.parse(txnDetailsResp[0].disputeExtraParams);
										                                }
										                                row.details = notificationDetails;
										                                responseObj.push(row);
										                            }
										                            if (++inserted === parseInt(notificationsRespObj.length)) {
										                              callback(null, responseObj);
										                            }
										                        });
													    	}else if(notificationType === 'CONTACT_US_REPLY'){

													    		/* Get contact details */
										                        let contactQuery = 'SELECT * FROM ' + constant.contact_us + ' WHERE contactId = ' + contactModuleId ;
										                        database.getConn(contactQuery, function (err, contactDetails) {
										                            if(err){
										                                return callback(err,contactDetails);
										                            }else{
										                                if(contactDetails != "")
										                                {
												                			notificationDetails.contactId        = parseInt(contactDetails[0].contactId);
																	    	notificationDetails.contactPhone     = custom.nullChecker(contactDetails[0].contactPhone);
																	    	notificationDetails.contactMessage   = custom.nullChecker(contactDetails[0].contactMessage);
																	    	notificationDetails.contactSubject   = custom.nullChecker(contactDetails[0].contactSubject);
																	    	notificationDetails.isRepliedByAdmin = custom.nullChecker(contactDetails[0].isRepliedByAdmin);
																	    	notificationDetails.contactDateTime  = custom.changeDateFormat(contactDetails[0].contactDateTime,constant.admin_date_format);
																	    	notificationDetails.replyMessage     = custom.nullChecker(contactDetails[0].replyMessage);
																	    	notificationDetails.replyDateTime    = (contactDetails[0].replyDateTime) ? custom.changeDateFormat(contactDetails[0].replyDateTime,constant.admin_date_format) : '';
										                                }
										                                row.details = notificationDetails;
										                                responseObj.push(row);
										                            }
										                            if (++inserted === parseInt(notificationsRespObj.length)) {
										                              callback(null, responseObj);
										                            }
										                        });
													    	}else{
													    		if (++inserted === parseInt(notificationsRespObj.length)) {
									                              callback(null, responseObj);
									                            }
													    	}
									                    })(i,notificationType,friendModuleId,callScheduleModuleID,callHistoryModuleID,dateScheduleModuleID,jobModuleID,orderModuleID,reportModuleID,notificationParams,txnModuleID,contactModuleId);
									                }
									            }
									        ], function (err, responseObj) {
									            return res.send({
											            "code": 200,
											            "response": responseObj,
											            "status": 1,
											            "totalCount": totalNotifications,
											            "message": custom.lang(locale,"success")
											        });
									        });
					                	}else{
					                		return res.send({
											            "code": 200,
											            "response": [],
											            "status": 0,
											            "message": custom.lang(locale,"Notifications not found.")
											        });
					                	}
					                }
								},myQuery);
							}
			            },myQuery);
					});
				}
			},userLoginSessionKey,timezone);
		}
	});

	/**
	 * To search users
	 * @param {string}  userLoginSessionKey
	 * @param {integer} pageNo
	 * @param {string}  searchType
	 * @param {string}  searchTerm (Optional)
	 */
	app.post('/users/search', function(req, res) {
		console.log('-----------User Search---------------');
		let locale = req.headers.locale;
		let timezone = req.headers.timezone;
		let searchTerm = (!req.body.searchTerm) ? '' : req.body.searchTerm;
		if(searchTerm)
		{
			searchTerm = searchTerm.trim();
		}
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("pageNo").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('pageNo', custom.lang(locale,'Require page number')).notEmpty();
	    req.check('pageNo', custom.lang(locale,'Page number minimum value should be 1')).minValue(1);
	    req.check('searchType', custom.lang(locale,'Require search type')).notEmpty();
	    req.check('searchType', custom.lang(locale,'Search type should be LOCAL Or GLOBAL')).inList(['LOCAL', 'GLOBAL']);
	    let searchType = req.body.searchType;
	    let moduleName = (req.body.moduleName) ? req.body.moduleName : 'FRIENDLY'; // FRIENDLY, DATING, PROVIDER
	    if(searchType === "LOCAL"){
			req.sanitize("searchDistance").trim();
			req.sanitize("searchDistanceUnit").trim();
			req.sanitize("userLatitude").trim();
			req.sanitize("userLongitude").trim();
			req.check('searchDistance', custom.lang(locale,'Require search distance')).notEmpty();
			req.check('searchDistanceUnit', custom.lang(locale,'Require search distance unit')).notEmpty();
			req.check('searchDistanceUnit', custom.lang(locale,'Search distance unit should be KM Or METER')).inList(['KM', 'METER']);
			req.check('userLatitude', custom.lang(locale,'Require user latitude')).notEmpty();
			req.check('userLongitude', custom.lang(locale,'Require user longitude')).notEmpty();
		}else{
			req.sanitize("globalSearchType").trim();
			req.check('globalSearchType', custom.lang(locale,'Require global search type')).notEmpty();
			req.check('globalSearchType', custom.lang(locale,'Global search type should be ALL Or COUNTRY_CITY')).inList(['ALL', 'COUNTRY_CITY']);
			let globalSearchType = req.body.globalSearchType;
			if(globalSearchType === 'COUNTRY_CITY')
			{
				req.sanitize("countryName").trim();
				req.check('countryName', custom.lang(locale,'Require country name')).notEmpty();
			}
		}
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
			let pageNo                = parseInt(req.sanitize('pageNo').escape().trim());
			let searchType            = req.sanitize('searchType').escape().trim();
			var searchDistance        = '';
			var searchDistanceUnit    = '';
			var userLatitude          = '';
			var userLongitude         = '';
			var globalSearchType      = '';
			var countryName           = '';
			var cityName    		  = '';
			if(searchType === "LOCAL"){
				searchDistance     = req.body.searchDistance;
				searchDistanceUnit = req.body.searchDistanceUnit;
				userLatitude       = req.body.userLatitude;
				userLongitude      = req.body.userLongitude;
			}else{
				globalSearchType = req.body.globalSearchType;
				countryName      = (req.body.countryName) ? req.body.countryName : '';
				cityName         = (req.body.cityName) ? req.body.cityName : '';
				if(countryName) {
					countryName = countryName.trim();
				}
				if(cityName) {
					cityName = cityName.trim();
				}
			}
			let userInterestedGender = '';
			let userInterestedSexualOrientation = '';

			async.waterfall([
			    function(callback) {
			    	/* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							if(moduleName && moduleName == "DATING" && custom.getUserAge(respObj[0].userDOB) < constant.dating_age_limit){
								let jsonResp = {"code" : 200,"response":{},"status" : 0,"message" : custom.lang(locale,constant.dating_age_limit_msg)};
								return res.send(jsonResp);
							}else{

								let preferenceFlag = 0;
								userInterestedGender = custom.nullChecker(respObj[0].userInterestedGender);
								userInterestedSexualOrientation = custom.nullChecker(respObj[0].userInterestedSexualOrientation);

								/* To check own preference is added */
								if(moduleName && moduleName == "DATING"){
									preferenceFlag = respObj[0].isDatingPreferenceAdded;
								}else if(moduleName && moduleName == "PROVIDER"){
									preferenceFlag = respObj[0].isProviderPreferenceAdded;
								}else{ // FRIENDLY
									preferenceFlag = respObj[0].isPreferencesAdded;
								}
								callback(null, respObj);
							}
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

			    	if(moduleName && (moduleName == "DATING" || moduleName == "PROVIDER")){
			    		callback(null, userDetailsObj,notInUserIds,masterUserId,1);
			    	}else{

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
								    callback(null, userDetailsObj,notInUserIds,masterUserId,1);
			                	}else{
			                		callback(null, userDetailsObj,notInUserIds,masterUserId,1);
			                	}
			                }
				    	},myQuery);
			    	}
			    },
			    function(userDetailsObj,notInUserIds,masterUserId,type, callback) {

			    	let userDescribePreferences = new Array();
			    	userDescribePreferences.push(0);

			    	/* Get user describe prefererences */
			    	model.getAllWhere(function(err,userDescribeResp){
			    		if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(userDescribeResp != ""){
		                		for (var i = 0; i < parseInt(userDescribeResp.length); i++) 
		                		{
		                			userDescribePreferences.push(userDescribeResp[i].describePreferenceParentID);
		                		}
		                		callback(null, userDetailsObj,notInUserIds,masterUserId,userDescribePreferences);
		                	}else{
		                		callback(null, userDetailsObj,notInUserIds,masterUserId,userDescribePreferences);
		                	}
		                }
			    	},constant.describe_preferences,{describePreferenceUserId:masterUserId,describePreferenceType:moduleName});
			    },
			    function(userDetailsObj,notInUserIds,masterUserId,userDescribePreferences, callback) {

			    	let userLookingPreferences = new Array();
			    	userLookingPreferences.push(0);

			    	/* Get user looking prefererences */
			    	model.getAllWhere(function(err,userLookingResp){
			    		if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(userLookingResp != ""){
		                		for (var i = 0; i < parseInt(userLookingResp.length); i++) 
		                		{
		                			userLookingPreferences.push(userLookingResp[i].lookingPreferenceParentID);
		                		}
		                		callback(null, userDetailsObj,notInUserIds,masterUserId,userDescribePreferences,userLookingPreferences);
		                	}else{
		                		callback(null, userDetailsObj,notInUserIds,masterUserId,userDescribePreferences,userLookingPreferences);
		                	}
		                }
			    	},constant.looking_preferences,{lookingPreferenceUserId:masterUserId,lookingPreferenceType:moduleName});
			    },
			    function(userDetailsObj,notInUserIds,masterUserId,userDescribePreferences,userLookingPreferences, callback) {

			    	/* To remove duplicate values */
			    	notInUserIds = Array.from(new Set(notInUserIds));

			    	/* To get offset */
			    	let offset = custom.getOffset(pageNo);

			    	/* To search users */
			    	var searchQuery = "SELECT *,TIMESTAMPDIFF(YEAR,userDOB,CURDATE()) AS userAgeCalculated";
			    	if(searchType === "LOCAL" && userLatitude && userLongitude)
			    	{
			    		searchQuery += " , SQRT( POW(69.1 * (userLatitude - "+userLatitude+"), 2) + POW(69.1 * ("+userLongitude+"- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance";
			    	}
			    	searchQuery += " FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId`";
			    	if(parseInt(userDescribePreferences.length) > 1)
			    	{
			    		searchQuery += " LEFT JOIN `describe_preferences` AS `DP` ON `U`.`masterUserId` = `DP`.`describePreferenceUserId` ";
			    	}
			    	if(parseInt(userLookingPreferences.length) > 1)
			    	{
			    		searchQuery += " LEFT JOIN `looking_preferences` AS `LP` ON `U`.`masterUserId` = `LP`.`lookingPreferenceUserId` ";
			    		searchQuery += " LEFT JOIN `preferences` AS `P` ON `P`.`preferenceID`= `DP`.`describePreferenceParentID` OR `P`.`preferenceID`= `LP`.`lookingPreferenceParentID`";
			    	}
			    	if(searchTerm != "" && moduleName && moduleName == 'PROVIDER')
			    	{
			    		searchQuery += " LEFT JOIN `skills` AS `SK` ON `SK`.`skillUserID` = `U`.`masterUserId`";
			    	}
			    	searchQuery += " WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = 'NORMAL_USER' AND `UD`.`isRedFlagBlock` = 0 AND `U`.`masterUserId` NOT IN ("+notInUserIds.join()+")";
			    	if(userInterestedGender && moduleName && moduleName == 'DATING')
			    	{
			    		searchQuery += " AND `UD`.`userGender` = '"+ userInterestedGender +"'";
			    	}
			    	if(userInterestedSexualOrientation && moduleName && moduleName == 'DATING')
			    	{
			    		searchQuery += " AND `UD`.`userSexualOrientation` LIKE '%"+userInterestedSexualOrientation+"%'";
			    	}
			    	if(moduleName && moduleName == 'DATING'){
			    		searchQuery += "  AND `UD`.`isDatingPreferenceAdded` = 1"; // For DATING MODULE
			    	}else if(moduleName && moduleName == 'PROVIDER'){
			    		searchQuery += "  AND `UD`.`isProviderPreferenceAdded` = 1"; // For PROVIDER MODULE
			    		searchQuery += "  AND `UD`.`isBecomeProvider` = 1"; 
			    		searchQuery += "  AND `UD`.`isHideProfileAsProvider` = 0"; 
			    	}else{
			    		searchQuery += "  AND `UD`.`isPreferencesAdded` = 1"; // For FRIENDLY MODULE
			    	}
			    	if(searchTerm != "")
			    	{
			    		searchQuery += " AND ( `UD`.`userFirstName` LIKE '%"+searchTerm+"%'";
			    		searchQuery += " OR `UD`.`userLastName` LIKE '%"+searchTerm+"%'";
			    		if(moduleName && moduleName == 'PROVIDER')
			    		{
			    			/* Search with skills */
			    			searchQuery += " OR `UD`.`userJobHeading` LIKE '%"+searchTerm+"%'";
			    			searchQuery += " OR `SK`.`skillName` LIKE '%"+searchTerm+"%'";
			    		}
			    		searchQuery += " )";
			    	}
			    	if(searchType === "GLOBAL" && globalSearchType === "COUNTRY_CITY")
			    	{
			    		if(countryName){
			    			searchQuery += " AND `UD`.`userCountry` LIKE '%"+countryName+"%'";
			    		}
			    		if(cityName){
			    			searchQuery += " AND `UD`.`userCity` LIKE '%"+cityName+"%'";
			    		}
			    	}
			    	searchQuery += " AND `UD`.`userId` != " + masterUserId;
			    	if(searchType === 'LOCAL' && userLatitude && userLongitude)
			    	{
			    		var searchDistanceInMiles = constant.default_search_distance * 0.621371; // KM
			    		if(searchDistanceUnit === "KM"){
			    			searchDistanceInMiles = parseFloat(searchDistance) * 0.621371; // KM
			    		}else if(searchDistanceUnit === "METER"){
			    			searchDistanceInMiles = (parseFloat(searchDistance)); // METER (MILES)
			    		}
				    	searchQuery += " GROUP BY `U`.`masterUserId`";
			    		searchQuery += " HAVING distance <= "+searchDistanceInMiles;
			    		if(moduleName && moduleName == 'DATING')
				    	{
				    		searchQuery += " AND userAgeCalculated >= " + constant.dating_age_limit;
				    	}
			    	}else{
				    	searchQuery += " GROUP BY `U`.`masterUserId`";
			    		if(moduleName && moduleName == 'DATING')
				    	{
				    		searchQuery += " HAVING userAgeCalculated >= " + constant.dating_age_limit;
				    	}
			    	}
			    	if(searchType === 'LOCAL' && userLatitude && userLongitude){
			    		searchQuery += " ORDER BY `distance` ASC";
			    	}else{
			    		searchQuery += " ORDER BY `UD`.`userFirstName` ASC";
			    	}
			    	model.customQuery(function(err,userRespObj){
			    		if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	let totalUsers = parseInt(userRespObj.length);

					    	if(offset > 0){
					    		searchQuery += " LIMIT " + offset + "," + constant.results_limit;
					    	}else{
					    		searchQuery += " LIMIT " + constant.results_limit
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
					        },searchQuery);
					    }
					},searchQuery);
			    }
			], function (err,userDetailsObj,usersObj,totalUsers) {
				let masterUserId = parseInt(userDetailsObj[0].masterUserId);
			    custom.publicUsersCollection(usersObj,masterUserId, function(err,resp){
			    	if(err){
			    		return res.send({
						            "code": 200,
						            "response": [],
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

	/**
	 * To add people into group call search users 
	 * @param {string} userLoginSessionKey
	 * @param {string} userLatitude
	 * @param {string} userLongitude
	 * @param {string} userAddress
	 * @param {string} searchTerm
	 * @param {string} moduleName
	 * @param {integer} pageNo
	 */
	app.post('/users/add-people-search-users', function(req, res) {

		let locale = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("userLatitude").trim();
		req.sanitize("userLongitude").trim();
		// req.sanitize("userAddress").trim();
		// req.sanitize("searchTerm").trim();
		req.sanitize("moduleName").trim();
		req.sanitize("pageNo").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('userLatitude', custom.lang(locale,'The User latitude field is required')).notEmpty();
	    req.check('userLongitude', custom.lang(locale,'The User longitude field is required')).notEmpty();
	    // req.check('userAddress', custom.lang(locale,'The User address field is required')).notEmpty();
	    // req.check('searchTerm', custom.lang(locale,'The Search term field is required')).notEmpty();
	    req.check('moduleName', custom.lang(locale,'Require module name')).notEmpty();
    	req.check('moduleName', custom.lang(locale,'Select valid module name')).inList(["FRIENDLY","DATING","PROVIDER"]);
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
			let userLatitude          = req.sanitize('userLatitude').escape().trim();
			let userLongitude         = req.sanitize('userLongitude').escape().trim();
			// let userAddress           = req.sanitize('userAddress').escape().trim();
			// let searchTerm            = req.sanitize('searchTerm').escape().trim();
			let moduleName            = req.sanitize('moduleName').escape().trim();
			let userAddress           = (!req.body.userAddress) ? '' : req.body.userAddress;
			let searchTerm            = (!req.body.searchTerm) ? '' : req.body.searchTerm;

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

			    	/* To search users */
			    	var searchQuery = "SELECT *";
			    	searchQuery += " , SQRT( POW(69.1 * (userLatitude - "+userLatitude+"), 2) + POW(69.1 * ("+userLongitude+"- userLongitude) * COS(userLatitude / 57.3), 2)) AS distance";
			    	searchQuery += " FROM `users` AS `U` INNER JOIN `user_details` AS `UD` ON `U`.`masterUserId` = `UD`.`userId`";
			    	searchQuery += " WHERE `UD`.`userEmailVerified` = 1 AND `UD`.`isUserBlocked` = 0 AND `UD`.`isUserDeactivated` = 0 AND  `U`.`userType` = 'NORMAL_USER' AND `U`.`masterUserId` NOT IN ("+notInUserIds.join()+")";
			    	if(moduleName && moduleName == 'DATING'){
			    		searchQuery += "  AND `UD`.`isDatingPreferenceAdded` = 1"; // For DATING MODULE
			    	}else if(moduleName && moduleName == 'PROVIDER'){
			    		searchQuery += "  AND `UD`.`isProviderPreferenceAdded` = 1"; // For PROVIDER MODULE
			    		searchQuery += "  AND `UD`.`isBecomeProvider` = 1"; 
			    		searchQuery += "  AND `UD`.`isHideProfileAsProvider` = 0"; 
			    	}else{
			    		searchQuery += "  AND `UD`.`isPreferencesAdded` = 1"; // For FRIENDLY MODULE
			    	}
			    	if(searchTerm != "")
			    	{
			    		searchQuery += " AND (`UD`.`userFirstName` LIKE '%" + searchTerm + "%'";
			    		searchQuery += " OR `UD`.`userLastName` LIKE '%" + searchTerm + "%')";
			    	}
			    	if(userAddress != "")
			    	{
			    		searchQuery += " AND `UD`.`userAddress` LIKE '%" + userAddress + "%'";
			    	}
			    	searchQuery += " ORDER BY `UD`.`userFirstName` ASC";

			    	model.customQuery(function(err,userRespObj){
			    		if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	let totalUsers = parseInt(userRespObj.length);

					    	if(offset > 0){
					    		searchQuery += " LIMIT " + offset + "," + constant.results_limit;
					    	}else{
					    		searchQuery += " LIMIT " + constant.results_limit
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
					        },searchQuery);
					    }
					},searchQuery);
			    }
			], function (err,userDetailsObj,usersObj,totalUsers) {
				let masterUserId = parseInt(userDetailsObj[0].masterUserId);
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

	/* To purchase membership
	 * @param {string}  userLoginSessionKey
	 * @param {string}  paymentType [WALLET,CARD,WALLET_AND_CARD]
	 * @param {integer} walletAmount (Optional)
	 * @param {integer} isPayByCard (Optional) [0 - No, 1 - Yes]
	 * @param {string}  cardID (Optional)
	 * @param {integer} cardNo (Optional)
     * @param {integer} expiryMonth (Optional)
     * @param {integer} expiryYear (Optional)
     * @param {integer} CVV (Optional)
     * @param {string}  cardHolderName (Optional)
     * @param {integer} wantToSaveCard (Optional) [0 - No, 1 - Yes]
	*/
	app.post('/user/purchase-membership', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
		let paymentType = (!req.body.paymentType) ? '' : req.body.paymentType;
		let isPayByCard = (!req.body.isPayByCard) ? '' : parseInt(req.body.isPayByCard);
		let wantToSaveCard = (!req.body.wantToSaveCard) ? '' : parseInt(req.body.wantToSaveCard);
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("paymentType").trim();
		if(paymentType === 'WALLET' || paymentType === 'WALLET_AND_CARD'){
			req.sanitize("walletAmount").trim();
		}
		if(paymentType === 'CARD' || paymentType === 'WALLET_AND_CARD'){
			req.sanitize("isPayByCard").trim();
			if(isPayByCard === 1){
				req.sanitize("cardID").trim();
			}else{
				req.sanitize("cardNo").trim();
				req.sanitize("expiryMonth").trim();
				req.sanitize("expiryYear").trim();
				req.sanitize("CVV").trim();
				req.sanitize("cardHolderName").trim();
				if(wantToSaveCard === 1){
					req.sanitize("wantToSaveCard").trim();
				}
			}
		}
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('paymentType', custom.lang(locale,'The payment type field is required')).notEmpty();
	    req.check('paymentType', custom.lang(locale,'payment type should be in WALLET, CARD, WALLET_AND_CARD')).inList(["WALLET","CARD","WALLET_AND_CARD"]);
	    if(paymentType === 'WALLET' || paymentType === 'WALLET_AND_CARD'){
			req.check('walletAmount', custom.lang(locale,'The Wallet amount field is require')).notEmpty();
		}
		if(paymentType === 'CARD' || paymentType === 'WALLET_AND_CARD'){
			req.check('isPayByCard', custom.lang(locale,'The pay by card field is require')).notEmpty();
			if(isPayByCard === 1){
				req.check('cardID', custom.lang(locale,'The card id field is require')).notEmpty();
			}else{
				req.check('cardNo', custom.lang(locale,'The card no field is required')).notEmpty();
			    req.check('expiryMonth', custom.lang(locale,'The expiry month field is required')).notEmpty();
			    req.check('expiryYear', custom.lang(locale,'The expiry year field is required')).notEmpty();
			    req.check('CVV', custom.lang(locale,'The CVV field is required')).notEmpty();
			    req.check('cardHolderName', custom.lang(locale,'The card holder field is required')).notEmpty();
				if(wantToSaveCard === 1){
			    	req.check('wantToSaveCard', custom.lang(locale,'The Save card field is required')).notEmpty();
				}
			}
		}
	    let errors = req.validationErrors();
	    if (errors) {
	        res.send({
	            "code": 200,
	            "response": {},
	            "status": 0,
	            "message": custom.manageValidationMessages(errors)
	        });
	    } else {
	    	let membershipAmount    = constant.membership_fees;
			let userLoginSessionKey = req.sanitize('userLoginSessionKey').escape().trim();
			let walletAmount        = 0;
			let cardAmount          = 0;
			let cardID              = '';
			let cardNo              = '';
			let expiryMonth         = '';
			let expiryYear          = '';
			let CVV                 = '';
			let cardHolderName      = '';
			if(paymentType === 'WALLET' || paymentType === 'WALLET_AND_CARD'){
				walletAmount  = req.sanitize('walletAmount').escape().trim();
			}
			if(paymentType === 'CARD' || paymentType === 'WALLET_AND_CARD'){
				if(isPayByCard === 1){
					cardID  = req.sanitize('cardID').escape().trim();
				}else{
					cardNo         = req.sanitize('cardNo').escape().trim();
					expiryMonth    = req.sanitize('expiryMonth').escape().trim();
					expiryYear     = req.sanitize('expiryYear').escape().trim();
					CVV            =  req.sanitize('CVV').escape().trim();
					cardHolderName = req.sanitize('cardHolderName').escape().trim();
				}
			}
			async.waterfall([
			    function(callback) {
			    	/* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							if(paymentType === 'WALLET' && walletAmount != membershipAmount){
								return res.send({
						                        "code": 200,
						                        "response": {membershipAmount:membershipAmount},
						                        "status": 0,
						                        "message": custom.lang(locale,'Wallet amount should be equals to membership amount ($' + membershipAmount + ').')
						                    });
							}else if(paymentType === 'CARD'){
								cardAmount = membershipAmount;
							}else if(paymentType === 'WALLET_AND_CARD'){
								cardAmount = membershipAmount - walletAmount;
							}
							if(paymentType === 'WALLET' || paymentType === 'WALLET_AND_CARD'){

								/* Check user wallet balance */
								let userWalletAmount = custom.parseNumber(respObj[0].userWalletAmount);
								if(userWalletAmount >= walletAmount){
									callback(null, respObj,cardAmount);
								}else{
									return res.send({
							                        "code": 200,
							                        "response": {userWalletAmount:userWalletAmount},
							                        "status": 7,
							                        "message": custom.lang(locale,'Insufficient amount in your wallet.')
							                    });
								}
							}else{
								callback(null, respObj,cardAmount);
							}
						}
					},userLoginSessionKey,timezone,1);
			    },
			    function(userDetailsObj,cardAmount, callback) {

			    	if(paymentType === 'CARD' || paymentType === 'WALLET_AND_CARD'){
			    		let stripe = require(appRoot + '/lib/stripe.js');
				    	if(isPayByCard === 1){

				    		/* Pay by card */
				    		stripe.payBySavedCard(function(err,paymentResp){
								if(err){

									/* Insert Transaction history (Backgroud Process) */
	                                let txnObj = {};
	                                txnObj.transactionUserID   = userDetailsObj[0].userId;
	                                txnObj.transactionCustomID = custom.generateCustomID('TXN');
	                                txnObj.transactionAmount   = cardAmount;
	                                txnObj.transactionDateTime = custom.getCurrentTime();
	                                txnObj.transactionStatus   = 'FAILED';
	                                txnObj.transactionModuleName = 'PURCHASE_MEMBERSHIP';
	                                txnObj.transactionMessage    = '$' + cardAmount + ' failed to purchase membership';
	                                txnObj.transactionPaymentResponse = JSON.stringify({error:err.message});
	                                txnObj.transactionPaymentDateTime = custom.getCurrentTime();
	                                model.insertData(function(err,resp){
	                                    if(err){
	                                        console.log('Failed to add transactions',err.message);
	                                    }
	                                },constant.transactions,txnObj);

									return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,err.message)
									        });
								}else{
									if(paymentResp.status === 'succeeded'){

										/* Insert Transaction history */
										let txnObj = {};
	                                    txnObj.transactionUserID   = userDetailsObj[0].userId;
	                                    txnObj.transactionCustomID = custom.generateCustomID('TXN');
	                                    txnObj.transactionAmount   = cardAmount;
	                                    txnObj.transactionDateTime = custom.getCurrentTime();
	                                    txnObj.transactionStatus   = 'COMPLETED';
	                                    txnObj.transactionModuleName = 'PURCHASE_MEMBERSHIP';
	                                    txnObj.transactionMessage    = '$' + cardAmount + ' amount deducted while purchase membership';
	                                    txnObj.transactionPaymentResponse = JSON.stringify(paymentResp);
	                                    txnObj.transactionPaymentDateTime = custom.getCurrentTime();
	                                    model.insertData(function(err,resp){
	                                        if(err){
	                                            console.log('Failed to add transactions',err);
	                                        }
	                                    },constant.transactions,txnObj);

										callback(null, userDetailsObj,cardAmount,paymentResp);
									}else{
										return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,constant.payment_failed)
											        });
									}
								}
							},userDetailsObj[0].userPaymentCustomerID,cardID,'USD',cardAmount);
				    	}else{

				    		/* Pay via card details */
				    		let paymentDescprition = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " has purchased membership";
				    		stripe.payViaCardDetails(function(err,paymentResp){
								if(err){

									/* Insert Transaction history (Backgroud Process) */
	                                let txnObj = {};
	                                txnObj.transactionUserID   = userDetailsObj[0].userId;
	                                txnObj.transactionCustomID = custom.generateCustomID('TXN');
	                                txnObj.transactionAmount   = cardAmount;
	                                txnObj.transactionDateTime = custom.getCurrentTime();
	                                txnObj.transactionStatus   = 'FAILED';
	                                txnObj.transactionModuleName = 'PURCHASE_MEMBERSHIP';
	                                txnObj.transactionMessage    = '$' + cardAmount + ' failed to purchase membership';
	                                txnObj.transactionPaymentResponse = JSON.stringify({error:err.message});
	                                txnObj.transactionPaymentDateTime = custom.getCurrentTime();
	                                model.insertData(function(err,resp){
	                                    if(err){
	                                        console.log('Failed to add transactions',err.message);
	                                    }
	                                },constant.transactions,txnObj);

									return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,err.message)
									        });
								}else{
									if(paymentResp.status === 'succeeded'){

										/* Insert Transaction history */
										let txnObj = {};
	                                    txnObj.transactionUserID   = userDetailsObj[0].userId;
	                                    txnObj.transactionCustomID = custom.generateCustomID('TXN');
	                                    txnObj.transactionAmount   = cardAmount;
	                                    txnObj.transactionDateTime = custom.getCurrentTime();
	                                    txnObj.transactionStatus   = 'COMPLETED';
	                                    txnObj.transactionModuleName = 'PURCHASE_MEMBERSHIP';
	                                    txnObj.transactionMessage    = '$' + cardAmount + ' amount deducted while purchase membership';
	                                    txnObj.transactionPaymentResponse = JSON.stringify(paymentResp);
	                                    txnObj.transactionPaymentDateTime = custom.getCurrentTime();
	                                    model.insertData(function(err,resp){
	                                        if(err){
	                                            console.log('Failed to add transactions',err);
	                                        }
	                                    },constant.transactions,txnObj);

										/* Manage stripe card (BACKGROUD PROCESS) */
			                            if(wantToSaveCard === 1)
			                            {
			                            	if(userDetailsObj[0].userPaymentCustomerID == null || userDetailsObj[0].userPaymentCustomerID == "" || userDetailsObj[0].userPaymentCustomerID == undefined){

			                            		/* Create customer & save card on stripe server */
				                            	stripe.createCustomer(function(err,stripeResp){
				                            		if(err){
				                            			console.log('stripe err',err);
				                            		}else{
				                            			console.log('stripe success');
				                            			if(stripeResp != "")
				                            			{
				                            				let stripeCustomerID = (!stripeResp.id) ? '' : stripeResp.id;
				                            				if(stripeCustomerID)
				                            				{
				                            					/* Update stripe customer id */
				                            					model.updateData(function(err,updateResp){
				                            						if(err){
								                            			console.log('stripe update err',err);
								                            		}else{
								                            			console.log('stripe update success');
								                            		}
				                            					},constant.user_details,{userPaymentCustomerID:stripeCustomerID},{userId:userDetailsObj[0].userId});
				                            				}
				                            			}
				                            		}
				                            	},cardNo,expiryMonth,expiryYear,CVV,cardHolderName,userDetailsObj[0].userEmail,userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName);
			                            	}else{
			                            		/* Save card on stripe server */
				                            	stripe.saveCard(function(err,stripeResp){
				                            		if(err){
				                            			console.log('stripe err',err);
				                            		}else{
				                            			console.log('stripe success');
				                            		}
				                            	},cardNo,expiryMonth,expiryYear,CVV,cardHolderName,userDetailsObj[0].userPaymentCustomerID);
			                            	}
			                            }

										callback(null, userDetailsObj,cardAmount,paymentResp);
									}else{
										return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,constant.payment_failed)
											        });
									}
								}
							},cardNo,expiryMonth,expiryYear,CVV,cardAmount,cardHolderName,'USD',paymentDescprition);
				    	}
				    }else{
				    	callback(null, userDetailsObj,cardAmount,{});
				    }
			    }
			], function (err,userDetailsObj,cardAmount,paymentResp) {
			    
			    let queryBuilder = require(appRoot + '/lib/query-builder.js').QueryBuilder();
			    database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Update membership Details */
					    let userObj = {};
					    userObj.isPaidMembeship     = 1;
					    userObj.paidMemebershipDate = custom.getCurrentTime();
                        let i1 = queryBuilder.update(constant.user_details,userObj,{userId:userDetailsObj[0].userId});
                        queryBuilder.reset_query(i1);
                        connection.query(i1, function(err, membershipUpdateResp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }
	                        if(!membershipUpdateResp){
	                        	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Failed to update membership details.')
									        });
	                        }

	                    /* Update user wallet amount */
	                    if(paymentType === 'WALLET' || paymentType === 'WALLET_AND_CARD')
	                    {
	                    	let u1 = "UPDATE (`"+constant.user_details+"`) SET `userWalletAmount` = userWalletAmount - " + walletAmount + " WHERE `userId` = " + userDetailsObj[0].userId;
	                        queryBuilder.reset_query(u1);
	                        connection.query(u1, function(err, resp) {
		                        if (err) {
		                            connection.rollback(function() {
		                                return res.send(custom.dbErrorResponse(err.sqlMessage));
		                            });
		                        }
		                    });
	                    }

                    	connection.commit(function(err) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse());
	                            });
	                        }else{
	                            connection.release();

	                            // BACKGROUD PROCESS (IN QUEUE)

	                            /* Insert Wallet Transaction history - Hirer */
	                            if(paymentType === 'WALLET' || paymentType === 'WALLET_AND_CARD')
	                            {
	                            	let currentBalance = custom.parseNumber(userDetailsObj[0].userWalletAmount - walletAmount);
                                    let walletObj = {};
                                    walletObj.walletUserID          = userDetailsObj[0].userId;
                                    walletObj.walletAmount          = walletAmount;
                                    walletObj.walletRemainingAmount = currentBalance;
                                    walletObj.walletTxnType         = 'DEDUCT';
                                    walletObj.walletTxnReason       = 'PURCHASE_MEMBERSHIP';
                                    walletObj.walletTxnID           = custom.generateCustomID('QL');
                                    walletObj.walletTxnStatus       = 'COMPLETED';
                                    walletObj.walletTxnDateTime     = custom.getCurrentTime();
                                    walletObj.walletExtraParams     = JSON.stringify({userId:userDetailsObj[0].userId,walletTypeAccount:'MAIN_AC',walletAccountTxnType:'DEDUCT'});
                                    model.insertData(function(err,resp){
                                        if(err){
                                            console.log('Failed to add wallet transactions');
                                        }
                                    },constant.wallet,walletObj);
	                            }

	                            /* Insert membership notification */
	                            let myID = userDetailsObj[0].userId;
	                            let notiMsg = 'Your account membership renewed successfully';
							   	let notificationDataObj = {};
		                		notificationDataObj.notificationUserId   = myID;
		                		notificationDataObj.notificationFriendId = myID;
		                		notificationDataObj.notificationModule   = 'GLOBAL';
		                		notificationDataObj.notificationType     = 'PURCHASE_MEMBERSHIP';
		                		notificationDataObj.notificationMessage  = notiMsg;
		                		notificationDataObj.notificationParams   = JSON.stringify({membershipAmount:membershipAmount,paidMemebershipDate:custom.getCurrentTime()});
		                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
		                		model.insertData(function(err,notificationResp){
	                            	if(err){
	                            		console.log('User membership app notification error',err);
	                            	}else{
	                            		console.log('User membership app notification success');
	                            	}
	                            },constant.notifications,notificationDataObj);

	                            /* Update user badges */
	                            let updateQuery1 = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + myID;
	                            model.customQuery(function(err,badgesResp){
	                            	if(err){
	                            		console.log('User membership app notification badges error',err);
	                            	}else{
	                            		console.log('User membership app notification badges success');
	                            	}
	                            },updateQuery1);

	                            /* To send push notifications */
	                            let extraParams = {};
	                            extraParams.userID            = myID;
	                            extraParams.moduleName        = 'GLOBAL';
	                            extraParams.notificationType  = 'PURCHASE_MEMBERSHIP';
	                            notification.sendPushNotifications(notiMsg,myID,extraParams);

	                            /* Manage admin report */
	                            let reportObj = {};
                                reportObj.reportUserID = userDetailsObj[0].userId;
                                reportObj.reportAmount = membershipAmount;
                                reportObj.reportAmountType  = 1;
                                reportObj.reportModuleName  = 'PURCHASE_MEMBERSHIP';
                                reportObj.reportExtraParams = JSON.stringify({walletAmount:walletAmount,cardAmount:cardAmount});
                                reportObj.reportDateTime    = custom.getCurrentTime();
                                model.insertData(function(err,resp){
                                    if(err){
                                        console.log('Failed to add reports');
                                    }
                                },constant.reports,reportObj);

	                            /* Return user response */
			            		return res.send({"code" : 200, "response" : {},"status" : 1,"message" : custom.lang(locale,'Membership successfully purchased.')});
	                        }
                    	});
                    	});
                	});
				}); 
			});
		}
	});

	/* To get inbox messages history
	 * @param {string}  userLoginSessionKey
	 * @param {integer} pageNo
	*/
	app.post('/user/inbox-msgs', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("pageNo").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('pageNo', custom.lang(locale,'Required page number')).notEmpty();
	    req.check('pageNo', custom.lang(locale,'Page number minimum value should be 1')).minValue(1);
	    let errors = req.validationErrors();
	    if (errors) {
	        res.send({
	            "code": 200,
	            "response": [],
	            "status": 0,
	            "message": custom.manageValidationMessages(errors)
	        });
	    } else {
			let userLoginSessionKey = req.sanitize('userLoginSessionKey').escape().trim();
			let pageNo              = parseInt(req.sanitize('pageNo').escape().trim());

			async.waterfall([
			    function(callback) {

			    	/* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							let masterUserId = parseInt(respObj[0].masterUserId);
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
									    callback(null, respObj,notInUserIds,masterUserId);
				                	}else{
				                		callback(null, respObj,notInUserIds,masterUserId);
				                	}
				                }
					    	},constant.block_users,{userBlockUserId:masterUserId});
						}
					},userLoginSessionKey,timezone);
			    },
			    function(userDetailsObj,notInUserIds,masterUserId, callback) {

			    	/* To get offset */
				    let offset = custom.getOffset(pageNo);

			    	/* Get inbox messages */
					var myQuery = 'SELECT * FROM ' + constant.user_inbox + ' AS `N` INNER JOIN ' + constant.user_details + ' AS `UD` ON `N`.`userInboxSenderId` = `UD`.`userId` WHERE `N`.`userInboxSenderId` NOT IN ('+notInUserIds.join()+') AND `N`.`userInboxRecieverId` = '+masterUserId+' ORDER BY `N`.`userInboxId` DESC'
					model.customQuery(function(err,inboxObj){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	let totalInboxMsgs = parseInt(inboxObj.length);

		                	if(offset > 0){
					    		myQuery += " LIMIT " + offset + "," + constant.results_limit;
					    	}else{
					    		myQuery += " LIMIT " + constant.results_limit
					    	}

					    	model.customQuery(function(err,inboxRespObj){
								if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(inboxRespObj != ""){
				                		callback(null, userDetailsObj,totalInboxMsgs,inboxRespObj);
				                	}else{
				                		return res.send({
											            "code": 200,
											            "response": [],
											            "status": 0,
											            "message": custom.lang(locale,"Inbox messages not found.")
											        });
				                	}
				                }
				            },myQuery);
		                }
					},myQuery);
			    }
			], function (err,userDetailsObj,totalInboxMsgs,inboxRespObj) {
			    let responseObj = [];
			    for (var i = 0; i < parseInt(inboxRespObj.length); i++) 
			    {
			    	let row = {};
			    	row.userInboxId          = parseInt(inboxRespObj[i].userInboxId);
			    	row.userInboxSenderId    = parseInt(inboxRespObj[i].userInboxSenderId);
			    	row.userInboxRecieverId  = (!inboxRespObj[i].userInboxRecieverId) ? 0 : parseInt(inboxRespObj[i].userInboxRecieverId);
			    	row.userInboxType        = custom.nullChecker(inboxRespObj[i].userInboxType);
			    	if(parseInt(inboxRespObj[i].userInboxSenderId) === parseInt(inboxRespObj[i].userInboxRecieverId)){
			    		row.userInboxMessage  = custom.nullChecker(inboxRespObj[i].userInboxMessage);
			    	}else{
			    		row.userInboxMessage  = inboxRespObj[i].userFirstName + " " + inboxRespObj[i].userFirstName + " " + custom.nullChecker(inboxRespObj[i].userInboxMessage);
			    	}
			    	row.userInboxSentTime    = custom.changeDateFormat(inboxRespObj[i].userInboxSentTime);
			    	row.userInboxExtraParams = (!inboxRespObj[i].userInboxExtraParams) ? {} : JSON.parse(inboxRespObj[i].userInboxExtraParams);
			    	row.userFirstName        = custom.nullChecker(inboxRespObj[i].userFirstName);
			    	row.userLastName         = custom.nullChecker(inboxRespObj[i].userLastName);
			    	row.userImage            = (!inboxRespObj[i].userImage) ? '' : constant.base_url + inboxRespObj[i].userImage;
			    	row.userImageThumbnail   = (!inboxRespObj[i].userImageThumbnail) ? '' : constant.base_url + inboxRespObj[i].userImageThumbnail;
			    	responseObj.push(row);
			    }
			    return res.send({
					            "code": 200,
					            "response": responseObj,
					            "totalCount": totalInboxMsgs,
					            "status": 1,
					            "message": "success"
					        });
			});
		}
	});

	/* To manage user online status 
	 * @param {string} userLoginSessionKey
	 * @param {string} onlineStatus [ONLINE,OFFLINE,AWAY]
	*/
	app.post('/user/update-online-status', function (req,res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("onlineStatus").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('onlineStatus', custom.lang(locale,'The online status field is required')).notEmpty();
	    req.check('onlineStatus', custom.lang(locale,'Online status should be in ONLINE, OFFLINE, AWAY')).inList(["ONLINE","OFFLINE","AWAY"]);
	    let errors = req.validationErrors();
	    if (errors) {
	        res.send({
	            "code": 200,
	            "response": [],
	            "status": 0,
	            "message": custom.manageValidationMessages(errors)
	        });
	    } else {
			let userLoginSessionKey = req.sanitize('userLoginSessionKey').escape().trim();
			let onlineStatus        = req.sanitize('onlineStatus').escape().trim();

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					
					/* Update online status */
					let whereObj = {};
					whereObj.onlineStatus = onlineStatus;
					if(onlineStatus === 'ONLINE'){
						whereObj.isOpenForAllCalls       = 1;
						whereObj.isOpenForScheduledCalls = 1;
					}else if(onlineStatus === 'OFFLINE'){
						whereObj.isOpenForAllCalls       = 0;
						whereObj.isOpenForScheduledCalls = 0;
					}else if(onlineStatus === 'AWAY'){
						whereObj.isOpenForAllCalls       = 0;
						whereObj.isOpenForScheduledCalls = 1;
					}
					model.updateData(function(err,updateResp){
						if(err){
							return res.send(custom.dbErrorResponse());
						}else{
							return res.send({
								            "code": 200,
								            "response": {},
								            "status": 1,
								            "message": custom.lang(locale,"Online status changed successfully")
								        });
						}
					},constant.user_details,whereObj,{userId:respObj[0].userId});
				}
			},userLoginSessionKey,timezone);

		}
	});

	/* To clear user badges
	 * @param {string} userLoginSessionKey
	*/
	app.post('/user/clear-badges', function (req,res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
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
			let userLoginSessionKey = req.sanitize('userLoginSessionKey').escape().trim();

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					
					/* Update badges */
					model.updateData(function(err,updateResp){
						if(err){
							return res.send(custom.dbErrorResponse());
						}else{
							return res.send({
								            "code": 200,
								            "response": {},
								            "status": 1,
								            "message": custom.lang(locale,"User badges cleared successfully")
								        });
						}
					},constant.user_details,{userBadges:0},{userId:respObj[0].userId});
				}
			},userLoginSessionKey,timezone);

		}
	});


}