/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* Original Author:  Brendan Flynn
 *
 * factory for drawing the xyDot and trace plots
 *
 */
(function () {
'use strict';

angular.module('flexvolt.d3plots', [])

/**
 * Abstracts the flexvolt, deals with bluetooth communications, etc.
 */
.factory('myometerPlot', function() {
    var mar, margin, width, height, plotElement;
    mar = 10;
    margin = {top: mar, right: mar, bottom: mar, left: 70};
    var headerPadding = 45;
    var footerPadding = 160;
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - margin.top - headerPadding - margin.bottom - footerPadding;

    var yMax;

    var svg, xScale, xAxis, yScale, yAxis, data = [], bar, yLabel;
    var textLabel = undefined;
    var updateTargets;
    var yTicks = [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5];

    var api = {
      init:undefined,
      reset:undefined,
      resize:undefined,
      update:undefined,
      settings:undefined,
      addText: undefined,
      removeText: undefined
    };

    var dragging = false;

    // for dragging threshold bars around
    var drag = d3.behavior.drag()
      .origin(Object)
      .on('dragstart', function(){dragging = true;})
      .on("drag", dragmove)
      .on('dragend', function(){
        var dragger = d3.select(this);
        var colInd = dragger[0][0]['__data__']['x'];
        var newVal = parseInt(dragger.attr("y"));
        var scaledVal;
        if (api.settings.baselineMode === 'absolute'){
          scaledVal = yMax*(height-newVal)/height;
        } else if (api.settings.baselineMode === 'relative'){
          scaledVal = 100*(height-newVal)/height;
        }
        //console.log('ob: '+colInd+'to: '+ newVal+ ', and scaled: '+scaledVal);
        updateTargets(colInd, scaledVal);
        api.settings.targets[api.settings.baselineMode][colInd-1] = scaledVal;
        api.reset();
        dragging = false;
        });

    function dragmove() {
      var dragger = d3.select(this);
      var newVal = d3.event.dy + parseInt(dragger.attr("y"));
      newVal = Math.min(Math.max(newVal,0),height);
      dragger.attr("y", function(){return newVal;});
    }


    function drawTargets(){
      svg.selectAll('limits')
          .data(data)
          .enter()
          .append('rect')
          .attr("rx", 6)
          .attr("ry", 6)
          .attr('x', function(d) {return xScale(d.x)-3;})
          .attr('y', function(d) {return yScale(d.target);})
          .attr('width', xScale.rangeBand()+6)
          .attr('height', 10)
          .attr('stroke', 'rgb(0,0,0)')
          .attr('fill', 'rgb(150, 150, 150)')
          .attr("cursor", "move")
          .call(drag);;

    }

    api.reset = function(){
      if (svg){
        svg.selectAll('path.rect').remove();
        d3.select('svg').remove();
      }

      data = [];
      var targetTmp;
      for (var k = 0; k<api.settings.nChannels; k++){
          data[k]={x:0, y:0, limit:-50, label:''};
          data[k].x = k+1;
          data[k].value = 0;
          if (api.settings.baselineMode === 'relative'){
            targetTmp = api.settings.targets[api.settings.baselineMode][k];
            targetTmp = Math.min(Math.max(targetTmp,0),100);
          } else if (api.settings.baselineMode === 'absolute'){
            targetTmp = api.settings.targets[api.settings.baselineMode][k];
            targetTmp = Math.min(Math.max(targetTmp,0),yMax);
          }
          data[k].target = targetTmp;

          data[k].label = api.settings.labels[k];
      }

      xScale = d3.scale.ordinal()
        .rangeBands([0, width], 0.2)
        .domain(data.map(function(d) { return d.x; }));

      yScale = d3.scale.linear()
        .range([height, 0])

      if (api.settings.baselineMode === 'absolute'){
        yScale.domain([0, yMax])
        yLabel = 'Signal Strength, mV';
      } else if (api.settings.baselineMode === 'relative'){
        yScale.domain([0, 100]);
        yLabel = '% Maximum Contraction';
      }

      yAxis = d3.svg.axis()
              .scale(yScale)
              .orient('left')
//              .tickValues(yTicks)
              .tickSize(10,0)
              .tickSubdivide(true)
              .tickPadding(10)
              .tickSize(-width);

      xAxis = d3.svg.axis().scale(xScale).orient('bottom').tickFormat(function(d,i){return api.settings.labels[i];}).tickSize(10);

      svg = d3.select(plotElement).append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + (margin.top + headerPadding) + ')');

      // x-axis
      svg.append('g')
          .attr('class', 'axisnoline')
          .attr('font-size', 20)
          .attr('fill', 'rgb(0,0,0)')
          .attr('format', 'd')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xAxis)

      // y-axis
      svg.append('g')
          .attr('class', 'axisnoline')
          .attr('font-size', 20)
          .attr('fill', 'rgb(0,0,0)')
          .call(yAxis)
          .append('text')
          .attr('class', 'label')
          .attr('transform', 'rotate(-90)')
          .attr('y', -60)
          .attr('x', -height/2)
          .attr('dy', '.71em')
          .attr('fill', 'rgb(0,0,0)')
          .style('text-anchor', 'middle')
          .text(yLabel);

      drawTargets();
    };

    api.init = function(element, settings, vMax, limitsCB){
        width = window.innerWidth - margin.left - margin.right,
        height = window.innerHeight - margin.top - headerPadding - margin.bottom - footerPadding;
        plotElement = element;
        api.settings = settings;
        yMax = vMax;
        updateTargets = limitsCB;

        api.reset();
    };

    api.addText = function(text){
      d3.select('#notificationText').remove();
      textLabel = text;
    };

    api.removeText = function(){
      d3.select('#notificationText').remove();
      textLabel = undefined;
    };

    api.update = function(dataIn){
      if (dragging){
        // don't update rectangles while dragging - race conditions
        return;
      }

      for (var k = 0; k < api.settings.nChannels; k++){
        data[k].value = Math.max(0,dataIn[k]); // adjusting to actual
      }

      svg.selectAll('rect').remove();
      svg.selectAll('bars')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', function(d) {return xScale(d.x);})
        .attr('y', function(d) {return yScale(d.value);})
        .attr('width', xScale.rangeBand())
        .attr('height', function(d) {return height-yScale(d.value);})
        .attr('stroke', 'rgb(0,0,0)')
        .attr('fill', function(d) {if(d.value > d.target){return 'orange';} else {return 'blue';}});

      drawTargets();

      if (textLabel){
        d3.select('#notificationText').remove();
        svg.append('text')
          .attr('id','notificationText')
          .attr('x', width/2)
          .attr('y', margin.top+height/2)
          .text(textLabel)
          .attr('fill','black')
          .attr('text-anchor', 'middle')
          .style('font', '16px Helvetica');
      }
    }

    api.resize = function(){
        console.log('DEBUG: plot resized');
        width = window.innerWidth - margin.left - margin.right,
        height = window.innerHeight - margin.top - headerPadding - margin.bottom - footerPadding;

        api.reset();
    };

    return api;
})

