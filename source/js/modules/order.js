var CMF = CMF || {};

CMF.order = (function($, undefined){
    var $doc = $(document);

    /**
     * Quantity (# of icing sheets)
     * @type {Number}
     */
    var qty = 1;

    /**
     * Total price for the current order
     * @type {Number}
     */
    var cost = 0;

    function setCost() {
        /**
         * Expression for calculating total order cost:
         * (qty x (productCost + SUM(optionsCostA))) x SUM(optionsCostB) + SUM(optionsCostC)
         *
         * See client's options config file to understand which fields have type A, B or C cost effect.
         */
        var product = CMF.products.getSelected();
        var optionsCosts = getOptionsCost();

        cost = (qty * (product.price + optionsCosts['A'])) * (1 - optionsCosts['B']) + optionsCosts['C'];
        $('#tpr-amount').html(CMF.config.get('currency','symbol') + ' ' + cost.toFixed(2));   // set the 'order total cost'
    }

    /**
     * Determines the total cost of the order options (e.g. shipping, flavour etc.)
     */
    function getOptionsCost ()
    {
        var costs = {
            'A': 0,
            'B': 0,
            'C': 0
        };

        $(".tpr-customFormField").each(function(){
            var field = $(this);
            var fieldType = field.data("fieldtype");
            var costEffect = field.data("costeffect");
            var value = 0;

            switch (fieldType) {
                case 'select':
                    value = field.find('option:selected').val();
                    break;
                case 'radio':
                    value = field.find('input:checked').val();
                    break;
                case 'checkbox':
                    value = field.find('checkbox').prop('checked') ? field.find('checkbox').val() : 0;
            }

            if (costEffect) {
                costs[costEffect] += parseFloat(value);
            }
        });

        return costs;
    }


    /**
     * Gathers key/value pairs regarding the order options. Typically used within storefronts.
     * Because the value is used within order confirmation emails, the labels are, in fact, used.
     * @returns {{}}
     */
    function collectOrderOptions ()
    {
        var options = {};

        $(".tpr-customFormField").each(function(){
            var field = $(this);
            var fieldType = field.data("fieldtype");
            var fieldName = field.data("fieldname");

            switch (fieldType) {
                case 'select':
                    options[fieldName] = field.find('option:selected').html();
                    break;
                case 'radio':
                    options[fieldName] = field.find('input:checked').next().html();
                    break;
                case 'text':
                    options[fieldName] = field.find('input').val();
                    break;
                case 'checkbox':
                    options[fieldName] = field.find('checkbox').prop('checked') ? 'yes' : 'no';
            }
        });

        return ($.isEmptyObject(options) ? null : options);
    }


    function getOrderData ()
    {
        var product = CMF.products.getSelected();
        var options = collectOrderOptions();
        var output;

        output = {
            designId:     CMF.design.getId(),
            productId:    product.id,
            productName:  product.name,
            productType:  product.type,
            unitPrice:    product.price,
            qty:          qty,
            cost:         cost,
            currency:     CMF.config.get('currency', 'code'),
            shop:         product.shop || {},
            options:      options
        }
        output.designItems = CMF.design.getDesignItems();

        return output;
    }

    function submitHiddenOrderForm (data)
    {
        var form = $('<form/>', {
            action: CMF.config.get('outputURL'),
            method: 'POST'
        });

        var input = $('<input/>', {
            'type': 'hidden',
            'name': 'cmfOrderData',
            'value': JSON.stringify(data)
        });

        form.append(input).hide().appendTo('body').trigger('submit');

        return form;
    }


    /**
     * Submits the order via POST request to the designated URL
     */
    function submit ()
    {
        var orderData;

        if (CMF.design.isEmpty()) {
            CMF.viewport.showLoader('You cannot submit an empty design!', function() {
                CMF.viewport.hideLoader(2500);
            });
            return;
        }

        orderData = getOrderData();
        CMF.design.deactivateAutosave();

        // Save the design and also request its replication within the database.
        // The incoming ID will be the public ID of the replicated design's DB entry.
        CMF.viewport.showLoader('Processing your design...', function(){
            CMF.design.save(function(err, data){
                if (err) {
                    CMF.viewport.changeLoaderText('There was an error saving your design. Please try again.');
                    CMF.viewport.hideLoader();
                    return;
                }

                CMF.design.setId(data.id);
                console.log('topperoo.order.submit: ', orderData);
                CMF.config.executeCustomCallback('topperoo.order.submit', orderData);

                if (CMF.config.get('outputURL') != null) {
                    submitHiddenOrderForm(orderData)
                }
            }, true);
        });
    }

    function attachEventHandlers ()
    {
        $doc.on("input", "#cmf-qtySelector", function() {
            this.value = this.value.replace(/[^0-9]/g,'');  // avoid non-numeric symbols
            qty = parseInt(this.value);
            setCost();
        });

        $doc.on("blur", "#cmf-qtySelector", function() {
            qty = parseInt(this.value);

            if (!qty) {
                qty = 1;
            }

            this.value = qty;
            setCost();
        });

        $doc.on("click", ".tpr-qty-control", function() {
            var gain;
            var operation = $(this).data('op');
            var input = $("#cmf-qtySelector");

            qty = parseInt(input.val());

            switch (operation) {
                case "sub":
                    gain = -1;
                    break;
                case "add":
                default:
                    gain = 1;
            }

            qty += gain;

            if (qty < 1) {
                qty = 1;
            } else if (qty > 999) {
                qty = 999;
            }

            input.val(qty);
            setCost();
        });

        $doc.on("change", ".tpr-customFormField", function() {
            setCost();
        });

        $doc.on("click", ".cmf-submitOrderBtn", function(event) {
            if (typeof _tprcfg != "undefined") {
                if (_tprcfg.data) {
                    if (_tprcfg.data.dl === false) {
                        CMF.config.executeCustomCallback('topperoo.download.denied', event);
                        return;
                    }
                }
                if (_tprcfg.options.forcePreviewBeforeSubmit) {
                    CMF.viewport.changeLoaderText("Loading design preview");
                    CMF.viewport.showLoader(function(){
                        CMF.design.save(function(){
                            var url = CMF.config.buildURL("/image/preview/" + CMF.design.getId() + "?_=" + Date.now());
                            CMF.viewport.hideLoader();
                            CMF.lightbox.preview(url, '', {templateSelector: '#tpr-designForcePreviewDialog'});
                        });
                    });
                    return;
                }
            }
            submit();
        });

        $doc.on("click", "#tpr-designPreviewConfirmBtn", function(event) {
            $.magnificPopup.close();
            submit();
        });
    }


    function get(name) {
        switch (name) {
            case 'qty':
                return qty;
        }
    }


    return {
        attachEventHandlers: attachEventHandlers,
        setCost: setCost,
        get: get
    };

})(jQuery);
