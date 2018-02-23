(function () {
    'use strict';

	angular.module('flexvolt.physiobuddy',[])

    .controller('PhysiobuddyCtrl', ['$scope', '$state', '$stateParams', '$ionicPopup','$ionicPopover', '$ionicModal', '$interval', 'myometerPlot', 'myometerLogic', 'dataHandler', 'hardwareLogic', 'customPopover',
    function($scope, $state, $stateParams, $ionicPopup, $ionicPopover, $ionicModal, $interval, myometerPlot, myometerLogic, dataHandler, hardwareLogic, customPopover) {
      

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
