SemanticPmiList = function(params) {
	'use strict';
	var self = this;
	var jsonData = null;
	this.controller = null;
	this.player = null;
	this.isDispComponent = false;
	this.requiredJsonUrls = [ pmicacheurl ];

	if (params === undefined) {
		throw new Error('ltError: Required argument. method=SemanticPmiList, argument=params');
	} else {
		Object.keys(params).forEach(function(key) {
			self[key] = params[key];
		});
	}

	this.registController = function(controller) {
		this.controller = controller;
	}

	this.update = function(params) {
		if (!self.isDispComponent || params.selfObj === this) {
			return;
		}

		var dom = Ext.ComponentQuery.query('semanticpmilist[name=semanticpmilist]')[0];

		switch (params.updateType) {

		case 'SELECT_ON':
		case 'SELECT_OFF':
			updateSelect(dom);
			break;

		case 'SELECT_CLEAR':
			if (params.isHome) {
				updateStore(dom.getStore());
			}
			clearSelect(dom);
			break;

		case 'APPLY_SNAPSHOT':
			updateStore(dom.getStore());
			break;

		case 'HIGHLIGH_PMIS':
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
			if (Ext.isEmpty(displaySettings) || Ext.isEmpty(displaySettings.associatedHighlightColorPMI)){
				break;
			}
			var associatedHighlightColorPMI = ( '000000' + displaySettings.associatedHighlightColorPMI.toString( 16 ) ).slice( - 6 );
			if (Ext.isEmpty(associatedHighlightColorPMI)) {
				break;
			}
			associatedHighlightColorPMI = '#' + associatedHighlightColorPMI;
			
			view.samanticPmiListAssociatedHighlightColorPMIItemCls = "x-grid-item-samanticPmiListAssociatedHighlightColorPMI";
			
			var reflectMap = {};
			Ext.each(params.updateTagetElems, function(elem) {
				reflectMap[elem] = true;
			});				
			
			var nodes = Ext.select('.' + view.samanticPmiListAssociatedHighlightColorPMIItemCls);
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
				if (Ext.isEmpty(record) || Ext.isEmpty(record.data) || Ext.isEmpty(record.data.refJsonNode) || Ext.isEmpty(record.data.refJsonNode.name)){
					continue;
				}
				
				if (reflectMap[record.data.refJsonNode.name]) {
					view.addItemCls(index, view.samanticPmiListAssociatedHighlightColorPMIItemCls);
				} else {
					view.removeItemCls(index, view.samanticPmiListAssociatedHighlightColorPMIItemCls);
				}
			}
			
			nodes = Ext.select('.' + view.samanticPmiListAssociatedHighlightColorPMIItemCls);
			Ext.each(nodes, function(node) {
				node.setStyle('background-color', associatedHighlightColorPMI);
			});		
			break;
		default:
			break;
		}
	}

	this.create = function() {
		if (!self.isDispComponent) {
			return;
		}

		metaJsonLoaded[pmicacheurl].then(function(jsonDataTmp) {
			
			jsonData = jsonDataTmp;
			
		}).always(function() {
			
			var store = createStore();
			sortStore(store);

			var dom = Ext.ComponentQuery.query('semanticpmilist[name=semanticpmilist]')[0];
			dom.setStore(store);
		});
	}

	function updateSelect(dom) {

		var store = dom.getStore();
		var data = store.getData();

		var selPMIs = player.model.getSelectionsPMI();
		var selPMIsMap = Ext.Array.toMap(selPMIs, function(selPMI) {
			return selPMI.group.userId;
		});

		var selRows = [];
		var lastSelRow = null;
		Ext.each(data.items, function(item) {

			if (Ext.isEmpty(item.data.refJsonNode)) {
				return;
			}

			if (!Ext.isEmpty(selPMIsMap[item.data.refJsonNode.name])) {
				selRows.push(item);
				lastSelRow = item;
			}
		});

		dom.getSelectionModel().deselectAll(false);
		if (!Ext.isEmpty(selRows)) {
			dom.setSelection(selRows);
		}
		if (!Ext.isEmpty(lastSelRow)) {
			dom.getView().focusRow(lastSelRow);
		}
	}

	function clearSelect(dom) {

		if (Ext.isEmpty(params.noClear) && params.noClear == true) {
			return;
		}

		var selModel = dom.getSelectionModel();
		selModel.deselectAll(false);
	}

	function createStore() {

		return Ext.create('Ext.data.Store', {
			data: createData(),
			proxy: {
				type: 'memory',
				reader: {
					type: 'json',
					rootProperty: 'items'
				}
			}
		});
	}

	function sortStore(store) {
		var paramColumns = semanticPmiListParam.columns;
		if (Ext.isEmpty(paramColumns)) {
			return;
		}

		var paramSort = null;
		if (!Ext.isEmpty(semanticPmiListParam.sort)) {
			paramSort = Number(semanticPmiListParam.sort) - 1;
		}

		var paramOrder = semanticPmiListParam.order;
		if (Ext.isEmpty(paramOrder)) {
			return;
		}

		if (!Ext.isEmpty(paramSort) && paramSort < paramColumns.length) {
			store.sort(semanticPmiListParam.columnTextPrefix + paramColumns[paramSort].no, paramOrder.toUpperCase());
		} else {
			store.sort("index", paramOrder.toUpperCase());
		}
	}

	function updateStore(store) {
		store.setData(createData());
	}

	function createData() {

		if (Ext.isEmpty(jsonData)) {
			return;
		}

		var propSections = [];
		if (!Ext.isEmpty(jsonData.defs) && !Ext.isEmpty(jsonData.defs.attributeDef)) {

			Ext.each(jsonData.defs.attributeDef, function(attributeDefOne) {
				if (Ext.isEmpty(propSections[attributeDefOne.section])) {
					propSections[attributeDefOne.section] = [ attributeDefOne ];
				} else {
					propSections[attributeDefOne.section].push(attributeDefOne);
				}
			});
		}

		var data = [];
		if (!Ext.isEmpty(jsonData.topPMI) && !Ext.isEmpty(jsonData.topPMI.PMI)) {

			var index = 0;
			Ext.each(jsonData.topPMI.PMI, function(PMIOne) {

				if (!isVisibleRow(PMIOne)) {
					return;
				}

				data.push(createRow(PMIOne, propSections, index));
				index += 1;
			});
		}
		return data;
	}

	function createRow(jsonNode, propSections, index) {

		var row = {};
		row.refJsonNode = jsonNode;
		row.index = index;
		Ext.each(semanticPmiListParam.columns, function(column) {
			row[semanticPmiListParam.columnTextPrefix + column.no] = resolveFormat(column.format, jsonNode, propSections);
		});
		return row;
	}

	function resolveFormat(src, jsonNode, propSections) {

		var arrayOther = [];
		var arraySection = [];
		var arrayProperty = [];
		analyzeNameFormat(src, arrayOther, arraySection, arrayProperty);

		var dst = '';
		Ext.each(arraySection, function(curSection, curIndex) {

			var curProperty = arrayProperty[curIndex];
			var curOther = arrayOther[curIndex];

			var curFormat = '';
			if (!Ext.isEmpty(curProperty)) {
				if (!Ext.isEmpty(curSection)) {
					curFormat = '${' + curSection + '}.{' + curProperty + '}';
				} else {
					curFormat = '${' + curProperty + '}';
				}
			}

			var curValue = '';
			if (!Ext.isEmpty(curFormat)) {
				switch (curFormat) {
				case '${NAME}':
					curValue = createName(jsonNode);
					break;
				case '${NOTEDIM}':
					curValue = createNoteDim(jsonNode);
					break;
				case '${TYPE}':
					curValue = createType(jsonNode);
					break;
				default:
					curValue = GetAssemblyFormat(curFormat, jsonNode, propSections);
					break;
				}
			}

			dst = dst + curOther + curValue;
		});

		return dst;
	}

	function createName(jsonNode) {

		if (Ext.isEmpty(jsonNode) || Ext.isEmpty(jsonNode.name)) {
			return '';
		}
		return jsonNode.name;
	}

	function createNoteDim(jsonNode) {
		if (Ext.isEmpty(jsonNode)) {
			return '';
		}

		if (Ext.isEmpty(jsonNode.PMIType)) {
			return '';
		} else if (jsonNode.PMIType == 'note' || jsonNode.PMIType == 'dimension') {

			if (Ext.isEmpty(jsonNode.text)) {
				return '';
			} else {
				return jsonNode.text;
			}
		} else if (jsonNode.PMIType == 'semanticPMI') {

			if (Ext.isEmpty(jsonNode.mainValue) || Ext.isEmpty(jsonNode.mainValue.text)) {
				return '';
			} else {
				return jsonNode.mainValue.text;
			}
		} else {
			return '';
		}
	}

	function createType(jsonNode) {

		if (Ext.isEmpty(jsonNode)) {
			return '';
		}

		if (Ext.isEmpty(jsonNode.PMIType)) {
			return '';
		} else if (jsonNode.PMIType == 'note') {
			return web3d.CST.XVL_WEB3D_PMITYPE_NOTE;
		} else if (jsonNode.PMIType == 'dimension') {
			return web3d.CST.XVL_WEB3D_PMITYPE_DIMENSION;
		} else if (jsonNode.PMIType == 'semanticPMI') {

			if (Ext.isEmpty(jsonNode.semPMIType)) {
				return '';
			} else if (jsonNode.semPMIType == 'views') {
				return web3d.CST.XVL_WEB3D_PMITYPE_SEMANTICPMI_VIEWS;
			} else if (jsonNode.semPMIType == 'datums') {
				return web3d.CST.XVL_WEB3D_PMITYPE_SEMANTICPMI_DATUMS;
			} else if (jsonNode.semPMIType == 'geomTols') {
				return web3d.CST.XVL_WEB3D_PMITYPE_SEMANTICPMI_GEOMTOLS;
			} else if (jsonNode.semPMIType == 'dimensions') {
				return web3d.CST.XVL_WEB3D_PMITYPE_SEMANTICPMI_DIMENSIONS;
			} else if (jsonNode.semPMIType == 'roughness') {
				return web3d.CST.XVL_WEB3D_PMITYPE_SEMANTICPMI_ROUGHNESS;
			} else if (jsonNode.semPMIType == 'notes') {
				return web3d.CST.XVL_WEB3D_PMITYPE_SEMANTICPMI_NOTES;
			} else if (jsonNode.semPMIType == 'welds') {
				return web3d.CST.XVL_WEB3D_PMITYPE_SEMANTICPMI_WELDS;
			} else if (jsonNode.semPMIType == 'symbols') {
				return web3d.CST.XVL_WEB3D_PMITYPE_SEMANTICPMI_SYMBOLS;
			} else {
				return '';
			}
		} else {
			return '';
		}
	}

	function isVisibleRow(jsonNode) {

		if (semanticPmiListParam.snapshot != 'true') {
			return true;
		}

		if (Ext.isEmpty(view3DObj.curSnapIndex)) {
			return true;
		}

		var curSnap = player.model.getSnapshotParameters(view3DObj.curSnapIndex);
		if (curSnap == null) {
			return true;
		}

		return Ext.Array.some(jsonNode.refSnapshot, function(refSnapOne) {
			return refSnapOne.name == curSnap.name;
		});
	}
}
