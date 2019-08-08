import $ from 'jquery';

// @todo cleaner implementation

export default function PopUpModal () {

    initialize();

    function initialize() {
        $('.modal-open .icon-close').on('click', function() {
            $(this).closest('.modal-open').hide();
        });
    }

    return {};
}
