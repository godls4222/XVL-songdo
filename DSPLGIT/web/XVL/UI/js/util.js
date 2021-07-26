var PROP_FORMAT_BASE_NAME = '${XVL_BASE_NAME}';

var curVari;
var getChildrenCount = function($parent) {
	var childrenCount = 0;
	$parent.children().each(function() {
		childrenCount++;
	});
	return childrenCount;
};

var pixelToPercent = function(value, allSize) {
	return pixelToPercentInt(value, allSize) + '%';
};

var pixelToPercentInt = function(value, allSize) {
	if (value.indexOf('%') !== -1) {
		return convertInt(value);
	}
	if (value.indexOf('px') !== -1) {
		return convertInt(value) / convertInt(allSize) * 100;
	}
	return 0;
};

var percentToPixel = function(value, allSize) {
	return percentToPixelInt(value, allSize) + 'px';
};

var percentToPixelInt = function(value, allSize) {
	if (value.indexOf('px') !== -1) {
		return convertInt(value);
	}
	if (value.indexOf('%') !== -1) {
		return convertInt(allSize) * convertInt(value) / 100;
	}
	return 0;
};

var convertInt = function(value) {
	return isNaN(value) ? parseFloat(value.replace(/px|\%/g, '')) : value;
};

var isDisplay = function(group) {
	if (group.groupClass !== lt.GROUP_CLASS_NORMAL) {
		return false;
	}
	var type = group.groupType;
	return type === lt.GROUP_TYPE_ASSEMBLY || type === lt.GROUP_TYPE_PART || type === lt.GROUP_TYPE_EMPTY || type === lt.GROUP_TYPE_ERRROR;
};

function MakeFormatStringAssembly(altNameFormat, obj, propSections, elemAttrs, checkEmpty, resultDetail) {

	var arrayOther = [];
	var arraySection = [];
	var arrayProperty = [];
	var arrayValue = [];
	if (!Ext.isEmpty(resultDetail)) {
		resultDetail.others = arrayOther;
		resultDetail.sections = arraySection;
		resultDetail.properties = arrayProperty;
		resultDetail.values = arrayValue;
	}
	
	analyzeNameFormat(altNameFormat, arrayOther, arraySection, arrayProperty);
	
	Ext.each(arraySection, function(strSection, index) {

		var strProperty = arrayProperty[index]; 

		var strValue = "";
		if (strProperty !== "") {
			var strFormat = "";
			if (strSection !== "") {
				strFormat = "${" + strSection + "}.{" + strProperty + "}";
			} else {
				strFormat = "${" + strProperty + "}";
			}
			strValue = GetAssemblyFormat(strFormat, obj, propSections, elemAttrs);
		}

		arrayValue.push(strValue);
	});
	
	if (!Ext.isEmpty(checkEmpty)) {
		if (checkEmpty == "allprops") {
			if (arrayValue.every(function(strValue, index) {
				var hasPropAfterOther = !Ext.isEmpty(arrayProperty[index]);
				return !hasPropAfterOther || Ext.isEmpty(strValue)
			})) {
				return "";
			}
		} else if (checkEmpty == "anyprop") {
			if (arrayValue.some(function(strValue, index) {
				var hasPropAfterOther = !Ext.isEmpty(arrayProperty[index]);
				return hasPropAfterOther && Ext.isEmpty(strValue)
			})) {
				return "";
			}
		}
	}
	
	var str = "";
	Ext.each(arrayValue, function(strValue, index) {
		var strOther = arrayOther[index];
		str = str + strOther + strValue;
	});
	return str;
}

function GetAssemblyFormat(format, obj, propSections, elemAttrs) {

	var str = "", fmtSpType, property, strSection, strProperty, strOther, strArray, props = [], sectionObj, propObj, nNumber, strFullPath, strPath, strName, attributes, nPathPos;

	fmtSpType = ChkFmtSpType(format);

	switch (fmtSpType) {
	case 0:
		strArray = [ "", "", "" ];
		analyzeFormat(format, strArray);
		strOther = strArray[0];
		strSection = strArray[1];
		strProperty = strArray[2];

		if (strSection === "") {
			;
		} else {
			props.section = strSection;
		}
		props.name = strProperty;

		getProperty(props, obj, propSections);

		if (props && props.type !== null && props.value !== null) {
			str = props.value;
		}
		break;
	case 1:
	case 2:
		// XVL_NAME
		// XVL_BASE_NAME
		strArray = [ "", "" ];
		nNumber = 0;
		str = obj.name;
		if (fmtSpType === 2) {
			nNumber = lt.util.getBaseNameNo(str, strArray);
			str = strArray[0];
		}
		break;
	case 3:
	case 4:
	case 5:
	case 6:
	case 7:
		// XVL_ORIGINAL_PATH
		// XVL_ORIGINAL_FILE
		// XVL_ORIGINAL_USER_ID
		// XVL_OFFSET_LENGTH
		// XVL_DENSITY

		if (fmtSpType === 3 || fmtSpType === 4) {
			// XVL_ORIGINAL_PATH
			// XVL_ORIGINAL_FILE

			props.section = 'CAD';
			props.name = 'Original Path';
			getProperty(props, obj, propSections);

			if (props && props.value) {
				str = props.value;
				if (fmtSpType === 4) {

					strFullPath = str;
					strPath = "";
					strName = "";

					nPathPos = Math.max(strFullPath.lastIndexOf('\\'), strFullPath.lastIndexOf('/'));
					if (nPathPos !== -1) {
						strPath = strFullPath.substring(0, nPathPos + 1);
						strName = strFullPath.substring(nPathPos + 1);
						str = strName;
					}
				}
			}

		} else if (fmtSpType === 5) {
			// XVL_ORIGINAL_USER_ID

			props.section = 'CAD';
			props.name = 'Original User ID';
			getProperty(props, obj, propSections);

			if (props && props.value) {
				str = props.value;
			}
		} else if (fmtSpType === 6) {
			str = "-";

			props.section = 'CAD';
			props.name = 'Offset_Surface_Distance';
			getProperty(props, obj, propSections);

			if (props && props.type === "number" && props.value) {
				str = props.value;
			}
		} else if (fmtSpType === 7) {
			str = "-";

			props.section = 'CAD';
			props.name = 'Density';
			getProperty(props, obj, propSections);

			if (props && props.value) {
				str = props.value;
			}
		}
		break;
	case 8:
		// XVL_CAD_ID
		if (elemAttrs[obj.name]) {
			str = elemAttrs[obj.name].cadID;
		}
		break;
	case 9:
		// XVL_Comments

		props.section = 'XVL_SYSTEM_SECTION';
		props.name = 'XVL_Comments';
		getProperty(props, obj, propSections);

		if (props && props.value) {
			str = props.value;
		}
		break;
	case 10:
		// XVL_LINK_PATH
		if (elemAttrs[obj.name]) {
			str = elemAttrs[obj.name].grpURL;
		}
		break;
	case 11:
		// XVL_LINK_FILE
		if (elemAttrs[obj.name]) {
			str = elemAttrs[obj.name].grpURL;
			strFullPath = str;
			strPath = "";
			strName = "";

			nPathPos = Math.max(strFullPath.lastIndexOf('\\'), strFullPath.lastIndexOf('/'));
			if (nPathPos !== -1) {
				strPath = strFullPath.substring(0, nPathPos + 1);
				strName = strFullPath.substring(nPathPos + 1);
				str = strName;
			}
		}
		break;
	case 12:
		// XVL_PROC_NO
		str = obj.procNo;
		break;
	case 13:
		// XVL_PROC_WORKNO
		str = obj.workNo;
		break;
	case 14:
		// XVL_PROC_NAME
		str = obj.name;
		break;
	default:
		break;
	}

	if (!Ext.isEmpty(str)) {
		str = Ext.String.htmlEncode(str);
	} else {
		str = "";
	}
	
	return str;
}

