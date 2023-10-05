import {select,easeBounce,drag, timeFormat, timeMinutes,min, max,timeMinute, mouse, bisector, event} from  "d3";
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

class ECGSlider {
    constructor(config){
        this.config = config;
        this.initialize();
        this.update();
    }

    updateDomains(){
        let config = this.config;
        config.xAxis.selectedDomain[1] = min([config.xAxis.selectedDomain[1],config.xAxis.selectedDomain[0]+10000])
        
        // config.xAxis.domain = dataFormat.adjustTime(config.tzOffset,config.xAxis.domain);
        // config.xAxis.selectedDomain = dataFormat.adjustTime(config.tzOffset,config.xAxis.selectedDomain); 
        config.yAxis.domain = config.yAxis.domain || dataFormat.fetchRange(config.yAxis.measure,data);
        
        
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

        
    }
    }

    mouseOver(el,that) {
                 

    }

    mouseOut(el,that){
        
    }

    dragend(el,that,type){
        let config = that.config;
        config.chartList.map((c) => {
            c.chart.config.xAxis.domain = config.xAxis.selectedDomain;
            c.chart.update();
        })
    }

    dragRect(el,that,type){
        let xPos = event.x;
        let yPos = event.y;
        let config  = that.config;
        let diff = config.xAxis.selectedDomain[1] - config.xAxis.selectedDomain[0];
        let evntTime = that.xAxis.scale.invert(xPos).getTime()
        
        if(evntTime > config.xAxis.domain[1]-diff/2 ) 
        {
             return null
        }
        if ( evntTime < config.xAxis.domain[0]+diff/2)
        {
            return null
        }
            
            config.xAxis.selectedDomain[0] =evntTime - diff/2
            that.svg.select("#control-ritem-left").attr("x",this.xAxis.scale(config.xAxis.selectedDomain[0]-5));
            that.svg.select("#control-ritem-right").attr("x",this.xAxis.scale(config.xAxis.selectedDomain[1]-5));
            that.svg.select(`#control-item-left`)
            .attr("transform",`translate(${ this.xAxis.scale(config.xAxis.selectedDomain[0])-3},${config.display.margin.top})`);
            config.xAxis.selectedDomain[1] = evntTime + diff/2;
            that.svg.select(`#control-item-right`)
            .attr("transform",`translate(${ this.xAxis.scale(config.xAxis.selectedDomain[1])-3},${config.display.margin.top})`)
                
        

        
        that.svg.select(`#area-item-center`)
        .attr("x",this.xAxis.scale(config.xAxis.selectedDomain[0]))
       


    }
    dragged(el,that,type){
        let xPos = event.x;
        let yPos = event.y;
        let config  = that.config;
        let evntTime = that.xAxis.scale.invert(xPos).getTime()
        
        if(type == 'left' && evntTime < config.xAxis.selectedDomain[1]-10000 ) 
        {
             return null
        }
        if (type == 'right' &&  evntTime > config.xAxis.selectedDomain[0]+10000)
        {
            return null
        }
        if(type == 'left' &&  xPos < that.xAxis.scale(config.xAxis.selectedDomain[1]) & xPos > config.display.margin.left -3 ){
            
            config.xAxis.selectedDomain[0] =evntTime
            select(el).raise().attr("x",xPos-5);

            that.svg.select(`#control-item-left`)
            .attr("transform",`translate(${ this.xAxis.scale(config.xAxis.selectedDomain[0])-3},${config.display.margin.top})`)
                    
            
        }
        if(type == 'right' && xPos > that.xAxis.scale(config.xAxis.selectedDomain[0]) & xPos < config.xAxis.range[1]+3 ){
            select(el).raise().attr("x",xPos-5);
            config.xAxis.selectedDomain[1] = evntTime;
            that.svg.select(`#control-item-right`)
            .attr("transform",`translate(${ this.xAxis.scale(config.xAxis.selectedDomain[1])-3},${config.display.margin.top})`)
                
        }

        
        that.svg.select(`#area-item-center`)
        .attr("x",this.xAxis.scale(config.xAxis.selectedDomain[0]))
        .attr("width",  this.xAxis.scale(config.xAxis.selectedDomain[1]) -  this.xAxis.scale(config.xAxis.selectedDomain[0]))


    }
    

    
    update(){
        let config = this.config;
        // console.log(config);
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

        this.updateDomains();
        this.xAxis = this.getAxis("xAxis");         
        this.yAxis = this.getAxis("yAxis");  
        if (config.xAxis.show) this.svg.select("#x-axis").call(this.xAxis.axis.tickFormat(config.xAxis.locale === 'en-US'? config.xAxis.localeFormat :config.xAxis.localeFormat.format(config.xAxis.ticks.text.timeFormat)).tickValues(config.xAxis.ticks.text.tickValues));
        if (config.yAxis.show) this.svg.select("#y-axis").call(this.yAxis.axis.ticks(config.yAxis.ticks.number));
        

        this.updateGenerators();

        if (config.line.show) {
            config.line = {...defaults.line,...config.line}
            this.svg.select(`#lines-group-${config.cont.id}`).selectAll("path").data(config.measures).enter().append("path");
            this.svg.select(`#lines-group-${config.cont.id}`).selectAll("path").data(config.measures).exit().remove();
            this.svg.select(`#lines-group-${config.cont.id}`).selectAll("path")
                        .attr("d",(d,di) => config.lineGenerators[di](config.chartData))
                        .attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),config.line);})
                        // .attr("stroke",config.line. )
                        ;
        }
        this.svg.select(`#rect-bg-${config.cont.id}`)
                    .attr("x",config.display.margin.left)
                    .attr("y",config.display.margin.top )
                    .attr("width", config.display.size.width -config.display.margin.left -config.display.margin.right)
                    .attr("height", config.display.size.height- config.display.margin.bottom  - config.display.margin.top)
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
                    .selectAll("rect").data(["left","right"])
                    .enter().append("rect")
                    .attr("id" , (d) => `control-ritem-${d}`)
                    .attr("class","control-ritem")
                    

        this.svg.select(`#areas-group-${config.cont.id}`)
                    .selectAll("rect").data(["center"])
                    .enter().append("rect")
                    .attr("id" , (d) => `area-item-${d}`)
                    .attr("class","area-item");
        this.svg.select(`#area-item-center`)
                        .attr("x",this.xAxis.scale(config.xAxis.selectedDomain[0]))
                        .attr("y",config.display.margin.top )
                        .attr("width",  this.xAxis.scale(config.xAxis.selectedDomain[1]) -  this.xAxis.scale(config.xAxis.selectedDomain[0]))
                        .attr("height", config.display.size.height - config.display.margin.bottom  - config.display.margin.top)
                        .attr("fill", config.area.fill ||"#e0e3ed")
                        .style("pointer-events","all")
                        .attr("data-attrs",function(d,di){return elementFormat.applyAttrs(select(this),config.area);})
                        .call(drag()
                            .on("drag", function() {that.dragRect(this,that,"center");})
                            .on("end", function() {that.dragend(this,that,"center")})
                        );

        this.svg.select(`#control-ritem-left`)
                        .attr("x",  this.xAxis.scale(config.xAxis.selectedDomain[0]-5))
                        .attr("y", config.display.margin.top)
                        .attr("height", config.display.size.height)
                        .attr("width", 10)
                        .attr("fill","none")
                        .attr("pointer-events","all")
                        .style("cursor","move")
                        .style("cursor","grab")
                        .style("cursor","-moz-grab")
                        .style("cursor","-webkit-grab")
                        .call(drag()
                            .on("drag", function() {that.dragged(this,that,"left");})
                            .on("end", function() {that.dragend(this,that,"left")})
                            
                            );
        this.svg.select(`#control-ritem-right`)
                        .attr("x",  this.xAxis.scale(config.xAxis.selectedDomain[1]-5))
                        .attr("y", config.display.margin.top)
                        .attr("height", config.display.size.height)
                        .attr("width", 10)
                        .attr("fill","none")
                        .attr("pointer-events","all")
                        .style("cursor","move")
                        .style("cursor","grab")
                        .style("cursor","-moz-grab")
                        .style("cursor","-webkit-grab")
                        .call(drag()
                            .on("drag", function() {that.dragged(this,that,"right");})
                            .on("end", function() {that.dragend(this,that,"right")})
                            
                            );

            if(config.eventData != undefined & config.events.show){
                let eventsGroup = this.svg.select(`#events-group-${config.cont.id}`);
                eventsGroup.selectAll("g").data(config.events.measures).enter().append("g").attr("id",(d) =>{return `events-group-${textFormat.formatSelector(d.name)}`});
                eventsGroup.selectAll("g").data(config.events.measures).exit().remove();
                    
                config.events.measures.map((s) => {
                    if(s.type == "range"){
                    eventsGroup.select(`#events-group-${textFormat.formatSelector(s.name)}`).selectAll(".event-item").data(config.eventData).enter().append("rect").attr("class","event-item");
                    eventsGroup.select(`#events-group-${textFormat.formatSelector(s.name)}`).selectAll(".event-item").data(config.eventData).exit().remove();
    
                    eventsGroup.select(`#events-group-${textFormat.formatSelector(s.name)}`).selectAll(".event-item")
                                .attr("x",(d) => this.xAxis.scale(d[config.events.dimensions[0]]))
                                .attr("y",(d) => config.display.margin.top)
                                .attr("height",(d) => config.display.size.height  - config.display.margin.bottom  - config.display.margin.top)
                                .attr("width",(d) => this.xAxis.scale(d[config.events.dimensions[1]]) - this.xAxis.scale(d[config.events.dimensions[0]]))
                                .attr("data-attrs",function(d,di){return elementFormat.applyAttrs(select(this),s.attrs);})
                                ;
                    }
                    if(s.type == "point"){
                        eventsGroup.select(`#events-group-${textFormat.formatSelector(s.name)}`).selectAll(".event-item").data(config.eventData).enter().append("circle").attr("class","event-item");
                        eventsGroup.select(`#events-group-${textFormat.formatSelector(s.name)}`).selectAll(".event-item").data(config.eventData).exit().remove();
        
                        eventsGroup.select(`#events-group-${textFormat.formatSelector(s.name)}`).selectAll(".event-item")
                                    .attr("cx",(d) => this.xAxis.scale(d[config.events.dimensions[0]]))
                                    .attr("cy",(d) => config.display.size.height - config.display.margin.bottom  )
                                    .attr("data-attrs",function(d,di){return elementFormat.applyAttrs(select(this),s.attrs);})
                                    ;
                        }
    
                })
            }

        
        
        this.dragend(this,this,"center")
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
        
       
        config.xAxis.el = this.svg.append("g")
                            .attr("class","x-axis axes")
                            .attr("id","x-axis")
                            .attr("transform",`translate(0,${config.display.margin.top})`);
        this.svg.append("g")
                            .attr("class","events")
                            .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                            .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                            .attr("id",`events-group-${config.cont.id}`);
        
        this.svg.append("g")
                            .attr("class","controls-areas")
                            .attr("id",`controls-area-group-${config.cont.id}`);

        
        
        
        this.svg.append("g")
                            .attr("class","areas")
                            .attr("id",`areas-group-${config.cont.id}`);
        this.svg.append("g")
                            .attr("class","controls")
                            .attr("id",`controls-group-${config.cont.id}`);
        this.svg.append("g")
                            .attr("class","lines")
                            .attr("id",`lines-group-${config.cont.id}`);

        
        
        

        

        
        

    }

}

export {ECGSlider};