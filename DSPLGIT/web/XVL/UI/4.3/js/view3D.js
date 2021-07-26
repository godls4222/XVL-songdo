View3D = function(params) {
	'use strict';
	var self = this;
	this.player = params.player;
	this.controller = null;
	
    this.curProfIndex = null;
	this.curSnapIndex = null;

	this.isPlayOrPauseProcAnim = false;
	
	this.isBeginProfile = false;
	this.isGenerateProfile = false;
	this.isGenerateProfiling = false;
	this.startMeasurementing = false;
	this.releaseOnMemoryTimeoutID = null;
	this.releaseOnMemoryTimeoutTime = 60000;
	
	this.requiredJsonUrls = [ assemblycacheurl ];
	
	this.updateTagetGroups = [];
	this.updateTagetPMIs = [];
	
	this.isSearchResultSelUnit = false;
	
	this.update = function(params) {
		var group;
		if (params.selfObj === this) {
			return;
		}
		switch (params.updateType) {
		case 'SELECT_ON':
			self.player.model.clearSelection();
			
			var groups = self.player.model.getGroupsByUniqueIds(params.updateTagetElems);
			self.player.model.addSelection(groups);
			
			var pmis = [];
			var pmiNames = Ext.isEmpty(params.updatePMINames) ? [] : params.updatePMINames;
			Ext.each(pmiNames, function(pmiName) {
				var pmi = player.model.getPMIByName(pmiName);
				if (!Ext.isEmpty(pmi)) {
					pmis.push(pmi);
				}
			});
			if (!Ext.isEmpty(pmis)) {
				self.player.model.addSelection(pmis);
			}
			
			if (self.player.model.fitSelection) {
				self.player.view.fit(self.player.model.getSelections());
			}
			
			if (toolbarObj.selectSnapMode) {
				toolbarObj.selectSnapMode = false;
				toolbarObj.setSelectSnapModeEnd();
			}
			
			unsetSnapshot();
			break;
		case 'SELECT_OFF':
			var groups = self.player.model.getSelections();
			params.updateTagetElems[0];
			self.player.model.clearSelection();
			groups = Ext.Array.map(groups, function(group) {
				return group.uniqueId !== params.updateTagetElems[0];
			});
			self.player.model.addSelection(groups);
			if (self.player.model.fitSelection) {
				self.player.view.fit(self.player.model.getSelections());
			}
			unsetSnapshot();
			break;
		case 'SELECT_CLEAR':
			self.player.model.clearSelection();
			if (self.player.model.fitSelection) {
				self.player.view.fit([]);
			}
			unsetSnapshot();
			break;
		case 'VISIBILITY_ON':
			break;
		case 'VISIBILITY_OFF':
			break;
		case 'VISIBILITY_ON_OTHER_OFF':
			break;
		case 'DRILL':
			
			if (Ext.isEmpty(playerParam.main.enableDrillupdown) ||
					!playerParam.main.enableDrillupdown) {
				break;
			}
			
			if (!Ext.isDefined(params.suppressUpdateForceLoad) || !params.suppressUpdateForceLoad) {
				self.updateForceLoad();
			}
			if (!Ext.isDefined(params.suppressUpdateDrawBackground) || !params.suppressUpdateDrawBackground) {
				self.updateDrawBackground();
			}
			break;
		case 'BEGIN_EDIT_PROFILE':
			beginEditProfile(params);
			break;
		case 'END_EDIT_PROFILE':
			endEditProfile();
			break;
		case 'CANCEL_EDIT_PROFILE':
			cancelEditProfile();
			break;
		case 'GENERATE_PROFILE':
			generateProfile();
			break;
		case 'DELETE_PROFILE':
			deleteProfile(params);
			break;
		case 'APPLY_PROFILE':
			applyProfile(params);
			break;
		case 'CLEAR_PROFILE':
			clearProfile();
			break			
		case 'APPLY_SNAPSHOT':
			setSnapshot(params);
			break;
		case 'PROC_ANIM_BEGIN':
			procAnimBegin();
			break;
		case 'PROC_ANIM_END':
			procAnimEnd();
			break;
		case 'SEARCH_EXEC':
			if (!Ext.isDefined(params.suppressUpdateForceLoad) || !params.suppressUpdateForceLoad) {
				self.updateForceLoad();
			}
			if (!Ext.isDefined(params.suppressUpdateDrawBackground) || !params.suppressUpdateDrawBackground) {
				self.updateDrawBackground();
			}
			self.beginSearchResultSelUnit();
			break;
		case 'SEARCH_CLEAR':
			if (!Ext.isDefined(params.suppressUpdateForceLoad) || !params.suppressUpdateForceLoad) {
				self.updateForceLoad();
			}
			if (!Ext.isDefined(params.suppressUpdateDrawBackground) || !params.suppressUpdateDrawBackground) {
				self.updateDrawBackground();
			}
			self.endSearchResultSelUnit();
			break;
		default:
			break;
		}
		self.updateViewPart();
		self.updateViewAll();
	}

	this.initialize = function() {
		
		metaJsonLoaded[assemblycacheurl].then(function() {
			
			initCurrentAssembly();
			initProcessAnimationParameters();
			self.updateForceLoad();
		});
	}
	
	this.beginSearchResultSelUnit = function() {
		self.isSearchResultSelUnit = true;
		updateViewSelectionUnit();
	}

	this.endSearchResultSelUnit = function() {
		self.isSearchResultSelUnit = false;
		updateViewSelectionUnit();
	}
	
	function initCurrentAssembly() {
		var dispTopGroups = getDispTopGroups();
		if (!Ext.isEmpty(dispTopGroups) && dispTopGroups.length === 1) {
			currentAssembly = dispTopGroups[0];
		}
	}
	
	function initProcessAnimationParameters() {
		
		if (playerParam['main']['procAnimRange'] == 'proc') {
			player.controlProcessAnimation('jump_' + playerParam['main']['procAnimRangeName']);
		}
	}
	
	var forceLoad = (function() {
		
		var isLoadMap = {};
		
		return {
			
			load : function(player, playerParam, elemIds) {
				
				var groups = self.player.model.getGroupsByElementIds(elemIds);
				if (Ext.isEmpty(groups)) {
					return;
				}
				
				player.forceLoad({
					type : 'group',
					groups : groups,
				});
				
				isLoadMap[playerParam.type] = true;
			},
			
			release : function(player, playerParam) {
				
				if (!Ext.isEmpty(isLoadMap[playerParam.type]) &&
						isLoadMap[playerParam.type] == true) {
					
					player.releaseOnMemory();
					isLoadMap[playerParam.type] = false;
				}
			},
			
		};
		
	})();
	
	this.updateForceLoad = function() {
		updateForceLoadOne(self.player, playerParam.main);
		updateForceLoadOne(self.player.part, playerParam.part);
		updateForceLoadOne(self.player.all, playerParam.all);
	}
	
	function updateForceLoadOne(player, playerParam) {
		
		if (Ext.isEmpty(player)) {
			return;
		}
		if (Ext.isEmpty(playerParam)) {
			return;
		}
		
		var targetElementIds = [];
		
		do {
			
			if (Ext.isEmpty(playerParam.drillupdownLoadLevel)) {
				break;
			}
			
			if (Ext.isEmpty(currentAssembly)) {
				break;
			}
			
			Ext.each(currentAssembly, function(currentAssemblyOne) {
				
				var level = 0;
				for (var parent = currentAssemblyOne; parent != null; parent = parent.getParent()) {
					level++;
				}
				if (level < playerParam.drillupdownLoadLevel) {
					return;
				}
				
				targetElementIds.push(currentAssemblyOne.elementId);
			});
			
		} while(false);

		do {
			
			if (Ext.isEmpty(playerParam.drillupdownLoadProperty)) {
				break;
			}
			
			if (Ext.isEmpty(currentAssembly)) {
				break;
			}
			
			Ext.each(currentAssembly, function(currentAssemblyOne) {;
				
				var curAssyElemId = currentAssemblyOne.elementId;
				var propInfo = getPropertyFromAssyJson(curAssyElemId, playerParam.drillupdownLoadProperty);
				if (Ext.isEmpty(propInfo)) {
					return;
				}
				if (Ext.isEmpty(propInfo.type) || propInfo.type != 'bool') {
					return;
				}
				if (Ext.isEmpty(propInfo.value) || propInfo.value != 'true') {
					return;
				}
				
				targetElementIds.push(curAssyElemId);
			})
			
		} while(false);

		do {

			if (!searchObj.isDispComponent) {
				break;
			}

			if (!searchObj.isDisplayedResult) {
				break;
			}

			if (!player.isSmartLoadingModel || searchParam.result != 'gridandmodel') {
				break;
			}

			var doms = Ext.ComponentQuery.query('grid[name=search]');
			Ext.each(doms, function(dom) {
				var controller = dom.getController();
				var allResultElementIds = controller.collectAllResultElementIds();
				Ext.each(allResultElementIds, function(elementId) {
					targetElementIds.push(elementId);
				});
			});

		} while (false);

		if (Ext.isEmpty(targetElementIds)) {
			forceLoad.release(player, playerParam);
		} else {
			forceLoad.load(player, playerParam, targetElementIds);
		}
	}
	
	this.isCurAssyOrParentOrChild = function(group) {
		
		function travParents(group, currentAssemblyOne) {
			
			var parent = group.getParent();
			if (Ext.isEmpty(parent)) {
				return false;
			}
			
			if (parent.uniqueId == currentAssemblyOne.uniqueId) {
				return true;
			}
			
			return travParents(parent, currentAssemblyOne);
		}
		
		function travChildren(group, currentAssemblyOne) {
			
			var children = group.getChildren();
			if (Ext.isEmpty(children)) {
				return false;
			}
			
			var foundChild = false;
			Ext.each(children, function(child) {
				
				if (Ext.isEmpty(child)) {
					return true;
				}
				
				if (child.uniqueId == currentAssemblyOne.uniqueId) {
					foundChild = true;
					return false;
				}
				
				if (travChildren(child, currentAssemblyOne)) {
					foundChild = true;
					return false;
				}
				
				return true;
			});
			
			return foundChild;
		}
		
		if (Ext.isEmpty(currentAssembly)) {
			return true;
		}
		
		var hit = false;
		Ext.each(currentAssembly, function(currentAssemblyOne) {
			
			if (Ext.isEmpty(currentAssemblyOne)) {
				hit = true;
				return false;
			}
			
			if (group.uniqueId == currentAssemblyOne.uniqueId) {
				hit = true;
				return false;
			}
			
			if (travParents(group, currentAssemblyOne)) {
				hit = true;
				return false;
			}
			
			if (travChildren(group, currentAssemblyOne)) {
				hit = true;
				return false;
			}
			
			return true;
		});
		
		return hit;
	}
	
	this.changeVisibility = function(targets) {
		
		var self = this;
		
		function travParents(group, newVisibility, notifyParams) {
			
			var parent = group.getParent();
			if (Ext.isEmpty(parent)) {
				return;
			}
			
			if (newVisibility == false) {
				return;
			}
			
			if (parent.visibility == newVisibility) {
				return;
			}
			
			parent.visibility = newVisibility;
			notifyParams.updateTagetElems[parent.uniqueId] = newVisibility;
			travParents(parent, newVisibility, notifyParams);
		}

		function travChildren(group, newVisibility, notifyParams) {
			var children = group.getChildren();
			if (Ext.isEmpty(children)) {
				return;
			}
			
			Ext.each(children, function(child) {
				
				if (Ext.isEmpty(child)) {
					return;
				}
				
				if (!self.isCurAssyOrParentOrChild(child)) {
					return;
				}
				
				if (child.visibility == newVisibility) {
					return;
				}
				
				child.visibility = newVisibility;
				notifyParams.updateTagetElems[child.uniqueId] = newVisibility;
				travChildren(child, newVisibility, notifyParams);
			});
		} 
		
		var notifyParams = {
				selfObj : this,
				updateType : 'VISIBILITY_UPDATE_ALL',
				updateTagetElems : {},
		};
		
		Ext.each(targets, function(target) {
			
			if (Ext.isEmpty(target)) {
				return true;
			}
			
			var targetGroup = player.model.getGroupByElementId(target.elementId);
			if (Ext.isEmpty(targetGroup)) {
				return true;
			}
			
			if (!self.isCurAssyOrParentOrChild(targetGroup)) {
				return true;
			}
			
			targetGroup.visibility = target.visibility;
			notifyParams.updateTagetElems[targetGroup.uniqueId] = target.visibility;
			
			travParents(targetGroup, target.visibility, notifyParams);
			travChildren(targetGroup, target.visibility, notifyParams);
			return true;
		});
		
		controllerObj.notify(notifyParams);
	}
	
	this.registController = function(controller) {
		this.controller = controller;
	};

	function onSelectChange(event) {
		'use strict';
		if (event && event.selectedGroups !== undefined) {
			var params = [];
			params.updateTagetElems = [];
			
			if (self.isSearchResultSelUnit) {
				var convedElementIds = []; 
				Ext.each(self.player.model.getSelections(), function(selGroup) {
					var convedElementId = searchObj.convertSelUnit(selGroup.elementId);
					if (!Ext.isEmpty(convedElementId)) {
						convedElementIds.push(convedElementId);
					}
				});
				params.updateTagetElems = convedElementIds;
				self.player.model.clearSelection();
				var convedGroups = self.player.model.getGroupsByElementIds(convedElementIds);
				self.player.model.addSelection(convedGroups);
			} else if (playerParam.main && playerParam.main.filterProperty == 'fill') {
				var selections = [];
				Ext.each(self.player.model.getSelections(), function(group) {
					var retGrp = getGroupPropParent(group, playerParam.main.filterPropertyName);
					if (retGrp) {
						params.updateTagetElems.push(String(retGrp.userId));
						selections.push(retGrp);
					}
				});
				self.player.model.clearSelection();
				self.player.model.addSelection(selections);
			} else if(playerParam.main && playerParam.main.filterProperty == 'value') {
				var selections = [];
				Ext.each(self.player.model.getSelections(), function(group) {
					var retGrp = getGroupPropParent(group, playerParam.main.filterPropertyName, playerParam.main.filterPropertyValue);
					if (retGrp) {					
						params.updateTagetElems.push(String(retGrp.userId));
						selections.push(retGrp);
					}
				});
				self.player.model.clearSelection();
				self.player.model.addSelection(selections);
			} else if (playerParam.main && toolbarObj.selectSnapMode) {
				var groups = self.player.model.getSelections();
				if (groups.length === 1) {
					if (!Ext.isEmpty(selectSnapObject.snapshot[groups[0].elementId])) {
						var snapSize = self.player.model.numberOfSnapshots;
						var snapIndex = -1;
						for (var snapCnt = 0; snapCnt < snapSize; snapCnt++) {
							var snapshot = self.player.model.getSnapshotParameters(snapCnt);
							if (snapshot.snapshotID == selectSnapObject.snapshot[groups[0].elementId]) {
								snapIndex = snapCnt;
								break;
							}
						}
						if (snapIndex >= 0) {
							var snapItem = 0;
							snapItem += lt.SNAPSHOT_ITEM_CAMERA;
							snapItem += lt.SNAPSHOT_ITEM_POSITION;
							snapItem += lt.SNAPSHOT_ITEM_VISIBILITY;
							snapItem += lt.SNAPSHOT_ITEM_DISPLAY;
							snapItem += lt.SNAPSHOT_ITEM_PROFILE;
							snapItem += lt.SNAPSHOT_ITEM_COLOR_TRANSPARENCY;
							snapItem += lt.SNAPSHOT_ITEM_MARKUP;
							
							controllerObj.notify({
								updateType: 'SELECT_CLEAR',
								updateTagetElems: [],
								selfObj: null
							});
							
							controllerObj.notify({
								updateType: 'APPLY_SNAPSHOT',
								updateTagetElems: snapIndex,
								applyOption: snapItem,
								selfObj: null
							});
							
							controllerObj.notify({
								updateType: 'VISIBILITY_UPDATE_ALL',
								updateTagetElems: player.model.getGroupVisibilities()
							});
						}

						toolbarObj.selectSnapMode = false;
						toolbarObj.setSelectSnapModeEnd();

						return;
					}
				}

				self.player.model.clearSelection();
				if (!Ext.isEmpty(selectSnapObject.pmis)) {
					self.player.model.addSelection(selectSnapObject.pmis);
				}
				if (!Ext.isEmpty(selectSnapObject.groups)) {
					self.player.model.addSelection(selectSnapObject.groups);
				}
			} else {
				Ext.each(self.player.model.getSelections(), function(group) {
					params.updateTagetElems.push(String(group.userId));
				});				
			}
			if (params.updateTagetElems.length > 0) {
				params.updateType = 'SELECT_ON';
			} else {
				params.updateType = 'SELECT_CLEAR';
			}
			self.updateViewPart();
			self.updateViewAll();
			params.selfObj = self;
			unsetSnapshot();
			self.controller.notify(params);
		}		
	}
	
    function highlightGroups(event) {
        
		var params = [];
		params.updateTagetElems = [];
		
		view3DObj.updateTagetGroups = [];
		
		Ext.each(event.groups, function(group) {
			params.updateTagetElems.push(String(group.userId));
			view3DObj.updateTagetGroups.push(String(group.userId));
		});
		
        params.updateType = 'HIGHLIGH_GROUPS';
        params.selfObj = self;
        self.controller.notify(params, true);
    }	
	
    function highlightPMIs(event) {
        
		var params = [];
		params.updateTagetElems = [];
		
		view3DObj.updateTagetPMIs = [];
		
		Ext.each(event.PMIs, function(pmi) {
			params.updateTagetElems.push(pmi.name);
			view3DObj.updateTagetPMIs.push(pmi.name);
		});		
		
        params.updateType = 'HIGHLIGH_PMIS';
        params.selfObj = self;
        self.controller.notify(params, true);        
    }
	
	function getGroupPropParent(group, propertyName, propertyValue) {

		if(!group){
			return null;
		}
		
		var obj = assemblyObjects[group.userId];
		
		if(!obj){
			return null;
		}		
		
		if (propertyValue == undefined) {
			if (isMatchFormatStringAssembly(propertyName, obj, assemblyPropSections)) {
				return group;
			} else {
				var parent = group.getParent();
				if(!parent){
					return null;
				}
				return getGroupPropParent(parent, propertyName, propertyValue);
			}
		} else {
			if (isMatchFormatStringAssembly(propertyName, obj, assemblyPropSections, propertyValue)) {
				return group;
			} else {
				var parent = group.getParent();
				if(!parent){
					return null;
				}
				return getGroupPropParent(parent, propertyName, propertyValue);
			}			
		}
	}	

	this.updateViewPart = function() {
		var player = self.player.part;
		if (!self.player.fileLoading && player && !player.fileLoading) {
			var sels = self.player.model.getSelections();
			var elementIDs = [];
			Ext.each(sels, function(group) {
				elementIDs.push(group.elementId);
			});
			var parts = player.model.getGroupsByElementIds(elementIDs);
			if (parts.length > 0) {
				player.model.showGroupsOnly2(parts, toolbarObj.homeStatePart);
				player.view.fit(parts);
			} else {
                player.model.hideAllGroups();
			}
		}
	};

	this.updateViewAll = function() {
		var player = self.player.all;
		if (!self.player.fileLoading && player && !player.fileLoading) {
			player.model.clearSelection();
			var sels = self.player.model.getSelections();
			var elementIDs = [];
			Ext.each(sels, function(group) {
				elementIDs.push(group.elementId);
			});
			var groups = player.model.getGroupsByElementIds(elementIDs);
			player.model.addSelection(groups);
		}
	};
	
	function onViewChange(event) {
        
		'use strict';
		
		if (!player || player.fileLoading) {
			return;
		}
		
		var param = player.view.getViewingCameraParameters();
		if (player.part && !player.part.fileLoading) {
			player.part.view.setViewingCameraParameters(param);
			player.part.view.fit();
		}
		if (player.all && !player.all.fileLoading) {
			player.all.view.setViewingCameraParameters(param);
			player.all.view.fit();
		}		
    };	
	
    if (self.player) {
		self.player.addEventListener('ltSelectChange', onSelectChange);
		self.player.addEventListener('ltViewChange', onViewChange);
		self.player.addEventListener('ltHighlightGroups', highlightGroups);
		self.player.addEventListener('ltHighlightPMIs', highlightPMIs);		
	}
	
	function setSnapshot(params) {
		
		var snapIndex = params.updateTagetElems;
		if (isNaN(snapIndex) || snapIndex < 0) {
			return;
		}
		
		player.model.applySnapshot(snapIndex,
								params.applyOption);
		
		self.curSnapIndex = snapIndex;
		
		for (var key in toolbarParam) {
			
			var param = toolbarParam[key];
			
			if (!param || !param.isDispComponent) {
				continue;
			}
			
			var queryStr = 'window[name~=toolbar' + key + ']';
			var toolbars = Ext.ComponentQuery.query(queryStr);
			
			if (Ext.isEmpty(toolbars)) {
				continue;
			}
			
			toolbars[0].controller.endMeasureDisplaySettings();
			toolbars[0].controller.reSelectedToolbar();					
			toolbars[0].controller.updateEnableToolbar();
			
			break;
		}
	}
	
	function unsetSnapshot() {
		self.curSnapIndex = null;
	}
    
	function beginEditProfile(params) {
		player.model.beginEditProfile(params.exist);
		self.curProfIndex = null;
		self.isBeginProfile = true;
	}
	
	function endEditProfile() {
		player.model.endEditProfile();
		
		var queryStr = 'button[name~=list_crosssection]';
		var buttons = Ext.ComponentQuery.query(queryStr);		
		if (!Ext.isEmpty(buttons)){
			Ext.each(buttons, function(button) {
				var menu = button.getMenu();
				if (Ext.isEmpty(menu)){
					return;
				}
				menu.removeAll();
	            for (var cnt = 0; cnt < player.model.numberOfProfiles; cnt++) {
	                var profParam = player.model.getProfile(cnt);
	                menu.add([{
						text: profParam.group.userId,
						profindex: cnt,
						action: 'list_crosssection',
						listeners: {
							click: 'list_crosssection'
						}
					}]);
	            }			
			});
		}		
	}
	
	function generateProfile() {
		
		if (Ext.isEmpty(view3DObj.loadMaskProfile)) {
			var playerMainView = Ext.ComponentQuery.query('component[name=compplayermain]')[0];
			view3DObj.loadMaskProfile = new Ext.LoadMask({
				disabled: true,
				cls: 'load_mask',
				msg    : web3d.CST.XVL_WEB3D_TOOLBAR_PROCESSING,
				target : playerMainView
			});
		}		
		view3DObj.loadMaskProfile.show();
		
		player.model.generateProfile();

	}
	
	function deleteProfile(params) {
		
		var profIndex = params.updateTagetElems;
		if (isNaN(profIndex) || profIndex < 0) {
			return;
		}
		
		player.model.deleteProfile(profIndex);
		self.curProfIndex = null;
	}
	
	function applyProfile(params) {
		
		var profIndex = params.updateTagetElems;
		if (isNaN(profIndex) || profIndex < 0) {
			return;
		}
		
		player.model.applyProfile(profIndex);
		self.curProfIndex = profIndex;
	}
	
	function clearProfile() {
		player.model.clearProfile();
		self.curProfIndex = null;
		self.isBeginProfile = false;
		if (player.isSmartLoadingModel && view3DObj.isForceLoadedViewFrustum) {
			if (!Ext.isEmpty(view3DObj.releaseOnMemoryTimeoutID)) {
				clearTimeout(view3DObj.releaseOnMemoryTimeoutID);
				view3DObj.releaseOnMemoryTimeoutID = null;
			}
			view3DObj.isForceLoadedViewFrustum = false;
			player.releaseOnMemory();
		}
	}
	
	function cancelEditProfile() {
		if (self.isBeginProfile) {
			clearProfile();
		}
	}
	
	function procAnimBegin() {
		self.isPlayOrPauseProcAnim = true;
	} 
	
	function procAnimEnd() {
		self.isPlayOrPauseProcAnim = false;
		var pauseToolbarButton =Ext.ComponentQuery.query('button[name~=procanim_pause]')[0];
		if (!Ext.isEmpty(pauseToolbarButton)) {
			pauseToolbarButton.pauseFlg = false;
		}
	}
	
	this.updateDrawBackground = function() {

		const allGroups = null;
		var drawForegroundGroups = allGroups;
		var exceptPropertyValue = getExceptPropertyValue(Ext.isArray(currentAssembly) ? currentAssembly : [ currentAssembly ]);
		if (searchObj.isDisplayedResult && searchParam.result == 'gridandmodel') {
			var doms = Ext.ComponentQuery.query('grid[name=search]');
			var controller = doms[0].getController();
			var allResultElementIds = controller.collectAllResultElementIds();
			var allResultGroups = player.model.getGroupsByElementIds(allResultElementIds);
			if (Ext.isEmpty(currentAssembly) || exceptPropertyValue == 'all') {
				drawForegroundGroups = allResultGroups;
			} else {
				drawForegroundGroups = [];
				Ext.each(allResultGroups, function(resultGroup) {
					Ext.each(currentAssembly, function(currentAssemblyOne) {
						if (isEqualOrDescendant(currentAssemblyOne, resultGroup)) {
							drawForegroundGroups.push(resultGroup);
						}
					});
				});
			}
			if (player.isSmartLoadingModel) {
				player.forceLoad({
					type : 'group',
					groups : drawForegroundGroups,
				});
			}
		} else {
			if (exceptPropertyValue == 'back') {
				drawForegroundGroups = currentAssembly;
			} else {
				drawForegroundGroups = allGroups;
			}
		}
		
		const drawForeground = true;
		const drawBackground = false;
		if (drawForegroundGroups == allGroups) {
			player.setDrawReferenceGroup(allGroups, drawForeground); 
		} else {
			player.setDrawReferenceGroup(allGroups, drawBackground);
			if (!Ext.isEmpty(drawForegroundGroups)) {
				player.setDrawReferenceGroup(drawForegroundGroups, drawForeground);
			}
		}
	}
	
	function isEqualOrDescendant(parent, descendant) {
		if (parent.uniqueId == descendant.uniqueId) {
			return true;
		}
		var children = parent.getChildren();
		if (Ext.isEmpty(children)) {
			return false;
		}
		return Ext.Array.some(children, function(child) {
			return isEqualOrDescendant(child, descendant);
		});
	}
};