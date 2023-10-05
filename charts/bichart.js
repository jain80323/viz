import {select,easeBounce, timeFormat, timeMinutes,format, timeMinute, mouse, bisector} from  "d3";
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

class BIChart {
    constructor(config){
        this.config = config;
        this.initialize();
        this.update();
    }

    updateDomains(data){
        let config = this.config;
        dataFormat.adjustTZColumn('seg_start',config.tzOffset,config.chartData.data.predictions);
        dataFormat.adjustTZColumn('time',config.tzOffset,config.chartData.half_hour_data);
        dataFormat.adjustTZColumn('seg_start',config.tzOffset,config.data.data.half_hourly_bi);
        dataFormat.adjustTZColumn('seg_end',config.tzOffset,config.data.data.half_hourly_bi);
        dataFormat.adjustTZColumn('seg_end',config.tzOffset,config.chartData.data.predictions);
        if(config.xAxis.fixTimeZone) {
            config.xAxis.domain = config.xAxis.domain? dataFormat.adjustTZList(config.tzOffset,config.xAxis.domain) : dataFormat.fetchRange(config.xAxis.dimension,config.data.data.predictions);
        }
        else{
            config.xAxis.domain = config.xAxis.domain? dataFormat.adjustTime(config.tzOffset,config.xAxis.domain) : dataFormat.fetchRange(config.xAxis.dimension,config.data.data.predictions);
        }

        if(config.activityData != undefined && config.activityIntensity.show){

            dataFormat.adjustTZColumn(config.activityIntensity.dimensions[0],config.tzOffset,config.activityData);
            if(config.activityIntensity.dimensions[1]) dataFormat.adjustTZColumn(config.activityIntensity.dimensions[1],config.tzOffset,config.activityData);
        }
        if(config.eventData != undefined && config.events.show){

            if(config.events.dimensions[1]) dataFormat.adjustTZColumn(config.events.dimensions[1],config.tzOffset,config.eventData);
            dataFormat.adjustTZColumn(config.events.dimensions[0],config.tzOffset,config.eventData);
            
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

        case "activity":
            props = config.activityIntensity.color;
            return new ColorScale(props);
        
    }
    }

