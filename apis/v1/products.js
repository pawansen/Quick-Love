"use strict";

/*
 * Purpose : For Products Rest API
 * Package : Products
 * Company : Mobiweb Technology Pvt. Ltd.
 * Developed By  : Sorav Garg
*/
 var appRoot  = require('app-root-path'),
    	async    = require('async'),
		model    = require(appRoot + '/lib/model.js'),
		constant = require(appRoot + '/config/constant.js'),
		database = require(appRoot + '/config/database.js'),
		custom   = require(appRoot + '/lib/custom.js'),
		model    = require(appRoot + '/lib/model.js'),
		multer   = require('multer'),
		ejs      = require('ejs'),
		path     = require('path');
var uploadPath = './uploads/products/';
	var storage    = multer.diskStorage({
		destination: function(req, file, callback) {
			callback(null, uploadPath)
		},
		filename: function(req, file, callback) {
			let uploadedFileName = 'product-'+ Date.now() + '-' + custom.getGuid() + path.extname(file.originalname);
			callback(null, uploadedFileName)
		}
	});
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
		stripe       = require(appRoot + '/lib/stripe.js'),
		queryBuilder = require(appRoot + '/lib/query-builder.js').QueryBuilder();

	/* Set products file destination path */
	var uploadPath = './uploads/products/';
	var storage    = multer.diskStorage({
		destination: function(req, file, callback) {
			callback(null, uploadPath)
		},
		filename: function(req, file, callback) {
			let uploadedFileName = 'product-'+ Date.now() + '-' + custom.getGuid() + path.extname(file.originalname);
			callback(null, uploadedFileName)
		}
	});
	var uploadProduct  = multer({ storage:storage }).array('userFile',constant.product_images_limit); // MAX 3 IMAGES ALLOWED
	
	/* To add provider products
	 * @param {string}  userLoginSessionKey
	 * @param {file}    userFile
	 * @param {string}  productName
	 * @param {string}  productDescprition
	 * @param {float}   productPrice
	*/
	app.post('/provider/add-product', function(req, res) {
		uploadProduct(req,res,function(err) {
			if(err) {
	            return  res.send({
					            "code": 200,
					            "response": {},
					            "status": 0,
					            "message":'Error uploading products images.' 
					        });
	        }else{
	        	let imagesObj = req.files;
	        	let totalUploadedImages = parseInt(imagesObj.length);
	        	if(totalUploadedImages <= 0)
	        	{
	        		return  res.send({
					            "code": 200,
					            "response": {},
					            "status": 0,
					            "message":'Error uploading products images.' 
					        });
	        	}
	        	let timezone  = req.headers.timezone;
				let locale    = req.headers.locale;
				req.sanitize("userLoginSessionKey").trim();
		    	req.sanitize("productName").trim();
		    	req.sanitize("productDescprition").trim();
		    	req.sanitize("productPrice").trim();
			    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
			    req.check('productName', custom.lang(locale,'The Product name field is required')).notEmpty();
			    req.check('productDescprition', custom.lang(locale,'The Product descprition field is required')).notEmpty();
			    req.check('productPrice', custom.lang(locale,'The Product price field is required')).notEmpty();
			    req.check('productPrice', custom.lang(locale,'The Product price field minimum value should be 1')).minValue(1);
			    let errors = req.validationErrors();
			    if (errors) {
			    	/* To delete uploaded file */
			    	custom.unlinkMultipleFile(imagesObj);
			        res.send({
			            "code": 200,
			            "response": {},
			            "status": 0,
			            "message": custom.manageValidationMessages(errors)
			        });
			    } else {
			    	let userLoginSessionKey   = req.sanitize('userLoginSessionKey').escape().trim();
			    	let productName           = req.sanitize('productName').escape().trim();
			    	let productDescprition    = req.sanitize('productDescprition').escape().trim();
			    	let productPrice   		  = parseInt(req.sanitize('productPrice').escape().trim());

			    	async.waterfall([
					    function(callback) {
					        /* To validate user login session key */
							custom.handleLoggedInUser(function(respType,respObj) {
								if(parseInt(respType) === 0){
									/* To delete uploaded file */
					                custom.unlinkMultipleFile(imagesObj);
									return res.send(respObj);
								}else{
									callback(null, respObj,[]);
								}
							},userLoginSessionKey,timezone);
					    }
					], function (err, userDetailsObj,thumbnailUploadedImgPaths) {
					    
					    database.pool.getConnection(function(err, connection) {

					   		/* Begin transaction */
		                    connection.beginTransaction(function(err) {
		                        if (err) {
		                            return res.send(custom.dbErrorResponse());
		                        }

		                        /* Insert Product data */
		                        var insertDataObj = {};
								insertDataObj.productUserID      = userDetailsObj[0].userId;
								insertDataObj.productName        = productName;
								insertDataObj.productPrice       = productPrice;
								insertDataObj.productDescprition = productDescprition;
								insertDataObj.productAddedDate   = custom.getCurrentTime();
		                        let i1 = queryBuilder.insert(constant.products,insertDataObj);
		                        queryBuilder.reset_query(i1);
		                        connection.query(i1, function(err, productResp) {
			                        if (err) {
			                            connection.rollback(function() {
			                                return res.send(custom.dbErrorResponse(err.sqlMessage));
			                            });
			                        }
			                    if(!productResp)
			                    {
			                    	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Failed to add products.')
									        });
			                    }
			                    var productID = parseInt(productResp.insertId);

			                    /* Insert Product images */
		                        var insertProductImages = [];
		                        for (var i = 0; i < parseInt(imagesObj.length); i++) 
		                        {
		                        	let row = {};
		                        	row.productParentID       = productID;
								    row.productOriginalImage  = (!imagesObj[i].path) ? '' : imagesObj[i].path;
								    row.productThumbnailImage = (!thumbnailUploadedImgPaths[i]) ? '' : thumbnailUploadedImgPaths[i];
								    insertProductImages.push(row);
		                        }
		                        let i2 = queryBuilder.insert_batch(constant.products_images,insertProductImages);
		                        queryBuilder.reset_query(i2);
		                        connection.query(i2, function(err, productResp) {
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

			                            /* Get product original images */
			                            model.getAllWhere(function(err,imagesResp){
			                            	if(err){
			                            		console.log('failed to get product images',err);
			                            	}else{
												var respObj = {};
			                            		if(parseInt(imagesResp.length) > 0)
			                            		{
													for(var i = 0,len = parseInt(imagesResp.length); i < len; ++i) 
													{
													  var uploadedFilePath = (!imagesResp[i].productOriginalImage) ? '' : imagesResp[i].productOriginalImage;
												      var productImageID   = parseInt(imagesResp[i].productImageID);
													  respObj[uploadedFilePath] = productImageID; 
													  updateThumbnail(uploadedFilePath,productImageID,respObj);
													}
			                            		}
			                            	}
			                            },constant.products_images,{productParentID:productID});

			                            /* Return user response */
			            				return res.send({"code" : 200, "response" : {},"status" : 1,"message" : custom.lang(locale,'Product created sucessfully.')});
			                        }
		                    	});
		                    	});
		                    	});
		                    });
		                });
					});
			    }
	        }
		});
	});

	/* To get product listing 
	 * @param {integer} userID
	   @param {integer} pageNo
	*/
	app.post('/product/listing', function(req, res) {
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
			    	
			    	/* Get products data */
			    	model.getCount(function(err,totalProducts){
		    			if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	if(parseInt(totalProducts) > 0){

		                		/* To get offset */
						    	let offset = custom.getOffset(pageNo);

						    	/* To get user products */
						        model.getAllWhere(function(err,productObj){
						        	if(err){
					                    return res.send(custom.dbErrorResponse());
					                }else{
					                	if(productObj != ""){
					                		callback(null, productObj,totalProducts);
					                	}else{
					                		return res.send({
											            "code": 200,
											            "response": [],
											            "status": 0,
											            "message": custom.lang(locale,"Products not found.")
											        });
					                	}
					                }
						        },constant.products,{productUserID:userID},'productID','DESC','*',constant.results_limit,offset);
		                	}else{
		                		return res.send({
								            "code": 200,
								            "response": [],
								            "status": 0,
								            "message": custom.lang(locale,"Products not found.")
								        });
		                	}
		                }
		    		},constant.products,{productUserID:userID});
			    },
			    function(productObj,totalProducts, callback) {
			    	let responseObj = [];
				    for (var i = 0; i < parseInt(productObj.length); i++) 
				    {
				    	let productID = parseInt(productObj[i].productID);
				    	let row = {};
				    	let productImages = [];
				    	row.productID          = productID;
				    	row.productUserID      = parseInt(productObj[i].productUserID);
				    	row.productName        = custom.nullChecker(productObj[i].productName);
				    	row.productPrice       = custom.nullChecker(productObj[i].productPrice);
				    	row.productDescprition = custom.nullChecker(productObj[i].productDescprition);
				    	row.productAddedDate   = custom.changeDateFormat(productObj[i].productAddedDate);

				    	(function(i,productID) {

				    		/* Get product images*/
	                        let productImageQuery = 'SELECT * FROM ' + constant.products_images + ' WHERE `productParentID` = ' + productID + ' ORDER BY `productImageID` ASC LIMIT ' + constant.product_images_limit;
	                        database.getConn(productImageQuery, function (err, productImagesObj) {
	                            if(err){
	                                return res.send(custom.dbErrorResponse());
	                            }else{
	                            	row.productImages = [];
	                                if(productImagesObj != "")
	                                {
	                                	if(parseInt(productImagesObj.length) > 0)
								    	{
								    		for (var j = 0; j < parseInt(productImagesObj.length); j++) 
								    		{
								    			let imgRow = {};
								    			imgRow.productImageID = parseInt(productImagesObj[j].productImageID)
								    			imgRow.productOriginalImage  = (!productImagesObj[j].productOriginalImage) ? '' : constant.base_url + productImagesObj[j].productOriginalImage;
								    			imgRow.productThumbnailImage = (!productImagesObj[j].productThumbnailImage) ? '' : constant.base_url + productImagesObj[j].productThumbnailImage;
								    			productImages.push(imgRow);
								    		}
								    		row.productImages = productImages;
								    	}
	                                }
	                            }
	                            if (i === parseInt(productObj.length - 1)) {
	                              callback(null, productObj,totalProducts,responseObj);
	                            }
	                        });
				    	})(i,productID);
				    	responseObj.push(row);
				    }
			    }
			], function (err,productObj,totalProducts,responseObj) {
			    return res.send({
					            "code": 200,
					            "response": responseObj,
					            "totalCount": totalProducts,
					            "status": 1,
					            "message": "success"
					        });
			});
		}
	});

	/* To get product details
	 * @param {string}  userLoginSessionKey
	 * @param {integer}  productID 
	*/
	app.post('/product/details', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("productID").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('productID', custom.lang(locale,'The Product id field is require')).notEmpty();
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
			let productID             = parseInt(req.sanitize('productID').escape().trim());

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
					},userLoginSessionKey,timezone);
			    },
			    function(userDetailsObj, callback) {

			    	/* To get product details */
			    	model.getAllWhere(function(err,productObj){
				        	if(err){
			                    return res.send(custom.dbErrorResponse());
			                }else{
			                	if(productObj != ""){
			                		callback(null, userDetailsObj, productObj,productObj[0].productID);
			                	}else{
			                		return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,"Product details not found.")
									        });
			                	}
			                }
				    },constant.products,{productID:productID});
			    },
			    function(userDetailsObj,productObj,productID, callback) {

			    	/* To get product images */
			    	model.getAllWhere(function(err,productImagesObj){
				        	if(err){
			                    return res.send(custom.dbErrorResponse());
			                }else{
			                	callback(null, userDetailsObj, productObj,productObj[0].productID,productImagesObj);
			                }
				    },constant.products_images,{productParentID:productID},'productImageID','ASC','*', constant.product_images_limit);
			    }
			], function (err,userDetailsObj,productObj,productID,productImagesObj) {
			    let productImages = [];
			    let responseObj = {};
			    	responseObj.productID              = parseInt(productObj[0].productID);
			    	responseObj.productUserID          = parseInt(productObj[0].productUserID);
			    	responseObj.productName            = custom.nullChecker(productObj[0].productName);
			    	responseObj.productPrice           = custom.nullChecker(productObj[0].productPrice);
			    	responseObj.productDescprition     = custom.nullChecker(productObj[0].productDescprition);
			    	responseObj.productAddedDate  	   = custom.changeDateFormat(productObj[0].productAddedDate);

			    	if(parseInt(productImagesObj.length) > 0)
			    	{
			    		for (var j = 0; j < parseInt(productImagesObj.length); j++) 
			    		{
			    			let row = {};
			    			row.productImageID = parseInt(productImagesObj[j].productImageID)
			    			row.productOriginalImage  = (!productImagesObj[j].productOriginalImage) ? '' : constant.base_url + productImagesObj[j].productOriginalImage;
			    			row.productThumbnailImage = (!productImagesObj[j].productThumbnailImage) ? '' : constant.base_url + productImagesObj[j].productThumbnailImage;
			    			productImages.push(row);
			    		}
			    	}
			    	responseObj.productImages = productImages;
			    	return res.send({
						            "code": 200,
						            "response": responseObj,
						            "status": 1,
						            "message": "success"
						        });
			});
		}
	});

	/* To delete product
	 * @param {string}  userLoginSessionKey
	 * @param {integer}  productID
	*/
	app.post('/product/delete', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("productID").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('productID', custom.lang(locale,'The Product id field is require')).notEmpty();
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
			let productID = parseInt(req.sanitize('productID').escape().trim());

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
					},userLoginSessionKey,timezone);
			    }
			], function (err,userDetailsObj) {
			    
			    /* To delete product */
			    model.deleteData(function(err,resp){
			    	if(err){
	                    return res.send(custom.dbErrorResponse());
	                }else{
	                	if(parseInt(resp.affectedRows) > 0){
	                		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 1,
							            "message": custom.lang(locale,"Product deleted successfully.")
							        });
	                	}else{
	                		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,"Failed to delete product.")
							        });
	                	}
	                }
			    },constant.products,{productID:productID,productUserID:userDetailsObj[0].userId});
			});
		}
	});

	/* To edit provider products
	 * @param {string}  userLoginSessionKey
	 * @param {file}    userFile
	 * @param {string}  productName
	 * @param {string}  productDescprition
	 * @param {float}   productPrice
	 * @param {integer} productID
	 * @param {string}  productImageIDS
	*/
	app.post('/provider/edit-product', function(req, res) {
		uploadProduct(req,res,function(err) {
			let productImageIDS = (!req.body.productImageIDS) ? '' : req.body.productImageIDS;
			let imagesObj       = (!req.files) ? [] : req.files;
			let totalUploadedImages = parseInt(imagesObj.length);
			if(totalUploadedImages > 0 && err) {
	            return  res.send({
					            "code": 200,
					            "response": {},
					            "status": 0,
					            "message":'Error uploading products images.' 
					        });
	        }else{
	        	let timezone  = req.headers.timezone;
				let locale    = req.headers.locale;
				req.sanitize("userLoginSessionKey").trim();
		    	req.sanitize("productName").trim();
		    	req.sanitize("productDescprition").trim();
		    	req.sanitize("productPrice").trim();
		    	req.sanitize("productID").trim();
			    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
			    req.check('productName', custom.lang(locale,'The Product name field is required')).notEmpty();
			    req.check('productDescprition', custom.lang(locale,'The Product descprition field is required')).notEmpty();
			    req.check('productPrice', custom.lang(locale,'The Product price field is required')).notEmpty();
			    req.check('productPrice', custom.lang(locale,'The Product price field minimum value should be 1')).minValue(1);
			    req.check('productID', custom.lang(locale,'The Product ID field is required')).notEmpty();
			    let errors = req.validationErrors();
			    if (errors) {
			    	if(totalUploadedImages > 0)
			    	{
			    		/* To delete uploaded file */
			    		custom.unlinkMultipleFile(imagesObj);
			    	}
			        res.send({
			            "code": 200,
			            "response": {},
			            "status": 0,
			            "message": custom.manageValidationMessages(errors)
			        });
			    } else {
			    	let userLoginSessionKey   = req.sanitize('userLoginSessionKey').escape().trim();
			    	let productName           = req.sanitize('productName').escape().trim();
			    	let productDescprition    = req.sanitize('productDescprition').escape().trim();
			    	let productPrice   		  = parseInt(req.sanitize('productPrice').escape().trim());
			    	let productID   		  = parseInt(req.sanitize('productID').escape().trim());
			    	let productImageIDS       = (!req.body.productImageIDS) ? [] : Array.from(new Set(req.body.productImageIDS.split(',')));

			    	async.waterfall([
					    function(callback) {
					        /* To validate user login session key */
							custom.handleLoggedInUser(function(respType,respObj) {
								if(parseInt(respType) === 0){
									/* To delete uploaded file */
					                custom.unlinkMultipleFile(imagesObj);
									return res.send(respObj);
								}else{
									callback(null, respObj,[]);
								}
							},userLoginSessionKey,timezone);
					    }
					], function (err, userDetailsObj,thumbnailUploadedImgPaths) {
					    
					    database.pool.getConnection(function(err, connection) {

					   		/* Begin transaction */
		                    connection.beginTransaction(function(err) {
		                        if (err) {
		                            return res.send(custom.dbErrorResponse());
		                        }

		                        /* Delete old images */
		                        if(parseInt(productImageIDS.length) > 0)
		                        {
		                        	let deleteQuery = "DELETE FROM " + constant.products_images + " WHERE productImageID IN ("+productImageIDS.join()+")";
			                        queryBuilder.reset_query(deleteQuery);
			                        connection.query(deleteQuery, function(err, deleteResp) {
				                        if (err) {
				                            connection.rollback(function() {
				                                return res.send(custom.dbErrorResponse(err.sqlMessage));
				                            });
				                        }
				                    });
		                        }

		                        /* Update Product data */
		                        var updateObj = {};
								updateObj.productName        = productName;
								updateObj.productPrice       = productPrice;
								updateObj.productDescprition = productDescprition;
		                        let i1 = queryBuilder.update(constant.products,updateObj,{productID:productID});
		                        queryBuilder.reset_query(i1);
		                        connection.query(i1, function(err, productResp) {
			                        if (err) {
			                            connection.rollback(function() {
			                                return res.send(custom.dbErrorResponse(err.sqlMessage));
			                            });
			                        }

			                    /* Insert Product images */
			                    if(totalUploadedImages > 0){
			                    	var insertProductImages = [];
			                        for (var i = 0; i < parseInt(imagesObj.length); i++) 
			                        {
			                        	let row = {};
			                        	row.productParentID       = productID;
									    row.productOriginalImage  = (!imagesObj[i].path) ? '' : imagesObj[i].path;
									    row.productThumbnailImage = (!thumbnailUploadedImgPaths[i]) ? '' : thumbnailUploadedImgPaths[i];
									    insertProductImages.push(row);
			                        }
			                        let i2 = queryBuilder.insert_batch(constant.products_images,insertProductImages);
			                        queryBuilder.reset_query(i2);
			                        connection.query(i2, function(err, productResp) {
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

			                            /* Generate image thumbnails (Excecute In Queue OR In Backgroud) */
			                            if(totalUploadedImages > 0)
			                            {
									        for (var i = 0; i < totalUploadedImages; i++) 
											{
												let uploadedFilePath = (!imagesObj[i].path) ? '' : imagesObj[i].path;
												(function(i,uploadedFilePath) {
													/* Generate uploaded image thumbnail */
													custom.getImgThumbnail(function(respType,thumbResp){
														if(parseInt(respType) === 0){
											                console.log('Error - To Create product thumbnail');
														}else{ 
															model.updateData(function(err,updateResp){
																if(err){
																	console.log('Error - Failed to update product thumbnail');
																}else{
																	console.log('Success - Product thumbnail updated successfully');
																}
															},constant.products_images,{productThumbnailImage:thumbResp},{productParentID:productID});
														}
													},uploadedFilePath,uploadPath,200);
												})(i,uploadedFilePath);
											}
										}

			                            /* Return user response */
			            				return res.send({"code" : 200, "response" : {},"status" : 1,"message" : custom.lang(locale,'Product updated sucessfully.')});
			                        }
		                    	});
		                    	});
		                    });
		                });
					});
			    }
	        }
		});
	});

	/* To buy a product
	 * @param {string}  userLoginSessionKey
	 * @param {integer} productID
	 * @param {string}  orderFullName
	 * @param {string}  orderContactNo
	 * @param {string}  orderShippingAddress
	 * @param {string}  orderLandmark
	 * @param {string}  orderCity
	 * @param {string}  orderState
	 * @param {string}  orderCountry
	 * @param {string}  orderZipCode
	 * @param {string}  orderLatitude
	 * @param {string}  orderLongitude
	*/
	app.post('/product/buy-now', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("productID").trim();
		req.sanitize("orderFullName").trim();
		req.sanitize("orderContactNo").trim();
		req.sanitize("orderShippingAddress").trim();
		req.sanitize("orderLandmark").trim();
		req.sanitize("orderCity").trim();
		req.sanitize("orderState").trim();
		req.sanitize("orderCountry").trim();
		req.sanitize("orderZipCode").trim();
		req.sanitize("orderLatitude").trim();
		req.sanitize("orderLongitude").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('productID', custom.lang(locale,'The Product id field is require')).notEmpty();
	    req.check('orderFullName', custom.lang(locale,'The full name field is require')).notEmpty();
	    req.check('orderContactNo', custom.lang(locale,'The contact no field is require')).notEmpty();
	    req.check('orderShippingAddress', custom.lang(locale,'The shipping address field is require')).notEmpty();
	    req.check('orderLandmark', custom.lang(locale,'The landmark field is require')).notEmpty();
	    req.check('orderCity', custom.lang(locale,'The city field is require')).notEmpty();
	    req.check('orderState', custom.lang(locale,'The state field is require')).notEmpty();
	    req.check('orderCountry', custom.lang(locale,'The country field is require')).notEmpty();
	    req.check('orderZipCode', custom.lang(locale,'The zip code field is require')).notEmpty();
	    req.check('orderLatitude', custom.lang(locale,'The order latitude field is require')).notEmpty();
	    req.check('orderLongitude', custom.lang(locale,'The order longitude field is require')).notEmpty();
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
			let productID            = parseInt(req.sanitize('productID').escape().trim());
			let orderFullName        = req.sanitize('orderFullName').escape().trim();
			let orderContactNo       = req.sanitize('orderContactNo').escape().trim();
			let orderShippingAddress = req.body.orderShippingAddress.replace(/<\/?[^>]+(>|$)/g, "");
			let orderLandmark        = req.sanitize('orderLandmark').escape().trim();
			let orderCity            = req.sanitize('orderCity').escape().trim();
			let orderState           = req.sanitize('orderState').escape().trim();
			let orderCountry         = req.sanitize('orderCountry').escape().trim();
			let orderZipCode         = req.sanitize('orderZipCode').escape().trim();
			let orderLatitude        = req.sanitize('orderLatitude').escape().trim();
			let orderLongitude       = req.sanitize('orderLongitude').escape().trim();

			async.waterfall([
			    function(callback) {
			    	/* To validate user login session key */
					custom.handleLoggedInUser(function(respType,respObj) {
						if(parseInt(respType) === 0){
							res.send(respObj);
							return false;
						}else{

							/* Get product details */
							model.getAllWhere(function(err,productResp){
								if(err){
									return res.send(custom.dbErrorResponse());
								}else{
									if(productResp != ""){
										if(parseInt(respObj[0].userId) === parseInt(productResp[0].productUserID)){
											return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,'You can`t purchase your own product')
											        });
										}else{
											/* Get product images */
											model.getAllWhere(function(err,productImagesResp){
												if(err){
													return res.send(custom.dbErrorResponse());
												}else{
													if(productImagesResp != ""){
														callback(null, respObj,productResp,productImagesResp);
													}else{
														return res.send({
														            "code": 200,
														            "response": {},
														            "status": 0,
														            "message": custom.lang(locale,'Product details not found')
														        });
													}
												}
											},constant.products_images,{productParentID:productID});
										}
									}else{
										return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,'Invalid product ID')
											        });
									}
								}
							},constant.products,{productID:productID});
						}
					},userLoginSessionKey,timezone);
			    }
			], function (err,userDetailsObj,productResp,productImagesResp) {
			    
			    database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        let orderProviderAmount = 0;
                        let orderQLFeesAmount   = 0;
                        let orderTotalAmount    = productResp[0].productPrice;
                        orderQLFeesAmount       = custom.parseNumber((orderTotalAmount * constant.product_fees) / 100);
                        orderProviderAmount     = custom.parseNumber(orderTotalAmount - orderQLFeesAmount);

                        /* Insert Order Details */
					    let orderObj = {};
					    orderObj.orderCustomID = custom.generateCustomID('OID');
					    orderObj.orderUserID   = userDetailsObj[0].userId;
					    orderObj.orderProductOwnerUserID = productResp[0].productUserID;
					    orderObj.orderTotalAmount        = orderTotalAmount;
					    orderObj.orderProviderAmount     = orderProviderAmount;
					    orderObj.orderQLFeesAmount       = orderQLFeesAmount;
					    orderObj.orderFullName           = orderFullName;
					    orderObj.orderContactNo          = orderContactNo;
					    orderObj.orderShippingAddress    = orderShippingAddress;
					    orderObj.orderLandmark           = orderLandmark;
					    orderObj.orderCity               = orderCity;
					    orderObj.orderState              = orderState;
					    orderObj.orderCountry            = orderCountry;
					    orderObj.orderZipCode            = orderZipCode;
					    orderObj.orderLatitude           = orderLatitude;
					    orderObj.orderLongitude          = orderLongitude;
					    orderObj.orderDateTime           = custom.getCurrentTime();
                        let i1 = queryBuilder.insert(constant.orders,orderObj);
                        queryBuilder.reset_query(i1);
                        connection.query(i1, function(err, orderResp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }
	                        if(!orderResp){
	                        	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Failed to purchase a product.')
									        });
	                        }
	                    var orderID = parseInt(orderResp.insertId);
	                    let orderProductOriginalImages  = new Array();
	                    let orderProductThumbnailImages = new Array();
	                    if(parseInt(productImagesResp.length) > 0)
	                    {
	                    	for (var i = 0; i < parseInt(productImagesResp.length); i++) 
	                    	{
	                    		if(productImagesResp[i].productOriginalImage){
	                    			orderProductOriginalImages.push(productImagesResp[i].productOriginalImage);
	                    		}
	                    		if(productImagesResp[i].productThumbnailImage){
	                    			orderProductThumbnailImages.push(productImagesResp[i].productThumbnailImage);
	                    		}
	                    	}
	                    }


	                    /* Insert product order details */
					   	let orderProductObj = {};
                		orderProductObj.orderParentID               = orderID;
                		orderProductObj.orderProductUserID          = productResp[0].productUserID;
                		orderProductObj.orderProductName            = productResp[0].productName;
                		orderProductObj.orderProductPrice           = productResp[0].productPrice;
                		orderProductObj.orderProductDescprition     = productResp[0].productDescprition;
                		orderProductObj.orderProductOriginalImages  = JSON.stringify(orderProductOriginalImages);
                		orderProductObj.orderProductThumbnailImages = JSON.stringify(orderProductThumbnailImages);
                        let i2 = queryBuilder.insert(constant.order_products,orderProductObj);
                        queryBuilder.reset_query(i2);
                        connection.query(i2, function(err, orderProductResp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }
	                        if(!orderProductResp){
	                        	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Failed to purchase a product.')
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
			            		return res.send({"code" : 200, "response" : {orderID:orderID},"status" : 1,"message" : custom.lang(locale,'success.')});
	                        }
                    	});
                    	});
                    	});
                	});
				}); 
			});
		}
	});

	/* To complete a order payment
	 * @param {string}  userLoginSessionKey
	 * @param {integer} orderID
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
	app.post('/order/payment', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
		let paymentType = (!req.body.paymentType) ? '' : req.body.paymentType;
		let isPayByCard = (!req.body.isPayByCard) ? '' : parseInt(req.body.isPayByCard);
		let wantToSaveCard = (!req.body.wantToSaveCard) ? '' : parseInt(req.body.wantToSaveCard);
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("orderID").trim();
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
	    req.check('orderID', custom.lang(locale,'The Order id field is require')).notEmpty();
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
			let userLoginSessionKey = req.sanitize('userLoginSessionKey').escape().trim();
			let orderID             = parseInt(req.sanitize('orderID').escape().trim());
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
							res.send(respObj);
							return false;
						}else{

							/* Get order details */
							model.getAllWhere(function(err,orderResp){
								if(err){
									return res.send(custom.dbErrorResponse());
								}else{
									if(orderResp != ""){
										if(orderResp[0].orderUserID != respObj[0].userId)
										{
											return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,'You can not make payment')
											        });
										}

										if(orderResp[0].orderPaymentStatus === "COMPLETED"){
											return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,'Order payment already done')
											        });
										}else{
											let orderTotalAmount = orderResp[0].orderTotalAmount;
											if(paymentType === 'WALLET' && walletAmount != orderTotalAmount){
												return res.send({
											                        "code": 200,
											                        "response": {orderTotalAmount:orderTotalAmount},
											                        "status": 0,
											                        "message": custom.lang(locale,'Wallet amount should be equals to order amount.')
											                    });
											}else if(paymentType === 'CARD'){
												cardAmount = orderTotalAmount;
											}else if(paymentType === 'WALLET_AND_CARD'){
												cardAmount = orderTotalAmount - walletAmount;
											}
											if(paymentType === 'WALLET' || paymentType === 'WALLET_AND_CARD'){

												/* Check user wallet balance */
												let userWalletAmount = custom.parseNumber(respObj[0].userWalletAmount);
												if(userWalletAmount >= walletAmount){
													callback(null, respObj,orderResp,cardAmount);
												}else{
													return res.send({
											                        "code": 200,
											                        "response": {userWalletAmount:userWalletAmount},
											                        "status": 7,
											                        "message": custom.lang(locale,'Insufficient amount in your wallet.')
											                    });
												}
											}else{
												callback(null, respObj,orderResp,cardAmount);
											}
										}
									}else{
										return res.send({
											            "code": 200,
											            "response": {},
											            "status": 0,
											            "message": custom.lang(locale,'Invalid Order ID')
											        });
									}
								}
							},constant.orders,{orderID:orderID});
						}
					},userLoginSessionKey,timezone);
			    },
			    function(userDetailsObj,orderResp,cardAmount, callback) {

			    	if(paymentType === 'CARD' || paymentType === 'WALLET_AND_CARD'){
				    	if(isPayByCard === 1){

				    		/* Pay by card */
				    		stripe.payBySavedCard(function(err,paymentResp){
								if(err){

									/* Insert Transaction history (Backgroud Process) */
	                                let txnObj = {};
	                                txnObj.transactionUserID   = userDetailsObj[0].userId;
	                                txnObj.transactionFriendID = orderResp[0].orderProductOwnerUserID;
	                                txnObj.transactionCustomID = custom.generateCustomID('TXN');
	                                txnObj.transactionAmount   = cardAmount;
	                                txnObj.transactionDateTime = custom.getCurrentTime();
	                                txnObj.transactionStatus   = 'FAILED';
	                                txnObj.transactionModuleName = 'PURCHASE_PRODUCT';
	                                txnObj.transactionMessage    = '$' + cardAmount + ' failed to purchase a product';
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
	                                    txnObj.transactionFriendID = orderResp[0].orderProductOwnerUserID;
	                                    txnObj.transactionCustomID = custom.generateCustomID('TXN');
	                                    txnObj.transactionAmount   = cardAmount;
	                                    txnObj.transactionDateTime = custom.getCurrentTime();
	                                    txnObj.transactionStatus   = 'COMPLETED';
	                                    txnObj.transactionModuleName = 'PURCHASE_PRODUCT';
	                                    txnObj.transactionMessage    = '$' + cardAmount + ' amount deducted while purchase a product';
	                                    txnObj.transactionPaymentResponse = JSON.stringify(paymentResp);
	                                    txnObj.transactionPaymentDateTime = custom.getCurrentTime();
	                                    model.insertData(function(err,resp){
	                                        if(err){
	                                            console.log('Failed to add transactions',err);
	                                        }
	                                    },constant.transactions,txnObj);

										callback(null, userDetailsObj,orderResp,cardAmount,paymentResp);
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
				    		let paymentDescprition = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " has purchased a product";
				    		stripe.payViaCardDetails(function(err,paymentResp){
								if(err){

									/* Insert Transaction history (Backgroud Process) */
	                                let txnObj = {};
	                                txnObj.transactionUserID   = userDetailsObj[0].userId;
	                                txnObj.transactionFriendID = orderResp[0].orderProductOwnerUserID;
	                                txnObj.transactionCustomID = custom.generateCustomID('TXN');
	                                txnObj.transactionAmount   = cardAmount;
	                                txnObj.transactionDateTime = custom.getCurrentTime();
	                                txnObj.transactionStatus   = 'FAILED';
	                                txnObj.transactionModuleName = 'PURCHASE_PRODUCT';
	                                txnObj.transactionMessage    = '$' + cardAmount + ' failed to purchase a product';
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
	                                    txnObj.transactionFriendID = orderResp[0].orderProductOwnerUserID;
	                                    txnObj.transactionCustomID = custom.generateCustomID('TXN');
	                                    txnObj.transactionAmount   = cardAmount;
	                                    txnObj.transactionDateTime = custom.getCurrentTime();
	                                    txnObj.transactionStatus   = 'COMPLETED';
	                                    txnObj.transactionModuleName = 'PURCHASE_PRODUCT';
	                                    txnObj.transactionMessage    = '$' + cardAmount + ' amount deducted while purchase a product';
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

										callback(null, userDetailsObj,orderResp,cardAmount,paymentResp);
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
				    	callback(null, userDetailsObj,orderResp,cardAmount,{});
				    }
			    },function(userDetailsObj,orderResp,cardAmount,paymentResp, callback) {

			    	/* Get provider details */
			    	let providerID = orderResp[0].orderProductOwnerUserID; 
			    	model.getAllWhere(function(err,providerDetails){
			    		if(err){
							return res.send(custom.dbErrorResponse());
						}else{
							if(providerDetails != ""){
								callback(null, userDetailsObj,orderResp,cardAmount,paymentResp,providerDetails);
							}else{

								return res.send({
										            "code": 200,
										            "response": {},
										            "status": 0,
										            "message": custom.lang(locale,'Provider details not found')
										        });
							}
						}
			    	},constant.user_details,{userId:providerID});
			    }
			], function (err,userDetailsObj,orderResp,cardAmount,paymentResp,providerDetails) {
			    
			    database.pool.getConnection(function(err, connection) {

			   		/* Begin transaction */
                    connection.beginTransaction(function(err) {
                        if (err) {
                            return res.send(custom.dbErrorResponse());
                        }

                        /* Update Order Details */
					    let orderObj = {};
					    orderObj.orderPaymentGatewayAmount = cardAmount;
					    orderObj.orderWalletAmount         = walletAmount;
					    orderObj.orderPaymentStatus        = 'COMPLETED';
					    if(paymentType === 'CARD' || paymentType === 'WALLET_AND_CARD'){
					    	orderObj.orderPaymentTxnID         = (!paymentResp.balance_transaction) ? '' : paymentResp.balance_transaction;
					    	orderObj.orderPaymentResponse      = JSON.stringify(paymentResp);
					    }
					    orderObj.orderPaymentDateTime      = custom.getCurrentTime();
                        let i1 = queryBuilder.update(constant.orders,orderObj,{orderID:orderID});
                        queryBuilder.reset_query(i1);
                        connection.query(i1, function(err, orderUpdateResp) {
	                        if (err) {
	                            connection.rollback(function() {
	                                return res.send(custom.dbErrorResponse(err.sqlMessage));
	                            });
	                        }
	                        if(!orderUpdateResp){
	                        	return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,'Failed to complete payment.')
									        });
	                        }

	                    let orderProviderAmount = orderResp[0].orderProviderAmount;
	                    let providerID          = orderResp[0].orderProductOwnerUserID;
	                    let userId              = userDetailsObj[0].userId;

	                    /* Update buyer wallet amount */
	                    if(paymentType === 'WALLET' || paymentType === 'WALLET_AND_CARD')
	                    {
	                    	let u1 = "UPDATE (`"+constant.user_details+"`) SET `userWalletAmount` = userWalletAmount - " + walletAmount + " WHERE `userId` = " + userId;
	                        queryBuilder.reset_query(u1);
	                        connection.query(u1, function(err, resp) {
		                        if (err) {
		                            connection.rollback(function() {
		                                return res.send(custom.dbErrorResponse(err.sqlMessage));
		                            });
		                        }
		                    });
	                    }

	                    /* Update provider amount */
                        let u2 = "UPDATE (`"+constant.user_details+"`) SET `userWalletAmount` = userWalletAmount + " + orderProviderAmount + " WHERE `userId` = " + providerID;
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

	                            /* Insert Wallet Transaction history - Hirer */
	                            if(paymentType === 'WALLET' || paymentType === 'WALLET_AND_CARD')
	                            {
	                            	let currentBalance = parseFloat(parseFloat(userDetailsObj[0].userWalletAmount) - walletAmount).toFixed(2);
                                    let walletObj = {};
                                    walletObj.walletUserID          = userId;
                                    walletObj.walletAmount          = walletAmount;
                                    walletObj.walletRemainingAmount = currentBalance;
                                    walletObj.walletTxnType         = 'DEDUCT';
                                    walletObj.walletTxnReason       = 'PURCHASE_PRODUCT';
                                    walletObj.walletTxnID           = custom.generateCustomID('QL');
                                    walletObj.walletTxnStatus       = 'COMPLETED';
                                    walletObj.walletTxnDateTime     = custom.getCurrentTime();
                                    walletObj.walletExtraParams     = JSON.stringify({orderID:orderID,walletTypeAccount:'MAIN_AC',walletAccountTxnType:'DEDUCT'});
                                    model.insertData(function(err,resp){
                                        if(err){
                                            console.log('Failed to add wallet transactions');
                                        }
                                    },constant.wallet,walletObj);
	                            }

	                            /* Insert Wallet Transaction history - Provider */
                            	let currentBalance1 = parseFloat(parseFloat(providerDetails[0].userWalletAmount) + orderProviderAmount).toFixed(2);
                            	let walletObj = [];
                            	let walletID  = custom.generateCustomID('QL');

                                let walletProviderObj = {};
                                walletProviderObj.walletUserID          = providerID;
                                walletProviderObj.walletAmount          = orderResp[0].orderTotalAmount;
                                walletProviderObj.walletRemainingAmount = currentBalance1;
                                walletProviderObj.walletTxnType         = 'ADDED';
                                walletProviderObj.walletTxnReason       = 'PURCHASE_PRODUCT';
                                walletProviderObj.walletTxnID           = walletID;
                                walletProviderObj.walletTxnStatus       = 'COMPLETED';
                                walletProviderObj.walletTxnDateTime     = custom.getCurrentTime();
                                walletProviderObj.walletExtraParams     = JSON.stringify({orderID:orderID,walletTypeAccount:'MAIN_AC',walletAccountTxnType:'ADDED'});
                                walletObj.push(walletProviderObj);

                                let walletProviderObj1 = {};
                                walletProviderObj1.walletUserID          = providerID;
                                walletProviderObj1.walletAmount          = orderResp[0].orderQLFeesAmount;
                                walletProviderObj1.walletRemainingAmount = currentBalance1;
                                walletProviderObj1.walletTxnType         = 'DEDUCT';
                                walletProviderObj1.walletTxnReason       = 'PURCHASE_PRODUCT_QL_COMISSION';
                                walletProviderObj1.walletTxnID           =  walletID;
                                walletProviderObj1.walletTxnStatus       = 'COMPLETED';
                                walletProviderObj1.walletTxnDateTime     = custom.getCurrentTime();
                                walletProviderObj1.walletExtraParams     = JSON.stringify({orderID:orderID,walletTypeAccount:'MAIN_AC',walletAccountTxnType:'DEDUCT'});
                                walletObj.push(walletProviderObj1);
                                model.insertBulkData(function(err,resp){
                                    if(err){
                                        console.log('Failed to add wallet transactions');
                                    }
                                },constant.wallet,walletObj);

	                            /* Insert order notification */
							   	let notificationDataObj = {};
		                		notificationDataObj.notificationUserId   = userId;
		                		notificationDataObj.notificationFriendId = providerID;
		                		notificationDataObj.orderModuleID        = orderID;
		                		notificationDataObj.notificationModule   = 'PROVIDER';
		                		notificationDataObj.notificationType     = 'PURCHASE_PRODUCT';
		                		notificationDataObj.notificationMessage  = 'has purchased a product';
		                		notificationDataObj.notificationSentTime = custom.getCurrentTime();
		                		model.insertData(function(err,notificationResp){
	                            	if(err){
	                            		console.log('Order app notification error',err);
	                            	}else{
	                            		console.log('Order app notification success');
	                            	}
	                            },constant.notifications,notificationDataObj);

	                            /* Update provider badges */
	                            let updateQuery = "UPDATE (`"+constant.user_details+"`) SET `userBadges` = userBadges + 1 WHERE `userId` = " + providerID;
	                            model.customQuery(function(err,badgesResp){
	                            	if(err){
	                            		console.log('Order app notification badges error',err);
	                            	}else{
	                            		console.log('Order app notification badges success');
	                            	}
	                            },updateQuery);

	                            /* To send push notifications */
	                            let userMessage = userDetailsObj[0].userFirstName + " " + userDetailsObj[0].userLastName + " has purchased a product";
	                            let extraParams = {};
	                            extraParams.orderModuleID           = orderID;
	                            extraParams.orderUserID             = userId;
	                            extraParams.orderProductOwnerUserID = providerID;
	                            extraParams.moduleName              = 'PROVIDER';
	                            extraParams.notificationType        = 'PURCHASE_PRODUCT';
	                            notification.sendPushNotifications(userMessage,providerID,extraParams);

	                            /* Manage admin report */
	                            let reportObj = {};
                                reportObj.reportUserID = userId;
                                reportObj.reportAmount = orderResp[0].orderQLFeesAmount;
                                reportObj.reportAmountType  = 1;
                                reportObj.reportModuleName  = 'PURCHASE_PRODUCT';
                                reportObj.reportExtraParams = JSON.stringify({orderID:orderID});
                                reportObj.reportDateTime    = custom.getCurrentTime();
                                model.insertData(function(err,resp){
                                    if(err){
                                        console.log('Failed to add reports');
                                    }
                                },constant.reports,reportObj);

	                            /* Return user response */
			            		return res.send({"code" : 200, "response" : {},"status" : 1,"message" : custom.lang(locale,'Payment successfully done.')});
	                        }
                    	});
                    	});
                    	});
                	});
				}); 
			});
		}
	});

	/* To get order details
	 * @param {string}  userLoginSessionKey
	 * @param {integer} orderID 
	*/
	app.post('/order/details', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("orderID").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('orderID', custom.lang(locale,'The Order id field is require')).notEmpty();
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
			let orderID             = parseInt(req.sanitize('orderID').escape().trim());

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
					},userLoginSessionKey,timezone);
			    },
			    function(userDetailsObj, callback) {
			    	let allowed_users = new Array();

			    	/* To get orders details */
			    	let orderQuery = 'SELECT * FROM ' + constant.orders + ' AS `O` INNER JOIN ' + constant.order_products + ' AS `OP` ON `O`.`orderID` = `OP`.`orderParentID` WHERE `O`.`orderID` = ' + orderID;
			    	model.customQuery(function(err,orderObj){
				        	if(err){
			                    return res.send(custom.dbErrorResponse());
			                }else{
			                	if(orderObj != ""){
			                		allowed_users.push(orderObj[0].orderUserID);
			                		allowed_users.push(orderObj[0].orderProductOwnerUserID);
			                		if(allowed_users.indexOf(userDetailsObj[0].userId) >= 0){
			                			callback(null, userDetailsObj, orderObj);
			                		}else{
			                			return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,"You are not authorized to see order details.")
									        });
			                		}
			                	}else{
			                		return res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message": custom.lang(locale,"Order details not found.")
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

	/* To get orders listing 
	 * @param {string}  userLoginSessionKey
	   @param {integer} pageNo
	 * @param {string}  orderType [MY_ORDERS,RECEIVED_ORDERS]
	*/
	app.post('/orders/listing', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("pageNo").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('pageNo', custom.lang(locale,'Required page number')).notEmpty();
	    req.check('pageNo', custom.lang(locale,'Page number minimum value should be 1')).minValue(1);
	    req.check('orderType', custom.lang(locale,'The order type field is required')).notEmpty();
	    req.check('orderType', custom.lang(locale,'The order type should be in MY_ORDERS, RECEIVED_ORDERS')).inList(["MY_ORDERS","RECEIVED_ORDERS"]);
	    let errors = req.validationErrors();
	    if (errors) {
	        res.send({
	            "code": 200,
	            "response": [],
	            "status": 0,
	            "message": custom.manageValidationMessages(errors)
	        });
	    } else {
			let userLoginSessionKey  = req.sanitize('userLoginSessionKey').escape().trim();
			let pageNo               = parseInt(req.sanitize('pageNo').escape().trim());
			let orderType            = req.sanitize('orderType').escape().trim();

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

			    	/* To get orders data */
			    	if(orderType === 'RECEIVED_ORDERS'){
			    		var orderQuery = "SELECT * FROM " + constant.orders + " AS `O` INNER JOIN " + constant.user_details + " AS `UD` ON `UD`.`userId` = `O`.`orderProductOwnerUserID` INNER JOIN `order_products` AS `OP` ON `OP`.`orderParentID` = `O`.`orderID` WHERE `O`.`orderProductOwnerUserID` = " + masterUserId + " AND `O`.`orderPaymentStatus` = 'COMPLETED' AND `UD`.`userId` NOT IN ("+notInUserIds.join()+") ORDER BY `O`.`orderID` DESC ";
			    	}else{
			    		var orderQuery = "SELECT * FROM " + constant.orders + " AS `O` INNER JOIN " + constant.user_details + " AS `UD` ON `UD`.`userId` = `O`.`orderUserID` INNER JOIN `order_products` AS `OP` ON `OP`.`orderParentID` = `O`.`orderID` WHERE `O`.`orderUserID` = " + masterUserId + " AND `O`.`orderPaymentStatus` IN ('COMPLETED','FAILED') AND `UD`.`userId` NOT IN ("+notInUserIds.join()+") ORDER BY `O`.`orderID` DESC ";
			    	}
			    	model.customQuery(function(err,ordersObj){
			    		if(err){
		                    return res.send(custom.dbErrorResponse());
		                }else{
		                	let totalOrders = parseInt(ordersObj.length);
		                	if(offset > 0){
					    		orderQuery += "LIMIT " + offset + "," + constant.results_limit;
					    	}else{
					    		orderQuery += "LIMIT " + constant.results_limit
					    	}
					        model.customQuery(function(err,orderRespObj){
					        	if(err){
				                    return res.send(custom.dbErrorResponse());
				                }else{
				                	if(orderRespObj != ""){
				                		callback(null, userDetailsObj, orderRespObj,totalOrders);
				                	}else{
				                		return res.send({
										            "code": 200,
										            "response": [],
										            "status": 0,
										            "message": custom.lang(locale,"Orders not found.")
										        });
				                	}
				                }
					        },orderQuery);
		                }
		            },orderQuery);
			    }
			], function (err,userDetailsObj,orderObj,totalOrders) {
			    
			    let masterUserId = parseInt(userDetailsObj[0].masterUserId);
				let responseObj  = [];
				for (var o = 0; o < parseInt(orderObj.length); o++) 
                {
                	let row = {};
                	let orderProductOriginalImagesArr  = new Array();
					let orderProductThumbnailImagesArr = new Array();
					let orderProductOrigi
					let orderProductOriginalImages   = (!orderObj[o].orderProductOriginalImages)  ? new Array() : JSON.parse(orderObj[o].orderProductOriginalImages);
					let orderProductThumbnailImages    = (!orderObj[o].orderProductThumbnailImages) ? new Array() : JSON.parse(orderObj[o].orderProductThumbnailImages);
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
					row.orderID                   = parseInt(orderObj[o].orderID);
			    	row.orderCustomID             = custom.nullChecker(orderObj[o].orderCustomID);
			    	row.orderUserID               = parseInt(orderObj[o].orderUserID);
			    	row.orderProductOwnerUserID   = parseInt(orderObj[o].orderProductOwnerUserID);
			    	row.orderTotalAmount          = custom.parseNumber(orderObj[o].orderTotalAmount);
			    	row.orderProviderAmount       = custom.parseNumber(orderObj[o].orderProviderAmount);
			    	row.orderFullName  	          = custom.nullChecker(orderObj[o].orderFullName);
			    	row.orderContactNo  	      = custom.nullChecker(orderObj[o].orderContactNo);
			    	row.orderShippingAddress  	  = custom.nullChecker(orderObj[o].orderShippingAddress);
			    	row.orderLandmark  	          = custom.nullChecker(orderObj[o].orderLandmark);
			    	row.orderCity  	              = custom.nullChecker(orderObj[o].orderCity);
			    	row.orderState  	          = custom.nullChecker(orderObj[o].orderState);
			    	row.orderCountry  	          = custom.nullChecker(orderObj[o].orderCountry);
			    	row.orderZipCode  	          = custom.nullChecker(orderObj[o].orderZipCode);
			    	row.orderLatitude  	          = custom.nullChecker(orderObj[o].orderLatitude);
			    	row.orderLongitude  	      = custom.nullChecker(orderObj[o].orderLongitude);
			    	row.orderDateTime  	          = custom.changeDateFormat(orderObj[o].orderDateTime);
			    	row.orderPaymentGatewayAmount = (!orderObj[o].orderPaymentGatewayAmount) ? 0 : custom.parseNumber(orderObj[o].orderPaymentGatewayAmount);
			    	row.orderWalletAmount         = (!orderObj[o].orderWalletAmount) ? 0 : custom.parseNumber(orderObj[o].orderWalletAmount);
			    	row.orderPaymentDateTime  	  = (!orderObj[o].orderPaymentDateTime) ? '' : custom.changeDateFormat(orderObj[o].orderPaymentDateTime);
			    	row.orderPaymentStatus  	  = custom.nullChecker(orderObj[o].orderPaymentStatus);
			    	row.orderPaymentTxnID  	      = custom.nullChecker(orderObj[o].orderPaymentTxnID);
			    	row.orderProductName  	      = custom.nullChecker(orderObj[o].orderProductName);
			    	row.orderProductPrice  	      = custom.parseNumber(orderObj[o].orderProductPrice);
			    	row.orderProductDescprition   = custom.nullChecker(orderObj[o].orderProductDescprition);
			    	row.orderProductOriginalImages= orderProductOriginalImagesArr;
			    	row.orderProductThumbnailImages= orderProductThumbnailImagesArr;
                	responseObj.push(row);
                	if (o === parseInt(orderObj.length - 1)) {
                      return res.send({
						            "code": 200,
						            "response": responseObj,
						            "status": 1,
						            "totalCount": totalOrders,
						            "message": custom.lang(locale,"success.")
						        });
                    }
                }
			    
			});
		}
	});


	


}

