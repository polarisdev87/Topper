var CMF = CMF || {};

CMF.products = (function($)
{
    var $productsList;

    function buildCache ()
    {
        $productsList = $("#productsSection .product");
    }

    function generate (callback)
    {
        $productsList.each(function(){
            var $product = $(this);
            var $name = $product.find('.name');
            var $description = $product.find('.description');
            var templateData = $product.data('template');
            var template = new CMF.template(templateData, $product.data('id'));

            template.drawThumbnail();

            if ($name.html() == '') {
                $name.html(template.getDefaultName());
            }

            if ($description.html() == '') {
                $description.html(template.getDefaultDescription());
            }
        });

        callback();
    }

    /**
     * Pre-loads all the viewport images for the listed products, plus their associated sample topper images
     */
    function preload(callback)
    {
        var preloadList = [];
        var filepath;
        var sampleUrl;

        if (!callback) {
            callback = function(){};
        }

        $productsList.each(function(){
            $this = $(this);

            filepath = CMF.config.paths.schematics.viewport + $this.attr("data-filename") + ".png";
            preloadList.push(filepath);

            if ($this.attr('data-sample')) {
                sampleUrl = CMF.config.paths.schematics.viewport + $this.attr('data-sample');
                if (preloadList.indexOf(sampleUrl) == -1) {
                    preloadList.push(sampleUrl);
                }
            }
        });

        CMF.utils.preloadImages(preloadList, callback);
    }


    /**
     * Performs the selection of a product from the available list
     */
    function select()
    {
        var $product;
        var sheetHeight;
        var arg = arguments[0];
        var $isRepetitiveSelector = $('#isRepetitiveSelector');
        var selectedObject;
        var template;

        if (typeof arg === 'number') {
            $product = $productsList.eq(arg);
        } else if (typeof arg === 'object' && arg !== null) {  // click event, triggered on the product image; typeof null === 'object'
            $product = $(this).closest('.product');
        } else if (typeof arg === 'string') {
            $productsList.each(function(){
                var $this = $(this);

                if ($this.data('id') === arg) {
                    $product = $this;
                }

                /* Deprecated, remove asap! */
                if ($this.data('oldid') === arg) {
                    $product = $this;
                }
                // ------------------------ //
            });
        } else {
            return false;
        }

        // When $product is undefined, it means that the locally saved design is based
        // on a product that does not exist (anymore), in which case it has to be erased.
        if (!$product) {
            return false;
        }

        template = new CMF.template($product.data('template'), $product.data('id'));

        $productsList.removeClass('selected');
        $product.addClass('selected');

        /**
         * When the selected product does not have a sample image filename associated,
         * it means that it does not support repeatable design.
         */
        $isRepetitiveSelector.prop('checked', false);    // when selecting a different product, set the isRepetitive flag to false
        CMF.design.markAsRepetitive(false);

        if (template.hasMultipleToppers()) {
            $isRepetitiveSelector.prop('disabled', false);
            $isRepetitiveSelector.closest('.tpr-repetitiveDesignToggleWrp').show();
        } else {
            $isRepetitiveSelector.prop('disabled', true);
            $isRepetitiveSelector.closest('.tpr-repetitiveDesignToggleWrp').hide();
        }

        sheetHeight = template._getSheetHeightOnScreen();
        CMF.viewport.changeSheet(template, sheetHeight);
        CMF.viewport.setPixelSize(true);
        CMF.design.setProduct($product.attr('data-id'));

        selectedObject = CMF.design.getSelectedObject();
        if (selectedObject !== null) {
            selectedObject.setSizeOnPaper();
        }

        CMF.order.setCost();

        return true;
    }


    function getSelected (getJqueryfied)
    {
        var $product = $productsList.filter('.selected').eq(0);

        if (getJqueryfied === true) {
            return $product;
        }

        var data = {
            id:                $product.attr('data-id'),
            name:              $product.attr('data-name'),
            type:              $product.attr('data-type'),
            filepath:          CMF.config.paths.schematics.viewport + $product.attr('data-filename') + '.png',
            height:            $product.attr('data-height'),
            sample:            CMF.config.paths.schematics.viewport + $product.attr('data-sample'),
            sampleAspectRatio: $product.attr('data-sampleaspectratio'),
            price:             parseFloat($product.attr('data-price')),
            template: $product.data('template'),
            shop:              {}
        };
        var key;

        for (var attribute in $product.data()) {
            if (attribute.indexOf('shop') === 0) {
                key = attribute.replace(/shop/, '');
                key = key.charAt(0).toLowerCase() + key.slice(1);
                data.shop[key] = $product.data(attribute);
            }
        }

        return data;
    }


    return {
        buildCache: buildCache,
        preload: preload,
        select: select,
        getSelected: getSelected,
        generate: generate
    };

})(jQuery);
