let g_interval_updateMonitoringMap = undefined;
let g_interval_animation = undefined;

// by shkoh 20180515: Grid Stack이 처음 로드될 때에는 저장 루틴이 발생되지 않음으로 해당 이를 체크하기 위한 전역 Flag
let g_availableGridSave = false;

// by shkoh 20180516: Grid Stack의 초기값. DB에 저장되지 않는 항목들(min, max, name)의 초기값은 g_grid_info JSON에 존재함
let g_grid_info = {
    'grid-tree': { id: 'grid-tree', name: '그룹목록', x: 0, y: 0, width: 3, height: 56, minWidth: 2, minHeight: 20, maxWidth: 5, maxHeight: 100 },
    'grid-map': { id: 'grid-map', name: '지도', x: 3, y: 0, width: 10, height: 56, minWidth: 5, minHeight: 20, maxWidth: 16, maxHeight: 100 },
    'grid-detail': { id: 'grid-detail', name: '설비 상세정보', x: 13, y: 0, width: 3, height: 72, minWidth: 2, minHeight: 20, maxWidth: 5, maxHeight: 100 },
    'grid-alarm': { id: 'grid-alarm', name: '장애목록', x: 0, y: 56, width: 13, height: 28, minWidth: 5, minHeight: 10, maxWidth: 16, maxHeight: 60 },
    'grid-power': { id: 'grid-power', name: '전력', x: 13, y: 32, width: 3, height: 20, minWidth: 2, minHeight: 18, maxWidth: 5, maxHeight: 40 },
    'grid-pue': { id: 'grid-pue', name: 'PUE', x: 13, y: 40, width: 3, height: 20, minWidth: 2, minHeight: 12, maxWidth: 5, maxHeight: 40 },
    'grid-t-h': { id: 'grid-t-h', name: '평균온습도', x: 13, y: 40, width: 3, height: 20, minWidth: 2, minHeight: 10, maxWidth: 5, maxHeight: 40 },
    'grid-server': { id: 'grid-server', name: 'FMS 서버현황', x: 13, y: 72, width: 3, height: 12, minWidth: 2, minHeight: 6, maxWidth: 5, maxHeight: 40 },
};

// by shkoh 20180516: SideBar Controller
let g_sideController = undefined;

// by shkoh 20180516: TreeView Controller
let g_treeViewController = undefined;
// by shkoh 20180517: TreeContextMenu Controller
let g_treeContextMenuController = undefined;
// by shkoh 20180517: DetailView Controller
let g_detailViewController = undefined;
// by shkoh 20180525: AlarmView Controller
let g_alarmViewController = undefined;
// by shkoh 20180529: MapView Controller
let g_mapViewController = undefined;
// by shkoh 20190828: FMS Server View Controller
let g_fmsServerViewController = undefined;

$(window).on('resize', function() {
    // by shkoh 20200916: body에 높이를 지정
    $('body').height(parent.$('iframe').height() - 8);
    
    if(g_mapViewController) g_mapViewController.ResizingMapView();
});

$(function() {
    // by shkoh 20220105: 대시보드 등 타사에서 모니터링 페이지로 다이렉트로 접근할 경우, 특정 링크를 타고 오는 것으로 이해하고 메뉴바를 노출시킴
    const link_id = $('body').attr('data-link-id');
    if(link_id !== '') {
        if(parent.offUnvisibleHeaderAndFooter) parent.offUnvisibleHeaderAndFooter();
        if(parent.exceptionMonitoring) parent.exceptionMonitoring();
    }

    // by shkoh 20200916: body에 높이를 지정
    $('body').height(parent.$('iframe').height() - 8);
    
    g_interval_updateMonitoringMap = setTimeout(updateMonitoringMap, 300000);
    g_interval_animation = setTimeout(redrawAnimation, 2000);

    initSideBar();
    initGridStack();
    initTreeContextMenu();
    
    loadGridStack();

    // by shkoh 20200916: body에 높이를 지정하고 scroll 이벤트를 발생시켜야만 cytoscape가 스크롤 동작 시 발생되는 버그를 막을 수 있다
    $('body').mCustomScrollbar({
        theme: 'minimal-dark',
        axis: 'y',
        scrollbarPosition: 'outside',
        mouseWheel: {
            preventDefault: false
        },
        keyboard: {
            enable: false
        },
        callbacks: {
            whileScrolling: function(e) {
                if(g_mapViewController) g_mapViewController.ResetViewport();
            },
            onScroll: function() {
                if(g_mapViewController) g_mapViewController.ResetViewport();
            }
        }
    });
});

