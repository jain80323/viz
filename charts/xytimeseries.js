import {select,easeBounce,timeFormat ,format, mouse} from  "d3";
import {defaults} from "../config/default";
import {CategoryAxis} from "../components/categoryaxis";
import {axisFormat} from "../utils/axis-formatter";
import {elementFormat} from "../utils/element-formatter";
import { ColorScale } from "../components/colorscale";
import {rectConfig}  from "../config/rect";
import { dataFormat } from "../utils/data-formatter";
import { textFormat } from "../utils/text-formatter";
import { generator } from "../utils/generators";
import { TimeAxis } from "../components/timeaxis";

// import _ from "lodash";
import { range } from 'lodash-es'


const words =  ['one','two','three','four', 'five','six','seven','eight','nine','ten','eleven','twelve', 'thirteen ','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
class XYTimeSeries {
    constructor(config){
        this.config = config;
        this.initialize();
        this.update();
    }

    updateDomains(data){
        let config = this.config; 
        dataFormat.adjustTZColumn(config.xAxis.dimension,config.tzOffset,config.data);
        dataFormat.adjustTZColumn(config.xAxis.dimension,config.tzOffset,config.textData);
        if(config.xAxis.fixTimeZone) {
            config.xAxis.domain = config.xAxis.domain? dataFormat.adjustTZList(config.tzOffset,config.xAxis.domain) : dataFormat.fetchRange(config.xAxis.dimension,config.data);
        }
        else{
            config.xAxis.domain = config.xAxis.domain? dataFormat.adjustTime(config.tzOffset,config.xAxis.domain) : dataFormat.fetchRange(config.xAxis.dimension,config.data);
        }
        
        config.xAxis.domainCat = axisFormat.getTicks(config);
        config.yAxis.domain = config.yAxis.domain || config.measures;
        config.color.domain = config.color.domain || dataFormat.fetchDistinctValues(config.yAxis.measures,config.data);
        if (config.bgmarkers.show) config.colorbg.domain = config.colorbg.domain || dataFormat.fetchDistinctValues(config.colorbg.dimension,config.data);
    }

    updateGenerators(){
        
            this.config.lineGenerators =  this.config.measures.map((m) => {
                return generator.lineGenerator(this.xAxis.scale,this.config.xAxis.dimension,this.yAxis.scale,m);
            });
        
    }
    getAxis(type){
        let config = this.config;
        let props;
        switch (type){
        
        case "xAxis":
            axisFormat.setCustomTickValues(config);
            config.xAxis.dimension = config.xAxis.dimension || config.dimensions[0];
            axisFormat.setLocale(config);
            props = config.xAxis;
            return new TimeAxis(props);

        case "yAxis":
            config.yAxis.measure = config.yAxis.measure || config.measures[0];
            if(config.yAxis.range[0] - config.yAxis.range[1] <= config.yAxis.step) config.yAxis.range[0] = config.yAxis.range[1] + config.yAxis.step // to deal with cases when height after accounting for margin bottom is less than the step range. This affects shape height.
            if( config.score && config.score.show) config.yAxis.range[1] = config.yAxis.range[1]+config.score.height
            props = config.yAxis;
            props.type = "categorical"
            return new CategoryAxis(props);

        case "color":
            props = config.color;
            return new ColorScale(props);

        case "colorbg":
            props = config.colorbg;
            return new ColorScale(props);

    }
    }
    markerMouseOver(d,that,data, m,markerIndex) {
        let config = that.config;
        if (data[m]!= null &&data[m]!= 0){
        
        let tooltip = that.tooltip;

        let cx = that.xAxis.scale(data[that.config.xAxis.dimension]);
        
        if(that.config.alignToYTick){
            that.svg.selectAll(`.marker-hl-item-${textFormat.formatSelector(m)}`)
                .attr("cy",(m) => this.config.highlightLine ? 
                (config.yAxis2.show && m == config.yAxis2.measure ? this.yAxis2.scale(data[m]) : this.yAxis.scale(data[m])): 
                that.config.yAxis2.measure?that.yAxis2.scale(data[m]):that.yAxis.scale(data[m]))
        } else {
            that.svg.selectAll(`.marker-hl-item-${textFormat.formatSelector(m)}`)
                .attr("cy",(m) => this.config.highlightLine ? 
                (config.yAxis2.show && m == config.yAxis2.measure ? this.yAxis2.scale(data[m])  + (markerIndex+1) *  this.yAxis.scale.bandwidth()/(2*config.yAxis.domain.length) + 5: this.yAxis.scale(data[m]) + (markerIndex+1) *  this.yAxis.scale.bandwidth()/(2*config.measures.length) + 5): 
                that.config.yAxis2.measure?that.yAxis2.scale(data[m]):that.yAxis.scale(data[m]))
        }

        that.svg.selectAll(`.marker-hl-item-${textFormat.formatSelector(m)}`)
        .attr("cx",cx)
        .attr("cy",(m) => this.config.highlightLine ? 
        (config.yAxis2.show && m == config.yAxis2.measure ? this.yAxis2.scale(data[m])  + (markerIndex+1) *  this.yAxis.scale.bandwidth()/(2*config.yAxis.domain.length) + 5: this.yAxis.scale(data[m]) + (markerIndex+1) *  this.yAxis.scale.bandwidth()/(2*config.measures.length) + 5): 
        that.config.yAxis2.measure?that.yAxis2.scale(data[m]):that.yAxis.scale(data[m]))
        .attr("r",10)
        .attr("fill",(m) => that.config.color.scale(m))
        .attr("stroke",(m,mi) => that.config.markers[mi].stroke || that.config.color.scale(m))
        .style("opacity", 1)
        .attr("fill-opacity", 0.5);
            // console.log(d,'after highlight mouseover marker')

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
            yPos = ((that.yAxis.scale.range()[0]) /2) +12+"px";
            if(config.markers[0].shape == "rect" ){
                yPos = that.yAxis.scale(m) +25 + "px" ;
            }


                data['source'] = 'markersTooltip';
                data['symptomName'] = m;
                if(config.showMax){
                    data['markerIndex'] = config.showMax-markerIndex;
                }
                else{
                    data['markerIndex'] = markerIndex;
                }
                config.tooltip.tooltip.update(config, {xPos, yPos}, data) 
        }    
    }

    markerMouseOut(d,that,data,m) {
        let config = that.config;
        that.tooltip.style("display","none");
        if(config.markersTooltip){
            that.svg.selectAll(".marker-hl-item").style("opacity",0);
            that.svg.select(`#hl-line-${that.config.cont.id}`).style("opacity",0);
        }
        else{
            data['markersMouseoutFunction'] = 'markersMouseout';
            data['symptomName'] = m;
            data['source']='';
            that.svg.selectAll(".marker-hl-item").style("opacity",0);
            that.svg.select(`#hl-line-${that.config.cont.id}`).style("opacity",0);
            config.tooltip.tooltip.update(config,m,data)
        }
    }

    highlightLineMouseOver(el,that,d,m,markerIndex){
        // console.log(d,m,markerIndex,'inside mouseover line')
        if(that.config.highlightLine){
        let measure = select(el).attr('class').split('-')[1]
        // let tooltip = that.tooltip;
        let mouseEvent = mouse(el);
        let timeLevel = dataFormat.getTimeLevel(that.config.xAxis.timeLevel);
        let config = that.config;
        let x0 = that.xAxis.scale.invert(mouseEvent[0]);
        // let y0 = that.yAxis.scale.invert(mouseEvent[1]);
        let xLevel = timeLevel(x0).getTime();
    
        // let bisectDate = bisector((d,x) => {return d.timestamp -x }).right;
        let tooltip = config.tooltip.el;
    
        let selectedData = that.config.data.length > 0 ? that.config.chartData.reduce((a,b) => {
            return Math.abs(b[config.xAxis.dimension] - xLevel) < Math.abs(a[config.xAxis.dimension] - xLevel) ? b : a;
            }):null; //bisectDate(that.config.data, xLevel); //that.config.data.find((d) =>  d[that.config.xAxis.dimension]== xLevel);
        // console.log(selectedData)
    
        if(selectedData){
            that.svg.select(`#lines-group`).selectAll('path').attr("opacity", 0.1);
            that.svg.select(`#markers-group`).selectAll('circle').attr("opacity", 0.1);
     
            that.svg.select(`#lines-group`).selectAll(`.lines-${textFormat.formatSelector(measure)}`).attr("opacity", 1);
            that.svg.select(`#markers-group`).selectAll(`.marker-${textFormat.formatSelector(measure)}`).attr("opacity", 1);
            }
        }else{
            that.config.markerTooltip.tooltip.active = true
            let data = d;
            let config = that.config;

            that.svg.selectAll('.marker-hl-item') // Making opacity as 0 of previous highlighted item elements
            .style("opacity", 0)
    
            if(config.defaultDataHighlighted){ // Making opacity as 1 for original marker, when user clicks on any marker ...
                config.measures.map((m,mi) => {
                that.svg.select(`#markers-group-${mi}`).selectAll(".marker-item")
                        .style("opacity", function(s){
                            let a = s.time.getTime()
                            let b = d.time.getTime()
                            return a==b? 1 : 0.5    // checking time from original data with user sended data through callback, if it matches then we are making opacity as 1 for those individual markers
                        });
                });
                config.keepMarkerHighlighted = true; // keeping marker as highlighted till user clicks on next marker/new input
            } 
            if (data[m]!= null &&data[m]!= 0){
            
            // let tooltip = that.tooltip;
            let tooltip = config.markerTooltip.show?config.markerTooltip.tooltip.el:config.events.tooltip.el;

            let cx = that.xAxis.scale(data[that.config.xAxis.dimension]);

            if(that.config.alignToYTick){
                that.svg.selectAll(`.marker-hl-item-${textFormat.formatSelector(m)}`)
                    .attr("cy",(m) => this.yAxis.scale(data[m]))
            } else {
                that.svg.selectAll(`.marker-hl-item-${textFormat.formatSelector(m)}`)
                .attr("cy",(m) => this.yAxis.scale(data[m]) + (markerIndex+1) *  this.yAxis.scale.bandwidth()/(2*config.measures.length) + 5)
            }

            that.svg.selectAll(`.marker-hl-item-${textFormat.formatSelector(m)}`)
            .attr("cx",cx)
            // .attr("cy",(m) => this.yAxis.scale(data[m]) + (markerIndex+1) *  this.yAxis.scale.bandwidth()/(2*config.measures.length) + 5)
            .attr("r",10)
            .attr("fill",(m) => that.config.color.scale(m))
            .attr("stroke",(m,mi) => that.config.markers[mi].stroke || that.config.color.scale(m))
            .style("opacity", 1)
            .attr("fill-opacity", 0.7);

            if(config.markerNeedToHighlight){ // If user don't want marker to be highlight like pills,rect
                that.svg.selectAll(`.marker-hl-item-${textFormat.formatSelector(m)}`)
                .attr("cx",cx)
                .attr("cy",(m) => this.yAxis.scale(data[m]) + (markerIndex+1) *  this.yAxis.scale.bandwidth()/(2*config.measures.length) + 5)
                .attr("r",10)
                .attr("fill",(m) => that.config.color.scale(m))
                .attr("stroke",(m,mi) => that.config.markers[mi].stroke || that.config.color.scale(m))
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
                yPos = ((that.yAxis.scale.range()[0]) /2) +12+"px";
    
                if (config.markerTooltip.show) {
                    config.markerTooltip.tooltip.active = true;
                    data['symptomName'] = m;
                    data['source'] = 'hl';
                    config.keepMarkerHighlighted = true;  
                    config.markerTooltip.tooltip.tooltip.update(config.markerTooltip, {xPos, yPos}, data)   
 
                }
            }
        }
    }
    highlightLineMouseOut(el,that,d,markerIndex) {
        if(this.config.keepMarkerHighlighted && this.config.markerNeedToHighlight){ // If user don't want marker to be highlight like pills,rect
            that.config.measures.map((m,mi) => {
            that.svg.select(`#markers-group-${mi}`).selectAll(".marker-item")
            .style("opacity", function(s){
                let a = s[that.config.dimensions].getTime()
                let b = d[that.config.dimensions].getTime()
                return a!=b? 0.5 : 1   // We need to de-highlight again/make opacity less when user clicks on any other marker...
            });
            });
            this.config.keepMarkerHighlighted = false; // so after making opacity as 0.5/less we need to make this keepMarkerHighlighted as false... so user can make it true on next click of marker.
            return;
        }
        if(that.config.markerTooltip.show){
            setTimeout(function(){

                if(that.config.markerTooltip.tooltip.active) return null;
                that.config.markerTooltip.tooltip.el.selectAll("*").remove()
                that.config.markerTooltip.tooltip.el.style("display", 'none' )
                that.svg.selectAll(".marker-hl-item").style("opacity",0)
                // that.svg.selectAll(".marker-item").style("opacity",0)
                that.svg.select(`#hl-line-${that.config.cont.id}`).style("opacity",0)
         
            },
            5000)
        }
        else{
            that.tooltip.style("display","none");
            that.svg.select(`#markers-hl-group-${that.config.cont.id}`).selectAll('.marker-hl-item').style("opacity",0);
            that.svg.select(`#hl-line-${that.config.cont.id}`).style("opacity",0);   
            that.svg.select(`#lines-group`).selectAll('path').attr("opacity", 1);
            that.svg.select(`#markers-group`).selectAll('circle').attr("opacity", 1); 
        }
    }
    mouseOver(el,that,markerIndex) {

        let mouseEvent = mouse(el);
        let timeLevel = dataFormat.getTimeLevel(that.config.xAxis.timeLevel);
        let config = that.config;
        let x0 = that.xAxis.scale.invert(mouseEvent[0]);
        let xLevel = timeLevel(x0).getTime();

        // let bisectDate = bisector((d,x) => {return d.timestamp -x }).right;

        let selectedData = that.config.data.length > 0 ? that.config.data.reduce((a,b) => {
            return Math.abs(b[config.xAxis.dimension] - xLevel) < Math.abs(a[config.xAxis.dimension] - xLevel) ? b : a;
        }):null;
        
        if(selectedData != undefined && selectedData[that.config.yAxis.measure] != null){
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
                xPos = (cx-(elW) -config.tooltip.offset.x )+"px";
                }
                else{
                    xPos =`${cx+ config.tooltip.offset.x }px`
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
   
   
    update(){
        let config = this.config;
        
        let that = this;
        config.chartData = config.data;
  
        if(config.ignoreNullColumns === true){
            if(config.mode=="PRN"){
                config.totalNullFreeChartData =config.chartData.filter(item => ![null,0].includes(item[config.measures[0]]))
            }else{
                config.measures = config.filteredMeasures
            }
          }
        
        if(config.mode == "PRN"){
            config.textData = config.totalNullFreeChartData.filter((d) => d[config.measures] > (config.showMax-1) )
        }
        else{
            config.textData = config.chartData.filter((d) => d[config.measures] > (config.showMax-1) )
        }
        if(config.mode && config.mode == "PRN"){
            config.maxValueShow = config.showMax? config.showMax:5;
            let val = config.color.domain? config.color.domain[0]:'Taken'
            
            config.chartData.map((d) => {

                range(config.maxValueShow).map((n) =>{
                    if(config.markers[0].shape == "rect"){
                        d[words[n]] =  d[config.yAxis.measure] && n +1 <= d[config.yAxis.measure].length ? {...{status:val},...d["pillsTakenAt"][n]} : null 
                        
                    } 
                    else{
                    d[words[config.maxValueShow-n]] =  n <= d[config.measures]? val:null
                    }
                })
            })
            if(config.markers[0].shape == "rect"){
                config.markers[0].valueField = "status"
                config.yAxis.domain = words.slice(0,config.maxValueShow).reverse();
                config.measures = words.slice(0,config.maxValueShow).reverse();
            }
            else{
            config.yAxis.domain = words.slice(0,config.maxValueShow);
            config.measures = words.slice(0,config.maxValueShow) ;
            }
            
            config.color.domain = config.color.domain || "Taken";
            
            
        }
        

        this.updateDomains(config.chartData);

        this.xAxis = this.getAxis("xAxis"); 

        this.yAxis = this.getAxis("yAxis");  
        this.colorScale = this.getAxis("color"); 

        this.config.color.scale = this.colorScale.scale; 

        this.updateGenerators();

        if (config.bgmarkers.show){ 
             this.colorScaleBG = this.getAxis("colorbg"); 
            this.config.colorbg.scale = this.colorScaleBG.scale; 
        }

        if(config.mode && config.mode == "PRN"){

            this.svg.select("#markers-text-group").selectAll("circle")
                .data(config.textData).enter().append("circle")
                .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension])+3)
                .attr("cy", config.display.size.height)
                .attr("r", '12' )
                .attr("fill-opacity",1)
                .attr("fill", "#f5f5f5")
                .style("margin-left","6px")
                .attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),config.bgCircles);});
                ;
        
            this.svg.select("#markers-text-group").selectAll("text")
                .data(config.textData).enter()
                .append("text")
                .attr("x",(d) => this.xAxis.scale(d[config.xAxis.dimension]) + 3)
                .attr("y", config.display.size.height)
                .style("font-size", "12px")
                .attr("text-anchor", "middle")
                .text(config.showMax ? (d) => "+" + (d[config.filteredMeasures[0]] - (config.showMax-1)) :(d) => d[config.filteredMeasures])
                .attr("fill", "#008ac6")
                .attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),config.bgText);});

        }
        
        if(config.xAxis.highlightCurrentDate){
            this.svg.select("#x-axis-bg").selectAll("circle")
            .data(config.chartData).enter().append("circle")
            .filter(d => d[config.xAxis.dimension].getDate() === (new Date()).getDate())
            .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
            .attr("cy", 0)
            .attr("r", '8')
            .style("margin-left","6px")
            .attr('fill', 'none')
            .attr("stroke", config.color.range[0])

            // let current_date = config.chartData.filter(d => d[config.xAxis.dimension].getDate() === (new Date()).getDate())
        }

        if (config.xAxis.show && config.xAxis.location == "top") {
            this.svg.select("#x-axis")
                    .attr("transform",`translate(0,${0})`)
                    .call(this.xAxis
                            .axis
                            .tickFormat(config.xAxis.locale === 'en-US'? config.xAxis.localeFormat :config.xAxis.localeFormat.format(config.xAxis.ticks.text.timeFormat))
                            .tickValues(config.xAxis.ticks.text.tickValues))
            }
        else if (config.xAxis.show && config.xAxis.location == "bottom") {
            this.svg.select("#x-axis")
                    .attr("transform",`translate(0,${config.display.size.height - config.display.margin.bottom})`)
                    .call(this.xAxis
                            .axis
                            .tickFormat(config.xAxis.locale === 'en-US'? config.xAxis.localeFormat :config.xAxis.localeFormat.format(config.xAxis.ticks.text.timeFormat))
                            .tickValues(config.xAxis.ticks.text.tickValues));
            }
        if (config.yAxis.show) {
            this.svg.select("#y-axis")
                    .attr("transform",`translate(${config.display.margin.left},0)`)
                    .call(this.yAxis.axis.ticks(config.yAxis.ticks.number)
                    );
        }
        // only select current date to render with different color
        if(config.xAxis.highlightCurrentDate){
            that.svg.select('#x-axis').selectAll('.tick text')
            .filter(d=> d.getDate() === (new Date()).getDate())
            .style('fill', 'black')
        }
 
        if (config.yAxis.ticks.line.show){
            this.svg.select("#y-axis").selectAll(".tick line")
            .attr("x1",0)
            .attr("x2",config.display.size.width-config.display.margin.left-config.display.margin.right)
            .attr("y1",(d,di) => -this.yAxis.scale.bandwidth()/2 )
            .attr("y2", -this.yAxis.scale.bandwidth()/2);

            if(config.alignToYTick){
                this.svg.select("#y-axis").selectAll(".tick text")
                    .attr("y", -this.yAxis.scale.bandwidth()/2);
            }
       
        }

        axisFormat.formatAxes(config);

        if(config.chartData.length == 0 || config.filteredMeasures.length === 0 ){
            if(config.yAxis.hideWhenNoData) this.svg.select("#y-axis").remove() // option to remove y-axis when there is no data
            config.nodata = {...defaults.nodata,...config.nodata}
            config.nodata.text = {...defaults.nodata,...config.nodata.text}
           let text = this.svg.selectAll("#no-data").data([1]).enter().append("text")
                         .attr("id","no-data")
                        .attr("x",config.display.size.width/2)
                        .attr("y",config.display.size.height/2 + config.yAxis.range[1])
                        .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.nodata.text);})
            text.append('tspan')
                        .style("font-size", "14px")
                        .style("fill", "#707070")
                        .text(config.nodata.message)
        
            return
        }

        if(config.score && config.score.show){
            this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-bg").data( [config.score.title.value || "Health score"]).enter().append("rect").attr("class","score-bg");

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
                        .text((d) => d[config.score.measure])
                        .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.score.text);})
                        ;
            this.svg.select(`#scores-group-${textFormat.formatSelector(config.cont.id)}`).selectAll(".score-title").data([config.score.title.value || "Health score"]).enter().append("text").attr("class","score-title");

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
        if(config.highlightLine || config.markerTooltip.show){
            this.svg.select(`#markers-hl-group-${config.cont.id}`).selectAll("circle")
            .data(config.measures)
            .enter().append("circle")
            .attr("class",(d) =>{return `marker-hl-item marker-hl-item-${textFormat.formatSelector(d)}`})
            // .attr("class",(d) =>{return `marker-hl-item-${textFormat.formatSelector(d)}`})
            .attr("r",0)
        }
           
        let markersGroup = this.svg.select("#markers-group");
        markersGroup.selectAll("g").data(config.measures).enter().append("g").attr("id",(d,di) =>{return `markers-group-${di}`});
        markersGroup.selectAll("g").data(config.measures).exit().remove();

        let markersDottedPillsGroup = this.svg.select("#markers-group-dotted-pills");
        markersDottedPillsGroup.selectAll("g").data(config.measures).enter().append("g").attr("id",(d,di) =>{return `markers-group-dotted-pills-${di}`});
        markersDottedPillsGroup.selectAll("g").data(config.measures).exit().remove();
        
        config.measures.map((m,mi) => {
            config.markers[mi] = config.markers[mi]? config.markers[mi]:config.markers[0];
            if(config.markers[mi].show && config.markers[mi].shape == "pill" && !config.dottedPills) {
                markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-item").data(config.chartData).enter().append("g").attr("class","marker-item");
                markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-item").data(config.chartData).exit().remove();

                markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-item")
                            .attr("transform",(d) =>  `translate(${this.xAxis.scale(d[config.xAxis.dimension]) - 2.455},${this.yAxis.scale(m)+this.yAxis.scale.bandwidth()/2-2.629*2})`)
                            .attr("opacity",d => d[m]? 1 : 0)
                            .html(config.mode== 'PRN'?`<rect id="Rectangle_167" class="marker-item-pill-rect" data-name="Rectangle 167" width="5.858" height="10.984" rx="2.929" transform="translate(3.368 10) rotate(24)" fill="#ef6b6b"/>
                            <line id="Line_540" data-name="Line 540" x2="2.929" transform="matrix(0.914, 0.407, -0.407, 0.914, 3.257, 14.711)" fill="none" stroke="#e2e9ed" stroke-linecap="round" stroke-width="1"/>`:
                            (d) => config.color.scale(d[m]) !='#ffffff' ?
                            `<rect id="Rectangle_167" class="marker-item-pill-rect" data-name="Rectangle 167" width="5.858" height="10.984" rx="2.929" transform="translate(3.368 0) rotate(24)" fill="#ef6b6b"/>
                            <line id="Line_540" data-name="Line 540" x2="2.929" transform="matrix(0.914, 0.407, -0.407, 0.914, 3.257, 5.711)" fill="none" stroke="#e2e9ed" stroke-linecap="round" stroke-width="1"/>`:
                            `<rect id="Rectangle_167" class="marker-item-pill-rect" data-name="Rectangle 167" width="5.858" height="10.984" rx="2.929" transform="translate(3.368 0) rotate(24)" stroke-dasharray="${config.markers[mi]['stroke-dasharray']}" stroke="${config.markers[mi].stroke}"  fill="#ef6b6b"/>
                            <line id="Line_540" data-name="Line 540" x2="2.929" transform="matrix(0.914, 0.407, -0.407, 0.914, 3.257, 5.711)" fill="none" stroke="#e2e9ed" stroke-linecap="round" stroke-width="1"/>`)
                            .select(".marker-item-pill-rect")
                            .attr("fill",d =>  config.color.scale(d[m]))

                            if(config.markersTooltip){
                                markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-item")
                                .on("mouseover", function (d) { that.markerMouseOver(this, that, d, m,mi);})
                                .on("mousemove",function(d) {that.markerMouseOver(this,that,d,m,mi);})
                                .on("mouseout", function (d) { that.markerMouseOut(this, that,d,m); });
                            }
            }
           
            if(config.markers[mi].show && config.markers[mi].shape == "circle"){

                if(config.ignoreNullColumns === true){
                   
                        config.symptomsNullsFree = config.chartData.filter(item =>{
                            if(item[config.measures[mi]] === null || undefined){
                                const { [config.measures[mi]]: id, ...other } = item
                                return other
                            } else {
                                return item
                            }
                        });
                        config.chartData = config.symptomsNullsFree
                }

                markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-item").data(config.chartData.filter((p) => p[m])).enter().append("circle").attr("class","marker-item");
                markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-item").data(config.chartData.filter((p) => p[m])).exit().remove();
               
                if(config.alignToYTick){
                    markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-item")
                        .attr("cy",(d) => this.yAxis.scale(d[m]))
                } else {
                    markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-item")
                        .attr("cy",(d) => this.yAxis.scale(d[m])+(mi+1)*this.yAxis.scale.bandwidth()/(2*config.measures.length) + 5)
                } 

                markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-item")
                            // .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                            // .attr("cy",(d) => config.display.size.height)
                            // .transition(easeBounce).duration(1000)
                            // .attr("cy",(d) => this.yAxis.scale(d[m]) + mi*this.yAxis.scale.bandwidth()/config.measures.length)

                            .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                            // .attr("cy",(d) => this.yAxis.scale(d[m])+(mi+1)*this.yAxis.scale.bandwidth()/(2*config.measures.length) + 5)
                            // .attr("cy",(d) => config.highlightLine?(config.yAxis2.show && m == config.yAxis2.measure ? this.yAxis2.scale(d[m]) + this.yAxis.scale.bandwidth()/2: this.yAxis.scale(d[m]) + this.yAxis.scale.bandwidth()/2) : (this.yAxis.scale(d[m]) + mi*this.yAxis.scale.bandwidth()/config.measures.length) )
                            .attr("r",this.yAxis.scale.bandwidth()/(2*config.measures.length))
                            .attr("data-attrs",function(d){
                                return elementFormat.applyAttrs(select(this),config.markers[mi].attrs);})
                            .attr("fill",(d) => config.color.scale(m))
                            .attr("stroke",(d,di) => config.color.scale(m))
                            //.style("opacity",1)
                      
                            if(config.hoveredDataCallback){ // making opacity 1 for hovered data where score is same.
                                markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-item")
                                .style("opacity",function(d){ 
                                    return config.hoveredDataCallback['score'] === d.score ? 1 : 0.3 })
                            } 
                            // else {
                            //     markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-item")
                            //     .style("opacity", function(d){ 
                            //         return d.score === config.chartData[config.chartData.length-1]['score'] ? 1 : 0.3 
                            //     })
                            // }
                            if(config.highlightLine){
                                // console.log('inside markers tooltip')
                                markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-item")
                                .on("click", function (d) { that.markerMouseOver(this, that, d, m,mi);})
                                .on("mousemove",function(d) {that.markerMouseOver(this,that,d,m,mi);})
                                .on("mouseout", function (d) { that.markerMouseOut(this, that,d,m,mi); });
                            }
                            if(config.markersTooltip){
                                markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-item")
                                .on("mouseover", function (d) { that.markerMouseOver(this, that, d, m,mi);})
                                .on("mousemove",function(d) {that.markerMouseOver(this,that,d,m,mi);})
                                .on("mouseout", function (d) { that.markerMouseOut(this, that,d,m,mi); });
                            }
                            if(config.markerTooltip.show){
                                markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-item")
                                .on("click", function (d) { that.highlightLineMouseOver(this, that, d,m,mi);})
                                .on("mouseout", function (d) { that.highlightLineMouseOut(this, that,d,m); });

                                // markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-item")
                                // .on("click", function (d) { that.markerMouseOver(this, that, d, m,mi);})
                                // // .on("mousemove",function(d) {that.markerMouseOver(this,that,d,m,mi);})
                                // .on("mouseout", function (d) { that.markerMouseOut(this, that,d,m,mi); });
                            }
                }
            if(config.markers[mi].line && config.markers[mi].line.show){
                this.svg.select("#lines-group").selectAll(`#line-el-${mi}`).data([1]).enter().append("path").attr("id",`line-el-${mi}`);
                this.svg.select("#lines-group").select(`#line-el-${mi}`)
                            .attr("transform",(d) =>  `translate(${0},${mi*(this.yAxis.scale.bandwidth()/2)/config.measures.length})`)
                            .attr("d", config.lineGenerators[mi](config.chartData))
                            .attr("data-attrs",function(d){return  elementFormat.applyAttrs(select(this),config.markers[mi].line )})
                            .attr("stroke",config.color.scale(m))
            }

        if (config.lines[mi] && config.lines[mi].show && config.markers[mi].shape !== "pill"){

                this.svg.select(`#lines-group`).selectAll(`.lines-${textFormat.formatSelector(m)}`).data(config.chartData.filter((p) => p[m])).enter().append("path").attr("class",`lines-${textFormat.formatSelector(m)}`);
                
                if(config.alignToYTick){
                    this.svg.select(`#lines-group`).selectAll(`.lines-${textFormat.formatSelector(m)}`)
                        .attr("transform",(d) =>  `translate(${0},${0})`)
                } else {
                    this.svg.select(`#lines-group`).selectAll(`.lines-${textFormat.formatSelector(m)}`)
                        .attr("transform",(d) =>  `translate(${0},${(mi+1)*(this.yAxis.scale.bandwidth())/(2*config.measures.length) + 5})`)
                }

                this.svg.select(`#lines-group`).selectAll(`.lines-${textFormat.formatSelector(m)}`)
                // .attr("transform",(d) =>  `translate(${0},${(mi+1)*(this.yAxis.scale.bandwidth())/(2*config.measures.length) + 5})`)
                                                .attr("d",config.lineGenerators[mi](config.chartData.filter((p) => p[m])))
                                                .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.lines[mi].attr || config.lines[mi]);})
                                                .attr("stroke",(d) => config.lines[mi].color ? `url(#grad-${textFormat.formatSelector(m)})` : config.color.scale(m) )
                                                .attr("fill",(d) => "none")
                                                ;
                                                if(config.highlightLine){
                                                    // console.log('inside markers tooltip')
                                                    this.svg.select(`#lines-group`).selectAll(`.lines-${textFormat.formatSelector(m)}`)
                                                    .on("mouseover",function(d) {that.highlightLineMouseOver(this,that,d,m);})
                                                    .on("mousemove",function(d) {that.highlightLineMouseOver(this,that,d,m);})
                                                    .on("mouseout",function(d) {that.highlightLineMouseOut(this,that,d,m);});  
                                                }
                                                    
            }
                if(config.markers[mi].shape == "rect"){
           
                    if(config.ignoreNullColumns === true){
                       
                            config.symptomsNullsFree = config.chartData.filter(item =>{
                                if(item[m] != null && item[m][config.markers[mi].valueField] == null || undefined){
                                    delete item[config.measures[mi]]
                                }
                                return item;
                            });
                    }
                    
                        config.symptomsNullsFree = config.chartData.filter(item =>{
                            if(item[m] != null && item[m][config.markers[mi].valueField] == null || undefined){
                                delete item[config.measures[mi]]
                            }
                            return item;
                        });
                
                
                markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-item").data(config.chartData.filter((p) => p[m])).enter().append("rect").attr("class","marker-item");
                markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-item").data(config.chartData.filter((p) => p[m])).exit().remove();

                markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-item")
                            .attr("x",(d,di) => this.xAxis.scale(d[config.xAxis.dimension])  - config.markers[mi].width/2  )
                            .attr("y",(d) => this.yAxis.scale(m) + this.yAxis.scale.bandwidth()/4)
                            .attr('rx',(d) => config.markers[mi].rx || this.yAxis.scale.bandwidth()/4)
                            .attr('ry',(d) => config.markers[mi].ry || this.yAxis.scale.bandwidth()/4)
                            .attr("width", (d) => config.markers[mi].width || this.yAxis.scale.bandwidth())
                            .attr("height",(d) => config.markers[mi].height || this.yAxis.scale.bandwidth()/2)
                            .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.markers[mi]);})
                            .attr("fill",(d) =>  config.color.scale(d[m][config.markers[mi].valueField]))
                            .attr("stroke",(d,di) => config.color.scale(d[m][config.markers[mi].valueField ]) !='#ffffff' ? config.color.scale(d[m][config.markers[mi].valueField ]) : config.markers[mi]['stroke'])
                            .attr("stroke-dasharray",(d,di) => config.color.scale(d[m][config.markers[mi].valueField ]) !='#ffffff' ? null : config.markers[mi]['stroke-dasharray'])               
            

                markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-text-item").data(config.chartData.filter((p) => p[m])).enter().append("text").attr("class","marker-text-item");
                markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-text-item").data(config.chartData.filter((p) => p[m])).exit().remove();

                markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-text-item")
                            .attr("x",(d) => this.xAxis.scale(d[config.xAxis.dimension]) )
                            .attr("y",(d) => this.yAxis.scale(m) + this.yAxis.scale.bandwidth()*0.5)
                            .attr("data-attrs",function(d){return  elementFormat.applyAttrs(select(this),config.markers[mi].text.attrs )})
                            .attr('text-anchor', 'middle')
                            .text((d) => d[m][config.markers[mi].text.textField ])
                if(config.tooltip.show || config.markersTooltip){
                markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-item")
                            .on("mouseover", function (d) { that.markerMouseOver(this, that, d, m,mi);})
                            .on("mousemove",function(d) {that.markerMouseOver(this,that,d,m,mi);})
                            .on("mouseout", function (d) { that.markerMouseOut(this, that,d,m,mi); });
                markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-text-item")
                            .on("mouseover", function (d) { that.markerMouseOver(this, that, d, m,mi);})
                            .on("mousemove",function(d) {that.markerMouseOver(this,that,d,m,mi);})
                            .on("mouseout", function (d) { that.markerMouseOut(this, that,d,m,mi); });
                }
            }

        })
        
        if (config.bgmarkers.show) {
            if(!config.mode){
                config.totalNullFreeChartData = config.chartData.filter(function( ChartData ) {
                    return ChartData.total !== null;
                });
            }
           
            if(config.mode === "PRN"){
                // config.totalNullFreeChartData =config.chartData.filter(item => ![null,0].includes(item[config.filteredMeasures[0]]))

                if(config.showMax ===null && config.totalNullFreeChartData.length>0){
                this.svg.select("#bg-group-line")
                    .append("line")
                    .attr("x1", 0)
                    .attr("opacity",1)
                    .attr("y1", config.display.size.height - 10)
                    .attr("x2", config.display.size.width )
                    .attr("y2", config.display.size.height-10)
                    .attr("stroke","black")
                    .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.bglines);})
                
                let text =  this.svg
                    .append("text")
                    .attr("x",(d) => this.xAxis.scale(d[config.xAxis.dimension]))
                    .attr("y", config.display.size.height + 5)
                    .style("font-size", "14px")
                    .style("fill", "#707070")
                
                text.append('tspan')
                    .style("font-size", "14px")
                    .style("fill", "#707070")
                    .text(config.totalText)
                }
            }
            // console.log(config,config.totalNullFreeChartData,'main config data for rect backgroung');              
                    this.svg.select("#bg-group-rect").selectAll("rect")
                    .data(config.totalNullFreeChartData).enter()
                    .append("rect")
                    .attr("x",(d) => this.xAxis.scale(d[config.xAxis.dimension])-config.display.size.width*0.2/config.xAxis.ticks.text.tickValues.length)
                    .attr("y", config.display.margin.top + this.yAxis.scale.bandwidth()/4)
                    .attr("width", config.display.size.width*0.5/config.xAxis.ticks.text.tickValues.length)
                    .attr("height",config.display.size.height - config.display.margin.top-config.display.margin.bottom-this.yAxis.scale.bandwidth()/3)
                    .attr("fill", (d) => config.colorbg.scale(d[config.colorbg.dimension]))
                    .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.bgmarkers);})
        }
        if (config.bglines.show) {
            this.svg.select("#bg-group-line").selectAll("line")
                        .data(config.measures).enter()
                        .append("line")
                        .attr("x1", (d,di) => di== config.measures.length-1? 0:this.xAxis.scale.range()[0] -config.display.size.width*0.4/config.xAxis.ticks.text.tickValues.length)
                        .attr("opacity", (d,di) => di != config.measures.length-1 && config.mode == "PRN"? 0:1)
                        .attr("y1", (d) =>  this.yAxis.scale(d))
                        .attr("x2", this.xAxis.scale.range()[1] -config.display.size.width*0.4/config.xAxis.ticks.text.tickValues.length )
                        .attr("y2", (d) =>  this.yAxis.scale(d))
                        .attr("stroke","black")
                        .attr("data-attrs",function(d){return elementFormat.applyAttrs(select(this),config.bglines);})
            
        }
        if(config.tooltip.show && !config.highlightLine){
        this.svg.select(`#rect-overlay-${config.cont.id}`)
        .attr("x",config.display.margin.left)
        .attr("y",config.display.margin.top)
        .attr("width",config.display.size.width-config.display.margin.right-config.display.margin.left)
        .attr("height",config.display.size.height-config.display.margin.bottom-config.display.margin.top)
        .on("mouseover",function() {that.mouseOver(this,that);})
        .on("mousemove",function() {that.mouseOver(this,that);})
        .on("mouseout",function() {that.mouseOut(this,that);});
        }
        if(config.defaultDataHighlighted){ // To make default data / latest data highlighted we are taking it out from orignal data.. we are not changing original data...
            config.defaultSelectedData = config.chartData.slice(-1);
            config.defaultSelectedData = Object.assign({}, ...config.defaultSelectedData );
        }
        if(config.hoveredDataCallback || config.defaultSelectedData){        
        config.measures.map((m,mi) => {
            if(config.hoveredDataCallback){ // if user has hoverd/clicked on marker and sending us through custom callback function
            markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-item")
            .style("opacity",function(d){
                if(d.score){
                    return config.hoveredDataCallback['score'] === d.score ? 1 : 0.5 // with score we need to match and make opacity 1 for the marker-items for e.g, evalautions eq-5dl
                }
                else{   // if there are no scores and we need to check with time so we can use this and make marker-item opacity 1.
                    let a = new Date(d.time)
                    let b = new Date(config.hoveredDataCallback.time)
                    a = `${a.getDate()}-${a.getMonth()}-${a.getFullYear()}`  
                    b = `${b.getDate()}-${b.getMonth()}-${b.getFullYear()}`  
                    return a == b ? 1 : 0.5
                }
            });
            } 
            else{ // if user hasn't shared any hovered data and we need to highlight marker-item for default selected data through time or score matching data.
                markersGroup.select(`#markers-group-${mi}`).selectAll(".marker-item")
                .style("opacity", function(d){ 
                    if(d.score){
                        return d.score === config.chartData[config.chartData.length-1]['score'] ? 1 : 0.5 
                    }else{
                        let a = d.time.getTime();
                        let b = config.defaultSelectedData.time.getTime();
                        return a == b ? 1 : 0.5                    
                    }
                })
            }
        });
        
        let updatedMeasures = []; // We have created updatedMeasures if there is no measure value is there in original data then no need to draw circle for that measure...like in Symptoms chart for hf-care as per new design it's not fixed that we have data for all the measures...so we need to update the measure based on hoveredData
        config.measures.map((m) => {
            if(config.hoveredDataCallback){
                if(m in config.hoveredDataCallback){
                    updatedMeasures.push(m)
                }
            }
            else if(m in config.defaultSelectedData && config.hoveredDataCallback === undefined){
                    updatedMeasures.push(m)
                }
        });
        if(config.hoveredDataCallback && !(config.hoveredDataCallback.symptomName === undefined)){
            if(config.hoveredDataCallback.symptomName != updatedMeasures){
                updatedMeasures = [];
            }
            that.config.measures.map((m,mi) => {  
                that.svg.select(`#markers-group-${mi}`).selectAll(".marker-item")
                .style("opacity", function(s){
                    let a = s.time.getTime()
                    let b = config.hoveredDataCallback.time.getTime()
                    if(s[config.hoveredDataCallback.symptomName]!=undefined){
                        return a!=b? 0.5 : 1   
                    }
                });
            });
        }

        if(!config.markerTooltip.show && updatedMeasures.length > 0){ // Highlighting the circles for hovered data and default data for new Evaluations (eq5dl/symptoms) design for hf-care 
            this.svg.select(`#markers-select-group-${config.cont.id}`).selectAll(".marker-select-item").data(updatedMeasures).enter().append("circle").attr("class","marker-select-item");
            this.svg.select(`#markers-select-group-${config.cont.id}`).selectAll(".marker-select-item").data(updatedMeasures).exit().remove();
            
            if(config.alignToYTick){
                this.svg.select(`#markers-select-group-${config.cont.id}`).selectAll(".marker-select-item")
                    .attr("cy",(d,mi) =>config.hoveredDataCallback?config.hoveredDataCallback.symptomName?
                    that.yAxis.scale(config.data.find(el=>el.time.getTime() === config.hoveredDataCallback.time.getTime())[d])  // We are using this for symptopms, here we are checking first hovered data time with original data for that  particular time then fix ypos for that particular measure
                    :that.yAxis.scale(config.hoveredDataCallback[d]) // for hovered data we are calculating cy
                    :that.yAxis.scale(config.defaultSelectedData[d])) // for default selected data we are calculating cy
            } else {
                this.svg.select(`#markers-select-group-${config.cont.id}`).selectAll(".marker-select-item")
                    .attr("cy",(d,mi) =>config.hoveredDataCallback?config.hoveredDataCallback.symptomName?
                    that.yAxis.scale(config.data.find(el=>el.time.getTime() === config.hoveredDataCallback.time.getTime())[d])+(mi+1)*that.yAxis.scale.bandwidth()/(2*updatedMeasures.length) + 5  // We are using this for symptopms, here we are checking first hovered data time with original data for that  particular time then fix ypos for that particular measure
                    :that.yAxis.scale(config.hoveredDataCallback[d])+(mi+1)*that.yAxis.scale.bandwidth()/(2*updatedMeasures.length) + 5 // for hovered data we are calculating cy
                    :that.yAxis.scale(config.defaultSelectedData[d])+(mi+1)*that.yAxis.scale.bandwidth()/(2*config.measures.length) + 5) // for default selected data we are calculating cy
            }

            this.svg.select(`#markers-select-group-${config.cont.id}`)
            .selectAll(".marker-select-item")
            .attr("cx",config.hoveredDataCallback ? that.xAxis.scale(config.hoveredDataCallback[config.xAxis.dimension]) : that.xAxis.scale(config.defaultSelectedData[config.xAxis.dimension]) )
            // .attr("cy",(d,mi) =>config.hoveredDataCallback?config.hoveredDataCallback.symptomName?
            // that.yAxis.scale(config.data.find(el=>el.time.getTime() === config.hoveredDataCallback.time.getTime())[d])+(mi+1)*that.yAxis.scale.bandwidth()/(2*updatedMeasures.length) + 5  // We are using this for symptopms, here we are checking first hovered data time with original data for that  particular time then fix ypos for that particular measure
            // :that.yAxis.scale(config.hoveredDataCallback[d])+(mi+1)*that.yAxis.scale.bandwidth()/(2*updatedMeasures.length) + 5 // for hovered data we are calculating cy
            // :that.yAxis.scale(config.defaultSelectedData[d])+(mi+1)*that.yAxis.scale.bandwidth()/(2*config.measures.length) + 5) // for default selected data we are calculating cy
            .attr("r",10)
            .attr("class","marker-select-item")
            .attr("fill",(d) => that.config.color.scale(d))
            .attr("stroke",(d,mi) => that.config.markers[mi].stroke || that.config.color.scale(d))
            .style("opacity", (d) => config.hoveredDataCallback ?config.hoveredDataCallback[d] ? 1 : 0 :config.defaultSelectedData[d] ? 1 : 0)
            .attr("fill-opacity", 0.7);
        }
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
    }


    initialize(){
        let config = this.config ;
        this.chart = select(`#${config.chart.id}`);
        
        this.tooltip  = config.tooltip.el;
        this.tooltipHLMarker  = config.markerTooltip.tooltip.el;

        this.svg = config.svg.el
            .attr("width", config.svg.size.width)
            .attr("height",config.svg.size.height + 10)
     

                            // .attr("preserveAspectRatio", "xMinYMid")
                            // .attr("viewBox", `0 0 ${config.svg.size.width} ${config.svg.size.height}`);
        
        this.svg.append("g")
            .attr("class","x-axis-bg")
            .attr("id","x-axis-bg")
            .attr("transform",`translate(0,12)`)

        config.xAxis.el = this.svg.append("g")
                            .attr("class","x-axis axes")
                            .attr("id","x-axis");
                            
        config.yAxis.el = this.svg.append("g")
                            .attr("class","y-axis axes")
                            .attr("id","y-axis");
        this.svg.append("g")
                            .attr("class","bg-rect")
                            .attr("id","bg-group-rect");
        this.svg.append("g")
                            .attr("class","bg-line")
                            .attr("id","bg-group-line");

        this.svg.append("g")
                    .attr("class","lines")
                    .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id","lines-group");

        this.svg.select(`#markers-hl-group-${config.cont.id}`).append("line")
                    .attr("id",`hl-line-${config.cont.id}`)
                    .attr("class","hl-line");               
       
    
        this.svg.append("g")
                    .attr("class","markers")
                    .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id","markers-group-dotted-pills");

        this.svg.append("g")
                    .attr("class","scores")
                    .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                    .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                    .attr("id",`scores-group-${textFormat.formatSelector(config.cont.id)}`);
        this.svg.append("g")
                            .attr("class","marker-text")
                            .attr("id","markers-text-group");

        this.svg.append("g")
                            .attr("class","markers")
                            .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                            .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                            .attr("id",`markers-hl-group-${config.cont.id}`);

        this.svg.append("g")
                            .attr("class","markers-select")
                            .attr("clip-path",`url(#rect-clip-${config.cont.id})`)
                            .style("-webkit-clip-path",`url(#rect-clip-${config.cont.id})`)
                            .attr("id",`markers-select-group-${config.cont.id}`);
        
        this.svg.select(`#markers-hl-group-${config.cont.id}`).append("line")
                    .attr("id",`hl-line-${config.cont.id}`)
                    .attr("class","hl-line");

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

export {XYTimeSeries};