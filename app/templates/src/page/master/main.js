define([
    'salespages-ui/widget/tagger/main',
    'csstemplate!./main.css',
    'cssrender'
], function (
    tagger,
    cssTxt,
    cssRender
) {
    (new tagger()).tag({more: true});

    cssRender(cssTxt).then(cssReady);

    function cssReady() {
        // code
    }
});