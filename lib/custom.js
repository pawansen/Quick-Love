"use strict";

/*
 * Purpose: For manage custom functions
 * Authur : Sorav Garg
 * Company: Mobiweb Technology Pvt. Ltd.
*/

var moment   = require('moment');
var appRoot  = require('app-root-path');
var model    = require(appRoot + '/lib/model.js');
var appConst = require(appRoot + '/config/constant.js');
var AWS      = require('aws-sdk');

class Custom {

	/* Custom Functions Constructor */
	constructor() {

    /* Initialize AWS S3 Bucket Configurations */
    AWS.config.update({
	      accessKeyId: 'AKIAJFEIN7SCTL5KXBAA',
	      secretAccessKey: '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',
	      region:'us-east-1'
	    });
	}

    /**
     * To generte unique number
     * @param {string} n
    */
    generateRandomNo(n) {
        let low  = 100000;
        let high = 999999;
        var finalNumber = Math.floor(Math.random() * (high - low + 1) + low);
        if(parseInt(finalNumber.length) < parseInt(n)){
            var finalNumber = this.generateRandomNo(n);
        }
        return finalNumber;
    }

    /**
     * To get current time
    */
    getCurrentTime(){
        var dateTime = require('date-time');
        return dateTime({local: false,date: new Date()});
    }

    /**
     * To get dates between start date & end date
     * @param {string} startDate
     * @param {string} endDate
    */
    getDates(startDate, endDate) {
        var dateArray = [];
        var currentDate = moment(startDate);
        var endDate = moment(endDate);
        while (currentDate <= endDate) {
          dateArray.push( moment(currentDate).format('YYYY-MM-DD') )
          currentDate = moment(currentDate).add(1, 'days');
        }
        return dateArray;
    }

    /**
     * To get user age
     * @param {string} userDOB
    */
    getUserAge(userDOB){
        if(userDOB){
            let moment = require('moment');
            return parseInt(moment().diff(userDOB, 'years'));
        }else{
            return 0;
        }
    }

    /**
     * To parse number value
     * @param {number} number
    */
    parseNumber(number){
        if(number != "" && number != null && number != undefined){
          if(Number.isInteger(number)){
            return number; // INTEGER
          }else{
            return parseFloat(parseFloat(number).toFixed(2)); // FLOAT
          }
        }else{
          return 0;
        }
    }

    /**
     * To generte custom ID format
     * @param {string} moduleType
    */
    generateCustomID(moduleType) {
        return moduleType + '-' + this.changeDateFormat(this.getCurrentTime(),'yyyymmddHHMMss');
    }

    /**
     * To capitalize string
    */
    capitalize(input){
        return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    }

	/**
	 * To manage validation messages
	 * @param {object} reqData
	*/
    manageValidationMessages(reqData){

    	/* Count object length */
    	var count = Object.keys(reqData).length;
    	if(count > 0){
    		for (var i = 0; i < count; i++) {
    			if(reqData[i]['msg'] != ''){
    				return reqData[i]['msg'];
    			}
    		}
    	}else{
    		return '';
    	}
    }

    /**
     * To get md5 value
     * @param {string} value
    */
    getMd5Value(value){
        var md5    = require('md5');
        var crypto = require('crypto');
        return crypto.createHash('md5').update(value).digest("hex");
    }

    /**
     * To get image extension from base64 image
     * @param {string} value
    */
    getImgExtension(value){
        var extension  = '';
        var base64_arr = value.split(';');
        if(base64_arr != '' && base64_arr[0] != ''){
            var first_segment = base64_arr[0];
            var first_segment_arr = first_segment.split('/');
            if(first_segment_arr != '' && first_segment_arr[1] != '')
            {
                return first_segment_arr[1].toLowerCase();
            }
        }
        return extension;
    }

    /**
     * To get datetime individual values 
     * @param {string} timeZone
     * @param {string} dateTime
    */
    getScheduledCallsDateTimeValues(timeZone,dateTime){
        let convertedDateTime = this.timezoneConversion(timeZone,dateTime);
        console.log('convertedDateTime',convertedDateTime);
        let format = 'YYYY-MM-DD HH:mm:ss';

        /* Send 1 hour ago */
        convertedDateTime = this.changeDateFormat(moment(convertedDateTime).subtract(1, 'hours'));
        let dateArr = convertedDateTime.split(/\D/);
        console.log('dateArrNew',dateArr);
        var finalDateObj = {};
        if(dateArr == ""){
            return finalDateObj;
        }
        finalDateObj.year    = parseInt(dateArr[0]);
        finalDateObj.months  = parseInt(dateArr[1]-1);
        finalDateObj.days    = parseInt(dateArr[2]);
        finalDateObj.hours   = parseInt(dateArr[3]);
        finalDateObj.minutes = parseInt(dateArr[4]);
        finalDateObj.seconds = parseInt(dateArr[5]);
        console.log('finalDateObj',finalDateObj);
        return finalDateObj;
    }

