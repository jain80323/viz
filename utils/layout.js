import {defaults} from "../config/default";
import {select} from "d3";
import {chart} from "../config/chart";
import {svg} from "../config/svg";
import {display} from "../config/display";
import { dataFormat } from "./data-formatter";
import _ from "lodash";

let layout  = {};

layout.setLayout = function(config){
    // config.title.el = config.cont.el.append("div")
    //                     .attr("class","bv-title").attr("id",config.title.id)
    //                     .style("width",`${config.cont.size.width}px`).style("height","75px");
    
    if (config.title.show) {
        config.cont.el.selectAll(".bv-title")
                        .data([1]).enter().append("div")
                        .attr("class","bv-title").attr("id",config.title.id  )
                        .style("width",`100%`).style("height",`${config.title.height}px`);
    }
    if(config.legend.lposition == 'top' ||config.legend.lposition == 'Top'){
        if (config.legend.show){
            config.cont.el.selectAll(".bv-legend")
            .data([1]).enter().append("div")
            .attr("class","bv-legend").attr("id",config.legend.id)
            .style("width",`100%`).style("height",`${config.legend.height}px`);
        
            config.cont.el.selectAll(".bv-chart")
            .data([1]).enter().append("div")
            .attr("class","bv-chart").attr("id",config.chart.id)
            .style("width",config.cont.size.width).style("height",`${config.chart.size.height}px`);

        }
    }else{
        config.cont.el.selectAll(".bv-chart")
        .data([1]).enter().append("div")
        .attr("class","bv-chart").attr("id",config.chart.id)
        .style("width",config.cont.size.width).style("height",`${config.chart.size.height}px`);

        if (config.legend.show){
        config.cont.el.selectAll(".bv-legend")
        .data([1]).enter().append("div")
        .attr("class","bv-legend").attr("id",config.legend.id)
        .style("width",`100%`).style("height",`${config.legend.height}px`);

        }
    }

    config.cont.el.selectAll(".bv-tooltip")
                        .data([1]).enter().append("div")
                        .attr("class","bv-tooltip").attr("id",config.tooltip.id)
                        .style("display","none");
    
    config.cont.el.selectAll(".bv-tooltipHL")
        .data([1]).enter().append("div")
        .attr("class","bv-tooltipHL").attr("id",config.events.tooltip.id)
        .style("display","none");
    
    config.cont.el.selectAll(".bv-tooltipHLMarker")
        .data([1]).enter().append("div")
        .attr("class","bv-tooltipHLMarker").attr("id",config.markerTooltip.tooltip.id)
        .style("display","none");

    config.chart.el = select(`#${config.chart.id}`);
    // console.log(config.tooltip.id)
    config.title.el =  select(`#${config.title.id}`);
    config.legend.el =select(`#${config.legend.id}`);
    config.tooltip.el =select(`#${config.tooltip.id}`);
    config.events.tooltip.el =select(`#${config.events.tooltip.id}`);
    config.markerTooltip.tooltip.el =select(`#${config.markerTooltip.tooltip.id}`);

    config.chart.el.selectAll(".bv-chart-svg")
                        .data([1]).enter().append("svg")
                        .attr("class","bv-chart-svg").attr("id",config.svg.id);
    config.svg.el =select(`#${config.svg.id}`);

}
layout.parseContConfig = function(config){
    config.cont = {...defaults.cont,...config.cont};
    config.cont.el = select(`#${config.cont.id}`).style("position","relative");
    config.cont.el.selectAll("*").remove();
    config.cont.size = {width: config.cont.el.node().offsetWidth,
        // height:  config.cont.el.node().offsetHeight
        height:config.chart.size.height ? config.cont.el.node().offsetHeight : layout.calculateHeight(config),
    };
}
layout.parseTitleConfig = function(config) {
    config.title = dataFormat.mergeDeep(defaults.title,config.title);
    config.title.id = config.title.id || `${config.cont.id}-title`;
};
layout.parseLegendConfig = function(config){
    config.legend = {...defaults.legend,...config.legend};
    config.legend.id = config.legend.id || `${config.cont.id}-legend`;
};
layout.parseTooltipConfig = function(config){
    config.tooltip = {...defaults.tooltip,...config.tooltip};
    config.tooltip.id = config.tooltip.id || `${config.cont.id}-tooltip`;
    config.events.tooltip.id = config.events.tooltip.id || `${config.cont.id}-tooltip-hl`;
    config.markerTooltip.tooltip.id = config.markerTooltip.tooltip.id || `${config.cont.id}-tooltip-hlmarker`;
};
layout.parseChartConfig = function(config){
    // console.log(config,'config fom parse');
    config.chart = {...chart,...config.chart};
    config.chart.id = config.chart.id || `${config.cont.id}-chart`;
    config.chart.size = {width: config.chart.size.width || config.cont.size.width || config.cont.el.node().offsetWidth,
        height: config.chart.size.height  || ((config.cont.size.height || config.cont.el.node().offsetHeight) -config.legend.height)
    };
};
layout.parseLinesConfig = function(config){
    config.line = config.lines && config.lines.length > 0 ? null : config.line
    config.lines = config.line? [config.line] : config.lines
};

layout.formatProportionValues =function(value,size){
    if(typeof value == "number"  && value > 1 ) return value;
    if(typeof value == "number"  && value <= 1 ) return value*size;
    if(typeof value == "string"  &&  value.includes("%") ) return +value.replace("%","")*size/100; 
};

layout.formatMarginValues = function(margin,size){
    for (var key in margin) {
        margin[key] = this.formatProportionValues(margin[key],key == 'left' || key == 'right' ? size.width: size.height);
    }

};

layout.formatDisplayMargin = function(config){
    config.display.margin_orig = {...{},...config.display.margin};
    layout.formatMarginValues(config.display.margin,config.display.size);
};


layout.parseSVGConfig = function(config){
    config.svg = {...svg,...config.svg};
    config.svg.id = config.svg.id || `${config.cont.id}-svg`;
    config.svg.size = {width: config.chart.size.width || config.chart.el.node().offsetWidth,

        height: config.chart.size.height || config.chart.el.node().offsetHeight

    }; 
    config.display = {...display,...config.display};
    
    config.display.size = {width: config.svg.size.width ,
        height: config.svg.size.height};    
    
};

layout.getWidth =function(){
    return window.innerWidth|| document.documentElement.clientWidth|| document.body.clientWidth;
}
layout.getHeight = function(){
    return window.innerHeight|| document.documentElement.clientHeight|| document.body.clientHeight;
}


layout.calculateHeight = function(config){
    if(config.mode && config.mode == "PRN"){
        config.totalNullFreeChartData =config.chartData.filter(item => ![null,0].includes(item[config.measures[0]]))
        return config.chart.size.height = config.totalNullFreeChartData.length === 0 ? 140 : config.showMax*config.yAxis.step + config.yAxis.step
    } else{
        return config.chart.size.height = config.filteredMeasures.length ===0 ? 140 : config.filteredMeasures.length*config.yAxis.step + config.yAxis.step;
    }
   
}

layout.parseLayout = function(config){
    this.parseContConfig(config);
    this.parseTitleConfig(config);
    this.parseLegendConfig(config);
    this.parseTooltipConfig(config);
    this.parseChartConfig(config);
    this.parseSVGConfig(config);
    this.parseLinesConfig(config);
    this.setLayout(config);
};

export { layout };