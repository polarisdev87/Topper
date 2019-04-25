var CMF = CMF || {};

CMF.dashboard = (function($, undefined){

    var $doc;
    var $controls;
    var $productsSection;
    var $premadeSection;
    var $topperoo;


    function buildCache() {
        $doc = $(document);
        $controls = $('.tpr-controls');
        $productsSection = $('#productsSection');
        $premadeSection = $('#premadeSection');
        $textObjectDialog = $('#textObjectDialog');
        $topperoo = $('#topperoo');
        $tplEditor = $('#tpr-template-editor');
    }

    /**
     * Loads the UI HTML from the server
     */
    function load (callback)
    {
        var uiWrapper = $('#topperoo').eq(0);
        var url = (!CMF.admin ? CMF.config.url('dashboard') : CMF.config.url('dashboarda'));
        var templates;

        initDefaultConfig();

        /**
         * Check if the webpage embeding the tool has the necessary wrapper
         */
        if (!uiWrapper.length) {
            console.log('CMF design tool wrapper not found');
            return;
        }

        if (window._tprcfg) {
            if (_tprcfg.data) {
                if (_tprcfg.data.savedTemplates) {
                    templates = [];
                    _tprcfg.data.savedTemplates.forEach(function(tpl){
                        templates.push(tpl.id);
                    });
                }
            }
        }

        $.ajax({
            url: url,
            data: {
                templates: CMF.utils.getB64EncodedArray(templates)
            },
            dataType: 'jsonp',
            crossDomain: true,
            cache: true,
            success: function(response){
                uiWrapper.html(response.content);

                removeDisallowedComponents();

                // Cache DOM elements needed in all application modules
                CMF.dashboard.buildCache();
                CMF.products.buildCache();
                CMF.viewport.buildCache();
                CMF.lightbox.buildCache();
                CMF.design.buildCache();

                CMF.config.executeCustomCallback('topperoo.dashboard.loaded');

                if (typeof callback === "function") {
                    callback();
                }
            },
            error: function(){
                alert("Could not load the application interface. Please reload the page.");
            }
        });
    }

    function initDefaultConfig()
    {
        var defaultCfg = {
            options: {
                // defaultProductId: null,
                defaultTab: 0,
                editor: false,
                saveCustomTemplates: false,
                forcePreviewBeforeSubmit: false,
                tabsDisabled: []
            },
            data: {
                // tpl: false,
                // savedDesigns: [],
                savedTemplates: []
            }
        };

        if (typeof _tprcfg == 'undefined') {
            window._tprcfg = {};
        }

        _tprcfg = $.extend(true, {}, defaultCfg, _tprcfg);
    }

    function removeTemplateEditor ()
    {
        $('ul.tabs li', $controls).each(function (i, elm) {
            if ($(this).attr('id') == 'tpr-template-editor-tab') {
                _tprcfg.options.tabsDisabled.push(i + 1);
            }
        });
        $('#tpr-template-editor-preview').remove();
        $('#tpr-custom-templates').remove();
    }

    function disableTabs ()
    {
        var $tabs = $("#topperoo .tabs").children("li");

        if (!Array.isArray(_tprcfg.options.tabsDisabled)) {
            return;
        }

        _tprcfg.options.tabsDisabled.forEach(function(index){
            var $tab = $tabs.eq(index - 1);
            var $anchor = $tab.children('a').eq(0);

            if ($anchor.length) {
                var href = $anchor.attr('href');
                var arrayHref = href.split('#');

                if (arrayHref.length > 1) {
                    $('#' + arrayHref[1]).hide();
                }
            }

            $tab.remove();
        });
    }

    /**
     * Remove sections of the UI which are disallowed by instance settings
     */
    function removeDisallowedComponents ()
    {
        if (typeof _tprcfg == "undefined") {
            removeTemplateEditor();
            return;
        }

        if (typeof _tprcfg.options == "undefined") {
            removeTemplateEditor();
            return;
        }

        if (_tprcfg.options.editor !== true) {
            removeTemplateEditor();
        }
    }

    function loadPreMadeDesign (id, callback)
    {
        CMF.viewport.changeLoaderText("Loading the selected design");
        CMF.viewport.showLoader();

        CMF.design.load('premade', id, function(err){
            if (err) {
                CMF.viewport.changeLoaderText("The design could not be loaded.");
                CMF.viewport.showLoader();
                CMF.viewport.hideLoader(3000);
                console.log('Error loading pre-made design: ', err);
                return;
            }

            CMF.viewport.hideLoader();
        });

        if (typeof callback === 'function') {
            callback(null);
        }
    }


    function loadUserSavedDesign (id, callback)
    {
        CMF.viewport.changeLoaderText("Loading the selected design");
        CMF.viewport.showLoader();

        CMF.design.load('custom', id, function(err){
            if (err) {
                CMF.viewport.changeLoaderText("The design could not be loaded.");
                CMF.viewport.showLoader();
                CMF.viewport.hideLoader(3000);
                console.log('Error loading custom design: ' + id, err);
                return;
            }

            CMF.viewport.hideLoader();
        });

        if (typeof callback === 'function') {
            callback(null);
        }
    }


    /**
     * Sets up the tabs for the dashboard sections (products | customise | pre-made)
     * @param {Number}   activeTab  Indicates the index of the initially active tab
     * @param {Function} callback   Function to execute when the tabs are set up
     */
    function setUpTabs(activeTab, callback)
    {
        var urlSetTab = CMF.utils.getURLParameterByName('tprtab');
        var tabsDisabled = [];

        if (Array.isArray(_tprcfg.options.tabsDisabled)) {
            // Make tab disabled data start from zero
            _tprcfg.options.tabsDisabled.forEach(function(index) {
                tabsDisabled.push(index - 1);
            });
        }

        if (urlSetTab) {
            activeTab = parseInt(urlSetTab);
        }

        // The following lines are the fix for the problem with the <base> tag vs. `href` attribute on the tabs
        var $tabs = $controls.children("ul.tabs").find("a");
        $tabs.prop('href', function(){
            var location = window.location.protocol + '//';
                location += window.location.hostname;
                location += (window.location.port.length > 0) ? (':' + window.location.port) : '';
                location += window.location.pathname;
                location += window.location.search;

            return location + $(this).attr('href');
        });

        // Set active tab only on available tab.
        if (tabsDisabled.length > 0) {
            var liIndex = [];
            var $li = $controls.find('.tabs li');

            $li.each(function (i) {
                liIndex.push(i);
            });

            liIndex = liIndex.filter(function (i) {
                return tabsDisabled.indexOf(i) < 0;
            });

            if (liIndex.indexOf(activeTab) < 0) {
                activeTab = liIndex[0];
            }
        }

        $controls.tabs({
            /**
             * Sets the initially active tab to be the first tab in the list
             * @type {Number}
             */
            active: activeTab,

            /**
             * Highlights the active tab and executes the custom callback
             */
            create: function(event, ui){
                $(ui.tab).addClass("activeTab");

                if (typeof callback === "function") {
                    callback();
                }
            },

            /**
             * Highlights the active tab and un-highlights all others
             */
            beforeActivate: function(event, ui){
                var newTab     = $(ui.newTab);
                var oldTab     = $(ui.oldTab);

                $(oldTab).removeClass("activeTab");
                $(newTab).addClass("activeTab");
            }
        });

        if (typeof _tprcfg !== 'undefined' && typeof _tprcfg.options !== 'undefined' &&  _tprcfg.options.tabsDisabled !== true) {
            disableTabs();
        }
    }


    /**
     * Determines the product to be selected from the list, by default.
     * URL-set product takes precedence over anything, then the _tprcfg-based
     * product, then the first in the list.
     * @returns {number}
     */
    function getForcedSetProduct ()
    {
        var urlSetProduct = CMF.utils.getURLParameterByName('tprpid');  // URL-set ID of default product

        if (urlSetProduct) {
            return urlSetProduct;
        }

        if (typeof _tprcfg !== "undefined") {
            if (_tprcfg.options) {
                if (_tprcfg.options.defaultProductId) {
                    return _tprcfg.options.defaultProductId;
                }
            }
        }

        return null;
    }


    function getDefaultTab ()
    {
        var urlSetTab;

        urlSetTab = CMF.utils.getURLParameterByName('tprtab');
        if (urlSetTab) {
            return urlSetTab;
        }

        if (typeof _tprcfg !== "undefined") {
            if (_tprcfg.options) {
                if (_tprcfg.options.defaultTab) {
                    return _tprcfg.options.defaultTab;
                }
            }
        }

        return 0;
    }

    function preMadeDesignsAccessRestricted ()
    {
        if (typeof _tprcfg != "undefined") {
            if (_tprcfg.data) {
                if (_tprcfg.data.tpl === true) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Initializes the dashboard
     */
    function init (callback)
    {
        var designId = CMF.design.getId();
        var forcedSetProduct = getForcedSetProduct();
        var defaultTab = getDefaultTab();
        var urlSetPreMadeDesign = CMF.utils.getURLParameterByName('tprdesign');
        var customTemplatesWrapper = $('#tpr-custom-templates');
        var customTemplates = customTemplatesWrapper.find('.product');

        // Check if a pre-made design is required to load via URL
        if ( urlSetPreMadeDesign ) {
            CMF.products.generate(function() {
                loadPreMadeDesign(urlSetPreMadeDesign, function() {
                    setUpTabs(1, callback);
                });
            });
            return;
        }

        if (customTemplates.length) {
            customTemplatesWrapper.show();
        }

        // If starting with a fresh design, or accessing the admin UI...
        if (!designId || CMF.admin) {
            CMF.products.generate(function() {
                var productToLoad = forcedSetProduct ? forcedSetProduct : 0;
                CMF.products.select(productToLoad);
                setUpTabs(defaultTab, callback);
            });
            return;
        }

        // If starting with a saved design...
        CMF.viewport.changeLoaderText("Loading your saved design");
        CMF.products.generate(function(){
            CMF.design.load('custom', designId, function(err){
                if (err) {
                    console.log("Could not load saved design", designId, "\n", err);
                    CMF.storage.eraseDesignId();
                }

                if (forcedSetProduct) {
                    CMF.products.select(forcedSetProduct);
                }

                setUpTabs(defaultTab, callback);
            });
        });
    }


    function assignPlaceholderToLazyImages ()
    {
        var placeholder = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXYzh8+PB/AAffA0nNPuCLAAAAAElFTkSuQmCC";

        $(".tpr-lazy-image").each(function() {
             if (this.getAttribute("src") !== this.getAttribute("data-src")) {
                 this.setAttribute("src", placeholder);
             }
        });
    }

    /**
     * Determines which of the images in the provided collection are above
     * the offset limits, where they are visible to the user, and loads them.
     *
     * @param $images Jquery collection of lazy images
     * @param offsetLimit The vertical offset that constitutes the visibility threshold
     */
    function loadVisibleLazyImages ($images, offsetLimit)
    {
        if (!$images.length) {
            return;
        }

        $images.each(function() {
            var $image = $(this);

            if ( $image.offset().top <= offsetLimit ) {
                if ( $image.attr("src") != $image.attr("data-src") ) {
                    $image.attr("src", $image.attr("data-src"));
                }
            }
        });
    }

    function enableCustomScrollbars ()
    {
        $(".tpr-has-scrollbar").each(function(){
            var $wrapper = $(this);
            var $lazyImages = $wrapper.find(".tpr-lazy-image");
            var $scrollBox;
            var offsetLimit;

            var checkForLazyImages = function () {
                if (!$lazyImages.length) {
                    return;
                }

                $scrollBox = $wrapper.find(".mCustomScrollBox");

                if (!$scrollBox.length) {
                    return;
                }

                offsetLimit = $scrollBox.offset().top + $scrollBox.height();
                loadVisibleLazyImages($lazyImages, offsetLimit);
            };

            /**
             * Documentation @ http://manos.malihu.gr/jquery-custom-content-scroller/
             */
            $wrapper.mCustomScrollbar({
                axis: "y",
                theme: "dark",
                scrollInertia: 200,
                callbacks: {
                    /**
                     * A function to call when plugin markup is created.
                     */
                    onCreate: function () {},

                    /**
                     * A function to call when scrollbars have initialized
                     */
                    onInit: function () {},

                    onUpdate: function () {
                        checkForLazyImages();
                    },

                    /**
                     * A function to call when content becomes short enough and vertical scrollbar is removed.
                     */
                    onOverflowYNone: function () {},

                    /**
                     * A function to call while scrolling is active
                     */
                    whileScrolling: function () {
                        loadVisibleLazyImages($lazyImages, offsetLimit);
                    }
                }
            });
        });
    }

    function appendUserSavedDesignSection ()
    {
        var template = $("#tpr-user-designs-section-tpl").html();

        $(".tpr-saved-designs-panel").prepend(Mustache.render(template,{}));
        Topperoo.buildCache();
    }

    function populateUserSavedDesignsList ()
    {
        Topperoo.api.initUserDesignsList(_tprcfg.data.savedDesigns);
    }

    function showSaveDesignButton ()
    {
        $(".tpr-button[data-action='save']").removeClass("tpr-hidden");
    }

    function loadCfgData ()
    {

        if (typeof _tprcfg === "undefined") {
            return;
        }

        if (!_tprcfg.data) {
            return;
        }

        if (_tprcfg.data.savedDesigns) {
            appendUserSavedDesignSection();
            populateUserSavedDesignsList();
            showSaveDesignButton();
        }
    }


    /**
     * Makes the dashboard controls usable
     */
    function activate(callback)
    {
        $controls.removeClass("tpr-hidden");
        assignPlaceholderToLazyImages();
        enableCustomScrollbars();
        CMF.viewport.hideLoader();

        if (window.location.hostname === 'topperoo.com' || window.location.hostname === 'www.topperoo.com') {
            $('.cmf-octrlw').addClass('hidden');
        }

        if ( preMadeDesignsAccessRestricted() ) {
            $("#tpr-pre-made-designs-section").remove();
        }

        if (typeof callback === 'function') {
            callback();
        }

    }


    function disableWindowScrolling ()
    {
        $(window).on('touchmove', function(event) {
            event.preventDefault();
        });
    }


    function enableWindowScrolling ()
    {
        $(window).off('touchmove');
    }

    function getTemplateEditorData ()
    {
        var unit = $('input[name="tpl-measurement-unit"]:checked').val();
        var factor = 1;
        var topperShape = $('input[name="template.topper.shape"]:checked').val();
        var topperWidth, topperHeight;
        var mCols = $('input[name="template.matrix.columns"]').val();
        var mRows = $('input[name="template.matrix.rows"]').val();
        var matrix = [];

        if (unit == 'cm'){
            factor = 0.393701;
        }

        switch (topperShape) {
            case 'round':
                topperWidth = topperHeight = $('input[name="template.topper.width"]').eq(0).val() * factor;
                break;
            case 'rectangular':
                topperWidth = $('input[name="template.topper.width"]').eq(1).val() * factor;
                topperHeight = $('input[name="template.topper.height"]').val() * factor;
                break;
        }

        for (var i = 0; i < mRows; i++) {
            matrix[i] = [];
            for (var j = 0; j< mCols; j++) {
                matrix[i][j] = 1;
            }
        }

        return {
            'Height': parseFloat(($('input[name="template.height"]').val() * factor).toFixed(3)),
            'Width': parseFloat(($('input[name="template.width"]').val() * factor).toFixed(3)),
            'Margins': {
                'Top': parseFloat(($('input[name="template.margins.top"]').val() * factor).toFixed(3)),
                'Left': parseFloat(($('input[name="template.margins.left"]').val() * factor).toFixed(3)),
                'Vertical': parseFloat(($('input[name="template.margins.vertical"]').val() * factor).toFixed(3)),
                'Horizontal': parseFloat(($('input[name="template.margins.horizontal"]').val() * factor).toFixed(3))
            },
            'Topper': {
                'Shape': topperShape,
                    'Height': parseFloat(topperHeight.toFixed(3)),
                    'Width': parseFloat(topperWidth.toFixed(3))
            },
            'Matrix': matrix
        };
    }

    /**
     * Swaps the fields containing dimension inputs (width/height/diameter)
     * depending on the selected topper shape, within the Template Editor.
     */
    function swapTplEditorTopperFields ()
    {
        var $input = $(this);
        var shape = $input.val();
        var $fields = $tplEditor.find('.tpl-shape-dependent-field');
        var width;

        if ($input.val() == 'round') {
            width = $fields.filter('[data-shape="rectangular"]').find('[name="template.topper.width"]').val();
            $fields.filter('[data-shape="round"]').find('[name="template.topper.width"]').val(width);
        } else {
            width = $fields.filter('[data-shape="round"]').find('[name="template.topper.width"]').val();
            $fields.filter('[data-shape="rectangular"]').find('[name="template.topper.width"]').val(width);
        }

        $fields.hide().filter('[data-shape="' + shape + '"]').show();
        $input.trigger('template.draw');
    }

    /**
     * Determine the multiplication factor for all dimensions,
     * when converting when from inch to centimeter, or vice versa.
     * @returns {number}
     */
    function computeUnitConversionFactor ()
    {
        var unit = $('input[name="tpl-measurement-unit"]:checked').val();

        switch (unit) {
            case 'in':
                return 0.393701;    // 1 cm = 0.393701"
            case 'cm':
                return 2.54;      // 1" = 2.54 cm
        }
    }

    /**
     * Modify dimensions related to the template in the editor,
     * based on the selected measurement unit.
     */
    function changeTplEditorMeasurementUnit ()
    {
        var factor = computeUnitConversionFactor();
        var unit = $('input[name="tpl-measurement-unit"]:checked').val();

        $tplEditor.find('.tpl-dimension').each(function() {
            var $input = $(this);
            var value = parseFloat($input.attr('data-value')) * factor;
            $input.val(value).attr('data-value', value).trigger('measurement_unit_changed');
        });
        $tplEditor.find('[data-unit]').attr('data-unit', unit);
        $tplEditor.trigger('template.draw');
    }

    /**
     * Limit the maximum value
     */
    function limitTplEditorDimensionValue ($input, min, max)
    {
        var value = parseFloat($input.val());

        if (value > max) {
            value = max;
            $input.val(value);
        } else if (value < min) {
            value = min;
            $input.val(value);
        }

        var str_value = value.toString();
        var parts = str_value.split('.');

        if (parts[1] && parts[1].length > 2) {
            str_value = str_value.substring(0, str_value.indexOf('.') + 3);
            $input.val(str_value);
        }

        return str_value;
    }

    function drawTemplatePreview ()
    {
        var data = getTemplateEditorData();
        var template = new CMF.template(data);

        CMF.editor.setTemplate(template);
        template.drawEditorPreview();
    }

    function appendUserTemplate (product)
    {
        var $wrapper = $('#tpr-custom-templates');
        var itemMarkupTpl = $('#tpr-templates-list-item').html();
        var rowMarkupTpl = $('#tpr-templates-list-row').html();
        var template = new CMF.template(product['Template'], product['ID']);
        var itemMarkup = Mustache.render(itemMarkupTpl, {
            template_json: JSON.stringify(product['Template']),
            name: product['Name'],
            id: product['ID'],
            oldid: product['OldID'],
            description: product['Description']
        });
        var customTemplatesCount = $wrapper.find('.product').length;

        if (customTemplatesCount % 3 == 0) {
            $wrapper.append(Mustache.render(rowMarkupTpl, {}));
        }

        $wrapper.find('.tpr-products-row').last().append(itemMarkup);
        template.drawThumbnail('tpr-product-thumb-' + product['ID']);
        $wrapper.show();
        CMF.products.buildCache();
        CMF.products.select(product['ID']);
    }

    function attachEventHandlers (callback)
    {
        $doc.on("keydown", function(event) {
            CMF.config.shiftKey = event.shiftKey;
        });

        $doc.on("keyup", function(event) {
            CMF.config.shiftKey = event.shiftKey;
        });

        $topperoo.on('click', '.tabs li', function(){
            var id = $(this).attr('id') || '';
            var editorPreviewContainer = document.getElementById('tpr-template-editor-preview');
            var $selected;
            var template;
            var height;

            if (id != 'tpr-template-editor-tab') {
                if (editorPreviewContainer) {
                    editorPreviewContainer.style.display = 'none';
                }
                $selected = CMF.products.getSelected(true);
                template = new CMF.template($selected.data('template'), $selected.data('id'));

                if ($('#isRepetitiveSelector').prop('checked')) {
                    height = template._getTopperHeightOnScreen();
                } else {
                    height = template._getSheetHeightOnScreen();
                }

                $('.viewport').css('height', height);
            }
        });

        $topperoo.on('click', '#tpr-template-editor-tab', function(){
            $tplEditor.trigger('template.draw');
        });

        /**
         * Because the pre-made designs wrapper is hidden when the user loads the application,
         * the lazy loading plugin won't run on the images within it until the user scrolls.
         * Thus, the wrapper needs a little nudge when the wrapper is revealed, just enough
         * for the loading of the first images to trigger.
         */
        $doc.one("click", "#tpr-saved-designs-tab", function(){
            $(".tpr-saved-designs").scrollTop(1).scrollTop(0);
        });

        $doc.on("mousedown touchstart", ".grip", function(event){
            var id;
            var object;
            var ev;

            //disableWindowScrolling();

            // Don't trigger selection when clicking on object controls (rotate, resize etc.)
            if (event.target != this) {
                return;
            }

            if (event.type === 'mousedown') {
                ev = event;
            } else {    // type === 'touchstart'
                ev = event.originalEvent.targetTouches[0];     // only the first finger counts
            }

            id = $(this).attr("data-objectid");
            object = CMF.design.getObjectById(id);
            object.select().dragStart(ev.pageX, ev.pageY);
        });

        /**
         * Trigger text object editing when double clicking an object's grip
         */
        $doc.on("dblclick", ".grip", function(event){
            var id = $(this).attr("data-objectid");
            var object = CMF.design.getObjectById(id);

            if (object.type !== "text") {
                return;
            }

            $("#listItem-"+id).find(".edit a").trigger("click");
        });

        $doc.on("click", ".grip .ctrl.edit", function(){
            var id = $(this).parent().attr("data-objectid");
            $("#listItem-"+id).find(".edit a").trigger("click");
        });

        $doc.on("mousedown touchstart", ".ctrl.rotate", function(event){
            var id = $(this).parent().attr("data-objectid");
            var object = CMF.design.getObjectById(id);
            var ev;

            //disableWindowScrolling();

            if (event.type === 'mousedown') {
                ev = event;
            } else {    // type === 'touchstart'
                ev = event.originalEvent.targetTouches[0];     // only the first finger counts
            }

            object.rotateStart(ev.pageX, ev.pageY);
        });

        $doc.on("mousedown touchstart", ".ctrl.resize", function(event){
            var ctrl = $(this);
            var id = ctrl.parent().data("objectid");
            var object = CMF.design.getObjectById(id);
            var sDir = ctrl.data("scale-direction");

            //disableWindowScrolling();

            if (event.type != "mousedown") {    // type === 'touchstart'
                event = event.originalEvent.targetTouches[0];     // only the first finger counts
            }

            object.resizeStart(event.pageX, event.pageY, sDir);
        });

        $doc.on("click", ".ctrl.copy", function(event){
            var id = $(this).closest("li").attr("data-objectid");
            CMF.design.clearSelection();
            CMF.design.duplicateObject(id);
        });

        $doc.on("click", ".ctrl.crop", function(event){
            var ctrl = $(this);
            var id = ctrl.closest(".grip").data("objectid");

            if (typeof id === "undefined") {
                id = ctrl.closest(".listItem").data("objectid");
            }

            CMF.lightbox.crop(id);
        });

        $doc.on("click", ".ctrl.depth", function(event){
            var ctrl = $(this);
            var id = ctrl.closest("li").attr("data-objectid");
            CMF.design.changeObjectDepth(id, ctrl.data("direction"));
        });

        $doc.on("click", ".ctrl.delete:not(.premadeDesignCtrl)", function(){
            var ctrl = $(this);
            var id = ctrl.closest(".grip").data("objectid");

            if (typeof id === "undefined") {
                id = ctrl.closest(".listItem").data("objectid");
            }

            CMF.design.removeObject(id);
        });

        $productsSection.on("click", ".tpr-template-thumb", CMF.products.select);
        $productsSection.on("click", ".tpr-remove-btn", function () {
            var message = "Are you sure you want to remove this template?";
            var $button = $(this);
            var $product = $button.closest('.product');

            if (window.confirm(message)) {
                $product.remove();
                CMF.config.executeCustomCallback('topperoo.template.remove', $product.data('id'));
            }
        });

        $doc.on("click", ".listItem", function(event){
            var $target = $(event.target);
            var object;
            var id;

            if (!$target.hasClass('listItem')) {
                return; // don't select the list item if the click target was a DOM child
            }

            id = $(this).attr("data-objectid");
            object = CMF.design.getObjectById(id);
            object.select();
        });

        /**
         * Set up horizontal navigation between tabbed sections
         */
        $doc.on("click", ".cmf-thnb:not(.cmf-submitOrderBtn)", function(){
            if ($(this).hasClass('cmf-next')) {
                $('.tabs').find('a').eq(1).trigger('click');
            } else {
                $('.tabs').find('a').eq(0).trigger('click');
            }
        });


        /**
         * Highlight an object's grip when the its corresponding details list item is hovered
         */
        $doc.on("mouseenter mouseleave", ".listItem", function(event){
            var id = $(this).attr("data-objectid");
            $("#grip-"+id).toggleClass("hover");
        });

        /**
         * Clear the design object selection when the viewport is clicked outside of any grip element (i.e. "empty space")
         */
        $doc.on("mouseup", function(event)
        {
            //CMF.design.clearSelection();
        });

        $doc.on("click", ".designControls button", function(event){
            var button = $(this);
            var action = button.attr("data-action");

            switch (action)
            {
                case "reset":
                    if (window.confirm("Are you sure you want to reset your design?")) {
                        CMF.design.reset(CMF.viewport.hideLoader);
                    }
                    break;

                case "save":
                    CMF.viewport.changeLoaderText("Saving design...");
                    CMF.viewport.showLoader(function(){
                        CMF.design.save(function(err, data){
                            CMF.viewport.changeLoaderText("Design saved");
                            CMF.viewport.hideLoader(3000);

                            CMF.design.setId(data.id);

                            if (!err) {
                                CMF.config.executeCustomCallback('topperoo.design.saved', data);
                            }
                        }, true);
                    });
                    break;

                case "preview":
                    CMF.viewport.changeLoaderText("Loading design preview");
                    CMF.viewport.showLoader(function(){
                        CMF.design.save(function(){
                            var url = CMF.config.buildURL("/image/preview/" + CMF.design.getId() + "?_=" + Date.now());
                            CMF.viewport.hideLoader();
                            CMF.lightbox.preview(url, '');
                        });
                    });
                    break;
            }
        });

        $('#isRepetitiveSelector').on('change', function()
        {
            var product = CMF.products.getSelected();
            var $product = $('#topperoo .product[data-id="' + product.id + '"]');
            var template = new CMF.template($product.data('template'), product.id);
            var topperHeight = template._getTopperHeightOnScreen();
            var sheetHeight = template._getSheetHeightOnScreen();
            var obj = CMF.design.getSelectedObject();

            CMF.design.markAsRepetitive(this.checked);

            if (this.checked) {
                CMF.viewport.switchToSingleTopper(template, topperHeight);
                CMF.viewport.setPixelSize(false);   // set pixel size to that of sample topper
            } else {
                CMF.viewport.changeSheet(template, sheetHeight);
                CMF.viewport.setPixelSize(true);   // set pixel size to that of sheet
            }

            if (obj !== null) {
                obj.setSizeOnPaper();
            }
        });

        $('#imageUploadForm [type="file"]').on('change', function () {
            var $input = $(this);
            var $button = $input.siblings('[type="reset"]');

            if ($input.val()) {
                $button.show();
            } else {
                $button.hide();
            }
        });

        $('#imageUploadForm [type="reset"]').on('click', function () {
            $(this).hide();
        });

        $tplEditor.find('input[type="number"]').on('keypress keyup', function () {
            var $input = $(this);

            var value = limitTplEditorDimensionValue($input, -99.99, 99.99);

            $input.attr('data-value', value);
            $input.trigger('template.draw');
        });

        $tplEditor.find('input[type="number"]').on('measurement_unit_changed', function () {
            var $input = $(this);
            var minimum = -99.99;
            var maximum = 99.99;
            var current = parseFloat($input.attr('data-value'));

            limitTplEditorDimensionValue($input, minimum, maximum);

            if (current > maximum) {
                $input.attr('data-value', maximum);
            } else if (current < minimum) {
                $input.attr('data-value', minimum);
            }

            $input.trigger('template.draw');
        });

        $tplEditor.find('input[name="tpl-measurement-unit"]').on('change', changeTplEditorMeasurementUnit);
        $tplEditor.find('input[name="template.topper.shape"]').on('change', swapTplEditorTopperFields);
        $tplEditor.on('template.draw', drawTemplatePreview);
        $tplEditor.on('click', '#tpr-save-template-btn', function(){
            var $button = $(this);

            if (CMF.config.getConfigOption('saveCustomTemplates') === false) {
                $button.prop('disabled', true);
                CMF.config.executeCustomCallback('topperoo.template.savingDenied');
                return;
            }

            CMF.viewport.showLoader('Saving your template');
            CMF.editor.saveTemplate(function(data){
                appendUserTemplate(data);
                CMF.config.executeCustomCallback('topperoo.template.saved', data);
            });
        });

        /**
         * Load a pre-made design when its corresponding list item is clicked on
         */
        $premadeSection.on("click", ".tpr-saved-designs__item", function(event){
            var $li = $(this);
            var id = $li.attr("data-id");   // pre-made design ID
            var $target = $(event.target);

            event.stopPropagation();

            if ($target.hasClass("premadeDesignCtrl")) {
                return;
            }

            if ($target.hasClass("tpr-active-element")) {
                return;
            }

            if (!window.confirm("Loading a pre-made design will erase your current design.\nAre you sure want to proceed?")) {
                return;
            }

            if ($li.hasClass("tpr-user-design")) {
                loadUserSavedDesign(id);
            } else {
                loadPreMadeDesign(id);
            }
        });

        $premadeSection.on("click", ".tpr-user-design-remove", function() {
            var id = $(this).closest(".tpr-user-design").attr("data-id");

            if (window.confirm("Are you sure you want to remove this design")) {
                Topperoo.api.removeUserDesign(id);
            }
        });

        /**
         * Emits a custom event when a user's design name or description changes
         */
        function triggerUserDesignPropertyChange ()
        {
            var $element = $(this);

            CMF.config.executeCustomCallback('topperoo.design.propertyChange', {
                id: $element.closest(".tpr-user-design").attr("data-id"),
                key: $element.attr("data-key"),
                value: $.trim($element.text())
            });
        }

        /**
         * Emits a custom event when a user's template name or description changes
         */
        function triggerUserTemplatePropertyChange ()
        {
            var $element = $(this);

            CMF.config.executeCustomCallback('topperoo.template.propertyChange', {
                id: $element.closest(".product").attr("data-id"),
                key: $element.attr("data-key"),
                value: $.trim($element.text())
            });
        }

        $productsSection.on("blur", "[contenteditable='true']", triggerUserTemplatePropertyChange);
        $premadeSection.on("blur", "[contenteditable='true']", triggerUserDesignPropertyChange);
        $premadeSection.on("keydown", "[contenteditable='true']", function (event)
        {
            if (event.keyCode != 13) {  // Enter (i.e. "Return")
                return;
            }

            $(this).trigger("blur");
            event.preventDefault();
        });


        $premadeSection.on("click", ".premadeDesignCtrl", function(event)
        {
            var $this = $(this);
            var $listItem = $this.closest(".tpr-saved-designs__item");
            var designID = $listItem.attr("data-id");

            switch ($this.attr("data-action")) {
                case "changeState":
                    CMF.utilsa.swapPremadeDesignState(designID, function(){
                        var text = $this.html();

                        if ($this.html() === 'private') {
                            $this.html('public');
                        } else {
                            $this.html('private');
                        }

                        $this.toggleClass('private');
                    });
                    break;
                case "delete":
                    if (window.confirm("Are you sure you want to delete this design")) {
                        CMF.utilsa.deletePremadeDesign(designID, function(){
                            $listItem.hide(200);
                        });
                    }
                    break;
                default:
                    break;
            }

            event.stopPropagation();
        });

        $topperoo.on("keyup", function (event)
        {
            //if (event.keyCode == 46) {  // Delete key
            //    if (CMF.design.areAnyItemsSelected()) {
            //        console.log("Item selected, not deleted.");
            //        CMF.design.removeSelected();
            //    }
            //}
        });

        /**
         * Set dashboard buttons 'Add images', 'Add a video', 'Add text' to open their corresponding forms when clicked
         */
        $(".objectTypeSelectors a").magnificPopup({
            type: "inline",
            overflowY: "scroll",
            closeOnBgClick: true,      // prevents closing the lightbox when the background is clicked
            callbacks: {
                beforeOpen: function(){
                    CMF.lightbox.initTextAddDialog();
                },

                open: function () {
                    var buttonType = this._lastFocusedEl.attributes['data-type'].value;
                    if (buttonType === 'clipart') {
                        $('.galleryContainer').scrollTop(1).scrollTop(0);
                    }
                }
            }
        });

        /**
         * Set the "edit" icons in the objects details list to trigger the "Edit Text" dialog
         */
        $(".objectsDetailsList").magnificPopup({
            delegate: ".ctrl.edit a",
            type: "inline",
            overflowY: "scroll",
            closeOnBgClick: true,  // prevents closing the lightbox when the background is clicked
            callbacks: {
                beforeOpen: function(){
                    var $editIcon = $($.magnificPopup.instance.st.el);   // the icon that triggered the "edit" action
                    var id = $editIcon.closest(".listItem").attr("data-objectid");
                    CMF.lightbox.initTextEditDialog(id);
                }
            }
        });
    }

    return {
        buildCache: buildCache,
        load: load,
        attachEventHandlers: attachEventHandlers,
        init: init,
        activate: activate,
        enableWindowScrolling: enableWindowScrolling,
        disableWindowScrolling: disableWindowScrolling,
        loadCfgData: loadCfgData,
        appendUserTemplate: appendUserTemplate
    };

})(jQuery);