    /**
     * To convert into timezone
     * @param {string} timeZone 
     * @param {string} dateTime 
    */
    timezoneConversion(timeZone,dateTime){
       let moment = require('moment-timezone');
       var finalDateTime = '';

       /* Convert to timezone string */
       let dateTimeZone = moment.tz(dateTime, timeZone).format();
       let dateArr = dateTimeZone.split(/\D/);
       var convertType = '-';
       if(dateTimeZone.indexOf("+") >= 0){
            convertType = '+';
       }
       if(dateArr != "")
       {
            finalDateTime += dateArr[0] + "-" + dateArr[1] + "-" + dateArr[2] + " " + dateArr[3] + ":" + dateArr[4] + ":" + dateArr[5];
            let hourDiff    = parseInt(dateArr[6]);
            let minutesDiff = parseInt(dateArr[7]);
            if(hourDiff > 0)
            {
                if(convertType === '+'){
                    finalDateTime = moment(finalDateTime).add(hourDiff, 'hours');
                }else{
                    finalDateTime = moment(finalDateTime).subtract(hourDiff, 'hours');
                }
            }
            if(minutesDiff > 0)
            {
                if(convertType === '+'){
                    finalDateTime = moment(finalDateTime).add(minutesDiff, 'minutes');
                }else{
                    finalDateTime = moment(finalDateTime).subtract(minutesDiff, 'minutes');
                }
            }
       }
       if(finalDateTime != ""){
         return this.changeDateFormat(finalDateTime);
       }else{
         return finalDateTime;
       }
    }

    /**
     * To get unique Id
    */
    getUniqueId(){
        var uniqid = require('uniqid');
        return uniqid.time('QL');
    }

    /**
     * To get offset
     * @param {integer} pageNo 
     * @param {integer} limit 
    */
    getOffset(pageNo,limit = 10){
        if(parseInt(pageNo) === 0){
            pageNo = 1;
        }
        let offsetVal = (parseInt(pageNo) - 1) * parseInt(limit);
        return parseInt(offsetVal);
    }

    /**
     * To change date time format
     * @param {string} datetime 
     * @param {string} format 
    */
    changeDateFormat(datetime,format = 'yyyy-mm-dd HH:MM:ss'){
       if(datetime){
        let dateFormat = require('dateformat');
        return dateFormat(datetime, format);
       }else{
        return '';
       }
    }

    /**
     * To get unique alpha numeric string
    */
    s4(){
        return Math.floor((1 + Math.random()) * 0x10000)
                  .toString(16)
                  .substring(1);
    }

    /**
     * To get unique guid
    */
    getGuid(){
        return this.s4() + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' +
                this.s4() + '-' + this.s4() + this.s4() + this.s4();
    }

    /**
     * To handle null or undefined value
     * @param {string} value
     * @param {string} defaultValue
    */
    nullChecker(value,defaultValue = "")
    {
        if(!value){
          return defaultValue;
        }else{
         return value;
        }
    }

    /**
     * To get user ip address
    */
    getUserIp(name = 'public'){
        var ip = require('ip');
        return ip.address(name);
    }

    /**
     * To send mails
     * @param {string} to_email
     * @param {string} subject
     * @param {string} message
    */
    sendEmailCallBack(reqData,callBack){
        console.log('reqData',reqData);
        let toEmailAddress = [reqData.to_email];
        var params = {
        Destination: {
          ToAddresses: toEmailAddress
        },
        Message: {
          Body: {
            Html: {
             Charset: "UTF-8",
             Data: reqData.message
            }
           },
           Subject: {
            Charset: 'UTF-8',
            Data: reqData.subject
           }
          },
        Source: appConst.from_email
      };   
      var sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();
      sendPromise.then(
        function(data) {
          console.log('AWS SES mail send success - ',data.MessageId);
          return callBack('success', data);
        }).catch(
          function(err) {
          console.error('AWS SES mail send failed',err);
          return callBack('error', err);
        });
    }

    /**
     * To send mails
     * @param {string} to_email
     * @param {string} subject
     * @param {string} message
    */
    sendEmail(reqData){
        let toEmailAddress = [reqData.to_email];
        var params = {
        Destination: {
          ToAddresses: toEmailAddress
        },
        Message: {
          Body: {
            Html: {
             Charset: "UTF-8",
             Data: reqData.message
            }
           },
           Subject: {
            Charset: 'UTF-8',
            Data: reqData.subject
           }
          },
        Source: appConst.from_email
      };   
      var sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();
      sendPromise.then(
        function(data) {
          console.log('AWS SES mail send success - ',data.MessageId);
          return true;
        }).catch(
          function(err) {
          console.error('AWS SES mail send failed',err);
          return false;
        });
    }

    /**
     * To get database error response
    */
    dbErrorResponse(message){
        let dbErrorResponse = {};
        dbErrorResponse.code = 200; 
        dbErrorResponse.response = {}; 
        dbErrorResponse.status = 0; 
        if(message){
            dbErrorResponse.message = message;
        }else{
            dbErrorResponse.message = 'Database error occured.'; 
        }
        return dbErrorResponse;
    }

