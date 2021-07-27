//
// Controller
//
Controller = function () {

	'use strict';
    
    var self = this;
    
    this.isUpdate = false;
    this.objList = [];
    
    this.notify = function (parameters) {
        
        if (this.isUpdate) {
            return;            
        }
        this.isUpdate = true;
        
        this.objList.forEach(function(obj) {
            if (obj) {
                obj.update(parameters);
            }
        });        
        
        this.isUpdate = false;
    }
    
    this.registController = function (obj) {
        this.objList.push(obj);
    }
};