function updateMonitoringMap() {
    g_interval_updateMonitoringMap = setTimeout(updateMonitoringMap, 300000);
}

function redrawAnimation() {
    g_interval_animation = setTimeout(redrawAnimation, 2000);
}

/**
 * info 정보에 포함된 내용을 토대로 모니터링뷰를 새로 그림
 * 
 * @param {JSON} info 새로 추가되거나 변경이 필요한 정보
 */
function redrawViewer(info) {
    if(g_treeViewController) g_treeViewController.RedrawTree(info);
    if(g_mapViewController) g_mapViewController.RedrawMapView(info);
    if(g_alarmViewController) g_alarmViewController.RedrawAlarmView(info);
    if(g_detailViewController) g_detailViewController.RedrawDetailView(info);
}

/**
 * 모니터링 페이지에서 미확인 알람을 클릭할 경우에 해당 설비 정보를 추출하여, 각종 viewer에 지정 equipment를 찾아서 보여줌
 * 
 * @param {Number} equip_id equipment id
 */
function searchingEquipment(equip_id) {
    $.ajax({
        async: true,
        type: 'GET',
        dataType: 'json',
        url: '/api/monitoring/equipment?id=' + equip_id
    }).done(function(data) {        
        if(g_treeViewController) g_treeViewController.SelectTreeNode('E_' + data.id);
        if(g_mapViewController) {
            g_mapViewController.SearchingEquipment(data.pid, 'E_' + data.id);
        }
        if(g_detailViewController) {
            const params = {
                id: 'E_' + data.id,
                parent_id: 'G_' + data.pid,
                name: data.name,
                type: 'equipment',
                kind: data.icon
            }

            g_detailViewController.ShowDetailView(params);
        }
    }).fail(function(err) {
        console.error(err);
    });
}

function getUrlParameter(searching_parameter) {
    const locate = location.search;

    if(locate.indexOf('?') === -1) return undefined;

    const parameter = locate.split('?')[1];
    const parameter_array = parameter.split('&');
    for(let param of parameter_array) {
        const term = param.split('=');
        if(term[0] === searching_parameter) return term[1];
    }

    return undefined;
}

/**
 * Side Bar Controller 생성 및 초기화
 */
function initSideBar() {
    g_sideController = new SideBarCtrl({
        pathA_id: 'pathA',
        pathB_id: 'pathB',
        pathC_id: 'pathC',
        wrapper_id: 'menu-icon-wrapper',
        trigger_id: 'menu-icon-trigger',
        sidebar_id: 'sidebar',
        slider_id: 'slider'
    });
    
    g_sideController.Create();

    // by shkoh 20180515: 모니터링에 필요한 항목을 추가/삭제할 수 있도록 함
    $(".btn-check").on("click", function(e) {
        const selected_grid_id = $(this)[0].id.substr(11);

        if($(this).hasClass('active') == true) {
            window.grid.removeWidget($('#' + selected_grid_id).parent(), true);
        } else {
            addGridStack(g_grid_info[selected_grid_id]);
        }
    });
}

/**
 * Grid Stack 생성 및 초기화, 이벤트 설정
 */
