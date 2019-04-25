var CMF = CMF || {};

CMF.viewport = (function($, undefined){

    var $viewport;
    var $sheet;
    var $loader;

    var width ;
    var height;
    var offset;

    /**
     * The size of one viewport pixel (on screen) in inches/centimeters
     */
    var pixelSize = {
        'in': 0,
        'cm': 0
    };

    /**
     * An SVG canvas covering the entire viewport, positioned above the objects' layer
     * @type {Object}
     */
    var canvas;
    var circle;


    function buildCache() {
        $viewport = $(".viewport");
        $sheet = $(".sheet");
        $loader = $viewport.children(".loader").eq(0);
        width  = $viewport.width();
        height = $viewport.height();
        offset = $viewport.offset();
        canvas = Raphael("viewportCanvas", width, height);
    }


    /**
     * Stores the size of a viewport pixel,
     * in inches and centimeters, retrieved
     * from the selected product sheet or topper.
     *
     * @param isSheet Boolean Is the viewport a representation of a sheet (true) or a topper (false)?
     */
    function setPixelSize (isSheet)
    {
        var product = CMF.products.getSelected();
        var template = new CMF.template(product.template, product.id);

        if (isSheet) {
            pixelSize = {
                'in': template.getPixelSize('sheet', 'in'),
                'cm': template.getPixelSize('sheet', 'cm')
            };
        } else {
            pixelSize = {
                'in': template.getPixelSize('topper', 'in'),
                'cm': template.getPixelSize('topper', 'cm')
            };
        }

        return pixelSize;
    }


    function getPixelSize ()
    {
        return pixelSize['in'];
    }


    function get(prop) {
        switch (prop) {
            case 'width':
                return width;
            case 'height':
                return height;
            case 'offset':
                return offset;
            default:
                return null;
        }
    }


    // Displays the loader animation on top of the application viewport
    function showLoader() {

        var duration = 300;
        var arg = arguments;

        if (typeof arg[0] === 'function') {
            $loader.fadeIn(duration, arg[0]); // callback function
        } else if (typeof arg[0] === 'string') {  // loader text
            changeLoaderText(arg[0]);
            if (typeof arg[1] === 'function') {
                $loader.fadeIn(duration, arg[1]); // callback function
                return;
            }
            $loader.fadeIn(duration);
        }
    }


    /**
     * Hides the loader on top of the viewport and may execute a callback function at the end of the animation;
     * @param {number|function} [optional]  Either represents the delay (ms) with which the callback is executed, or the callback itself
     * @param {function} callback
     */
    function hideLoader() {

        var animationDuration = 300;
        var delay;
        var callback;
        var timeout;

        if (arguments.length === 0) {
            $loader.fadeOut(animationDuration);
            return;
        }

        if (arguments.length === 1) {
            if (typeof arguments[0] === "function") {
                callback = arguments[0];
                $loader.fadeOut(animationDuration, callback);
                return;
            }

            if (typeof arguments[0] === "number") {
                delay = arguments[0];
                timeout = window.setTimeout(function(){
                    $loader.fadeOut(animationDuration);
                    window.clearTimeout(timeout);
                }, delay);
                return;
            }
        }

        if (arguments.length === 2) {
            if (typeof arguments[0] === "number" && typeof arguments[1] === "function") {
                delay = arguments[0];
                callback = arguments[1];
                timeout = window.setTimeout(function(){
                    $loader.fadeOut(animationDuration, callback);
                    window.clearTimeout(timeout);
                }, delay);
            }
        }

        return;
    }


    /**
     * Changes the message displayed within the viewport loader
     */
    function changeLoaderText(message) {
        var messageWrapper = $loader.find(".message");
        messageWrapper.html(message);

        return messageWrapper;
    }


    /**
     * Adds a circle that borders a rotating design object, to the viewport canvas.
     * @param {Object} center Coordinates of the circle center, in relation to the canvas
     * @param {Number} radius Circle radius, expressed in pixels
     * @param {Object} data   Styling data for the circle
     */
    function addRotationOutline(center, radius, data) {
        if (!data) {
            data = {
                "stroke": "#000",
                "stroke-width" : 1
            };
        }

        circle = canvas.circle(center.x, center.y, radius);
        circle.attr(data);
    }


    /**
     * Removes the objects rotation circle, if any exists on the viewport canvas.
     */
    function removeRotationOutline() {
        if (circle) {
            circle.remove();
        }

        circle = null;
    }


    /**
     * Resizes all the viewport canvases to fit the height of the viewport.
     * This is useful when resizing the viewport, otherwise the canvases would not resize along with it.
     */
    function resizeSvgCanvases(h) {
        height = h;
        $viewport.find("svg").css("height",h);
    }

    function switchToSingleTopper (template, height)
    {
        $sheet.stop(true, true).fadeOut(200, function(){
            $sheet.empty();
            template.drawSingleTopper();
            $viewport.animate({ height: height }, 200);  // change the size of the sheet
            $sheet.fadeIn(200);
            resizeSvgCanvases(height);
        });
    }

    function changeSheet (template, height, animate) {
        var animationDuration = 200;    // milliseconds

        if (animate === false) {
            animationDuration = 0;
        }

        $sheet.stop(true, true).fadeOut(animationDuration, function(){
            $sheet.empty();
            template.drawViewport();
            $viewport.animate({ height: height }, animationDuration);  // change the size of the sheet
            $sheet.fadeIn(animationDuration);
            resizeSvgCanvases(height);
        });
    }



    return {
        // properties
        width: width,
        height: height,
        offset: offset,

        // methods
        get: get,
        buildCache: buildCache,
        showLoader: showLoader,
        hideLoader: hideLoader,
        changeLoaderText: changeLoaderText,
        addRotationOutline: addRotationOutline,
        removeRotationOutline: removeRotationOutline,
        changeSheet: changeSheet,
        switchToSingleTopper: switchToSingleTopper,
        setPixelSize: setPixelSize,
        getPixelSize: getPixelSize
    };

})(jQuery);