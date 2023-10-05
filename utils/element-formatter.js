let elementFormat = {};

elementFormat.applyAttrs = function(el,config){ 
    Object.keys(config).map((c) => {
        el.attr(c,config[c]);
    });
    return "success";
};


elementFormat.applyStyles = function(el,config){ 
    Object.keys(config).map((c) => {
        el.style(c,config[c]);
    });
    return "success";
};

export {elementFormat};