.factory('physiobuddyCalibratePlot', function () {
   var mar, margin, width, height, plotElement, barMax, x;
    mar = 10;
    margin = {top: mar, right: mar, bottom: mar, left: 70};
    var headerPadding = 45;
    var footerPadding = 160;
    // width = window.innerWidth - margin.left - margin.right,
    // height = window.innerHeight - margin.top - headerPadding - margin.bottom - footerPadding;
    width = window.innerWidth - margin.left - margin.right,
    height = 300 - margin.top - headerPadding - margin.bottom - footerPadding;
    var yMax;

    var svg, xScale, xAxis, yScale, yAxis, data = [], barMax, yLabel;
    var textLabel = undefined;
    // var updateTargets;
    // var yTicks = [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5];

    var api = {
      init:undefined,
      reset:undefined,
      resize:undefined,
      update:undefined,
      settings:undefined,
      addText: undefined,
      removeText: undefined
    };

    data = [0]
    api.reset = function(){
        if (svg){
          d3.select('svg').remove();
        }
        svg = d3.select(plotElement).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        xScale = d3.scale.linear()
            .range([0, width])
            .domain([0, barMax]);
        
        svg.selectAll("rect") // this is what actually creates the bars
          .data(data)
        .enter().append("rect")
          .attr("width", barMax)
          .attr("height", 20)
          .attr("rx", 5) // rounded corners
          .attr("ry", 5);
          
        // svg.selectAll("text") // adding the text labels to the bar
        //   .data(data)
        // .enter().append("text")
        //   .attr("x", x)
        //   .attr("y", 10) // y position of the text inside bar
        //   .attr("dx", -3) // padding-right
        //   .attr("dy", ".35em") // vertical-align: middle
        //   .attr("text-anchor", "end") // text-align: right
        //   .text(String);


    };
    api.update = function(dataIn){

      // for (var k = 0; k < api.settings.nChannels; k++){
      //   data[k].value = Math.max(0,dataIn[k]); // adjusting to actual
      // }
      var dataMax = Math.max(5, Math.max(...dataIn)*3500);//temporarly give large value
      data =[dataMax]
      svg.selectAll('rect').remove();
      svg.selectAll('bars')
        .data(data)
        .enter()
        .append('rect')
        // .attr('x', function(d) {return xScale(d.x);})
        // .attr('y', width})
        .attr('width', function(d) {return d})
        // .attr('height', function(d) {return height-yScale(d.value);})
        .attr("height", 40)
        .attr("rx", 5) // rounded corners
        .attr("ry", 5);

        if (textLabel){
          d3.select('#mvcPrompt').remove();
          svg.append('text')
            .attr('id','mvcPrompt')
            .attr('x', width/2)
            .attr('y', margin.top+height/1.75)
            .text(textLabel)
            .attr('fill','black')
            .attr('text-anchor', 'middle')
            .style('font', '16px Helvetica');
        }

    }

    api.addText = function(text){
      d3.select('#mvcPrompt').remove();
      textLabel = text;
    };

    api.removeText = function(){
      d3.select('#mvcPrompt').remove();
      textLabel = undefined;
    };
   
    api.init = function(element, settings, vMax){
        plotElement = element;
        barMax = 0.05;
        // width = window.innerWidth - margin.left - margin.right,
        // height = window.innerHeight - margin.top - headerPadding - margin.bottom - footerPadding;
        width = Math.floor(window.innerWidth*.6) - margin.left - margin.right,
        height = 300 - margin.top - headerPadding - margin.bottom - footerPadding;
        api.settings = settings;
        api.reset();
    }

    api.afterMVC = function(){
      // if (svg){
      //     d3.select('svg').remove();
      // }
      // api.addText('Your MVC has been calculated :)');
      
    };


    api.resize = function(){
        console.log('DEBUG: plot resized');
        width = window.innerWidth - margin.left - margin.right,
        height = 300 - margin.top - headerPadding - margin.bottom - footerPadding;

        api.reset();
    };

  return api;
})

