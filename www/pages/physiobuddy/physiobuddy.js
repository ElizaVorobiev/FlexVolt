(function () {
    'use strict';

	angular.module('flexvolt.physiobuddy',[])

    .controller('PhysiobuddyCtrl', ['$scope', '$state', '$stateParams', '$ionicPopup', '$ionicPopover', '$ionicModal', '$interval', 'customPopover',
    function($scope, $state, $stateParams, $ionicPopup, $ionicPopover, $ionicModal, $setTimeout, $interval, dataHandler, hardwareLogic, customPopover) {


    $ionicModal.fromTemplateUrl('/pages/physiobuddy/physiobuddyExercise-modal.html', {
      id: '0',
      scope: $scope,
    }).then(function(modal) {
      $scope.oModal0 = modal;
    });

    $ionicModal.fromTemplateUrl('/pages/physiobuddy/physiobuddyExercise-rest-modal.html', {
      id: '1', 
      scope: $scope,
    }).then(function(modal) {
      $scope.oModal1 = modal;
    });

    $ionicModal.fromTemplateUrl('/pages/physiobuddy/physiobuddyExercise-finished-modal.html', {
      id: '2', 
      scope: $scope,
    }).then(function(modal) {
      $scope.oModal2 = modal;
    });

    $scope.openModal = function(index) {
      if (index == 0) $scope.oModal0.show();
      else if (index == 1) $scope.oModal1.show();
      else $scope.oModal2.show();
    };

    $scope.closeModal = function(index) {
      if (index == 1) $scope.oModal1.hide();
      else if (index == 0) $scope.oModal0.hide();
      else $scope.oModal2.hide();
    };  

    //countdown timer
    // var timeleft = 10;
    // var countdownTimer = setInterval( function() {
    // timeleft = timeleft-1;
    // document.getElementById("timer").textContent = timeleft;
    // if(timeleft <= 0) {
    //     closeModal(1);
    //     clearInterval(countdownTimer);
    // }
    // },1500);

var timeleft = 10;
    var downloadTimer = setInterval(function(){
    timeleft--;
    document.getElementById("timer").textContent = timeleft;
    if(timeleft <= 0)
        clearInterval(downloadTimer);
    },1000);

    	/* Physiobuddy home 
			- display some info about user (todo:later)
			- button that says do my exercises
    	*/

    	/* Step 1a : Connect Brace --> Maybe we skip this one for now?
			- check that connected
			- switch template 
    	*/

    	/* Step 1b : Brace is Connected 
			- show picture of exercise
			- Button to calibrate - takes you to next step
    	*/

    	/* Step 2 : Calibrate Brace 
			- display images
			- d3 animate
			- start recording data 
	    	- cancel recording data 
	    	- process data
	    	- set new MVC
	    	- show progress bar
	    	- Move onto exercise bar
	    	- Popover before starting exercise with info, click into exercise from here
    	*/
    	//function called when the user clicks start recording on Calibrate your brace page
    	$scope.setMVC = function(){

    	};

    	/* Step 3 : do exercise
			- start looking at data right away? 
			- process data
				- display counter ( js)
				- display visual feedback (d3)
			- popover for rest time
			- popover for countdown for get ready
			- popover for completion and take to home
			- need some soft of timer function/ display seconds countdown
    	*/
    	//function called when user clicks start exercise
    	$scope.startExercise = function(){

    	};


      //init();
    }])
}())
