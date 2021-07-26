/**
 * 画面要素を描画します.
 * <p>
 *   各表示コンポーネントは、メインプレイヤー以外はヘッダ部とボディ部を持ち、
 *   ヘッダ部には表示非表示ボタンを実装します.
 *   ※重ね合わせレイアウトの場合のみ
 * </p>
 */
(function() {
	'use strict';
	/** コンポーネントID：プレイヤー. */
	var COMPONENT_ID_PLAYER = 'web3dPlayer';
	/** コンポーネントID：プレイヤー(メイン). */
	var COMPONENT_ID_PLAYER_MAIN = 'web3dPlayer_main';
	/** コンポーネントID：プレイヤー(選択パート). */
	var COMPONENT_ID_PLAYER_PART = 'web3dPlayer_part';
	/** コンポーネントID：プレイヤー(全体). */
	var COMPONENT_ID_PLAYER_ALL = 'web3dPlayer_all';
	/** コンポーネントID：ツールバー. */
	var COMPONENT_ID_TOOLBAR = 'toolbar';
	/** コンポーネントID：構成ツリー. */
	var COMPONENT_ID_ASSY_TREE = 'assyTree';
	/** コンポーネントID：プロパティ. */
	var COMPONENT_ID_PROP_TABLE = 'propTable';
	/** コンポーネントID：部品表. */
	var COMPONENT_ID_PART_LIST = 'partslist';
	/** コンポーネントID：固定値. */
	var COMPONENT_ID_CONTENT = 'staticContent';
	/** コンポーネントID：検索. */
	var COMPONENT_ID_SEARCH = 'search';

	$(function() {
		initDisp();
		$.getScript(ver + '/js/main.js');
		setLayout($('body'));
		adjustComponent();
	});

	/**
	 * 各コンポーネントを描画します.
	 * <ul>
	 *   <li>各画面要素を作成します.</li>
	 *   <li>ツールバー要素を設定します.</li>
	 *   <li>構成ツリーの初期設定を行います.</li>
	 * </ul>
	 */
	var initDisp = function() {
		var $body = $('body');
		if (ini.component) {
			$.each(ini.component, function(i, component) {
				$body.append(createComponent(component, $body));
			});
		}
		createPlayer();
		createAssyTree();
		createPartList();
		createPropTable();
		createstaticContents();
		createToolbar();
		createSearch();
		$.getScript(ver + '/UI/js/drag-drop.js');
	};

	/**
	 * 設定ファイルからコンポーネントを作成します.
	 * 
	 * @param  component
	 * @param  $parent
	 * @return jQueryオブジェクトのdiv要素
	 */
	var createComponent = function(component, $parent) {
		
		console.log(component);
		console.log($parent);
		var $div = $('<div></div>');
		setSize($div, $parent, component);
		if (component.region) {
			$div.addClass(component.region);
		} else {
			$div.attr('id', component.id);
			setPosition($div, $parent, component);
			if (component.draggable === true) {
				$div.addClass('drag-drop');
			}
			setProperty($div, component);
		}
		if (component.component) {
			$.each(component.component, function(i, child) {
				$div.append(createComponent(child, $div));
			});
		}
		return $div;
	};

	/**
	 * コンポーネントのサイズを設定します.
	 * <p>
	 *   サイズ指定がない場合は100%とします<br />
	 *   ※ピクセルではなくパーセント表示に計算しなおします
	 * </p>
	 * 
	 * @param $div
	 * @param $parent
	 * @param component
	 */
	var setSize = function($div, $parent, component) {
		var parentWidth;
		var parentHeight;
		if ($parent.selector === 'body') {
			parentWidth  = window.innerWidth;
			parentHeight = window.innerHeight;
		} else {
			parentWidth  = $parent.css('width');
			parentHeight = $parent.css('height');
		}
		if ($parent.attr('id')) {
			$div.css('position', 'absolute');
			$div.css('width' , component.width  ? percentToPixel(component.width , parentWidth)  : '0px');
			$div.css('height', component.height ? percentToPixel(component.height, parentHeight) : '0px');
		} else {
			$div.css('float' , 'left');
			$div.css('width' , component.width  ? percentToPixel(component.width , parentWidth)  : parentWidth);
			$div.css('height', component.height ? percentToPixel(component.height, parentHeight) : parentHeight);
		}
	};

	/**
	 * コンポーネントの位置を設定します.
	 * 
	 * @param $div
	 * @param $parent
	 * @param component
	 */
	var setPosition = function($div, $parent, component) {
		if (component.positionLeft) {
			$div.css('left', pixelToPercent(component.positionLeft, $parent.css('width')));
		} else {
			if (component.positionRight) {
				$div.css('right', pixelToPercent(component.positionRight, $parent.css('width')));
			} else {
				$div.css('left', '0px');
			}
		}
		if (component.positionTop) {
			$div.css('top', pixelToPercent(component.positionTop, $parent.css('height')));
		} else {
			if (component.positionBottom) {
				$div.css('bottom', pixelToPercent(component.positionBottom, $parent.css('height')));
			} else {
				$div.css('top', '0px');
			}
		}
	};
	
	/**
	 * コンポーネント要素を作成します.
	 * 
	 * @param  data
	 * @param  style
	 * @param  isDiv
	 * @return コンポーネント要素
	 */
	var renderComponent = function(data, style, isDiv) {
		return data.id ? renderDispComponent(data, style, isDiv) : renderLayoutComponent(data, style);
	};

	/**
	 * 表示コンポーネントにプロパティを設定します.
	 * 
	 * @param div
	 * @param data
	 */
	var setProperty = function($div, data) {
		switch (data.id) {
		case COMPONENT_ID_PLAYER:
			createPlayerParam($div, data.property);
			break;
		case COMPONENT_ID_TOOLBAR:
			createToolbarParam($div, data.property);
			break;
		case COMPONENT_ID_ASSY_TREE:
			createAssyTreeParam(data.property);
			break;
		case COMPONENT_ID_PROP_TABLE:
			createPropTableParam(data.property);
			break;
		case COMPONENT_ID_PART_LIST:
			createPartListParam(data.property);
			break;
		case COMPONENT_ID_CONTENT:
			createStaticContent($div, data.property);
			break;
		case COMPONENT_ID_SEARCH:
			createSearchParam(data.property);
			break;
		default:
			break;
		}	
	};

	/**
	 * プレイヤー初期パラメータを作成します.
	 * 
	 * @param $div
	 * @param props
	 */
	var createPlayerParam = function($div, props) {
		var type = getType(props, 'main');
		$div.attr('id', $div.attr('id') + '_' + type);
		setDefaultPlayerParam(type);
		$.each(props, function(i, prop) {
			switch (prop.name) {
			case 'annotationFontFamily':
			case 'dimensionFontFamily':
				playerParam[type][prop.name] = prop.value.split(',');
				break;
			case 'minimumFPS':
			case 'shadowIntensity':
				playerParam[type][prop.name] = parseFloat(prop.value);
				break;
			case 'currentCoordinate':
			case 'fixUp':
			case 'fxaaEnabled':
			case 'shadowMapEnabled':
			case 'ssaoEnabled':
			case 'displaySurface':
			case 'displayCurveInside':				
				playerParam[type][prop.name] = (prop.value === 'true');
				break;
			case 'coordinate':
			case 'projection':
				playerParam[type][prop.name] = eval(prop.value);
				break;
			default:
				playerParam[type][prop.name] = prop.value;
				break;
			}
		});
	};

	/**
	 * Playerのパラメータに初期値を設定します.
	 * 
	 * @param type
	 */
	var setDefaultPlayerParam = function(type) {
		playerParam[type] = {};
		playerParam[type].elementId = COMPONENT_ID_PLAYER + '_' + type;
	};

	/**
	 * 構成ツリー初期パラメータを作成します.
	 * 
	 * @param props
	 */
	var createAssyTreeParam = function(props) {
		assyTreeParam.topNodeName = id;
		$.each(props, function(i, prop) {
			switch (prop.name) {
			case 'nodeCreateLevel':
			case 'nodeExpandLevel':
				assyTreeParam[prop.name] = parseInt(prop.value, 10);
				break;
			case 'altNameFormat':
				assyTreeParam[prop.name] = prop.value;
				break;
			default:
				break;
			}
		});
		if (!assyTreeParam.altNameFormat) {
			assyTreeParam.altNameFormat = '${XVL_NAME}';
		}
	};

	/**
	 * ツールバー初期パラメータを作成します.
	 * 
	 * @param $div
	 * @param props
	 */
	var createToolbarParam = function($div, props) {
		var type = getType(props);
		if (type) {
			$div.attr('id', $div.attr('id') + '_' + type);
			toolbarParam[type] = {'button': []};
			$.each(props, function(i, prop) {
				switch (prop.name) {
				case 'direction':
					toolbarParam[type].direction = prop.value;
					break;
				case 'button':
					toolbarParam[type].button.push(prop.value);
					break;
				default:
					break;
				}
			});
		}
	};

	/**
	 * 部品表のパラメータを作成します.
	 * <table border="1">
	 *   <tr>
	 *     <th>type</th>
	 *     <td>
	 *       表示内容<br />
	 *       assembly:アセンブリのみ<br />
	 *       part:パートのみ<br />
	 *       all:アセンブリ、パート両方(デフォルト値)
	 *     </td>
	 *   </tr>
	 *   <tr><th>levelFrom</th><td>表示開始階層</td></tr>
	 *   <tr><th>levelTo</th><td>表示終了階層</td></tr>
	 *   <tr><th>groupby</th><td>一致判定用のキー(フォーマットで指定)</td></tr>
	 *   <tr><th>sort</th><td>ソート列番号</td></tr>
	 *   <tr>
	 *     <th>order</th>
	 *     <td>
	 *       ソート基準<br />
	 *       asc:昇順<br />
	 *       desc:降順
	 *     </td>
	 *   </tr>
	 *   <tr><th>title[n]</th><td>列のタイトル</td></tr>
	 *   <tr>
	 *     <th>type[n]</th>
	 *     <td>
	 *       列の種別<br />
	 *       prop:プロパティ<br />
	 *       qty:一致したパート数
	 *     </td>
	 *   </tr>
	 *   <tr><th>width[n]</th><td>列幅(デフォルト150)(単位：px)</td></tr>
	 *   <tr><th>format[n]</th><td>画面表示フォーマット値</td></tr>
	 * </table>
	 * 
	 * @param props
	 */
	var createPartListParam = function(props) {
		partListParam.columns = [];
		var properties = {};
		$.each(props, function(i, prop) {
			properties[prop.name] = prop.value;
		});
		partListParam.type = 'all';
		partListParam.levelFrom = 1;
		$.each(props, function(i, prop) {
			switch (prop.name) {
			case 'type':
			case 'levelFrom':
			case 'levelTo':
			case 'groupby':
			case 'sort':
			case 'order':
				partListParam[prop.name] = prop.value;
				break;
			default:
				createPartColumnParam(properties, prop.name);
				break;
			}
		});
	};

	/**
	 * 部品表テーブルの各列のパラメータを作成します.
	 * <table border="1">
	 *   <tr><th>title[n]</th><td>列のタイトル</td></tr>
	 *   <tr>
	 *     <th>type[n]</th>
	 *     <td>
	 *       列の種別<br />
	 *       prop:プロパティ<br />
	 *       qty:一致したパート数
	 *     </td>
	 *   </tr>
	 *   <tr><th>width[n]</th><td>列幅(デフォルト150)(単位：px)</td></tr>
	 *   <tr><th>format[n]</th><td>画面表示フォーマット値</td></tr>
	 * </table>
	 * 
	 * @param props
	 * @param key
	 */
	var createPartColumnParam = function(props, key) {
		var group = key.match(/title\[(\d+)\]/);
		if (group != null && group.length > 1) {
			var index = group[1];
			var width = props['width[' + index + ']'] ? convertInt(props['width[' + index + ']'] + 'px') : 10;
			switch (props['type[' + index + ']']) {
			case 'prop':
				var col = {
					type: 0,
					name: props['title[' + index + ']'],
					width: width,
					format: props['format[' + index + ']'],
					folderId: props['folderId[' + index + ']'],
					searchAttributeName: props['searchAttributeName[' + index + ']'],
					windowTarget: props['windowTarget[' + index + ']']
				};
				if (props['formatter[' + index + ']'] != null) {
					col.formatter = formatter[props['formatter[' + index + ']']];
				}
				partListParam.columns.push(col);
				formats[index] = props['format[' + index + ']'];
				break;
			case 'qty':
				partListParam.columns.push({type: 3, name: props['title[' + index + ']'], width: width, format: ''});
				break;
			default:
				break;
			}
		}
	};

	/**
	 * プロパティのパラメータを作成します.
	 * <table border="1">
	 *   <tr>
	 *     <th>type</th>
	 *     <td>
	 *       プロパティタイプ<br />
	 *       top:トップアセンブリ<br />
	 *       part:選択アセンブリ(デフォルト)
	 *     </td>
	 *   </tr>
	 *   <tr><th>name[n]</th><td>画面表示ラベル名</td></tr>
	 *   <tr><th>format[n]</th><td>画面表示フォーマット値</td></tr>
	 * </table>
	 * 
	 * @param props
	 */
	var createPropTableParam = function(props) {
		var properties = {};
		$.each(props, function(i, prop) {
			properties[prop.name] = prop.value;
		});
		propTableParam.property = [];
		propTableParam.topAssembly = false;
		$.each(props, function(i, prop) {
			var group = prop.name.match(/name\[(\d+)\]/);
			if (group != null && group.length > 1) {
				propTableParam.property.push({
					'name': prop.value,
					'format' : properties['format[' + group[1] + ']'],
					'formatter': properties['formatter[' + group[1] + ']'],
					'folderId': properties['folderId[' + group[1] + ']'],
					'searchAttributeName': properties['searchAttributeName[' + group[1] + ']'],
					'windowTarget': properties['windowTarget[' + group[1] + ']']
				});
			} else {
				if (prop.name === 'type') {
					propTableParam.topAssembly = (prop.value == 'top');
				}
			}
		});
	};

	/**
	 * 固定値をインクルードします.
	 * 
	 * @param $div
	 * @param props
	 */
	var createStaticContent = function($div, props) {
		$.each(props, function(i, prop) {
			switch (prop.name) {
			case 'id':
				$div.attr('id', prop.value);
				break;
			case 'url':
				staticContents[$div.attr('id')] = prop.value;
				break;
			default:
				break;
			}
		});
	};

	/**
	 * 検索初期パラメータを作成します.
	 * 
	 * @param props
	 */
	var createSearchParam = function(props) {
		$.each(props, function(i, prop) {
			switch (prop.name) {
			case 'hidden':
				searchParam[prop.name] = (prop.value === 'true');
				break;
			default:
				searchParam[prop.name] = prop.value;
			}
		});
	};

	/**
	 * プロパティからタイプを取得します.
	 * 
	 * @param  props
	 * @param  defaultValue
	 * @return タイプ
	 */
	var getType = function(props, defaultValue) {
		var type = defaultValue;
		$.each(props, function(i, prop) {
			switch (prop.name) {
			case 'type':
				type = prop.value;
				return;
			default:
				break;
			}
		});
		return type;
	};

	/**
	 * プレイヤーコンポーネントを作成します.
	 */
	var createPlayer = function() {
		var $progress = $('<div id="progress_waku"></div>');
		$('body').append($progress);
		$progress.append($('<div id="progress"></div>'));
		$progress.append($('<span>0%</span>'));
		$progress.hide();
		if ($('#' + COMPONENT_ID_PLAYER_PART).length > 0) {
			createDivComponent(COMPONENT_ID_PLAYER_PART);
		}
		if ($('#' + COMPONENT_ID_PLAYER_ALL).length > 0) {
			createDivComponent(COMPONENT_ID_PLAYER_ALL);
		}
	};

	/**
	 * 構成ツリー要素を作成します.
	 */
	var createAssyTree = function() {
		if ($('#' + COMPONENT_ID_ASSY_TREE).length == 0) {
			return;
		}
		assyTreeParam.isDispComponent = true;
		createDivComponent(COMPONENT_ID_ASSY_TREE);
		$('#assyTree_body').append($('<div id="tree"></div>'));
		$('#tree').dynatree({
			imagePath: ver + '/dynatree/css/dynatree/custom/',
			persist: false,
			clickFolderMode: 2,
			checkbox: true,
			selectMode: 2,
			fx: {height: 'toggle', duration: 200},
			noLink: false,
			debugLevel: 0,
			additionalSelection: 'NONE',
		});
	};

	/**
	 * プロパティ要素を作成します.
	 */
	var createPropTable = function() {
		if ($('#' + COMPONENT_ID_PROP_TABLE).length == 0) {
			return;
		}
		propTableParam.isDispComponent = true;
		createDivComponent(COMPONENT_ID_PROP_TABLE);
		var table = '<table border="0" height="100%" width="100%">';
		$.each(propTableParam.property, function(row, prop) {
			table += '<tr>';
			table += '<th class="proptitle">' + prop.name + '</th>';
			table += '<th class="propval" id="' + prop.name + '"></th>';
			table += '</tr>';
		});
		table += '</table>';
		$('#propTable_body').html(table);
	};

	/**
	 * 固定値要素を作成します.
	 */
	var createstaticContents = function() {
		$.each(staticContents, function(id, url) {
			$.ajax(url, {
				type: 'get',
				dataType: 'html'
			}).done(function(html) {
				if (templatebaseurl != '') {
					html = html.replace(/\$\{baseUrl\}/g, templatebaseurl + 'static/');
				}
				$('#' + id).html(html);
			});
		});
	};

	/**
	 * 部品表のコンポーネントを作成します.
	 */
	var createPartList = function() {
		if ($('#' + COMPONENT_ID_PART_LIST).length == 0) {
			return;
		}
		partListParam.isDispComponent = true;
		createDivComponent(COMPONENT_ID_PART_LIST);
	};

	/**
	 * ツールバー要素を生成します.
	 */
	var createToolbar = function() {
		var toolbarPath = ver + '/toolbar/img/svg/';
		for (var key in toolbarParam) {
			var param = toolbarParam[key];
			var $toolbar = $('#toolbar_' + key);
			var $header  = $('<div id="toolbar_' + key + '_header"></div>');
			var $body    = $('<div id="toolbar_' + key + '_body"></div>');
			$toolbar.append($header);
			$toolbar.append($body);
			if (param.direction === 'horizontal') {
				$header.css('width' , '20px');
				$header.css('height', $toolbar.css('height'));
				$header.append($('<img src="' + ver + '/toolbar/img/open-yoko.png" class="img_header" />'));
				$header.css('position', 'absolute');
				$body.css('left', '20px');
				$body.css('width' , convertInt($toolbar.css('width')) - 20 + 'px');
				$body.css('height', $toolbar.css('height'));
				$body.css('position', 'absolute');
				$toolbar.css('width', '0px');
			} else {
				$header.css('width' , $toolbar.css('width'));
				$header.css('height', '20px');
				$header.append($('<img src="' + ver + '/toolbar/img/open-tate.png" class="img_header" />'));
				$body.css('width' , $toolbar.css('width'));
				$body.css('height', convertInt($toolbar.css('height')) - 20 + 'px');
				$toolbar.css('height', '0px');
				$header.css('position', 'relative');
				$body.css('position', 'relative');
			}
			$.each(param.button, function(i, button) {
				var $button = $('<img src="' + toolbarPath + 'icon-' + button + '.svg" class="button view_mode ' + button + '" />');
				if (button === 'search') {
					// 分割レイアウトの場合は 'search' ボタン非表示
					if (ini.component.length > 1) {
						return;
					}
					// search ボタンはデフォルト選択状態
					$button.addClass('selected');
				}
				$body.append($button);
			});
			if ($toolbar.hasClass('drag-drop')) {
				$toolbar.removeClass('drag-drop');
				$header.addClass('drag-drop');
			}
			$toolbar.addClass('toolbar');
		}
		//
		// モデル読み込み直後は形状確認モードであるため
		// 形状確認モード用のツールバーの表示状態の構成にします．
		//		
		$('.view_mode.pan').show();
		$('.view_mode.examine').show();
		$('.view_mode.zoom').show();
		$('.view_mode.region').show();
		$('.view_mode.view_target').show();
		
        $('.view_mode.wt_pan').hide();
        $('.view_mode.wt_walk').hide();
        $('.view_mode.wt_look_around').hide();
        $('.view_mode.wt_region').hide();
        $('.view_mode.wt_backAndForth').hide();
		
        $('.view_mode.front').show();
        $('.view_mode.back').show();
        $('.view_mode.right').show();
        $('.view_mode.left').show();
        $('.view_mode.top').show();
        $('.view_mode.bottom').show();
        $('.view_mode.isometric1').show();
        $('.view_mode.isometric2').show();
        $('.view_mode.isometric3').show();
        $('.view_mode.isometric4').show();		
	};

	/**
	 * 検索要素を生成します．
	 * 
	 */
	var createSearch = function() {
		if ($('#' + COMPONENT_ID_SEARCH).length == 0) {
			return;
		}
		searchParam.isDispComponent = true;
		createDivComponent(COMPONENT_ID_SEARCH);

		var $search = $('#' + COMPONENT_ID_SEARCH + '_body');
		// フォーム部分: 検索キー + 検索ボタン
		var $search_form = $('<div id="search_form"></div>');
		$search_form.append($('<span>検索キー： </span><input type="text" id="search_key" />'));
		$search_form.append($('<button type="button" id="search_btn">検索</button>'));
		$search.append($search_form);
		var $search_hr = $('<hr />');
		$search.append($search_hr);
		// 結果部分: 結果件数 + 結果一覧
		var $search_result = $('<div id="search_result"></div>');
		$search.append($search_result);
		var $search_count = $('<div>検索結果 (<span id="search_result_count">0</span>)</div>');
		$search_result.append($search_count);
		var $search_result_grid = $('<div id="search_result_list"></div>');
		$search_result.append($search_result_grid);
		// grid のサイズを指定
		var parentWidth = $search.width() - 8;
		var parentHeight = $search.height() - ($search_result_grid.offset().top - $search.offset().top) - 8;
		$search_result_grid.css('width' , percentToPixel('100%' , parentWidth + 'px'));
		$search_result_grid.css('height', percentToPixel('100%', parentHeight + 'px'));
	};

	/**
	 * 分割レイアウトを適用します.
	 * 
	 * @param $div
	 */
	var setLayout = function($div) {
		if (!$div) {
			$div = $('body');
		}

		var eastWidth = 0;
		var westWidth = 0;
		var northHeight = 0;
		var southHeight = 0;
		var $east = $div.children('div.east');
		if ($east.length > 0) {
			eastWidth = convertInt($east.css('width')) - 7;
			$east.css('width' , eastWidth + 'px');
		}

		var $west = $div.children('div.west');
		if ($west.length > 0) {
			westWidth = convertInt($west.css('width')) - 7;
			$west.css('width', westWidth + 'px');
		}

		var $north = $div.children('div.north');
		if ($north.length > 0) {
			northHeight = convertInt($north.css('height')) - 7;
			$north.css('height', northHeight + 'px');
		}

		var $south = $div.children('div.south');
		if ($south.length > 0) {
			southHeight = convertInt($south.css('height')) - 7;
			$south.css('height', southHeight + 'px');
		}

		$div.layout({
			closable: false,
			center__paneSelector: '.center',
			east__paneSelector  : '.east',
			east__size          : eastWidth,
			west__paneSelector  : '.west',
			west__size          : westWidth,
			north__paneSelector : '.north',
			north__size         : northHeight,
			south__paneSelector : '.south',
			south__size         : southHeight,
			center__onresize_end: layoutsChange,
			east__onresize_end  : layoutsChange,
			west__onresize_end  : layoutsChange,
			north__onresize_end : layoutsChange,
			south__onresize_end : layoutsChange
		});
		$div.children().each(function() {
			if ($(this).children('div.center').length > 0) {
				setLayout($(this));
			}
		});
	};

	/**
	 * コンポーネントを調整します.
	 * <p>
	 *   プレイヤーと階層になっている部分のイベントがプレイヤーに伝わってしまうので、<br />
	 *   並列して位置だけずらします<br />
	 * </p>
	 */
	var adjustComponent = function() {
		var $main = $('#' + COMPONENT_ID_PLAYER_MAIN);
		$main.children().each(function() {
			var $child = $(this);
			if ($child.attr('id')) {
				var $body  = $child.children('div:last-child');
				var $check = $child.find('input[type=checkbox]');
				$check.on('click', function() {
					if ($(this).prop('checked')) {
						$body.show();
					} else {
						$body.hide();
					}
				});
				$main.parent().append($child);
			}
		});
	};

	/**
	 * セパレータの位置変更時に、内部のコンテンツのサイズも合わせて変更します.
	 */
	var layoutsChange = function(paneName, $paneElement, paneState, paneOptions, layoutName) {
		if (ini.component.length == 1) {
			// 重ね合わせレイアウト
			$paneElement.find('div').each(function() {
				if ($(this).attr('id')) {
					switch ($(this).attr('id')) {
					case COMPONENT_ID_PLAYER_MAIN:
						setDivSize($(this));
						setCanvas($(this));
						break;
					default:
						break;
					}
				}
			});
		} else {
			// 分割レイアウト
			$paneElement.find('div').each(function() {
				if ($(this).attr('id')) {
					switch ($(this).attr('id')) {
					case COMPONENT_ID_PLAYER_MAIN:
						setDivSize($(this));
						setCanvas($(this));
						break;
					case COMPONENT_ID_PLAYER_PART:
					case COMPONENT_ID_PLAYER_ALL:
						setDivSize($(this));
						setChildSize($(this));
						setCanvas($(this));
						break;
					case COMPONENT_ID_ASSY_TREE:
					case COMPONENT_ID_PROP_TABLE:
					case COMPONENT_ID_CONTENT:
						setDivSize($(this));
						setChildSize($(this));
						break;
					case COMPONENT_ID_PART_LIST:
						setDivSize($(this));
						setChildSize($(this));
						$(this).find('.slick-viewport').css('height', $(this).parent().css('height'));
						break;
					case COMPONENT_ID_SEARCH:
						setDivSize($(this));
						setChildSize($(this));
						var $search = $('#' + COMPONENT_ID_SEARCH + '_body');
						var $search_result_grid = $('#search_result_list');
						var parentWidth = $search.width() - 8;
						var parentHeight = $search.height() - ($search_result_grid.offset().top - $search.offset().top) - 8;
						$search_result_grid.css('width', percentToPixel('100%', parentWidth + 'px'));
						$search_result_grid.css('height', percentToPixel('100%', parentHeight + 'px'));
						break;
					default:
						break;
					}
				}
			});
		}
	};

	/**
	 * 子要素を親と同じサイズにします.
	 * 
	 * @param $div
	 * @param isHorizon
	 */
	var setDivSize = function($div, isHorizon) {
		if (isHorizon === undefined) {
			$div.css('width' , $div.parent().css('width'));
			$div.css('height', $div.parent().css('height'));
		} else if (isHorizon) {
			$div.css('width' , $div.parent().css('width'));
		} else {
			$div.css('height', $div.parent().css('height'));
		}
	};

	/**
	 * 子要素を全て同じサイズにします.
	 */
	var setChildSize = function($parent, isHorizon) {
		$parent.children().each(function() {
			if (!$(this).hasClass('toolbar') && !$(this).hasClass('ui-layout-resizer')) {
				if (isHorizon === undefined) {
					$(this).css('width' , $parent.css('width'));
					$(this).attr('width', $parent.css('width'));
					if ($(this).attr('id') && $(this).attr('id').indexOf('_header') === -1) {
						$(this).css('height', $parent.css('height'));
						$(this).attr('height', $parent.css('height'));
					}
				} else if (isHorizon) {
					$(this).css('width' , $parent.css('width'));
					$(this).attr('width', $parent.css('width'));
				} else {
					if ($(this).attr('id') && $(this).attr('id').indexOf('_header') === -1) {
						$(this).css('height', $parent.css('height'));
						$(this).attr('height', $parent.css('height'));
					}
				}
			}
		});
	};

	/**
	 * プレイヤーのキャンバスのサイズを変更します.
	 */
	var setCanvas = function($parent, isHorizon) {
		$parent.find('canvas').each(function() {
			var p = $parent.children('div[id$=_body]');
			if (p.length == 0) {
				p = $parent;
			}
			if (isHorizon === undefined) {
				$(this).css('width', p.css('width'));
				$(this).attr('width', p.css('width'));
				$(this).css('height', p.css('height'));
				$(this).attr('height', p.css('height'));
			} else if (isHorizon) {
				$(this).css('width', p.css('width'));
				$(this).attr('width', p.css('width'));
			} else {
				$(this).css('height', p.css('height'));
				$(this).attr('height', p.css('height'));
			}
			if ($parent.attr('id') === COMPONENT_ID_PLAYER_MAIN) {
				player.resize($(this).width(), $(this).height());
			} else if ($parent.attr('id') === COMPONENT_ID_PLAYER_PART) {
				player.part.resize($(this).width(), $(this).height());
			} else if ($parent.attr('id') === COMPONENT_ID_PLAYER_ALL) {
				player.all.resize($(this).width(), $(this).height());
			}
		});
	}

	/**
	 * 各コンポーネントにヘッダー部、ボディ部を作成します.
	 * 
	 * @param id
	 */
	var createDivComponent = function(id) {
		var $div = $('#' + id);
		var $header = $('<div id="' + id + '_header"></div>');
		var $body   = $('<div id="' + id + '_body"></div>');
		$div.append($header);
		$div.append($body);
		if ($div.parent().attr('id')) {
			createSwitchControl(id);
			$header.css('height', '20px');
		}
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

	/**
	 * ヘッダー部に表示・非表示スイッチを作成します.
	 * 
	 * @param id
	 */
	var createSwitchControl = function(id) {
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
		var isPlayerComponent = id === COMPONENT_ID_PLAYER_PART || id === COMPONENT_ID_PLAYER_ALL;
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
	$(document).on('contextmenu', function() {
		return false;
	});
}());