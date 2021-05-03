"use strict";

/*
 * Purpose : For Jobs Rest API
 * Package : Jobs
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


	/* To post a job (Hire a provider)
	 * @param {string}  userLoginSessionKey
	 * @param {integer} jobProviderUserID
	 * @param {string}  jobTitle
	 * @param {string}  jobDescprition
	 * @param {string}  jobMode [ONLINE,LOCAL]
	 * @param {string}  jobAddress (Optional)
	 * @param {string}  jobLatitude (Optional)
	 * @param {string}  jobLongitude (Optional)
	 * @param {string}  jobStartDate
	 * @param {string}  jobEndDate
	 * @param {string}  jobPaymentMethod [ADVANCE,FROZEN,ADVANCE_AND_FROZEN]
	 * @param {integer} jobAgreedAmount
	 * @param {integer} jobAdvanceAmount (Optional)
	 * @param {array}   jobMilestones (Optional)
	*/
	app.post('/job/post', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
    	req.sanitize("userLoginSessionKey").trim();
    	req.sanitize("jobProviderUserID").trim();
    	req.sanitize("jobTitle").trim();
    	req.sanitize("jobDescprition").trim();
    	req.sanitize("jobMode").trim();
    	req.sanitize("jobStartDate").trim();
    	req.sanitize("jobEndDate").trim();
    	req.sanitize("jobPaymentMethod").trim();
    	req.sanitize("jobAgreedAmount").trim();
    	if(req.body.jobMode === 'LOCAL'){
    		req.sanitize("jobAddress").trim();
    		req.sanitize("jobLatitude").trim();
    		req.sanitize("jobLongitude").trim();
    	}
    	if(req.body.jobPaymentMethod === 'ADVANCE' || req.body.jobPaymentMethod === 'ADVANCE_AND_FROZEN'){
    		req.sanitize("jobAdvanceAmount").trim();
    	}
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('jobProviderUserID', custom.lang(locale,'The Job provider user id field is required')).notEmpty();
	    req.check('jobTitle', custom.lang(locale,'The Job title field is required')).notEmpty();
	    req.check('jobDescprition', custom.lang(locale,'The Job descprition field is required')).notEmpty();
	    req.check('jobMode', custom.lang(locale,'The Job mode field is required')).notEmpty();
	    req.check('jobMode', custom.lang(locale,'Job mode should be ONLINE Or LOCAL')).inList(["ONLINE","LOCAL"]);
	    req.check('jobStartDate', custom.lang(locale,'The Job start date field is required')).notEmpty();
	    req.check('jobEndDate', custom.lang(locale,'The Job end date field is required')).notEmpty();
	    req.check('jobPaymentMethod', custom.lang(locale,'The Job payment method field is required')).notEmpty();
	    req.check('jobPaymentMethod', custom.lang(locale,'Job payment method should be in ADVANCE, FROZEN, ADVANCE_AND_FROZEN')).inList(["ADVANCE","FROZEN","ADVANCE_AND_FROZEN"]);
	    req.check('jobAgreedAmount', custom.lang(locale,'The Job agreed amount field is required')).notEmpty();
	    if(req.body.jobMode === 'LOCAL'){
	    	req.check('jobAddress', custom.lang(locale,'The Job address field is required')).notEmpty();
	    	req.check('jobLatitude', custom.lang(locale,'The Job latitude field is required')).notEmpty();
	    	req.check('jobLongitude', custom.lang(locale,'The Job longitude field is required')).notEmpty();
	    }
	    if(req.body.jobPaymentMethod === 'ADVANCE' || req.body.jobPaymentMethod === 'ADVANCE_AND_FROZEN'){
    		req.check('jobAdvanceAmount', custom.lang(locale,'The Job advnace amount field is required')).notEmpty();
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
	    	let userLoginSessionKey  = req.sanitize('userLoginSessionKey').escape().trim();
	    	let jobProviderUserID    = parseInt(req.sanitize('jobProviderUserID').escape().trim());
	    	let jobTitle             = req.sanitize('jobTitle').escape().trim();
	    	let jobDescprition       = req.sanitize('jobDescprition').escape().trim();
	    	let jobMode              = req.sanitize('jobMode').escape().trim();
	    	let jobStartDate         = req.sanitize('jobStartDate').escape().trim();
	    	let jobEndDate           = req.sanitize('jobEndDate').escape().trim();
	    	let jobPaymentMethod     = req.sanitize('jobPaymentMethod').escape().trim();
	    	let jobAgreedAmount      = parseInt(req.sanitize('jobAgreedAmount').escape().trim());
	    	let jobType              = 'FIXED';
	    	let jobAddress           = '';
	    	let jobLatitude          = '';
	    	let jobLongitude         = '';
	    	let jobAdvanceAmount     = 0;
	    	let jobAmountQlFees      = 0; // (10%)
	    	let jobTotalAmount       = 0; // (Agreed Amount + Quick Love Fees (10%))
	    	let milestoneAmount      = 0;
	    	let jobMilestones        = new Array();
	    	if(jobMode === 'LOCAL'){
	    		jobAddress   = (!req.body.jobAddress) ? '' : req.body.jobAddress;
	    		jobLatitude  = req.sanitize('jobLatitude').escape().trim();
	    		jobLongitude = req.sanitize('jobLongitude').escape().trim();
	    	}
	    	if(jobPaymentMethod === 'FROZEN' || jobPaymentMethod === 'ADVANCE_AND_FROZEN'){
	    		jobType = 'MILESTONES';
	    		jobMilestones = (!req.body.jobMilestones) ? new Array() : req.body.jobMilestones;
	    		if(jobMilestones)
	    		{
	    			jobMilestones = (typeof jobMilestones === 'string') ? JSON.parse(jobMilestones) : jobMilestones;
	    		}
	    	}
	    	if(jobPaymentMethod === 'ADVANCE' || jobPaymentMethod === 'ADVANCE_AND_FROZEN'){
    			jobAdvanceAmount = parseInt(req.sanitize('jobAdvanceAmount').escape().trim());
    		}
	    	/* Validate Start Date */
	    	let isValidStartDate = custom.validateDateTime(jobStartDate,'YYYY-MM-DD');
	    	let isValidEndDate   = custom.validateDateTime(jobEndDate,'YYYY-MM-DD');
	    	if(!isValidStartDate){
	            return res.send({
	                        "code": 200,
	                        "response": {},
	                        "status": 0,
	                        "message": custom.lang(locale,'Invalid start date format, should be (YYYY-MM-DD)')
	                    });
	        }

	        /* Validate End Date */
	        if(!isValidEndDate){
	            return res.send({
	                        "code": 200,
	                        "response": {},
	                        "status": 0,
	                        "message": custom.lang(locale,'Invalid end date format, should be (YYYY-MM-DD)')
	            
	        			});
	        }

	        /* Validate future start date */
	        let currentDate = custom.changeDateFormat(custom.getCurrentTime(),'yyyy-mm-dd');
	        if(currentDate > jobStartDate)
	        {
	        	return res.send({
	                        "code": 200,
	                        "response": {},
	                        "status": 0,
	                        "message": custom.lang(locale,'Job start date should be greater than to current date')
	                    });
	        }

	        /* Validate future end date */
	        if(jobStartDate > jobEndDate)
	        {
	        	return res.send({
	                        "code": 200,
	                        "response": {},
	                        "status": 0,
	                        "message": custom.lang(locale,'Job end date should be greater than Or equals to start date')
	                    });
	        }

	        /* To validate advance amount */
	        if(jobPaymentMethod === 'ADVANCE'){
		    	if(jobAdvanceAmount != jobAgreedAmount){
		    		return res.send({
		                        "code": 200,
		                        "response": {},
		                        "status": 0,
		                        "message": custom.lang(locale,'Advance amount should be equals to agreed amount')
		                    });
		    	}	
		    }else if(jobPaymentMethod === 'ADVANCE_AND_FROZEN'){
		    	if(jobAdvanceAmount <= 0){
		    		return res.send({
		                        "code": 200,
		                        "response": {},
		                        "status": 0,
		                        "message": custom.lang(locale,'Advance amount should be greater than to 0')
		                    });
		    	}else if(jobAdvanceAmount >= jobAgreedAmount){
		    		return res.send({
		                        "code": 200,
		                        "response": {},
		                        "status": 0,
		                        "message": custom.lang(locale,'Advance amount should be less than to agreed amount')
		                    });
		    	}	
		    }

		    /* To validate frozen milestone total amount */
		    if(jobPaymentMethod === 'FROZEN'){
	    		if(parseInt(jobMilestones.length) > 0)
	    		{
	    			for (var i = 0; i < parseInt(jobMilestones.length); i++)
	    			{
	    				milestoneAmount += (!jobMilestones[i].milestoneAmount) ? 0 : parseInt(jobMilestones[i].milestoneAmount);
	    			}
	    			milestoneAmount = custom.parseNumber(milestoneAmount);
	    			if(milestoneAmount != jobAgreedAmount){
	    				return  res.send({
						            "code": 200,
						            "response": {},
						            "status": 0,
						            "message":custom.lang(locale,'Milestones amount should be equals to job agreed amount.') 
						        });
	    			}
	    		}else{
	    			return  res.send({
						            "code": 200,
						            "response": {},
						            "status": 0,
						            "message":custom.lang(locale,'Please add milestones.') 
						        });
	    		}	
	    	}

	    	/* To validate advance & frozen milestone total amount */
		    if(jobPaymentMethod === 'ADVANCE_AND_FROZEN'){
	    		if(parseInt(jobMilestones.length) > 0)
	    		{
	    			milestoneAmount += jobAdvanceAmount;
	    			for (var i = 0; i < parseInt(jobMilestones.length); i++)
	    			{
	    				milestoneAmount += (!jobMilestones[i].milestoneAmount) ? 0 : parseInt(jobMilestones[i].milestoneAmount);
	    			}
	    			milestoneAmount = custom.parseNumber(milestoneAmount);
	    			if(milestoneAmount != jobAgreedAmount){
	    				return  res.send({
						            "code": 200,
						            "response": {},
						            "status": 0,
						            "message":custom.lang(locale,'Milestones amount & advance amount should be equals to job agreed amount.') 
						        });
	    			}
	    		}else{
	    			return  res.send({
						            "code": 200,
						            "response": {},
						            "status": 0,
						            "message":custom.lang(locale,'Please add milestones.') 
						        });
	    		}	
	    	}

	        /* Calculate Job amount Quick Love fees (10%) */
	        jobAmountQlFees = parseFloat((jobAgreedAmount * constant.ql_fees) / 100);
	        console.log('jobAmountQlFees',jobAmountQlFees);

	        /* Calculate Job total fees */
	        jobTotalAmount = custom.parseNumber(parseInt(jobAgreedAmount) + parseFloat(jobAmountQlFees));
	        console.log('jobTotalAmount',jobTotalAmount);
			
			async.waterfall([
			    function(callback) {
			        /* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							let masterUserId = parseInt(respObj[0].masterUserId);

							if(masterUserId === jobProviderUserID)
							{
								return res.send({
							                        "code": 200,
							                        "response": {},
							                        "status": 0,
							                        "message": custom.lang(locale,'You can not hire your self.')
							                    });
							}

							/* Check user is already blocked */
							custom.isUserBlocked(function(respType,blockResp){
								if(respType === 0){
									return res.send(blockResp);
								}else if(respType === 1){
									return res.send({
								                        "code": 200,
								                        "response": {},
								                        "status": 0,
								                        "message": custom.lang(locale,'You can not hire this provider.')
								                    });
								}else{
									let userWalletAmount = custom.parseNumber(respObj[0].userWalletAmount);
									if(userWalletAmount >= jobTotalAmount){
										callback(null, respObj,userWalletAmount);
									}else{
										return res.send({
								                        "code": 200,
								                        "response": {userWalletAmount:userWalletAmount},
								                        "status": 7,
								                        "message": custom.lang(locale,'Insufficient amount in your wallet.')
								                    });
									}
								}
							},masterUserId,jobProviderUserID);
						}
					},userLoginSessionKey,timezone);
			    }
			], function (err, userDetailsObj,userWalletAmount) {
				let masterUserId = parseInt(userDetailsObj[0].userId);
			    
			    database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Insert jobs data */	   
						let jobsObj = {};
						jobsObj.jobCustomID       = custom.generateCustomID('JID');
						jobsObj.jobHirerUserID    = masterUserId;
						jobsObj.jobProviderUserID = jobProviderUserID;
						jobsObj.jobTitle          = jobTitle;
						jobsObj.jobDescprition    = jobDescprition;
						jobsObj.jobMode           = jobMode;
						if(jobMode === 'LOCAL'){
							jobsObj.jobAddress    = jobAddress;
							jobsObj.jobLatitude   = jobLatitude;
							jobsObj.jobLongitude  = jobLongitude;
						}
						jobsObj.jobStartDate      = jobStartDate;
						jobsObj.jobEndDate        = jobEndDate;
						jobsObj.jobPaymentMethod  = jobPaymentMethod;
						jobsObj.jobAgreedAmount   = jobAgreedAmount;
						jobsObj.jobAdvanceAmount  = jobAdvanceAmount;
						if(jobPaymentMethod === 'FROZEN'){
							jobsObj.jobMilestoneAmountTotal = milestoneAmount;
							jobsObj.jobNoOfMilestones = parseInt(jobMilestones.length);
						}else if(jobPaymentMethod === 'ADVANCE_AND_FROZEN'){
							jobsObj.jobMilestoneAmountTotal = milestoneAmount - jobAdvanceAmount;
							jobsObj.jobNoOfMilestones = parseInt(jobMilestones.length);
						}
						jobsObj.jobType           = jobType;
						jobsObj.jobHireDateTime   = custom.getCurrentTime();
                        let i1 = queryBuilder.insert(constant.jobs,jobsObj);
                        queryBuilder.reset_query(i1);
                        connection.query(i1, function(err, jobResp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }
	                        if(!jobResp){
	                        	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Failed to hire a provider.')
									        });
	                        }
	                        var jobID = parseInt(jobResp.insertId);

	                    /* Insert job payment distribution */
					   	let jobPaymentDistribution = {};
                		jobPaymentDistribution.jobParentID   = jobID;
                		jobPaymentDistribution.jobHirerQlFeesPercent    = constant.ql_fees;
                		jobPaymentDistribution.jobProviderQlFeesPercent = constant.ql_fees;
                		jobPaymentDistribution.jobHirerQlFeesAmount     = jobAmountQlFees;
                		jobPaymentDistribution.jobProviderQlFeesAmount  = jobAmountQlFees;
                		jobPaymentDistribution.jobHirerAdvanceAmount    = jobAdvanceAmount;
                		jobPaymentDistribution.jobProviderAdvanceAmount = jobAdvanceAmount;
                		if(jobPaymentMethod === 'FROZEN' || jobPaymentMethod === 'ADVANCE_AND_FROZEN'){
                			jobPaymentDistribution.jobHirerMilestoneAmount  = jobsObj.jobMilestoneAmountTotal;
                		}
                		jobPaymentDistribution.jobTotalAgreedAmount = jobAgreedAmount; // Only agreed amount without QL fees
                        let i2 = queryBuilder.insert(constant.jobs_payment_distribution,jobPaymentDistribution);
                        queryBuilder.reset_query(i2);
                        connection.query(i2, function(err, resp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }

	                    /* Manage milestones */
	                    if(jobPaymentMethod === 'FROZEN' || jobPaymentMethod === 'ADVANCE_AND_FROZEN')
	                    {
	                    	let milestoneObj = [];
	                    	for (var i = 0; i < parseInt(jobMilestones.length); i++)
			    			{
			    				let row = {};
			    				row.milestoneJobID    = jobID;
			    				row.milestoneTitle    = jobMilestones[i].milestoneTitle;
			    				row.milestoneAmount   = jobMilestones[i].milestoneAmount;
			    				row.milestoneDateTime = custom.getCurrentTime();
			    				milestoneObj.push(row);
			    			}
			    			if(parseInt(milestoneObj.length) > 0)
			    			{
			    				let i3 = queryBuilder.insert_batch(constant.milestones,milestoneObj);
		                        queryBuilder.reset_query(i3);
		                        connection.query(i3, function(err, resp) {
			                        if (err) {
			                            connection.rollback(function() {
			                                return res.send(custom.dbErrorResponse(err.sqlMessage));
			                            });
			                        }
			                    });
			    			}
	                    }

	                    /* Update hirer hold amount */
                        let u1 = "UPDATE (`"+constant.user_details+"`) SET `userWalletHoldAmount` = userWalletHoldAmount + " + jobAgreedAmount + " WHERE `userId` = " + masterUserId;
                        queryBuilder.reset_query(u1);
                        connection.query(u1, function(err, resp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }

	                    /* Update hirer main amount */
                        let u2 = "UPDATE (`"+constant.user_details+"`) SET `userWalletAmount` = userWalletAmount - " + jobAgreedAmount + " WHERE `userId` = " + masterUserId;
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

	                            /* Manage Hold amount history */
	                            let holdAmountObj = {};
	                            holdAmountObj.holdAmountUserID = masterUserId;
	                            holdAmountObj.holdAmountJobID  = jobID;
	                            holdAmountObj.holdAmount       = jobAgreedAmount;
	                            holdAmountObj.holdAmountDateTime  = custom.getCurrentTime();
	                            model.insertData(function(err,holdAmountResp){
	                            	if(err){
	                            		console.log('Hold amount error',err);
	                            	}else{
	                            		console.log('Hold amount success');
	                            	}
	                            },constant.hold_amounts,holdAmountObj);

	                            /* Insert wallet data (Hold Amount + Main Amount) */       
                    			let currentBalance = parseFloat(parseFloat(userDetailsObj[0].userWalletAmount) - jobAgreedAmount).toFixed(2);
                                let walletObj = [];
                                let walletHoldObj = {};
                                let walletMainObj = {};

                                walletMainObj.walletUserID          = masterUserId;
                                walletMainObj.walletAmount          = jobAgreedAmount;
                                walletMainObj.walletRemainingAmount = currentBalance;
                                walletMainObj.walletTxnType         = 'DEDUCT'; // Main account
                                walletMainObj.walletTxnReason       = 'JOB_POST_ADVCANCE_AMOUNT';
                                walletMainObj.walletTxnID           = custom.generateCustomID('QL');
                                walletMainObj.walletTxnStatus       = 'COMPLETED';
                                walletMainObj.walletTxnDateTime     = custom.getCurrentTime();
                                walletMainObj.walletExtraParams     = JSON.stringify({jobID:jobID,walletTypeAccount:'MAIN_AC',walletAccountTxnType:'DEDUCT'});
                                walletObj.push(walletMainObj);

                                walletHoldObj.walletUserID          = masterUserId;
                                walletHoldObj.walletAmount          = jobAgreedAmount;
                                walletHoldObj.walletRemainingAmount = currentBalance;
                                walletHoldObj.walletTxnType         = 'NONE';
                                walletHoldObj.walletTxnReason       = 'JOB_POST_ADVCANCE_AMOUNT';
                                walletHoldObj.walletTxnID           = custom.generateCustomID('QL');
                                walletHoldObj.walletTxnStatus       = 'COMPLETED';
                                walletHoldObj.walletTxnDateTime     = custom.getCurrentTime();
                                walletHoldObj.walletExtraParams     = JSON.stringify({jobID:jobID,walletTypeAccount:'HOLD_AC',walletAccountTxnType:'ADDED'});
                                walletObj.push(walletHoldObj);

                                model.insertBulkData(function(err,resp){
                                    if(err){
                                        console.log('Failed to add wallet transactions');
                                    }
                                },constant.wallet,walletObj);

	                            /* Insert job request notification */
							   	let notificationDataObj = {};
		                		notificationDataObj.notificationUserId   = masterUserId;
		                		notificationDataObj.notificationFriendId = jobProviderUserID;
		                		notificationDataObj.jobModuleID          = jobID;
		                		notificationDataObj.notificationModule   = 'PROVIDER';
		                		notificationDataObj.notificationType     = 'HIRE_PROVIDER';
		                		notificationDataObj.notificationMessage  = 'would like to hire you for their job';
		                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
		                		model.insertData(function(err,notificationResp){
	                            	if(err){
	                            		console.log('Hire app notification error',err);
	                            	}else{
	                            		console.log('Hire app notification success');
	                            	}
	                            },constant.notifications,notificationDataObj);

	                            /* Update provider badges */
	                            let updateQuery = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + jobProviderUserID;
	                            model.customQuery(function(err,badgesResp){
	                            	if(err){
	                            		console.log('Hire app notification badges error',err);
	                            	}else{
	                            		console.log('Hire app notification badges success');
	                            	}
	                            },updateQuery);

	                            /* To send push notifications */
	                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " would like to hire you for their job "+ jobTitle;
	                            let extraParams = {};
	                            extraParams.jobModuleID       = jobID;
	                            extraParams.jobHirerUserID    = masterUserId;
	                            extraParams.jobProviderUserID = jobProviderUserID;
	                            extraParams.moduleName        = 'PROVIDER';
	                            extraParams.notificationType  = 'HIRE_PROVIDER';
	                            notification.sendPushNotifications(userMessage,jobProviderUserID,extraParams);

	                            /* Manage admin report */
                                let reportObj = {};
                                reportObj.reportUserID = masterUserId;
                                reportObj.reportAmount = jobAgreedAmount;
                                reportObj.reportAmountType  = 1;
                                reportObj.reportModuleName  = 'HIRE_PROVIDER';
                                reportObj.reportExtraParams = JSON.stringify({jobID:jobID});
                                reportObj.reportDateTime    = custom.getCurrentTime();
                                model.insertData(function(err,resp){
                                    if(err){
                                        console.log('Failed to add reports');
                                    }
                                },constant.reports,reportObj);

	                            /* Return user response */
			            		return res.send({"code" : 200, "response" : {jobModuleID:jobID},"status" : 1,"message" : custom.lang(locale,'Your request sent successfully to the provider.')});
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

	/* To get job details
	 * @param {string}  userLoginSessionKey
	 * @param {integer} jobID 
	*/
	app.post('/job/details', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
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
			},userLoginSessionKey,timezone);

			
		}
	});

	/* To modify a job (Before Accept)
	 * @param {string}  userLoginSessionKey
	 * @param {integer} jobID
	 * @param {string}  jobTitle
	 * @param {string}  jobDescprition
	 * @param {string}  jobMode [ONLINE,LOCAL]
	 * @param {string}  jobAddress (Optional)
	 * @param {string}  jobLatitude  (Optional)
	 * @param {string}  jobLongitude (Optional)
	 * @param {string}  jobStartDate
	 * @param {string}  jobEndDate
	 * @param {string}  jobPaymentMethod [ADVANCE,FROZEN,ADVANCE_AND_FROZEN]
	 * @param {integer} jobAgreedAmount
	 * @param {integer} jobAdvanceAmount (Optional)
	 * @param {array}   jobMilestones (Optional)
	*/
	app.post('/job/modify', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
    	req.sanitize("userLoginSessionKey").trim();
    	req.sanitize("jobID").trim();
    	req.sanitize("jobTitle").trim();
    	req.sanitize("jobDescprition").trim();
    	req.sanitize("jobMode").trim();
    	req.sanitize("jobStartDate").trim();
    	req.sanitize("jobEndDate").trim();
    	req.sanitize("jobPaymentMethod").trim();
    	req.sanitize("jobAgreedAmount").trim();
    	if(req.body.jobMode === 'LOCAL'){
    		req.sanitize("jobAddress").trim();
    		req.sanitize("jobLatitude").trim();
    		req.sanitize("jobLongitude").trim();
    	}
    	if(req.body.jobPaymentMethod === 'ADVANCE' || req.body.jobPaymentMethod === 'ADVANCE_AND_FROZEN'){
    		req.sanitize("jobAdvanceAmount").trim();
    	}
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('jobID', custom.lang(locale,'The Job id field is required')).notEmpty();
	    req.check('jobTitle', custom.lang(locale,'The Job title field is required')).notEmpty();
	    req.check('jobDescprition', custom.lang(locale,'The Job descprition field is required')).notEmpty();
	    req.check('jobMode', custom.lang(locale,'The Job mode field is required')).notEmpty();
	    req.check('jobMode', custom.lang(locale,'Job mode should be ONLINE Or LOCAL')).inList(["ONLINE","LOCAL"]);
	    req.check('jobStartDate', custom.lang(locale,'The Job start date field is required')).notEmpty();
	    req.check('jobEndDate', custom.lang(locale,'The Job end date field is required')).notEmpty();
	    req.check('jobPaymentMethod', custom.lang(locale,'The Job payment method field is required')).notEmpty();
	    req.check('jobPaymentMethod', custom.lang(locale,'Job payment method should be in ADVANCE, FROZEN, ADVANCE_AND_FROZEN')).inList(["ADVANCE","FROZEN","ADVANCE_AND_FROZEN"]);
	    req.check('jobAgreedAmount', custom.lang(locale,'The Job agreed amount field is required')).notEmpty();
	    if(req.body.jobMode === 'LOCAL'){
	    	req.check('jobAddress', custom.lang(locale,'The Job address field is required')).notEmpty();
	    	req.check('jobLatitude', custom.lang(locale,'The Job latitude field is required')).notEmpty();
	    	req.check('jobLongitude', custom.lang(locale,'The Job longitude field is required')).notEmpty();
	    }
	    if(req.body.jobPaymentMethod === 'ADVANCE' || req.body.jobPaymentMethod === 'ADVANCE_AND_FROZEN'){
    		req.check('jobAdvanceAmount', custom.lang(locale,'The Job advnace amount field is required')).notEmpty();
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
	    	let userLoginSessionKey  = req.sanitize('userLoginSessionKey').escape().trim();
	    	let jobID                = parseInt(req.sanitize('jobID').escape().trim());
	    	let jobTitle             = req.sanitize('jobTitle').escape().trim();
	    	let jobDescprition       = req.sanitize('jobDescprition').escape().trim();
	    	let jobMode              = req.sanitize('jobMode').escape().trim();
	    	let jobStartDate         = req.sanitize('jobStartDate').escape().trim();
	    	let jobEndDate           = req.sanitize('jobEndDate').escape().trim();
	    	let jobPaymentMethod     = req.sanitize('jobPaymentMethod').escape().trim();
	    	let jobAgreedAmount      = parseInt(req.sanitize('jobAgreedAmount').escape().trim());
	    	let jobType              = 'FIXED';
	    	let jobAddress           = '';
	    	let jobLatitude          = '';
	    	let jobLongitude         = '';
	    	let jobAdvanceAmount     = 0;
	    	let jobAmountQlFees      = 0; // (10%)
	    	let jobTotalAmount       = 0; // (Agreed Amount + Quick Love Fees (10%))
	    	let milestoneAmount      = 0;
	    	let jobMilestones        = new Array();
	    	if(jobMode === 'LOCAL'){
	    		jobAddress   = (!req.body.jobAddress) ? '' : req.body.jobAddress;
	    		jobLatitude  = req.sanitize('jobLatitude').escape().trim();
	    		jobLongitude = req.sanitize('jobLongitude').escape().trim();
	    	}
	    	if(jobPaymentMethod === 'FROZEN' || jobPaymentMethod === 'ADVANCE_AND_FROZEN'){
	    		jobType = 'MILESTONES';
	    		jobMilestones = (!req.body.jobMilestones) ? new Array() : req.body.jobMilestones;
	    		jobMilestones = (typeof jobMilestones === 'string') ? JSON.parse(jobMilestones) : jobMilestones;
	    	}
	    	if(jobPaymentMethod === 'ADVANCE' || jobPaymentMethod === 'ADVANCE_AND_FROZEN'){
    			jobAdvanceAmount = parseInt(req.sanitize('jobAdvanceAmount').escape().trim());
    		}

	    	/* Validate Start Date */
	    	let isValidStartDate = custom.validateDateTime(jobStartDate,'YYYY-MM-DD');
	    	let isValidEndDate   = custom.validateDateTime(jobEndDate,'YYYY-MM-DD');
	    	if(!isValidStartDate){
	            return res.send({
	                        "code": 200,
	                        "response": {},
	                        "status": 0,
	                        "message": custom.lang(locale,'Invalid start date format, should be (YYYY-MM-DD)')
	                    });
	        }

	        /* Validate End Date */
	        if(!isValidEndDate){
	            return res.send({
	                        "code": 200,
	                        "response": {},
	                        "status": 0,
	                        "message": custom.lang(locale,'Invalid end date format, should be (YYYY-MM-DD)')
	            
	        			});
	        }

	        /* Validate future start date */
	        let currentDate = custom.changeDateFormat(custom.getCurrentTime(),'yyyy-mm-dd');
	        if(currentDate > jobStartDate)
	        {
	        	return res.send({
	                        "code": 200,
	                        "response": {},
	                        "status": 0,
	                        "message": custom.lang(locale,'Job start date should be greater than to current date')
	                    });
	        }

	        /* Validate future end date */
	        if(jobStartDate > jobEndDate)
	        {
	        	return res.send({
	                        "code": 200,
	                        "response": {},
	                        "status": 0,
	                        "message": custom.lang(locale,'Job end date should be greater than Or equals to start date')
	                    });
	        }

	        /* To validate advance amount */
	        if(jobPaymentMethod === 'ADVANCE'){
		    	if(jobAdvanceAmount != jobAgreedAmount){
		    		return res.send({
		                        "code": 200,
		                        "response": {},
		                        "status": 0,
		                        "message": custom.lang(locale,'Advance amount should be equals to agreed amount')
		                    });
		    	}	
		    }else if(jobPaymentMethod === 'ADVANCE_AND_FROZEN'){
		    	if(jobAdvanceAmount <= 0){
		    		return res.send({
		                        "code": 200,
		                        "response": {},
		                        "status": 0,
		                        "message": custom.lang(locale,'Advance amount should be greater than to 0')
		                    });
		    	}else if(jobAdvanceAmount >= jobAgreedAmount){
		    		return res.send({
		                        "code": 200,
		                        "response": {},
		                        "status": 0,
		                        "message": custom.lang(locale,'Advance amount should be less than to agreed amount')
		                    });
		    	}	
		    }

		    /* To validate frozen milestone total amount */
		    if(jobPaymentMethod === 'FROZEN'){
	    		if(parseInt(jobMilestones.length) > 0)
	    		{
	    			for (var i = 0; i < parseInt(jobMilestones.length); i++)
	    			{
	    				milestoneAmount += (!jobMilestones[i].milestoneAmount) ? 0 : parseInt(jobMilestones[i].milestoneAmount);
	    			}
	    			milestoneAmount = custom.parseNumber(milestoneAmount);
	    			if(milestoneAmount != jobAgreedAmount){
	    				return  res.send({
						            "code": 200,
						            "response": {},
						            "status": 0,
						            "message":custom.lang(locale,'Milestones amount should be equals to job agreed amount.') 
						        });
	    			}
	    		}else{
	    			return  res.send({
						            "code": 200,
						            "response": {},
						            "status": 0,
						            "message":custom.lang(locale,'Please add milestones.') 
						        });
	    		}	
	    	}

	    	/* To validate advance & frozen milestone total amount */
		    if(jobPaymentMethod === 'ADVANCE_AND_FROZEN'){
	    		if(parseInt(jobMilestones.length) > 0)
	    		{
	    			milestoneAmount += jobAdvanceAmount;
	    			for (var i = 0; i < parseInt(jobMilestones.length); i++)
	    			{
	    				milestoneAmount += (!jobMilestones[i].milestoneAmount) ? 0 : parseInt(jobMilestones[i].milestoneAmount);
	    			}
	    			milestoneAmount = custom.parseNumber(milestoneAmount);
	    			if(milestoneAmount != jobAgreedAmount){
	    				return  res.send({
						            "code": 200,
						            "response": {},
						            "status": 0,
						            "message":custom.lang(locale,'Milestones amount & advance amount should be equals to job agreed amount.') 
						        });
	    			}
	    		}else{
	    			return  res.send({
						            "code": 200,
						            "response": {},
						            "status": 0,
						            "message":custom.lang(locale,'Please add milestones.') 
						        });
	    		}	
	    	}

	        /* Calculate Job amount Quick Love fees (10%) */
	        jobAmountQlFees = custom.parseNumber((jobAgreedAmount * constant.ql_fees) / 100);
	        console.log('jobAmountQlFees',jobAmountQlFees);

	        /* Calculate Job total fees */
	        jobTotalAmount = custom.parseNumber(parseInt(jobAgreedAmount) + custom.parseNumber(jobAmountQlFees));
	        console.log('jobTotalAmount',jobTotalAmount);
			
			async.waterfall([
			    function(callback) {
			        /* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							let masterUserId = parseInt(respObj[0].masterUserId);

							/* Validate Job ID */
							model.getAllWhere(function(err,jobResp){
								if (err) {
		                            return res.send(custom.dbErrorResponse());
		                        }else{
		                        	if(jobResp != ""){
		                        		if(jobResp[0].jobAcceptStatus != 'PENDING' || jobResp[0].jobGlobalStatus != 'PENDING'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'You can not modify this job.') 
											        });
		                        		}else if(jobResp[0].jobHirerUserID != masterUserId){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'You can not modify this job.') 
											        });
		                        		}else{
		                        			/* Check user is already blocked */
											custom.isUserBlocked(function(respType,blockResp){
												if(respType === 0){
													return res.send(blockResp);
												}else if(respType === 1){
													return res.send({
												                        "code": 200,
												                        "response": {},
												                        "status": 0,
												                        "message": custom.lang(locale,'You can not modify this job.')
												                    });
												}else{
													let userWalletAmount = custom.parseNumber(respObj[0].userWalletAmount);
													let userWalletAmountWithCurrentHoldAmount = userWalletAmount + parseInt(jobResp[0].jobAgreedAmount);
													if(userWalletAmountWithCurrentHoldAmount >= jobTotalAmount){
														callback(null, respObj,userWalletAmount,userWalletAmountWithCurrentHoldAmount,jobResp);
													}else{
														return res.send({
												                        "code": 200,
												                        "response": {userWalletAmount:userWalletAmount,userWalletAmountWithCurrentHoldAmount:userWalletAmountWithCurrentHoldAmount},
												                        "status": 7,
												                        "message": custom.lang(locale,'Insufficient amount in your wallet.')
												                    });
													}
												}
											},masterUserId,parseInt(jobResp[0].jobProviderUserID));
		                        		}
		                        	}else{
		                        		return  res.send({
										            "code": 200,
										            "response": {},
										            "status": 0,
										            "message":custom.lang(locale,'Invalid Job ID.') 
										        });
		                        	}
		                        }
							},constant.jobs,{jobID:jobID});
						}
					},userLoginSessionKey,timezone);
			    }
			], function (err, userDetailsObj,userWalletAmount,userWalletAmountWithCurrentHoldAmount,jobResp) {
				let masterUserId = parseInt(userDetailsObj[0].userId);
			    
			    database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Update jobs data */	   
						let jobsObj = {};
						jobsObj.jobTitle          = jobTitle;
						jobsObj.jobDescprition    = jobDescprition;
						jobsObj.jobMode           = jobMode;
						if(jobMode === 'LOCAL'){
							jobsObj.jobAddress    = jobAddress;
							jobsObj.jobLatitude   = jobLatitude;
							jobsObj.jobLongitude  = jobLongitude;
						}
						jobsObj.jobStartDate      = jobStartDate;
						jobsObj.jobEndDate        = jobEndDate;
						jobsObj.jobPaymentMethod  = jobPaymentMethod;
						jobsObj.jobAgreedAmount   = jobAgreedAmount;
						jobsObj.jobAdvanceAmount  = jobAdvanceAmount;
						if(jobPaymentMethod === 'FROZEN'){
							jobsObj.jobMilestoneAmountTotal = milestoneAmount;
							jobsObj.jobNoOfMilestones = parseInt(jobMilestones.length);
						}else if(jobPaymentMethod === 'ADVANCE_AND_FROZEN'){
							jobsObj.jobMilestoneAmountTotal = milestoneAmount - jobAdvanceAmount;
							jobsObj.jobNoOfMilestones = parseInt(jobMilestones.length);
						}
						jobsObj.jobType = jobType;
                        let i1 = queryBuilder.update(constant.jobs,jobsObj,{jobID:jobID});
                        queryBuilder.reset_query(i1);
                        connection.query(i1, function(err, jobUpdateResp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }
	                        if(!jobUpdateResp){
	                        	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Failed to modify a job.')
									        });
	                        }

	                    /* Update job payment distribution */
					   	let jobPaymentDistribution = {};
                		jobPaymentDistribution.jobHirerQlFeesPercent    = constant.ql_fees;
                		jobPaymentDistribution.jobProviderQlFeesPercent = constant.ql_fees;
                		jobPaymentDistribution.jobHirerQlFeesAmount     = jobAmountQlFees;
                		jobPaymentDistribution.jobProviderQlFeesAmount  = jobAmountQlFees;
                		jobPaymentDistribution.jobHirerAdvanceAmount    = jobAdvanceAmount;
                		jobPaymentDistribution.jobProviderAdvanceAmount = jobAdvanceAmount;
                		if(jobPaymentMethod === 'FROZEN' || jobPaymentMethod === 'ADVANCE_AND_FROZEN'){
                			jobPaymentDistribution.jobHirerMilestoneAmount  = jobsObj.jobMilestoneAmountTotal;
                		}
                		jobPaymentDistribution.jobTotalAgreedAmount = jobAgreedAmount; // Only agreed amount without QL fees
                        let i2 = queryBuilder.update(constant.jobs_payment_distribution,jobPaymentDistribution,{jobParentID:jobID});
                        queryBuilder.reset_query(i2);
                        connection.query(i2, function(err, resp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }

	                    /* Delete Current Milestones */
	                    let d1 = queryBuilder.delete(constant.milestones,{milestoneJobID:jobID});
                        queryBuilder.reset_query(d1);
                        connection.query(d1, function(err, resp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }

	                    /* Manage milestones */
	                    if(jobPaymentMethod === 'FROZEN' || jobPaymentMethod === 'ADVANCE_AND_FROZEN')
	                    {
	                    	let milestoneObj = [];
	                    	for (var i = 0; i < parseInt(jobMilestones.length); i++)
			    			{
			    				let row = {};
			    				row.milestoneJobID    = jobID;
			    				row.milestoneTitle    = jobMilestones[i].milestoneTitle;
			    				row.milestoneAmount   = jobMilestones[i].milestoneAmount;
			    				row.milestoneDateTime = custom.getCurrentTime();
			    				milestoneObj.push(row);
			    			}
			    			if(parseInt(milestoneObj.length) > 0)
			    			{
			    				let i3 = queryBuilder.insert_batch(constant.milestones,milestoneObj);
		                        queryBuilder.reset_query(i3);
		                        connection.query(i3, function(err, resp) {
			                        if (err) {
			                            connection.rollback(function() {
			                                return res.send(custom.dbErrorResponse(err.sqlMessage));
			                            });
			                        }
			                    });
			    			}
	                    }

	                    let jobAgreedAmountCurrent = parseInt(jobResp[0].jobAgreedAmount);

	                    /* Update hirer hold amount */
                        let u1 = "UPDATE (`"+constant.user_details+"`) SET `userWalletHoldAmount` = userWalletHoldAmount - " + jobAgreedAmountCurrent + " WHERE `userId` = " + masterUserId;
                        queryBuilder.reset_query(u1);
                        connection.query(u1, function(err, resp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }

	                    /* Update hirer main amount */
                        let u2 = "UPDATE (`"+constant.user_details+"`) SET `userWalletAmount` = userWalletAmount + " + jobAgreedAmountCurrent + " WHERE `userId` = " + masterUserId;
                        queryBuilder.reset_query(u2);
                        connection.query(u2, function(err, resp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }

	                    /* Update hirer hold amount */
                        let u3 = "UPDATE (`"+constant.user_details+"`) SET `userWalletHoldAmount` = userWalletHoldAmount + " + jobAgreedAmount + " WHERE `userId` = " + masterUserId;
                        queryBuilder.reset_query(u3);
                        connection.query(u3, function(err, resp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }

	                    /* Update hirer main amount */
                        let u4 = "UPDATE (`"+constant.user_details+"`) SET `userWalletAmount` = userWalletAmount - " + jobAgreedAmount + " WHERE `userId` = " + masterUserId;
                        queryBuilder.reset_query(u4);
                        connection.query(u4, function(err, resp) {
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

	                            /* Manage Hold amount history */
	                            let holdAmountObj = {};
	                            holdAmountObj.holdAmount = jobAgreedAmount;
	                            model.updateData(function(err,holdAmountResp){
	                            	if(err){
	                            		console.log('Hold amount error',err);
	                            	}else{
	                            		console.log('Hold amount success');
	                            	}
	                            },constant.hold_amounts,holdAmountObj,{holdAmountJobID:jobID});

	                            /* Insert wallet data (Hold Amount + Main Amount) */       
                                let walletObj = [];
                                let walletHold1Obj = {};
                                let walletHold2Obj = {};
                                let walletMain1Obj = {};
                                let walletMain2Obj = {};
                                let currentBalance1 = parseFloat(parseFloat(userDetailsObj[0].userWalletAmount) + jobAgreedAmountCurrent).toFixed(2);
                                walletHold1Obj.walletUserID          = masterUserId;
                                walletHold1Obj.walletAmount          = jobAgreedAmountCurrent;
                                walletHold1Obj.walletRemainingAmount = currentBalance1;
                                walletHold1Obj.walletTxnType         = 'NONE';
                                walletHold1Obj.walletTxnReason       = 'JOB_MODIFY_OLD_ADVANCE_AMOUNT';
                                walletHold1Obj.walletTxnID           = custom.generateCustomID('QL');
                                walletHold1Obj.walletTxnStatus       = 'COMPLETED';
                                walletHold1Obj.walletTxnDateTime     = custom.getCurrentTime();
                                walletHold1Obj.walletExtraParams     = JSON.stringify({jobID:jobID});
                                walletHold1Obj.walletExtraParams     = JSON.stringify({jobID:jobID,walletTypeAccount:'HOLD_AC',walletAccountTxnType:'DEDUCT'});
                                walletObj.push(walletHold1Obj);

                                walletMain1Obj.walletUserID          = masterUserId;
                                walletMain1Obj.walletAmount          = jobAgreedAmountCurrent;
                                walletMain1Obj.walletRemainingAmount = currentBalance1;
                                walletMain1Obj.walletTxnType         = 'ADDED';
                                walletMain1Obj.walletTxnReason       = 'JOB_MODIFY_OLD_ADVANCE_AMOUNT';
                                walletMain1Obj.walletTxnID           = custom.generateCustomID('QL');
                                walletMain1Obj.walletTxnStatus       = 'COMPLETED';
                                walletMain1Obj.walletTxnDateTime     = custom.getCurrentTime();
                                walletMain1Obj.walletExtraParams     = JSON.stringify({jobID:jobID,walletTypeAccount:'MAIN_AC',walletAccountTxnType:'ADDED'});
                                walletObj.push(walletMain1Obj);

                                let currentBalance2 = parseFloat((parseFloat(userDetailsObj[0].userWalletAmount) + jobAgreedAmountCurrent) - jobAgreedAmount).toFixed(2);
                                walletHold2Obj.walletUserID          = masterUserId;
                                walletHold2Obj.walletAmount          = jobAgreedAmount;
                                walletHold2Obj.walletRemainingAmount = currentBalance2;
                                walletHold2Obj.walletTxnType         = 'NONE';
                                walletHold2Obj.walletTxnReason       = 'JOB_MODIFY_CURRENT_ADVANCE_AMOUNT';
                                walletHold2Obj.walletTxnID           = custom.generateCustomID('QL');
                                walletHold2Obj.walletTxnStatus       = 'COMPLETED';
                                walletHold2Obj.walletTxnDateTime     = custom.getCurrentTime();
                                walletHold2Obj.walletExtraParams     = JSON.stringify({jobID:jobID,walletTypeAccount:'HOLD_AC',walletAccountTxnType:'ADDED'});
                                walletObj.push(walletHold2Obj);

                                walletMain2Obj.walletUserID          = masterUserId;
                                walletMain2Obj.walletAmount          = jobAgreedAmount;
                                walletMain2Obj.walletRemainingAmount = currentBalance2;
                                walletMain2Obj.walletTxnType         = 'DEDUCT';
                                walletMain2Obj.walletTxnReason       = 'JOB_MODIFY_CURRENT_ADVANCE_AMOUNT';
                                walletMain2Obj.walletTxnID           = custom.generateCustomID('QL');
                                walletMain2Obj.walletTxnStatus       = 'COMPLETED';
                                walletMain2Obj.walletTxnDateTime     = custom.getCurrentTime();
                                walletMain2Obj.walletExtraParams     = JSON.stringify({jobID:jobID,walletTypeAccount:'MAIN_AC',walletAccountTxnType:'DEDUCT'});
                                walletObj.push(walletMain2Obj);
                                model.insertBulkData(function(err,resp){
                                    if(err){
                                        console.log('Failed to add wallet transactions');
                                    }
                                },constant.wallet,walletObj);

                                /* Delete old notification */
                                model.deleteData(function(err,deleteResp){
                                	if(err){
                                		console.log('Hire app delete notification error',err);
                                	}else{
                                		console.log('Hire app delete notification');
                                	}
                                },constant.notifications,{jobModuleID:jobID,notificationType:'HIRE_PROVIDER'});

                                let jobProviderUserID = parseInt(jobResp[0].jobProviderUserID);

                                /* Update old Job modify status */
                                model.updateData(function(err,updateResp){
                                	if(err){
	                            		console.log('Old notification app notification error',err);
	                            	}else{

	                            		/* Insert job modify notification */
									   	let notificationDataObj = {};
				                		notificationDataObj.notificationUserId   = masterUserId;
				                		notificationDataObj.notificationFriendId = jobProviderUserID;
				                		notificationDataObj.jobModuleID          = jobID;
				                		notificationDataObj.notificationModule   = 'PROVIDER';
				                		notificationDataObj.notificationType     = 'MODIFY_JOB';
				                		notificationDataObj.notificationMessage  = 'has modified a job';
				                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
				                		model.insertData(function(err,notificationResp){
			                            	if(err){
			                            		console.log('Hire app notification error',err);
			                            	}else{
			                            		console.log('Hire app notification success');
			                            	}
			                            },constant.notifications,notificationDataObj);
	                            	}
                                },constant.notifications,{actionStatus:'OLD_JOB_MODIFIED',notificationMessage:'was modified a job'},{jobModuleID:jobID,notificationType:'MODIFY_JOB'});

	                            /* Update provider badges */
	                            let updateQuery = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + jobProviderUserID;
	                            model.customQuery(function(err,badgesResp){
	                            	if(err){
	                            		console.log('Hire app notification badges error',err);
	                            	}else{
	                            		console.log('Hire app notification badges success');
	                            	}
	                            },updateQuery);

	                            /* To send push notifications */
	                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " has modified a job";
	                            let extraParams = {};
	                            extraParams.jobModuleID       = jobID;
	                            extraParams.jobHirerUserID    = masterUserId;
	                            extraParams.jobProviderUserID = jobProviderUserID;
	                            extraParams.moduleName        = 'PROVIDER';
	                            extraParams.notificationType  = 'MODIFY_JOB';
	                            notification.sendPushNotifications(userMessage,jobProviderUserID,extraParams);

	                            /* Manage admin report */
                                let reportObj1 = {};
                                reportObj1.reportUserID = masterUserId;
                                reportObj1.reportAmount = jobAgreedAmountCurrent;
                                reportObj1.reportAmountType  = 0;
                                reportObj1.reportModuleName  = 'MODIFY_JOB';
                                reportObj1.reportExtraParams = JSON.stringify({jobID:jobID});
                                reportObj1.reportDateTime    = custom.getCurrentTime();
                                model.insertData(function(err,resp){
                                    if(err){
                                        console.log('Failed to add reports');
                                    }
                                },constant.reports,reportObj1);

                                /* Manage admin report */
                                let reportObj2 = {};
                                reportObj2.reportUserID = masterUserId;
                                reportObj2.reportAmount = jobAgreedAmount;
                                reportObj2.reportAmountType  = 1;
                                reportObj2.reportModuleName  = 'MODIFY_JOB';
                                reportObj2.reportExtraParams = JSON.stringify({jobID:jobID});
                                reportObj2.reportDateTime    = custom.getCurrentTime();
                                model.insertData(function(err,resp){
                                    if(err){
                                        console.log('Failed to add reports');
                                    }
                                },constant.reports,reportObj2);

	                            /* Return user response */
			            		return res.send({"code" : 200, "response" : {jobModuleID:jobID},"status" : 1,"message" : custom.lang(locale,'Job successfully modified.')});
	                        }
                    	});
                    	});
                    	});
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

	/* To accept a job request (Provider Will Accept)
	 * @param {string}  userLoginSessionKey
	 * @param {integer} jobID
	*/
	app.post('/job/accept', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
    	req.sanitize("userLoginSessionKey").trim();
    	req.sanitize("jobID").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('jobID', custom.lang(locale,'The Job id field is required')).notEmpty();
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
	    	let jobID                = parseInt(req.sanitize('jobID').escape().trim());
			
			async.waterfall([
			    function(callback) {
			        /* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							let masterUserId = parseInt(respObj[0].masterUserId);

							/* Validate Job ID */
							model.getAllWhere(function(err,jobResp){
								if (err) {
		                            return res.send(custom.dbErrorResponse());
		                        }else{
		                        	if(jobResp != ""){
		                        		let jobStartDate = custom.changeDateFormat(jobResp[0].jobStartDate,'yyyy-mm-dd');
		                        		let currentDate  = custom.changeDateFormat(custom.getCurrentTime(),'yyyy-mm-dd');
		                        		if(jobResp[0].jobAcceptStatus == 'ACCEPT'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already accepted.') 
											        });
		                        		}else if(jobResp[0].jobGlobalStatus == 'COMPLETED'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already completed.') 
											        });
		                        		}else if(jobResp[0].jobGlobalStatus == 'CANCELED'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already in cancellation mode.')
											        });
		                        		}else if(jobResp[0].jobGlobalStatus == 'MUTUALLY_CANCELED'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already cancelled.')
											        });
		                        		}else if(jobResp[0].jobGlobalStatus == 'DISPUTE'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already disputed.') 
											        });
		                        		}else if(jobResp[0].jobProviderUserID != masterUserId){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'You can not accept this job.') 
											        });
		                        		}else if(currentDate > jobStartDate){

		                        			/* Send push notification to Hire (Backgroud Process) */
		                        			let jobProviderUserID = jobResp[0].jobProviderUserID;
		                        			let jobHirerUserID    = jobResp[0].jobHirerUserID;

		                        			/* Delete Old notifications */
		                        			model.deleteData(function(err,deleteResp){
		                        				if(err){
				                            		console.log('Accept job past start date delete app notification error',err);
				                            	}else{
				                            		console.log('Accept job past start date delete app notification success');
				                            	}
		                        			},constant.notifications,{jobModuleID:jobID,notificationType:"ACCEPT_JOB_PAST_START_DATE"});

		                        			/* Insert job accept notification */
										   	let notificationDataObj = {};
					                		notificationDataObj.notificationUserId   = jobProviderUserID;
					                		notificationDataObj.notificationFriendId = jobHirerUserID;
					                		notificationDataObj.jobModuleID          = jobID;
					                		notificationDataObj.notificationModule   = 'PROVIDER';
					                		notificationDataObj.notificationType     = 'ACCEPT_JOB_PAST_START_DATE';
					                		notificationDataObj.notificationMessage  = 'want to accept this job, please update job start date & end date';
					                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
					                		model.insertData(function(err,notificationResp){
				                            	if(err){
				                            		console.log('Accept job past start date app notification error',err);
				                            	}else{
				                            		console.log('Accept job past start date app notification success');
				                            	}
				                            },constant.notifications,notificationDataObj);

				                            /* Update hirer badges */
				                            let updateQuery = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + jobHirerUserID;
				                            model.customQuery(function(err,badgesResp){
				                            	if(err){
				                            		console.log('Accept job past start date app notification badges error',err);
				                            	}else{
				                            		console.log('Accept job past start date app notification badges success');
				                            	}
				                            },updateQuery);

				                            /* To send push notifications */
				                            let userMessage = respObj[0].userFirstName + " " + respObj[0].userLastName + " want to accept this job, please update job start date & end date";
				                            let extraParams = {};
				                            extraParams.jobModuleID       = jobID;
				                            extraParams.jobHirerUserID    = jobHirerUserID;
				                            extraParams.jobProviderUserID = jobProviderUserID;
				                            extraParams.moduleName        = 'PROVIDER';
				                            extraParams.notificationType  = 'ACCEPT_JOB_PAST_START_DATE';
				                            notification.sendPushNotifications(userMessage,jobHirerUserID,extraParams);

								        	return res.send({
								                        "code": 200,
								                        "response": {},
								                        "status": 0,
								                        "message": custom.lang(locale,'Sorry Job start date is past date, we sent your request to the hire for update job start date')
								                    });
								        }else{
		                        			/* Check user is already blocked */
											custom.isUserBlocked(function(respType,blockResp){
												if(respType === 0){
													return res.send(blockResp);
												}else if(respType === 1){
													return res.send({
												                        "code": 200,
												                        "response": {},
												                        "status": 0,
												                        "message": custom.lang(locale,'You can not accept this job.')
												                    });
												}else{

													/* Get Payment distribution details */
													model.getAllWhere(function(err,paymentDetails){
														if (err) {
								                            return res.send(custom.dbErrorResponse());
								                        }else{
								                        	if(paymentDetails != ""){
								                        		/* Get hirer details */
																model.getAllWhere(function(err,hirerDetails){
																	if (err) {
											                            return res.send(custom.dbErrorResponse());
											                        }else{
											                        	if(hirerDetails != ""){
																			callback(null, respObj,jobResp,paymentDetails,hirerDetails);
											                        	}else{
											                        		return res.send({
																                        "code": 200,
																                        "response": {},
																                        "status": 0,
																                        "message": custom.lang(locale,'Hirer details not found.')
																                    });
											                        	}
																	}
																},constant.user_details,{userId:jobResp[0].jobHirerUserID});
								                        	}else{
								                        		return res.send({
												                        "code": 200,
												                        "response": {},
												                        "status": 0,
												                        "message": custom.lang(locale,'Job details not found.')
												                    });
								                        	}
								                        }
													},constant.jobs_payment_distribution,{jobParentID:jobID});
												}
											},masterUserId,parseInt(jobResp[0].jobProviderUserID));
		                        		}
		                        	}else{
		                        		return  res.send({
										            "code": 200,
										            "response": {},
										            "status": 0,
										            "message":custom.lang(locale,'Invalid Job ID.') 
										        });
		                        	}
		                        }
							},constant.jobs,{jobID:jobID});
						}
					},userLoginSessionKey,timezone);
			    }
			], function (err, userDetailsObj,jobResp,paymentDetails,hirerDetails) {
				let masterUserId = parseInt(userDetailsObj[0].userId);
			    
			    database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Update jobs data */	   
						let jobsObj = {};
						jobsObj.jobAcceptStatus    = 'ACCEPT';
						jobsObj.jobAcceptDateTime  = custom.getCurrentTime();
                        let i1 = queryBuilder.update(constant.jobs,jobsObj,{jobID:jobID});
                        queryBuilder.reset_query(i1);
                        connection.query(i1, function(err, jobUpdateResp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }
	                        if(!jobUpdateResp){
	                        	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Failed to accept a job.')
									        });
	                        }

	                    let jobHirerQlFeesAmount     = paymentDetails[0].jobHirerQlFeesAmount;
	                    let jobProviderQlFeesAmount  = paymentDetails[0].jobProviderQlFeesAmount;
	                    let jobHirerAdvanceAmount    = paymentDetails[0].jobHirerAdvanceAmount;
	                    let jobProviderAdvanceAmount = paymentDetails[0].jobProviderAdvanceAmount;
	                    let jobAgreedAmount          = jobResp[0].jobAgreedAmount;
	                    let jobHirerUserID           = jobResp[0].jobHirerUserID;
	                    let jobProviderUserID        = jobResp[0].jobProviderUserID;

	                    /* Update hirer hold amount & QL Fees */
                        let u1 = "UPDATE (`"+constant.user_details+"`) SET `userWalletHoldAmount` = userWalletHoldAmount - " + jobAgreedAmount + ", `userWalletAmount` = userWalletAmount - " + jobHirerQlFeesAmount + " WHERE `userId` = " + jobHirerUserID;
                        queryBuilder.reset_query(u1);
                        connection.query(u1, function(err, resp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }

	                    /* Update provider advance amount & QL Fees */
	                    let providerFinalAmount = jobProviderAdvanceAmount - jobProviderQlFeesAmount;
                        let u2 = "UPDATE (`"+constant.user_details+"`) SET `userWalletAmount` = userWalletAmount + " + providerFinalAmount + " WHERE `userId` = " + jobProviderUserID;
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

	                            /* Update hold amount status */
							   	let holdAmountObj = {};
		                		holdAmountObj.holdAmountStatus   = 'PAID';
		                		holdAmountObj.holdAmountResponseDateTime = custom.getCurrentTime();
		                		model.updateData(function(err,holdAmountResp){
	                            	if(err){
	                            		console.log('Hold amount error',err);
	                            	}else{
	                            		console.log('Hold amount success');
	                            	}
	                            },constant.hold_amounts,holdAmountObj,{holdAmountJobID:jobID});

	                            /* Insert wallet data (Hold Amount + Main Amount) */       
                                let walletObj = [];
                                let walletHold1Obj = {};
                                let walletHold2Obj = {};
                                let walletMain1Obj = {};
                                let walletMain2Obj = {};
                                let currentBalance1 = custom.parseNumber(hirerDetails[0].userWalletAmount);
                                let currentBalance2 = custom.parseNumber(hirerDetails[0].userWalletAmount - jobHirerQlFeesAmount);

                                /* Deduct hold amount */
                                walletHold1Obj.walletUserID          = jobHirerUserID;
                                walletHold1Obj.walletAmount          = jobAgreedAmount;
                                walletHold1Obj.walletRemainingAmount = currentBalance1;
                                walletHold1Obj.walletTxnType         = 'NONE';
                                walletHold1Obj.walletTxnReason       = 'JOB_ACCEPT_HOLD_AMOUNT';
                                walletHold1Obj.walletTxnID           = custom.generateCustomID('QL');
                                walletHold1Obj.walletTxnStatus       = 'COMPLETED';
                                walletHold1Obj.walletTxnDateTime     = custom.getCurrentTime();
                                walletHold1Obj.walletExtraParams     = JSON.stringify({jobID:jobID});
                                walletHold1Obj.walletExtraParams     = JSON.stringify({jobID:jobID,walletTypeAccount:'HOLD_AC',walletAccountTxnType:'DEDUCT'});
                                walletObj.push(walletHold1Obj);

                                /* Deduct QL fees (10%) - HIRER */
                                walletMain1Obj.walletUserID          = jobHirerUserID;
                                walletMain1Obj.walletAmount          = jobHirerQlFeesAmount;
                                walletMain1Obj.walletRemainingAmount = currentBalance2;
                                walletMain1Obj.walletTxnType         = 'DEDUCT';
                                walletMain1Obj.walletTxnReason       = 'JOB_ACCEPT_QL_FEES';
                                walletMain1Obj.walletTxnID           = custom.generateCustomID('QL');
                                walletMain1Obj.walletTxnStatus       = 'COMPLETED';
                                walletMain1Obj.walletTxnDateTime     = custom.getCurrentTime();
                                walletMain1Obj.walletExtraParams     = JSON.stringify({jobID:jobID,walletTypeAccount:'MAIN_AC',walletAccountTxnType:'DEDUCT'});
                                walletObj.push(walletMain1Obj);

                                /* Deduct QL fees (10%) - PROVIDER */
                                let currentBalance3 = custom.parseNumber(userDetailsObj[0].userWalletAmount - jobProviderQlFeesAmount);
                                walletHold2Obj.walletUserID          = jobProviderUserID;
                                walletHold2Obj.walletAmount          = jobProviderQlFeesAmount;
                                walletHold2Obj.walletRemainingAmount = currentBalance3;
                                walletHold2Obj.walletTxnType         = 'DEDUCT';
                                walletHold2Obj.walletTxnReason       = 'JOB_ACCEPT_QL_FEES';
                                walletHold2Obj.walletTxnID           = custom.generateCustomID('QL');
                                walletHold2Obj.walletTxnStatus       = 'COMPLETED';
                                walletHold2Obj.walletTxnDateTime     = custom.getCurrentTime();
                                walletHold2Obj.walletExtraParams     = JSON.stringify({jobID:jobID,walletTypeAccount:'MAIN_AC',walletAccountTxnType:'DEDUCT'});
                                walletObj.push(walletHold2Obj);

                                /* Add provider agreed amount */
                                if(jobProviderAdvanceAmount > 0)
                                {
                                	let currentBalance4 = custom.parseNumber(currentBalance3 + jobProviderAdvanceAmount);
	                                walletMain2Obj.walletUserID          = jobProviderUserID;
	                                walletMain2Obj.walletAmount          = jobProviderAdvanceAmount;
	                                walletMain2Obj.walletRemainingAmount = currentBalance4;
	                                walletMain2Obj.walletTxnType         = 'ADDED';
	                                walletMain2Obj.walletTxnReason       = 'JOB_ACCEPT_ADVANCE_AMOUNT';
	                                walletMain2Obj.walletTxnID           = custom.generateCustomID('QL');
	                                walletMain2Obj.walletTxnStatus       = 'COMPLETED';
	                                walletMain2Obj.walletTxnDateTime     = custom.getCurrentTime();
	                                walletMain2Obj.walletExtraParams     = JSON.stringify({jobID:jobID,walletTypeAccount:'MAIN_AC',walletAccountTxnType:'ADDED'});
	                                walletObj.push(walletMain2Obj);
                                }
                                model.insertBulkData(function(err,resp){
                                    if(err){
                                        console.log('Failed to add wallet transactions');
                                    }
                                },constant.wallet,walletObj);

	                            /* Insert job modify notification */
							   	let notificationDataObj = {};
		                		notificationDataObj.notificationUserId   = jobProviderUserID;
		                		notificationDataObj.notificationFriendId = jobHirerUserID;
		                		notificationDataObj.jobModuleID          = jobID;
		                		notificationDataObj.notificationModule   = 'PROVIDER';
		                		notificationDataObj.notificationType     = 'ACCEPT_JOB';
		                		notificationDataObj.notificationMessage  = 'has accepted a job';
		                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
		                		model.insertData(function(err,notificationResp){
	                            	if(err){
	                            		console.log('Hire app notification error',err);
	                            	}else{
	                            		console.log('Hire app notification success');
	                            	}
	                            },constant.notifications,notificationDataObj);

	                            /* Update hirer badges */
	                            let updateQuery = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + jobHirerUserID;
	                            model.customQuery(function(err,badgesResp){
	                            	if(err){
	                            		console.log('Hire app notification badges error',err);
	                            	}else{
	                            		console.log('Hire app notification badges success');
	                            	}
	                            },updateQuery);

	                            /* To send push notifications */
	                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " has accepted a job";
	                            let extraParams = {};
	                            extraParams.jobModuleID       = jobID;
	                            extraParams.jobHirerUserID    = jobHirerUserID;
	                            extraParams.jobProviderUserID = jobProviderUserID;
	                            extraParams.moduleName        = 'PROVIDER';
	                            extraParams.notificationType  = 'ACCEPT_JOB';
	                            notification.sendPushNotifications(userMessage,jobHirerUserID,extraParams);

	                            /* Manage admin reports */
	                            let reportObj = [];
                                let report1Obj = {};
                                let report2Obj = {};
                                let report3Obj = {};

                                /* Deduct hold amount */
                                if(jobProviderAdvanceAmount > 0)
                                {
                                	report1Obj.reportUserID = jobHirerUserID;
	                                report1Obj.reportAmount = jobProviderAdvanceAmount;
	                                report1Obj.reportAmountType  = 0;
	                                report1Obj.reportModuleName  = 'ACCEPT_JOB';
	                                report1Obj.reportExtraParams = JSON.stringify({jobID:jobID});
	                                report1Obj.reportDateTime    = custom.getCurrentTime();
	                                reportObj.push(report1Obj);
                                }

                                /* Add QL fees (10%) - HIRER */
                                report2Obj.reportUserID = jobHirerUserID;
                                report2Obj.reportAmount = jobHirerQlFeesAmount;
                                report2Obj.reportAmountType  = 1;
                                report2Obj.reportModuleName  = 'ACCEPT_JOB';
                                report2Obj.reportExtraParams = JSON.stringify({jobID:jobID});
                                report2Obj.reportDateTime    = custom.getCurrentTime();
                                reportObj.push(report2Obj);

                                /* Add QL fees (10%) - Provider */
                                report3Obj.reportUserID = jobProviderUserID;
                                report3Obj.reportAmount = jobProviderQlFeesAmount;
                                report3Obj.reportAmountType  = 1;
                                report3Obj.reportModuleName  = 'ACCEPT_JOB';
                                report3Obj.reportExtraParams = JSON.stringify({jobID:jobID});
                                report3Obj.reportDateTime    = custom.getCurrentTime();
                                reportObj.push(report3Obj);

                                model.insertBulkData(function(err,resp){
                                    if(err){
                                        console.log('Failed to add reports');
                                    }
                                },constant.reports,reportObj);

	                            /* Return user response */
			            		return res.send({"code" : 200, "response" : {jobModuleID:jobID},"status" : 1,"message" : custom.lang(locale,'Job accepted successfully.')});
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

	/* To complete a job 
	 * @param {string}  userLoginSessionKey
	 * @param {integer} jobID
	*/
	app.post('/job/complete', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
    	req.sanitize("userLoginSessionKey").trim();
    	req.sanitize("jobID").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('jobID', custom.lang(locale,'The Job id field is required')).notEmpty();
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
	    	let jobID                = parseInt(req.sanitize('jobID').escape().trim());
			
			async.waterfall([
			    function(callback) {
			        /* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							let masterUserId = parseInt(respObj[0].masterUserId);

							/* Validate Job ID */
							model.getAllWhere(function(err,jobResp){
								if (err) {
		                            return res.send(custom.dbErrorResponse());
		                        }else{
		                        	if(jobResp != ""){
		                        		if(jobResp[0].jobAcceptStatus != 'ACCEPT'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Provider does not accpet this job.') 
											        });
		                        		}else if(jobResp[0].jobGlobalStatus == 'COMPLETED'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already completed.') 
											        });
		                        		}else if(jobResp[0].jobGlobalStatus == 'CANCELED'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already in cancellation mode.') 
											        });
		                        		}else if(jobResp[0].jobGlobalStatus == 'MUTUALLY_CANCELED'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already cancelled.') 
											        });
		                        		}else if(jobResp[0].jobGlobalStatus == 'DISPUTE'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already disputed.') 
											        });
		                        		}else if(jobResp[0].jobHirerUserID != masterUserId){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'You can not complete this job.') 
											        });
		                        		}else{
		                        			/* Check user is already blocked */
											custom.isUserBlocked(function(respType,blockResp){
												if(respType === 0){
													return res.send(blockResp);
												}else if(respType === 1){
													return res.send({
												                        "code": 200,
												                        "response": {},
												                        "status": 0,
												                        "message": custom.lang(locale,'You can not complete this job.')
												                    });
												}else{
													callback(null, respObj,jobResp);
												}
											},masterUserId,parseInt(jobResp[0].jobProviderUserID));
		                        		}
		                        	}else{
		                        		return  res.send({
										            "code": 200,
										            "response": {},
										            "status": 0,
										            "message":custom.lang(locale,'Invalid Job ID.') 
										        });
		                        	}
		                        }
							},constant.jobs,{jobID:jobID});
						}
					},userLoginSessionKey,timezone);
			    },
			    function(userDetailsObj,jobResp, callback) {

			    	let jobPaymentMethod = jobResp[0].jobPaymentMethod;
			    	let jobType          = jobResp[0].jobType;
			    	if(jobPaymentMethod === 'FROZEN' || jobPaymentMethod === 'ADVANCE_AND_FROZEN'){

			    		/* Get milestone details */
			    		model.getAllWhere(function(err,milestoneResp){
			    			if (err) {
	                            return res.send(custom.dbErrorResponse());
	                        }else{
	                        	if(parseInt(milestoneResp.length) > 0){
	                        		for (var i = 0; i < parseInt(milestoneResp.length); i++) 
	                        		{
	                        			if(milestoneResp[i].milestoneStatus != 'PAID')
	                        			{
	                        				return  res.send({
										            "code": 200,
										            "response": {},
										            "status": 0,
										            "message":custom.lang(locale,'First please release all milestones.') 
										        });
	                        			}
	                        		}
	                        		callback(null, userDetailsObj,jobResp,jobType);
	                        	}else{
	                        		callback(null, userDetailsObj,jobResp,jobType);
	                        	}
	                        }
			    		},constant.milestones,{milestoneJobID:jobID});
			    	}else{
			    		callback(null, userDetailsObj,jobResp,jobType);
			    	}
			    }
			], function (err, userDetailsObj,jobResp,jobType) {
				let masterUserId = parseInt(userDetailsObj[0].userId);
			    
			    database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Update jobs data */	   
						let jobsObj = {};
						jobsObj.jobGlobalStatus      = 'COMPLETED';
						jobsObj.jobResponseDateTime  = custom.getCurrentTime();
                        let i1 = queryBuilder.update(constant.jobs,jobsObj,{jobID:jobID});
                        queryBuilder.reset_query(i1);
                        connection.query(i1, function(err, jobUpdateResp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }
	                        if(!jobUpdateResp){
	                        	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Failed to complete a job.')
									        });
	                        }

	                    let jobHirerUserID           = jobResp[0].jobHirerUserID;
	                    let jobProviderUserID        = jobResp[0].jobProviderUserID;

                    	connection.commit(function(err) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse());
	                            });
	                        }else{
	                            connection.release();

	                            // BACKGROUD PROCESS (IN QUEUE)

	                            /* Insert job modify notification */
	                            let notificationMsg = 'Congrats, '+userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName+' has completed the '+jobResp[0].jobTitle+' job.';
							   	let notificationDataObj = {};
		                		notificationDataObj.notificationUserId   = jobHirerUserID;
		                		notificationDataObj.notificationFriendId = jobProviderUserID;
		                		notificationDataObj.jobModuleID          = jobID;
		                		notificationDataObj.notificationModule   = 'PROVIDER';
		                		notificationDataObj.notificationType     = 'COMPLETED_JOB';
		                		notificationDataObj.notificationMessage  = notificationMsg;
		                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
		                		model.insertData(function(err,notificationResp){
	                            	if(err){
	                            		console.log('Hire app notification error',err);
	                            	}else{
	                            		console.log('Hire app notification success');
	                            	}
	                            },constant.notifications,notificationDataObj);

	                            /* Update provider badges */
	                            let updateQuery = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + jobProviderUserID;
	                            model.customQuery(function(err,badgesResp){
	                            	if(err){
	                            		console.log('Hire app notification badges error',err);
	                            	}else{
	                            		console.log('Hire app notification badges success');
	                            	}
	                            },updateQuery);

	                            /* To send push notifications */
	                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " has completed a job";
	                            let extraParams = {};
	                            extraParams.jobModuleID       = jobID;
	                            extraParams.jobHirerUserID    = jobHirerUserID;
	                            extraParams.jobProviderUserID = jobProviderUserID;
	                            extraParams.moduleName        = 'PROVIDER';
	                            extraParams.notificationType  = 'COMPLETED_JOB';
	                            notification.sendPushNotifications(notificationMsg,jobProviderUserID,extraParams);

	                            /* Manage Upload Images Count (Hirer) */
	                            if(parseInt(userDetailsObj[0].isJobsImagesCountAdded) === 0)
	                            {
	                            	/* Get completed jobs count */
	                            	let s1 = "SELECT COUNT(*) AS `total_completed_jobs` FROM " + constant.jobs + " AS `J` WHERE `J`.`jobGlobalStatus` = 'COMPLETED' AND ( `J`.`jobHirerUserID` = " + jobHirerUserID + " OR `J`.`jobProviderUserID` = " + jobHirerUserID + " )";
	                            	model.customQuery(function(err,hirerCompletedJobs){
		                            	if(err){
		                            		console.log('Hire completed jobs count error',err);
		                            	}else{
		                            		console.log('hirer total_completed_jobs',hirerCompletedJobs[0].total_completed_jobs);
		                            		if(hirerCompletedJobs[0].total_completed_jobs && parseInt(hirerCompletedJobs[0].total_completed_jobs) >= constant.jobs_complete_limit)
		                            		{
		                            			/* Update hirer allowed images count */
					                            let u1 = "UPDATE (`"+constant.user_details+"`) SET `isJobsImagesCountAdded` = 1, `noOfAllowedImages` = noOfAllowedImages + " + constant.allowed_images_count + " WHERE `userId` = " + jobHirerUserID;
					                            model.customQuery(function(err,updateResp){
					                            	if(err){
					                            		console.log('Hire update allowed images error',err);
					                            	}else{
					                            		console.log('Hire update allowed images success');

					                            		/* Insert history */
					                            		let allowedImagesObj = {};
					                            		allowedImagesObj.allowedImageUserID   = jobHirerUserID;
					                            		allowedImagesObj.allowedImageModule   = 'JOBS';
					                            		allowedImagesObj.allowedImageCount    = constant.allowed_images_count;
					                            		allowedImagesObj.allowedImageDateTime = custom.getCurrentTime();
					                            		model.insertData(function(err,insertResp){
					                            			if(err){
							                            		console.log('Hire insert allowed image history error',err);
							                            	}else{
							                            		console.log('Hire insert allowed image history success');
							                            	}
					                            		},constant.allowed_images_history,allowedImagesObj);

							                            /* Insert images count notification */
							                            let notiMsg = 'Congratulation !! you had successfully completed ' + constant.jobs_complete_limit + ' jobs, now you can upload ' + constant.allowed_images_count + ' more images';
													   	let notificationDataObj1 = {};
								                		notificationDataObj1.notificationUserId   = jobHirerUserID;
								                		notificationDataObj1.notificationFriendId = jobHirerUserID;
								                		notificationDataObj1.notificationParams   = JSON.stringify({allowedImageCount:constant.allowed_images_count,allowedImageDateTime:custom.getCurrentTime()});
								                		notificationDataObj1.notificationModule   = 'GLOBAL';
								                		notificationDataObj1.notificationType     = 'COMPLETED_10_JOBS';
								                		notificationDataObj1.notificationMessage  = notiMsg;
								                		notificationDataObj1.notificationSentTime = custom.getCurrentTime();
								                		model.insertData(function(err,notificationResp){
							                            	if(err){
							                            		console.log('Hire allowed image app notification error',err);
							                            	}else{
							                            		console.log('Hire allowed image app notification success');
							                            	}
							                            },constant.notifications,notificationDataObj1);

							                            /* Update hirer badges */
							                            let updateQuery1 = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + jobHirerUserID;
							                            model.customQuery(function(err,badgesResp){
							                            	if(err){
							                            		console.log('Hire allowed image notification badges error',err);
							                            	}else{
							                            		console.log('Hire allowed image notification badges success');
							                            	}
							                            },updateQuery1);

							                            /* To send push notifications */
							                            let extraParams1 = {};
							                            extraParams1.jobModuleID       = jobID;
							                            extraParams1.jobHirerUserID    = jobHirerUserID;
							                            extraParams1.jobProviderUserID = jobProviderUserID;
							                            extraParams1.moduleName        = 'GLOBAL';
							                            extraParams1.notificationType  = 'COMPLETED_10_JOBS';
							                            notification.sendPushNotifications(notiMsg,jobHirerUserID,extraParams1);

					                            	}
					                            },u1);
		                            		}
		                            	}
		                            },s1);
	                            }

	                            /* Manage Upload Images Count (Provider) */
	                            model.getAllWhere(function(err,providerDetails){
	                            	if(err){
	                            		console.log('Provider details error',err);
	                            	}else{
	                            		if(providerDetails != "")
	                            		{
	                            			if(parseInt(providerDetails[0].isJobsImagesCountAdded) === 0)
				                            {
				                            	/* Get completed jobs count */
				                            	let s2 = "SELECT COUNT(*) AS `total_completed_jobs` FROM " + constant.jobs + " AS `J` WHERE `J`.`jobGlobalStatus` = 'COMPLETED' AND ( `J`.`jobHirerUserID` = " + jobProviderUserID + " OR `J`.`jobProviderUserID` = " + jobProviderUserID + " )";
				                            	model.customQuery(function(err,providerCompletedJobs){
					                            	if(err){
					                            		console.log('Provider completed jobs count error',err);
					                            	}else{
					                            		console.log('Provider total_completed_jobs',providerCompletedJobs[0].total_completed_jobs);
					                            		if(providerCompletedJobs[0].total_completed_jobs && parseInt(providerCompletedJobs[0].total_completed_jobs) >= constant.jobs_complete_limit)
					                            		{
					                            			/* Update provider allowed images count */
								                            let u2 = "UPDATE (`"+constant.user_details+"`) SET `isJobsImagesCountAdded` = 1, `noOfAllowedImages` = noOfAllowedImages + " + constant.allowed_images_count + " WHERE `userId` = " + jobProviderUserID;
								                            model.customQuery(function(err,updateResp){
								                            	if(err){
								                            		console.log('Provider update allowed images error',err);
								                            	}else{
								                            		console.log('Provider update allowed images success');

								                            		/* Insert history */
								                            		let allowedImagesObj2 = {};
								                            		allowedImagesObj2.allowedImageUserID   = jobProviderUserID;
								                            		allowedImagesObj2.allowedImageModule   = 'JOBS';
								                            		allowedImagesObj2.allowedImageCount    = constant.allowed_images_count;
								                            		allowedImagesObj2.allowedImageDateTime = custom.getCurrentTime();
								                            		model.insertData(function(err,insertResp){
								                            			if(err){
										                            		console.log('Provider insert allowed image history error',err);
										                            	}else{
										                            		console.log('Provider insert allowed image history success');
										                            	}
								                            		},constant.allowed_images_history,allowedImagesObj2);

										                            /* Insert images count notification */
										                            let notiMsg2 = 'Congratulation !! you had successfully completed ' + constant.jobs_complete_limit + ' jobs, now you can upload ' + constant.allowed_images_count + ' more images';
																   	let notificationDataObj2 = {};
											                		notificationDataObj2.notificationUserId   = jobProviderUserID;
											                		notificationDataObj2.notificationFriendId = jobProviderUserID;
											                		notificationDataObj2.notificationParams   = JSON.stringify({allowedImageCount:constant.allowed_images_count,allowedImageDateTime:custom.getCurrentTime()});
											                		notificationDataObj2.notificationModule   = 'GLOBAL';
											                		notificationDataObj2.notificationType     = 'COMPLETED_10_JOBS';
											                		notificationDataObj2.notificationMessage  = notiMsg2;
											                		notificationDataObj2.notificationSentTime = custom.getCurrentTime();
											                		model.insertData(function(err,notificationResp){
										                            	if(err){
										                            		console.log('Provider allowed image app notification error',err);
										                            	}else{
										                            		console.log('Provider allowed image app notification success');
										                            	}
										                            },constant.notifications,notificationDataObj2);

										                            /* Update provider badges */
										                            let updateQuery2 = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + jobProviderUserID;
										                            model.customQuery(function(err,badgesResp){
										                            	if(err){
										                            		console.log('Provider allowed image notification badges error',err);
										                            	}else{
										                            		console.log('Provider allowed image notification badges success');
										                            	}
										                            },updateQuery2);

										                            /* To send push notifications */
										                            let extraParams2 = {};
										                            extraParams2.jobModuleID       = jobID;
										                            extraParams2.jobHirerUserID    = jobHirerUserID;
										                            extraParams2.jobProviderUserID = jobProviderUserID;
										                            extraParams2.moduleName        = 'GLOBAL';
										                            extraParams2.notificationType  = 'COMPLETED_10_JOBS';
										                            notification.sendPushNotifications(notiMsg2,jobProviderUserID,extraParams2);
								                            	}
								                            },u2);
					                            		}
					                            	}
					                            },s2);
				                            }
	                            		}
	                            	}
	                            },constant.user_details,{userId:jobProviderUserID});
	                            
	                            /* Return user response */
			            		return res.send({"code" : 200, "response" : {jobModuleID:jobID},"status" : 1,"message" : custom.lang(locale,'Job completed successfully.')});
	                        }
                    	});
                    	});
                	});
				}); 
			});	        
	    }
	});

	/* To release a job milestone
	 * @param {string}  userLoginSessionKey
	 * @param {integer} jobID
	 * @param {integer} milestoneID
	*/
	app.post('/job/release-milestone', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
    	req.sanitize("userLoginSessionKey").trim();
    	req.sanitize("jobID").trim();
    	req.sanitize("milestoneID").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('jobID', custom.lang(locale,'The Job id field is required')).notEmpty();
	    req.check('milestoneID', custom.lang(locale,'The Milestone id field is required')).notEmpty();
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
	    	let jobID                = parseInt(req.sanitize('jobID').escape().trim());
	    	let milestoneID          = parseInt(req.sanitize('milestoneID').escape().trim());
			
			async.waterfall([
			    function(callback) {
			        /* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							let masterUserId = parseInt(respObj[0].masterUserId);

							/* Validate Job ID */
							model.getAllWhere(function(err,jobResp){
								if (err) {
		                            return res.send(custom.dbErrorResponse());
		                        }else{
		                        	if(jobResp != ""){
		                        		if(jobResp[0].jobAcceptStatus != 'ACCEPT'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Provider does not accpet this job.') 
											        });
		                        		}else if(jobResp[0].jobGlobalStatus == 'COMPLETED'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already completed.') 
											        });
		                        		}else if(jobResp[0].jobGlobalStatus == 'CANCELED'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already in cancellation mode.') 
											        });
		                        		}else if(jobResp[0].jobGlobalStatus == 'MUTUALLY_CANCELED'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already cancelled.') 
											        });
		                        		}else if(jobResp[0].jobGlobalStatus == 'DISPUTE'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already disputed.') 
											        });
		                        		}else if(jobResp[0].jobHirerUserID != masterUserId){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'You are not allowed to release milestone.') 
											        });
		                        		}else{
		                        			/* Check user is already blocked */
											custom.isUserBlocked(function(respType,blockResp){
												if(respType === 0){
													return res.send(blockResp);
												}else if(respType === 1){
													return res.send({
												                        "code": 200,
												                        "response": {},
												                        "status": 0,
												                        "message": custom.lang(locale,'You can not release milestone.')
												                    });
												}else{
													
													/* Validate milestone details */
													model.getAllWhere(function(err,milestoneResp){
														if (err) {
								                            return res.send(custom.dbErrorResponse());
								                        }else{
								                        	if(milestoneResp != ""){
								                        		if(milestoneResp[0].milestoneStatus === 'PAID'){
								                        			return res.send({
														                        "code": 200,
														                        "response": {},
														                        "status": 0,
														                        "message": custom.lang(locale,'Milestone already released.')
														                    });
								                        		}else{

								                        			/* Get provider details */
								                        			model.getAllWhere(function(err,providerDetails){
								                        				if (err) {
												                            return res.send(custom.dbErrorResponse());
												                        }else{
												                        	if(providerDetails != ""){
								                        						callback(null, respObj,jobResp,milestoneResp,providerDetails);
												                        	}else{
												                        		return res.send({
																	                        "code": 200,
																	                        "response": {},
																	                        "status": 0,
																	                        "message": custom.lang(locale,'Provider details not found')
																	                    });
												                        	}
												                        }
								                        			},constant.user_details,{userId:jobResp[0].jobProviderUserID});
								                        		}
								                        	}else{
								                        		return res.send({
												                        "code": 200,
												                        "response": {},
												                        "status": 0,
												                        "message": custom.lang(locale,'We did not find milestone details for this job')
												                    });
								                        	}
								                        }
													},constant.milestones,{milestoneJobID:jobID,milestoneID:milestoneID});
												}
											},masterUserId,parseInt(jobResp[0].jobProviderUserID));
		                        		}
		                        	}else{
		                        		return  res.send({
										            "code": 200,
										            "response": {},
										            "status": 0,
										            "message":custom.lang(locale,'Invalid Job ID.') 
										        });
		                        	}
		                        }
							},constant.jobs,{jobID:jobID});
						}
					},userLoginSessionKey,timezone);
			    }
			], function (err, userDetailsObj,jobResp,milestoneResp,providerDetails) {
				let masterUserId    = parseInt(userDetailsObj[0].userId);
				let milestoneAmount = milestoneResp[0].milestoneAmount;
			    
			    database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Update milestone data */	   
						let milestoneObj = {};
						milestoneObj.milestoneStatus        = 'PAID';
						milestoneObj.milestonePaidDateTime  = custom.getCurrentTime();
                        let u1 = queryBuilder.update(constant.milestones,milestoneObj,{milestoneID:milestoneResp[0].milestoneID});
                        queryBuilder.reset_query(u1);
                        connection.query(u1, function(err, milestoneUpdateResp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }
	                        if(!milestoneUpdateResp){
	                        	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Failed to release milestone.')
									        });
	                        }

	                    let jobHirerUserID           = jobResp[0].jobHirerUserID;
	                    let jobProviderUserID        = jobResp[0].jobProviderUserID;

	                    /* Update provider milestone amount */
                        let u2 = "UPDATE (`"+constant.user_details+"`) SET `userWalletAmount` = userWalletAmount + " + milestoneAmount + " WHERE `userId` = " + jobProviderUserID;
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

	                            /* Add provider milestone amount */
                                let currentBalance = custom.parseNumber(providerDetails[0].userWalletAmount + milestoneAmount);
                                let walletObj = {};
                                walletObj.walletUserID          = jobProviderUserID;
                                walletObj.walletAmount          = milestoneAmount;
                                walletObj.walletRemainingAmount = currentBalance;
                                walletObj.walletTxnType         = 'ADDED';
                                walletObj.walletTxnReason       = 'JOB_RELEASE_MILESTONE_AMOUNT';
                                walletObj.walletTxnID           = custom.generateCustomID('QL');
                                walletObj.walletTxnStatus       = 'COMPLETED';
                                walletObj.walletTxnDateTime     = custom.getCurrentTime();
                                walletObj.walletExtraParams     = JSON.stringify({jobID:jobID,walletTypeAccount:'MAIN_AC',walletAccountTxnType:'ADDED'});
                                model.insertData(function(err,resp){
                                    if(err){
                                        console.log('Failed to add wallet transactions');
                                    }
                                },constant.wallet,walletObj);

	                            /* Insert job modify notification */
	                            let notiMessage = 'released $'+milestoneAmount+' milestone for';
							   	let notificationDataObj = {};
		                		notificationDataObj.notificationUserId   = jobHirerUserID;
		                		notificationDataObj.notificationFriendId = jobProviderUserID;
		                		notificationDataObj.jobModuleID          = jobID;
		                		notificationDataObj.notificationModule   = 'PROVIDER';
		                		notificationDataObj.notificationType     = 'RELEASE_JOB_MILESTONE';
		                		notificationDataObj.notificationMessage  = notiMessage;
		                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
		                		model.insertData(function(err,notificationResp){
	                            	if(err){
	                            		console.log('Hire app notification error',err);
	                            	}else{
	                            		console.log('Hire app notification success');
	                            	}
	                            },constant.notifications,notificationDataObj);

	                            /* Update provider badges */
	                            let updateQuery = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + jobProviderUserID;
	                            model.customQuery(function(err,badgesResp){
	                            	if(err){
	                            		console.log('Hire app notification badges error',err);
	                            	}else{
	                            		console.log('Hire app notification badges success');
	                            	}
	                            },updateQuery);

	                            /* To send push notifications */
	                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " " + notiMessage + " " + jobResp[0].jobTitle;
	                            let extraParams = {};
	                            extraParams.jobModuleID       = jobID;
	                            extraParams.jobHirerUserID    = jobHirerUserID;
	                            extraParams.jobProviderUserID = jobProviderUserID;
	                            extraParams.moduleName        = 'PROVIDER';
	                            extraParams.notificationType  = 'RELEASE_JOB_MILESTONE';
	                            notification.sendPushNotifications(userMessage,jobProviderUserID,extraParams);

	                            /* Manage admin report */
                                let reportObj = {};
                                reportObj.reportUserID = jobHirerUserID;
                                reportObj.reportAmount = milestoneAmount;
                                reportObj.reportAmountType  = 0;
                                reportObj.reportModuleName  = 'RELEASE_JOB_MILESTONE';
                                reportObj.reportExtraParams = JSON.stringify({jobID:jobID});
                                reportObj.reportDateTime    = custom.getCurrentTime();
                                model.insertData(function(err,resp){
                                    if(err){
                                        console.log('Failed to add reports');
                                    }
                                },constant.reports,reportObj);

	                            /* Return user response */
			            		return res.send({"code" : 200, "response" : {jobModuleID:jobID},"status" : 1,"message" : custom.lang(locale,'Milestone released successfully.')});
	                        }
                    	});
                    	});
                    	});
                	});
				}); 
			});	        
	    }
	});

	/* To get past jobs listing
	 * @param {string}  userLoginSessionKey
	 * @param {integer} pageNo
	 * @param {string}  jobType [MY_JOBS,RECEIVED_JOBS]
	*/
	app.post('/past-jobs/list', function(req, res) {

		let locale = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("pageNo").trim();
		req.sanitize("jobType").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('pageNo', custom.lang(locale,'Require page number')).notEmpty();
	    req.check('pageNo', custom.lang(locale,'Page number minimum value should be 1')).minValue(1);
	    req.check('jobType', custom.lang(locale,'The Job type field is required')).notEmpty();
	    req.check('jobType', custom.lang(locale,'Job type should be in MY_JOBS, RECEIVED_JOBS')).inList(["MY_JOBS","RECEIVED_JOBS"]);
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
			let jobType               = req.sanitize('jobType').escape().trim();
			let moduleName            = 'PROVIDER';

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

			    	/* To remove duplicate values */
			    	notInUserIds = Array.from(new Set(notInUserIds));

			    	/* To get offset */
			    	let offset = custom.getOffset(pageNo);

			    	/* To get jobs data */
			    	if(jobType === 'RECEIVED_JOBS'){
			    		var jobQuery = "SELECT * FROM " + constant.jobs + " AS `J` INNER JOIN " + constant.user_details + " AS `UD` ON `UD`.`userId` = `J`.`jobProviderUserID` WHERE `UD`.`userId` = " + masterUserId + " AND `J`.`jobGlobalStatus` IN ('COMPLETED','CANCELED','DISPUTE','MUTUALLY_CANCELED') AND `UD`.`userId` NOT IN (" + notInUserIds.join() + ") GROUP BY `J`.`jobID` ORDER BY `J`.`jobID` DESC ";
			    	}else{
			    		var jobQuery = "SELECT * FROM " + constant.jobs + " AS `J` INNER JOIN " + constant.user_details + " AS `UD` ON `UD`.`userId` = `J`.`jobHirerUserID` WHERE `UD`.`userId` = " + masterUserId + " AND `J`.`jobGlobalStatus` IN ('COMPLETED','CANCELED','DISPUTE','MUTUALLY_CANCELED') AND `UD`.`userId` NOT IN (" + notInUserIds.join() + ") GROUP BY `J`.`jobID` ORDER BY `J`.`jobID` DESC ";
			    	}
			    	model.customQuery(function(err,jobsObj){
			    		if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	let totalJobs = parseInt(jobsObj.length);
		                	if(offset > 0){
					    		jobQuery += "LIMIT " + offset + "," + constant.results_limit;
					    	}else{
					    		jobQuery += "LIMIT " + constant.results_limit
					    	}
					        model.customQuery(function(err,jobsRespObj){
					        	if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(jobsRespObj != ""){
				                		callback(null, userDetailsObj, jobsRespObj,totalJobs);
				                	}else{
				                		return res.send({
										            "code": 200,
										            "response": [],
										            "status": 0,
										            "message": custom.lang(locale,"Past jobs not found.")
										        });
				                	}
				                }
					        },jobQuery);
		                }
		            },jobQuery);
			    }
			], function (err,userDetailsObj,jobsRespObj,totalJobs) {
				let masterUserId = parseInt(userDetailsObj[0].masterUserId);
				let responseObj  = [];
				for (var i = 0; i < parseInt(jobsRespObj.length); i++) 
                {
                	let row = {};
                	row.jobTitle           = custom.nullChecker(jobsRespObj[i].jobTitle);
                    row.jobDescprition     = custom.nullChecker(jobsRespObj[i].jobDescprition);
                    row.jobID              = parseInt(jobsRespObj[i].jobID);
                    row.jobCustomID        = custom.nullChecker(jobsRespObj[i].jobCustomID);
                    row.jobMode            = custom.nullChecker(jobsRespObj[i].jobMode);
                    row.jobAddress         = custom.nullChecker(jobsRespObj[i].jobAddress);
                    row.jobLatitude        = custom.nullChecker(jobsRespObj[i].jobLatitude);
                    row.jobLongitude       = custom.nullChecker(jobsRespObj[i].jobLongitude);
                    row.jobStartDate       = custom.changeDateFormat(jobsRespObj[i].jobStartDate,'yyyy-mm-dd');
                    row.jobEndDate         = custom.changeDateFormat(jobsRespObj[i].jobEndDate,'yyyy-mm-dd');
                    row.jobPaymentMethod   = custom.nullChecker(jobsRespObj[i].jobPaymentMethod);
                    row.jobAgreedAmount    = parseInt(jobsRespObj[i].jobAgreedAmount);
                    row.jobAdvanceAmount   = parseInt(jobsRespObj[i].jobAdvanceAmount);
                    row.jobHireDateTime    = custom.changeDateFormat(jobsRespObj[i].jobHireDateTime);
                    row.jobGlobalStatus    = custom.nullChecker(jobsRespObj[i].jobGlobalStatus);
                    row.jobAcceptStatus    = custom.nullChecker(jobsRespObj[i].jobAcceptStatus);
                    row.jobDisputed        = parseInt(jobsRespObj[i].jobDisputed);
                	responseObj.push(row);
                	if (i === parseInt(jobsRespObj.length - 1)) {
                      return res.send({
						            "code": 200,
						            "response": responseObj,
						            "status": 1,
						            "totalCount": totalJobs,
						            "message": custom.lang(locale,"success.")
						        });
                    }
                }
			});
		}	
	});

	/* To get current jobs listing
	 * @param {string}  userLoginSessionKey
	 * @param {integer} pageNo
	 * @param {string}  jobType [MY_JOBS,RECEIVED_JOBS]
	*/
	app.post('/current-jobs/list', function(req, res) {

		let locale = req.headers.locale;
		let timezone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("pageNo").trim();
		req.sanitize("jobType").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('pageNo', custom.lang(locale,'Require page number')).notEmpty();
	    req.check('pageNo', custom.lang(locale,'Page number minimum value should be 1')).minValue(1);
	    req.check('jobType', custom.lang(locale,'The Job type field is required')).notEmpty();
	    req.check('jobType', custom.lang(locale,'Job type should be in MY_JOBS, RECEIVED_JOBS')).inList(["MY_JOBS","RECEIVED_JOBS"]);
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
			let jobType               = req.sanitize('jobType').escape().trim();
			let moduleName            = 'PROVIDER';

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

			    	/* To remove duplicate values */
			    	notInUserIds = Array.from(new Set(notInUserIds));

			    	/* To get offset */
			    	let offset = custom.getOffset(pageNo);

			    	/* To get jobs data */
			    	if(jobType === 'RECEIVED_JOBS'){
			    		var jobQuery = "SELECT * FROM " + constant.jobs + " AS `J` INNER JOIN " + constant.user_details + " AS `UD` ON `UD`.`userId` = `J`.`jobProviderUserID` WHERE `UD`.`userId` = " + masterUserId + " AND `J`.`jobGlobalStatus` IN ('PENDING') AND `J`.`jobAcceptStatus` IN ('ACCEPT') AND `UD`.`userId` NOT IN (" + notInUserIds.join() + ") GROUP BY `J`.`jobID` ORDER BY `J`.`jobID` DESC ";
			    	}else{
			    		var jobQuery = "SELECT * FROM " + constant.jobs + " AS `J` INNER JOIN " + constant.user_details + " AS `UD` ON `UD`.`userId` = `J`.`jobHirerUserID` WHERE `UD`.`userId` = " + masterUserId + " AND `J`.`jobGlobalStatus` IN ('PENDING') AND `UD`.`userId` NOT IN (" + notInUserIds.join() + ") GROUP BY `J`.`jobID` ORDER BY `J`.`jobID` DESC ";
			    	}
			    	model.customQuery(function(err,jobsObj){
			    		if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	let totalJobs = parseInt(jobsObj.length);
		                	if(offset > 0){
					    		jobQuery += "LIMIT " + offset + "," + constant.results_limit;
					    	}else{
					    		jobQuery += "LIMIT " + constant.results_limit
					    	}
					        model.customQuery(function(err,jobsRespObj){
					        	if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(jobsRespObj != ""){
				                		callback(null, userDetailsObj, jobsRespObj,totalJobs);
				                	}else{
				                		return res.send({
										            "code": 200,
										            "response": [],
										            "status": 0,
										            "message": custom.lang(locale,"Current jobs not found.")
										        });
				                	}
				                }
					        },jobQuery);
		                }
		            },jobQuery);
			    }
			], function (err,userDetailsObj,jobsRespObj,totalJobs) {
				let masterUserId = parseInt(userDetailsObj[0].masterUserId);
				let responseObj  = [];
				for (var i = 0; i < parseInt(jobsRespObj.length); i++) 
                {
                	let row = {};
                	row.jobTitle           = custom.nullChecker(jobsRespObj[i].jobTitle);
                    row.jobDescprition     = custom.nullChecker(jobsRespObj[i].jobDescprition);
                    row.jobID              = parseInt(jobsRespObj[i].jobID);
                    row.jobCustomID        = custom.nullChecker(jobsRespObj[i].jobCustomID);
                    row.jobMode            = custom.nullChecker(jobsRespObj[i].jobMode);
                    row.jobAddress         = custom.nullChecker(jobsRespObj[i].jobAddress);
                    row.jobLatitude        = custom.nullChecker(jobsRespObj[i].jobLatitude);
                    row.jobLongitude       = custom.nullChecker(jobsRespObj[i].jobLongitude);
                    row.jobStartDate       = custom.changeDateFormat(jobsRespObj[i].jobStartDate,'yyyy-mm-dd');
                    row.jobEndDate         = custom.changeDateFormat(jobsRespObj[i].jobEndDate,'yyyy-mm-dd');
                    row.jobPaymentMethod   = custom.nullChecker(jobsRespObj[i].jobPaymentMethod);
                    row.jobAgreedAmount    = parseInt(jobsRespObj[i].jobAgreedAmount);
                    row.jobAdvanceAmount   = parseInt(jobsRespObj[i].jobAdvanceAmount);
                    row.jobHireDateTime    = custom.changeDateFormat(jobsRespObj[i].jobHireDateTime);
                    row.jobGlobalStatus    = custom.nullChecker(jobsRespObj[i].jobGlobalStatus);
                    row.jobAcceptStatus    = custom.nullChecker(jobsRespObj[i].jobAcceptStatus);
                    row.jobDisputed        = parseInt(jobsRespObj[i].jobDisputed);
                	responseObj.push(row);
                	if (i === parseInt(jobsRespObj.length - 1)) {
                      return res.send({
						            "code": 200,
						            "response": responseObj,
						            "status": 1,
						            "totalCount": totalJobs,
						            "message": custom.lang(locale,"success.")
						        });
                    }
                }
			});
		}	
	});

	/* To cancel a job
	 * @param {string}  userLoginSessionKey
	 * @param {integer} jobID
	 * @param {string}  jobCancelReason
	*/
	app.post('/job/cancel', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
    	req.sanitize("userLoginSessionKey").trim();
    	req.sanitize("jobID").trim();
    	req.sanitize("jobCancelReason").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('jobID', custom.lang(locale,'The Job id field is required')).notEmpty();
	    req.check('jobCancelReason', custom.lang(locale,'The Job cancel reason field is required')).notEmpty();
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
	    	let jobID                = parseInt(req.sanitize('jobID').escape().trim());
	    	let jobCancelReason      = req.sanitize('jobCancelReason').escape().trim();
			
			async.waterfall([
			    function(callback) {
			        /* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							let masterUserId = parseInt(respObj[0].masterUserId);

							/* Validate Job ID */
							model.getAllWhere(function(err,jobResp){
								if (err) {
		                            return res.send(custom.dbErrorResponse());
		                        }else{
		                        	if(jobResp != ""){
		                        		let allowedUsers = new Array();
		                        		allowedUsers.push(jobResp[0].jobHirerUserID);
		                        		allowedUsers.push(jobResp[0].jobProviderUserID);

		                        		if(jobResp[0].jobGlobalStatus == 'COMPLETED'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already completed.') 
											        });
		                        		}else if(jobResp[0].jobGlobalStatus == 'DISPUTE'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already disputed.') 
											        });
		                        		}else if(jobResp[0].jobGlobalStatus == 'CANCELED'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already in cancellation mode.') 
											        });
		                        		}else if(jobResp[0].jobGlobalStatus == 'MUTUALLY_CANCELED'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already cancelled.') 
											        });
		                        		}else if(allowedUsers.indexOf(masterUserId) < 0){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'You can not cancel this job.') 
											        });
		                        		}else{
		                        			/* Check user is already blocked */
											custom.isUserBlocked(function(respType,blockResp){
												if(respType === 0){
													return res.send(blockResp);
												}else if(respType === 1){
													return res.send({
												                        "code": 200,
												                        "response": {},
												                        "status": 0,
												                        "message": custom.lang(locale,'You can not cancel this job.')
												                    });
												}else{
													if(jobResp[0].jobAcceptStatus === 'ACCEPT'){

														/* Get Payment distribution details */
														model.getAllWhere(function(err,paymentDetails){
															if (err) {
										                        return res.send(custom.dbErrorResponse());
										                    }else{
										                    	if(paymentDetails != ""){

																	/* Get milestone details */
																	model.getAllWhere(function(err,milestoneDetails){
																		if (err) {
												                            return res.send(custom.dbErrorResponse());
												                        }else{
												                        	if(jobResp[0].jobPaymentMethod === 'FROZEN' || jobResp[0].jobPaymentMethod === 'ADVANCE_AND_FROZEN'){
												                        		if(milestoneDetails != ""){
												                        			callback(null, respObj,jobResp,paymentDetails,milestoneDetails);
												                        		}else{
												                        			return res.send({
																			                        "code": 200,
																			                        "response": {},
																			                        "status": 0,
																			                        "message": custom.lang(locale,'Job milestone details not found.')
																			                    });
												                        		}
												                        	}else{
																				callback(null, respObj,jobResp,paymentDetails,milestoneDetails);
												                        	}
												                        }
																	},constant.milestones,{milestoneJobID:jobID});
										                    	}else{
										                    		return res.send({
													                        "code": 200,
													                        "response": {},
													                        "status": 0,
													                        "message": custom.lang(locale,'Job details not found.')
													                    });
										                    	}
										                    }
														},constant.jobs_payment_distribution,{jobParentID:jobID});
													}else{
														callback(null, respObj,jobResp,[],[]);
													}
												}
											},masterUserId,parseInt(jobResp[0].jobProviderUserID));
		                        		}
		                        	}else{
		                        		return  res.send({
										            "code": 200,
										            "response": {},
										            "status": 0,
										            "message":custom.lang(locale,'Invalid Job ID.') 
										        });
		                        	}
		                        }
							},constant.jobs,{jobID:jobID});
						}
					},userLoginSessionKey,timezone);
			    }
			], function (err, userDetailsObj,jobResp, paymentDetails, milestoneDetails) {
				
				/* Get Job Accept Status */
				let jobAcceptStatus = jobResp[0].jobAcceptStatus;
				let cancellationFeesPercent  = 0;
				let cancellationFeesAmount   = 0;
				let jobPaidAmount            = 0;
				let jobCancelRemainingAmount = 0;
				let jobAgreedAmount = custom.parseNumber(jobResp[0].jobAgreedAmount);
				if(jobAcceptStatus === 'ACCEPT'){ // ACCEPT

					/* Get fees cancellation charges */
			    	let moment = require('moment');
			    	let jobStartDate = custom.changeDateFormat(jobResp[0].jobStartDate,'yyyy-mm-dd');
			    	let currentDate  = custom.changeDateFormat(custom.getCurrentTime(),'yyyy-mm-dd');
			    	let jobStartDateObj = moment(jobStartDate,'YYYY-M-DD')
			        let currentDateObj  = moment(currentDate, 'YYYY-M-DD')
			        let daysDiff        = jobStartDateObj.diff(currentDateObj, 'days');
			        if(daysDiff <= 3 && daysDiff > 1){
			        	cancellationFeesPercent = 25;
			        	cancellationFeesAmount  = custom.parseNumber((jobAgreedAmount * 25) / 100);
			        }else if(daysDiff <= 1){
			        	cancellationFeesPercent = 35;
			        	cancellationFeesAmount  = custom.parseNumber((jobAgreedAmount * 35) / 100);
			        }
		        	if(jobResp[0].jobPaymentMethod === 'FROZEN'){
		        		for (var i = 0; i < parseInt(milestoneDetails.length); i++) 
		        		{
		        			if(milestoneDetails[i].milestoneStatus === 'PAID')
		        			{
		        				jobPaidAmount += milestoneDetails[i].milestoneAmount;
		        			}
		        		}
		        	}else if(jobResp[0].jobPaymentMethod === 'ADVANCE_AND_FROZEN'){
		        		jobPaidAmount += jobResp[0].jobAdvanceAmount;

		        		for (var i = 0; i < parseInt(milestoneDetails.length); i++) 
		        		{
		        			if(milestoneDetails[i].milestoneStatus === 'PAID')
		        			{
		        				jobPaidAmount += milestoneDetails[i].milestoneAmount;
		        			}
		        		}
		        	}else if(jobResp[0].jobPaymentMethod === 'ADVANCE'){
		        		jobPaidAmount += jobResp[0].jobAdvanceAmount;
		        	}
		        	jobCancelRemainingAmount = jobAgreedAmount - jobPaidAmount;
			        if(daysDiff <= 3 && (cancellationFeesPercent === 0 || cancellationFeesAmount === 0))
			        {
			        	return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message":custom.lang(locale,'Unable to cancel this job') 
							        });
			        }
				}

				let masterUserId = parseInt(userDetailsObj[0].userId);
				let friendID = '';
				if(masterUserId == jobResp[0].jobHirerUserID){
					friendID = jobResp[0].jobProviderUserID;
				}else{
					friendID = jobResp[0].jobHirerUserID;
				}
			    
			    database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Insert job cancel data */	   
						let jobCancelObj = {};
						jobCancelObj.jobCancelUserID          = masterUserId;
						jobCancelObj.jobParentID              = jobID;
						jobCancelObj.jobCancelReason          = jobCancelReason;
						jobCancelObj.jobCancelFeesPercent     = cancellationFeesPercent;
						jobCancelObj.jobCancelFeesAmount      = cancellationFeesAmount;
						jobCancelObj.jobPaidAmount            = jobPaidAmount;
						jobCancelObj.jobCancelRemainingAmount = jobCancelRemainingAmount;
						jobCancelObj.jobCancelDatetime        = custom.getCurrentTime();
						console.log('jobCancelObj',jobCancelObj);
                        let i1 = queryBuilder.insert(constant.job_cancel,jobCancelObj);
                        queryBuilder.reset_query(i1);
                        connection.query(i1, function(err, jobCancelResp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }
	                        if(!jobCancelResp){
	                        	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Failed to cancel a job.')
									        });
	                        }

	                    let newJobGlobalStatus = '';
	                    let notificationType   = '';
	                    let notificationMsg    = '';
	                    let apiMessage         = '';
	                    if(jobAcceptStatus === 'ACCEPT'){
	                    	newJobGlobalStatus = 'CANCELED';
	                    	notificationType   = 'MUTUALLY_CANCEL_JOB';
	                    	notificationMsg    = 'would like to cancel the Job, are you agree to cancel the Job?';
	                    	apiMessage         = 'Job cancel request successfully sent';
	                    }else if(jobAcceptStatus === 'PENDING'){ // PENDING
							newJobGlobalStatus = 'MUTUALLY_CANCELED';
	                    	notificationType   = 'CANCEL_JOB';
	                    	notificationMsg    = 'has cancelled a job';
	                    	apiMessage         = 'Job cancelled successfully';
						}

	                    /* Update job cancel status */	   
                        let u1 = queryBuilder.update(constant.jobs,{jobGlobalStatus:newJobGlobalStatus},{jobID:jobID});
                        queryBuilder.reset_query(u1);
                        connection.query(u1, function(err, jobUpdateResp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }
	                        if(!jobUpdateResp){
	                        	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Failed to cancel a job.')
									        });
	                        }

	                    if(jobAcceptStatus === 'PENDING')
	                    { 
		                    /* Update user amount (Deduct cancellation fees) */
	                        let u2 = "UPDATE (`"+constant.user_details+"`) SET `userWalletHoldAmount` = userWalletHoldAmount - " + jobAgreedAmount + ", `userWalletAmount` = userWalletAmount + " + jobAgreedAmount + " WHERE `userId` = " + masterUserId;
	                        queryBuilder.reset_query(u2);
	                        connection.query(u2, function(err, resp) {
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
                                
	                            /* Insert job cancel notification */
							   	let notificationDataObj = {};
		                		notificationDataObj.notificationUserId   = masterUserId;
		                		notificationDataObj.notificationFriendId = friendID;
		                		notificationDataObj.jobModuleID          = jobID;
		                		notificationDataObj.notificationModule   = 'PROVIDER';
		                		notificationDataObj.notificationType     = notificationType;
		                		notificationDataObj.notificationMessage  = notificationMsg;
		                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
		                		model.insertData(function(err,notificationResp){
	                            	if(err){
	                            		console.log('Cancel job app notification error',err);
	                            	}else{
	                            		console.log('Cancel job app notification success');
	                            	}
	                            },constant.notifications,notificationDataObj);

	                            /* Update user badges */
	                            let updateQuery = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + friendID;
	                            model.customQuery(function(err,badgesResp){
	                            	if(err){
	                            		console.log('Cancel job app notification badges error',err);
	                            	}else{
	                            		console.log('Cancel job app notification badges success');
	                            	}
	                            },updateQuery);

	                            /* To send push notifications */
	                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " " + notificationMsg;
	                            let extraParams = {};
	                            extraParams.jobModuleID       = jobID;
	                            extraParams.jobHirerUserID    = jobResp[0].jobHirerUserID;
	                            extraParams.jobProviderUserID = jobResp[0].jobProviderUserID;
	                            extraParams.moduleName        = 'PROVIDER';
	                            extraParams.notificationType  = notificationType;
	                            notification.sendPushNotifications(userMessage,friendID,extraParams);

	                            if(jobAcceptStatus === 'PENDING')
	                    		{ 
	                    			/* Get hirer details */
	                    			model.getAllWhere(function(err,hirerDetails){
	                    				if(err){
	                                        console.log('error hire details');
	                                    }else{
	                                    	if(hirerDetails != "")
	                                    	{
	                                    		/* Insert wallet data (Hold Amount + Main Amount) */       
				                                let walletObj = [];
				                                let walletHold1Obj = {};
				                                let walletMain1Obj = {};
				                                let currentBalance1 = custom.parseNumber(hirerDetails[0].userWalletAmount);
				                                let currentBalance2 = custom.parseNumber(hirerDetails[0].userWalletAmount + jobAgreedAmount);

				                                /* Deduct hold amount */
				                                walletHold1Obj.walletUserID          = jobResp[0].jobHirerUserID;
				                                walletHold1Obj.walletAmount          = jobAgreedAmount;
				                                walletHold1Obj.walletRemainingAmount = currentBalance1;
				                                walletHold1Obj.walletTxnType         = 'NONE';
				                                walletHold1Obj.walletTxnReason       = 'JOB_CANCEL_HOLD_AMOUNT';
				                                walletHold1Obj.walletTxnID           = custom.generateCustomID('QL');
				                                walletHold1Obj.walletTxnStatus       = 'COMPLETED';
				                                walletHold1Obj.walletTxnDateTime     = custom.getCurrentTime();
				                                walletHold1Obj.walletExtraParams     = JSON.stringify({jobID:jobID});
				                                walletHold1Obj.walletExtraParams     = JSON.stringify({jobID:jobID,walletTypeAccount:'HOLD_AC',walletAccountTxnType:'DEDUCT'});
				                                walletObj.push(walletHold1Obj);

				                                /* Add Job Cancel Amount */
				                                walletMain1Obj.walletUserID          = jobResp[0].jobHirerUserID;
				                                walletMain1Obj.walletAmount          = jobAgreedAmount;
				                                walletMain1Obj.walletRemainingAmount = currentBalance2;
				                                walletMain1Obj.walletTxnType         = 'ADDED';
				                                walletMain1Obj.walletTxnReason       = 'JOB_CANCEL_AMOUNT';
				                                walletMain1Obj.walletTxnID           = custom.generateCustomID('QL');
				                                walletMain1Obj.walletTxnStatus       = 'COMPLETED';
				                                walletMain1Obj.walletTxnDateTime     = custom.getCurrentTime();
				                                walletMain1Obj.walletExtraParams     = JSON.stringify({jobID:jobID,walletTypeAccount:'MAIN_AC',walletAccountTxnType:'ADDED'});
				                                walletObj.push(walletMain1Obj);

				                                model.insertBulkData(function(err,resp){
				                                    if(err){
				                                        console.log('Failed to add wallet transactions');
				                                    }
				                                },constant.wallet,walletObj);
	                                    	}
	                                    }
	                    			},constant.user_details,{userId:jobResp[0].jobHirerUserID});

		                            /* Manage admin report */
	                                let reportObj = {};
	                                reportObj.reportUserID = jobResp[0].jobHirerUserID;
	                                reportObj.reportAmount = jobAgreedAmount;
	                                reportObj.reportAmountType  = 0;
	                                reportObj.reportModuleName  = 'CANCEL_JOB';
	                                reportObj.reportExtraParams = JSON.stringify({jobID:jobID});
	                                reportObj.reportDateTime    = custom.getCurrentTime();
	                                model.insertData(function(err,resp){
	                                    if(err){
	                                        console.log('Failed to add reports');
	                                    }
	                                },constant.reports,reportObj);
	                            }

	                            /* Return user response */
			            		return res.send({"code" : 200, "response" : {jobModuleID:jobID},"status" : 1,"message" : custom.lang(locale,apiMessage)});
	                        }
                    	});
                    	});
                    	});
                	});
				}); 

			});	        
	    }
	});

	/* To respond on a cancel job
	 * @param {string}  userLoginSessionKey
	 * @param {integer} jobID
	 * @param {string}  responseType [YES/NO]
	*/
	app.post('/job/respond-on-cancel', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
    	req.sanitize("userLoginSessionKey").trim();
    	req.sanitize("jobID").trim();
    	req.sanitize("responseType").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('jobID', custom.lang(locale,'The Job id field is required')).notEmpty();
	    req.check('responseType', custom.lang(locale,'The Job cancel response type field is required')).notEmpty();
	    req.check('responseType', custom.lang(locale,'Job cancel response type should be in YES Or NO')).inList(["YES","NO"]);
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
	    	let jobID                = parseInt(req.sanitize('jobID').escape().trim());
	    	let responseType         = req.sanitize('responseType').escape().trim();
			
			async.waterfall([
			    function(callback) {
			        /* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							let masterUserId = parseInt(respObj[0].masterUserId);

							/* Validate Job ID */
							model.getAllWhere(function(err,jobResp){
								if (err) {
		                            return res.send(custom.dbErrorResponse());
		                        }else{
		                        	if(jobResp != ""){
		                        		let allowedUsers = new Array();
		                        		allowedUsers.push(jobResp[0].jobHirerUserID);
		                        		allowedUsers.push(jobResp[0].jobProviderUserID);

		                        		if(jobResp[0].jobGlobalStatus == 'COMPLETED'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already completed.') 
											        });
		                        		}else if(jobResp[0].jobGlobalStatus == 'DISPUTE'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already disputed.') 
											        });
		                        		}else if(jobResp[0].jobGlobalStatus == 'MUTUALLY_CANCELED'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already cancelled.') 
											        });
		                        		}else if(allowedUsers.indexOf(masterUserId) < 0){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'You can not cancel this job.') 
											        });
		                        		}else if(jobResp[0].jobGlobalStatus == 'CANCELED' && jobResp[0].jobAcceptStatus === 'ACCEPT'){
		                        			/* Check user is already blocked */
											custom.isUserBlocked(function(respType,blockResp){
												if(respType === 0){
													return res.send(blockResp);
												}else if(respType === 1){
													return res.send({
												                        "code": 200,
												                        "response": {},
												                        "status": 0,
												                        "message": custom.lang(locale,'You can not cancel this job.')
												                    });
												}else{
													if(responseType === 'NO'){
														callback(null, respObj,jobResp,[]);
													}else{

														/* Get Payment distribution details */
														model.getAllWhere(function(err,paymentDetails){
															if (err) {
										                        return res.send(custom.dbErrorResponse());
										                    }else{
										                    	if(paymentDetails != ""){
										                    		callback(null, respObj,jobResp,paymentDetails);
										                    	}else{
										                    		return res.send({
													                        "code": 200,
													                        "response": {},
													                        "status": 0,
													                        "message": custom.lang(locale,'Job details not found.')
													                    });
										                    	}
										                    }
														},constant.job_cancel,{jobParentID:jobID});
													}
												}
											},masterUserId,parseInt(jobResp[0].jobProviderUserID));
		                        		}else{
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Failed, please try again') 
											        });
		                        		}
		                        	}else{
		                        		return  res.send({
										            "code": 200,
										            "response": {},
										            "status": 0,
										            "message":custom.lang(locale,'Invalid Job ID.') 
										        });
		                        	}
		                        }
							},constant.jobs,{jobID:jobID});
						}
					},userLoginSessionKey,timezone);
			    }
			], function (err, userDetailsObj,jobResp, paymentDetails) {
				
				/* Get Job Accept Status */
				let jobAcceptStatus = jobResp[0].jobAcceptStatus;
				let masterUserId = parseInt(userDetailsObj[0].userId);
				let friendID = '';
				if(masterUserId == jobResp[0].jobHirerUserID){
					friendID = jobResp[0].jobProviderUserID;
				}else{
					friendID = jobResp[0].jobHirerUserID;
				}
			    
			    if(responseType === 'NO'){

			    	database.pool.getConnection(function(err, connection) {

				   		/* Begin transaction */
	                    connection.beginTransaction(function(err) {
	                        if (err) {
	                            return res.send(custom.dbErrorResponse());
	                        }

		                    /* Update job cancel status */	   
	                        let u1 = queryBuilder.update(constant.jobs,{jobGlobalStatus:'PENDING'},{jobID:jobID});
	                        queryBuilder.reset_query(u1);
	                        connection.query(u1, function(err, jobUpdateResp) {
		                        if (err) {
		                            connection.rollback(function() {
		                                return res.send(custom.dbErrorResponse(err.sqlMessage));
		                            });
		                        }
		                        if(!jobUpdateResp){
		                        	return res.send({
										            "code": 200,
										            "response": {},
										            "status": 0,
										            "message": custom.lang(locale,'Failed to cancel a job.')
										        });
		                        }

		                    /* Delete cancel entry */
	                        let d1 = queryBuilder.delete(constant.job_cancel,{jobParentID:jobID});
	                        queryBuilder.reset_query(d1);
	                        connection.query(d1, function(err, deleteResp) {
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

		                            model.updateData(function(err,updateResp){
		                            	if(err){
		                            		console.log('update cancel job app notification error',err);
		                            	}else{
		                            		console.log('update cancel job app notification success');
		                            	}
		                            },constant.notifications,{notificationType:'MUTUALLY_CANCEL_JOB_REJECTED'},{jobModuleID:jobID,notificationType:'MUTUALLY_CANCEL_JOB'});
	                                
		                            /* Insert job cancel notification */
								   	let notificationDataObj = {};
			                		notificationDataObj.notificationUserId   = masterUserId;
			                		notificationDataObj.notificationFriendId = friendID;
			                		notificationDataObj.jobModuleID          = jobID;
			                		notificationDataObj.notificationModule   = 'PROVIDER';
			                		notificationDataObj.notificationType     = 'REJECT_CANCEL_JOB';
			                		notificationDataObj.notificationMessage  = 'rejected cancel job request';
			                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
			                		model.insertData(function(err,notificationResp){
		                            	if(err){
		                            		console.log('Cancel job app notification error',err);
		                            	}else{
		                            		console.log('Cancel job app notification success');
		                            	}
		                            },constant.notifications,notificationDataObj);

		                            /* Update user badges */
		                            let updateQuery = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + friendID;
		                            model.customQuery(function(err,badgesResp){
		                            	if(err){
		                            		console.log('Cancel job app notification badges error',err);
		                            	}else{
		                            		console.log('Cancel job app notification badges success');
		                            	}
		                            },updateQuery);

		                            /* To send push notifications */
		                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " rejected cancel job request" ;
		                            let extraParams = {};
		                            extraParams.jobModuleID       = jobID;
		                            extraParams.jobHirerUserID    = jobResp[0].jobHirerUserID;
		                            extraParams.jobProviderUserID = jobResp[0].jobProviderUserID;
		                            extraParams.moduleName        = 'PROVIDER';
		                            extraParams.notificationType  = 'REJECT_CANCEL_JOB';
		                            notification.sendPushNotifications(userMessage,friendID,extraParams);

		                            /* Return user response */
				            		return res.send({"code" : 200, "response" : {jobModuleID:jobID},"status" : 1,"message" : custom.lang(locale,'Cancel job request rejected successfully')});
		                        }
	                    	});
	                    	});
	                    	});
	                	});
					}); 
			    }else{
			    	database.pool.getConnection(function(err, connection) {

				   		/* Begin transaction */
	                    connection.beginTransaction(function(err) {
	                        if (err) {
	                            return res.send(custom.dbErrorResponse());
	                        }

		                    /* Update job cancel status */	   
	                        let u1 = queryBuilder.update(constant.jobs,{jobGlobalStatus:'MUTUALLY_CANCELED'},{jobID:jobID});
	                        queryBuilder.reset_query(u1);
	                        connection.query(u1, function(err, jobUpdateResp) {
		                        if (err) {
		                            connection.rollback(function() {
		                                return res.send(custom.dbErrorResponse(err.sqlMessage));
		                            });
		                        }
		                        if(!jobUpdateResp){
		                        	return res.send({
										            "code": 200,
										            "response": {},
										            "status": 0,
										            "message": custom.lang(locale,'Failed to cancel a job.')
										        });
		                        }

		                    /* Update job cancel status */	   
	                        let u2 = queryBuilder.update(constant.job_cancel,{jobCancelStatus:'CANCELLED',jobCancelResponseDatetime:custom.getCurrentTime()},{jobParentID:jobID});
	                        queryBuilder.reset_query(u2);
	                        connection.query(u2, function(err, jobCancelUpdateResp) {
		                        if (err) {
		                            connection.rollback(function() {
		                                return res.send(custom.dbErrorResponse(err.sqlMessage));
		                            });
		                        }
		                        if(!jobCancelUpdateResp){
		                        	return res.send({
										            "code": 200,
										            "response": {},
										            "status": 0,
										            "message": custom.lang(locale,'Failed to cancel a job.')
										        });
		                        }

		                    /* Update user amount (Deduct cancellation fees) */
		                    let jobHirerID = jobResp[0].jobHirerUserID;
	                        let u3 = "UPDATE (`"+constant.user_details+"`) SET `userWalletAmount` = userWalletAmount - " + paymentDetails[0].jobCancelFeesAmount + ", `userWalletAmount` = userWalletAmount + " + paymentDetails[0].jobCancelRemainingAmount + " WHERE `userId` = " + jobHirerID;
	                        queryBuilder.reset_query(u3);
	                        connection.query(u3, function(err, resp) {
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

		                            model.updateData(function(err,updateResp){
		                            	if(err){
		                            		console.log('update cancel job app notification error',err);
		                            	}else{
		                            		console.log('update cancel job app notification success');
		                            	}
		                            },constant.notifications,{notificationType:'MUTUALLY_CANCEL_JOB_ACCEPTED'},{jobModuleID:jobID,notificationType:'MUTUALLY_CANCEL_JOB'});
	                                
		                            /* Insert job cancel notification */
								   	let notificationDataObj = {};
			                		notificationDataObj.notificationUserId   = masterUserId;
			                		notificationDataObj.notificationFriendId = friendID;
			                		notificationDataObj.jobModuleID          = jobID;
			                		notificationDataObj.notificationModule   = 'PROVIDER';
			                		notificationDataObj.notificationType     = 'ACCEPT_CANCEL_JOB';
			                		notificationDataObj.notificationMessage  = 'accepted cancel job request';
			                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
			                		model.insertData(function(err,notificationResp){
		                            	if(err){
		                            		console.log('Cancel job app notification error',err);
		                            	}else{
		                            		console.log('Cancel job app notification success');
		                            	}
		                            },constant.notifications,notificationDataObj);

		                            /* Update user badges */
		                            let updateQuery = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + friendID;
		                            model.customQuery(function(err,badgesResp){
		                            	if(err){
		                            		console.log('Cancel job app notification badges error',err);
		                            	}else{
		                            		console.log('Cancel job app notification badges success');
		                            	}
		                            },updateQuery);

		                            /* To send push notifications */
		                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " accepted cancel job request" ;
		                            let extraParams = {};
		                            extraParams.jobModuleID       = jobID;
		                            extraParams.jobHirerUserID    = jobResp[0].jobHirerUserID;
		                            extraParams.jobProviderUserID = jobResp[0].jobProviderUserID;
		                            extraParams.moduleName        = 'PROVIDER';
		                            extraParams.notificationType  = 'ACCEPT_CANCEL_JOB';
		                            notification.sendPushNotifications(userMessage,friendID,extraParams);

		                            /* Get hirer details */
	                    			model.getAllWhere(function(err,hirerDetails){
	                    				if(err){
	                                        console.log('error hire details');
	                                    }else{
	                                    	if(hirerDetails != "")
	                                    	{
	                                    		/* Insert wallet data (Hold Amount + Main Amount) */       
				                                let walletObj = [];
				                                let walletHold1Obj = {};
				                                let walletMain1Obj = {};
				                                let currentBalance1 = custom.parseNumber(hirerDetails[0].userWalletAmount - paymentDetails[0].jobCancelFeesAmount);
				                                let currentBalance2 = custom.parseNumber(currentBalance1 + paymentDetails[0].jobCancelRemainingAmount);

				                                /* Deduct cancel fees amount */
				                                if(paymentDetails[0].jobCancelFeesAmount > 0)
				                                {
				                                	walletHold1Obj.walletUserID          = jobResp[0].jobHirerUserID;
					                                walletHold1Obj.walletAmount          = paymentDetails[0].jobCancelFeesAmount;
					                                walletHold1Obj.walletRemainingAmount = currentBalance1;
					                                walletHold1Obj.walletTxnType         = 'DEDUCT';
					                                walletHold1Obj.walletTxnReason       = 'JOB_CANCEL_FEE_AMOUNT';
					                                walletHold1Obj.walletTxnID           = custom.generateCustomID('QL');
					                                walletHold1Obj.walletTxnStatus       = 'COMPLETED';
					                                walletHold1Obj.walletTxnDateTime     = custom.getCurrentTime();
					                                walletHold1Obj.walletExtraParams     = JSON.stringify({jobID:jobID});
					                                walletHold1Obj.walletExtraParams     = JSON.stringify({jobID:jobID,walletTypeAccount:'MAIN_AC',walletAccountTxnType:'DEDUCT'});
					                                walletObj.push(walletHold1Obj);
				                                }
				                                
				                                /* Add Job Cancel Amount */
				                                if(paymentDetails[0].jobCancelRemainingAmount > 0)
				                                {
				                                	walletMain1Obj.walletUserID          = jobResp[0].jobHirerUserID;
					                                walletMain1Obj.walletAmount          = paymentDetails[0].jobCancelRemainingAmount;
					                                walletMain1Obj.walletRemainingAmount = currentBalance2;
					                                walletMain1Obj.walletTxnType         = 'ADDED';
					                                walletMain1Obj.walletTxnReason       = 'JOB_CANCEL_REMAINING_AMOUNT';
					                                walletMain1Obj.walletTxnID           = custom.generateCustomID('QL');
					                                walletMain1Obj.walletTxnStatus       = 'COMPLETED';
					                                walletMain1Obj.walletTxnDateTime     = custom.getCurrentTime();
					                                walletMain1Obj.walletExtraParams     = JSON.stringify({jobID:jobID,walletTypeAccount:'MAIN_AC',walletAccountTxnType:'ADDED'});
					                                walletObj.push(walletMain1Obj);
				                                }
				                                
				                                if(walletObj != "")
				                                {
				                                	model.insertBulkData(function(err,resp){
					                                    if(err){
					                                        console.log('Failed to add wallet transactions');
					                                    }
					                                },constant.wallet,walletObj);
				                                }
	                                    	}
	                                    }
	                    			},constant.user_details,{userId:jobResp[0].jobHirerUserID});

		                            /* Manage admin report */
		                            if(paymentDetails[0].jobCancelFeesAmount > 0)
				                    {
		                                let reportObj = {};
		                                reportObj.reportUserID = jobResp[0].jobHirerUserID;
		                                reportObj.reportAmount = paymentDetails[0].jobCancelFeesAmount;
		                                reportObj.reportAmountType  = 1;
		                                reportObj.reportModuleName  = 'JOB_CANCEL_FEE_AMOUNT';
		                                reportObj.reportExtraParams = JSON.stringify({jobID:jobID});
		                                reportObj.reportDateTime    = custom.getCurrentTime();
		                                model.insertData(function(err,resp){
		                                    if(err){
		                                        console.log('Failed to add reports');
		                                    }
		                                },constant.reports,reportObj);
		                            }

		                            if(paymentDetails[0].jobCancelRemainingAmount > 0)
				                    {
		                                let reportObj2 = {};
		                                reportObj2.reportUserID = jobResp[0].jobHirerUserID;
		                                reportObj2.reportAmount = paymentDetails[0].jobCancelRemainingAmount;
		                                reportObj2.reportAmountType  = 0;
		                                reportObj2.reportModuleName  = 'JOB_CANCEL_REMAINING_AMOUNT';
		                                reportObj2.reportExtraParams = JSON.stringify({jobID:jobID});
		                                reportObj2.reportDateTime    = custom.getCurrentTime();
		                                model.insertData(function(err,resp){
		                                    if(err){
		                                        console.log('Failed to add reports');
		                                    }
		                                },constant.reports,reportObj2);
		                            }

		                            /* Return user response */
				            		return res.send({"code" : 200, "response" : {jobModuleID:jobID},"status" : 1,"message" : custom.lang(locale,'Cancel job request accepted successfully')});
		                        }
	                    	});
	                    	});
	                    	});
	                    	});
	                	});
					});
			    }
			});	        
	    }
	});

	/* To dispute a job
	 * @param {string}  userLoginSessionKey
	 * @param {integer} jobID
	 * @param {string}  jobDisputeReason
	*/
	app.post('/job/dispute', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
    	req.sanitize("userLoginSessionKey").trim();
    	req.sanitize("jobID").trim();
    	req.sanitize("jobCancelReason").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('jobID', custom.lang(locale,'The Job id field is required')).notEmpty();
	    req.check('jobDisputeReason', custom.lang(locale,'The Job dispute reason field is required')).notEmpty();
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
	    	let jobID                = parseInt(req.sanitize('jobID').escape().trim());
	    	let jobDisputeReason     = req.sanitize('jobDisputeReason').escape().trim();
			
			async.waterfall([
			    function(callback) {
			        /* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							let masterUserId = parseInt(respObj[0].masterUserId);

							/* Validate Job ID */
							model.getAllWhere(function(err,jobResp){
								if (err) {
		                            return res.send(custom.dbErrorResponse());
		                        }else{
		                        	if(jobResp != ""){
		                        		let allowedUsers = new Array();
		                        		allowedUsers.push(jobResp[0].jobHirerUserID);
		                        		allowedUsers.push(jobResp[0].jobProviderUserID);

		                        		if(jobResp[0].jobGlobalStatus == 'COMPLETED'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already completed.') 
											        });
		                        		}else if(jobResp[0].jobGlobalStatus == 'DISPUTE'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already disputed.') 
											        });
		                        		}else if(jobResp[0].jobAcceptStatus != 'ACCEPT'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job is not accepted by provider.') 
											        });
		                        		}else if(jobResp[0].jobGlobalStatus == 'CANCELED'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already in cancellation mode.') 
											        });
		                        		}else if(jobResp[0].jobGlobalStatus == 'MUTUALLY_CANCELED'){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'Job already cancelled.') 
											        });
		                        		}else if(allowedUsers.indexOf(masterUserId) < 0){
		                        			return  res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message":custom.lang(locale,'You can not dispute on this job.') 
											        });
		                        		}else{
		                        			/* Check user is already blocked */
											custom.isUserBlocked(function(respType,blockResp){
												if(respType === 0){
													return res.send(blockResp);
												}else if(respType === 1){
													return res.send({
												                        "code": 200,
												                        "response": {},
												                        "status": 0,
												                        "message": custom.lang(locale,'You can not dispute on this job.')
												                    });
												}else{

													/* Get Payment distribution details */
													model.getAllWhere(function(err,paymentDetails){
														if (err) {
								                            return res.send(custom.dbErrorResponse());
								                        }else{
								                        	if(paymentDetails != ""){

																/* Get milestone details */
																model.getAllWhere(function(err,milestoneDetails){
																	if (err) {
											                            return res.send(custom.dbErrorResponse());
											                        }else{
											                        	if(jobResp[0].jobPaymentMethod === 'FROZEN' || jobResp[0].jobPaymentMethod === 'ADVANCE_AND_FROZEN'){
											                        		if(milestoneDetails != ""){
											                        			callback(null, respObj,jobResp,paymentDetails,milestoneDetails);
											                        		}else{
											                        			return res.send({
																		                        "code": 200,
																		                        "response": {},
																		                        "status": 0,
																		                        "message": custom.lang(locale,'Job milestone details not found.')
																		                    });
											                        		}
											                        	}else{
																			callback(null, respObj,jobResp,paymentDetails,milestoneDetails);
											                        	}
											                        }
																},constant.milestones,{milestoneJobID:jobID});
								                        	}else{
								                        		return res.send({
												                        "code": 200,
												                        "response": {},
												                        "status": 0,
												                        "message": custom.lang(locale,'Job details not found.')
												                    });
								                        	}
								                        }
													},constant.jobs_payment_distribution,{jobParentID:jobID});
												}
											},masterUserId,parseInt(jobResp[0].jobProviderUserID));
		                        		}
		                        	}else{
		                        		return  res.send({
										            "code": 200,
										            "response": {},
										            "status": 0,
										            "message":custom.lang(locale,'Invalid Job ID.') 
										        });
		                        	}
		                        }
							},constant.jobs,{jobID:jobID});
						}
					},userLoginSessionKey,timezone);
			    },
			    function(userDetailsObj,jobResp,paymentDetails,milestoneDetails, callback) {

			    	let jobDisputePaidAmount      = 0;
			    	let jobDisputeRemainingAmount = 0; // Remaining Hold Amount (Not Paid)
			        let jobAgreedAmount = custom.parseNumber(jobResp[0].jobAgreedAmount);
			        if(jobResp[0].jobAcceptStatus == 'ACCEPT')
			        {
			        	if(jobResp[0].jobPaymentMethod === 'FROZEN'){

			        		for (var i = 0; i < parseInt(milestoneDetails.length); i++) 
			        		{
			        			if(milestoneDetails[i].milestoneStatus === 'PAID')
			        			{
			        				jobDisputePaidAmount += milestoneDetails[i].milestoneAmount;
			        			}
			        		}
			        	}else if(jobResp[0].jobPaymentMethod === 'ADVANCE_AND_FROZEN'){
			        		jobDisputePaidAmount += jobResp[0].jobAdvanceAmount;

			        		for (var i = 0; i < parseInt(milestoneDetails.length); i++) 
			        		{
			        			if(milestoneDetails[i].milestoneStatus === 'PAID')
			        			{
			        				jobDisputePaidAmount += milestoneDetails[i].milestoneAmount;
			        			}
			        		}
			        	}else if(jobResp[0].jobPaymentMethod === 'ADVANCE'){
			        		jobDisputePaidAmount += jobResp[0].jobAdvanceAmount;
			        	}
			        	jobDisputeRemainingAmount = jobAgreedAmount - jobDisputePaidAmount;
			        }
			        console.log('jobDisputePaidAmount',jobDisputePaidAmount);
			        console.log('jobDisputeRemainingAmount',jobDisputeRemainingAmount);
			        callback(null, userDetailsObj,jobResp,paymentDetails,milestoneDetails,jobDisputePaidAmount,jobDisputeRemainingAmount,);
			    }
			], function (err, userDetailsObj,jobResp,paymentDetails,milestoneDetails,jobDisputePaidAmount,jobDisputeRemainingAmount,) {
				let masterUserId = parseInt(userDetailsObj[0].userId);
				let friendID = '';
				if(masterUserId == jobResp[0].jobHirerUserID){
					friendID = jobResp[0].jobProviderUserID;
				}else{
					friendID = jobResp[0].jobHirerUserID;
				}
			    
			    database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Delete old entry */
                        let d1 = queryBuilder.delete(constant.job_disputes,{jobParentID:jobID});
                        queryBuilder.reset_query(d1);
                        connection.query(d1, function(err, deleteResp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }

                        /* Insert job dispute data */	   
						let jobDisputeObj = {};
						jobDisputeObj.jobDisputeUserID          = masterUserId;
						jobDisputeObj.jobParentID               = jobID;
						jobDisputeObj.jobDisputeReason          = jobDisputeReason;
						jobDisputeObj.jobDisputePaidAmount      = jobDisputePaidAmount;
						jobDisputeObj.jobDisputeRemainingAmount = jobDisputeRemainingAmount;
						jobDisputeObj.jobDisputeDateTime        = custom.getCurrentTime();
                        let i1 = queryBuilder.insert(constant.job_disputes,jobDisputeObj);
                        queryBuilder.reset_query(i1);
                        connection.query(i1, function(err, jobDisputeResp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }
	                        if(!jobDisputeResp){
	                        	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Failed to dispute a job.')
									        });
	                        }


	                    /* Update job dispute status */	   
                        let u1 = queryBuilder.update(constant.jobs,{jobGlobalStatus:'DISPUTE'},{jobID:jobID});
                        queryBuilder.reset_query(u1);
                        connection.query(u1, function(err, jobUpdateResp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }
	                        if(!jobUpdateResp){
	                        	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Failed to dispute a job.')
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

	                            /* Insert job dispute notification */
							   	let notificationDataObj = {};
		                		notificationDataObj.notificationUserId   = masterUserId;
		                		notificationDataObj.notificationFriendId = friendID;
		                		notificationDataObj.jobModuleID          = jobID;
		                		notificationDataObj.notificationModule   = 'PROVIDER';
		                		notificationDataObj.notificationType     = 'DISPUTE_JOB';
		                		notificationDataObj.notificationMessage  = 'has disputed a job';
		                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
		                		model.insertData(function(err,notificationResp){
	                            	if(err){
	                            		console.log('Dispute job app notification error',err);
	                            	}else{
	                            		console.log('Dispute job app notification success');
	                            	}
	                            },constant.notifications,notificationDataObj);

	                            /* Update user badges */
	                            let updateQuery = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + friendID;
	                            model.customQuery(function(err,badgesResp){
	                            	if(err){
	                            		console.log('Dispute job app notification badges error',err);
	                            	}else{
	                            		console.log('Dispute job app notification badges success');
	                            	}
	                            },updateQuery);

	                            /* To send push notifications */
	                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " has disputed a job";
	                            let extraParams = {};
	                            extraParams.jobModuleID       = jobID;
	                            extraParams.jobHirerUserID    = jobResp[0].jobHirerUserID;
	                            extraParams.jobProviderUserID = jobResp[0].jobProviderUserID;
	                            extraParams.moduleName        = 'PROVIDER';
	                            extraParams.notificationType  = 'DISPUTE_JOB';
	                            notification.sendPushNotifications(userMessage,friendID,extraParams);

	                            /* HERE WE NEED TO MANAGE ADMIN NOTIFICATION ALSO */

	                            /* Return user response */
			            		return res.send({"code" : 200, "response" : {jobModuleID:jobID},"status" : 1,"message" : custom.lang(locale,'Job disputed successfully.')});
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
	
	/* To verify oauth code from payment gateway server (STRIPE)
	 * @param {string}  code
	 * @param {integer} userId
	*/
	app.get('/connect-return',function(req, res){
		let oauthCode = (!req.query.code) ? '' : req.query.code;
		let userId    = (!req.query.userId) ? '' : req.query.userId;
		if(oauthCode){

			/* Verify  oauth code */
			let stripe = require(appRoot + '/lib/stripe.js');
			stripe.verifyOAuthCode(function(respType,oauthResp){
				if(respType === 0){
					return res.send({
					            "code": 200,
					            "response": {},
					            "status": 0,
					            "message": custom.lang(locale,'Failed to verify.')
					        });
				}else{
					let userPaymentAccountID = (!oauthResp.stripe_user_id) ? '' : oauthResp.stripe_user_id;
					if(userPaymentAccountID){

						/* Update account id */
						model.updateData(function(err,updateResp){
							if(err){
								return res.send({
								            "code": 200,
								            "response": {},
								            "status": 0,
								            "message": custom.lang(locale,'Failed to verify.')
								        });
							}else{
								return res.send({
								            "code": 200,
								            "response": {},
								            "status": 1,
								            "message": custom.lang(locale,'successfully verified.')
								        });
							}
						},constant.user_details,{userPaymentAccountID:userPaymentAccountID,isBecomeProvider:1},{userId:userId});
					}else{
						return res.send({
					            "code": 200,
					            "response": {},
					            "status": 0,
					            "message": custom.lang(locale,'Failed to verify.')
					        });
					}
				}
			},oauthCode);
		}else{
			return res.send({
				            "code": 200,
				            "response": {},
				            "status": 0,
				            "message": custom.lang(locale,'Failed to verify.')
				        });
		}
	});

	/* To get payment connect url (STRIPE)
	*/
	app.post('/paymet/connect-url',function(req, res){
		let connectUrl = 'https://connect.stripe.com/oauth/authorize?response_type=code&client_id=' + constant.stripe_client_id + '&scope=read_write&merchant=acct_1BTY6oDgxxdmmt8G';
		return res.send({
			            "code": 200,
			            "response": {connectUrl:connectUrl},
			            "status": 1,
			            "message": custom.lang(locale,'success.')
			        });
	});

}