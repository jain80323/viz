import {defaults} from "../config/default";
import {dataFormat} from "../utils/data-formatter";
import {select, timeDay, timeMinute, timeHour, timeMonth, timeDays, timeSeconds, timeMinutes, timeHours, timeMonths, ticks, timeFormat,json, timeFormatLocale} from "d3";
import {elementFormat} from "../utils/element-formatter";
import {axisBottom,axisLeft,axisTop,axisRight,scaleBand,scaleLinear,scaleUtc}  from "d3";
import { cloneDeep } from 'lodash-es'

let axisFormat = {};
axisFormat.removeLine = function(el){
    el.select(".domain").remove();
};
axisFormat.removeTicks = function(el){
    el.selectAll(".tick line").remove();
};
axisFormat.removeText = function(el){
    el.selectAll(".tick text").remove();
};
//Changed Wrap ticks to show Chinese Text as well when user wants to show X-axis text in chinese.
axisFormat.wrapTicks = function(el,config){
    el.selectAll(".tick").selectAll("text").data(d => [d,d]).enter().append("text");
    if(config.xAxis.locale != "en-US"){
        el.selectAll(".tick").selectAll("text")
        .attr("y", (d,di) =>  di*12+16 )
        .attr("dy", (d,di) =>  0 )
        .text((d,di) =>  di==0 ? config.xAxis.localeFormat.format(config.xAxis.ticks.text.timeFormat?config.xAxis.ticks.text.timeFormat:"%Y年%-m月%-d日")(new Date(d) ):config.xAxis.localeFormat.format(config.xAxis.ticks.text.hourFormat?config.xAxis.ticks.text.hourFormat:"%p %H:%M")(new Date(d)) );
    }
    else{
    el.selectAll(".tick").selectAll("text")
            .attr("y", (d,di) =>  di*12+16 )
            .attr("dy", (d,di) =>  0 )
            .text((d,di) =>  di==0 ? timeFormat(config.xAxis.ticks.text.timeFormat?config.xAxis.ticks.text.timeFormat:"%d %b %Y")(new Date(d) ):timeFormat(config.xAxis.ticks.text.hourFormat?config.xAxis.ticks.text.hourFormat:"%H:%M:%S")(new Date(d)) ); // Taking format from config instead of hardcoding 
    }
}

axisFormat.wrapLongTextYAxis = function(text, width, height) {
    text.each(function() {
        var text = select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.3, // ems
            y = text.attr("x"),
            dy = 0,
            tspan = text.text(null).append("tspan").attr("x", -10).attr("y", -height/2).attr("dy", dy + "em")
        while (word = words.pop()) {
          line.push(word)
          tspan.text(line.join(" "))
          let len1 = tspan.node().getComputedTextLength()
          if (tspan.node().getComputedTextLength() > width) {
            line.pop()
            tspan.text(line.join(" "))
            line = [word]
            tspan = text.append("tspan").attr("x", -10).attr("y", -height/2).attr("dy", `${++lineNumber * lineHeight + dy}em`).text(word)
            let len2 = tspan.node().getComputedTextLength()
            //tspan.attr("dx", -len1+len2+10)
          }
        }
      })
}

axisFormat.wrapLongTextXAxis = function(text, width) {
    text.each(function() {
        var text = select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em")
        while (word = words.pop()) {
          line.push(word)
          tspan.text(line.join(" "))
          if (tspan.node().getComputedTextLength() > width) {
            line.pop()
            tspan.text(line.join(" "))
            line = [word]
            tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", `${++lineNumber * lineHeight + dy}em`).text(word)
          }
        }
      })
}

axisFormat.parsexAxisConfig = function(config){
    let dxAxis = cloneDeep(defaults.xAxis);
    config.xAxis = dataFormat.mergeDeep(dxAxis,config.xAxis);

    config.xAxis.range = [config.display.margin.left,config.display.size.width-config.display.margin.right];
    config.xAxis.dimension = config.xAxis.dimension || config.dimensions[0];
    
};
axisFormat.parsexAxisGridConfig = function(config){
    let dxAxisGrid = cloneDeep(defaults.xAxisGrid);
    config.xAxisGrid = dataFormat.mergeDeep(dxAxisGrid,config.xAxisGrid);
    config.xAxisGrid.range = [config.display.margin.left,config.width1-config.display.margin.right];
    config.xAxisGrid.dimension = config.xAxisGrid.dimension || config.dimensions[0];
}

