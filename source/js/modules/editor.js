var CMF = CMF || {};

CMF.editor = (function($)
{
    var template = null;

    function setTemplate (tpl) {
        template = tpl;
    }

    function saveTemplate (callback)
    {
        var url = CMF.config.buildURL('/product/save');

        $.ajax({
            type: "POST",
            url: url,
            data: template.getData(),
            success: function (data) {
                callback(data);
            },
            dataType: 'json'
        });
    };

    return {
        setTemplate: setTemplate,
        saveTemplate: saveTemplate
    };
})(jQuery);