function initGridStack() {
    $('.grid-stack').on('added', function(event, items) {
        switch(items[0].id) {
            case 'grid-tree': {
                g_treeViewController = new TreeViewContent('#grid-tree', {
                    onClick: onTreeViewClick,
                    onRightClick: onTreeViewRightClick,
                    onRadioEquipTree: onTreeViewEquipTreeClick,
                    onRadioGroupTree: onTreeViewGroupTreeClick
                });

                let target = getUrlParameter('equipId');
                let target_group = getUrlParameter('groupId');
                
                if(target && target_group === undefined) {
                    g_treeViewController.CreateTreeView('E_' + target);
                } else if(target === undefined && target_group) {
                    g_treeViewController.CreateTreeView('G_' + target_group);
                } else {
                    g_treeViewController.CreateTreeView();
                }
                break;
            }
            case 'grid-alarm': {
                g_alarmViewController = new AlarmViewContent('#grid-alarm', {
                    onFaultEditWindow: popupFaultWindow,
                    onSeachingEquipment: searchingEquipment
                });
                g_alarmViewController.CreateAlarmView();
                break;
            }
            case 'grid-detail': {
                g_detailViewController = new DetailViewContent('#grid-detail');
                // by shkoh 20210504: 타켓을 보낼 경우에 url에 equip_id가 존재하는 경우에는 해당 정보를 로드하여 추가함
                g_detailViewController.CreateDetailView();
                
                if(g_treeViewController) {
                    const treeNode = g_treeViewController.GetCurrentSelectionTreeNodeInfo();
                    let params = {
                        type: undefined
                    }
                    
                    if(treeNode) {
                        params = {
                            id: treeNode.id,
                            parent_id: treeNode.pid,
                            name: treeNode.name,
                            type: treeNode.type,
                            kind: treeNode.iconName
                        }
                    }

                    g_detailViewController.ShowDetailView(params);
                }
                
                let target = getUrlParameter('equipId');
                let target_group = getUrlParameter('groupId');
                if(target && target_group === undefined) {
                    $.ajax({
                        async: true,
                        type: 'GET',
                        dataType: 'json',
                        url: '/api/monitoring/equipment?id=' + target
                    }).done(function(data) {
                        if(g_detailViewController) {
                            const params = {
                                id: 'E_' + data.id,
                                parent_id: 'G_' + data.pid,
                                name: data.name,
                                type: 'equipment',
                                kind: data.icon
                            }
                
                            g_detailViewController.ShowDetailView(params);
                        }
                    }).fail(function(err) {
                        console.error(err);
                    });
                } else if(target === undefined && target_group) {
                    $.ajax({
                        async: true,
                        type: 'GET',
                        dataType: 'json',
                        url: '/api/monitoring/group?id=' + target_group
                    }).done(function(data) {
                        if(g_detailViewController) {
                            const params = {
                                id: 'E_' + data.id,
                                parent_id: 'G_' + data.pid,
                                name: data.name,
                                type: 'group',
                                kind: 'group'
                            }
                
                            g_detailViewController.ShowDetailView(params);
                        }
                    }).fail(function(err) {
                        console.error(err);
                    });
                }
                break;
            }
            case 'grid-map': {
                g_mapViewController = new MapViewContent('#grid-map', {
                    onSelectMapNode: onMapViewSelectMapNode,
                    onClickMapNode: onMapViewMapNodeClick,
                    onSettingWindow: popupSettingWindow,
                    onCameraWindow: popupCameraWindow,
                    onAddGroupNode: addGroup,
                    onAddEquipmentNode: addEquipment,
                    onDeleteEquipmentNode: deleteEquipment,
                    onGoToSensorSetting: goToSensor,
                    onFaultWindow: popupFaultWindow,
                    onLogWindow: popupLogWindow,
                    onWorkHistoryWindow: popupWorkHistoryWindow
                });
                g_mapViewController.CreateMapView();

                let group_id = $.session.get('user-start-id');

                if(g_treeViewController) {
                    const treeNode = g_treeViewController.GetCurrentSelectionTreeNodeParentInfo();

                    if(treeNode) {
                        group_id = treeNode.type == 'equipment' ? treeNode.pid.substr(2) : treeNode.id.substr(2);
                    }
                }
                
                let target = getUrlParameter('equipId');
                let target_group = getUrlParameter('groupId');
                if(target && target_group === undefined) {
                    $.ajax({
                        async: true,
                        type: 'GET',
                        dataType: 'json',
                        url: '/api/monitoring/equipment?id=' + target
                    }).done(function(data) {
                        if(g_mapViewController) {
                            g_mapViewController.SearchingEquipment(data.pid, 'E_' + data.id);
                        }
                    }).fail(function(err) {
                        console.error(err);
                    });
                } else if(target === undefined && target_group) {
                    g_mapViewController.ShowMapView(target_group);
                } else {
                    g_mapViewController.ShowMapView(group_id);
                }
                break;
            }
            case 'grid-power': break;
            case 'grid-pue': break;
            case 'grid-t-h': break;
            case 'grid-server':
                g_fmsServerViewController = new FMSServerViewContent('#grid-server');
                g_fmsServerViewController.CreateFMSServerView();
                break;
        }
    });

    // by shkoh 20180515: grid stack 항목에서 삭제 이벤트가 일어날 때, 최종 값을 기록함
    $('.grid-stack').on('removed', function(event, items) {
        g_grid_info[items[0].id].x = items[0].x;
        g_grid_info[items[0].id].y = items[0].y;
        g_grid_info[items[0].id].width = items[0].width;
        g_grid_info[items[0].id].height = items[0].height;

        switch(items[0].id) {
            case 'grid-tree': g_treeViewController = undefined; break;
            case 'grid-alarm': g_alarmViewController = undefined; break;
            case 'grid-detail': g_detailViewController = undefined; break;
            case 'grid-map': g_mapViewController = undefined; break;
            case 'grid-power': break;
            case 'grid-pue': break;
            case 'grid-t-h': break;
            case 'grid-server': g_fmsServerViewController = undefined; break;
        }
    });

    $('.grid-stack').on('change', function(event, items) {
        if(!g_availableGridSave) return;
        saveGridStack();
    });

    $('.grid-stack').on('resizestart', function(event, ui) {
    });

    $('.grid-stack').on('gsresizestop', function(event, elem) {
        event.stopImmediatePropagation();

        switch(elem.dataset.gsId) {
            case 'grid-tree': if(g_treeViewController) g_treeViewController.ResizingTreeView(); break;
            case 'grid-detail': if(g_detailViewController) g_detailViewController.ResizingDetailView(); break;
            case 'grid-alarm': if(g_alarmViewController) g_alarmViewController.ResizingAlarmView(); break;
            case 'grid-map': if(g_mapViewController) g_mapViewController.ResizingMapView(); break;
            case 'grid-server': if(g_fmsServerViewController) g_fmsServerViewController.ResizingFMSServerView(); break;
        }
    });

    // by shkoh 20160404: Grid Stack 특성 정의
    $(".grid-stack").gridstack({
        animate: false,
        cellHeight: 4,
        verticalMargin: 8,
        width: 16,
        resizable: {
            autoHide: true,
            handles: 'se, sw, nw'
        },
        handle: ".grid-item-draggable",
    });

    // by shkoh 20180516: 모니터링 Grid Stack에서 X 버튼을 클릭하여 창을 닫는 이벤트
    $(".grid-stack").on("click", "span.panel_close_icon", function(e) {
        const contentElement = $(e.target).closest(".grid-stack-item-content");
        if(contentElement == undefined) return;
        
        const selected_grid_id = contentElement[0].id;
        window.grid.removeWidget($('#' + selected_grid_id).parent(), true);
        
        $("#btn-toggle-" + selected_grid_id).removeClass("active");
    });

    this.grid = $(".grid-stack").data("gridstack");
}

