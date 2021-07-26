LayerListAdv = function(params) {
	'use strict';
	var self = this;
	this.controller = null;
	this.player;
	this.mainGrid;
	this.grid;
	this.columns;
	this.order;
	this.sort;
	this.isDispComponent = false;

	this.requiredJsonUrls = [ layerlistcacheurl, pmilistNotecacheurl, pmilistDimentioncacheurl ];

	if (params === undefined) {
		throw new Error(
				'ltError: Required argument. method=LayerList, argument=params');
	} else {
		Object.keys(params).forEach(function(key) {
			self[key] = params[key];
		});
	}

	this.update = function(params) {
		if (!self.isDispComponent || params.selfObj === this) {
			return;
		}

		var dom = Ext.ComponentQuery.query('layerlistAdv[name=layerlistAdv]')[0];

		var selGrpIds = [], sels = [];
		switch (params.updateType) {
		case 'SELECT_ON':
		case 'SELECT_OFF':

			var groups = player.model.getSelections();
			var selGrpNames = [];
			var selGrpTypes = [];
			var selection = [];
			var store = dom.getStore();
			var data = store.getData();
			var lastSelKey;
			var lastSelNode;
			var obj, userIdBase, grp;

			Ext.each(groups, function(grp) {
				selGrpNames[grp.userId] = true;
				selGrpTypes[grp.userId] = grp.groupType;
				if (grp.groupType == lt.GROUP_TYPE_PART || grp.groupType == lt.GROUP_TYPE_ERRROR) {
					var parent = grp.getParent();
					while (!Ext.isEmpty(parent)) {
						selGrpNames[parent.userId] = true;
						selGrpTypes[parent.userId] = parent.groupType;
						parent = parent.getParent();
					}
				}
			});

			if (groups.length > 0) {
				lastSelKey = groups[groups.length - 1].userId;
			}

			Ext.each(data.items, function(item) {
				Ext.each(item.data.group, function(grp) {
					var gr0 = player.model.getGroupsByUserId(grp);
					if (!Ext.isEmpty(gr0) && gr0[0].groupType == lt.GROUP_TYPE_BODY && gr0[0].groupClass != lt.GROUP_CLASS_COMMENT && gr0[0].groupClass != lt.GROUP_CLASS_DIMENSION) {
						grp = gr0[0].getParent().userId;
					}
					if (selGrpNames[grp] && selGrpTypes[grp] != lt.GROUP_TYPE_SHELL) {
						selection.push(item);
						if (lastSelKey == grp) {
							lastSelNode = item;
						}
					}
				});
				Ext.each(item.data.shell, function(sh) {
					if (selGrpNames[sh] && selGrpTypes[sh] == lt.GROUP_TYPE_SHELL) {
						selection.push(item);
						if (lastSelKey == sh) {
							lastSelNode = item;
						}
					}
				});
			});

			dom.setSelection(selection);
			if (lastSelNode) {
				dom.getView().focusRow(lastSelNode);
			}

			if (selection.length == 0) {
				var sm = dom.getSelectionModel();
				sm.deselectAll(false);
			}

			break;
		case 'SELECT_CLEAR':
			var selModel = dom.getSelectionModel();
			selModel.deselectAll(false);
			break;
		default:
			break;
		}
	}

	this.registController = function(controller) {
		this.controller = controller;
	}

	this.createLayerList = function() {
		if (!self.isDispComponent) {
			return;
		}

		metaJsonLoaded[layerlistcacheurl].then(function() {

			var store = Ext.create('Ext.data.Store', {
				data : {
					items : function() {
						var val = [];
						self.getLayerListData(val, layerlistJsonData);
						return val;
					}()
				},

				proxy : {
					type : 'memory',
					reader : {
						type : 'json',
						rootProperty : 'items'
					}
				}
			});

			var dom = Ext.ComponentQuery
					.query('layerlistAdv[name=layerlistAdv]')[0];
			if (dom) {
				var columns0 = [];
				Ext.each(layerListAdvParam.columns, function(column) {
					var val = {};
					val.text = column.name;
					val.dataIndex = column.name;
					val.width = column.width;

					if (column.wrap == "true"){
						val.cellWrap = true;
					}
					if (column.filtering == "true"){
						val.filter = 'list';
					}
					columns0.push(val);
				});
				dom.reconfigure(store, columns0);

				var sortNo = Number(layerListAdvParam['sort']);
				var direction = layerListAdvParam['order'];
				if (!isNaN(sortNo) && !Ext.isEmpty(direction)) {
					var idx = 0;
					Ext.each(layerListAdvParam.columns, function(
							column) {
						if (idx == sortNo - 1) {
							store.sort(column.name, direction
									.toUpperCase());
							return false;
						}
						idx++;
					});
				}
			}
		});
	}

	this.getLayerListData = function(val, jsonData) {

		getLayerData(jsonData);

		if (Ext.isEmpty(jsonData) || Ext.isEmpty(jsonData.topLayer)) {
			return;
		}

		var displayLayer = self.GetDisplayLayer(jsonData);

		self.setChildData(jsonData.topLayer, val, layerPropSections, displayLayer);
	}

	this.GetDisplayLayer = function(jsonData) {
		var displayLayer = [];
		if (Ext.isEmpty(jsonData) || Ext.isEmpty(jsonData.topLayer) || Ext.isEmpty(jsonData.topLayer.layer)) {
			return displayLayer;
		}
		var layers = jsonData.topLayer.layer;
		Ext.each(layers, function(layer0) {
			if (Ext.isEmpty(layer0.name)) {
				return;
			}
			var pos = layer0.name.search('_');
			if (pos === -1) {
				displayLayer.push(layer0.name);
			} else {
				var checkName = layer0.name.substr(0, pos);
				var isFind = Ext.Array.some(layers, function (layer1) {
					if (Ext.isEmpty(layer1.name)) {
						return;
					}
					var pos = layer1.name.search('_');
					return pos === -1 && layer1.name === checkName;
				});
				if (!isFind) {
					displayLayer.push(layer0.name);
				}
			}
		});
		return displayLayer;
	}

	this.setChildData = function(childgroup, val, propSections, displayLayer) {

		var self = this;

		if (Ext.isEmpty(childgroup) || Ext.isEmpty(childgroup.layer)) {
			return;
		}

		var addedNames = [];
		var idx = 1;
		Ext.each(childgroup.layer, function(obj) {

			if (Ext.isEmpty(obj)) {
				return true;
			}

			if (!Ext.Array.some(displayLayer, function (v) { return v === obj.name; })) {
				return;
			}

			self.addRow(obj, val, addedNames, propSections, idx);
			idx++;
		});
	}

	this.addRow = function(obj, val, addedRows, propSections, index) {

		var part = {};

		part['name'] = obj.name;

		Ext.each(layerListAdvParam.columns, function(column) {
			var str = self.MakeLayerFormatStringList(column.format, obj,
					propSections, column.type, index);
			var num = Number(str);
			if (str == '' || isNaN(num)) {
				part[column.name] = str;
			} else {
				part[column.name] = num;
			}
		});

		var groups = [];
		Ext.each(obj.group, function(grp) {
			groups.push(grp.name);
		});
		var shells = [];
		Ext.each(obj.shell, function(shell) {
			shells.push(shell.name);
		});

		part["group"] = groups;
		part["shell"] = shells;
		val.push(part);
	}

	this.MakeLayerFormatStringList = function(altNameFormat, obj, propSections,
			layerType, index) {

		var arrayOther = [], arraySection = [], arrayProperty = [], str = "", nCurSec = 0, nSection = arraySection.length, strSection, strProperty, strOther, strFormat, strValue;

		analyzeNameFormat(altNameFormat, arrayOther, arraySection,
				arrayProperty);

		nCurSec = 0;
		nSection = arraySection.length;

		for (nCurSec = 0; nCurSec < nSection; nCurSec++) {

			strSection = arraySection[nCurSec];
			strProperty = arrayProperty[nCurSec];
			strOther = arrayOther[nCurSec];

			strFormat = "";
			strValue = "";

			if (strProperty !== "") {

				if (strSection !== "") {
					strFormat = "${" + strSection + "}.{" + strProperty + "}";
				} else {
					strFormat = "${" + strProperty + "}";
				}

				switch (layerType) {
				case 1:
					var fmt = self.ChkLayerFmtSpType(strFormat);

					switch (fmt) {
					case 1:
						var listNames = [];

						if (!Ext.isEmpty(obj.group)) {
							Ext.each(obj.group, function(group) {
								listNames.push(group.name);
							});
						}
						if (!Ext.isEmpty(obj.shell)){
							var shellName = "";
							Ext.each(obj.shell, function(shell){
								listNames.push(shell.name);
							});
						}
						if (!Ext.isEmpty(listNames)){
							strValue = listNames.join(',');
						} else {
							strValue = "";
						}


						break;
					case 2:
						strValue = index;
						break;
					default:
						strValue = GetAssemblyFormat(strFormat, obj,
								propSections);
						break;
					}

					break;
				case 2:
					var fmt = self.ChkLayerFmtSpType(strFormat);
					switch (fmt) {
					case 1:
						if (!Ext.isEmpty(obj.group)) {
							var elementNames = [];
							Ext.each(obj.group, function(group) {
								elementNames.push(group.name);
							});

							var elementGroups = player.model
									.getGroupsByElementIds(elementNames);

							var childrenGroups = [];
							var children = [];
							var elementName = "";

							Ext.each(elementGroups, function(grp) {
								childrenGroups.push(grp.getChildren());
							});

							if (!Ext.isEmpty(childrenGroups)) {
								Ext.each(childrenGroups, function(childgrps) {
									Ext.each(childgrps, function(child) {
										elementName = elementName
												+ child.userId + ",";
									});
								});
							}

							strValue = elementName.slice(0, -1);
						}
						break;
					case 2:
						strValue = index;
						break;
					default:
						var elementNames = [];
						Ext.each(obj.group, function(group) {
							elementNames.push(group.name);
						});

						var elementGroups = player.model
								.getGroupsByElementIds(elementNames);

						var properties = [];
						var elementName = "";

						Ext.each(elementGroups, function(grp) {

							if (!Ext.isEmpty(grp)){

								if (grp.groupClass == lt.GROUP_CLASS_NORMAL){
									if (!grp.groupType == lt.GROUP_TYPE_BODY){

										var object = assemblyObjects[grp.elementId];

										if (!Ext.isEmpty(object)){
										properties.push(GetAssemblyFormat(strFormat, object, assemblyPropSections));
										}
									}
								} else if (grp.groupClass == lt.GROUP_CLASS_COMMENT) {

									var object = noteObjects[grp.elementId];

									if (!Ext.isEmpty(object)){
									properties.push(GetAssemblyFormat(strFormat, object, notePropSections));
									}


								} else if (grp.groupClass == lt.GROUP_CLASS_DIMENSION){

									var object = dimensionObjects[grp.elementId];

									if (!Ext.isEmpty(object)){
										properties.push(GetAssemblyFormat(strFormat, object, dimensionPropSections));
									}
								}
							}
						});

						if (!Ext.isEmpty(properties)) {
							Ext.each(properties, function(property) {
								elementName = elementName + property + " ";
							});
						}

						strValue = elementName.slice(0, -1);
						break;
					}
					break;
				default:
					strValue = "";
					break;
				}
			} else {

				strValue = "";
			}
			str = str + strOther + strValue;
		}
		return str;
	}

	this.ChkLayerFmtSpType = function(format) {

		if (format === "") {
			return 0;
		} else if (format === "${NAMES}") {
			return 1;
		} else if (format === "${SEQ}") {
			return 2;
		}

		return 0;
	}

	this.GetGroupProperty = function (elementId, propertyId) {
		var assemblyObject = assemblyObjects[elementId];
		if (Ext.isEmpty(assemblyObject)) return null;

		var value = null;
		var attribute = assemblyObject.attribute;
		Ext.each(attribute, function (property) {
			if (property.ref == propertyId) {
				value = property.text;
				return false;
			}
		});

		return value;
	};
}