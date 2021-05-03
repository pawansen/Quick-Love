"use strict";

/*
 * Purpose : For Admin Apis
 * Package : Users
 * Company : Mobiweb Technology Pvt. Ltd.
 * Developed By  : Sorav Garg
*/

module.exports = function(app, database, constant,custom) {

	/* Load custom modules */
    var appRoot = require('app-root-path'),
    	async   = require('async'),
		model   = require(appRoot + '/lib/model.js'),
		notification = require(appRoot + '/lib/notification.js'),
		moment       = require('moment'),
    	queryBuilder = require(appRoot + '/lib/query-builder.js').QueryBuilder();

	/**
	 * To manage admin login
	 * @param {string} userEmail
	 * @param {string} userPassword
	 */
	app.post('/admin/login', function (req,res) {
	    req.sanitize("userEmail").trim();
	    req.sanitize("userPassword").trim();
	    req.check('userEmail', 'Enter your email').notEmpty();
	    req.check('userEmail', 'Enter a valid email').isEmail();
	    req.check('userPassword', 'Enter password').notEmpty();
	    let errors = req.validationErrors();
	    if (errors) {
	        res.send({
	            "code": 200,
	            "response": {},
	            "status": 0,
	            "message": custom.manageValidationMessages(errors)
	        });
	    } else {
	    	let userEmail    = req.sanitize('userEmail').escape().trim();
        	let userPassword = custom.getMd5Value(req.sanitize('userPassword').escape().trim());

        	/* Check User Email Id and Password */
        	async.waterfall([
        		function(callback) {
        			/* Get user details */
	                let myQuery = "SELECT * FROM `users` INNER JOIN `user_details` ON `users`.`masterUserId`=`user_details`.`userId` WHERE `users`.`userEmail` = '"+userEmail+"' AND `users`.`userPassword` = '"+userPassword+"' AND `users`.`userType` = 'SUPER_ADMIN' ";
	                model.customQuery(function(err,results){
	                    if(err){
	                        res.send(custom.dbErrorResponse());
	                        return;
	                    }else{
	                        if(results != ''){
	                            callback(null, results);
	                        }else{
	                            return res.send({
			                                "code": 200,
			                                "response": {},
			                                "status": 0,
			                                "message": 'Login credentials are not correct'
			                            });
	                        }
	                    }
	                },myQuery);
        		},
            	function(results, callback) {
            		var masterUserId = parseInt(results[0].masterUserId);

            		/* Update users details */
            		let userData = {};
            		userData.userLastLogin            = custom.getCurrentTime();
            		userData.userLastActivityDateTime = custom.getCurrentTime();
            		userData.userLastIpAddress        = custom.getUserIp();
            		userData.userLoginSessionKey      = masterUserId + custom.getGuid();
            		model.updateData(function(err,resp){
	                    if(err){
	                        return res.send(custom.dbErrorResponse());
	                    }else{
	                        callback(null,results,userData.userLastLogin,userData.userLastIpAddress,userData.userLoginSessionKey);
	                    }
	                },constant.user_details,userData,{userId:masterUserId});
            	}
        	], function (err, results,userLastLogin,userLastIpAddress,userLoginSessionKey) {

        		/* Set user session (Need to add) */

        		/* Return response */
        		let userResponse = {};
        		userResponse.userFirstName = results[0].userFirstName;
        		userResponse.userLastName  = results[0].userLastName;
        		// userResponse.userId        = results[0].userId;
        		userResponse.userLastLogin  = userLastLogin;
        		userResponse.userLastIpAddress  = userLastIpAddress;
        		userResponse.userLoginSessionKey  = userLoginSessionKey;
        		return res.send({
                                "code": 200,
                                "response": userResponse,
                                "status": 1,
                                "message": 'Logged-in successfully'
                            });
        	});
	    }
	});

	/**
	 * To manage admin logout
	 * @param {string} userLoginSessionKey
	 */
	app.post('/admin/logout', function (req,res) {
	    req.sanitize("userLoginSessionKey").trim();
	    req.check('userLoginSessionKey', 'Require user login session key').notEmpty();
	    let errors = req.validationErrors();
	    if (errors) {
	        res.send({
	            "code": 200,
	            "response": {},
	            "status": 0,
	            "message": custom.manageValidationMessages(errors)
	        });
	    } else {
	    	let userLoginSessionKey  = req.sanitize('userLoginSessionKey').escape().trim();
	    	return res.send({
				            "code": 200,
				            "response": {},
				            "status": 1,
				            "message": 'User logged-out successfully'
				        });
	 	}
	});

	/**
	 * To change admin password
	 * @param {string} userLoginSessionKey
	 * @param {string} oldPassword
	 * @param {string} newPassword
	 * @param {string} confirmPassword
	 */
	app.post('/admin/change-password', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("oldPassword").trim();
		req.sanitize("newPassword").trim();
		req.sanitize("confirmPassword").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('oldPassword', 'Enter old password').notEmpty();
	    req.check('newPassword', 'Enter new password').notEmpty();
	    req.check('confirmPassword', 'Enter confirm password').notEmpty();
	    req.check('newPassword', 'The New Password field must contain at least 6 characters, including UPPER/lower case & numbers & at-least a special character').matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/, "i");
	    req.check('confirmPassword', 'The Confirm Password field must contain at least 6 characters, including UPPER/lower case & numbers & at-least a special character').matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/, "i");
	    req.check('confirmPassword', 'The Confirm Password field does not match the new password field').equals(req.body.newPassword);
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
			let oldPassword         = custom.getMd5Value(req.sanitize('oldPassword').escape().trim());
			let newPassword         = custom.getMd5Value(req.sanitize('newPassword').escape().trim());
			let confirmPassword     = custom.getMd5Value(req.sanitize('confirmPassword').escape().trim());

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					if(respObj[0].userPassword !== oldPassword){
						return res.send({
						            "code": 200,
						            "response": {},
						            "status": 0,
						            "message": 'Old password doesn`t match.'
						        });
					}else if(newPassword === oldPassword){
						return res.send({
						            "code": 200,
						            "response": {},
						            "status": 0,
						            "message": 'New password should be different to current password.'
						        });
					}else{
						let userId = parseInt(respObj[0].masterUserId);
						let newLoginSessionKey = custom.getGuid();

						/* Update user password */
	                    database.pool.getConnection(function(err, connection) {

	                        /* Begin transaction */
	                        connection.beginTransaction(function(err) {
	                            if (err) {
	                                return res.send(custom.dbErrorResponse());
	                            }

	                        let userQuery = queryBuilder.update(constant.users,{userPassword:newPassword},{masterUserId:userId});
	                        queryBuilder.reset_query(userQuery);
	                        connection.query(userQuery, function(err, result) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }

	                        let userDetailsQuery = queryBuilder.update(constant.user_details,{userLoginSessionKey:newLoginSessionKey},{userId:userId});
	                        queryBuilder.reset_query(userDetailsQuery);
	                        connection.query(userDetailsQuery, function(err, result) {
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

		                            /* Return user response */
		                            let user_response = {newLoginSessionKey:newLoginSessionKey};
		                            res.send({"code" : 200, "response" : user_response,"status" : 1,"message" : 'Password changed successfully.'});
		                            return;
		                        }
		                    });
		                    });
		                    });
		                    });
		                });
					}			
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To get contact us list
	 * @param {string} userLoginSessionKey
	 */
	app.post('/admin/get-contact-list', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
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
			let totalMinutes        = req.body.totalMinutes;
			let identifire          = req.body.identifire;
			let finalTimeZoneFormatted  = req.body.finalTimeZoneFormatted;

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					
					/* Get contact us list */	
					let contactQuery = "SELECT * FROM `contact_us` AS `C` INNER JOIN `user_details` AS `UD` ON `C`.`contactUserId` = `UD`.`userId`  INNER JOIN `users` AS `U` ON `C`.`contactUserId` = `U`.`masterUserId` ORDER BY `C`.`contactId` DESC";
					model.customQuery(function(err,resp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(resp != ''){
		                		let conatctResponse = [];
							    for (var i = 0; i < parseInt(resp.length); i++) 
							    {
							    	let row = {};
							    	row.contactId  = parseInt(resp[i].contactId);
							    	row.contactName   = custom.nullChecker(resp[i].userFirstName) + " " + custom.nullChecker(resp[i].userLastName);
							    	row.contactPhone  = custom.nullChecker(resp[i].contactPhone);
							    	row.contactEmail  = custom.nullChecker(resp[i].userEmail);
							    	row.contactMessage = custom.nullChecker(resp[i].contactMessage);
							    	row.contactSubject = custom.nullChecker(resp[i].contactSubject);
							    	row.isRepliedByAdmin = custom.nullChecker(resp[i].isRepliedByAdmin);
							    	row.contactDateTime  = custom.changeDateFormat(resp[i].contactDateTime,constant.admin_date_format);
							    	row.replyMessage     = custom.nullChecker(resp[i].replyMessage);
							    	row.replyDateTime = (resp[i].replyDateTime) ? custom.changeDateFormat(resp[i].replyDateTime,constant.admin_date_format) : '';
							    	if(identifire === '+'){
					                    row.parsedContactDateTime = custom.changeDateFormat(moment(resp[i].contactDateTime).add(totalMinutes, 'minutes'),constant.admin_date_format);
					                }else{
					                    row.parsedContactDateTime = custom.changeDateFormat(moment(resp[i].contactDateTime).subtract(totalMinutes, 'minutes'),constant.admin_date_format);
					                }
							    	conatctResponse.push(row);
							    }
		                		return res.send({
							            "code": 200,
							            "response": conatctResponse,
							            "status": 1,
							            "message": 'success'
							        });
		                	}else{
		                		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": 'Contact requests not found'
							        });
		                	}
		                }
					},contactQuery);
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To get content details
	 * @param {string} userLoginSessionKey
	 * @param {string} contentType
	 */
	app.post('/admin/get-content-details', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("contentType").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('contentType', 'The Content type field is required').notEmpty();
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
			let contentType         = req.sanitize('contentType').escape().trim();

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					
					/* Get content details */	
					model.getAllWhere(function(err,resp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(resp != ''){
		                		return res.send({
							            "code": 200,
							            "response": {contentText:resp[0].contentText,contentModifiedDate:resp[0].contentModifiedDate},
							            "status": 1,
							            "message": 'success'
							        });
		                	}else{
		                		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": 'Content details not found'
							        });
		                	}
		                }
					},constant.content,{contentType:contentType});
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To update content details
	 * @param {string} userLoginSessionKey
	 * @param {string} contentType
	 * @param {string} contentText
	 */
	app.post('/admin/update-content', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("contentType").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('contentType', 'The Content type field is required').notEmpty();
	    req.check('contentText', 'The Content text field is required').notEmpty();
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
			let contentType         = req.sanitize('contentType').escape().trim();
			let contentText         = req.body.contentText;

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					
					/* Update content details */	
					model.updateData(function(err,resp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	return res.send({
						            "code": 200,
						            "response": {},
						            "status": 1,
						            "message": 'Content updated successfully'
						        });
		                }
					},constant.content,{contentText:contentText},{contentType:contentType});
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To get user report flags list
	 * @param {string} userLoginSessionKey
	 * @param {integer} userID
	 */
	app.post('/admin/report-flags-list', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("userID").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('userID', 'The User Id field is required').notEmpty();
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
			let userID              = parseInt(req.sanitize('userID').escape().trim());

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					
					/* Get report flags list */	
					let reportFlagQuery = "SELECT * FROM `report_users` AS `R` INNER JOIN `user_details` AS `UD` ON `R`.`userReportUserId` = `UD`.`userId` INNER JOIN `users` AS `U` ON `U`.`masterUserId` = `UD`.`userId`  WHERE `R`.`userReportFriendId` = " + userID + " ORDER BY `R`.`userReportId` DESC";
					model.customQuery(function(err,resp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(resp != ''){
		                		let reportFlagResponse = [];
							    for (var i = 0; i < parseInt(resp.length); i++) 
							    {
							    	let row = {};
							    	row.userReportId    = parseInt(resp[i].userReportId);
							    	row.userReportFriendId    = parseInt(resp[i].userReportFriendId);
							    	row.isAdminRemovedRedFlag = parseInt(resp[i].isAdminRemovedRedFlag);
							    	row.userReportFriendName  = custom.nullChecker(resp[i].userFirstName) + " " + custom.nullChecker(resp[i].userLastName);
							    	row.userReportFriendEmail = custom.nullChecker(resp[i].userEmail);
							    	row.userReportCategory    = custom.nullChecker(resp[i].userReportCategory);
							    	row.userReportDescprition = custom.nullChecker(resp[i].userReportDescprition);
							    	row.userReportDateTime    = custom.nullChecker(resp[i].userReportDateTime);
							    	row.adminRemoveReportFlagReason    = custom.nullChecker(resp[i].adminRemoveReportFlagReason);
							    	row.adminRemoveReportFlagDateTime    = custom.nullChecker(resp[i].adminRemoveReportFlagDateTime);
							    	row.userReportImage    = (!resp[i].userReportImage) ? new Array() : JSON.parse(resp[i].userReportImage);
							    	row.userReportImageThumbnail = (!resp[i].userReportImageThumbnail) ? new Array() : JSON.parse(resp[i].userReportImageThumbnail);
							    	row.userReportVideo = (!resp[i].userReportVideo) ? '' : constant.base_url + resp[i].userReportVideo;
							    	row.userReportVideoThumbnail = (!resp[i].userReportVideoThumbnail) ? '' : constant.base_url + resp[i].userReportVideoThumbnail;
							    	reportFlagResponse.push(row);
							    }
		                		return res.send({
							            "code": 200,
							            "response": reportFlagResponse,
							            "status": 1,
							            "message": 'success'
							        });
		                	}else{
		                		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": 'Report Flags not found'
							        });
		                	}
		                }
					},reportFlagQuery);
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To get user report flags details
	 * @param {string} userLoginSessionKey
	 * @param {integer} userReportId
	 */
	app.post('/admin/get-report-flag-details', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("userReportId").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('userReportId', 'The User Id field is required').notEmpty();
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
			let userReportId        = parseInt(req.sanitize('userReportId').escape().trim());

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					
					/* Get report flags details */	
					let reportFlagQuery = "SELECT * FROM `report_users` AS `R` INNER JOIN `user_details` AS `UD` ON `R`.`userReportUserId` = `UD`.`userId` INNER JOIN `users` AS `U` ON `U`.`masterUserId` = `UD`.`userId`  WHERE `R`.`userReportId` = " + userReportId;
					model.customQuery(function(err,resp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(resp != ''){
		                		let reportFlagResponse = [];
							    for (var i = 0; i < parseInt(resp.length); i++) 
							    {
							    	let row = {};
							    	row.userReportId    = parseInt(resp[i].userReportId);
							    	row.userReportFriendId    = parseInt(resp[i].userReportFriendId);
							    	row.isAdminRemovedRedFlag = parseInt(resp[i].isAdminRemovedRedFlag);
							    	row.userReportFriendName  = custom.nullChecker(resp[i].userFirstName) + " " + custom.nullChecker(resp[i].userLastName);
							    	row.userReportFriendEmail = custom.nullChecker(resp[i].userEmail);
							    	row.userReportCategory    = custom.nullChecker(resp[i].userReportCategory);
							    	row.userReportDescprition = custom.nullChecker(resp[i].userReportDescprition);
							    	row.userReportDateTime    = custom.nullChecker(resp[i].userReportDateTime);
							    	row.adminRemoveReportFlagReason    = custom.nullChecker(resp[i].adminRemoveReportFlagReason);
							    	row.adminRemoveReportFlagDateTime    = custom.nullChecker(resp[i].adminRemoveReportFlagDateTime);
							    	row.userReportImage    = (!resp[i].userReportImage) ? new Array() : JSON.parse(resp[i].userReportImage);
							    	row.userReportImageThumbnail = (!resp[i].userReportImageThumbnail) ? new Array() : JSON.parse(resp[i].userReportImageThumbnail);
							    	row.userReportVideo = (!resp[i].userReportVideo) ? '' : resp[i].userReportVideo;
							    	row.userReportVideoThumbnail = (!resp[i].userReportVideoThumbnail) ? '' : constant.base_url + resp[i].userReportVideoThumbnail;
							    	reportFlagResponse.push(row);
							    }
		                		return res.send({
							            "code": 200,
							            "response": reportFlagResponse[0],
							            "status": 1,
							            "message": 'success'
							        });
		                	}else{
		                		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": 'Report Flag details not found'
							        });
		                	}
		                }
					},reportFlagQuery);
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To get user transaction dispute details
	 * @param {string} userLoginSessionKey
	 * @param {integer} txnID
	 */
	app.post('/admin/view-txn-dispute', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("txnID").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('txnID', 'The transaction id field is required').notEmpty();
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
			let txnID               = parseInt(req.sanitize('txnID').escape().trim());

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					
					/* Get transaction details */
					let txnQuery = 'SELECT * FROM ' + constant.transactions + ' AS `T` INNER JOIN ' + constant.txn_disputes + ' AS `TD` ON `T`.`transactionID` = `TD`.`disputeTxnID` WHERE `T`.`transactionID` = ' + txnID;
					model.customQuery(function(err,resp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(resp != ''){
		                		return res.send({
							            "code": 200,
							            "response": resp[0],
							            "status": 1,
							            "message": 'success'
							        });
		                	}else{
		                		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": 'Transaction details not found'
							        });
		                	}
		                }
					},txnQuery);
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To respond on transaction dispute request 
	 * @param {string}  userLoginSessionKey
	 * @param {integer} txnID
	 * @param {string}  respondType
	 * @param {string}  adminReason
	 */
	app.post('/admin/respond-txn-dispute-request', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("txnID").trim();
		req.sanitize("respondType").trim();
		req.sanitize("adminReason").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('txnID', 'The transaction id field is required').notEmpty();
	    req.check('adminReason', 'The message field is required').notEmpty();
	    req.check('respondType', 'The respond type field is required').notEmpty();
	    req.check('respondType', custom.lang(locale,'Respond type should be REJECT Or REFUND')).inList(["REJECT","REFUND"]);
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
			let txnID               = parseInt(req.sanitize('txnID').escape().trim());
			let respondType         = req.sanitize('respondType').escape().trim();
			let adminReason         = req.sanitize('adminReason').escape().trim();

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					let masterUserId = parseInt(respObj[0].userId);
					
					/* Get transaction details */
					let txnQuery = 'SELECT * FROM ' + constant.transactions + ' AS `T` INNER JOIN ' + constant.txn_disputes + ' AS `TD` ON `T`.`transactionID` = `TD`.`disputeTxnID` WHERE `T`.`transactionID` = ' + txnID;
					model.customQuery(function(err,txnResp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(txnResp != ''){
		                		if(txnResp[0].disputeStatus === 'PENDING'){

		                			let userID = parseInt(txnResp[0].transactionUserID);

		                			if(respondType === 'REFUND'){

		                				let chargeID      = '';
		                				let stripeTxnResp = (!txnResp[0].transactionPaymentResponse) ? {} : JSON.parse(txnResp[0].transactionPaymentResponse);
		                				chargeID          = (!stripeTxnResp.id) ? '' : stripeTxnResp.id;
		                				if(chargeID != ""){

		                					/* Load stripe library */
				                			let stripe = require(appRoot + '/lib/stripe.js');

				                			/* Refund payment in user stripe account */
											stripe.refundPayment(function(err,paymentResp){
												if(err){

													/* Insert Transaction history (Backgroud Process) */
						                            let txnObj = {};
						                            txnObj.transactionUserID   = masterUserId;
						                            txnObj.transactionCustomID = custom.generateCustomID('TXN');
						                            txnObj.transactionAmount   = txnResp[0].transactionAmount;
						                            txnObj.transactionDateTime = custom.getCurrentTime();
						                            txnObj.transactionStatus   = 'FAILED';
						                            txnObj.transactionModuleName = 'ADMIN_TXN_REFUND_AMOUNT';
						                            txnObj.transactionMessage    = '$' + txnResp[0].transactionAmount + ' failed to refund money';
						                            txnObj.transactionPaymentResponse = JSON.stringify({error:err.message,txnID:txnID});
						                            txnObj.transactionPaymentDateTime = custom.getCurrentTime();
						                            model.insertData(function(err,resp){
						                            	if(err){
						                            		console.log('Failed to add transactions refund money ',err.message);
						                            	}
						                            },constant.transactions,txnObj);

													return res.send({
													            "code": 200,
													            "response": {},
													            "status": 0,
													            "message": custom.lang(locale,err.message)
													        });
												}else{
													
													database.pool.getConnection(function(err, connection) {

											   		/* Begin transaction */
									                    connection.beginTransaction(function(err) {
									                        if (err) {
									                            return res.send(custom.dbErrorResponse());
									                        }

									                        /* Update transaction status */	   
															let disputeObj = {};
															disputeObj.transactionDisputeStatus = 'ADMIN_COMPLETED';
									                        let u1 = queryBuilder.update(constant.transactions,disputeObj,{transactionID:txnID});
									                        queryBuilder.reset_query(u1);
									                        connection.query(u1, function(err, disputeResp) {
										                        if (err) {
										                            connection.rollback(function() {
										                                return res.send(custom.dbErrorResponse(err.sqlMessage));
										                            });
										                        }

										                    /* Update dispute status */
										                    let disputeUpdateObj = {};
										                    disputeUpdateObj.disputeStatus = 'ADMIN_COMPLETED';
										                    disputeUpdateObj.disputeResponseDateTime = custom.getCurrentTime();
										                    disputeUpdateObj.disputeExtraParams      = JSON.stringify({adminReason:adminReason});
										                    let u1 = queryBuilder.update(constant.txn_disputes,disputeUpdateObj,{disputeTxnID:txnID});
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

										                            // BACKGROUD PROCESS (IN QUEUE)

										                            /* Insert Transaction history (Backgroud Process) */
										                            let txnObj = {};
										                            txnObj.transactionUserID   = masterUserId;
										                            txnObj.transactionCustomID = custom.generateCustomID('TXN');
										                            txnObj.transactionAmount   = txnResp[0].transactionAmount;
										                            txnObj.transactionDateTime = custom.getCurrentTime();
										                            txnObj.transactionStatus   = 'FAILED';
										                            txnObj.transactionModuleName = 'ADMIN_TXN_REFUND_AMOUNT';
										                            txnObj.transactionMessage    = '$' + txnResp[0].transactionAmount + ' amount refunded to user account';
										                            txnObj.transactionPaymentResponse = JSON.stringify({txnID:txnID,paymentResp:paymentResp});
										                            txnObj.transactionPaymentDateTime = custom.getCurrentTime();
										                            model.insertData(function(err,resp){
										                            	if(err){
										                            		console.log('Failed to add transactions refund money ',err.message);
										                            	}
										                            },constant.transactions,txnObj);

										                            /* Insert dispute request notification */
																   	let notificationDataObj = {};
											                		notificationDataObj.notificationUserId   = masterUserId;
											                		notificationDataObj.notificationFriendId = userID;
											                		notificationDataObj.txnModuleID          = txnID;
											                		notificationDataObj.notificationModule   = 'GLOBAL';
											                		notificationDataObj.notificationType     = 'TXN_DISPUTE_AMOUNT_REFUNDED';
											                		notificationDataObj.notificationMessage  = '$' + txnResp[0].transactionAmount +  ' amount refunded into your payment gateway account by ' + constant.site_name + ' team';
											                		notificationDataObj.notificationParams   = JSON.stringify({transactionCustomID:txnResp[0].transactionCustomID,adminReason:adminReason});
											                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
											                		model.insertData(function(err,notificationResp){
										                            	if(err){
										                            		console.log('Transaction dispute request refund amount notification error',err);
										                            	}else{
										                            		console.log('Transaction dispute request refund amount notification success');
										                            	}
										                            },constant.notifications,notificationDataObj);

										                            /* Update user badges */
										                            let updateQuery = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + userID;
										                            model.customQuery(function(err,badgesResp){
										                            	if(err){
										                            		console.log('Transaction dispute request refund amount notification badges error',err);
										                            	}else{
										                            		console.log('Transaction dispute request refund amount notification badges success');
										                            	}
										                            },updateQuery);

										                            /* To send push notifications */
										                            let userMessage = '$' + txnResp[0].transactionAmount +  ' amount refunded into your payment gateway account by ' + constant.site_name + ' team';
										                            let extraParams = {};
										                            extraParams.txnModuleID       = txnID;
										                            extraParams.transactionUserID = userID;
										                            extraParams.moduleName        = 'GLOBAL';
										                            extraParams.notificationType  = 'TXN_DISPUTE_AMOUNT_REFUNDED';
										                            notification.sendPushNotifications(userMessage,userID,extraParams);

										                            /* Return user response */
												            		return res.send({"code" : 200, "response" : {},"status" : 1,"message" : '$' + txnResp[0].transactionAmount + custom.lang(locale,' amount refunded into user stripe account')});
										                        }
									                    	});
									                    	});
									                    	});
									                	});
													}); 													
												}
											},chargeID);
		                				}else{
		                					return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": constant.general_error
											        });
		                				}
		                			}else{ // REJECT REQUEST

		                				database.pool.getConnection(function(err, connection) {

									   		/* Begin transaction */
						                    connection.beginTransaction(function(err) {
						                        if (err) {
						                            return res.send(custom.dbErrorResponse());
						                        }

						                        /* Update transaction status */	   
												let disputeObj = {};
												disputeObj.transactionDisputeStatus = 'ADMIN_REJECTED';
						                        let u1 = queryBuilder.update(constant.transactions,disputeObj,{transactionID:txnID});
						                        queryBuilder.reset_query(u1);
						                        connection.query(u1, function(err, disputeResp) {
							                        if (err) {
							                            connection.rollback(function() {
							                                return res.send(custom.dbErrorResponse(err.sqlMessage));
							                            });
							                        }

							                    /* Update dispute status */
							                    let disputeUpdateObj = {};
							                    disputeUpdateObj.disputeStatus = 'ADMIN_REJECTED';
							                    disputeUpdateObj.disputeResponseDateTime = custom.getCurrentTime();
							                    disputeUpdateObj.disputeExtraParams      = JSON.stringify({adminReason:adminReason});
							                    let u1 = queryBuilder.update(constant.txn_disputes,disputeUpdateObj,{disputeTxnID:txnID});
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

							                            // BACKGROUD PROCESS (IN QUEUE)

							                            /* Insert dispute request notification */
													   	let notificationDataObj = {};
								                		notificationDataObj.notificationUserId   = masterUserId;
								                		notificationDataObj.notificationFriendId = userID;
								                		notificationDataObj.txnModuleID          = txnID;
								                		notificationDataObj.notificationModule   = 'PROVIDER';
								                		notificationDataObj.notificationType     = 'TXN_DISPUTE_REQUEST_REJECTED';
								                		notificationDataObj.notificationMessage  = 'Transaction ID ' + txnResp[0].transactionCustomID + ' dispute request rejected by ' + constant.site_name + ' team';
								                		notificationDataObj.notificationParams   = JSON.stringify({transactionCustomID:txnResp[0].transactionCustomID,adminReason:adminReason});
								                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
								                		model.insertData(function(err,notificationResp){
							                            	if(err){
							                            		console.log('Transaction dispute request rejected notification error',err);
							                            	}else{
							                            		console.log('Transaction dispute request rejected notification success');
							                            	}
							                            },constant.notifications,notificationDataObj);

							                            /* Update user badges */
							                            let updateQuery = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + userID;
							                            model.customQuery(function(err,badgesResp){
							                            	if(err){
							                            		console.log('Transaction dispute request rejected notification badges error',err);
							                            	}else{
							                            		console.log('Transaction dispute request rejected notification badges success');
							                            	}
							                            },updateQuery);

							                            /* To send push notifications */
							                            let userMessage = constant.site_name + " has rejected your transaction dispute request";
							                            let extraParams = {};
							                            extraParams.txnModuleID       = txnID;
							                            extraParams.transactionUserID = userID;
							                            extraParams.moduleName        = 'PROVIDER';
							                            extraParams.notificationType  = 'TXN_DISPUTE_REQUEST_REJECTED';
							                            notification.sendPushNotifications(userMessage,userID,extraParams);

							                            /* Return user response */
									            		return res.send({"code" : 200, "response" : {},"status" : 1,"message" : custom.lang(locale,'Transaction dispute request rejected successfully.')});
							                        }
						                    	});
						                    	});
						                    	});
						                	});
										}); 
		                			}
		                		}else if(resp[0].disputeStatus === 'ADMIN_REJECTED'){
		                			return res.send({
								            "code": 200,
								            "response": {},
								            "status": 0,
								            "message": 'You already rejected dispute request'
								        });
		                		}else if(resp[0].disputeStatus === 'ADMIN_COMPLETED'){
		                			return res.send({
								            "code": 200,
								            "response": {},
								            "status": 0,
								            "message": 'You already refunded amount'
								        });
		                		}else{
		                			return res.send({
								            "code": 200,
								            "response": {},
								            "status": 0,
								            "message": constant.general_error
								        });
		                		}
		                	}else{
		                		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": 'Transaction details not found'
							        });
		                	}
		                }
					},txnQuery);
				}
			},userLoginSessionKey);
		}
	});


	/**
	 * To get users list
	 * @param {string} userLoginSessionKey
	 */
	app.post('/admin/get-users-list', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
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

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					
					/* Get users list */	
					let userQuery = "SELECT * FROM `users` INNER JOIN `user_details` ON `users`.`masterUserId`=`user_details`.`userId` WHERE `users`.`userType` = 'NORMAL_USER' ORDER BY `users`.`masterUserId` DESC ";
					model.customQuery(function(err,resp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(resp != ''){
		                		let usersResponse = [];
							    for (var i = 0; i < parseInt(resp.length); i++) 
							    {
							    	let row = {};
							    	row.masterUserId  = parseInt(resp[i].masterUserId);
							    	row.userFirstName   = custom.nullChecker(resp[i].userFirstName);
							    	row.userLastName  = custom.nullChecker(resp[i].userLastName);
							    	row.userCountry  = custom.nullChecker(resp[i].userCountry);
							    	row.userEmail = custom.nullChecker(resp[i].userEmail);
							    	row.userGender = custom.nullChecker(resp[i].userGender);
							    	row.isUserBlocked = custom.nullChecker(resp[i].isUserBlocked);
							    	row.userEmailVerified = parseInt(resp[i].userEmailVerified);
							    	row.userRegistrationDate = custom.changeDateFormat(resp[i].userRegistrationDate,constant.admin_date_format);
							    	row.userLastLogin = (resp[i].userLastLogin) ? custom.changeDateFormat(resp[i].userLastLogin,constant.admin_date_format) : '';
							    	usersResponse.push(row);
							    }
		                		return res.send({
							            "code": 200,
							            "response": usersResponse,
							            "status": 1,
							            "message": 'success'
							        });
		                	}else{
		                		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": 'Users not found'
							        });
		                	}
		                }
					},userQuery);
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To search users
	 * @param {string} userLoginSessionKey
	 * @param {string} moduleType
	 */
	app.post('/admin/search-users', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("moduleType").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('moduleType', 'The Module type field is required').notEmpty();
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
			let moduleType          = req.sanitize('moduleType').escape().trim();

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					
					/* Get users list */	
					let userQuery = "SELECT * FROM `users` INNER JOIN `user_details` ON `users`.`masterUserId`=`user_details`.`userId` WHERE `users`.`userType` = 'NORMAL_USER' AND `user_details`." +moduleType+ " = 1 ORDER BY `users`.`masterUserId` DESC ";
					model.customQuery(function(err,resp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(resp != ''){
		                		let usersResponse = [];
							    for (var i = 0; i < parseInt(resp.length); i++) 
							    {
							    	let row = {};
							    	row.masterUserId  = parseInt(resp[i].masterUserId);
							    	row.userFirstName   = custom.nullChecker(resp[i].userFirstName);
							    	row.userLastName  = custom.nullChecker(resp[i].userLastName);
							    	row.userCountry  = custom.nullChecker(resp[i].userCountry);
							    	row.userEmail = custom.nullChecker(resp[i].userEmail);
							    	row.userGender = custom.nullChecker(resp[i].userGender);
							    	row.isUserBlocked = custom.nullChecker(resp[i].isUserBlocked);
							    	row.userEmailVerified = parseInt(resp[i].userEmailVerified);
							    	row.userRegistrationDate = custom.changeDateFormat(resp[i].userRegistrationDate,constant.admin_date_format);
							    	row.userLastLogin = (resp[i].userLastLogin) ? custom.changeDateFormat(resp[i].userLastLogin,constant.admin_date_format) : '';
							    	usersResponse.push(row);
							    }
		                		return res.send({
							            "code": 200,
							            "response": usersResponse,
							            "status": 1,
							            "message": 'success'
							        });
		                	}else{
		                		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": 'Users not found'
							        });
		                	}
		                }
					},userQuery);
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To get users count module wise
	 * @param {string} userLoginSessionKey
	 */
	app.post('/admin/users-count-module-wise', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
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

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{

					let friendCount   = 0;
					let datingCount   = 0;
					let providerCount = 0;
					let noneCount     = 0;
					let usersResponse = new Array();

					async.waterfall([
					    function(callback) {
					    	
					    	/* Get Friendly Count */
					    	model.getCount(function(err,friendCountResp){
					    		if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	friendCount = parseInt(friendCountResp);
				                	callback(null, friendCount);
				                }
					    	},constant.user_details,{isPreferencesAdded:1});
					    },
					    function(friendCount, callback) {

					    	/* Get Dating Count */
					    	model.getCount(function(err,datingCountResp){
					    		if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	datingCount = parseInt(datingCountResp);
				                	callback(null, friendCount,datingCount);
				                }
					    	},constant.user_details,{isDatingPreferenceAdded:1});
					    },
					    function(friendCount,datingCount, callback) {

					    	/* Get Provider Count */
					    	model.getCount(function(err,providerCountResp){
					    		if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	providerCount = parseInt(providerCountResp);
				                	callback(null, friendCount,datingCount,providerCount);
				                }
					    	},constant.user_details,{isProviderPreferenceAdded:1});
					    },
					    function(friendCount,datingCount,providerCount, callback) {

					    	/* Get None (New Users) Count */
					    	model.getCount(function(err,noneCountResp){
					    		if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	noneCount = parseInt(noneCountResp);
				                	callback(null, friendCount,datingCount,providerCount,noneCount);
				                }
					    	},constant.user_details,{isPreferencesAdded:0,isDatingPreferenceAdded:0,isProviderPreferenceAdded:0});
					    },
					], function (err,friendCount,datingCount,providerCount,noneCount) {
						usersResponse.push({name:'Friendly',y:friendCount});
						usersResponse.push({name:'Dating',y:datingCount});
						usersResponse.push({name:'Provider',y:providerCount});
						usersResponse.push({name:'New Users',y:noneCount});
						return res.send({
						            "code": 200,
						            "response": usersResponse,
						            "status": 1,
						            "message": 'success'
						        });
					});
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To get jobs count
	 * @param {string} userLoginSessionKey
	 */
	app.post('/admin/jobs-count', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
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

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{

					let completedJobs = 0;
					let runningJobs   = 0;
					let pendingJobs   = 0;
					let cancelledJobs = 0;
					let mutuallyCancelledJobs = 0;
					let usersResponse = new Array();

					async.waterfall([
					    function(callback) {
					    	
					    	/* Get All Jobs Data */
					    	model.getAllWhere(function(err,jobsresp){
					    		if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	let totalJobs = parseInt(jobsresp.length);
				                	if(totalJobs > 0)
				                	{
				                		for (var i = 0; i < totalJobs; i++) 
				                		{
				                			if(jobsresp[i].jobGlobalStatus === 'COMPLETED'){
				                				completedJobs = completedJobs + 1;
				                			}else if(jobsresp[i].jobGlobalStatus === 'PENDING' && jobsresp[i].jobAcceptStatus === 'ACCEPT'){
				                				runningJobs = runningJobs + 1;
				                			}else if(jobsresp[i].jobGlobalStatus === 'PENDING' && jobsresp[i].jobAcceptStatus === 'PENDING'){
				                				pendingJobs = pendingJobs + 1;
				                			}else if(jobsresp[i].jobGlobalStatus === 'CANCELED'){
				                				cancelledJobs = cancelledJobs + 1;
				                			}else if(jobsresp[i].jobGlobalStatus === 'MUTUALLY_CANCELED'){
				                				mutuallyCancelledJobs = mutuallyCancelledJobs + 1;
				                			}
				                			if(i === parseInt(totalJobs - 1))	
				                			{
				                				callback(null, 'DONE');
				                			}
				                		}
				                	}
				                }
					    	},constant.jobs);
					    },
					], function (err,type) {
						usersResponse.push({title:'Completed',name:'Completed',y:completedJobs});
						usersResponse.push({title:'Running',name:'Running',y:runningJobs});
						usersResponse.push({title:'Pending',name:'Pending (Waiting For Accpet)',y:pendingJobs});
						usersResponse.push({title:'Cancelled',name:'Cancelled Request (Waiting For Mutually Approval)',y:cancelledJobs});
						usersResponse.push({title:'Mutually Cancelled',name:'Cancelled',y:mutuallyCancelledJobs});
						return res.send({
						            "code": 200,
						            "response": usersResponse,
						            "status": 1,
						            "message": 'success'
						        });
					});
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To get orders count
	 * @param {string} userLoginSessionKey
	 */
	app.post('/admin/orders-count', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
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
			let dateRange = (typeof req.body.dateRange === 'string') ? JSON.parse(req.body.dateRange) : req.body.dateRange;

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					let startDate = '';
					let endDate   = '';
					if(dateRange == ""){
						let currentTime = custom.getCurrentTime();
						let newEndDate  = custom.changeDateFormat(currentTime,'yyyy-mm-dd');
						startDate = custom.changeDateFormat(moment(currentTime).subtract(15, 'days'),'yyyy-mm-dd');
						endDate   = newEndDate;
					}else{
						startDate = custom.changeDateFormat(dateRange.startDate,'yyyy-mm-dd');
						endDate   = custom.changeDateFormat(dateRange.endDate,'yyyy-mm-dd');
					}

					let dateRangeText = "(" + startDate + " To " + endDate + ")"; 
					let categories    = custom.getDates(startDate,endDate); 
					let allDates      = categories; 
					let values        = new Array(); 

					/* Get order earning */
					let orderQuery = "SELECT SUM(`orderTotalAmount`) AS orderTotalAmount, SUM(`orderQLFeesAmount`) AS `orderQLFeesAmount`, DATE(`orderDateTime`) AS orderDate FROM `orders` WHERE DATE(`orderDateTime`) IN ('"+categories.join("','")+"') GROUP BY DATE(`orderDateTime`) ORDER BY `orderDateTime` ASC ";
					model.customQuery(function(err,orderResp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(orderResp != ""){
		                		let totalOrders  = parseInt(orderResp.length);
		                		let orderDateObj = new Map();
		                		for (var i = 0; i < totalOrders; i++) 
		                		{
		                			let orderDate  = custom.changeDateFormat(orderResp[i].orderDate,'yyyy-mm-dd');
		                			orderDateObj.set(orderDate, custom.parseNumber(orderResp[i].orderQLFeesAmount));
		                			if(i === parseInt(totalOrders - 1))
		                			{
		                				let totalCategories = parseInt(categories.length);
		                				for (var j = 0; j < totalCategories; j++) 
		                				{
		                					if(orderDateObj.has(categories[j])){
		                						values.push(orderDateObj.get(categories[j]));
		                					}else{
		                						values.push(0);
		                					}
		                					if(j === parseInt(totalCategories - 1))
		                					{
						                		return res.send({
													            "code": 200,
													            "response": {dateRangeText:dateRangeText,categories:categories,values:values},
													            "status": 1,
													            "message": 'success'
													        });
		                					}
		                				}
		                			}
		                		}
		                	}else{
		                		return res.send({
						            "code": 200,
						            "response": {dateRangeText:dateRangeText,categories:new Array(),values:new Array()},
						            "status": 1,
						            "message": 'success'
						        });
		                	}
		                }
					},orderQuery);
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To get user order history
	 * @param {string} userLoginSessionKey
	 * @param {integer} userID
	 * @param {string} orderType
	 */
	app.post('/admin/order-history', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("userID").trim();
		req.sanitize("orderType").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('userID', 'The User Id field is required').notEmpty();
	    req.check('orderType', 'The Order type field is required').notEmpty();
	    req.check('orderType', custom.lang(locale,'Order Type should be in MY_ORDERS, RECEIVED_ORDERS')).inList(["MY_ORDERS","RECEIVED_ORDERS"]);
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
			let userID              = parseInt(req.sanitize('userID').escape().trim());
			let orderType           = req.sanitize('orderType').escape().trim();

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					
					/* To get orders data */
			    	if(orderType === 'RECEIVED_ORDERS'){
			    		var orderQuery = "SELECT * FROM " + constant.orders + " AS `O` INNER JOIN " + constant.user_details + " AS `UD` ON `UD`.`userId` = `O`.`orderUserID` INNER JOIN `order_products` AS `OP` ON `OP`.`orderParentID` = `O`.`orderID` WHERE `O`.`orderProductOwnerUserID` = " + userID + " AND `O`.`orderPaymentStatus` = 'COMPLETED' AND `UD`.`userId` NOT IN (0) ORDER BY `O`.`orderID` DESC ";
			    	}else{
			    		var orderQuery = "SELECT * FROM " + constant.orders + " AS `O` INNER JOIN " + constant.user_details + " AS `UD` ON `UD`.`userId` = `O`.`orderProductOwnerUserID` INNER JOIN `order_products` AS `OP` ON `OP`.`orderParentID` = `O`.`orderID` WHERE `O`.`orderUserID` = " + userID + " AND `O`.`orderPaymentStatus` IN ('COMPLETED','FAILED') AND `UD`.`userId` NOT IN (0) ORDER BY `O`.`orderID` DESC ";
			    	}
			    	model.customQuery(function(err,orderObj){
			    		if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(orderObj != ""){
		                		let responseObj  = [];
		                		for (var o = 0; o < parseInt(orderObj.length); o++) 
				                {
				                	let row = {};
				                	row.orderID = parseInt(orderObj[o].orderID);
				                	row.orderCustomID = custom.nullChecker(orderObj[o].orderCustomID);
				                	row.orderTotalAmount      = custom.parseNumber(orderObj[o].orderTotalAmount);
			    					row.orderProviderAmount   = custom.parseNumber(orderObj[o].orderProviderAmount);
			    					row.orderQLFeesAmount     = custom.parseNumber(orderObj[o].orderQLFeesAmount);
			    					row.orderDateTime  	      = custom.changeDateFormat(orderObj[o].orderDateTime);
			    					if(orderType === 'RECEIVED_ORDERS'){
				                		row.userName = custom.nullChecker(orderObj[o].userFirstName) + " " + custom.nullChecker(orderObj[o].userLastName);
			    					}else{
				                		row.sellerName = custom.nullChecker(orderObj[o].userFirstName) + " " + custom.nullChecker(orderObj[o].userLastName);
			    					}
			    					responseObj.push(row);
				                	if (o === parseInt(orderObj.length - 1)) {
				                      return res.send({
										            "code": 200,
										            "response": responseObj,
										            "status": 1,
										            "message": "success."
										        });
				                    }
				                }
		                	}else{
		                		return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": 'Order history not found'
									        });
		                	}
		                }
		            },orderQuery);
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To get order details
	 * @param {string} userLoginSessionKey
	 * @param {string} orderID
	 */
	app.post('/admin/get-order-details', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("orderID").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('orderID', 'The Order ID field is required').notEmpty();
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
			let orderID          = req.sanitize('orderID').escape().trim();

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
					},userLoginSessionKey);
			    },
			    function(userDetailsObj, callback) {

			    	/* To get orders details */
			    	let orderQuery = 'SELECT * FROM ' + constant.orders + ' AS `O` INNER JOIN ' + constant.order_products + ' AS `OP` ON `O`.`orderID` = `OP`.`orderParentID` WHERE `O`.`orderID` = ' + orderID;
			    	model.customQuery(function(err,orderObj){
				        	if(err){
			                    return res.send(custom.dbErrorResponse());
			                }else{
			                	if(orderObj != ""){
			                		callback(null, userDetailsObj, orderObj);
			                	}else{
			                		return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": "Order details not found."
									        });
			                	}
			                }
				    },orderQuery);
			    },
			    function(userDetailsObj,orderObj, callback) {

			    	let masterUserId  = parseInt(userDetailsObj[0].userId);
					let orderUserID   = parseInt(orderObj[0].orderUserID);
					let orderProductOwnerUserID = parseInt(orderObj[0].orderProductOwnerUserID);
					let buyerDetails    = {};
					let providerDetails = {};
					if(masterUserId === orderUserID){ // Buyer
						buyerDetails.userEmail     = custom.nullChecker(userDetailsObj[0].userEmail);
						buyerDetails.userFirstName = custom.nullChecker(userDetailsObj[0].userFirstName);
						buyerDetails.userLastName  = custom.nullChecker(userDetailsObj[0].userLastName);
						buyerDetails.userAddress   = custom.nullChecker(userDetailsObj[0].userAddress);
						buyerDetails.userLatitude  = custom.nullChecker(userDetailsObj[0].userLatitude);
						buyerDetails.userLongitude = custom.nullChecker(userDetailsObj[0].userLongitude);
						buyerDetails.userCountry   = custom.nullChecker(userDetailsObj[0].userCountry);
						buyerDetails.userImage     = (!userDetailsObj[0].userImage) ? '' : constant.base_url + userDetailsObj[0].userImage;
						buyerDetails.userImageThumbnail = (!userDetailsObj[0].userImageThumbnail) ? '' : constant.base_url + userDetailsObj[0].userImageThumbnail;

						/* Get provider details */
						custom.getUserProfileDetails(function(respType,providerDetailsResp){
							if(respType === 0){
								return providerDetailsResp;
							}else{
								providerDetails.userEmail     = custom.nullChecker(providerDetailsResp[0].userEmail);
								providerDetails.userFirstName = custom.nullChecker(providerDetailsResp[0].userFirstName);
								providerDetails.userLastName  = custom.nullChecker(providerDetailsResp[0].userLastName);
								providerDetails.userAddress   = custom.nullChecker(providerDetailsResp[0].userAddress);
								providerDetails.userLatitude  = custom.nullChecker(providerDetailsResp[0].userLatitude);
								providerDetails.userLongitude = custom.nullChecker(providerDetailsResp[0].userLongitude);
								providerDetails.userCountry   = custom.nullChecker(providerDetailsResp[0].userCountry);
								providerDetails.userImage     = (!providerDetailsResp[0].userImage) ? '' : constant.base_url + providerDetailsResp[0].userImage;
								providerDetails.userImageThumbnail = (!providerDetailsResp[0].userImageThumbnail) ? '' : constant.base_url + providerDetailsResp[0].userImageThumbnail;
								
								callback(null, userDetailsObj, orderObj,buyerDetails,providerDetails);
							}
						},orderProductOwnerUserID);
					}else{ // Provider
						providerDetails.userEmail     = custom.nullChecker(userDetailsObj[0].userEmail);
						providerDetails.userFirstName = custom.nullChecker(userDetailsObj[0].userFirstName);
						providerDetails.userLastName  = custom.nullChecker(userDetailsObj[0].userLastName);
						providerDetails.userAddress   = custom.nullChecker(userDetailsObj[0].userAddress);
						providerDetails.userLatitude  = custom.nullChecker(userDetailsObj[0].userLatitude);
						providerDetails.userLongitude = custom.nullChecker(userDetailsObj[0].userLongitude);
						providerDetails.userCountry   = custom.nullChecker(userDetailsObj[0].userCountry);
						providerDetails.userImage     = (!userDetailsObj[0].userImage) ? '' : constant.base_url + userDetailsObj[0].userImage;
						providerDetails.userImageThumbnail = (!userDetailsObj[0].userImageThumbnail) ? '' : constant.base_url + userDetailsObj[0].userImageThumbnail;

						/* Get buyer details */
						custom.getUserProfileDetails(function(respType,buyerDetailsResp){
							if(respType === 0){
								return buyerDetailsResp;
							}else{
								buyerDetails.userEmail     = custom.nullChecker(buyerDetailsResp[0].userEmail);
								buyerDetails.userFirstName = custom.nullChecker(buyerDetailsResp[0].userFirstName);
								buyerDetails.userLastName  = custom.nullChecker(buyerDetailsResp[0].userLastName);
								buyerDetails.userAddress   = custom.nullChecker(buyerDetailsResp[0].userAddress);
								buyerDetails.userLatitude  = custom.nullChecker(buyerDetailsResp[0].userLatitude);
								buyerDetails.userLongitude = custom.nullChecker(buyerDetailsResp[0].userLongitude);
								buyerDetails.userCountry   = custom.nullChecker(buyerDetailsResp[0].userCountry);
								buyerDetails.userImage     = (!buyerDetailsResp[0].userImage) ? '' : constant.base_url + buyerDetailsResp[0].userImage;
								buyerDetails.userImageThumbnail = (!buyerDetailsResp[0].userImageThumbnail) ? '' : constant.base_url + buyerDetailsResp[0].userImageThumbnail;

								callback(null, userDetailsObj, orderObj,buyerDetails,providerDetails);
							}
						},orderUserID);
					}
			    }
			], function (err,userDetailsObj,orderObj,buyerDetails,providerDetails) {

				let orderProductOriginalImagesArr  = new Array();
				let orderProductThumbnailImagesArr = new Array();
				let orderProductOriginalImages     = (!orderObj[0].orderProductOriginalImages) ? new Array() : JSON.parse(orderObj[0].orderProductOriginalImages);
				let orderProductThumbnailImages    = (!orderObj[0].orderProductThumbnailImages) ? new Array() : JSON.parse(orderObj[0].orderProductThumbnailImages);
				if(parseInt(orderProductOriginalImages.length) > 0)
				{
					for (var i = 0; i < parseInt(orderProductOriginalImages.length); i++) 
					{
						if(orderProductOriginalImages[i])
						{
							orderProductOriginalImagesArr.push(constant.base_url + orderProductOriginalImages[i]);
						}
					}
				}
				if(parseInt(orderProductThumbnailImages.length) > 0)
				{
					for (var j = 0; j < parseInt(orderProductThumbnailImages.length); j++) 
					{
						if(orderProductThumbnailImages[j])
						{
							orderProductThumbnailImagesArr.push(constant.base_url + orderProductThumbnailImages[j]);
						}
					}
				}
			    let responseObj = {};
			    	responseObj.orderID                   = parseInt(orderObj[0].orderID);
			    	responseObj.orderCustomID             = custom.nullChecker(orderObj[0].orderCustomID);
			    	responseObj.orderUserID               = parseInt(orderObj[0].orderUserID);
			    	responseObj.orderProductOwnerUserID   = parseInt(orderObj[0].orderProductOwnerUserID);
			    	responseObj.orderTotalAmount          = custom.parseNumber(orderObj[0].orderTotalAmount);
			    	responseObj.orderProviderAmount       = custom.parseNumber(orderObj[0].orderProviderAmount);
			    	responseObj.orderQLFeesAmount         = custom.parseNumber(orderObj[0].orderQLFeesAmount);
			    	responseObj.orderFullName  	          = custom.nullChecker(orderObj[0].orderFullName);
			    	responseObj.orderContactNo  	      = custom.nullChecker(orderObj[0].orderContactNo);
			    	responseObj.orderShippingAddress  	  = custom.nullChecker(orderObj[0].orderShippingAddress);
			    	responseObj.orderLandmark  	          = custom.nullChecker(orderObj[0].orderLandmark);
			    	responseObj.orderCity  	              = custom.nullChecker(orderObj[0].orderCity);
			    	responseObj.orderState  	          = custom.nullChecker(orderObj[0].orderState);
			    	responseObj.orderCountry  	          = custom.nullChecker(orderObj[0].orderCountry);
			    	responseObj.orderZipCode  	          = custom.nullChecker(orderObj[0].orderZipCode);
			    	responseObj.orderLatitude  	          = custom.nullChecker(orderObj[0].orderLatitude);
			    	responseObj.orderLongitude  	      = custom.nullChecker(orderObj[0].orderLongitude);
			    	responseObj.orderDateTime  	          = custom.changeDateFormat(orderObj[0].orderDateTime);
			    	responseObj.orderPaymentGatewayAmount = (!orderObj[0].orderPaymentGatewayAmount) ? 0 : custom.parseNumber(orderObj[0].orderPaymentGatewayAmount);
			    	responseObj.orderWalletAmount         = (!orderObj[0].orderWalletAmount) ? 0 : custom.parseNumber(orderObj[0].orderWalletAmount);
			    	responseObj.orderPaymentDateTime  	  = (!orderObj[0].orderPaymentDateTime) ? '' : custom.changeDateFormat(orderObj[0].orderPaymentDateTime);
			    	responseObj.orderPaymentStatus  	  = custom.nullChecker(orderObj[0].orderPaymentStatus);
			    	responseObj.orderPaymentTxnID  	      = custom.nullChecker(orderObj[0].orderPaymentTxnID);
			    	responseObj.orderProductName  	      = custom.nullChecker(orderObj[0].orderProductName);
			    	responseObj.orderProductPrice  	      = custom.parseNumber(orderObj[0].orderProductPrice);
			    	responseObj.orderProductDescprition   = custom.nullChecker(orderObj[0].orderProductDescprition);
			    	responseObj.orderProductOriginalImages= orderProductOriginalImagesArr;
			    	responseObj.orderProductThumbnailImages= orderProductThumbnailImagesArr;
			    	responseObj.buyerDetails               = buyerDetails;
			    	responseObj.providerDetails            = providerDetails;
			    	return res.send({
						            "code": 200,
						            "response": responseObj,
						            "status": 1,
						            "message": "success"
						        });
			});
		}
	});

	/**
	 * To get user my job history
	 * @param {string} userLoginSessionKey
	 * @param {integer} userID
	 * @param {string} jobType
	 */
	app.post('/admin/my-job-history', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("userID").trim();
		req.sanitize("jobType").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('userID', 'The User Id field is required').notEmpty();
	    req.check('jobType', 'The Job type field is required').notEmpty();
	    req.check('jobType', custom.lang(locale,'Job Type should be in CURRENT_JOBS, PAST_JOBS')).inList(["CURRENT_JOBS","PAST_JOBS"]);
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
			let userID              = parseInt(req.sanitize('userID').escape().trim());
			let jobType             = req.sanitize('jobType').escape().trim();

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					
					/* To get orders data */
			    	if(jobType === 'PAST_JOBS'){
			    		var jobQuery = "SELECT * FROM " + constant.jobs + " AS `J` INNER JOIN " + constant.user_details + " AS `UD` ON `UD`.`userId` = `J`.`jobProviderUserID` WHERE `J`.`jobHirerUserID` = " + userID + " AND `J`.`jobGlobalStatus` IN ('COMPLETED','CANCELED','DISPUTE','MUTUALLY_CANCELED') AND `UD`.`userId` NOT IN (0) GROUP BY `J`.`jobID` ORDER BY `J`.`jobID` DESC ";
			    	}else{
			    		var jobQuery = "SELECT * FROM " + constant.jobs + " AS `J` INNER JOIN " + constant.user_details + " AS `UD` ON `UD`.`userId` = `J`.`jobProviderUserID` WHERE `J`.`jobHirerUserID` = " + userID + " AND `J`.`jobGlobalStatus` IN ('PENDING') AND `UD`.`userId` NOT IN (0) GROUP BY `J`.`jobID` ORDER BY `J`.`jobID` DESC ";
			    	}
			    	model.customQuery(function(err,jobObj){
			    		if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(jobObj != ""){
		                		let responseObj  = [];
		                		for (var j = 0; j < parseInt(jobObj.length); j++) 
				                {
				                	let row = {};
				                	row.jobID            = parseInt(jobObj[j].jobID);
				                	row.jobCustomID      = custom.nullChecker(jobObj[j].jobCustomID);
				                	row.jobCustomID      = custom.nullChecker(jobObj[j].jobCustomID);
				                	row.jobTitle         = custom.nullChecker(jobObj[j].jobTitle);
				                	row.jobMode          = custom.nullChecker(jobObj[j].jobMode);
				                	row.jobPaymentMethod = custom.nullChecker(jobObj[j].jobPaymentMethod);
				                	row.jobStartDate     = custom.changeDateFormat(jobObj[j].jobStartDate,'yyyy-mm-dd');
				                	row.jobEndDate       = custom.changeDateFormat(jobObj[j].jobEndDate,'yyyy-mm-dd');
				                	row.jobAgreedAmount  = custom.parseNumber(jobObj[j].jobAgreedAmount);
				                	row.jobHireDateTime  = custom.changeDateFormat(jobObj[j].jobHireDateTime);
				                	row.jobGlobalStatus  = custom.nullChecker(jobObj[j].jobGlobalStatus);
				                	row.userName         = custom.nullChecker(jobObj[j].userFirstName) + " " + custom.nullChecker(jobObj[j].userLastName);
			    					responseObj.push(row);
				                	if (j === parseInt(jobObj.length - 1)) {
				                      return res.send({
										            "code": 200,
										            "response": responseObj,
										            "status": 1,
										            "message": "success."
										        });
				                    }
				                }
		                	}else{
		                		return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": 'Job history not found'
									        });
		                	}
		                }
		            },jobQuery);
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To get user received job history
	 * @param {string} userLoginSessionKey
	 * @param {integer} userID
	 * @param {string} jobType
	 */
	app.post('/admin/received-job-history', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("userID").trim();
		req.sanitize("jobType").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('userID', 'The User Id field is required').notEmpty();
	    req.check('jobType', 'The Job type field is required').notEmpty();
	    req.check('jobType', custom.lang(locale,'Job Type should be in CURRENT_JOBS, PAST_JOBS')).inList(["CURRENT_JOBS","PAST_JOBS"]);
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
			let userID              = parseInt(req.sanitize('userID').escape().trim());
			let jobType             = req.sanitize('jobType').escape().trim();

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					
					/* To get orders data */
			    	if(jobType === 'PAST_JOBS'){
			    		var jobQuery = "SELECT * FROM " + constant.jobs + " AS `J` INNER JOIN " + constant.user_details + " AS `UD` ON `UD`.`userId` = `J`.`jobHirerUserID` WHERE `J`.`jobProviderUserID` = " + userID + " AND `J`.`jobGlobalStatus` IN ('COMPLETED','CANCELED','DISPUTE','MUTUALLY_CANCELED') AND `UD`.`userId` NOT IN (0) GROUP BY `J`.`jobID` ORDER BY `J`.`jobID` DESC ";
			    	}else{
			    		var jobQuery = "SELECT * FROM " + constant.jobs + " AS `J` INNER JOIN " + constant.user_details + " AS `UD` ON `UD`.`userId` = `J`.`jobHirerUserID` WHERE `J`.`jobProviderUserID` = " + userID + " AND `J`.`jobGlobalStatus` IN ('PENDING') AND `J`.`jobAcceptStatus` IN ('ACCEPT') AND `UD`.`userId` NOT IN (0) GROUP BY `J`.`jobID` ORDER BY `J`.`jobID` DESC ";
			    	}
			    	model.customQuery(function(err,jobObj){
			    		if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(jobObj != ""){
		                		let responseObj  = [];
		                		for (var j = 0; j < parseInt(jobObj.length); j++) 
				                {
				                	let row = {};
				                	row.jobID            = parseInt(jobObj[j].jobID);
				                	row.jobCustomID      = custom.nullChecker(jobObj[j].jobCustomID);
				                	row.jobCustomID      = custom.nullChecker(jobObj[j].jobCustomID);
				                	row.jobTitle         = custom.nullChecker(jobObj[j].jobTitle);
				                	row.jobMode          = custom.nullChecker(jobObj[j].jobMode);
				                	row.jobPaymentMethod = custom.nullChecker(jobObj[j].jobPaymentMethod);
				                	row.jobStartDate     = custom.changeDateFormat(jobObj[j].jobStartDate,'yyyy-mm-dd');
				                	row.jobEndDate       = custom.changeDateFormat(jobObj[j].jobEndDate,'yyyy-mm-dd');
				                	row.jobAgreedAmount  = custom.parseNumber(jobObj[j].jobAgreedAmount);
				                	row.jobHireDateTime  = custom.changeDateFormat(jobObj[j].jobHireDateTime);
				                	row.jobGlobalStatus  = custom.nullChecker(jobObj[j].jobGlobalStatus);
				                	row.userName         = custom.nullChecker(jobObj[j].userFirstName) + " " + custom.nullChecker(jobObj[j].userLastName);
			    					responseObj.push(row);
				                	if (j === parseInt(jobObj.length - 1)) {
				                      return res.send({
										            "code": 200,
										            "response": responseObj,
										            "status": 1,
										            "message": "success."
										        });
				                    }
				                }
		                	}else{
		                		return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": 'Job history not found'
									        });
		                	}
		                }
		            },jobQuery);
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To export users details
	 */
	app.post('/admin/export-users-details', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
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

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					
					/* Get users list */	
					let userQuery = "SELECT `user_details`.`userFirstName`,`users`.`userEmail` FROM `users` INNER JOIN `user_details` ON `users`.`masterUserId`=`user_details`.`userId` WHERE `users`.`userType` = 'NORMAL_USER' ORDER BY `users`.`masterUserId` DESC ";
					model.customQuery(function(err,resp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(resp != ''){
		                		let usersResponse = [];
							    for (var i = 0; i < parseInt(resp.length); i++) 
							    {
							    	let row = {};
							    	row.userFirstName   = custom.nullChecker(resp[i].userFirstName);
							    	row.userEmail = custom.nullChecker(resp[i].userEmail);
							    	usersResponse.push(row);
							    }
							    console.log(usersResponse);
		                		return res.send({
							            "code": 200,
							            "response": usersResponse,
							            "status": 1,
							            "message": 'success'
							        });
		                	}else{
		                		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": 'Users not found'
							        });
		                	}
		                }
					},userQuery);
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To view user details
	 * @param {string} userLoginSessionKey
	 * @param {integer} userID
	 */
	app.post('/admin/view-user-details', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("userID").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('userID', 'Require user Id').notEmpty();
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
			let userID = req.sanitize('userID').escape().trim();
			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					
					/* Get users list */	
					let userQuery = "SELECT * FROM `users` INNER JOIN `user_details` ON `users`.`masterUserId`=`user_details`.`userId` WHERE `users`.`masterUserId` = "+userID+" ORDER BY `users`.`masterUserId` DESC ";
					model.customQuery(function(err,resp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(resp != ''){
		                		let responseOnj = resp[0];
		                		custom.isMembershipActive(function(membershipResp){
		                			responseOnj.membershipStatus = membershipResp;
			                		return res.send({
								            "code": 200,
								            "response": responseOnj,
								            "status": 1,
								            "message": 'success'
								        });
		                		},responseOnj.isPaidMembeship,responseOnj.isFacebookVerified,responseOnj.isTwitterVerified,responseOnj.isInstagramVerified,responseOnj.userRegistrationDate);
		                	}else{
		                		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": 'User details not found'
							        });
		                	}
		                }
					},userQuery);
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To get user wallet history
	 * @param {string} userLoginSessionKey
	 * @param {integer} userID
	 */
	app.post('/admin/wallet-history', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("userID").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('userID', 'Require user Id').notEmpty();
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
			let userID = req.sanitize('userID').escape().trim();

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					
					/* Get wallet history list */	
					model.getAllWhere(function(err,resp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(resp != ''){
		                		return res.send({
								            "code": 200,
								            "response": resp,
								            "status": 1,
								            "message": 'success'
								        });
		                	}else{
		                		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": 'Wallet History not found'
							        });
		                	}
		                }
					},constant.wallet,{walletUserID:userID},'walletID','DESC');
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To get user transaction history
	 * @param {string} userLoginSessionKey
	 * @param {integer} userID
	 */
	app.post('/admin/transaction-history', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("userID").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('userID', 'Require user Id').notEmpty();
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
			let userID = req.sanitize('userID').escape().trim();

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					
					/* Get wallet history list */	
					model.getAllWhere(function(err,resp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(resp != ''){
		                		return res.send({
								            "code": 200,
								            "response": resp,
								            "status": 1,
								            "message": 'success'
								        });
		                	}else{
		                		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": 'Transaction History not found'
							        });
		                	}
		                }
					},constant.transactions,{transactionUserID:userID},'transactionID','DESC');
				}
			},userLoginSessionKey);
		}
	});


	/**
	 * To get preferences list
	 * @param {string} userLoginSessionKey
	 */
	app.post('/admin/get-preferences-list', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
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

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					
					/* Get contact us list */	
					model.getAll(function(err,resp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(resp != ''){
		                		let preferencesResponse = [];
							    for (var i = 0; i < parseInt(resp.length); i++) 
							    {
							    	let row = {};
							    	row.preferenceID  = parseInt(resp[i].preferenceID);
							    	row.preferenceName   = custom.nullChecker(resp[i].preferenceName);
							    	row.preferenceType  = parseInt(custom.nullChecker(resp[i].preferenceType));
							    	row.preferenceModuleType  = custom.nullChecker(resp[i].preferenceModuleType);
							    	row.preferenceCreatedDate = custom.changeDateFormat(resp[i].preferenceCreatedDate,constant.admin_date_format);
							    	row.preferenceModifyDate = (resp[i].preferenceModifyDate) ? custom.changeDateFormat(resp[i].preferenceModifyDate,constant.admin_date_format) : '';
							    	preferencesResponse.push(row);
							    }
		                		return res.send({
							            "code": 200,
							            "response": preferencesResponse,
							            "status": 1,
							            "message": 'success'
							        });
		                	}else{
		                		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": 'Preferences keywords not found'
							        });
		                	}
		                }
					},constant.preferences,'preferenceName','ASC');
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To add new preference
	 * @param {string} userLoginSessionKey
	 * @param {string} oldPassword
	 * @param {string} newPassword
	 * @param {string} confirmPassword
	 */
	app.post('/admin/insert-preference', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("preferenceName").trim();
		req.sanitize("preferenceType").trim();
		req.sanitize("preferenceModuleType").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('preferenceName', 'Enter preference name').notEmpty();
	    req.check('preferenceType', 'Select preference type').notEmpty();
	    req.check('preferenceType', 'Preference type should be 0 Or 1').inList(["0","1"]);
	    req.check('preferenceModuleType', 'Select preference module type').notEmpty();
	    req.check('preferenceModuleType', 'Please select valid preference module type').inList(["FRIENDLY","DATING","PROVIDER"]);
	    let errors = req.validationErrors();
	    if (errors) {
	        res.send({
	            "code": 200,
	            "response": {},
	            "status": 0,
	            "message": custom.manageValidationMessages(errors)
	        });
	    } else {
			let userLoginSessionKey  = req.sanitize('userLoginSessionKey').escape().trim();
			let preferenceName       = req.sanitize('preferenceName').escape().trim();
			let preferenceType       = req.sanitize('preferenceType').escape().trim();
			let preferenceModuleType = req.sanitize('preferenceModuleType').escape().trim();

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					
					/* Check already exist entry */			
					model.getAllWhere(function(err,resp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(resp != ''){
		                		return res.send({
								            "code": 200,
								            "response": {},
								            "status": 0,
								            "message": 'Preferences keywords already exist.'
								        });
		                	}else{
		                		let insertObj = {};
		                		insertObj.preferenceName = preferenceName;
		                		insertObj.preferenceType = preferenceType;
		                		insertObj.preferenceModuleType = preferenceModuleType;
		                		insertObj.preferenceCreatedDate = custom.getCurrentTime();
		                		insertObj.preferenceModifyDate = custom.getCurrentTime();
		                		model.insertData(function(err,insertResp){
		                			if(err){
					                    return res.send(custom.dbErrorResponse());
					                }else{
					                	if(insertResp.insertId){
					                		return res.send({
											            "code": 200,
											            "response": {},
											            "status": 1,
											            "message": 'Preference keyword successfully added.'
											        });
					                	}else{
					                		return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": 'Failed, please try again'
											        });
					                	}
					                }
		                		},constant.preferences,insertObj);
		                	}
		                }
					},constant.preferences,{preferenceName:preferenceName,preferenceType:preferenceType,preferenceModuleType:preferenceModuleType});
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To delete preference
	 * @param {string} userLoginSessionKey
	 * @param {integer} preferenceID
	 */
	app.post('/admin/delete-preference', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("preferenceID").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('preferenceID', 'Require preference Id').notEmpty();
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
			let preferenceID = req.sanitize('preferenceID').escape().trim();

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					/* Delete preferences */					
					model.deleteData(function(err,resp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(parseInt(resp.affectedRows) > 0){
		                		return res.send({
									            "code": 200,
									            "response": {},
									            "status": 1,
									            "message": 'Preference deleted successfully'
									        });
		                	}else{
		                		return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": 'Failed, please try again'
									        });
		                	}
		                }
					},constant.preferences,{preferenceID:preferenceID});
				}
			},userLoginSessionKey);
		}
	});


	/**
	 * To delete user
	 * @param {string} userLoginSessionKey
	 * @param {integer} userID
	 */
	app.post('/admin/delete-user', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("userID").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('userID', 'Require user Id').notEmpty();
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
			let userID = req.sanitize('userID').escape().trim();

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					/* Delete user */					
					model.deleteData(function(err,resp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(parseInt(resp.affectedRows) > 0){
		                		return res.send({
									            "code": 200,
									            "response": {},
									            "status": 1,
									            "message": 'User deleted successfully'
									        });
		                	}else{
		                		return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": 'Failed, please try again'
									        });
		                	}
		                }
					},constant.users,{masterUserId:userID});
				}
			},userLoginSessionKey);
		}
	});


	/**
	 * To change user status
	 * @param {string} userLoginSessionKey
	 * @param {integer} userID,currentStatus
	 */
	app.post('/admin/change-user-status', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("userID").trim();
		req.sanitize("currentStatus").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('userID', 'Require user Id').notEmpty();
	    req.check('currentStatus', 'Require current status of user').notEmpty();
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
			let userID = req.sanitize('userID').escape().trim();
			let currentStatus = req.sanitize('currentStatus').escape().trim();
			let userStatus = 1;//1 means active user
			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					 /* Update user */					
					if(currentStatus == 1)
						userStatus = 0;//0 means inactive

					model.updateData(function(err,resp){
            		if(err){
	                    return res.send(custom.dbErrorResponse());
	                }else{
	                	return res.send({
				                        "code": 200,
				                        "response": {},
				                        "status": 1,
				                        "message": 'Status updated successfully'
				                    });
	                }
            		},constant.user_details,{isUserBlocked:userStatus},{userId:userID});

				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To reply user
	 * @param {string} userLoginSessionKey
	 * @param {integer} contactId
	 * @param {string} replyMessage
	 */
	app.post('/admin/reply-to-user', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("contactId").trim();
		req.sanitize("replyMessage").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('contactId', 'The Contact Id field is required').notEmpty();
	    req.check('replyMessage', 'The Message field is required').notEmpty();
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
			let contactId    = parseInt(req.sanitize('contactId').escape().trim());
			let replyMessage = req.sanitize('replyMessage').escape().trim();

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					 
					/* Get contact details */
					let contactQuery = "SELECT * FROM `contact_us` AS `C` INNER JOIN `user_details` AS `UD` ON `C`.`contactUserId` = `UD`.`userId`  INNER JOIN `users` AS `U` ON `C`.`contactUserId` = `U`.`masterUserId` WHERE `C`.`contactId` = "+contactId;
					model.customQuery(function(err,contactResp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(contactResp != ""){
		                		let contactUserId = contactResp[0].contactUserId;
		                		let mailData = {};
					            mailData.to_email = contactResp[0].userEmail;
					            mailData.subject  = constant.site_name + ' Team Reply';
					            mailData.message  = replyMessage;
								custom.sendEmailCallBack(mailData,function(err,resp){
					                if(err){
					                    return res.send(custom.mailErrorResponse());
					                }else{
					                	model.updateData(function(err,resp){
					                		if(err){
							                    return res.send(custom.dbErrorResponse());
							                }else{
							                	return res.send({
										                        "code": 200,
										                        "response": {},
										                        "status": 1,
										                        "message": 'Message sent successfully'
										                    });
							                }
					                	},constant.contact_us,{isRepliedByAdmin:1,replyDateTime:custom.getCurrentTime(),replyMessage:replyMessage},{contactId:contactId});

					                	/* Insert contact us reply notification */
					                	let userMessage = 'Quicklove has replied on your enquiry';
									   	let notificationDataObj = {};
				                		notificationDataObj.notificationUserId   = respObj[0].userId;
				                		notificationDataObj.notificationFriendId = contactUserId;
				                		notificationDataObj.contactModuleId      = contactId;
				                		notificationDataObj.notificationModule   = 'GLOBAL';
				                		notificationDataObj.notificationType     = 'CONTACT_US_REPLY';
				                		notificationDataObj.notificationMessage  = userMessage;
				                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
				                		model.insertData(function(err,notificationResp){
			                            	if(err){
			                            		console.log('Contact US notification error',err);
			                            	}else{
			                            		console.log('Contact US notification success');
			                            	}
			                            },constant.notifications,notificationDataObj);

					                	/* Send Notification To User */
					                	let extraParams = {};
			                            extraParams.contactModuleId   = contactId;
			                            extraParams.moduleName        = 'GLOBAL';
			                            extraParams.notificationType  = 'CONTACT_US_REPLY';
					                	notification.sendPushNotifications(userMessage,contactUserId,extraParams);
					                }
					            });
		                	}else{
		                		return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": 'Contact details not found'
									        });
		                	}
		                }
					},contactQuery);
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * Get report flag categories list
	 * @param {string} userLoginSessionKey
	 */
	app.post('/admin/report-flag-categories-list', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
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

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					
					/* Get contact us list */	
					model.getAll(function(err,resp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(resp != ''){
		                		let categoriesResponse = [];
							    for (var i = 0; i < parseInt(resp.length); i++) 
							    {
							    	let row = {};
							    	row.reportFlagCategoryID  = parseInt(resp[i].reportFlagCategoryID);
							    	row.reportFlagCategoryName   = custom.nullChecker(resp[i].reportFlagCategoryName);
							    	row.reportFlagCategoryAddedDate = (resp[i].reportFlagCategoryAddedDate) ? custom.changeDateFormat(resp[i].reportFlagCategoryAddedDate,constant.admin_date_format) : '';
							    	categoriesResponse.push(row);
							    }
		                		return res.send({
							            "code": 200,
							            "response": categoriesResponse,
							            "status": 1,
							            "message": 'success'
							        });
		                	}else{
		                		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": 'Categories not found'
							        });
		                	}
		                }
					},constant.report_flag_categories,'reportFlagCategoryName','ASC');
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To add new report flag category
	 * @param {string} userLoginSessionKey
	 * @param {string} reportFlagCategoryName
	 */
	app.post('/admin/insert-report-flag-category', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("reportFlagCategoryName").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('reportFlagCategoryName', 'Enter category name').notEmpty();
	    let errors = req.validationErrors();
	    if (errors) {
	        res.send({
	            "code": 200,
	            "response": {},
	            "status": 0,
	            "message": custom.manageValidationMessages(errors)
	        });
	    } else {
			let userLoginSessionKey  = req.sanitize('userLoginSessionKey').escape().trim();
			let reportFlagCategoryName = req.sanitize('reportFlagCategoryName').escape().trim();

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					/* Check already exist entry */			
					model.getAllWhere(function(err,resp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(resp != ''){
		                		return res.send({
								            "code": 200,
								            "response": {},
								            "status": 0,
								            "message": 'Category name already exist.'
								        });
		                	}else{
		                		let insertObj = {};
			            		insertObj.reportFlagCategoryName = reportFlagCategoryName;
			            		insertObj.reportFlagCategoryAddedDate = custom.getCurrentTime();
			            		model.insertData(function(err,insertResp){
			            			if(err){
					                    return res.send(custom.dbErrorResponse());
					                }else{
					                	if(insertResp.insertId){
					                		return res.send({
											            "code": 200,
											            "response": {},
											            "status": 1,
											            "message": 'Category successfully added.'
											        });
					                	}else{
					                		return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": 'Failed, please try again'
											        });
					                	}
					                }
			            		},constant.report_flag_categories,insertObj);
		                	}
		                }
					},constant.report_flag_categories,{reportFlagCategoryName:reportFlagCategoryName});
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To delete report flag category
	 * @param {string} userLoginSessionKey
	 * @param {integer} reportFlagCategoryID
	 */
	app.post('/admin/delete-report-flag-category', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("reportFlagCategoryID").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('reportFlagCategoryID', 'Require preference Id').notEmpty();
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
			let reportFlagCategoryID = req.sanitize('reportFlagCategoryID').escape().trim();

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					/* Delete preferences */					
					model.deleteData(function(err,resp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(parseInt(resp.affectedRows) > 0){
		                		return res.send({
									            "code": 200,
									            "response": {},
									            "status": 1,
									            "message": 'Category deleted successfully'
									        });
		                	}else{
		                		return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": 'Failed, please try again'
									        });
		                	}
		                }
					},constant.report_flag_categories,{reportFlagCategoryID:reportFlagCategoryID});
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To send notifications
	 * @param {string} title
	 * @param {string} message
	 * @param {string} users
	 * @param {string} userLoginSessionKey
	 */
	app.post('/admin/insert-send-notifications', function (req,res) {
	    req.sanitize("title").trim();
	    req.sanitize("message").trim();
	    req.sanitize("users").trim();
	    req.sanitize("userLoginSessionKey").trim();
	    req.check('title', 'Require title').notEmpty();
	    req.check('message', 'Require message').notEmpty();
	    req.check('users', 'Please select users').notEmpty();
	    req.check('userLoginSessionKey', 'Require user login session key').notEmpty();
	    let errors = req.validationErrors();
	    if (errors) {
	        res.send({
	            "code": 200,
	            "response": {},
	            "status": 0,
	            "message": custom.manageValidationMessages(errors)
	        });
	    } else {
	    	let title                = req.sanitize('title').escape().trim();
	    	let message              = req.sanitize('message').escape().trim();
	    	let users                = req.sanitize('users').escape().trim();
	    	let userLoginSessionKey  = req.sanitize('userLoginSessionKey').escape().trim();

	    	/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{

					async.waterfall([
						function(callback) {
					    	let userIds = new Array();
							if(users == "ALL"){

								/* Get users list */	
								let userQuery = "SELECT `masterUserId` FROM `users` INNER JOIN `user_details` ON `users`.`masterUserId`=`user_details`.`userId` WHERE `users`.`userType` = 'NORMAL_USER' AND `user_details`.`userMembershipStatus` = 1 AND `user_details`.`userEmailVerified` = 1 AND `user_details`.`isUserBlocked` = 0 AND `user_details`.`isUserDeactivated` = 0 AND `user_details`.`isRedFlagBlock` = 0 ORDER BY `users`.`masterUserId` DESC ";
								model.customQuery(function(err,users){
									if(err){
					                    return res.send(custom.dbErrorResponse());
					                }else{
					                	if(users != "")
					                	{
					                		for (var i = 0; i < users.length; i++) 
											{
												userIds.push(users[i].masterUserId);
												if(i === (parseInt(users.length) - 1))
												{
													callback(null, userIds);
												}
											}
					                	}
					                }
								},userQuery);
							}else{
								let allUsers = users.split(",");
								for (var i = 0; i < allUsers.length; i++) 
								{
									userIds.push(parseInt(allUsers[i]));
									if(i === (parseInt(allUsers.length) - 1))
									{
										callback(null, userIds);
									}
								}
							}
					    },
					], function (err,userIds) {

						/* Insert Notification */
						let insertObj = {};
						insertObj.adminNotificationTitle    = title;
						insertObj.adminNotificationMessage  = message;
						insertObj.adminNotificationUsers    = JSON.stringify(userIds);
						insertObj.adminNotificationSentTime = custom.getCurrentTime();
						model.insertData(function(err,insertResp){
							if(err){
			                    return res.send(custom.dbErrorResponse());
			                }else{
			                	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 1,
									            "message": 'Your notifications request successfully added into queue'
									        });
			                }
						},constant.admin_notifications,insertObj);

						/* Send Push Notifications (In Backgroud) */
						let userIdsLength = parseInt(userIds.length);
						if(userIdsLength > 0)
						{
							let masterUserId = respObj[0].userId;
							let userMessage = message;
							let extraParams = {};
							extraParams.notificationType = 'ADMIN_NOTIFICATION';
							extraParams.moduleName       = 'GLOBAL';
							for (var j = 0; j < userIdsLength; j++) 
							{
								let userID = userIds[j];

								(function(j,userID) {

									/* Insert Notification */
									let notificationDataObj = {};
			                		notificationDataObj.notificationUserId   = masterUserId; // ADMIN ID
			                		notificationDataObj.notificationFriendId = userID;
			                		notificationDataObj.notificationModule   = 'GLOBAL';
			                		notificationDataObj.notificationType     = 'ADMIN_NOTIFICATION';
			                		notificationDataObj.notificationMessage  = userMessage;
			                		notificationDataObj.notificationParams   = JSON.stringify({notificationTitle:title,notificationMessage:userMessage});
			                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
			                		model.insertData(function(err,insertNotiResp){
			                			if(err){
						                    console.log('insertNotiErr');
						                }else{
						                    console.log('insertNotiSuccess');
						                }
			                		},constant.notifications,notificationDataObj);

			                		/* Send Push Notification */
									extraParams.userID = userID;
									notification.sendPushNotifications(userMessage,userID,extraParams);

								})(j,userID);
							}
						}
					});
				}
			},userLoginSessionKey);
	 	}
	});

	/**
	 * To get dasboard statics
	 * @param {string} userLoginSessionKey
	 */
	app.post('/admin/get-statics', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
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

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					async.parallel({
						totalUsers: function(callback) {

							/* Get Total Users */
							model.getCount(function(err,userResp){
								if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	callback(null, userResp);
				                }
							},constant.users,{userType:'NORMAL_USER'});
						},
						totalCurrentJobs: function(callback) {

							/* Get Total Current Jobs */
							let currentJobQuery = "SELECT * FROM " + constant.jobs + " WHERE `jobGlobalStatus` IN ('PENDING') AND `jobAcceptStatus` IN ('ACCEPT') ";
							model.customQuery(function(err,currentJobResp){
								if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	callback(null, parseInt(currentJobResp.length));
				                }
							},currentJobQuery);
							
						},
						totalPastJobs: function(callback) {

							/* Get Total Past Jobs */
							let pastJobQuery = "SELECT * FROM " + constant.jobs + " WHERE `jobGlobalStatus` IN ('COMPLETED','CANCELED','DISPUTE','MUTUALLY_CANCELED')";
							model.customQuery(function(err,pastJobsResp){
								if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	callback(null, parseInt(pastJobsResp.length));
				                }
							},pastJobQuery);
						},
						totalProducts: function(callback) {

							/* Get Total Products */
							model.getCount(function(err,productResp){
								if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	callback(null, productResp);
				                }
							},constant.products);
						},
						totalOrders: function(callback) {

							/* Get Total Orders */
							model.getCount(function(err,orderResp){
								if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	callback(null, orderResp);
				                }
							},constant.orders);
						},
						totalEnquiry: function(callback) {

							/* Get Total Enquiry */
							model.getCount(function(err,enquiryResp){
								if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	callback(null, enquiryResp);
				                }
							},constant.contact_us);
						},
						totalCalls: function(callback) {

							/* Get Total Calls */
							model.getCount(function(err,callResp){
								if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	callback(null, callResp);
				                }
							},constant.call_history);
						},
						totalTransactions: function(callback) {

							/* Get Total Transactions */
							model.getCount(function(err,txnResp){
								if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	callback(null, txnResp);
				                }
							},constant.transactions);
						},
					}, function(err, results) {
						let totalUsers        = 0;
						let totalCurrentJobs  = 0;
						let totalPastJobs     = 0;
						let totalProducts     = 0;
						let totalOrders       = 0;
						let totalEnquiry      = 0;
						let totalCalls        = 0;
						let totalTransactions = 0;
						totalUsers        = (results.totalUsers >= 10) ? results.totalUsers : "0" + results.totalUsers;
						totalCurrentJobs  = (results.totalCurrentJobs >= 10) ? results.totalCurrentJobs : "0" + results.totalCurrentJobs;
						totalPastJobs     = (results.totalPastJobs >= 10) ? results.totalPastJobs : "0" + results.totalPastJobs;
						totalProducts     = (results.totalProducts >= 10) ? results.totalProducts : "0" + results.totalProducts;
						totalOrders       = (results.totalOrders >= 10) ? results.totalOrders : "0" + results.totalOrders;
						totalEnquiry      = (results.totalEnquiry >= 10) ? results.totalEnquiry : "0" + results.totalEnquiry;
						totalCalls        = (results.totalCalls >= 10) ? results.totalCalls : "0" + results.totalCalls;
						totalTransactions = (results.totalTransactions >= 10) ? results.totalTransactions : "0" + results.totalTransactions;
						let userLastLogin = (!respObj[0].userLastLogin) ? '' : custom.changeDateFormat(respObj[0].userLastLogin,constant.admin_date_format);
						let userLastIpAddress = custom.nullChecker(respObj[0].userLastIpAddress);
						return res.send({
						            "code": 200,
						            "response": {totalUsers:totalUsers,totalCurrentJobs:totalCurrentJobs,totalPastJobs:totalPastJobs,totalProducts:totalProducts,totalOrders:totalOrders,totalEnquiry:totalEnquiry,totalCalls:totalCalls,totalTransactions:totalTransactions,lastLogin:userLastLogin,lastIPAddress:userLastIpAddress},
						            "status": 1,
						            "message": 'success'
						        });
					});
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To get admin report data
	 * @param {string} userLoginSessionKey
	 * @param {string} moduleType
	 * @param {object} myDateRange
	 * @param {string} users
	 */
	app.post('/admin/get-report-data', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
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
			let moduleType          = (!req.body.moduleType) ? 'ALL' : req.body.moduleType;
			let usersData           = (!req.body.users) ? '' : req.body.users;
			let startDate           = '';
			let endDate             = '';
			if(!req.body.myDateRange) {
				startDate           = custom.changeDateFormat(custom.getCurrentTime(),'yyyy-mm-dd');
				endDate             = custom.changeDateFormat(custom.getCurrentTime(),'yyyy-mm-dd');
			}else{
				let myDateRange     = req.body.myDateRange;
				let myDateRangeObj  = myDateRange;
				startDate           = custom.changeDateFormat(myDateRangeObj.startDate,'yyyy-mm-dd');
				endDate             = custom.changeDateFormat(myDateRangeObj.endDate,'yyyy-mm-dd');
			}

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{

					let reportQuery = '';
					reportQuery += 'SELECT * FROM ' + constant.reports + ' AS R LEFT JOIN ' + constant.user_details + ' AS UD ON UD.userId = R.reportUserID';
					reportQuery += ' INNER JOIN ' + constant.users + ' As U ON U.masterUserId = UD.userId';
					reportQuery += ' WHERE R.reportID > 0';
					if(moduleType != "" && moduleType != undefined && moduleType != null && moduleType != 'ALL')
					{
						if(moduleType === 'APP_MEMBERSHIP'){
							reportQuery += ' AND R.reportModuleName IN ("PURCHASE_MEMBERSHIP")';
						}else if(moduleType === 'PURCHASE_PRODUCTS'){
							reportQuery += ' AND R.reportModuleName IN ("PURCHASE_PRODUCT")';
						}else if(moduleType === 'JOBS'){
							reportQuery += ' AND R.reportModuleName IN ("HIRE_PROVIDER","MODIFY_JOB","ACCEPT_JOB","RELEASE_JOB_MILESTONE","CANCEL_JOB","JOB_CANCEL_FEE_AMOUNT","JOB_CANCEL_REMAINING_AMOUNT")';
						}
					}
					if(usersData != "" && usersData != undefined && usersData != null && usersData != 'undefined')
					{
						reportQuery += ' AND UD.userId IN ('+usersData+')';
					}
					if(startDate != "" && startDate != undefined && startDate != null && endDate != "" && endDate != undefined && endDate != null)
					{
						reportQuery += ' AND DATE(reportDateTime) BETWEEN "' + startDate + '" AND "' + endDate  + '"';
					}
					reportQuery += ' ORDER BY R.reportID DESC';

					/* Get Reports Data */
					model.customQuery(function(err,reportResp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(reportResp != ""){
		                		let responseObj = [];
		                		let earningResponseObj = [];
							    for (var i = 0; i < parseInt(reportResp.length); i++) 
							    {
							    	let row = {};
							    	row.userFirstName = custom.nullChecker(reportResp[i].userFirstName);
							    	row.userLastName  = custom.nullChecker(reportResp[i].userLastName);
							    	row.userEmail     = custom.nullChecker(reportResp[i].userEmail);
							    	row.reportAmount  = custom.parseNumber(reportResp[i].reportAmount);
							    	row.reportAmountType  = parseInt(reportResp[i].reportAmountType);
							    	row.reportModuleName  = custom.nullChecker(reportResp[i].reportModuleName);
							    	row.reportDateTime    = custom.nullChecker(reportResp[i].reportDateTime);
							    	responseObj.push(row);
							    	if(parseInt(reportResp[i].reportAmountType) === 1 && (reportResp[i].reportModuleName === 'PURCHASE_PRODUCT' || reportResp[i].reportModuleName === 'PURCHASE_MEMBERSHIP' || reportResp[i].reportModuleName === 'ACCEPT_JOB' || reportResp[i].reportModuleName === 'JOB_CANCEL_FEE_AMOUNT'))
							    	{
							    		earningResponseObj.push(row);
							    	}
							    	if(i === (parseInt(reportResp.length) - 1))
							    	{
							    		return res.send({
									            "code": 200,
									            "response": {revenueData:responseObj,earningData:earningResponseObj},
									            "status": 1,
									            "message": 'success'
									        });
							    	}
							    }
		                	}else{
		                		return res.send({
							            "code": 200,
							            "response": [],
							            "status": 0,
							            "message": 'Reports data not found'
							        });	
		                	}
		                }
					},reportQuery);
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * Get Notifications History List
	 * @param {string} userLoginSessionKey
	 */
	app.post('/admin/notifications-history', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
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

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					
					/* Get Notifications list */	
					model.getAll(function(err,resp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(resp != ''){
		                		let notificationsResp = [];
							    for (var i = 0; i < parseInt(resp.length); i++) 
							    {
							    	let row = {};
							    	row.adminNotificationID       = parseInt(resp[i].adminNotificationID);
							    	row.adminNotificationTitle    = custom.nullChecker(resp[i].adminNotificationTitle);
							    	row.adminNotificationMessage  = custom.nullChecker(resp[i].adminNotificationMessage);
							    	row.adminNotificationSentTime = (resp[i].adminNotificationSentTime) ? custom.changeDateFormat(resp[i].adminNotificationSentTime,constant.admin_date_format) : '';
							    	notificationsResp.push(row);
							    }
		                		return res.send({
							            "code": 200,
							            "response": notificationsResp,
							            "status": 1,
							            "message": 'success'
							        });
		                	}else{
		                		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": 'Notification not found'
							        });
		                	}
		                }
					},constant.admin_notifications,'adminNotificationID','DESC');
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To get total earning
	 * @param {string} userLoginSessionKey
	 */
	app.post('/admin/total-earning', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
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
			let dateRange = (typeof req.body.dateRange === 'string') ? JSON.parse(req.body.dateRange) : req.body.dateRange;

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					let startDate = '';
					let endDate   = '';
					if(dateRange == ""){
						let currentTime = custom.getCurrentTime();
						let newEndDate  = custom.changeDateFormat(currentTime,'yyyy-mm-dd');
						startDate = custom.changeDateFormat(moment(currentTime).subtract(15, 'days'),'yyyy-mm-dd');
						endDate   = newEndDate;
					}else{
						startDate = custom.changeDateFormat(dateRange.startDate,'yyyy-mm-dd');
						endDate   = custom.changeDateFormat(dateRange.endDate,'yyyy-mm-dd');
					}

					let dateRangeText = "(" + startDate + " To " + endDate + ")"; 
					let categories    = custom.getDates(startDate,endDate); 
					let allDates      = categories; 
					let values        = new Array(); 

					/* Get total earning */
					let earningQuery = "SELECT SUM(`reportAmount`) AS reportAmount, DATE(`reportDateTime`) AS reportDate FROM `reports` WHERE DATE(`reportDateTime`) IN ('"+categories.join("','")+"') AND `reportAmountType` = 1 AND `reportModuleName` IN ('PURCHASE_PRODUCT','PURCHASE_MEMBERSHIP','ACCEPT_JOB','JOB_CANCEL_FEE_AMOUNT') GROUP BY DATE(`reportDateTime`) ORDER BY `reportDateTime` ASC ";
					model.customQuery(function(err,earningResp){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(earningResp != ""){
		                		let totalRecords  = parseInt(earningResp.length);
		                		let earningDateObj = new Map();
		                		for (var i = 0; i < totalRecords; i++) 
		                		{
		                			let reportDate  = custom.changeDateFormat(earningResp[i].reportDate,'yyyy-mm-dd');
		                			earningDateObj.set(reportDate, custom.parseNumber(earningResp[i].reportAmount));
		                			if(i === parseInt(totalRecords - 1))
		                			{
		                				let totalCategories = parseInt(categories.length);
		                				for (var j = 0; j < totalCategories; j++) 
		                				{
		                					if(earningDateObj.has(categories[j])){
		                						values.push(earningDateObj.get(categories[j]));
		                					}else{
		                						values.push(0);
		                					}
		                					if(j === parseInt(totalCategories - 1))
		                					{
						                		return res.send({
													            "code": 200,
													            "response": {dateRangeText:dateRangeText,categories:categories,values:values},
													            "status": 1,
													            "message": 'success'
													        });
		                					}
		                				}
		                			}
		                		}
		                	}else{
		                		return res.send({
						            "code": 200,
						            "response": {dateRangeText:dateRangeText,categories:new Array(),values:new Array()},
						            "status": 1,
						            "message": 'success'
						        });
		                	}
		                }
					},earningQuery);
				}
			},userLoginSessionKey);
		}
	});

	/**
	 * To remove user flag
	 * @param {string}  userLoginSessionKey
	 * @param {integer} userReportId
	 * @param {string}  reason
	 */
	app.post('/admin/remove-user-flag', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("userReportId").trim();
		req.sanitize("reason").trim();
	    req.check('userLoginSessionKey', 'The User login session key field is required').notEmpty();
	    req.check('userReportId', 'The report id field is required').notEmpty();
	    req.check('reason', 'The reason field is required').notEmpty();
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
			let reason              = req.sanitize('reason').escape().trim();
			let userReportId        = parseInt(req.sanitize('userReportId').escape().trim());

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{

					let masterUserId = parseInt(respObj[0].userId);

					/* To check valid report Id */
					model.getAllWhere(function(err,reportRespDetails){
						if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(reportRespDetails != ""){
		                		if(parseInt(reportRespDetails[0].isAdminRemovedRedFlag) === 1){
		                			return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": 'Report flag already removed.'
									        });
		                		}else{
		                			database.pool.getConnection(function(err, connection) {

		                				let userID = parseInt(reportRespDetails[0].userReportFriendId);

								   		/* Begin transaction */
					                    connection.beginTransaction(function(err) {
					                        if (err) {
					                            return res.send(custom.dbErrorResponse());
					                        }

					                        /* Update User Report Flag Data */	   
											let reportFlagObj = {};
											reportFlagObj.isAdminRemovedRedFlag = 1;
											reportFlagObj.adminRemoveReportFlagReason   = reason;
											reportFlagObj.adminRemoveReportFlagDateTime = custom.getCurrentTime();
					                        let u1 = queryBuilder.update(constant.report_users,reportFlagObj,{userReportId:userReportId});
					                        queryBuilder.reset_query(u1);
					                        connection.query(u1, function(err, reportResp) {
						                        if (err) {
						                            connection.rollback(function() {
						                                return res.send(custom.dbErrorResponse(err.sqlMessage));
						                            });
						                        }

						                    /* Update user report flag count */
					                        let u2 = "UPDATE (`"+constant.user_details+"`) SET `noOfRedFlags` = noOfRedFlags - 1 WHERE `userId` = " + userID + " AND noOfRedFlags > 0";
					                        queryBuilder.reset_query(u2);
					                        connection.query(u2, function(err, resp) {
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

						                            // BACKGROUD PROCESS (IN QUEUE)

						                            /* Insert remove report flag notification */
												   	let notificationDataObj = {};
							                		notificationDataObj.notificationUserId   = masterUserId;
							                		notificationDataObj.notificationFriendId = userID;
							                		notificationDataObj.reportModuleID       = userReportId;
							                		notificationDataObj.notificationModule   = 'GLOBAL';
							                		notificationDataObj.notificationType     = 'ADMIN_REMOVE_RED_FLAG';
							                		notificationDataObj.notificationMessage  = 'has removed a red flag.';
							                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
							                		model.insertData(function(err,notificationResp){
						                            	if(err){
						                            		console.log('Hire app notification error',err);
						                            	}else{
						                            		console.log('Hire app notification success');
						                            	}
						                            },constant.notifications,notificationDataObj);

						                            /* Update provider badges */
						                            let updateQuery = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + userID;
						                            model.customQuery(function(err,badgesResp){
						                            	if(err){
						                            		console.log('Admin Remove Red Flag error',err);
						                            	}else{
						                            		console.log('Admin Remove Red Flag success');
						                            	}
						                            },updateQuery);

						                            /* To send push notifications */
						                            let userMessage = respObj[0].userFirstName + " " + respObj[0].userLastName + " has removed a red flag.";
						                            let extraParams = {};
						                            extraParams.reportModuleID    = userReportId;
						                            extraParams.moduleName        = 'GLOBAL';
						                            extraParams.notificationType  = 'ADMIN_REMOVE_RED_FLAG';
						                            notification.sendPushNotifications(userMessage,userID,extraParams);

						                            /* Return user response */
								            		return res.send({"code" : 200, "response" : {},"status" : 1,"message" : "User Flag removed successfully."});
						                        }
					                    	});
					                    	});
					                    	});
					                	});
									}); 
		                		}
		                	}else{
		                		return res.send({
								            "code": 200,
								            "response": {},
								            "status": 0,
								            "message": 'Report details not found.'
								        });
		                	}
		                }
					},constant.report_users,{userReportId:userReportId});
				}
			},userLoginSessionKey);
		}
	});

	/* To get job details
	 * @param {string}  userLoginSessionKey
	 * @param {integer} jobID 
	*/
	app.post('/admin/get-job-details', function(req, res) {
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("jobID").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('jobID', custom.lang(locale,'The Job id field is require')).notEmpty();
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
			let jobID                 = parseInt(req.sanitize('jobID').escape().trim());

			/* To validate user login session key */
			custom.handleLoggedInUser(function(respType,respObj) {
				if(parseInt(respType) === 0){
					return res.send(respObj);
				}else{
					async.parallel({
					    jobDetails: function(callback) {

					        /* To get job details */
					    	model.getAllWhere(function(err,jobRespObj){
						        	if(err){
					                    return res.send(custom.dbErrorResponse());
					                }else{
					                	if(jobRespObj != ""){
					                		callback(null, jobRespObj);
					                	}else{
					                		return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,"Job details not found.")
											        });
					                	}
					                }
						    },constant.jobs,{jobID:jobID});
					    },
					    jobPaymentDistribution: function(callback) {
					        
					        /* To get job payment distribution details */
					    	model.getAllWhere(function(err,jobPaymentDistributionObj){
						        	if(err){
					                    return res.send(custom.dbErrorResponse());
					                }else{
					                	callback(null, jobPaymentDistributionObj);
					                }
						    },constant.jobs_payment_distribution,{jobParentID:jobID});
					    },
					    jobDispute: function(callback) {
					        
					        /* To get job dispute details */
					    	model.getAllWhere(function(err,jobDisputeObj){
						        	if(err){
					                    return res.send(custom.dbErrorResponse());
					                }else{
					                	callback(null, jobDisputeObj);
					                }
						    },constant.job_disputes,{jobParentID:jobID});
					    },
					    jobCancel: function(callback) {
					        
					        /* To get job cancel details */
					    	model.getAllWhere(function(err,jobCancelObj){
						        	if(err){
					                    return res.send(custom.dbErrorResponse());
					                }else{
					                	callback(null, jobCancelObj);
					                }
						    },constant.job_cancel,{jobParentID:jobID});
					    },
					    jobMilestones: function(callback) {
					        
					        /* To get job milestone details */
					    	model.getAllWhere(function(err,jobMilestoneObj){
						        	if(err){
					                    return res.send(custom.dbErrorResponse());
					                }else{
					                	callback(null, jobMilestoneObj);
					                }
						    },constant.milestones,{milestoneJobID:jobID});
					    },
					    jobReview: function(callback) {
					        
					        /* To get job review details */
					    	model.getAllWhere(function(err,jobReviewDetails){
						        	if(err){
					                    return res.send(custom.dbErrorResponse());
					                }else{
					                	callback(null, jobReviewDetails);
					                }
						    },constant.jobs_review,{jobReviewParentID:jobID});
					    }
					}, function(err, results) {
						if(err){
							return res.send({
								            "code": 200,
								            "response": {},
								            "status": 0,
								            "message": custom.lang(locale,constant.general_error)
								        });
						}else{
							let jobDetails = results.jobDetails;
							let jobPaymentDistributionDetails = results.jobPaymentDistribution;
							let jobDisputeDetails = results.jobDispute;
							let jobCancelDetails  = results.jobCancel;
							let jobMilestonesDetails = results.jobMilestones;
							let jobReviewDetails     = results.jobReview;

							let jobDetailsResp = {};
							let jobPaymentDistributionDetailsResp = {};
							let jobDisputeDetailsResp  = {};
							let jobCancelDetailsResp   = {};
							let jobHirerDetailsResp    = {};
							let jobProviderDetailsResp = {};
							let jobMilestonesDetailsResp = [];
							let jobReviewDetailsResp = [];
							let userDetailsObj = respObj;
							if(jobDetails != "")
							{
								jobDetailsResp.jobID = parseInt(jobDetails[0].jobID);
								jobDetailsResp.jobCustomID = custom.nullChecker(jobDetails[0].jobCustomID);
								jobDetailsResp.jobHirerUserID = parseInt(jobDetails[0].jobHirerUserID);
								jobDetailsResp.jobProviderUserID = parseInt(jobDetails[0].jobProviderUserID);
								jobDetailsResp.jobTitle = custom.nullChecker(jobDetails[0].jobTitle);
								jobDetailsResp.jobDescprition = custom.nullChecker(jobDetails[0].jobDescprition);
								jobDetailsResp.jobMode = custom.nullChecker(jobDetails[0].jobMode);
								jobDetailsResp.jobAddress = custom.nullChecker(jobDetails[0].jobAddress);
								jobDetailsResp.jobLatitude  = custom.nullChecker(jobDetails[0].jobLatitude);
								jobDetailsResp.jobLongitude = custom.nullChecker(jobDetails[0].jobLongitude);
								jobDetailsResp.jobStartDate = custom.changeDateFormat(jobDetails[0].jobStartDate,'yyyy-mm-dd');
								jobDetailsResp.jobEndDate = custom.changeDateFormat(jobDetails[0].jobEndDate,'yyyy-mm-dd');
								jobDetailsResp.jobPaymentMethod = custom.nullChecker(jobDetails[0].jobPaymentMethod);
								jobDetailsResp.jobAgreedAmount = parseInt(jobDetails[0].jobAgreedAmount);
								jobDetailsResp.jobAdvanceAmount = parseInt(jobDetails[0].jobAdvanceAmount);
								jobDetailsResp.jobMilestoneAmountTotal = (jobDetails[0].jobMilestoneAmountTotal) ? parseInt(jobDetails[0].jobMilestoneAmountTotal) : 0;
								jobDetailsResp.jobType = custom.nullChecker(jobDetails[0].jobType);
								jobDetailsResp.jobNoOfMilestones = parseInt(jobDetails[0].jobNoOfMilestones);
								jobDetailsResp.jobHireDateTime = custom.changeDateFormat(jobDetails[0].jobHireDateTime);
								jobDetailsResp.jobGlobalStatus = custom.nullChecker(jobDetails[0].jobGlobalStatus);
								jobDetailsResp.jobAcceptStatus = custom.nullChecker(jobDetails[0].jobAcceptStatus);
								jobDetailsResp.jobDisputed = parseInt(jobDetails[0].jobDisputed);
								jobDetailsResp.jobDisputeStatus = custom.nullChecker(jobDetails[0].jobDisputeStatus);
								jobDetailsResp.jobCancelReason  = custom.nullChecker(jobDetails[0].jobCancelReason);
							}
							if(jobPaymentDistributionDetails != "")
							{
								jobPaymentDistributionDetailsResp.jobHirerQlFeesPercent    = parseInt(jobPaymentDistributionDetails[0].jobHirerQlFeesPercent);
								jobPaymentDistributionDetailsResp.jobProviderQlFeesPercent = parseInt(jobPaymentDistributionDetails[0].jobProviderQlFeesPercent);
								jobPaymentDistributionDetailsResp.jobHirerQlFeesAmount     = custom.parseNumber(jobPaymentDistributionDetails[0].jobHirerQlFeesAmount);
								jobPaymentDistributionDetailsResp.jobProviderQlFeesAmount  = custom.parseNumber(jobPaymentDistributionDetails[0].jobProviderQlFeesAmount);
								jobPaymentDistributionDetailsResp.jobHirerAdvanceAmount    = (jobPaymentDistributionDetails[0].jobHirerAdvanceAmount) ? parseInt(jobPaymentDistributionDetails[0].jobHirerAdvanceAmount) : 0;
								jobPaymentDistributionDetailsResp.jobProviderAdvanceAmount = (jobPaymentDistributionDetails[0].jobProviderAdvanceAmount) ? parseInt(jobPaymentDistributionDetails[0].jobProviderAdvanceAmount) : 0;
								jobPaymentDistributionDetailsResp.jobHirerMilestoneAmount  = (jobPaymentDistributionDetails[0].jobHirerMilestoneAmount) ? parseInt(jobPaymentDistributionDetails[0].jobHirerMilestoneAmount) : 0;
								jobPaymentDistributionDetailsResp.jobProviderMilestoneAmount = (jobPaymentDistributionDetails[0].jobProviderMilestoneAmount) ? parseInt(jobPaymentDistributionDetails[0].jobProviderMilestoneAmount) : 0;
								jobPaymentDistributionDetailsResp.jobTotalAgreedAmount     = parseInt(jobPaymentDistributionDetails[0].jobTotalAgreedAmount);
							}
							if(jobDisputeDetails != "")
							{
								jobDisputeDetailsResp.jobDisputeID = parseInt(jobDisputeDetails[0].jobDisputeID);
								jobDisputeDetailsResp.jobDisputeUserID = parseInt(jobDisputeDetails[0].jobDisputeUserID);
								jobDisputeDetailsResp.jobDisputeStatus = custom.nullChecker(jobDisputeDetails[0].jobDisputeStatus);
								jobDisputeDetailsResp.jobDisputeReason = custom.nullChecker(jobDisputeDetails[0].jobDisputeReason);
								jobDisputeDetailsResp.jobDisputePaidAmount = custom.parseNumber(jobDisputeDetails[0].jobDisputePaidAmount);
								jobDisputeDetailsResp.jobDisputeRemainingAmount = custom.parseNumber(jobDisputeDetails[0].jobDisputeRemainingAmount);
								jobDisputeDetailsResp.jobDisputeHireRefundAmount = custom.parseNumber(jobDisputeDetails[0].jobDisputeHireRefundAmount);
								jobDisputeDetailsResp.jobDisputeProviderRefundAmount = custom.parseNumber(jobDisputeDetails[0].jobDisputeProviderRefundAmount);
								jobDisputeDetailsResp.jobDisputeDateTime = custom.changeDateFormat(jobDisputeDetails[0].jobDisputeDateTime);
							}
							if(jobCancelDetails != "")
							{
								jobCancelDetailsResp.jobCancelID        = parseInt(jobCancelDetails[0].jobCancelID);
								jobCancelDetailsResp.jobCancelUserID    = parseInt(jobCancelDetails[0].jobCancelUserID);
								jobCancelDetailsResp.jobCancelStatus    = custom.nullChecker(jobCancelDetails[0].jobCancelStatus);
								jobCancelDetailsResp.jobCancelReason    = custom.nullChecker(jobCancelDetails[0].jobCancelReason);
								jobCancelDetailsResp.jobCancelDatetime  = custom.changeDateFormat(jobCancelDetails[0].jobCancelDatetime);
								jobCancelDetailsResp.jobCancelFeesPercent = custom.parseNumber(jobCancelDetails[0].jobCancelFeesPercent);
								jobCancelDetailsResp.jobCancelFeesAmount  = custom.parseNumber(jobCancelDetails[0].jobCancelFeesAmount);
								jobCancelDetailsResp.jobCancelRemainingAmount   = custom.parseNumber(jobCancelDetails[0].jobCancelRemainingAmount);
								jobCancelDetailsResp.jobCancelAdminRefundAmount = custom.parseNumber(jobCancelDetails[0].jobCancelAdminRefundAmount);
							}
							if(parseInt(jobMilestonesDetails.length) > 0)
							{
								for (var i = 0; i < parseInt(jobMilestonesDetails.length); i++)
								{
									let row = {};
									row.milestoneID    = parseInt(jobMilestonesDetails[i].milestoneID);
									row.milestoneJobID = parseInt(jobMilestonesDetails[i].milestoneJobID);
									row.milestoneTitle = custom.nullChecker(jobMilestonesDetails[i].milestoneTitle);
									row.milestoneAmount = parseInt(jobMilestonesDetails[i].milestoneAmount);
									row.milestoneStatus = custom.nullChecker(jobMilestonesDetails[i].milestoneStatus);
									row.milestoneDateTime = custom.changeDateFormat(jobMilestonesDetails[i].milestoneDateTime);
									jobMilestonesDetailsResp.push(row);
								}
							}
							if(parseInt(jobReviewDetails.length) > 0)
							{
								for (var j = 0; j < parseInt(jobReviewDetails.length); j++)
								{
									let row = {};
									row.jobReviewID       = parseInt(jobReviewDetails[j].jobReviewID);
									row.jobReviewUserID   = parseInt(jobReviewDetails[j].jobReviewUserID);
									row.jobReviewRating   = parseInt(jobReviewDetails[j].jobReviewRating);
									row.jobReviewMessage  = custom.nullChecker(jobReviewDetails[j].jobReviewMessage);
									row.jobReviewDateTime = custom.changeDateFormat(jobReviewDetails[j].jobReviewDateTime);
									jobReviewDetailsResp.push(row);
								}
							}

							if(userDetailsObj[0].userId === jobDetails[0].jobHirerUserID){ // Hirer
								jobHirerDetailsResp.userEmail     = custom.nullChecker(userDetailsObj[0].userEmail);
								jobHirerDetailsResp.userFirstName = custom.nullChecker(userDetailsObj[0].userFirstName);
								jobHirerDetailsResp.userLastName  = custom.nullChecker(userDetailsObj[0].userLastName);
								jobHirerDetailsResp.userAddress   = custom.nullChecker(userDetailsObj[0].userAddress);
								jobHirerDetailsResp.userLatitude  = custom.nullChecker(userDetailsObj[0].userLatitude);
								jobHirerDetailsResp.userLongitude = custom.nullChecker(userDetailsObj[0].userLongitude);
								jobHirerDetailsResp.userCountry   = custom.nullChecker(userDetailsObj[0].userCountry);
								jobHirerDetailsResp.isBecomeProvider   = parseInt(userDetailsObj[0].isBecomeProvider);
								jobHirerDetailsResp.isHideProfileAsProvider = parseInt(userDetailsObj[0].isHideProfileAsProvider);
								jobHirerDetailsResp.userImage     = (!userDetailsObj[0].userImage) ? '' : constant.base_url + userDetailsObj[0].userImage;
								jobHirerDetailsResp.userImageThumbnail = (!userDetailsObj[0].userImageThumbnail) ? '' : constant.base_url + userDetailsObj[0].userImageThumbnail;

								/* Get provider details */
								custom.getUserProfileDetails(function(respType,providerDetailsResp){
									if(respType === 0){
										return providerDetailsResp;
									}else{
										jobProviderDetailsResp.userEmail     = custom.nullChecker(providerDetailsResp[0].userEmail);
										jobProviderDetailsResp.userFirstName = custom.nullChecker(providerDetailsResp[0].userFirstName);
										jobProviderDetailsResp.userLastName  = custom.nullChecker(providerDetailsResp[0].userLastName);
										jobProviderDetailsResp.userAddress   = custom.nullChecker(providerDetailsResp[0].userAddress);
										jobProviderDetailsResp.userLatitude  = custom.nullChecker(providerDetailsResp[0].userLatitude);
										jobProviderDetailsResp.userLongitude = custom.nullChecker(providerDetailsResp[0].userLongitude);
										jobProviderDetailsResp.userCountry   = custom.nullChecker(providerDetailsResp[0].userCountry);
										jobProviderDetailsResp.isBecomeProvider   = parseInt(providerDetailsResp[0].isBecomeProvider);
										jobProviderDetailsResp.isHideProfileAsProvider = parseInt(providerDetailsResp[0].isHideProfileAsProvider);
										jobProviderDetailsResp.userImage     = (!providerDetailsResp[0].userImage) ? '' : constant.base_url + providerDetailsResp[0].userImage;
										jobProviderDetailsResp.userImageThumbnail = (!providerDetailsResp[0].userImageThumbnail) ? '' : constant.base_url + providerDetailsResp[0].userImageThumbnail;

										return res.send({
										            "code": 200,
										            "response": {jobDetails:jobDetailsResp,jobHirerDetails:jobHirerDetailsResp,jobProviderDetails:jobProviderDetailsResp,jobPaymentDistributionDetails:jobPaymentDistributionDetailsResp,jobDisputeDetails:jobDisputeDetailsResp,jobCancelDetails:jobCancelDetailsResp,jobMilestonesDetails:jobMilestonesDetailsResp,jobReviewDetails:jobReviewDetailsResp},
										            "status": 1,
										            "message": custom.lang(locale,'success')
										        });
										
									}
								},jobDetails[0].jobProviderUserID);
							}else{ // Provider
								jobProviderDetailsResp.userEmail     = custom.nullChecker(userDetailsObj[0].userEmail);
								jobProviderDetailsResp.userFirstName = custom.nullChecker(userDetailsObj[0].userFirstName);
								jobProviderDetailsResp.userLastName  = custom.nullChecker(userDetailsObj[0].userLastName);
								jobProviderDetailsResp.userAddress   = custom.nullChecker(userDetailsObj[0].userAddress);
								jobProviderDetailsResp.userLatitude  = custom.nullChecker(userDetailsObj[0].userLatitude);
								jobProviderDetailsResp.userLongitude = custom.nullChecker(userDetailsObj[0].userLongitude);
								jobProviderDetailsResp.userCountry   = custom.nullChecker(userDetailsObj[0].userCountry);
								jobProviderDetailsResp.isBecomeProvider   = parseInt(userDetailsObj[0].isBecomeProvider);
								jobProviderDetailsResp.isHideProfileAsProvider = parseInt(userDetailsObj[0].isHideProfileAsProvider);
								jobProviderDetailsResp.userImage     = (!userDetailsObj[0].userImage) ? '' : constant.base_url + userDetailsObj[0].userImage;
								jobProviderDetailsResp.userImageThumbnail = (!userDetailsObj[0].userImageThumbnail) ? '' : constant.base_url + userDetailsObj[0].userImageThumbnail;

								/* Get buyer details */
								custom.getUserProfileDetails(function(respType,hirerDetails){
									if(respType === 0){
										return hirerDetails;
									}else{
										jobHirerDetailsResp.userEmail     = custom.nullChecker(hirerDetails[0].userEmail);
										jobHirerDetailsResp.userFirstName = custom.nullChecker(hirerDetails[0].userFirstName);
										jobHirerDetailsResp.userLastName  = custom.nullChecker(hirerDetails[0].userLastName);
										jobHirerDetailsResp.userAddress   = custom.nullChecker(hirerDetails[0].userAddress);
										jobHirerDetailsResp.userLatitude  = custom.nullChecker(hirerDetails[0].userLatitude);
										jobHirerDetailsResp.userLongitude = custom.nullChecker(hirerDetails[0].userLongitude);
										jobHirerDetailsResp.userCountry   = custom.nullChecker(hirerDetails[0].userCountry);
										jobHirerDetailsResp.isBecomeProvider   = parseInt(hirerDetails[0].isBecomeProvider);
										jobHirerDetailsResp.isHideProfileAsProvider = parseInt(hirerDetails[0].isHideProfileAsProvider);
										jobHirerDetailsResp.userImage     = (!hirerDetails[0].userImage) ? '' : constant.base_url + hirerDetails[0].userImage;
										jobHirerDetailsResp.userImageThumbnail = (!hirerDetails[0].userImageThumbnail) ? '' : constant.base_url + hirerDetails[0].userImageThumbnail;

										return res.send({
										            "code": 200,
										            "response": {jobDetails:jobDetailsResp,jobHirerDetails:jobHirerDetailsResp,jobProviderDetails:jobProviderDetailsResp,jobPaymentDistributionDetails:jobPaymentDistributionDetailsResp,jobDisputeDetails:jobDisputeDetailsResp,jobCancelDetails:jobCancelDetailsResp,jobMilestonesDetails:jobMilestonesDetailsResp,jobReviewDetails:jobReviewDetailsResp},
										            "status": 1,
										            "message": custom.lang(locale,'success')
										        });
									}
								},jobDetails[0].jobHirerUserID);
							}
						}
					});
				}
			},userLoginSessionKey);

			
		}
	});





}