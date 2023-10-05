import {select,easeBounce} from  "d3";
import {defaults} from "../config/default";
import {axisFormat} from "../utils/axis-formatter";
import {elementFormat} from "../utils/element-formatter";
import { ColorScale } from "../components/colorscale";
import {rectConfig}  from "../config/rect";
import {circleConfig} from "../config/circle";
import { dataFormat } from "../utils/data-formatter";
import { ContinousAxis } from "../components/continousaxis";
import { TimeAxis } from "../components/timeaxis";
import { generator } from "../utils/generators";

class LineChart {
    constructor(config){
        this.xAxis = this.getAxis("xAxis",config);   
        this.lineGenerator = generator.lineGenerator(this.xAxis.scale,config.xAxis.dimension,this.yAxis.scale,config.yAxis.measure);
        this.flatLine = generator.flatLine(this.xAxis.scale,config.xAxis.dimension,config.display.size.height);
        this.initialize(config);
        this.update(config);
    }

    getAxis(type,config){
        let props;
        switch (type){
        
        case "xAxis":

            dataFormat.adjustTZ(config.xAxis.dimension,config.tzOffset,config.data);
            config.xAxis.dimension = config.xAxis.dimension || config.dimensions[0];
            config.xAxis.domain = config.xAxis.domain || dataFormat.fetchRange(config.xAxis.dimension,config.data);
            props = {...defaults.xAxis,...config.xAxis};
            return new TimeAxis(props);

        
        
    }
    }

    

    
    update(config){
        config.chartData = config.data;
        
        config.filteredMeasures = config.measures.filter((m) => {
            return config.chartData.map(d => d[m]).some(v => v)
        })
       
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
        
    }

        config.markers = {...config.markers,...circleConfig};
        if (config.xAxis.show) this.svg.select("#x-axis").call(this.xAxis.axis);
        if (config.yAxis.show) this.svg.select("#y-axis").call(this.yAxis.axis);


        

        axisFormat.formatAxes(config);



    }

    initialize(config){
        this.chart = select(`#${config.chart.id}`);
        this.svg = config.svg.el
                            .attr("preserveAspectRatio", "xMinYMin meet")
                            .attr("viewBox", `0 0 ${config.svg.size.width} ${config.svg.size.height}`);

        
        config.xAxis.el = this.svg.append("g")
                            .attr("class","x-axis axes")
                            .attr("id","x-axis")
                            .attr("transform",`translate(0,${config.display.size.height})`);
        
        this.svg.append("g")
                            .attr("class","rect-group")
                            .attr("id","rect-group");
        
        this.svg.append("g").attr("id","axis-rect-group").attr("class","rect-group");
        

        this.svg.append("g").attr("id","m-rect-group").attr("class","rect-group");


        this.svg.append("g").attr("id","mb-line-group").attr("class","rect-group");

    }

}

export {LineChart};