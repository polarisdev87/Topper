(function(){
    CMF.config.getInstanceData(function(error){
        if (error) {
            console.log(error);
            return;
        }

        CMF.dashboard.load(function(){
            CMF.dashboard.init(function(){
                CMF.dashboard.attachEventHandlers();
                CMF.lightbox.attachEventHandlers();
                CMF.order.attachEventHandlers();
                CMF.order.setCost();
                CMF.dashboard.loadCfgData();
                CMF.dashboard.activate(function(){
                    CMF.design.initAutosave();
                });
            });
        });
    });
})();