    /**
     * To get mail error response
    */
    mailErrorResponse(message){
        let mailErrorResponse = {};
        mailErrorResponse.code = 200; 
        mailErrorResponse.response = {}; 
        mailErrorResponse.status = 0; 
        if(message){
            mailErrorResponse.message = message;
        }else{
            mailErrorResponse.message = 'Failed to send a mail.'; 
        }
        return mailErrorResponse;
    }

    /**
     * For User verification mail message
     * @param {string} userFirstName
     * @param {integer} getTempCode
    */
    verificationMailMsg(userFirstName,getTempCode){
        let siteName = appConst.site_name;
        let verficationMessage = '';
        verficationMessage += 'Hello '+userFirstName+', <br/><br/>';
        verficationMessage += 'Your '+siteName+' profile has been created, Please use below code to verify your '+siteName+' account. <br/><br/>';
        verficationMessage += '<strong>Verification code: </strong>' + getTempCode + '<br/><br/>';
        verficationMessage += 'Thanks <br/> '+siteName+' Team';
        return verficationMessage;
    }

    /**
     * For User forgot password mail message
     * @param {string} userFirstName
     * @param {integer} getTempCode
    */
    forgotPasswordMsg(userFirstName,getTempCode){
        let siteName = appConst.site_name;
        let forgotPasswordMsg = '';
        forgotPasswordMsg += 'Hello '+userFirstName+', <br/><br/>';
        forgotPasswordMsg += 'Somebody (hopefully you) requested a new password for the '+ siteName + ' account. No changes have been made to your account yet.<br/><br/>';
        forgotPasswordMsg += 'Please use below temporary code to reset your password.<br/><br/>';
        forgotPasswordMsg += '<strong>Verification code: </strong>' + getTempCode + '<br/><br/>';
        forgotPasswordMsg += '<strong>Note: </strong>This temporary code will be valid for next '+appConst.code_valid_time+' minutes. <br/><br/>';
        forgotPasswordMsg += 'Thanks <br/> '+siteName+' Team';
        return forgotPasswordMsg;
    }

    /**
     * For get datetime difference 
     * @param {datetime} startDateTime
     * @param {datetime} endDateTime
     * @param {string} diffType
    */
    getDateTimeDifference(startDateTime,endDateTime,diffType){
        let startDate = moment(startDateTime, 'YYYY-M-DD HH:mm:ss')
        let endDate   = moment(endDateTime, 'YYYY-M-DD HH:mm:ss')
        let timeDiff  = endDate.diff(startDate, diffType);
        return parseInt(timeDiff);
    }

    /**
     * To validate date time format
     * @param {datetime} dateTime
     * @param {string} requiredFormat
    */
    validateDateTime(dateTime,requiredFormat){
        let isValid = moment(dateTime,requiredFormat).isValid();
        return isValid;
    }

    /**
     * To manage oublic users listing collection
     * @param {object} usersObj
     * @param {integer} masterUserId
    */
    publicUsersCollection(usersObj,masterUserId, callBack) {
        let database = require(appRoot + '/config/database.js');
        let async    = require('async');
        let responseObj  = [];
        let self = this;

        async.waterfall([
            function(callback) {
                var inserted = 0;
                for (var i = 0; i < parseInt(usersObj.length); i++) 
                {
                    let friendId = parseInt(usersObj[i].masterUserId);
                    let row = {};
                    var friendModuleId = 0;
                    var senderId = 0;
                    var recieverId = 0;
                    var friendStatus = "NONE";

                    row.masterUserId   = friendId;
                    row.userEmail      = self.nullChecker(usersObj[i].userEmail);
                    row.userFirstName  = self.nullChecker(usersObj[i].userFirstName);
                    row.userJobHeading = self.nullChecker(usersObj[i].userJobHeading);
                    row.userLastName   = self.nullChecker(usersObj[i].userLastName);
                    row.onlineStatus   = self.nullChecker(usersObj[i].onlineStatus);
                    row.userRating     = self.parseNumber(usersObj[i].userRating);
                    row.noOfReviews    = parseInt(usersObj[i].noOfReviews);
                    row.noOfRedFlags   = parseInt(usersObj[i].noOfRedFlags);
                    row.isGroupChatEnable       = parseInt(usersObj[i].isGroupChatEnable);
                    row.isOpenForAllCalls       = parseInt(usersObj[i].isOpenForAllCalls);
                    row.isOpenForScheduledCalls = parseInt(usersObj[i].isOpenForScheduledCalls);
                    row.userMood       = self.nullChecker(usersObj[i].userMood);
                    row.userImage   = (usersObj[i].userImage) ? appConst.base_url + usersObj[i].userImage : "";
                    row.userImageThumbnail  = (usersObj[i].userImageThumbnail) ? appConst.base_url + usersObj[i].userImageThumbnail : "";

                    (function(i,friendModuleId,senderId,recieverId,friendStatus) {
                        /* Check user is already friend or pending request */
                        let friendQuery = 'SELECT * FROM `friends` WHERE (`userId` = '+masterUserId+' AND `friendId` = '+friendId+') OR (`userId` = '+friendId+' AND `friendId` = '+masterUserId+')';
                        database.getConn(friendQuery, function (err, friendRespObj) {
                            if(err){
                                return callback(err,friendRespObj);
                            }else{
                                if(friendRespObj != "")
                                {
                                    friendModuleId = friendRespObj[0].masterFriendId;
                                    senderId       = friendRespObj[0].userId;
                                    recieverId     = friendRespObj[0].friendId;
                                    friendStatus   = friendRespObj[0].friendStatus;
                                }
                                row.friendModuleId = friendModuleId;
                                row.senderId       = senderId;
                                row.recieverId     = recieverId;
                                row.friendStatus   = friendStatus;
                                responseObj.push(row);
                            }
                            if (++inserted === parseInt(usersObj.length)) {
                              console.log('condition true');
                              callback(null, responseObj);
                            }
                        });
                    })(i,friendModuleId,senderId,recieverId,friendStatus);
                }
            }
        ], function (err, responseObj) {
            return callBack(err,responseObj);
        });
    }