/**
 * TreeContextMenu에서 수행할 내용을 정의
 */
function initTreeContextMenu() {
    $('#menu_add_group').on('click', function() {
        const pid = g_treeContextMenuController.getParentId() == undefined ? '0' : g_treeContextMenuController.getParentId().substr(2);
        addGroup(pid);
        
        g_treeContextMenuController.HideContextMenu();
    });

    $('#menu_del_group').on('click', function() {
        const delete_id = g_treeContextMenuController.getParentId() == undefined ? '0' : g_treeContextMenuController.getParentId().substr(2);
        g_treeContextMenuController.HideContextMenu();

        const delete_node = g_treeViewController.GetTreeNodeInfo('G_' + delete_id);
        if(delete_node.isParent) {
            alert('지정 그룹(' + delete_node.name + ')에 하위그룹 혹은 하위설비가 존재합니다\n삭제를 원하시면 하위그룹 혹은 하위설비를 모두 삭제해 주세요');
            return;
        }

        const isDelete = confirm('그룹 [' + delete_node.name + '] 를 삭제하시겠습니까?');
        if(isDelete) deleteGroup({ id: delete_id, parent_id: delete_node.pid.substr(2) });
    });

    $('#menu_modify_group').on('click', function() {
        const selected_id = g_treeContextMenuController.getSelectedId();
        popupSettingWindow(selected_id);

        g_treeContextMenuController.HideContextMenu();
    });

    $('#menu_add_equip').on('click', function() {
        // by shkoh 20180829: 설비추가는 [그룹]에서 발생하며 선택한 [그룹] 하위 항목으로 설비가 추가됨
        const selected_group_id = g_treeContextMenuController.getSelectedId().substr(2);
        addEquipment(selected_group_id);

        g_treeContextMenuController.HideContextMenu();
    });

    $('#menu_del_equip').on('click', function() {        
        const delete_node = g_treeViewController.GetTreeNodeInfo(g_treeContextMenuController.getSelectedId());

        // by shkoh 20180831: Tree Context Menu가 사라지면 트리에 선택한 id 값들은 초기화됨으로 해당 정보를 우선 가져온 후에 Context Menu를 숨긴다
        g_treeContextMenuController.HideContextMenu();
        
        const isDelete = confirm('설비 [' + delete_node.name + '] 를 삭제하시겠습니까?');
        if(isDelete) deleteEquipment({ id: delete_node.id.substr(2), parent_id: delete_node.pid.substr(2) });
    });

    $('#menu_modify_equip').on('click', function() {
        const selected_id = g_treeContextMenuController.getSelectedId();
        popupSettingWindow(selected_id);

        g_treeContextMenuController.HideContextMenu();
    });

    $('#menu_set_sensor').on('click', function() {
        const selected_id = g_treeContextMenuController.getSelectedId();
        goToSensor(selected_id);

        g_treeContextMenuController.HideContextMenu();
    });

    $('#menu_working').on('click', function() {
        const selected_equip_id = g_treeContextMenuController.getSelectedId();

        popupWorkHistoryWindow(selected_equip_id);

        g_treeContextMenuController.HideContextMenu();
    });

    // kdh 20180717 장애이력조회 팝업
    $('#menu_fault').on('click', function() {
        const selected_equip_id = g_treeContextMenuController.getSelectedId();

        popupFaultWindow(selected_equip_id);

        g_treeContextMenuController.HideContextMenu();
    });

    // kdh 20180913 통신로그보기 팝업
    $('#menu_communication_log').on('click', function() {
        const selected_equip_id = g_treeContextMenuController.getSelectedId();
        popupLogWindow(selected_equip_id);

        g_treeContextMenuController.HideContextMenu();
    });

    // kdh 20181218 국민연금 '관심설비등록' 팝업
    $('#menu_attention_equip').on('click', function() {
        const selected_id = g_treeContextMenuController.getSelectedId();
        // popupSettingWindow(selected_id);
        window.open('/monitoring/attention/open/A' + selected_id, 'equipAttentionxWindow', 'scrollbars=1, menubar=no, resizable=no, location=no, titlebar=no, toolbar=no, status=no, width=800, height=600');

        g_treeContextMenuController.HideContextMenu();
    });

    g_treeContextMenuController = new TreeContextMenu('#treeContextMenu', onHideTreeContextMenu);
}