function ChkFmtSpType(format) {

	if (format === "") {
		return 0;
	} else if (format === "${XVL_NAME}") {
		return 1;
	} else if (format === "${XVL_BASE_NAME}") {
		return 2;
	} else if (format === "${XVL_ORIGINAL_PATH}") {
		return 3;
	} else if (format === "${XVL_ORIGINAL_FILE}") {
		return 4;
	} else if (format === "${XVL_ORIGINAL_USER_ID}") {
		return 5;
	} else if (format === "${XVL_OFFSET_LENGTH}") {
		return 6;
	} else if (format === "${XVL_DENSITY}") {
		return 7;
	} else if (format === "${XVL_CAD_ID}") {
		return 8;
	} else if (format === "${XVL_Comments}") {
		return 9;
	} else if (format === "${XVL_LINK_PATH}") {
		return 10;
	} else if (format === "${XVL_LINK_FILE}") {
		return 11;
	} else if (format === "${XVL_PROC_NO}") {
		return 12;
	} else if (format === "${XVL_PROC_WORKNO}") {
		return 13;
	} else if (format === "${XVL_PROC_NAME}") {
		return 14;
	}

	return 0;
}

function analyzeFormat(format, strArray) {

	var strOther = "", strSection = "", strProperty = "", nSecStart = -1, nSecEnd = -1, nPropStart = -1, nPropEnd = -1;

	nSecStart = format.indexOf("${");

	if (nSecStart > -1) {
		nSecEnd = format.indexOf("}");
	}

	if (nSecStart > -1 && nSecEnd > -1) {
		nPropStart = format.indexOf(".{", nSecEnd);
		nPropEnd = -1;

		if (nPropStart === nSecEnd + 1) {
			nPropEnd = format.indexOf("}", nPropStart);
		}

		if (nPropStart > -1 && nPropEnd > -1) {
			strSection = format.slice(nSecStart + 2, nSecEnd);
			strProperty = format.slice(nPropStart + 2, nPropEnd);

		} else {
			strSection = "";
			strProperty = format.slice(nSecStart + 2, nSecEnd);
		}

		strOther = format.slice(0, nSecStart);
	}

	strArray[0] = strOther;
	strArray[1] = strSection;
	strArray[2] = strProperty;

	return nPropEnd;
}

function getProperty(props, obj, propSections) {

	var existSection = false;
	var def = {};
	var str = '';
	var id = undefined;
	var type = undefined;
	var isMatch = false;

	props.type = null;
	props.value = null;

	if (Ext.isEmpty(obj) || Ext.isEmpty(obj.attribute) || obj.attribute.length == 0) {
		return str;
	}

	if (props.hasOwnProperty('section') === true) {
		existSection = true;
	}

	if (existSection) {
		if (propSections[props.section]) {
			Ext.each(propSections[props.section], function(propSec) {
				def = propSec;
				if (!Ext.isEmpty(def) && def.key == props.name) {
					id = def.id;
					type = def.type;
					Ext.each(obj.attribute, function(attr) {
						if (attr.ref == id) {
							props.type = type;
							props.value = attr.text;
							isMatch = true;
							return true;
						}
					});
				}
				if (isMatch) {
					return true;
				}
			});
		}
	} else {
		for (key in propSections) {
			var sections = propSections[key];
			Ext.each(sections, function(def) {
				if (def.key == props.name) {
					id = def.id;
					type = def.type;
					Ext.each(obj.attribute, function(attr) {
						if (attr.ref == id && attr.text) {
							props.type = type;
							props.value = attr.text;
							isMatch = true;
							return true;
						}
					});
				}
				if (isMatch) {
					return true;
				}
			});
			if (isMatch) {
				return;
			}
		}
	}
}

function isMatchFormatStringAssembly(altNameFormat, obj, propSections, filterPropertyValue) {

	var arrayOther = [], 
	arraySection = [], 
	arrayProperty = [], 
	nCurSec = 0, nSection = arraySection.length, strSection, strProperty, strOther, strFormat, strValue;

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

			strValue = GetAssemblyFormat(strFormat, obj, propSections);
			if (filterPropertyValue) {
				if (strValue == filterPropertyValue) {
					return true;
				}
			} else {
				if (strValue != '') {
					return true;
				}
			}
		}
	}

	return false;
}

function createAssemblyParents(assyJson) {
	if (Ext.isEmpty(assyJson)) {
		return;
	}
	if (Ext.isEmpty(assyJson.topAssembly)) {
		return;
	}
	if (Ext.isEmpty(assyJson.topAssembly.node)) {
		return;
	}
	Ext.each(assyJson.topAssembly.node, createAssemblyParentsTrav);
	return assyJson;
}

function createAssemblyParentsTrav(parent) {
	if (Ext.isEmpty(parent)) {
		return;
	}
	if (Ext.isEmpty(parent.node)) {
		return;
	}
	Ext.each(parent.node, function(child) {
		assemblyParents[child.elementId] = parent;
		createAssemblyParentsTrav(child);
	});
}

function findAssyParent(assyNode) {
	var parent = assemblyParents[assyNode.elementId];
	return Ext.isDefined(parent) ? parent : null;
}

function getPath(jsonNode) {
	var current = jsonNode;
	var reversePath = [];
	do {
		reversePath.push(current);
		current = findAssyParent(current);
	} while (!Ext.isEmpty(current));
	return reversePath.reverse();
}

function isChildPath(parentPath, childPath) {
	var parentNode = parentPath[parentPath.length - 1];
	var childNode = childPath[childPath.length - 1];
	if (parentNode.elementId == childNode.elementId) {
		return false;
	}
	return Ext.Array.some(childPath, function(childPathNode) {
		return parentNode.elementId == childPathNode.elementId;
	});
}

function findParentChildAndRemoveChild(elementIds) {
	var pathes = [];
	Ext.each(elementIds, function(elementId) {
		var jsonNode = assemblyObjects[elementId];
		var curPath = getPath(jsonNode);
		var containsParent = Ext.Array.some(pathes, function(path) {
			return isChildPath(path, curPath);
		});
		if (containsParent) {
			return;
		}
		pathes = Ext.Array.reduce(pathes, function(previous, path) {
			if (isChildPath(curPath, path)) {
				return previous;
			} else {
				previous.push(path);
				return previous;
			}
		}, []);
		pathes.push(curPath);
	});
	return Ext.Array.map(pathes, function(path) {
		var jsonNode = path[path.length - 1];
		return jsonNode.elementId;
	});
}

function compareString(left, right) {
	if (left < right) {
		return -1;
	} else if (left == right) {
		return 0;
	} else {
		return 1;
	}
}

function getBaseName(str) {
	var temp = [ "", "" ];
	var number = lt.util.getBaseNameNo(str, temp);
	return temp[0];
}

function createComparatorPath(lookLevel) {
	return function (leftNode, rightNode) {
		var leftPath = getPath(leftNode);
		var rightPath = getPath(rightNode);
		for (var level = 0; level < lookLevel; level++) {
			var leftHasLevel =leftPath.length > level; 
			var rightHasLevel =rightPath.length > level;
			if (!leftHasLevel && rightHasLevel) {
				return -1;
			} else if (!leftHasLevel && !rightHasLevel) {
				return 0;
			} else if (leftHasLevel && !rightHasLevel) {
				return 1;
			} else {
				var leftLevel = leftPath[level];
				var rightLevel = rightPath[level];
				var compLevel = compareString(leftLevel.elementId, rightLevel.elementId);
				if (compLevel != 0) {
					return compLevel;
				}
			}
		}
		return 0;
	}
}