axisFormat.parseyAxisConfig = function(config){
    let dyAxis = cloneDeep(defaults.yAxis);
    config.yAxis = dataFormat.mergeDeep(dyAxis,config.yAxis);
    config.yAxis.range = [config.display.size.height-config.display.margin.bottom,config.display.margin.top];
    config.yAxis.dimension = config.yAxis.dimension || config.dimensions[1];
    config.yAxis.measure = config.yAxis.measure || config.measures[0];
    
};
axisFormat.parseyAxis2Config = function(config){
    let dyAxis2 = cloneDeep(defaults.yAxis2);
    config.yAxis2 = dataFormat.mergeDeep(dyAxis2,config.yAxis2);
    config.yAxis2.range = [config.display.size.height-config.display.margin.bottom,config.display.margin.top];
    config.yAxis2.dimension = config.yAxis2.dimension || config.dimensions[1];
    config.yAxis2.measure = config.yAxis2.measure || config.measures[1];
    
};


axisFormat.parseColorConfig = function(config){
    config.color = {...defaults.color,...config.color};
    if(config.color.colorByRange){
        function getColour(value,eventsData,eventIndex,color) {
            for (let i = 0; i < config.color.domain.length; i++) {
                if (value < config.color.domain[i]) {
                    if (i == 0) {
                        eventsData[eventIndex].color = config.color.range[0];
                    } else {
                        eventsData[eventIndex].color = config.color.range[i-1];
                    }
                    break;
                } else if (value == config.color.domain[i]) {
                    eventsData[eventIndex].color = config.color.range[i];
                } else {
                    if (i == (config.color.domain.length - 1)) {
                        eventsData[eventIndex].color = config.color.range[config.color.domain.length - 1];
                        break;
                    }
                    continue;
                }
            }
    }
    config.data.map((element,i )=> {
        getColour(element.value,config.data,i,config.color); 
     });
}
else{
    config.color.dimension = config.color.dimension;
}
};

axisFormat.addTitle = function(config,axis){
    let axisConfig = config[axis];
    axisConfig.el.selectAll(".axis-title").data([1]).enter().append("text").text(axisConfig.title.title).attr("class","axis-title");
    let title = axisConfig.el.select(".axis-title");
    if(axisConfig.orient == "vertical" && axisConfig.position == "left") {
        title.attr("x",0)
                .attr("y",config.display.margin.top - 15)
    }
    if(axisConfig.orient == "vertical" && axisConfig.position == "right") {
        title.attr("x",0)
                .attr("y",config.display.margin.top - 15)
    }
    title.attr("data-attrs", function(d){ return elementFormat.applyAttrs(select(this),axisConfig.title.attrs);})

}

axisFormat.formatAxis = function(config,axis){
    if (config[axis].show){
        if(!config[axis].line.show) axisFormat.removeLine(config[axis].el);
        if(!config[axis].ticks.line.show) axisFormat.removeTicks(config[axis].el);
        if(config[axis].ticks.text.wrap) axisFormat.wrapTicks(config[axis].el,config)
        if(!config[axis].ticks.text.show) axisFormat.removeText(config[axis].el);
        if(config[axis].ticks.text.show) config[axis].el.selectAll(".tick text").attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),config[axis].ticks.text);});
        if(config[axis].ticks.line.show) config[axis].el.selectAll(".tick line").attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),config[axis].ticks.line);});
        if(config[axis].title.show) axisFormat.addTitle(config,axis);
        if(config[axis].line.show) config[axis].el.selectAll(".domain").attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),config[axis].line);});
    }
};

axisFormat.formatAxes = function(config){
    if (config.xAxis.show)  axisFormat.formatAxis(config,"xAxis");
    if (config.yAxis.show) { 
        axisFormat.formatAxis(config,"yAxis");
        if(config.yAxis.type == "categorical"){
            config.yAxis.el.selectAll(".tick text").text((d,di) => config.markers[di] && config.markers[di].title ? config.markers[di].title : d )
        }
    }
    if (config.yAxis2.show) axisFormat.formatAxis(config,"yAxis2");
};



axisFormat.getAxisType = function(){
    if(this.orient == "horizontal" && this.position == "bottom"){
        this.axisType = axisBottom();
    }
    else if(this.orient == "horizontal" && this.position == "top"){
        this.axisType =  axisTop();
    }
    else if(this.orient == "vertical" && this.position == "left"){
        this.axisType =  axisLeft();
    }
    else if(this.orient == "vertical" && this.position == "right"){
        this.axisType =  axisRight();
    }
    else {
        this.axisType =  axisLeft();
    }

};

