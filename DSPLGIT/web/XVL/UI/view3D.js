//
// View3D
//
View3D = function (parameters) {

	'use strict';
    
    var self = this;
    
    this.player = parameters.player;
    
    this.controller = null;
    
	function $elem(id) {
		return document.getElementById(id);
	}    

    this.update = function (parameters) {

        var group,
            groups;
        
        if (parameters.selfObj !== undefined && parameters.selfObj === this) {
            return;
        }       
        
        switch (parameters.updateType) {
            case "SELECT_ON":
                self.player.model.clearSelection();

                parameters.updateTagetElems.forEach(function(elem) {
                    group = self.player.model.getGroupByUniqueId(elem);
                    if ( group && group !== undefined ) {
                       self.player.model.addSelection(group);
                    }                    
                });
                
                groups =  self.player.model.getSelections();

                if (self.player.model.fitSelection) {
                    self.player.view.fit(groups);
                }
                
                break;
            case "SELECT_OFF":
                groups =  self.player.model.getSelections();

                self.player.model.clearSelection();

                groups.forEach(function(grp) {
                    if ( grp && grp !== undefined ) {
                        parameters.updateTagetElems.forEach(function(sel_off_id) {
                            if (grp.uniqueId !== sel_off_id) {
                                self.player.model.addSelection(grp);
                            }
                        });
                    }                    
                });

                if (self.player.model.fitSelection) {
                    self.player.view.fit(self.player.model.getSelections());
                }

                break;
            case "SELECT_CLEAR":
                self.player.model.clearSelection();

                if (self.player.model.fitSelection) {
                    self.player.view.fit(self.player.model.getSelections());
                }
                
                break;
            case "VISIBILITY_ON_ONLY":
                groups = self.player.model.getGroupsByUniqueIds(parameters.updateTagetElems);
                groups.forEach(function(grp) {
                    grp.visibility = true;
                });                
                break;
            case "VISIBILITY_OFF_ONLY":
                groups = self.player.model.getGroupsByUniqueIds(parameters.updateTagetElems);
                groups.forEach(function(grp) {
                    grp.visibility = false;
                });                
                break;
            default:
                break;
        }   
    }    
    
    this.registController = function (controller) {
        this.controller = controller;
    }   
    
	function onSelectChange(event) {
        
		'use strict';

		var parameters = [],
            property = [],
            groups;
        
		parameters.updateTagetElems = [];

		if (!event || event === undefined || event.selectedGroups === undefined) {
			return;
		}

		if (event.selectedGroups.length > 0) {
            
            event.selectedGroups.forEach( function(grpId) {
                parameters.updateTagetElems.push(String(grpId));
            });                
            
            groups = self.player.model.getSelections();
			groups.forEach( function(grp) {
				parameters.updateTagetElems.push(String(grp.userId));
	        });
			
			parameters.selfObj = self;
			parameters.updateType = "SELECT_ON";

			self.controller.notify(parameters);  
		} else {
			parameters.selfObj = self;
			parameters.updateType = "SELECT_CLEAR";

			self.controller.notify(parameters);
	    }
	}    

    self.player.addEventListener('ltSelectChange', onSelectChange); 
};