function createComparatorInstance(instanceLevel) {
	
	var comparePath = createComparatorPath(instanceLevel);
	
	return function (leftNode, rightNode) {
		var leftBaseName = getBaseName(leftNode.elementId);
		var rightBaseName = getBaseName(rightNode.elementId);
		var compBase = compareString(leftBaseName, rightBaseName);
		if (compBase == 0) {
			var compType = compareString(leftNode.type, rightNode.type);
			if (compType == 0) {
				return comparePath(leftNode, rightNode);
			} else {
				return compType;
			}
		} else {
			return compBase;
		}
	}
}

function addIndexAssemblyJson(jsonData) {
	if (Ext.isEmpty(jsonData) || Ext.isEmpty(jsonData.topAssembly) || Ext.isEmpty(jsonData.topAssembly.node)) {
		return;
	}
	var nextIndex = 0;
	Ext.each(jsonData.topAssembly.node, function(jsonNode) {
		nextIndex = addIndexAssemblyJsonTrav(jsonNode, nextIndex);
	});
}

function addIndexAssemblyJsonTrav(jsonNode, nextIndex) {
	jsonNode.index = nextIndex++;
	if (Ext.isEmpty(jsonNode.node)) {
		return nextIndex;
	}
	Ext.each(jsonNode.node, function(childJsonNode) {
		nextIndex = addIndexAssemblyJsonTrav(childJsonNode, nextIndex);
	});
	return nextIndex;
}

function compareAssemblyJsonOrder(leftElementId, rightElementId) {
	var leftJsonNode = assemblyObjects[leftElementId];
	var rightJsonNode = assemblyObjects[rightElementId];
	if (leftJsonNode.index < rightJsonNode.right) {
		return -1;
	} else if (leftJsonNode.index == rightJsonNode.right) {
		return 0;
	} else {
		return 1;
	}
}

function getAssemblyData(jsonData) {

	if (!assemblyModelAttrs.isSetData) {
		createAssemblyModelAttrs();
		assemblyModelAttrs.isSetData = true;
	}

	if (!assemblyPropSections.isSetData && jsonData && jsonData.defs && jsonData.defs.attributeDef) {
		createAssemblyPropSections(jsonData);
		assemblyPropSections.isSetData = true;
	}

	getAssemblyObjects(jsonData);
	createAssemblyParents(jsonData);
}

function createAssemblyModelAttrs() {
	var groups = player.model.getAllGroups();
	Ext.each(groups, function(grp) {
		var elementId = grp.elementId;

		if (assemblyModelAttrs[elementId] === undefined) {
			assemblyModelAttrs[elementId] = {};
		}
		assemblyModelAttrs[elementId].groupType = grp.groupType;
		assemblyModelAttrs[elementId].groupClass = grp.groupClass;

		var attributes = lt.util.getAttribute(grp.org, '_*_OriginalCadID');
		if (attributes && attributes.value) {
			assemblyModelAttrs[elementId].cadID = attributes.value;
		} else {
			assemblyModelAttrs[elementId].cadID = '';
		}
		attributes = lt.util.getAttribute(grp.org, 'G@GrpURL');
		if (attributes && attributes.value) {
			assemblyModelAttrs[elementId].grpURL = attributes.value;
		} else {
			assemblyModelAttrs[elementId].grpURL = '';
		}

		assemblyModelAttrs[elementId].uniqueId = grp.uniqueId;

	});
}

function createAssemblyPropSections(jsonData) {

	Ext.each(jsonData.defs.attributeDef, function(def) {
		if (assemblyPropSections[def.section] === undefined) {
			assemblyPropSections[def.section] = [];
		}
		assemblyPropSections[def.section].push(def);
	});
}

function createManufacturePropSections(jsonData) {

	Ext.each(jsonData.defs.attributeDef, function(def) {
		if (manufacturePropSections[def.section] === undefined) {
			manufacturePropSections[def.section] = [];
		}
		manufacturePropSections[def.section].push(def);
	});
}

function createResourcePropSections(jsonData) {

	Ext.each(jsonData.defs.attributeDef, function(def) {
		if (resourcePropSections[def.section] === undefined) {
			resourcePropSections[def.section] = [];
		}
		resourcePropSections[def.section].push(def);
	});
}

function createLayerPropSections(jsonData) {

	Ext.each(jsonData.defs.attributeDef, function(def) {
		if (layerPropSections[def.section] === undefined) {
			layerPropSections[def.section] = [];
		}
		layerPropSections[def.section].push(def);
	});
}

function createNotePropSections(jsonData) {

	Ext.each(jsonData.defs.attributeDef, function(def) {
		if (notePropSections[def.section] === undefined) {
			notePropSections[def.section] = [];
		}
		notePropSections[def.section].push(def);
	});
}

function createDimensionPropSections(jsonData) {

	Ext.each(jsonData.defs.attributeDef, function(def) {
		if (dimensionPropSections[def.section] === undefined) {
			dimensionPropSections[def.section] = [];
		}
		dimensionPropSections[def.section].push(def);
	});
}

function createSnapshotPropSections(jsonData) {

	Ext.each(jsonData.defs.attributeDef, function(def) {
		if (snapshotPropSections[def.section] === undefined) {
			snapshotPropSections[def.section] = [];
		}
		snapshotPropSections[def.section].push(def);
	});
}

function getAssemblyObjects(jsonData) {

	if (!assemblyObjects.isSetData && jsonData && jsonData.topAssembly && jsonData.topAssembly.node) {

		Ext.each(jsonData.topAssembly.node, function(obj) {

			setAssemblyObject(obj);

			getAssemblyObjectsTrav(obj, assemblyPropSections);

		});

		assemblyObjects.isSetData = true;
	}
}

function getAssemblyObjectsTrav(childgroup, propSections) {

	if (childgroup && childgroup.node) {

		Ext.each(childgroup.node, function(obj) {

			setAssemblyObject(obj);

			getAssemblyObjectsTrav(obj, assemblyPropSections);

		});
	}
}

function setAssemblyObject(obj) {

	var userIdBase = '';
	var uniqueId = '';
	var attr = '';

	if (Ext.isEmpty(obj) || Ext.isEmpty(obj.elementId)) {
		return;
	}
	attr = assemblyModelAttrs[obj.elementId];
	if (Ext.isEmpty(attr)) {
		return;
	}
	uniqueId = attr.uniqueId;
	if (Ext.isEmpty(uniqueId)) {
		return;
	}
	userIdBase = MakeFormatStringAssembly(PROP_FORMAT_BASE_NAME, obj, assemblyPropSections, assemblyModelAttrs);
	if (Ext.isEmpty(userIdBase)) {
		return;
	}
	if (assemblyGroups[userIdBase] === undefined) {
		assemblyGroups[userIdBase] = [];
	}
	assemblyGroups[userIdBase].push(uniqueId);

	assemblyObjects[obj.elementId] = obj;
}

function getPropertyFromAssyJson(elementId, propFormatStr) {
	
	var analyzed = [ "", "", "" ];
	analyzeFormat(propFormatStr, analyzed);
	
	var propInfo = {}
	if (!Ext.isEmpty(analyzed[1])) {
		propInfo.section = analyzed[1];
	}
	propInfo.name = analyzed[2];
	
	var curAssyJsonNode = assemblyObjects[elementId];
	if (Ext.isEmpty(curAssyJsonNode)) {
		return propInfo;
	}
	
	getProperty(propInfo, curAssyJsonNode, assemblyPropSections);
	
	return propInfo;
}