/**
 * 데이터베이스로부터 Grid Stack의 정보를 조회하여 적용
 */
function loadGridStack() {
    $.ajax({
        async: true,
        type: 'GET',
        dataType: 'json',
        url: '/api/monitoring/gridstack'
    }).done(function(grid_info) {
        window.grid.removeAll();
        
        grid_info.forEach(function(info) {
            // by shkoh 20181012: DB와 실제 등록설비 내용이 일치하지 않는 경우에는 모니터링뷰에 등록조차 하지 않음
            if(g_grid_info[info.id]) {
                g_grid_info[info.id].x = info.x;
                g_grid_info[info.id].y = info.y;
                g_grid_info[info.id].width = info.w;
                g_grid_info[info.id].height = info.h;

                addGridStack(g_grid_info[info.id]);

                $("#btn-toggle-" + info.id).addClass('active');
            }
        });
    }).fail(function(err_msg) {
        console.error(err_msg);
    }).always(function() {
        g_availableGridSave = true;
    });
}

/**
 * Grid Stack에 특정 Item을 추가함
 * 
 * @param {JSON} node 추가를 위한 grid stack 항목 정보
 */
function addGridStack(node) {
    const innerHtml =
    '<div>' +
        '<div id="' + node.id + '" class="grid-stack-item-content">' +
        '</div>' +
    '</div>';

    window.grid.addWidget($(innerHtml), node.x, node.y, node.width, node.height, false, node.minWidth, node.maxWidth, node.minHeight, node.maxHeight, node.id);
}

