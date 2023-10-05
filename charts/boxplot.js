import {select,easeBounce, timeFormat, timeMinutes, timeMinute, mouse, bisector, format} from  "d3";
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
import { CategoryAxis } from "../components/categoryaxis";

class BoxPlot {
    constructor(config){
        this.config = config;
        this.initialize();
        this.update();
    }

    updateDomains(data){
        let config = this.config;
        config.xAxis.domain = config.xAxis.domain || dataFormat.fetchDistinctValues(config.xAxis.dimension,config.data);
        config.yAxis.domain = config.yAxis.domain || dataFormat.fetchMultiRange(config.yAxis.measures,data);
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
            props = config.xAxis;
            return new CategoryAxis(props);

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
        
        let mouseEvent = mouse(el);
        let timeLevel = dataFormat.getTimeLevel(that.config.xAxis.timeLevel);
        let config = that.config;
        let x0 = that.xAxis.scale.invert(mouseEvent[0]);
        let xLevel = timeLevel(x0).getTime();

        let bisectDate = bisector((d,x) => {return d.timestamp -x }).right;

        let selectedData = that.config.data.length > 0 ? that.config.data.reduce((a,b) => {
            return Math.abs(b[config.xAxis.dimension] - xLevel) < Math.abs(a[config.xAxis.dimension] - xLevel) ? b : a;
        }):null; //bisectDate(that.config.data, xLevel); //that.config.data.find((d) =>  d[that.config.xAxis.dimension]== xLevel);
        
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

    

    
    update(){
        let config = this.config;
        let that = this;
        config.chartData = config.data;
        // config.filteredMeasures = config.measures.filter((m) => {
        //     return config.chartData.map(d => d[m]).some(v => v)
        // })
        // if(config.chartData.length == 0 || config.filteredMeasures.length === 0 ){
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

        if (config.xAxis.show) this.svg.select("#x-axis").call(this.xAxis.axis);
        if (config.yAxis.show) this.svg.select("#y-axis").call(this.yAxis.axis.ticks(config.yAxis.ticks.number));
        
       
        

        this.svg.select(`#bg-group-line-${config.cont.id}`)
                    .selectAll(`.bg-item-line-${config.cont.id}`).data(config.chartData)
                    .enter().append("line")
                    .attr("class",`bg-item-line-${config.cont.id}`);        
        this.svg.select(`#bg-group-line-${config.cont.id}`)
                    .selectAll(`.bg-item-line-${config.cont.id}`).data(config.chartData)
                    .exit().remove();        
        this.svg.select(`#bg-group-line-${config.cont.id}`)
                    .selectAll(`.bg-item-line-${config.cont.id}`)
                    .attr("x1",(d) => this.xAxis.scale(d[config.xAxis.dimension]) +this.xAxis.scale.bandwidth()/2)
                    .attr("y1",(d) => this.yAxis.scale(d.Max))
                    .attr("x2", (d) => this.xAxis.scale(d[config.xAxis.dimension])  +this.xAxis.scale.bandwidth()/2)
                    .attr("y2",(d) => this.yAxis.scale(d.Min))
                    .attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),config.line);})
                        
                    ;   
        // this.svg.select(`#value-group-${config.cont.id}`)
        //             .selectAll(`.value-item-${config.cont.id}`).data(config.chartData)
        //             .enter().append("rect")
        //             .attr("class",`value-item-${config.cont.id}`);        
        // this.svg.select(`#value-group-${config.cont.id}`)
        //             .selectAll(`.value-item-${config.cont.id}`).data(config.chartData)
        //             .exit().remove();        
        // this.svg.select(`#value-group-${config.cont.id}`)
        //             .selectAll(`.value-item-${config.cont.id}`)
        //             .attr("x",(d) => this.xAxis.scale(d[config.xAxis.dimension]) )
        //             .attr("y",(d) => this.yAxis.scale(d.q3))
        //             .attr("width", (d) => this.xAxis.scale.bandwidth())
        //             .attr("height",(d) => this.yAxis.scale(d.q1) - this.yAxis.scale(d.q3))
        //             .attr("fill",(d) => this.config.color.scale(d[config.color.dimension]))
        //             // .attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),config.line);})
                        
        //             ; 
        this.svg.select(`#value-group-${config.cont.id}`)
                    .selectAll(`.value-item-circle-${config.cont.id}`).data(config.chartData)
                    .enter().append("circle")
                    .attr("class",`value-item-circle-${config.cont.id}`);        
        this.svg.select(`#value-group-${config.cont.id}`)
                    .selectAll(`.value-item-circle-${config.cont.id}`).data(config.chartData)
                    .exit().remove();        
        this.svg.select(`#value-group-${config.cont.id}`)
                    .selectAll(`.value-item-circle-${config.cont.id}`)
                    .attr("cx",(d) => this.xAxis.scale(d[config.xAxis.dimension]) + this.xAxis.scale.bandwidth()/2 )
                    .attr("cy",(d) => this.yAxis.scale(d.Mean))
                    .attr("fill",(d) => this.config.color.scale(d[config.color.dimension]))
                    .attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),config.circle);})
                        
                    ;    
        this.svg.select(`#bg-group-line-${config.cont.id}`)
                    .selectAll(`.bg-item-line-min-${config.cont.id}`).data(config.chartData)
                    .enter().append("line")
                    .attr("class",`bg-item-line-min-${config.cont.id}`);        
        this.svg.select(`#bg-group-line-${config.cont.id}`)
                    .selectAll(`.bg-item-line-min-${config.cont.id}`).data(config.chartData)
                    .exit().remove();        
        this.svg.select(`#bg-group-line-${config.cont.id}`)
                    .selectAll(`.bg-item-line-min-${config.cont.id}`)
                    .attr("x1",(d) => this.xAxis.scale(d[config.xAxis.dimension]) + this.xAxis.scale.bandwidth()/2 - 15)
                    .attr("y1",(d) => this.yAxis.scale(d.Min))
                    .attr("x2",(d) => this.xAxis.scale(d[config.xAxis.dimension]) + this.xAxis.scale.bandwidth()/2 + 15)
                    .attr("y2",(d) => this.yAxis.scale(d.Min))
                    .attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),config.line);})
                        
                    ;   
        this.svg.select(`#bg-group-line-${config.cont.id}`)
                    .selectAll(`.bg-item-line-max-${config.cont.id}`).data(config.chartData)
                    .enter().append("line")
                    .attr("class",`bg-item-line-max-${config.cont.id}`);        
        this.svg.select(`#bg-group-line-${config.cont.id}`)
                    .selectAll(`.bg-item-line-max-${config.cont.id}`).data(config.chartData)
                    .exit().remove();        
        this.svg.select(`#bg-group-line-${config.cont.id}`)
                    .selectAll(`.bg-item-line-max-${config.cont.id}`)
                    .attr("x1",(d) => this.xAxis.scale(d[config.xAxis.dimension]) + this.xAxis.scale.bandwidth()/2 - 15)
                    .attr("y1",(d) => this.yAxis.scale(d.Max))
                    .attr("x2",(d) => this.xAxis.scale(d[config.xAxis.dimension]) + this.xAxis.scale.bandwidth()/2 + 15)
                    .attr("y2",(d) => this.yAxis.scale(d.Max))
                    .attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),config.line);})
                        
                    ;   

        if(config.bglines.show){
            this.svg.select(`#bg-border-line-right-${config.cont.id}`)
                        .selectAll(`.bg-item-border-right-${config.cont.id}`).data(config.chartData)
                        .enter().append("line")
                        .attr("class",`bg-item-border-right-${config.cont.id}`);        
            this.svg.select(`#bg-border-line-right-${config.cont.id}`)
                        .selectAll(`.bg-item-border-right-${config.cont.id}`).data(config.chartData)
                        .exit().remove();        
            this.svg.select(`#bg-border-line-right-${config.cont.id}`)
                        .selectAll(`.bg-item-border-right-${config.cont.id}`)
                        .attr("x1",(d,di) => config.display.size.width/config.xAxis.domain.length * (di+1))
                        .attr("y1",0)
                        .attr("x2",(d,di) => config.display.size.width/config.xAxis.domain.length * (di+1))
                        .attr("y2",config.display.size.height)
                        .attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),config.bglines);})
                            
                        ;   
            
            this.svg.select(`#bg-border-line-bottom-${config.cont.id}`)
                        .selectAll(`.bg-item-border-bottom-${config.cont.id}`).data(config.chartData)
                        .enter().append("line")
                        .attr("class",`bg-item-border-bottom-${config.cont.id}`);        
            this.svg.select(`#bg-border-line-bottom-${config.cont.id}`)
                        .selectAll(`.bg-item-border-bottom-${config.cont.id}`).data(config.chartData)
                        .exit().remove();        
            this.svg.select(`#bg-border-line-bottom-${config.cont.id}`)
                        .selectAll(`.bg-item-border-bottom-${config.cont.id}`)
                        .attr("x1",(d,di) => config.display.size.width/config.xAxis.domain.length * (di))
                        .attr("y1",config.display.size.height-40)
                        .attr("x2",(d,di) => config.display.size.width/config.xAxis.domain.length * (di+1))
                        .attr("y2",config.display.size.height-40)
                        .attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),config.bglines);})
                            
                        ;   
        }
          
        ['Max','Mean','Min'].map((d,di) =>{
            let yAdj = 0
            if(d === 'Max'){
                yAdj = -1
            } else if(d === 'Mean'){
                yAdj = 0
            } else if(d === 'Min'){
                yAdj = 1
            }
            
            this.svg.select(`#text-group-${config.cont.id}`)
                    .selectAll(`.text-item-${d}-${config.cont.id}`).data(config.chartData)
                    .enter().append("text")
                    .attr("class",`text-item-${d}-${config.cont.id}`);        
            this.svg.select(`#text-group-${config.cont.id}`)
                        .selectAll(`.text-item-${d}-${config.cont.id}`).data(config.chartData)
                        .exit().remove();        
            this.svg.select(`#text-group-${config.cont.id}`)
                        .selectAll(`.text-item-${d}-${config.cont.id}`)
                        .attr("x",(p,pi) => d === 'Mean' ? this.xAxis.scale(p[config.xAxis.dimension]) + this.xAxis.scale.bandwidth()/2 + 15 : this.xAxis.scale(p[config.xAxis.dimension]) + this.xAxis.scale.bandwidth()/2)
                        .attr("y",(p) => this.yAxis.scale(p[d]))
                        .attr("text-anchor", d === 'Mean' ? "start":"middle")
                        .attr("alignment-baseline", "middle")
                        .text((p) => ` ${format("d")(p[d])} (${d}) `)
                        .attr("data-attrs",function(d){ 
                            let dy = yAdj * parseFloat(config.text.dy)
                            return elementFormat.applyAttrs(select(this),{...config.text, dy});
                        })
                            
                        ;  



        })
                    
         
                    
                   

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

        
        config.xAxis.el = this.svg.append("g")
                            .attr("class","x-axis axes")
                            .attr("id","x-axis")
                            .attr("transform",`translate(0,${config.display.size.height-config.display.margin.bottom})`);
        config.yAxis.el = this.svg.append("g")
                            .attr("class","y-axis axes")
                            .attr("id","y-axis")
                            .attr("transform",`translate(${config.display.margin.left},0)`);
        if(config.yAxis2.show){
            config.yAxis2.el = this.svg.append("g")
                            .attr("class","y-axis axes")
                            .attr("id","y-axis2")
                            .attr("transform",`translate(${config.display.size.width-config.display.margin.right},0)`);
        }

        
        this.svg.append("g")
                            .attr("class","lines")
                            .attr("id","lines-group");


        
        

        
        this.svg.append("g")
                    .attr("class","bg-group-line")
                    .attr("id",`bg-group-line-${config.cont.id}`);
        this.svg.append("g")
                    .attr("class","bg-group-circle")
                    .attr("id",`bg-group-circle-${config.cont.id}`);
        this.svg.append("g")
                    .attr("class","text-group")
                    .attr("id",`text-group-${config.cont.id}`);
    
        this.svg.append("g")
                    .attr("class","value-group")
                    .attr("id",`value-group-${config.cont.id}`);
      
        this.svg.append("g")
            .attr("class","bg-border-line")
            .attr("id",`bg-border-line-right-${config.cont.id}`);

        this.svg.append("g")
            .attr("class","bg-border-line")
            .attr("id",`bg-border-line-bottom-${config.cont.id}`);

        this.svg.append("rect")
                    .attr("id",`rect-overlay-${config.cont.id}`)
                    .attr("class","rect-overlay")
                    .attr("fill","none")
                    .style("pointer-events","all");

        
        

    }

}

export {BoxPlot};