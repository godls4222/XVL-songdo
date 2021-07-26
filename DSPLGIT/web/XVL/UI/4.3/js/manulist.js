ManuList = function(params) {
	'use strict';
	var self = this;
	this.controller = null;
	this.player;
	this.mainGrid;
	this.grid;
	this.columns;
	this.type;
	this.levelFrom;
	this.levelTo;
	this.order;
	this.groupby = '';
	this.sort;
	this.isDispAssembly = false;
	this.isDispComponent = false;
	this.requiredJsonUrls = [ manufacturecacheurl ];

	if (params === undefined) {
		throw new Error('ltError: Required argument. method=ManuList, argument=params');
	} else {
		Object.keys(params).forEach(function(key) {
			self[key] = params[key];
		});
	}

	this.update = function(params) {
		
		if (!self.isDispComponent || params.selfObj === this) {
			return;
		}
		
		var dom = Ext.ComponentQuery.query('manufactureList[name=manulist]')[0];
		
		switch (params.updateType) {
		case 'SELECT_CLEAR':
			var selModel = dom.getSelectionModel();
			selModel.deselectAll(false);
			break;
		}
	}

	this.registController = function(controller) {
		this.controller = controller;
	}
	
	this.isManuAssy = function(jsonNode) {
		if (Ext.isEmpty(jsonNode)) {
			return false;
		}
		if (jsonNode.type != 'manufacture') {
			return false;
		}
		if (Ext.isEmpty(jsonNode.manuType)) {
			return true;
		}
		return jsonNode.manuType == 'manuAssy';
	}

	this.createManuList = function() {
		if (!self.isDispComponent) {
			return;
		}
		
		metaJsonLoaded[manufacturecacheurl].then(function() {
			
			var store = Ext.create('Ext.data.Store', {
				data: {
					items: function() {
						var listItems = [];
						
						self.getManuListData(listItems, manufactureJsonData);
						return listItems;
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
			
			var dom = Ext.ComponentQuery.query('manufactureList[name=manulist]')[0];
			if (dom) {
				
				var columns0 = [];
				Ext.each(manuListParam.columns, function(column) {
					var val = {};
					val.text = column.title;
					val.dataIndex = column.title;
					val.width = column.width;
					columns0.push(val);
				});
				dom.reconfigure(store, columns0);
				
				var sortNo = Number(manuListParam['sort']);
				var direction = manuListParam['order'];
				if (!isNaN(sortNo) && !Ext.isEmpty(direction)) {
					var idx = 0;
					Ext.each(manuListParam.columns, function(column) {
						if (idx == sortNo - 1) {
							store.sort(column.title, direction.toUpperCase());
							return false;
						}
						idx++;
					});
				}					
			}
		});
	}
	
	this.getManuListData = function(listItems, jsonData) {
		
		getManufactureData(jsonData);
		var userNameBoundJsonNodesMap = createUserNameBoundJsonNodesMap(jsonData);
		
		if (Ext.isEmpty(jsonData) || 
				Ext.isEmpty(jsonData.topManufacture) ||
				Ext.isEmpty(jsonData.topManufacture.node)) {
			return;
		}		
		
		var addedNames = [];
		Ext.each(jsonData.topManufacture.node, function(jsonNode) {
			
			if (Ext.isEmpty(jsonNode)) {
				return true;
			}
			
			if (!self.isManuAssy(jsonNode)) {
				return true;
			}
			
			addManuRow(jsonNode, listItems, addedNames, userNameBoundJsonNodesMap);
		});		
		
	}
	
	function getElementId(jsonNode) {
		
		if (Ext.isEmpty(jsonNode) || Ext.isEmpty(jsonNode.name)) {
			return null;
		}
		return jsonNode.name;
	}
	
	function addManuRow(jsonNode, listItems, addedNames, userNameBoundJsonNodesMap) {
		
		var userIdBase = MakeFormatStringAssembly(PROP_FORMAT_BASE_NAME, jsonNode, manufacturePropSections, assemblyModelAttrs);	
		
		if (!Ext.isEmpty(addedNames[userIdBase])) {
			return;
		}
		addedNames[userIdBase] = true;
		
		var userNameBoundJsonNodes = userNameBoundJsonNodesMap[userIdBase];
		
		var listItem = {};
		
		listItem.elementIds = [];
		Ext.each(userNameBoundJsonNodes, function(userNameBoundJsonNode) {
			listItem.elementIds.push(getElementId(userNameBoundJsonNode));
		});
		
		listItem.entityIds = [];
		Ext.each(userNameBoundJsonNodes, function(userNameBoundJsonNode) {
			listItem.entityIds.push(userNameBoundJsonNode.entityId);
		});
		
		Ext.each(manuListParam.columns, function(column) {
			var type = column.type;
			switch (type) {
			case 1:
			case 2:
				break;
			case 3:/*qty*/
				listItem[column.title] = userNameBoundJsonNodes.length;
				break;
			case 4:
				listItem[column.title] = convPropNum(MakeFormatStringAssembly(column.format, jsonNode, manufacturePropSections, assemblyModelAttrs));
				break;
			default:/*prop*/
				listItem[column.title] = MakeFormatStringAssembly(column.format, jsonNode, manufacturePropSections, assemblyModelAttrs);
				break;
			}
		});
		
		listItems.push(listItem);
	}
	
	function createUserNameBoundJsonNodesMap(jsonData) {
		
		if (Ext.isEmpty(jsonData) ||
				Ext.isEmpty(jsonData.topManufacture) ||
				Ext.isEmpty(jsonData.topManufacture.node)) {
			return {};
		}
		
		var userNameBoundJsonNodesMap = {};
		
		Ext.each(jsonData.topManufacture.node, function(jsonNode) {
			
			var userIdBase = MakeFormatStringAssembly(PROP_FORMAT_BASE_NAME, jsonNode, manufacturePropSections, assemblyModelAttrs);
			if (Ext.isEmpty(userNameBoundJsonNodesMap[userIdBase])) {
				userNameBoundJsonNodesMap[userIdBase] = [ jsonNode ];
			} else {
				userNameBoundJsonNodesMap[userIdBase].push(jsonNode);
			}
		});
		
		return userNameBoundJsonNodesMap;
	}
}

