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

class Gradient {
    constructor(config){
        this.config = config;
        this.initialize();
        this.update();
    }

    updateDomains(){
        let config = this.config;
        dataFormat.adjustTZColumn(config.xAxis.dimension,config.tzOffset,config.data);

        if(config.xAxis.fixTimeZone) {
            config.xAxis.domain = config.xAxis.domain? dataFormat.adjustTZList(config.tzOffset,config.xAxis.domain) : dataFormat.fetchRange(config.xAxis.dimension,config.data);
        }
        else{
            config.xAxis.domain = config.xAxis.domain? dataFormat.adjustTime(config.tzOffset,config.xAxis.domain) : dataFormat.fetchRange(config.xAxis.dimension,config.data);
        }
        config.color.domain = config.color.domain  || config.measures;
    }

    updateGenerators(){

      
        
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

        
        case "color":
            props = config.color;
            return new ContinousAxis(props);


        
    }
    }

    mouseOver(el,that) {
        
        let mouseEvent = mouse(el);
        let timeLevel = dataFormat.getTimeLevel(that.config.xAxis.timeLevel);
        let config = that.config;
        let x0 = that.xAxis.scale.invert(mouseEvent[0]);
        let xLevel = timeLevel(x0).getTime();

        let bisectDate = bisector((d,x) => {return d.timestamp -x }).right;

        let selectedData = that.config.data.length > 0 ? that.config.data.reduce((a,b) => {
            return Math.abs(b[config.xAxis.dimension] - xLevel) < Math.abs(a[config.xAxis.dimension] - xLevel) ? b : a;
        }):null; 
        
        if(selectedData != undefined && selectedData[that.config.yAxis.measure] != null){
            let cx = that.xAxis.scale(selectedData[that.config.xAxis.dimension]);

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

    }

    mouseOut(el,that){
        that.tooltip.style("display","none");
        that.svg.selectAll(".marker-hl-item").style("opacity",0);
        that.svg.select(`#hl-line-${that.config.cont.id}`).style("opacity",0);
        
    }

    highlightTooltipMouseOver(el, that, d) {
        // console.log("click event from funcction tooltip trigered", el,that,d); 
        that.config.events.tooltip.active = true;
        that.config.markerTooltip.tooltip.active = true
        let selectData = d;
        let prevTooltip = that.tooltip;
        let mouseEvent = mouse(el);
        let timeLevel = dataFormat.getTimeLevel(that.config.xAxis.timeLevel);
        let config = that.config;
        let x0 = that.xAxis.scale.invert(mouseEvent[0]);
        let xLevel = timeLevel(x0).getTime();

        let tooltip = config.markerTooltip.show?config.markerTooltip.tooltip.el:config.events.tooltip.el;

        let bisectDate = bisector((d, x) => { return d.timestamp - x }).right;

        if (selectData != undefined) {

            let cx;
            if(config.markerTooltip.show){
                cx = that.xAxis.scale(selectData[that.config.xAxis.dimension]);
            }
            else{
                cx = that.xAxis.scale(selectData[that.config.events.dimensions[0]]);
            }
            // let starttimee = that.xAxis.scale(selectData[that.config.events.dimensions[0]]);

            // let cx = starttimee;
       

            that.svg.selectAll(".marker-hl-item")
                    .attr("cx",cx)
                    .attr("cy", (m) => m == that.config.yAxis2.measure?that.yAxis2.scale(selectData[m]):that.yAxis.scale(selectData[m]) )
                    .attr("r",10)
                    .attr("fill",(m) => that.config.color.scale(m))
                    .attr("stroke",(m,mi) => that.config.markers[mi].stroke || that.config.color.scale(m))
                    .style("opacity",1)
                    .attr("fill-opacity", 0.5);

            if (config.events.line.show) {
                that.svg.select(`#hl-line-${config.cont.id}`)
                    .attr("x1", cx)
                    .attr("x2", cx)
                    .attr("y1", that.config.display.margin.top)
                    .attr("y2", that.config.display.size.height - that.config.display.margin.bottom)
                    .attr("fill", that.config.events.line.stroke)
                    .attr("stroke", that.config.events.line.stroke)
                    .style("opacity", 1);
            }
            else if(config.markerTooltip.line.show) {
                that.svg.select(`#hl-line-${config.cont.id}`)
                    .attr("x1", cx)
                    .attr("x2", cx)
                    .attr("y1", that.config.display.margin.top)
                    .attr("y2", that.config.display.size.height - that.config.display.margin.bottom)
                    .attr("fill", that.config.markerTooltip.line.stroke)
                    .attr("stroke", that.config.markerTooltip.line.stroke)
                    .style("opacity", 1);
            }

            // let elW = tooltip.node().offsetWidth;
            // let elH = 60;

            // let xPos, yPos;
            // if (cx <= config.display.margin.left + elW / 2) {
            //     xPos = (config.display.margin.left + 10) + "px";
            // }
            // else if (cx >= config.display.size.width - config.display.margin.right - config.display.margin.left - elW) {
            //     xPos = (starttimee - (elW) - 10) + "px";
            // }
            // else {
            //     xPos = cx + "px";
            // }

            // yPos = (that.yAxis.scale.range()[1]) + "px";

            let elW = tooltip.node().offsetWidth;
            let elH = 60;
            let xPos,yPos;
            if(cx <= config.display.margin.left + elW/2){
                    xPos = (config.display.margin.left+10)+"px";
            }
            else if(cx >=  config.display.size.width-config.display.margin.right-config.display.margin.left  - elW/2){
                    xPos = ((config.display.size.width - config.display.margin.right - config.display.margin.left)-(elW) )+"px";
            }
            else{
                    xPos = (cx-elW/2) - config.display.margin.left - config.display.margin.right+"px";
            }

            if(config.markerTooltip.show){
                yPos = (that.yAxis.scale.range()[1]) + 10+"px";
            }
            else{
                yPos = (that.yAxis.scale.range()[1]) + elH + 10+"px";
            }
            if (config.events.show && !config.markerTooltip.show) {
                config.events.tooltip.active = true;
                selectData['source'] = 'hl';
                // tooltip.transition().delay(3000)
                config.events.tooltip.tooltip.update(config.events, {xPos, yPos}, selectData)                  
            }
            else{
                config.markerTooltip.tooltip.active = true;
                selectData['source'] = 'hl';
                // tooltip.transition().delay(3000)
                config.markerTooltip.tooltip.tooltip.update(config.markerTooltip, {xPos, yPos}, selectData)   
            }
        }
    }

    highlightMouseOut(el,that){
        
        if(that.config.markerTooltip.show){
            setTimeout(function(){

                if(that.config.markerTooltip.tooltip.active) return null;
                that.config.markerTooltip.tooltip.el.selectAll("*").remove()
                that.config.markerTooltip.tooltip.el.style("display", 'none' )
                that.svg.selectAll(".marker-hl-item").style("opacity",0)
                that.svg.select(`#hl-line-${that.config.cont.id}`).style("opacity",0)
         
            },
            5000)
        }
        else{
            setTimeout(function(){

                if(that.config.events.tooltip.active) return null;
                that.config.events.tooltip.el.selectAll("*").remove()
                that.config.events.tooltip.el.style("display", 'none' )    
            },
            5000)
        }
        
        // that.svg.selectAll(".marker-hl-item").style("opacity",0);
        // that.svg.select(`#hl-line-${that.config.cont.id}`).style("opacity",0);
    }
    
    update(){
        let config = this.config;
        let that = this;
        config.chartData = config.data;

        config.filteredMeasures = config.measures.filter((m) => {
            return config.chartData.map(d => d[m]).some(v => v)
        })
      
  
        this.updateDomains(config.chartData);
        this.xAxis = this.getAxis("xAxis");        
        this.colorScale = this.getAxis("color"); 
        this.config.color.scale = this.colorScale.scale;
        config.markers = [...defaults.multiline.markers,...config.markers];
        if (config.xAxis.show) this.svg.select("#x-axis").call(this.xAxis.axis.tickFormat(config.xAxis.locale === 'en-US'? config.xAxis.localeFormat : config.xAxis.localeFormat.format(config.xAxis.ticks.text.timeFormat)).tickValues(config.xAxis.ticks.text.tickValues));
        
        
        this.updateGenerators();

        axisFormat.formatAxes(config);

        // there needs to be 2 data points (start and end) for a rect to show
        if(config.chartData.length <= 1 || config.filteredMeasures.length === 0 ){

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
            return
        }
        
        let markersGroup = this.svg.select("#markers-group");
        markersGroup.selectAll("g").data(config.measures).enter().append("g").attr("id",(d) =>{return `markers-group-${textFormat.formatSelector(d)}`});
        markersGroup.selectAll("g").data(config.measures).exit().remove();
        
        let width
        if(config.chartData.length >= 2){ // there needs to be 2 data points (start and end) for a rect to show
            width = this.xAxis.scale(config.chartData[1][config.xAxis.dimension]) -  this.xAxis.scale(config.chartData[0][config.xAxis.dimension])
            config.xAxis.ticks.text.dx = width/2;
        }
        
        config.measures.map((m,mi) => {
            config.markers[mi] = {...defaults.markers[mi],...circleConfig,...config.markers[mi]};
            
            if (config.markers[mi].show) {
                
                if(config.markers[mi].shape == "rect"){

                
                markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item").data(config.chartData).enter().append("rect").attr("class","marker-item");
                markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item").data(config.chartData).exit().remove();

                markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item")
                            // .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                            // .attr("cy",(d) => config.display.size.height)
                            // .transition(easeBounce).duration(1000)
                            .attr("x",(d) => this.xAxis.scale(d[config.xAxis.dimension]) )
                            .attr("y",(d) => config.display.margin.top)
                            .attr("width",(d,di) =>   width )
                            .attr("height",(d) => 20)
                            .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.markers[mi]);})
                            .attr("fill",(d) => config.color.scale(d[m]||0 ))
                            .attr("stroke",(d,di) => config.color.scale(d[m]))
                            ;

                            if(config.markerTooltip.show){
                                markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item")
                                .style("pointer-events","all")
                                .raise()
                                .on("click", function (d) { that.highlightTooltipMouseOver(this, that, d);})
                                .on("mouseout", function () { that.highlightMouseOut(this, that); });
                            }
                }
                
    
            }
            

        });

        //Highlight Mouseout Timeout Tooltip for Marker-------
        this.tooltipMarkerMouseOut = function(el, that) {
            let config = that.config;
            if(!config.markerTooltip.tooltip.active) return null;

            config.markerTooltip.tooltip.active = false 
            // console.log("Trigerring mouseout")
            function hideTooltip(){
                config.markerTooltip.tooltip.el.style('display','none')
                
            }
            setTimeout(function(){
                hideTooltip()
            },3000)
            // console.log('settimeout logged out');
     }

         //Highlight Mouseover Timeout Tooltip for Markers-------
         this.tooltipHLMarker
         .on("mouseover", function (d,di) { 
             // console.log('mouseover on element1')
             config.markerTooltip.tooltip.active = true })
         .on("mousemove", function (d,di) { 
             // console.log('mouseover on element2')
             config.markerTooltip.tooltip.active = true })
         .on("mouseout", function () {
             // console.log('mouseout on elementss')
             that.tooltipMarkerMouseOut(this,that) });

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
        this.tooltipHLMarker  = config.markerTooltip.tooltip.el;
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
        
        
        
        this.svg.append("g")
                    .attr("class","markers")
                    .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id","markers-group");

        
    
        
        
        this.svg.append("rect")
                    .attr("id",`rect-overlay-${config.cont.id}`)
                    .attr("class","rect-overlay")
                    .attr("fill","none")
                    .style("pointer-events","all");

        
        

    }

}

export {Gradient};