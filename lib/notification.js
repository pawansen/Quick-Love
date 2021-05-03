"use strict";

/*
 * Purpose: To send emails
 * Authur : Sorav Garg
 * Company: Mobiweb Technology Pvt. Ltd.
*/

var appRoot  = require('app-root-path'),
	appConst = require(appRoot + '/config/constant.js');

class Notification {

	/* Notification Constructor */
	constructor() {
	}

	/**
	 * To send android push notifications
	 * @param {string} userDeviceToken
	 * @param {string} userMessage
	 * @param {object} extraParams
	*/
    sendAndroidNotification(callBack,userDeviceToken,userMessage,extraParams = {}){
		let FCM = require('fcm-push');
		let fcm = new FCM(appConst.fcm_server_key);
		extraParams.userMessage = userMessage;
		let message = {
					    to: userDeviceToken, // registration_ids: ['device_Token_1', 'device_Token_2'], Array of device tokens
					    collapse_key: appConst.site_name, 
					    data: extraParams,
					    priority:"high"
					};
		fcm.send(message, function(err, response){
		    if (err) {
		        console.log("Android notification error",err);
		        return callBack(err, response);
		    } else {
		        console.log("Android notification response",response);
		        return callBack(err, response);
		    }
		});
    }

    /**
	 * To send IOS push notifications
	 * @param {string} userDeviceToken
	 * @param {string} userMessage
	 * @param {integer} userBadges
	 * @param {object} extraParams
	 * @param {integer} expiryTime (Optional - In Seconds)
	 * @param {integer} collapseId (Optional)
	*/
    sendIOSNotification(callBack,userDeviceToken,userMessage,userBadges = 0,extraParams = {},expiryTime = 0,collapseId = ''){
    	let apn  = require('apn');
    	let self = this;
    	let options = {
					  token: {
					    key   : appRoot + "/apns/AuthKey_RPWBWY55P4.p8",
					    keyId : "RPWBWY55P4",
					    teamId: "A6HCWW7S38"
					  },
					  production: true
					};
		let notificationType  = extraParams.notificationType || "";
    	let apnProvider       = new apn.Provider(options);
    	let note              = new apn.Notification();
    	let notificationSound = "SIMPLE_NOTIFICATION_APP_IN_BACKGROUND.caf";
    	switch (notificationType) {
		    case 'USER_CALLING':
		        notificationSound = "RING_TONE.caf";
		        break; 
		    case 'HIRE_PROVIDER':
		        notificationSound = "NOTIFICATION_OF_HIRED.caf";
		        break; 
		    case 'SCHEDULED_CALL_REMINDER':
		        notificationSound = "REMINDER_SCHEDULED_CALL.caf";
		        break;
		    case 'SCHEDULE_CALL':
		        notificationSound = "REQUEST_FOR_SCHEDULE_CALL.caf";
		        break;
		    case 'RELEASE_JOB_MILESTONE':
		    case 'PURCHASE_PRODUCT':
		        notificationSound = "YOU_HAVE_RECIEVED_A_PAYMENT.caf";
		        break;
		    default: 
		        notificationSound = "SIMPLE_NOTIFICATION_APP_IN_BACKGROUND.caf";
		}
    	if(expiryTime && expiryTime > 0)
    	{
    		note.expiry = Math.floor(Date.now() / 1000) + parseInt(expiryTime); 
    	}
    	note.badge   = parseInt(userBadges);
    	note.alert   = userMessage;
    	if(collapseId != "")
    	{
    		note.collapseId = collapseId;
    	}
    	note.payload = extraParams;
    	note.sound   = notificationSound;
    	note.topic   = "com.mobiweb-mj.QuickLove"; // BUNDEL ID
    	apnProvider.send(note, userDeviceToken).then( (result) => {
		  console.log('result',JSON.stringify(result));
		  return callBack(result);
		});
    }

    /**
	 * To send mobile push notifications
	 * @param {string} userMessage
	 * @param {integer} userId
	 * @param {object} extraParams
	 * @param {integer} expiryTime
	*/
    sendPushNotifications(userMessage,userId,extraParams = {},expiryTime = 0,collapseId = ''){
    	let model  = require(appRoot + '/lib/model.js');
    	let custom = require(appRoot + '/lib/custom.js');
    	let self   = this; 

    	/* Get User Details */
    	model.getAllWhere(function(err,userDetails){
    		if(err){
    			console.log('sendPushNotificationsError',err);
    			return;
    		}else{
    			if(userDetails != "" && parseInt(userDetails[0].userEmailVerified) === 1 && parseInt(userDetails[0].isUserBlocked) === 0 && parseInt(userDetails[0].isUserDeactivated) === 0 && parseInt(userDetails[0].isRedFlagBlock) === 0){

    				/* Check membership status */
    				custom.isMembershipActive(function(respType){
    					if(respType === 1)
    					{
    						/* User Badges (Notification Count) */
		    				let userBadges = parseInt(userDetails[0].userBadges);
		    				extraParams.userBadges = userBadges;
		    				console.log('extraParams',extraParams);

		    				/* To get user devices history */
		    				model.getAllWhere(function(err,userDevicesObj){
		    					if(err){
					    			console.log('sendPushNotificationsError',err);
					    			return;
					    		}else{
					    			if(userDevicesObj != ""){
					    				let totalDevices = parseInt(userDevicesObj.length);
					    				if(totalDevices > 0)
					    				{
					    					/* Send notification to users on all logged in devices */
					    					for (var i = 0; i < totalDevices; i++) 
					    					{
					    						/* To get user device type */
					    						let userDeviceType = userDevicesObj[i].userDeviceType;
					    						if(userDeviceType === 'ANDROID'){

					    							/* Send notification on android */
					    							self.sendAndroidNotification(function(err,androidNotificationResp){
					    							},userDevicesObj[i].userDeviceToken,userMessage,extraParams);
					    						}else{
					    							/* Send notification on ios */
					    							self.sendIOSNotification(function(err,iosNotificationResp){
					    							},userDevicesObj[i].userDeviceToken,userMessage,userBadges,extraParams,expiryTime,collapseId);
					    						}
					    					}
					    				}
					    			}else{
					    				/* When user is logged out or didn`t login yet */
					    				console.log('sendPushNotificationsError','User device history not found');
					    			}
					    		}
		    				},appConst.users_device_history,{userId:userId});
    					}
    				},userDetails[0].isPaidMembeship,userDetails[0].isFacebookVerified,userDetails[0].isTwitterVerified,userDetails[0].isInstagramVerified,userDetails[0].userRegistrationDate);
    				
    				
    			}else{
    				console.log('sendPushNotificationsError','User details not found');
    			}
    		}
    	},appConst.user_details,{userId:userId});
  	};



}

module.exports = new Notification();

/* End of file notification.js */
/* Location: ./lib/notification.js */
