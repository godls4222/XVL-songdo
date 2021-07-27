//
// Toolbar
//
Toolbar = function (parameters) {

	'use strict';
    
    var self = this,
        cur_viewOpeMode;
    
    if (parameters === undefined) {
        throw new Error("ltError: Required argument. method=Toolbar, argument=parameters");
    }    
    
    this.player = parameters.player;
    
    this.controller = null;
    
    this.homeState = [];
    
    this.initCamera = {};
    
    this.initPosition = [];
    
    this.initColorTransparencies = [];
    
    this.loadingModel = false;

    this.update = function (parameters) {

        if (parameters.selfObj !== undefined && parameters.selfObj === this) {
            return;
        }        
        
        switch (parameters.updateType) {
            default:
                break;
        }        
    }    
    
    this.registController = function (controller) {
        this.controller = controller;
    }
    
	function $elem(id) {
		return document.getElementById(id);
	}   

    this.changeViewMode = function () {    
    
        if (!$('#view_mode_viewer_changeMode').hasClass('selected')) {
         
            $('#view_mode_viewer_pan').hide();
            $('#view_mode_viewer_rotate').hide();
            $('#view_mode_viewer_zoom').hide();
            $('#view_mode_viewer_region').hide();
            
            $('#view_mode_viewer_gazingpoint').hide();
            $('#rotateViewLeft').hide();
            $('#rotateViewRight').hide();
            $('#view_mode_viewer_fitSelection').hide();
            $('#view_mode_viewer_fixUp').hide();
            
            var toolbar1 = document.getElementById('menu_toolbar_1_body');
            self.toolBarWidth = toolbar1.style.width;
            toolbar1.style.width = self.toolBarWalkWidth;

            $('#view_mode_wt_pan').show();
            $('#view_mode_walk').show();
            $('#view_mode_look_around').show();
            $('#view_mode_wt_region').show();
            $('#view_mode_wt_backAndForth').show();
            
            $('#view_mode_viewer_pan, #view_mode_viewer_rotate, #view_mode_viewer_zoom, #view_mode_viewer_region').removeClass('selected');
            $('#view_mode_look_around, #view_mode_wt_pan, #view_mode_walk, #view_mode_wt_backAndForth, #view_mode_wt_region').removeClass('selected');            
            
            $('#view_mode_walk').addClass('selected');
            
            $('#view_mode_viewer_changeMode').addClass('selected');
            
            self.player.view.setOperationMode({mode:'walk',subMode:'walk'});
            
            $('#viewFront').hide();
            $('#viewBack').show();
            $('#viewRight').show();
            $('#viewLeft').show();
            $('#viewTop').hide();
            $('#viewBottom').hide();
            $('#viewIsometric1').hide();
            $('#viewIsometric2').hide();
            $('#viewIsometric3').hide();
            $('#viewIsometric4').hide();
            
            var toolbar2 = document.getElementById('menu_toolbar_2_body');
            self.toolBar2Height = toolbar2.style.height;
            toolbar2.style.height = self.toolBar2WalkHeight;            
            
        } else {
            
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
            toolbar1.style.width = self.toolBarWidth;
            
            $('#view_mode_wt_pan').hide();
            $('#view_mode_walk').hide();
            $('#view_mode_look_around').hide();
            $('#view_mode_wt_region').hide();
            $('#view_mode_wt_backAndForth').hide();
            
            $('#view_mode_viewer_pan, #view_mode_viewer_rotate, #view_mode_viewer_zoom, #view_mode_viewer_region').removeClass('selected');
            $('#view_mode_look_around, #view_mode_wt_pan, #view_mode_walk, #view_mode_wt_backAndForth, #view_mode_wt_region').removeClass('selected');            
            
            $('#view_mode_viewer_rotate').addClass('selected');
            
            $('#view_mode_viewer_changeMode').removeClass('selected');
            
            self.player.view.setOperationMode({mode:'view',subMode:'examine'});
            
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
            toolbar2.style.height = self.toolBar2Height;            
        }
    }

	function changeMode(event) {    

        self.changeViewMode();
    
    };
    
	function setViewMode(event) {
        
        if(self.loadingModel){
            window.alert(XVL_WEB3D_ERR_LOADING_MODEL_TOOLBAR);
            return;
        }
        
		$('#view_mode_viewer_pan, #view_mode_viewer_rotate, #view_mode_viewer_zoom, #view_mode_viewer_region, #view_mode_viewer_gazingpoint').removeClass('selected');
        $('#view_mode_look_around, #view_mode_wt_pan, #view_mode_walk, #view_mode_wt_backAndForth, #view_mode_wt_region').removeClass('selected');
        
		$(this).addClass('selected');
        
        var toolbar2 = document.getElementById('menu_toolbar_2_body');
        
		switch(event.target.id) {
			case 'view_mode_viewer_rotate' :
				self.player.view.setOperationMode({mode:'view',subMode:'examine'});
				break;
			case 'view_mode_viewer_pan' :
				self.player.view.setOperationMode({mode:'view',subMode:'pan'});
				break;
			case 'view_mode_viewer_zoom' :
				self.player.view.setOperationMode({mode:'view',subMode:'zoom'});
				break;
			case 'view_mode_viewer_region' :
				self.player.view.setOperationMode({mode:'view',subMode:'region'});
				break;
            case 'view_mode_viewer_gazingpoint' :
				if ('gazingPoint' === self.player.view.getOperationMode().subMode) {
                	setViewGazingPointModeEnd();
				} else {
                	cur_viewOpeMode = self.player.view.getOperationMode();
                	self.player.view.setOperationMode({mode:'view',subMode:'gazingPoint'});
				}
                break;
			case 'view_mode_look_around' :
				self.player.view.setOperationMode({mode:'walk',subMode:'look'});
                
                $('#viewFront').show();
                $('#viewBack').hide();
                $('#viewRight').show();
                $('#viewLeft').show();
                $('#viewTop').show();
                $('#viewBottom').show();
                $('#viewIsometric1').hide();
                $('#viewIsometric2').hide();
                $('#viewIsometric3').hide();
                $('#viewIsometric4').hide();
            
                toolbar2.style.height = self.toolBar2WalkHeightLook;                
				break;
			case 'view_mode_wt_pan' :
				self.player.view.setOperationMode({mode:'walk',subMode:'pan'});
                
                $('#viewFront').hide();
                $('#viewBack').show();
                $('#viewRight').show();
                $('#viewLeft').show();
                $('#viewTop').hide();
                $('#viewBottom').hide();
                $('#viewIsometric1').hide();
                $('#viewIsometric2').hide();
                $('#viewIsometric3').hide();
                $('#viewIsometric4').hide();
            
                toolbar2.style.height = self.toolBar2WalkHeightPan;                
				break;
			case 'view_mode_walk' :
				self.player.view.setOperationMode({mode:'walk',subMode:'walk'});
                
                $('#viewFront').hide();
                $('#viewBack').show();
                $('#viewRight').show();
                $('#viewLeft').show();
                $('#viewTop').hide();
                $('#viewBottom').hide();
                $('#viewIsometric1').hide();
                $('#viewIsometric2').hide();
                $('#viewIsometric3').hide();
                $('#viewIsometric4').hide();
            
                toolbar2.style.height = self.toolBar2WalkHeightWalk;
				break;
			case 'view_mode_wt_backAndForth' :
				self.player.view.setOperationMode({mode:'walk',subMode:'backAndForth'});
                
                $('#viewFront').hide();
                $('#viewBack').hide();
                $('#viewRight').hide();
                $('#viewLeft').hide();
                $('#viewTop').hide();
                $('#viewBottom').hide();
                $('#viewIsometric1').hide();
                $('#viewIsometric2').hide();
                $('#viewIsometric3').hide();
                $('#viewIsometric4').hide();
            
                toolbar2.style.height = self.toolBar2WalkHeightRegion;                
				break;
			case 'view_mode_wt_region' :
				self.player.view.setOperationMode({mode:'walk',subMode:'region'});
                
                $('#viewFront').hide();
                $('#viewBack').hide();
                $('#viewRight').hide();
                $('#viewLeft').hide();
                $('#viewTop').hide();
                $('#viewBottom').hide();
                $('#viewIsometric1').hide();
                $('#viewIsometric2').hide();
                $('#viewIsometric3').hide();
                $('#viewIsometric4').hide();
            
                toolbar2.style.height = self.toolBar2WalkHeightBack;                
				break;                
			default:
				break;
		}
	};  
    
	function fit(event) {
        if(self.loadingModel){
            window.alert(XVL_WEB3D_ERR_LOADING_MODEL_TOOLBAR);
            return;
        }        
		self.player.view.fit(self.player.model.getSelections());
	}  
    
	function pickTrans(event) {
        if(self.loadingModel){
            window.alert(XVL_WEB3D_ERR_LOADING_MODEL_TOOLBAR);
            return;
        }
		if (self.player.selectionTransparentMode === lt.SEL_TRANS_SEL) {
            self.player.selectionTransparentMode = lt.SEL_TRANS_NORMAL;
            $('#view_mode_viewer_pickTrans').removeClass('selected');
        } else {
            self.player.selectionTransparentMode = lt.SEL_TRANS_SEL;
            $('#view_mode_viewer_pickTrans').addClass('selected');
            $('#view_mode_viewer_pickTransNot').removeClass('selected');
        }
	}

	function pickTransNot(event) {
        if(self.loadingModel){
            window.alert(XVL_WEB3D_ERR_LOADING_MODEL_TOOLBAR);
            return;
        }
		if (self.player.selectionTransparentMode === lt.SEL_TRANS_NO_SEL) {
            self.player.selectionTransparentMode = lt.SEL_TRANS_NORMAL;
            $('#view_mode_viewer_pickTransNot').removeClass('selected');
        } else {
            self.player.selectionTransparentMode = lt.SEL_TRANS_NO_SEL;
            $('#view_mode_viewer_pickTransNot').addClass('selected');
            $('#view_mode_viewer_pickTrans').removeClass('selected');
        }
	}
    
	function pickFixUp(event) {
        if(self.loadingModel){
            window.alert(XVL_WEB3D_ERR_LOADING_MODEL_TOOLBAR);
            return;
        }
        var ds = self.player.view.getDisplaySettings();
        ds.fixUp = !ds.fixUp;
        self.player.view.setDisplaySettings(ds);
        
		if (ds.fixUp) {
            $('#view_mode_viewer_fixUp').addClass('selected');
        } else {
            $('#view_mode_viewer_fixUp').removeClass('selected');
        }
	}    
    
	function viewDirection(event) {
        if(self.loadingModel){
            window.alert(XVL_WEB3D_ERR_LOADING_MODEL_TOOLBAR);
            return;
        }        
		switch(event.target.id) {
			case 'viewFront' :
				self.player.view.setDirection('front');
				break;
			case 'viewBack' :
				self.player.view.setDirection('back');
				break;
			case 'viewRight' :
				self.player.view.setDirection('right');
				break;
			case 'viewLeft' :
				self.player.view.setDirection('left');
				break;
			case 'viewTop' :
				self.player.view.setDirection('top');
				break;
			case 'viewBottom' :
				self.player.view.setDirection('bottom');
				break;
			case 'viewIsometric1' :
				self.player.view.setDirection('isometric1');
				break;
			case 'viewIsometric2' :
				self.player.view.setDirection('isometric2');
				break;
			case 'viewIsometric3' :
				self.player.view.setDirection('isometric3');
				break;
			case 'viewIsometric4' :
				self.player.view.setDirection('isometric4');
				break;
			default:
				break;
		}
	}
    
	function viewRotate(event) {
        if(self.loadingModel){
            window.alert(XVL_WEB3D_ERR_LOADING_MODEL_TOOLBAR);
            return;
        }        
		switch(event.target.id) {
			case 'rotateViewLeft' :
				self.player.view.rotateViewingCamera(0, 0, 90.0);
				break;
			case 'rotateViewRight' :
				self.player.view.rotateViewingCamera(0, 0, -90.0);
				break;
			default:
				break;
		}
	}
    
	function setViewGazingPointModeEnd() {
		self.player.view.setOperationMode(cur_viewOpeMode);
        
        $('#view_mode_viewer_pan, #view_mode_viewer_rotate, #view_mode_viewer_zoom, #view_mode_viewer_region, #view_mode_viewer_gazingpoint').removeClass('selected');
        $('#view_mode_look_around, #view_mode_wt_pan, #view_mode_walk, #view_mode_wt_backAndForth, #view_mode_wt_region').removeClass('selected');
        
        switch (cur_viewOpeMode.mode){
            case "view":
                switch (cur_viewOpeMode.subMode){
                case "examine":       
                    $('#view_mode_viewer_rotate').addClass('selected');                        
                    break;
                case "pan":       
                    $('#view_mode_viewer_pan').addClass('selected');
                    break;
                case "zoom":       
                   $('#view_mode_viewer_zoom').addClass('selected');
                    break;
                case "region":       
                    $('#view_mode_viewer_region').addClass('selected');
                    break;
                default:
                    break;                        
                }
                break;
            case "walk":
                switch (cur_viewOpeMode.subMode){
                case "walk":
                    $('#view_mode_walk').addClass('selected');
                    break;
                case "pan":
                    $('#view_mode_wt_pan').addClass('selected');
                    break;
                case "look":
                    $('#view_mode_look_around').addClass('selected');
                    break;
                case 'backAndForth':
                    $('view_mode_wt_backAndForth').addClass('selected');
                    break;
                case "region":
                    $('#view_mode_wt_region').addClass('selected');
                    break;
                default:
                    break;
                }
                break;
            default:
                break;                  
        }
	}

    function changeDisplay() {
        if(self.loadingModel){
            window.alert(XVL_WEB3D_ERR_LOADING_MODEL_TOOLBAR);
            return;
        }
        var Parameters = [],
            groups = [],
            currentState;

        groups = self.player.model.getSelections();
        if(groups.length > 0){
            if(groups[0].visibility){

                self.player.model.hideGroups(groups);

            } else {

                self.player.model.showGroups(groups);

            }
        }

        currentState = self.player.model.getGroupVisibilities();

        Parameters.updateType = "VISIBILITY_UPDATE_ALL";
        Parameters.updateTagetElems = currentState;
        self.controller.notify(Parameters);
    }
    
    function home() {
        if(self.loadingModel){
            window.alert(XVL_WEB3D_ERR_LOADING_MODEL_TOOLBAR);
            return;
        }        
        var Parameters = [];
        
        self.player.model.setGroupVisibilities(self.homeState);
        self.player.view.setViewingCameraParameters(self.initCamera);
        self.player.model.setGroupPositions(self.initPosition);
        self.player.model.setColorTransparencies(self.initColorTransparencies);
        
        Parameters.updateType = "VISIBILITY_UPDATE_ALL";
        Parameters.updateTagetElems = self.homeState;
        self.controller.notify(Parameters);
    }
    
    function wire() {
        if(self.loadingModel){
            window.alert(XVL_WEB3D_ERR_LOADING_MODEL_TOOLBAR);
            return;
        }        
        var ds = self.player.view.getDisplaySettings();
        ds.displaySurface = false;
        ds.displayCurveInside = true;
        self.player.view.setDisplaySettings(ds);
        
    	$('#view_mode_viewer_wire').addClass('selected');
    	$('#view_mode_viewer_shading').removeClass('selected');
    	$('#view_mode_viewer_wireshading').removeClass('selected');        
    }
    
    function shading() {
        if(self.loadingModel){
            window.alert(XVL_WEB3D_ERR_LOADING_MODEL_TOOLBAR);
            return;
        }        
        var ds = self.player.view.getDisplaySettings();
        ds.displaySurface = true;
        ds.displayCurveInside = false;
        self.player.view.setDisplaySettings(ds);
        
    	$('#view_mode_viewer_wire').removeClass('selected');
    	$('#view_mode_viewer_shading').addClass('selected');
    	$('#view_mode_viewer_wireshading').removeClass('selected');        
    }
    
    function wireshading() {
        if(self.loadingModel){
            window.alert(XVL_WEB3D_ERR_LOADING_MODEL_TOOLBAR);
            return;
        }        
        var ds = self.player.view.getDisplaySettings();
        ds.displaySurface = true;
        ds.displayCurveInside = true;
        self.player.view.setDisplaySettings(ds);
        
    	$('#view_mode_viewer_wire').removeClass('selected');
    	$('#view_mode_viewer_shading').removeClass('selected');
    	$('#view_mode_viewer_wireshading').addClass('selected');
    }

	$('#menu_toolbar_1_header_oc').click(function(){
		if ('toolbar/img/open-yoko.png' == $('#menu_toolbar_1_header_oc').attr('src')) {
			$('#menu_toolbar_1_header_oc').attr('src', 'toolbar/img/close-yoko.png');
			$('#menu_toolbar_1_body').hide();
		} else {
			$('#menu_toolbar_1_header_oc').attr('src', 'toolbar/img/open-yoko.png');
			$('#menu_toolbar_1_body').show();
		}
	});

	$('#menu_toolbar_2_header_oc').click(function(){
		if ('toolbar/img/open-tate.png' == $('#menu_toolbar_2_header_oc').attr('src')) {
			$('#menu_toolbar_2_header_oc').attr('src', 'toolbar/img/close-tate.png');
			$('#menu_toolbar_2_body').hide();
		} else {
			$('#menu_toolbar_2_header_oc').attr('src', 'toolbar/img/open-tate.png');
			$('#menu_toolbar_2_body').show();
		}
	});    
    
    $elem('view_mode_viewer_changeMode').addEventListener('click', changeMode, false);
    $elem('view_mode_viewer_pan').addEventListener('click', setViewMode, false);
    $elem('view_mode_viewer_rotate').addEventListener('click', setViewMode, false);
    $elem('view_mode_viewer_zoom').addEventListener('click', setViewMode, false);
    $elem('view_mode_viewer_region').addEventListener('click', setViewMode, false);
    $elem('view_mode_walk').addEventListener('click', setViewMode, false);
    $elem('view_mode_wt_pan').addEventListener('click', setViewMode, false);
    $elem('view_mode_look_around').addEventListener('click', setViewMode, false);
    $elem('view_mode_wt_backAndForth').addEventListener('click', setViewMode, false);
    $elem('view_mode_wt_region').addEventListener('click', setViewMode, false);    
    $elem('view_mode_viewer_fit').addEventListener('click', fit, false);
    $elem('viewFront').addEventListener('click', viewDirection, false);
    $elem('viewBack').addEventListener('click', viewDirection, false);
    $elem('viewRight').addEventListener('click', viewDirection, false);
    $elem('viewLeft').addEventListener('click', viewDirection, false);
    $elem('viewTop').addEventListener('click', viewDirection, false);
    $elem('viewBottom').addEventListener('click', viewDirection, false);
    $elem('viewIsometric1').addEventListener('click', viewDirection, false);
    $elem('viewIsometric2').addEventListener('click', viewDirection, false);
    $elem('viewIsometric3').addEventListener('click', viewDirection, false);
    $elem('viewIsometric4').addEventListener('click', viewDirection, false);
    $elem('rotateViewLeft').addEventListener('click', viewRotate, false);
    $elem('rotateViewRight').addEventListener('click', viewRotate, false);
    $elem('view_mode_viewer_pickTrans').addEventListener('click', pickTrans, false);
    $elem('view_mode_viewer_pickTransNot').addEventListener('click', pickTransNot, false);    
    $elem('view_mode_viewer_fixUp').addEventListener('click', pickFixUp, false);    
    $elem('view_mode_viewer_gazingpoint').addEventListener('click', setViewMode, false);
    $elem('view_mode_viewer_changeDisplay').addEventListener('click', changeDisplay, false);
    $elem('view_mode_viewer_home').addEventListener('click', home, false);
    $elem('view_mode_viewer_wire').addEventListener('click', wire, false);
    $elem('view_mode_viewer_shading').addEventListener('click', shading, false);
    $elem('view_mode_viewer_wireshading').addEventListener('click', wireshading, false);    
    
    this.player.addEventListener('ltViewGazingPoint', setViewGazingPointModeEnd);
};
