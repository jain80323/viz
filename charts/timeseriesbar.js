import {select,easeBounce, timeFormat, timeMinutes, timeMinute, mouse, bisector} from  "d3";
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

class TimeseriesBar {
    constructor(config){
        this.config = config;
        this.initialize();
        this.update();
    }

    updateDomains(data){
        let config = this.config;
        dataFormat.adjustTZColumn('seg_start',config.tzOffset,config.chartData.data.predictions);
        dataFormat.adjustTZColumn('seg_end',config.tzOffset,config.chartData.data.predictions);
        
        if(config.xAxis.fixTimeZone) {
            config.xAxis.domain = config.xAxis.domain? dataFormat.adjustTZList(config.tzOffset,config.xAxis.domain) : dataFormat.fetchRange(config.xAxis.dimension,config.data.data.predictions);
        }
        else{
            config.xAxis.domain = config.xAxis.domain? dataFormat.adjustTime(config.tzOffset,config.xAxis.domain) : dataFormat.fetchRange(config.xAxis.dimension,config.data.data.predictions);
        }
        config.yAxis.domain = config.yAxis.domain || dataFormat.fetchRange(config.yAxis.measure,config.data.data.predictions);
        config.color.domain = config.color.domain  || config.measures;
    }

    updateGenerators(){

        this.config.bilineGenerator =  generator.lineGenerator(this.xAxis.scale,"time",this.yAxis.scale,"bi");

        this.config.biareaGenerator =  generator.areaGenerator(this.xAxis.scale,"time",this.yAxis.scale,"bi");
        
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

    mouseOver(el,that,d) {
        
        let config = that.config;
        let cx = that.xAxis.scale(d["seg_start"])

        that.svg.selectAll(".marker-hl-item")
                .attr("cx",cx)
                .attr("cy", (m) => m == that.config.yAxis2.measure?that.yAxis2.scale(selectedData[m]):that.yAxis.scale(selectedData[m]) )
                .attr("r",10)
                .attr("fill",(m) => that.config.color.scale(m))
                .attr("stroke",(m,mi) => that.config.markers[mi].stroke || that.config.color.scale(m))
                .style("opacity",1)
                .attr("fill-opacity", 0.5);
        
        if(config.tooltip.line.show){
            that.svg.select(`#hl-line-${config.cont.id}`)      
                        .attr("x1",cx)
                        .attr("x2",cx)
                        .attr("y1",that.config.display.margin.top)
                        .attr("y2",that.config.display.size.height-that.config.display.margin.bottom)
                        .attr("fill",that.config.tooltip.line.stroke)
                        .attr("stroke",that.config.tooltip.line.stroke)
                        .style("opacity",1);
        }  

        let tooltip = config.tooltip.el;
        let elW = tooltip.node().offsetWidth;
        let elH = 60;
        
        let xPos,yPos;
        if(cx <= config.display.margin.left + elW/2){
                xPos = (config.display.margin.left+10)+"px";
        }
        else if(cx >=  config.display.size.width-config.display.margin.right-config.display.margin.left  - elW){
                xPos = ((config.display.size.width - config.display.margin.right)-(elW) - 10)+"px";
        }
        else{
                xPos = (cx-elW/2 + config.tooltip.offset.x)+"px";
        }

        yPos = (that.yAxis.scale.range()[1] + config.tooltip.offset.y)+"px";

        if(config.tooltip.show){
            config.tooltip.tooltip.update(config, {xPos, yPos}, selectedData)
        }  
                        
    }

    mouseOut(el,that,d){
        that.tooltip.style("display","none");
        that.svg.selectAll(".marker-hl-item").style("opacity",0);
        // that.svg.select(`#hl-line-${that.config.cont.id}`).style("opacity",0);
        
    }

    

    
    update(){
        let config = this.config;
        let that = this;
        config.chartData = {...config.data};
        config.filteredMeasures = config.measures.filter((m) => {
            return config.chartData.data.predictions.map(d => d[m]).some(v => v)
        })

        this.updateDomains(config.chartData);
        config.chartData.data.predictions.map((d) => {
            d.error = (d[config.measures] - d[`${config.measures}_e`])*100/d[`${config.measures}_e`]
        })
        this.xAxis = this.getAxis("xAxis");        
        this.yAxis = this.getAxis("yAxis"); 
        this.colorScale = this.getAxis("color"); 
        this.config.color.scale = this.colorScale.scale;
        if (config.xAxis.show) this.svg.select("#x-axis").call(this.xAxis.axis.tickFormat(config.xAxis.locale === 'en-US'? config.xAxis.localeFormat :config.xAxis.localeFormat.format(config.xAxis.ticks.text.timeFormat)).tickValues(config.xAxis.ticks.text.tickValues));
        if (config.yAxis.show) this.svg.select("#y-axis").call(this.yAxis.axis.ticks(config.yAxis.ticks.number));
        
        this.updateGenerators();

        axisFormat.formatAxes(config);

        if(config.chartData.length == 0 || config.filteredMeasures.length === 0 || config.chartData.data.predictions.length == 0){

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

        this.svg.select(`#continous-bi-group-${config.cont.id}`).selectAll("rect")
                    .data(config.chartData.data.predictions).enter()
                    .append("rect");
        this.svg.select(`#continous-bi-group-${config.cont.id}`).selectAll("rect")
                    .data(config.chartData.data.predictions).exit()
                    .remove();

        this.svg.select(`#continous-bi-group-${config.cont.id}`).selectAll("rect")
                        .attr("x",(d) => this.xAxis.scale(d.seg_start))
                        .attr("y",(d) => {return d.error > 0 && d.error != Infinity  ?  this.yAxis.scale(d.error)   : this.yAxis.scale(0) })
                        .attr("width",(d) => this.xAxis.scale(d.seg_end) - this.xAxis.scale(d.seg_start))
                        .attr("height",(d) => { return  d.error != Infinity && d.error != NaN?   d.error > 0   ?  this.yAxis.scale(0)  - this.yAxis.scale(d.error)  : this.yAxis.scale(d.error)  - this.yAxis.scale(0) : 0  })
                        .on("mouseover",function(d) {that.mouseOver(this,that,d);})
                        .on("mousemove",function(d) {that.mouseOver(this,that,d);})
                        .on("mouseout",function(d) {that.mouseOut(this,that,d);})
                        .attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),config.markers[0]);});


 
        
        

        
        this.svg.select(`#rect-overlay-${config.cont.id}`)
                    .attr("x",config.display.margin.left)
                    .attr("y",config.display.margin.top)
                    .attr("width",config.display.size.width-config.display.margin.right-config.display.margin.left)
                    .attr("height",config.display.size.height-config.display.margin.bottom-config.display.margin.top)
                    // .on("mouseover",function() {that.mouseOver(this,that);})
                    // .on("mousemove",function() {that.mouseOver(this,that);})
                    // .on("mouseout",function() {that.mouseOut(this,that);});
        this.svg.select(`#rect-clip-${config.cont.id}`)
                    .select("rect")
                    .attr("x",config.display.margin.left )
                    .attr("width",config.display.size.width - config.display.margin.left - config.display.margin.right)
                    .attr("y",config.display.margin.top - 10)
                    .attr("height",config.display.size.height + 20);

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
        config.yAxis.el = this.svg.append("g")
                            .attr("class","y-axis axes")
                            .attr("id","y-axis")
                            .attr("transform",`translate(${config.display.margin.left},0)`);
       

        
        this.svg.append("g")
                            .attr("class","continous-bi")
                            .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                            .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                            .attr("id",`continous-bi-group-${config.cont.id}`);


      
        
        
        
        
        
        

    }

}

export {TimeseriesBar};