/**
 * Grid Stack의 현재 상태 정보를 데이터베이스에 저장
 */
function saveGridStack() {
    let nodes = _.map($('.grid-stack > .grid-stack-item:visible'), function(ele) {
        ele = $(ele);
        const node = ele.data('_gridstack_node');
        return {
            grid_id: node.id,
            x: node.x,
            y: node.y,
            w: node.width,
            h: node.height
        };
    }, this);

    $.ajax({
        async: true,
        type: 'POST',
        url: `/api/monitoring/gridstack`,
        dataType: 'json',
        data: {
            items: JSON.stringify(nodes)
        }
    }).fail(function(xhr) {
        console.error('[saveGridStack] ' + xhr.responseText);
    });
}

/***************************************************************************************************************/
/* by shkoh 20180605: TreeView Callback Function Start                                                         */
/***************************************************************************************************************/
/**
 * TreeView 클릭 이벤트
 * 
 * @param {Object} event TreeViewClick Event Object
 * @param {String} treeId TreeView Element Id
 * @param {JSON} treeNode 클릭한 Tree Node 정보
 * @param {Boolean} clickFlag Tree Node의 선택 상태
 */
function onTreeViewClick(event, treeId, treeNode, clickFlag) {
    if(treeNode == null) return;

    // by shkoh 20180531: view controller에는 새롭게 정제한 JSON을 인자로 넘김
    const params = {
        id: treeNode.id,
        parent_id: treeNode.pid,
        name: treeNode.name,
        type: treeNode.type,
        kind: treeNode.iconName
    }

    if(g_detailViewController) g_detailViewController.ShowDetailView(params);

    if(g_mapViewController) g_mapViewController.ShowMapView(params.type == 'equipment' ? params.parent_id.substr(2) : params.id.substr(2));
}

/**
 * TreeView 마우스 오른쪽 클릭 이벤트
 * 
 * @param {Object} event TreeView Right Click Event Object
 * @param {String} treeId TreeView Element Id
 * @param {JSON} treeNode 마우스 오른쪽 클릭한 TreeNode 정보 
 */
function onTreeViewRightClick(event, treeId, treeNode) {
    // by shkoh 20180516: treeNode가 없거나, treeNode의 type이 code, 즉 종류를 보여준다면 해당 이벤트를 종료함
    if(treeNode == null || treeNode.type == 'code') return;

    const event_x = event.clientX + (window.scrollX || window.pageXOffset);
    const event_y = event.clientY + (window.scrollY || window.pageYOffset);

    let param = {
        type: treeNode.type,
        parent_id: treeNode.pid,
        selected_id: treeNode.id,
        x: event_x,
        y: event_y
    };

    if(!treeNode.pid) {
        param.type = 'root';
        param.parent_id = treeNode.id;
    // } else if(treeNode.iconName == 'dvr') {
    //     param.type = 'dvr';
    } else {
        param.parent_id = treeNode.type == 'group' ? treeNode.id : treeNode.pid;
    }

    g_treeContextMenuController.ShowContextMenu(param);
}

/**
 * Tree View에서 설비별 보기 클릭 시
 */
function onTreeViewEquipTreeClick() {
    if($(this).hasClass('active')) return;
    g_treeViewController.GoToEquipTree();

    // by shkoh 20180605: 설비별 보기 시 초기 값은 존재하지 않는 코드('E9999')를 사용함
    let code_id = 'E9999';
    const treeNode = g_treeViewController.GetCurrentSelectionTreeNodeParentInfo();
    
    let params = { type: undefined };
    if(treeNode) {
        code_id = treeNode.type == 'equipment' ? treeNode.pid.substr(2) : treeNode.id.substr(2);

        params = {
            id: treeNode.id,
            parent_id: treeNode.pid,
            name: treeNode.name,
            type: treeNode.type,
            kind: treeNode.iconName
        }
    }

    if(g_mapViewController) g_mapViewController.ShowMapView(code_id);
    if(g_detailViewController) g_detailViewController.ShowDetailView(params);
}

