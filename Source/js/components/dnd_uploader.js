import $ from 'jquery';
import mustache from 'mustache';
import cache from '../cache';

export default function DnDUploader () {
    const $scrollSidebar = cache.get('$scrollSidebar'),
        $photoPanel = $scrollSidebar.find('.sidebar-photo-component').eq(0),
        maxFileSize = 10 * 1024 * 1024,
        totalMaxFileSize = 50 * 1024 * 1024;

    let $form,
        $input,
        $gallery,
        validationError,
        droppedFiles = [],
        done = [];

    function initialize () {
        $form = $photoPanel.find('.drag-and-drop-area').eq(0);
        $input = $form.find('input[type="file"]').eq(0);
        $gallery = $photoPanel.find('.uploaded-photos').eq(0);

        if($gallery.children().length == 0) {
            $photoPanel.find(".uploaded-photos-title").eq(0).hide();
        }

        bindEvents();
    }

    /**
     * Bind events when user click or drag images into dropzone area
     */
    function bindEvents () {
        let $dragEnteredElements = $();

        $form
            // Prevent browser's default action and stop the event for bubling up to parents nodes.
            .on('drag dragstart dragend dragover dragenter dragleave drop', event => {
                event.preventDefault();
                event.stopPropagation();
            })
            // Add class dragover and store the entered element into array for further action (on the purpose of stop flickering)
            .on('dragenter', event => {
                if (!$(event.currentTarget).hasClass('uploading')) {
                    $dragEnteredElements = $dragEnteredElements.add(event.target);
                    $form.addClass('dragover');
                }
            })
            .on('dragleave', event => {
                $dragEnteredElements = $($dragEnteredElements).not(event.target);
                if ($dragEnteredElements.length === 0) {
                    $form.removeClass('dragover');
                }
            })
            .on('dragover', event => {
                if ($(event.currentTarget).hasClass('uploading')) {
                    event.originalEvent.dataTransfer.dropEffect = 'copy';
                }
                else {
                    $form.addClass('dragover');
                }
            })
            .on('dragend drop', () => {
                $form.removeClass('dragover');
            })
            .on('drop', event => {
                if (!$form.hasClass('uploading')) {
                    droppedFiles = [...event.originalEvent.dataTransfer.files];
                    $form.trigger('submit');
                }
            });

        $input.on('change', e => {
            if (!$form.hasClass('uploading')) {
                droppedFiles = [...e.target.files];
                $form.trigger('submit');
            }
        });

        $form.on('submit', e => {
            e.preventDefault();

            if ($form.hasClass('uploading')) {
                return false;
            }
            $form.addClass('uploading');
            $input.prop('disable', true);

            if (droppedFiles.length >= 1 && validatesFiles(droppedFiles)) {
                droppedFiles.forEach(uploadFile);
            }
            else if (droppedFiles.length >= 1) {
                $form.removeClass('uploading');

                // @todo find better way
                //mediator.broadcast('PopUpModal', { message: validationError });
                $('#defaultModal .modal-body').html('<p>' + validationError + '</p>');
                $('#defaultModal').parent().show();
            }
            else {
                $form.removeClass('uploading');
            }
        });
    }

    function uploadFile (file) {
        let formData = new FormData();
        let $galleryItem = addGalleryItem();

        formData.append($input.attr('name'), file);

        $.ajax({
            url: $form.attr('action'),
            type: $form.attr('method'),
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            xhr: () => {
                let xhr = new window.XMLHttpRequest();

                xhr.upload.addEventListener('progress', e => {
                    if (e.lengthComputable) {
                        updateProgress($galleryItem, (e.loaded * 100.0 / e.total) || 100);
                    }
                }, false);

                return xhr;
            },
            complete: () => {
                checkIfDone();
                setTimeout(removeProgressBar, 500, $galleryItem);
            },
            success: () => {
                previewFile(file, $galleryItem);
            },
            error: () => {
                $galleryItem.remove();
                if($gallery.children().length == 0)
                    $photoPanel.find(".uploaded-photos-title").eq(0).hide();
            },
        });
    }

    function updateProgress ($galleryItem, percent) {
        $galleryItem.find('.progress-bar').css('width', percent + '%').attr('aria-valuenow', percent);
    }

    function removeProgressBar ($galleryItem) {
        $galleryItem.find('.progress').remove();
    }

    function addGalleryItem () {
        let $galleryItem;
        let template = $scrollSidebar.find('#uploaded-photo-item-template').html();

        $photoPanel.find(".uploaded-photos-title").eq(0).show();
        mustache.parse(template);
        $galleryItem = $(mustache.render(template));
        $gallery.append($galleryItem);

        return $galleryItem;
    }

    function checkIfDone () {
        done.push(1);
        if (droppedFiles.length === done.length) {
            $form.find('input').prop('disable', false);
            $form.removeClass('uploading');
            done = [];
        }
    }

    function previewFile (file, $galleryItem) {
        let reader = new FileReader();
        reader.onload = () => $galleryItem.find('img').eq(0).attr('src', reader.result);
        reader.readAsDataURL(file);
    }

    function validatesFiles (files) {
        let totalSize = 0;
        let result = true;

        for (let file of files) {
            if (!hasValidExtension(file.name)) {
                validationError = 'Invalid file extension';
                result = false;
                break;
            }

            totalSize += file.size;

            if (file.size > maxFileSize) {
                validationError = 'File size is too large';
                result = false;
                break;
            }
        }

        if (totalSize > totalMaxFileSize) {
            validationError = 'Total size of files too large';
            result = false;
        }

        return result;
    }

    function hasValidExtension (fileName) {
        let extensions = ['.jpg', '.gif', '.png', '.jpeg'];
        return (new RegExp('(' + extensions.join('|').replace(/\./g, '\\.') + ')$', 'i')).test(fileName);
    }

    initialize();

    return {};
}
