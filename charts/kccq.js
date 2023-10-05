import {select,easeBounce, timeFormat, timeMinutes, timeMinute, mouse, bisector, format, mean} from  "d3";
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

class KCCQChart {
    constructor(config){
        this.config = config;
        this.initialize();
        this.update();
    }

    updateDomains(data){
        let config = this.config;
        dataFormat.adjustTZColumn(config.xAxis.dimension,config.tzOffset,config.data);
        if(config.xAxis.fixTimeZone) {
            config.xAxis.domain = config.xAxis.domain? dataFormat.adjustTZList(config.tzOffset,config.xAxis.domain) : dataFormat.fetchRange(config.xAxis.dimension,config.data);
        }
        else{
            config.xAxis.domain = config.xAxis.domain? dataFormat.adjustTime(config.tzOffset,config.xAxis.domain) : dataFormat.fetchRange(config.xAxis.dimension,config.data);
        }
        config.yAxis.domain = config.yAxis.domain || dataFormat.fetchRange(config.yAxis.measure,data);
        config.color.domain = config.color.domain  || config.measures;
    }

    updateGenerators(){

      
        
    this.config.lineGenerators =  this.config.filteredMeasures.map((m) => { // using filtered measures to draw lines.
        return generator.lineGenerator(this.xAxis.scale,this.config.xAxis.dimension,this.yAxis.scale,m);
    });
        
    }
    getAxis(type){
        let props;
        let config = this.config;
        switch (type){
        
        case "xAxis":
            axisFormat.setCustomTickValues(config);
            config.xAxis.dimension = config.xAxis.dimension || config.dimensions[0];
            axisFormat.setLocale(config);
            props = config.xAxis;
            return new TimeAxis(props);

        case "yAxis":
            config.yAxis.measure = config.yAxis.measure || config.measures[0];
            if( config.score && config.score.show) config.yAxis.range[1] = config.yAxis.range[1]+config.score.height + 10
            props = config.yAxis;
            return new ContinousAxis(props);

        case "color":
            props = config.color;
            return new ColorScale(props);


        
    }
    }

