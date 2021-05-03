module.exports = function(app) {
	
	// route to handle all angular requests
	app.get('*', function(req, res,next) {
		let requestURL = req.url;
		if(requestURL.indexOf("/connect-return") >= 0){
			console.log('req.query',req.query)
			let oauthCode = (!req.query.code) ? '' : req.query.code;
			let userId    = (!req.query.userId) ? '' : req.query.userId;
			if(oauthCode){

				/* Verify  oauth code */
				var appRoot  = require('app-root-path'),
					model    = require(appRoot + '/lib/model.js'),
					constant = require(appRoot + '/config/constant.js'),
					custom   = require(appRoot + '/lib/custom.js'),
				    stripe   = require(appRoot + '/lib/stripe.js');
				stripe.verifyOAuthCode(function(respType,oauthResp){
					if(respType === 0){
						return res.send({
						            "code": 200,
						            "response": {},
						            "status": 0,
						            "message": 'Failed to verify.'
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
									            "message": 'Failed to verify.'
									        });
								}else{
									return res.send({
									            "code": 200,
									            "response": {},
									            "status": 1,
									            "message": 'successfully verified.'
									        });
								}
							},constant.user_details,{userPaymentAccountID:userPaymentAccountID},{userId:userId});
						}else{
							return res.send({
						            "code": 200,
						            "response": {},
						            "status": 0,
						            "message": 'Failed to verify.'
						        });
						}
					}
				},oauthCode);
			}else{
				return res.send({
					            "code": 200,
					            "response": {},
					            "status": 0,
					            "message": 'Failed to verify.'
					        });
			}
		}else{
			res.sendfile('./public/index.html');
		}
	});

};