function getImgThumbnail1(callBack,uploadedFilePath,uploadDestPath,thumbailWidth,proID){
	let thumb = require('node-thumbnail').thumb;
	
	(function(x){
		
			thumb({
				source: uploadedFilePath, // could be a filename: dest/path/image.jpg 
				destination: uploadDestPath,
				suffix: '-thumb',
				width:thumbailWidth,
				concurrency: 4
			  }, function(files, err, stdout, stderr) {
				  if(err){
					  console.log('thumbnailErr',err);
					  let errResp = {"code": 200,"response": {},"status": 0,"message": err.toString()};
					  return callBack(0,errResp);
				  }else{
					  if(files){
						  let thumbFile     = files[0].dstPath;
						  let removeFileDot = thumbFile.replace("./", "");
						  let thumbnailFinalPath = removeFileDot.replace("//", "/");
						  return callBack(1,thumbnailFinalPath,files);
						 
					  }else{
						  let errResp = {"code": 200,"response": {},"status": 0,"message": 'Failed to generate image thumbnail.'};
						  return callBack(0,errResp);
					  }
				  }
			  });
	
	})(proID);
	
}

function updateThumbnail (uploadedFilePath1,producatImgid1,rObject){
	let helperClass = custom;
	let proId = producatImgid1;
	getImgThumbnail1(function(respType,thumbResp,files){
		if(parseInt(respType) === 0){
            console.log('Error - To Create product thumbnail');
		}else{ 
			var id = rObject[files[0].srcPath];
			updateThumbnailRecord(thumbResp,id);
		}
	},uploadedFilePath1,uploadPath,200,proId);
}

function updateThumbnailRecord(thumbResp,producatImgid2){
	var updateQuery = "UPDATE (" +constant.products_images+ ") SET `productThumbnailImage` = '" + thumbResp + "' WHERE `productImageID` = " + producatImgid2;
    	database.getConn(updateQuery, function (err, updateResp) {
    		if(err){
				console.log('Error - Failed to update product thumbnail');
			}else{
				console.log('Success - Product thumbnail updated successfully');
			}
    	});
	}