//////////////////////////////////
function getProcessJsonData(jsonText) {

	Ext.each(jsonText.topProcess.variationDefs, function(obj) {

		if (obj.current) {
			curVari = obj.id;
		}

	});
	
	function removeIfInvalidProc(procs) {
		
		if (Ext.isEmpty(procs) ||
				!Ext.isArray(procs)) {
			return;
		}
		
		function isInvalidProc(proc) {
			
			var obj;
			if (getProcessCurVari(proc) == proc) {
				obj = proc;
			} else {
				obj = getProcessCurVari(proc);
			}
			return obj.valid === false;
		}
		
		var idx;
		while ((idx = procs.findIndex(isInvalidProc)) != -1) {
			procs.splice(idx, 1);
		}
		
		Ext.each(procs, function(proc) {
			removeIfInvalidProc(proc.node);
		});
	}

	removeIfInvalidProc(jsonText.topProcess.process);
	
	function createProcAndWorkNo(procs, stackedNums) {
		
		if (Ext.isEmpty(procs) ||
				!Ext.isArray(procs)) {
			return;
		}
		
		var nextProcNo = 1;
		var nextWorkNo = 1;
		
		Ext.each(procs, function(proc) {
			
			if (proc.procType != 'pprc') {
			
				stackedNums.push(nextProcNo++);
				proc.procNo = stackedNums.join('.');
				createProcAndWorkNo(proc.node, stackedNums);
				stackedNums.pop();
			} else {
				
				proc.procNo = stackedNums.join('.');
				proc.workNo = String(nextWorkNo++);
			}
		});
	};
	
	createProcAndWorkNo(jsonText.topProcess.process, []);
	
	return jsonText;
}

function getProcessData(jsonData) {
	if (!processPropSections.isSetData && jsonData && jsonData.defs && jsonData.defs.attributeDef) {
		Ext.each(jsonData.defs.attributeDef, function(def) {
			if (processPropSections[def.section] === undefined) {
				processPropSections[def.section] = [];
			}
			processPropSections[def.section].push(def);
		});
		processPropSections.isSetData = true;
	}

	getprocessObjects(jsonData);
}

function getprocessObjects(jsonData) {

	if (!processObjects.isSetData && jsonData && jsonData.topProcess && jsonData.topProcess.process) {

		Ext.each(jsonData.topProcess.process, function(obj) {

			setProcessObject(obj);

			getprocessObjectsTrav(obj, processPropSections);

		});

		processObjects.isSetData = true;
	}
}

function getprocessObjectsTrav(childgroup, propSections) {

	if (childgroup && childgroup.node) {

		Ext.each(childgroup.node, function(obj) {

			setProcessObject(obj);

			getprocessObjectsTrav(obj, processPropSections);

		});
	}
}

function setProcessObject(obj) {
	if (Ext.isEmpty(obj) || Ext.isEmpty(obj.bomId)) {
		return;
	}
	userIdBase = MakeFormatStringAssembly(PROP_FORMAT_BASE_NAME, obj, processPropSections, processModelAttrs);
	if (Ext.isEmpty(userIdBase)) {
		return;
	}

	if (Ext.isEmpty(obj.elementId)) {
		processObjects[obj.name] = obj;
	} else {
		processObjects[obj.elementId] = obj;
	}
}

function getResourceData(jsonData) {

	if (!resourcePropSections.isSetData && jsonData && jsonData.defs && jsonData.defs.attributeDef) {
		createResourcePropSections(jsonData);
		resourcePropSections.isSetData = true;
	}
	
	if (!resourceObjects.isSetData && jsonData && jsonData.topResource && jsonData.topResource.resource) {

		Ext.each(jsonData.topResource.resource, function(obj) {
			setResourceObject(obj);
		});

		resourceObjects.isSetData = true;
	}
}

function setResourceObject(obj) {
	if (Ext.isEmpty(obj)) {
		return;
	}

	if (Ext.isEmpty(obj.elementId)) {
		resourceObjects[obj.name] = obj;
	} else {
		resourceObjects[obj.elementId] = obj;
	}
}

function getResourceObject(id) {
	var ret = null;

	if (Ext.isEmpty(id)) {
		return ret;
	}

	return resourceObjects[id];
}

function getManufactureData(jsonData) {

	if (!assemblyModelAttrs.isSetData) {
		createAssemblyModelAttrs();
		assemblyModelAttrs.isSetData = true;
	}

	if (!manufacturePropSections.isSetData && jsonData && jsonData.defs && jsonData.defs.attributeDef) {
		createManufacturePropSections(jsonData);
		manufacturePropSections.isSetData = true;
	}

	if (!manufactureObjects.isSetData && jsonData && jsonData.topManufacture && jsonData.topManufacture.node) {

		Ext.each(jsonData.topManufacture.node, function(obj) {
			setManufactureObject(obj);

			getManufactureObjectsTrav(obj);
		});

		manufactureObjects.isSetData = true;
	}
}

function getManufactureObjectsTrav(childgroup) {

	if (childgroup && childgroup.node) {

		Ext.each(childgroup.node, function(obj) {

			setManufactureObject(obj);

			getManufactureObjectsTrav(obj);

		});
	}
}

function setManufactureObject(obj) {
	if (Ext.isEmpty(obj) || obj.type != 'manufacture') {
		return;
	}

	if (Ext.isEmpty(obj.entityId)) {
		manufactureObjects[obj.name] = obj;
	} else {
		manufactureObjects[obj.entityId] = obj;
	}
}

function getManufactureObject(id) {
	var ret = null;

	if (Ext.isEmpty(id)) {
		return ret;
	}

	return manufactureObjects[id];
}

function getLayerData(jsonData) {

	if (!assemblyModelAttrs.isSetData) {
		createAssemblyModelAttrs();
		assemblyModelAttrs.isSetData = true;
	}

	if (!layerPropSections.isSetData && jsonData && jsonData.defs && jsonData.defs.attributeDef) {
		createLayerPropSections(jsonData);
		layerPropSections.isSetData = true;
	}

	if (!layerObjects.isSetData && jsonData && jsonData.topLayer && jsonData.topLayer.layer) {

		Ext.each(jsonData.topLayer.layer, function(obj) {
			setLayerListObject(obj);
		});

		layerObjects.isSetData = true;
	}
}

function setLayerListObject(obj) {
	if (Ext.isEmpty(obj) || Ext.isEmpty(obj.name)) {
		return;
	}

	layerObjects[obj.name] = obj;
}

function getLayerListObject(id) {
	var ret = null;

	if (Ext.isEmpty(id)) {
		return ret;
	}

	return layerObjects[id];
}

function getNoteData(jsonData) {

	if (!assemblyModelAttrs.isSetData) {
		createAssemblyModelAttrs();
		assemblyModelAttrs.isSetData = true;
	}

	if (!notePropSections.isSetData && jsonData && jsonData.defs && jsonData.defs.attributeDef) {
		createNotePropSections(jsonData);
		notePropSections.isSetData = true;
	}

	if (!noteObjects.isSetData && jsonData && jsonData.topNote && jsonData.topNote.note) {

		Ext.each(jsonData.topNote.note, function(obj) {
			setNoteObject(obj);
		});

		noteObjects.isSetData = true;
	}
}

function setNoteObject(obj) {
	if (Ext.isEmpty(obj) || Ext.isEmpty(obj.name)) {
		return;
	}

	noteObjects[obj.name] = obj;
}

function getNoteObject(id) {
	var ret = null;

	if (Ext.isEmpty(id)) {
		return ret;
	}

	return noteObjects[id];
}
/////////////////////////////////

function getDimensionData(jsonData) {

	if (!assemblyModelAttrs.isSetData) {
		createAssemblyModelAttrs();
		assemblyModelAttrs.isSetData = true;
	}

	if (!layerPropSections.isSetData && jsonData && jsonData.defs && jsonData.defs.attributeDef) {
		createDimensionPropSections(jsonData);
		dimensionPropSections.isSetData = true;
	}

	if (!dimensionObjects.isSetData && jsonData && jsonData.topDimension && jsonData.topDimension.dimension) {

		Ext.each(jsonData.topDimension.dimension, function(obj) {
			setDimensionObject(obj);
		});

		dimensionObjects.isSetData = true;
	}
}

