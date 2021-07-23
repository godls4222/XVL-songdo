ProcessList = function(params) {
	'use strict';
	var self = this;
	this.controller = null;
	this.player;
	this.isDispComponent = false;

	this.requiredJsonUrls = [ processcacheurl ];

	if (params === undefined) {
		throw new Error('ltError: Required argument. method=ProcessList, argument=params');
	} else {
		Object.keys(params).forEach(function(key) {
			self[key] = params[key];
		});
	}

	this.dispType = params.type ? params.type : 'all';

	this.update = function(params) {
		if (!self.isDispComponent || params.selfObj === this) {
			return;
		}
		
		var dom = Ext.ComponentQuery.query('processlist[name=processlist]')[0];

		var selGrpIds = [], sels = [];
		switch (params.updateType) {
		case 'SELECT_ON':
		case 'SELECT_OFF':

			var selGrpNames = [];
			var selection = [];
			var store = dom.getStore();
			var data = store.getData();
			var groups = player.model.getSelections();
			var lastSelKey;
			var lastSelNode;
			var obj, userIdBase, grp;
			
			Ext.each(groups, function(grp) {
				obj = processObjects[grp.bomId];
				if (Ext.isEmpty(obj)) {
					return;
				}
				userIdBase = MakeFormatStringAssembly(PROP_FORMAT_BASE_NAME, obj, processPropSections, processModelAttrs);
				if (Ext.isEmpty(userIdBase)) {
					return;
				}
				selGrpNames[userIdBase] = true;
			});
			
			Ext.each(data.items, function(item) {
				if (Ext.isEmpty(item.data) || Ext.isEmpty(item.data.bomId)) {
					return;
				}				
				obj = processObjects[item.data.bomId];
				if (Ext.isEmpty(obj)) {
					return;
				}
				userIdBase = MakeFormatStringAssembly(PROP_FORMAT_BASE_NAME, obj, processPropSections, processModelAttrs);
				if (Ext.isEmpty(userIdBase)) {
					return;
				}
				if (selGrpNames[userIdBase]) {
					selection.push(item);
					if(lastSelKey == userIdBase){
						lastSelNode = item;
					}
				}
			});
			break;
		case 'SELECT_CLEAR':
			break;
		case 'SELECT_PROC':
			var store = dom.getStore();
			for (var i = 0; i < store.data.items.length; i++) {
				if (store.data.items[i].data.bomId == params.updateTagetElems) {
					dom.getSelectionModel().select(i, undefined, true);
					var node = dom.getView().getNode(i);
					if (Ext.isEmpty(node)) {
						continue;
					}
					
					var visibleBegin = dom.getView().scrollable.position.y;
					var visibleEnd = dom.getView().getHeight() + dom.getView().scrollable.position.y;
					var rowBegin = Ext.get(node).dom.offsetTop;
					var rowEnd = Ext.get(node).dom.offsetTop + Ext.get(node).dom.offsetHeight;
					var isVisibleRow = (
						visibleBegin <= rowBegin && rowEnd <= visibleEnd ||
						rowBegin <= visibleBegin && visibleEnd <= rowEnd);
					if (!isVisibleRow) {
						node.scrollIntoView();
					}
					break;
				}
			}
			if (i == store.data.items.length) {
				dom.getSelectionModel().deselectAll();
			}
			break;
		default:
			break;
		}
	}

	this.registController = function(controller) {
		this.controller = controller;
	}

	this.createProcessList = function() {
		if (!self.isDispComponent) {
			return;
		}
		
		metaJsonLoaded[processcacheurl].then(function() {

			var store = Ext.create('Ext.data.Store', {
				data: {
					items: function() {
						var val = [];
						self.getProcessListData(val, processJsonData);
						return val;
					}()
				},

				proxy: {
					type: 'memory',
					reader: {
						type: 'json',
						rootProperty: 'items'
					}
				}
			});

			var dom = Ext.ComponentQuery.query('processlist[name=processlist]')[0];
			if (dom) {
				dom.setStore(store);
				var sortNo = Number(processListParam['sort']);
				var direction = processListParam['order'];
				if (!isNaN(sortNo) && !Ext.isEmpty(direction)) {
					var idx = 0;
					Ext.each(processListParam.columns, function(column) {
						if (idx == sortNo - 1) {
							store.sort(column.name, direction.toUpperCase());
							return false;
						}
						idx++;
					});
				}					
			}
		});
	}
	
	this.recreateWorkList = function() {
		
		var store = Ext.create('Ext.data.Store', {
			data: {
				items: function() {
					var val = [];
					self.getProcessListData(val, processJsonData);
					return val;
				}()
			},

			proxy: {
				type: 'memory',
				reader: {
					type: 'json',
					rootProperty: 'items'
				}
			}
		});

		var dom = Ext.ComponentQuery.query('processlist[name=processlist]')[0];
		if (dom) {
			dom.setStore(store);
			var sortNo = Number(processListParam['sort']);
			var direction = processListParam['order'];
			if (!isNaN(sortNo) && !Ext.isEmpty(direction)) {
				var idx = 0;
				Ext.each(processListParam.columns, function(column) {
					if (idx == sortNo - 1) {
						store.sort(column.name, direction.toUpperCase());
						return false;
					}
					idx++;
				});
			}					
		}
	}

	this.getProcessListData = function(val, jsonData) {

		if (jsonData && jsonData.topProcess && jsonData.topProcess.process) {
			Ext.each(jsonData.topProcess.process, function(obj) {
				self.addProcRow(obj, val, processPropSections, processModelAttrs);
				self.setChildData(obj, val, processPropSections, processModelAttrs);		
			});			
		}
	}

	this.setChildData = function(childgroup, val, propSections, elemAttrs) {
		var self = this;
		
		Ext.each(childgroup.node, function(obj) {
			self.addProcRow(obj, val, propSections, elemAttrs);
			self.setChildData(obj, val, propSections, elemAttrs);
		});
	}

	this.addProcRow = function(obj, val, propSections, elemAttrs) {
		if (obj.procType != 'bprc' && obj.procType != 'mprc') return;
		if (self.dispType == 'leaf') {
			var hasPprc = false;
			for (var i = 0; i < obj.node.length; i++) {
				if (obj.node[i].procType == 'pprc') hasPprc = true;
			}
			if (!hasPprc) return;
		}
		var part = {};
		var userIdBase = '';
		var format = '';

		part.bomId = String(obj.bomId);
		part.userIdBase = String(obj.userIdBase);

		Ext.each(processListParam.columns, function(column) {
			var type = column.type;
			switch (type) {
			case 1:
			case 2:
				break;
			case 3:
				userIdBase = MakeFormatStringAssembly(PROP_FORMAT_BASE_NAME, obj, processPropSections, processModelAttrs);
				var grpCnt = elemCnts[userIdBase];
				part[column.name] = grpCnt;
				break;
			default:
				part[column.name] = MakeFormatStringAssembly(column.format, obj, propSections, elemAttrs);
				break;
			}
		});
		val.push(part);
	}
}