var require = (function (config) {
    config = config || {};
    var configRequire = {
            "context": "rrouu",
            "baseUrl": "./",
            "paths": {
                "bower_components": "./bower_components",
                "_shared" : (config.singleCacheSvr || ".") + "/_shared",
                "salespages-ui": "./bower_components/salespages-ui/src",
                "jquery": "./bower_components/jquery/jquery"
            },
            "shim": {
                "bower_components/jquery-cookie/jquery.cookie": ["jquery"]
            },
            "map" : {
                "*" : {
                    "poly": "bower_components/poly/poly",
                    "when": "bower_components/when/when",
                    "angular": "bower_components/angular/angular",
                    "template": "salespages-ui/widget/template/main",
                    "csstemplate": "salespages-ui/widget/css-template/2.0/main",
                    "cssrender": "salespages-ui/widget/css-render/2.0/main"
                }
            },
            "config" : {
                "salespages-ui/widget/css-render/2.0/main" : {
                    "singleCacheSvr": config.singleCacheSvr || "",
                    "cacheSvr":  config.cacheSvr || config.singleCacheSvr || ""
                },
                "salespages-ui/widget/css-template/2.0/main": {
                    "paths": config.csspaths || {}
                }
            }
        };
    if (config.app) {
        configRequire.paths[config.app] = "./src";
    }
    return configRequire;
})(config);