import { axisFormat } from "../utils/axis-formatter";
import {dataFormat} from "../utils/data-formatter";

class CategoryAxis {
    constructor(props){
        this.range = props.range;
        this.domain = props.domain;
        this.orient = props.orient;
        this.position = props.position;
        this.padding = props.padding ;
        this.type = "categorical";
        axisFormat.configureAxis.call(this);

    }
    updateDomain(domain){
        this.domain = props.domain;
        axisFormat.configureAxis.call(this);
    }
}

export {CategoryAxis};