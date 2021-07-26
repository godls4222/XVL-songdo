PmiList = function(params) {
	'use strict';
	var self = this;
	this.controller = null;
	this.player;
	this.mainGrid;
	this.grid;
	this.columns;
	this.type;
	this.order;
	this.sort;
	this.isDispAssembly = false;
	this.isDispComponent = false;
	PmiList.rowSelectedCol = '_#rowselected';
	PmiList.pmiNote = 0;
	PmiList.pmiDimension = 1;
	
	if (params === undefined) {
		throw new Error('ltError: Required argument. method=PmiList, argument=params');
	} else {
		Object.keys(params).forEach(function(key) {
			self[key] = params[key];
		});
	}
	
	if (self.isDispComponent) {
		if (self.type.localeCompare('note') == 0) {
			this.requiredJsonUrls = [ pmilistNotecacheurl ];
		} else if (self.type.localeCompare('dimension') == 0) {
			this.requiredJsonUrls = [ pmilistDimentioncacheurl ];
		} else if (self.type.localeCompare('all') == 0) {
			this.requiredJsonUrls = [ pmilistNotecacheurl, pmilistDimentioncacheurl ];
		} else {
			this.requiredJsonUrls = [];
		}
	}
	
	this.update = function(params) {
		if (!self.isDispComponent || params.selfObj === this) {
			return;
		}
		
		var dom = Ext.ComponentQuery.query('pmilist[name=pmilist]')[0];

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
				if (grp.groupType == lt.GROUP_TYPE_SHELL){
					selGrpNames[grp.userId] = true;
				}
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
				sm.deselectAll(true);
			}
			
			break;
		case 'SELECT_CLEAR':
			if (params.noClear === undefined || params.noClear == false) {
				var selModel = dom.getSelectionModel();
				selModel.deselectAll(false);
			}
			break;
		case 'VISIBILITY_UPDATE_ALL':
			var store = dom.getStore();
			var data = store.getData();
			
			Ext.each(data.items, function(node) {
				var visible = true;
				var pmi = player.model.getPMIByName(node.data.Key);
				if (!Ext.isEmpty(pmi) && pmi.visibility) {
					visible = checkPmiVisible(pmi.parent);
				} else {
					visible = false;
				}
				setPmiListVisible(node, visible);
			});
			break
		default:
			break;
		}
	}
	
	this.registController = function(controller) {
		this.controller = controller;
	}
	
	this.createPmiList = function() {
		if (!self.isDispComponent) {
			return;
		}

		Ext.Promise.all([
			metaJsonLoaded[pmilistDimentioncacheurl],
			metaJsonLoaded[pmilistNotecacheurl]
		]).then(function() {

			var store = Ext.create('Ext.data.Store', {
				data: {
					items: function() {
						var val = [];
						self.getPmiListData(val, dimensionJsonData, PmiList.pmiDimension);
						self.getPmiListData(val, noteJsonData, PmiList.pmiNote);
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
			var dom = Ext.ComponentQuery.query('pmilist[name=pmilist]')[0];
			dom.setStore(store);
			var sortNo = Number(pmiListParam['sort']);
			var direction = pmiListParam['order'];
			if (!isNaN(sortNo) && !Ext.isEmpty(direction)) {
				var idx = 0;
				Ext.each(pmiListParam.columns, function(column) {
					if (idx == sortNo - 1) {
						store.sort(column.name, direction.toUpperCase());
						return false;
					}
					idx++;
				});
			}
			initPmiVisible();
		});
	}
	
	this.getPmiListData = function(val, jsonData, pmiType) {

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

		if (pmiType == PmiList.pmiNote) {
			if (jsonData && jsonData.topNote && jsonData.topNote.note) {
				Ext.each(jsonData.topNote.note, function(obj) {

					addPmiRow(obj, val, propSections, pmiType);

					self.setChildData(obj, val, propSections, pmiType);
				});
			}			
		} else {
			if (jsonData && jsonData.topDimension && jsonData.topDimension.dimension) {
				Ext.each(jsonData.topDimension.dimension, function(obj) {

					addPmiRow(obj, val, propSections, pmiType);

					self.setChildData(obj, val, propSections, pmiType);
				});
			}						
		}
	}

	this.setChildData = function(childgroup, val, propSections, pmiType) {

		var self = this;

		if (pmiType == PmiList.pmiNote) {
			if (childgroup && childgroup.note) {
				Ext.each(childgroup.note, function(obj) {

					addPmiRow(obj, val, propSections, pmiType);

					self.setChildData(obj, val, propSections, pmiType);
				});
			}
		} else {
			if (childgroup && childgroup.dimension) {
				Ext.each(childgroup.dimension, function(obj) {

					addPmiRow(obj, val, propSections, pmiType);

					self.setChildData(obj, val, propSections, pmiType);
				});
			}			
		}
	}
	
}

function CacheUrl(pmiType, url, deferred) {
    this.pmiType = pmiType;
    this.url = url;
    this.deferred = deferred;
}

function addPmiRow(obj, val, propSections, pmiType) {

	var addedName = false;
	var part = {};

	part.Key = String(obj.name);
	part.parent = String(obj.parent);

	Ext.each(pmiListParam.columns, function(column) {
		part[column.name] = MakePmiFormatStringList(column.format, obj, propSections, pmiType);
	});
	part[PmiList.rowSelectedCol] = false;
	if (!Ext.isDefined(obj.visibility) || obj.visibility) {
		part[PmiList.rowSelectedCol] = true;
	}

	if (!addedName) {
		val.push(part);
	}
}

function MakePmiFormatStringList(altNameFormat, obj, propSections, pmiType) {

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
			
			var fmtSpType = ChkPmiFmtSpType(strFormat);
			switch (fmtSpType) {
			case 1:
				//  ${NAME}
				if (!Ext.isEmpty(obj.name)) {
					strValue = Ext.String.htmlEncode(obj.name);			
				}
				break;
			case 2:
				//  ${NOTEDIM}
				if (!Ext.isEmpty(obj.text)) {
					strValue = Ext.String.htmlEncode(obj.text);			
				}
				break;
			case 3:
				//  ${TYPE}
				if (pmiType == PmiList.pmiNote) {
					strValue = 'Note';
				} else {
					strValue = 'Dimension';			
				}
				break;
			default:
				strValue = GetAssemblyFormat(strFormat, obj, propSections);
				break;
			}
		} else {
			strValue = "";
		}

		str = str + strOther + strValue;

	}

	return str;
}

function ChkPmiFmtSpType(format) {

	if (format === "") {
		return 0;
	} else if (format === "${NAME}") {
		return 1;
	} else if (format === "${NOTEDIM}") {
		return 2;
	} else if (format === "${TYPE}") {
		return 3;
	}

	return 0;
}

function initPmiVisible() {
	var dom = Ext.ComponentQuery.query('pmilist[name=pmilist]')[0];
	var store = dom.getStore();
	store.each(function(r) {
		var pmi = player.model.getPMIByName(r.data.Key);
		if (!Ext.isEmpty(pmi)) {
			var val = r.get(PmiList.rowSelectedCol);
			pmi.visibility = val;			
		}
	});
}

function setPmiVisible(rec, visible) {
	var key = rec.data.Key;
	if (key !== undefined) {
		var pmi = player.model.getPMIByName(rec.data.Key);
		if (!Ext.isEmpty(pmi)) {
			pmi.visibility = visible;
		}
	}
}

function setPmiListVisible(rec, visible) {
	var key = rec.data.Key;
	if (key !== undefined) {
		rec.set(PmiList.rowSelectedCol, visible);
	}
}

function checkPmiVisible(group) {
	if (group.userId.indexOf('Root') == -1) {
		if (!group.visibility) {
			return false;
		}

		var parent = group.getParent();
		if (parent) {
			return checkPmiVisible(parent);
		}
	}
	return true;
}
