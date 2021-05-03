"use strict";

/*
 * Purpose : For Admin Panel app configuration
 * Company : Mobiweb Technology Pvt. Ltd.
 * Developed By  : Sorav Garg
*/

var app = angular.module("quick-love", ['ui.router','ngBootstrap','linkDirective','textAngular','ngSanitize','datatables','ngJsonExportExcel','ui.select2']);

app.run(function($rootScope, $location, $window, $state,appServices) {

    $rootScope.$on('$stateChangeStart',
        function(event, toState, toParams, fromState, fromParams) {
            $rootScope.currenturl = toState.url.split("/")[1];
        })

    $rootScope.$watch(function() {
        return ($location.path()).split("/")[1];
    }, function(url) {
        $rootScope.userLoginSessionKey = localStorage.getItem('userLoginSessionKey') || "";
        $rootScope.userFirstName       = localStorage.getItem('userFirstName') || "";
        $rootScope.userLastName        = localStorage.getItem('userLastName') || "";
        $rootScope.isloggedIn          = localStorage.getItem('isloggedIn') || false;
        $rootScope.appView = false;
        $rootScope.errorMessage = false;
        $rootScope.successMessage = false;
        let isPaymentURL = 0;
        if ($rootScope.isloggedIn != 'true') {
            if($location.path() == '/connect-return'){
                isPaymentURL = 1;
            }else{
                $location.path('/');
            }
        }else{
            if($location.path() == '/connect-return'){
                isPaymentURL = 1;
            }else{
                if($location.path() == '/'){
                    $location.path('admin/dashboard');
                }else{
                    $location.path();
                }
            }
        }
        if(isPaymentURL == 1)
        {
            console.log('isPaymentURL',1);
        }
    });

}); //run function



app.config(['$stateProvider', '$urlRouterProvider', '$httpProvider','$locationProvider', function($stateProvider, $urlRouterProvider, $httpProvider,$locationProvider) {

    $httpProvider.defaults.headers.common = {};
    $httpProvider.defaults.headers.post = {};
    $httpProvider.defaults.headers.put = {};
    $httpProvider.defaults.headers.patch = {};
    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise("/");

    $stateProvider
        .state('login', {
            url: "/",
            controller: 'loginCtrl',
            templateUrl: "views/login.html"
        })
        .state('changePassword', {
            url: "/admin/change-password",
            controller: 'userCtrl',
            templateUrl: "views/change-password.html"
        })
        .state('users', {
            url: "/admin/users",
            controller: 'userCtrl',
            templateUrl: "views/users.html"
        })
        .state('content', {
            url: "/admin/content",
            controller: 'userCtrl',
            templateUrl: "views/content.html"
        })
        .state('viewUserDetails', {
            url: "/admin/view-user-details/:userID",
            controller: 'userCtrl',
            templateUrl: "views/view-user-details.html"
        })
        .state('walletHistory', {
            url: "/admin/wallet-history/:userID",
            controller: 'userCtrl',
            templateUrl: "views/wallet-history.html"
        })
        .state('transactionHistory', {
            url: "/admin/transaction-history/:userID",
            controller: 'userCtrl',
            templateUrl: "views/transaction-history.html"
        })
        .state('viewReportFlagDetails', {
            url: "/admin/view-report-flag-details/:userReportId",
            controller: 'userCtrl',
            templateUrl: "views/view-report-flag-details.html"
        })
        .state('reports', {
            url: "/admin/reports",
            controller: 'userCtrl',
            templateUrl: "views/reports.html"
        })
        .state('viewTxnDispute', {
            url: "/admin/view-txn-dispute/:txnID",
            controller: 'userCtrl',
            templateUrl: "views/view-txn-dispute.html"
        })
        .state('viewOrderDetails', {
            url: "/admin/view-order-details/:orderID",
            controller: 'userCtrl',
            templateUrl: "views/view-order-details.html"
        })
        .state('viewJobDetails', {
            url: "/admin/view-job-details/:jobID",
            controller: 'userCtrl',
            templateUrl: "views/view-job-details.html"
        })
        .state('reportFlag', {
            url: "/admin/report-flags/:userID",
            controller: 'userCtrl',
            templateUrl: "views/report-flags.html"
        })
        .state('orderHistory', {
            url: "/admin/order-history/:userID",
            controller: 'userCtrl',
            templateUrl: "views/order-history.html"
        })
        .state('myJobHistory', {
            url: "/admin/my-job-history/:userID",
            controller: 'userCtrl',
            templateUrl: "views/my-job-history.html"
        })
        .state('receivedJobHistory', {
            url: "/admin/received-job-history/:userID",
            controller: 'userCtrl',
            templateUrl: "views/received-job-history.html"
        })
        .state('preferences', {
            url: "/admin/preferences",
            controller: 'userCtrl',
            templateUrl: "views/preferences.html"
        })
        .state('contactus', {
            url: "/admin/contact-us-requests",
            controller: 'userCtrl',
            templateUrl: "views/contactus.html"
        })
        .state('viewNotificationHistory', {
            url: "/admin/notifications-history",
            controller: 'userCtrl',
            templateUrl: "views/notifications-history.html"
        })
        .state('addNewPreference', {
            url: "/admin/add-new-preference",
            controller: 'userCtrl',
            templateUrl: "views/add-new-preference.html"
        })
        .state('reportFlagCategories', {
            url: "/admin/report-flag-categories",
            controller: 'userCtrl',
            templateUrl: "views/report-flag-categories.html"
        })
        .state('addNewReportFlagCategory', {
            url: "/admin/add-new-report-flag-category",
            controller: 'userCtrl',
            templateUrl: "views/add-new-report-flag-category.html"
        })
        .state('sendNotifications', {
            url: "/admin/send-notifications",
            controller: 'userCtrl',
            templateUrl: "views/send-notifications.html"
        })
        .state('adminDashboard', {
            url: "/admin/dashboard",
            controller: 'userCtrl',
            templateUrl: "views/dashboard.html"
        });

}]); //config fuction