/**
 * Tree View에서 그룹으로 보기 클릭 시
 */
function onTreeViewGroupTreeClick() {
    if($(this).hasClass('active')) return;

    g_treeViewController.GoToGroupTree();

    let group_id = $.session.get('user-start-id');
    const treeNode = g_treeViewController.GetCurrentSelectionTreeNodeParentInfo();

    let params = { type: undefined };
    if(treeNode) {
        group_id = treeNode.type == 'equipment' ? treeNode.pid.substr(2) : treeNode.id.substr(2);
        
        params = {
            id: treeNode.id,
            parent_id: treeNode.pid,
            name: treeNode.name,
            type: treeNode.type,
            kind: treeNode.iconName
        }
    }
    
    if(g_mapViewController) g_mapViewController.ShowMapView(group_id);
    if(g_detailViewController) g_detailViewController.ShowDetailView(params);
}
/***************************************************************************************************************/
/* by shkoh 20180605: TreeView Callback Function End                                                           */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20180607: MapView Callback Function Start                                                          */
/***************************************************************************************************************/
/**
 * MapView가 갱신되거나 MapView의 layoutStop 이벤트가 발생할 때, TreeView 내에 아이콘이 선택되어 있다면 MapView 내 아이콘을 강제 선택함
 */
function onMapViewSelectMapNode() {
    // by shkoh 20180607: Map이 변경되지 않는 경우
    // by shkoh 20180607: Tree View 활성화가 되어 있고, equipment node가 선택되었다면 해당 equipment를 selected로 변경
    if(g_treeViewController) {
        g_mapViewController.UnselectMapNode();
        
        const treeNode = g_treeViewController.GetCurrentSelectionTreeNodeInfo();
        if(treeNode && treeNode.type == 'equipment') {
            g_mapViewController.SelectMapNode(treeNode.id);
        }
    }
}

/**
 * MapView 내에서 그룹 혹은 설비 노드를 클릭했을 때 수행
 * 
 * @param {JSON} params 노드(그룹 혹은 설비 아이콘)의 정보
 */
function onMapViewMapNodeClick(params) {
    if(g_detailViewController) g_detailViewController.ShowDetailView(params);
    if(g_treeViewController) g_treeViewController.SelectTreeNode(params.id);
}
/***************************************************************************************************************/
/* by shkoh 20180607: MapView Callback Function End                                                            */
/***************************************************************************************************************/

/**
 * Context Menu를 숨길 때 실행될 이벤트
 * Context Menu가 나타날 때 창 어디든 클릭하여 사라지도록 함
 * 
 * @param {Object} event Click Event Object
 */
function onHideTreeContextMenu(event) {
    if(event.target.id != g_treeContextMenuController.getId() && $(event.target).parents(g_treeContextMenuController.getId()).length == 0) {
        g_treeContextMenuController.HideContextMenu();
    }
}

/***************************************************************************************************************/
/* by shkoh 20180605: Monitoring.js Local Function Start                                                       */
/***************************************************************************************************************/
/**
 * 넘겨받은 인자의 group parent_id 내에 그룹을 추가함
 * 그룹 추가가 성공했을 경우에는 WebSocket을 통하여 추가 상황을 인지함
 * 
 * @param {Int} parent_id 추가될 그룹의 부모 group_id
 */
function addGroup(parent_id) {
    $.ajax({
        async: true,
        type: 'POST',
        url: '/api/monitoring/group',
        dataType: 'json',
        data: {
            parent_id: parent_id
        }
    }).fail(function(err_msg) {
        console.error('[Fail to add a group item] ' + err_msg);
        alert('새 그룹 추가에 실패했습니다');
    });
}

/**
 * 해당 그룹 정보를 가진 그룹 삭제
 * 그룹 삭제 시 관련된 페이지의 내용들을 모두 정리함
 * 
 * @param {JSON} delete_info 삭제가 필요한 그룹 정보
 */
function deleteGroup(delete_info) {
    $.ajax({
        async: true,
        type: 'DELETE',
        url: '/api/monitoring/group',
        dataType: 'json',
        data: {
            delete_id: delete_info.id,
            parent_delete_id: delete_info.parent_id
        }
    }).fail(function(err_msg) {
        console.error('[Fail to delete a group item] ' + err_msg);
        alert('그룹 삭제 중 실패했습니다. 다시 확인 바랍니다.');
    });
}

