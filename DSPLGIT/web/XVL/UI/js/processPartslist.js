ProcessPartslist = function(params) {
	'use strict';
	var self = this;
	this.controller = null;
	this.player;
	this.order;
	this.groupby = '';
	this.sort;
	this.isDispComponent = false;
	
	this.requiredJsonUrls = [
		assemblycacheurl,
		manufacturecacheurl,
		processcacheurl
	];
	
	if (params === undefined) {
		throw new Error('ltError: Required argument. method=ProcessPartslist, argument=params');
	} else {
		Object.keys(params).forEach(function(key) {
			self[key] = params[key];
		});
	}

	this.dispType = params.type ? params.type : 'work';

	this.update = function(params) {
		if (!self.isDispComponent || params.selfObj === this) {
			return;
		}

		var dom = Ext.ComponentQuery.query('processPartslist[name=processPartslist]')[0];

		var selGrpIds = [], sels = [];
		switch (params.updateType) {
		case 'SELECT_PROC':
			if (this.dispType != 'process')
				break;
			var store = Ext.create('Ext.data.Store', {
				data: {
					items: function() {
						var val = [];
						var nodes = [];
						var node = getProcessByBomId(params.updateTagetElems, processJsonData.topProcess);
						self.generateProcessPartsListData(val, node);
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

			var dom = Ext.ComponentQuery.query('processPartslist[name=processPartslist]')[0];
			if (dom) {
				dom.setStore(store);
				var sortNo = Number(processPartsListParam['sort']);
				var direction = processPartsListParam['order'];
				if (!isNaN(sortNo) && !Ext.isEmpty(direction)) {
					var idx = 0;
					Ext.each(processPartsListParam.columns, function(column) {
						if (idx == sortNo - 1) {
							store.sort(column.name, direction.toUpperCase());
							return false;
						}
						idx++;
					});
				}
			}
			break;
		case 'SELECT_WORK':
			var store = Ext.create('Ext.data.Store', {
				data: {
					items: function() {
						var val = [];
						var node = getProcessByBomId(params.updateTagetElems, processJsonData.topProcess);
						self.generateProcessPartsListData(val, node);
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
			if (this.dispType == 'work') {
				var dom = Ext.ComponentQuery.query('processPartslist[name=processPartslist]')[0];
				if (dom) {
					dom.setStore(store);
					var sortNo = Number(processPartsListParam['sort']);
					var direction = processPartsListParam['order'];
					if (!isNaN(sortNo) && !Ext.isEmpty(direction)) {
						var idx = 0;
						Ext.each(processPartsListParam.columns, function(column) {
							if (idx == sortNo - 1) {
								store.sort(column.name, direction.toUpperCase());
								return false;
							}
							idx++;
						});
					}
				}
			} else if (this.dispType == 'process') {

				var selected = store.getData().items;
				var selElms = [];

				Ext.each(selected, function(obj) {
					selElms.push(obj.data.refJsonNodes[0].name);
				});

				var listed = dom.getStore().getData().items;
				var selm = dom.getSelectionModel();

				selm.deselectAll();
				Ext.each(listed, function(obj, i) {
					Ext.each(obj.data.refJsonNodes, function(o) {
						if (Ext.Array.contains(selElms, o.name)) {
							selm.select(i, true);
							return false;
						}
					});
				});
			}
			break;
		case 'SELECT_ON':
		case 'SELECT_OFF':
			var store = dom.getStore();
			var data = store.getData();
			var selm = dom.getSelectionModel();

			selm.deselectAll();
			for (var i = 0; i < data.items.length; i++) {
				if (Ext.Array.contains(params.updateTagetElems, data.items[i].data.name)) {
					selm.select(i, true);
				}
			}
			break;
		case 'SELECT_CLEAR':
			dom.getSelectionModel().deselectAll();
			break;
		default:
			break;
		}
	}

	this.registController = function(controller) {
		this.controller = controller;
	}

	this.createProcessPartsList = function() {
		if (!self.isDispComponent) {
			return;
		}

		Ext.Promise.all([
			metaJsonLoaded[assemblycacheurl],
			metaJsonLoaded[manufacturecacheurl],
			metaJsonLoaded[processcacheurl]
		]).then(function() {

			var store = Ext.create('Ext.data.Store', {
				data: {
					items: function() {
						var val = [];
						self.getProcessPartsListData(val, assemblyJsonData);
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

			var dom = Ext.ComponentQuery.query('processPartslist[name=processPartslist]')[0];
			if (dom) {
				dom.setStore(store);
				var sortNo = Number(processPartsListParam['sort']);
				var direction = processPartsListParam['order'];
				if (!isNaN(sortNo) && !Ext.isEmpty(direction)) {
					var idx = 0;
					Ext.each(processPartsListParam.columns, function(column) {
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

	this.getProcessPartsListData = function(val, jsonData) {
		getAssemblyData(jsonData);

		if (jsonData && jsonData.topProcess && jsonData.topProcess.process) {
			var node = {};
			node.node = jsonData.topProcess;
			generateProcessPartsListData(val, node);
		}
	}

	this.generateProcessPartsListData = function(val, node) {
		var addedRows = [];

		if (Ext.isEmpty(node)) {
			return;
		}

		if (node.procType == 'pprc') {
			var elem, groups;
			if (node == getProcessCurVari(node)) {
				elem = node;
				groups = node.node;
			} else {
				elem = getProcessCurVari(node);
				groups = elem.group;
			}
			Ext.each(groups, function(grp) {
				if (!Ext.isEmpty(manufactureObjects[grp.entityId])) {
					self.setManuData(manufactureObjects[grp.entityId], val, addedRows);
				} else {
					self.addGroup2Row(assemblyObjects[grp.name], val, addedRows, assemblyPropSections, assemblyModelAttrs);
				}
			});

			Ext.each(elem.resourceRef, function(res) {
				if (!Ext.isEmpty(res.group)) {
					self.addResource2Row(res.group, val, addedRows, assemblyPropSections, assemblyModelAttrs);
				}
			});

		} else {
			Ext.each(node.node, function(obj) {
				if (obj.procType == 'pprc') {
					var elem, groups;
					if (obj == getProcessCurVari(obj)) {
						elem = obj;
						groups = elem.node;
					} else {
						elem = getProcessCurVari(obj);
						groups = elem.group;
					}
					Ext.each(groups, function(grp) {
						if (!Ext.isEmpty(manufactureObjects[grp.entityId])) {
							self.setManuData(manufactureObjects[grp.entityId], val, addedRows);
						} else {
							self.addGroup2Row(assemblyObjects[grp.name], val, addedRows, assemblyPropSections, assemblyModelAttrs);
						}
					});

					Ext.each(elem.resourceRef, function(res) {
						if (!Ext.isEmpty(res.group)) {
							self.addResource2Row(res.group, val, addedRows, assemblyPropSections, assemblyModelAttrs);
						}
					});
				} else {
					self.setChildData(obj, val, addedRows);
				}
			});
		}

		self.createColumnStr(val, assemblyPropSections, assemblyModelAttrs);
	}

	this.setChildData = function(childgroup, val, addedRows) {
		var self = this;

		Ext.each(childgroup.node, function(obj) {
			if (obj.procType == 'pprc') {
				var elem, groups;
				if (obj == getProcessCurVari(obj)) {
					elem = obj;
					groups = obj.node;
				} else {
					elem = getProcessCurVari(obj);
					groups = elem.group;
				}
				Ext.each(groups, function(grp) {
					if (!Ext.isEmpty(manufactureObjects[grp.entityId])) {
						self.setManuData(manufactureObjects[grp.entityId], val, addedRows);
					} else {
						self.addGroup2Row(assemblyObjects[grp.name], val, addedRows, assemblyPropSections, assemblyModelAttrs);
					}
				});

				Ext.each(elem.resourceRef, function(res) {
					if (!Ext.isEmpty(res.group)) {
						self.addResource2Row(res.group, val, addedRows, assemblyPropSections, assemblyModelAttrs);
					}
				});
			} else {
				self.setChildData(obj, val, addedRows);
			}
		});
	}

	this.setManuData = function(manu, val, addedRows) {
		Ext.each(manu.node, function(obj) {
			if (Ext.isEmpty(obj.node)) {
				self.addGroup2Row(obj, val, addedRows, assemblyPropSections, assemblyModelAttrs);
			} else {
				self.setManuData(obj, val, addedRows);
			}
		});
	}

	this.addGroup2Row = function(obj, val, addedRows, propSections, elemAttrs) {

		var row = self.getOrCreateRow(obj, val, addedRows, propSections, elemAttrs);
		if (Ext.isEmpty(row)) {
			return null;
		}

		if (Ext.isEmpty(Ext.Array.findBy(row.refJsonNodes, function(refJsonNode) {
			return refJsonNode.name == obj.name;
		}))) {
			row.refJsonNodes.push(obj);
			row.countGroupCount++;
		}
	}

	this.addResource2Row = function(obj, val, addedRows, propSections, elemAttrs) {

		var row = self.getOrCreateRow(obj, val, addedRows, propSections, elemAttrs);
		if (Ext.isEmpty(row)) {
			return null;
		}

		if (Ext.isEmpty(Ext.Array.findBy(row.refJsonNodes, function(refJsonNode) {
			return refJsonNode.name == obj.name;
		}))) {
			row.refJsonNodes.push(obj);
		}
	}

	this.getOrCreateRow = function(obj, val, addedRows, propSections, elemAttrs) {

		if (Ext.isEmpty(obj)) {
			return null;
		}

		var groupByVal = null;
		if (!Ext.isEmpty(processPartsListParam.groupby)) {
			groupByVal = MakeFormatStringAssembly(processPartsListParam.groupby, obj, propSections, elemAttrs);
		}
		var part = null;
		if (!Ext.isEmpty(groupByVal)) {
			part = addedRows[groupByVal];
		}
		if (Ext.isEmpty(part)) {
			part = {
				name: groupByVal,
				refJsonNodes: [],
				countGroupCount: 0
			};
			val.push(part);
			if (!Ext.isEmpty(groupByVal)) {
				addedRows[groupByVal] = part;
			}
		}

		return part;
	}

	this.createColumnStr = function(val, propSections, elemAttrs) {

		Ext.each(val, function(part) {

			var obj = part.refJsonNodes[0];
			Ext.each(processPartsListParam.columns, function(column) {
				var type = column.type;
				switch (type) {
				case 1:
				case 2:
					break;
				case 3:
					if (part.countGroupCount > 0) {
						part[column.name] = part.countGroupCount;
					} else {
						part[column.name] = '';
					}
					break;
				case 4:
					part[column.name] = convPropNum(MakeFormatStringAssembly(column.format, obj, propSections, elemAttrs));
					break;
				default:
					part[column.name] = MakeFormatStringAssembly(column.format, obj, propSections, elemAttrs);
					break;
				}
			});
		});
	}
}
