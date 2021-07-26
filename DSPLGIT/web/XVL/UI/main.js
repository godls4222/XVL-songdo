(function () {

	'use strict';
 
}());
 
(function () {
	
	'use strict';

	var player = null,
        controller = null,
        view3D = null,
        assyTree = null,
        toolbar = null,
        view3DParam = {},
        assyTreeParam = {},
        toolbarParam = {},
        COMPONENT_ID_ASSY_TREE = 'assyTree',
        dispProgress = false;
    
	function $elem(id) {
		return document.getElementById(id);
	}

	//
	// local function
	//

	function loadModelEnd() {
        
        console.log('loadModelEnd');
        
        if(!player.fileLoading){
            loadModelCompleted();
        }
	}
	
	function loadTextureEnd() {
        
        console.log('loadTextureEnd');        

        loadModelCompleted();
        
	}
 
    function loadModelCompleted() {
        
        player.view.enableRedraw = true;
        toolbar.loadingModel = false;
        dispProgress = false;
        $('#progress_waku').hide();
        
        assyTree.createAssyTree();
        
        toolbar.homeState = player.model.getGroupVisibilities();
        toolbar.initCamera = player.view.getViewingCameraParameters();
        toolbar.initPosition = player.model.getGroupPositions();
        toolbar.initColorTransparencies = player.model.getColorTransparencies();

        player.view.enableViewSelection = true;
        player.view.emptySelectionClear = true;
        
        player.selectionTransparentMode = lt.SEL_TRANS_NORMAL;
        
		$('#view_mode_viewer_pan, #view_mode_viewer_rotate, #view_mode_viewer_zoom, #view_mode_viewer_region').removeClass('selected');
        $('#view_mode_look_around, #view_mode_wt_pan, #view_mode_walk, #view_mode_wt_backAndForth, #view_mode_wt_region').removeClass('selected');
        
		$('#view_mode_viewer_rotate').addClass('selected');
        $('#view_mode_viewer_pickTrans').removeClass('selected');
        $('#view_mode_viewer_pickTransNot').removeClass('selected');        
        $('#view_mode_viewer_gazingpoint').removeClass('selected');
        
        var ds = player.view.getDisplaySettings();
        if(ds.fixUp){
            $('#view_mode_viewer_fixUp').addClass('selected');
        } else {
            $('#view_mode_viewer_fixUp').removeClass('selected');
        }
        
        if(!ds.displaySurface && ds.displayCurveInside){
        	$('#view_mode_viewer_wire').addClass('selected');
        	$('#view_mode_viewer_shading').removeClass('selected');
        	$('#view_mode_viewer_wireshading').removeClass('selected');
        } else if(ds.displaySurface && !ds.displayCurveInside){
        	$('#view_mode_viewer_wire').removeClass('selected');
        	$('#view_mode_viewer_shading').addClass('selected');
        	$('#view_mode_viewer_wireshading').removeClass('selected');
        } else if(ds.displaySurface && ds.displayCurveInside){
        	$('#view_mode_viewer_wire').removeClass('selected');
        	$('#view_mode_viewer_shading').removeClass('selected');
        	$('#view_mode_viewer_wireshading').addClass('selected');
        }
        
        $('#view_mode_viewer_changeMode').removeClass('selected');
              
        $('#view_mode_viewer_pan').show();
        $('#view_mode_viewer_rotate').show();
        $('#view_mode_viewer_zoom').show();
        $('#view_mode_viewer_region').show();
        
        $('#view_mode_viewer_gazingpoint').show();
        $('#rotateViewLeft').show();
        $('#rotateViewRight').show();
        $('#view_mode_viewer_fitSelection').show();
        $('#view_mode_viewer_fixUp').show();

        var toolbar1 = document.getElementById('menu_toolbar_1_body');
        toolbar1.style.width = toolbar.toolBarWidth;

        $('#view_mode_wt_pan').hide();
        $('#view_mode_walk').hide();
        $('#view_mode_look_around').hide();
        $('#view_mode_wt_region').hide();
        $('#view_mode_wt_backAndForth').hide();
        
        $('#viewFront').show();
        $('#viewBack').show();
        $('#viewRight').show();
        $('#viewLeft').show();
        $('#viewTop').show();
        $('#viewBottom').show();
        $('#viewIsometric1').show();
        $('#viewIsometric2').show();
        $('#viewIsometric3').show();
        $('#viewIsometric4').show();        
        
        var toolbar2 = document.getElementById('menu_toolbar_2_body');
        toolbar2.style.height = toolbar.toolBar2Height;        
	}
    
	function loadModelProgress(event) {
        
		var percent;
        
		if(event.fileType == 'json'){
            if(event.loaded === 0 || event.total === 0 ){
                percent = 0;
            } else {
                percent = (event.loaded / event.total) / 2;   
            }
		}
		if(event.fileType == 'bin'){
            if(event.loaded === 0 || event.total === 0 ){
                percent = 0.5;
            } else {
                percent = 0.5 + (event.loaded / event.total) / 2;  
            }
		}
		percent = parseInt(percent * 100);
		$('#progress').progressbar('value', percent);
		$('#progress_waku span').text(percent + "%");
        
        if(percent !== 100 && dispProgress){
             $('#progress_waku').show();
        } else {
            $('#progress_waku').hide();
        }
	}

	function loadError(event) {
        
        player.view.enableRedraw = true;
        toolbar.loadingModel = false;
        dispProgress = false;
        $('#progress_waku').hide();
        
        var strError = "";
        strError += XVL_WEB3D_ERR_LOADING_MODEL_FAILURE_MAIN;
        strError += event.url;
        strError += XVL_WEB3D_ERR_LOADING_MODEL_FAILURE_DETAIL;
        strError += "errorType: " + event.errorType + "\n";
        strError += "url: " + event.url + "\n";
        strError += "httpStatus: " + event.httpStatus + "\n";
		strError += "message: " + event.message + "\n";
		strError += "stack: " + event.stack + "\n";
        
        window.alert(strError);
	}
	
    var param = {};
    param.elementId = 'container';
    param.currentCoordinate = true;
    param.backgroundColor = "#ffffff";
    param.backgroundColor2 = "#333399";
    player = new lt.Player(param);
    
    player.addEventListener('ltLoad', loadModelEnd);
    player.addEventListener('ltLoadTexture', loadTextureEnd);
    player.addEventListener('ltDownloadProgress', loadModelProgress);
    player.addEventListener('ltLoadError', loadError);
    
    //
    // View 3D
    //
    view3DParam.player = player;
    view3D = new View3D(view3DParam);

	assyTreeParam.isDispComponent = true;
	
	var $div = $('#' + COMPONENT_ID_ASSY_TREE);
	$div.css('width', convertInt($div.css('width')) + 'px');
	$div.css('height', convertInt($div.css('height')) + 'px');
	
	createDivComponent(COMPONENT_ID_ASSY_TREE);
	$('#assyTree_body').append($('<div id="tree"></div>'));
	$('#tree').dynatree({
		imagePath: 'dynatree/css/dynatree/custom/',
		persist: false,
		clickFolderMode: 2,
		checkbox: true,
		selectMode: 2,
		fx: {height: 'toggle', duration: 200},
		noLink: false,
		debugLevel: 0,
		additionalSelection: 'NONE',
	});   
    
    assyTreeParam.player = player;
	assyTreeParam.mainTree = $('#tree');
	assyTreeParam.scrollbar = $('#assyTree_body');
	assyTreeParam.nodeCreateLevel = 100;
	assyTreeParam.nodeExpandLevel = 1;
	assyTreeParam.topNodeName = id;
	assyTreeParam.altNameFormat = '${XVL_NAME}';
	
    assyTree = new Assytree(assyTreeParam);
    
    toolbarParam.player = player;
    toolbar = new Toolbar(toolbarParam);
    toolbar.loadingModel = false;
    
    toolbar.toolBarWalkWidth = "590px";
    toolbar.toolBar2WalkHeight = "130px";
    toolbar.toolBar2WalkHeightPan= "130px";
    toolbar.toolBar2WalkHeightWalk= "130px";
    toolbar.toolBar2WalkHeightLook= "215px";
    toolbar.toolBar2WalkHeightRegion= "35px";
    toolbar.toolBar2WalkHeightBack= "35px";

    controller = new Controller();
    controller.registController(view3D);
    controller.registController(assyTree);
    controller.registController(toolbar);

    view3D.registController(controller);
    assyTree.registController(controller);
    toolbar.registController(controller);
    
	$('#progress').progressbar({
		value: 0,
		max: 100
	});
    
    loadModel();
    
	function loadModel() {
        player.view.enableRedraw = false;
        toolbar.loadingModel = true;        
        dispProgress = true;
		player.loadFile({url: url});
	}
    
	function createDivComponent(id) {
		var $div = $('#' + id);
		var $header = $('<div id="' + id + '_header"></div>');
		var $body   = $('<div id="' + id + '_body"></div>');
		$div.append($header);
		$div.append($body);
		createSwitchControl(id);
		$header.css('height', '20px');
		$header.css('width', $div.css('width'));
		$header.css('position', 'relative');
		$body.css('width', $div.css('width'));
		$body.css('height', (convertInt($div.css('height')) - convertInt($header.css('height'))) + 'px');
		$body.css('position', 'relative');
		if ($div.hasClass('drag-drop')) {
			$div.removeClass('drag-drop');
			$header.addClass('drag-drop');
		}
	};

	function createSwitchControl(id) {
		var $header = $('#' + id + '_header');
		var $body   = $('#' + id + '_body');
		var $switch = $('<label class="switch"></label>');
		var $span   = $('<span class="label"></span>');
		var $check  = $('<input type="checkbox" checked="checked" />');
		$header.append($switch);
		$switch.append($check);
		$switch.append($span);
		$span.append($('<span class="on"></span>'));
		$span.append($('<span class="separator"></span>'));
		$span.append($('<span class="off"></span>'));
		var isPlayerComponent = false;
		$check.on('click', function() {
			if ($(this).prop('checked')) {
				$body.show();
				if (isPlayerComponent) {
					setCanvas($('#' + id));
				}
			} else {
				$body.hide();
				if (!isPlayerComponent) {
					$body.parent('div').css('height', '20px');
				}
			}
		});
	};	
}());
