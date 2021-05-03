"use strict";

/*
 * Purpose : For Wallet Rest API
 * Package : Wallet
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
		stripe       = require(appRoot + '/lib/stripe.js'),
		queryBuilder = require(appRoot + '/lib/query-builder.js').QueryBuilder();


	/* To add money into wallet (Using Card Details)
	 * @param {string}  userLoginSessionKey
	 * @param {integer} walletAmount
	 * @param {integer} cardNo
     * @param {integer} expiryMonth
     * @param {integer} expiryYear
     * @param {integer} CVV
     * @param {string}  cardHolderName
     * @param {integer} wantToSaveCard (0 = No, 1 = Yes)
	*/
	app.post('/wallet/add-money', function(req, res) {

		let locale = req.headers.locale;
		let userTimeZone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("walletAmount").trim();
		req.sanitize("cardNo").trim();
		req.sanitize("expiryMonth").trim();
		req.sanitize("expiryYear").trim();
		req.sanitize("CVV").trim();
		req.sanitize("wantToSaveCard").trim();
		req.sanitize("cardHolderName").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('walletAmount', custom.lang(locale,'The amount field is required')).notEmpty();
	    req.check('walletAmount', custom.lang(locale,'The amount field minimum value should be 1')).minValue(1);
	    req.check('cardNo', custom.lang(locale,'The card no field is required')).notEmpty();
	    req.check('expiryMonth', custom.lang(locale,'The expiry month field is required')).notEmpty();
	    req.check('expiryYear', custom.lang(locale,'The expiry year field is required')).notEmpty();
	    req.check('CVV', custom.lang(locale,'The CVV field is required')).notEmpty();
	    req.check('wantToSaveCard', custom.lang(locale,'The Save card field is required')).notEmpty();
	    req.check('cardHolderName', custom.lang(locale,'The card holder field is required')).notEmpty();
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
			let walletAmount        = parseInt(req.sanitize('walletAmount').escape().trim());
			let cardNo              = req.sanitize('cardNo').escape().trim();
			let expiryMonth         = req.sanitize('expiryMonth').escape().trim();
			let expiryYear          = req.sanitize('expiryYear').escape().trim();
			let CVV                 = req.sanitize('CVV').escape().trim();
			let wantToSaveCard      = parseInt(req.sanitize('wantToSaveCard').escape().trim());
			let cardHolderName      = req.sanitize('cardHolderName').escape().trim();
			
	        async.waterfall([
			    function(callback) {
			    	/* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							let masterUserId = parseInt(respObj[0].masterUserId);
							callback(null, respObj,masterUserId);
						}
					},userLoginSessionKey,userTimeZone);
			    },
			    function(userDetailsObj,masterUserId, callback) {
					stripe.payViaCardDetails(function(err,paymentResp){
						if(err){

							/* Insert Transaction history (Backgroud Process) */
                            let txnObj = {};
                            txnObj.transactionUserID   = masterUserId;
                            txnObj.transactionCustomID = custom.generateCustomID('TXN');
                            txnObj.transactionAmount   = walletAmount;
                            txnObj.transactionDateTime = custom.getCurrentTime();
                            txnObj.transactionStatus   = 'FAILED';
                            txnObj.transactionModuleName = 'WALLET_ADD_MONEY';
                            txnObj.transactionMessage    = '$' + walletAmount + ' failed to add money into your wallet';
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

								/* Insert Transaction history (Backgroud Process) */
	                            let txnObj = {};
	                            txnObj.transactionUserID   = masterUserId;
	                            txnObj.transactionCustomID = custom.generateCustomID('TXN');
	                            txnObj.transactionAmount   = walletAmount;
	                            txnObj.transactionDateTime = custom.getCurrentTime();
	                            txnObj.transactionStatus   = 'COMPLETED';
	                            txnObj.transactionModuleName = 'WALLET_ADD_MONEY';
	                            txnObj.transactionMessage    = '$' + walletAmount + ' successfully added into your wallet';
	                            txnObj.transactionPaymentResponse = JSON.stringify(paymentResp);
	                            txnObj.transactionPaymentDateTime = custom.getCurrentTime();
	                            model.insertData(function(err,resp){
	                            	if(err){
	                            		console.log('Failed to add transactions',err);
	                            	}
	                            },constant.transactions,txnObj);

								callback(null, userDetailsObj,masterUserId,paymentResp);
							}else{

								/* Insert Transaction history (Backgroud Process) */
	                            let txnObj = {};
	                            txnObj.transactionUserID   = masterUserId;
	                            txnObj.transactionCustomID = custom.generateCustomID('TXN');
	                            txnObj.transactionAmount   = walletAmount;
	                            txnObj.transactionDateTime = custom.getCurrentTime();
	                            txnObj.transactionStatus   = 'FAILED';
	                            txnObj.transactionModuleName = 'WALLET_ADD_MONEY';
	                            txnObj.transactionMessage    = '$' + walletAmount + ' failed to add money into your wallet';
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
									            "message": custom.lang(locale,constant.payment_failed)
									        });
							}
						}
					},cardNo,expiryMonth,expiryYear,CVV,walletAmount,cardHolderName,'USD','Add Money into Quicklove Wallet');
					    	
			    }
			], function (err,userDetailsObj,masterUserId,paymentResp) {

				database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Insert wallet data */	   
                        let currentBalance = parseFloat(walletAmount + parseFloat(userDetailsObj[0].userWalletAmount)).toFixed(2);
						let walletObj = {};
						walletObj.walletUserID 			= masterUserId;
						walletObj.walletAmount 			= walletAmount;
						walletObj.walletRemainingAmount = currentBalance;
						walletObj.walletTxnType         = 'ADDED';
						walletObj.walletTxnReason       = 'ADD_MONEY';
						walletObj.walletTxnID           = custom.generateCustomID('QL');
						walletObj.walletTxnStatus       = 'COMPLETED';
						walletObj.walletTxnDateTime     = custom.getCurrentTime();
						walletObj.walletExtraParams     = JSON.stringify(paymentResp);
                        let i1 = queryBuilder.insert(constant.wallet,walletObj);
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
									            "message": custom.lang(locale,'Failed to add money into wallet.')
									        });
	                        }
	                        var walletID = parseInt(callResp.insertId);

	                    /* Update user wallet amount */
                        let u1 = "UPDATE (`"+constant.user_details+"`) SET `userWalletAmount` = userWalletAmount + " + walletAmount + " WHERE `userId` = " + masterUserId;
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

	                            /* Manage stripe card */
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
		                            					},constant.user_details,{userPaymentCustomerID:stripeCustomerID},{userId:masterUserId});
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

	                            /* Return user response */
			            		return res.send({"code" : 200, "response" : {walletCurrentBalance:custom.parseNumber(currentBalance),userWalletHoldAmount:userDetailsObj[0].userWalletHoldAmount},"status" : 1,"message" : '$' + walletAmount + custom.lang(locale,' successfully added into your wallet.')});
	                        }
                    	});
                    	});
                    	});
                	});
				}); 
			});
		}	
	});

	/* To add money into wallet (Using Saved Card)
	 * @param {string}  userLoginSessionKey
	 * @param {integer} walletAmount
     * @param {string}  cardID (Stripe Card ID)
	*/
	app.post('/wallet/add-money-by-card', function(req, res) {

		let locale = req.headers.locale;
		let userTimeZone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("walletAmount").trim();
		req.sanitize("cardID").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('walletAmount', custom.lang(locale,'The amount field is required')).notEmpty();
	    req.check('walletAmount', custom.lang(locale,'The amount field minimum value should be 1')).minValue(1);
	    req.check('cardID', custom.lang(locale,'The card id field is required')).notEmpty();
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
			let walletAmount        = parseInt(req.sanitize('walletAmount').escape().trim());
			let cardID              = req.sanitize('cardID').escape().trim();

	        async.waterfall([
			    function(callback) {
			    	/* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							let masterUserId = parseInt(respObj[0].masterUserId);
							callback(null, respObj,masterUserId);
						}
					},userLoginSessionKey,userTimeZone);
			    },
			    function(userDetailsObj,masterUserId, callback) {
					stripe.payBySavedCard(function(err,paymentResp){
						if(err){

							/* Insert Transaction history (Backgroud Process) */
                            let txnObj = {};
                            txnObj.transactionUserID   = masterUserId;
                            txnObj.transactionCustomID = custom.generateCustomID('TXN');
                            txnObj.transactionAmount   = walletAmount;
                            txnObj.transactionDateTime = custom.getCurrentTime();
                            txnObj.transactionStatus   = 'FAILED';
                            txnObj.transactionModuleName = 'WALLET_ADD_MONEY';
                            txnObj.transactionMessage    = '$' + walletAmount + ' failed to add money into your wallet';
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

								/* Insert Transaction history (Backgroud Process) */
	                            let txnObj = {};
	                            txnObj.transactionUserID   = masterUserId;
	                            txnObj.transactionCustomID = custom.generateCustomID('TXN');
	                            txnObj.transactionAmount   = walletAmount;
	                            txnObj.transactionDateTime = custom.getCurrentTime();
	                            txnObj.transactionStatus   = 'COMPLETED';
	                            txnObj.transactionModuleName = 'WALLET_ADD_MONEY';
	                            txnObj.transactionMessage    = '$' + walletAmount + ' successfully added into your wallet';
	                            txnObj.transactionPaymentResponse = JSON.stringify(paymentResp);
	                            txnObj.transactionPaymentDateTime = custom.getCurrentTime();
	                            model.insertData(function(err,resp){
	                            	if(err){
	                            		console.log('Failed to add transactions',err);
	                            	}
	                            },constant.transactions,txnObj);
	                            
								callback(null, userDetailsObj,masterUserId,paymentResp);
							}else{

								/* Insert Transaction history (Backgroud Process) */
	                            let txnObj = {};
	                            txnObj.transactionUserID   = masterUserId;
	                            txnObj.transactionCustomID = custom.generateCustomID('TXN');
	                            txnObj.transactionAmount   = walletAmount;
	                            txnObj.transactionDateTime = custom.getCurrentTime();
	                            txnObj.transactionStatus   = 'FAILED';
	                            txnObj.transactionModuleName = 'WALLET_ADD_MONEY';
	                            txnObj.transactionMessage    = '$' + walletAmount + ' failed to add money into your wallet';
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
									            "message": custom.lang(locale,constant.payment_failed)
									        });
							}
						}
					},userDetailsObj[0].userPaymentCustomerID,cardID,'USD',walletAmount);
					    	
			    }
			], function (err,userDetailsObj,masterUserId,paymentResp) {

				database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Insert wallet data */	   
                        let currentBalance = parseFloat(walletAmount + parseFloat(userDetailsObj[0].userWalletAmount)).toFixed(2);
						let walletObj = {};
						walletObj.walletUserID 			= masterUserId;
						walletObj.walletAmount 			= walletAmount;
						walletObj.walletRemainingAmount = currentBalance;
						walletObj.walletTxnType         = 'ADDED';
						walletObj.walletTxnReason       = 'ADD_MONEY';
						walletObj.walletTxnID           = custom.generateCustomID('QL');
						walletObj.walletTxnStatus       = 'COMPLETED';
						walletObj.walletTxnDateTime     = custom.getCurrentTime();
						walletObj.walletExtraParams     = JSON.stringify(paymentResp);
                        let i1 = queryBuilder.insert(constant.wallet,walletObj);
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
									            "message": custom.lang(locale,'Failed to add money into wallet.')
									        });
	                        }
	                        var walletID = parseInt(callResp.insertId);

	                    /* Update user wallet amount */
                        let u1 = "UPDATE (`"+constant.user_details+"`) SET `userWalletAmount` = userWalletAmount + " + walletAmount + " WHERE `userId` = " + masterUserId;
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

	                            /* Return user response */
			            		return res.send({"code" : 200, "response" : {walletCurrentBalance:custom.parseNumber(currentBalance),userWalletHoldAmount:userDetailsObj[0].userWalletHoldAmount},"status" : 1,"message" : '$' + walletAmount + custom.lang(locale,' successfully added into your wallet.')});
	                        }
                    	});
                    	});
                    	});
                	});
				}); 
			});
		}	
	});

	/* To get wallet history
	 * @param {string}  userLoginSessionKey
	 * @param {integer} pageNo
	*/
	app.post('/wallet/history', function(req, res) {
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
							callback(null, respObj,masterUserId);
						}
					},userLoginSessionKey,timezone);
			    },
			    function(userDetailsObj,masterUserId, callback) {

			    	/* Get wallet history data */
			    	model.getCount(function(err,totalResults){
			    			if(err){
			                    return res.send(custom.dbErrorResponse());
			                }else{
			                	if(parseInt(totalResults) > 0){

			                		/* To get offset */
							    	let offset = custom.getOffset(pageNo);

							    	/* To get user wallet history */
							        model.getAllWhere(function(err,walletHistoryObj){
							        	if(err){
						                    return res.send(custom.dbErrorResponse());
						                }else{
						                	if(walletHistoryObj != ""){
						                		callback(null, userDetailsObj,totalResults,walletHistoryObj);
						                	}else{
						                		return res.send({
												            "code": 200,
												            "response": [],
												            "status": 0,
												            "message": custom.lang(locale,"Wallet history not found.")
												        });
						                	}
						                }
							        },constant.wallet,{walletUserID:masterUserId},'walletID','DESC','*',constant.results_limit,offset);
			                	}else{
			                		return res.send({
									            "code": 200,
									            "response": [],
									            "status": 0,
									            "message": custom.lang(locale,"Wallet history not found.")
									        });
			                	}
			                }
			    	},constant.wallet,{walletUserID:masterUserId});
			    }
			], function (err,userDetailsObj,totalResults,walletHistoryObj) {
			    let responseObj = [];
			    for (var i = 0; i < parseInt(walletHistoryObj.length); i++) 
			    {
			    	let row = {};
			    	row.walletID        = parseInt(walletHistoryObj[i].walletID);
			    	row.walletAmount    = custom.parseNumber(walletHistoryObj[i].walletAmount);
			    	row.walletTxnType   = custom.nullChecker(walletHistoryObj[i].walletTxnType);
			    	row.walletTxnReason = custom.nullChecker(walletHistoryObj[i].walletTxnReason);
			    	row.walletTxnID     = custom.nullChecker(walletHistoryObj[i].walletTxnID);
			    	row.walletTxnStatus = custom.nullChecker(walletHistoryObj[i].walletTxnStatus);
			    	row.walletTxnDateTime  = custom.changeDateFormat(walletHistoryObj[i].walletTxnDateTime);
			    	row.walletExtraParams  = (!walletHistoryObj[i].walletExtraParams) ? {} : JSON.parse(walletHistoryObj[i].walletExtraParams);
			    	responseObj.push(row);
			    }
			    return res.send({
					            "code": 200,
					            "response": responseObj,
					            "userWalletAmount":(!userDetailsObj[0].userWalletAmount) ? 0 : custom.parseNumber(userDetailsObj[0].userWalletAmount),
					            "userWalletHoldAmount":(!userDetailsObj[0].userWalletHoldAmount) ? 0 : custom.parseNumber(userDetailsObj[0].userWalletHoldAmount),
					            "totalCount": totalResults,
					            "userPaymentAccountID":custom.nullChecker(userDetailsObj[0].userPaymentAccountID),
					            "status": 1,
					            "message": "success"
					        });
			});
		}
	});

	/* To get transaction history
	 * @param {string}  userLoginSessionKey
	 * @param {integer} pageNo
	*/
	app.post('/transaction/history', function(req, res) {
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
							callback(null, respObj,masterUserId);
						}
					},userLoginSessionKey,timezone);
			    },
			    function(userDetailsObj,masterUserId, callback) {

			    	/* To get offset */
			    	let offset = custom.getOffset(pageNo);
			    	
			    	/* Get transaction history data */
			    	var txnQuery = "SELECT * FROM "+ constant.transactions +" AS `T` LEFT JOIN "+ constant.txn_disputes +" AS `TD` ON `T`.`transactionID` = `TD`.`disputeTxnID` WHERE `T`.`transactionUserID` = "+ masterUserId +" ORDER BY `T`.`transactionID` DESC ";
			    	model.customQuery(function(err,txnResponse){
			    		if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	let totalResults = parseInt(txnResponse.length);
		                	if(offset > 0){
					    		txnQuery += "LIMIT " + offset + "," + constant.results_limit;
					    	}else{
					    		txnQuery += "LIMIT " + constant.results_limit
					    	}
					    	model.customQuery(function(err,transactionHistoryObj){
					        	if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(transactionHistoryObj != ""){
				                		callback(null, userDetailsObj,totalResults,transactionHistoryObj);
				                	}else{
				                		return res.send({
											            "code": 200,
											            "response": [],
											            "status": 0,
											            "message": custom.lang(locale,"Transaction history not found.")
											        });
				                	}
				                }
					        },txnQuery);
		                }
		            },txnQuery);
			    }
			], function (err,userDetailsObj,totalResults,transactionHistoryObj) {
			    let responseObj = [];
			    for (var i = 0; i < parseInt(transactionHistoryObj.length); i++) 
			    {
			    	let row = {};
			    	row.transactionID         = parseInt(transactionHistoryObj[i].transactionID);
			    	row.disputeID             = (!transactionHistoryObj[i].disputeID) ? 0 : parseInt(transactionHistoryObj[i].disputeID);
			    	row.transactionUserID     = parseInt(transactionHistoryObj[i].transactionUserID);
			    	row.transactionFriendID   = (!transactionHistoryObj[i].transactionFriendID) ? 0 : parseInt(transactionHistoryObj[i].transactionFriendID);
			    	row.transactionCustomID   = custom.nullChecker(transactionHistoryObj[i].transactionCustomID);
			    	row.disputeReason         = custom.nullChecker(transactionHistoryObj[i].disputeReason);
			    	row.transactionAmount     = custom.parseNumber(transactionHistoryObj[i].transactionAmount);
			    	row.transactionStatus     = custom.nullChecker(transactionHistoryObj[i].transactionStatus);
			    	row.transactionModuleName = custom.nullChecker(transactionHistoryObj[i].transactionModuleName);
			    	row.transactionMessage    = custom.nullChecker(transactionHistoryObj[i].transactionMessage);
			    	row.transactionPaymentID  = custom.nullChecker(transactionHistoryObj[i].transactionPaymentID);
			    	row.transactionMode       = custom.nullChecker(transactionHistoryObj[i].transactionMode);
			    	row.transactionDisputed   = parseInt(transactionHistoryObj[i].transactionDisputed);
			    	row.disputeStatus         = custom.nullChecker(transactionHistoryObj[i].disputeStatus);
			    	row.transactionPaymentResponse  = (!transactionHistoryObj[i].transactionPaymentResponse) ? {} : JSON.parse(transactionHistoryObj[i].transactionPaymentResponse);
			    	row.transactionDateTime         = custom.changeDateFormat(transactionHistoryObj[i].transactionDateTime);
			    	row.disputeDateTime             = (!transactionHistoryObj[i].disputeDateTime) ? "" : custom.changeDateFormat(transactionHistoryObj[i].disputeDateTime);
			    	row.disputeResponseDateTime     = (!transactionHistoryObj[i].disputeResponseDateTime) ? "" : custom.changeDateFormat(transactionHistoryObj[i].disputeResponseDateTime);
			    	row.transactionParams           = (!transactionHistoryObj[i].transactionParams) ? {} : JSON.parse(transactionHistoryObj[i].transactionParams);
			    	row.disputeExtraParams          = (!transactionHistoryObj[i].disputeExtraParams) ? {} : JSON.parse(transactionHistoryObj[i].disputeExtraParams);
			    	responseObj.push(row);
			    }
			    return res.send({
					            "code": 200,
					            "response": responseObj,
					            "totalCount": totalResults,
					            "status": 1,
					            "message": "success"
					        });
			});
		}
	});

	/* To transaction dispute
	 * @param {string}  userLoginSessionKey
	 * @param {integer} transactionID
	 * @param {string}  disputeReason
	*/
	app.post('/transaction/dispute', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("transactionID").trim();
		req.sanitize("disputeReason").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('transactionID', custom.lang(locale,'Transaction Id field is required')).notEmpty();
	    req.check('disputeReason', custom.lang(locale,'Transaction dispute reason field is required')).notEmpty();
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
			let transactionID       = parseInt(req.sanitize('transactionID').escape().trim());
			let disputeReason       = req.sanitize('disputeReason').escape().trim();

			async.waterfall([
			    function(callback) {

			    	/* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							let masterUserId = parseInt(respObj[0].masterUserId);
							callback(null, respObj,masterUserId);
						}
					},userLoginSessionKey,timezone);
			    },
			    function(userDetailsObj,masterUserId, callback) {

			    	/* Validate transaction ID */
			    	model.getAllWhere(function(err,txnResp){
			    		if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(txnResp != ""){

		                		/* Check if transaction already disputed */
		                		if(parseInt(txnResp[0].transactionDisputed) === 0){

		                			/* Check user ID request */
		                			if(parseInt(txnResp[0].transactionUserID) === masterUserId){

		                				/* Check if transaction is completed */
		                				if(txnResp[0].transactionStatus === 'COMPLETED'){
		                					callback(null, userDetailsObj,masterUserId,txnResp);
		                				}else{
		                					return res.send({
								                        "code": 200,
								                        "response": {},
								                        "status": 0,
								                        "message": custom.lang(locale,'You can to make dispute with failed transactions')
								                    });
		                				}
		                			}else{
		                				return res.send({
							                        "code": 200,
							                        "response": {},
							                        "status": 0,
							                        "message": custom.lang(locale,'You are not authorized to make dispute on this transaction')
							                    });
		                			}
		                		}else{
		                			return res.send({
						                        "code": 200,
						                        "response": {},
						                        "status": 0,
						                        "message": custom.lang(locale,'You already disputed for this transaction')
						                    });
		                		}
		                	}else{
		                		return res.send({
				                        "code": 200,
				                        "response": {},
				                        "status": 0,
				                        "message": custom.lang(locale,'Invalid Transaction ID')
				                    });
		                	}
		                }
			    	},constant.transactions,{transactionID:transactionID});
			    }
			], function (err,userDetailsObj,masterUserId,txnResp) {

			    database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Insert dispute details */	   
						let disputeObj = {};
						disputeObj.disputeUserID 	= masterUserId;
						disputeObj.disputeTxnID 	= transactionID;
						disputeObj.disputeReason    = disputeReason;
						disputeObj.disputeDateTime  = custom.getCurrentTime();
                        let i1 = queryBuilder.insert(constant.txn_disputes,disputeObj);
                        queryBuilder.reset_query(i1);
                        connection.query(i1, function(err, disputeResp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }
	                        if(!disputeResp){
	                        	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Failed to dispute transaction')
									        });
	                        }

	                    /* Update transaction status */
	                    let disputeUpdateObj = {};
	                    disputeUpdateObj.transactionDisputed      = 1;
	                    disputeUpdateObj.transactionDisputeStatus = 'PENDING';
	                    let u1 = queryBuilder.update(constant.transactions,disputeUpdateObj,{transactionID:transactionID});
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

	                            /* Send notification to admin */
	                            

	                            /* Insert dispute request notification */
							   	let notificationDataObj = {};
		                		notificationDataObj.notificationUserId   = masterUserId;
		                		notificationDataObj.notificationFriendId = masterUserId;
		                		notificationDataObj.txnModuleID          = transactionID;
		                		notificationDataObj.notificationModule   = 'PROVIDER';
		                		notificationDataObj.notificationType     = 'TXN_DISPUTE';
		                		notificationDataObj.notificationMessage  = 'Transaction ID ' + txnResp[0].transactionCustomID + ' dispute request successfully sent to ' + constant.site_name + ' team';
		                		notificationDataObj.notificationParams   = JSON.stringify({transactionCustomID:txnResp[0].transactionCustomID});
		                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
		                		model.insertData(function(err,notificationResp){
	                            	if(err){
	                            		console.log('Transaction dispute notification error',err);
	                            	}else{
	                            		console.log('Transaction dispute notification success');
	                            	}
	                            },constant.notifications,notificationDataObj);

	                            /* Update user badges */
	                            let updateQuery = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + masterUserId;
	                            model.customQuery(function(err,badgesResp){
	                            	if(err){
	                            		console.log('Transaction dispute notification badges error',err);
	                            	}else{
	                            		console.log('Transaction dispute notification badges success');
	                            	}
	                            },updateQuery);

	                            /* Return user response */
			            		return res.send({"code" : 200, "response" : {},"status" : 1,"message" : custom.lang(locale,'Transaction dispute request successfully sent to ' + constant.site_name + ' team')});
	                        }
                    	});
                    	});
                    	});
                	});
				}); 
			});
		}
	});

	/* To get saved cards list
	 * @param {string}  userLoginSessionKey
	*/
	app.post('/saved-cards/list', function(req, res) {
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

			async.waterfall([
			    function(callback) {

			    	/* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							let masterUserId = parseInt(respObj[0].masterUserId);
							callback(null, respObj,masterUserId);
						}
					},userLoginSessionKey,timezone,1);
			    },
			    function(userDetailsObj,masterUserId, callback) {

			    	let userPaymentCustomerID = userDetailsObj[0].userPaymentCustomerID;
			    	if(!userPaymentCustomerID){
			    		return res.send({
							            "code": 200,
							            "response": [],
							            "status": 0,
							            "message": custom.lang(locale,'Cards not found')
							        });
			    	}else{
			    		/* Get saved card details */
				    	stripe.getCardsList(function(err,cardsResp){
				    		if(err){
				    			return res.send({
							            "code": 200,
							            "response": [],
							            "status": 0,
							            "message": custom.lang(locale,err.message)
							        });
				    		}else{
				    			let cardsRespObj = cardsResp.data;
				    			if(cardsRespObj != ""){
				    				callback(null, userDetailsObj,cardsRespObj);
				    			}else{
				    				return res.send({
									            "code": 200,
									            "response": [],
									            "status": 0,
									            "message": custom.lang(locale,'Cards not found')
									        });
				    			}
				    		}
				    	},userPaymentCustomerID,20);
			    	}
			    }
			], function (err,userDetailsObj,cardsRespObj) {
			    let responseObj = [];
			    for (var i = 0; i < parseInt(cardsRespObj.length); i++) 
			    {
			    	let row = {};
			    	row.cardID         = custom.nullChecker(cardsRespObj[i].id);
			    	row.cardBrandName  = custom.nullChecker(cardsRespObj[i].brand);
			    	row.cardLast4Digit = custom.nullChecker(cardsRespObj[i].last4);
			    	row.cardHolderName = custom.nullChecker(cardsRespObj[i].name);
			    	responseObj.push(row);
			    }
			    return res.send({
					            "code": 200,
					            "response": responseObj,
					            "totalCount": parseInt(cardsRespObj.length),
					            "status": 1,
					            "message": "success"
					        });
			});
		}
	});

	/* To delete saved card
	 * @param {string}  userLoginSessionKey
	 * @param {string}  cardID
	*/
	app.post('/saved-card/delete', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("cardID").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('cardID', custom.lang(locale,'The Card Id field is required')).notEmpty();
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
			let cardID                = req.sanitize('cardID').escape().trim();

			async.waterfall([
			    function(callback) {

			    	/* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							let masterUserId = parseInt(respObj[0].masterUserId);
							callback(null, respObj,masterUserId);
						}
					},userLoginSessionKey,timezone,1);
			    }
			], function (err,userDetailsObj,masterUserId) {
			    
			    /* To delete saved card */
			    stripe.deleteCard(function(err,stripeResp){
			    	if(err){
			    		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,err.message)
							        });
			    	}else{
			    		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 1,
							            "message": custom.lang(locale,'Card deleted successfully')
							        });
			    	}
			    },cardID,userDetailsObj[0].userPaymentCustomerID);
			});
		}
	});

	/* To withdraw money from wallet
	 * @param {string}  userLoginSessionKey
	 * @param {integer} withdrawAmouunt
	*/
	app.post('/wallet/withdraw-money', function(req, res) {

		let locale = req.headers.locale;
		let userTimeZone = req.headers.timezone;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("withdrawAmouunt").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('withdrawAmouunt', custom.lang(locale,'The withdraw amount field is required')).notEmpty();
	    req.check('withdrawAmouunt', custom.lang(locale,'The withdraw amount field minimum value should be 1')).minValue(1);
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
			let withdrawAmouunt     = parseInt(req.sanitize('withdrawAmouunt').escape().trim());

	        async.waterfall([
			    function(callback) {
			    	/* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							return res.send(respObj);
						}else{
							let masterUserId     = parseInt(respObj[0].masterUserId);
							let userWalletAmount = custom.parseNumber(respObj[0].userWalletAmount);
							if(userWalletAmount >= withdrawAmouunt){
								let userPaymentAccountID = custom.nullChecker(respObj[0].userPaymentAccountID);
								if(!userPaymentAccountID){
									return res.send({
									            "code": 200,
									            "response": {},
									            "status": 9,
									            "message": custom.lang(locale,'Your payment account is not connected')
									        });
								}else{
									callback(null, respObj,masterUserId,userPaymentAccountID);
								}
							}else{
								return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,'Withdraw amount can not be greater than wallet amount')
							        });
							}
						}
					},userLoginSessionKey,userTimeZone);
			    },
			    function(userDetailsObj,masterUserId,userPaymentAccountID, callback) {
					
					/* Transfer payment in user stripe account */
					let transferGroupName = 'USER-' + masterUserId + '-' + Date.now();
					stripe.transferAmount(function(err,paymentResp){
						if(err){

							/* Insert Transaction history (Backgroud Process) */
                            let txnObj = {};
                            txnObj.transactionUserID   = masterUserId;
                            txnObj.transactionCustomID = custom.generateCustomID('TXN');
                            txnObj.transactionAmount   = withdrawAmouunt;
                            txnObj.transactionDateTime = custom.getCurrentTime();
                            txnObj.transactionStatus   = 'FAILED';
                            txnObj.transactionModuleName = 'WALLET_WITHDRAW_MONEY';
                            txnObj.transactionMessage    = '$' + withdrawAmouunt + ' failed to withdraw money from your wallet';
                            txnObj.transactionPaymentResponse = JSON.stringify({error:err.message});
                            txnObj.transactionPaymentDateTime = custom.getCurrentTime();
                            model.insertData(function(err,resp){
                            	if(err){
                            		console.log('Failed to add transactions withdraw money ',err.message);
                            	}
                            },constant.transactions,txnObj);

							return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,err.message)
							        });
						}else{

							/* Insert Transaction history (Backgroud Process) */
                            let txnObj = {};
                            txnObj.transactionUserID   = masterUserId;
                            txnObj.transactionCustomID = custom.generateCustomID('TXN');
                            txnObj.transactionAmount   = withdrawAmouunt;
                            txnObj.transactionDateTime = custom.getCurrentTime();
                            txnObj.transactionStatus   = 'COMPLETED';
                            txnObj.transactionModuleName = 'WALLET_WITHDRAW_MONEY';
                            txnObj.transactionMessage    = '$' + withdrawAmouunt + ' withdraw money successfully from your wallet';
                            txnObj.transactionPaymentResponse = JSON.stringify(paymentResp);
                            txnObj.transactionPaymentDateTime = custom.getCurrentTime();
                            model.insertData(function(err,resp){
                            	if(err){
                            		console.log('Failed to add transactions withdraw money ',err.message);
                            	}
                            },constant.transactions,txnObj);

                            /* Insert wallet history */	   
	                        let currentBalance = custom.parseNumber(userDetailsObj[0].userWalletAmount - withdrawAmouunt);
							let walletObj = {};
							walletObj.walletUserID 			= masterUserId;
							walletObj.walletAmount 			= withdrawAmouunt;
							walletObj.walletRemainingAmount = currentBalance;
							walletObj.walletTxnType         = 'DEDUCT';
							walletObj.walletTxnReason       = 'WALLET_WITHDRAW_MONEY';
							walletObj.walletTxnID           = custom.generateCustomID('QL');
							walletObj.walletTxnStatus       = 'COMPLETED';
							walletObj.walletTxnDateTime     = custom.getCurrentTime();
							walletObj.walletExtraParams     = JSON.stringify(paymentResp);
							model.insertData(function(err,resp){
                            	if(err){
                            		console.log('Failed to add wallet history withdraw money ',err.message);
                            	}
                            },constant.wallet,walletObj);

                            callback(null, userDetailsObj,masterUserId,paymentResp,currentBalance);
						}
					},withdrawAmouunt,'USD',userPaymentAccountID,transferGroupName);
			    }
			], function (err,userDetailsObj,masterUserId,paymentResp,currentBalance) {

				database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

	                    /* Update user wallet amount */
                        let u1 = "UPDATE (`"+constant.user_details+"`) SET `userWalletAmount` = userWalletAmount - " + withdrawAmouunt + " WHERE `userId` = " + masterUserId;
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

	                            /* Return user response */
			            		return res.send({"code" : 200, "response" : {walletCurrentBalance:custom.parseNumber(currentBalance),userWalletHoldAmount:userDetailsObj[0].userWalletHoldAmount},"status" : 1,"message" : '$' + withdrawAmouunt + custom.lang(locale,' withdraw money successfully from your wallet')});
	                        }
                    	});
                    	});
                	});
				}); 
			});
		}	
	});

	
	

}