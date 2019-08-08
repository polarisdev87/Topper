(function(){

    const container = document.getElementById("topperoo");

    let Topperoo = window.Topperoo || { instanceId: ''};

    function appendIframe ()
    {
        const iframe = document.createElement("iframe");

        iframe.id = "tpr-iframe";
        iframe.src = "{{APP_BASE_URL}}/ui";
        iframe.allowfullscreen = true;
        iframe.allowpaymentrequest = true;
        iframe.allow = "fullscreen payment";

        container.appendChild(iframe);
    }

    function appendCSS (onLoad)
    {
        const link = document.createElement("link");

        link.type = "text/css";
        link.id = "testing";
        link.rel = "stylesheet";
        link.href = "{{APP_BASE_URL}}/css/loader.css";
        link.onload = onLoad;

        document.head.appendChild(link);
    }

    /**
     * Serializes contents of the window.Topperoo config object,
     * for use in relation to the `postMessage()` API.
     * @param config
     * @returns {*}
     */
    function serializeConfigObject (config)
    {
        for (let key in config) {
            if (config.hasOwnProperty(key)) {
                if (key === 'callbacks') {
                    for (let cb in config[key]) {
                        if (config[key].hasOwnProperty(cb)) {
                            config[key][cb] = config[key][cb].toString();
                        }
                    }
                }
            }
        }

        return config;
    }

    function sendConfig (event)
    {
        if (event.origin !== '{{APP_BASE_URL}}') {
            return;
        }

        if (typeof event.data.topperooAppReady === 'undefined') {
            return;
        }

        event.source.postMessage(serializeConfigObject(Topperoo), event.origin);
    }

    if (typeof container === "undefined") {
        return;
    }

    window.addEventListener('message', sendConfig, false);

    appendCSS(appendIframe);

})();
