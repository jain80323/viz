import {select,easeBounce, timeFormat, timeMinutes, timeMinute, max, mouse, bisector, format} from  "d3";
import {defaults} from "../config/default";
import {axisFormat} from "../utils/axis-formatter";
import {elementFormat} from "../utils/element-formatter";
import { ColorScale } from "../components/colorscale";
import {circleConfig} from "../config/circle";
import {lineConfig} from "../config/line";
import { dataFormat } from "../utils/data-formatter";
import { ContinousAxis } from "../components/continousaxis";
import { TimeAxis } from "../components/timeaxis";
import { generator } from "../utils/generators";
import {textFormat} from "../utils/text-formatter.js";
import { rectConfig } from "../config/rect";

class LineChart {
    constructor(config){
        this.config = config;
        this.initialize();
        this.update();
    }

    updateDomains(data){
        let config = this.config;
        dataFormat.adjustTZColumn(config.xAxis.dimension,config.tzOffset,config.data);
        if(config.segmentData != undefined && config.segments.show){
        dataFormat.adjustTZColumn(config.segments.dimensions[0],config.tzOffset,config.segmentData);
        if(config.segments.dimensions[1]) dataFormat.adjustTZColumn(config.segments.dimensions[1],config.tzOffset,config.segmentData);
        }
        if(config.eventData != undefined && config.events.show){

        if(config.events.dimensions[1]) dataFormat.adjustTZColumn(config.events.dimensions[1],config.tzOffset,config.eventData);
        dataFormat.adjustTZColumn(config.events.dimensions[0],config.tzOffset,config.eventData);
        
        }
        if(config.activityData != undefined && config.activityIntensity.show){

            dataFormat.adjustTZColumn(config.activityIntensity.dimensions[0],config.tzOffset,config.activityData);
            if(config.activityIntensity.dimensions[1]) dataFormat.adjustTZColumn(config.activityIntensity.dimensions[1],config.tzOffset,config.activityData);
        }
        if(config.xAxis.fixTimeZone) {
            config.xAxis.domain = config.xAxis.domain? dataFormat.adjustTZList(config.tzOffset,config.xAxis.domain) : dataFormat.fetchRange(config.xAxis.dimension,config.data);
        }
        else{
        config.xAxis.domain = config.xAxis.domain ? dataFormat.adjustTime(config.tzOffset, config.xAxis.domain) : dataFormat.fetchRange(config.xAxis.dimension, config.data);
        }

        if(config.yAxis.dynamicyAxis && config.filteredMeasures.length > 0){

            config.yAxis.domain = config.yAxis.domain ? dataFormat.fetchDynamicRange(config.yAxis.measure,data,config) : config.yAxis.domain;
            config.yAxis2.domain = config.yAxis2.domain ? dataFormat.fetchDynamicRange(config.yAxis.measure,data,config) : config.yAxis2.domain;
        }
        else{

            config.yAxis.originalDomain = config.yAxis.originalDomain || config.yAxis.domain || dataFormat.fetchRange(config.yAxis.measure,data)
            config.yAxis.domain = [config.yAxis.originalDomain[0] - config.yAxis.offset.bottom, config.yAxis.originalDomain[1] + config.yAxis.offset.top];
            
            config.yAxis2.domain = config.yAxis2.domain || dataFormat.fetchRange(config.yAxis.measure,data);

        }

        config.color.domain = config.color.domain  || config.measures;
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
            config.xAxis.ticks.type && config.xAxis.ticks.type=="custom" ? axisFormat.setCustomTickValues(config) :axisFormat.setTickIntervals(config);
            config.xAxis.dimension = config.xAxis.dimension || config.dimensions[0];
            axisFormat.setLocale(config);
            props = config.xAxis;
            return new TimeAxis(props);

        case "yAxis":
            config.yAxis.measure = config.yAxis.measure || config.measures[0];
            props = config.yAxis;
            return new ContinousAxis(props);
        
        case 'yAxis2':
            config.yAxis2.measure = config.yAxis2.measure || config.measures[1];
            props = config.yAxis2;
            return new ContinousAxis(props);

        case "color":
            props = config.color;
            return new ColorScale(props);
        
        case "activity":
            props = config.activityIntensity.color;
            return new ColorScale(props);
        
    }
    }

    markerMouseOver(d,that,markerIndex) {
        // console.log(d,'inside mouseover marker')
        let tooltip = that.tooltip;
        let config = that.config;

        let cx = that.xAxis.scale(d[that.config.xAxis.dimension]);
        let marker = Object.values(that.config.markers).find(item => item.measure === markerIndex);

        if(config.defaultDataHighlighted){
        config.measures.map((m,mi) => {
        that.svg.select(`#markers-group-${textFormat.formatSelector(m)}`)
                    .selectAll(".marker-item")
                    .filter(m=>{ return d===m } )
                    .style("opacity", 1);
        
        });
        }    
        if(marker.showTooltip){
            if(config.measures.length == 1){
                that.svg.selectAll(".marker-hl-item")
                .filter(m=>{ return m === markerIndex } )
                .attr("cx",cx)
                .attr("cy", (m) => that.config.yAxis2.show && m == that.config.yAxis2.measure?that.yAxis2.scale(d[m]):that.yAxis.scale(d[m]) )
                .attr("r",10)
                .attr("fill",(m, mi) => that.config.lines[mi].color || that.config.color.scale(m) )
                .attr("stroke",(m,mi) => that.config.markers[mi].stroke || (that.config.lines[mi].color))
                .style("opacity", 1)
                .attr("fill-opacity", 0.5);
            }else{ //if more than one marker-item need to be highlighted, like we are doing in kcc new designs from linechart.
                this.svg.select(`#markers-hl-group-${config.cont.id}`)
                .selectAll(".marker-hl-item")
                .filter(m=>{ return d[m] != null  && m === markerIndex } )
                .attr("cx", that.xAxis.scale(d[config.xAxis.dimension]))
                .attr("cy",(m) => config.yAxis2.show && m == config.yAxis2.measure && d[m]?this.yAxis2.scale(d[m]):this.yAxis.scale(d[m]))
                .attr("r",10)
                .attr("class","marker-hl-item")
                .attr("fill",(m, mi) => that.config.lines[mi].color || that.config.color.scale(m) )
                .attr("stroke",(m,mi) => that.config.markers[mi].stroke || (that.config.lines[mi].color))
                .style("opacity", 1)
                .attr("fill-opacity", 0.7);
            }
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
                        xPos = (cx-elW/2)+"px";
                }

                yPos = (that.yAxis.scale.range()[1] + config.tooltip.offset.y) - 35+"px";
                    d['markerIndex'] = markerIndex;

                    d['source'] = 'markersTooltip';
                    config.tooltip.tooltip.update(config, {xPos, yPos}, d)     

        }
    }

    markerMouseOut(d,that,markerIndex) {
        // console.log('marker mouseout')
        // If we want to keep marker highlighted till user hover next marker.....
        if(this.config.keepMarkerHighlighted){
            // let marker = Object.values(that.config.markers).find(item => item.measure === markerIndex);
            that.config.measures.map((m,mi) => {
            that.svg.select(`#markers-group-${textFormat.formatSelector(m)}`)
            .selectAll(".marker-item")
            .filter(m=>{ return d!=m } )
            .style("opacity", 0.5);
            });
        }
        else{
            d['markersMouseoutFunction'] = 'markersMouseout';
            setTimeout(function(){

            delete d['source']
            that.tooltip.style("display","none");
            that.svg.selectAll(".marker-hl-item").style("opacity",0);
            that.svg.select(`#hl-line-${that.config.cont.id}`).style("opacity",0);
            },1000);
        }
    }
    
    mouseOver(el,that) {
        // console.log('normal mouseOver')
        // let tooltip = that.tooltip;
        let mouseEvent = mouse(el);
        let timeLevel = dataFormat.getTimeLevel(that.config.xAxis.timeLevel);
        let config = that.config;
        let x0 = that.xAxis.scale.invert(mouseEvent[0]);
        let xLevel = timeLevel(x0).getTime();

        let bisectDate = bisector((d,x) => {return d.timestamp -x }).right;
        let tooltip = config.tooltip.el;

        let selectedData = that.config.data.length > 0 ? that.config.chartData.reduce((a,b) => {
            return Math.abs(b[config.xAxis.dimension] - xLevel) < Math.abs(a[config.xAxis.dimension] - xLevel) ? b : a;
        }):null; //bisectDate(that.config.data, xLevel); //that.config.data.find((d) =>  d[that.config.xAxis.dimension]== xLevel);
       
        Object.keys(selectedData).forEach((item) => selectedData[item] == null && delete selectedData[item]);

        if(selectedData){
      
            let showTooltip = false;
            config.measures.map((m,mi) => { showTooltip = (selectedData[m] != null) || showTooltip});
            // config.measures.map((m,mi) => { showTooltip = (selectedData[m] != null) || showTooltip});

            if(!showTooltip) {
                return 
            }
            // console.log(selectedData)
            let cx = that.xAxis.scale(selectedData[that.config.xAxis.dimension]);
           
            config.filteredMeasures.map((m,mi) => { 
                let marker = Object.values(config.markers).find(item => item.measure === m);
                if(!marker.showTooltip && selectedData[m] != null){
                    that.svg.selectAll(".marker-hl-item")
                    .filter(d=>{ return d === m })
                    .attr("cx",cx)
                    .attr("cy", that.config.yAxis2.show && m == that.config.yAxis2.measure?that.yAxis2.scale(selectedData[m]):that.yAxis.scale(selectedData[m]) )
                    .attr("r",10)
                    .attr("fill",that.config.lines[mi].color ? `url(#grad-${textFormat.formatSelector(m)})` : config.color.scale(m) )
                    .attr("stroke",that.config.markers[mi].stroke || (that.config.lines[mi].color ? `url(#grad-${textFormat.formatSelector(m)})` : config.color.scale(m) ))
                    .style("opacity", 1)
                    .attr("fill-opacity", 0.5);
                }
            });

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
                    xPos = (cx-elW/2)+"px";
            }

            yPos = (that.yAxis.scale.range()[1] + config.tooltip.offset.y) - 40+"px";

            if(config.markersTooltipCallback!=null && !config.tooltip.show){
                selectedData['source'] = 'markersTooltip';
                config.tooltip.tooltip.update(config, {xPos, yPos}, selectedData)     
            }            
            if(config.tooltip.show){
                config.tooltip.tooltip.update(config, {xPos, yPos}, selectedData)
            }
        }
    
    }

    highlightTooltipMouseOver(el, that, d,markerIndex) {
        // console.log("click event from funcction tooltip trigered", el,that,d); 

        that.config.events.tooltip.active = true;
        that.config.markerTooltip.tooltip.active = true
        // that.config.markerTooltip.show?that.config.markerTooltip.tooltip.active = true:that.config.events.tooltip.active = true;
        let selectData = d;
        let prevTooltip = that.tooltip;
        let mouseEvent = mouse(el);
        let timeLevel = dataFormat.getTimeLevel(that.config.xAxis.timeLevel);
        let config = that.config;
        let x0 = that.xAxis.scale.invert(mouseEvent[0]);
        let xLevel = timeLevel(x0).getTime();

        let tooltip = config.markerTooltip.show?config.markerTooltip.tooltip.el:config.events.tooltip.el;
        let marker = Object.values(that.config.markers).find(item => item.measure === markerIndex);

        let bisectDate = bisector((d, x) => { return d.timestamp - x }).right;

        if(config.defaultDataHighlighted){
            config.measures.map((m,mi) => {
            that.svg.select(`#markers-group-${textFormat.formatSelector(m)}`)
                        .selectAll(".marker-item")
                        .filter(m=>{ return d===m } )
                        .style("opacity", 1);
            });
            config.keepMarkerHighlighted = true;
        } 

        if (selectData != undefined) {
            let cx;

            if(config.markerTooltip.show){
                cx = that.xAxis.scale(selectData[that.config.xAxis.dimension]);
            }
            else{
                cx = that.xAxis.scale(selectData[that.config.events.dimensions[0]]);
            }
            // let starttimee = that.xAxis.scale(selectData[that.config.events.dimensions[0]]);
            // let endtimee = that.xAxis.scale(selectData[that.config.events.dimensions[1]])

            // let cx = starttimee;
            // let cx = that.xAxis.scale(selectData[that.config.xAxis.dimension]);
            // let cx = starttimee + (endtimee - starttimee)/2
            
            // that.svg.selectAll(".marker-hl-item")
            //         .attr("cx",cx)
            //         .attr("cy", (m) => m == that.config.yAxis2.measure?that.yAxis2.scale(selectData[m]):that.yAxis.scale(selectData[m]) )
            //         .attr("r",10)
            //         .attr("fill",(m) => that.config.color.scale(m))
            //         .attr("stroke",(m,mi) => that.config.markers[mi].stroke || that.config.color.scale(m))
            //         .style("opacity",1)
            //         .attr("fill-opacity", 0.5);
                    if(config.measures.length == 1){
                        that.svg.selectAll(".marker-hl-item")
                        .filter(m=>{ return d[m] != null && m === markerIndex } )
                        .attr("cx",cx)
                        .attr("cy", (m) => that.config.yAxis2.show && m == that.config.yAxis2.measure?that.yAxis2.scale(selectData[m]):that.yAxis.scale(selectData[m]) )
                        .attr("r",10)
                        .attr("fill",(m, mi) => that.config.lines[mi].color || that.config.color.scale(m) )
                        .attr("stroke",(m,mi) => that.config.markers[mi].stroke || (that.config.lines[mi].color))
                        .style("opacity", 1)
                        .attr("fill-opacity", 0.5);
                    }else{ //if more than one marker-item need to be highlighted, like we are doing in kcc new designs from linechart.
                        this.svg.select(`#markers-hl-group-${config.cont.id}`)
                        .selectAll(".marker-hl-item")                        
                        .attr("cx", that.xAxis.scale(d[config.xAxis.dimension]))
                        .attr("cy",(m) => config.yAxis2.show && m == config.yAxis2.measure?this.yAxis2.scale(selectData[m]):this.yAxis.scale(selectData[m]))
                        .attr("r",10)
                        .attr("class","marker-hl-item")
                        .attr("fill",(m, mi) => that.config.lines[mi].color || that.config.color.scale(m) )
                        .attr("stroke",(m,mi) => that.config.markers[mi].stroke || (that.config.lines[mi].color))
                        .style("opacity", 1)
                        .attr("fill-opacity", 0.7);
                    }
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

   
    mouseOut(el,that){
        // console.log('normal mouseout');
        that.tooltip.style("display","none");
        that.svg.selectAll(".marker-hl-item").style("opacity",0);
        that.svg.select(`#hl-line-${that.config.cont.id}`).style("opacity",0);   
    }
    
    highlightMouseOut(el,that,d,markerIndex){
        // console.log('highlight mouseout')
         // If we want to keep marker highlighted till user hover next marker.....
        if(this.config.keepMarkerHighlighted){
            // let marker = Object.values(that.config.markers).find(item => item.measure === markerIndex);
            that.config.measures.map((m,mi) => {
            that.svg.select(`#markers-group-${textFormat.formatSelector(m)}`)
            .selectAll(".marker-item")
            .filter(m=>{ return d!=m } )
            .style("opacity", 0.5);
            });
            this.config.keepMarkerHighlighted = false;
            return;
        }
        
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
        config.chartData = config.data;
        // console.log(config.chart.id, config.chartData)
        let that = this;

        if(config.ignoreZeroes){
            config.filteredMeasures = config.measures.filter((m) => {
                return config.chartData.map(d =>  d[m]).some(v => v)
            })
        } 

        this.updateDomains(config.chartData);

        //console.log('before toupdate', config.chartData)
        //if(config.toUpdate){
            config.chartData = (config.newData && config.newData.length > 0) ? config.chartData.concat(config.newData.filter(d=>d.time.getTime() >= config.xAxis.domain[0].getTime() && d.time.getTime() <= config.xAxis.domain[1].getTime())) : config.chartData
            config.chartData = config.chartData.sort((a,b) => {return a[config.xAxis.dimension] - b[config.xAxis.dimension]} )
            
            //console.log(config.chart.id, config.chartData, config.newData)

            config.chartData = Object.values(config.chartData.reduce((a, current) => {
                let time = current[config.xAxis.dimension].getTime()
                if (a[time]) {
                  if (a[time][config.measures[0]] < current[config.measures[0]]) a[time] = current
                  if(!a[time][config.measures[0]]) a[time] = current
                } else {
                    a[time] = current
                }
                return a;
            }, {}));

            //console.log('after toupdate', config.chartData)
        //}

        this.xAxis = this.getAxis("xAxis");        
        this.yAxis = this.getAxis("yAxis"); 
        this.colorScale = this.getAxis("color");
        this.config.color.scale = this.colorScale.scale;

        if(config.activityIntensity.show) this.config.activityIntensity.colorScale = this.getAxis('activity');

        if (config.yAxis2.show) this.yAxis2 = this.getAxis("yAxis2"); 
        config.markers = [...defaults.multiline.markers,...config.markers];
        if (config.xAxis.show) this.svg.select("#x-axis").call(this.xAxis.axis.tickFormat(config.xAxis.locale === 'en-US'?config.xAxis.localeFormat:config.xAxis.localeFormat.format(config.xAxis.ticks.text.timeFormat)).tickValues(config.xAxis.ticks.text.tickValues));
        // if (config.yAxis.show) this.svg.select("#y-axis").call(this.yAxis.axis.ticks(config.yAxis.ticks.number).tickValues(config.yAxis.ticks.values));
        if (config.yAxis.show) this.svg.select("#y-axis").call(this.yAxis.axis.tickFormat(format(config.yAxis.ticks.tickFormat)).ticks(config.yAxis.ticks.number).tickValues(config.yAxis.ticks.values)); // We need to remove decimal values from y-axis ticks, so we are taking timeformat from user and formatting the decimals.
        if (config.yAxis2.show) this.svg.select("#y-axis2").call(this.yAxis2.axis.ticks(config.yAxis2.ticks.number).tickValues(config.yAxis2.ticks.values));
        this.flatLine = generator.flatLine(this.xAxis.scale,config.xAxis.dimension,config.display.size.height);
        
        // config.lines.measures = config.lines.filter(d=>d.show).map(d=>d.measure)
        this.updateGenerators();
        
        this.svg.select("#y-axis").selectAll(".tick line")
        .attr("x1",0)
        .attr("x2",config.display.size.width-config.display.margin.left-config.display.margin.right);

        axisFormat.formatAxes(config);
            
        if(config.chartData.length == 0 && !config.showReferencesLines || config.filteredMeasures.length === 0 && !config.showReferencesLines){
            if(config.yAxis.hideWhenNoData) this.svg.select("#y-axis").remove() // option to remove y-axis when there is no data
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
        }  else {
            this.svg.selectAll("#no-data").remove()
        }

        this.svg.select(`#markers-hl-group-${config.cont.id}`)
                        .selectAll(".marker-hl-item")
                        .data(config.measures)
                        .enter().append("circle")
                        .attr("class","marker-hl-item")
                        .attr("r",0);
                        
        let markersGroup = this.svg.select("#markers-group");
        markersGroup.selectAll("g").data(config.measures).enter().append("g").attr("id",(d) =>{return `markers-group-${textFormat.formatSelector(d)}`});
        markersGroup.selectAll("g").data(config.measures).exit().remove();

        
        if(config.segmentData != undefined && config.segments.show){
            let segmentsGroup = this.svg.select(`#segments-group-${config.cont.id}`);
            segmentsGroup.selectAll("g").data(config.segments.measures).enter().append("g").attr("id",(d) =>{return `segments-group-${textFormat.formatSelector(d.name)}`});
            segmentsGroup.selectAll("g").data(config.segments.measures).exit().remove();
                
            config.segments.measures.map((s) => {
                segmentsGroup.select(`#segments-group-${textFormat.formatSelector(s.name)}`).selectAll(".segment-item").data(config.segmentData).enter().append("line").attr("class","segment-item");
                segmentsGroup.select(`#segments-group-${textFormat.formatSelector(s.name)}`).selectAll(".segment-item").data(config.segmentData).exit().remove();

                segmentsGroup.select(`#segments-group-${textFormat.formatSelector(s.name)}`).selectAll(".segment-item")
                            .attr("x1",(d) => this.xAxis.scale(d[config.segments.dimensions[0]]))
                            .attr("y1",(d) => this.yAxis.scale(d[s.name]))
                            .attr("x2",(d) => this.xAxis.scale(d[config.segments.dimensions[1]]))
                            .attr("y2",(d) => this.yAxis.scale(d[s.name]))
                            .attr("data-attrs",function(d,di){return elementFormat.applyAttrs(select(this),s.attrs);})
                            ;

            })
        }
        
          // Added code to show rectangles bars for high activity intensity regions 
        if(config.activityIntensity != undefined && config.activityIntensity.show && config.activityData != undefined){

            let activityIntensityGroup = this.svg.select(`#activityIntensity-group-${config.cont.id}`);

            activityIntensityGroup.selectAll("g").data([config.activityIntensity.measure]).enter().append("g").attr("id",(d) =>{return `activityIntensity-group-${textFormat.formatSelector(d.name)}`});
            activityIntensityGroup.selectAll("g").data([config.activityIntensity.measure]).exit().remove();
    
            if(config.activityIntensity.measure.type == "rect"){
            // console.log('activity intensity',config);
            activityIntensityGroup.select(`#activityIntensity-group-${textFormat.formatSelector(config.activityIntensity.measure.name)}`).selectAll(".activityIntensity-item").data(config.activityData).enter().append("rect").attr("class","activityIntensity-item");
            activityIntensityGroup.select(`#activityIntensity-group-${textFormat.formatSelector(config.activityIntensity.measure.name)}`).selectAll(".activityIntensity-item").data(config.activityData).exit().remove();

            activityIntensityGroup.select(`#activityIntensity-group-${textFormat.formatSelector(config.activityIntensity.measure.name)}`).selectAll(".activityIntensity-item")
  
                    .attr("x",(d) => this.xAxis.scale(d[config.activityIntensity.dimensions[0]]) )
                    .attr("y",(d) => config.display.margin.top)
                    .attr("width",(d) => this.xAxis.scale(d[config.activityIntensity.dimensions[1]]) - this.xAxis.scale(d[config.activityIntensity.dimensions[0]]))
                    .attr("height",config.display.size.height-config.display.margin.bottom-config.display.margin.top)
                    .attr("data-attrs",function(d,di){return elementFormat.applyAttrs(select(this),config.activityIntensity.measure.attrs);})
                    .attr("fill",(d,di)=>config.activityIntensity.colorScale.scale(d[config.activityIntensity.measure.name])|| config.activityIntensity.attrs.fill);
            }
        }

        if(config.eventData != undefined && config.events.show){

            let eventsGroup = this.svg.select(`#events-group-${config.cont.id}`);

            eventsGroup.selectAll("g").data(config.events.measures).enter().append("g").attr("id",(d) =>{return `events-group-${textFormat.formatSelector(d.name)}`});
            eventsGroup.selectAll("g").data(config.events.measures).exit().remove();
            config.events.measures.map((s) => {
                if(s.type == "range"){
                eventsGroup.select(`#events-group-${textFormat.formatSelector(s.name)}`).selectAll(".event-item").data(config.eventData).enter().append("rect").attr("class","event-item");
                eventsGroup.select(`#events-group-${textFormat.formatSelector(s.name)}`).selectAll(".event-item").data(config.eventData).exit().remove();

                eventsGroup.select(`#events-group-${textFormat.formatSelector(s.name)}`).selectAll(".event-item")
                            .attr("x",(d) => this.xAxis.scale(d[config.events.dimensions[0]]))
                            .attr("y",(d) => config.display.size.height  - config.display.margin.bottom  - s.attrs.height/2 - 2)
                            .attr("width",(d) => Math.max(2,this.xAxis.scale(d[config.events.dimensions[1]]) - this.xAxis.scale(d[config.events.dimensions[0]]))) // keeping width minimum as 2 in case startTime and endTime come as same.
                            .attr("data-attrs",function(d,di){return elementFormat.applyAttrs(select(this),s.attrs);})
                            .on("click", function (d) { that.highlightTooltipMouseOver(this, that, d);})
                            .on("mouseout", function (d) { that.highlightMouseOut(this, that,d); });
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
        
        // if (config.eventData != undefined){
        //     let addeventsGroup = this.svg.select(`#highevents-group-${config.cont.id}`);
        //     addeventsGroup.selectAll("g").data(config.events.highlight).enter().append("g").attr("id", (d) => { return `highevents-group-${textFormat.formatSelector(config.cont.id)}` });
        //     addeventsGroup.selectAll("g").data(config.events.highlight).exit().remove();

        //     this.svg.select(`#gradients-group`).selectAll(`.grad-${textFormat.formatSelector(config.cont.id)}`)
        //         .data(config.eventData).enter().append("linearGradient")
        //         .attr("class",`grad-${textFormat.formatSelector(config.cont.id)}`)
        //         .attr("id",`grad-${textFormat.formatSelector(config.cont.id)}`);

        //     this.svg.select(`#gradients-group`).selectAll(`.grad-${textFormat.formatSelector(config.cont.id)}`)
        //         .data(config.events.highlight).exit().remove();

        //     this.svg.select(`#gradients-group`).selectAll(`.grad-${textFormat.formatSelector(config.cont.id)}`)
        //         .attr("x1",0)
        //         .attr("y1",config.display.size.height)
        //         .attr("x2",0)
        //         .attr("y2",config.display.margin.top)
        //         .attr("gradientUnits", "userSpaceOnUse");                      
        //         this.svg.select(`#gradients-group`).selectAll(`.grad-${textFormat.formatSelector(config.cont.id)}`)
        //         .append("stop")
        //         .attr("offset", "0%")
        //         .attr("stop-color", "#ffffff")
        //         .attr("stop-opacity", 0.5);
        //         this.svg.select(`#gradients-group`).selectAll(`.grad-${textFormat.formatSelector(config.cont.id)}`)
        //         .append("stop")
        //         .attr("offset", "100%")
        //         .attr("stop-color", "#ff7625")
        //         .attr("stop-opacity", 1);

        //     config.events.highlight.map((s) => {
        //         if (s.type == "highlightrect" && s.show) {

        //             addeventsGroup.select(`#highevents-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".highevents-item").data(config.eventData).enter().append("rect").attr("class", "highevents-item");
        //             addeventsGroup.select(`#highevents-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".highevents-item").data(config.eventData).exit().remove();
        
        //             addeventsGroup.select(`#highevents-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".highevents-item")
        //                 .attr("x", (d) => this.xAxis.scale(d[config.events.dimensions[0]]))
        //                 .attr("y", (d) => config.display.margin.top)
        //                 .attr("width", (d) => this.xAxis.scale(d[config.events.dimensions[1]]) - this.xAxis.scale(d[config.events.dimensions[0]]))
        //                 .attr("height",config.display.size.height - config.display.margin.top-config.display.margin.bottom)
        //                 .attr("fill",`url(#grad-${textFormat.formatSelector(config.cont.id)})`)
        //                 .attr("data-attrs", function (d, di) { return elementFormat.applyAttrs(select(this), s.attrs); })
        //             ;
        //         }
        //     })
        // }
        if(config.references ){

            this.svg.select(`#references-group-vertical-${config.cont.id}`)
            .selectAll("line").data(config.references.filter((p) => p.shape=="vertical")).enter().append("line")

            this.svg.select(`#references-group-vertical-${config.cont.id}`)
                .selectAll("line").data(config.references.filter((p) => p.shape=="vertical")).exit().remove();
            this.svg.select(`#references-group-vertical-${config.cont.id}`)
                .selectAll("line").data(config.references.filter((p) => p.shape=="vertical"))           
                .attr("y1",this.yAxis.scale.range()[0])
                .attr("x1", (d) => this.xAxis.scale(dataFormat.adjustTZValue(d.value, config.tzOffset)))
                .attr("y2",this.yAxis.scale.range()[1])
                .attr("x2", (d) => this.xAxis.scale(dataFormat.adjustTZValue(d.value, config.tzOffset)))
                .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),{...defaults.line,...d.line});})
                .attr("fill",(d)=>d.line.fill)
                .attr("offset", (d)=>d.line.offset)
                .attr("stop-opacity", (d)=>d.line.opacity);
                
            this.svg.select(`#references-group-vertical-${config.cont.id}`)
                .selectAll("text").data(config.references.filter((p) => p.shape=="vertical")).enter().append("text")

            this.svg.select(`#references-group-vertical-${config.cont.id}`)
                .selectAll("text").data(config.references.filter((p) => p.shape=="vertical")).exit().remove();
            this.svg.select(`#references-group-vertical-${config.cont.id}`)
                .selectAll("text").data(config.references.filter((p) => p.shape=="vertical"))           
                .attr("y",this.yAxis.scale.range()[1])
                .attr("x", (d) => this.xAxis.scale(dataFormat.adjustTZValue(d.value, config.tzOffset)) - 2)
                .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this), {...defaults.text,...d.text});})
                .attr("fill",(d) => d.line.fill)
                .attr("offset", (d)=>d.line.offset)
                .attr("stop-opacity", (d)=>d.line.opacity)
                .text((d) => d.name)

            this.svg.select(`#references-group-horizontal-${config.cont.id}`)
            .selectAll("line").data(config.references.filter((p) => p.shape=="horizontal")).enter().append("line")

            this.svg.select(`#references-group-horizontal-${config.cont.id}`)
                .selectAll("line").data(config.references.filter((p) => p.shape=="horizontal")).exit().remove();
            this.svg.select(`#references-group-horizontal-${config.cont.id}`)
                .selectAll("line").data(config.references.filter((p) => p.shape=="horizontal"))           
                .attr("x1",this.xAxis.scale.range()[0])
                .attr("y1", (d) => this.yAxis.scale(d.value))
                .attr("x2",this.xAxis.scale.range()[1])
                .attr("y2",(d) => this.yAxis.scale(d.value))
                .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),{...defaults.line,...d.line});})
                .attr("fill",(d)=>d.line.fill)
                .attr("offset", (d)=>d.line.offset)
                .attr("stop-opacity", (d)=>d.line.opacity);
                
            this.svg.select(`#references-group-horizontal-${config.cont.id}`)
                .selectAll("text").data(config.references.filter((p) => p.shape=="horizontal")).enter().append("text")

            this.svg.select(`#references-group-horizontal-${config.cont.id}`)
                .selectAll("text").data(config.references.filter((p) => p.shape=="horizontal")).exit().remove();
            this.svg.select(`#references-group-horizontal-${config.cont.id}`)
                .selectAll("text").data(config.references.filter((p) => p.shape=="horizontal"))           
                .attr("x",this.xAxis.scale.range()[1])
                .attr("y", (d) => this.yAxis.scale(d.value) - 2)
                .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this), {...defaults.text,...d.text});})
                .attr("fill",(d) => d.line.fill)
                .attr("offset", (d)=>d.line.offset)
                .attr("stop-opacity", (d)=>d.line.opacity)
                .text((d) => d.name)

            config.references.map((m,mi) => {
                if (m.shape=="area"){
   
                    this.svg.select(`#references-group-vertical-${config.cont.id}`)
                    .selectAll("rect").data(config.references.filter((p) => p.shape=="area")).enter().append("rect")
    
                    this.svg.select(`#references-group-vertical-${config.cont.id}`)
                        .selectAll("rect").data(config.references.filter((p) => p.shape=="area")).exit().remove();
                    this.svg.select(`#references-group-vertical-${config.cont.id}`).selectAll("rect").data(config.references.filter((p) => p.shape=="area"))
                    .attr("x",0)
                    .attr("y",(d)=>this.yAxis.scale(d.value2))
                    .attr("width",config.display.size.width)
                    .attr("height",(d)=>this.yAxis.scale(d.value1) - this.yAxis.scale(d.value2))
                    .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),{...config.area,...d.attrs});})
                    .attr("fill",(d)=>d.attrs.fill)
                    .attr("offset", (d)=>d.attrs.offset)
                    .attr("stop-opacity", (d)=>d.attrs.opacity);
                }
            })       
        }

        config.filteredData = {}
        config.measures.map((m,mi) => {
            config.markers[mi] = {...defaults.markers[mi],...circleConfig,...config.markers[mi]};
            config.lines[mi] = {...defaults.line,...config.lines[mi]};
            config.filteredData[m] = config.chartData.filter((d) => d[m] != null)
            let data = config.lines[mi].ignoreNulls ? config.filteredData[m] : config.chartData
            
            //Highlighting the default data (last data)
            if(config.defaultDataHighlighted){
                let defaultSelectedData = config.filteredData[m].slice(-1);
                    defaultSelectedData = Object.assign({}, ...defaultSelectedData );
                if (defaultSelectedData){
                    this.svg.select(`#markers-hl-group-${config.cont.id}`)
                        .selectAll(".marker-hl-item")
                        .attr("cx", that.xAxis.scale(defaultSelectedData[config.xAxis.dimension]))
                        .attr("cy",(m) => config.yAxis2.show && m == config.yAxis2.measure?this.yAxis2.scale(defaultSelectedData[m]):this.yAxis.scale(defaultSelectedData[m]))
                        .attr("r",10)
                        .attr("class","marker-hl-item")
                        .attr("fill",(m) => that.config.color.scale(m))
                        .attr("stroke",(m,mi) => that.config.markers[mi].stroke || that.config.color.scale(m))
                        .style("opacity", 1)
                        .attr("fill-opacity", 0.7);
                }
            }
                
            this.svg.select(`#gradients-group`).selectAll(`.grad-${textFormat.formatSelector(m)}`)
                .data([m]).enter().append("linearGradient")
                .attr("class",`grad-${textFormat.formatSelector(m)}`)
                .attr("id",`grad-${textFormat.formatSelector(m)}`);

            this.svg.select(`#gradients-group`).selectAll(`.grad-${textFormat.formatSelector(m)}`)
                .data([m]).exit().remove();
            
            if (config.lines[mi].color) {

                let gradientData = []
                let colors = config.color.scale.range()
                config.chartData.forEach((d,i)=>{
                    let key = config.lines[mi].color
                    let color = config.color.scale(d[key])
                    let nextCategory = config.chartData[i+1] ? config.chartData[i+1][key] : d[key]
                    let x =  colors.indexOf(color)
                    gradientData.push({
                        offset: calcOffset(d),
                        opacity: 1,
                        color: colors[x]
                    })
                    if(d[key] !== nextCategory){
                        gradientData.push({
                            offset: calcOffset(d),
                            opacity: 1,
                            color: colors[1-x]
                        })
                    }
                })

                function calcOffset(d){
                    return that.xAxis.scale(d[that.config.xAxis.dimension]) / that.xAxis.scale(config.chartData[config.chartData.length-1][that.config.xAxis.dimension])
                }

                this.svg.select(`#gradients-group`).selectAll(`.grad-${textFormat.formatSelector(m)}`)
                                                    .attr("gradientUnits", "userSpaceOnUse")                      
                                                    .attr("x1",0)
                                                    .attr("y1",config.display.size.height)
                                                    .attr("x2",config.display.size.width)
                                                    .attr("y2",config.display.margin.top)
                                                    .selectAll("stop")                        
                                                    .data(gradientData)                    
                                                    .enter().append("stop")            
                                                    .attr("offset", function(d) { return d.offset; })
                                                    .attr("stop-opacity", function(d) { return d.opacity; })    
                                                    .attr("stop-color", function(d) { return d.color; });
            }
            
// Show data labels at top of chart values
            if(config.dataLabels[mi] && config.dataLabels[mi].show){
                config.filteredData[m] = config.chartData.filter((d) => d[m] != null)
                if(config.dataLabels[mi].circle){

                this.svg.select(`#data-group-labels-${config.cont.id}`)
                .selectAll(`.dataLabel-${textFormat.formatSelector(m)}`).data(config.filteredData[m]).enter().append("circle").attr("class",`dataLabel-${textFormat.formatSelector(m)}`);

                this.svg.select(`#data-group-labels-${config.cont.id}`)
                    .selectAll(`.dataLabel-${textFormat.formatSelector(m)}`).data(config.filteredData[m]).exit().remove();

                this.svg.select(`#data-group-labels-${config.cont.id}`)
                    .selectAll(`.dataLabel-${textFormat.formatSelector(m)}`).data(config.filteredData[m])
                    .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                    .attr("cy",(d) => config.yAxis2.show && m == config.yAxis2.measure?this.yAxis2.scale(d[m]):this.yAxis.scale(d[m]) - config.dataLabels[mi].circle.yPos)
                    .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this), {...circleConfig,...config.dataLabels[mi].circle});})
                }

                if(config.dataLabels[mi].rect){

                let iTextLength = []; // Array which contains length of words..
                this.svg.select(`#data-group-labels-${config.cont.id}`)
                    .selectAll(`.dataLabel-${textFormat.formatSelector(m)}`).data(config.filteredData[m]).enter().append("rect").attr("class",`dataLabel-${textFormat.formatSelector(m)}`);
    
                this.svg.select(`#data-group-labels-${config.cont.id}`)
                        .selectAll(`.dataLabel-${textFormat.formatSelector(m)}`).data(config.filteredData[m]).exit().remove();
    
                this.svg.select(`#data-group-labels-${config.cont.id}`)
                        .selectAll(`.dataLabel-${textFormat.formatSelector(m)}`).data(config.filteredData[m])          
                        .attr("x",(d) => iTextLength.length>0? this.xAxis.scale(d[config.xAxis.dimension]) - (iTextLength[mi]/2):this.xAxis.scale(d[config.xAxis.dimension]))
                        .attr("y",(d) => config.yAxis2.show && m == config.yAxis2.measure?this.yAxis2.scale(d[m]):this.yAxis.scale(d[m]) - config.dataLabels[mi].rect.yPos)
                        .attr("rx",config.dataLabels[mi].rect ?config.dataLabels[mi].rect.rx :10)
                        .attr("ry",config.dataLabels[mi].rect ?config.dataLabels[mi].rect.ry :10)
                        .attr("width", (d,mi) => iTextLength.length>0? iTextLength[mi] + 5 :30)
                        .attr("height",config.dataLabels[mi].rect ? config.dataLabels[mi].rect.height : 15)
                        .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this), {...rectConfig,...config.dataLabels[mi].rect});})
                }

                this.svg.select(`#data-group-labels-${config.cont.id}`)
                    .selectAll(`.dataLabels-${textFormat.formatSelector(m)}`).data(config.filteredData[m]).enter().append("text").attr("class",`dataLabels-${textFormat.formatSelector(m)}`);

                this.svg.select(`#data-group-labels-${config.cont.id}`)
                    .selectAll(`.dataLabels-${textFormat.formatSelector(m)}`).data(config.filteredData[m]).exit().remove();

                this.svg.select(`#data-group-labels-${config.cont.id}`)
                    .selectAll(`.dataLabels-${textFormat.formatSelector(m)}`).data(config.filteredData[m])
                    .attr("x",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                    .attr("y",(d) => config.yAxis2.show && m == config.yAxis2.measure?this.yAxis2.scale(d[m]):this.yAxis.scale(d[m]) - config.dataLabels[mi].text.yPos)
                    .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this), {...defaults.text,...config.dataLabels[mi].text});})
                    .attr("fill",(d) => config.dataLabels[mi].text?config.dataLabels[mi].text.fill: config.color.scale(m))
                    .attr('text-anchor', (d) => config.dataLabels[mi].text?config.dataLabels[mi].text['text-anchor']: 'middle')
                    .attr("font-size", (d) => config.dataLabels[mi].text ?config.dataLabels[mi].text['font-size']: "12px" )
                    .text((d) => d.status? d.status==='incomplete'?d.status:d[m] :d[m]) // In SMWT chart (hf-care), for incomplete data we need to show data labels as Incomplete.

                    let iTextLength = []; // Calculating the text length which we need to show as data labels, so we can adjust background as well...
                    this.svg.selectAll(`.dataLabels-${textFormat.formatSelector(m)}`).nodes().forEach(function(el) {
                        iTextLength.push(el.getComputedTextLength());
                    });

                this.svg.select(`#data-group-labels-${config.cont.id}`)  // Changing Background width according to text length.
                .selectAll(`.dataLabel-${textFormat.formatSelector(m)}`).data(config.filteredData[m])  
                .attr("x",(d,mi) => this.xAxis.scale(d[config.xAxis.dimension])- (iTextLength[mi]/2) -3)
                .attr("width", (d,mi) => iTextLength.length>0? iTextLength[mi] + 7 :30)

            }

            if (config.areas[mi] && config.areas[mi].show && !config.lines[mi].color) {
                this.svg.select(`#gradients-group`).selectAll(`.grad-${textFormat.formatSelector(m)}`)
                                            .attr("gradientUnits", "userSpaceOnUse")                      
                                            .attr("x1",0)
                                            .attr("y1",config.display.size.height)
                                            .attr("x2",0)
                                            .attr("y2",config.display.margin.top)
                                            .selectAll("stop")                        
                                            .data(config.areas[mi].stops)                    
                                            .enter().append("stop")            
                                            .attr("offset", function(d) { return d.offset; })    
                                            .attr("stop-opacity", function(d) { return d.opacity; })    
                                            .attr("stop-color", function(d) { return d.color; });
            }

            if (config.areas[mi] && config.areas[mi].show){
                this.svg.select(`#areas-group`).selectAll(`.area-${textFormat.formatSelector(m)}`).data([m]).enter().append("path").attr("class",`area-${textFormat.formatSelector(m)}`);
                this.svg.select(`#areas-group`).selectAll(`.area-${textFormat.formatSelector(m)}`).data([m]).exit().remove();
                this.svg.select(`#areas-group`).selectAll(`.area-${textFormat.formatSelector(m)}`)
                                                .attr("d",config.areaGenerators[mi](data))
                                                .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),{...config.area,...config.areas[mi].attrs});})
                                                .attr("fill",`url(#grad-${textFormat.formatSelector(m)})`)
                                                .attr('opacity', config.legend.clicked[textFormat.formatSelector(m)] ? 0 : config.areas[mi].attrs && config.areas[mi].attrs.opacity || 1)
            }

            if (config.lines[mi] && config.lines[mi].show){
                this.svg.select(`#lines-group`).selectAll(`.lines-${textFormat.formatSelector(m)}`).data([m]).enter().append("path").attr("class",`lines-${textFormat.formatSelector(m)}`);
                this.svg.select(`#lines-group`).selectAll(`.lines-${textFormat.formatSelector(m)}`).data([m]).exit().remove();
                this.svg.select(`#lines-group`).selectAll(`.lines-${textFormat.formatSelector(m)}`)
                .attr("d",config.lineGenerators[mi](data))
                .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),{...config.line,...config.lines[mi].attrs});})
                .attr("stroke",(d) => config.lines[mi].color ? `url(#grad-${textFormat.formatSelector(m)})` : config.color.scale(m) )
                .attr("fill",(d) => "none")
                .attr('opacity', config.legend.clicked[textFormat.formatSelector(m)] ? 0 : config.lines[mi].attrs && config.lines[mi].attrs.opacity || 1)

                config.singlePoints = []
                config.chartData.map((d,di)=>{
                    if(config.chartData[di-1] && config.chartData[di+1]){
                        if(!config.chartData[di-1][m] && d[m] && !config.chartData[di+1][m]){
                            config.singlePoints.push(d)
                        }
                    }
                })
        
                markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item-single").data(config.singlePoints).enter().append("circle").attr("class","marker-item-single");
                markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item-single").data(config.singlePoints).exit().remove();
    
                markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item-single")
                            .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                            .attr("cy",(d) => config.yAxis2.show && m == config.yAxis2.measure?this.yAxis2.scale(d[m]):this.yAxis.scale(d[m]))
                            .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.markers[mi]);})
                            .attr("r", config.lines[mi]['stroke-width'])
                            .attr("fill",(d) => config.lines[mi].color ? `url(#grad-${textFormat.formatSelector(m)})` : config.color.scale(m) )
                            .attr("stroke",(d) => config.lines[mi].color ? `url(#grad-${textFormat.formatSelector(m)})` : config.color.scale(m) )
                            .attr('opacity', config.legend.clicked[textFormat.formatSelector(m)] ? 0 : config.markers[mi].attrs && config.markers[mi].attrs.opacity || 1)
             
            }
    
            if (config.markers[mi].show) {
                if(config.markers[mi].shape == "custom"){ 
          
                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item").data(config.filteredData[m]).enter().append("g").attr("class","marker-item");
                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item").data(config.filteredData[m]).exit().remove();

                    config.markers[mi].rect.map(r=>{

                        markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item")
                            .filter(d=>d[config.markers[mi].dimension] === r.value)
                            .append('rect')
                            .attr('class', `marker-item-${textFormat.formatSelector(r.value)}`)
                            .attr("x",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                            .attr("y",(d) => config.yAxis2.show && m == config.yAxis2.measure?this.yAxis2.scale(d[m]):this.yAxis.scale(d[m]))
                            .attr("fill",(d) => config.lines[mi].color ? `url(#grad-${textFormat.formatSelector(m)})` : config.color.scale(m) )
                            .attr("stroke",(d) => config.lines[mi].color ? `url(#grad-${textFormat.formatSelector(m)})` : config.color.scale(m) )
                            .attr('width', config.markers[mi].r*2)
                            .attr('height', config.markers[mi].r*2)
                            .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),r.attrs);})
                            .attr('opacity', config.legend.clicked[textFormat.formatSelector(r.value)] ? 0 : r.attrs && r.attrs.opacity || 1)
                    
                    })

                    config.markers[mi].circle.map(c=>{

                        markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item")
                            .filter(d=>d[config.markers[mi].dimension] === c.value)
                            .append('circle')
                            .attr('class', `marker-item-${textFormat.formatSelector(c.value)}`)
                            .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                            .attr("cy",(d) => config.yAxis2.show && m == config.yAxis2.measure?this.yAxis2.scale(d[m]):this.yAxis.scale(d[m]))
                            .attr("fill",(d) => config.lines[mi].color ? `url(#grad-${textFormat.formatSelector(m)})` : config.color.scale(m) )
                            .attr("stroke",(d) => config.lines[mi].color ? `url(#grad-${textFormat.formatSelector(m)})` : config.color.scale(m) )
                            .attr('r', config.markers[mi].r)
                            .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),c.attrs);})
                            .attr('opacity', config.legend.clicked[textFormat.formatSelector(c.value)] ? 0 : c.attrs && c.attrs.opacity || 1)

                    })            
                }

                if(config.markers[mi].shape == "circle"){

                markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item").data(config.filteredData[m]).enter().append("circle").attr("class","marker-item");
                markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item").data(config.filteredData[m]).exit().remove();

                markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item")
                            // .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                            // .attr("cy",(d) => config.display.size.height)
                            // .transition(easeBounce).duration(1000)
                            .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                            .attr("cy",(d) => config.yAxis2.show && m == config.yAxis2.measure?this.yAxis2.scale(d[m]):this.yAxis.scale(d[m]))
                            .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.markers[mi]);})
                            .attr("fill",(d) => config.lines[mi].color ? `url(#grad-${textFormat.formatSelector(m)})` : config.color.scale(m) )
                            .attr("stroke",(d) => config.lines[mi].color ? `url(#grad-${textFormat.formatSelector(m)})` : config.color.scale(m) )
                            .attr('opacity', config.legend.clicked[textFormat.formatSelector(m)] ? 0 : config.markers[mi].attrs && config.markers[mi].attrs.opacity || 1)
                        
                                if(config.markers[mi].showTooltip){

                                    // console.log('inside markers tooltip')
                                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item")
                                    .style("pointer-events","all")
                                    .raise()
                                    .on("mouseover",function(d) {that.markerMouseOver(d,that,m);})
                                    .on("mousemove",function(d) {that.markerMouseOver(d,that,m);})
                                    .on("mouseout",function(d) {that.markerMouseOut(d,that,m);});  
                                }
                                if(config.markerTooltip.show){
                                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item")
                                    .on("click", function (d) { that.highlightTooltipMouseOver(this, that, d,m);})
                                    .on("mouseout", function (d) { that.highlightMouseOut(this, that,d,m); });
                                }
                            ;
                }
                
                if(config.markers[mi].shape == "double-circle"){

                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item-dual").data(config.filteredData[m]).enter().append("circle").attr("class","marker-item-dual");
                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item-dual").data(config.filteredData[m]).exit().remove();
    
                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item-dual")
                                // .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                                // .attr("cy",(d) => config.display.size.height)
                                // .transition(easeBounce).duration(1000)
                                .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                                .attr("cy",(d) => config.yAxis2.show && m == config.yAxis2.measure?this.yAxis2.scale(d[m]):this.yAxis.scale(d[m]))
                                .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.markers[mi]);})
                                .attr("fill",(d) => config.lines[mi].color ? `url(#grad-${textFormat.formatSelector(m)})` : config.color.scale(m) )
                                .attr("stroke",(d) => config.lines[mi].color ? `url(#grad-${textFormat.formatSelector(m)})` : config.color.scale(m) )
                                .attr("r",7)
                                .attr('opacity', config.legend.clicked[textFormat.formatSelector(m)] ? 0 : config.markers[mi].attrs && config.markers[mi].attrs.opacity || 1)

                                
                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item").data(config.filteredData[m]).enter().append("circle").attr("class","marker-item");
                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item").data(config.filteredData[m]).exit().remove();
    
                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item")
                                // .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                                // .attr("cy",(d) => config.display.size.height)
                                // .transition(easeBounce).duration(1000)
                                .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                                .attr("cy",(d) => config.yAxis2.show && m == config.yAxis2.measure?this.yAxis2.scale(d[m]):this.yAxis.scale(d[m]))
                                .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.markers[mi]);})
                                .attr("fill",(d) => config.lines[mi].color ? `url(#grad-${textFormat.formatSelector(m)})` : config.color.scale(m) )
                                .attr("stroke",(d,di) => "#ffffff")
                                .attr("stroke-width",2)
                                .attr('opacity', config.legend.clicked[textFormat.formatSelector(m)] ? 0 : config.markers[mi].attrs && config.markers[mi].attrs.opacity || 1)

                                if(config.markers[mi].showTooltip){

                                    // console.log('inside markers tooltip')
                                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item")
                                    .style("pointer-events","all")
                                    .raise()
                                    .on("mouseover",function(d) {that.markerMouseOver(d,that);})
                                    .on("mousemove",function(d) {that.markerMouseOver(d,that);})
                                    .on("mouseout",function(d) {that.markerMouseOut(d,that);});  
                                }
                                if(config.markerTooltip.show){
                                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item")
                                    .style("pointer-events","all")
                                    .raise()
                                    .on("click", function (d) { that.highlightTooltipMouseOver(this, that, d,m);})
                                    .on("mouseout", function (d) { that.highlightMouseOut(this, that,d,m); });
                                }
                    }
            }
        });

        if(!config.markerTooltip.show){
            this.svg.select(`#rect-overlay-${config.cont.id}`)
                        .attr("x",config.display.margin.left)
                        .attr("y",config.display.margin.top)
                        .attr("width",config.display.size.width-config.display.margin.right-config.display.margin.left)
                        .attr("height",config.display.size.height-config.display.margin.bottom-config.display.margin.top)
                        .on("mouseover",function() {that.mouseOver(this,that);})
                        .on("mousemove",function() {that.mouseOver(this,that);})
                        .on("mouseout",function() {that.mouseOut(this,that);});  

            // because line path interaction is from rect-overlay, toggle point-events on it. need to find the measure associated with the line first and check legend clicked status.
            let measureWithLine = config.lines.map(d => d.show).indexOf(true);
            
            if(measureWithLine >= 0){
                this.svg.select(`#rect-overlay-${config.cont.id}`)
                    .style('pointer-events', config.legend.clicked[config.measures[measureWithLine]] === 1 ? 'none' : 'all')
            } 
        }         
        this.tooltipMouseOut = function(el, that) {
            let config = that.config;
            if(!config.events.tooltip.active) return null;

            config.events.tooltip.active = false 
            // console.log("Trigerring mouseout")
            function hideTooltip(){
                config.events.tooltip.el.style('display','none')
                
            }
            setTimeout(function(){
                hideTooltip()
            },3000)
            // console.log('settimeout logged out');
            

        }
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

        this.tooltipHL
                    .on("mouseover", function (d,di) { 
                        // console.log(config,'config from mouse')
                        config.events.tooltip.active = true })
                    .on("mousemove", function (d,di) { 
                        // console.log(config,'config from mouse move')
                        config.events.tooltip.active = true })
                    .on("mouseout", function () { that.tooltipMouseOut(this,that) });

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
                        
        this.svg.select(`#rect-clip-${config.cont.id}`)
                    .select("rect")
                    .attr("x",config.display.margin.left )
                    .attr("width",config.display.size.width - config.display.margin.left - config.display.margin.right)
                    .attr("y",config.display.margin.top - 50)
                    .attr("height",config.display.size.height- config.display.margin.bottom - config.display.margin.top  + 60);

    }

    initialize(){
        let config = this.config;
        this.chart = select(`#${config.chart.id}`);
        this.tooltip  = config.tooltip.el;
        this.tooltipHL  = config.events.tooltip.el;
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

        
    

        this.svg.select(`#markers-hl-group-${config.cont.id}`).append("line")
                    .attr("id",`hl-line-${config.cont.id}`)
                    .attr("class","hl-line");
        config.yAxis.el = this.svg.append("g")
                    .attr("class","y-axis axes")
                    .attr("id","y-axis")
                    .attr("transform",`translate(${config.display.margin.left},0)`);

        this.svg.append("g")
                    .attr("class","segments")
                    .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id",`segments-group-${config.cont.id}`);
        
        this.svg.append("g")
                    .attr("class","references")
                    .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id",`references-group-horizontal-${config.cont.id}`);

        this.svg.append("g")
                    .attr("class","dataLabels")
                    .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id",`data-group-labels-${config.cont.id}`);

        this.svg.append("g")
            .attr("class","references")
            .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
            .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
            .attr("id",`references-group-vertical-${config.cont.id}`);

        this.svg.append("g")
                    .attr("class","areas")
                    .attr("clip-path",`#rect-clip-${config.cont.id}`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id","areas-group");
        
        this.svg.append("g")
                    .attr("class","activityIntensity")
                    .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id",`activityIntensity-group-${config.cont.id}`);
        
        this.svg.append("g")
                    .attr("class","lines")
                    .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id","lines-group");


        this.svg.append("g")
                    .attr("class","markers")
                    .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id",`markers-hl-group-${config.cont.id}`);

        this.svg.select(`#markers-hl-group-${config.cont.id}`).append("line")
            .attr("id",`hl-line-${config.cont.id}`)
            .attr("class","hl-line");

        this.svg.append("rect")
            .attr("id",`rect-overlay-${config.cont.id}`)
            .attr("class","rect-overlay")
            .attr("fill","none")
            .style("pointer-events","all");

        this.svg.append("g")
                    .attr("class","events")
                    .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id",`events-group-${config.cont.id}`);

        this.svg.append("g")
                    .attr("class","markers")
                    .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id","markers-group");

        // this.svg.append("g")
        //             .attr("class", "highevents")
        //             .attr("clip-path", `url(#rect-clip-${config.cont.id})`)
        //             .style("-webkit-clip-path", `url(#rect-clip-${config.cont.id})`)
        //             .attr("id", `highevents-group-${config.cont.id}`);
    
    }

}

export {LineChart}; 