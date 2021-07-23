Search = function(params) {
	'use strict';
	var self = this;
	this.controller = null;
	this.player;
	this.mainGrid;
	this.grid;
	this.isDispComponent = params.isDispComponent;
	this.requiredJsonUrls = [ assemblycacheurl ];
	this.promiseReady = null;
	this.isDisplayedResult = false;

	var options = {
		syncColumnCellResize: true,
		forceFitColumns: true
	};

	this.update = function(params) {
		if (!self.isDispComponent) {
			return;
		}
		if (params.selfObj === self) {
			return;
		}
		
		var doms = Ext.ComponentQuery.query('grid[name=search]');
		if (Ext.isEmpty(doms)) {
			return;
		}
		Ext.each(doms, function(dom) {
			
			const notKeepExisting = false;
			const suppressEvent = true;
			
			var controller = dom.getController();
			switch (params.updateType) {
			case 'SELECT_ON':
			case 'SELECT_OFF':
				var selGroups = player.model.getSelections();
				controller.selectByGroups(selGroups, notKeepExisting, suppressEvent);
				break;
			case 'SELECT_CLEAR':
				var selModel = dom.getSelectionModel();
				selModel.deselectAll(suppressEvent);
				break;
			case 'BEGIN_EDIT_PROFILE':
			case 'END_EDIT_PROFILE':
			case 'CANCEL_EDIT_PROFILE':
			case 'CLEAR_PROFILE':
			case 'COMPLETED_PROFILE':
			case 'ERROR_PROFILE':
			case 'STARTED_MEASURE':
			case 'COMPLETED_MEASURE':
			case 'ERROR_MEASURE':
			case 'CANCEL_MEASURE':
			case 'DIMENSION_DRAG_END':
			case 'INCONSISTENT_DATA':
			case 'SERVER_ERROR':
				controller.updateEnable();
				break;
			}
		});
	};
	
	this.create = function() {
		if (!self.isDispComponent) {
			return;
		}
		
		self.promiseReady = metaJsonLoaded[assemblycacheurl].then(function() {
			
			var doms = Ext.ComponentQuery.query('search[name=search]');
			if (Ext.isEmpty(doms)) {
				return;
			}
			Ext.each(doms, function(dom) {
				dom.reconfigure(self.createColumns());
			});
		});
	};
	
	this.createColumns = function() {
		var columns = [];
		if (Ext.isEmpty(searchParam) || Ext.isEmpty(searchParam.columns)) {
			return [];
		}
		Ext.each(searchParam.columns, function(column) {
			columns.push({
				text: column.title,
				dataIndex: searchParam.columnTextPrefix + column.index,
				width: column.width
			});
		});
		return columns;
	};

	this.registController = function(controller) {
		this.controller = controller;
	};
	
	this.convertSelUnit = function(elementId) {
		if (!self.isDispComponent) {
			return null;
		}
		var minResult = {
				gap: Number.MAX_VALUE,
				hitElementId: null
		}
		var doms = Ext.ComponentQuery.query('grid[name=search]');
		Ext.each(doms, function(dom) {
			var controller = dom.getController();
			var result = controller.convertSelUnit(elementId);
			if (result.gap < minResult.gap) {
				minResult = result;
			}
		});
		return minResult.hitElementId;
	};

	this.searchExec = function(suppressNotify) {
		if (!self.isDispComponent) {
			return;
		}
		self.isDisplayedResult = true;
		var doms = Ext.ComponentQuery.query('grid[name=search]');
		Ext.each(doms, function(dom) {
			var controller = dom.getController();
			controller.searchExe(suppressNotify);
		});
	};

	this.searchClear = function(suppressNotify) {
		if (!self.isDispComponent) {
			return;
		}
		self.isDisplayedResult = false;
		var doms = Ext.ComponentQuery.query('grid[name=search]');
		Ext.each(doms, function(dom) {
			var controller = dom.getController();
			controller.searchClear(suppressNotify);
		});
	};
};

