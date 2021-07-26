Manutree = function(params) {
	'use strict';
	var self = this;
	this.controller = null;
	this.player;
	this.mainTree;
	this.nodeCreateLevel;
	this.nodeExpandLevel;
	this.isDispComponent = false;
	this.requiredJsonUrls = [
		manufacturecacheurl,
		assemblycacheurl
	];

	if (params === undefined) {
		throw new Error('ltError: Required argument. method=Manutree, argument=params');
	} else {
		Object.keys(params).forEach(function(key) {
			self[key] = params[key];
		});
	}

	this.update = function(params) {
		if (self.isDispComponent && params.selfObj !== this) {
			var dom = Ext.ComponentQuery.query('manufactureTree[name=ManutreeCtrl]')[0];
			var controller = dom.getController();
			switch (params.updateType) {
			case 'SELECT_ON':
			case 'SELECT_OFF':
				var store = dom.getStore();
				var data = store.getData();
				var groups = self.player.model.getSelections();
				
				var ensureVisibleCallback = function (){
					
					var selGrpNames = [];
					Ext.each(groups, function(grp) {
						selGrpNames[grp.elementId] = true;
					});
					
					var selection = [];
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
						selModel.select(selection, undefined, true/*suppressEvent*/);
					} else {
						selModel.deselectAll(true/*suppressEvent*/);
					}
				};
				
				if(groups.length > 0){
					dom.ensureVisible(groups[groups.length - 1].elementId, {callback:ensureVisibleCallback});					
				} else {
					ensureVisibleCallback();
				}
				break;
			case 'SELECT_CLEAR':
				var selModel = dom.getSelectionModel();
				selModel.deselectAll(true/*suppressEvent*/);
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
						controller.checkChange(visMap[node.data.elementId], node);
					}
				});
				break;
				
			default:
				break;
			}
		}
	}
	
	this.isExpandLevel = function(nodeLevel) {
		return !Ext.isEmpty(self.nodeExpandLevel) && nodeLevel < self.nodeExpandLevel;
	}

	this.isCreateLevel = function(nodeLevel) {
		return Ext.isEmpty(self.nodeCreateLevel) || nodeLevel <= self.nodeCreateLevel;
	}
	
	this.isVisible = function(jsonNode) {
		if (jsonNode.type == 'manufacture') {
			return true;
		}
		var group = player.model.getGroupByElementId(self.getElementId(jsonNode));
		if (Ext.isEmpty(group)) {
			return true;
		}
		return group.visibility;
	}
	
	this.registController = function(controller) {
		this.controller = controller;
	};
	
	this.createManuTree = function() {
		if (!self.isDispComponent) {
			return;
		}
		
		Ext.Promise.all([
				metaJsonLoaded[manufacturecacheurl],
				metaJsonLoaded[assemblycacheurl]
		]).then(function() {
			
			var tree = Ext.create('Ext.data.TreeStore', {
				root : self.createManuTreeData(manufactureJsonData),
			});	
			
			var dom = Ext.ComponentQuery.query('manufactureTree[name=ManutreeCtrl]')[0];
			if (dom) {
				dom.setStore(tree);
			}
		}, function(response, opts) {
			
			var tree = Ext.create('Ext.data.TreeStore', {
				root : self.createManuTreeData(null),
			});
			
			var dom = Ext.ComponentQuery.query('manufactureTree[name=ManutreeCtrl]')[0];
			if (dom) {
				dom.setStore(tree);
			}
		});
	}
	
	this.createManuTreeData = function(jsonData) {
		
		var root = {
			expanded : self.isExpandLevel(0),
			text : web3d.CST.XVL_WEB3D_MANUTREE_TOP_NODE_NAME,
		};
		
		if (Ext.isEmpty(jsonData) || 
				Ext.isEmpty(jsonData.topManufacture) ||
				Ext.isEmpty(jsonData.topManufacture.node)) {
			return root;
		}
		
		var createChildren = function(jsonNodeParent, nodeLevelParent) {
			
			var children = [];
			Ext.each(jsonNodeParent.node, function(jsonNodeChild) {
				var dataChild = createData(jsonNodeChild, nodeLevelParent + 1);
				if (!Ext.isEmpty(dataChild)) {
					children.push(dataChild);
				}
			});
			return children;
		}
		
		var createData = function(jsonNode, nodeLevel) {
			
			var children = [];
			if (self.isCreateLevel(nodeLevel+1)) {
				children = createChildren(jsonNode, nodeLevel); 
			}
			
			if (self.getGroupType(jsonNode) == lt.GROUP_TYPE_BODY) {
				return null;
			}
			
			return {
				elementId : self.getElementId(jsonNode),
				id : self.getElementId(jsonNode), // need for ensureVisible
				text : MakeFormatStringAssembly(self.altNameFormat, jsonNode, assemblyPropSections, assemblyModelAttrs),
				expanded : self.isExpandLevel(nodeLevel),
				checked : self.isVisible(jsonNode),
				iconCls : self.getTreeIcon(jsonNode),
				leaf : self.isLeaf(jsonNode) || Ext.isEmpty(children),
				children : children,
				type : jsonNode.type,
				manuType : self.getManuType(jsonNode),
			};
		};
		
		root.children = createChildren(jsonData.topManufacture, 0/*nodeLevelParent*/); 
		return root;
	}
	
	this.getElementId = function(jsonNode) {
		
		if (Ext.isEmpty(jsonNode) || Ext.isEmpty(jsonNode.name)) {
			return null;
		}
		return jsonNode.name;
	}
	
	this.getGroupType = function(jsonNode) {
		
		var elementId = self.getElementId(jsonNode);
		if (Ext.isEmpty(elementId)) {
			return null;
		}
		var attr = assemblyModelAttrs[elementId];
		if (Ext.isEmpty(attr)) {
			return null;
		}
		return attr.groupType;
	}
	
	this.getManuType = function(jsonNode) {
		
		if (Ext.isEmpty(jsonNode)) {
			return null; // error
		}
		
		if (jsonNode.type != 'manufacture') {
			return null;
		}
		
		return Ext.isEmpty(jsonNode.manuType) ? 'manuAssy' : jsonNode.manuType;
	}

	this.getTreeIcon = function(jsonNode) {
		
		if (Ext.isEmpty(jsonNode)) {
			return null; // error
		}
		
		switch (jsonNode.type) {
		case 'group':
			switch (self.getGroupType(jsonNode)) {
			case lt.GROUP_TYPE_ASSEMBLY:
				return 'assembly';
			case lt.GROUP_TYPE_PART:
				return 'part';
			case lt.GROUP_TYPE_EMPTY:
				return 'Empty';
			case lt.GROUP_TYPE_ERRROR:
				return 'Error';
			default:
				return null; // error
			}
		case 'manufacture':
			switch (jsonNode.manuType) {
			case 'manuAssy':
			default:
				return 'manuAssy';
			case 'manuPart':
				return 'manuPart';
			}
		default:
			return null; // error
		}
	}
	
	this.isLeaf = function(jsonNode) {
		if (Ext.isEmpty(jsonNode) || Ext.isEmpty(jsonNode.node)) {
			return true;
		}
		if (jsonNode.node.length > 0) {
			return false;
		} else {
			return true;
		}
	}
}
