import {select,easeBounce, timeFormat, timeMinutes, timeMinute, mouse, bisector, format} from  "d3";
import {defaults} from "../config/default";
import {axisFormat} from "../utils/axis-formatter";
import {elementFormat} from "../utils/element-formatter";
import { ColorScale } from "../components/colorscale";
import {circleConfig} from "../config/circle";
import { dataFormat } from "../utils/data-formatter";
import { ContinousAxis } from "../components/continousaxis";
import { TimeAxis } from "../components/timeaxis";
import { generator } from "../utils/generators";
import {textFormat} from "../utils/text-formatter.js";
import {CategoryAxis } from "../components/categoryaxis";
import { rectConfig } from "../config/rect";

class BARChart{
    constructor(config){
        this.config = config;
        this.initialize();
        this.update();
    }

    updateDomains(data){
        let config = this.config;

        // get domain based on chart direction and scale type for each axis
        if(config.chart.direction === 'horizontal'){
            config.yAxis.domain = dataFormat.fetchDistinctValues(config.dimensions[0],config.data); //categorical yAxis
            config.xAxis.domain = config.xAxis.domain || dataFormat.fetchRange(config.xAxis.measure,data); //continuous xAxis
            config.yAxis2.domain = config.yAxis2.domain || dataFormat.fetchRange(config.xAxis.measure,data); //continuous yAxis2
        } else {
            dataFormat.adjustTZColumn(config.xAxis.dimension,config.tzOffset,config.data); //only adjust timestamps when dimension is time
            config.xAxis.domain = dataFormat.fetchDistinctValues(config.dimensions[0],config.data); //categorical xAxis
            config.yAxis.domain = config.yAxis.domain || dataFormat.fetchRange(config.yAxis.measure,data); //continuous yAxis
            config.yAxis2.domain = config.yAxis2.domain || dataFormat.fetchRange(config.yAxis.measure,data); //continuous yAxis2
        }

        config.color.domain = config.color.domain  || config.measures; //color coded based on given domain or measures
    }

    getAxis(type){
        let props;
        let config = this.config;
        //flip the x and y axis so that rectanges can be rendered correctly based on chart direction
        if(config.chart.direction === 'horizontal'){
            // yAxis: dimension. xAxis: measure
            switch (type){
                case "xAxis":
                    config.xAxis.measure = config.xAxis.measure || config.measures[0]; //assign measure to xAxis
                    if( config.score && config.score.show) config.xAxis.range[1] = config.xAxis.range[1]+config.score.width + 10
                    props = config.xAxis;
                    return new ContinousAxis(props);

                case "yAxis":
                    config.yAxis.dimension = config.yAxis.dimension || config.dimensions[0];//assign dimension to yAxis
                    props = config.yAxis;
                    return new CategoryAxis(props);
                
                case 'yAxis2':
                    config.yAxis2.measure = config.yAxis2.measure || config.measures[1];//assign measure to yAxis2
                    props = config.yAxis2;
                    return new ContinousAxis(props);

                case "color":
                    props = config.color;
                    return new ColorScale(props);
            } 
        } else {
            //xAxis: dimension. yAxis: measure
            switch (type){
                case "xAxis":
                    config.xAxis.dimension = config.xAxis.dimension || config.dimensions[0];//assign dimension to xAxis
                    props = config.xAxis;
                    return new CategoryAxis(props);
    
                case "yAxis":
                    config.yAxis.measure = config.yAxis.measure || config.measures[0];//assign measure to yAxis
                    if( config.score && config.score.show) config.yAxis.range[1] = config.yAxis.range[1]+config.score.height + 10
                    props = config.yAxis;
                    return new ContinousAxis(props);
                
                case 'yAxis2':
                    config.yAxis2.measure = config.yAxis2.measure || config.measures[1];//assign measure to yAxis2
                    props = config.yAxis2;
                    return new ContinousAxis(props);
    
                case "color":
                    props = config.color;
                    return new ColorScale(props);
            }         
        }
    }

