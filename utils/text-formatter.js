let textFormat = {};
textFormat.formatSelector = function(s){
    let is = s; 
    return is.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
};

export {textFormat};

