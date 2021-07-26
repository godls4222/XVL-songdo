
//
// sceneList 構築
//
(function () {

	'use strict';
 
	var elt,
		i,
		len,
		option,
		name;
	
	elt = document.getElementById('scenes_list');
	
	while (elt.hasChildNodes()) {

		elt.removeChild(elt.lastChild);

	}

	len = sceneList.length;
	
	for (i = 0; i < len + 1; i = i + 1) {

		option = document.createElement("option");

		if (i === 0) {
			option.text = '[Empty]';
		} else {
			name = sceneList[i - 1].name;
			option.text = name;
		}

		elt.add(option);

	}
 
}());
 
(function () {
	
	'use strict';

	var player = null,
        controller = null,
        view3D = null,
        toolbar = null,
        view3DParam = {},
        toolbarParam = {},        
		init = false,
        dispProgress = false;
    
    // プロパティ
    view3DParam.part_no = $('#part_no');
    view3DParam.original_Path = $('#original_Path');    
    
	function $elem(id) {
		return document.getElementById(id);
	}

	//
	// local function
	//

    //
    // ロード完了イベント
    //    
	function loadModelEnd() {
        
        console.log('loadModelEnd');
        
        if(!player.fileLoading){
            loadModelCompleted();
        }
	}
    
    //
    // テクスチャロード完了イベント
    //    
	function loadTextureEnd() {
        
        console.log('loadTextureEnd');        

        loadModelCompleted();
        
	}
    
    //
    // ファイル読み込み完了時の処理
    //    
    function loadModelCompleted() {
        
        var select,
            viewMode,
			index;      
        
        player.view.enableRedraw = true;
        toolbar.loadingModel = false;
        dispProgress = false;
        $('#progress_waku').hide();        
        
		// ホームボタンの動作のため，ロード直後の表示状態と視点方向と配置を保存する
        toolbar.homeState = player.model.getGroupVisibilities();
        toolbar.initCamera = player.view.getViewingCameraParameters();
        toolbar.initPosition = player.model.getGroupPositions();

        // サンプルのコンテンツでは以下の操作を有効にする
        // ビュー選択操作可能
        // 空中選択解除
        player.view.enableViewSelection = true;
        player.view.emptySelectionClear = true;
        
        player.selectionTransparentMode = lt.SEL_TRANS_NORMAL;
        
        // ツールバーアイコンの選択状態の初期化
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
        
        $('#view_mode_viewer_changeMode').removeClass('selected');
        
        //
        // ツールバー1
        //        
        $('#view_mode_viewer_pan').show();
        $('#view_mode_viewer_rotate').show();
        $('#view_mode_viewer_zoom').show();
        $('#view_mode_viewer_region').show();
        
        $('#view_mode_viewer_gazingpoint').show();
        $('#rotateViewLeft').show();
        $('#rotateViewRight').show();
        $('#view_mode_viewer_fitSelection').show();
        $('#view_mode_viewer_fixUp').show();

        // 動的にツールバー1のサイズを変更
        var toolbar1 = document.getElementById('menu_toolbar_1_body');
        toolbar1.style.width = toolbar.toolBarWidth;

        $('#view_mode_wt_pan').hide();
        $('#view_mode_walk').hide();
        $('#view_mode_look_around').hide();
        $('#view_mode_wt_region').hide();
        $('#view_mode_wt_backAndForth').hide();
        
        //
        // ツールバー2
        //
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
        
        // 動的にツールバー2のサイズを変更
        var toolbar2 = document.getElementById('menu_toolbar_2_body');
        toolbar2.style.height = toolbar.toolBar2Height;        
        
		select = document.getElementById("scenes_list");
		index = select.selectedIndex;
		if (index === 0 || index === -1) {
			index = undefined;
		} else {
			index = index - 1;
		}
        
		if (index !== undefined) {

            viewMode = sceneList[index].viewMode;

            if(viewMode === "walk"){
                toolbar.changeViewMode();
            }
            
        }
	}
    
    //
    // ダウンロード進捗イベント
    // @param {object} event イベント
    //
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
    
    //
    // ロードエラーイベント
    // @param {object} event イベント
    //
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
        
        window.alert(strError);
	}

	//
	// シーンリストでシーンを選択したときの処理
	//
	function selectScene() {

		var select,
			index,
			url,
            isImport,
			data = {};      

		select = document.getElementById("scenes_list");
		index = select.selectedIndex;

		if (index === 0 || index === -1) {
			index = undefined;
		} else {
			index = index - 1;
		}
        
		if (index !== undefined) {

			url = sceneList[index].url;

            player.view.enableRedraw = false;
            toolbar.loadingModel = true;        
            dispProgress = true;
            
            player.loadFile({url: url});
		}

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
    
    //
    // ツールバー
    //
    toolbarParam.player = player;
    toolbar = new Toolbar(toolbarParam);
    toolbar.loadingModel = false;
    
    //
    // ツールバー1/2 のモード切り替え時のツールバーのサイズ
    // ※ウォークスルーモードの場合に表示する項目が変わった場合、以下の値を調整すること。
    //
    // toolBarWalkWidth:ツールバー1の横幅のサイズ
    // toolBarWalkWidth:ツールバー2の縦幅のサイズ
    // toolBarWalkWidth:ツールバー2の「パン」を指定した場合の縦幅のサイズ
    // toolBarWalkWidth:ツールバー2の「ウォーク」を指定した場合の縦幅のサイズ
    // toolBarWalkWidth:ツールバー2の「見回す」を指定した場合の縦幅のサイズ
    // toolBarWalkWidth:ツールバー2の「範囲指定」を指定した場合の縦幅のサイズ
    // toolBarWalkWidth:ツールバー2の「前進・後退」を指定した場合の縦幅のサイズ
    //
    toolbar.toolBarWalkWidth = "470px";
    toolbar.toolBar2WalkHeight = "130px";
    toolbar.toolBar2WalkHeightPan= "130px";
    toolbar.toolBar2WalkHeightWalk= "130px";
    toolbar.toolBar2WalkHeightLook= "215px";
    toolbar.toolBar2WalkHeightRegion= "35px";
    toolbar.toolBar2WalkHeightBack= "35px";

    //
    // 各オブジェクトリスト側で更新を実施する場合にオブジェクトを登録する
    // 必ず View 3D のオブジェクトを最初に登録すること   
    //
    controller = new Controller();
    controller.registController(view3D);
    controller.registController(toolbar);

    view3D.registController(controller);
    toolbar.registController(controller);
    
    selectScene();

	if (init === false) {
        
		$elem('scenes_list').addEventListener('change', selectScene, false);
		$elem('scenes_list').addEventListener('dblclick', selectScene, false);
		$elem('tool_bar0').addEventListener('keydown', function (event) {
			if(event.preventDefault){
				event.preventDefault();
			} else {
				return false;
			}
		}, false);
        
		init = true;
	}
    
	// プログレスバーの初期化
	$('#progress').progressbar({
		value: 0,
		max: 100
	});
    
}());
