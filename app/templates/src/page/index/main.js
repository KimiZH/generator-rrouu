define([
    '../master/main'
    'csstemplate!./main.css',
    'cssrender',
    'jquery'
], function (
    master,
    cssTxt,
    cssRender,
    $
){
    cssRender(cssTxt).then(cssReady);

    function cssReady() {
        $(domReady);
    }

    function domReady($) {
        // code
    }
});