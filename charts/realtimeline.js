//importig external modules required
import {layout} from '../utils/layout';
import * as d3 from "d3";
// import React from 'react';
// import ReactDom  from 'react-dom';
import { csv, json } from 'd3-fetch';
import {generator} from "../utils/generators";
import { min } from 'moment';
// import {interpolatePath} from 'd3-interpolate-path';
// import PropTypes from 'prop-types';
// import Selection from './selection';

//import {AppData} from './AppData.js';
var appData = [];
var annotData = [];
//Adding the main object for the data
var ecgChart = {};
var counter = 0;
var tI =1/200;
var numberofPoints = 15;
let minPoints = 5500 ;
var dpr = window.devicePixelRatio;

ecgChart.initialize = function(contID){
    this.pID = "aswin";
    this.config = {};
    this.config.lineTime = 10;
    this.config.dataInterval = 1/200;//0.008; //Data interval in milliseconds
    this.config.linePoints = this.config.lineTime/this.config.dataInterval;
    this.config.totallineTime =60;
    this.config.totallinePoints = this.config.totallineTime/this.config.dataInterval;
    this.config.displayTime =12;
    this.config.totalTime  =15;
    this.config.visiblePoints = this.config.totalTime/this.config.dataInterval;
    this.config.x = 0;
    this.config.y = 2;
    this.displayData = [];
    this.totalData = [];
    this.config.live = true;
    this.playIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 100 125" enable-background="new 0 0 100 100" xml:space="preserve"><path stroke="#76C9C2" stroke-width="5px" d="M51.5,12.5c13.131,0,25.383,6.875,32.289,18H75.5v4h16v-16h-4v10.393C79.928,16.303,66.211,8.5,51.5,8.5  c-23.16,0-42,18.842-42,42h4C13.5,29.547,30.547,12.5,51.5,12.5z M89.5,50.5c0,20.953-17.047,38-38,38  c-13.131,0-25.383-6.875-32.291-18H27.5v-4h-16v16h4V72.107c7.572,12.59,21.289,20.393,36,20.393c23.16,0,42-18.842,42-42H89.5z"/></svg>`;
    dpr = window.devicePixelRatio;
   
    
    this.main  = d3.select("#"+contID);
    let config = this.config;
    config.width1 = this.main.node().offsetWidth;
    config.width2 = this.main.node().offsetWidth*0.98;
    config.height1 = this.main.node().offsetHeight;
    config.height2 = this.main.node().offsetHeight;
    config.totalHeight = this.main.node().offsetHeight;
    config.totalWidth = this.main.node().offsetWidth;

    this.main.selectAll("#display-line").data([1]).enter().append("canvas").attr("id","display-line") ;
    
    this.chart1 = document.getElementById("display-line");
    this.chart1.width = config.width1*dpr;
    this.chart1.height = config.height1*dpr;
    this.chart1.style.width = config.width1+"px";
    this.chart1.style.height = config.height1+"px";
    
    config.margin = {top:config.height1*0,right:this.chart1.width*0,bottom:this.chart1.height*0,left:this.chart1.width*0};

    this.xScaleDisplay= d3.scaleLinear().range([config.margin.left,config.width1-config.margin.right]);
    this.yScaleDisplay = d3.scaleLinear().range([config.margin.top,config.height1-config.margin.bottom]);

   

    
    this.ctx1 = this.chart1.getContext("2d")
    this.ctx1.scale(dpr,dpr);
    
    this.xScaleDisplay.domain([0,config.displayTime]);
    this.xGridScale = d3.scaleLinear().domain([0,this.config.displayTime]).range([config.margin.left,config.width1-config.margin.right]);
       
    // this.xScaleTotal.domain(xTotalDomain);//d3.max([10,d3.max(this.totalData.map((d) => {return d[config.x]}))])
    this.yScaleDisplay.domain([-2.5,2.5])//.domain([d3.min(subData.map((d) => {return d[config.y];}))*0.8,d3.max(subData.map((d) => {return d[config.y]}))*1.5]);//.domain([-300,300])
   
    d3.range(0,this.config.displayTime,0.04).map((d,di) => {
      this.ctx1.save();
      this.ctx1.beginPath();
      this.ctx1.strokeStyle = '#d9e1e6';
      this.ctx1.lineWidth = 0.5;
      this.ctx1.fillStyle = '#d9e1e6';
      this.ctx1.moveTo(this.xGridScale(d),config.margin.top);
      this.ctx1.lineTo(this.xGridScale(d),config.height1-config.margin.bottom);
      this.ctx1.stroke();

      this.ctx1.closePath();
      this.ctx1.restore();
    }); 
    d3.range(0,this.config.displayTime+0.2,0.2).map((d,di) => {
      this.ctx1.save();
      this.ctx1.beginPath();
      this.ctx1.strokeStyle = '#d9e1e6';
      this.ctx1.lineWidth = 1.5;
      this.ctx1.fillStyle = '#d9e1e6';
      this.ctx1.moveTo(this.xGridScale(d),config.margin.top);
      this.ctx1.lineTo(this.xGridScale(d),config.height1-config.margin.bottom);
      this.ctx1.stroke();

      this.ctx1.closePath();
      this.ctx1.restore();
    }); 

    d3.range(-2.5,2.5,1).map((d,di) => {
      this.ctx1.save();
      this.ctx1.beginPath();
      this.ctx1.strokeStyle = '#d9e1e6';
      this.ctx1.lineWidth = 1.5;
      this.ctx1.fillStyle = '#d9e1e6';
      this.ctx1.moveTo(this.config.margin.left,this.yScaleDisplay(d));
      this.ctx1.lineTo(config.width1-this.config.margin.right,this.yScaleDisplay(d));
      this.ctx1.stroke();

      this.ctx1.closePath();
      this.ctx1.restore();
    }); 
    d3.range(-2.5,2.6,0.2).map((d,di) => {
      this.ctx1.save();
      this.ctx1.beginPath();
      this.ctx1.strokeStyle = '#d9e1e6';
      this.ctx1.lineWidth = 0.5;
      this.ctx1.fillStyle = '#d9e1e6';
      this.ctx1.moveTo(this.config.margin.left,this.yScaleDisplay(d));
      this.ctx1.lineTo(config.width1-this.config.margin.right,this.yScaleDisplay(d));
      this.ctx1.stroke();

      this.ctx1.closePath();
      this.ctx1.restore();
    });
    
    ecgChart.startPlot()
};


