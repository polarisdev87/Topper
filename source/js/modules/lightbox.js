var CMF = CMF || {};

CMF.lightbox = (function($, undefined) {

    var $doc = $(document);
    var $tpr;
    var $cropTarget;
    var $cropForm;
    var $designPreviewUrlInput;
    var $uploadForm;
    var $textObjectDialog;
    var $colorBtn;

    function buildCache() {
        $tpr = $("#topperoo, .tpr-dialog");
        $cropTarget = $(".cropTargetImage").eq(0);
        $cropForm = $("#imageCroppingForm");
        $textObjectDialog = $("#textObjectDialog");
        $designPreviewUrlInput = $(".tpr-designPreviewUrl");
        $uploadForm = $("#imageUploadForm");
        $colorBtn = $('.tpr-text-format-option .tpr-color-picker');
    }

    function attachEventHandlers()
    {
        $tpr.on("tpr.change", function(event, data) {
            var formatting = getTextObjectFormatting();
            setTextObjectPreview(formatting);
        });

        $doc.on("input", "#textObjectDialog textarea", function() {
            var text = $(this).val();
            setTextObjectPreview(null, text);
        });

        $doc.on("click", ".lightboxClose", function() {
            $.magnificPopup.close();
        });

        $doc.on("submit", "#imageUploadForm", handleFileUpload);
        $doc.on("submit", "#clipArtSelectionForm", addClipArtToDesign);
        $doc.on("click", "#imageCroppingForm [type='submit']", function(event){
            submitCroppedImage();
            event.preventDefault();
        });

        $doc.on("click", "#videoSelectionForm [type='submit']", function(event){
            CMF.design.addQrObject();
            event.preventDefault();
        });

        $doc.on("click", ".textObjectDialog [type='submit']", function(event){
            var id;
            var originalTextObject;
            var objectPosition;

            switch ($textObjectDialog.attr('data-role')) {
                case 'edit':
                    id = $(this).attr("data-objectid"); // ID of object being edited

                    originalTextObject = CMF.design.getObjectById(id);

                    var originalCenterCoordinates = getCenterCoordinate(
                        originalTextObject.width,
                        originalTextObject.height,
                        originalTextObject.left,
                        originalTextObject.top
                    );

                    objectPosition = {
                        angle: originalTextObject.angle,
                        center: originalCenterCoordinates,
                    };

                    CMF.design.removeObject(id, function () {
                        CMF.design.addTextObject(objectPosition);
                    });

                    break;
                case 'add':
                default:
                    CMF.design.addTextObject();
            }

            event.preventDefault();
        });

        /**
         * Toggle select/deselect on a gallery image when it is clicked
         */
        $doc.on("click", ".gallery img", toggleGalleryImageSelection);

        $doc.on("change", "#tpr-upl-copyright-ack", function () {
            var $button = $("#imageUploadForm").find("[type='submit']");

            if (this.checked) {
                $button.prop('disabled', false);
            } else {
                $button.prop('disabled', true);
            }
        });

        new ColorPicker({
            selector: '.tpr-text-format-option .tpr-color-picker',
            templateSelector: '#tpr-color-picker',
            marginTop: -20,
            marginLeft: -10,
            defaultColorPalette: [
                [
                    '#ff5c5c', '#ffbd4a', '#fff952', '#99e265', '#35b729', '#44d9e6',
                    '#2eb2ff', '#5271ff', '#b760e6', '#ff63b1'
                ],
                ['#000000', '#666666', '#a8a8a8', '#d9d9d9', '#ffffff']
            ],
            renderCallback: function (picker) {
                var $option = $colorBtn.parent();

                $colorBtn.attr('data-value', '#' + picker.Color.colors.HEX);
                $colorBtn.data('value', '#' + picker.Color.colors.HEX);
                $colorBtn.css('background-color', '#' + picker.Color.colors.HEX);

                $option.trigger('tpr.change', {
                    key: $option.data('key'),
                    value: $colorBtn.data('value')
                })
            }
        })

        initComponents();
    }

    function getTextFormattingDefaults ()
    {
        return {
            "color": "#000000",
            "font-family": "Pacifico",
            "font-size": "28px",
            "font-weight": "normal",
            "font-style": "normal",
            "text-decoration": "none",
            "text-align": "center",
            "text-curvature": "0"
        };
    }


    function initSelectComponents ()
    {
        $tpr.on("click", ".tpr-menu__head", function() {
            $(this).siblings(".tpr-menu__body").addClass("tpr-menu__body_visible");
        });

        $tpr.on("mouseleave", ".tpr-menu", function() {
            $(this).children(".tpr-menu__body").removeClass("tpr-menu__body_visible");
        });

        $tpr.on("click", ".tpr-menu__option", function() {
            var $option = $(this);
            var $menu = $option.closest(".tpr-menu");
            var $body = $menu.children(".tpr-menu__body");
            var $head = $menu.children(".tpr-menu__head");
            var oldLabel = $head.html();
            var newLabel = $option.html();

            $body.removeClass("tpr-menu__body_visible");

            if (oldLabel === newLabel) {
                return;
            }

            $head.html(newLabel);
            $option.addClass("tpr-selected").siblings().removeClass("tpr-selected");

            $menu.trigger("tpr.change", {
                key: $menu.data("key"),
                value: $option.data("value")
            });
        });
    }

    /**
     * Returns the default value for the specified CSS option
     * @param $option
     */
    function getDefaultTextOptionValue ($option)
    {
        switch ($option) {
            case "font-weight":
            case "font-style":
                return "normal";
            case "color":
                return "#000000";
            case "text-decoration":
            default:
                return "none";
        }
    }

    function initTextFormatComponents ()
    {
        $tpr.on("click", ".tpr-text-format-option__item:not(.tpr-menu__option)", function() {
            var $item = $(this);
            var $option = $item.parent();
            var key = $option.data("key");
            var value = $item.data("value");
            var wasSelected = $item.hasClass("tpr-selected");
            var triggerChange = false;

            $item.siblings().removeClass("tpr-selected");

            /**
             * type "1":  only one option can be selected at a time, but not 0
             * type "0+": one or none of the options can be selected
             */
            if ($option.data("type") == 1) {
                if (!wasSelected) {
                    $item.addClass("tpr-selected");
                    triggerChange = true;
                }
            } else {    // optionType == "0+"
                $item.toggleClass("tpr-selected");
                triggerChange = true;
                if (!$item.hasClass("tpr-selected")) {
                    value = getDefaultTextOptionValue(key);
                }
            }

            if (triggerChange) {
                $option.trigger("tpr.change", {
                    key: $option.data("key"),
                    value: value
                });
            }
        });
    }

    /**
     * Bind events on advance curvature related elements
     */
    function bindEventsOnAdvanceCurvature() {
        $tpr.on('click', '.show-advance-switcher', function () {
            useAdvanceCurvature();
        });
        $tpr.on('click', '.show-simple-switcher', function () {
            unUseAdvanceCurvature();
        });
        $('.advance-curvature-value', $tpr).on('change keyup mouseup', function () {
            var submitValue = $(this).val();
            var advanceCurvatureDir = $('.advance-curvature-direction', $tpr);

            $(this).data('value', submitValue);

            if (submitValue > 0) {
                advanceCurvatureDir.removeClass('arc-down');
                advanceCurvatureDir.removeClass('arc-straight');
                advanceCurvatureDir.addClass('arc-up');
            } else if (submitValue < 0) {
                advanceCurvatureDir.removeClass('arc-up');
                advanceCurvatureDir.removeClass('arc-straight');
                advanceCurvatureDir.addClass('arc-down');
            } else {
                advanceCurvatureDir.removeClass('arc-up');
                advanceCurvatureDir.removeClass('arc-down');
                advanceCurvatureDir.addClass('arc-straight');
            }
        });

        $tpr.on('click', '.curvature .tpr-input-number .inc-button', function (e) {
            var currentVal, siblingInput;
            var $target = $(e.target);

            siblingInput = $target.siblings('input').eq(0);
            currentVal = siblingInput.val();
            currentVal = parseFloat(currentVal) + 0.25;
            siblingInput.val(currentVal);
            siblingInput.trigger('change');
        });

        $tpr.on('click', '.curvature .tpr-input-number .dec-button', function (e) {
            var currentVal, siblingInput;
            var $target = $(e.target);

            siblingInput = $target.siblings('input').eq(0);
            currentVal = siblingInput.val();
            currentVal = parseFloat(currentVal) - 0.25;
            siblingInput.val(currentVal);
            siblingInput.trigger('change');
        });
    }

    function initComponents ()
    {
        initSelectComponents();
        initTextFormatComponents();
        bindEventsOnAdvanceCurvature();
    }


    /**
     * Initializes/Resets the Jcrop plugin
     */
    function setUpJcropPlugin()
    {
        var objectId = $cropForm.data("objectId");
        var object = CMF.design.getObjectById(objectId);
        var $inputs = {
            selection: $cropForm.find("[name='selection']"),
            filename: $cropForm.find("[name='filename']"),
            width: $cropForm.find("[name='width']"),
            height: $cropForm.find("[name='height']")
        };

        var maxSize;
        var width;
        var height;

        // Remove the Jcrop data from the target image in case it was previously added
        if (typeof $cropTarget.data('Jcrop') !== "undefined") {
            $cropTarget.data('Jcrop').destroy();
        }

        // Reset hidden inputs' values from last image crop
        $inputs.selection.val('');
        $inputs.filename.val('');

        // Compute a height and width for the crop target image
        maxSize = parseInt($cropTarget.css("max-height"), 10);

        if (object.aspectRatio >= 1) {
            width = maxSize;
            height = maxSize / object.aspectRatio;
        } else {
            width = maxSize * object.aspectRatio;
            height = maxSize;
        }

        $cropTarget.css({
            "width": width,
            "height": height
        });

        $cropTarget.attr("src", object.url);

        $cropTarget.Jcrop({
            bgColor: "transparent",
            onSelect: function(selection){
                $inputs.selection.val(JSON.stringify(selection));
                $inputs.filename.val(object.getFilename());
                $inputs.width.val($cropTarget.width());
                $inputs.height.val($cropTarget.height());
            }
        });
    }


    /**
     * Submits the image cropping form and attempts to append the cropped image as a new object to the design.
     */
    function submitCroppedImage()
    {
        var formData = new FormData($cropForm[0]);
        var cropFormObject = {
            selection: $cropForm.find('[name="selection"]').val(),
            filename: $cropForm.find('[name="filename"]').val(),
            width: $cropForm.find('[name="width"]').val(),
            height: $cropForm.find('[name="height"]').val()
        };
        var formButtons = $cropForm.find("button");

        formData.append('host', window.location.hostname);
        formData.append('protocol', window.location.protocol);
        formData.append('src', $cropTarget.attr('src'));

        var resetForm = function(err){
            if (err) {
                showError(err);
            }

            formButtons.prop("disabled", false);    // reactivate the form
            hideLoader();
            //setUpJcropPlugin();     // reset the Jcrop tool
        };

        formButtons.prop("disabled", true);
        showLoader();

        $.ajax({
            url: $cropForm.attr("action"),
            dataType: "json",
            data: formData,
            type: "POST",
            crossDomain: true,
            cache: false,
            contentType: false,
            processData: false,
            success: function(response) {
                var preloadList = [];
                var originalObject;

                /**
                 * If there was a server error, just reset the selection form and display a notice.
                 * Otherwise, create a new object with the cropped image and remove the original one from the design.
                 */
                if (response.error) {
                    resetForm(response.error);
                    return;
                }

                preloadList.push(response.image.url);

                CMF.utils.preloadImages(preloadList, function(err) {

                    var id;
                    var object;

                    if (err) {
                        resetForm(err.toString());
                        return;
                    }

                    id = $cropForm.data("objectId");

                    originalObject = CMF.design.getObjectById(id);

                    CMF.design.removeObject(id, function(){
                        var image;

                        resetForm();
                        image = realignCroppedImage(response.image, originalObject, cropFormObject);

                        CMF.design.addObject(image);
                        $.magnificPopup.close();
                    });
                });
            },
            error: function(jqXHR, textStatus, errorThrown) {
                resetForm("An error occured, please try again.");
            }
        });
    }

    function realignCroppedImage(image, originalImage, cropFormObject) {
        var selection = JSON.parse(cropFormObject.selection);
        var cropThumbnailWidth  = cropFormObject.width;
        var cropThumbnailHeight = cropFormObject.height;

        var relWidth = selection.w / cropThumbnailWidth;
        var relHeight = selection.h / cropThumbnailHeight;

        var originalCenterCoordinates = getCenterCoordinate(
            originalImage.width,
            originalImage.height,
            originalImage.left,
            originalImage.top
        );

        image.angle = originalImage.angle;
        image.width = originalImage.width * relWidth;
        image.height = originalImage.height * relHeight;

        image.left = originalCenterCoordinates.left - (image.width / 2);
        image.top = originalCenterCoordinates.top - (image.height / 2);

        return image;
    }

    function getCenterCoordinate(width, height, left, top) {
        var verticalCenter = height / 2;
        var horizontalCenter = width / 2;

        return {
            left: horizontalCenter + left,
            top: verticalCenter + top
        }
    }

    function toggleGalleryImageSelection() {

       var image = $(this);
       var inputId = "galleryImageInput-"+image.attr('data-id');

       if (image.hasClass("selected")) {   // deselect image
           image.removeClass("selected");
           $("#"+inputId).remove();
       } else {       // select image
           image.addClass("selected");
           $("<input />", {
               id: inputId,
               type: "hidden",
               name: "galleryImages[]",
               value: image.attr("src")
           }).appendTo("#clipArtSelectionForm");
       }
    }

    function disableImagesSelectionForm ()
    {
        var dialog = getOpenDialog();
        var form = dialog.find('form').eq(0);

        form.find("button, [type='file']").prop("disabled", true);
        showLoader();
    }

    function resetImagesSelectionForm (err)
    {
        var dialog = getOpenDialog();
        var form = dialog.find('form').eq(0);

        form.find("button, [type='file']").prop("disabled", false);
        form[0].reset();
        clearGallerySelection();    // applicable only to clip art form
        hideLoader();

        if (err) {
            showError(err);
        }
    }

    function processImagesSelectionResponse (data)
    {
        var preloadList = [];

        if (data.error) {
            resetImagesSelectionForm(data.error);
            return;
        }

        data.images.forEach(function(image){
            preloadList.push(image.url);
        });

        CMF.utils.preloadMultipleImages(preloadList, function(requests) {
            var errors = [];

            requests.forEach(function(request){
                if (request.error) {
                    errors.push(request.src);
                }
            });

            data.images.forEach(function(image){
                // Make sure that the variants for the current image were
                // not among the ones that produced errors on pre-loading
                if (errors.indexOf(image.url) == -1) {
                    CMF.design.addObject(image);
                }
            });

            resetImagesSelectionForm();
            $.magnificPopup.close();
        });
    }

    function addClipArtToDesign (event)
    {
        event.preventDefault();

        $(this).asyncFileUpload({
            afterSubmit: disableImagesSelectionForm,
            success: processImagesSelectionResponse,
            error: resetImagesSelectionForm
        });

        return false;
    }

    function handleFileUpload (event)
    {
        var imgHaveCopyright = $(".tpr-upl-copyright-notice input")[0].checked;

        event.preventDefault();

        if (imgHaveCopyright) {
            $(this).asyncFileUpload({
                afterSubmit: disableImagesSelectionForm,
                success: processImagesSelectionResponse,
                error: resetImagesSelectionForm
            });
        }

        return false;
    }


    /**
     * Opens the image cropping tool within a lightbox
     * @param  {Number} id  The ID of the design object being cropped
     */
    function crop(id) {

        $cropForm.data("objectId", id);

        $.magnificPopup.open({
            items: {
                src: "#tpr-crop-image-dialog",
                type: "inline"
            },
            type: "inline",
            overflowY: "scroll",
            closeOnBgClick: true,      // prevents closing the lightbox when the background is clicked
            callbacks: {
                open: setUpJcropPlugin
            }
        });
    }


    /**
     * Opens a colorbox for preview a design
     * @param {String} url The URL to the image being previewed
     */
    function preview(url, shortUrl, options) {
        var templateSelector = '#tpr-designPreviewDialog';
        if (typeof options !== 'undefined' && typeof options.templateSelector !== 'undefined') {
            templateSelector = options.templateSelector;
        }

        if (!shortUrl) {
            shortUrl = url;
        }

        $.magnificPopup.open({
            items: {
                src: templateSelector,
                type: "inline"
            },
            type: "inline",
            overflowY: "scroll",
            closeOnBgClick: true,      // prevents closing the lightbox when the background is clicked
            callbacks: {
                open: function() {
                    $(".tpr-designPreview").attr('src', url);

                    window.setTimeout(function(){
                        $designPreviewUrlInput.val(url).trigger('select');
                    }, 100);
                }
            }
        });
    }


    /**
     * Initializes the add|edit text dialog specifically for adding a new object
     */
    function initTextAddDialog() {
        var defaults = getTextFormattingDefaults();
        var heading = $textObjectDialog.find('h2');

        $textObjectDialog.attr("data-role","add");
        heading.html(heading.data('addtextlabel'));

        initTextObjectDialog(defaults, '');
    }


    /**
     * Initializes the add|edit text dialog specifically for editing an existing object
     * @param  {Number} id Target object ID
     */
    function initTextEditDialog(id) {
        var object = CMF.design.getObjectById(id);
        var styling = object.getTextStylingData();
        var heading = $textObjectDialog.find('h2');

        heading.html(heading.data('edittextlabel'));
        $textObjectDialog.attr("data-role","edit");
        $textObjectDialog.find("[type='submit']").attr("data-objectid", id);

        initTextObjectDialog(styling, object.text);
    }


    function setTextFormatOptionsValues (options)
    {
        var $formatOptions = $(".tpr-text-format-option");

        if (!options) {
            return;
        }

        $formatOptions.find("[data-value]").removeClass("tpr-selected");
        $formatOptions.each(function() {
            var $option = $(this);
            var key = $option.data("key");
            var $item = $option.find("[data-value='"+ options[key] +"']");

            $item.addClass("tpr-selected");

            //
            if ($option.hasClass("tpr-menu")) {
                $option.find(".tpr-menu__head").html(options[key]);
            }
        });
    }


    /**
     * Initializes the text add|edit dialog when it is opened, by adjusting the state of the text formatting controls within it.
     * @param  {Object} css  Text formatting data
     * @param  {String} text
     */
    function initTextObjectDialog(styling, text)
    {
        setTextFormatOptionsValues(styling);
        setTextObjectPreview(styling, text);
        $textObjectDialog.find("textarea").val(text);
        setColorPickerInitialColor(styling.color);
        setAdvanceCurvature(styling);
    }


    /**
     * Applies styling and text to the text object preview element within the add/edit text dialogs.
     */
    function setTextObjectPreview(styling, text) {
        var textObjectPreview = $(".textObjectPreview");

        if (styling) {
            textObjectPreview.css(styling);
        }

        if (typeof text === 'string') {
            textObjectPreview.html(text);
        }
    }


    /**
     * Returns the trimmed text that was input for a text object
     * @return {String|Null}
     */
    function getTextObjectText() {
        var $textarea = $("#textObjectDialog").find("textarea");
        var text = $.trim($textarea.val());

        if (!text) {
            alert("No text was input!");
            $textarea.trigger("focus");
            return;
        }

        return text;
    }


    /**
     * Reads in values of the text formatting controls from the text object dialog.
     * @return {Object}
     */
    function getTextObjectFormatting()
    {
        var data = getTextFormattingDefaults();
        var $formattingOptions = $(".tpr-text-format-option");

        $formattingOptions.each(function() {
            var $elem = $(this);
            var key = $elem.data("key");
            var $selected = $elem.find(".tpr-selected");

            if ($selected.length) {
                if (!$elem.hasClass('disabled')) {
                    data[key] = $selected.data("value");
                }
            } else {
                data[key] = getDefaultTextOptionValue(key);
            }
        });

        return data;
    }


    function getQrObjectText() {
        var $textarea = $("#videoSelectionForm").find("textarea");
        var text = $.trim($textarea.val());

        if (!text) {
            alert("No text was input!");
            $textarea.trigger("focus");
            return;
        }

        return text;
    }


    /**
     * Returns a reference to the dalog (lightbox) that is currently opened.
     */
    function getOpenDialog() {
        var dialog;

        $(".lightbox").each(function(){
            var $this = $(this);
            if ($this.css("display") !== "none") {
                dialog = $this;
            }
        });

        return dialog;
    }


    /**
     * Display the loader within the dialog that is currently opened
     */
    function showLoader() {
        var dialog = getOpenDialog();
        var loader;

        if (dialog) {
            loader = dialog.find(".loader");
            if (loader) {
                loader.fadeIn(200).css("display","inline-block");
            }
        }
    }


    /**
     * Display the loader within the dialog that is currently opened
     */
    function hideLoader() {
        var dialog = getOpenDialog();
        var loader;

        if (dialog) {
            loader = dialog.find(".loader");
            if (loader) {
                loader.fadeOut(200);
            }
        }
    }


    /**
     * Display an error message within the open dialog
     */
    function showError(message) {
        var dialog = getOpenDialog();
        var error;
        var duration = 3000;    // the time that the error message will be visible

        if (dialog) {
            error = dialog.find(".error");
            if (error) {
                error.html(message);
                error.fadeIn(200, function(){
                    setTimeout(function(){
                        error.fadeOut(200);
                    }, duration);
                });
            }
        }
    }


    /**
     * Un-select the selected images in the gallery list
     */
    function clearGallerySelection() {
       var $form = $("#clipArtSelectionForm");
       $form.find("img").removeClass("selected");
       $form.find("input[type=hidden]").remove();
    }

    /**
     * Initialize color picker button background color
     * @param value
     */
    function setColorPickerInitialColor(value) {
        $colorBtn.css('background-color', value);
        $colorBtn.attr('data-value', value);
        $colorBtn.data('value', value);
    }

    /**
     * Initialize value of advance curvature fields based on `styling` data
     * @param styling
     */
    function setAdvanceCurvature(styling) {
        var curvature, advanceCurvatureDir, simpleCurvatureValue = [];

        $('.advance-curvature-value', $tpr).val(styling['text-curvature']).data('value', styling['text-curvature']);

        curvature = $textObjectDialog.find('.tpr-text-format-option[data-key="text-curvature"]:not(.advance-curvature)');

        if (curvature.length > 0) {
            $('[data-value]', curvature).each(function () {
                simpleCurvatureValue.push($(this).attr('data-value'));
            });

            if ($.inArray(styling['text-curvature'].toString(), simpleCurvatureValue) === -1) {
                useAdvanceCurvature();
            } else {
                unUseAdvanceCurvature();
            }
        }

        advanceCurvatureDir = $('.advance-curvature-direction', $tpr);

        if (styling['text-curvature'] > 0) {
            advanceCurvatureDir.removeClass('arc-down');
            advanceCurvatureDir.removeClass('arc-straight');
            advanceCurvatureDir.addClass('arc-up');
        } else if (styling['text-curvature'] < 0) {
            advanceCurvatureDir.removeClass('arc-up');
            advanceCurvatureDir.removeClass('arc-straight');
            advanceCurvatureDir.addClass('arc-down');
        } else {
            advanceCurvatureDir.removeClass('arc-up');
            advanceCurvatureDir.removeClass('arc-down');
            advanceCurvatureDir.addClass('arc-straight');
        }
    }

    /**
     * Show advance curvature fields and hide simple curvature fields in text editor dialog
     */
    function useAdvanceCurvature() {
        var $advanceCurvature = $('.advance-curvature', $tpr);
        var $simpleCurvature = $('.simple-curvature', $tpr);

        $advanceCurvature.css('display', 'block');
        $advanceCurvature.removeClass('disabled');

        $simpleCurvature.addClass('disabled');
        $simpleCurvature.css('display', 'none');
    }

    /**
     * Hide advance curvature fields and show simple curvature fields in text editor dialog
     */
    function unUseAdvanceCurvature() {
        var $advanceCurvature = $('.advance-curvature', $tpr);
        var $simpleCurvature = $('.simple-curvature', $tpr);

        $advanceCurvature.css('display', 'none');
        $advanceCurvature.addClass('disabled');

        $simpleCurvature.removeClass('disabled');
        $simpleCurvature.css('display', 'block');
    }

    return {
        buildCache: buildCache,
        attachEventHandlers: attachEventHandlers,
        initTextAddDialog: initTextAddDialog,
        initTextEditDialog: initTextEditDialog,
        getTextObjectFormatting: getTextObjectFormatting,
        getTextObjectText: getTextObjectText,
        getQrObjectText: getQrObjectText,
        showLoader: showLoader,
        hideLoader: hideLoader,
        showError: showError,
        crop: crop,
        preview: preview
    };

})(jQuery);
