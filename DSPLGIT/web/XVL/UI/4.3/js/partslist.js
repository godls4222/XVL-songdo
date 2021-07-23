PartList = function(params) {
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

	this.requiredJsonUrls = [ assemblycacheurl ];

	if (params === undefined) {
		throw new Error('ltError: Required argument. method=PartsList, argument=params');
	} else {
		Object.keys(params).forEach(function(key) {
			self[key] = params[key];
		});
	}

	this.update = function(params) {
		if (!self.isDispComponent || params.selfObj === this) {
			return;
		}
		
		var dom = Ext.ComponentQuery.query('partslist[name=partslist]')[0];

		var selGrpIds = [], sels = [];
		switch (params.updateType) {
		case 'SELECT_ON':
		case 'SELECT_OFF':
			
			var selGroups = player.model.getSelections();
			
			var lastSelGrp = null;
			if(!Ext.isEmpty(selGroups)){
				lastSelGrp = selGroups[selGroups.length - 1];
			}
			
			var selection = [];
			var lastSelRow = null;
			var store = dom.getStore();
			var data = store.getData();
			Ext.each(data.items, function(item) {
				if (Ext.isEmpty(item.data)) {
					return;
				}
				if (Ext.isEmpty(item.data.refJsonNodes)) {
					return;
				}
				var containsSelGrp = item.data.refJsonNodes.some(function(refJsonNode) {
					
					if (Ext.isEmpty(selGroups)) {
						return false;
					}
					
					return selGroups.some(function(selGroup) {
						return refJsonNode.elementId == selGroup.elementId;
					});
				});
				if (containsSelGrp) {
					selection.push(item);
				}
				var containtsLastSelGrp = item.data.refJsonNodes.some(function(refJsonNode) {
					
					if (Ext.isEmpty(lastSelGrp)) {
						return false;
					}
					
					return refJsonNode.elementId == lastSelGrp.elementId;
				});
				if (containtsLastSelGrp) {
					lastSelRow = item;
				}
			});
			
			var selModel = dom.getSelectionModel();
			if (!Ext.isEmpty(selection)) {
				selModel.select(selection, undefined, true);				
				if(!Ext.isEmpty(lastSelRow)){
					dom.getView().focusRow(lastSelRow);
				}				
			} else {
				selModel.deselectAll(false)
			}
			break;
		case 'SELECT_CLEAR':
			var selModel = dom.getSelectionModel();
			selModel.deselectAll(false);
			break;
		case 'DRILL':
			var store = Ext.create('Ext.data.Store', {
				data: {
					items: function() {
						var val = [];
						self.getPartListData(val, assemblyJsonData, params.updateTagetElems);
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

			var dom = Ext.ComponentQuery.query('partslist[name=partslist]')[0];
			if (dom) {
                var columns0 = [];
                Ext.each(partListParam.columns, function(column) {
                    var val = {};
                    val.text = column.name;
                    val.dataIndex = column.name;
                    val.width = column.width;
                    columns0.push(val);
                });                
                dom.reconfigure(store, columns0);
				
				var sortNo = Number(partListParam['sort']);
				var direction = partListParam['order'];
				if (!isNaN(sortNo) && !Ext.isEmpty(direction)) {
					var idx = 0;
					Ext.each(partListParam.columns, function(column) {
						if (idx == sortNo - 1) {
							store.sort(column.name, direction.toUpperCase());
							return false;
						}
						idx++;
					});
				}					
			}
			break;
		case 'HIGHLIGH_GROUPS':
			var dom = Ext.ComponentQuery.query('partslist[name=partslist]')[0];
			if (Ext.isEmpty(dom)) {
				break;
			}
			var store = dom.getStore();
			if (Ext.isEmpty(store)) {
				break;
			}				
			var data = store.getData();
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
			
			view.partAssociatedHighlightColorShapeItemCls = "x-grid-item-partAssociatedHighlightColorShape";
			
			var reflectMap = {};
			Ext.each(params.updateTagetElems, function(elem) {
				reflectMap[elem] = true;
			});
			
			var nodes = Ext.select('.' + view.partAssociatedHighlightColorShapeItemCls);
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
					view.addItemCls(index, view.partAssociatedHighlightColorShapeItemCls);
				} else {
					view.removeItemCls(index, view.partAssociatedHighlightColorShapeItemCls);
				}
				
			}
			
			nodes = Ext.select('.' + view.partAssociatedHighlightColorShapeItemCls);
			Ext.each(nodes, function(node) {
				node.setStyle('background-color', associatedHighlightColorShape);
			});
			break;			
		default:
			break;
		}
	}

	this.registController = function(controller) {
		this.controller = controller;
	}

	this.createPartsList = function() {
		if (!self.isDispComponent) {
			return;
		}
		
		metaJsonLoaded[assemblycacheurl].then(function() {

			var store = Ext.create('Ext.data.Store', {
				data: {
					items: function() {
						var val = [];
						
						var rootAssyElementIDs = [];
						var groups;
						groups = getDispTopGroups();
						if (!Ext.isEmpty(groups) && groups.length === 1) {
							rootAssyElementIDs.push(groups[0].elementId);
							currentAssembly = groups[0];
						}
						var currentLevel = groups.length > 1 ? 0 : 1;
						updateViewSelectionUnit(currentLevel);
						self.getPartListData(val, assemblyJsonData, [ rootAssyElementIDs ]);
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

			var dom = Ext.ComponentQuery.query('partslist[name=partslist]')[0];
			if (dom) {

				var columns0 = [];
				Ext.each(partListParam.columns, function(column) {
					var val = {};
					val.text = column.name;
					val.dataIndex = column.name;
					val.width = column.width;
					columns0.push(val);
				});
				dom.reconfigure(store, columns0);

				var sortNo = Number(partListParam['sort']);
				var direction = partListParam['order'];
				if (!isNaN(sortNo) && !Ext.isEmpty(direction)) {
					var idx = 0;
					Ext.each(partListParam.columns, function(column) {
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

	this.getPartListData = function(val, jsonData, rootAssyElementIDss) {
		
		var addedRowss = {};
		var elemCnts = [];
		
		if (Ext.isEmpty(jsonData) || Ext.isEmpty(jsonData.topAssembly)) {
			return;
		}
		
		self.setChildData(jsonData.topAssembly, val, addedRowss, assemblyPropSections, assemblyModelAttrs, elemCnts, 1, rootAssyElementIDss);
		self.createColumnStr(val, assemblyPropSections, assemblyModelAttrs);
	}

	this.setChildData = function(jsonNode, val, addedRowss, propSections, elemAttrs, elemCnts, level, rootAssyElementIDss) {
		
		var self = this;
		
		if (Ext.isEmpty(jsonNode) || Ext.isEmpty(jsonNode.node)) {
			return;
		}
		if (!Ext.isEmpty(self.levelTo) && Number(self.levelTo) < level) {
			return;
		}
		
		Ext.each(jsonNode.node, function(childJsonNode) {
			
			var hitRootAssyElementIDss = [];
			Ext.each(rootAssyElementIDss, function(rootAssyElementIDs) {
				var showAssyElementID = rootAssyElementIDs[level - 1];
				var isRootAssyOrParentOrChild = Ext.isEmpty(showAssyElementID) || childJsonNode.elementId == showAssyElementID;
				if (isRootAssyOrParentOrChild) {
					hitRootAssyElementIDss.push(rootAssyElementIDs);
				}
			});
			if (Ext.isEmpty(hitRootAssyElementIDss)){
				return;
			}
			
			var isRootAssyOrChild = hitRootAssyElementIDss[0].length <= level;
			if (!(!Ext.isEmpty(self.levelFrom) && Number(self.levelFrom) > level) &&
					isRootAssyOrChild) {
				var rootAssyElementID = hitRootAssyElementIDss[0][hitRootAssyElementIDss[0].length - 1];
				var addedRows = addedRowss[rootAssyElementID];
				if (Ext.isEmpty(addedRows)) {
					addedRows = {};
					addedRowss[rootAssyElementID] = addedRows;
				}
				self.addRow(childJsonNode, val, addedRows, propSections, elemAttrs, elemCnts, level);
			}
			self.setChildData(childJsonNode, val, addedRowss, propSections, elemAttrs, elemCnts, level + 1, hitRootAssyElementIDss);
		});
		
	}

	this.addRow = function(obj, val, addedRows, propSections, elemAttrs, elemCnts, level) {
		
		if (!isPartListDisplay(obj, propSections, elemAttrs)) {
			return;
		}
		
		var groupByVal = null;
		if (!Ext.isEmpty(partListParam.groupby)) {
			groupByVal = MakeFormatStringAssembly(partListParam.groupby, obj, assemblyPropSections, assemblyModelAttrs);
		}
		var part = null;
		if (!Ext.isEmpty(groupByVal)) {
			part = addedRows[groupByVal];
		}
		if (Ext.isEmpty(part)) {
			part = {
					refJsonNodes: [ obj ],
					elementId: String(obj.elementId),
					userIdBase: String(obj.userIdBase),
					depth: level
			};
			val.push(part);
			if (!Ext.isEmpty(groupByVal)) {
				addedRows[groupByVal] = part; 
			}
		} else {
			part.refJsonNodes.push(obj);
		}
	}
	
	this.createColumnStr = function(val, propSections, elemAttrs) {
		
		Ext.each(val, function(part) {
			
			var obj = part.refJsonNodes[0];
			var userIdBase = '';
			var format = '';	
			Ext.each(partListParam.columns, function(column) {
				var type = column.type;
				switch (type) {
				case 1:
				case 2:
					break;
				case 3:
					part[column.name] = part.refJsonNodes.length;
					break;
				default:
					if (Ext.isEmpty(column.format)) {
						break;
					}
					if (Ext.isEmpty(column.formatter)) {
						if (type == 0) {
							part[column.name] = MakeFormatStringAssembly(column.format, obj, propSections, elemAttrs, column.empty);
						}
						else if (type == 4) {
							part[column.name] = convPropNum(MakeFormatStringAssembly(column.format, obj, propSections, elemAttrs, column.empty));
						}
					} else {
						part[column.name] = '';
						if (!isLinkDisplay(obj, propSections, elemAttrs)) {
							break;
						}
						if (column.formatter === "link2drilldownformatter") {
							var attr = elemAttrs[obj.elementId];
							if (Ext.isEmpty(attr)){
								break;
							}
							if (attr.groupType !== lt.GROUP_TYPE_ASSEMBLY){
								break;
							}
							var str = MakeFormatStringAssembly(column.format, obj, propSections, elemAttrs);
							part[column.name] = '<a href="javascript:void(0)" class="link2uptransformatter">' + str + '</a>';
						} else if  (column.formatter === 'link2docformatter') {
							var value = MakeFormatStringAssembly(column.format, obj, propSections, elemAttrs);
							if (!Ext.isEmpty(value)) {
								var searchAttributeName = column.searchAttributeName === undefined ? '' : column.searchAttributeName;
								var folderId = column.folderId === undefined ? '' : column.folderId;
								part[column.name] = '<a href="javascript:void(0)" class="link2docformatter" data-val="' + value + '" data-attr="' + searchAttributeName + '" data-fid="' + folderId + '">' + web3d.CST.XVL_WEB3D_FORMATTER_SHOW + '</a>';
							}
							part['obj'] = obj;
						} else if (column.formatter ===  'link2web3dformatter') {
							var value = MakeFormatStringAssembly(column.format, obj, propSections, elemAttrs);
							if (!Ext.isEmpty(value)) {
								var searchAttributeName = column.searchAttributeName === undefined ? '' : column.searchAttributeName;
								var folderId = column.folderId === undefined ? '' : column.folderId;
								var windowTarget = column.windowTarget === undefined ? '' : column.windowTarget;
								part[column.name] = '<a href="javascript:void(0)" class="link2web3dformatter" data-val="' + value + '" data-attr="' + searchAttributeName + '" data-fid="' + folderId + '" data-win="' + windowTarget + '">' + web3d.CST.XVL_WEB3D_FORMATTER_SHOW + '</a>';
							}
							part['obj'] = obj;
						} else {
							if (type == 0) {
								part[column.name] = MakeFormatStringAssembly(column.format, obj, propSections, elemAttrs, column.empty);
							}
							else if (type == 4) {
								part[column.name] = convPropNum(MakeFormatStringAssembly(column.format, obj, propSections, elemAttrs, column.empty));
							}
						}
					}
					break;
				}
			});
		});
	}
	
}

function isPartListDisplay(obj, propSections, elemAttrs) {

	if (!obj || !propSections || !elemAttrs) {
		return false;
	}
	var attr = elemAttrs[obj.elementId];
	if (!attr) {
		return false;
	}	
	if(attr.groupClass !== lt.GROUP_CLASS_NORMAL){
		return false;
	}
	
	if (partListParam.filterProperty && partListParam.filterProperty == 'fill' 
			&& partListParam.filterPropertyName !== undefined) {
		if (!isMatchFormatStringAssembly(partListParam.filterPropertyName, obj, propSections)) {
			return false;
		}
	} else if (partListParam.filterProperty && partListParam.filterProperty == 'value' 
			&& partListParam.filterPropertyName !== undefined && partListParam.filterPropertyValue !== undefined) {
		if (!isMatchFormatStringAssembly(partListParam.filterPropertyName, obj, propSections, partListParam.filterPropertyValue)) {
			return false;
		}
	}
	
	var type = attr.groupType;
	switch (partListParam.type) {
	case 'assembly':
		return type === lt.GROUP_TYPE_ASSEMBLY || type === lt.GROUP_TYPE_EMPTY || type === lt.GROUP_TYPE_ERRROR;
	case 'part':
		return type === lt.GROUP_TYPE_PART || type === lt.GROUP_TYPE_EMPTY || type === lt.GROUP_TYPE_ERRROR;
	case 'all':
		return type === lt.GROUP_TYPE_ASSEMBLY || type === lt.GROUP_TYPE_PART || type === lt.GROUP_TYPE_EMPTY || type === lt.GROUP_TYPE_ERRROR;
	default:
		return false;
	}	
}