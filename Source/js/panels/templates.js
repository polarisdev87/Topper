import $ from 'jquery';
import cache from '../cache';
import mediator from '../mediator';
import { getNested, getCurrencySymbol, renderPanelTemplate as renderTemplate } from '../helper';
import TemplateSVG from '../components/template_svg';

export default function TemplatesPanel () {
    const $scrollSidebar = cache.get('$scrollSidebar');

    let hasDomEventListener = false;
    let $templateComponent;

    function onSidebarLayoutMenuClicked () {
        let appBaseUrl = cache.get('APP_API_URL');
        let jsonUrl = appBaseUrl + '/instances/' + cache.get('INSTANCE_ID') + '/products';

        let process_data = (data) => {
            let result = [];

            if (data.status === 'success') {
                for (let product of data.data['Products']) {
                    let currencySymbol, productPrice;

                    // Maybe doesn't have currency
                    currencySymbol = getNested('ProductsMeta.Currency', product);
                    if (currencySymbol) {
                        currencySymbol = getCurrencySymbol(currencySymbol);
                    }

                    // Maybe doesn't have price
                    productPrice = getNested('ProductsMeta.Price', product);

                    result.push({
                        product_thumbnail: TemplateSVG(product).drawThumbnail().svg(),
                        product_currency: currencySymbol,
                        product_price: productPrice,
                        product_name: product['Name'],
                        product_data: JSON.stringify(product),
                    });
                }
            }

            return { product_list: result };
        };

        renderTemplate('templates', jsonUrl, {}, process_data)
            .then(listenDOMEvents)
            .then(triggerDOMEvents);
    }

    function listenDOMEvents () {
        $templateComponent = $scrollSidebar.find('.sidebar-templates-component').eq(0);
        if (!hasDomEventListener) {
            $templateComponent.find('.nav-link').on('click', navLinkClicked);
            $templateComponent.find('.btn-secondary.btn-block').on('click', createTemplateClicked);
            $templateComponent.find('.template-item').on('click', templateItemClicked);

            //Add Event Listener for Input range
            $templateComponent.find('input[type=range]').on("input", inputRangeChanged);
            //Add Event Listener for Sheet Size
            $templateComponent.find('.sheet').on("click", sheetSizeClicked);
            //Add Event Listener for Shape 
            $templateComponent.find('.shape').on("click", templateShapeClicked);

            // Set flag if DOM listener is already attached
            hasDomEventListener = true;
        }
    }

    function triggerDOMEvents () {
        $templateComponent.find('.nav-link').eq(0).trigger('click');
    }

    function inputRangeChanged (event) {
        let parentNode = $(event.currentTarget).parent();
        let currentValue = parseFloat($(this).val());
        let max = parseFloat($(this).attr("max"));
        let min = parseFloat($(this).attr("min"));
        let parentWidth = parentNode.width();
        let textWidth = parentNode.find(".number-indicator").width();

        console.log(textWidth);

        let left = (((currentValue - min) / (max - min)) * parentWidth) - (textWidth / 2);
        let rangeIndicatorText = $(event.currentTarget).parent().find(".indicator").text(currentValue);
        let rangeIndicator = $(event.currentTarget).parent().find(".number-indicator").css("left", left + "px");
    }

    function sheetSizeClicked (event) {
        $templateComponent.find(".sheet").removeClass("active");
        let sheet = $(event.currentTarget).addClass("active");
    }

    function templateShapeClicked (event) {
        $templateComponent.find(".shape").removeClass("active");
        let sheet = $(event.currentTarget).addClass("active");
    }

    function templateItemClicked (event) {
        let productData = $(event.currentTarget).attr('data-product');
        try {
            productData = JSON.parse(productData);
        }
        catch (e) {
            productData = {};
        }

        mediator.broadcast('TemplateItemSelected', [productData]);

        $(event.currentTarget).siblings().removeClass('selected');
        $(event.currentTarget).addClass('selected');
    }

    function navLinkClicked (event) {
        event.preventDefault();
        $scrollSidebar.find('.nav-link').each((i, element) => {
            let $element = $(element);
            if (!$(event.currentTarget).is($element)) {
                $element.removeClass('active');
            }
            else {
                $element.addClass('active');
                $scrollSidebar.find('.tab-pane').each((ii, element) => {
                    let $element = $(element);
                    if (i === ii) {
                        $element.addClass('active');
                    }
                    else {
                        $element.removeClass('active');
                    }
                });
            }
        });

        $(event.currentTarget).addClass('active');
    }

    function createTemplateClicked (event) {
        event.preventDefault();
        $scrollSidebar.find('.template-list').removeClass('active');
        $scrollSidebar.find('.create-template').addClass('active');
    }

    return {
        onSidebarLayoutMenuClicked: onSidebarLayoutMenuClicked,
    };
}
