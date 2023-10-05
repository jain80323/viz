import {scaleOrdinal} from "d3";
class ColorScale {

    constructor(props){ 
        this.range = props.range;
        this.domain = props.domain;
        this.padding = props.padding ;
        this.scale = this.getScale();
    }

    getScale(){
        return scaleOrdinal().domain(this.domain).range(this.range);
    }
}

export {ColorScale};