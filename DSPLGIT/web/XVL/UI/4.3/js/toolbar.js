Toolbar = function(params) {
	'use strict';
	var self = this;
	this.controller = null;
	this.opeMode;
	this.player;
	this.operation = false;
	this.direction = false;
	this.homeState = [];
	this.initCamera = {};
	this.initPosition = [];	
	this.loadingModel = false;
	this.resetVisibility = [];
	this.isUpdateProcessForAnime = false;
	this.selectSnapMode = false;

	this.measureHitElementCnt = 0;
	this.control = 'init';
	this.measureCurrentSelectType = null;
	this.measureCurrentSelectTypeSub = null;
	this.measureMove = null;
	this.measureSettingProjectionMethodValue;
	this.measureSettingReferenceCoordinateSystem;
	this.measureSettingBackgroundColor;
	this.measureSettingFrame;
	
	if (params === undefined) {
		throw new Error('ltError: Required argument. method=Toolbar, argument=params');
	} else {
		Object.keys(params).forEach(function(key) {
			self[key] = params[key];
		});
	}

	this.update = function(params) {
		if (params.selfObj === this) {
			return;
		}

		var doms = Ext.ComponentQuery.query('window[name^=toolbar]');
		var controller = null;
		if (doms.length > 0) {
			controller = doms[0].getController();
		}
		
		switch (params.updateType) {
		case 'SELECT_WORK':
			if (this.isUpdateProcessForAnime) {
				this.isUpdateProcessForAnime = false;
				player.controlProcessAnimation("play");
			}
			if (!Ext.isEmpty(controller)) {
				controller.updateEnableToolbar();	
			}
			break;
		case 'GENERATE_PROFILE':
		case 'DELETE_PROFILE':
			self.updateProfileSubMenu();
			break;
		case 'SELECT_PROC':
		case 'APPLY_SNAPSHOT':
			if (!Ext.isEmpty(controller)) {
				controller.updateEnableToolbar();	
				controller.updateWireShadingButton();
			}
			break;
		case 'PROC_ANIM_END':
		case 'COMPLETED_PROFILE':
		case 'CANCEL_EDIT_PROFILE':
		case 'ERROR_PROFILE':
		case 'COMPLETED_MEASURE':
		case 'ERROR_MEASURE':
		case 'DIMENSION_DRAG_END':
			if (!Ext.isEmpty(controller)) {
				controller.reSelectedToolbar();
				controller.updateEnableToolbar();
			}
			break;
		case 'CANCEL_MEASURE':
			if (!Ext.isEmpty(controller)) {
				controller.cancelMeasure();
				controller.reSelectedToolbar();
				controller.updateEnableToolbar();
			}
			break;
		case 'INCONSISTENT_DATA':
		case 'SERVER_ERROR':
			if (!Ext.isEmpty(controller)) {
				controller.endMeasureDisplaySettings();
				controller.reSelectedToolbar();
				controller.updateEnableToolbar();
			}
			break;
		}
	};

	this.registController = function(controller) {
		this.controller = controller;
	};

	function setViewGazingPointModeEnd() {
		self.player.view.setOperationMode(self.opeMode);
		
		var buttons = Ext.ComponentQuery.query('button[name~=view_target]');
		Ext.each(buttons, function(button) {
			button.removeCls('x-btn-pressed');
			button.removeCls('x-btn-focus');
		});
		
		var name = self.opeMode.subMode;
		if (name == 'rangeSelection') {
			name = 'range_select';
		}
		var buttons = Ext.ComponentQuery.query('button[name~='+ name +']');
		Ext.each(buttons, function(button) {
			button.addCls('x-btn-pressed');
		});		
	}

	this.updateProfileSubMenu = function() {
		
		var queryStr = 'button[name~=list_crosssection]';
		var buttons = Ext.ComponentQuery.query(queryStr);		
		if (Ext.isEmpty(buttons)){
			return;
		}
		Ext.each(buttons, function(button) {
			var menu = button.getMenu();
			if (Ext.isEmpty(menu)){
				return;
			}
			menu.removeAll();
			for (var cnt = 0; cnt < player.model.numberOfProfiles; cnt++) {
				var profParam = player.model.getProfile(cnt);
				menu.add([{
					text: profParam.group.userId,
					profindex: cnt,
					action: 'list_crosssection',
					listeners: {
						click: 'list_crosssection'
					}
				}]);
			}
		});
	}
	
	this.setSelectSnapModeEnd = function() {
		var buttons = Ext.ComponentQuery.query('button[name~=select_snap]');
		Ext.each(buttons, function(button) {
			button.removeCls('x-btn-pressed');
			button.removeCls('x-btn-focus');
		});
	}

	this.setSelectSnapInfo = function () {
		selectSnapObject.snapshot = [];
		selectSnapObject.pmis = [];
		selectSnapObject.groups = [];
		var key = 'SnapshotLinkID';
		var type = 'text';
		var snapshotIds = [];
		if (!Ext.isEmpty(Object.keys(snapshotObjects)) && !Ext.isEmpty(Object.keys(snapshotPropSections))) {
			var id = '';
			if (!Ext.isEmpty(snapshotPropSections.XVL_SnapshotLink)) { 
				Ext.each(snapshotPropSections.XVL_SnapshotLink, function (prop) {
					if (prop.type === type && prop.key === key) {
						id = prop.id;
						return true;
					}
				});
			}
			Ext.each(Object.keys(snapshotObjects), function (key) {
				if (Ext.isEmpty(snapshotObjects[key]) && Ext.isEmpty(snapshotObjects[key].attribute)) {
					return;
				}
				Ext.each(snapshotObjects[key].attribute, function (property) {
					if (property.ref == id) {
						snapshotIds[property.text] = snapshotObjects[key].snapID;
						return true;
					}
				});
			});
		}
		if (!Ext.isEmpty(Object.keys(snapshotIds)) && !Ext.isEmpty(Object.keys(assemblyObjects)) && !Ext.isEmpty(Object.keys(assemblyPropSections))) {
			var id = '';
			if (!Ext.isEmpty(assemblyPropSections.XVL_SnapshotLink)) { 
				Ext.each(assemblyPropSections.XVL_SnapshotLink, function (prop) {
					if (prop.type === type && prop.key === key) {
						id = prop.id;
						return true;
					}
				});
			}
			Ext.each(Object.keys(assemblyObjects), function (key) {
				if (Ext.isEmpty(assemblyObjects[key]) && Ext.isEmpty(assemblyObjects[key].attribute)) {
					return;
				}
				Ext.each(assemblyObjects[key].attribute, function (property) {
					if (property.ref == id) {
						var group = player.model.player.model.getGroupByElementId(assemblyObjects[key].elementId);
						selectSnapObject.groups.push(group);
						selectSnapObject.snapshot[group.elementId] = snapshotIds[property.text];
						return true;
					}
				});
			});
		}
		if (!Ext.isEmpty(Object.keys(snapshotIds)) && !Ext.isEmpty(Object.keys(noteObjects)) && !Ext.isEmpty(Object.keys(notePropSections))) {
			var id = '';
			if (!Ext.isEmpty(notePropSections.XVL_SnapshotLink)) { 
				Ext.each(notePropSections.XVL_SnapshotLink, function (prop) {
					if (prop.type === type && prop.key === key) {
						id = prop.id;
						return true;
					}
				});
			}
			Ext.each(Object.keys(noteObjects), function (key) {
				if (Ext.isEmpty(noteObjects[key]) && Ext.isEmpty(noteObjects[key].attribute)) {
					return;
				}
				Ext.each(noteObjects[key].attribute, function (property) {
					if (property.ref == id) {
						var pmi = player.model.player.model.getPMIByName(noteObjects[key].name);
						selectSnapObject.pmis.push(pmi);
						selectSnapObject.snapshot[pmi.group.elementId] = snapshotIds[property.text];
						return true;
					}
				});
			});
		}
	}
	
	this.isMovingMeasureNotCreate = function() {
		return !Ext.isEmpty(self.measureMove);
	};
	
	if (this.player) {
		this.player.addEventListener('ltViewGazingPoint', setViewGazingPointModeEnd);
	}
	
	this.initMeasureSetting = function() {
		switch (playerParam.main.execMeasurementProjection) {
		case 'none':
			self.measureSettingProjectionMethodValue = 0;
			break;
		case 'x_axis':
			self.measureSettingProjectionMethodValue = 1;
			break;
		case 'y_axis':
			self.measureSettingProjectionMethodValue = 2;
			break;
		case 'z_axis':
			self.measureSettingProjectionMethodValue = 3;
			break;
		case 'xy_plane':
			self.measureSettingProjectionMethodValue = 4;
			break;
		case 'yz_plane':
			self.measureSettingProjectionMethodValue = 5;
			break;
		case 'zx_plane':
			self.measureSettingProjectionMethodValue = 6;
			break;
		}
		switch (playerParam.main.execMeasurementCoord) {
		case 'world':
			self.measureSettingReferenceCoordinateSystem = 0;
			break;
		case 'part':
			self.measureSettingReferenceCoordinateSystem = 1;
			break;
		}
		switch (playerParam.main.generateDimensionFrame) {
		case 'none':
			self.measureSettingFrame = 0;
			break;
		case 'rectangle':
			self.measureSettingFrame = 1;
			break;
		case 'circle':
			self.measureSettingFrame = 2;
			break;
		}
		if (playerParam.main.generateDimensionBackgroundColor != null && playerParam.main.generateDimensionBackgroundColor != 'none') {
			var color = Ext.util.Color.fromString(playerParam.main.generateDimensionBackgroundColor);
			self.measureSettingBackgroundColor = color.toHex();
			self.measureSettingBackgroundColor = self.measureSettingBackgroundColor.replace('#', '');
		}
	}

};