SnapshotList = function(params) {
	'use strict';
	var self = this;
	this.controller = null;
	this.player;
	this.mainGrid;
	this.grid;
	this.columns;
	this.order;
	this.sort;
	this.isDispAssembly = false;
	this.isDispComponent = false;

	this.requiredJsonUrls = [ snapshotlistcacheurl ];

	if (params === undefined) {
		throw new Error('ltError: Required argument. method=SnapshotList, argument=params');
	} else {
		Object.keys(params).forEach(function(key) {
			self[key] = params[key];
		});
	}
	
	this.update = function(params) {
		if (!self.isDispComponent || params.selfObj === this) {
			return;
		}
		
		var dom = Ext.ComponentQuery.query('snapshotlist[name=snapshotlist]')[0];

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

			Ext.each(groups, function(grp) {
				selGrpNames[grp.userId] = true;
			});
			if(groups.length > 0){
				lastSelKey = groups[groups.length - 1].userId;
			}

			Ext.each(data.items, function(item) {
				if (selGrpNames[item.data.Key]) {
					selection.push(item);
					if(lastSelKey == item.data.Key){
						lastSelNode = item;
					}
				}
			});

			dom.setSelection(selection);
			if(lastSelNode){
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
		case 'APPLY_SNAPSHOT':
			
			var snapIndex = params.updateTagetElems;
			if (Ext.isEmpty(snapIndex)) {
				break;
			}
			
			var snapParams = player.model.getSnapshotParameters(snapIndex);
			if (snapParams == null) {
				break;
			}
			
			var selItem = null;
			var store = dom.getStore();
			var data = store.getData();
			Ext.each(data.items, function(item) {
				if (item.data.snapID == snapParams.snapshotID) {
					selItem = item;
					return false;
				}
			});
			
			if (!Ext.isEmpty(selItem)) {
				var selModel = dom.getSelectionModel();
				selModel.select([selItem], false, true);
				dom.getView().focusRow(selItem);
			}
			
			break;
		default:
			break;
		}
	}
	
	this.registController = function(controller) {
		this.controller = controller;
	}

	this.createSnapshotList = function() {
		if (!self.isDispComponent) {
			return;
		}
		
		metaJsonLoaded[snapshotlistcacheurl].then(function(jsonData) {

			var store = Ext.create('Ext.data.Store', {
				data: {
					items: function() {
						var val = [];
						self.getSnapshotListData(val, jsonData);
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

			var dom = Ext.ComponentQuery.query('snapshotlist[name=snapshotlist]')[0];
			dom.setStore(store);
			
			var sortNo = Number(snapshotParam['sort']);
			var direction = snapshotParam['order'];
			if (!isNaN(sortNo) && !Ext.isEmpty(direction)) {
				var idx = 0;
				Ext.each(snapshotParam.columns, function(column) {
					if (idx == sortNo - 1) {
						store.sort(column.name, direction.toUpperCase());
						return false;
					}
					idx++;
				});
			}
		});
	}
	
	this.getSnapshotListData = function(val, jsonData) {

		var propSections = [];

		if (!propSections.isSetData && jsonData && jsonData.defs && jsonData.defs.attributeDef) {
			Ext.each(jsonData.defs.attributeDef, function(def) {
				if (propSections[def.section] === undefined) {
					propSections[def.section] = [];
				}
				propSections[def.section].push(def);
			});
			propSections.isSetData = true;
		}

		if (jsonData && jsonData.topSnapshot) {
			if (jsonData.topSnapshot.snapshot) {
				Ext.each(jsonData.topSnapshot.snapshot, function(obj) {
					addSnapRow(obj, val, propSections);
				});
			}
			
			if (jsonData.topSnapshot.snapshotFolder) {
				Ext.each(jsonData.topSnapshot.snapshotFolder, function(obj) {
					self.setSnapChildData(obj, val, propSections);
				});
			}
		}
	}

	this.setSnapChildData = function(childgroup, val, propSections) {

		var self = this;
		
		if (childgroup.snapshot) {
			Ext.each(childgroup.snapshot, function(obj) {
				addSnapRow(obj, val, propSections);
			});
		}
		
		if (childgroup.snapshotFolder) {
			Ext.each(childgroup.snapshotFolder, function(obj) {
				self.setSnapChildData(obj, val, propSections);
			});
		}
	}
}

function addSnapRow(obj, val, propSections) {

	if (!Ext.isEmpty(obj.target) &&
			obj.target == 'process') {
		return;
	}
	
	var addedName = false;
	var part = {};

	part.Key = String(obj.name);
	part.snapID = Number(obj.snapID);

	Ext.each(snapshotParam.columns, function(column) {
		part[column.name] = MakeSnapFormatStringList(column.format, obj, propSections);
	});

	if (!addedName) {
		val.push(part);
	}
}

function MakeSnapFormatStringList(altNameFormat, obj, propSections) {

	var arrayOther = [], 
	arraySection = [], 
	arrayProperty = [], 
	str = "", nCurSec = 0, nSection = arraySection.length, strSection, strProperty, strOther, strFormat, strValue;

	analyzeNameFormat(altNameFormat, arrayOther, arraySection, arrayProperty);

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
			
			var fmtSpType = ChkSnapFmtSpType(strFormat);
			switch (fmtSpType) {
			case 1:
				//  ${NAME}
				if (!Ext.isEmpty(obj.name)) {
					strValue = replaceDisplayStr(obj.name);			
				}
				break;
			case 2:
				// ${THUMBNAIL}
				strValue = "";
				strOther = "";
				nCurSec = nSection;
				if (Ext.isEmpty(obj.image)) {
					str = "NoImage";
				} else {
					str = '<img src=' + strTrim + obj.image + ' />';
				}
				break;
			default:
				strValue = replaceDisplayStr(GetAssemblyFormat(strFormat, obj, propSections));
				break;
			}
		} else {
			strValue = "";
		}

		str = str + strOther + strValue;

	}

	return str;
}

function ChkSnapFmtSpType(format) {

	if (format === "") {
		return 0;
	} else if (format === "${NAME}") {
		return 1;
	} else if (format === "${THUMBNAIL}") {
		return 2;
	}

	return 0;
}