.factory('physiobuddyExercisePlot', function () {

  var api = {
    init:undefined,
    reset:undefined,
    resize:undefined,
    update:undefined,
    settings:undefined,
    addText: undefined,
    removeText: undefined,
    addCountdownText: undefined,
    removeCountdownText: undefined,
    inGreen: undefined,
    inRed: undefined
  };

  var Needle, needle, arc1, arc2, arc1EndRad, arc1StartRad, barWidth, chart, chartInset, arc2EndRad, arc2StartRad, bar2Width, chart2Inset, degToRad, plotElement, endPadRad, height, i, margin, needle, numSections, padRad, percToDeg, percToRad, percent, radius, ref, sectionIndx, sectionPerc, startPadRad, svg, totalPercent, width;
  var chartSettings = {
      percent: .65,
      barWidth: 20,
      //this is the red section, which is below 60% MVC
      // 0.6 / 2 since half a circle
      section1Perc : 0.30,
      //this is the green section, which is above 60% MVC
      // 0.4 / 2 since half a circle
      section2Perc : 0.20,
      padRad : 0.05,
      chartInset : 10,
      // start at 270deg
      totalPercent : .75,
      radius: 200,
      margin : {
        top: 20,
        right: 20,
        bottom: 30,
        left: 20
      }
  };

  bar2Width = chartSettings.barWidth - 8;
  chart2Inset = chartSettings.chartInset +2;
  //define the different thicknesses for arcs
  var wideInnerRadius = chartSettings.radius - chartSettings.chartInset - chartSettings.barWidth;
  var wideOuterRadius = chartSettings.radius;
  var thinInnerRadius = chartSettings.radius - chart2Inset - bar2Width;
  var thinOuterRadius = chartSettings.radius - chartSettings.chartInset/2;
  percToDeg = function(perc) {
    return perc * 360;
  };

  percToRad = function(perc) {
    return degToRad(percToDeg(perc));
  };

  degToRad = function(deg) {
    return deg * Math.PI / 180;
  };

  Needle = class Needle {
    constructor(len, radius1) {
      this.len = len;
      this.radius = radius1;
    }

    drawOn(el, perc) {
      el.append('circle').attr('class', 'needle-center').attr('cx', 0).attr('cy', 0).attr('r', this.radius);
      return el.append('path').attr('class', 'needle').attr('d', this.mkCmd(perc));
    }

    //call this in the update function
    animateOn(el, perc) {
      d3.select('.needle').attr('d', this.mkCmd(perc));
      //remove animation for now
      // var self;
      // self = this;
      // return el.transition().delay(500).ease('elastic').duration(3000).selectAll('.needle').tween('progress', function() {
      //   return function(percentOfPercent) {
      //     var progress;
      //     progress = percentOfPercent * perc;
      //     return d3.select(this).attr('d', self.mkCmd(progress));
      //   };
      // });
    }

    mkCmd(perc) {
      var centerX, centerY, leftX, leftY, rightX, rightY, thetaRad, topX, topY;
      thetaRad = percToRad(perc / 2); // half circle
      centerX = 0;
      centerY = 0;
      topX = centerX - this.len * Math.cos(thetaRad);
      topY = centerY - this.len * Math.sin(thetaRad);
      //don't really need the stuff below, this just makes the triangle
      leftX = centerX - this.radius * Math.cos(thetaRad - Math.PI / 2);
      leftY = centerY - this.radius * Math.sin(thetaRad - Math.PI / 2);
      rightX = centerX - this.radius * Math.cos(thetaRad + Math.PI / 2);
      rightY = centerY - this.radius * Math.sin(thetaRad + Math.PI / 2);
      return `M ${leftX} ${leftY} L ${topX} ${topY} L ${rightX} ${rightY}`;
    }

  };
  api.inGreen = function() {
      //remove any curent arcs and then redraw
      d3.selectAll('.arc').remove();
      //make green the thicker arc
      arc1 = d3.svg.arc().outerRadius(thinOuterRadius).innerRadius(thinInnerRadius).startAngle(arc1StartRad).endAngle(arc1EndRad);
      chart.append('path').attr('class', `arc chart-color1`).attr('d', arc1); 
      
      arc2 = d3.svg.arc().outerRadius(wideOuterRadius).innerRadius(wideInnerRadius).startAngle(arc2StartRad).endAngle(arc2EndRad);
      chart.append('path').attr('class', `arc chart-color2`).attr('d', arc2);
  }

  api.inRed = function() {
      //remove any curent arcs and then redraw
      d3.selectAll('.arc').remove();
      //make green the thicker arc
      arc1 = d3.svg.arc().outerRadius(wideOuterRadius).innerRadius(wideInnerRadius).startAngle(arc1StartRad).endAngle(arc1EndRad);
      chart.append('path').attr('class', `arc chart-color1`).attr('d', arc1); 
      
      arc2 = d3.svg.arc().outerRadius(thinOuterRadius).innerRadius(thinInnerRadius).startAngle(arc2StartRad).endAngle(arc2EndRad);
      chart.append('path').attr('class', `arc chart-color2`).attr('d', arc2);
  }

   var mar, margin, width, height, plotElement;
    mar = 10;
    margin = {top: mar, right: mar, bottom: mar, left: 70};
    var headerPadding = 45;
    var footerPadding = 160;
    // width = window.innerWidth - margin.left - margin.right,
    // height = window.innerHeight - margin.top - headerPadding - margin.bottom - footerPadding;
    width = window.innerWidth - margin.left - margin.right,
    height = 400 - margin.top - headerPadding - margin.bottom - footerPadding;
    var yMax;

    var svg, xScale, xAxis, yScale, yAxis, data = [], yLabel;
    var textLabel = undefined;
    var exerciseCount = undefined;

    var counterSvg;

  api.reset = function(){
      if (svg){
        d3.select('svg').remove();
      }
      if (counterSvg){
        d3.select('#physiobuddyExerciseCounterWindow svg').remove();
      }
      radius = Math.min(width, height) / 2;
      svg = d3.select(plotElement).append('svg').attr('width', width + margin.left + margin.right).attr('height', height +margin.top +margin.bottom);

      chart = svg.append('g').attr('transform', `translate(${(width + margin.left + margin.right)/2}, 250)`);

      counterSvg = d3.select('#physiobuddyExerciseCounterWindow').append('svg').attr('width', width).attr('height', height/4);

    // build gauge bg
    //draw the first section:
      arc1 = d3.svg.arc().outerRadius(thinOuterRadius).innerRadius(thinInnerRadius).startAngle(arc1StartRad).endAngle(arc1EndRad);
      chart.append('path').attr('class', `arc chart-color1`).attr('d', arc1); 
    //draw the second section
      arc2 = d3.svg.arc().outerRadius(wideOuterRadius).innerRadius(wideInnerRadius).startAngle(arc2StartRad).endAngle(arc2EndRad);
      chart.append('path').attr('class', `arc chart-color2`).attr('d', arc2);

    //draw needle
      needle = new Needle(150, 10);
      needle.drawOn(chart, 0);

      needle.animateOn(chart, chartSettings.percent);

        
  };

  api.update = function(dataIn){

    // for (var k = 0; k < api.settings.nChannels; k++){
    //   data[k].value = Math.max(0,dataIn[k]); // adjusting to actual
    // }
    if (dataIn > chartSettings.percent) {
      api.inGreen();
    } else {
      api.inRed();
    }
    needle.animateOn(chart,Math.min(1, dataIn));//make sure needle doesn't go over the edge



      if (textLabel){
        d3.select('#exercisePrompt').remove();
        svg.append('text')
          .attr('id','exercisePrompt')
          .attr('x', width/2)
          .attr('y', margin.top+height)
          .text(textLabel)
          .attr('fill','black')
          .attr('text-anchor', 'middle')
          .style('font', '16px Helvetica');
      }
      if (exerciseCount){
        d3.select('#exerciseCount').remove();
        counterSvg.append('text')
          .attr('id','exerciseCount')
          .attr('x', width/2)
          .attr('y', 50)
          .text(exerciseCount)
          .attr('fill','black')
          .attr('text-anchor', 'middle')
          .style('font', '20px Helvetica');
      }


  }

  api.addText = function(text){
    d3.select('#exercisePrompt').remove();
    textLabel = text;
  };

  api.removeText = function(){
    d3.select('#exercisePrompt').remove();
    textLabel = undefined;
  };

  api.addCountdownText = function(text){
    d3.select('#exerciseCount').remove();
    exerciseCount = text;
  };

  api.removeCountdownText = function(){
    d3.select('#exerciseCount').remove();
    exerciseCount = undefined;
  };

  api.init = function(element, settings, vMax){
      plotElement = element;
      // width = window.innerWidth - margin.left - margin.right,
      // height = window.innerHeight - margin.top - headerPadding - margin.bottom - footerPadding;
      width = Math.floor(window.innerWidth*.8) - margin.left - margin.right,
      height = 500 - margin.top - headerPadding - margin.bottom - footerPadding;
      api.settings = settings;
      arc1StartRad = ((chartSettings.totalPercent)*360 *Math.PI)/180;
      arc1EndRad = arc1StartRad + ((chartSettings.section1Perc*360 *Math.PI)/180);
      arc2StartRad = arc1EndRad;
      arc2EndRad = arc2StartRad + ((chartSettings.section2Perc*360 *Math.PI)/180);
      api.reset();
  }

  api.doneExercise = function(){
    api.addText('Congratulations you have finished your exercise!');
    api.removeCountdownText();
    // if (svg){
    //     d3.select('svg').remove();
    // }
    // if (counterSvg){
    //     d3.select('#physiobuddyExerciseCounterWindow svg').remove();
    // }

  };

  api.resize = function(){
      console.log('DEBUG: plot resized');
      width = window.innerWidth - margin.left - margin.right,
      height = 500 - margin.top - headerPadding - margin.bottom - footerPadding;

      api.reset();
  };

  return api;
})

