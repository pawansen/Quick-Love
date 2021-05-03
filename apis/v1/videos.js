"use strict";

/*
 * Purpose : For Videos Rest API
 * Package : Videos
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

	/* Set videos file destination path */
	var uploadPath = './uploads/videos/';
	var storage    = multer.diskStorage({
		destination: function(req, file, callback) {
			callback(null, uploadPath)
		},
		filename: function(req, file, callback) {
			let uploadedFileName = 'video-'+ Date.now() + '-' + custom.getGuid() + path.extname(file.originalname);
			callback(null, uploadedFileName)
		}
	});
	var uploadVideo  = multer({ storage:storage }).array('userVideo',1);

	/* To add provider videos
	 * @param {string}  userLoginSessionKey
	 * @param {integer} videoLength (In Seconds)
	 * @param {file}    userVideo
	*/
	app.post('/provider/add-video', function(req, res) {
		uploadVideo(req,res,function(err) {
			if(err) {
	            return  res.send({
					            "code": 200,
					            "response": {},
					            "status": 0,
					            "message":'Error while uploading video.' 
					        });
	       }else{
	       		let uploadedFileName = (req.files != "") ? req.files[0].filename : ''; 
	       		let uploadedFileSize = (req.files != "") ? req.files[0].size : 0; 
    			let uploadedFilePath = (req.files != "") ? req.files[0].path : '';
	       		if(uploadedFileName == "" || uploadedFilePath == "")
	       		{
	       			return  res.send({
					            "code": 200,
					            "response": {},
					            "status": 0,
					            "message":'Error while uploading video.' 
					        });
	       		}
	       		let timezone  = req.headers.timezone;
				let locale    = req.headers.locale;
				req.sanitize("userLoginSessionKey").trim();
		    	req.sanitize("videoLength").trim();
			    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
			    req.check('videoLength', custom.lang(locale,'The video length field is required')).notEmpty();
			    req.check('videoLength', custom.lang(locale,'Video length maximum can be 60 seconds')).maxValue(60); // MAX 60 SECONDS
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
			    	let userLoginSessionKey  = req.sanitize('userLoginSessionKey').escape().trim();
			    	let videoLength          = parseInt(req.sanitize('videoLength').escape().trim());

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

					    	model.getCount(function(err,totalVideos){
				    			if(err){
				    				/* To delete uploaded file */
					                custom.unlinkFile(uploadedFilePath);
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(parseInt(totalVideos) >= constant.video_upload_limit){
				                		/* To delete uploaded file */
						                custom.unlinkFile(uploadedFilePath);
						                return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":'You can upload maximum ' + constant.video_upload_limit + ' videos.' 
											        });
				                	}else{
				                		/* Generate uploaded video thumbnail */
										custom.getVideoThumbnail(function(err,thumbnailResp){
											if(parseInt(err) === 0){
												/* To delete uploaded file */
								                custom.unlinkFile(uploadedFilePath);
								                return  res.send({
													            "code": 200,
													            "response": {},
													            "status": 0,
													            "message":custom.lang(locale,'Error while generating video thumbnail.') 
													        });
											}else{
												let videoThumbnailPath = thumbnailResp.outputThumbFilePath;
												callback(null, userDetailsObj,videoThumbnailPath);
											}
										},uploadedFilePath,'uploads/videos/');
				                	}
				               }
				            },constant.videos,{videoUserID:userDetailsObj[0].userId});
					    }
					], function (err, userDetailsObj,videoThumbnailPath) {
					    
					    var insertDataObj = {};
						insertDataObj.videoUserID   = userDetailsObj[0].userId;
						insertDataObj.videoLength   = videoLength;
						insertDataObj.videoSize     = uploadedFileSize;
						insertDataObj.videoPath     = uploadedFilePath;
						insertDataObj.videoThumbnailPath = videoThumbnailPath;
						insertDataObj.videoAddedDate     = custom.getCurrentTime();
						model.insertData(function(err,resp){
		                    if(err){
		                    	/* To delete uploaded files */
					            custom.unlinkFile(uploadedFilePath);
					            custom.unlinkFile(videoThumbnailPath);
		                        return res.send(custom.dbErrorResponse());
		                    }else{
		                    	var lid = parseInt(resp.insertId);
		                    	if(lid > 0){
		                    		return  res.send({
								            "code": 200,
								            "response": {videoID:lid},
								            "status": 1,
								            "message":custom.lang(locale,'Video uploaded successfully.') 
								        });
		                    	}else{
		                    		/* To delete uploaded files */
						            custom.unlinkFile(uploadedFilePath);
						            custom.unlinkFile(videoThumbnailPath);
			                        return  res.send({
										            "code": 200,
										            "response": {},
										            "status": 0,
										            "message":custom.lang(locale,'Failed to add video.') 
										        });
		                    	}
		                    }
		                },constant.videos,insertDataObj);
					});
			    }
	       }
		});
	});

	/* To get videos listing 
	 * @param {integer} userID
	   @param {integer} pageNo
	*/
	app.post('/videos/listing', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
		req.sanitize("userID").trim();
		req.sanitize("pageNo").trim();
	    req.check('userID', custom.lang(locale,'The User ID field is required')).notEmpty();
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
			let userID    = parseInt(req.sanitize('userID').escape().trim());
			let pageNo    = parseInt(req.sanitize('pageNo').escape().trim());

			async.waterfall([
			    function(callback) {
			    	
			    	/* Get videos data */
			    	model.getCount(function(err,totalVideos){
		    			if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(parseInt(totalVideos) > 0){

		                		/* To get offset */
						    	let offset = custom.getOffset(pageNo);

						    	/* To get user videos */
						        model.getAllWhere(function(err,videosObj){
						        	if(err){
					                    return res.send(custom.dbErrorResponse());
					                }else{
					                	if(videosObj != ""){
					                		callback(null, videosObj,totalVideos);
					                	}else{
					                		return res.send({
											            "code": 200,
											            "response": [],
											            "status": 0,
											            "videoUploadLimit": constant.video_upload_limit,
											            "message": custom.lang(locale,"Videos not found.")
											        });
					                	}
					                }
						        },constant.videos,{videoUserID:userID},'videoID','DESC','*',constant.results_limit,offset);
		                	}else{
		                		return res.send({
								            "code": 200,
								            "response": [],
								            "status": 0,
								            "videoUploadLimit": constant.video_upload_limit,
								            "message": custom.lang(locale,"Videos not found.")
								        });
		                	}
		                }
		    		},constant.videos,{videoUserID:userID});
			    },
			    function(videosObj,totalVideos, callback) {
			    	let responseObj = [];
				    for (var i = 0; i < parseInt(videosObj.length); i++) 
				    {
				    	let row = {};
				    	row.videoID            = parseInt(videosObj[i].videoID);
				    	row.videoUserID        = parseInt(videosObj[i].videoUserID);
				    	row.videoLength        = parseInt(videosObj[i].videoLength);
				    	row.videoSize          = custom.nullChecker(videosObj[i].videoSize); // IN BYTES
				    	row.videoPath          = (!videosObj[i].videoPath) ? '' : constant.base_url + videosObj[i].videoPath;
				    	row.videoThumbnailPath = (!videosObj[i].videoThumbnailPath) ? '' : constant.base_url + videosObj[i].videoThumbnailPath;
				    	row.videoAddedDate     = custom.changeDateFormat(videosObj[i].videoAddedDate);
				    	responseObj.push(row);
				    }
				    callback(null,videosObj,totalVideos,responseObj);
			    }
			], function (err,videosObj,totalVideos,responseObj) {
			    return res.send({
					            "code": 200,
					            "response": responseObj,
					            "totalCount": totalVideos,
					            "videoUploadLimit": constant.video_upload_limit,
					            "status": 1,
					            "message": "success"
					        });
			});
		}
	});

	/* To delete videos 
	 * @param {string} userLoginSessionKey
	   @param {array}  videoIDs
	*/
	app.post('/videos/delete', function(req, res) {
		let timezone = req.headers.timezone;
		let locale   = req.headers.locale;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("videoIDs").trim();
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
			let userLoginSessionKey    = req.sanitize('userLoginSessionKey').escape().trim();
			let videoIDsPre            = req.body.videoIDs;
			let userVideoIDs           = videoIDsPre.split(",").map(Number);
			let totalVideos            = parseInt(userVideoIDs.length);
			let userVideoId            = [];
			let finalVideosId          = [];

			if(totalVideos <= 0)
			{
				return res.send({
				            "code": 200,
				            "response": {},
				            "status": 0,
				            "message": "Please select at-least a video."
				        });
			}

			async.waterfall([
			    function(callback) {
			    	/* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							model.getAllWhere(function(err,resp){
								if(err){
									return res.send(custom.dbErrorResponse());
								}else{
									if(resp != ''){ 
										for (var i = 0; i < parseInt(resp.length); i++) 
										{
									    	userVideoId.push(parseInt(resp[i].videoID));
										}
										for (var j = 0; j < totalVideos; j++) 
										{
											if (userVideoId.indexOf(userVideoIDs[j]) >= 0) 
											{
												finalVideosId.push(parseInt(userVideoIDs[j]));
											}
										}
										if(parseInt(finalVideosId.length) > 0){
											callback(null, respObj,finalVideosId);
										}else{
											return res.send({
										            "code": 200,
										            "response": {},
										            "status": 0,
										            "message": "User videos not found."
										        });	
										}
									}else{
										return res.send({
										            "code": 200,
										            "response": {},
										            "status": 0,
										            "message": "User videos not found."
										        });									
									}
								}
							},constant.videos,{videoUserID:respObj[0].userId});
						}
					},userLoginSessionKey,timezone);
			    },
			    function(userDetailsObj,finalVideosId, callback) {

			    	let allFinalVideosId = finalVideosId.join();
			    	let videoFilesPath   = new Array();

			    	/* To get user videos path */
				    let videoQuery = "SELECT * FROM " + constant.videos + " WHERE videoID IN ("+allFinalVideosId+")";
				    model.customQuery(function(err,videoResp){
			        	if(err){
			                return res.send(custom.dbErrorResponse());
			            }else{
			            	if(videoResp != ""){
			            		for (var i = 0; i < parseInt(videoResp.length); i++) 
			            		{
			            			videoFilesPath.push(videoResp[i].videoPath);
			            			videoFilesPath.push(videoResp[i].videoThumbnailPath);
			            			if(parseInt(videoResp.length)-1  === i)
			            			{
			            				callback(null, userDetailsObj,allFinalVideosId,videoFilesPath);
			            			}
			            		}
			            	}else{
			            		callback(null, userDetailsObj,allFinalVideosId,videoFilesPath);
			            	}
			            }
			        },videoQuery);
								    	
			    }
			], function (err,userDetailsObj,allFinalVideosId,videoFilesPath) {
				
			    /* To delete user gallery images */
			    let deleteQuery = "DELETE FROM " + constant.videos + " WHERE videoID IN ("+allFinalVideosId+")";
		        model.customQuery(function(err,resp){
		        	if(err){
		                return res.send(custom.dbErrorResponse());
		            }else{
		            	if(parseInt(resp.affectedRows) > 0){

		            		/* Delete video files from directory */
		            		if(parseInt(videoFilesPath.length) > 0)
		            		{
		            			for (var j = 0; j < parseInt(videoFilesPath.length); j++) 
		            			{
		            				custom.unlinkFile(videoFilesPath[j]);
		            			}
		            		}
		            		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 1,
							            "message": resp.affectedRows + " videos deleted successfully."
							        });
		            	}else{
		            		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": "Failed to delete videos."
							        });
		            	}
		            }
		        },deleteQuery);
			});
		}
	});



}