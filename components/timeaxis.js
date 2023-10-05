import { axisFormat } from "../utils/axis-formatter";

class TimeAxis {
    constructor(props){
        this.range = props.range;
        this.domain = props.domain;
        this.orient = props.orient;
        this.position = props.position;
        this.type = "time";
        this.locale = props.locale;
        axisFormat.configureAxis.call(this);

    }
}

export {TimeAxis};