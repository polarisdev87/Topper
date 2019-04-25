var CMF = CMF || {};

CMF.config = (function($, undefined)
{
    var app_origin = 'https://app.topperoo.test';

    var instance = {
        cid: null,
        output: null,
        currency: null,
        baseUrl: null
    };

    /**
     * Determines a limit for the objects' rotation angle, after which the
     * object will stop to rotate with the cursor in either direction and
     * instead, snap to the closes angle that is a multiple of 90 degrees.
     *
     * For example, trying to rotate an object within the 85-95 degrees
     * interval when the snapAngle is set to 5, will have no effect, the
     * object will remain "snapped" to 90 degrees.
     *
     * @type {Number}
     */
    var snapAngle = 5;     // expressed in degrees

    /**
     * Computes the intervals around each angle that is a multiple
     * of 90 degrees, within which an object will snap to that angle.
     *
     * @type {Object}
     */
    var snapLimits = {
        low360: 360 - snapAngle,
        high360: snapAngle,
        low270: 270 - snapAngle,
        high270: 270 + snapAngle,
        low180: 180 - snapAngle,
        high180: 180 + snapAngle,
        low90: 90 - snapAngle,
        high90: 90 + snapAngle
    };

    /**
     * Indicates a minimum height for viewport objects; expressed in pixels.
     * @type {Number}
     */
    var minObjectSize = 20;

    var paths = {
        schematics: {
            thumbnail : app_origin + "/schematics/thumbnails/",
            viewport : app_origin + "/schematics/viewports/",
            sample : app_origin + "/schematics/samples/"
        }
    };

    var shiftKey = false;   // indicates whether the shift key is pressed or not
    var env = 'user';   // or 'admin'


    function get ()
    {
        var keys = arguments;

        switch (keys.length) {
            case 1:
                return instance[keys[0]];
            case 2:
                return instance[keys[0]][keys[1]];
        }

        return null;
    }

    function url(fragment)
    {
        return instance.baseUrl + fragment + '/';
    }

    function buildURL (resource)
    {
        return app_origin + resource;
    }

    function getClientID()
    {
        return instance.cid;
    }

    function storeInstanceData (data, callback)
    {
        instance.baseUrl = app_origin + '/' + data['ID'] + '/';
        instance.cid = data['ID'];
        instance.currency = {
            code: data['Currency']['Code'],
            name: data['Currency']['Code'],  // don't know why I used different labels (i.e. "code" / "name")
            symbol: data['Currency']['Symbol']
        };
        instance.outputURL = data['OutputURL'];

        callback();
    }

    function getInstanceData (callback)
    {
        var settings = window.tprSettings;

        if (!settings) {
            callback(new Error("tprSettings objects undefined"));
            return;
        }

        if (!settings.tpriid) {
            callback(new Error("Topperoo instance ID not set"));
            return;
        }

        var dataURL = buildURL('/instance/data/' + settings.tpriid);

        $.getJSON(dataURL, function(data){
            storeInstanceData(data, callback);
        });
    }

    function executeCustomCallback (key, args)
    {
        if (!window.tprCallbacks) {
            return;
        }

        if (typeof window.tprCallbacks[key] == 'function') {
            return window.tprCallbacks[key](args);
        }
    }

    function getConfigOption (key)
    {
        if (typeof window._tprcfg == 'undefined') {
            return null;
        }

        if (typeof window._tprcfg.options == 'undefined') {
            return null;
        }

        if (typeof window._tprcfg.options[key] == 'undefined') {
            return null;
        }

        return window._tprcfg.options[key];
    }

    function getConfigData (key)
    {
        if (typeof window._tprcfg == 'undefined') {
            return null;
        }

        if (typeof window._tprcfg.data == 'undefined') {
            return null;
        }

        if (typeof window._tprcfg.data[key] == 'undefined') {
            return null;
        }

        return window._tprcfg.data[key];
    }

    return {
        // properties
        snapLimits: snapLimits,
        minObjectSize: minObjectSize,
        paths: paths,
        env: env,
        shiftKey: shiftKey,

        // methods
        url: url,
        buildURL: buildURL,
        getClientId: getClientID,
        getInstanceData: getInstanceData,
        get: get,

        getConfigOption: getConfigOption,
        getConfigData: getConfigData,

        executeCustomCallback: executeCustomCallback
    };

})(jQuery);