ecgChart.cleanData = function(){
  appData = []
  this.displayData = []
  this.config.x = 0;
 ecgChart.updateChart([])
}

ecgChart.updateChart = function(data){
    var config = this.config;
    config.width1 = this.main.node().offsetWidth;
    config.width2 = this.main.node().offsetWidth*0.98;
    config.height1 = this.main.node().offsetHeight;
    config.height2 = this.main.node().offsetHeight;
    config.totalHeight = this.main.node().offsetHeight;
    config.totalWidth = this.main.node().offsetWidth;

    this.main.selectAll("#display-line").data([1]).enter().append("canvas").attr("id","display-line") ;
    dpr = window.devicePixelRatio
    this.chart1 = document.getElementById("display-line");
    if(this.chart1){
    this.chart1.width = config.width1*dpr;
    this.chart1.height = config.height1*dpr;
    this.chart1.style.width = config.width1+"px";
    this.chart1.style.height = config.height1+"px";
    }
    
    var totalData = this.totalData.concat(data);
    totalData = totalData.sort((a,b) => {return b[config.x]-a[config.x];}).slice(0,config.totallinePoints);
    var subData = this.displayData.concat(data).sort((a,b) => {return b[config.x]-a[config.x];}).slice(0,config.linePoints);
    

    this.xScaleDisplay.domain([0,config.displayTime]);
    this.xGridScale = d3.scaleLinear().domain([0,this.config.displayTime]).range([config.margin.left,config.width1-config.margin.right]);
       
    // this.xScaleTotal.domain(xTotalDomain);//d3.max([10,d3.max(this.totalData.map((d) => {return d[config.x]}))])
    this.yScaleDisplay.domain([-2.5,2.5])//.domain([d3.min(subData.map((d) => {return d[config.y];}))*0.8,d3.max(subData.map((d) => {return d[config.y]}))*1.5]);//.domain([-300,300])
    // this.yScaleTotal.domain([yTotalMin, yTotalMax]);
    
    config.lineGen = generator.getLineGenerator(this.xScaleDisplay,this.yScaleDisplay,config);
    
    this.ctx1.scale(dpr,dpr);
    this.ctx1.strokeStyle = '#00a6a4';
    this.ctx1.lineWidth = 2;
    this.ctx1.fillStyle = '#00a6a4';
    var  p = new Path2D(config.lineGen(subData));
    if(this.chart1){
      this.ctx1.clearRect(0,0,this.chart1.width,this.chart1.height);
    }
    requestAnimationFrame(() => {this.ctx1.stroke(p);});
    d3.range(0,this.config.displayTime,0.04).map((d,di) => {
      this.ctx1.save();
      this.ctx1.beginPath();
      this.ctx1.strokeStyle = '#d9e1e6';
      this.ctx1.lineWidth = 0.5;
      this.ctx1.fillStyle = '#d9e1e6';
      this.ctx1.moveTo(this.xGridScale(d),config.margin.top);
      this.ctx1.lineTo(this.xGridScale(d),config.height1-config.margin.bottom);
      this.ctx1.stroke();

      this.ctx1.closePath();
      this.ctx1.restore();
    }); 
    d3.range(0,this.config.displayTime+0.2,0.2).map((d,di) => {
      this.ctx1.save();
      this.ctx1.beginPath();
      this.ctx1.strokeStyle = '#d9e1e6';
      this.ctx1.lineWidth = 1.5;
      this.ctx1.fillStyle = '#d9e1e6';
      this.ctx1.moveTo(this.xGridScale(d),config.margin.top);
      this.ctx1.lineTo(this.xGridScale(d),config.height1-config.margin.bottom);
      this.ctx1.stroke();

      this.ctx1.closePath();
      this.ctx1.restore();
    }); 

    d3.range(-2.5,2.5,1).map((d,di) => {
      this.ctx1.save();
      this.ctx1.beginPath();
      this.ctx1.strokeStyle = '#d9e1e6';
      this.ctx1.lineWidth = 1.5;
      this.ctx1.fillStyle = '#d9e1e6';
      this.ctx1.moveTo(this.config.margin.left,this.yScaleDisplay(d));
      this.ctx1.lineTo(config.width1-this.config.margin.right,this.yScaleDisplay(d));
      this.ctx1.stroke();

      this.ctx1.closePath();
      this.ctx1.restore();
    }); 
    d3.range(-2.5,2.6,0.2).map((d,di) => {
      this.ctx1.save();
      this.ctx1.beginPath();
      this.ctx1.strokeStyle = '#d9e1e6';
      this.ctx1.lineWidth = 0.5;
      this.ctx1.fillStyle = '#d9e1e6';
      this.ctx1.moveTo(this.config.margin.left,this.yScaleDisplay(d));
      this.ctx1.lineTo(config.width1-this.config.margin.right,this.yScaleDisplay(d));
      this.ctx1.stroke();

      this.ctx1.closePath();
      this.ctx1.restore();
    });

    
    this.totalData = totalData;
    this.displayData = subData; 
                 
};
ecgChart.activateLive = function(){
  var obj = ecgChart;
  ecgChart.updateLine(d3.zoomIdentity);
  d3.select(obj.chart2).call(obj.zoom.transform, d3.zoomIdentity.translate(0,0).scale(1));
  obj.config.live = true;
              
  ecgChart.playCont.style("display","none");
};


ecgChart.updateData = function(rawData){
  let fR = rawData.e.map((d,di) => {return  [(+rawData.bt+di)/1000,d/375]})
  if(fR.length === 0){ 
    this.main.selectAll("#display-line").remove()
    return
  }
  appData = appData.concat(fR);
} ;





var sID
ecgChart.startPlot = function() {
clearInterval(sID)
sID = setInterval(() => {
        if(appData.length >= minPoints ){
          minPoints = 0
          var dL = appData.slice(0,numberofPoints).map((d,di) => {counter+= tI;return [counter.toFixed(3)].concat(d);});
          appData = appData.slice(numberofPoints,appData.length);
          
          ecgChart.updateChart(dL);
        }   
       
},numberofPoints*0.005*1000);

}

export   {ecgChart};