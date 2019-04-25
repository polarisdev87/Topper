var CMF = CMF || {};

CMF.utils = (function($, undefined){

    /**
     * Generates the URL to a text image object, based on the provided text and styling options.
     */
    function getTextObjectUrl(text, styling)
    {
        var baseUrl = CMF.config.buildURL('/text/');
        var params = '';

        // Encode the actual text
        text = B64.encode(text).replace(/\//g,"_");     // replace any slashes to prevent routing problems on the back-end
        text = encodeURIComponent(text);

        // Encode the styling parameters
        for (var property in styling) {
            if (styling.hasOwnProperty(property)) {
                params += property + "=" + styling[property] + ",";
            }
        }
        params = params.slice(0,-1);
        params = B64.encode(params);
        params = params.replace(/\//g,"_");     // replace slashes from the base64 encoded string to prevent incorrect routing
        params = encodeURIComponent(params);

        return (baseUrl + text + "/params/" + params);
    }

    function getB64EncodedArray (arr)
    {
        var str = '';

        if (!arr || !arr.length) {
            return '';
        }

        arr.forEach(function(item){
             str += item +',';
        });

        str = str.slice(0,-1);  // removes last comma
        str = B64.encode(str).replace(/\//g,"_");     // replace any slashes to prevent routing problems on the back-end
        str = encodeURIComponent(str);

        return str;
    }


    /**
     * Generates the URL to a QR code image, built with Google Charts
     */
    function getQrCodeUrl(text, size) {

        var url = "https://chart.googleapis.com/chart?cht=qr&chs=";
        var encoding = "UTF-8";
        var correction = "L";
        var margin = 0;

        if (!size) {
            size = 546;
        }

        url += size+"x"+size + "&chl=" + encodeURIComponent(text) + "&choe=" + encoding + "&chld=" + correction + "|" + margin;

        return url;
    }


    /**
     * Generic image preloader
     */
    function preloadImages(filepaths, callback) {

        var image;
        var counter = 0;
        var size;

        if (typeof filepaths === "string") {
            filepaths = [filepaths];
        }

        function onLoad() {
            counter++;
            if (counter === filepaths.length) {
                callback(null);
            }
        }

        function onError() {
            callback(new Error("Could not find image "+this.src));
        }

        for (var i=0; i<filepaths.length; i++) {
            image = new Image();
            image.onload = onLoad;
            image.onerror = onError;
            image.src = filepaths[i];
        }
    }


    function preloadOneImage(url, callback, getSize) {
        var image = new Image();
        var data = {};

        if (!getSize) {
            getSize = true;
        }

        image.onload = function() {
            if (getSize) {
                data.size = getImageSize(this);
            }

            callback(null, data);
        };

        image.onerror = function () {
            callback(new Error("Could not GET image at " + this.src), null);
        };
        image.src = url;
    }


    /**
     * Retrieves the value of the URL parameter by name.
     * @param name
     * @returns {string}
     */
    function getURLParameterByName(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
    }


    function ImageRequest (src)
    {
        this.src = src;
        this.error = false;
        return this;
    }


    ImageRequest.prototype.execute = function (callback, retryAttempts)
    {
        var request = this;
        var image = new Image();
        var retryDelay = 3000;

        image.onload = function ()
        {
            request.error = false;
            callback(request);
        };

        image.onerror = function (error)
        {
            request.error = error;

            if (retryAttempts) {
                setTimeout(function(){
                    request.execute(callback, --retryAttempts);
                }, retryDelay);
                return;
            }

            callback(request);
        };

        image.src = this.src;
    };


    function preloadMultipleImages (paths, callback) {
        var counter = 0;
        var requests = [];
        var retryAttempts = 3;

        paths.forEach(function(path){
            var req = new ImageRequest(path);
            requests.push(req);
            req.execute(function() {
                counter++;
                if (counter != paths.length) {
                    return;
                }
                callback(requests);
            }, retryAttempts);    // should loading the image fail, retry loading it a number of times
        });

    }


    /**
     * Appends an image to the DOM to compute its size
     * @param {Object} image
     * @return {Object}
     */
    function getImageSize(image) {
        var $image = $(image);
        var size = {};

        $image.css({
            "position":"absolute",
            "visibility":"hidden"
        });
        $image.prependTo("body");
        size.width = $image.width();
        size.height = $image.height();
        $image.remove();

        return size;
    }


    return {
        getTextObjectUrl:       getTextObjectUrl,
        getQrCodeUrl:           getQrCodeUrl,
        getURLParameterByName:  getURLParameterByName,
        preloadOneImage:        preloadOneImage,
        preloadImages:          preloadImages,
        preloadMultipleImages:  preloadMultipleImages,
        getB64EncodedArray: getB64EncodedArray
    };

})(jQuery);