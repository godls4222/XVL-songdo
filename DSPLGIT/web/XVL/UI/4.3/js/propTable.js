PropTable = function(params) {
	'use strict';
	var self = this;
	this.player = params.player;
	this.controller = null;
	this.topAssembly = false;
	this.property = null;
	this.isDispComponent = false;
	this.formatter = null;
	this.folderId = null;
	this.searchAttributeName = null;
	this.windowTarget = "_blank";

	this.requiredJsonUrls = [ assemblycacheurl ];

	if (params === undefined) {
		throw new Error('ltError: Required argument. method=PropTable, argument=params');
	} else {
		Object.keys(params).forEach(function(key) {
			self[key] = params[key];
		});
	}

	this.update = function(params) {
		if (!self.isDispComponent) {
			return;
		}
		if (params.selfObj === this) {
			return;
		}		
		switch (params.updateType) {
		case 'SELECT_ON':
			if(self.topAssembly){
				break;
			}
			self.setProperty();
			break;
		case 'SELECT_OFF':
			if(self.topAssembly){
				break;
			}				
			self.setProperty();
			break;
		case 'SELECT_CLEAR':
			if(self.topAssembly){
				break;
			}				
			var dom = Ext.ComponentQuery.query('propTable[name=propTable]')[0];
			if(dom){
				var store = dom.getStore();
				Ext.each(store.data.items, function(item) {
					item.data[1] = '';
				});
				dom.setStore(store);
			}				
			break;
		case 'DRILL':
			self.setProperty();
			break;				
		default:
			break;
		}
	};


	this.registController = function(controller) {
		this.controller = controller;
	};

	this.createPropTable = function() {
		if (!self.isDispComponent) {
			return;
		}
		
		metaJsonLoaded[assemblycacheurl].then(self.setProperty);
	};

	this.setProperty = function() {
		var dom = Ext.ComponentQuery.query('propTable[name=propTable]')[0];
		if(!Ext.isEmpty(dom)){
		
			var store = Ext.create('Ext.data.Store', {
				data: {
					items: function() {						
						var ret = [];
						Ext.each(propTableParam.property, function(property) {
							var val = {};
							val[0] = property.name;
							val[1] = '';
							val['name'] = property.name;
							val['format'] = property.format;
							val['formatter'] = property.formatter;
							val['searchAttributeName'] = property.searchAttributeName;
							val['windowTarget'] = property.windowTarget;
							val['folderId'] = property.folderId;
							ret.push(val);
						});
						
						return ret ;
					}(),
				},

				proxy: {
					type: 'memory',
					reader: {
						type: 'json',
						rootProperty: 'items'
					}
				}
			});
			dom.setStore(store);
		}
		
		var dispTopGroups = getDispTopGroups();
		var dispGroups = self.getDispGroups();
		
		Ext.each(self.property, function(prop) {
			
			Ext.each(dispGroups, function(group) {
				var obj;
				if (!Ext.isEmpty(group)) {
					obj = assemblyObjects[group.elementId];
				}

				if (Ext.isEmpty(obj)) {
					return true;
				}

				var existValue = false;
				switch (prop.formatter) {
				case undefined:
				case null:
				case 'htmlformatter':
					if (!Ext.isEmpty(prop.format)) {
						var analyzeDetail = {};
						var val = MakeFormatStringAssembly(prop.format, obj, assemblyPropSections, assemblyModelAttrs, prop.empty, analyzeDetail);
						var dom = Ext.ComponentQuery.query('propTable[name=propTable]')[0];
						if (dom) {
							var store = dom.getStore();
							Ext.each(store.data.items, function(item) {
								if (item.data[0] == prop.name) {
									item.data[1] = val;
								}
							});
							dom.setStore(store);
						}
						if (analyzeDetail.values.every(function(strValue) {
							return !Ext.isEmpty(strValue)
						})) {
							existValue = true;
						}
					}
					break;
				case 'link2docformatter':
					if (!Ext.isEmpty(prop.format)) {
						var value = MakeFormatStringAssembly(prop.format, obj, assemblyPropSections, assemblyModelAttrs);
						if (!Ext.isEmpty(value)) {
							var searchAttributeName = prop.searchAttributeName === undefined ? '' : prop.searchAttributeName;
							var folderId = prop.folderId === undefined ? '' : prop.folderId;
							var dom = Ext.ComponentQuery.query('propTable[name=propTable]')[0];
							if(dom){
								var store = dom.getStore();
								Ext.each(store.data.items, function(item) {
									if (item.data[0] == prop.name) {
										item.data[1] = '<a href="javascript:void(0)" class="link2docformatter" data-val="' + value + '" data-attr="' + searchAttributeName + '" data-fid="' + folderId + '">' + web3d.CST.XVL_WEB3D_FORMATTER_SHOW + '</a>';
										item.data['obj'] = obj;
									}
								});
								dom.setStore(store);
							}
							existValue = true;
						}
					}
					break;
				case 'link2web3dformatter':
					if (!Ext.isEmpty(prop.format)) {
						var value = MakeFormatStringAssembly(prop.format, obj, assemblyPropSections, assemblyModelAttrs);
						if (!Ext.isEmpty(value)) {
							var searchAttributeName = prop.searchAttributeName === undefined ? '' : prop.searchAttributeName;
							var folderId = prop.folderId === undefined ? '' : prop.folderId;
							var windowTarget = prop.windowTarget === undefined ? '' : prop.windowTarget;
							var dom = Ext.ComponentQuery.query('propTable[name=propTable]')[0];
							if(dom){
								var store = dom.getStore();
								Ext.each(store.data.items, function(item) {
									if (item.data[0] == prop.name) {
										item.data[1] = '<a href="javascript:void(0)" class="link2web3dformatter" data-val="' + value + '" data-attr="' + searchAttributeName + '" data-fid="' + folderId + '" data-win="' + windowTarget + '">' + web3d.CST.XVL_WEB3D_FORMATTER_SHOW + '</a>';
										item.data['obj'] = obj;
									}
								});
								dom.setStore(store);
							}
							existValue = true;
						}
					}
					break;
				case 'link2drillupformatter':
					if (!Ext.isEmpty(prop.format)) {
						var value = MakeFormatStringAssembly(prop.format, obj, assemblyPropSections, assemblyModelAttrs);
						var searchAttributeName = prop.searchAttributeName;
						var folderId = prop.folderId === undefined ? '' : prop.folderId;
						var windowTarget = prop.windowTarget === undefined ? '' : prop.windowTarget;
						var dom = Ext.ComponentQuery.query('propTable[name=propTable]')[0];
						if (dom) {
							var store = dom.getStore();
							Ext.each(store.data.items, function(item) {

								if (item.data[0] != prop.name) {
									return true/* continue */;
								}

								if (Ext.isEmpty(currentAssembly)) {

									return true/* continue */;

								} else if (!Ext.isEmpty(dispTopGroups) && dispTopGroups.length === 1 && dispTopGroups[0] === currentAssembly) {

									return true/* continue */;

								}

								item.data[1] = '<a href="javascript:void(0)" class="link2drillupformatter" data-val="' + value + '" data-attr="' + searchAttributeName + '" data-fid="' + folderId + '" data-win="' + windowTarget + '">' + value + '</a>';
								item.data['obj'] = obj;

							});
							dom.setStore(store);
						}
						if (!Ext.isEmpty(value)) {
							existValue = true;
						}
					}
					break;
				}
				if (existValue) {
					return false;
				}
			});
		});
	};
	
	this.getDispGroups = function() {
		
		if (self.topAssembly) {
			if (Ext.isEmpty(currentAssembly)) {
				return getDispTopGroups();
			} else {
				return Ext.isArray(currentAssembly) ? currentAssembly : [ currentAssembly ];
			}
		} else {
			var dispGroup = null;
			Ext.each(self.player.model.getSelections(), function(group) {
				if (isDisplay(group)) {
					dispGroup = group;
					return false;
				}
			});
			if (dispGroup != null) {
				return [dispGroup];
			}
			return [];
		}
	};

	this.updateProperty = function(params) {
		if (params === undefined) {
			throw new Error('ltError: Required argument. method=PropTable, argument=params');
		} else {
			Object.keys(params).forEach(function(key) {
				self[key] = params[key];
			});
		}
	};
};