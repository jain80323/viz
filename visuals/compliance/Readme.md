Compliance visual shows the compliace of the user over the time for the metrics specified. The class object takes the config as the input and creates a visual object which can be used further to update and modify.

## Usage

If you are using commonJs syntax 

```javascript
var bioviz = require("bioviz");
var compliance = new bioviz.Compliance(config);
```

If you are using ES6 syntax 

```javascript
import {Compliance} from "bioviz";
var compliance = new Compliance(config);
```

The following table shows the config required by the chart which should be dictionary. For the optional cases default Descriptions would be used which can be overridden by adding them the required Descriptions to the config. The Descriptions expected for the each of the elements are listed below the table.

|Key| Type |Description|
|:---:|:---:|:---| 
| data | required | Data that used for plotting the chart. Should be list of the objects.   data = ```[{column1:"a1",column2:"a2",measure:"No"},{column1:"a1",column2:"b2",measure:"Yes"}, {column1:"a1",column2:"c2",measure:"No"}, {column1:"a1",column2:"d2",measure:"Yes"}, {column1:"b1",column2:"a2",measure:"Yes"}, {column1:"b1",column2:"b2",measure:"No"}, ]```   |
| dimensions | required | list of columns that should be used. Compliance chart expects two columns  |
| measures | optional | Name of the column name that should be used as . It should be a quantitative measure. |
| color | required | Properties that should be used for coloring markers |
| cont | required | Properties for the container |
| chart | required | Properties for the chart |
| title | optional | Properties for the title | 
| svg | optional | Properties for the svg element |
| markers | optional | Properties for the markers |
| xAxis | optional | Properties for the x axis |
| yAxis | optional | Properties for the y axis |


### xAxis

Configuration for the x-axis element

>|Key| Type |Description|
>|:---:|:---:|:---| 
>| dimension | optional | Dimension that should be used for the x-axis. If not specified first element form the dimensions list will be used.|
>| show | optional | Boolean value to show or hide the x-AXis. Default value is true|
>| orient | optional | Specifies the direction of the axis.  ```horizontal,vertical```.  Default value is horizontal. |
>| position | optional  | The placement of the axis. Default value is bottom |
>| range | optional | the size range of the axis interms of width. Default values will be calculated based on the chart width|
>| values | optional | The list of values for the x-axis. If you need to filter some elements or change the order, please specify here. |
>| line | optional | The stylings for the line element. Options avaiable are  <br> ``` show, To show or hide the line on axis. Default value: true.```<br>```stroke, Color of the line in the x axis. Default value "#000".```<br>```stroke-width, Stroke width for the axis line. Default value 2. ``` |
>| ticks | optional | The stylings for the tick elements. Each tick element has two components, text and line. <br> ```{``` <br> ``` show: To show/hide the tick marks, Default value True ,```<br> <br> ```text: {fill:  Text color for the axis. Default value: "#000",``` <br> ```text-anchor: position of the text elements w.r.t data points. Default value "middle".Posible values are start, middle, end,```<br>```font-size: Font size for the text elements. Default value 12,``` <br> ```font: font type for the text elements. Default value Open sans, Sans serif,``` <br> ```font-weight: boldness for the text. Default value is 700 },``` <br><br> ```line : { stroke, Color of the line in the x axis. Default value "#000",```<br>```stroke-width: Stroke width for the axis line. Default value 2 }```<br> ```}```|


### yAxis

Configuration for the y-axis element

>|Key| Type |Description|
>|:---:|:---:|:---| 
>| dimension | optional | Dimension that should be used for the y-axis. If not specified second element form the dimensions list will be used.|
>| show | optional | Boolean value to show or hide the y-aXis. Default value is true|
>| orient | optional | Specifies the direction of the axis.  ```horizontal,vertical```. <br> Default value is vertical. |
>| position | optional  | The placement of the axis. Default value is left |
>| range | optional | the size range of the axis interms of width. Default values will be calculated based on the chart width|
>| domain | optional | The list of values for the y-axis. If you need to filter some elements or change the order, please specify here. |
>| padding | optional | Gap between each value of the axis. |
>| line | optional | The stylings for the line element. Options avaiable are  <br> ``` show, To show or hide the line on axis. Default value: true.```<br>```stroke-color, Color of the line in the x axis. Default value "#000".```<br>```stroke-width, Stroke width for the axis line. Default value 2. ``` |
>| ticks | optional | The stylings for the tick elements. Each tick element has two components, text and line. <br> ```{``` <br> ``` show: To show/hide the tick marks, Default value True ,```<br> <br> ```text: {fill:  Text color for the axis. Default value: "#000",``` <br> ```text-anchor: position of the text elements w.r.t data points. Default value "middle".Posible values are start, middle, end,```<br>```font-size: Font size for the text elements. Default value 12,``` <br> ```font: font type for the text elements. Default value Open sans, Sans serif,``` <br> ```font-weight: boldness for the text. Default value is 700 },``` <br><br> ```line : { stroke, Color of the line in the x axis. Default value "#000",```<br>```stroke-width: Stroke width for the axis line. Default value 2 }```<br> ```}```|




### color

The details for coloring the markers based on a column

>|Key| Type |Description|
>|:---:|:---:|:---| 
>| show | optional | A binary Description whether the markers should be colored w.r.t to a column. Default Description is false | 
>| dimension | required if show is set to true | String | 
>| range | optional | list of colors to be used for coloring markers. Will be used only when the show is set to True. </br> default value is d3.schemeCategory10() |

### cont

Used for configuring the container. Three divs will be added corresponding to title, chart, legend.
>|Key| Type |Description|
>|:---:|:---:|:---| 
>| id | required | Required : Specifies the id for the element that should be used for appending the chart| 
>|size| optional | ```{width : "width of the container"```,<br>```height: "height of the container" }``` <br>Specifies the dimensions for the container. <br> The Description will be used directly to apply styles, so mention along with the units. eg : 50%, 500px  etc <br> If not specified the dimensions of the element are used directly. |

### chart

Used for configuring chart elements

>|Key| Type |Description|
>|:---:|:---:|:---| 
>| type | required | type of the chart that should be used. For compliance chart only "XYChart" is supported for now | 
>|size| optional | ```{width : "width of the container"```,<br>```height: "height of the container" }``` <br>Specifies the dimensions for the chart. <br>. The Description will be used directly to apply styles, so mention along with the units. eg : 50%, 500px  etc <br> If not specified the dimensions are calculated based on the container. |

### markers

The actual markers for the data.

>|Key| Type |Description|
>|:---:|:---:|:---| 
>| shape | required | Supported values <br> ```rect``` |
>| fill | optional | Fills the marker with the value specified. Value to be used when the show in color is set to false. |
>| stroke | optional | Stroke for the marker with the value specified. Value to be used when the show in color is set to false. |
>| stroke-width | optional | Stroke width for the marker. Default value 1 |
>| rx | optional | border radius in x-direction for the rectangle marker. Default value 3 |
>| ry | optional | border radius in y-direction for the rectangle marker. Default value 3 |
>| fill-opacity | optional | Fill opacity for the rectangle marker. Default value 1 |
>| opacity | optional | Opacity for the rectangle marker. Default value 1 |




