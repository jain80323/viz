import {select,easeBounce,drag, timeFormat, timeMinutes, timeMinute, mouse, bisector, event} from  "d3";
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

class TimeSlider {
    constructor(config){
        this.config = config;
        this.initialize();
        this.update();
    }

    updateDomains(){
        let config = this.config;
        if(config.xAxis.fixTimeZone) {
            config.xAxis.domain = dataFormat.adjustTZList(config.tzOffset,config.xAxis.domain);
            config.xAxis.selectedDomain = dataFormat.adjustTZList(config.tzOffset,config.xAxis.selectedDomain);
        }
        else{
            config.xAxis.domain = dataFormat.adjustTime(config.tzOffset,config.xAxis.domain);
            config.xAxis.selectedDomain = dataFormat.adjustTime(config.tzOffset,config.xAxis.selectedDomain);
        }
        
        
    }

    updateGenerators(){

        if(this.config.yAxis2.show){
        this.config.lineGenerators =  this.config.measures.map((m) => {
            return generator.lineGenerator(this.xAxis.scale,this.config.xAxis.dimension,m == this.config.yAxis2.measure? this.yAxis2.scale:this.yAxis.scale,m);
        });
        this.config.areaGenerators =  this.config.measures.map((m) => {
            return generator.areaGenerator(this.xAxis.scale,this.config.xAxis.dimension,m == this.config.yAxis2.measure? this.yAxis2.scale:this.yAxis.scale,m);
        });
        }
        else{
            this.config.lineGenerators =  this.config.measures.map((m) => {
                return generator.lineGenerator(this.xAxis.scale,this.config.xAxis.dimension,this.yAxis.scale,m);
            });
            this.config.areaGenerators =  this.config.measures.map((m) => {
                return generator.areaGenerator(this.xAxis.scale,this.config.xAxis.dimension,this.yAxis.scale,m);
            });
        }
        
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



        
    }
    }

    mouseOver(el,that) {
                 

    }

    mouseOut(el,that){
        
    }

    dragged(el,that,type){
        let xPos = event.x;
        let yPos = event.y;
        let config  = that.config;

        if(type == 'left' && xPos < that.xAxis.scale(config.xAxis.selectedDomain[1]) & xPos > config.display.margin.left -3 ){ 
            config.xAxis.selectedDomain[0] = that.xAxis.scale.invert(xPos);
            // prevent slider action if the distance between left and right end of slider is less than the minimum allowed time length. 
            // sliderLimit should be given in milliseconds, determined from config input
            // console.log(config.xAxis.selectedDomain, config.xAxis.selectedDomain[1] - config.xAxis.selectedDomain[0])
            if(config.xAxis.selectedDomain[1] - config.xAxis.selectedDomain[0] < config.sliderLimit) return 
            select(el).raise().attr("cx",xPos);
            that.svg.select(`#area-item-left`)
            .attr("width",  this.xAxis.scale(config.xAxis.selectedDomain[0]) -  this.xAxis.scale(config.xAxis.domain[0]))

            that.svg.select(`#control-item-left`)
            .attr("transform",`translate(${ this.xAxis.scale(config.xAxis.selectedDomain[0])-3},${config.display.margin.top})`)         
        }
        
        if(type == 'right' && xPos > that.xAxis.scale(config.xAxis.selectedDomain[0]) & xPos < config.xAxis.range[1]+3 ){
            config.xAxis.selectedDomain[1] = that.xAxis.scale.invert(xPos);
            // prevent slider action if the distance between left and right end of slider is less than the minimum allowed time length
            if(config.xAxis.selectedDomain[1] - config.xAxis.selectedDomain[0] < config.sliderLimit) return
            select(el).raise().attr("cx",xPos);
            that.svg.select(`#area-item-right`)
            .attr("x",this.xAxis.scale(config.xAxis.selectedDomain[1]))
            .attr("width", config.display.size.width - this.xAxis.scale(config.xAxis.selectedDomain[1]) -config.display.margin.right)
            that.svg.select(`#control-item-right`)
            .attr("transform",`translate(${ this.xAxis.scale(config.xAxis.selectedDomain[1])-3},${config.display.margin.top})`)
        }

        config.chartList.map((c) => {
            c.chart.config.xAxis.domain = config.xAxis.selectedDomain;
            c.chart.update();
        })


    }
    
    
    
    update(){
        let config = this.config;
        let that = this;
        this.updateDomains();
        this.xAxis = this.getAxis("xAxis");   
        if (config.xAxis.show) this.svg.select("#x-axis").call(this.xAxis.axis.tickFormat(config.xAxis.locale === 'en-US'? config.xAxis.localeFormat :config.xAxis.localeFormat.format(config.xAxis.ticks.text.timeFormat)).tickValues(config.xAxis.ticks.text.tickValues));
        
        this.svg.select(`#rect-bg-${config.cont.id}`)
                    .attr("x",config.display.margin.left)
                    .attr("y",config.display.margin.top )
                    .attr("width", config.display.size.width -config.display.margin.left -config.display.margin.right)
                    .attr("height", config.display.size.height)
                    .attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),config.background);})
                        
        this.svg.select(`#controls-group-${config.cont.id}`)
                    .selectAll("g").data(["left","right"])
                    .enter().append("g")
                    .attr("id" , (d) => `control-item-${d}`)
                    .attr("class","control-item")
                    .attr("transform",(d) => `translate(${ this.xAxis.scale(config.xAxis.selectedDomain[d=='left'?0:1])+(-3  )},${config.display.margin.top})`)
                    .html((d) => config.handle[d] || `<defs><style>.cls-1{fill:#fff;}.cls-2{fill:#0082af;}</style></defs><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><polygon class="cls-1" points="5.5 24 3.5 24 0.5 21 0.5 11 3.5 8 5.5 8 5.5 0 5.5 8 7.5 8 10.5 11 10.5 21 7.5 24 5.5 24 5.5 32 5.5 24"/><path class="cls-2" d="M6,32H5V24.5H3.29L0,21.21V10.79L3.29,7.5H5V0H6V7.5H7.71L11,10.79V21.21L7.71,24.5H6ZM5,23.5H7.29L10,20.79V11.21L7.29,8.5H3.71L1,11.21v9.58L3.71,23.5Z"/><path class="cls-1" d="M4.5,12v0Zm2,0v0Z"/><path class="cls-2" d="M7,20H6V12H7ZM5,20H4V12H5Z"/></g></g>`);
                    
                    ;
        this.svg.select(`#controls-group-${config.cont.id}`)
                    .selectAll("circle").data(["left","right"])
                    .enter().append("circle")
                    .attr("id" , (d) => `control-citem-${d}`)
                    .attr("class","control-citem")
                    

        this.svg.select(`#areas-group-${config.cont.id}`)
                    .selectAll("rect").data(["left","right"])
                    .enter().append("rect")
                    .attr("id" , (d) => `area-item-${d}`)
                    .attr("class","area-item");
        this.svg.select(`#area-item-left`)
                        .attr("x",this.xAxis.scale(config.xAxis.domain[0]))
                        .attr("y",config.display.margin.top )
                        .attr("width",  this.xAxis.scale(config.xAxis.selectedDomain[0]) -  this.xAxis.scale(config.xAxis.domain[0]))
                        .attr("height", config.display.size.height)
                        .attr("fill", config.area.fill ||"#e0e3ed");

        this.svg.select(`#area-item-right`)
                        .attr("x",this.xAxis.scale(config.xAxis.selectedDomain[1]))
                        .attr("y",config.display.margin.top )
                        .attr("width", config.display.size.width - this.xAxis.scale(config.xAxis.selectedDomain[1]) - config.display.margin.right )
                        .attr("height", config.display.size.height)
                        .attr("fill",config.area.fill ||"#e0e3ed")

        this.svg.select(`#control-citem-left`)
                        .attr("cx",  this.xAxis.scale(config.xAxis.selectedDomain[0]))
                        .attr("cy", config.display.size.height/2 +config.display.margin.top)
                        .attr("r", config.display.size.height)
                        .attr("fill","none")
                        .attr("pointer-events","all")
                        .style("cursor","ew-resize")
                        .style("cursor","ew-resize")
                        .style("cursor","-moz-ew-resize")
                        .style("cursor","-webkit-ew-resize")
                        .call(drag()
                            .on("drag", function() {that.dragged(this,that,"left");}));
        this.svg.select(`#control-citem-right`)
                        .attr("cx",  this.xAxis.scale(config.xAxis.selectedDomain[1]))
                        .attr("cy", config.display.size.height/2 +config.display.margin.top)
                        .attr("r", config.display.size.height)
                        .attr("fill","none")
                        .attr("pointer-events","all")
                        .style("cursor","ew-resize")
                        .style("cursor","ew-resize")
                        .style("cursor","-moz-ew-resize")
                        .style("cursor","-webkit-ew-resize")
                        .call(drag()
                            .on("drag", function() {that.dragged(this,that,"right");}));

        

        
        

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

        this.svg.append("rect")
                            .attr("id",`rect-bg-${config.cont.id}`)
                            .attr("class","rect-bg");

        this.svg.append("g")
                            .attr("class","areas")
                            .attr("id",`areas-group-${config.cont.id}`);
        config.xAxis.el = this.svg.append("g")
                            .attr("class","x-axis axes")
                            .attr("id","x-axis")
                            .attr("transform",`translate(0,${config.display.margin.top})`);
        
        
        this.svg.append("g")
                            .attr("class","controls-areas")
                            .attr("id",`controls-area-group-${config.cont.id}`);


        
        this.svg.append("g")
                            .attr("class","controls")
                            .attr("id",`controls-group-${config.cont.id}`);

        
        
        

        

        
        

    }

}

export {TimeSlider};