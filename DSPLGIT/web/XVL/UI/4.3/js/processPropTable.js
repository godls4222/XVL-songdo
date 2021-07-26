ProcessPropTable = function(params) {
	'use strict';
	var self = this;
	this.player = params.player;
	this.controller = null;
	this.property = null;
	this.isDispComponent = false;
	this.isDispOverlay = false;
	this.requiredJsonUrls = [
		assemblycacheurl,
		processcacheurl,
		manufacturecacheurl,
		resourcelistcacheurl
	];
	this.overlayId = null;

	if (params === undefined) {
		throw new Error('ltError: Required argument. method=ProcessPropTable, argument=params');
	} else {
		Object.keys(params).forEach(function(key) {
			self[key] = params[key];
		});
	}

	this.update = function(params) {
		if (!self.isDispComponent && !self.isDispOverlay) {
			return;
		}
		if (params.selfObj === this) {
			return;
		}
		switch (params.updateType) {
		case 'SELECT_WORK':
			self.setPropertyComponent(params.updateTagetElems);
			break;
		case 'SELECT_ON':
		case 'SELECT_OFF':
			break;
		case 'SELECT_CLEAR':
			self.clearSelectComponent();
			break;
		case 'PROC_ANIM_END':
			self.setVisibleOverlay(false);
			break;
		case 'PROC_ANIM_CHANGE_WORK':
			self.setVisibleOverlay(true);
			self.setPropertyOverlay(params.updateTagetElems);
			break;
		default:
			break;
		}
	};

	this.registController = function(controller) {
		this.controller = controller;
	};
	
	this.create = function() {
		self.createOverlay();
	};
	
	function removePercent(str, defVal) {
		if (Ext.isEmpty(str)) {
			return defVal;
		}
		var groups = str.match(/^(\d+) *%$/);
		if (!Ext.isEmpty(groups) && groups.length > 1) {
			return parseInt(groups[1]);
		} else {
			return defVal;
		}
	}
	
	this.createOverlay = function() {
		if (!self.isDispOverlay) {
			return;
		}
		try {
			var overlayConfig = {
				visible: false
			};
			if (!Ext.isEmpty(processPropTableParam.height)) {
				overlayConfig.height = removePercent(processPropTableParam.height, 0);
			}
			if (!Ext.isEmpty(processPropTableParam.width)) {
				overlayConfig.width = removePercent(processPropTableParam.width, 0);
			}
			if (!Ext.isEmpty(processPropTableParam.positionTop)) {
				overlayConfig.positionTop = removePercent(processPropTableParam.positionTop, 0);
			}
			if (!Ext.isEmpty(processPropTableParam.positionLeft)) {
				overlayConfig.positionLeft = removePercent(processPropTableParam.positionLeft, 0);
			}
			if (!Ext.isEmpty(processPropTableParam.positionBottom)) {
				overlayConfig.positionBottom = removePercent(processPropTableParam.positionBottom, 0);
			}
			if (!Ext.isEmpty(processPropTableParam.positionRight)) {
				overlayConfig.positionRight = removePercent(processPropTableParam.positionRight, 0);
			}
			if (!Ext.isEmpty(processPropTableParam.fontFamily)) {
				overlayConfig.fontFamily = processPropTableParam.fontFamily;
			}
			if (!Ext.isEmpty(processPropTableParam.fontSize)) {
				overlayConfig.fontSize = processPropTableParam.fontSize;
			}
			if (!Ext.isEmpty(processPropTableParam.fontStyle)) {
				overlayConfig.fontStyle = processPropTableParam.fontStyle;
			}
			if (!Ext.isEmpty(processPropTableParam.fontWeight)) {
				overlayConfig.fontWeight = processPropTableParam.fontWeight;
			}
			if (!Ext.isEmpty(processPropTableParam.fontColor)) {
				overlayConfig.fontColor = processPropTableParam.fontColor;
			}
			if (!Ext.isEmpty(processPropTableParam.backColor)) {
				overlayConfig.backColor = processPropTableParam.backColor;
			}
			if (!Ext.isEmpty(processPropTableParam.backTransparency)) {
				overlayConfig.backTransparency = processPropTableParam.backTransparency;
			}
			self.overlayId = player.addOverlay(overlayConfig);
		} catch(e) {
			Ext.log({ msg:e });
		}
	};
	
	this.clearSelectComponent = function() {
		if (!self.isDispComponent) {
			return;
		}
		
		var doms = Ext.ComponentQuery.query('processPropTable[name=processPropTable]');
		if (!Ext.isEmpty(doms)) {
			doms[0].getSelectionModel().deselectAll();
		}
	};
	
	this.findJsonNodeByBomId = function(bomId) {
		var procJsonNode = null;
		if (!Ext.isEmpty(bomId)) {
			Ext.each(Object.keys(processObjects), function(key) {
				var processObject = processObjects[key];
				if (!Ext.isEmpty(processObject.bomId) && processObject.bomId == bomId) {
					procJsonNode = processObject;
					return false;
				}
				return true;
			});
		}
		return procJsonNode;
	};
	
	this.setPropertyComponent = function(bomId) {
		if (!self.isDispComponent) {
			return;
		}
		
		var dom = Ext.ComponentQuery.query('processPropTable[name=processPropTable]')[0];
		if (Ext.isEmpty(dom)) {
			return;
		}

		var procJsonNode = self.findJsonNodeByBomId(bomId);
		var store = dom.getStore();
		self.updateStore(store, procJsonNode);
		dom.setStore(store);
	};
	
	this.setPropertyOverlay = function(elementId) {
		if (!self.isDispOverlay) {
			return;
		}
		if (Ext.isEmpty(self.overlayId)) {
			return;
		}
		
		var procJsonNode = processObjects[elementId];
		var lines = [];
		Ext.each(processPropTableParam.property, function(property) {
			var line = '';
			if (processPropTableParam.showName) {
				line += property.name + ': ';
			}
			line += self.createPropValue(procJsonNode, property.format, property.type);
			lines.push(line);
		});
		
		var str = lines.join('\r\n');
		player.setOverlayString(self.overlayId, str);
	};
	
	this.setVisibleOverlay = function(visible) {
		if (!self.isDispOverlay) {
			return;
		}
		if (Ext.isEmpty(self.overlayId)) {
			return;
		}
		player.setOverlayVisibility(self.overlayId, visible);
	}

	this.updateStore = function(store, procJsonNode) {

		Ext.each(store.data.items, function(item) {

			var propFormat = item.data.format;
			var propType = item.data.type;
			item.data[1] = self.createPropValue(procJsonNode, propFormat, propType);
		});
	};

	this.createPropValue = function(procJsonNode, propFormat, propType) {

		if (Ext.isEmpty(procJsonNode)) {
			return '';
		}

		var childNodes = self.getProcJsonNodeChildren(procJsonNode);

		var propValues = [];
		switch (propType) {
		case 'prop':
			propValues.push(self.resolveFormatByProc(propFormat, procJsonNode));
			break;
		case 'partprop':
			Ext.each(childNodes.groups, function(group) {
				propValues.push(self.resolveFormatByGroup(propFormat, group));
			});
			break;
		case 'toolprop':
			Ext.each(childNodes.resourceRefs, function(resourceRef) {
				propValues.push(self.resolveFormatByResource(propFormat, resourceRef));
			});
			break;
		case 'qty':
			propValues.push(String(childNodes.groups.length));
			break;
		}
		return propValues.join(',');
	}

	this.getProcJsonNodeChildren = function(procJsonNode) {

		var nodeTmp = getProcessCurVari(procJsonNode);
		var isVariationJsonNode = procJsonNode != nodeTmp;
		if (isVariationJsonNode) {
			return {
				groups: nodeTmp.group,
				resourceRefs: nodeTmp.resourceRef
			};
		} else {
			return {
				groups: nodeTmp.node,
				resourceRefs: nodeTmp.resourceRef
			};
		}
	}

	this.resolveFormatByProc = function(format, procJsonNode) {
		return MakeFormatStringAssembly(format, procJsonNode, processPropSections, processModelAttrs);
	};

	this.resolveFormatByGroup = function(format, groupJsonNode) {
		var manuJsonNode = manufactureObjects[groupJsonNode.entityId];
		var assyJsonNode = assemblyObjects[groupJsonNode.name];
		if (!Ext.isEmpty(manuJsonNode)) {
			return MakeFormatStringAssembly(format, manuJsonNode, manufacturePropSections, null);
		} else if (!Ext.isEmpty(assyJsonNode)) {
			return MakeFormatStringAssembly(format, assyJsonNode, assemblyPropSections, assemblyModelAttrs);
		} else {
			return '';
		}
	};

	this.resolveFormatByResource = function(format, resourceRefJsonNode) {
		var resourceJsonNode = resourceObjects[resourceRefJsonNode.group.name];
		return MakeFormatStringAssembly(format, resourceJsonNode, resourcePropSections, null);
	};
};
