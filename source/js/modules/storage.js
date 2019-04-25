var CMF = CMF || {};

CMF.storage = (function ($){

    var data = { shops: [] };

    /**
     *
     */
    function storeData ()
    {
        return window.localStorage.setItem("topperoo", JSON.stringify(data));
    }

    /**
     * Reads Topperoo-related data from the browser's local
     * storage and saves it within the current module.
     */
    function readDataIn ()
    {
        var localData = JSON.parse(window.localStorage.getItem("topperoo"));

        if (!localData) {
            return null;
        }

        data = localData;
    }

    /**
     * Appends a new item to the locally stored list of shops.
     *
     * @param designId
     */
    function addShopData (designId)
    {
        data.shops.push({
            id: CMF.config.getClientId(),
            design: {
                id: designId
            }
        });
    }

    /**
     * Attempts to find data about the existing application
     * instance (i.e. "shop") within the module's `data` object
     * and returns it if it exists.
     *
     * @returns {*}
     */
    function getCurrentShop ()
    {
        var shopId = CMF.config.getClientId();
        var selection = null;

        data.shops.forEach(function (shop){
            if (shop.id === shopId) {
                selection = shop;
            }
        });

        return selection;
    }

    /**
     *
     * @param designId
     */
    function setDesignId (designId)
    {
        var shop;

        readDataIn();
        shop = getCurrentShop();

        if (!shop) {
            addShopData(designId);
        } else {
            shop.design.id = designId;
        }

        storeData();

        return;
    }

    /**
     * Attempts to retrieve the design ID associated
     * with the current application instance (i.e. `shop`).
     *
     * @returns {*}
     */
    function getDesignId ()
    {
        var designId = null;
        var shopId = CMF.config.getClientId();

        readDataIn();
        data.shops.forEach(function (shop){
            if (shop.id === shopId) {
                designId = shop.design.id;
            }
        });

        return designId;
    }

    /**
     * Removes the design ID associated with the
     * current shop, along with the shop entry itself,
     * from the local storage.
     */
    function eraseDesignId ()
    {
        var shopId = CMF.config.getClientId();
        var index = null;

        readDataIn();

        data.shops.forEach(function (shop, i){
            if (shop.id === shopId) {
                index = i;
            }
        });

        if (index == null) {
            console.log('Shop ' + shopId + ' does not exist locally');
            return;
        }

        data.shops.splice(index, 1);
        storeData();

        return;
    }


    return {
        setDesignId: setDesignId,
        getDesignId: getDesignId,
        eraseDesignId: eraseDesignId
    };
})(jQuery);