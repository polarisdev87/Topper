var CMF = CMF || {};

CMF.utilsa = (function($, undefined){

    /**
     * Swaps the state of a pre-made design, from 'public' cu 'private' or vice-versa
     * @param  {String}   designId The public ID of the selected design
     * @param  {Function} callback Function to execute after the request has been sent
     */
    function swapPremadeDesignState(designId, callback) {

        var data = {
            'host': window.location.hostname,
            'protocol': window.location.protocol
        };

        $.ajax({
            url: 'swapstatus/'+designId,
            type: 'POST',
            data: data,
            error: function() {
                alert('There was an error updating the status of the design. Please reload the page and try again. If the problem persists, please email us the details of the issue you\'re having.');
            }
        });

        if (typeof callback === "function") {
            callback();
        }
    }


    /**
     * Submits a request to the server for the deletion of the selected design
     * @param  {String}   designId The public ID of the selected design
     * @param  {Function} callback Function to execute after the request has been sent
     */
    function deletePremadeDesign(designId, callback) {

        var data = {
            'host': window.location.hostname,
            'protocol': window.location.protocol
        };

        $.ajax({
            url: 'delete/'+designId,
            type: 'POST',
            data: data,
            error: function() {
                alert('There was an error deleting the design. Please reload the page and try again. If the problem persists, please email us the details of the issue you\'re having.');
            }
        });

        if (typeof callback === "function") {
            callback();
        }
    }


    return {
        swapPremadeDesignState: swapPremadeDesignState,
        deletePremadeDesign: deletePremadeDesign
    };
})(jQuery);