    mouseOver(el,that) {
        // console.log('Line appeaserd');
        let config = that.config;
        let tooltip = config.tooltip.el;
        let mouseEvent = mouse(el);
        let timeLevel = dataFormat.getTimeLevel(that.config.xAxis.timeLevel);
        let x0 = that.xAxis.scale.invert(mouseEvent[0]);
        let half_hour_data = that.config.chartData.half_hour_data
        let data = that.config.chartData.data.half_hourly_bi
        let predictions = that.config.chartData.data.predictions
  
        let elW = tooltip.node().offsetWidth;
        let selectedData = {}
        let selectedHH = {}
        let selectedPred = {}

        if(data && data.length > 0){

            let interval = (data[0]['seg_end'] - data[0]['seg_start']) / 2
            let xLevel = +timeLevel(x0).getTime() - interval;

            selectedHH = data.reduce((a,b) => {
                return Math.abs(b['seg_start'] - xLevel) <= Math.abs(a["seg_start"] - xLevel) ? b :a
            }) 
            if(selectedHH  && selectedHH.bi ) {
                selectedData = selectedHH
            }
        }
        
        if(predictions && predictions.length > 0){

            let xLevelc = +timeLevel(x0).getTime() ;

            selectedPred = predictions.reduce((a,b) => {
                return Math.abs(b['seg_start'] - xLevelc) <= Math.abs(a["seg_start"] - xLevelc) ? b :a
            })
         
            if(selectedPred && selectedPred.bi){
                for (const item in selectedPred) {
                    if(item !== 'bi' && item !== "seg_start" && item !== "seg_end"){
                        selectedData[item] = selectedPred[item]
                    }
                }
                selectedData['cont_bi'] = selectedPred["bi"]
                selectedData['cont_st'] = selectedPred["seg_start"]
                selectedData['cont_et'] = selectedPred["seg_end"]
            }
        }

        if(selectedData.bi || selectedData.cont_bi){
            let cx = that.xAxis.scale(((selectedData['seg_start'] ||selectedData['cont_st'] ).getTime() + (selectedData['seg_start'] ||selectedData['cont_st'] ).getTime())/2)  

            let xPos,yPos;
            if(cx <= config.display.margin.left + elW/2){
                    xPos = (config.display.margin.left+10)+"px";
            }
            else if(cx >=  config.display.size.width-config.display.margin.right-config.display.margin.left  - elW){
                    xPos = ((config.display.size.width - config.display.margin.right)-(elW) -10 )+"px";
            }
            else{
                    xPos = (cx-elW/2)+"px";
            }

            yPos = (that.yAxis.scale.range()[1] + config.tooltip.offset.y)+"px";
           
            if(!config.markers.showTooltip){
                    // console.log('in cirlceee')
                    that.svg.selectAll(".marker-hl-item")
                    // .filter(d=>{ return d === m })
                    .attr("cx",cx)
                    .attr("cy", that.config.yAxis2.show && m == that.config.yAxis2.measure?that.yAxis2.scale(selectedData.bi?selectedData.bi:selectedData.cont_bi):that.yAxis.scale(selectedData.bi?selectedData.bi:selectedData.cont_bi) )
                    .attr("r",config.highlightCircle?config.highlightCircle.r:10)
                    .attr("fill",config.highlightCircle?config.highlightCircle.fill:'#008ac6' )
                    .attr("stroke",config.highlightCircle?config.highlightCircle.stroke:'#FFFFFF')
                    .style("opacity", 1)
                    .attr("fill-opacity", 0.5);
            }

            if(config.tooltip.line.show){
                that.svg.select(`#hl-line-${config.cont.id}`)      
                            .attr("x1",cx)
                            .attr("x2",cx)
                            .attr("y1",config.display.margin.top)
                            .attr("y2",config.display.size.height-config.display.margin.bottom + config.tooltip.line.yOffset)
                            .attr("fill",config.tooltip.line.stroke)
                            .attr("stroke",config.tooltip.line.stroke)
                            .style("opacity",1);
            }

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

    highlightTooltipMouseOver(el, that, d,markerIndex) {
        // console.log("click event from funcction tooltip trigered", el,that,d); 

        that.config.events.tooltip.active = true;
        // that.config.markerTooltip.tooltip.active = true
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

        if (selectData != undefined) {
            let cx;
            if(config.markerTooltip.show){
                cx = that.xAxis.scale(selectData[that.config.xAxis.dimension]);
            }
            else{
                cx = that.xAxis.scale(selectData[that.config.events.dimensions[0]]);
            }
                    // if(config.measures.length == 1){
                    //     that.svg.selectAll(".marker-hl-item")
                    //     .filter(m=>{ return d[m] && m === markerIndex } )
                    //     .attr("cx",cx)
                    //     .attr("cy", (m) => that.config.yAxis2.show && m == that.config.yAxis2.measure?that.yAxis2.scale(selectData[m]):that.yAxis.scale(selectData[m]) )
                    //     .attr("r",10)
                    //     .attr("fill",(m, mi) => that.config.lines[mi].color || that.config.color.scale(m) )
                    //     .attr("stroke",(m,mi) => that.config.markers[mi].stroke || (that.config.lines[mi].color))
                    //     .style("opacity", 1)
                    //     .attr("fill-opacity", 0.5);
                    // }else{ //if more than one marker-item need to be highlighted, like we are doing in kcc new designs from linechart.
                    //     this.svg.select(`#markers-hl-group-${config.cont.id}`)
                    //     .selectAll(".marker-hl-item")
                        
                    //     .attr("cx", that.xAxis.scale(d[config.xAxis.dimension]))
                    //     .attr("cy",(m) => config.yAxis2.show && m == config.yAxis2.measure?this.yAxis2.scale(selectData[m]):this.yAxis.scale(selectData[m]))
                    //     .attr("r",10)
                    //     .attr("class","marker-hl-item")
                    //     .attr("fill",(m, mi) => that.config.lines[mi].color || that.config.color.scale(m) )
                    //     .attr("stroke",(m,mi) => that.config.markers[mi].stroke || (that.config.lines[mi].color))
                    //     .style("opacity", 1)
                    //     .attr("fill-opacity", 0.7);
                    // }
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
        }
    }

    highlightMouseOut(el,that,d,markerIndex){
        // console.log('highlight mouseout')
            setTimeout(function(){
                if(that.config.events.tooltip.active) return null;
                that.config.events.tooltip.el.selectAll("*").remove()
                that.config.events.tooltip.el.style("display", 'none' )    
            },
            5000)
        // that.svg.selectAll(".marker-hl-item").style("opacity",0);
        // that.svg.select(`#hl-line-${that.config.cont.id}`).style("opacity",0);
    }

    update(){
        let config = this.config;
        let that = this;
        config.chartData = {...config.data};
    
        config.chartData.half_hour_data = [];
        config.chartData.data.half_hourly_bi.map((d,di) => {
                // if(di > 0 && d.bi != null && config.chartData.data.half_hourly_bi[di-1].bi == null){
                //     config.chartData.half_hour_data.push({time:d.seg_start,bi:0.01 });
                // }
                config.chartData.half_hour_data.push({time:d.seg_start,bi:d.bi });
                config.chartData.half_hour_data.push({time:d.seg_end ,bi:d.bi});  
        });

        this.updateDomains(config.chartData);
        this.xAxis = this.getAxis("xAxis");        
        this.yAxis = this.getAxis("yAxis"); 
        this.colorScale = this.getAxis("color"); 
        this.config.color.scale = this.colorScale.scale;

        if(config.activityIntensity.show) this.config.activityIntensity.colorScale = this.getAxis('activity');

        if (config.xAxis.show) this.svg.select("#x-axis").call(this.xAxis.axis.tickFormat(config.xAxis.locale === 'en-US'? config.xAxis.localeFormat :config.xAxis.localeFormat.format(config.xAxis.ticks.text.timeFormat)).tickValues(config.xAxis.ticks.text.tickValues));
        if (config.yAxis.show) this.svg.select("#y-axis").call(this.yAxis.axis.ticks(config.yAxis.ticks.number));
        
        
        this.updateGenerators();

        axisFormat.formatAxes(config);

        if(config.chartData.data.half_hourly_bi.filter((d) => d.bi).length == 0 && config.chartData.data.predictions.filter((d) => d.bi).length == 0 && config.eventData === undefined ){
            if(config.yAxis.hideWhenNoData) this.svg.select("#y-axis").remove() // option to remove y-axis when there is no data
            let text = {...defaults.nodata.text,...config.nodata.text}
            config.nodata = {...defaults.nodata,...config.nodata}
            config.nodata.text = {...defaults.nodata,...config.nodata.text}
           let textMessage = this.svg.selectAll("#no-data").data([1]).enter().append("text")
                         .attr("id","no-data")
                        .attr("x",config.display.size.width/2)
                        .attr("y",config.display.size.height/2-6)
                        .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.nodata.text);})
                textMessage.append('tspan')
                        .style("font-size", "14px")
                        .style("fill", "#707070")
                        .text(config.nodata.message)
            return;
        }

