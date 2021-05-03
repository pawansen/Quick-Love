"use strict";

/*
 * Purpose : For Skills Rest API
 * Package : Skills
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

	/* To add provider skills
	 * @param {string}  userLoginSessionKey
	 * @param {string}  skillName
	*/
	app.post('/provider/add-skill', function(req, res) {
	    let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
    	req.sanitize("userLoginSessionKey").trim();
    	req.sanitize("skillName").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('skillName', custom.lang(locale,'The Skill name field is required')).notEmpty();
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
	    	let skillName             = req.sanitize('skillName').escape().trim();

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
			    	/* To check already added skill */
			    	model.getAllWhere(function(err,skillResp){
			    		if(err){
	                        return res.send(custom.dbErrorResponse());
	                    }else{
	                    	if(skillResp != ""){
	                    		return  res.send({
								            "code": 200,
								            "response": {},
								            "status": 0,
								            "message":custom.lang(locale,'Skill already created.') 
								        });
	                    	}else{
	                    		callback(null, userDetailsObj,1);
	                    	}
	                    }
			    	},constant.skills,{skillUserID:userDetailsObj[0].userId,skillName:skillName});
			    }
			], function (err, userDetailsObj,respType) {
			    
			    var insertDataObj = {};
				insertDataObj.skillUserID         = userDetailsObj[0].userId;
				insertDataObj.skillName           = skillName;
				insertDataObj.skillAddedDate      = custom.getCurrentTime();
				model.insertData(function(err,resp){
                    if(err){
                        return res.send(custom.dbErrorResponse());
                    }else{
                    	var lid = parseInt(resp.insertId);
                    	if(lid > 0){
                    		return  res.send({
						            "code": 200,
						            "response": {},
						            "status": 1,
						            "message":custom.lang(locale,'Skill added successfully.') 
						        });
                    	}else{
	                        return  res.send({
								            "code": 200,
								            "response": {},
								            "status": 0,
								            "message":custom.lang(locale,'Failed to add skills.') 
								        });
                    	}
                    }
                },constant.skills,insertDataObj);
			});
	    }
			
	});

	/* To get skills listing & details
	 * @param {integer}  userID
	   @param {integer} pageNo (optional)
	 * @param {integer} skillID (optional)
	*/
	app.post('/skills/listing-details', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
		let skillID = (!req.body.skillID) ? '' : req.body.skillID;
		req.sanitize("userID").trim();
		if(skillID){
			req.sanitize("skillID").trim();
		}else{
			req.sanitize("pageNo").trim();
		}
	    req.check('userID', custom.lang(locale,'The User ID field is required')).notEmpty();
	    if(skillID){
	    	req.check('skillID', custom.lang(locale,'The skill id field is require')).notEmpty();
	    }else{
	    	req.check('pageNo', custom.lang(locale,'Required page number')).notEmpty();
	    	req.check('pageNo', custom.lang(locale,'Page number minimum value should be 1')).minValue(1);
	    }
	    let errors = req.validationErrors();
	    if (errors) {
	        res.send({
	            "code": 200,
	            // "response": {},
	            "status": 0,
	            "message": custom.manageValidationMessages(errors)
	        });
	    } else {
			let userID   = parseInt(req.sanitize('userID').escape().trim());
			let pageNo   = (!req.body.pageNo) ? '' : req.body.pageNo;;
			let skillID  = (!req.body.skillID) ? '' : req.body.skillID;;
			if(skillID){
				skillID = parseInt(req.sanitize('skillID').escape().trim());
			}else{
				pageNo    = parseInt(req.sanitize('pageNo').escape().trim());
			}

			async.waterfall([
			    function(callback) {
			    	let respObj = [];
			    	respObj.push({userId:userID});
			    	callback(null, respObj);
			    },
			    function(userDetailsObj, callback) {
			    	if(skillID){

			    		/* To get user skill details */
				        model.getAllWhere(function(err,skillsObj){
				        	if(err){
			                    return res.send(custom.dbErrorResponse());
			                }else{
			                	if(skillsObj != ""){
			                		callback(null, userDetailsObj, skillsObj,'DETAILS',1);
			                	}else{
			                		return res.send({
									            "code": 200,
									            // "response": {},
									            "status": 0,
									            "message": custom.lang(locale,"Skill details not found.")
									        });
			                	}
			                }
				        },constant.skills,{skillUserID:userDetailsObj[0].userId,skillID:skillID});
			    	}else{
			    		model.getCount(function(err,totalSkills){
			    			if(err){
			                    return res.send(custom.dbErrorResponse());
			                }else{
			                	if(parseInt(totalSkills) > 0){

			                		/* To get offset */
							    	let offset = custom.getOffset(pageNo);

							    	/* To get user services */
							        model.getAllWhere(function(err,skillsObj){
							        	if(err){
						                    return res.send(custom.dbErrorResponse());
						                }else{
						                	if(skillsObj != ""){
						                		callback(null, userDetailsObj, skillsObj,'LIST',totalSkills);
						                	}else{
						                		return res.send({
												            "code": 200,
												            // "response": [],
												            "status": 0,
												            "message": custom.lang(locale,"Services not found.")
												        });
						                	}
						                }
							        },constant.skills,{skillUserID:userDetailsObj[0].userId},'skillName','ASC','*',constant.results_limit,offset);
			                	}else{
			                		return res.send({
									            "code": 200,
									            // "response": [],
									            "status": 0,
									            "message": custom.lang(locale,"Skills not found.")
									        });
			                	}
			                }
			    		},constant.skills,{skillUserID:userDetailsObj[0].userId});
			    	}
			    }
			], function (err,userDetailsObj,skillsObj,resultType,totalSkills) {
			    if(resultType === 'LIST'){ // LIST

			    	let responseObj = [];
				    for (var i = 0; i < parseInt(skillsObj.length); i++) 
				    {
				    	let row = {};
				    	row.skillID         = parseInt(skillsObj[i].skillID);
				    	row.isMainSkill     = parseInt(skillsObj[i].isMainSkill);
				    	row.skillName       = custom.nullChecker(skillsObj[i].skillName);
				    	row.skillAddedDate  = custom.changeDateFormat(skillsObj[i].skillAddedDate);
				    	responseObj.push(row);
				    }
				    return res.send({
						            "code": 200,
						            "response": responseObj,
						            "totalCount": totalSkills,
						            "status": 1,
						            "message": "success"
						        });
			    }else{ // DETAILS
			    	let responseObj = {};
			    	responseObj.skillID        = parseInt(skillsObj[0].skillID);
			    	responseObj.isMainSkill    = parseInt(skillsObj[0].isMainSkill);
			    	responseObj.skillName      = custom.nullChecker(skillsObj[0].skillName);
			    	responseObj.skillAddedDate = custom.changeDateFormat(skillsObj[0].skillAddedDate);
			    	return res.send({
						            "code": 200,
						            "response": responseObj,
						            "status": 1,
						            "message": "success"
						        });
			    }
			});
		}
	});

	/* To delete skill
	 * @param {string}  userLoginSessionKey
	 * @param {integer} skillID
	*/
	app.post('/skills/delete', function(req, res) {
		let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
		req.sanitize("userLoginSessionKey").trim();
		req.sanitize("skillID").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('skillID', custom.lang(locale,'The skill id field is require')).notEmpty();
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
			let skillID = parseInt(req.sanitize('skillID').escape().trim());

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
			    
			    /* To delete skill */
			    model.deleteData(function(err,resp){
			    	if(err){
	                    return res.send(custom.dbErrorResponse());
	                }else{
	                	if(parseInt(resp.affectedRows) > 0){
	                		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 1,
							            "message": custom.lang(locale,"Skill deleted successfully.")
							        });
	                	}else{
	                		return res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message": custom.lang(locale,"Failed to delete skill.")
							        });
	                	}
	                }
			    },constant.skills,{skillID:skillID,skillUserID:userDetailsObj[0].userId});
			});
		}
	});

	/* To edit provider skill
	 * @param {string}  userLoginSessionKey
	 * @param {string}  skillName
	 * @param {integer} skillID
	*/
	app.post('/provider/edit-skill', function(req, res) {
		let timezone   = req.headers.timezone;
		let locale     = req.headers.locale;
		req.sanitize("userLoginSessionKey").trim();
    	req.sanitize("skillID").trim();
    	req.sanitize("skillName").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('skillID', custom.lang(locale,'The Skill id field is required')).notEmpty();
	    req.check('skillName', custom.lang(locale,'The Skill name field is required')).notEmpty();
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
	    	let skillID             = parseInt(req.sanitize('skillID').escape().trim());
	    	let skillName           = req.sanitize('skillName').escape().trim();
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

			    	/* To check already added skill */
			    	model.getAllWhere(function(err,skillResp){
			    		if(err){
	                        return res.send(custom.dbErrorResponse());
	                    }else{
	                    	if(skillResp != ""){
	                    		return  res.send({
								            "code": 200,
								            "response": {},
								            "status": 0,
								            "message":custom.lang(locale,'Skill already created.') 
								        });
	                    	}else{
	                    		callback(null, userDetailsObj,1);
	                    	}
	                    }
			    	},constant.skills,{skillUserID:userDetailsObj[0].userId,skillName:skillName});
			    	
			    }
			], function (err, userDetailsObj,respType) {
			    
			    var updateDataObj = {};
				updateDataObj.skillName = skillName;
				model.updateData(function(err,resp){
                    if(err){
                        return res.send(custom.dbErrorResponse());
                    }else{
                    	if(parseInt(resp.changedRows) > 0){
                    		return  res.send({
							            "code": 200,
							            "response": {},
							            "status": 1,
							            "message":custom.lang(locale,'Skill updated successfully.') 
							        });
                    	}else{
                    		return  res.send({
							            "code": 200,
							            "response": {},
							            "status": 0,
							            "message":custom.lang(locale,'Failed Or We didn`t find any changes.') 
							        });
                    	}
                    }
                },constant.skills,updateDataObj,{skillID:skillID});
			});
	    }
	});

	/* To select main skill
	 * @param {string}  userLoginSessionKey
	 * @param {integer} skillID
	 * @param {integer} isMainSkill [0,1]
	*/
	app.post('/provider/select-main-skill', function(req, res) {
	    let timezone  = req.headers.timezone;
		let locale    = req.headers.locale;
    	req.sanitize("userLoginSessionKey").trim();
    	req.sanitize("skillID").trim();
    	req.sanitize("isMainSkill").trim();
	    req.check('userLoginSessionKey', custom.lang(locale,'The User login session key field is required')).notEmpty();
	    req.check('skillID', custom.lang(locale,'The Skill Id field is required')).notEmpty();
	    req.check('isMainSkill', custom.lang(locale,'The Main Skill field is required')).notEmpty();
	    req.check('isMainSkill', custom.lang(locale,'Main Skill should be 0 OR 1')).inList(['0','1']);
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
	    	let skillID               = parseInt(req.sanitize('skillID').escape().trim());
	    	let isMainSkill           = parseInt(req.sanitize('isMainSkill').escape().trim());

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

			    	/* To get skill details*/
			    	model.getAllWhere(function(err,skillResp){
			    		if(err){
	                        return res.send(custom.dbErrorResponse());
	                    }else{
	                    	if(skillResp == ""){
	                    		return  res.send({
								            "code": 200,
								            "response": {},
								            "status": 0,
								            "message":custom.lang(locale,'Invalid Skill ID') 
								        });
	                    	}else{
	                    		if(parseInt(skillResp[0].skillUserID) === parseInt(userDetailsObj[0].userId)){
	                    			callback(null, userDetailsObj,skillResp);
	                    		}else{
									return  res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message":custom.lang(locale,'You are not authorized for this action') 
									        });	                    			
	                    		}
	                    	}
	                    }
			    	},constant.skills,{skillID:skillID});
			    },
			    function(userDetailsObj,skillResp, callback) {
			    	if(isMainSkill === 0){
			    		callback(null, userDetailsObj,skillResp,0);
			    	}else{
			    		let totalMainSkills = 0;

			    		/* Getb total main skills */
			    		model.getCount(function(err,totalCount){
			    			if(err){
		                        return res.send(custom.dbErrorResponse());
		                    }else{
		                    	totalMainSkills = totalCount;
		                    	if(totalMainSkills >= 2){
		                    		return  res.send({
									            "code": 200,
									            "response": {},
									            "status": 0,
									            "message":custom.lang(locale,'You can select only 2 main skills') 
									        });	 
		                    	}else{
			    					callback(null, userDetailsObj,skillResp,1);
		                    	}
		                    }
			    		},constant.skills,{skillUserID:userDetailsObj[0].userId,isMainSkill:1});
			    	}

			    }
			], function (err, userDetailsObj,skillResp,mainSkillType) {
			    
				/* Update main skills */		    
				model.updateData(function(err,updateResp){
					if(err){
                        return res.send(custom.dbErrorResponse());
                    }else{
                    	return  res.send({
							            "code": 200,
							            "response": {},
							            "status": 1,
							            "message":custom.lang(locale,'Main skill status updated successfully') 
							        });	
                    }
				},constant.skills,{isMainSkill:isMainSkill},{skillID:skillID});
			});
	    }
			
	});


}