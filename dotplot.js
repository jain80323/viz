import { select, easeBounce, timeFormat, timeMinutes, timeMinute, mouse,max, bisector,format } from "d3";
import { defaults } from "../config/default";
import { axisFormat } from "../utils/axis-formatter";
import { elementFormat } from "../utils/element-formatter";
import { ColorScale } from "../components/colorscale";
import { circleConfig } from "../config/circle";
import { dataFormat } from "../utils/data-formatter";
import { ContinousAxis } from "../components/continousaxis";
import { TimeAxis } from "../components/timeaxis";
import { generator } from "../utils/generators";
import { textFormat } from "../utils/text-formatter.js";

class DotPlot {
    constructor(config) {
        this.config = config;
        this.initialize();
        this.update();
    }

    updateDomains(data) {
        let config = this.config;
        dataFormat.adjustTZColumn(config.xAxis.dimension, config.tzOffset, config.data);
        if (config.eventData != undefined & config.events.show) {
            if (config.events.dimensions[1]) dataFormat.adjustTZColumn(config.events.dimensions[1], config.tzOffset, config.eventData);
            dataFormat.adjustTZColumn(config.events.dimensions[0], config.tzOffset, config.eventData);
        }
        if(config.xAxis.fixTimeZone) {
            config.xAxis.domain = config.xAxis.domain ? dataFormat.adjustTZList(config.tzOffset, config.xAxis.domain) : dataFormat.fetchRange(config.xAxis.dimension, config.data);
        }
        else{
        config.xAxis.domain = config.xAxis.domain ? dataFormat.adjustTime(config.tzOffset, config.xAxis.domain) : dataFormat.fetchRange(config.xAxis.dimension, config.data);
        }

        if(config.yAxis.dynamicyAxis && config.filteredMeasures.length > 0){

            config.yAxis.domain = config.yAxis.domain ? dataFormat.fetchDynamicRange(config.yAxis.measure,data,config) : config.yAxis.domain;
        }
        else{
            config.yAxis.domain = config.yAxis.domain || dataFormat.fetchRange(config.yAxis.measure, data);
        }
        config.color.domain = config.color.domain || config.measures;
    }

