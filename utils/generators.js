import {area, line, curveCatmullRom } from "d3";

let generator = {};

generator.lineGenerator = function(xScale,xColumn,yScale,yColumn){
    return line()
            .x((d) => xScale(d[xColumn])  )
            .y((d) => yScale(d[yColumn]))
            .defined((d) => d[yColumn]!= null);
};

generator.areaGenerator = function(xScale,xColumn,yScale,yColumn){
    return area()
        .x((d) => xScale(d[xColumn])  )
        .y0(yScale.range()[0])
        .y1((d) => yScale(d[yColumn]))
        .defined((d) => d[yColumn] != null);
};

generator.flatLine = function(xScale,xColumn,height){
    return line()
            .x((d) => xScale(d[xColumn]))
            .y((d) => height)
            .defined((d) => d[yColumn] != null); 
};

generator.getLineGenerator = function(xScale,yScale,config){
    return	line()
                // .curve(curveCatmullRom)
                .x((d) => {return xScale(+d[config.x]%config.displayTime);})
                .y((d) => { return yScale(d[config.y]);})
                .defined((d) => {return d[config.x]%config.displayTime;})
                ;
}

export {generator};