import {nest,extent, timeMinute, timeSecond, timeHour, timeDay, timeMonth, max, min, timeMillisecond} from "d3";

let dataFormat = {};

dataFormat.getlength = function(number){
    return (number + '').replace('.', '').length;
}

dataFormat.fetchDistinctValues = function(column,data){
    return Array.from(new Set(data.map((d) => d[column])));
};

dataFormat.fixMarkers = function(config){
    config.markers.forEach((d) =>{
        d['valueField'] = d['valueField'] || d['m']
    })

}

dataFormat.nestData = function(columnList,data){

    let nested = nest();
    columnList.map((d,di) => {
                    nested.key((p) => p[d]);
                            });
    let nestedData = nested.rollup((values) => values[0])
        .entries(data);

    
    return nestedData;
                                    
};

dataFormat.filterData = function(domain,column,data,type){
    if(type == "include") return data.filter((d) => domain.indexOf(d[column]) >= 0);
    if(type == "exclude") return data.filter((d) => domain.indexOf(d[column]) < 0);
};

dataFormat.filteringMeasuresByNull = function(config){
    config.chartData = config.data;
    if(config.ignoreNullColumns === true){
        config.filteredMeasures = config.measures.filter((m, mi) => {
        
            return config.chartData.map(d => !config.ignoreValues.includes(config.markers[mi] && config.markers[mi].valueField ? d[m][config.markers[mi].valueField ] : d[m])).some(v => v)
        })
    }
else{
    config.filteredMeasures = config.measures;
}
}

dataFormat.fetchRange = function(column,data){
    return extent(data.map((d) => d[column]));
};

dataFormat.fetchDynamicRange = function(column,data,config){
    let highestData = 0;
    let lowestData = 0;
    config.chartData = config.data
    
    if(config.measures.length > 1){

        config.measures.map((m) => {
            config.totalNullFreeChartData =config.chartData.filter(item => ![null,0].includes(item[m]))

        highestData = config.totalNullFreeChartData.reduce((a, b) => a[m] > b[m] ? a : b);
        lowestData = config.totalNullFreeChartData.reduce((a, b) => a[m] < b[m] ? a : b);
        })
        const filterObject = (obj, arr) => { // for multiple measures like for dotplots
                        Object.keys(obj).forEach((key) => {
                           if(!arr.includes(key)){
                              delete obj[key];
                           };
                        });
                     };
        let copiedHighData = Object.assign({}, highestData); //Created a Shallow copy so original data don't get altered.
            filterObject(copiedHighData, config.measures); // pass the copied data with all measures.
            column = Object.keys(copiedHighData).reduce((a, b) => copiedHighData[a] > copiedHighData[b] ? a : b); // pass the maximum measure value so we can generate dynamic yaxis based on data
            // console.log(column,'highColumn');

        // let copiedHighData = Object.assign({}, highestData); //Created a Shallow copy so original data don't get altered.
        let copiedLowData = Object.assign({}, lowestData); //Created a Shallow copy so original data don't get altered.
            filterObject(copiedLowData, config.measures); // pass the copied data with all measures.
        let lowColumn = Object.keys(copiedLowData).reduce((a, b) => copiedLowData[a] < copiedLowData[b] ? a : b); // pass the maximum measure value so we can generate dynamic yaxis based on data
                    //  console.log(lowColumn,'lowColumn');
        
            if(config.references.length > 0){
                // If References line are more than actual Yaxis domain and data values....
                let highestReference = config.references.reduce((a, b) => a.value > b.value? a : b);
                let lowestReference = config.references.reduce((a, b) => a.value < b.value? a : b);
                    copiedHighData[column] = highestReference.value > copiedHighData[column]?highestReference.value:copiedHighData[column];
                    copiedLowData[lowColumn] = lowestReference.value < copiedLowData[lowColumn]?lowestReference.value:copiedLowData[lowColumn];
            }
            if(copiedHighData[column]>config.yAxis.domain[1] && copiedLowData[lowColumn]< config.yAxis.domain[0]){ // Id data value is higher and lower then the default range then we need to alter both higher and lower domain.
                return [copiedLowData[lowColumn] - 20,copiedHighData[column] + 10]
            }
            else if(copiedHighData[column] > config.yAxis.domain[1]){ // If Data value is higher than default domain range, then we need to alter the domain.
            return [config.yAxis.domain[0],copiedHighData[column] + 10];
    
            } 
            else if(copiedLowData[lowColumn]< config.yAxis.domain[0]){ // If data value is lower than default domain range, then we need to alter domain.
                return [copiedLowData[lowColumn] - 20,config.yAxis.domain[1]];
            }
            else{
            return [config.yAxis.domain[0],config.yAxis.domain[1]]; // If data values lies under default Y axis domain, then no need to alter the domain.
            }
    }

    else{ // if we have single measure for e.g, a line chart for spo2,rr, lab reports etc.
        config.totalNullFreeChartData =config.chartData.filter(item => ![null,0].includes(item[column]))

        highestData = config.totalNullFreeChartData.reduce((a, b) => a[column] > b[column] ? a : b);
        lowestData = config.totalNullFreeChartData.reduce((a, b) => a[column] < b[column] ? a : b);
        let copiedHighData = Object.assign({}, highestData); //Created a Shallow copy so original data don't get altered.
        let copiedLowData = Object.assign({}, lowestData); //Created a Shallow copy so original data don't get altered.

        // console.log(lowestData[column],highestData[column],config.totalNullFreeChartData,'lowest and highest');

        if(config.references.length > 0){
            // If References line are more than actual Yaxis domain and data values....
            let highestReference = config.references.reduce((a, b) => a.value > b.value? a : b);
            let lowestReference = config.references.reduce((a, b) => a.value < b.value? a : b);
                copiedHighData[column] = highestReference.value > copiedHighData[column]?highestReference.value:copiedHighData[column];
                copiedLowData[column] = lowestReference.value < copiedLowData[column]?lowestReference.value:copiedLowData[column];
        }

        if(copiedHighData[column]>config.yAxis.domain[1] && copiedLowData[column]< config.yAxis.domain[0]){ // Id data value is higher and lower then the default range then we need to alter both higher and lower domain.
            return [copiedLowData[column] - 10,copiedHighData[column] + 10]
        }
        else if(copiedHighData[column] > config.yAxis.domain[1]){ // If Data value is higher than default domain range, then we need to alter the domain.
        return [config.yAxis.domain[0],copiedHighData[column] + 10];

        } 
        else if(copiedLowData[column]< config.yAxis.domain[0]){ // If data value is lower than default domain range, then we need to alter domain.
            return [copiedLowData[column] - 10,config.yAxis.domain[1]];
        }
        else{
        return [config.yAxis.domain[0],config.yAxis.domain[1]]; // If data values lies under default Y axis domain, then no need to alter the domain.
        }
    }
}