.factory('xyDot', function() {
    var mar, margin, width, height, plotElement;
    mar = 10;
    margin = {top: mar, right: mar, bottom: mar, left: mar};
    var headerPadding = 44;
    var footerPadding = 68;
    var xValue, xScale, xMap, yValue, yScale, yMap;
    var tail = true;
    var dataset = [];
    var nDots = 6;

    var svg;

    var api = {
        init:undefined,
        update:undefined,
        resize:undefined,
        dotRadius:undefined,
        settings:{
            s1:1,
            s2:2
        }
    };

    api.dotRadius = 15;

    api.reset = function(){
        if (svg){
          d3.select('svg').remove();
        }
        svg = d3.select(plotElement).append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        xValue = function(d) { return d.x;},
        xScale = d3.scale.linear()
            .range([api.dotRadius, width-api.dotRadius])
            .domain([0, 255]),
        xMap = function(d) {return xScale(xValue(d));};
        yValue = function(d) { return d.y;},
        yScale = d3.scale.linear()
            .range([height-2*api.dotRadius, api.dotRadius])
            .domain([0, 255]),
        yMap = function(d) {return yScale(yValue(d));};

        if (!!tail){
          for (var i=0; i<nDots;i++){
            dataset[i]={
              x:width/2,
              y:height/2,
              r:api.dotRadius,
              c:'#1f77b4',
              o:(1.0-i/nDots)
            };
          }
        } else {
          dataset[0]={
            x:width/2,
            y:height/28,
            r:api.dotRadius,
            c:'#1f77b4',
            o:1.0
          };
        }
    }

    api.init = function(element){
        plotElement = element;
        width = window.innerWidth - margin.left - margin.right,
        height = window.innerHeight - margin.top - headerPadding - margin.bottom - footerPadding;

        api.reset();
    }

    api.update = function(xIn, yIn){
        if(!!tail){
          for (var i=nDots-1; i>0; i--){
                dataset[i].x = dataset[i-1].x;
                dataset[i].y = dataset[i-1].y;
            }
            dataset[0].x = xIn;
            dataset[0].y = yIn;
        } else {
          dataset[0].x = xIn;
          dataset[0].y = yIn;
        }

        svg.selectAll('circle').remove();
        svg.selectAll('circle')
            .data(dataset)
            .enter().append('circle')
            .style('stroke', function(d){return d.c;})
            .style('fill', function(d){return d.c;})
            .style('opacity', function(d){return d.o;})
            .attr('r', function(d){return d.r;})
            .attr('cx', xMap)
            .attr('cy', yMap);
    }

    api.resize = function(){
        width = window.innerWidth - margin.left - margin.right,
        height = window.innerHeight - margin.top - headerPadding - margin.bottom - footerPadding;

        api.reset();
    };

    return api;
})
.factory('tracePlot', function() {
    var colorList = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf'];
    var margin, width, height, plotElement, htmlElement;
    var mar = 10;
    margin = {left: mar, right: mar, top: mar, bottom: 20};
    var PADDINGOFFSET = 8;

    var yMax;
    var tmpData = [];
    var xPos = 0, startPos = 0;

    var svg, yA, lineA;

    var api = {
      init:undefined,
      reset:undefined,
      resize:undefined,
      update:undefined,
      setN:undefined,
      settings:{
        nChannels: 2
      }
    };

    function setN(newN) {
      api.settings.nChannels = newN;
    }

    api.reset = function(){
        if (svg){
          svg.selectAll('path.line').remove();
        }
        d3.select('svg').remove();
        svg = d3.select(plotElement).append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        svg.append('rect')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('fill', 'white');

        xPos = 0;
        startPos = 0;
        yA = [];
        tmpData = [];
        for (var i = 0; i < api.settings.nChannels; i++){
            tmpData[i] = undefined;
            yA[i] = d3.scale.linear()
                .range([height-i*(height/api.settings.nChannels), height-(i+1)*(height/api.settings.nChannels)])
                .domain([-yMax, +yMax]);
        }

        lineA = [];
        if (api.settings.nChannels > 0){
            lineA[0] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[0](d); });
        }
        if (api.settings.nChannels > 1){
            lineA[1] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[1](d); });
        }
        if (api.settings.nChannels > 2){
            lineA[2] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[2](d); });
        }
        if (api.settings.nChannels > 3){
            lineA[3] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[3](d); });
        }
        if (api.settings.nChannels > 4){
            lineA[4] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[4](d); });
        }
        if (api.settings.nChannels > 5){
            lineA[5] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[5](d); });
        }
        if (api.settings.nChannels > 6){
            lineA[6] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[6](d); });
        }
        if (api.settings.nChannels > 7){
            lineA[7] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[7](d); });
        }
    }

    api.init = function(element, nChannels, vMax, isDemo){
        htmlElement = element;
        plotElement = '#'+element;
        var html = document.getElementById(htmlElement);
        width = html.clientWidth - margin.left - margin.right,
        height = html.clientHeight - margin.top - margin.bottom - PADDINGOFFSET;

        yA = [];
        lineA = [];
        svg = undefined;
        api.settings.nChannels = nChannels;
        yMax = vMax;

        api.reset();
    }

    api.update = function(dataIn, isLive){
        startPos = xPos > 0?xPos-1:0;
        xPos += dataIn[0].length;
        if (isLive) {
            if (xPos >= width){
                xPos = xPos%width;
                startPos = 0;
                for (var ind in dataIn){
                    dataIn[ind].splice(0,dataIn[ind].length-xPos); // over ran width, splice out data up to width
                }
                tmpData = [];
                for (var i = 0; i < api.settings.nChannels;i++){
                    tmpData[i] = undefined;
                }
                svg.selectAll('path.line').remove();
            }
        } else {
          svg.selectAll('path.line').remove(); // just clear the plot prior to showing all data
          startPos = 0;
        }

        for (var i = 0; i < api.settings.nChannels; i++){
            if (tmpData[i]) {dataIn[i].splice(0,0,tmpData[i]);}
            svg.append('svg:path')
                .attr('class','line')
                .attr('stroke', colorList[i])
                .attr('d', lineA[i](dataIn[i]));
            tmpData[i] = dataIn[i].slice(-1)[0];
        }
    };

    api.resize = function(){
        var html = document.getElementById(htmlElement);
        width = html.clientWidth - margin.left - margin.right,
        height = html.clientHeight - margin.top - margin.bottom - PADDINGOFFSET;

        api.reset();
    };

    api.setN = setN;

    return api;
})
.factory('rmsTimePlot', function() {
    var colorList = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf'];
    var leftPadding = 10;
    var rightPadding = 10;

    var margin, width, height, plotElement, htmlElement, dT;
    var mar = 4;
    margin = {left: 50, right: mar, top: mar, bottom: 35};
    var PADDINGOFFSET = 8;

    var svg, x, scaleX, y, autoY, xAxis, yAxis, zoom, line;
    var panExtent, xMax;
    var data = [], xPos = 0, startPos = 0;
    var tmpData = [];

    var yMax;

    var api = {
      init:undefined,
      reset:undefined,
      resize:undefined,
      update:undefined,
      settings:{
        nChannels: 1,
        zoomOption: 0,
        autoscaleY: false
      }
    };

    function zoomed() {

      // limit pan within plot limits (avoid panning to -x values, etc.)
      var panL = [0, 0];
      panL = panLimit();
      zoom.translate(panL);

//         redraw existing lines at new scale
      svg.selectAll('path.line').remove();
      startPos = 0;
      xPos = data[0].length;
      for (var i = 0; i < api.settings.nChannels; i++){
          svg.append('svg:path')
              .datum(data[i])
              .attr('class', 'line')
              .attr('clip-path', 'url(#clip)')
              .attr('stroke', colorList[i%colorList.length])
              .attr('d', line);
              //.attr('d', line(dataIn[i]));
      }

      // tried this on-liner, doesn't work yet
//        svg.selectAll('path.line').call(line);

      // reset axes - had to add some code to handle the axis ticks being in seconds, not ms
      scaleX = d3.scale.linear()
          .domain([x.domain()[0]*dT, x.domain()[1]*dT])
          .range([0, width]);

      xAxis = d3.svg.axis()
          .scale(scaleX)
          .tickSize(-height)
          .tickPadding(10)
          .tickSubdivide(true)
          .orient('bottom');

      svg.select('.x.axis').call(xAxis);
      svg.select('.y.axis').call(yAxis);
    }

    function panLimit() {

      var divisor = {h: height / ((y.domain()[1]-y.domain()[0])*zoom.scale()), w: width / ((x.domain()[1]-x.domain()[0])*zoom.scale())},
        minX = -(((x.domain()[0]-x.domain()[1])*zoom.scale())+(panExtent.x[1]-(panExtent.x[1]-(width/divisor.w)))),
        minY = -(((y.domain()[0]-y.domain()[1])*zoom.scale())+(panExtent.y[1]-(panExtent.y[1]-(height*(zoom.scale())/divisor.h))))*divisor.h,
        maxX = -(((x.domain()[0]-x.domain()[1]))+(panExtent.x[1]-panExtent.x[0]))*divisor.w*zoom.scale(),
        maxY = (((y.domain()[0]-y.domain()[1])*zoom.scale())+(panExtent.y[1]-panExtent.y[0]))*divisor.h*zoom.scale();

      var zoomOption = api.settings.zoomOption;
      var tx = 0, ty = 0;
      if (zoomOption === 'X AND Y'|| zoomOption === 'X ONLY'){
          //console.log('zoom x');
          tx = x.domain()[0] < panExtent.x[0] ?
                      minX :
                      x.domain()[1] > panExtent.x[1] ?
                              maxX :
                              zoom.translate()[0];
      }
      if (!api.settings.autoscaleY && (zoomOption === 'X AND Y'|| zoomOption === 'Y ONLY') ){
          //console.log('zoom y');
          ty = y.domain()[0]  < panExtent.y[0]?
                      minY :
                      y.domain()[1] > panExtent.y[1] ?
                              maxY :
                              zoom.translate()[1];
      }
      //console.log('panX: '+tx+', panY: '+ty);
      return [tx,ty];

    }

    autoY = function(){
        var tmp = [], allData = [];
        // combine all channels
        for (var chInd in data){
            allData = allData.concat(data[chInd]);
        }
        // combine all 'y' values
        for (var dInd in allData){
            tmp.push(allData[dInd].y);
        }
        // find the max
        var maxArr = Math.max.apply(Math, tmp);
        var ret = maxArr > 1? maxArr:1;
        return ret;
    };

    api.reset = function(){

        if (svg){
            svg.selectAll('path.line').remove();
            d3.select('svg').remove();
        }

        xPos = 0;
        startPos = 0;
        data = [];
        tmpData = [];
        for (var i = 0; i < api.settings.nChannels;i++){
            data[i] = [];
            tmpData[i] = angular.undefined;
        }

        x = d3.scale.linear()
            .domain([0, xMax])
            .range([0, width]);

        scaleX = d3.scale.linear()
            .domain([x.domain()[0]*dT, x.domain()[1]*dT])
            .range([0, width]);

        y = d3.scale.linear().range([height, 0]);
        if (api.settings.autoscaleY){
            y.domain([0, autoY()]);
        }else {
            y.domain([-0.01*yMax, yMax*1.01]);
        }

        if (api.settings.zoomOption === 'NONE'){
          zoom = function(){};
        } else if (api.settings.zoomOption === 'X ONLY') {
          zoom = d3.behavior.zoom()
              .x(x)
              .scaleExtent([1, 10])
              .on('zoom', zoomed);
        } else if (api.settings.zoomOption === 'Y ONLY') {
          zoom = d3.behavior.zoom()
              .y(y)
              .scaleExtent([1, 10])
              .on('zoom', zoomed);
        } else if (api.settings.zoomOption === 'X AND Y') {
          zoom = d3.behavior.zoom()
              .x(x)
              .y(y)
              .scaleExtent([1, 10])
              .on('zoom', zoomed);
        }

        svg = d3.select(plotElement).append('svg')
            .attr('width', width + margin.left + margin.right + leftPadding)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + (margin.left + leftPadding) + ',' + margin.top + ')')
            .call(zoom);

        svg.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', 'white');

        line = d3.svg.line()
            .interpolate('linear')
            .x(function(d, i) { return x(startPos + i); })
            .y(function(d, i) { return y(d); });

        xAxis = d3.svg.axis()
            .scale(scaleX)
            .tickSize(-height)
            .tickPadding(10)
            .tickSubdivide(true)
            .orient('bottom');

        yAxis = d3.svg.axis()
            .scale(y)
            .tickPadding(10)
            .tickSize(-width)
            .tickSubdivide(true)
            .orient('left');

        svg.append('g')
            .attr('class', 'x axis')
//            .attr('fill','none')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis);

        svg.append('g')
            .attr('class', 'y axis')
//            .attr('fill','none')
            .call(yAxis);

        svg.append('g')
            .attr('class', 'y axis')
            .append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('y', (-margin.left) + 15)
            .attr('x', -height/2-50)
            .text('RMS Muscle Signal, mV');

        svg.append('g')
            .attr('class', 'x axis')
            .append('text')
            .attr('class', 'axis-label')
            .attr('y', height+35)
            .attr('x', width/2)
            .text('Time, s');

        // keeps the zoom frame inside the plot window!
        svg.append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('width', width)
            .attr('height', height);

    };

    api.init = function(element, nChannels, newZoomOption, maxX, userFrequency, vMax){
        htmlElement = element;
        plotElement = '#'+element;
        var html = document.getElementById(htmlElement);
        width = html.clientWidth - margin.left - margin.right - leftPadding - rightPadding,
        height = html.clientHeight - margin.top - margin.bottom - PADDINGOFFSET;

        dT = 1/userFrequency;
        xMax = maxX/dT; // seconds
        panExtent = {x: [0,xMax], y: [-0.01*yMax,1.01*yMax] };

        yMax = vMax;

        xPos = 0;
        startPos = 0;

        api.settings.zoomOption = newZoomOption;
        api.settings.nChannels = nChannels;

        api.reset();
    };

    api.update = function(dataIn){
        startPos = xPos > 0?xPos-1:0;
        xPos += dataIn[0].length;
        if (xPos >= xMax){
            xPos = xPos%xMax;
            startPos = 0;
            for (var ind in dataIn){
                dataIn[ind].splice(0,dataIn[ind].length-xPos); // over ran width, splice out data up to width
            }
            svg.selectAll('path.line').remove();
            data = [];
            for (var i = 0; i < api.settings.nChannels;i++){
                data[i] = [];
                tmpData[i] = angular.undefined;
            }
        }

        if (api.settings.autoscaleY){
            y.domain([0, autoY()]);
        }

        for (var i = 0; i < api.settings.nChannels; i++){
            data[i] = data[i].concat(dataIn[i]);
            if (tmpData[i]) {dataIn[i].splice(0,0,tmpData[i]);}

            svg.append('svg:path')
                .datum(dataIn[i])
                .attr('class', 'line')
                .attr('clip-path', 'url(#clip)')
                .attr('stroke', colorList[i%colorList.length])
                .attr('d', line);

            tmpData[i] = dataIn[i].slice(-1)[0];
        }
    };

    api.resize = function(){
        var html = document.getElementById(htmlElement);
        // width = html.clientWidth - margin.left - margin.right - leftPadding - rightPadding,
        var calculatedWidth = window.innerWidth - 10 - 150;
        width = calculatedWidth - margin.left - margin.right - leftPadding - rightPadding,
        height = html.clientHeight - margin.top - margin.bottom - PADDINGOFFSET;

        api.reset();
    };

    return api;
})
;

}());