    /**
     * To check if membership is active
     * @param {string} isPaidMembeship
     * @param {string} isFacebookVerified
     * @param {string} isTwitterVerified
     * @param {string} isInstagramVerified
     * @param {string} userRegistrationDate
    */
    isMembershipActive(callback,isPaidMembeship,isFacebookVerified,isTwitterVerified,isInstagramVerified,userRegistrationDate){
      let self = this;

      if(parseInt(isPaidMembeship) === 0){ // No
        let noOfVerifiedSocialAccounts = 0;
        if(parseInt(isFacebookVerified) === 1){
          noOfVerifiedSocialAccounts += 1;
        }
        if(parseInt(isTwitterVerified) === 1){
          noOfVerifiedSocialAccounts += 1;
        }
        if(parseInt(isInstagramVerified) === 1){
          noOfVerifiedSocialAccounts += 1;
        }
        if(noOfVerifiedSocialAccounts >= appConst.social_verified_accounts_limit){
          return callback(1);
        }else{
          var userRegistrationDate = (!userRegistrationDate) ? '' : self.changeDateFormat(userRegistrationDate);
          if(userRegistrationDate){

              /* Get months difference */
              let monthDiff = self.getDateTimeDifference(userRegistrationDate,self.getCurrentTime(),'months');
              if(monthDiff >= appConst.app_free_trial_limit){ // Free trial over (3 months)
                return callback(0);
              }else{
                return callback(1);
              }
          }else{
            return callback(0);
          }
        }
      }else{ // Yes
        return callback(1);
      }
    }