    mouseOver(el,that,d) {
        let tooltip = that.tooltip;
        let config = that.config;
        let xPos,yPos;
        let elW = tooltip.node().offsetWidth;
        let elH = tooltip.node().offsetHeight;

        if(d != undefined && d[that.config.yAxis.measure] != null){
            // get coordinates of tooltip based on barchart type 
            if(config.chart.direction === 'horizontal'){ 
                let cy = that.yAxis.scale(d[that.config.yAxis.dimension]); //y-position of tooltip depends on dimension
                // adjust y-position of tooltip so that it is contained within chart
                if(cy <= config.display.margin.top + elH/2){
                        yPos = (config.display.margin.top+10)+"px";
                }
                else if(cy >=  config.display.size.height-config.display.margin.bottom-config.display.margin.top  - elH){
                        yPos = ((config.display.size.height - config.display.margin.bottom)-(elH) -10 )+"px";
                }
                else{
                        yPos = (cy-elH/2)+"px";
                }
                xPos = (that.xAxis.scale.range()[1]-config.display.margin.right-elW)+"px"; //tooltip placed on right end of chart
            } else {
                let cx = that.xAxis.scale(d[that.config.xAxis.dimension]); //x-position of tooltip depends on dimension
                // adjust x-position of tooltip so that it is contained within chart
                if(cx <= config.display.margin.left + elW/2){
                        xPos = (config.display.margin.left+10)+"px";
                }
                else if(cx >=  config.display.size.width-config.display.margin.right-config.display.margin.left  - elW){
                        xPos = ((config.display.size.width - config.display.margin.right)-(elW) -10 )+"px";
                }
                else{
                        xPos = (cx-elW/2)+"px";
                } 
                yPos = (that.yAxis.scale.range()[1] +5)+"px"  //tooltip placed on top of chart
            }

            let html = ""; 
            {html += `<span> ${that.config.yAxis.measure}: ${(d[that.config.yAxis.measure])}</span> </br>`;};
            {html +=   `<span> ${that.config.xAxis.dimension}: ${(d[that.config.xAxis.dimension])} </span>`;};
            tooltip.style("display","block")
                            .style("position","absolute")
                            .style("top",yPos)
                            .style("left",xPos)
                            .attr("data-styles",function(d){return elementFormat.applyStyles(select(this),config.tooltip.styles);})
                            .html(html)
                            ;
        }
    }

    mouseOut(el,that){
        that.tooltip.style("display","none");
    }
    
