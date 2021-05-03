"use strict";

/*
 * Purpose: For manage Stripe Payments
 * Authur : Sorav Garg
 * Company: Mobiweb Technology Pvt. Ltd.
*/

var appRoot  = require('app-root-path');
var constant = require(appRoot + '/config/constant.js');
var model    = require(appRoot + '/lib/model.js');
var stripe   = require("stripe")(constant.stripe_secret_key);


class Stripe {

	/* Stripe Functions Constructor */
	constructor() 
	{

	}

	/**
     * To pay using card details
     * @param {integer} cardNo
     * @param {integer} expiryMonth
     * @param {integer} expiryYear
     * @param {integer} CVV
     * @param {integer} amount
     * @param {string}  cardHolderName
     * @param {string}  currency
     * @param {string}  descprition (Optional)
    */
    payViaCardDetails(callBack,cardNo,expiryMonth,expiryYear,CVV,amount,cardHolderName,currency,descprition){

    	var descprition = (!descprition) ? '' : descprition;
    	stripe.charges.create({
    				  card : {number:cardNo,exp_month:expiryMonth,exp_year:expiryYear,name:cardHolderName},
					  amount: amount * 100,
					  currency: currency,
					  description:descprition 
					}, function(err, charge) {
					  	return callBack(err, charge);
					});
    }

    /**
     * To refund payment
     * @param {string} chargeID
    */
    refundPayment(callBack,chargeID){
    	stripe.refunds.create({
					  charge:chargeID 
					}, function(err, refund) {
					  	return callBack(err, refund);
					});
    }

    /**
     * To transfer amount to another stripe account
     * @param {float}   amount
     * @param {string}  currency
     * @param {string}  stripeUserID (CONNECTED_STRIPE_ACCOUNT_ID)
     * @param {string}  transferGroupName (Should be unique)
    */
    transferAmount(callBack,amount,currency,stripeUserID,transferGroupName){
    	stripe.transfers.create({
					  amount:amount * 100,
					  currency:currency, 
					  destination:stripeUserID,
					  transfer_group:transferGroupName,
					}, function(err, transfer) {
					  	return callBack(err, transfer);
					});
    }

    /**
     * To pay to owner account & transfer to another stripe account
     * @param {integer} cardNo
     * @param {integer} expiryMonth
     * @param {integer} expiryYear
     * @param {integer} CVV
     * @param {integer} ownerAmount
     * @param {integer} destinationAmount
     * @param {string}  currency
     * @param {string}  cardHolderName
     * @param {string}  stripeUserID (CONNECTED_STRIPE_ACCOUNT_ID)
    */
    payWithTransferAmount(callBack,cardNo,expiryMonth,expiryYear,CVV,cardHolderName,ownerAmount,currency,stripeUserID,destinationAmount){
    	stripe.charges.create({
    				  card : {number:cardNo,exp_month:expiryMonth,exp_year:expiryYear,name:cardHolderName},
					  amount:ownerAmount * 100,
					  currency:currency,
					  destination: {
								    amount: destinationAmount * 100,
								    account: stripeUserID,
								  },
					}, function(err, charge) {
					  	return callBack(err, charge);
					});
    }

    /**
     * To reverse transfer amount
     * @param {string}  transferID
     * @param {integer} transferAmount
    */
    reverseTransfer(callBack,transferID,transferAmount){
    	stripe.transfers.createReversal(transferID,{
					  amount:transferAmount * 100 
					}, function(err, refund) {
					  	return callBack(err, refund);
					});
    }

    /**
     * To verify OAuth Code for Stripe Connect
     * @param {string} oauthCode
    */
    verifyOAuthCode(callBack,oauthCode){
    	let request = require('request');
    	request.post({
		    url: 'https://connect.stripe.com/oauth/token',
		    form: {
		      grant_type: "authorization_code",
		      client_id: constant.stripe_client_id,
		      code: oauthCode,
		      client_secret: constant.stripe_secret_key
		    }
		  }, function(err, r, body) {
		  	if(err){
		  		return callBack(0,err);
		  	}else{
		  		var bodyResp = JSON.parse(body);
		  		console.log('bodyResp',bodyResp);
		  		return callBack(1,bodyResp);
		  	}
		  });
    }

    /**
     * To retrieve balance
    */
    retrieveBalance(callBack){
        stripe.balance.retrieve(function(err, balance) {
                        return callBack(err, balance);
                    });
    }

    /**
     * To create customer on stripe server
     * @param {integer} cardNo
     * @param {integer} expiryMonth
     * @param {integer} expiryYear
     * @param {integer} CVV
     * @param {string}  cardHolderName
     * @param {string}  userEmail
     * @param {string}  descprition (Optional)
    */
    createCustomer(callBack,cardNo,expiryMonth,expiryYear,CVV,cardHolderName,userEmail,descprition){

        var descprition = (!descprition) ? '' : descprition;
        stripe.customers.create({
                        description:descprition,
                        email:userEmail,
                        card : {number:cardNo,exp_month:expiryMonth,exp_year:expiryYear,name:cardHolderName},
                    }, function(err, customer) {
                        return callBack(err, customer);
                    });
    }

    /**
     * To save card details on stripe server
     * @param {integer} cardNo
     * @param {integer} expiryMonth
     * @param {integer} expiryYear
     * @param {integer} CVV
     * @param {string}  cardHolderName
     * @param {string}  stripeCustomerID
    */
    saveCard(callBack,cardNo,expiryMonth,expiryYear,CVV,cardHolderName,stripeCustomerID){
        stripe.customers.createSource(stripeCustomerID,{
                        card : {number:cardNo,exp_month:expiryMonth,exp_year:expiryYear,name:cardHolderName},
                    }, function(err, card) {
                        return callBack(err, card);
                    });
    }

    /**
     * To delete card from stripe server
     * @param {string}  stripeCardID
     * @param {string}  stripeCustomerID
    */
    deleteCard(callBack,stripeCardID,stripeCustomerID){
        stripe.customers.deleteCard(stripeCustomerID,stripeCardID, function(err, confirmation) {
                        return callBack(err, confirmation);
                    });
    }

    /**
     * To get saved card list
     * @param {string}  stripeCustomerID
     * @param {integer} limit
    */
    getCardsList(callBack,stripeCustomerID,limit){
        stripe.customers.listCards(stripeCustomerID,{limit:limit}, function(err, cards) {
                        return callBack(err, cards);
                    });
    }

    /**
     * To get saved card details
     * @param {string} stripeCustomerID
     * @param {string} stripeCardID
    */
    getCardDetails(callBack,stripeCustomerID,stripeCardID){
        stripe.customers.retrieveCard(stripeCustomerID,stripeCardID, function(err, card) {
                        return callBack(err, card);
                    });
    }

    /**
     * To pay by saved card
     * @param {string}  stripeCustomerID
     * @param {string}  stripeCardID
     * @param {string}  currency
     * @param {integer} amount
    */
    payBySavedCard(callBack,stripeCustomerID,stripeCardID,currency,amount){
        stripe.charges.create({
                      amount: amount * 100,
                      currency: currency,
                      customer:stripeCustomerID,
                      card:stripeCardID
                    }, function(err, charge) {
                        return callBack(err, charge);
                    });
    }

    /**
     * To check if account is connected or not
     * @param {string} stripeUserAccountID
    */
    isAccountConnected(callBack,stripeUserAccountID){
        stripe.accounts.retrieve(stripeUserAccountID, function(err, account) {
                        return callBack(err, account);
                    });
    }

    


}

module.exports = new Stripe();

/* End of file Stripe.js */
/* Location: ./lib/Stripe.js */