function setDimensionObject(obj) {
	if (Ext.isEmpty(obj) || Ext.isEmpty(obj.name)) {
		return;
	}

	dimensionObjects[obj.name] = obj;
}

function getdimensionObject(id) {
	var ret = null;

	if (Ext.isEmpty(id)) {
		return ret;
	}

	return dimensionObjects[id];
}

function getSnapshotData(jsonData) {

	if (!assemblyModelAttrs.isSetData) {
		createAssemblyModelAttrs();
		assemblyModelAttrs.isSetData = true;
	}

	if (!snapshotPropSections.isSetData && jsonData && jsonData.defs && jsonData.defs.attributeDef) {
		createSnapshotPropSections(jsonData);
		snapshotPropSections.isSetData = true;
	}

	if (!snapshotObjects.isSetData && jsonData && jsonData.topSnapshot && jsonData.topSnapshot.snapshot) {

		Ext.each(jsonData.topSnapshot.snapshot, function(obj) {
			setSnapshotObject(obj);
		});

		snapshotObjects.isSetData = true;
	}
}

function setSnapshotObject(obj) {
	if (Ext.isEmpty(obj) || Ext.isEmpty(obj.name)) {
		return;
	}

	snapshotObjects[obj.name] = obj;
}

function getSnapshotObject(id) {
	var ret = null;

	if (Ext.isEmpty(id)) {
		return ret;
	}

	return snapshotObjects[id];
}
////////////////////////////////////

function getExceptPropertyValue(currentAssemblies) {
	if (Ext.isEmpty(currentAssemblies) || Ext.isEmpty(currentAssemblies[0])) {
		return 'all';
	}
	var obj = assemblyObjects[currentAssemblies[0].elementId];
	if (Ext.isEmpty(obj)) {
		return 'all';
	}
	if (Ext.isEmpty(playerParam.main.exceptProperty)) {
		return 'none';
	}
	return MakeFormatStringAssembly(playerParam.main.exceptProperty, obj, assemblyPropSections, assemblyModelAttrs);
}

function createVisibilityMap(rootAssys) {
	if (Ext.isEmpty(rootAssys) || Ext.isEmpty(rootAssys[0])) {
		rootAssys = getDispTopGroups();
	}
	var visibilities = [];
	Ext.each(rootAssys, function(assy){
		assy.org.traverse(function(elem) {
			visibilities[elem.id] = elem.visible;
		});
		for (var obj = assy.org.parent; obj != null; obj = obj.parent) {
			visibilities[obj.id] = obj.visible;
		}
	});
	return visibilities;
}

function getUniqueId(group) {
	if (Ext.isEmpty(group)) {
		return null;
	} else {
		return group.elementId;
	} 
} 

var updateCurrentVisible = function() {
	
	var savedVisiblitiesList = [];
	
	return function(targetAssemblies, prevAssemblies, isDrillUp) {
		
		var targetLevel = 0;
		if (!Ext.isEmpty(targetAssemblies) && !Ext.isEmpty(targetAssemblies[0])) {
			var revpath = [];
			travParentElemID(targetAssemblies[0], revpath);
			targetLevel = revpath.length;
		}
		var prevLevel = 0;
		if (!Ext.isEmpty(prevAssemblies) && !Ext.isEmpty(prevAssemblies[0])) {
			var revpath = [];
			travParentElemID(prevAssemblies[0], revpath);
			prevLevel = revpath.length;
		}
		
		var visibilities = [];
		if (!isDrillUp) {
			
			if (prevAssemblies.length <= 1) {
				savedVisiblitiesList.push({
					curAssyUniqueId: Ext.isEmpty(prevAssemblies) ? null : getUniqueId(prevAssemblies[0]),
					curAssyLevel: prevLevel,
					visibilities: createVisibilityMap(prevAssemblies)
				});
			}
			
			visibilities = createVisibilityMap(targetAssemblies);
		} else {
			
			var savedVisibilitiesLine = null;
			if (targetAssemblies.length <= 1) {
				savedVisibilitiesLine = Ext.Array.findBy(savedVisiblitiesList, function(savedVisibilitiesLine) {
					var uniqueId = Ext.isEmpty(targetAssemblies) ? null : getUniqueId(targetAssemblies[0]);
					return savedVisibilitiesLine.curAssyUniqueId == uniqueId;
				});
			}
			if (Ext.isEmpty(savedVisibilitiesLine)) {
				visibilities = createVisibilityMap(prevAssemblies);
			} else {
				visibilities = savedVisibilitiesLine.visibilities;
			}
			savedVisiblitiesList = Ext.Array.reduce(savedVisiblitiesList, function(previous, savedVisibilitiesLine) {
				if (targetLevel > savedVisibilitiesLine.curAssyLevel) {
					previous.push(savedVisibilitiesLine);
				}
				return previous;
			}, []);
		}
	
		switch (getExceptPropertyValue(targetAssemblies)) {
		case 'all':
		case 'back':
			player.model.hideAllGroups();
			var dispTopGroups = getDispTopGroups();
			player.model.showGroups(dispTopGroups);
			break;
		default: // none
			player.model.hideAllGroups();
			player.model.showGroups(targetAssemblies);
			break;
		}
		player.model.setGroupVisibilities(visibilities);
	
		if (Ext.isEmpty(playerParam.main.drillupdownWithFit)) {
			;
		} else if (playerParam.main.drillupdownWithFit) {
			if (Ext.isEmpty(targetAssemblies) || Ext.isEmpty(targetAssemblies[0])) {
				player.view.fit();
			} else {
				player.view.fit(targetAssemblies);
			}
		}
	};
}();

function assyDrillup() {

	if (Ext.isEmpty(playerParam.main.enableDrillupdown) || !playerParam.main.enableDrillupdown) {
		Ext.Msg.alert("", web3d.CST.XVL_WEB3D_DRILLERR_INVALID);
		return false;
	}

	if (!Ext.isDefined(currentAssembly)) {
		Ext.Msg.alert("", web3d.CST.XVL_WEB3D_DRILLERR_DRILLUP_CANNOT_ANY_MORE);
		return false;
	}

	var dispTopGroups = getDispTopGroups();
	if (!Ext.isEmpty(dispTopGroups) && dispTopGroups.length === 1 && dispTopGroups[0] === currentAssembly) {
		Ext.Msg.alert("", web3d.CST.XVL_WEB3D_DRILLERR_DRILLUP_CANNOT_ANY_MORE);
		return false;
	}
	
	var prevGrps = Ext.isArray(currentAssembly) ? currentAssembly : [ currentAssembly ];
	var targetGrps = [];
	var targetPathes = [];
	var targetElementIdMap = {};
	var isCurrentAssemblyRoot = false;
	Ext.each(currentAssembly, function(currentAssemblyOne) {
		var targetPath = [];
		travParentElemID(currentAssemblyOne, targetPath);
		targetPath.reverse();
		Ext.Array.splice(targetPath, targetPath.length - 1, 1);
		if (Ext.isEmpty(targetPath)) {
			isCurrentAssemblyRoot = true;
			return false;
		}
		var targetGrp = player.model.getGroupByElementId(targetPath[targetPath.length - 1]);
		if (Ext.isDefined(targetElementIdMap[targetGrp.elementId])) {
			return true;
		}
		targetElementIdMap[targetGrp.elementId] = true;
		targetGrps.push(targetGrp);
		targetPathes.push(targetPath);
		return true;
	});
	if (isCurrentAssemblyRoot) {
		var targetGrps = [ undefined ];
		var targetPathes = [ [] ];
	}

	currentAssembly = targetGrps.length > 1 ? targetGrps : targetGrps[0];
	var curAssyLevel = targetPathes[0].length;

	var propTableIndex = getPropTablePropIndex(curAssyLevel);
	updatePropTableParam(propTableIndex);

	var partPropIndex = getPartListPropIndex(curAssyLevel);
	updatePartListParam(partPropIndex);

	updateViewSelectionUnit(curAssyLevel);

	updateSelectionView(targetGrps);
	
	if (propTableObj) {
		propTableObj.updateProperty(propTableParam);
	}

	if (!Ext.isEmpty(partListParam.relativeTo) || !Ext.isEmpty(partListParam.relativeFrom)) {
		partListObj.levelTo = Ext.isEmpty(partListParam.relativeTo) ? null : curAssyLevel + Number(partListParam.relativeTo) - 1;
		partListObj.levelFrom = Ext.isEmpty(partListParam.relativeFrom) ? 1 : curAssyLevel + Number(partListParam.relativeFrom) - 1;
	} else {
		partListObj.levelTo = Ext.isEmpty(partListParam.levelTo) ? null : Number(partListParam.levelTo);
		partListObj.levelFrom = Ext.isEmpty(partListParam.levelFrom) ? 1 : Number(partListParam.levelFrom);
	}
	
	controllerObj.notify({
		updateType: 'DRILL',
		selfObj: null,
		updateTagetElems: targetPathes
	});

	const isDrillUp = true;
	updateCurrentVisible(targetGrps, prevGrps, isDrillUp);

	controllerObj.notify({
		updateType: 'VISIBILITY_UPDATE_ALL',
		selfObj: null,
		updateTagetElems: player.model.getGroupVisibilities()
	});

	controllerObj.notify({
		updateType: 'SELECT_CLEAR',
		selfObj: null,
		updateTagetElems: []
	});
	
	return true;
}