    update(){
        let config = this.config;
        let that = this;
        config.chartData =  config.data;
        config.filteredMeasures = config.measures.filter((m) => {
            return config.chartData.map(d => d[m]).some(v => v)
        })
      
        this.updateDomains(config.chartData);

        this.xAxis = this.getAxis("xAxis");        
        this.yAxis = this.getAxis("yAxis"); 
        this.colorScale = this.getAxis("color"); 

        this.config.color.scale = this.colorScale.scale;
        if (config.yAxis2.show) this.yAxis2 = this.getAxis("yAxis2"); 

        config.markers = [...defaults.multiline.markers,...config.markers];

        // adjust tick formatting based on chart direction and scale type for each axis
        // format ticks for each axis only if dimension assigned to axis is timestamp 
        if(config.xAxis.dimension === 'category'){
            if (config.xAxis.show) this.svg.select("#x-axis").call(this.xAxis.axis);
        }
        else if(config.chart.direction === 'horizontal'){     
            if (config.xAxis.show) this.svg.select("#x-axis").call(this.xAxis.axis.ticks(config.xAxis.domain[1] - config.xAxis.domain[0]).tickFormat((d,i) => config.xAxis.ticks.text.tickValues[i]));
        }
        else{     
            if (config.xAxis.show) this.svg.select("#x-axis").call(this.xAxis.axis.tickFormat(timeFormat(config.xAxis.ticks.text.timeFormat)).tickValues(config.xAxis.ticks.text.tickValues));
        }

        if (config.yAxis.show) this.svg.select("#y-axis")
        .call(this.yAxis.axis.ticks(config.yAxis.ticks.number))
        if (config.yAxis2.show) this.svg.select("#y-axis2").call(this.yAxis2.axis.ticks(config.yAxis2.ticks.number));

        this.svg.select("#y-axis").selectAll(".tick line")
        .attr("x1",0)
        .attr("x2",config.display.size.width-config.display.margin.left-config.display.margin.right );

        this.svg.select("#x-axis").selectAll(".tick line")
        .attr("x1",config.chart.direction === 'horizontal' ? this.yAxis.scale.bandwidth()/2 : this.xAxis.scale.bandwidth()/2) //for horizontal barcharts, yAxis becomes categorical, bandwidth only applies for yAxis
        .attr("x2",config.chart.direction === 'horizontal' ? this.yAxis.scale.bandwidth()/2 : this.xAxis.scale.bandwidth()/2)
        .attr("y1",0) 
        .attr("y2",-(config.display.size.height-config.display.margin.top-config.display.margin.bottom -config.display.margin.right - 10));

        axisFormat.formatAxes(config);

        //yAxis tick wrap only occurs for horizontal barchart. wrap threshold based on chart's left margin, unless wrapThreshold is given
        if(config.chart.direction === 'horizontal'){
            this.svg.select("#y-axis")
            .selectAll(".tick text")
            .call(axisFormat.wrapLongTextYAxis, config.yAxis.ticks.text.wrapThreshold || config.display.margin.left-20, this.yAxis.scale.bandwidth()/2);
        }
        //xAxis tick wrap only occurs if wrapThreshold is given. wrapThreshold is undefined by default.
        if (config.xAxis.show && config.xAxis.ticks.text.wrapThreshold) this.svg.select("#x-axis").selectAll(".tick text").call(axisFormat.wrapLongTextXAxis, config.xAxis.ticks.text.wrapThreshold);

        if(config.chartData.length == 0 || config.filteredMeasures.length === 0 ){

            config.nodata = {...defaults.nodata,...config.nodata}
            config.nodata.text = {...defaults.nodata,...config.nodata.text}
           let text = this.svg.selectAll("#no-data").data([1]).enter().append("text")
                         .attr("id","no-data")
                        .attr("x",config.display.size.width/2)
                        .attr("y",config.display.size.height/2-6)
                        .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.nodata.text);})
            text.append('tspan')
                        .style("font-size", "14px")
                        .style("fill", "#707070")
                        .text(config.nodata.message)
            return;
        }

        this.svg.select(`#markers-hl-group-${config.cont.id}`)
                        .selectAll(".marker-hl-item")
                        .data(config.measures)
                        .enter().append("rect")
                        .attr("class","marker-hl-item")
                        .attr("r",0);
        
        let markersGroup = this.svg.select("#markers-group");
        markersGroup.selectAll("g").data(config.measures).enter().append("g").attr("id",(d) =>{return `markers-group-${textFormat.formatSelector(d)}`});
        markersGroup.selectAll("g").data(config.measures).exit().remove();
        
        config.measures.map((m,mi) => {
            config.markers[mi] = {...defaults.markers[mi],...circleConfig,...config.markers[mi]};
          
            if (config.markers[mi].show) {
                
                markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item").data(config.chartData).enter().append("rect").attr("class","marker-item");

                markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item").data(config.chartData).exit().remove();
                
                if(config.chart.direction === 'horizontal'){
                    //x-axis: value y-axis: timestamp
                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item")
                        .attr("x",0) //bar is flushed to start of axis
                        .attr("y",(d) => this.yAxis.scale(d[config.yAxis.dimension])) //y-pos spacing of each bar depends on categorical yAxis
                        .attr("width",(d) => this.xAxis.scale(d[m])) //length of bar depends on measure value
                        .attr("height",this.yAxis.scale.bandwidth()) //width of each bar
                        .attr("data-attrs",config.areas[mi].show?function(d){return elementFormat.applyAttrs(select(this),{...config.area,...config.areas[mi].attrs  });}:function(d) { return (config.color.dimension ? config.color.scale(d[config.color.dimension]) : config.color.scale(m)); })
                        .attr("fill", function(d) { return (config.color.dimension ? config.color.scale(d[config.color.dimension]) : config.color.scale(m)); }) //color coded based on color dimension, or measure if there is no dimension
                } else {
                    // by default vertical barcharts are rendered, if chart.direction is not specified. x-axis: timestamp y-axis: value
                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item")
                            .attr("x",(d) => this.xAxis.scale(d[config.xAxis.dimension])) //x-pos spacing of each bar depends on categorical yAxis
                            .attr("y",(d) => this.yAxis.scale(d[m])) //height of each bar
                            .attr("width",this.xAxis.scale.bandwidth()) //width of each bar
                            .attr("height",(d) => this.yAxis.scale(config.yAxis.domain[0]) - this.yAxis.scale(d[m])) //height of each bar
                            .attr("data-attrs",config.areas[mi].show?function(d){return elementFormat.applyAttrs(select(this),{...config.area,...config.areas[mi].attrs  });}:function(d) { return (config.color.dimension ? config.color.scale(d[config.color.dimension]) : config.color.scale(m)); })
                            .attr("fill", function(d) { return (config.color.dimension ? config.color.scale(d[config.color.dimension]) : config.color.scale(m)); })  
                }

                if(config.tooltip.show){
                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item")
                        .on("mouseover",function(d) {that.mouseOver(this,that,d);})
                        .on("mousemove",function(d) {that.mouseOver(this,that,d);})
                        .on("mouseout",function(d) {that.mouseOut(this,that,d);});
                }
            }
        });
        // scores are optional, its position and direction depends on chart direction
        if(config.score && config.score.show){
            //x-axis: value y-axis: timestamp. scores are placed vertically on the right end of chart
            if(config.chart.direction === 'horizontal'){
                this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-bg").data( [config.score.title.value || "Distance covered"]).enter().append("rect").attr("class","score-bg");
                //single rect for background
                this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-bg")
                                        .attr("x",config.display.size.width-config.display.margin.right) // flushed to right end of chart
                                        .attr("y",0) //starts from top of chart
                                        .attr("width",config.score.width) //width of background
                                        .attr("height",config.display.size.height) //height of chart
                                        .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.score.bg);})
                //render circles                
                if(config.score && config.score.circle){

                    this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-citem").data(config.chartData).enter().append("circle").attr("class","score-citem");
                    this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-citem").data(config.chartData).exit().remove();
                    
                    this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-citem")
                        .attr("cy",(d) => this.yAxis.scale(d[config.yAxis.dimension]) + this.yAxis.scale.bandwidth() / 2 ) //similar to each bar, y-pos depends on categorical yAxis
                        .attr("cx",config.display.size.width-config.display.margin.right+config.score.width/2) //in the middle of scores rect background
                        .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this), {...circleConfig,...config.score.circle});})
                }
                //render rectangles          
                if(config.score && config.score.rect){
                    this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-citem").data(config.chartData).enter().append("rect").attr("class","score-citem");
                    this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-citem").data(config.chartData).exit().remove();
                    
                    this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-citem")
                            .attr("y",(d) => this.yAxis.scale(d[config.yAxis.dimension]) - (config.score.rect.height/2)+ this.yAxis.scale.bandwidth() / 2)
                            .attr("x",config.display.size.width- config.display.margin.right+config.score.width/2 - config.score.rect.xPos)         
                            .attr("rx",config.score.rect ?config.score.rect.rx :10)
                            .attr("ry",config.score.rect ?config.score.rect.ry :10)
                            .attr("width",config.score.rect ? config.score.rect.width : 30)
                            .attr("height",config.score.rect ? config.score.rect.height : 15)
                            .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this), {...rectConfig,...config.score.rect});})
                }
                // render values within circles/rectangles
                this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-titem").data(config.chartData).enter().append("text").attr("class","score-titem");
                this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-titem").data(config.chartData).exit().remove();
                
                this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-titem")
                            .attr("y",(d) => this.yAxis.scale(d[config.yAxis.dimension]) + this.yAxis.scale.bandwidth() / 2)
                            .attr("x",config.display.size.width-config.display.margin.right+config.score.width/2)
                            .text((d) => d[config.score.measure])
                            .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.score.text);})
                // render score title
                this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-title").data([config.score.title.value || "Distance covered"]).enter().append("text").attr("class","score-title");
                
                this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-title") 
                                        .attr("x",config.display.size.width-config.display.margin.right)
                                        .attr("y",config.display.margin.top)
                                        .text((d) => d)
                                        .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.score.title);})
            
            } else {
                //x-axis: timestamp y-axis: value. scores are placed horizontally above chart
                this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-bg").data( [config.score.title.value || "Distance covered"]).enter().append("rect").attr("class","score-bg");
                
                this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-bg")
                                        .attr("x",(d) =>0)
                                        .attr("y",(d) => config.display.margin.top)
                                        .attr("width",(d) =>config.display.size.width)
                                        .attr("height",(d) => config.score.height)
                                        .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.score.bg);})
                //render circles   
                if(config.score && config.score.circle){

                    this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-citem").data(config.chartData).enter().append("circle").attr("class","score-citem");
                    this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-citem").data(config.chartData).exit().remove();
                    
                    this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-citem")
                        .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]) + this.xAxis.scale.bandwidth() / 2)
                        .attr("cy",(d) => config.display.margin.top+config.score.height/2)
                        .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this), {...circleConfig,...config.score.circle});})
                }
                //render rectangles       
                if(config.score && config.score.rect){
                    this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-citem").data(config.chartData).enter().append("rect").attr("class","score-citem");
                    this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-citem").data(config.chartData).exit().remove();
                    
                    this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-citem")
                            .attr("x",(d) => this.xAxis.scale(d[config.xAxis.dimension]) - (config.score.rect.width/2)+ this.xAxis.scale.bandwidth() / 2)
                            .attr("y",(d) => config.display.margin.top + config.score.height/2 - config.score.rect.yPos)         
                            .attr("rx",config.score.rect ?config.score.rect.rx :10)
                            .attr("ry",config.score.rect ?config.score.rect.ry :10)
                            .attr("width",config.score.rect ? config.score.rect.width : 30)
                            .attr("height",config.score.rect ? config.score.rect.height : 15)
                            .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this), {...rectConfig,...config.score.rect});})
                }
                // render values within circles/rectangles
                this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-titem").data(config.chartData).enter().append("text").attr("class","score-titem");
                this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-titem").data(config.chartData).exit().remove();
                
                this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-titem")
                            .attr("x",(d) => this.xAxis.scale(d[config.xAxis.dimension]) + this.xAxis.scale.bandwidth() / 2)
                            .attr("y",(d) => config.display.margin.top+config.score.height/2)
                            .text((d) => d[config.score.measure])
                            .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.score.text);})
                // render score title
                this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-title").data([config.score.title.value || "Distance covered"]).enter().append("text").attr("class","score-title");
                
                this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-title")
                                        .attr("x",(d) => config.display.margin.left)
                                        .attr("y",(d) => config.display.margin.top+config.score.height/2)
                                        .text((d) => d)
                                        .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.score.title);})                                
            }
        }

        this.svg.select(`#rect-overlay-${config.cont.id}`)
                    .attr("x",config.display.margin.left)
                    .attr("y",config.display.margin.top)
                    .attr("width",config.display.size.width-config.display.margin.right-config.display.margin.left)
                    .attr("height",config.display.size.height-config.display.margin.bottom-config.display.margin.top)
                    ;
                    
        this.svg.select(`#rect-clip-${config.cont.id}`)
                    .select("rect")
                    .attr("x",config.display.margin.left )
                    .attr("width",config.display.size.width - config.display.margin.left - config.display.margin.right)
                    .attr("y",config.display.margin.top - 10)
                    .attr("height",config.display.size.height + 20)
                    ;
    }

    initialize(){
        let config = this.config;
        this.chart = select(`#${config.chart.id}`);
        this.tooltip  = config.tooltip.el;
        this.svg = config.svg.el                   
        .attr("width", config.svg.size.width)
        .attr("height",config.svg.size.height);
        this.tooltipHLMarker  = config.markerTooltip.tooltip.el;

                            // .attr("preserveAspectRatio", "xMinYMin meet")
                            // .attr("viewBox", `0 0 ${config.svg.size.width} ${config.svg.size.height}`);

        this.svg.append("clipPath").attr("id",`rect-clip-${config.cont.id}`)
                            .append("rect")
        config.xAxis.el = this.svg.append("g")
                            .attr("class","x-axis axes")
                            .attr("id","x-axis")
                            .attr("transform",`translate(0,${config.display.size.height-config.display.margin.bottom})`); 
        
        this.svg.select(`#markers-hl-group-${config.cont.id}`).append("rect")
                    .attr("id",`hl-line-${config.cont.id}`)
                    .attr("class","hl-line");

        config.yAxis.el = this.svg.append("g")
                    .attr("class","y-axis axes")
                    .attr("id","y-axis")
                    .attr("transform",`translate(${config.display.margin.left},0)`);

        this.svg.append("g")
                    .attr("class","markers")
                    .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id",`markers-hl-group-${config.cont.id}`);
        
        this.svg.append("g")
                    .attr("class","scores")
                    .attr("id",`scores-group-${textFormat.formatSelector(config.cont.id)}`);
        
        // this.svg.append("g")
        //             .attr("class","scores")
        //             .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
        //             .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
        //             .attr("id",`scores-group-${textFormat.formatSelector(config.cont.id)}`);

        this.svg.append("g")
                    .attr("class","events")
                    .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id",`events-group-${config.cont.id}`);
        this.svg.append("g")
                            .attr("class","gradients")
                            .attr("clip-path",`#rect-clip-${config.cont.id}`)
                            .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                            .attr("id","gradients-group");

        this.svg.append("rect")
                    .attr("id",`rect-overlay-${config.cont.id}`)
                    .attr("class","rect-overlay")
                    .attr("fill","none")
                    .style("pointer-events","all");
        this.svg.append("g")
                    .attr("class","markers")
                    .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id","markers-group");
    }
}
export {BARChart};