dataFormat.fetchMultiRange = function(columns,data){
    let maxData = 0;
    let minData = 999999999;
    columns.map((c) => {
        maxData= max( [maxData, max(data.map((d) => d[c] ))])
        minData= min( [minData, min(data.map((d) => d[c] ))])
    })
    return [minData*0.8,maxData*1.2];
};

dataFormat.adjustTZColumn = function(column,tzoffset,data){
    data.map((d) => {
        d.old_time = d[column];
        d[column] =  dataFormat.adjustTZValue(d[column], tzoffset);
    });
};

dataFormat.adjustTZList = function(tzoffset,data){
    return data.map((d) => {
        let date;
            if(typeof(d) == "number"){
                let date = dataFormat.adjustTZValue(d, tzoffset);
                return date
            }
            else{
                return d;
            }
    });

};

dataFormat.adjustTZValue = function(ts,tzoffset){
    let date;
    if(typeof(ts) == "number"){
        ts = ts
        if(dataFormat.getlength(ts) === 13){
            date = new Date((+ts+(tzoffset*60*1000)));
        } else if(dataFormat.getlength(ts) === 10){
            date = new Date((+ts+tzoffset*60)*1000)
        } else {
            date = ts
        } 
        return  new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
    }
    else{
        // ts = moment(ts).unix();
        return ts;
    }
};

dataFormat.adjustTime = function(tzoffset,data){
    return data.map((d) => {
        let date;
            if(typeof(d) == "number"){
                d = d
                if(dataFormat.getlength(d) === 13){
                    return new Date(d)
                } else if(dataFormat.getlength(d) === 10){
                    return new Date(d*1000)
                } else {
                    return d
                }
            }
            else{
                // ts = moment(ts).unix();
                return d;
            }
    });

};

dataFormat.addParent = function(data){
    return data.map((d) => {d.parent = d.parent || "root";return d;} );
};

dataFormat.fetchChildren = function(parent,column,data){
    return Array.from(new Set(data.filter((d) => d.parent == parent).map((d) => d[column]))); 
};

dataFormat.toggleElement = function(item,list){
    let ind = list.indexOf(item);
    if(ind >= 0) list.splice(ind,1);
    if(ind < 0) list.push(item);
};

dataFormat.mergeDeep = function  (target, source) {
    for (var prop in source) {
        if (source.hasOwnProperty(prop)) {
            if (target[prop] != undefined && typeof source[prop] === 'object') {
                dataFormat.mergeDeep(target[prop], source[prop]);
            }
            else {
                target[prop] = source[prop];
            }
        }
    }
    return target;
};

dataFormat.getTimeLevel = function(level){
    switch(level){
        case "minute":
            return timeMinute;
        case "second":
            return timeSecond;
        case "millisecond":
            return timeMillisecond;
        case "hour":
            return timeHour;
        case "day":
            return timeDay;
        case "month":
            return timeMonth;
        default:
            return timeMinute;
    }
}

export {dataFormat};