    /**
     * To handle loggedin user
     * @param {string} userLoginSessionKey
     * @param {string} userTimeZone
     * @param {integer} isNeedToCheckMembership [0,1]
    */
    handleLoggedInUser(callBack,userLoginSessionKey,userTimeZone,isNeedToCheckMembership){
        let self = this;
        var userTimeZone = (!userTimeZone) ? '' : userTimeZone;
        var currentTime  = self.getCurrentTime();
        var isNeedToCheckMembership    = (!isNeedToCheckMembership) ? 1 : 0; 

        /* Get user details */
        let myQuery = "SELECT * FROM `users` INNER JOIN `user_details` ON `users`.`masterUserId`=`user_details`.`userId` WHERE `user_details`.`userLoginSessionKey` = '"+userLoginSessionKey+"' ";
        model.customQuery(function(err,results){
            if(err){
                return callBack(0,self.dbErrorResponse());
            }else{
                if(results != ""){
                    let lastActivity = self.nullChecker(results[0].userLastActivityDateTime);
                    if(parseInt(results[0].userEmailVerified) === 0){
                        /* Update user online status */
                        model.updateData(function(err,resp){
                        },appConst.user_details,{onlineStatus:'OFFLINE',isUserLoggedOut:1},{userId:results[0].userId});

                        let jsonResp = {"code" : 405,"status" : 0,"message" : appConst.email_verify};
                        return callBack(0,jsonResp);
                    }else if(parseInt(results[0].isUserBlocked) === 1){
                        /* Update user online status */
                        model.updateData(function(err,resp){
                        },appConst.user_details,{onlineStatus:'OFFLINE',isUserLoggedOut:1},{userId:results[0].userId});

                        let jsonResp = {"code" : 405,"status" : 0,"message" : appConst.user_blocked};
                        return callBack(0,jsonResp);
                    }else if(parseInt(results[0].isUserDeactivated) === 1){
                        /* Update user online status */
                        model.updateData(function(err,resp){
                        },appConst.user_details,{onlineStatus:'OFFLINE',isUserLoggedOut:1},{userId:results[0].userId});

                        let jsonResp = {"code" : 405,"status" : 0,"message" : appConst.user_deactivated};
                        return callBack(0,jsonResp);
                    }else if(parseInt(results[0].isRedFlagBlock) === 1){
                        /* Update user online status */
                        model.updateData(function(err,resp){
                        },appConst.user_details,{onlineStatus:'OFFLINE',isUserLoggedOut:1},{userId:results[0].userId});
                        
                        let jsonResp = {"code" : 405,"status" : 0,"message" : appConst.user_blocked};
                        return callBack(0,jsonResp);
                    }else if(parseInt(isNeedToCheckMembership) === 1 && results[0].userType != "SUPER_ADMIN"){
                      self.isMembershipActive(function(isActive){
                        if(parseInt(isActive) === 0){ // Not active
                          let jsonResp = {"code" : 444,"status" : 0,"message" : appConst.membership_expired};
                          return callBack(0,jsonResp);
                        }else{
                          if(lastActivity != ""){
                            let moment       = require('moment');
                            let totalDiff    = self.getDateTimeDifference(lastActivity,currentTime,'hours');
                            let mainUserId   = parseInt(results[0].userId);
                            if(totalDiff >= parseInt(appConst.session_limit)){ // SESSION EXPIRED

                              /* Update user login session key */
                              model.updateData(function(err,resp){
                                  if(err){
                                      return callBack(0,self.dbErrorResponse());
                                  }
                              },appConst.user_details,{userLoginSessionKey:self.getGuid()},{userId:results[0].userId});
                              let jsonResp = {"code" : 405,"status" : 0,"message" : appConst.invalid_login_session_key};
                              return callBack(0,jsonResp);
                            }else{
                              let updateData = {};
                              updateData.isUserLoggedOut = 0;
                              updateData.userLastActivityDateTime = currentTime;
                              if(userTimeZone)
                              {
                                updateData.userTimeZone = userTimeZone;
                              }
                              /* Update user timezone */
                              model.updateData(function(err,resp){
                                  if(err){
                                      return callBack(0,self.dbErrorResponse());
                                  }
                              },appConst.user_details,updateData,{userId:results[0].userId});
                              return callBack(1,results); 
                            }
                          }else{
                            let updateData = {};
                            updateData.isUserLoggedOut = 0;
                            updateData.userLastActivityDateTime = currentTime;
                            if(userTimeZone)
                            {
                              updateData.userTimeZone = userTimeZone;
                            }
                            /* Update user timezone */
                            model.updateData(function(err,resp){
                                if(err){
                                    return callBack(0,self.dbErrorResponse());
                                }
                            },appConst.user_details,updateData,{userId:results[0].userId});
                            return callBack(1,results); 
                          }
                        }
                      },results[0].isPaidMembeship,results[0].isFacebookVerified,results[0].isTwitterVerified,results[0].isInstagramVerified,results[0].userRegistrationDate);
                    }else{

                        if(lastActivity != ""){
                            let moment       = require('moment');
                            let totalDiff    = self.getDateTimeDifference(lastActivity,currentTime,'hours');
                            let mainUserId   = parseInt(results[0].userId);
                            if(totalDiff >= parseInt(appConst.session_limit)){ // SESSION EXPIRED

                              /* Update user login session key */
                              model.updateData(function(err,resp){
                                  if(err){
                                      return callBack(0,self.dbErrorResponse());
                                  }
                              },appConst.user_details,{userLoginSessionKey:self.getGuid()},{userId:results[0].userId});
                              let jsonResp = {"code" : 405,"status" : 0,"message" : appConst.invalid_login_session_key};
                              return callBack(0,jsonResp);
                            }else{
                              let updateData = {};
                              updateData.isUserLoggedOut = 0;
                              updateData.userLastActivityDateTime = currentTime;
                              if(userTimeZone)
                              {
                                updateData.userTimeZone = userTimeZone;
                              }
                              /* Update user timezone */
                              model.updateData(function(err,resp){
                                  if(err){
                                      return callBack(0,self.dbErrorResponse());
                                  }
                              },appConst.user_details,updateData,{userId:results[0].userId});
                              return callBack(1,results); 
                            }
                          }else{
                            let updateData = {};
                            updateData.isUserLoggedOut = 0;
                            updateData.userLastActivityDateTime = currentTime;
                            if(userTimeZone)
                            {
                              updateData.userTimeZone = userTimeZone;
                            }
                            /* Update user timezone */
                            model.updateData(function(err,resp){
                                if(err){
                                    return callBack(0,self.dbErrorResponse());
                                }
                            },appConst.user_details,updateData,{userId:results[0].userId});
                            return callBack(1,results); 
                          }
                    }
                }else{

                    let jsonResp = {"code" : 405,"status" : 0,"message" : appConst.invalid_login_session_key};
                    return callBack(0,jsonResp);
                }
            }
        },myQuery);
    }