function assyDrilldown(targetGrpArg) {

	if (Ext.isEmpty(playerParam.main.enableDrillupdown) || !playerParam.main.enableDrillupdown) {
		Ext.Msg.alert("", web3d.CST.XVL_WEB3D_DRILLERR_INVALID);
		return false;
	}

	var prevGrps = Ext.isArray(currentAssembly) ? currentAssembly : [ currentAssembly ];
	var targetGrps = [];
	if (Ext.isEmpty(targetGrpArg)) {
		var sels = player.model.getSelections();
		if (Ext.isEmpty(sels)) {
			Ext.Msg.alert("", web3d.CST.XVL_WEB3D_DRILLERR_SEL_NO_ASSY);
			return false;
		} else {
			targetGrps = sels;
		}
	} else if (Ext.isArray(targetGrpArg)) {
		targetGrps = targetGrpArg;
	} else {
		targetGrps = [ targetGrpArg ];
	}

	var validate = true;
	Ext.each(targetGrps, function(targetGrp) {
		if (targetGrp.groupType != lt.GROUP_TYPE_ASSEMBLY) {
			Ext.Msg.alert("", web3d.CST.XVL_WEB3D_DRILLERR_SEL_NO_ASSY);
			validate = false;
			return false;
		}
		var jsonNode = assemblyObjects[targetGrp.elementId];
		if (Ext.isEmpty(jsonNode)) {
			Ext.Msg.alert("", web3d.CST.XVL_WEB3D_DRILLERR_ASSY_INVALID);
			validate = false;
			return false;
		}
		if (!isLinkDisplay(jsonNode, assemblyPropSections, assemblyModelAttrs)) {
			for (var i = 0; i < partListParam.columns.length; i++) {
				if (partListParam.columns[i].formatter == 'link2drilldownformatter') {
					Ext.Msg.alert("", web3d.CST.XVL_WEB3D_DRILLERR_ASSY_INVALID);
					validate = false;
					return false;
				}
			}
		}
		if (Ext.isDefined(currentAssembly)) {
			Ext.each(currentAssembly, function(currentAssemblyOne) {
				var chkCurrentAssemblys = [];

				travParentElemID(currentAssemblyOne, chkCurrentAssemblys);
				chkCurrentAssemblys.reverse();
				var len = chkCurrentAssemblys.length - 1;
				chkCurrentAssemblys.splice(len, 1);

				Ext.each(chkCurrentAssemblys, function(chkCurrentAssembly) {
					if (chkCurrentAssembly === targetGrp.elementId) {
						Ext.Msg.alert("", web3d.CST.XVL_WEB3D_DRILLERR_SEL_NO_ASSY);
						validate = false;
						return false;
					}
				});
				if (!validate) {
					return false;
				}
			});
			if (!validate) {
				return false;
			}
		}
	});
	if (!validate) {
		return;
	}

	Ext.Array.sort(targetGrps, function(targetLeft, targetRight) {
		return compareAssemblyJsonOrder(targetLeft.elementId, targetRight.elementId);
	});

	var targetPathes = [];
	Ext.each(targetGrps, function(targetGrp) {
		var targetPath = [];
		travParentElemID(targetGrp, targetPath);
		targetPath.reverse();
		targetPathes.push(targetPath);
	});
	
	var validateLevel = true;
	Ext.each(targetPathes, function(targetPath) {
		if (targetPath.length != targetPathes[0].length) {
			validateLevel = false;
			return false;
		}
		return true;
	});
	if (!validateLevel) {
		Ext.Msg.alert("", web3d.CST.XVL_WEB3D_DRILLERR_NOT_SAME_LEVEL);
		return;
	}

	currentAssembly = targetGrps.length > 1 ? targetGrps : targetGrps[0];
	var curAssyLevel = targetPathes[0].length;

	var propTableIndex = getPropTablePropIndex(curAssyLevel);
	updatePropTableParam(propTableIndex);
	var partPropIndex = getPartListPropIndex(curAssyLevel);
	updatePartListParam(partPropIndex);

	updateViewSelectionUnit(curAssyLevel);

	updateSelectionView(targetGrps);
	
	if (propTableObj) {
		propTableObj.updateProperty(propTableParam);
	}

	if (!Ext.isEmpty(partListParam.relativeTo) || !Ext.isEmpty(partListParam.relativeFrom)) {
		partListObj.levelTo = Ext.isEmpty(partListParam.relativeTo) ? null : curAssyLevel + Number(partListParam.relativeTo) - 1;
		partListObj.levelFrom = Ext.isEmpty(partListParam.relativeFrom) ? 1 : curAssyLevel + Number(partListParam.relativeFrom) - 1;
	} else {
		partListObj.levelTo = Ext.isEmpty(partListParam.levelTo) ? null : Number(partListParam.levelTo);
		partListObj.levelFrom = Ext.isEmpty(partListParam.levelFrom) ? 1 : Number(partListParam.levelFrom);
	}
	
	controllerObj.notify({
		updateType: 'DRILL',
		selfObj: null,
		updateTagetElems: targetPathes
	});

	const isDrillDown = false;
	updateCurrentVisible(targetGrps, prevGrps, isDrillDown);

	controllerObj.notify({
		updateType: 'VISIBILITY_UPDATE_ALL',
		selfObj: null,
		updateTagetElems: player.model.getGroupVisibilities()
	});

	controllerObj.notify({
		updateType: 'SELECT_CLEAR',
		selfObj: null,
		updateTagetElems: []
	});

	return true;
}

function travParentElemID(grp, updateTagetElems) {

	if (Ext.isEmpty(grp)) {
		return;
	}

	updateTagetElems.push(grp.elementId);

	var parent = grp.getParent();

	if (parent) {
		travParentElemID(parent, updateTagetElems);
	}

}

