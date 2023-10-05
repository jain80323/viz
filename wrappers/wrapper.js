import { XYChart } from "../charts/xychart";
import { defaults } from "../config/default";
import { layout } from "../utils/layout";
import { axisFormat } from "../utils/axis-formatter";
import { Legend } from "../components/legend";
import { Title } from "../components/title";
import { LineChart } from "../charts/linechart";
import { dataFormat } from "../utils/data-formatter";
import { Tooltip } from "../components/tooltip";
import _ from "lodash";
import { DotPlot } from "../charts/dotplot";
import { BoxPlot } from "../charts/boxplot";
import { TimeSlider } from "../charts/slider";
import { XYTimeSeries } from "../charts/xytimeseries";
import { BIChart } from "../charts/bichart";
import { Gradient } from "../charts/gradient";
import { TimeseriesBar } from "../charts/timeseriesbar";
import { ECGEvents } from "../charts/ecgevents";
import { ECGSlider } from "../charts/ecgslider";
import { KCCQChart } from "../charts/kccq";
import { BARChart} from "../charts/barchart"; 
import { cloneDeep } from 'lodash-es'

 
class BioWrapper {
  constructor(config) {
    this.defaults = cloneDeep(defaults);
    this.config = dataFormat.mergeDeep(this.defaults, config);
    dataFormat.filteringMeasuresByNull(this.config);
    // console.log(config,'config fromm dataviz...')
    layout.parseLayout(this.config);
    this.plotChart();
  }

  addResizeEvent() {
    let config = this.config;
    let chart = this.chart;
    let legend = this.legend;
    function resize() {
      axisFormat.parsexAxisConfig(config);
      axisFormat.parseyAxisConfig(config);
      axisFormat.parseColorConfig(config);
      layout.parseLayout(config);
      chart.updateConfig(config);
    }

    // window.onresize = resize;
  }

