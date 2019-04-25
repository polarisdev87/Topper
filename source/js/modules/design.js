var CMF = CMF || {};

CMF.design = (function($, undefined){

    var id;

    /**
     * The objects (image | text | qr) collection associated with the current design
     * @type {Array}
     */
    var objects = [];

    /**
     * Determines whether the design is for a sample topper from a sheet, or for the entire sheet
     * @type {Boolean}
     */
    var isRepetitive = false;

    /**
     * The value by which the z-index of an object's grip and viewport image are increased when the object is dragged
     * @type {Number}
     */
    var selectionDepthGain = 1000;

    /**
     * The product associated with the current design
     * @type {Object}
     */
    var product = {
        id: ''
    };

    /**
     * Object used to cache saved design data; useful when checking if the design has changed.
     * @type {Object}
     */
    var data = {};

    /**
     * A placeholder for autosave-related messages
     * @type {Object}
     */
    var $autosaveNotice;

    var autosaveTimerId;


    function buildCache() {
        $autosaveNotice = $(".tpr-autosave-notice");
    }


    function addObject(data) {
        var o;

        data.id = createNewObjectId();
        data.zIndex = getHighestZ() + 1;

        o = new CMF.Object(data);
        objects.push(o);

        o.addToUi();
        o.select();
    }

    /**
     * Append a text object to the viewport
     */
    function addTextObject(objectFormatting) {
        var url;
        var css = CMF.lightbox.getTextObjectFormatting();
        var text = CMF.lightbox.getTextObjectText();

        if (!text) {
            return;
        }

        CMF.lightbox.showLoader();
        url = CMF.utils.getTextObjectUrl(text, css);

        CMF.utils.preloadOneImage(url, function(err, data){
            var object = css;

            if (err) {
                CMF.lightbox.showError(err);
                return;
            }

            $.extend(object, {
                type : "text",
                url: url,
                pxWidth : data.size.width,
                pxHeight : data.size.height,
                text : text,
                color: object["color"],
                fontFamily: object["font-family"],
                fontSize: object["font-size"],
                fontWeight: object["font-weight"],
                fontStyle: object["font-style"],
                textDecoration: object["text-decoration"],
                textCurvature: object["text-curvature"],
                textAlign: object["text-align"]
            });

            if (typeof objectFormatting !== 'undefined') {
                $.extend(object, objectFormatting);

                if (typeof objectFormatting.center !== 'undefined') {
                    object.left = objectFormatting.center.left - (data.size.width / 2);
                    object.top = objectFormatting.center.top - (data.size.height / 2);
                }
            }

            CMF.design.addObject(object);
            CMF.lightbox.hideLoader();
            $.magnificPopup.close();
        });
    }

    function areAnyItemsSelected ()
    {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].isSelected()) {
                return true;
            }
        }

        return false;
    }

    function getSelectedObject ()
    {
        for (var i=0; i<objects.length; i++) {
            if (objects[i].isSelected()) {
                return objects[i];
            }
        }

        return null;
    }


    /**
     * Appends a QR code image to the design
     */
    function addQrObject() {

        var size = 546; // size of the QR code image, expressed in pixels
        var url;
        var text = CMF.lightbox.getQrObjectText();

        if (!text) {
            return;
        }

        CMF.lightbox.showLoader();
        url = CMF.utils.getQrCodeUrl(text, size);

        CMF.utils.preloadImages(url, function(err){

            if (err) {
                CMF.lightbox.showError(err);
                return;
            }

            var data = {
                type: "qr",
                text: text,
                url: url,
                pxWidth: size,
                pxHeight: size,
                inWidth: size/300,
                inHeight: size/300
            };

            CMF.design.addObject(data);
            CMF.lightbox.hideLoader();
            $.magnificPopup.close();
        });

    }


    /**
     * Determines the ID for a new object, as equal to the highest ID in the existing objects list, plus 1.
     */
    function createNewObjectId() {
        var id = -1;

        for (var i=0; i<objects.length; i++) {
            if (id < objects[i].id) {
                id = objects[i].id;
            }
        }

        return id + 1;
    }


    /**
     * Determines the highest z-index among the objects in the existing collection
     */
    function getHighestZ() {
        var z = 0;

        for (var i=0; i<objects.length; i++) {
            if (z < objects[i].zIndex) {
                z = objects[i].zIndex;
            }
        }

        return z;
    }


    /**
     * Return from the objects collection, the item with the given ID
     */
    function getObjectById(id) {
        id = parseInt(id,10);

        for (var i=0; i<objects.length; i++) {
            if (objects[i].id == id) {
                return objects[i];
            }
        }

        return null;
    }


    /**
     * Return from the objects collection, the item with the specified z-index
     */
    function getObjectByDepth(depth) {

        for (var i=0; i<objects.length; i++) {
            if (objects[i].zIndex === depth) {
                return objects[i];
            }
        }

        return null;
    }


    /**
     * Creates an exact copy of the object with the given ID and adds it to the existing collection
     * @param {Number} id The ID of the object to duplicate
     */
    function duplicateObject(id) {
        id = parseInt(id, 10);

        var o = getObjectById(id);
        var data = o.getData(10);

        addObject(data);
    }


    /**
     * Removes the object with the given ID from the collection and from the UI
     */
    function removeObject(id, callback) {
        id = parseInt(id, 10);

        var o = getObjectById(id);
        var z = o.zIndex;
        var index = objects.indexOf(o);

        if (!callback) {
            o.remove();     // remove from UI
        } else {
            o.remove(callback);     // remove from UI
        }

        objects.splice(index, 1);  // remove corresponding item from collection

        // Push all objects that were above the removed object down by one level, so as not to leave its depth slot unoccupied
        pushObjects(z);
    }


    /**
     * Removes the currently selected object within the UI
     */
    function removeSelected() {
        var id = $(".listItem.selected").eq(0).data("objectid");
        if (typeof id !== "undefined") {
            removeObject(id);
        }
    }


    /**
     * Deselects the selected objects in the design
     */
    function clearSelection() {
        objects.forEach(function(o){
            o.deselect();
        });
    }




    /**
     * Pops all objects that are bellow the reference depth, up by one level
     * @param  {Number} referenceDepth
     * @return {Number} The z-index of the last objects to be popped (always 1)
     */
    function popObjects(referenceDepth) {
        for (var i=0; i<objects.length; i++) {
            if (objects[i].zIndex < referenceDepth) {
                objects[i].moveToDepth(objects[i].zIndex+1);
            }
        }

        return 1;
    };


    /**
     * Pushes all objects that are above the reference depth, down by one level
     * @param  {number} referenceDepth
     * @return {number} The z-index of the last object to pe pushed
     */
    function pushObjects(referenceDepth) {
        var z = referenceDepth;

        for (var i=0; i<objects.length; i++) {
            if (objects[i].zIndex > referenceDepth) {
                z = objects[i].zIndex;
                objects[i].moveToDepth(z-1);
            }
        }

        return z;
    };


    /**
     * Move the object with the specified id on the Z axis, up one level,
     * down one level, on top of or bellow all others in the collection
     */
    function changeObjectDepth(id, direction) {
        var o = getObjectById(id);
        var z;

        switch (direction) {
            case "top":
                // Move all objects above the selected one down one level, to free the top position for it
                z = pushObjects(o.zIndex);
                o.moveToDepth(z);
                break;
            case "bottom":
                // Move all objects bellow the selected one up one level, to free the bottom position for it
                z = popObjects(o.zIndex);
                o.moveToDepth(1);
                break;
            case "up":
                // Swap the selected object with the one on top of it, if any
                z = o.zIndex + 1;
                swapObject = getObjectByDepth(z);
                if (swapObject) {
                    o.moveToDepth(z);
                    swapObject.moveToDepth(z-1);
                }
                break;
            case "down":
                // Swap the selected object with the one bellow it, if any
                z = o.zIndex - 1;
                swapObject = getObjectByDepth(z);
                if (swapObject) {
                    o.moveToDepth(z);
                    swapObject.moveToDepth(z+1);
                }
                break;
            default:
                break;
        }
    }


    /**
     * Removes all objects from the collection
     */
    function reset(callback) {
        while(objects.length > 0) {
            objects[0].remove();    // remove from UI
            objects.splice(0,1);    // remove corresponding item from collection
        }

        if (typeof callback === "function") {
            callback();
        }
    }


    function setProduct(id) {
        product.id = id;
    }


    /**
     * Sets the state of the current design as repetitive(true)/non-repetitive(false)
     * @param {boolean} bool         True means that the design is repetitive, false that it isn't
     * @param {boolean} tickSelector Determines whether to trigger 'checked' state of the input selector, or not
     */
    function markAsRepetitive (bool, tickSelector) {
        isRepetitive = bool;

        if (tickSelector) {
            var product = CMF.products.getSelected();
            var $product = $('#topperoo .product[data-id="' + product.id + '"]');
            var template = new CMF.template($product.data('template'), product.id);
            var topperHeight = template._getTopperHeightOnScreen();

            CMF.viewport.switchToSingleTopper(template, topperHeight);
            CMF.viewport.setPixelSize(false);
            $('#isRepetitiveSelector').prop('checked', true);
        }
    }


    /**
     * Aggregates all the data about the current design, that needs to be sent to the server for storage
     * @return {{}}
     */
    function getData() {
        var data = {
            id: getId(),
            objects: [],
            repetitive: isRepetitive,
            product: {},
            unitPrice: 0,
            qty: CMF.order.qty,
            currency: CMF.config.get('currency', 'name')
        };

        // Get data of all design objects
        for (var i=0; i<objects.length; i++) {
            data.objects.push(objects[i].getData());
        }

        data.product = {
            id: product.id
        };

        data.unitPrice = CMF.products.getSelected()['price'];
        data.qty = CMF.order.get("qty");
        data.currency = CMF.config.get('currency', 'name');

        return data;
    }


    /**
     * Submits the design data to the server, where it is saved/updated within the database
     * @param  {Function} callback  Callback function to execute when receiving the response
     * @param  {Boolean}  duplicate Indicates whether to copy the current design within the DB (used when submitting an order)
     */
    function save(callback, replicate) {

        var requestData;

        data = getData();   // uses the module property 'data', not a local variable
        requestData = data;

        if (!CMF.admin) {
            requestData = $.extend({}, data, {
                'type': 'custom',
                'protocol': window.location.protocol,
                'host': window.location.hostname,
                'replicate': (replicate ? true : false)
            });
        } else {
            requestData = $.extend({}, data, {
                'type': 'premade',
                'protocol': window.location.protocol,
                'host': window.location.hostname,
                'name': $('.cmf-pddi input').val(),
                'description': $('.cmf-pddi textarea').val()
            });
        }

        $.ajax({
            url: CMF.config.url('save-design'),
            type: "POST",
            crossDomain: true,
            data: requestData,
            dataType: 'json',
            error: function(jqXHR, textStatus, errorThrown) {
                callback(new Error(textStatus+": "+errorThrown), null);
            },
            success: function(response) {
                if (response.status === "error") {
                    callback(new Error(response.message), response.design);
                    return;
                }

                callback(null, response.design);
            }
        });
    }


    /**
     * Determines whether the design has changed in any way since the last time is was saved.
     * @return {Boolean}
     */
    function hasChanged() {
        if (!data) {    // when opening the application, the design data object is empty
            return false;
        }

        if (JSON.stringify(data) === JSON.stringify(getData())) {
            return false;
        }

        $('#topperoo').trigger('topperoo.design.changed', getData());

        return true;
    }

    /**
     *
     * @param state Can be either 'saving', 'saved' or 'error'
     */
    function showAutosaveNotice (state)
    {
        $autosaveNotice.attr('data-state', state);
        $autosaveNotice.fadeIn(250);
    }

    function hideAutosaveNotice ()
    {
        $autosaveNotice.fadeOut(250);
    }


    /**
     * Initiates the timer that periodically triggers the design autosave.
     */
    function initAutosave() {
        var delay = 8;  // expressed in seconds

        autosaveTimerId = window.setInterval(function(){
            if (hasChanged()) {     // only save if there are any changes since the last autosave
                showAutosaveNotice('saving');
                save(function(err, data){
                    if (err) {
                        showAutosaveNotice('error');
                        return;
                    }

                    if (!getId()) {
                        setId(data.id);
                    }

                    showAutosaveNotice('success');
                    window.setTimeout(function(){
                        hideAutosaveNotice();
                    }, 2000);
                });
            }
        }, delay*1000);
    }


    function deactivateAutosave() {
        window.clearInterval(autosaveTimerId);
    }


    function load(type, id, callback, beforeLoad) {

        var data = {
            type: type,
            id: id
        };
        var url = CMF.config.url('load-design') + type + "/" + id;

        if (typeof beforeLoad === "function") {
            beforeLoad();
        }

        CMF.design.reset(function(){
            $.ajax({
                url: url,
                method: "GET",
                dataType: "jsonp",
                crossDomain: true,
                error: function(jqXHR, textStatus, errorThrown) {
                    callback(new Error(textStatus + " :: " + errorThrown));
                },
                success: function(response) {

                    var preloadList = [];

                    if (response.status === "error") {
                        callback(new Error(response.message));
                        return;
                    }

                    // Set the design product.
                    // When the selection fails, it means that the locally saved design is based
                    // on a product that does not exist (anymore), in which case it has to be erased.
                    if (!CMF.products.select(response.data.product.id)) {
                        callback(new Error('Product from loaded design does not exist. Starting over with a blank workspace.'));
                        return;
                    }

                    // Switch the sheet image to that of the sample topper, if the design is repetitive
                    if (response.data.repetitive === true) {
                        CMF.design.markAsRepetitive(true, true);
                    }

                    if (response.data.objects.length === 0) {
                        callback(null);
                        return;
                    }

                    // Add the design objects
                    response.data.objects.forEach(function(object){
                        var url;

                        switch (object.type) {
                            case "image":
                                preloadList.push(object.url);
                                break;

                            case "text":
                                url = CMF.utils.getTextObjectUrl(object.text, {
                                    "color": object.color,
                                    "font-size": object.fontSize,
                                    "font-family": object.fontFamily,
                                    "font-weight": object.fontWeight,
                                    "font-style": object.fontStyle,
                                    "text-align": object.textAlign,
                                    "text-decoration": object.textDecoration,
                                    "text-curvature": object.textCurvature
                                });
                                preloadList.push(url);
                                object.url = url;

                                break;

                            case "qr":
                                url = CMF.utils.getQrCodeUrl(object.text);
                                preloadList.push(url);
                                object.url = url;
                                break;
                        }
                    });

                    CMF.utils.preloadImages(preloadList, function(err){
                        if (err) {
                            callback(err);
                            return;
                        }

                        response.data.objects.forEach(function(data){
                            addObject(data);
                        });

                        callback(null);
                    });
                }
            });
        });
    }

    /**
     * Attempts to load the saved design id from disk, if any exists.
     * @return {Number|null}
     */
    function getStoredDesignId() {
        var design;

        if (!window.localStorage) {
            return null;
        }

        design = localStorage.getItem("design");

        if (!design) {
            return null;
        }

        try {
            design = JSON.parse(design);
        } catch (e) {
            //console.log("Attempting to parse saved design data resulted in:\n\t"+e);
            return null;
        }

        if (!design.id) {
            return null;
        }

        return design.id;
    }


    //function storeDesignId(id) {
    //    var design = {
    //        id: id
    //    };
    //
    //    if (!window.localStorage) {
    //        return;
    //    }
    //
    //    localStorage.setItem("design", JSON.stringify(design));
    //}


    function getId() {
        if (id) {
            return id;
        }

        // [START]
        // The following fragment handles design ID's that were
        // set in a deprecated format using localStorage, then
        // saves them using the new structure and removes the
        // deprecated data from the browser.
        //id = getStoredDesignId();
        //if (id) {
        //    CMF.storage.setDesignId(id);
        //    localStorage.removeItem("design");
        //}
        // [END]

        id = CMF.storage.getDesignId();

        return id;
    }


    function setId(designId) {
        id = designId;
        //storeDesignId(designId);
        CMF.storage.setDesignId(designId);
    }


    /**
     * Determines if the current design has no associated objects
     */
    function isEmpty ()
    {
        if (!objects.length) {
            return true;
        }

        return false;
    }

    function getDesignItems ()
    {
        var designItems = [];

        objects.forEach(function(object) {
            var item = {
                type: object.type
            };
            var filenameIndexInURL;

            if (object.type === "image") {
                filenameIndexInURL = object.url.indexOf("cmf_");
                item.filename = object.url.substring(filenameIndexInURL);
            }

            designItems.push(item);
        });

        return designItems;
    }


    return {
        buildCache: buildCache,
        addObject: addObject,
        addTextObject: addTextObject,
        addQrObject: addQrObject,
        clearSelection: clearSelection,
        getObjectById: getObjectById,
        getObjectByDepth: getObjectByDepth,
        duplicateObject: duplicateObject,
        removeObject: removeObject,
        removeSelected: removeSelected,
        changeObjectDepth: changeObjectDepth,
        markAsRepetitive: markAsRepetitive,
        setProduct: setProduct,
        initAutosave: initAutosave,
        reset: reset,
        save: save,
        load: load,
        getId: getId,
        setId: setId,
        deactivateAutosave: deactivateAutosave,
        getSelectedObject: getSelectedObject,
        isEmpty: isEmpty,
        getDesignItems: getDesignItems,
        areAnyItemsSelected: areAnyItemsSelected
    };

})(jQuery);