function updateSelectionView(targetAssemblies) {

	if (Ext.isEmpty(playerParam.selectionView)) {
		return;
	}
		
	var enableSelectionView = true;
	
	if (Ext.isEmpty(targetAssemblies)) {
		targetAssemblies = [ undefined ];
	}
	
	if (!Ext.isEmpty(playerParam.selectionView.drillupdownSelViewProp)) {
		var isProp = false;
		Ext.each(targetAssemblies, function(targetAssembly) {
			if (!Ext.isEmpty(targetAssembly)) {
				var tagetElems = [];
				travParentElemID(targetAssembly, tagetElems);
				
				Ext.each(tagetElems, function(elem) {
					var propInfo = getPropertyFromAssyJson(elem, playerParam.selectionView.drillupdownSelViewProp);
					if (Ext.isEmpty(propInfo) || Ext.isEmpty(propInfo.type) || propInfo.type != 'bool') {
						return true;
					}
					if (Ext.isEmpty(propInfo.value)) {
						return true;
					}
					if (propInfo.value == 'true' || propInfo.value == 'false') {
						enableSelectionView = (propInfo.value == 'true');
						isProp = true;
						return false;
					}
				});
				return !isProp;
			}
		});
		if (!isProp) {
			if (!Ext.isEmpty(playerParam.selectionView.drillupdownSelViewPropDefault)) {
				enableSelectionView = playerParam.selectionView.drillupdownSelViewPropDefault;
			}
			else {
				enableSelectionView = false;
			}
		}
	}
	
	if (!Ext.isEmpty(playerParam.selectionView.drillupdownSelViewLevel)) {
		var len = 1;
		var targetAssembly = targetAssemblies[0];
		if (!Ext.isEmpty(targetAssembly)) {
			var tagetElems = [];
			travParentElemID(targetAssembly, tagetElems);
			len = tagetElems.length;
		}
		
		if (len >= playerParam.selectionView.drillupdownSelViewLevel) {
			enableSelectionView = true;
		}
		else {
			enableSelectionView = false;
		}
	}
	
	var playerSelectionView = Ext.ComponentQuery.query('component[name=compplayerselectionView]')[0];
	if (playerSelectionView) {
		if (!enableSelectionView) {
			playerSelectionView.hide();
			if (!Ext.isEmpty(player)) {
				player.enableSelectionView = false;
			}
		}
		else {
			playerSelectionView.show();
			if (!Ext.isEmpty(player)) {
				player.enableSelectionView = true;
			}
		}
	}
}

function isLinkDisplay(obj, propSections, elemAttrs) {

	if (Ext.isEmpty(partListParam.linkFilterProperty) && Ext.isEmpty(partListParam.unlinkFilterProperty)) {
		;
	} else if (!Ext.isEmpty(partListParam.linkFilterProperty) && Ext.isEmpty(partListParam.unlinkFilterProperty)) {

		if (partListParam.linkFilterProperty == 'fill' && partListParam.linkFilterPropertyName !== undefined) {
			if (!isMatchFormatStringAssembly(partListParam.linkFilterPropertyName, obj, propSections)) {
				return false;
			}
		} else if (partListParam.linkFilterProperty == 'value' && partListParam.linkFilterPropertyName !== undefined && partListParam.linkFilterPropertyValue !== undefined) {
			if (!isMatchFormatStringAssembly(partListParam.linkFilterPropertyName, obj, propSections, partListParam.linkFilterPropertyValue)) {
				return false;
			}
		}

	} else if (Ext.isEmpty(partListParam.linkFilterProperty) && !Ext.isEmpty(partListParam.unlinkFilterProperty)) {

		if (partListParam.unlinkFilterProperty == 'fill' && partListParam.unlinkFilterPropertyName !== undefined) {
			if (isMatchFormatStringAssembly(partListParam.unlinkFilterPropertyName, obj, propSections)) {
				return false;
			}
		} else if (partListParam.unlinkFilterProperty == 'value' && partListParam.unlinkFilterPropertyName !== undefined && partListParam.unlinkFilterPropertyValue !== undefined) {
			if (isMatchFormatStringAssembly(partListParam.unlinkFilterPropertyName, obj, propSections, partListParam.unlinkFilterPropertyValue)) {
				return false;
			}
		}

	} else {
		if (partListParam.linkFilterProperty == 'fill' && partListParam.linkFilterPropertyName !== undefined) {
			if (!isMatchFormatStringAssembly(partListParam.linkFilterPropertyName, obj, propSections)) {
				return false;
			}
		} else if (partListParam.linkFilterProperty == 'value' && partListParam.linkFilterPropertyName !== undefined && partListParam.linkFilterPropertyValue !== undefined) {
			if (!isMatchFormatStringAssembly(partListParam.linkFilterPropertyName, obj, propSections, partListParam.linkFilterPropertyValue)) {
				return false;
			}
		}

		if (partListParam.unlinkFilterProperty == 'fill' && partListParam.unlinkFilterPropertyName !== undefined) {
			if (isMatchFormatStringAssembly(partListParam.unlinkFilterPropertyName, obj, propSections)) {
				return false;
			}
		} else if (partListParam.unlinkFilterProperty == 'value' && partListParam.unlinkFilterPropertyName !== undefined && partListParam.unlinkFilterPropertyValue !== undefined) {
			if (isMatchFormatStringAssembly(partListParam.unlinkFilterPropertyName, obj, propSections, partListParam.unlinkFilterPropertyValue)) {
				return false;
			}
		}
	}

	return true;
}

function updateViewSelectionUnit(selLevel) {

	var viewSelectionUnit = null;
	do {

		if (view3DObj.isSearchResultSelUnit) {
			viewSelectionUnit = 'part';
			break;
		}

		if (Ext.isEmpty(selLevel)) {
			if (Ext.isEmpty(currentAssembly)) {
				selLevel = 0;
			} else {
				var currentAssemblyOne = null;
				if (Ext.isArray(currentAssembly)) {
					currentAssemblyOne = currentAssembly[0];
				} else {
					currentAssemblyOne = currentAssembly;
				}
				var path = [];
				travParentElemID(currentAssemblyOne, path);
				selLevel = path.length;
			}
		}

		viewSelectionUnit = playerParam.main.viewSelectionUnit;
		var propIndex = getPlayerPropIndex(selLevel);
		if (propIndex >= 0) {
			if (!Ext.isEmpty(playerParamProps) && propIndex >= 0 && playerParamProps.length > propIndex) {
				var playerProp = playerParamProps[propIndex];
				if (!Ext.isEmpty(playerProp) && !Ext.isEmpty(playerProp.viewSelectionUnit)) {
					viewSelectionUnit = playerProp.viewSelectionUnit;
				}
			}
		}

	} while (false);

	if (!Ext.isEmpty(viewSelectionUnit)) {
		if (viewSelectionUnit == 'assembly') {
			player.view.viewSelectionUnit = 'assembly';
			return;
		} else if (viewSelectionUnit == 'part') {
			player.view.viewSelectionUnit = 'part';
			return;
		} else if (viewSelectionUnit.indexOf('level_') === 0) {

			var params = viewSelectionUnit.split('_');
			if (params.length > 1) {
				var level = Number(params[1]);
				player.view.viewSelectionUnit = 'level_' + level;
				return;
			}

		} else if (viewSelectionUnit.indexOf('relative_') === 0) {
			if (playerParam.main.enableDrillupdown) {
				var len = selLevel == 0 ? 0 : selLevel - 1;

				var params = viewSelectionUnit.split('_');
				if (params.length > 1) {
					var level = Number(params[1]);
					player.view.viewSelectionUnit = 'level_' + (len + level);
					return;
				}
			}
		}
	}
	player.view.viewSelectionUnit = 'part';
}


function getDispTopGroups() {

	var groups, retGroups = [];

	groups = player.model.getTopGroups();
	if (Ext.isEmpty(groups)) {
		return retGroups;
	}
	Ext.each(groups, function(grp) {
		if (grp.groupClass == lt.GROUP_CLASS_NORMAL) {
			retGroups.push(grp);
		}
	});

	return retGroups;
}