    mouseOver(el,that) {
        // console.log("moudeover", el,that); 

        let mouseEvent = mouse(el);
        let timeLevel = dataFormat.getTimeLevel(that.config.xAxis.timeLevel);
        let config = that.config;
        let x0 = that.xAxis.scale.invert(mouseEvent[0]);
        let xLevel = timeLevel(x0).getTime();

        let bisectDate = bisector((d,x) => {return d.timestamp -x }).right;

        let selectedData = that.config.chartData.length > 0 ? that.config.chartData.reduce((a,b) => {
            return Math.abs(b[config.xAxis.dimension] - xLevel) < Math.abs(a[config.xAxis.dimension] - xLevel) ? b : a;
        }):null; 

        config.measures.map((l,li) =>{
        if(selectedData != undefined && selectedData[l] != null){
            let cx = that.xAxis.scale(selectedData[that.config.xAxis.dimension]);
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
            if(cx >=  config.display.size.width-config.display.margin.right-config.display.margin.left  - elW){
                xPos = ( cx -(elW) -config.tooltip.offset.x )+"px";
                }
                else{
                    xPos =`${cx+ config.tooltip.offset.x }px`
                } 
            yPos = (that.yAxis.scale.range()[1] + config.tooltip.offset.y)+"px";
            
            if(config.tooltip.show){
                config.tooltip.tooltip.update(config, {xPos, yPos}, selectedData)
            }  
                        
        }
    });

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
        config.chartData =  config.data;
        
        
        if(config.dataType === 'raw'){
             // If backend is not calculating scores and sending us data in Q/A format then we are calculating scores from lib side for KCCQ12.
            config.chartData.map((d) => {
                d["1a"] =  d["1a"] == 6 ? null: d["1a"]
                d["1b"] =  d["1b"] == 6 ? null: d["1b"]
                d["1c"] =  d["1c"] == 6 ? null: d["1c"]
                
                if( (d["1a"] == null && d["1b"] == null) || (d["1b"] == null && d["1c"] == null)  || (d["1a"] == null && d["1c"] == null) )
                {
                    d['Physical limitation score'] = null;
                }
                else{
                
                    d['Physical limitation score'] = 100*(mean([d["1a"],d["1b"],d["1c"]]) -1 )/4;  
                }
                if( (d["2"] == null && d["3"] == null) || (d["3"] == null && d["4"] == null)  || (d["4"] == null && d["5"] == null) || (d["5"] == null && d["2"] == null))
                {
                    d['Symptom frequency score'] = null;
                }
                else{
                    d['Symptom frequency score'] =  mean([100*(d["2"]-1)/4,100*(d["3"]-1)/6,100*(d["4"]-1)/6,100*(d["5"]-1)/4])
                }
                if( d["6"] == null && d["7"] == null ){
                    d['Quality of life score'] = null;
                }
                else{
                    d['Quality of life score'] = 100*(mean([d["6"],d["7"]]) -1 )/4;  
                }
                d["8a"] =  d["8a"] == 6 ? null: d["8a"]
                d["8b"] =  d["8b"] == 6 ? null: d["8b"]
                d["8c"] =  d["8c"] == 6 ? null: d["8c"]
                if( (d["8a"] == null && d["8b"] == null) || (d["8b"] == null && d["8c"] == null)  || (d["8a"] == null && d["8c"] == null) )
                {
                    d['Social limitation score'] = null;
                }
                else{
                
                    d['Social limitation score'] = 100*(mean([d["8a"],d["8b"],d["8c"]]) -1 )/4; 
                }
                d['Summary score'] = mean([d['Physical limitation score'] ,d['Symptom frequency score'] ,d['Quality of life score'] , d['Social limitation score'] ])

                // config.measures.map((m,mi) =>{
                //     config.chartData = config.chartData.filter(item =>{
                //         if(!item[config.measures[mi]]){
                //             delete item[config.measures[mi]]
                //         }
                //         return item;
                //     });
                // });
            })
        }
        // config.measures = ["Physical limitation score","Symptom frequency score","Quality of life score","Social limitation score"];
        // config.color.domain = ["Physical limitation score","Symptom frequency score","Quality of life score","Social limitation score"];
        if(config.score && config.score.show){
        config.score.measure = 'Summary score'
        }
        this.updateDomains(config.chartData);

        config.filteredMeasures = config.measures.filter((m) => { // based on ignoreValues we will filter out
            return config.chartData.map(d => !config.ignoreValues.includes(d[m])).some(v => v)
        }) 
        this.xAxis = this.getAxis("xAxis");        
        this.yAxis = this.getAxis("yAxis"); 
        this.colorScale = this.getAxis("color"); 
        this.config.color.scale = this.colorScale.scale;
        config.markers = [...defaults.multiline.markers,...config.markers];
        if (config.xAxis.show) this.svg.select("#x-axis").call(this.xAxis.axis.tickFormat(config.xAxis.locale === 'en-US'? config.xAxis.localeFormat :config.xAxis.localeFormat.format(config.xAxis.ticks.text.timeFormat)).tickValues(config.xAxis.ticks.text.tickValues));
        if (config.yAxis.show) this.svg.select("#y-axis").call(this.yAxis.axis.ticks(config.yAxis.ticks.number));
        
        this.updateGenerators();

        this.svg.select("#y-axis").selectAll(".tick line") // Whern there is no data, but user want's to see tick lines.
                        .attr("x1",0)
                        .attr("x2",config.display.size.width-config.display.margin.left-config.display.margin.right);

        axisFormat.formatAxes(config);

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

        if (config.line.show) {
            this.svg.select("#lines-group").selectAll("path").data(config.filteredMeasures).enter().append("path");
            this.svg.select("#lines-group").selectAll("path").data(config.filteredMeasures).exit().remove();
            this.svg.select("#lines-group").selectAll("path")
                        .attr("d",(d,di) => config.lineGenerators[di](config.chartData))
                        .attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),config.line);})
                        .attr("stroke",(d) => config.color.scale(d))
                        ;
        }

        this.svg.select(`#markers-hl-group-${config.cont.id}`)
                        .selectAll(".marker-hl-item")
                        .data(config.filteredMeasures)
                        .enter().append("circle")
                        .attr("class","marker-hl-item")
                        .attr("r",0);


        // Highlighting default selected data or custom callback selected data which is used in Evaluations page    
        // if(config.defaultDataHighlighted || config.hoveredDataCallback){
        //     let defaultSelectedData = config.chartData.slice(-1);
        //         defaultSelectedData = Object.assign({}, ...defaultSelectedData ); // converting default selected data last array of object to object.
        //     if(config.hoveredDataCallback){
        //         config.hoveredDataCallback = config.chartData.filter((ele) => { // Finding out kccq data from original data to selected data by custom callback by time....
        //             let a = new Date(ele.time)
        //             let b = new Date(config.hoveredDataCallback.time)
        //             a = `${a.getDate()}-${a.getMonth()}-${a.getFullYear()}`  
        //             b = `${b.getDate()}-${b.getMonth()}-${b.getFullYear()}`  
        //             return a === b
        //          })
        //          config.hoveredDataCallback = Object.assign({},...config.hoveredDataCallback); // Converting array of object to object
        //     }
        //     if (defaultSelectedData|| config.hoveredDataCallback){ // highlighting the circles...
                
        //             this.svg.select(`#markers-hl-group-${config.cont.id}`)
        //                 .selectAll(".marker-hl-item")

        //                 .attr("cx",config.hoveredDataCallback ? that.xAxis.scale(config.hoveredDataCallback[config.xAxis.dimension]) + 3 : that.xAxis.scale(defaultSelectedData[config.xAxis.dimension]) )
        //                 .attr("cy",(m) =>config.hoveredDataCallback ? that.yAxis.scale(config.hoveredDataCallback[m]) :that.yAxis.scale(defaultSelectedData[m]))
        //                 .attr("r",10)
        //                 .attr("class","marker-hl-item")
        //                 .attr("fill",(m) => that.config.color.scale(m))
        //                 .attr("stroke",(m,mi) => that.config.markers[mi].stroke || that.config.color.scale(m))
        //                 .style("opacity", 1)
        //                 .attr("fill-opacity", 0.7);
        //     }
        // }
        let markersGroup = this.svg.select("#markers-group");
        markersGroup.selectAll("g").data(config.filteredMeasures).enter().append("g").attr("id",(d) =>{return `markers-group-${textFormat.formatSelector(d)}`});
        markersGroup.selectAll("g").data(config.filteredMeasures).exit().remove();
        
        
       
            
        config.filteredData = {}

        config.filteredMeasures.map((m,mi) => {
            config.markers[mi] = {...defaults.markers[mi],...circleConfig,...config.markers[mi]};
            config.filteredData[m] = config.chartData.filter((d) => d[m] != null) // filtering chart data so it won't plot null data as well.

            if (config.markers[mi].show) {
                
                if(config.markers[mi].shape == "circle"){
                markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item").data(config.filteredData[m]).enter().append("circle").attr("class","marker-item");
                markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item").data(config.filteredData[m]).exit().remove();

                markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item")
                            // .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                            // .attr("cy",(d) => config.display.size.height)
                            // .transition(easeBounce).duration(1000)
                            .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                            .attr("cy",(d) => this.yAxis.scale(d[m]))
                            .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.markers[mi]);})
                            .attr("fill",(d) => config.color.scale(m))
                            .attr("stroke",(d,di) => config.color.scale(m))
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

                if(config.markers[mi].shape == "double-circle"){

                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item-dual").data(config.filteredData[m]).enter().append("circle").attr("class","marker-item-dual");
                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item-dual").data(config.filteredData[m]).exit().remove();
    
                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item-dual")
                                // .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                                // .attr("cy",(d) => config.display.size.height)
                                // .transition(easeBounce).duration(1000)
                                .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                                .attr("cy",(d) => m == config.yAxis2.measure?this.yAxis2.scale(d[m]):this.yAxis.scale(d[m]))
                                .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.markers[mi]);})
                                .attr("fill",(d) => config.color.scale(m))
                                .attr("stroke",(d,di) => config.color.scale(m))
                                .attr("r",7)
                                ;

                                
                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item").data(config.filteredData[m]).enter().append("circle").attr("class","marker-item");
                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item").data(config.filteredData[m]).exit().remove();
    
                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item")
                                // .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                                // .attr("cy",(d) => config.display.size.height)
                                // .transition(easeBounce).duration(1000)
                                .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                                .attr("cy",(d) => m == config.yAxis2.measure?this.yAxis2.scale(d[m]):this.yAxis.scale(d[m]))
                                .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.markers[mi]);})
                                .attr("fill",(d) => config.color.scale(m))
                                .attr("stroke",(d,di) => "#ffffff")
                                .attr("stroke-width",2)
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

        if(config.score && config.score.show){
            this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-bg").data(["Health score"]).enter().append("rect").attr("class","score-bg");

            this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-bg")
                        // .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                        // .attr("cy",(d) => config.display.size.height)
                        // .transition(easeBounce).duration(1000)
                        .attr("x",(d) =>0)
                        .attr("y",(d) => config.display.margin.top)
                        .attr("width",(d) =>config.display.size.width)
                        .attr("height",(d) => config.score.height)
                        .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.score.bg);})
                        ;
            this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-citem").data(config.chartData).enter().append("circle").attr("class","score-citem");
            this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-citem").data(config.chartData).exit().remove();

            this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-citem")
                        // .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                        // .attr("cy",(d) => config.display.size.height)
                        // .transition(easeBounce).duration(1000)
                        .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                        .attr("cy",(d) => config.display.margin.top+config.score.height/2)
                        .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.score.circle);})
                        ;
            this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-titem").data(config.chartData).enter().append("text").attr("class","score-titem");
            this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-titem").data(config.chartData).exit().remove();

            this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-titem")
                        // .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                        // .attr("cy",(d) => config.display.size.height)
                        // .transition(easeBounce).duration(1000)
                        .attr("x",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                        .attr("y",(d) => config.display.margin.top+config.score.height/2)
                        .text((d) => format(config.score.text.format || ".2f")(d[config.score.measure]))
                        .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.score.text);})
                        ;
            this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-title").data([config.score.title.value || "Summary score"]).enter().append("text").attr("class","score-title");

            this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-title")
                        // .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                        // .attr("cy",(d) => config.display.size.height)
                        // .transition(easeBounce).duration(1000)
                        .attr("x",(d) => config.display.margin.left)
                        .attr("y",(d) => config.display.margin.top+config.score.height/2)
                        .text((d) => d)
                        .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.score.title);})
                        ;
            }
        if(!config.markerTooltip.show && !config.defaultDataHighlighted){

        this.svg.select(`#rect-overlay-${config.cont.id}`)
                    .attr("x",config.display.margin.left)
                    .attr("y",config.display.margin.top)
                    .attr("width",config.display.size.width-config.display.margin.right-config.display.margin.left)
                    .attr("height",config.display.size.height-config.display.margin.bottom-config.display.margin.top)
                    .on("mouseover",function() {that.mouseOver(this,that);})
                    .on("mousemove",function() {that.mouseOver(this,that);})
                    .on("mouseout",function() {that.mouseOut(this,that);});
        }

        if(config.defaultDataHighlighted || config.hoveredDataCallback){
            
            let defaultSelectedData = config.chartData.slice(-1);
                defaultSelectedData = Object.assign({}, ...defaultSelectedData ); // converting default selected data last array of object to object.
            if(config.hoveredDataCallback){
                config.hoveredDataCallback = config.chartData.filter((ele) => { // Finding out kccq data from original data to selected data by custom callback by time....
                    let a = new Date(ele.time)
                    let b = new Date(config.hoveredDataCallback.time)
                    a = `${a.getDate()}-${a.getMonth()}-${a.getFullYear()}`  
                    b = `${b.getDate()}-${b.getMonth()}-${b.getFullYear()}`  
                    return a === b
                 })
                 config.hoveredDataCallback = Object.assign({},...config.hoveredDataCallback); // Converting array of object to object
            }
            if (defaultSelectedData|| config.hoveredDataCallback){ // highlighting the circles...
                
                config.measures.map((m,mi) => {
                    // config.hoveredDataCallback[m] = config.hoveredDataCallback.filter((d) => d[m] != null)
                    if(config.hoveredDataCallback){
                    markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item")
                    .style("opacity",function(d){
                        if(d['Summary score']){ // If there is Summary score key present in data we are making marker opacity as 1.
                            return config.hoveredDataCallback['Summary score'] === d['Summary score'] ? 1 : 0.5
                        }
                        else{   // if there are no summary scores and we need to check with time so we can use this and make marker-item opacity 1.
                            let a = new Date(d.time)
                            let b = new Date(config.hoveredDataCallback.time)
                            a = `${a.getDate()}-${a.getMonth()}-${a.getFullYear()}`  
                            b = `${b.getDate()}-${b.getMonth()}-${b.getFullYear()}`  
                            return a == b ? 1 : 0.5
                        }
                    });
                    } else {
                        markersGroup.select(`#markers-group-${textFormat.formatSelector(m)}`).selectAll(".marker-item")
                        .style("opacity", function(d){ 
                            if(d['Summary score']){
                                return d['Summary score'] === config.chartData[config.chartData.length-1]['Summary score'] ? 1 : 0.5 
                            }else{ // based on time highlighting latest data
                                let a = d.time.getTime();
                                let b = defaultSelectedData.time.getTime();
                                return a == b ? 1 : 0.5                    
                            }
                        })
                    }
    
                });
                    this.svg.select(`#markers-hl-group-${config.cont.id}`)
                        .selectAll(".marker-hl-item")
                        .filter((m)=> config.hoveredDataCallback?config.hoveredDataCallback[m] != null:defaultSelectedData[m] !=null ) // removing nulls from hoveredData or defaultselected data so it won't highlight nulls.
                        .attr("cx",config.hoveredDataCallback ? that.xAxis.scale(config.hoveredDataCallback[config.xAxis.dimension]): that.xAxis.scale(defaultSelectedData[config.xAxis.dimension]) ) // Removing constant value so highlighted circle will be in centre
                        .attr("cy",(m) =>config.hoveredDataCallback ? that.yAxis.scale(config.hoveredDataCallback[m]) :that.yAxis.scale(defaultSelectedData[m]))
                        .attr("r",10)
                        .attr("class","marker-hl-item")
                        .attr("fill",(m) => that.config.color.scale(m))
                        .attr("stroke",(m,mi) => that.config.markers[mi].stroke || that.config.color.scale(m))
                        .style("opacity", 1)
                        .attr("fill-opacity", 0.7);
            }
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
        
        this.svg.select(`#markers-hl-group-${config.cont.id}`).append("line")
                    .attr("id",`hl-line-${config.cont.id}`)
                    .attr("class","hl-line");
        config.yAxis.el = this.svg.append("g")
                    .attr("class","y-axis axes")
                    .attr("id","y-axis")
                    .attr("transform",`translate(${config.display.margin.left},0)`);

        
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
        this.svg.append("g")
                    .attr("class","scores")
                    .attr("id",`scores-group-${textFormat.formatSelector(config.cont.id)}`);
        

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

export {KCCQChart};