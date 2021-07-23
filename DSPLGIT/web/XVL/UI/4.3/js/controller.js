Controller = function() {
	'use strict';
	var self = this;
	this.isUpdate = false;
	this.objects = [];

	this.notify = function(params, ignore) {
		if (this.isUpdate && !ignore) {
			return;
		}
		this.isUpdate = true;
		Ext.each(this.objects, function(obj) {
			if (obj) {
				obj.update(params);
			}
		});
		this.isUpdate = false;
	};

	this.regist = function(obj) {
		this.objects.push(obj);
	};
};