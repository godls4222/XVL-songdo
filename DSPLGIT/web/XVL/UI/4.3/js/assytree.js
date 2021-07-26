Assytree = function(params) {
	'use strict';
	var self = this;
	this.controller = null;
	this.player;
	this.topNodeName;
	this.mainTree;
	this.nodeCreateLevel;
	this.nodeExpandLevel;
	this.isDispComponent = false;

	this.requiredJsonUrls = [ assemblycacheurl ];

	if (params === undefined) {
		throw new Error('ltError: Required argument. method=Assytree, argument=params');
	} else {
		Object.keys(params).forEach(function(key) {
			self[key] = params[key];
		});
	}

	this.update = function(params) {
		
		if (self.isDispComponent && params.selfObj !== this) {
			var dom = Ext.ComponentQuery.query('assyTree[name=AssytreeCtrl]')[0];
			switch (params.updateType) {
			case 'SELECT_ON':
			case 'SELECT_OFF':
				var selGrpNames = [];
				var selection = [];
				var store = dom.getStore();
				var data = store.getData();
				var selectGrps = self.player.model.getSelections();
				
				var hilightGrps = [];
				Ext.each(selectGrps, function (selectGrp) {
					if ((params.selfObj === layerListObj || params.selfObj === layerListAdvObj) &&
							selectGrp.groupType == lt.GROUP_TYPE_BODY && selectGrp.groupClass != lt.GROUP_CLASS_COMMENT && selectGrp.groupClass != lt.GROUP_CLASS_DIMENSION) {
						var parent = selectGrp.getParent();
						selGrpNames[parent.elementId] = true;
						hilightGrps.push(parent);
					} else {
						selGrpNames[selectGrp.elementId] = true;
						hilightGrps.push(selectGrp);
					}
				});
				
				var ensureVisibleCallback = function (){
					Ext.each(data.items, function(item) {
						if (Ext.isEmpty(item.data) || Ext.isEmpty(item.data.elementId)) {
							return;
						}	
						if (selGrpNames[item.data.elementId]) {
							selection.push(item);
						}
					});					
					
					var selModel = dom.getSelectionModel();
					if (selection.length > 0) {
						selModel.select(selection, undefined, true);
					} else {
						selModel.deselectAll(true);						
					}
				};
				
				if(hilightGrps.length > 0){
					dom.ensureVisible(hilightGrps[hilightGrps.length - 1].elementId, {callback:ensureVisibleCallback});
				} else {
					ensureVisibleCallback();
				}
				break;
			case 'SELECT_CLEAR':
				var selModel = dom.getSelectionModel();
				selModel.deselectAll(true);
				break;
				
			case 'VISIBILITY_UPDATE_ALL':
				
				var uniqueIds = Object.keys(params.updateTagetElems);
				
				var visMap = [];
				var groups = self.player.model.getGroupsByUniqueIds(uniqueIds);
				Ext.each(groups, function(grp) {
					visMap[grp.elementId] = params.updateTagetElems[grp.uniqueId];
				});
				
				var store = dom.getStore();
				var data = getAllData(store);
				Ext.each(data, function(node) {
					if (!Ext.isEmpty(visMap[node.data.elementId])) {
						node.set('checked', visMap[node.data.elementId]);
					}
				});
				break;
				
			case 'DRILL':
				var tree = Ext.create('Ext.data.TreeStore', {
					root : function() {

						var data = {
							expanded : (self.nodeExpandLevel && self.nodeExpandLevel >= 1),
							text : self.topNodeName,
						};
						
						self.getAssyTreeData(assemblyJsonData, data, params.updateTagetElems);

						return data;
					}()
				});	
				
				var dom = Ext.ComponentQuery.query('assyTree[name=AssytreeCtrl]')[0];
				if (dom) {
					dom.setStore(tree);
				}
				if (currentAssembly === undefined){
					break;
				}
				var selGrpNames = [];
				var selection = [];
				
				selGrpNames[currentAssembly.elementId] = true;
				break;
			case 'HIGHLIGH_GROUPS':
				var dom = Ext.ComponentQuery.query('assyTree[name=AssytreeCtrl]')[0];
				if (Ext.isEmpty(dom)) {
					break;
				}
				var store = dom.getStore();
				if (Ext.isEmpty(store)) {
					break;
				}				
				var data = getAllData(store);
				if (Ext.isEmpty(data)) {
					break;
				}				
				var view = dom.getView();
				if (Ext.isEmpty(view)) {
					break;
				}	
				var displaySettings = player.view.getDisplaySettings();
				if (Ext.isEmpty(displaySettings) || Ext.isEmpty(displaySettings.associatedHighlightColorShape)){
					break;
				}				
				var associatedHighlightColorShape = ( '000000' + displaySettings.associatedHighlightColorShape.toString( 16 ) ).slice( - 6 );
				if (Ext.isEmpty(associatedHighlightColorShape)) {
					break;
				}				
				associatedHighlightColorShape = '#' + associatedHighlightColorShape;				
				
				view.assyAssociatedHighlightColorShapeItemCls = "x-grid-item-assyAssociatedHighlightColorShape";
				
				var reflectMap = {};
				Ext.each(params.updateTagetElems, function(elem) {
					reflectMap[elem] = true;
				});
				
				var nodes = Ext.select('.' + view.assyAssociatedHighlightColorShapeItemCls);
				Ext.each(nodes, function(node) {
					node.setStyle('background-color', '');
				});				

				for (var num in view.all.elements) {
					
					var index = Number(num);
					if (Ext.isEmpty(index)){
						continue;
					}				
					
					var item = view.getNode(index);
					if (Ext.isEmpty(item)){
						continue;
					}				
					var record = view.getRecord(item);
					if (Ext.isEmpty(record) || Ext.isEmpty(record.data) || Ext.isEmpty(record.data.elementId)){
						continue;
					}
					
					if (reflectMap[record.data.elementId]) {
						view.addItemCls(index, view.assyAssociatedHighlightColorShapeItemCls);
					} else {
						view.removeItemCls(index, view.assyAssociatedHighlightColorShapeItemCls);
					}
					
				}
				
				nodes = Ext.select('.' + view.assyAssociatedHighlightColorShapeItemCls);
				Ext.each(nodes, function(node) {
					node.setStyle('background-color', associatedHighlightColorShape);
				});
				break;
			default:
				break;
			}
		}
	}
	
	this.registController = function(controller) {
		this.controller = controller;
	};
	
	this.createAssyTree = function() {
		if (!self.isDispComponent) {
			return;
		}
		
		metaJsonLoaded[assemblycacheurl].then(function() {
			
			var tree = Ext.create('Ext.data.TreeStore', {
				root : function() {

					var data = {
						expanded : (self.nodeExpandLevel && self.nodeExpandLevel >= 1),
						text : self.topNodeName,
					};
					
					var rootAssyElementIDss = [[]];
					var groups;
					groups = getDispTopGroups();
					if (!Ext.isEmpty(groups) && groups.length === 1) {
						rootAssyElementIDss = [[groups[0].elementId]];
						currentAssembly = groups[0];
					}
					var currentLevel = groups.length > 1 ? 0 : 1;
					updateViewSelectionUnit(currentLevel);
					self.getAssyTreeData(assemblyJsonData, data, rootAssyElementIDss);

					return data;
				}()
			});	
			
			var dom = Ext.ComponentQuery.query('assyTree[name=AssytreeCtrl]')[0];
			if (dom) {
				dom.setStore(tree);
			}
		});
	}
	
	this.getAssyTreeData = function(jsonData, data, rootAssyElementIDss) {
		
		var self = this;
		
		if (Ext.isEmpty(jsonData) || Ext.isEmpty(jsonData.topAssembly) || Ext.isEmpty(jsonData.topAssembly.node)) {
			return;
		}
		var nodeLevel = 0;
		if (!Ext.isEmpty(self.nodeCreateLevel) && self.nodeCreateLevel < nodeLevel + 1) {
			return;
		}
		data.children = [];
		Ext.each(jsonData.topAssembly.node, function(jsonNode) {
			var childData = self.createChildData(jsonNode, nodeLevel + 1, rootAssyElementIDss);
			if (!Ext.isEmpty(childData)) {
				data.children.push(childData);
			}
		});
	}

	this.createChildData = function(jsonNode, nodeLevel, rootAssyElementIDss) {

		var self = this;
		
		if (Ext.isEmpty(jsonNode)) {
			return null;
		}
		
		var show = false;
		Ext.each(rootAssyElementIDss, function(rootAssyElementIDs) {
			var showAssyElementID = rootAssyElementIDs[nodeLevel - 1];
			if (Ext.isEmpty(showAssyElementID) || jsonNode.elementId == showAssyElementID){
				show = true;
				return false;
			}
			return true;
		});
		if (!show){
			return null;
		}
		
		var data = {
			elementId : jsonNode.elementId,
			id : jsonNode.elementId,					
			text : MakeFormatStringAssembly(self.altNameFormat, jsonNode, assemblyPropSections, assemblyModelAttrs),
			expanded : nodeLevel < self.nodeExpandLevel,
			checked : jsonNode.visibility === true ? true : false,
			iconCls : getTreeIcon(jsonNode),
			leaf : getLeaf(jsonNode),
			children : []
		};
		
		if (Ext.isEmpty(jsonNode.node)) {
			return data;
		}
		if (!Ext.isEmpty(self.nodeCreateLevel) && self.nodeCreateLevel < nodeLevel + 1) {
			return data;
		}
			
		data.children = [];
		Ext.each(jsonNode.node, function(childJsonNode) {
			var childData = self.createChildData(childJsonNode, nodeLevel + 1, rootAssyElementIDss);
			if (!Ext.isEmpty(childData)) {
				data.children.push(childData);
			}
		});
		return data;
	}
};

function getTreeIcon(obj) {
	if (Ext.isEmpty(obj) || Ext.isEmpty(obj.elementId)) {
		return 'part';
	}
	attr = assemblyModelAttrs[obj.elementId];
	if (Ext.isEmpty(attr)) {
		return 'part';
	}
	var type = attr.groupType;
	switch (type) {
	case lt.GROUP_TYPE_ASSEMBLY:
		return 'assembly';
	case lt.GROUP_TYPE_PART:
		return 'part';
	default:
		return 'part';
	}
}

function getLeaf(obj) {
	if (!obj || !obj.node) {
		return true;
	}
	if (obj.node.length > 0) {
		return false;
	} else {
		return true;
	}
}