axisFormat.getScale = function(){
    switch(this.type){
        case "continous":
            this.scale =  scaleLinear().domain(this.domain).range(this.range).nice();
            break;
        case "categorical":
            this.scale =  scaleBand().padding(this.padding).domain(this.domain).range(this.range);
            break;
        case "time":
            this.scale =  scaleUtc().domain(this.domain).range(this.range);
            break;
    }
    
};

axisFormat.getTicks = function(config){
    config.xAxis.ticks.text.timeIntervalType =  config.xAxis.ticks.text.timeInterval.split("-")[1] || "hour";
    config.xAxis.ticks.text.timeIntervalValue =  config.xAxis.ticks.text.timeInterval.split("-")[0];
    let ticks;
    
    switch(config.xAxis.ticks.text.timeIntervalType){

        case "day":
            ticks = timeDays(config.xAxis.domain[0],config.xAxis.domain[1] ,config.xAxis.ticks.text.timeIntervalValue);
            return ticks;
            break;
        case "minute":
            ticks = timeMinutes(config.xAxis.domain[0],config.xAxis.domain[1] ,config.xAxis.ticks.text.timeIntervalValue);  
            return ticks;
            break;
        case "hour":
            ticks = timeHours(config.xAxis.domain[0],config.xAxis.domain[1] ,config.xAxis.ticks.text.timeIntervalValue);  
            return ticks;
            break;
        case "month":
            ticks = timeMonths(config.xAxis.domain[0],config.xAxis.domain[1] ,config.xAxis.ticks.text.timeIntervalValue);  
            return ticks;
            break;
        default:
            ticks = null; 
            return ticks;
            break;


    }
}
axisFormat.setTickIntervals = function(config){
    if(config.xAxis.ticks.text.timeInterval == "default") return null

    config.xAxis.ticks.text.timeIntervalType =  config.xAxis.ticks.text.timeInterval.split("-")[1] || "hour";
    config.xAxis.ticks.text.timeIntervalValue =  config.xAxis.ticks.text.timeInterval.split("-")[0];
    
    switch(config.xAxis.ticks.text.timeIntervalType){

        case "day":
            config.xAxis.ticks.text.tickValues = timeDays(config.xAxis.domain[0],config.xAxis.domain[1] ,config.xAxis.ticks.text.timeIntervalValue);
            break;
        case "minute":
            config.xAxis.ticks.text.tickValues = timeMinutes(config.xAxis.domain[0],config.xAxis.domain[1] ,config.xAxis.ticks.text.timeIntervalValue);  
            break;
        case "second":
            config.xAxis.ticks.text.tickValues = timeSeconds(config.xAxis.domain[0],config.xAxis.domain[1] ,config.xAxis.ticks.text.timeIntervalValue);  
            break;
        case "hour":
            config.xAxis.ticks.text.tickValues = timeHours(config.xAxis.domain[0],config.xAxis.domain[1] ,config.xAxis.ticks.text.timeIntervalValue);  
            break;
        case "month":
                config.xAxis.ticks.text.tickValues = timeMonths(config.xAxis.domain[0],config.xAxis.domain[1] ,config.xAxis.ticks.text.timeIntervalValue);  
                break;
        default:
            config.xAxis.ticks.text.tickValues = null; 
            break;


    }

}

axisFormat.setLocale = function(config){
    if(config.xAxis.locale === 'en-US'){
        config.xAxis.localeFormat = timeFormat(config.xAxis.ticks.text.timeFormat)
    }else{
        // config.xAxis.localeFormat = timeFormatLocale(require(`../node_modules/d3-time-format/locale/${config.xAxis.locale}.json`))
        config.xAxis.localeFormat = timeFormatLocale(require(`d3-time-format/locale/${config.xAxis.locale}.json`))
    }
}

axisFormat.setCustomTickValues = function(config){
    config.xAxis.ticks.text.tickValues = config.data.map((d) => d[config.xAxis.dimension])
}


axisFormat.getAxis = function(){
    this.axis = this.axisType.scale(this.scale);
};

axisFormat.getAxisTest = function(){
    this.axisTest =  this.axisType.scale(this.scale);
};

axisFormat.configureAxis = function(){
    axisFormat.getScale.call(this);
    axisFormat.getAxisType.call(this);
    axisFormat.getAxis.call(this);
    
};
export {axisFormat};