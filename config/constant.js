"use strict";

/*
 * Purpose: To define all constants
 * Authur : Sorav Garg
 * Company: Mobiweb Technology Pvt. Ltd.
*/

const dateTime = require('date-time'),
	  uniqid   = require('uniqid'),
	  devMode  = require('path').dirname(require.main.filename);

var appConstant = function () {

	/* Site Details */
	this.site_name      = "Quicklove";
	this.logo_path      = "uploads/ql-logo.png";
	this.base_url       = "https://www.quicklove.pro/";
	this.from_email     = "support@quicklove.pro";
	this.smtp_username  = "support@quicklove.pro";
	this.smtp_password  = "43434343";
	this.temp_code      = Math.floor(100000 + Math.random() * 900000); // 6 digit
	this.code_valid_time   = 15; // In minutes
	this.resend_code_limit = 5; // In minutes
	this.session_limit     = 24; // In hours

	/* Push Notification */
	this.fcm_server_key = "AAAA9h2Y8v8:APA91bGiA064oYUTjBvsbggNesE1koLbWKVEZmgl5kOmf_L-9psC2gERWDXvUFNIFIhx9756GoBWg6TCKDElWqmUaqktWter8Wg_5owpr0odX1mc6U97vINq_S5NrH4iGar0BERz-QlG";

	// this.stripe_secret_key = "sk_test_LCWxTJdGplOasq3And8Q4kfr";
	// this.stripe_publishable_key = "pk_test_nlm6eqAsOsyUr9GPPTX55rnb";
	// this.stripe_client_id = "ca_BtO3guYvw6lpwacM9W9U0ASzsyjMB7Df";
	this.stripe_secret_key = "sk_live_45suFLEuMSPrVLrZYhkmCpfv";
	this.stripe_publishable_key = "pk_live_25bcyuCl0csIeaz9kUc4zCro";
	this.stripe_client_id = "ca_BtO3FoMQs3H9kMujVIwqYGEukQUH7b3t";

	/* Default Messages */
	this.general_error = 'Some error occured, please try again.';
	this.failed_msg = 'Failed please try again.';
	this.invalid_login_session_key = 'Your session has been expired';
	this.invalid_code = 'Invalid user verification code.';
	this.invalid_forgot_code = 'Invalid forgot password code.';
	this.user_detais_not_found = 'User details not found.';
	this.already_verified = 'Your account is already verified.';
	this.email_verify  = 'Currently your profile is not verified, please verfiy your email id.';
	this.user_blocked  = 'Your profile has been blocked. Please contact to our support team.';
	this.user_deactivated  = 'Currently your profile is deactivated. Please contact to our support team.';
	this.session_expired   = 'Your session has expired, please login again.';
	this.code_limit_msg    = 'Sorry !! your temporary code has been expired.';
	this.forgot_pswd_msg   = 'A temporary code has sent on your registered email id, please check your mailbox.';
	this.dating_age_limit_msg   = 'Your age should be greater than Or equals to 18, to access dating section.';
	this.verification_subject   = '['+this.site_name + '] verify account';
	this.forgot_password_subject   = '['+this.site_name + '] forgot password';
	this.payment_failed   = ' Payment failed, please try again later';
	this.membership_expired   = 'Your account membership has been expired, so please purchase a membership';

	/* Datetime */
	this.current_time      = dateTime({local: false,date: new Date()});
	this.current_timestamp = new Date().getTime();
	this.admin_date_format = 'mmmm d, yyyy h:MM TT';
	this.app_date_format   = 'dddd, mmmm d, yyyy h:MM TT';

	/* Upload Files */
	this.file_upload_path  = __dirname + '/uploads/';
	this.random_image_name = 'user-'+ uniqid.time() + '-' + new Date().getTime();

	/* Database Constants */
	this.users        = 'users';
	this.user_details = 'user_details';
	this.users_device_history = 'users_device_history';
	this.notifications = 'notifications';
	this.user_social_verifications = 'user_social_verifications';
	this.user_gallery_images = 'user_gallery_images';
	this.content = 'content';
	this.contact_us = 'contact_us';
	this.preferences = 'preferences';
	this.block_users = 'block_users';
	this.friends     = 'friends';
	this.describe_preferences = 'describe_preferences';
	this.looking_preferences  = 'looking_preferences';
	this.deal_breaker_preferences = 'deal_breaker_preferences';
	this.skill_preferences = 'skill_preferences';
	this.report_flag_categories = 'report_flag_categories';
	this.report_users = 'report_users';
	this.call_history = 'call_history';
	this.call_history_users = 'call_history_users';
	this.schedule_calls = 'schedule_calls';
	this.reschedule_calls = 'reschedule_calls';
	this.call_review = 'call_review';
	this.dating_review = 'dating_review';
	this.schedule_dating = 'schedule_dating';
	this.reschedule_dating = 'reschedule_dating';
	this.services = 'services';
	this.skills = 'skills';
	this.products = 'products';
	this.products_images = 'products_images';
	this.videos = 'videos';
	this.jobs = 'jobs';
	this.jobs_payment_distribution = 'jobs_payment_distribution';
	this.job_disputes = 'job_disputes';
	this.milestones = 'milestones';
	this.transactions = 'transactions';
	this.txn_disputes = 'txn_disputes';
	this.wallet = 'wallet';
	this.hold_amounts = 'hold_amounts';
	this.jobs_review = 'jobs_review';
	this.orders = 'orders';
	this.order_products = 'order_products';
	this.job_cancel = 'job_cancel';
	this.user_inbox = 'user_inbox';
	this.allowed_images_history = 'allowed_images_history';
	this.admin_notifications = 'admin_notifications';
	this.reports = 'reports';

	/* Site Options */
	this.allowed_red_flags   = 3;
	this.describe_preference_limit    = 3;
	this.looking_preference_limit     = 3;
	this.dealbreaker_preference_limit = 3;
	this.social_verified_accounts_limit = 2;
	this.app_free_trial_limit = 3; // months
	this.skill_preference_limit = 3;
	this.product_images_limit   = 3;
	this.gallery_image_limit = 10;
	this.video_upload_limit  = 10;
	this.min_age_limit       = 16;
	this.dating_age_limit    = 18;
	this.results_limit       = 10;
	this.jobs_complete_limit = 10;
	this.dates_complete_limit = 5;
	this.allowed_images_count = 5;
	this.default_lang         = 'en';
	this.default_search_distance = 5; // KM
	this.group_call_users_limit = 4;
	this.ql_fees = 10; // 10% fees charges for Hire/Provider
	this.product_fees = 8; // 8% fees charges for purchase product (From Provider)
	this.membership_fees = 19; // $19 membership fees for app (One time only)
	this.daily_call_limit = 2;
	this.call_limit = 20; // minutes
	this.chat_room = 'quicklove';
	this.default_timezone = 'America/Los_Angeles';

	return this;
}

module.exports = new appConstant();

/* End of file constant.js */
/* Location: ./config/constant.js */