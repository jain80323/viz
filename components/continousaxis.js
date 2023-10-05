import { axisFormat } from "../utils/axis-formatter";

class ContinousAxis {
    constructor(props){

        this.range = props.range;
        this.domain = props.domain;
        this.orient = props.orient;
        this.position = props.position;
        this.type = "continous";
        axisFormat.configureAxis.call(this);

    }
}

export {ContinousAxis};