    updateGenerators() {



    }
    getAxis(type) {
        let props;
        let config = this.config;
        switch (type) {

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

    mouseOver(el, that) {
        let tooltip = that.tooltip;
        let mouseEvent = mouse(el);
        let timeLevel = dataFormat.getTimeLevel(that.config.xAxis.timeLevel);
        let config = that.config;
        let x0 = that.xAxis.scale.invert(mouseEvent[0]);
        let xLevel = timeLevel(x0).getTime();

        // let bisectDate = bisector((d, x) => { return d.timestamp - x }).right;

        let selectedData = that.config.data.length > 0 ? that.config.data.reduce((a, b) => {
            return Math.abs(b[config.xAxis.dimension] - xLevel) < Math.abs(a[config.xAxis.dimension] - xLevel) ? b : a;
        }) : null;
        config.measures.map((l,li) =>{
            if (selectedData != undefined && selectedData[l] != null) {
                let cx = that.xAxis.scale(selectedData[that.config.xAxis.dimension]);
    
                that.svg.selectAll(".marker-hl-item")
                    .attr("cx", cx)
                    .attr("cy", (m) => m == that.config.yAxis2.measure ? that.yAxis2.scale(selectedData[m]) : that.yAxis.scale(selectedData[m]))
                    .attr("r", 10)
                    .attr("fill", (m) => that.config.color.scale(m))
                    .attr("stroke", (m, mi) => that.config.markers[mi].stroke || that.config.color.scale(m))
                    .style("opacity", 1)
                    .attr("fill-opacity", 0.5);
    
                if (config.tooltip.line.show) {
                    that.svg.select(`#hl-line-${config.cont.id}`)
                        .attr("x1", cx)
                        .attr("x2", cx)
                        .attr("y1", that.config.display.margin.top)
                        .attr("y2", that.config.display.size.height - that.config.display.margin.bottom)
                        .attr("fill", that.config.tooltip.line.stroke)
                        .attr("stroke", that.config.tooltip.line.stroke)
                        .style("opacity", 1);
                }
    
                // let tooltip = config.tooltip.el;
                let elW = tooltip.node().offsetWidth;
                let elH = 60;
    
                let xPos, yPos;
                if (cx <= config.display.margin.left + elW / 2) {
                    xPos = (config.display.margin.left + 10) + "px";
                }
                else if (cx >= config.display.size.width - config.display.margin.right - config.display.margin.left - elW) {
                    xPos = ((config.display.size.width - config.display.margin.right) - (elW) - 10) + "px";
                }
                else {
                    xPos = (cx - elW / 2) + "px";
                }
    
                yPos = (that.yAxis.scale.range()[1]) + "px";
    
                if (config.tooltip.show) {
               
                    tooltip.attr("data-styles", function (d) { return elementFormat.applyStyles(select(this), config.tooltip.styles); })
                    config.tooltip.tooltip.update(config, {xPos, yPos}, selectedData)
                    // let html = "";
                    // { html += `<span> ${(selectedData.value)}</span> </br>`; };
                    // tooltip.style("display", "block")
                    //     .style("position", "absolute")
                    //     .style("top", yPos)
                    //     .style("left", xPos)
                    //     .attr("data-styles", function (d) { return elementFormat.applyStyles(select(this), config.tooltip.styles); })
                    //     .html(html)
                    //     ;
                }
    
            }
        });
      

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

    mouseOut(el, that) {
        that.tooltip.style("display", "none");
        that.svg.selectAll(".marker-hl-item").style("opacity", 0);
        that.svg.select(`#hl-line-${that.config.cont.id}`).style("opacity", 0);

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



    update() {

        let config = this.config;
        let that = this;
        config.chartData = config.data;

        config.filteredMeasures = config.measures.filter((m) => {
            return config.chartData.map(d => d[m]).some(v => v)
        })
        if(config.ignoreNullColumns === true){
            config.measures.map((m,mi) =>{
                config.totalNullFreeChartData = config.chartData.filter(item =>{
                    if(item[config.measures[mi]] === null || undefined){
                        delete item[config.measures[mi]]
                    }
                    return item;
                });
            });
        }

        // config.measures = config.filteredMeasures;
        this.updateDomains(config.chartData);
        this.xAxis = this.getAxis("xAxis");
        this.yAxis = this.getAxis("yAxis");
        this.colorScale = this.getAxis("color");
        this.config.color.scale = this.colorScale.scale;

        config.markers = [...defaults.multiline.markers, ...config.markers];
        if (config.xAxis.show) this.svg.select("#x-axis").call(this.xAxis.axis.tickFormat(config.xAxis.locale === 'en-US'? config.xAxis.localeFormat :config.xAxis.localeFormat.format(config.xAxis.ticks.text.timeFormat)).tickValues(config.xAxis.ticks.text.tickValues));
        // if (config.yAxis.show) this.svg.select("#y-axis").call(this.yAxis.axis.ticks(config.yAxis.ticks.number));
        if (config.yAxis.show) this.svg.select("#y-axis").call(this.yAxis.axis.tickFormat(format(config.yAxis.ticks.tickFormat)).ticks(config.yAxis.ticks.number)); // We need to remove decimal values from y-axis ticks, so we are taking timeformat from user and formatting the decimals.


        this.svg.select("#y-axis").selectAll(".tick line")
            .attr("x1", 0)
            .attr("x2", config.display.size.width - config.display.margin.left - config.display.margin.right);

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
        }

        this.svg.select(`#markers-hl-group-${config.cont.id}`)
            .selectAll(".marker-hl-item")
            .data(config.measures)
            .enter().append("circle")
            .attr("class", "marker-hl-item")
            .attr("r", 0);

        let markersGroup = this.svg.select("#markers-group");
        markersGroup.selectAll("g").data(config.measures).enter().append("g").attr("id", (d) => { return `markers-group-${textFormat.formatSelector(d)}` });
        markersGroup.selectAll("g").data(config.measures).exit().remove();
        config.measures.map((m, mi) => {
            config.markers[mi] = { ...defaults.markers[mi], ...circleConfig, ...config.markers[mi] };

            if (config.markers[mi].show) {

                if (config.markers[mi].shape == "circle") {
                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item").data(config.chartData).enter().append("circle").attr("class", "marker-item");
                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item").data(config.chartData).exit().remove();

                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item")
                        // .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                        // .attr("cy",(d) => config.display.size.height)
                        // .transition(easeBounce).duration(1000)
                        .attr("cx", (d) => this.xAxis.scale(d[config.xAxis.dimension]))
                        .attr("cy", (d) => m == config.yAxis2.measure ? this.yAxis2.scale(d[m]) : this.yAxis.scale(d[m]))
                        .attr("data-attrs", function (d) { return elementFormat.applyAttrs(select(this), config.markers[mi]); })
                        .attr("fill", (d) => config.markers[mi].attrs ? config.markers[mi].attrs.fill : d.color || config.color.scale(m))
                        .attr("stroke", (d, di) => config.markers[mi].attrs ? config.markers[mi].attrs.stroke :config.color.scale(m))
                        ;

                    // Call Highlighttooltip Mouseover Callback Function on hover of Double-Circle
                    if(config.markerTooltip.show){
                            markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item")
                            .style("pointer-events","all")
                            .raise()
                            .on("mouseover", function (d) { that.highlightTooltipMouseOver(this, that, d);})
                            .on("mousemove", function (d) { that.highlightTooltipMouseOver(this, that, d);})
                            .on("mouseout", function () { that.highlightMouseOut(this, that); });
                    }
                }

                if (config.markers[mi].shape == "double-circle") {

                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item-dual").data(config.chartData).enter().append("circle").attr("class", "marker-item-dual");
                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item-dual").data(config.chartData).exit().remove();

                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item-dual")
                        // .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                        // .attr("cy",(d) => config.display.size.height)
                        // .transition(easeBounce).duration(1000)
                        .attr("cx", (d) => this.xAxis.scale(d[config.xAxis.dimension]))
                        .attr("cy", (d) => m == config.yAxis2.measure ? this.yAxis2.scale(d[m]) : this.yAxis.scale(d[m]))
                        .attr("data-attrs", function (d) { return elementFormat.applyAttrs(select(this), config.markers[mi]); })
                        .attr("fill", (d) => config.markers[mi].attrs ? config.markers[mi].attrs.fill : d.color || config.color.scale(m))
                        .attr("stroke", (d, di) => config.markers[mi].attrs ? config.markers[mi].attrs.stroke :config.color.scale(m))
                        .attr("r", 7)
                        ;


                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item").data(config.chartData).enter().append("circle").attr("class", "marker-item");
                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item").data(config.chartData).exit().remove();

                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item")
                        // .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                        // .attr("cy",(d) => config.display.size.height)
                        // .transition(easeBounce).duration(1000)
                        .attr("cx", (d) => this.xAxis.scale(d[config.xAxis.dimension]))
                        .attr("cy", (d) => m == config.yAxis2.measure ? this.yAxis2.scale(d[m]) : this.yAxis.scale(d[m]))
                        .attr("data-attrs", function (d) { return elementFormat.applyAttrs(select(this), config.markers[mi]); })
                        .attr("fill", (d) => d.color || config.color.scale(m))
                        .attr("stroke", (d, di) => "#ffffff")
                        .attr("stroke-width", 2)
                        ;
                    // Call Highlighttooltip Mouseover Callback Function on hover of Double-Circle
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

        if (config.eventData != undefined & config.events.show) {
            let eventsGroup = this.svg.select(`#events-group-${config.cont.id}`);

            eventsGroup.selectAll("g").data(config.events.measures).enter().append("g").attr("id", (d) => { return `events-group-${textFormat.formatSelector(d.name)}` });
            eventsGroup.selectAll("g").data(config.events.measures).exit().remove();
          

            config.events.measures.map((s) => {
                if (s.type == "range") {
                    eventsGroup.select(`#events-group-${textFormat.formatSelector(s.name)}`).selectAll(".event-item").data(config.eventData).enter().append("rect").attr("class", "event-item");
                    eventsGroup.select(`#events-group-${textFormat.formatSelector(s.name)}`).selectAll(".event-item").data(config.eventData).exit().remove();

                    eventsGroup.select(`#events-group-${textFormat.formatSelector(s.name)}`).selectAll(".event-item")
                        .attr("x", (d) => this.xAxis.scale(d[config.events.dimensions[0]]))
                        .attr("y", (d) => config.display.size.height - config.display.margin.bottom - s.attrs.height / 2)
                        .attr("width",(d) => Math.max(2,this.xAxis.scale(d[config.events.dimensions[1]]) - this.xAxis.scale(d[config.events.dimensions[0]])))// keeping width minimum as 2 in case startTime and endTime come as same.
                        .attr("data-attrs",function(d,di){return elementFormat.applyAttrs(select(this),s.attrs);})
                        .on("click", function (d) { that.highlightTooltipMouseOver(this, that, d);})
                        .on("mouseout", function () { that.highlightMouseOut(this, that); })
                        ;
                }
                if (s.type == "point") {
                    eventsGroup.select(`#events-group-${textFormat.formatSelector(s.name)}`).selectAll(".event-item").data(config.eventData).enter().append("circle").attr("class", "event-item");
                    eventsGroup.select(`#events-group-${textFormat.formatSelector(s.name)}`).selectAll(".event-item").data(config.eventData).exit().remove();

                    eventsGroup.select(`#events-group-${textFormat.formatSelector(s.name)}`).selectAll(".event-item")
                        .attr("cx", (d) => this.xAxis.scale(d[config.events.dimensions[0]]))
                        .attr("cy", (d) => config.display.size.height - config.display.margin.bottom)
                        .attr("data-attrs", function (d, di) { return elementFormat.applyAttrs(select(this), s.attrs); })
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
        //                 .attr("data-attrs", function (d, di) { return elementFormat.applyAttrs(select(this), s.attrs); })
        //                 .on("mouseover", function (d) { that.highlightTooltipMouseOver(this, that, d); })
        //                 .on("mousemove", function (d) { that.highlightTooltipMouseOver(this, that, d); })
        //                 .on("mouseout", function () { that.mouseOut(this, that); });
        //             ;
        //         }
        //     })
        // }

        if (config.references) {
            this.svg.select(`#references-group-${config.cont.id}`)
                .selectAll("line").data(config.references).enter().append("line")

            this.svg.select(`#references-group-${config.cont.id}`)
                .selectAll("line").data(config.references).exit().remove();
            this.svg.select(`#references-group-${config.cont.id}`)
                .selectAll("line").data(config.references)
                .attr("x1", this.xAxis.scale.range()[0])
                .attr("y1", (d) => this.yAxis.scale(d.value))
                .attr("x2", this.xAxis.scale.range()[1])
                .attr("y2", (d) => this.yAxis.scale(d.value))
                .attr("data-attrs", function (d) { return elementFormat.applyAttrs(select(this), { ...defaults.line, ...d.line }); })
            this.svg.select(`#references-group-${config.cont.id}`)
                .selectAll("text").data(config.references).enter().append("text")

            this.svg.select(`#references-group-${config.cont.id}`)
                .selectAll("text").data(config.references).exit().remove();
            this.svg.select(`#references-group-${config.cont.id}`)
                .selectAll("text").data(config.references)
                .attr("x", this.xAxis.scale.range()[1])
                .attr("y", (d) => this.yAxis.scale(d.value) - 2)
                .attr("data-attrs", function (d) { return elementFormat.applyAttrs(select(this), { ...defaults.text, ...d.text }); })
                .text((d) => d.name)

        }

        let lineGroup = this.svg.select("#lines-group");
        lineGroup.selectAll("g").data(config.lines).enter().append("g").attr("id", (d,di) => { return `lines-group-${textFormat.formatSelector(config.measures[di])}-${textFormat.formatSelector(config.measures[di+1])}` });
        lineGroup.selectAll("g").data(config.lines).exit().remove();
        
        config.lines.map((l,li) => {

            if (l.show) {
                // console.log(`${textFormat.formatSelector(config.measures[li])}-${textFormat.formatSelector(config.measures[li+1])}`)
                this.svg.select(`#lines-group-${textFormat.formatSelector(config.measures[li])}-${textFormat.formatSelector(config.measures[li+1])}`).selectAll("line").data(config.chartData).enter().append("line");
                this.svg.select(`#lines-group-${textFormat.formatSelector(config.measures[li])}-${textFormat.formatSelector(config.measures[li+1])}`).selectAll("line").data(config.chartData).exit().remove();
                this.svg.select(`#lines-group-${textFormat.formatSelector(config.measures[li])}-${textFormat.formatSelector(config.measures[li+1])}`).selectAll("line")

                    .attr("x1", (d, di) => this.xAxis.scale(d[this.config.dimensions[0]]))
                    .attr("x2", (d, di) => this.xAxis.scale(d[this.config.dimensions[0]]))
                    .attr("y1", (d, di) => this.yAxis.scale(d[this.config.measures[li==0?li:li+1]]))
                    .attr("y2", (d, di) => this.yAxis.scale(d[this.config.measures[li==0?li+1:li+2]]))
                    .attr("data-attrs", function () { return elementFormat.applyAttrs(select(this),config.lines[li]); })
                    ;
            }
        })
        if(!config.markerTooltip.show){
        this.svg.select(`#rect-overlay-${config.cont.id}`)
            .attr("x", config.display.margin.left)
            .attr("y", config.display.margin.top)
            .attr("width", config.display.size.width - config.display.margin.right - config.display.margin.left)
            .attr("height", config.display.size.height - config.display.margin.bottom - config.display.margin.top)
            .on("mouseover", function () { that.mouseOver(this, that); })
            .on("mousemove", function () { that.mouseOver(this, that); })
            .on("mouseout", function () { that.mouseOut(this, that); });

        }
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

        //Highlight Mouseover Timeout Tooltip for Events-------
        this.tooltipMouseOut = function(el, that) {
                let config = that.config;
                if(!config.events.tooltip.active) return null;
    
                config.events.tooltip.active = false ;
                function hideTooltip(){
    
                    config.events.tooltip.el.selectAll("*").remove()
                    config.events.tooltip.el.style('display','none')
                    
                }
                setTimeout(function(){
                    hideTooltip()
                },2500)
                
    
            }
        //Highlight Mouseover Timeout Tooltip for Events-------
        this.tooltipHL
                .on("mouseover", function (d,di) { 
                    config.events.tooltip.active = true })
                .on("mousemove", function (d,di) { 
                    config.events.tooltip.active = true })
                .on("mouseout", function () { that.tooltipMouseOut(this,that) });
        
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

        this.svg.select(`#rect-clip-${config.cont.id}`)
            .select("rect")
            .attr("x", config.display.margin.left  )
            .attr("width", config.display.size.width - config.display.margin.left - config.display.margin.right )
            .attr("y", config.display.margin.top - 10)
            .attr("height", config.display.size.height + 20);

    }

    initialize() {
        let config = this.config;
        this.chart = select(`#${config.chart.id}`);
        this.tooltip = config.tooltip.el;
        this.tooltipHL  = config.events.tooltip.el;
        this.tooltipHLMarker  = config.markerTooltip.tooltip.el;
        this.svg = config.svg.el
            .attr("width", config.svg.size.width)
            .attr("height", config.svg.size.height);
        // .attr("preserveAspectRatio", "xMinYMin meet")
        // .attr("viewBox", `0 0 ${config.svg.size.width} ${config.svg.size.height}`);

        this.svg.append("clipPath").attr("id", `rect-clip-${config.cont.id}`)
            .append("rect")
        config.xAxis.el = this.svg.append("g")
            .attr("class", "x-axis axes")
            .attr("id", "x-axis")
            .attr("transform", `translate(0,${config.display.size.height - config.display.margin.bottom})`);
        config.yAxis.el = this.svg.append("g")
            .attr("class", "y-axis axes")
            .attr("id", "y-axis")
            .attr("transform", `translate(${config.display.margin.left},0)`);
        if (config.yAxis2.show) {
            config.yAxis2.el = this.svg.append("g")
                .attr("class", "y-axis axes")
                .attr("id", "y-axis2")
                .attr("transform", `translate(${config.display.size.width - config.display.margin.right},0)`);
        }


        this.svg.append("g")
            .attr("class", "lines")
            .attr("clip-path", `url(#rect-clip-${config.cont.id})`)
            .style("-webkit-clip-path", `url(#rect-clip-${config.cont.id})`)
            .attr("id", "lines-group");



        this.svg.append("g")
            .attr("class", "gradients")
            .attr("clip-path", `url(#rect-clip-${config.cont.id})`)
            .style("-webkit-clip-path", `url(#rect-clip-${config.cont.id})`)
            .attr("id", "gradients-group");


       
        this.svg.append("g")
            .attr("class", "markers")
            .attr("clip-path", `url(#rect-clip-${config.cont.id})`)
            .style("-webkit-clip-path", `url(#rect-clip-${config.cont.id})`)
            .attr("id", `markers-hl-group-${config.cont.id}`);

        this.svg.append("g")
            .attr("class", "references")
            .attr("clip-path", `url(#rect-clip-${config.cont.id})`)
            .style("-webkit-clip-path", `url(#rect-clip-${config.cont.id})`)
            .attr("id", `references-group-${config.cont.id}`);

        this.svg.select(`#markers-hl-group-${config.cont.id}`).append("line")
            .attr("id", `hl-line-${config.cont.id}`)
            .attr("clip-path", `url(#rect-clip-${config.cont.id})`)
            .style("-webkit-clip-path", `url(#rect-clip-${config.cont.id})`)
            .attr("class", "hl-line");
        this.svg.append("g")
            .attr("class", "areas")
            .attr("clip-path", `url(#rect-clip-${config.cont.id})`)
            .style("-webkit-clip-path", `url(#rect-clip-${config.cont.id})`)
            .attr("id", "areas-group");

        this.svg.append("rect")
            .attr("id", `rect-overlay-${config.cont.id}`)
            .attr("class", "rect-overlay")
            .attr("fill", "none")
            .style("pointer-events", "all");

        this.svg.append("g")
            .attr("class", "events")
            .attr("clip-path", `url(#rect-clip-${config.cont.id})`)
            .style("-webkit-clip-path", `url(#rect-clip-${config.cont.id})`)
            .attr("id", `events-group-${config.cont.id}`);
        
        this.svg.append("g")
            .attr("class", "markers")
            .attr("clip-path", `url(#rect-clip-${config.cont.id})`)
            .style("-webkit-clip-path", `url(#rect-clip-${config.cont.id})`)
            .attr("id", "markers-group");

        // this.svg.append("g")
        //     .attr("class", "highevents")
        //     .attr("clip-path", `url(#rect-clip-${config.cont.id})`)
        //     .style("-webkit-clip-path", `url(#rect-clip-${config.cont.id})`)
        //     .attr("id", `highevents-group-${config.cont.id}`);

    }

}

export { DotPlot };