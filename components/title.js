import  {defaults} from "../config/default";
import {select} from "d3";
import {elementFormat } from "../utils/element-formatter";


class Title{
    constructor(config){

        config.title = {...config.title,...defaults.title};
        this.config = config;
        this.initalize(config);
        this.update(config);
    }


    infoMouseOver(el,that,seq){
        let node = select(el).node();
        let tt= that.config.cont.el.select(`#${that.config.tooltip.id}`)
        tt.style("display","block")
            .style("position","absolute")
            .style("top","10px")
            .style("background-color",that.config.tooltip.styles['background-color'])
            .style("color",that.config.tooltip.styles.color)
            .style("font-size",that.config.tooltip.styles['font-size'])
            .style("line-height",that.config.tooltip.styles['line-height'])
            .style("width",that.config.tooltip.styles.width || "auto")
            .style("height","auto")
            .html(` <span> ${that.config.title.info.desc} </span>`)
            ;
        if (seq == 1){
            tt.style("left",`${node.offsetLeft+30}px`)
                            .style("right",null)
                            .html(` <span> ${that.config.title.info.desc} </span>`)
        }
        else if (seq == 2){
            tt.style("left",null)
                            .style("left",`${node.offsetLeft-tt.node().offsetWidth - 20}px`)
                            .html(` <span> ${that.config.title.info2.desc} </span>`)
        }
    }

    infoMouseOut(el,that){
        let node = select(el).node();
        that.config.cont.el.select(`#${that.config.tooltip.id}`).style("display","none");
            ;
    }

    update(config) {


        let el = this.title;
        let that = this;
        el.select("#title-heading")
            .attr("data-styles",function(d){ return elementFormat.applyStyles(select(this),config.title.heading.styles);})
            .html(`<p>${config.title.heading.value} </p>`);
        el.select("#title-icon")
            .attr("data-styles",function(d){ return elementFormat.applyStyles(select(this),config.title.info.styles);})
            .html(`<span> <img id = info-icon-img-${config.cont.id} src = "${config.title.info.url}" />  </span>`)
            .on("mouseover",function(){ that.infoMouseOver(this,that,1);}).on("mouseout",function(){ that.infoMouseOut(this,that);}); 
        if (config.yAxis2.show) {
            el.select("#title-icon2")
                .attr("data-styles",function(d){ return elementFormat.applyStyles(select(this),config.title.heading2.styles);})
                .html(`<span> <img id = info-icon-img-${config.cont.id} src = "${config.title.info2.url}" />  </span>`)
                .on("mouseover",function(){ that.infoMouseOver(this,that,2);}).on("mouseout",function(){ that.infoMouseOut(this,that);}); 
            el.select("#title-heading2")
                .attr("data-styles",function(d){ return elementFormat.applyStyles(select(this),config.title.heading2.styles);})
                .html(`<p>${config.title.heading2.value} </p>`);
        }
    }
    
    initalize(config){

        this.title = select(`#${config.title.id}`).attr("class","bv-title")
                            .attr("data-styles",function(d){ return elementFormat.applyStyles(select(this),config.title.styles);})
                
                                            ;
        this.title.selectAll("#title-left").data([1]).enter().append("div").attr("id","title-left").attr("data-styles",function(d){ return elementFormat.applyStyles(select(this),config.title['title-left'].styles);});
                
        this.title.select("#title-left").selectAll("#title-heading").data([1]).enter().append("div").attr("class","title-heading").attr("id","title-heading")
                                ;
        this.title.select("#title-left").selectAll("#title-icon").data([1]).enter().append("div").attr("class","title-icon").attr("id","title-icon");
        if (config.yAxis2.show) {
            this.title.selectAll("#title-right").data([1]).enter().append("div").attr("id","title-right").attr("data-styles",function(d){ return elementFormat.applyStyles(select(this),config.title['title-right'].styles);});
            this.title.select("#title-right").selectAll("#title-icon2").data([1]).enter().append("div").attr("class","title-icon").attr("id","title-icon2");
            this.title.select("#title-right").selectAll("#title-heading2").data([1]).enter().append("div").attr("class","title-heading").attr("id","title-heading2");
        }

    }

}
export {Title};