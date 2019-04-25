var Topperoo = (function($)
{
    var $e = {};

    function buildCache ()
    {
        $e.topperoo = $("#topperoo");
        $e.userDesignsSection = $e.topperoo.find("#tpr-user-designs-section");
        $e.userDesignsList = $e.userDesignsSection.find(".tpr-saved-designs");
        $e.userDesignsContainer = $e.userDesignsSection.find(".mCSB_container");
        $e.userDesignTpl = $e.topperoo.find("#tpr-saved-design-template").html();
    }

    function updateCache ()
    {
        $e.userDesigns = $e.userDesignsList.find(".tpr-user-design");
    }

    function updateUserDesignsScrollbar ()
    {
        $e.userDesignsList.mCustomScrollbar("update");
    }

    /**
     * Renders the markup for a user design item, based on the existing Mustache template.
     *
     * @param data
     * @returns String
     */
    function renderUserDesignMarkup (data)
    {
        return Mustache.render($e.userDesignTpl, {
            id: data.id,
            name: data.name || "Name (click to edit)",
            description: data.description || "Description (click to edit)"
        });
    }

    /**
     * Adds a single user-saved design to the list.
     *
     * @param data
     * @param position Specifies where to add the design, the start or finish of the list
     */
    function addUserDesignToList (data, position)
    {
        var design = renderUserDesignMarkup(data);
        var container = $e.userDesignsSection.find(".mCSB_container");

        if (!container.length) {
            container = $e.userDesignsList;
        }

        switch (position) {
            case "before":
                container.prepend(design);
                break;
            case "after":
            default:
                container.append(design);
        }

        updateCache();
        loadUserDesignThumbnail(data.id);
        updateUserDesignsScrollbar();
    }

    /**
     * Adds a set of user-saved designs to the list.
     *
     * @param arr
     */
    function initUserDesignsList (arr)
    {
        var design;

        if (arr.constructor !== Array) {
            console.log("Designs list must be array");
            return;
        }

        arr.forEach(function(data){
            design = renderUserDesignMarkup(data);
            $e.userDesignsList.append(design);
        });

        updateCache();
    }

    function loadUserDesignThumbnail (id)
    {
        var $image = $e.userDesigns.filter("[data-id=" + id + "]").find("img");
        var url = $image.attr("data-src");

        CMF.utils.preloadOneImage(url, function(){
            $image.attr("src", url);
        }, false);
    }

    function prependUserDesign (data)
    {
        addUserDesignToList(data, "before");
    }

    function appendUserDesign (data)
    {
        addUserDesignToList(data, "after");
    }

    function removeUserDesign (id)
    {
        var $design = $e.userDesigns.filter("[data-id=" + id + "]");

        $design.hide(200, function(){
            CMF.config.executeCustomCallback('topperoo.designs.remove', id);
            $design.remove();
        });
        updateCache();
        updateUserDesignsScrollbar();
    }

    function showLoader (message)
    {
        CMF.viewport.showLoader(message);
    }

    function hideLoader ()
    {
        CMF.viewport.hideLoader();
    }

    function getURL (resource)
    {
        return CMF.config.url(resource);
    }

    function appendUserTemplate (data)
    {
        CMF.dashboard.appendUserTemplate(data);
    }

    function activateUiTab (tabIndex)
    {
        $('#topperoo .tabs a').eq(tabIndex).trigger('click');
    }

    return {
        buildCache: buildCache,

        api: {
            appendUserDesign: appendUserDesign,
            prependUserDesign: prependUserDesign,
            initUserDesignsList: initUserDesignsList,
            removeUserDesign: removeUserDesign,
            appendUserTemplate: appendUserTemplate,
            showLoader: showLoader,
            hideLoader: hideLoader,
            getURL: getURL,
            activateUiTab: activateUiTab
        }
    };

})(jQuery);