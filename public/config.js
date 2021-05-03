"use strict";

/*
 * Purpose : For Admin Panel app configuration
 * Company : Mobiweb Technology Pvt. Ltd.
 * Developed By  : Sorav Garg
*/

var APP = APP || {};

var hostname = window.location.hostname;
var protocol = window.location.protocol;
var href     = window.location.href;
var origin   = window.location.origin + "/";

APP.base_url = origin;

APP.base_image_url = protocol + "//"+hostname+"/uploads/users/"

APP.templateUrl = "app/views/";

APP.imagePath = "app/images/";

var domain = origin + "admin/";

APP.service = {

    "adminLogin": domain + "login",
    
    "adminLogout": domain + "logout",

    "adminUpdatePassword": domain + "change-password",

    "getContactList": domain + "get-contact-list",

    "getUsersList": domain + "get-users-list",

    "viewUserDetails": domain + "view-user-details",

    "walletHistory": domain + "wallet-history",

    "transactionHistory": domain + "transaction-history", 
      
    "viewTxnDispute": domain + "view-txn-dispute",   

    "respondTxnDispute": domain + "respond-txn-dispute-request",   

    "reportFlag": domain + "report-flags-list",  

    "getContentDetails": domain + "get-content-details", 

    "updateContent": domain + "update-content",    

    "deleteUser": domain + "delete-user",

    "exportUsersDetails": domain + "export-users-details",

    "changeUserStatus":domain + "change-user-status",

    "getPreferencesList": domain + "get-preferences-list",

    "insertPreference": domain + "insert-preference",

    "deletePreference": domain + "delete-preference",

    "replyToUser": domain + "reply-to-user",

    "getReportFlagCategoriesList": domain + "report-flag-categories-list",

    "insertReportFlagCategory": domain + "insert-report-flag-category",

    "deleteReportFlagCategory": domain + "delete-report-flag-category",

    "searchUsers": domain + "search-users",

    "getUserOrderHistory": domain + "order-history",

    "getOrderDetails": domain + "get-order-details",

    "getJobDetails": domain + "get-job-details",

    "getMyJobHistory": domain + "my-job-history",

    "getReceivedJobHistory": domain + "received-job-history",

    "insertSendNotifications": domain + "insert-send-notifications",

    "getStatics": domain + "get-statics",

    "getReportData": domain + "get-report-data",
    
    "viewNotificationHistory": domain + "notifications-history",

    "userCountModuleWise": domain + "users-count-module-wise",

    "jobsCount": domain + "jobs-count",

    "ordersCount": domain + "orders-count",

    "totalEarning": domain + "total-earning",

    "doRemoveFlag": domain + "remove-user-flag",

    "getReportFlagDetials": domain + "get-report-flag-details"

};