  plotChart() {
    switch (this.config.chart.type) {
      case "XYChart":
        axisFormat.parsexAxisConfig(this.config);
        axisFormat.parseyAxisConfig(this.config);
        axisFormat.parseColorConfig(this.config);
        this.chart = new XYChart(this.config);
        this.config.legend.object = new Legend(this.config);
        this.addResizeEvent();
        break;
      case "XYTimeseries":
        axisFormat.parsexAxisConfig(this.config);
        axisFormat.parseyAxisConfig(this.config);
        axisFormat.parseColorConfig(this.config);
        this.chart = new XYTimeSeries(this.config);
        this.legend = this.config.legend.show ? new Legend(this.config) : null;
        this.tooltip = new Tooltip(this.config);
        this.tooltipHLMarker = new Tooltip(this.config.markerTooltip);
        this.addResizeEvent();
        break;
      case "lineChart":
        axisFormat.parsexAxisConfig(this.config);
        axisFormat.parseyAxisConfig(this.config);
        axisFormat.parseyAxis2Config(this.config);
        axisFormat.parseColorConfig(this.config);
        this.chart = new LineChart(this.config);
        this.legend = this.config.legend.show ? new Legend(this.config) : null;
        this.title = this.config.title.show ? new Title(this.config) : null;
        this.tooltip = new Tooltip(this.config);
        this.tooltipHL = new Tooltip(this.config.events);
        this.tooltipHLMarker = new Tooltip(this.config.markerTooltip);

        break;
      case "kccq":
        axisFormat.parsexAxisConfig(this.config);
        axisFormat.parseyAxisConfig(this.config);
        axisFormat.parseColorConfig(this.config);
        this.chart = new KCCQChart(this.config);
        this.legend = this.config.legend.show ? new Legend(this.config) : null;
        this.title = this.config.title.show ? new Title(this.config) : null;
        this.tooltip = new Tooltip(this.config);
        break;
      case "labReport":
        axisFormat.parsexAxisConfig(this.config);
        axisFormat.parseyAxisConfig(this.config);
        this.chart = new LineChart(this.config);
        this.legend = this.config.legend.show ? new Legend(this.config) : null;
        this.title = this.config.title.show ? new Title(this.config) : null;
        this.tooltip = new Tooltip(this.config);
        break;
      case "dotplot":
        axisFormat.parsexAxisConfig(this.config);
        axisFormat.parseyAxisConfig(this.config);
        axisFormat.parseColorConfig(this.config);
        this.chart = new DotPlot(this.config);
        this.legend = this.config.legend.show ? new Legend(this.config) : null;
        this.title = this.config.title.show ? new Title(this.config) : null;
        this.tooltip = new Tooltip(this.config);
        this.tooltipHL = new Tooltip(this.config.events);
        this.tooltipHLMarker = new Tooltip(this.config.markerTooltip);
        break;
      case "boxplot":
        axisFormat.parsexAxisConfig(this.config);
        axisFormat.parseyAxisConfig(this.config);
        axisFormat.parseColorConfig(this.config);
        this.chart = new BoxPlot(this.config);
        this.legend = this.config.legend.show ? new Legend(this.config) : null;
        this.title = this.config.title.show ? new Title(this.config) : null;
        break;
      case "timeslider":
        axisFormat.parsexAxisConfig(this.config);
        axisFormat.parseyAxisConfig(this.config);
        this.chart = new TimeSlider(this.config);
        break;
      case "ecgslider":
        axisFormat.parsexAxisConfig(this.config);
        axisFormat.parseyAxisConfig(this.config);
        this.chart = new ECGSlider(this.config);
        break;
      case "bichart":
        axisFormat.parsexAxisConfig(this.config);
        axisFormat.parseyAxisConfig(this.config);
        axisFormat.parseColorConfig(this.config);
        this.chart = new BIChart(this.config);
        this.tooltip = new Tooltip(this.config);
        break;
      case "gradient":
        axisFormat.parsexAxisConfig(this.config);
        axisFormat.parseColorConfig(this.config);
        this.chart = new Gradient(this.config);
        break;
      case "deviation":
        axisFormat.parsexAxisConfig(this.config);
        axisFormat.parseyAxisConfig(this.config);
        axisFormat.parseColorConfig(this.config);
        this.chart = new TimeseriesBar(this.config);
        this.tooltip = new Tooltip(this.config);
        break;
      case "ecgevents":
        console.log("Ecg events");
        axisFormat.parsexAxisConfig(this.config);
        axisFormat.parseyAxisConfig(this.config);
        this.chart = new ECGEvents(this.config);
        break;
      case "barchart":
        axisFormat.parsexAxisConfig(this.config);
        axisFormat.parseyAxisConfig(this.config);
        axisFormat.parseyAxis2Config(this.config);
        axisFormat.parseColorConfig(this.config);
        this.chart = new BARChart(this.config);
        this.legend = this.config.legend.show ? new Legend(this.config) : null;
        this.title = this.config.title.show ? new Title(this.config) : null;
        this.tooltip = new Tooltip(this.config);
        this.tooltipHLMarker = new Tooltip(this.config.markerTooltip);
        break;
        
    }
  }

  updateChart(config) {
    this.config = dataFormat.mergeDeep(this.defaults, config);
    dataFormat.filteringMeasuresByNull(this.config);
    axisFormat.parsexAxisConfig(this.config);
    axisFormat.parseyAxisConfig(this.config);
    axisFormat.parseColorConfig(this.config);
    layout.parseLayout(this.config);

    this.chart.update(this.config)
  }

  updateConfig(config){
    this.config = config
  }

  updateData(data) {

    let newData = this.config.data.concat(data)
    this.config.data = newData
    dataFormat.filteringMeasuresByNull(this.config);
    this.chart.update(this.config)
    return this.config.newData.concat(data)
    
  }
}

export { BioWrapper };
