/// <reference path="../../../typings/kendo-ui/kendo.all.d.ts"/>
/// <reference path="../../../typings/jquery/jquery.d.ts"/>
/// <reference path="../../../typings/cytoscape/cytoscape.d.ts"/>

const MapViewContent = function(_id, _options) {
    const map_id = _id;
    let options = {
        onSelectMapNode: undefined,
        onClickMapNode: undefined,
        onSettingWindow: undefined,
        onCameraWindow: undefined,
        onAddGroupNode: undefined,
        onAddEquipmentNode: undefined,
        onDeleteEquipmentNode: undefined,
        onGoToSensorSetting: undefined,
        onFaultWindow: undefined,
        onLogWindow: undefined,
        onWorkHistoryWindow: undefined
    };
    options = _options;

    const m_alarm_color_list = [ '#0161b8', '#ff9c01', '#fe6102', '#de0303', '#511a81', '#000000', '#656565' ];
    
    let m_cytoscape = undefined;

    let m_cytoscape_normal_style = undefined;
    let m_cytoscape_point_style = undefined;

    let m_clicked_timeout = undefined;
    let m_clicked_node_before = undefined;

    let m_map_content_size = { width: 0, height: 0 };

    let m_current_view_id = undefined;

    let m_first_link_id = undefined;
    let m_cytoscape_style_flag = 0;

    let innerHtml = '';
    
    // by shkoh 20190829: 기본 layout은 preset임
    let m_cytoscape_layout_name = 'preset';
    const m_cytoscape_options = {
        name: 'preset',
        positions: function(node) {
            return {
                x: parseFloat(node.data('pos_x')) * m_map_content_size.width,
                y: parseFloat(node.data('pos_y')) * m_map_content_size.height
            }
        },
        zoom: 1,
        pan: { x: 0, y: 0 },
        fit: false,
        padding: 0,
        zoomingEnabled: false,
        userZoomingEnabled: false,
        refresh: 1000,
        animate: true,                  // whether to transition the node positions
        animationDuration: 500,         // duration of animation in ms if enabled
    }
    const m_cytoscape_layout_grid = {
        name: 'grid',
        fit: false,                      // whether to fit the viewport to the graph
        padding: 30,                    // padding used on fit
        refresh: 1000,
        boundingBox: undefined,         // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
        avoidOverlap: true,             // prevents node overlap, may overflow boundingBox if not enough space
        rows: undefined,                // force num of rows in the grid
        columns: undefined,             // force num of cols in the grid
        position: function(node) {},    // returns { row, col } for element
        sort: undefined,                // a sorting function to order the nodes; e.g. function(a, b){ return a.data('weight') - b.data('weight') }
        animate: true,                  // whether to transition the node positions
        animationDuration: 500,         // duration of animation in ms if enabled
        ready: undefined,               // callback on layoutready
        stop: undefined                 // callback on layoutstop
    }

    const m_cytoscape_equipment_menu = {
        menuRadius: 100,                                // the radius of the circular menu in pixels
        selector: 'node.equip, node.hvac, node.door',   // elements matching this Cytoscape.js selector will trigger cxtmenus
        commands: [									    // an array of commands to list in the menu or a function that returns the array
            {
                content: "설비설정",
                contentStyle: { 'font-size': '0.8em' },
                select: function(ele) {
                    options.onSettingWindow(ele.data('id'));
                }
            },
            {
                content: "설비삭제",                // html/text content to be displayed in the menu
                contentStyle: { 'font-size': '0.8em' },
                select: function(ele) {             // a function to execute when the command is selected
                    const isDelete = confirm('설비 [' + this.data('name') + '] 를 삭제하시겠습니까?');
                    if(isDelete) options.onDeleteEquipmentNode({ id: this.id().substr(2), parent_id: this.data('pid') });
                }
            },
            {
                content: "통신로그보기",
                contentStyle: { 'font-size': '0.6em' },
                select: function(ele) {     // kdh 20181210
                    options.onLogWindow(ele.data('id'));
                }
            },
            {
                content: "센서설정",
                contentStyle: { 'font-size': '0.8em' },
                select: function(ele) {
                    options.onGoToSensorSetting(this.id());
                }
            },
            {
                content: "장애이력조회",
                contentStyle: { 'font-size': '0.6em' },
                select: function(ele) {     // kdh 20181120
                    options.onFaultWindow(ele.data('id'));
                }
            }
        ],
        fillColor: 'rgba(0, 0, 0, 0.6)',			// the background color of the menu
        activeFillColor: 'rgba(49, 123, 224, 0.8)',	// the colour used to indicate the selected command
        activePadding: 4,							// additional size in pixels for the active command
        indicatorSize: 20,							// the size in pixels of the pointer to the active command
        separatorWidth: 4,							// the empty spacing in pixels between successive commands
        spotlightPadding: 20,						// extra spacing in pixels between the element and the spotlight
        minSpotlightRadius: 16,						// the minium radius in pixels of the spotlight
        maxSpotlightRadius: 24,						// the maximum radius in pixels of the spotlight
        itemColor: 'white',							// the colour of text in the command's content
        itemTextShadowColor: 'black',				// the text shadow colour of the command's content
        zIndex: 9999,								// the z-index of the ui div
        openMenuEvents: "cxttapstart"				// cytoscape events that will open the menu (space separated)
    };

    const m_cytoscape_group_menu = {
        menuRadius: 100,							// the radius of the circular menu in pixels
        selector: 'node.group',						// elements matching this Cytoscape.js selector will trigger cxtmenus
        commands: [									// an array of commands to list in the menu or a function that returns the array
            {
                content: "그룹설정",
                contentStyle: { 'font-size': '0.8em' },
                select: function(ele) {
                    options.onSettingWindow(ele.data('id'));
                }
            },
            {
                content: "그룹추가",			 	// html/text content to be displayed in the menu
                contentStyle: { 'font-size': '0.8em' },
                select: function(ele) {				// a function to execute when the command is selected
                    options.onAddGroupNode(ele.data('id').substr(2));
                }
            },
            {
                content: "설비추가",
                contentStyle: { 'font-size': '0.8em' },
                select: function(ele) {
                    options.onAddEquipmentNode(ele.data('id').substr(2));

                    const params = {
                        id: this.id(),
                        parent_id: this.data('pid'),
                        name: this.data('name'),
                        type: this.id().substr(0, 1) == 'E' ? 'equipment' : 'group',
                        kind: this.data('icon')
                    }
                    options.onClickMapNode(params);
                }
            }
        ],
        fillColor: 'rgba(0, 0, 0, 0.6)',			// the background color of the menu
        activeFillColor: 'rgba(49, 123, 224, 0.8)',	// the colour used to indicate the selected command
        activePadding: 4,							// additional size in pixels for the active commnad
        indicatorSize: 20,							// the size in pixels of the pointer to the active command
        separatorWidth: 4,							// the empty spacing in pixels between successive commands
        spotlightPadding: 20,						// extra spacing in pixels between the element and the spotlight
        minSpotlightRadius: 16,						// the minium radius in pixels of the spotlight
        maxSpotlightRadius: 24,						// the maximum radius in pixels of the spotlight
        itemColor: 'white',							// the colour of text in the command's content
        itemTextShadowColor: 'black',				// the text shadow colour of the command's content
        zIndex: 9999,								// the z-index of the ui div
        openMenuEvents: "cxttapstart"				// cytoscape events that will open the menu (space separated)
    };
    /***************************************************************************************************************/
    /* by shkoh 20180529: Map 모니터링 - Resizing 시작                                                               */
    /***************************************************************************************************************/
    function mapViewContentResizing() {
        m_map_content_size.width = parseFloat($('#grid-map').width()) - 20;
        m_map_content_size.height = parseFloat($('#grid-map').height()) - 8;
        const title_h = parseFloat($('#grid-map-item-title').height()) + 17;
        
        $('#map-image').css({ 'width': m_map_content_size.width, 'height': m_map_content_size.height - title_h });
        $('#cytoscapeDiv').css({ 'width': m_map_content_size.width, 'height': m_map_content_size.height - title_h });

        if(m_cytoscape) {
            m_cytoscape.resize();
            repositionCurrentNode();
        }
    }
    /***************************************************************************************************************/
    /* by shkoh 20180529: Map 모니터링 - Resizing 끝                                                                 */
    /***************************************************************************************************************/

    /***************************************************************************************************************/
    /* by shkoh 20180530: Map 모니터링 - 내장함수 시작                                                                */
    /***************************************************************************************************************/
    function getMapIconName(icon, level, mode = null) {
        let ext = '.png';
        if(level < 4 && icon == 'constant_temperature' && mode == 'run') ext = '.gif';
        return '/img/equip/' + icon + '_L_' + level + ext;
    }

    function getMapDoorIconName(icon, level, mode = null) {
        let open_state = level < 4 && (mode === 'Y') ? 'o' : '';
        return '/img/equip/' + icon + '_L_' + level + open_state + '.png';
    }

    /**
     * 새로운 맵을 로드할 지 여부를 판단
     * true: 현재 보여지는 맵과 새로 로드할 맵이 다름으로 새로운 맵을 로드함 
     * false: 현재 보여지는 맵과 새로 로드할 맵이 동일함으로 새로운 맵을 로드할 필요가 없음
     * 
     * @param {String} group_id 보여질 새로운 Map 그룹의 ID, 그룹보기 일 경우 숫자 비교하며, 설비별 보기인 경우 String으로 비교
     * @return {Boolean}
     */
    function isNewMap(group_id) {
        if(isNaN(Number(group_id))) return group_id != m_current_view_id;
        else return Number(group_id) != m_current_view_id;
    }

    function updateTooltipInfo(equip_id) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                async: true,
                type: 'GET',
                url: `/api/monitoring/map/tooltip?id=${equip_id}`
            }).done(function(items) {
                innerHtml =
                '<table id="tooltip" cellspacing="0" cellpadding="0">' +
                    '<tbody>' +
                        '<tr>' +
                            '<td class="name">설비</td>' +
                            '<td class="value">' + items[0].equipKind + '</td>' +
                        '</tr>' +
                        '<tr>' +
                            '<td class="name">갱신시간</td>' +
                            '<td class="value">' + items[0].update_dateTime + '</td>' +
                        '</tr>' +
                        '<tr>' +
                            '<td class="name">장애등급</td>' +
                            '<td class="value"><span class="equip_value equip_value_' + (items[0].isAvailable == 'N' ? '6' : items[0].equipLevel) + '">' + (items[0].isAvailable == 'N' ? '사용안함' : items[0].levelName) + '</span></td>' +
                        '</tr>';
                
                if(items[0].sensor_id != undefined) {
                    innerHtml +=
                        '<tr><td colspan="2" style="padding-bottom: 5px; border-bottom: 1px solid #cccccc;"></td></tr>';
                    items.forEach(function(item) {
                        innerHtml +=
                        '<tr>' +
                            '<td class="name s_name">' + item.sensor_name + '</td>';
                        
                        getSensorValue(item);
                    });
                }
                innerHtml +=
                    '</tbody>' +
                '</table>';

                resolve(innerHtml);
            }).fail(function() {
                resolve('<table id="tooltip" cellspacing="0" cellpadding="0"><tbody><tr><td class="name">설비 세부항목 로드 오류</td></tr></tbody></table>');
            });
        });
    }

    function getSensorValue(data) {
        if(data.isAvailable == "N" || data.equipLevel == 4 || data.equipLevel == 5) innerHtml += '<td class="value s_value_4">';
        else innerHtml += '<td class="value ' + (data.isEvent == 'N' ? '' : 's_value_' + data.sensorLevel) + '">';

        innerHtml += data.value + (data.disp_unit != undefined ? data.disp_unit : '') + '</td></tr>';
    }


    /***************************************************************************************************************/
    /* by shkoh 20180530: Map 모니터링 - 내장함수 끝                                                                  */
    /***************************************************************************************************************/

    /***************************************************************************************************************/
    /* by shkoh 20180529: Map 모니터링 - 초기화 시작                                                                  */
    /***************************************************************************************************************/
    function createMapView() {
        let innerHtml =
        '<div id="grid-map-title" class="grid-map item-title grid-item-draggable">' +
            '<h3>' +
                '<span id="grid-map-item-title"></span>' +
                '<span class="panel_close_icon"></span>' +
            '</h3>' +
        '</div>' +
        '<div id="btn-group-all" class="btn-group btn-group-map" role="group">';
    
        if($.session.get('user-grade') == 'USR00' || $.session.get('user-grade') == 'USR01') {
            innerHtml +=
            '<button type="button" id="btn_zoom_in" class="btn btn-zoom-in" title="Zoom In">' +
                '<span class="icon-zoom-in"></span>' +
            '</button>' +
            '<button type="button" id="btn_zoom_default" class="btn btn-zoom-default" title="기본 크기로 변경">' +
                '<span class="icon-zoom-default"></span>' +
            '</button>' +
            '<button type="button" id="btn_zoom_out" class="btn btn-zoom-out" title="Zoom Out">' +
                '<span class="icon-zoom-out"></span>' +
            '</button>';
            // '<button type="button" id="btn_add_dummy" class="btn btn-add-dummy" title="연결점 추가">' +
            //     '<span class="icon-add-dummy"></span>' +
            // '</button>' +
            // '<button type="button" id="btn_add_link" class="btn btn-add-link" title="선 연결">' +
            //     '<span class="icon-add-link"></span>' +
            // '</button>' +
        }

        innerHtml +=
            '<button type="button" id="btn_layout" class="btn btn-layout" title="아이콘 정렬">' +
                '<span class="icon-layout"></span>' +
            '</button>';
        
        if($.session.get('user-grade') == 'USR00' || $.session.get('user-grade') == 'USR01') {
            innerHtml +=
            // '<button type="button" id="btn_shapeChange" class="btn btn-swap-icon" title="아이콘 변환">' +
            //     '<span class="icon-swap"></span>' +
            // '</button>' +
            '<button type="button" id="btn_save_position" class="btn btn-save-position" title="위치 및 크기 저장">' +
                '<span class="icon-save-position"></span>' +
            '</button>';
            // '<button type="button" id="btn_del_link" class="btn btn-del-link" title="연결점, 연결선 지우기">' +
            //     '<span class="icon-del-link"></span>' +
            // '</button>' +
        }
        
        innerHtml +=
        '</div>' +
        '<div id="grid-map-content" class="item-content">' +
            '<div id="cytoscapeDiv">' +
            '</div>' +
            '<div id="map-image"></div>' +
        '</div>';

        $(map_id).html(innerHtml);

        $('#grid-map-item-title').on('click', function() {
        });

        // $('#btn_add_dummy').on('click', function() { addDummyNode(); });

        // $('#btn_add_link').on('click', function() { switchLinkMode(); });
        // $('#btn_add_link').on('blur', function() { m_first_link_id = undefined; });

        $('#btn_layout').on('click', function() {
            // by shkoh 20190829: [그룹으로 보기]인 경우에는 preset과 grid layout이 번갈아가면서 동작하도록 구현
            // by shkoh 20190829: [설비별 보기]인 경우에는 무조건 grid layout으로 동작하도록 구현
            const temp_id = m_cytoscape_layout_name == 'preset' ? 'E9999' : m_current_view_id;
            setCytoscapeLayout(temp_id);
        });

        // $('#btn_shapeChange').on('click', function() { swapNodeIcon(); });

        $('#btn_save_position').on('click', function() { saveNodePosition(); });

        // $('#btn_del_link').on('click', function() { deleteNode(); });

        $('#btn_zoom_in').on('click', function() { setZoom(0.05); });
        $('#btn_zoom_out').on('click', function() { setZoom(-0.05); });
        $('#btn_zoom_default').on('click', function() { setZoom(1); });
    }
    /***************************************************************************************************************/
    /* by shkoh 20180529: Map 모니터링 - 초기화 끝                                                                    */
    /***************************************************************************************************************/

    /***************************************************************************************************************/
    /* by shkoh 20180529: Map 모니터링 - 데이터 로드 시작                                                              */
    /***************************************************************************************************************/
    function loadMapInfo(id) {
        return new Promise(function(resolve, reject) {
            if(!isNaN(Number(id))) id = id.toString();

            $.ajax({
                async: true,
                type: 'GET',
                dataType: 'json',
                url: (id.substr(0, 1) === 'E') ? '/api/monitoring/code?id=' + id : '/api/monitoring/group?id=' + id
            }).done(function(info) {
                resolve({
                    id: info.id,
                    parent_id: info.pid,
                    name: info.name,
                    type: 'group',
                    kind: 'group',
                    bg_img: info.imageName
                });
            }).fail(function(err) {
                console.log(`[loadMapInfo Error] ${err.statusText}`);
                resolve({
                    id: id,
                    parent_id: 'G_0',
                    name: '설비별 보기',
                    type: 'group',
                    kind: 'group',
                    bg_img: ''
                });
            });
        });
    }

    function loadMapIcon(id) {
        loadEquipmentMapNode(id)
        .then(function() {
            if(!isNaN(Number(id))) {
                // by shkoh 20180629: node 호출 시에 dummy의 경우 순서대로 호출이 되어야 함으로 해당 순서대로 호출할 수 있도록 조치
                loadGroupMapNode(id)
                .then(function() { loadDummyAndLeakDummyMapNode(id); })
                .then(function() { loadLinkMapNode(id); });
            }
        })
        .then(function() {
            setCytoscapeLayout(id);
        });
    }

    function loadEquipmentMapNode(id) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                async: true,
                type: 'GET',
                url: '/api/monitoring/map/equipments?parent=' + id
            }).done(function(items) {
                items.forEach(function(item) {
                    m_cytoscape.add({
                        group: 'nodes',
                        data: {
                            id: item.id,
                            name: item.name,
                            pid: id,
                            level: item.level,
                            icon: item.icon,
                            alarmColor: m_alarm_color_list[item.level],
                            pos_x: item.pos_x.toFixed(3),
                            pos_y: item.pos_y.toFixed(3),
                            zoom: item.zoom.toFixed(2),
                            preZoom: item.zoom.toFixed(2),
                            bgImg: getMapIconName(item.icon, item.isAvailable == 'Y' ? item.level : 6, item.icon),
                            bgImg_ani: getMapIconName(item.icon, 0),
                            is_available: item.isAvailable,
                            run_state: item.run_state
                        },
                        classes: getEquipTypeByCode(item.equip_code),
                        position: {
                            x: item.pos_x * m_map_content_size.width,
                            y: item.pos_y * m_map_content_size.height
                        }
                    }).qtip({   // by shkoh 20180608: map node가 생성된 후에 qtip을 실행하기 위한 chaining
                        content: {
                            title: item.name,
                            text: '',
                        },
                        position: {
                            my: 'top center',
                            at: 'bottom center',
                            container: $('#tooltipBox'),
                            adjust: {
                                y: 10,
                                cyViewport: true    // by shkoh 20180628: pan zoom 발생 시 위치값을 변경
                            }
                        },
                        show: {
                            event: 'select',    // by shkoh 20180628: cytoscape-qtip.js 파일에서 :327번 째 free 이벤트를 추가하여 drag 상황에서 위치값을 적용할 수 있도록 수정함
                        },
                        hide: {
                            event: 'unselect remove',
                            cyViewport: false,  // by shkoh 20180628: viewport가 변경이 되어도 tooltip이 없어지지 않음
                        },
                        style: {
                            classes: 'qtip-wiki qtip-light qtip-shadow'
                        },
                        events: {
                            show: function(event, api) {
                                api.set('content.text', updateTooltipInfo(item.id.substr(2)));
                            }
                        }
                    });
                });
            }).always(function() {
                resolve();
            });
        });
    }

    function loadDummyAndLeakDummyMapNode(id) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                async: true,
                type: 'GET',
                url: '/api/monitoring/map/dummy?parent=' + id
            }).done(function(items) {
                items.forEach(function(item) {
                    m_cytoscape.add({
                        group: 'nodes',
                        data: {
                            id: item.id,
                            pid: id,
                            equip_id: item.equip_id,
                            point_index: item.point_idx,
                            distance: item.distance + 'm',
                            pos_x: item.pos_x.toFixed(3),
                            pos_y: item.pos_y.toFixed(3)
                        },
                        classes: item.equip_id == -1 ? 'dummy' : 'leakdummy',
                        position: {
                            x: item.pos_x * m_map_content_size.width,
                            y: item.pos_y * m_map_content_size.height
                        }
                    });
                });
            }).always(function() {
                resolve();
            });
        });
    }

    function loadLinkMapNode(id) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                async: true,
                type: 'GET',
                url: '/api/monitoring/map/link?parent=' + id
            }).done(function(items) {
                items.forEach(function(item) {
                    m_cytoscape.add({
                        group: 'edges',
                        data: {
                            id: item.link_id,
                            source: item.src,
                            target: item.dst
                        }
                    });
                });
            }).always(function() {
                resolve();
            });
        });
    }

    function loadGroupMapNode(id) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                async: true,
                type: 'GET',
                url: '/api/monitoring/map/group?parent=' + id
            }).done(function(items) {
                items.forEach(function(item) {
                    m_cytoscape.add({
                        group: 'nodes',
                        data: {
                            id: item.id,
                            name: item.name,
                            pid: id,
                            level: item.level,
                            icon: item.icon,
                            pos_x: item.pos_x.toFixed(3),
                            pos_y: item.pos_y.toFixed(3),
                            zoom: item.zoom.toFixed(2),
                            preZoom: item.zoom.toFixed(2),
                            bgImg: getMapIconName(item.icon, item.isAvailable == 'Y' ? item.level : 6),
                            bgImg_ani: getMapIconName(item.icon, 0)
                        },
                        classes: 'group',
                        position: {
                            x: item.pos_x * m_map_content_size.width,
                            y: item.pos_y * m_map_content_size.height
                        }
                    });
                });
            }).always(function() {
                resolve();
            });
        });
    }

    /**
     * by shkoh 20180628: 모니터링 뷰에 dummy point를 추가, 추가와 동시에 DB에 insert함
     */
    function addDummyNode() {
        const x_pos = 0.1;
        const y_pos = 0.1;

        $.ajax({
            async: true,
            type: 'POST',
            url: '/monitoring/map/nodes/dummy/',
            dataType: 'json',
            data: {
                // by shkoh 20180628: update 동작을 하나로 진행시키기 위해서 array 형태로 전달
                dummyInfo: JSON.stringify([{
                    dummy_id: undefined,
                    group_id: m_current_view_id,
                    xPosition: x_pos,
                    yPosition: y_pos
                }])
            }
        }).done(function(item) {
            m_cytoscape.add({
                group: 'nodes',
                data: {
                    id: 'D_' + item.insert_id,
                    pid: m_current_view_id,
                    equip_id: '',
                    point_index: '',
                    distance: '',
                    pos_x: x_pos.toFixed(3),
                    pos_y: y_pos.toFixed(3)
                },
                classes: 'dummy',
                position: {
                    x: x_pos * m_map_content_size.width,
                    y: y_pos * m_map_content_size.height
                }
            });
        }).fail(function(err_msg) {
            console.error('[Fail to add dummy node] ' + err_msg);
            alert('연결점 생성에 실패했습니다');
        });
    }

    function addLinkEdge(item) {
        $.ajax({
            async: true,
            type: 'POST',
            url: '/monitoring/map/nodes/link',
            dataType: 'json',
            data: {
                linkInfo: JSON.stringify({
                    id: item.id,
                    pid: m_current_view_id,
                    src: item.source,
                    dst: item.target
                })
            }
        }).done(function() {
            m_cytoscape.add({
                group: 'edges',
                data: {
                    id: item.id,
                    source: item.source,
                    target: item.target
                }
            });
        }).fail(function(err_msg) {
            console.error('[Fail to add link edge] ' + err_msg);
            alert('연결선 생성에 실패했습니다');
        });
    }

    /**
     * by shkoh 20180629: 모니터링 뷰에 link line 추가, 추가와 동시에 DB에 insert함
     */
    function switchLinkMode() {
        if(m_cytoscape.nodes(':selected').length == 0) {
            // by shkoh 20180629: focus되어 있는 버튼을 풀어줌
            $('#btn_add_link').trigger('blur');

            alert('선 연결을 위해서는 하나의 설비 혹은 연결 점이 선택되어야 합니다');
            return;
        }

        // by shkoh 20180629: 연결 선이 가능한 상태로 변경함
        m_first_link_id = m_cytoscape.nodes(':selected').first().id();
    }

    function swapNodeIcon() {
        m_cytoscape_style_flag = 1 - m_cytoscape_style_flag;
        m_cytoscape.style(m_cytoscape_style_flag == 0 ? m_cytoscape_normal_style : m_cytoscape_point_style);
    }

    function saveNodePosition() {
        let nodes = [];

        m_cytoscape.nodes().forEach(function(node) {
            const render_position = node.renderedPosition();
            const x = render_position.x / m_map_content_size.width;
            const y = render_position.y / m_map_content_size.height;
            const zoom = parseFloat(node.data('zoom'));
            
            // by shkoh 20180705: node들 중에서 위치가 변경된 node만 저장함
            if(node.data('pos_x') != x.toFixed(3) || node.data('pos_y') != y.toFixed(3) || node.data('preZoom') != zoom) {
                nodes.push({ id: node.id(), x: x, y: y, zoom: zoom });
            }
        });

        $.ajax({
            async: true,
            type: 'POST',
            url: `/api/monitoring/map`,
            dataType: 'json',
            data: {
                group_id: m_current_view_id,
                info: JSON.stringify(nodes)
            },
        }).done(function() {            
            alert(nodes.length + '개의 아이콘 위치 혹은 크기가 변경 후 저장 되었습니다');
        }).fail(function(err_msg) {
            console.error('[Fail to save nodes\' position] ' + err_msg);
            alert('설비 혹은 그룹 아이콘 위치 저장에 실패했습니다');
        });
    }

    function setZoom(factor) {
        if(m_cytoscape == undefined) return;
        if(m_cytoscape.nodes().length == 0) return;

        // by shkoh 20190830: 따로 선택한 아이콘이 없는 경우에는 모든 아이콘들의 크기를 변경함
        if(m_cytoscape.nodes(':selected').length == 0) {
            m_cytoscape.nodes().forEach(function(node) {
                setNodeZoom(node, factor);
            });
        } else {
            m_cytoscape.nodes(':selected').forEach(function(node) {
                setNodeZoom(node, factor);
            });
        }
    }

    function setNodeZoom(node, factor) {
        if(factor == 1) {
            node.data('zoom', '1.25');
            return;
        }
        
        const previous_zoom_factor = parseFloat(node.data('zoom'));
        if(previous_zoom_factor + factor < 0.5) {
            return;
        } else if(previous_zoom_factor + factor > 2.0) {
            return;
        }
        node.data('zoom', (previous_zoom_factor + factor).toFixed(2));
    }

    function deleteNode() {
        if(m_cytoscape.elements('edge:selected, node.dummy:selected').length == 0) {
            alert('삭제하려는 연결점 혹은 연결선을 선택하세요');
            return;
        }

        const node = m_cytoscape.elements(':selected');

        let isDelete = false;
        if(node.id().substr(0, 1) == 'L') {
            isDelete = confirm('선택한 선을 삭제하시겠습니까?');
        } else if(node.id().substr(0, 1) == 'D') {
            isDelete = confirm('선택한 연결점을 삭제하시겠습니까?\n삭제하려는 점에 연결된 선도 함께 삭제됩니다');
        }

        if(isDelete == false) return;

        $.ajax({
            async: true,
            type: 'POST',
            url: '/monitoring/map/nodes/delete',
            dataType: 'json',
            data: {
                group_id: m_current_view_id,
                id: node.id()
            }
        }).done(function() {
            m_cytoscape.elements(':selected').remove();
        }).fail(function(err_msg) {
            console.error('[Fail to delete a node(' + node.id() + ')] ' + err_msg);
            alert('노드(' + node.id() + ') 삭제 진행 중에 실패하였습니다');
        }).always(function() {
            $('#btn_del_link').trigger('blur');
        });
    }
    /***************************************************************************************************************/
    /* by shkoh 20180529: Map 모니터링 - 데이터 로드 끝                                                               */
    /***************************************************************************************************************/

    /***************************************************************************************************************/
    /* by shkoh 20180530: Map View - Cytoscape Start                                                               */
    /***************************************************************************************************************/
    function createCytoscape() {
        m_cytoscape = cytoscape({
            container: document.getElementById('cytoscapeDiv'),
            layout: m_cytoscape_options,
            zoomingEnabled: false,
            userZoomingEnabled: false,
            panningEnabled: false,
            userPanningEnabled: false,
            boxSelectionEnabled: false,
            selectionType: 'single',
            montionBlur: false,
            pixelRatio: 'auto',
            textureOnViewport: false,
            styleEnabled: true
        });
    }

    function loadCytoscapeOptions() {
        return new Promise(function(resolve, reject) {
            // by shkoh 20190318: Ani Gif 파일을 사용
            m_cytoscape.nodeHtmlLabel([
                {
                    query: '.hvac',
                    tpl: function(data) {
                        const icon_url = getMapIconName(data.icon, data.is_available == 'Y' ? data.level : 6, data.run_state == 'Y' ? 'run' : 'stop');
                        const hvac_icon_w = (32 * data.zoom).toFixed(2);
                        const hvac_icon_h = (32 * data.zoom).toFixed(2);
                        const html =
                        '<div>' +
                            '<div id="node_hvac_' + data.id + '" style="background-image: url(' + icon_url + '); background-position: center; background-repeat: no-repeat; background-size: contain; width: ' + hvac_icon_w + 'px; height: ' + hvac_icon_h + 'px;"></div>' +
                        '</div>';
                        
                        return html;
                    }
                },
                {
                    query: '.door',
                    tpl: function(data) {
                        const icon_url = getMapDoorIconName(data.icon, data.is_available === 'Y' ? data.level : 6, data.run_state);
                        const door_icon_w = (32 * data.zoom).toFixed(2);
                        const door_icon_h = (32 * data.zoom).toFixed(2);
                        const html =
                        '<div>' +
                            '<div id="node_door_' + data.id + '" style="background-image: url(' + icon_url + '); background-position: center; background-repeat: no-repeat; background-size: contain; width: ' + door_icon_w + 'px; height: ' + door_icon_h + 'px;"></div>' +
                        '</div>';

                        return html;
                    }
                }
            ]);

            // by shkoh 20211223: 자산을 등록해야하는 경우에는 [작업이력] 기능을 추가함
            if($('body').attr('data-asset') === '1') {
                m_cytoscape_equipment_menu.commands.push({
                    content: "작업이력",
                    contentStyle: { 'font-size': '0.6em' },
                    select: function(ele) {
                        options.onWorkHistoryWindow(ele.data('id'));
                    }
                });
            }

            m_cytoscape.cxtmenu(m_cytoscape_equipment_menu);
            m_cytoscape.cxtmenu(m_cytoscape_group_menu);

            resolve();
        });
    }

    function loadCytoscapeStyle() {
        return new Promise(function(resolve, reject) {
            $.ajax({
                async: true,
                type: 'GET',
                url: '/javascripts/monitoring/cytoscape_icon_style.json'
            }).done(function(data) {
                // by shkoh 20190830: icon은 설정된 zoom factor에 영향을 받음
                data.normal.node['width'] = function(ele) { return (34 * ele.data('zoom')) + 'px' };
                data.normal.node['height'] = function(ele) { return (34 * ele.data('zoom')) + 'px' };
                data.normal.node['font-size'] = function(ele) { return (13 * ele.data('zoom')) + 'px' };

                data.normal.equip['background-width'] = function(ele) { return (32 * ele.data('zoom')) + 'px' };
                data.normal.equip['background-height'] = function(ele) { return (32 * ele.data('zoom')) + 'px' };

                data.normal.nvr['background-width'] = function(ele) { return (32 * ele.data('zoom')) + 'px' };
                data.normal.nvr['background-height'] = function(ele) { return (32 * ele.data('zoom')) + 'px' };

                data.normal.group['background-width'] = function(ele) { return (32 * ele.data('zoom')) + 'px' };
                data.normal.group['background-height'] = function(ele) { return (32 * ele.data('zoom')) + 'px' };

                data.selection.equip_selected['width'] = function(ele) { return (38 * ele.data('zoom')) + 'px' };
                data.selection.equip_selected['height'] = function(ele) { return (38 * ele.data('zoom')) + 'px' };

                data.selection.group_selected['width'] = function(ele) { return (38 * ele.data('zoom')) + 'px' };
                data.selection.group_selected['height'] = function(ele) { return (38 * ele.data('zoom')) + 'px' };

                m_cytoscape_normal_style = cytoscape.stylesheet()
                    .selector('node').style(data.normal.node)
                    .selector('node.equip').style(data.normal.equip)
                    .selector('node.hvac').style(data.normal.equip_hvac)
                    .selector('node.door').style(data.normal.equip_door)
                    .selector('node.equip.alarm').style(data.normal.equip_alarm)
                    .selector('node.nvr').style(data.normal.nvr)
                    .selector('node.group').style(data.normal.group)
                    .selector('node.group.alarm').style(data.normal.group_alarm)
                    .selector('node.dummy').style(data.dummy.node_dummy)
                    .selector('node.leakdummy').style(data.leak.node_leakdummy)
                    .selector('node.leakPoint').style(data.leak.node_leakPoint)
                    .selector('edge').style(data.dummy.edge)
                    .selector(':selected').style(data.selection.normal)
                    .selector('node.equip:selected').style(data.selection.equip_selected)
                    .selector('node.hvac:selected').style(data.selection.equip_selected)
                    .selector('node.door:selected').style(data.selection.equip_selected)
                    .selector('node.group:selected').style(data.selection.equip_selected)
                    .selector('node.dummy:selected').style(data.selection.dummy_selected);
                
                m_cytoscape_point_style = cytoscape.stylesheet()
                    .selector('node').style(data.point.node)
                    .selector('node.equip, .nvr').style(data.point.equip)
                    .selector('node.hvac').style(data.normal.equip_hvac)
                    .selector('node.door').style(data.normal.equip_door)
                    .selector('node.group').style(data.point.group)
                    .selector('node.dummy').style(data.dummy.node_dummy)
                    .selector('node.leakdummy').style(data.leak.node_leakdummy)
                    .selector('node.leakPoint').style(data.leak.node_leakPoint)
                    .selector('edge').style(data.dummy.edge)
                    .selector(':selected').style(data.selection.normal)
                    .selector('node.equip:selected').style(data.selection.point)
                    .selector('node.hvac:selected').style(data.selection.point)
                    .selector('node.door:selected').style(data.selection.point)
                    .selector('node.group:selected').style(data.selection.equip_selected)
                    .selector('node.dummy:selected').style(data.selection.dummy_selected);
            }).always(function() {
                m_cytoscape.style(m_cytoscape_normal_style);
                resolve();
            });
        });
    }

    function handleKeyDownToNode(e) {
        let _val = 0.5;

        if(e.altKey) _val *= 10;
        if(e.shiftKey) _val *= 20;

        switch(e.key) {
            case 'ArrowLeft': { moveItem({ x: -1 * _val, y: 0 }); break; }
            case 'ArrowRight': { moveItem({ x: _val, y: 0 }); break; }
            case 'ArrowUp': { moveItem({ x: 0, y: -1 * _val }); break; }
            case 'ArrowDown': { moveItem({ x: 0, y: _val }); break; }
        }
    }

    function addCytoscapeEvents() {
        if(m_cytoscape == undefined) return;

        m_cytoscape.on('resize', function(evt) {
            // m_cytoscape.elements().forEach(function(item) {
            //     item.renderedPosition({
            //         x: parseFloat(item.data('pos_x')) * m_map_content_size.width,
            //         y: parseFloat(item.data('pos_y')) * m_map_content_size.height
            //     });
            // });

            // // by shkoh 20190319: cytoscape에서 모든 node들이 배치되며 해당 크기에 맞춰서 노드들이 재 위치 조정이 이루어진 후에 마지막으로 layout을 재설정하여 최종적으로 렌더에 맞는 위치를 보정함
            // setCytoscapeLayout(m_current_view_id);
        });

        m_cytoscape.on('select', 'node', function(e) {
            if($.session.get('user-grade') === 'USR00') {
                window.addEventListener('keydown', handleKeyDownToNode, true);
            }
        });

        m_cytoscape.on('unselect', 'node', function(event) {
            if(m_first_link_id) {
                $('#btn_add_link').trigger('blur');
            }

            if($.session.get('user-grade') === 'USR00') {
                window.removeEventListener('keydown', handleKeyDownToNode, true);
            }
        });

        m_cytoscape.on('click', 'node', function(event) {
            // by shkoh 20180629: link를 추가하기 위해서 이벤트 발생(dummy와 equip, nvr, group 노드 모두 이벤트 발생함)
            // by shkoh 20180629: 해당 코드에서 equip 노드 클릭 시 이벤트 발생 순서는 click.node -> click.node.equip -> unselect.node
            if(m_first_link_id) {
                const last_link_id = this.id();
                
                // by shkoh 20180629: A->B 연결선과 B->A 연결선은 동일한 것으로 간주하여 중복 추가할 수 없도록 예외처리함
                const link_id = 'L_' + m_first_link_id + '_' + last_link_id;
                const convert_link_id = 'L_' + last_link_id + '_' + m_first_link_id;
                if(event.cy.edges('#' + link_id + ', #' + convert_link_id).length != 0) {
                    alert('해당 연결선이 이미 존재합니다');
                    return;
                }

                addLinkEdge({
                    id: link_id,
                    source: m_first_link_id,
                    target: last_link_id
                });
            }
        });

        m_cytoscape.on('click', 'node.equip, node.hvac, node.door, node.group', function(event) {
            // by shkoh 20180629: link 연결 상태에서는 click 이벤트를 수행할 필요가 없다
            if(m_first_link_id) return;

            let clicked_node = event.target;
            
            if(m_clicked_timeout && m_clicked_node_before) {
                clearTimeout(m_clicked_timeout);
            }

            if(m_clicked_node_before == clicked_node) {
                clicked_node.trigger('doubleclick');
                m_clicked_node_before = undefined;
            } else {
                const params = {
                    id: this.id(),
                    parent_id: this.data('pid'),
                    name: this.data('name'),
                    type: this.id().substr(0, 1) == 'E' ? 'equipment' : 'group',
                    kind: this.data('icon')
                }

                options.onClickMapNode(params);

                m_clicked_timeout = setTimeout(function() { m_clicked_node_before = undefined; }, 600);
                m_clicked_node_before = clicked_node;
            }
        });

        m_cytoscape.on('doubleclick', 'node.equip, node.hvac, node.door, node.group', function() {
            // by shkoh 20180903: node 아이콘 더블클릭 시 그룹을 클릭했을 경우
            if(this.id().substr(0, 1) == 'G') {
                const params = {
                    id: this.id(),
                    parent_id: this.data('pid'),
                    name: this.data('name'),
                    type: this.id().substr(0, 1) == 'E' ? 'equipment' : 'group',
                    kind: this.data('icon')
                }

                options.onClickMapNode(params);

                // by shkoh 20180903: 그룹을 더블클릭 했을 때 선택한 그룹이 load되며, ShowMapView 함수가 실행되는 것과 동일한 효과를 보여줌
                removeAllMapNode();
                
                loadMapInfo(this.id().substr(2)).then(function(info) {
                    // by shkoh 20180605: id가 숫자(그룹이 선택되어 있을 경우에)인 경우에는 그룹정보를 토대로 title를 지정함
                    if(!isNaN(Number(info.id))) setTitle(info.id);
                    else $('#grid-map-item-title').text(info.name);
                
                    setBackgroundImage(info.bg_img).then(function() {
                        loadMapIcon(info.id);
                        setMapMenu(info.id);
                        
                        mapViewContentResizing();
                        m_current_view_id = info.id;
                    });
                });
            } else if(this.id().substr(0, 1) == 'E') {
                // by shkoh 20211209: 더블클릭 시 동작 정의

                // by shkoh 20211209: 카메라인 경우
                if(this.data('icon') === 'dvr') {
                    options.onCameraWindow(this.id().substr(2));
                }
            }
        });

        m_cytoscape.on('layoutstop', function(event) {
            // by shkoh 20180607: 새로 맵이 그려질 경우, TreeView에서 설비 아이콘이 선택되었다면, MapView에서도 설비 아이콘을 선택함
            // by shkoh 20180628: cytoscape의 layoutstop 이벤트 종료 시 수행
            // by shkoh 20180628: 해당 내용 순서가 달라질 경우 원하는 결과가 나타나지 않음
            // by shkoh 20180628: 현재 select된 노드가 존재할 경우에는 해당 내용을 수행할 필요가 없음
            if(this.nodes(':selected').length == 0) options.onSelectMapNode();
        });

        m_cytoscape.on('cxttapstart', function(event) {
            // by shkoh 20180903: 만일 node가 선택되어 qtip이 나타났을 경우, 마우스 오른쪽 클릭 시 자동으로 qtip이 사라지도록 수정
            if(this.nodes(':selected').length > 0) unselectMapNode();
        });
    }

    function resetViewport() {
        m_cytoscape.resize();
    }

    /**
     * 지정 id의 node를 선택함
     * 
     * @param {String} id 현재 선택할 Node Id, "G_XXX" 혹은 "E_XXX" 형식
     */
    function selectMapNode(id) {
        if(m_cytoscape == undefined) return;
        m_cytoscape.$('node[id = "' + id + '"]').select();
    }

    function unselectMapNode() {
        if(m_cytoscape == undefined) return;
        m_cytoscape.$(':selected').unselect();
    }
    
    function removeAllMapNode() {
        if(m_cytoscape) m_cytoscape.remove(m_cytoscape.elements());
    }

    function getMapNode(id) {
        return m_cytoscape.elements('#' + id);
    }

    function setCytoscapeLayout(id) {
        if(m_cytoscape == undefined) return;
        if(id == undefined) return;

        // by shkoh 20180605: layout()을 적용하기 위해서는 .run()을 실행
        if(!isNaN(Number(id))) {
            // by shkoh 20190829: [그룹으로 보기]에서는 preset layout으로 설정
            m_cytoscape.layout(m_cytoscape_options).run();
            m_cytoscape_layout_name = 'preset';
            // by shkoh 20180702: [그룹으로 보기]에서는 이전 상태의 style을 따라서 표시
            m_cytoscape.style(m_cytoscape_style_flag == 0 ? m_cytoscape_normal_style : m_cytoscape_point_style);
        } else {
            // by shkoh 20190829: [설비별 보기]에서는 grid layout으로 설정
            m_cytoscape.layout(m_cytoscape_layout_grid).run();
            m_cytoscape_layout_name = 'grid';
            // by shkoh 20180702: [설비별 보기]에서는 항상 normal_style로 load함
            m_cytoscape.style(m_cytoscape_normal_style);
        }
    }

    function setNodePosition(info) {
        let node = m_cytoscape.nodes('#' + info.id);
        
        node.data('pos_x', info.x.toFixed(3));
        node.data('pos_y', info.y.toFixed(3));
    }

    /**
     * 새로운 정보로 map node를 배치함
     * 
     * @param {JSON} 새로 배치할 노드 정보
     */
    function repositionNode(info) {
        const nodes_info = JSON.parse(info.nodes);

        nodes_info.forEach(function(item) {
            let node = m_cytoscape.nodes('#' + item.id);
            
            if(node) {
                node.data('pos_x', item.x.toFixed(3));
                node.data('pos_y', item.y.toFixed(3));
                // by shkoh 20190830: Zoom 기능 추가
                node.data('zoom', item.zoom);
                node.data('preZoom', item.zoom);

                node.renderedPosition({
                    x: item.x.toFixed(3) * m_map_content_size.width,
                    y: item.y.toFixed(3) * m_map_content_size.height
                });
            }
        });
    }

    // by shkoh 20200917: 현재 보여지는 node들을 재배치
    function repositionCurrentNode() {
        m_cytoscape.elements().forEach(function(item) {
            item.renderedPosition({
                x: parseFloat(item.data('pos_x')) * m_map_content_size.width,
                y: parseFloat(item.data('pos_y')) * m_map_content_size.height
            });
        });

        // by shkoh 20190319: cytoscape에서 모든 node들이 배치되며 해당 크기에 맞춰서 노드들이 재 위치 조정이 이루어진 후에 마지막으로 layout을 재설정하여 최종적으로 렌더에 맞는 위치를 보정함
        setCytoscapeLayout(m_current_view_id);
    }

    // by shkoh 20220405: 선택한 아이콘의 이동 기능
    function moveItem(new_pos) {
        const selected_nodes = m_cytoscape.elements(':selected');

        selected_nodes.forEach(function(node) {
            let current_pos = node.renderedPosition();
            current_pos.x += new_pos.x;
            current_pos.y += new_pos.y;

            node.renderedPosition(current_pos);
        });
    }

    function addGroupNode(info) {
        m_cytoscape.add({
            group: 'nodes',
            data: {
                id: 'G_' + info.id,
                name: info.name,
                pid: m_current_view_id,
                level: 0,
                icon: 'group',
                pos_x: 0.50,
                pos_y: 0.50,
                zoom: '1.0',
                bgImg: getMapIconName('group', 0),
                bgImg_ani: getMapIconName('group', 0)
            },
            classes: 'group',
            position: {
                x: 0.5 * m_map_content_size.width,
                y: 0.5 * m_map_content_size.height
            }
        });
    }

    function deleteGroupNode(id) {
        const node = m_cytoscape.nodes('#G_' + id);
        if(node == undefined) return;
        
        m_cytoscape.remove(node);
    }

    function addEquipmentNode(info) {
        m_cytoscape.add({
            group: 'nodes',
            data: {
                id: 'E_' + info.id,
                name: info.name,
                pid: m_current_view_id,
                level: 0,
                icon: null,
                alarmColor: m_alarm_color_list[0],
                pos_x: 0.50,
                pos_y: 0.50,
                zoom: '1.0',
                bgImg: getMapIconName('null', 6),
                bgImg_ani: getMapIconName('null', 0),
                is_available: 'N',
                run_state: 'N'
            },
            classes: getEquipTypeByCode(info.equip_code),
            // classes: 'equip',
            position: {
                x: 0.5 * m_map_content_size.width,
                y: 0.5 * m_map_content_size.height
            }
        }).qtip({   // by shkoh 20180608: map node가 생성된 후에 qtip을 실행하기 위한 chaining
            content: {
                title: info.name,
                text: '',
            },
            position: {
                my: 'top center',
                at: 'bottom center',
                container: $('#tooltipBox'),
                adjust: {
                    y: 10,
                    cyViewport: true    // by shkoh 20180628: pan zoom 발생 시 위치값을 변경
                }
            },
            show: {
                event: 'select',    // by shkoh 20180628: cytoscape-qtip.js 파일에서 :327번 째 free 이벤트를 추가하여 drag 상황에서 위치값을 적용할 수 있도록 수정함
            },
            hide: {
                event: 'unselect remove',
                cyViewport: false,  // by shkoh 20180628: viewport가 변경이 되어도 tooltip이 없어지지 않음
            },
            style: {
                classes: 'qtip-wiki qtip-light qtip-shadow'
            },
            events: {
                show: function(event, api) {
                    api.set('content.text', updateTooltipInfo(info.id));
                }
            }
        });
    }

    function deleteEquipmentNode(id) {
        const node = m_cytoscape.nodes('#E_' + id);
        if(node == undefined) return;
        
        m_cytoscape.remove(node);
    }

    /**
     * map view 내 그룹 혹은 설비 변경
     * 
     * @param {JSON} info 업데이트를 위한 그룹 혹은 설비 정보
     */
    function updateMapView(info) {
        const node_id = (info.type == 'group' ? 'G_' : 'E_') + info.id;

        // by shkoh 20181004: 모니터링 페이지에 업데이트를 할 아이콘이 없다면 해당 동작 리턴함
        let node = getMapNode(node_id);
        if(node.length == 0) {
            // by shkoh 20200519: 그룹/설비가 업데이트 되었는데, 해당 그룹/설비가 현재 map에 존재하지 않으면, pid와 m_current_view_id가 동일(즉, 뷰잉되고 있는 맵에 있어야 한다면)함으로 해당 부모 map을 다시 읽음
            if(info.pid && (info.pid === m_current_view_id)) {
                showMapView(info.pid);
            }
            return;
        }

        // by shkoh 20181004: 현재 설비 그룹이 변경된 경우에는 현재 보여지는 노드에서 해당 노드를 삭제함
        // by shkoh 20181108: 그룹으로 보기에만 동작
        if(info.pid && (info.pid != m_current_view_id)) {
            if(info.type === 'group') deleteGroupNode(info.id);
            else deleteEquipmentNode(info.id);
            return;
        }

        if(info.name && info.name != node.data('name')) {
            node.data('name', info.name);

            try {
                if(info.type != 'group' && node.qtip('api')) {
                    const api = node.qtip('api');
                    api.set('content.title', info.name);
                }
            } catch(error) {
                console.error(error);
            }
        }

        // by shkoh 20190318: 항온항습기로 변경되었을 경우
        if(info.equip_code && info.equip_code == 'E0002') {
            node.classes('hvac');
        } else if(info.equip_code && info.equip_code === 'E0008') {
            node.classes('door');
        }

        if(info.icon) {
            // by shkoh 20181004: 새로운 icon이 변경되었다면, 즉 설비 모델이 변경되었다면
            node.data('icon', info.icon);
            node.data('bgImg', getMapIconName(info.icon, node.data('level')));
            node.data('bgImg_ani', getMapIconName(info.icon, 0));
        }

        if(info.level != undefined) {
            // by shkoh 20181004: 새로운 level이 변경되었다면, 새로운 level로 icon 변경
            node.data('level', info.level);
            node.data('alarmColor', m_alarm_color_list[info.level]);
            node.data('bgImg', getMapIconName(node.data('icon'), info.level));
        }

        // by shkoh 20181206: 아이콘과 사용여부가 설정되어 있고, 기존의 사용여부와 현재의 사용여부가 다르면
        if(info.icon && info.is_available && info.is_available != node.is_available) {
            node.data('is_available', info.is_available);
            node.data('bgImg', getMapIconName(info.icon, info.is_available == 'Y' ? node.data('level') : 6));
        }

        // by shkoh 20181004: 모델이 변경되었거나, 등급이 변경된 경우에는 qtip을 새로고침
        if(info.icon != undefined || info.level != undefined) {
            try {
                if(info.type != 'group' && node.qtip('api')) {
                    const api = node.qtip('api');
                    // by shkoh 20181004: 만일 현재 tooltip을 보고 있는 중에 설비 모델 혹은 장애등급이 변경된 경우
                    if($('#' + api._id + ':visible').length == 1) {
                        api.set('content.text', updateTooltipInfo(node_id.substr(2)));
                    }
                }
            } catch(error) {
                console.error(error);
            }
        }
    }

    /**
     * Notification 정보가 들어올 경우, map view의 Qtip를 갱신
     * 
     * @param {JSON} info 업데이트를 위한 그룹 혹은 설비 정보
     */
    function updateMapViewQtipByNotification(info) {
        const equip_id = 'E_' + info.pid;
        
        // by shkoh 20190213: 모니터링 페이지에 업데이트를 할 아이콘이 없다면 해당 동작 리턴함
        let node = getMapNode(equip_id);
        if(node.length == 0) return;

        try {
            if(node.qtip('api')) {
                const api = node.qtip('api');
                // by shkoh 20181004: 만일 현재 tooltip을 보고 있는 중에 설비 모델 혹은 장애등급이 변경된 경우
                if($('#' + api._id + ':visible').length == 1) {
                    api.set('content.text', updateTooltipInfo(equip_id.substr(2)));
                }
            }
        } catch(error) {
            console.error(error);
        }
    }

    function isHvacRunState(info) {
        const equip_id = 'E_' + info.pid;

        let node = getMapNode(equip_id);
        if(node.length == 0) return;

        try {
            let run_state = 'stop';
            if(info.label == '가동' || info.label == '운전') {
                run_state = 'run';
                node.data('run_state', 'Y');
            } else {
                node.data('run_state', 'N');
            }

            const icon_url = getMapIconName(node.data('icon'), node.data('is_available') == 'Y' ? node.data('level') : 6, run_state);

            $('#node_hvac_' + equip_id).css({
                'background-image': 'url("' + icon_url + '")'
            });
        } catch(error) {
            console.error(error);
        }
    }
    /***************************************************************************************************************/
    /* by shkoh 20180530: Map View - Cytoscape End                                                                 */
    /***************************************************************************************************************/
    
    /***************************************************************************************************************/
    /* by shkoh 20180529: Map View - UI Controll Start                                                             */
    /***************************************************************************************************************/
    
    /**
     * group_id에 따라서 map을 로드
     * 
     * @param {String} group_id 그룹보기인 경우 group_id, 설비별 보기인 경우 설비코드
     */
    function showMapView(group_id) {
        removeAllMapNode();
                
        loadMapInfo(group_id).then(function(info) {
            // by shkoh 20180605: id가 숫자(그룹이 선택되어 있을 경우에)인 경우에는 그룹정보를 토대로 title를 지정함
            if(!isNaN(Number(info.id))) setTitle(info.id);
            else $('#grid-map-item-title').text(info.name);
        
            setBackgroundImage(info.bg_img)
            .then(function() {
                loadMapIcon(info.id);
                setMapMenu(info.id);

                mapViewContentResizing();
                m_current_view_id = info.id;
            });
        });
    }

    function setBackgroundImage(img_url) {
        return new Promise(function(resolve, reject) {
            if(img_url == "" || img_url == "0") {
                $('#map-image').css({ 'background-image': 'none', 'background-position': 'center' });
                resolve();
            } else {
                if(img_url !== null && img_url.substr(0, 1) === '_') {
                    $('#map-image').css('background-size', 'auto');
                } else {
                    $('#map-image').css('background-size', '100% 100%');
                }
                
                img_url = '/img/group/' + img_url + '?' + (new Date().getTime());
    
                // by shkoh 20180530: 배경이 동일한 경우에는 새로 읽어들일 필요가 없다
                if($('#map-image').css('background-image').search(img_url) != -1) {
                    resolve();
                    return;
                }

                $('#map-image').removeClass('zoomOut zoomIn animated');
                
                $('#map-image')
                .addClass('zoomOut animated')
                .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationed animationend', function(e) {
                    // trick to execute the animation again
                    $(e.target)
                    .removeClass('zoomOut animated')
                    .addClass('zoomIn animated')
                    .css({ 'background-image': 'url("' + img_url + '")', 'background-position': 'center' })
                    .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(e) {
                        $(e.target).removeClass('zoomIn animated');
                        resolve();
                    });                    
                });
            }
        });
    }

    function setTitle(id) {
        // by shkoh 20181112: 설비별 보기값에 대해서는 해당 루틴이 동작할 필요가 없다.
        if(id.toString().substr(0, 1) == 'E') return;
        
        $.ajax({
            async: true,
            type: 'GET',
            url: '/api/monitoring/findParentGroupName?id=' + id
        }).done(function(items) {
            let innerHtml = '';
            items.forEach(function(item, index, arr) {
                innerHtml += ('<span class="link-map-title" id="link-map-' + item.id + '" pid="' + item.p_id + '">' + item.name + '</span>');
                if(index != arr.length - 1) innerHtml += ' >> ';
            });

            $('#grid-map-item-title').html(innerHtml);
            
            $('.link-map-title').off('click');
            $('.link-map-title').on('click', function() {
                const id = this.id.substr(9);

                if(isNewMap(id)) {
                    const params = {
                        id: 'G_' + id,
                        parent_id: $(this).attr('pid'),
                        name: $(this).text(),
                        type: 'group',
                        kind: 'group'
                    }

                    options.onClickMapNode(params);

                    // by shkoh 20180903: 그룹을 더블클릭 했을 때 선택한 그룹이 load되며, ShowMapView 함수가 실행되는 것과 동일한 효과를 보여줌
                    removeAllMapNode();
                    
                    loadMapInfo(id).then(function(info) {
                        // by shkoh 20180605: id가 숫자(그룹이 선택되어 있을 경우에)인 경우에는 그룹정보를 토대로 title를 지정함
                        if(!isNaN(Number(info.id))) setTitle(info.id);
                        else $('#grid-map-item-title').text(info.name);
                    
                        setBackgroundImage(info.bg_img).then(function() {
                            loadMapIcon(info.id);
                            setMapMenu(info.id);
                            
                            mapViewContentResizing();
                            m_current_view_id = info.id;
                        });
                    });
                }
            });
        });
    }

    function setMapMenu(id) {
        if(!isNaN(Number(id))) {
            // by shkoh 20190904: [그룹으로 보기]인 경우
            $('#btn_add_dummy, #btn_add_link, #btn_shapeChange, #btn_del_link, #btn_zoom_in, #btn_zoom_default, #btn_zoom_out, #btn_save_position').show();
        } else {
            // by shkoh 20190904: [설비별 보기]인 경우
            $('#btn_zoom_in, #btn_zoom_default, #btn_zoom_out, #btn_add_dummy, #btn_add_link, #btn_shapeChange, #btn_save_position, #btn_del_link').hide();
        }
    }

    function getEquipTypeByCode(equip_code) {
        let type = 'equip';

        switch(equip_code) {
            case 'E0002':
            case 'E0014':
            case 'E0027': {
                type = 'hvac';
                break;
            }
            case 'E0008': {
                type = 'door';
                break;
            }
        }

        return type;
    }
    /***************************************************************************************************************/
    /* by shkoh 20180529: Map View - UI Controll End                                                               */
    /***************************************************************************************************************/

    return {
        CreateMapView: function() {            
            createMapView();
            
            createCytoscape();
            
            loadCytoscapeStyle();
            loadCytoscapeOptions();
            
            addCytoscapeEvents();

            mapViewContentResizing();
        },
        
        ResizingMapView: function() { mapViewContentResizing(); },
        
        ShowMapView: function(group_id) {
            if(isNewMap(group_id)) {
                showMapView(group_id);
            } else {
                options.onSelectMapNode();
            }
        },

        UnselectMapNode: function() { unselectMapNode(); },

        SelectMapNode: function(equip_id) { selectMapNode(equip_id); },

        AddGroupNode: function(group_info) {
            // by shkoh 20180711: 그룹추가가 이뤄질 때, mapView의 현재 group_id와 무관한 경우에 해당 mapView로 이동하며, 동일한 경우에 icon을 추가함
            if(!isNewMap(group_info.pid)) {
                addGroupNode(group_info);
            }
        },

        DeleteGroupNode: function(delete_info) {
            // by shkoh 20180711: 그룹삭제가 이루어졌을 경우에 mapView에 표시된 그룹에 따라서 2가지 형태로 처리함
            // by shkoh 20180711: m_current_view_id와 삭제하려는 id가 동일한 경우, 삭제한 그룹의 부모그룹을 현재 상태로 함
            // by shkoh 20180711: m_current_view_id와 삭제하려는 id가 다른 경우, 삭제한 그룹 노드만 삭제
            if(!isNewMap(delete_info.id)) {
                this.ShowMapView(delete_info.pid);
            } else {
                // by shkoh 20180711: 삭제하려는 그룹이 mapView 내에 존재하지 않는다면 아무 일도 일어나지 않는다
                deleteGroupNode(delete_info.id);
            }
        },

        AddEquipmentNode: function(add_info) {
            if(!isNewMap(add_info.pid)) {
                addEquipmentNode(add_info);
            }
        },

        DeleteEquipmentNode: function(delete_info) {
            // by shkoh 20180831: 설비삭제가 진행된 후, mapView에 표시된 그룹 맵과 설비의 부모그룹맵이 다른 경우에는 부모 그룹의 맵을 로드함
            if(!isNewMap(delete_info.pid)) {
                // by shkoh 20180711: 삭제하려는 그룹이 mapView 내에 존재하지 않는다면 아무 일도 일어나지 않는다
                deleteEquipmentNode(delete_info.id);
            }
        },

        RedrawMapView: function(info) {
            switch(info.command) {
                case 'insert':
                    if(isNaN(Number(m_current_view_id)) && m_current_view_id.substr(0, 1) == 'E' && m_current_view_id == info.equip_code) {
                        if(info.type == 'equipment') this.AddEquipmentNode(info);
                    } else {
                        if(info.type == 'group') this.AddGroupNode(info);
                        else if(info.type == 'equipment') this.AddEquipmentNode(info);
                    }
                break;
                case 'update':
                    // by shkoh 20181004: if(true) -> 현재 페이지가 설비별 보기라면
                    // by shkoh 20181012: if(false) -> 현재 페이지가 그룹으로 보기라면
                    if(isNaN(Number(m_current_view_id)) && m_current_view_id.substr(0, 1) == 'E' && info.icon && info.equip_code) {
                        // by shkoh 20181113: 설비별 보기인 경우에는 mapView의 내용만 그대로 새로 고침함
                        showMapView(m_current_view_id);
                    } else {
                        // by shkoh 20181012: if(true) -> 변경정보가 그룹이고,
                        // by shkoh 20181012: if(false) -> 그 외 정보인 경우
                        if(info.type == 'group') {
                            // by shkoh 20181112: if(true) -> 현재 모니터링하고 있는 그룹과 변경정보의 그룹이 동일하다면
                            // by shkoh 20181112: if(false) -> 현재 모니터링하고 있는 그룹과 변경정보의 그룹이 다른 경우에
                            if(!isNewMap(info.id)) {
                                loadMapInfo(info.id).then(function(info) {
                                    // by shkoh 20180605: id가 숫자(그룹이 선택되어 있을 경우에)인 경우에는 그룹정보를 토대로 title를 지정함
                                    setTitle(info.id);
                                
                                    setBackgroundImage(info.bg_img).then(function() {                                    
                                        mapViewContentResizing();
                                    });
                                });
                            } else {
                                // by shkoh 20181112: 혹시 그룹의 명칭이 변경될 수 있음으로 mapView의 title을 새로 고침
                                setTitle(m_current_view_id);
                                updateMapView(info);
                            }
                        } else {
                            updateMapView(info);
                        }
                    }
                break;
                case 'delete':
                    if(isNaN(Number(m_current_view_id)) && m_current_view_id.substr(0, 1) == 'E' && m_current_view_id == info.equip_code) {
                        if(info.type == 'equipment') this.DeleteEquipmentNode(info);
                    } else {
                        if(info.type == 'group') this.DeleteGroupNode(info);
                        else if(info.type == 'equipment') this.DeleteEquipmentNode(info);
                    }
                break;
                case 'notify':
                    if(info.type != 'sensor') updateMapView(info);
                    else updateMapViewQtipByNotification(info);
                break;
                case 'redraw':
                    repositionNode(info);
                break;
                case 'runstate':
                    isHvacRunState(info);
                break;
            }
        },
        ResetViewport: function() { resetViewport(); },
        SearchingEquipment: function(group_id, equip_id) {
            if(isNewMap(group_id)) {
                removeAllMapNode();
                
                loadMapInfo(group_id).then(function(info) {
                    // by shkoh 20180605: id가 숫자(그룹이 선택되어 있을 경우에)인 경우에는 그룹정보를 토대로 title를 지정함
                    if(!isNaN(Number(info.id))) setTitle(info.id);
                    else $('#grid-map-item-title').text(info.name);
                
                    setBackgroundImage(info.bg_img)
                    .then(function() {
                        loadMapIcon(info.id);
                        setMapMenu(info.id);

                        mapViewContentResizing();
                        m_current_view_id = info.id;

                        selectMapNode(equip_id);
                    });
                });
            } else {
                setTitle(m_current_view_id);
                unselectMapNode();
                setTimeout(function() {
                    selectMapNode(equip_id);
                }, 300);
            }
        }
    }
}