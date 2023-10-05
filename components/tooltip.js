import { defaults } from "../config/default";
import {select,selectAll,timeFormat,format,timeFormatLocale} from "d3";
import {elementFormat} from "../utils/element-formatter";
import { TimeAxis } from "../components/timeaxis";

class Tooltip {
    
    constructor(config) {
        config.tooltip.tooltip = this
        this.initalize(config);
    }

    update(config, position, selectedData) {
        
        selectedData.xPos = position.xPos
        selectedData.yPos = position.yPos
        let callback = config.tooltip.custom
        let tooltip = config.tooltip.el
        let markersCallback = config.markersTooltipCallback
        let markerMouseout = config.markersTooltipCallbackMouseout

        if(callback){
            callback(tooltip, selectedData)
        }
        else if(selectedData.source == 'markersTooltip' && markersCallback){
            // console.log('inside mouseover data', selectedData)
            markersCallback(tooltip,selectedData)
        }
        else if(selectedData.markersMouseoutFunction =='markersMouseout' && markerMouseout){
            // console.log(selectedData,'mouseout from selectedData');
            markerMouseout(tooltip,selectedData)
        }
        else if(selectedData.source == 'markersTooltip' && config.markersTooltipCallback == null){
            let html = ""
            
            config.tooltip.dimensions.map((d,di) =>{
                let dim_data = selectedData[d.dimension]
                if(dim_data) html +=   `<span> ${d.title}: ${timeFormat(d.timeFormat)(dim_data)} </span>  </br>`;
            });

            config.tooltip.measures.map((d,di) =>{


                if(config.markers[di].showTooltip ){

                    let measure_data = selectedData[d.measure]
                    // let tooltipMarkersTitle = Object.values(config.markers).find(item => item.measure === measure_data);
                    if(measure_data) html += `<span> ${d.title}: ${ config.yAxis.type == "continous" ? format(d.format || ".2f")(measure_data): (config.markers[di].title || measure_data) } ${config.markers[di] ? config.markers[di].unit || "" : ""}</span> </br>`;
            }
            });
            tooltip
                .style("display","block")
                .style("position","absolute")
                .style("top",position.yPos)
                .style("left",position.xPos)
                .attr("data-styles",function(d){return elementFormat.applyStyles(select(this),config.tooltip.styles);})
                .html(html)
        }

        else {
            // selectedData gets pick up on mouseOver rect-overlay. Don't show tooltip if all measures in selectedData have null/undefined values
            let noMeasureValues = config.tooltip.measures.every((d,di) => {
                let marker = Object.values(config.markers).find(item => item.measure === d.measure);
                let measure_data = selectedData[d.measure]
                if((marker && marker.showTooltip) || measure_data=== null || measure_data=== undefined ) return true
            });

            let html = ""
 
            config.tooltip.dimensions.map((d) =>{
                let dim_data = selectedData[d.dimension]
                if(config.xAxis.locale === 'en-US'){
                    if(dim_data) html +=   `<span> ${d.title}: ${timeFormat(d.timeFormat)(dim_data)} </span>  </br>`;
                }
                else{
                    if(dim_data) html +=  `<span>${d.title}: ${timeFormatLocale(localezhCN).format(config.tooltip.dimensions[0].timeFormat)(dim_data)}`;
                }
            });

            if(html === "") return
        
            config.tooltip.measures.map((d,di) => {
                if(d.show_value === false ? false : true){
                    let measure_data = selectedData[d.measure]
                    let marker = config.markers.find(item => item.measure === d.measure) || config.markers[di]
                    let tooltipMarkers = config.markers.find(item => item.measure === measure_data); // for XYTimeseries only
                    measure_data = tooltipMarkers ? tooltipMarkers.title : measure_data
                    if(measure_data && (measure_data!== null || measure_data!== undefined || measure_data !== 0 )) {
                        html += `<span> ${d.title}: ${ config.yAxis.type == "continous" ? format(d.format || ".2f")(measure_data): measure_data} ${marker ? (marker.unit || "") : ""}</span> </br>`;
                    } 
                    else {
                        d.title ? html += `<span> ${d.title}: - ${marker ? (marker.unit || "") : ""}</span> </br>` : '' // if no value, replace it with '-'
                    }
                }
            });

            if(!noMeasureValues){
                tooltip
                    .style("display","block")
                    .style("position","absolute")
                    .style("top",position.yPos)
                    .style("left",position.xPos)
                    .attr("data-styles",function(d){return elementFormat.applyStyles(select(this),config.tooltip.styles);})
                    .html(html)
            }
        }
        
        
    }

    initalize(config){
        let tooltip = config.tooltip.el;
        tooltip
            .attr("data-attrs",function(d){ return elementFormat.applyAttrs(select(this),config.tooltip.attrs);})
            .attr("data-styles",function(d){ return elementFormat.applyStyles(select(this),config.tooltip.styles);})
        
    }


}
export {Tooltip};
