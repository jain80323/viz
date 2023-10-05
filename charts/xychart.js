import {select,easeBounce} from  "d3";
import {defaults} from "../config/default";
import {CategoryAxis} from "../components/categoryaxis";
import {axisFormat} from "../utils/axis-formatter";
import {elementFormat} from "../utils/element-formatter";
import { ColorScale } from "../components/colorscale";
import {rectConfig}  from "../config/rect";
import { dataFormat } from "../utils/data-formatter";
import { textFormat } from "../utils/text-formatter";

class XYChart {
    constructor(config){
        this.config = config;
        this.config.yAxis.parentList = [];
        this.updateDomains(config.data);
        this.xAxis = this.getAxis("xAxis");        
        this.yAxis = this.getAxis("yAxis");  
        this.colorScale = this.getAxis("color"); 
        this.config.color.scale = this.colorScale.scale; 
        this.initialize();
        this.update();
    }

    updateDomains(data){
        let config = this.config;
        config.xAxis.domain = dataFormat.fetchDistinctValues(config.xAxis.dimension,config.data);
        config.yAxis.domain = config.yAxis.domain || dataFormat.fetchDistinctValues(config.yAxis.dimension,config.data);
        config.color.domain = config.color.domain || dataFormat.fetchDistinctValues(config.color.dimension,config.data);
    }

    getAxis(type){
        let config = this.config;
        let props;
        switch (type){
        
        case "xAxis":
            props = {...defaults.xAxis,...config.xAxis};
            return new CategoryAxis(props);

        case "yAxis":
            props = {...defaults.yAxis,...config.yAxis};
            return new CategoryAxis(props);

        case "color":
            props = {...defaults.color,...config.color};
            return new ColorScale(props);

        
        
    }
    }

    toggleChildren(parent,config){
        // let config = this.config;
        let children = dataFormat.fetchChildren(parent,config.yAxis.dimension,config.data);
        dataFormat.toggleElement(parent,config.yAxis.parentList);
        children.map((d) => dataFormat.toggleElement(d,config.yAxis.domain));
        config.yAxis.domain = config.yAxis.domain.sort((a,b) => config.yAxis.domain_orig.indexOf(a) - config.yAxis.domain_orig.indexOf(b));
        this.update();
    }

    addClick(){
        let config = this.config;
        config.yAxis.el.selectAll(".tick text")
                            .on("click",(d) => this.toggleChildren(d,this.config))
                            .transition()
                            .text((d) => config.yAxis.parentItems.indexOf(d) >= 0? config.yAxis.parentList.indexOf(d) >= 0?d+" v":d+ " >":d )
                    ;
    }
    updateConfig(config){
        this.config = config;
        this.update();
    }
    
    update(){
        let config = this.config;
        config.chartData =  config.data;

        config.filteredMeasures = config.measures.filter((m) => {
            return config.chartData.map(d => d[m]).some(v => v)
        })
     
        
        this.updateDomains(config.chartData);
        config.filteredData = dataFormat.addParent(config.data);
        config.filteredData = dataFormat.filterData(config.yAxis.domain,config.yAxis.dimension,config.filteredData,"include");
        config.filteredData = dataFormat.filterData(config.xAxis.domain,config.xAxis.dimension,config.filteredData,"include");
        config.filteredData = dataFormat.filterData(config.yAxis.parentList,"parent",config.filteredData,"exclude");

        config.yAxis.parentItems = dataFormat.fetchDistinctValues("parent",config.data);
        config.filteredData = dataFormat.addParent(config.filteredData);
        config.nestedData = dataFormat.nestData([config.yAxis.dimension,config.xAxis.dimension],config.filteredData);
        config.chartData = config.nestedData.sort((a,b) => config.yAxis.domain.indexOf(a.key) - config.yAxis.domain.indexOf(b.key));
        config.markers = {...rectConfig,...config.markers};

        
        this.xAxis = this.getAxis("xAxis");        
        this.yAxis = this.getAxis("yAxis"); 

        
        if (config.xAxis.show) this.svg.select("#x-axis").transition(easeBounce).duration(200).call(this.xAxis.axis).attr("transform",`translate(0,${config.display.size.height-config.display.margin.bottom})`);
        if (config.yAxis.show) this.svg.select("#y-axis").transition(easeBounce).duration(200).call(this.yAxis.axis).attr("transform",`translate(${config.yAxis.margin.left||config.display.margin.left},0)`);
    
        axisFormat.formatAxes(config);

        if(config.data.length == 0 || config.filteredMeasures.length === 0 ){

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
    
        this.svg.select("#markers-group").selectAll("g").data(config.chartData).enter().append("g")
                    .attr("class",(d) => `${textFormat.formatSelector(d.key)}`)
                    .attr("id",(d) => `group-${textFormat.formatSelector(d.key)}`);

        this.svg.select("#markers-group").selectAll("g").data(config.chartData).exit().remove();
        let markerGroups = this.svg.select("#markers-group").selectAll("g");
        
        markerGroups.selectAll("rect")
                    .data((d) => d.values)
                    .enter().append("rect");

        markerGroups.selectAll("rect")
                    .data((d) => d.values)
                    .exit().remove();

        markerGroups.selectAll("rect")
                    .attr("y",(d) => this.yAxis.scale(d.value[config.yAxis.dimension]))
                    // .attr("x",(d) => 0  )
                    .attr("width",this.xAxis.scale.bandwidth())
                    .attr("height",this.yAxis.scale.bandwidth())
                    .transition(easeBounce).duration(200)
                    .attr("x",(d) => this.xAxis.scale(d.value[config.xAxis.dimension]))
                    .attr("y",(d) => this.yAxis.scale(d.value[config.yAxis.dimension]))
                    .attr("width",this.xAxis.scale.bandwidth())
                    .attr("height",this.yAxis.scale.bandwidth())
                    .attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),config.markers);});
        

        if(config.color.show) 
        {
            markerGroups.selectAll("rect")
                    .attr("fill",(d) =>  d.value.color || this.colorScale.scale(d.value[config.color.dimension])
                    )
                    ;
        }
        this.addClick();
        if(config.legend.legend) config.legend.legend.update(config);


    }


    initialize(){
        let config = this.config ;
        config.yAxis.domain_orig = [...[],...config.yAxis.domain] ;
        this.chart = select(`#${config.chart.id}`);
        
        this.svg = config.svg.el
                                .attr("width", config.svg.size.width)
                                .attr("height",config.svg.size.height)
                            // .attr("preserveAspectRatio", "xMinYMid")
                            // .attr("viewBox", `0 0 ${config.svg.size.width} ${config.svg.size.height}`);
        
        config.xAxis.el = this.svg.append("g")
                            .attr("class","x-axis axes")
                            .attr("id","x-axis");
                            
        config.yAxis.el = this.svg.append("g")
                            .attr("class","y-axis axes")
                            .attr("id","y-axis");
                            
        this.svg.append("g")
                            .attr("class","markers")
                            .attr("id","markers-group");



    }

}

export {XYChart};