    /**
     * To get user profile response
    */
    getUserProfileResponse(respObj){
        var profileResp = {};
        if(respObj)
        {
            profileResp.isProvider = 0;
            profileResp.userId = parseInt(respObj[0].userId);
            profileResp.masterUserId = parseInt(respObj[0].userId);
            profileResp.userFirstName = this.nullChecker(respObj[0].userFirstName);
            profileResp.userEmail = this.nullChecker(respObj[0].userEmail);
            profileResp.userLastName = this.nullChecker(respObj[0].userLastName);
            profileResp.userLoginSessionKey = this.nullChecker(respObj[0].userLoginSessionKey);
            profileResp.userAddress = this.nullChecker(respObj[0].userAddress);
            profileResp.userCountry = this.nullChecker(respObj[0].userCountry);
            profileResp.userCity = this.nullChecker(respObj[0].userCity);
            profileResp.userDOB = this.changeDateFormat(respObj[0].userDOB,'yyyy-mm-dd');
            profileResp.userDOBFormatted = this.changeDateFormat(respObj[0].userDOB,'dd mmmm yyyy');
            profileResp.userLatitude = this.nullChecker(respObj[0].userLatitude);
            profileResp.userLongitude = this.nullChecker(respObj[0].userLongitude);
            profileResp.userSexualOrientation = this.nullChecker(respObj[0].userSexualOrientation);
            profileResp.userSexualOrientationFormatted = this.capitalize(respObj[0].userSexualOrientation);
            profileResp.userMood = this.nullChecker(respObj[0].userMood);
            profileResp.userAge = this.getUserAge(respObj[0].userDOB);
            profileResp.userGender = this.nullChecker(respObj[0].userGender);
            profileResp.userGenderFormatted = this.capitalize(this.nullChecker(respObj[0].userGender));
            profileResp.isSocialSignup = parseInt(respObj[0].isSocialSignup);
            profileResp.isRedFlagBlock  = parseInt(respObj[0].isRedFlagBlock);
            profileResp.isUserLoggedOut = parseInt(respObj[0].isUserLoggedOut);
            profileResp.onlineStatus   = this.nullChecker(respObj[0].onlineStatus);
            profileResp.userSocialType = this.nullChecker(respObj[0].userSocialType);
            profileResp.userWalletAmount = this.parseNumber(respObj[0].userWalletAmount);
            profileResp.userWalletHoldAmount  = this.parseNumber(respObj[0].userWalletHoldAmount);
            profileResp.userPaymentCustomerID = this.nullChecker(respObj[0].userPaymentCustomerID); // Stripe Customer ID (For Save Cards)
            profileResp.isBecomeProvider = parseInt(respObj[0].isBecomeProvider);
            profileResp.userRating       = this.parseNumber(respObj[0].userRating);
            profileResp.noOfReviews      = parseInt(respObj[0].noOfReviews);
            profileResp.isFacebookVerified = parseInt(respObj[0].isFacebookVerified);
            profileResp.isTwitterVerified = parseInt(respObj[0].isTwitterVerified);
            profileResp.isInstagramVerified = parseInt(respObj[0].isInstagramVerified);
            profileResp.isPreferencesAdded = parseInt(respObj[0].isPreferencesAdded);
            profileResp.isDatingPreferenceAdded = parseInt(respObj[0].isDatingPreferenceAdded);
            profileResp.isProviderPreferenceAdded = parseInt(respObj[0].isProviderPreferenceAdded);
            profileResp.noOfVerifiedSocialAccounts = parseInt(respObj[0].noOfVerifiedSocialAccounts);
            profileResp.noOfRedFlags = parseInt(respObj[0].noOfRedFlags);
            profileResp.noOfAllowedImages = parseInt(respObj[0].noOfAllowedImages);
            profileResp.isDatingImagesCountAdded = parseInt(respObj[0].isDatingImagesCountAdded);
            profileResp.isJobsImagesCountAdded = parseInt(respObj[0].isJobsImagesCountAdded);
            profileResp.isGroupChatEnable = parseInt(respObj[0].isGroupChatEnable);
            profileResp.isOpenForAllCalls = parseInt(respObj[0].isOpenForAllCalls);
            profileResp.isOpenForScheduledCalls = parseInt(respObj[0].isOpenForScheduledCalls);
            profileResp.isHideProfileAsProvider = parseInt(respObj[0].isHideProfileAsProvider);
            profileResp.userMembershipStatus = parseInt(respObj[0].userMembershipStatus);
            profileResp.userProfileUpdateStatus = parseInt(respObj[0].userProfileUpdateStatus);
            profileResp.userProfileImageStatus = parseInt(respObj[0].userProfileImageStatus);
            profileResp.userCoverImageStatus = parseInt(respObj[0].userCoverImageStatus);
            profileResp.userWholeProfileStatus = parseInt(respObj[0].userWholeProfileStatus);
            profileResp.userBadges = parseInt(respObj[0].userBadges);
            profileResp.isPaidMembeship = parseInt(respObj[0].isPaidMembeship);
            profileResp.userRegistrationDate = this.changeDateFormat(respObj[0].userRegistrationDate);
            profileResp.userLastLogin = this.changeDateFormat(respObj[0].userLastLogin);
            profileResp.userTimeZone = this.nullChecker(respObj[0].userTimeZone);
            profileResp.userJobHeading = this.nullChecker(respObj[0].userJobHeading);
            profileResp.userInterestedGender = this.nullChecker(respObj[0].userInterestedGender);
            profileResp.userInterestedGenderFormatted = this.capitalize(respObj[0].userInterestedGender);
            profileResp.userInterestedSexualOrientation = this.nullChecker(respObj[0].userInterestedSexualOrientation);
            profileResp.userInterestedSexualOrientationFormatted = this.capitalize(respObj[0].userInterestedSexualOrientation);
            profileResp.userPaymentAccountID = this.nullChecker(respObj[0].userPaymentAccountID);
            profileResp.userLastIpAddress = this.nullChecker(respObj[0].userLastIpAddress);
            profileResp.userLastActivityDateTime = this.changeDateFormat(respObj[0].userLastActivityDateTime);
            profileResp.userNextThreeMonthDateTime = (!respObj[0].userNextThreeMonthDateTime) ? '' : this.changeDateFormat(respObj[0].userNextThreeMonthDateTime);
            profileResp.paidMemebershipDate = (!respObj[0].paidMemebershipDate) ? '' : this.changeDateFormat(respObj[0].paidMemebershipDate);
            profileResp.redFlagBlockDateTime = (!respObj[0].redFlagBlockDateTime) ? '' : this.changeDateFormat(respObj[0].redFlagBlockDateTime);
            profileResp.userImage = "";
            profileResp.userImageThumbnail = "";
            profileResp.userCoverImage = "";
            profileResp.userCoverImageThumbnail = "";
            if(respObj[0].userImage){
                profileResp.userImage = appConst.base_url + respObj[0].userImage;
            }
            if(respObj[0].userImageThumbnail){
                profileResp.userImageThumbnail = appConst.base_url + respObj[0].userImageThumbnail;
            }
            if(respObj[0].userCoverImage){
                profileResp.userCoverImage = appConst.base_url + respObj[0].userCoverImage;
            }
            if(respObj[0].userCoverImageThumbnail){
                profileResp.userCoverImageThumbnail = appConst.base_url + respObj[0].userCoverImageThumbnail;
            }
        }
        return profileResp;
    }

