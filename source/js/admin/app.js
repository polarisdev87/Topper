(function(){
    CMF.config.getInstanceData(function(error) {
        if (error) {
            console.log(error);
            return;
        }

        CMF.dashboard.load(function(){
            CMF.dashboard.init(function(){
                CMF.dashboard.attachEventHandlers();
                CMF.lightbox.attachEventHandlers();
                CMF.dashboard.activate();
            });
        });
    });
})();