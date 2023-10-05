import {select,easeBounce, timeFormat, timeMinutes, timeMinute, mouse, bisector, format, range, max,min} from  "d3";
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

class ECGEvents {
    constructor(config){
        this.config = config;
        this.initialize();
        this.update();
    }

    updateDomains(data){
        let config = this.config;
        // dataFormat.adjustTZColumn(config.xAxis.dimension,config.tzOffset,config.data);
        config.xAxis.domain[1] = min([config.xAxis.domain[1],config.xAxis.domain[0]+10000])
        // config.xAxis.domain = config.xAxis.domain? dataFormat.adjustTZList(config.tzOffset,config.xAxis.domain) : dataFormat.fetchRange(config.xAxis.dimension,config.data);
        config.yAxis.domain = config.yAxis.domain || dataFormat.fetchRange(config.yAxis.measure,data);
        config.color.domain = config.color.domain  || config.measures;
    }

    updateGenerators(){

        
            this.config.lineGenerators =  this.config.measures.map((m) => {
                return generator.lineGenerator(this.xAxis.scale,this.config.xAxis.dimension,this.yAxis.scale,m);
            });
        
    }
    getAxis(type){
        let props;
        let config = this.config;
        switch (type){
        
        case "xAxis":
            axisFormat.setTickIntervals(config);
            config.xAxis.dimension = config.xAxis.dimension || config.dimensions[0];
            axisFormat.setLocale(config);
            props = config.xAxis;
            return new TimeAxis(props);

        case "yAxis":
            config.yAxis.measure = config.yAxis.measure || config.measures[0];
            props = config.yAxis;
            return new ContinousAxis(props);
        

        case "color":
            props = config.color;
            return new ColorScale(props);


        
    }
    }

    mouseOver(el,that) {
                

    }

