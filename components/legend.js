import { defaults } from "../config/default";
import {select,selectAll} from "d3";
import {elementFormat} from "../utils/element-formatter";
import {textFormat} from "../utils/text-formatter.js";

class Legend {


    constructor(config) {
        config.legend = {...defaults.legend,...config.legend};
        config.legend.legend = this;
        this.initalize(config);


    }

    update(config) {
        config.legend = {...defaults.legend,...config.legend};
        let el = this.legend;
            // New customized Legends for Images and circles.
                if(config.legend.items.length!==0){
                    el.selectAll(".bv-leg-item").data( config.legend.items).enter().append("div").attr("class","bv-leg-item");
                    el.selectAll(".bv-leg-item").data(config.legend.items).exit().remove();
    
                    el.selectAll(".bv-leg-item")
                    .attr("id",(d,di) => `bv-leg-item-${di}`)
                    .attr("data-styles",function(d){ return elementFormat.applyStyles(select(this),config.legend.styles.legitem ?config.legend.styles.legitem :config.legend.styles["bv-leg-item"]);})
                    .style("display", d => (d.show === true || d.show === undefined) ? (d.label && d.label.styles && d.label.styles.display) ? d.label.styles.display:'flex' : 'none') //allow option to show/hide legend based on config of each legend item. if 'show' keu not given, make item visible at all times, and also taking display style from user config instead of keeping as hardcoded as block. This can create overlapping issue.

                    // For Medication chart we may have customized legends and gradient legends.
                    if(config.color.bvGradientLegendText){
                        el.selectAll(".bv-gradient-legend").data(config.color.bvGradientLegendText).enter().append("div").attr("class","bv-gradient-legend");
                        el.selectAll(".bv-gradient-legend").data(config.color.bvGradientLegendText).exit().remove();
                
                    el.selectAll(".bv-gradient-legend")
                        .attr("data-styles",function(d){ return elementFormat.applyStyles(select(this),config.legend.styles["bv-gradient-legend"]);});
                        config.colorbg.range.pop();
                        config.colorbg.range.map((m,i) => {
                            el.selectAll(".bv-gradient-legend").append("div").style("background-color",config.colorbg.range[i]).attr("data-styles",function(d){ return elementFormat.applyStyles(select(this),config.legend.styles["bv-gradient-legend-item"]);});
                        })
                            
                        el.selectAll(".bv-gradient-legend").selectAll("label")
                        .data((d) => [d]).enter().append("label");
    
                        el.selectAll(".bv-gradient-legend").selectAll("label")
                        .data((d) => [d]).exit().remove("label")  ; 
                        el.selectAll(".bv-gradient-legend").selectAll("label").style("margin-left","6px").html((d,di) => config.legend.titles? config.legend.titles[config.color.bvGradientLegendText.indexOf(d)] : d);
                    }
    
                    // looping through legend items
                    config.legend.items.forEach((item,index) => {
                        switch(item.shape){
                            //image legends
                            case'img' :
                                el.select(`#bv-leg-item-${index}`).selectAll("img") .data([item])
                                    .enter()
                                    .append("img")
                                    
                                el.select(`#bv-leg-item-${index}`).selectAll("img")
                                    .data([item])
                                    .exit().remove("img");
                                
                                el.select(`#bv-leg-item-${index}`).selectAll("img")
                                .attr("src", function() {return item.src})
                                //.attr("data-attrs",function(d){ return elementFormat.applyStyles(select(this),config.legend.styles["bv-leg-item-span"]);})
                                .style("data-styles",function(d){ return elementFormat.applyStyles(select(this),item.image && item.image.styles || {});});
                                
                                
                                break;
                            // shape (circle/rect)
                            default:
                                el.select(`#bv-leg-item-${index}`).selectAll("span")
                                    .data([item])
                                    .enter().append("span");
                                el.select(`#bv-leg-item-${index}`).selectAll("span")
                                    .data([item])
                                    .exit().remove("span");

                                el.select(`#bv-leg-item-${index}`).selectAll("span")
                                    .style("background-color",item.color?item.color:(d) => config.color.scale(d.measure))
                                    .style("border-color",(d) => config.color.scale(d.measure) === '#ffffff' ? "#B8BFCA" : config.color.scale(d.measure) )
                                    .style("border-style",(d) => config.color.scale(d.measure) === '#ffffff' ? "dashed" : "solid")
                                    .style("border-width", '1px')
                                    .attr("data-attrs",function(d){ return elementFormat.applyStyles(select(this),config.legend.styles["bv-leg-item-span"]);}) // assign common styles shared by all legend span items
                                    .style("data-styles",function(d){ return elementFormat.applyStyles(select(this),item.styles || {});}) // allow customization of individual legend span items, which will overwrite common styles 
                                break;
                        }
     
                        //labels for both circle and images.
                        el.select(`#bv-leg-item-${index}`).selectAll("label")
                        .data([item]).enter().append("label")
                 
                        el.select(`#bv-leg-item-${index}`).selectAll("label")
                            .data([item]).exit().remove()
                    
                            el.select(`#bv-leg-item-${index}`).selectAll("label")
                            .attr("data-attrs",function(d){ return elementFormat.applyStyles(select(this),config.legend.styles["bv-leg-item-label"]);}) // assign common styles shared by all legend label items
                            .style("data-styles",function(d){ return elementFormat.applyStyles(select(this), item.label && item.label.styles || {});}) // allow customization of individual legend label items, which will overwrite common styles 
                            .html(item.title);

                        let measuresArr = item.measure ? [item.measure] : item.measures
                        measuresArr.map(el => {
                            config.legend.clicked[textFormat.formatSelector(el)] = 0
                        })

                        if(config.legend.clickable){
                   
                            el.select(`#bv-leg-item-${index}`) 
                                .on('click', function(){
                                    measuresArr.map(el => {
                                        let measure = textFormat.formatSelector(el)
                                        config.legend.clicked[measure] = 1-config.legend.clicked[measure] // toggle clicked state
                                        let nestedValues = []
                                        config.markers.map(m=>{
                                            m.rect && m.rect.map(r=>nestedValues.push({value: r.value, parent: m.measure, shape: 'rect'}))
                                            m.circle && m.circle.map(c=>nestedValues.push({value: c.value, parent: m.measure, shape: 'circle'}))
                                        })

                                        let shapeConfig = nestedValues.find(d=>d.value === el)
                                        let markerConfig = config.markers.find(m=>m.measure === el) || config.markers.find(m=>m.measure === shapeConfig.parent)
                                        let lineConfig = config.lines.find(m=>m.measure === el)
                                        let areaConfig = config.areas.find(m=>m.measure === el)

                                        // since all marker groups are above the rect-overlay, toggle both opacity & pointer-events directly on these elements
                                        // for lines/area, interaction is from rect-overlay, so update opacity on lines/area, but update pointer-events on rect-overlay
                                        if(markerConfig.shape == "custom"){                   
                                            if(el === shapeConfig.value){
                                                config.svg.el.selectAll(`.marker-item-${textFormat.formatSelector(shapeConfig.value)}`)
                                                .attr('opacity', config.legend.clicked[measure] ? 0 : markerConfig && markerConfig.opacity || 1) //click to hide markers or revert to original opacity
                                                .style('pointer-events', config.legend.clicked[measure] ? 'none' : 'all') // click to stop interactivity when opacity is 0 

                                            } 
                                        } else {
                                            config.svg.el.selectAll(`#markers-group-${measure}`).selectAll('.marker-item')
                                            .attr('opacity', config.legend.clicked[measure] ? 0 : markerConfig && markerConfig.opacity || 1)
                                            .style('pointer-events', config.legend.clicked[measure] ? 'none' : 'all')

                                            config.svg.el.selectAll(`#markers-group-${measure}`).selectAll('.marker-item-single')
                                            .attr('opacity', config.legend.clicked[measure] ? 0 : markerConfig && markerConfig.opacity || 1) //click to hide markers or revert to original opacity
                                            .style('pointer-events', config.legend.clicked[measure] ? 'none' : 'all')
                                        }
                                        config.svg.el.selectAll(`.lines-${measure}`)
                                            .attr('opacity', config.legend.clicked[measure] ? 0 : lineConfig && lineConfig.opacity || config.line && config.line.opacity || 1) //click to hide line or revert to original opacity
         
                                        config.svg.el.selectAll(`.area-${measure}`)
                                            .attr('opacity', config.legend.clicked[measure] ? 0 : areaConfig && areaConfig.attrs && areaConfig.attrs.opacity || config.area && config.area.opacity || 1) //click to hide area or revert to original opacity
                                        
                                        // because line path interaction is from rect-overlay, toggle point-events on it. 
                                        // check legend clicked status on measure associated with line/area. if clicked, stop interaction with rect-overlay
                                        if(lineConfig || areaConfig){
                                            config.svg.el.select(`#rect-overlay-${config.cont.id}`)
                                                .style('pointer-events', config.legend.clicked[measure] ? 'none' : 'all')
                                        }
                                        // gives user flexibility to change styles such as border opacity based on config specifications
                                        select(this).attr("data-styles",function(d){ return elementFormat.applyStyles(select(this), config.legend.clicked[measure] ? config.legend.styles["bv-leg-item-deselected"] : config.legend.styles["bv-leg-item"]);}) // click to deselect
                                    })
                                })
                        }

                    });

                }
                else{
                    //old legend code
                    el.selectAll(".bv-leg-item").data( config.color.domain).enter().append("div").attr("class","bv-leg-item");
                    el.selectAll(".bv-leg-item").data(config.color.domain).exit().remove();

                if(config.color.bvGradientLegendText){
                    el.selectAll(".bv-gradient-legend").data(config.color.bvGradientLegendText).enter().append("div").attr("class","bv-gradient-legend");
                    el.selectAll(".bv-gradient-legend").data(config.color.bvGradientLegendText).exit().remove();
            
                el.selectAll(".bv-gradient-legend")
                    .attr("data-styles",function(d){ return elementFormat.applyStyles(select(this),config.legend.styles["bv-gradient-legend"]);});
                    config.colorbg.range.pop();
                    config.colorbg.range.map((m,i) => {
                        el.selectAll(".bv-gradient-legend").append("div").style("background-color",config.colorbg.range[i]).attr("data-styles",function(d){ return elementFormat.applyStyles(select(this),config.legend.styles["bv-gradient-legend-item"]);});
                    })
                        
                    el.selectAll(".bv-gradient-legend").selectAll("label")
                    .data((d) => [d]).enter().append("label");

                    el.selectAll(".bv-gradient-legend").selectAll("label")
                    .data((d) => [d]).exit().remove("label")  ; 
                    el.selectAll(".bv-gradient-legend").selectAll("label").style("margin-left","6px").html((d,di) => config.legend.titles? config.legend.titles[config.color.bvGradientLegendText.indexOf(d)] : d);
                }

            
                el.selectAll(".bv-leg-item")
                    .attr("data-styles",function(d){ return elementFormat.applyStyles(select(this),config.legend.styles.legitem ?config.legend.styles.legitem :config.legend.styles["bv-leg-item"]);})
 
                if(!config.legend.showOnlyTitle){
                el.selectAll(".bv-leg-item").selectAll("span")
                    .data((d) => [d])
                    .enter().append("span");
                el.selectAll(".bv-leg-item").selectAll("span")
                    .data((d) => [d])
                    .exit().remove("span");

                el.selectAll(".bv-leg-item").selectAll("span")
                .style("background-color",(d) => config.color.scale(d))
                .style("border-color",(d) => d === (config.dottedPills && config.dottedPillsKey[0]) ? "#B8BFCA" : config.color.scale(d) )
                .style("border-style",(d) => d === (config.dottedPills && config.dottedPillsKey[0]) ? "dashed" : "solid" )
                .style("border-width", '1px')
                .attr("data-styles",function(d){ return elementFormat.applyStyles(select(this),config.legend.styles.legitemspan ?config.legend.styles.legitemspan :config.legend.styles["bv-leg-item-span"]);});
                }
                    // ["bv-leg-item-span"]
                el.selectAll(".bv-leg-item").selectAll("label")
                    .data((d) => [d]).enter().append("label");

                el.selectAll(".bv-leg-item").selectAll("label")
                    .data((d) => [d]).exit().remove("label")  ; 
                el.selectAll(".bv-leg-item").selectAll("label").html((d,di) => config.legend.titles? config.legend.titles[config.color.domain.indexOf(d)] : d);

                // create an object to store clicked state of each legend item (1: clicked, 0: initial state/previous click reverted)
                config.color.domain.map(d=>{
                    config.legend.clicked[textFormat.formatSelector(d)] = 0
                })

                if(config.legend.clickable){
                    el.selectAll(".bv-leg-item")  
                        .on('click', function(d){
                            let measure = textFormat.formatSelector(d)
                            let markerConfig = config.markers.find(m=>m.measure === d)
                            let lineConfig = config.lines.find(m=>m.measure === d)
                            let areaConfig = config.areas.find(m=>m.measure === d)
                            config.svg.el.selectAll(`#markers-group-${measure}`).selectAll('.marker-item').attr('opacity', config.legend.clicked[measure] ? 0 : markerConfig && markerConfig.opacity || 1) //click to hide markers or revert to original opacity
                            config.svg.el.selectAll(`.lines-${measure}`).attr('opacity', config.legend.clicked[measure] ? 0 : lineConfig && lineConfig.opacity || config.line && config.line.opacity || 1) //click to hide line or revert to original opacity
                            config.svg.el.selectAll(`.area-${measure}`).attr('opacity', config.legend.clicked[measure] ? 0 : areaConfig && areaConfig.attrs && areaConfig.attrs.opacity || config.area && config.area.opacity || 1) //click to hide area or revert to original opacity
                            // gives user flexibility to change styles such as border opacity based on config specifications
                            select(this).attr("data-styles",function(d){ return elementFormat.applyStyles(select(this), config.legend.clicked[measure] ? config.legend.styles["bv-leg-item-deselected"] : config.legend.styles["bv-leg-item"]);}) // click to deselect
                            config.legend.clicked[measure] = 1-config.legend.clicked[measure] // toggle clicked state
                        })
                }

            }

    }
    initalize(config){
        this.legend = select(`#${config.legend.id}`).attr("data-styles",function(d){ return elementFormat.applyStyles(select(this),config.legend.styles.bvlegend ? config.legend.styles.bvlegend :config.legend.styles["bv-legend"] );})
                                                        .style("height","auto");
        this.update(config);
    };
}
export {Legend};