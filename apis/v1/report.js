"use strict";

/*
 * Purpose : For Report Flag Rest API
 * Package : Report Flag
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

	/* Set files destination path */
	var uploadPath = './uploads/report-flag/';
	var storage    = multer.diskStorage({
		destination: function(req, file, callback) {
			callback(null, uploadPath)
		},
		filename: function(req, file, callback) {
			let uploadedFileName = 'report-flag-'+ Date.now() + '-' + custom.getGuid() + path.extname(file.originalname);
			callback(null, uploadedFileName)
		}
	});
	var uploadFiles  = multer({ storage:storage }).array('userFiles',3);

	/* To report a user
	 * @param {string}  userLoginSessionKey
	 * @param {integer} friendID
	 * @param {integer} userReportCategory
	 * @param {string}  userReportDescprition
	 * @param {file}    userFiles
	*/
	app.post('/user/report-flag', function(req, res) {
		let fileObj = new Array();
		uploadFiles(req,res,function(err) {
			if(err) {
				console.log('report files ',err);
	       	}
	       	fileObj = req.files;
	        let totalUploadedFiles = parseInt(fileObj.length);
			let timezone  = req.headers.timezone;
			let locale    = req.headers.locale;
			req.sanitize("userLoginSessionKey").trim();
	    	req.sanitize("friendID").trim();
	    	req.sanitize("userReportCategory").trim();
	    	req.sanitize("userReportDescprition").trim();
		    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
		    req.check('friendID', custom.lang(locale,'The friend id field is required')).notEmpty();
		    req.check('userReportCategory', custom.lang(locale,'The report category field is required')).notEmpty();
		    req.check('userReportDescprition', custom.lang(locale,'The report descprition field is required')).notEmpty();
		    let errors = req.validationErrors();
		    if (errors) {
		    	if(totalUploadedFiles > 0)
	        	{
		    		/* To delete uploaded file */
		    		custom.unlinkMultipleFile(fileObj);
		    	}
		        res.send({
		            "code": 200,
		            "response": {},
		            "status": 0,
		            "message": custom.manageValidationMessages(errors)
		        });
		    } else {
		    	let userLoginSessionKey   = req.sanitize('userLoginSessionKey').escape().trim();
		    	let friendID   		      = parseInt(req.sanitize('friendID').escape().trim());
		    	let userReportCategory    = req.sanitize('userReportCategory').escape().trim();
		    	let userReportDescprition = req.sanitize('userReportDescprition').escape().trim();
		    	let isVideoFile = 0;
		    	let isImageFile = 0;
		    	let friendNoOfFlags = 0;
		    	let userReportImage = new Array();
		    	let userReportImageThumbnail = new Array();
		    	let userReportVideo = '';
		    	let userReportVideoThumbnail = '';

		    	async.waterfall([
				    function(callback) {
				        /* To validate user login session key */
						custom.handleLoggedInUser(function(respType,respObj) {
							if(parseInt(respType) === 0){
								if(totalUploadedFiles > 0)
					        	{
						    		/* To delete uploaded file */
						    		custom.unlinkMultipleFile(fileObj);
						    	}
								return res.send(respObj);
							}else{
								if(parseInt(respObj[0].userId) === friendID){
									if(totalUploadedFiles > 0)
						        	{
							    		/* To delete uploaded file */
							    		custom.unlinkMultipleFile(fileObj);
							    	}
									return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'You can`t mark report flag with your self.')
									        });
								}else{

									/* Validate friend ID */
									custom.getUserProfileDetails(function(respType,friendDetails){
										if(respType === 0){
											if(totalUploadedFiles > 0)
								        	{
									    		/* To delete uploaded file */
									    		custom.unlinkMultipleFile(fileObj);
									    	}
						                    return res.send(custom.dbErrorResponse());
						                }else{
						                	if(friendDetails != ""){
						                		friendNoOfFlags = parseInt(friendDetails[0].noOfRedFlags);

						                		/* To check if report flag is already marked */
						                		model.getAllWhere(function(err,reportFlagResp){
													if(err){
														if(totalUploadedFiles > 0)
											        	{
												    		/* To delete uploaded file */
												    		custom.unlinkMultipleFile(fileObj);
												    	}
									                    return res.send(custom.dbErrorResponse());
									                }else{
									                	if(reportFlagResp != ""){
									                		if(totalUploadedFiles > 0)
												        	{
													    		/* To delete uploaded file */
													    		custom.unlinkMultipleFile(fileObj);
													    	}
													    	return res.send({
															            "code": 200,
															            "response": {},
															            "status": 0,
															            "message": custom.lang(locale,'Report flag already marked')
															        });
									                	}else{
									                		callback(null, respObj,friendDetails);
									                	}
									                }
									            },constant.report_users,{userReportUserId:respObj[0].userId,userReportFriendId:friendID});
						                	}else{
						                		if(totalUploadedFiles > 0)
									        	{
										    		/* To delete uploaded file */
										    		custom.unlinkMultipleFile(fileObj);
										    	}
										    	return res.send({
												            "code": 200,
												            "response": {},
												            "status": 0,
												            "message": custom.lang(locale,'Invalid friend ID.')
												        });
						                	}
						                }
									},friendID);
								}
							}
						},userLoginSessionKey,timezone);
				    },
			    	function(userDetailsObj,friendDetails, callback) {
			    		if(totalUploadedFiles > 0){
			    			for (var i = 0; i < parseInt(totalUploadedFiles); i++) 
			    			{
			    				let fileType = (!fileObj[i].mimetype) ? '' : fileObj[i].mimetype;
			    				if(fileType && fileType.indexOf("video") >= 0)
			    				{
			    					isVideoFile = 1;
			    					userReportVideo = fileObj[i].path;
			    				}else if(fileType && fileType.indexOf("image") >= 0)
			    				{
			    					isImageFile = 1;
			    					userReportImage.push(fileObj[i].path);
			    				}
			    				if(i === parseInt(totalUploadedFiles - 1)){
			    					callback(null, userDetailsObj,friendDetails);
			    				}
			    			}
			    		}else{
			    			callback(null, userDetailsObj,friendDetails);
			    		}
			    	}
				], function (err, userDetailsObj,friendDetails) {
				    
				    database.pool.getConnection(function(err, connection) {

				   		/* Begin transaction */
	                    connection.beginTransaction(function(err) {
	                        if (err) {
	                        	if(totalUploadedFiles > 0)
					        	{
						    		/* To delete uploaded file */
						    		custom.unlinkMultipleFile(fileObj);
						    	}
	                            return res.send(custom.dbErrorResponse());
	                        }
	                        console.log('userReportImage',userReportImage);

	                        /* Insert Report User data */
	                        var insertDataObj = {};
							insertDataObj.userReportUserId      = userDetailsObj[0].userId;
							insertDataObj.userReportFriendId    = friendID;
							insertDataObj.userReportCategory    = userReportCategory;
							insertDataObj.userReportDescprition = userReportDescprition;
							insertDataObj.userReportImage       = JSON.stringify(userReportImage);
							insertDataObj.userReportVideo       = userReportVideo;
							insertDataObj.userReportDateTime    = custom.getCurrentTime();
	                        let i1 = queryBuilder.insert(constant.report_users,insertDataObj);
	                        queryBuilder.reset_query(i1);
	                        connection.query(i1, function(err, reportResp) {
		                        if (err) {
		                        	if(totalUploadedFiles > 0)
						        	{
							    		/* To delete uploaded file */
							    		custom.unlinkMultipleFile(fileObj);
							    	}
		                            connection.rollback(function() {
		                                return res.send(custom.dbErrorResponse(err.sqlMessage));
		                            });
		                        }
		                    if(!reportResp)
		                    {
		                    	return res.send({
								            "code": 200,
								            "response": {},
								            "status": 0,
								            "message": custom.lang(locale,'Failed to report a user.')
								        });
		                    }
		                    var userReportId = parseInt(reportResp.insertId);

		                    /* Update report falg count */
	                        let u1 = "UPDATE (`"+constant.user_details+"`) SET `noOfRedFlags` = noOfRedFlags + 1 WHERE `userId` = " + friendID;
	                        queryBuilder.reset_query(u1);
	                        connection.query(u1, function(err, productResp) {
		                        if (err) {
		                        	if(totalUploadedFiles > 0)
						        	{
							    		/* To delete uploaded file */
							    		custom.unlinkMultipleFile(fileObj);
							    	}
		                            connection.rollback(function() {
		                                return res.send(custom.dbErrorResponse(err.sqlMessage));
		                            });
		                        }


		                    connection.commit(function(err) {
		                        if (err) {
		                        	if(totalUploadedFiles > 0)
						        	{
							    		/* To delete uploaded file */
							    		custom.unlinkMultipleFile(fileObj);
							    	}
		                            connection.rollback(function() {
		                                return res.send(custom.dbErrorResponse());
		                            });
		                        }else{
		                            connection.release();

		                            // BACKGROUD PROCESS (IN QUEUE)

		                            /* Generate image thumbnail */
		                            if(isImageFile === 1)
		                            {
		        //                     	let uploadedFilePath = userReportImage;
										// custom.getImgThumbnail(function(respType,resp){
										// 	if(parseInt(respType) === 0){
								  //               console.log('report generate image thumbnail err');
										// 	}else{
										// 		let thumbnailUploadedImgPath = resp;
										// 		/* Update image thumbnail */
										// 		model.updateData(function(err,updateResp){
										// 			if(err){
			       //          							custom.unlinkFile(thumbnailUploadedImgPath);
										// 				console.log('report update image thumbnail err');
										// 			}else{
										// 				console.log('report update image thumbnail success');
										// 			}
										// 		},constant.report_users,{userReportImageThumbnail:thumbnailUploadedImgPath},{userReportId:userReportId});
										// 	}
										// },uploadedFilePath,uploadPath,250);
		                            }

		                            /* Generate video thumbnail */
		                            if(isVideoFile === 1)
		                            {
		                            	let uploadedFilePath = userReportVideo;
		                            	custom.getVideoThumbnail(function(err,thumbnailResp){
											if(parseInt(err) === 0){
								                console.log('report generate video thumbnail err');
											}else{
												let videoThumbnailPath = thumbnailResp.outputThumbFilePath;
												/* Update video thumbnail */
												model.updateData(function(err,updateResp){
													if(err){
			                							custom.unlinkFile(videoThumbnailPath);
														console.log('report update video thumbnail err');
													}else{
														console.log('report update video thumbnail success');
													}
												},constant.report_users,{userReportVideoThumbnail:videoThumbnailPath},{userReportId:userReportId});
											}
										},uploadedFilePath,'uploads/report-flag/');
		                            }

		                            let notificationMsg = '';
		                            friendNoOfFlags  = friendNoOfFlags + 1;
		                            switch(friendNoOfFlags) {
									    case 1:
									        notificationMsg = "You have received a Red Flag. Red Flags are given by other Users due to improper conduct. More Red Flags may produce an Account Suspension";
									        break;
									    case 2:
									        notificationMsg = "This is your 2nd Red Flag. A 3rd Red Flag could cause an Account Suspension. QL Team will be reviewing your case";
									        break;
									    case 3:
									        notificationMsg = "You have received 3 Red Flags due to improper conduct towards other Users. QL's Safety Rules is determining a temporary suspension on your Account. Please, get in contact with us to review your case and help you Reactivate your account. Thank you.";
									        break;
									    default:
									    	notificationMsg = "You have received one more Red Flag";
									}

		                            /* Insert report flag notification */
		                            let masterUserId = userDetailsObj[0].userId;
								   	let notificationDataObj = {};
			                		notificationDataObj.notificationUserId   = masterUserId;
			                		notificationDataObj.notificationFriendId = friendID;
			                		notificationDataObj.reportModuleID       = userReportId;
			                		notificationDataObj.notificationModule   = 'GLOBAL';
			                		notificationDataObj.notificationType     = 'REPORT_FLAG';
			                		notificationDataObj.notificationMessage  = notificationMsg;
			                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
			                		model.insertData(function(err,notificationResp){
		                            	if(err){
		                            		console.log('Report flag notification error',err);
		                            	}else{
		                            		console.log('Report flag notification success');
		                            	}
		                            },constant.notifications,notificationDataObj);

		                            /* Update user badges */
		                            let updateQuery = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + friendID;
		                            model.customQuery(function(err,badgesResp){
		                            	if(err){
		                            		console.log('Report flag notification badges error',err);
		                            	}else{
		                            		console.log('Report flag notification badges success');
		                            	}
		                            },updateQuery);

		                            /* To send push notifications */
		                            let extraParams = {};
		                            extraParams.reportModuleID     = userReportId;
		                            extraParams.userReportUserId   = masterUserId;
		                            extraParams.userReportFriendId = friendID;
		                            extraParams.moduleName         = 'GLOBAL';
		                            extraParams.notificationType   = 'REPORT_FLAG';
		                            notification.sendPushNotifications(notificationMsg,friendID,extraParams);

		                            /* Send email to friend */
		                            if(parseInt(friendNoOfFlags) === 3)
		                            {
		                            	if(friendDetails[0].isUserBlocked === 0)
		                            	{
		                            		/* Auto block user */
		                            		model.updateData(function(err,updateResp){
		                            			if(err){
				                            		console.log('User update block status error',err);
				                            	}else{
				                            		console.log('User update block status success');
				                            	}
		                            		},constant.user_details,{isUserBlocked:1},{userId:friendDetails[0].userId});
		                            	}

                                        let siteName = constant.site_name;
                                        let reportFlagEmailMessage = "";
									        reportFlagEmailMessage += "Hello "+friendDetails[0].userFirstName+", <br/><br/>";
									        reportFlagEmailMessage += "You have received 3 Red Flags due to improper conduct towards other Users. QL's Safety Rules is determining a temporary suspension on your Account. Please, get in contact with us to review your case and help you Reactivate your account.";
									        reportFlagEmailMessage += "Thanks <br/> "+siteName+" Team";
                                        let mailData = {};
                                        mailData.to_email = friendDetails[0].userEmail;
                                        mailData.subject  = 'Got 3 Report Flags';
                                        mailData.message  = reportFlagEmailMessage;
                                        custom.sendEmail(mailData);
		                            }

		                            // HERE WE WILL MANAGE ADMIN NOTIFICATION ALSO

		                            /* Return user response */
		            				return res.send({"code" : 200, "response" : {reportModuleID:userReportId},"status" : 1,"message" : custom.lang(locale,'User report flag marked successfully.')});
		                        }
	                    	});
	                    	});
	                    	});
	                    });
	                });
				});
		    }
		});
	});

}