    /**
     * To get user profile details
     * @param {integer} userID
    */
    getUserProfileDetails(callBack,userID){
        let self = this;
        /* Get user details */
        let myQuery = "SELECT * FROM `users` INNER JOIN `user_details` ON `users`.`masterUserId`=`user_details`.`userId` WHERE `users`.`masterUserId` = '"+userID+"' ";
        model.customQuery(function(err,results){
            if(err){
                return callBack(0,self.dbErrorResponse());
            }else{
                if(results != ""){
                    return callBack(1,results);
                }else{
                    return callBack(0,{"code":200,"response":{},"status":0,"message":appConst.user_detais_not_found});
                }
            }
        },myQuery);
    }

    /**
     * To check user is blocked or not
     * @param {integer} userId
     * @param {integer} friendId
    */
    isUserBlocked(callBack,userId,friendId){
        let self = this;
        /* Check user is already blocked */
        let blockQuery = 'SELECT * FROM `block_users` WHERE (`userBlockUserId` = '+userId+' AND `userBlockFriendId` = '+friendId+') OR (`userBlockUserId` = '+friendId+' AND `userBlockFriendId` = '+userId+')';
        model.customQuery(function(err,blockRespObj){
            if(err){
                return callBack(0,self.dbErrorResponse());
            }else{
                if(blockRespObj != ""){
                    return callBack(1,blockRespObj);
                }else{
                    return callBack(2,{"code":200,"response":{},"status":0,"message":'User is not blocked'});
                }
            }
        },blockQuery);
    }

    /**
     * To manage user device history
     * @param {integer} userID
     * @param {string} userDeviceToken
     * @param {string} userDeviceType
     * @param {string} userDeviceId
    */
    manageUserDeviceHistory(callBack,userId,userDeviceToken,userDeviceType,userDeviceId){

        let self = this;
        model.getAllWhere(function(err,results){
            if(err){
                return callBack(0,self.dbErrorResponse());
            }else{
                let dataObj = {};
                dataObj.userId = userId;
                dataObj.userDeviceToken = userDeviceToken;
                dataObj.userDeviceType = userDeviceType;
                dataObj.deviceModifiedDate = self.getCurrentTime();
                if(results != ""){
                    model.updateData(function(err,resp){
                        if(err){
                            return callBack(0,self.dbErrorResponse());
                        }else{
                            return callBack(1,{});
                        }
                    },appConst.users_device_history,dataObj,{userDeviceId:userDeviceId});
                }else{
                    dataObj.deviceAddedDate = self.getCurrentTime();
                    dataObj.userDeviceId = userDeviceId;
                    model.insertData(function(err,resp){
                        if(err){
                            return callBack(0,self.dbErrorResponse());
                        }else{
                            return callBack(1,{});
                        }
                    },appConst.users_device_history,dataObj);
                }
            }
        },appConst.users_device_history,{userDeviceId:userDeviceId});
    }

