import {lineConfig} from "../config/line"; 
import {textConfig} from "../config/text"; 
import { cloneDeep } from 'lodash-es'

let ticksConfig = {
    number : 5,
    line: {...cloneDeep(lineConfig),...{show:false}},
    text: {...cloneDeep(textConfig),...{show:true,timeInterval: '1-minute',
    timeFormat: '%e %b %Y'}},
    tickFormat:"", // Keeping timeFormat as default if user don't pass any timeformat.

};
export {ticksConfig};