/**
 * 인자 그룹 group_id 내에 설비를 추가
 * 
 * @param {Int} parent_id 추가할 설비의 부모 group_id
 */
function addEquipment(parent_id) {
    $.ajax({
        async: true,
        type: 'POST',
        url: '/api/monitoring/equipment',
        dataType: 'json',
        data: {
            parent_id: parent_id
        }
    }).fail(function(err_msg) {
        console.error('[Fail to add a equipment item] ' + err_msg);
        alert('새 설비 추가에 실패했습니다');
    });
}

/**
 * 해당 설비 정보를 가진 설비 삭제
 * 설비 삭제 시 관련된 페이지의 내용들을 모두 정리
 * 
 * @param {JSON} delete_info 삭제가 필요한 설비 정보
 */
function deleteEquipment(delete_info) {
    $.ajax({
        async: true,
        type: 'DELETE',
        url: '/api/monitoring/equipment',
        dataType: 'json',
        data: {
            delete_id: delete_info.id,
            parent_id: delete_info.parent_id
        }
    }).fail(function(err_msg) {
        console.error('[Fail to delete a equipment item] ' + err_msg);
        alert('설비 삭제 중 실패했습니다. 다시 확인 바랍니다.');
    });
}

/**
 * 그룹 혹은 설비 설정 창을 open함
 * 
 * @param {String} id 그룹 혹은 설비의 ID, "G_XX", "E_XX" 형식
 */
function popupSettingWindow(id) {
    // top_menu.js의 Top을 기준으로 window 오픈
    window.top.g_setting_window_opener = window.open('/popup/set/' + id, 'fmsSettingWindow', 'scrollbars=1, menubar=no, resizable=no, location=no, titlebar=no, toolbar=no, status=no, width=800, height=600');
}

/**
 *  카메라 Live 창을 open
 * 
 * @param {String} id equipment id, equip_id
 */
function popupCameraWindow(id) {
    window.open('/popup/camera/' + id, 'CAMERA VIEWER - ' + id, 'scrollbars=1, menubar=no, resizable=no, location=no, titlebar=no, toolbar=no, status=no, width=800, height=600');
}

/**
 * 해당 설비의 센서설정 페이지로 이동
 * 
 * @param {String} id 설비 ID, "E_XXX" 형식
 */
function goToSensor(id) {
    parent.exceptionSensorSetting();
    
    parent.$("#navbar_middle").text("| 설정 |");
    parent.$("#navbar_end").text("센서 설정");
    parent.$("#navbar_end").on("click", function() {
        parent.reloadIframe('/sensor');
    });

    parent.reloadIframe('/sensor?equipId=' + id.substr(2));
}

function popupWorkHistoryWindow(equip_id) {
    window.open('/popup/workhistory/' + equip_id.substring(2), 'workHistoryWindow_' + equip_id, 'scrollbars=1, menubar=no, resizable=no, location=no, titlebar=no, toolbar=no, status=no, width=1100, height=600');
}

/**
 * kdh 20181026 '장애이력조회' popup창
 * 
 * @param {String} id 설비 ID
 */
function popupFaultWindow(id, sensor_id, occur_date, alarm_level) {
    window.open('/popup/fault?equip_id=' + id.substr(2) + '&sensor_id=' + (sensor_id === undefined ? '' : sensor_id) + '&occur_date=' + (occur_date === undefined ? '' : occur_date) + '&alarm_level=' + (alarm_level === undefined ? '' : alarm_level), 'faultWindow_' + id, 'scollbars=1, menubar=no, resizable=no, location=no, titlebar=no, toolbar=no, status=no, width=1100, height=506');
}

function popupLogWindow(id) {
    window.open('/popup/log?equip_id=' + id.substr(2), 'logWindow_' + id, 'scrollbars=1, menubar=no, resizable=no, location=no, titlebar=no, toolbar=no, status=no, width=1100, height=600');
}
/***************************************************************************************************************/
/* by shkoh 20180605: Monitoring.js Local Function End                                                         */
/***************************************************************************************************************/