    mouseOut(el,that){
        
    }

    

    
    update(){
        let config = this.config;
        let that = this;
        config.chartData =  config.data;

        // if(config.chartData.length == 0){
        //     config.nodata = {...defaults.nodata,...config.nodata}
        //     config.nodata.text = {...defaults.nodata,...config.nodata.text}
        //     this.svg.selectAll("#no-data").data([1]).enter().append("text")
        //                  .attr("id","no-data")
        //                 .attr("x",config.display.size.width/2)
        //                 .attr("y",config.display.size.height/2-6)
        //                 .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.nodata.text);})
        //                 .text("No data available")
        // }
        this.updateDomains(config.chartData);

        
        this.xAxis = this.getAxis("xAxis");        
        this.yAxis = this.getAxis("yAxis"); 
        this.colorScale = this.getAxis("color"); 
        this.config.color.scale = this.colorScale.scale;
        config.markers = [...defaults.multiline.markers,...config.markers];
        if (config.xAxis.show) this.svg.select("#x-axis").call(this.xAxis.axis.tickFormat(config.xAxis.locale === 'en-US'? config.xAxis.localeFormat :config.xAxis.localeFormat.format(config.xAxis.ticks.text.timeFormat)).tickValues(config.xAxis.ticks.text.tickValues));
        if (config.yAxis.show) this.svg.select("#y-axis").call(this.yAxis.axis.ticks(config.yAxis.ticks.number));
        this.flatLine = generator.flatLine(this.xAxis.scale,config.xAxis.dimension,config.display.size.height);
        
        


        
        this.updateGenerators();

        if (config.line.show) {
            this.svg.select("#lines-group").selectAll("path").data(config.measures).enter().append("path");
            this.svg.select("#lines-group").selectAll("path").data(config.measures).exit().remove();
            this.svg.select("#lines-group").selectAll("path")
                        .attr("d",(d,di) => config.lineGenerators[di](config.chartData))
                        .attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),config.line);})
                        .attr("stroke",(d) => config.color.scale(d))
                        ;
        }
        this.svg.select("#grid-lines-group").selectAll(".x-line").data(range(config.xAxis.domain[0],config.xAxis.domain[1]+40,40)).enter().append("line").attr("class","x-line");
        this.svg.select("#grid-lines-group").selectAll(".x-line").data(range(config.xAxis.domain[0],config.xAxis.domain[1]+40,40)).exit().remove();
        this.svg.select("#grid-lines-group").selectAll(".x-line")
                    .attr("x1",(d) =>  this.xAxis.scale(d))
                    .attr("x2",(d) => this.xAxis.scale(d))
                    .attr("y1",(d) => config.display.margin.top)
                    .attr("y2",(d) => config.display.size.height-config.display.margin.bottom)
                    // .attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),config.line);})
                    .attr("stroke",(d) => config.grid.stroke)
                    .attr("stroke-width",(d,di) => di%5==0?1.25:0.5)
                    ;
        this.svg.select("#grid-lines-group").selectAll(".y-line").data(range(config.yAxis.domain[0],config.yAxis.domain[1]+0.1,0.1)).enter().append("line").attr("class","y-line");
        this.svg.select("#grid-lines-group").selectAll(".y-line").data(range(config.yAxis.domain[0],config.yAxis.domain[1]+0.1,0.1)).exit().remove();
        this.svg.select("#grid-lines-group").selectAll(".y-line")
                    .attr("x1",(d) =>  config.display.margin.left)
                    .attr("x2",(d) => config.display.size.width - config.display.margin.right)
                    .attr("y1",(d) =>  this.yAxis.scale(d))
                    .attr("y2",(d) =>  this.yAxis.scale(d))
                    // .attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),config.line);})
                    .attr("stroke",(d) => config.grid.stroke)
                    .attr("stroke-width",(d,di) => di%5==0?1.25:0.5)
                    ;

        this.svg.select(`#markers-hl-group-${config.cont.id}`)
                        .selectAll(".marker-hl-item")
                        .data(config.measures)
                        .enter().append("circle")
                        .attr("class","marker-hl-item")
                        .attr("r",0);
        let markersGroup = this.svg.select("#markers-group");
        markersGroup.selectAll("g").data(config.measures).enter().append("g").attr("id",(d) =>{return `markers-group-${textFormat.formatSelector(d)}`});
        markersGroup.selectAll("g").data(config.measures).exit().remove();
        
        
       
       
        this.svg.select(`#rect-overlay-${config.cont.id}`)
                    .attr("x",config.display.margin.left)
                    .attr("y",config.display.margin.top)
                    .attr("width",config.display.size.width-config.display.margin.right-config.display.margin.left)
                    .attr("height",config.display.size.height-config.display.margin.bottom-config.display.margin.top)
                    .on("mouseover",function() {that.mouseOver(this,that);})
                    .on("mousemove",function() {that.mouseOver(this,that);})
                    .on("mouseout",function() {that.mouseOut(this,that);});
        this.svg.select(`#rect-clip-${config.cont.id}`)
                    .select("rect")
                    .attr("x",config.display.margin.left )
                    .attr("width",config.display.size.width - config.display.margin.left - config.display.margin.right)
                    .attr("y",config.display.margin.top - 10)
                    .attr("height",config.display.size.height + 20);
        axisFormat.formatAxes(config);



    }

    initialize(){
        let config = this.config;
        this.chart = select(`#${config.chart.id}`);
        this.tooltip  = config.tooltip.el;
        this.svg = config.svg.el                   
        .attr("width", config.svg.size.width)
        .attr("height",config.svg.size.height);
                            // .attr("preserveAspectRatio", "xMinYMin meet")
                            // .attr("viewBox", `0 0 ${config.svg.size.width} ${config.svg.size.height}`);

        this.svg.append("clipPath").attr("id",`rect-clip-${config.cont.id}`)
                            .append("rect")
        config.xAxis.el = this.svg.append("g")
                            .attr("class","x-axis axes")
                            .attr("id","x-axis")
                            .attr("transform",`translate(0,${config.display.size.height-config.display.margin.bottom})`);
        if(config.yAxis2.show){
            config.yAxis2.el = this.svg.append("g")
                            .attr("class","y-axis axes")
                            .attr("id","y-axis2")
                            .attr("transform",`translate(${config.display.size.width-config.display.margin.right},0)`);
        }

        
        


        
        this.svg.append("g")
                            .attr("class","gradients")
                            .attr("clip-path",`#rect-clip-${config.cont.id}`)
                            .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                            .attr("id","gradients-group");
        
        
        
        this.svg.append("g")
                    .attr("class","segments")
                    .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id",`segments-group-${config.cont.id}`);
        
        this.svg.append("g")
                    .attr("class","references")
                    .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id",`references-group-${config.cont.id}`);
    
        
        
        

        this.svg.select(`#markers-hl-group-${config.cont.id}`).append("line")
                    .attr("id",`hl-line-${config.cont.id}`)
                    .attr("class","hl-line");
        config.yAxis.el = this.svg.append("g")
                    .attr("class","y-axis axes")
                    .attr("id","y-axis")
                    .attr("transform",`translate(${config.display.margin.left},0)`);
        this.svg.append("g")
                    .attr("class","grid-lines")
                    .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id","grid-lines-group");
        this.svg.append("g")
                    .attr("class","areas")
                    .attr("clip-path",`#rect-clip-${config.cont.id}`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id","areas-group");
        this.svg.append("g")
                    .attr("class","lines")
                    .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id","lines-group");

        this.svg.append("g")
                    .attr("class","markers")
                    .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id","markers-group");

        this.svg.append("g")
                    .attr("class","markers")
                    .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id",`markers-hl-group-${config.cont.id}`);
        this.svg.append("g")
                    .attr("class","events")
                    .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id",`events-group-${config.cont.id}`);

        this.svg.append("rect")
                    .attr("id",`rect-overlay-${config.cont.id}`)
                    .attr("class","rect-overlay")
                    .attr("fill","none")
                    .style("pointer-events","all");
        
        

    }

}

export {ECGEvents};