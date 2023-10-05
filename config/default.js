import {schemeCategory10} from "d3";
import {lineConfig} from "../config/line"; 
import {ticksConfig} from "../config/ticks"; 
import {textConfig} from "../config/text";
// import _ from "lodash";
import { cloneDeep } from 'lodash-es'

let defaults = {

    cont:{id: "App",size:{}},
    chart: {type:"XYChart",size:{}},
    totalText:'Total',
    showMax: 5,
    dottedPills:false,
    dottedPillsKey:[],
    updateSvg:false,
    nodata: {
        show: true,
        message:'No data available',
        text: {
          fill: '#707070',
            'font-weight': 'normal',
            'font-size': 12,
            'font-family': 'IBM Plex Sans, sans-serif',
            timeInterval: '4-hour',
            timeFormat: '%H:%M',
            'text-anchor': 'middle',
        }
      },
    title: {
        height: 50,
        styles: {
            display:"flex",
            "flex-direction": "row",

        },
        "title-left":{
            styles: {
                "flex-grow": 1,
                display: "flex",

            }
        },
        "title-right":{
            styles: {
                "flex-grow": 1,
                display: "flex",
                "justify-content": "flex-end",
                
            }
        },
        heading: {
            value:"This is heading", 
            styles: {
                "font-size": "20px",
                "background-color": "#ffffff",
                "padding":"10px 0 10px 20px",
                "margin-bottom":"15px",
                "color":"#00002d"
            }
        },
        info:{
            url: "",
            desc:"A feeling of physical suffering caused by injury or illness",
            styles: {},
        } ,
        heading2: {
            value:"This is heading", 
            styles: {
                "font-size": "20px",
                "background-color": "#ffffff",
                "padding":"10px 0 10px 20px",
                "margin-bottom":"15px",
                "color":"#00002d"
            }
        },
        info2:{
            url: "",
            desc:"A feeling of physical suffering caused by injury or illness",
        } 
    },
    svg: {},
    tzOffset: 300,
    dimensions: [],
    measures: [],
    markersTooltip:false,
    ignoreNullColumns : false,
    ignoreValues:[],
    ignoreZeroes:true,
    totalNullFreeChartData:[{}],
    highlightLine:false,
    showReferencesLines:false,
    defaultDataHighlighted:false,
    keepMarkerHighlighted:false,
    color: {
        show:false,
        range: schemeCategory10
    },
    markers: [{
        show: false,
        shape: "rect",
        showTooltip: false,
        opacity: 1,
        text:{
            show:false,
          },
        line: {...cloneDeep(lineConfig),...{show:false}}
    }],
    dataLabels: [
        {
        show: false,
        text:{
            show:false,
        },
        },
    ],
    xAxis: {
        fixTimeZone: false,
        title: {
            show: false,
            styles: {},
            attrs: cloneDeep(textConfig),
        },
        show:true,
        orient: "horizontal",
        position: "bottom",
        padding: 0.1,
        timeLevel: "minute",
        line: cloneDeep(lineConfig),
        ticks: cloneDeep(ticksConfig),
        type:"continous",
        location: "top",
        locale:"en-US",
        highlightCurrentDate:false,
        
    },
    xAxisGrid: {
        title: {
            show: false,
            styles: {},
            attrs: cloneDeep(textConfig),
        },
        show:true,
        orient: "horizontal",
        position: "bottom",
        padding: 0.1,
        timeLevel: "minute",
        line: cloneDeep(lineConfig),
        ticks: cloneDeep(ticksConfig),
        type:"continous",
        location: "top"
    },
    text: cloneDeep(textConfig),
    yAxis: {
        title: {
            show: false,
            styles: {},
            attrs: cloneDeep(textConfig),
        },
        show:true,
        dynamicyAxis:false,
        orient: "vertical",
        position: "left",
        range: [0,500],
        padding: 0.1,
        line: cloneDeep(lineConfig),
        ticks: cloneDeep(ticksConfig),
        type:"continous",
        margin:{},
        step: 30,
        offset: {top: 0, bottom: 0}
    },
    yAxis2: {
        title: {
            show: false,
            styles: {},
            attrs: cloneDeep(textConfig),
        },
        show:false,
        orient: "vertical",
        position: "right",
        range: [0,500],
        padding: 0.1,
        line: cloneDeep(lineConfig),
        ticks: cloneDeep(ticksConfig),
        type:"continous",
        margin:{}
    },
    legend: {
        height: 75,
        show:false,
        showOnlyTitle:false, // if user wanted to show only title not span/circle
        clicked: {},
        // customLegends:false,
        // items:[
        //   {
        //     shape:"",
        //     title:'',
        //     color:'',
        //     styles:{
        //     //   "width": "12px",
        //     //   "height": "12px",
        //     //   "display": "inline-block",
        //     //   "margin-right": "3px",
        //     //   "fill-opacity": "0.5",
        //     //   border: '1px solid #E2E9ED',
        //     //   'border-radius': '50%'
        //     },
        //   }, 
        // ],
        items:[],
        styles:{
        "bv-legend":{
            "margin-top":"5px",
            "display": "flex",
            "flex-direction": "row",
            "flex-wrap": "wrap",
            "align-items":"center",
            "justify-content" : "center"
          },
          "bv-leg-item-label":{
          },
          "bv-leg-item-span":{
            "width": "12px",
            "height": "12px",
            "display": "inline-block",
            "margin-right": "3px",
            "fill-opacity": "0.5",
            "border-radius": "3px",
          },
          "bv-leg-item":{
            "text-align": "center",
            "padding": "10px 20px 10px 20px",
            "margin-top": "5px",
            "height": "40px",
            "margin-left": "10px",
            "border-radius": "5px",
            "font-size": "12px",
            "line-height": "20px",
            "margin-right": "4px",

          },
          "bv-gradient-legend":{
            "display":"flex",
            "height":"10px",
            "margin-top": "-7px",
            "margin-left": "9px",
            "font-size": "12px",
            "line-height": "20px",
            "text-align": "center",

        },
        "bv-gradient-legend-item":{
                "padding": "9px",
            }, 
        "bv-customized-legend":{
                "display":"contents",
                "text-align": "center",
                "padding": "10px 20px 10px 20px",
                "margin-top": "5px",
                "height": "40px",
                "margin-left": "10px",
                "border-radius": "5px",
                "font-size": "12px",
                "line-height": "20px",
                "margin-right": "4px",
            },
        "bv-customized-legend-item":{
                    "padding": "1px",
                },
        }
    },
    tooltip: {
        show: true,
        offset: {x: 20, y: 0},
        custom: null,
        measures: [
            
        ],
        dimensions: [

        ],
        attrs: {

        },
        styles :{
            width: "240px",
            height: "50px",
            "background-color": "#fff",
            "color": "black",
            "font-size": "12px",
            "line-height": "15px",
            "text-align": "center",
            "border": "1px solid black",

            

        },
        line: {...cloneDeep(lineConfig),...{show:false}}
    },
    events:{
        // highlightTooltip: {
        //     show: false,
        //     line: { show: false },
        //     offset: { x: 0, y: 0 },
        //     tooltipCallback: null,
        // },
        show: false,
        line: { show: false },
        tooltip:{
            active: false,
            attrs: {
                'fill-opacity': 0.35,
              },
              styles :{
                  height: '70px',
                  // "background-color": "#fff",
                  "color": "red",
                  "font-size": "12px",
                  "line-height": "15px",
                  "text-align": "center",
                  "border": "1px solid red",
                  "pointer-events": "all",
                  "z-index": 9999999
              }
        },
        measures: [],
        dimensions:[],
        // highlight: [
        //     {
        //         show:false,
        //     }
        // ],
    },
    activityIntensity:{
        // highlightTooltip: {
        //     show: false,
        //     line: { show: false },
        //     offset: { x: 0, y: 0 },
        //     tooltipCallback: null,
        // },
        show: false,
        line: { show: false },
        tooltip:{
            active: false,
            attrs: {
                'fill-opacity': 0.35,
              },
              styles :{
                  height: '70px',
                  // "background-color": "#fff",
                  "color": "red",
                  "font-size": "12px",
                  "line-height": "15px",
                  "text-align": "center",
                  "border": "1px solid red",
                  "pointer-events": "all",
                  "z-index": 9999999
              }
        },
        color:{},
        measure: {},
        dimensions:[],
        // highlight: [
        //     {
        //         show:false,
        //     }
        // ],
    },
    markerTooltip:{
        show: false,
        line: { show: false },
        tooltip:{
            active: false,
            attrs: {
                'fill-opacity': 0.35,
              },
              styles :{
                  height: '70px',
                  // "background-color": "#fff",
                  "color": "red",
                  "font-size": "12px",
                  "line-height": "15px",
                  "text-align": "center",
                  "border": "1px solid red",
                  "pointer-events": "all",
                  "z-index": 9999999
              }
        },
        measures: [],
        dimensions:[],
    },
    line : {...{show:true},...lineConfig},
    area: { opacity:1},
    multiline: {
        markers: [ ]
    },
    colorByMeasure: true,
    bglines: {
        show: false,
        stroke: '#F5F5F5',
        opacity: 1,
    }
};

export {defaults};