        this.svg.select(`#markers-hl-group-${config.cont.id}`)
                        .selectAll(".marker-hl-item")
                        .data(config.measure)
                        .enter().append("circle")
                        .attr("class","marker-hl-item")
                        .attr("r",0);
                        
        this.svg.select(`#continous-bi-group-${config.cont.id}`).selectAll("rect")
                    .data(config.chartData.data.predictions).enter()
                    .append("rect");
        this.svg.select(`#continous-bi-group-${config.cont.id}`).selectAll("rect")
                    .data(config.chartData.data.predictions).exit()
                    .remove();

        this.svg.select(`#continous-bi-group-${config.cont.id}`).selectAll("rect")
                        .attr("x",(d) => this.xAxis.scale(d.seg_start))
                        .attr("y",(d) => this.yAxis.scale(d.bi))
                        .attr("width",(d) => this.xAxis.scale(d.seg_end) - this.xAxis.scale(d.seg_start))
                        .attr("height",(d) => this.yAxis.scale(0) - this.yAxis.scale(d.bi))
                        .attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),config.markers[0]);});

        this.svg.select(`#half-hour-bi-group-${config.cont.id}`).selectAll("path")
                    .data([1]).enter()
                    .append("path")
        this.svg.select(`#half-hour-bi-group-${config.cont.id}`).select("path").attr("d",(d) => config.bilineGenerator(config.chartData.half_hour_data))
                    .attr("fill",(d) => "none")
                    .attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),{...defaults.line,...config.line});});;


        this.svg.select(`#gradients-group`).selectAll(`.grad-${textFormat.formatSelector("bi")}`)
                    .data(["bi"]).enter().append("linearGradient")
                    .attr("class",`grad-${textFormat.formatSelector("bi")}`)
                    .attr("id",`grad-${textFormat.formatSelector("bi")}`);


        this.svg.select(`#gradients-group`).selectAll(`.grad-${textFormat.formatSelector("bi")}`)
                                .attr("gradientUnits", "userSpaceOnUse")                      
                                .attr("x1",0)
                                .attr("y1",config.display.size.height)
                                .attr("x2",0)
                                .attr("y2",config.display.margin.top)
                                .selectAll("stop")						
                                .data(config.area.stops)					
                                .enter().append("stop")			
                                .attr("offset", function(d) { return d.offset; })	
                                .attr("stop-opacity", function(d) { return d.opacity; })	
                                .attr("stop-color", function(d) { return d.color; });

        this.svg.select(`#half-hour-biarea-group-${config.cont.id}`).selectAll("path")
                    .data([1]).enter()
                    .append("path")
        this.svg.select(`#half-hour-biarea-group-${config.cont.id}`).select("path")
                    .attr("d",(d) => config.biareaGenerator(config.chartData.half_hour_data)) 
                    .attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),{...defaults.area,...config.area.attrs} );})
                    .attr("fill",`url(#grad-${textFormat.formatSelector("bi")})`)
                    .attr("stroke",(d) => "none")


        // Added code to show rectangles bars for high activity intensity regions 
        if(config.activityIntensity != undefined && config.activityIntensity.show && config.activityData != undefined){

        let activityIntensityGroup = this.svg.select(`#activityIntensity-group-${config.cont.id}`);

        activityIntensityGroup.selectAll("g").data([config.activityIntensity.measure]).enter().append("g").attr("id",(d) =>{return `activityIntensity-group-${textFormat.formatSelector(d.name)}`});
        activityIntensityGroup.selectAll("g").data([config.activityIntensity.measure]).exit().remove();
        
            if(config.activityIntensity.measure.type == "rect"){
                activityIntensityGroup.select(`#activityIntensity-group-${textFormat.formatSelector(config.activityIntensity.measure.name)}`).selectAll(".activityIntensity-item").data(config.activityData).enter().append("rect").attr("class","activityIntensity-item");
                activityIntensityGroup.select(`#activityIntensity-group-${textFormat.formatSelector(config.activityIntensity.measure.name)}`).selectAll(".activityIntensity-item").data(config.activityData).exit().remove();

                activityIntensityGroup.select(`#activityIntensity-group-${textFormat.formatSelector(config.activityIntensity.measure.name)}`).selectAll(".activityIntensity-item")
    
                        .attr("x",(d) => this.xAxis.scale(d[config.activityIntensity.dimensions[0]]) )
                        .attr("y",(d) => config.display.margin.top)
                        // .attr("width",config.display.size.width)
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
                            // .on("click", function (d) { that.highlightTooltipMouseOver(this, that, d);})
                            // .on("mouseout", function (d) { that.highlightMouseOut(this, that,d); });
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

        if(config.references ){
            this.svg.select(`#references-group-${config.cont.id}`)
                    .selectAll("line").data(config.references).enter().append("line")

            this.svg.select(`#references-group-${config.cont.id}`)
                    .selectAll("line").data(config.references).exit().remove();
            this.svg.select(`#references-group-${config.cont.id}`)
                    .selectAll("line").data(config.references)           
                    .attr("x1",this.xAxis.scale.range()[0])
                    .attr("y1", (d) => this.yAxis.scale(d.value))
                    .attr("x2",this.xAxis.scale.range()[1])
                    .attr("y2",(d) => this.yAxis.scale(d.value))
                    .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),{...defaults.line,...d.line});})
            this.svg.select(`#references-group-${config.cont.id}`)
                    .selectAll("text").data(config.references).enter().append("text")

            this.svg.select(`#references-group-${config.cont.id}`)
                    .selectAll("text").data(config.references).exit().remove();
            this.svg.select(`#references-group-${config.cont.id}`)
                    .selectAll("text").data(config.references)           
                    .attr("x",this.xAxis.scale.range()[1])
                    .attr("y", (d) => this.yAxis.scale(d.value) - 2)
                    .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this), {...defaults.text,...d.text});})
                    .text((d) => d.name)
                    
        }    
        
        this.svg.select(`#rect-overlay-${config.cont.id}`)
        .attr("x",config.display.margin.left)
        .attr("y",config.display.margin.top)
        .attr("width",config.display.size.width-config.display.margin.right-config.display.margin.left)
        .attr("height",config.display.size.height-config.display.margin.bottom-config.display.margin.top)
        .on("mouseover",function() {that.mouseOver(this,that);})
        .on("mousemove",function() {that.mouseOver(this,that);})
        .on("mouseout",function() {that.mouseOut(this,that);});

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
        this.tooltipHL
        .on("mouseover", function (d,di) { 
            // console.log(config,'config from mouse')
            config.events.tooltip.active = true })
        .on("mousemove", function (d,di) { 
            // console.log(config,'config from mouse move')
            config.events.tooltip.active = true })
        .on("mouseout", function () { that.tooltipMouseOut(this,that) });

        
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
        this.tooltipHL  = config.events.tooltip.el;
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
                            .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                            .attr("id",`continous-bi-group-${config.cont.id}`);

       
        this.svg.append("g")
                            .attr("class","activityIntensity")
                            .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                            .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                            .attr("id",`activityIntensity-group-${config.cont.id}`);
        
        this.svg.append("g")
                            .attr("class","continous-bi")
                            .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                            .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                            .attr("id",`continous-bi-group-${config.cont.id}`);


        this.svg.append("g")
                            .attr("class","half-hour-bi")
                            .attr("clip-path",`#rect-clip-${config.cont.id}`)
                            .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                            .attr("id",`half-hour-bi-group-${config.cont.id}`);
                            
        this.svg.append("g")
                            .attr("class","half-hour-bi")
                            .attr("clip-path",`#rect-clip-${config.cont.id}`)
                            .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                            .attr("id",`half-hour-biarea-group-${config.cont.id}`);

        this.svg.select(`#continous-bi-group-${config.cont.id}`).append("line")
                            .attr("id",`hl-line-${config.cont.id}`)
                            .attr("class","hl-line");
                            
        // this.svg.select(`half-hour-bi-group-${config.cont.id}`).append("line")
        //                     .attr("id",`hl-line-${config.cont.id}`)
        //                     .attr("class","hl-line");
                            
        // this.svg.select(`half-hour-biarea-group-${config.cont.id}`).append("line")
        //                     .attr("id",`hl-line-${config.cont.id}`)
        //                     .attr("class","hl-line");
        
        this.svg.append("g")
                            .attr("class","references")
                            .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                            .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                            .attr("id",`references-group-${config.cont.id}`);
        
      
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
                            .attr("id",`markers-hl-group-${config.cont.id}`);

        this.svg.append("g")
                            .attr("class","events")
                            .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                            .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                            .attr("id",`events-group-${config.cont.id}`);

    }

}

export {BIChart}