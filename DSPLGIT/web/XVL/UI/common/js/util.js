
var getChildrenCount = function($parent) {
	var childrenCount = 0;
	$parent.children().each(function() {
		childrenCount++;
	});
	return childrenCount;
};

var getSelectUserIds = function(model) {
	var selectIds = [];
	$.each(model.getSelections(), function(i, group) {
		if (isDisplay(group)) {
			var idGroup = model.getGroupByUniqueId(group.uniqueId);
			if (isDisplay(idGroup)) {
				selectIds[idGroup.userIdBase] = true;
			}
		}
	});
	return selectIds;
};

var getSelectGroupIds = function(model) {
	var selectIds = [];
	$.each(model.getSelections(), function(i, group) {
		if (isDisplay(group)) {
			var idGroup = model.getGroupByUniqueId(group.uniqueId);
			if (isDisplay(idGroup)) {
				selectIds[idGroup.uniqueId] = true;
			}
		}
	});
	return selectIds;
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
	if(group.groupClass !== lt.GROUP_CLASS_NORMAL){
		return false;
	}
	var type = group.groupType;
	return type === lt.GROUP_TYPE_ASSEMBLY || type === lt.GROUP_TYPE_PART || type === lt.GROUP_TYPE_EMPTY || type === lt.GROUP_TYPE_ERRROR;
};