function getPartListPropIndex(level) {
	var retIndex = -1;
	var retDefIndex = -1;
	if (level < 0) {
		return retIndex;
	}

	var nIndex = 0;
	for ( var index in partListParamProps) {
		var partListParamProp = partListParamProps[index];
		if (partListParamProp.propLevelFrom == null && partListParamProp.propLevelTo == null) {
			retDefIndex = nIndex;
		} else {
			var from = 0;
			var to = null;
			if (partListParamProp.propLevelFrom != null && partListParamProp.propLevelFrom !== '') {
				from = Number(partListParamProp.propLevelFrom);
			}
			if (partListParamProp.propLevelTo != null && partListParamProp.propLevelTo !== '') {
				to = Number(partListParamProp.propLevelTo);
			}
			if (level >= from) {
				if (to != null && level <= to) {
					retIndex = nIndex;
					break;
				} else if (to == null) {
					retIndex = nIndex;
					break;
				}
			}
		}
		nIndex++;
	}
	if (retIndex < 0 && retDefIndex >= 0) {
		retIndex = retDefIndex;
	}

	return retIndex;
}

function getPropTablePropIndex(level) {
	var retIndex = -1;
	var retDefIndex = -1;
	if (level < 0) {
		return retIndex;
	}

	var nIndex = 0;
	for ( var index in propTablePropList) {
		var prop = propTablePropList[index];
		if (prop.propLevelFrom == null && prop.propLevelTo == null) {
			retDefIndex = nIndex;
		} else {
			var from = 0;
			var to = null;
			if (prop.propLevelFrom != null && prop.propLevelFrom !== '') {
				from = Number(prop.propLevelFrom);
			}
			if (prop.propLevelTo != null && prop.propLevelTo !== '') {
				to = Number(prop.propLevelTo);
			}
			if (level >= from) {
				if (to != null && level <= to) {
					retIndex = nIndex;
					break;
				} else if (to == null) {
					retIndex = nIndex;
					break;
				}
			}
		}
		nIndex++;
	}
	if (retIndex < 0 && retDefIndex >= 0) {
		retIndex = retDefIndex;
	}

	return retIndex;
}

function getPlayerPropIndex(level) {
	var retIndex = -1;
	if (level < 0) {
		return retIndex;
	}

	var nIndex = 0;
	Ext.each(playerParamProps, function(prop) {
		var from = 0;
		var to = null;
		if (prop.propLevelFrom != null && prop.propLevelFrom !== '') {
			from = Number(prop.propLevelFrom);
		}
		if (prop.propLevelTo != null && prop.propLevelTo !== '') {
			to = Number(prop.propLevelTo);
		}
		if (level >= from) {
			if (to != null && level <= to) {
				retIndex = nIndex;
				return false;
			} else if (to == null) {
				retIndex = nIndex;
				return false;
			}
		}
		nIndex++;
	});

	return retIndex;
}

function updatePartListParam(propIndex) {
	if (!Ext.isEmpty(partListParamProps) && propIndex >= 0 && partListParamProps.length > propIndex) {
		var tmpPlayer = partListParam.player;
		var tmpIsDispComponent = partListParam.isDispComponent;

		var partListProp = partListParamProps[propIndex];
		if (partListProp) {
			partListParam = {};
			partListParam.columns = [];

			for ( var key in partListProp) {
				partListParam[key] = partListProp[key];
			}

			partListParam.player = tmpPlayer;
			partListParam.isDispComponent = tmpIsDispComponent;
		}
	}
}

function updatePropTableParam(propIndex) {
	if (!Ext.isEmpty(propTablePropList) && propIndex >= 0 && propTablePropList.length > propIndex) {
		var tmpPlayer = propTableParam.player;
		var tmpIsDispComponent = propTableParam.isDispComponent;

		var prop = propTablePropList[propIndex];
		if (prop) {
			propTableParam = [];
			propTableParam.property = [];

			for ( var pty in prop.property) {
				propTableParam.property.push(prop.property[pty]);
			}

			propTableParam.topAssembly = prop.topAssembly;
			propTableParam.player = tmpPlayer;
			propTableParam.isDispComponent = tmpIsDispComponent;
		}
	}
}

function getProcessByBomId(id, node) {
	var ret = null;
	if (!Ext.isEmpty(node.process)) {
		node.node = node.process;
	}

	if (Ext.isEmpty(node.node)) {
		return ret;
	}
	
	if (Ext.isEmpty(id)) {
		return ret;
	}

	for (var i = 0; i < node.node.length; i++) {
		if (node.node[i].bomId == id) {
			return node.node[i];
		}
		ret = getProcessByBomIdTrav(id, node.node[i]);
		if (ret != null) {
			return ret;
		}
	}
	return ret;
}

function getProcessByBomIdTrav(id, node) {
	var ret = null;

	if (Ext.isEmpty(node.node)) {
		return ret;
	}

	for (var i = 0; i < node.node.length; i++) {
		if (node.node[i].bomId == id) {
			return node.node[i];
		}
		ret = getProcessByBomIdTrav(id, node.node[i]);
		if (ret != null) {
			return ret;
		}
	}
	return ret;
}

function getSelWorkProcBomIds() {

	var dom = Ext.ComponentQuery.query('worklist[name=worklist]')[0];

	var selections = dom.getSelection();
	if (Ext.isEmpty(selections)) {
		return [];
	}

	var bomIds = [];
	Ext.each(selections, function(item, num, items) {

		if (Ext.isEmpty(item)) {
			return true;
		}

		bomIds.push(item.data.bomId);

	}, this);

	return bomIds;
}

function getSelWorkProcs() {

	var selWorkProcs = [];

	Ext.each(getSelWorkProcBomIds(), function(item, num, items) {

		if (Ext.isEmpty(item)) {
			return true;
		}

		var selWorkProc = getProcessByBomId(item, processJsonData.topProcess);
		if (Ext.isEmpty(selWorkProc)) {
			return true;
		}

		selWorkProcs.push(selWorkProc);

	}, this);

	return selWorkProcs;
}

function getFirstWorkProc() {

	var dom = Ext.ComponentQuery.query('worklist[name=worklist]')[0];

	if (dom.store.data.length > 0) {
		var bomId = dom.store.data.items[0].data.bomId;
		return getProcessByBomId(bomId, processJsonData.topProcess);
	} else {
		return null;
	}
}

function getLastWorkinProcess(process) {
	var ret = process
	if (!Ext.isEmpty(ret.process)) {
		ret.node = node.process;
	}

	while (!Ext.isEmpty(ret.node)) {
		ret = ret.node[ret.node.length - 1];
	}
	return ret;
}

function getProcessCurVari(node) {
	if (Ext.isEmpty(node.variation)) {
		return node;
	}

	for (var i = 0; i < node.variation.length; i++) {
		if (node.variation[i].ref == curVari)
			return node.variation[i];
	}
	return {};
}

function getAllData(treeStore) {
	if (Ext.isEmpty(treeStore)) {
		return [];
	}

	var allData = [];

	function trav(node) {
		if (Ext.isEmpty(node)) {
			return;
		}
		if (!node.isRoot()) {
			allData.push(node);
		}
		Ext.each(node.childNodes, function(child) {
			trav(child);
		});
	}

	trav(treeStore.getRoot());
	return allData;
}

function replaceDisplayStr(str) {
	
	str = str.replace(/[<]/g,"&lt;");
	str = str.replace(/[>]/g,"&gt;");
	
	return str;
}

function convPropNum(src) {
	if (Ext.isEmpty(src)) {
		return '';
	}
	var num = Number(src);
	if (isNaN(num)) {
		return src;
	}
	else {
		return num;
	}
}
