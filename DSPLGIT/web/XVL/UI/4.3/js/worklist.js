WorkList = function(params) {
	'use strict';
	var self = this;
	this.controller = null;
	this.player;
	this.type;
	this.processName;
	this.isDispComponent = false;
	this.prevTopNode = null;

	this.requiredJsonUrls = [ processcacheurl ];

	if (params === undefined) {
		throw new Error('ltError: Required argument. method=WorkList, argument=params');
	} else {
		Object.keys(params).forEach(function(key) {
			self[key] = params[key];
		});
	}

	this.update = function(params) {
		if (!self.isDispComponent || params.selfObj === this) {
			return;
		}
		
		var dom = Ext.ComponentQuery.query('worklist[name=worklist]')[0];

		switch (params.updateType) {
		case 'SELECT_PROC':
			var node = {};
			if (this.type == 'all') {
				node = processJsonData.topProcess;
			}
			else if (this.type == 'process') {
				if (!Ext.isEmpty(processObjects[this.processName])) {
					node = getProcessByBomId(processObjects[this.processName].bomId, processJsonData.topProcess);
				}
			}
			else if (this.type == 'current') {
				node = getProcessByBomId(params.updateTagetElems, processJsonData.topProcess);
			}
			
			if (!Ext.isEmpty(this.prevTopNode) &&
					!Ext.isEmpty(this.prevTopNode.bomId) &&
					!Ext.isEmpty(node) &&
					!Ext.isEmpty(node.bomId) &&
					this.prevTopNode.bomId == node.bomId) {
				break;
			}
			this.prevTopNode = node;
			self.recreateWorkList(node);
			break;
		case 'SELECT_WORK':
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
		case 'SELECT_ON':
		case 'SELECT_OFF':
		case 'SELECT_CLEAR':
			break;
		default:
			break;
		}
	}

	this.registController = function(controller) {
		this.controller = controller;
	}

	this.createWorkList = function() {
		if (!self.isDispComponent) {
			return;
		}

		metaJsonLoaded[processcacheurl].then(function() {

			if (self.type == 'process' && !Ext.isEmpty(processObjects[self.processName])) {
				toolbarObj.initAnimeProcessId = processObjects[self.processName].elementId;
			}

			var store = Ext.create('Ext.data.Store', {
				data: {
					items: function() {
						var val = [];
						var node = {};
						if (self.type == 'process') {
							if (!Ext.isEmpty(processObjects[self.processName])) {
								node = getProcessByBomId(processObjects[self.processName].bomId, processJsonData.topProcess);
							}
						} else if (self.type == 'current') {
							node = {};
						} else {
							if (processJsonData && processJsonData.topProcess && processJsonData.topProcess.process) {
								node.node = processJsonData.topProcess.process;
							}
						}
						
						self.prevTopNode = node;
						
						self.generateWorkList(val, node);
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

			var dom = Ext.ComponentQuery.query('worklist[name=worklist]')[0];
			if (dom) {
				dom.setStore(store);
				var sortNo = Number(workListParam['sort']);
				var direction = workListParam['order'];
				if (!isNaN(sortNo) && !Ext.isEmpty(direction)) {
					var idx = 0;
					Ext.each(workListParam.columns, function(column) {
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
	
	this.recreateWorkList = function(node) {
		
		var dom = Ext.ComponentQuery.query('worklist[name=worklist]')[0];
		
		var store = Ext.create('Ext.data.Store', {
			data: {
				items: function() {
					var val = [];
					self.generateWorkList(val, node);
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

		if (dom) {
			dom.setStore(store);
			var sortNo = Number(workListParam['sort']);
			var direction = workListParam['order'];
			if (!isNaN(sortNo) && !Ext.isEmpty(direction)) {
				var idx = 0;
				Ext.each(workListParam.columns, function(column) {
					if (idx == sortNo - 1) {
						store.sort(column.name, direction.toUpperCase());
						return false;
					}
					idx++;
				});
			}
		}
	}
	
	this.generateWorkList = function(val, node) {
		
		if (Ext.isEmpty(node)) {
			return;
		}
		
		Ext.each(node.node, function(obj) {
			addWorkRow(obj, val, processPropSections, processModelAttrs);
			self.setChildData(obj, val, processPropSections, processModelAttrs);		
		});
	}
	
	this.setChildData = function(childgroup, val, propSections, elemAttrs) {
		var self = this;
		
		Ext.each(childgroup.node, function(obj) {
			addWorkRow(obj, val, propSections, elemAttrs);
			self.setChildData(obj, val, propSections, elemAttrs);
		});
	}

	this.getChangeStartAnimeId = function() {
		if (!self.isDispComponent) {
			return undefined;
		}
		var dom = Ext.ComponentQuery.query('worklist[name=worklist]')[0];
		if (!dom || Ext.isEmpty(dom.getSelection())) {
			if (self.type == 'process' && !Ext.isEmpty(processObjects[self.processName])) {
				return processObjects[self.processName].node[0].elementId;
			}
		}
		return undefined;
	}
}

function addWorkRow(obj, val, propSections, elemAttrs) {
	if (obj.procType != 'pprc') return;
	var part = {};
	var userIdBase = '';
	var format = '';

	part.bomId = String(obj.bomId);
	part.userIdBase = String(obj.userIdBase);

	Ext.each(workListParam.columns, function(column) {
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
			var str = MakeFormatStringAssembly(column.format, obj, propSections, elemAttrs);
			if (column.format == '${XVL_PROC_NO}' || column.format == '${XVL_PROC_WORKNO}') {
				part[column.name] = str;
				break;
			}
			part[column.name] = str;
			break;
		}
	});
	val.push(part);
}