    /**
     * To manage user social verification
     * @param {integer} userID
     * @param {string} userSocialID
     * @param {string} userSocialEmailId
     * @param {string} userSocialType
     * @param {string} IsVerified
    */
    manageUserSocialVerification(callBack,userId,userSocialID,userSocialEmailId,userSocialType,IsVerified){

        let self = this;
        model.getAllWhere(function(err,results){
            if(err){
                return callBack(0,self.dbErrorResponse());
            }else{
                if(results != ""){
                    let dataObj = {};
                    dataObj.IsVerified = IsVerified;
                    model.updateData(function(err,resp){
                        if(err){
                            return callBack(0,self.dbErrorResponse());
                        }else{
                            return callBack(1,results[0].userSocialVerificationID);
                        }
                    },appConst.user_social_verifications,dataObj,{userSocialID:userSocialID});
                }else{
                    let dataObj = {};
                    dataObj.userId = userId;
                    dataObj.userSocialID = userSocialID;
                    dataObj.userSocialEmailId = userSocialEmailId;
                    dataObj.userSocialType = userSocialType;
                    dataObj.IsVerified = IsVerified;
                    dataObj.userVerificationDateTime = self.getCurrentTime();
                    model.insertData(function(err,resp){
                        if(err){
                            return callBack(0,self.dbErrorResponse());
                        }else{
                            return callBack(1,resp.insertId);
                        }
                    },appConst.user_social_verifications,dataObj);
                }
            }
        },appConst.user_social_verifications,{userSocialID:userSocialID});
    }

    /**
     * To unlink file
     * @param {string} filePath
    */
    unlinkFile(filePath){
        let fs  = require('fs');
        if(filePath && fs.existsSync(filePath)){
            fs.unlink(filePath);
        }
    }

    /**
     * To unlink multiple files
     * @param {object} filesObj
    */
    unlinkMultipleFile(filesObj){
        let totalFiles = parseInt(filesObj.length);
        if(totalFiles > 0)
        {
            let fs  = require('fs');
            for (var i = 0; i < totalFiles; i++) 
            {
                let filePath = (!filesObj[i].path) ? '' : filesObj[i].path;
                if(filePath && fs.existsSync(filePath)){
                    fs.unlink(filePath);
                }
            }
        }
    }

    /**
     * To create image thumbnail
     * @param {string} uploadedFilePath
     * @param {string} uploadDestPath
     * @param {integer} thumbailWidth
    */
    getImgThumbnail(callBack,uploadedFilePath,uploadDestPath,thumbailWidth){
        let thumb = require('node-thumbnail').thumb;

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
                    return callBack(1,thumbnailFinalPath);
                }else{
                    let errResp = {"code": 200,"response": {},"status": 0,"message": 'Failed to generate image thumbnail.'};
                    return callBack(0,errResp);
                }
            }
        });
    }

    /**
     * To create video thumbnail
     * @param {string} inputFilePath
     * @param {string} outputFilePath
     * @param {string} thumbailSize
      (REMINDER - Install ffmpeg ubuntun package on your server => sudo apt-get install ffmpeg)
    */
    getVideoThumbnail(callBack,inputFilePath,outputFilePath,thumbailSize){
        let self   = this;
        let ffmpeg = require('fluent-ffmpeg');
        let ouputFileName = 'video-'+ Date.now() + '-' + self.getGuid() + '-thumbnail.png';
        thumbailSize = (!thumbailSize) ? '210x140' : thumbailSize;
        ffmpeg(inputFilePath).screenshots({
                        count: 1, //number of thumbnail want to generate
                        folder: outputFilePath,//path where you want to save
                        filename: ouputFileName,
                        size: '50%'
                    }).on('error', function (err) {
                        console.log('An error occurred: ' + err.message);
                        return callBack(0,err);
                    }).on('end', function (resp) {
                        let outputThumbFilePath = outputFilePath + ouputFileName;
                        return callBack(1,{outputThumbFilePath: outputThumbFilePath,ouputFileName:ouputFileName});
                    });
    }

    /**
     * To manage language translation
     * @param {string} localeKey
     * @param {string} locale
    */
    lang(locale,localeKey){
        if(!locale){
            return localeKey;
        }else{
            let i18n = require("i18n");
            var localeCode = appConst.default_lang;
            if(locale) localeCode = locale;
            i18n.setLocale(localeCode);
            return __(localeKey); 
        }
    }

        
}

module.exports = new Custom();

/* End of file custom.js */
/* Location: ./lib/custom.js */