let g_items = undefined;
let g_uploader_inst = undefined;

let g_heatmap_inst = undefined;
const g_heatmap_data = {
    min: 10,
    max: 28,
    normal: 18
};

let g_event_grid = undefined;
let g_event_datasource = undefined;
const g_event_alarm_list = {
    '6': '강제 출입문 열림',
    '30': '출입불가: 미등록 출입시도',
    '33': '출입불가: 미승인 리더 출입시도',
    '28': '출입불가: 리더 임시제한',
}

$(window).on('resize', function() {
    resizeWindow();
});

$(function() {
    initCytoscape();

    if($.session.get('user-grade') === 'USR00') {
        initFloatingActionButton();
        initFileUpload();
    }

    loadItems();

    if($('#map').attr('is-heatmap') === 'true') {
        initHeatmap();
    }

    const type = $('#map').attr('data');
    if(type === 'security_b1f' || type === 'security_1f' || type === 'security_2f' || type === 'security_3f' || type === 'security_4f') {
        createEventList();
        createEventDataSource();
    }
});

/*************************************************************************************************************/
/* by shkoh 20211229: Resize Window Start                                                                    */
/*************************************************************************************************************/
function resizeWindow() {
    if(g_items) g_items.Resize();
    if(g_heatmap_inst) g_heatmap_inst.Resize();
    if(g_event_grid) g_event_grid.resize();
}
/*************************************************************************************************************/
/* by shkoh 20211229: Resize Window End                                                                      */
/*************************************************************************************************************/

/*************************************************************************************************************/
/* by shkoh 20211229: Cytoscape Start                                                                        */
/*************************************************************************************************************/
function initCytoscape() {
    g_items = new Items('cytoscape', {
        isIcomer: $.session.get('user-grade') === 'USR00',
        onSet: setItem,
        onDuplicate: duplicateItem,
        onDelete: deleteItem,
        onTouchEnd: repositionItem,
        onPlayCamera: popupCamera,
        onEquipmentSetting: popupEquipmentSetting,
        onCtrlLight: ctrlLight,
        onMoveMonitoring: moveMonitoring
    });
    g_items.Create();
}

function itemAlign(direction) {
    const selected_items = g_items.GetSelectedItem();
    if(selected_items.length < 2) {
        alert('아이템 정렬를 위해서는 2개 이상 항목을 선택하세요');
        return;
    }
    
    g_items.Align(direction);
}
/*************************************************************************************************************/
/* by shkoh 20211229: Cytoscape End                                                                          */
/*************************************************************************************************************/

/*************************************************************************************************************/
/* by shkoh 20211229: Heat Map Start                                                                         */
/*************************************************************************************************************/
function initHeatmap() {
    g_heatmap_inst = new HeatMap('heatmap', {
        min: g_heatmap_data.min,
        max: g_heatmap_data.max,
        normal: g_heatmap_data.normal
    });
    g_heatmap_inst.Create();

    $('.cfd-min').text(g_heatmap_data.min);
    $('.cfd-normal').text(g_heatmap_data.normal);
    $('.cfd-max').text(g_heatmap_data.max);

    // by shkoh 20210609: heatmap 옵션 변경
    $('.opt').on('change', function() {
        const new_options = {
            p: parseFloat($('#cfd-p').val()),
            opacity: parseFloat($('#cfd-opacity').val()),
            gamma: parseFloat($('#cfd-gamma').val()),
            range_factor: parseFloat($('#cfd-range').val()),
            framebuffer_factor: parseFloat($('#cfd-framebuffer').val())
        };

        g_heatmap_inst.UpdateOption(new_options);
    });
}
/*************************************************************************************************************/
/* by shkoh 20211229: Heat Map End                                                                           */
/*************************************************************************************************************/

/*************************************************************************************************************/
/* by shkoh 20211228: Floating Action Button Start                                                           */
/*************************************************************************************************************/
function initFloatingActionButton() {
    $('#fab').kendoFloatingActionButton({
        icon: 'gear',
        positionMode: 'fixed',
        align: 'top end',
        alignOffset: {
            x: 15.0,
            y: 15.0
        },
        themeColor: 'secondary',
        size: 'small',
        enabled: true,
        items: [{
            icon: 'image-insert',
            cssClass: 'i-fab-image i-image-insert'
        }, {
            icon: 'comment-remove',
            cssClass: 'i-fab-image  i-image-remove'
        }, {
            icon: 'plus',
            label: '아이템 추가',
            cssClass: 'i-equip-insert'
        }, {
            icon: 'set-column-position',
            label: '위치저장',
            cssClass: 'i-equip-reposition'
        }, {
            icon: 'align-top-element',
            cssClass: 'i-fab-align i-align-top'
        }, {
            icon: 'align-bottom-element',
            cssClass: 'i-fab-align i-align-bottom'
        }, {
            icon: 'align-left-element',
            cssClass: 'i-fab-align i-align-left'
        }, {
            icon: 'align-right-element',
            cssClass: 'i-fab-align i-align-right'
        }]
    });

    // by shkoh 20211229: 라이브러리 내에서 이벤트를 직접 수행할 경우, floating action button이 자동으로 닫힘으로 이를 방지하기 위해서 따로 구현
    $('.k-fab-item.i-image-insert').on('click', function(e) {
        addBackgroundImage();
    });

    $('.k-fab-item.i-image-remove').on('click', function(e) {
        if($('#img').length === 0) {
            alert('등록된 배경이미지가 존재하지 않습니다');
            return;
        }
        
        removeBackgroundImage();
    });

    $('.k-fab-item.i-equip-insert').on('click', function(e) {
        addItem();
    });

    $('.k-fab-item.i-equip-reposition').on('click', function(e) {
        itemPositionSave();
    });

    $('.k-fab-item.i-align-top').on('click', function(e) {
        itemAlign('top');
    });

    $('.k-fab-item.i-align-bottom').on('click', function(e) {
        itemAlign('bottom');
    });

    $('.k-fab-item.i-align-left').on('click', function(e) {
        itemAlign('left');
    });

    $('.k-fab-item.i-align-right').on('click', function(e) {
        itemAlign('right');
    });
}
/*************************************************************************************************************/
/* by shkoh 20211228: Floating Action Button End                                                             */
/*************************************************************************************************************/

/*************************************************************************************************************/
/* by shkoh 20211229: File Upload Start                                                                      */
/*************************************************************************************************************/
function initFileUpload() {
    g_uploader_inst = $('#file-upload').kendoUpload({
        multiple: false,
        showFileList: false,
        localization: {
            select: '배경이미지 업로드'
        },
        validation: {
            maxFileSize: 4294967296
        },
        async: {
            saveUrl: '/api/diagram/kepco/upload?type=' + $('#map').attr('data'),
            saveField: 'kepco'
        },
        autoUpload: true,
        select: function(e) {
            displayLoading();

            const upload_file = e.files[0];
            if(!upload_file.rawFile.type.includes('image')) {
                alert(upload_file.naem + ' 파일은 이미지 파일이 아닙니다\n이미지 파일만 업로드 가능합니다');
                undisplayLoading();
                e.preventDefault();
            }

            if(upload_file.size > 4294967296) {
                alert('업로드 가능한 파일의 크기는 최대 4GB입니다');
                undisplayLoading();
                e.preventDefault();
            }
        },
        progress: function(e) {
            $('.k-loading-text').text(e.percentComplete + '%');
        },
        success: function(e) {
            if(e.operation === 'upload') {
                alert(e.response.msg);
            }
        },
        error: function(e) {
            console.error(e);

            if(e.operation === 'upload') {
                alert('배경이미지 ' + e.files[0].name + ' 파일 업로드 중에 에러가 발생했습니다: ' + e.XMLHttpRequest.statusText);
            }
        },
        complete: function(e) {
            location.reload();
        }
    }).data('kendoUpload');
}
/*************************************************************************************************************/
/* by shkoh 20211229: File Upload End                                                                        */
/*************************************************************************************************************/

/*************************************************************************************************************/
/* by shkoh 20211229: inline function start                                                                  */
/*************************************************************************************************************/
function displayLoading() {
    kendo.ui.progress($(document.body), true);
}

function undisplayLoading() {
    kendo.ui.progress($(document.body), false);
}

function loadItems() {
    $.ajax({
        async: true,
        type: 'GET',
        cache: false,
        url: '/api/diagram/kepco/items?type=' + $('#map').attr('data')
    }).done(function(items) {
        // by shkoh 20220323: 각 아이템의 상세한 정보는 WEB Server 내에서 처리하도록 함        
        if(g_items) g_items.Redraw(items);
            
        if(g_heatmap_inst) {
            // by shkoh 20220407: 통신이 가능한 센서 정보만을 전달함
            g_heatmap_inst.SetData(items.filter(function(item) { return item.equip_level < 4 && item.level < 4 && item.type === 'tempdi' && item.obj_id.substring(0, 1) === 'S'; }));
        }
    }).fail(function(err) {
        console.error(err);
    });

    if(g_event_datasource) g_event_datasource.read();
}

/**
 * by shkoh 20211229
 * 
 * 다이어그램을 구성하는 아이템의 종류에 따라서 DB에서 가져올 데이터를 다양하게 구성할 필요가 있다.
 * type이 늘어남에 따라서 type마다 각각 고유의 데이터를 받아와야 함
 * 
 * @param {Object} item diagram의 기본 정보
 */
 function getDetailItemInfo(item) {
    return new Promise(function(resolve, reject) {
        if(item.type === 'default') {
            resolve(item);
            return;
        }
        
        $.ajax({
            async: true,
            type: 'GET',
            cache: false,
            url: '/api/diagram/itemdetail?id=' + item.obj_id + '&type=' + item.type
        }).done(function(detail) {
            resolve(Object.assign(item, detail));
        }).fail(function(err) {
            console.error(err);
            reject();
        });
    });
}

function getRepositioningItems() {
    const items = g_items.GetAllItems();
    let saved_nodes = [];
    
    items.forEach(function(node) {
        const render_position = node.renderedPosition();
        const x = parseFloat(render_position.x / $('#cytoscape').width());
        const y = parseFloat(render_position.y / $('#cytoscape').height());

        // by shkoh 20200925: node들 중 위치가 변경된 node들만 저장
        if(node.data('pos_x') !== x.toFixed(3) || node.data('pos_y') !== y.toFixed(3)) {
            saved_nodes.push({
                index: node.id(),
                pos_x: x.toFixed(3),
                pos_y: y.toFixed(3)
            });
        }
    });

    return saved_nodes;
}

function resaveItemPosition(repositioning_items) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            async: true,
            type: 'PATCH',
            url: '/api/diagram/itempositions',
            data: {
                new_pos: JSON.stringify(repositioning_items)
            }
        }).done(function(results) {
            g_items.RepositionNodes(repositioning_items);

            resolve();
        }).fail(function(err) {
            console.error(err);
            alert('아이템 위치 저장 실패');

            reject();
        });
    });
}

function itemPositionSave() {
    const items = g_items.GetAllItems();
    let saved_nodes = [];
    
    items.forEach(function(node) {
        const render_position = node.renderedPosition();
        const x = parseFloat(render_position.x / $('#cytoscape').width());
        const y = parseFloat(render_position.y / $('#cytoscape').height());

        // by shkoh 20200925: node들 중 위치가 변경된 node들만 저장
        if(node.data('pos_x') !== x.toFixed(3) || node.data('pos_y') !== y.toFixed(3)) {
            saved_nodes.push({
                index: node.id(),
                pos_x: x.toFixed(3),
                pos_y: y.toFixed(3)
            });
        }
    });

    if(saved_nodes.length === 0) {
        alert('위치가 변경된 항목이 존재하지 않습니다.\n위치를 저장할 항목이 없습니다');
    } else {
        $.ajax({
            async: true,
            type: 'PATCH',
            url: '/api/diagram/itempositions',
            data: {
                new_pos: JSON.stringify(saved_nodes)
            }
        }).done(function(results) {
            alert(results.msg);
            g_items.RepositionNodes(saved_nodes);

            if(g_heatmap_inst) loadItems();
        }).fail(function(err) {
            console.error(err);
            alert('항목들의 위치 저장에 실패했습니다');
        });
    }
}

function addBackgroundImage() {
    $('#file-upload').trigger('click');
}

function removeBackgroundImage() {
    $.ajax({
        async: true,
        type: 'DELETE',
        url: '/api/diagram/kepco/bkimage?type=' + $('#map').attr('data')
    }).done(function(xhr) {
        alert('배경이미지가 정상적으로 삭제됐습니다');
        location.reload();
    }).fail(function(err) {
        console.error(err);
        alert('배경이미지 삭제에 실패했습니다');
    });
}

function addItem() {
    $.ajax({
        async: true,
        type: 'POST',
        url: '/api/diagram/item',
        dataType: 'json',
        data: {
            group_id: '',
            equip_id: '',
            sensor_id: '',
            diagram: $('#map').attr('data').toUpperCase(),
            pos_x: parseFloat(0.5),
            pos_y: parseFloat(0.5),
            type: 'default'
        }
    }).done(function() {
        alert('새로운 아이템 추가 됐습니다');
        loadItems();
    }).fail(function(err) {
        console.error(err);
        alert('아이템 추가 실패');
    });
}

function duplicateItem(item) {
    const is_corfirm = confirm('선택한 아이템을 복제 하시겠습니까?');
    if(is_corfirm) {
        const type = item.data('obj_id') === null ? '' : item.data('obj_id').substring(0, 1);
        const id = item.data('obj_id') === null ? '' : item.data('obj_id').substring(2);

        $.ajax({
            async: true,
            type: 'POST',
            url: '/api/diagram/item',
            dataType: 'json',
            data: {
                group_id: type === 'G' ? id : '',
                equip_id: type === 'E' ? id : '',
                sensor_id: type === 'S' ? id : '',
                diagram: $('#map').attr('data').toUpperCase(),
                pos_x: parseFloat(item.data('pos_x')) + 0.04,
                pos_y: parseFloat(item.data('pos_y')),
                type: item.data('type')
            }
        }).done(function() {
            loadItems();
        }).fail(function(err) {
            console.error(err);
            alert('아이템 복제 실패');
        });
    }
}

function deleteItem(item) {
    const is_corfirm = confirm('아이템을 삭제하시겠습니까?');
    if(is_corfirm) {
        $.ajax({
            async: true,
            type: 'DELETE',
            url: '/api/diagram/item',
            data: {
                delete_id: item.id()
            }
        }).done(function() {
            alert('아이템이 삭제되었습니다');
        }).fail(function(err) {
            console.error(err);
            alert('아이템 삭제에 실패했습니다\n재확인 바랍니다');
        }).always(function() {
            loadItems();
        });
    }
}

function repositionItem(item) {
    if($.session.get('user-grade') === 'USR00') {
        // by shkoh 20220105: cytoscape의 element가 이동 이벤트 발생
        // by shkoh 20220105: 해당 기능은 관리자권한에서만 적용됨
        const repositioning_items = getRepositioningItems();
        if(repositioning_items.length > 0) {
            resaveItemPosition(repositioning_items).then(function() {
                loadItems();
            });
        }
    }
}

function setItem(item) {
    window.open('/kepco/diagram/popup?id=' + item.id(), 'DiagramItem_' + item.id(), 'scrollbars=1, menubar=no, resizable=no, location=no, titlebar=no, toolbar=no, status=no, width=1100, height=600');
}

function popupCamera(item) {
    if(item.target.data('obj_id').substring(0, 1) !== 'E') {
        alert('카메라를 실행시키기 위해서는 해당 아이콘이 CCTV 설비로 연계하여 설정하셔야 합니다');
        return;
    }
    
    const id = item.target.data('obj_id').substring(2);
    window.open('/popup/camera/' + id, 'CAMERA VIEWER - ' + id, 'scrollbars=1, menubar=no, resizable=no, location=no, titlebar=no, toolbar=no, status=no, width=800, height=600');
}

function popupEquipmentSetting(item) {
    const id = item.data('obj_id');
    window.top.g_setting_window_opener = window.open('/popup/set/' + id, 'fmsSettingWindow', 'scrollbars=1, menubar=no, resizable=no, location=no, titlebar=no, toolbar=no, status=no, width=800, height=600');
}

function moveMonitoring(item) {
    const obj_id = item.target.data('obj_id');
    if(obj_id.substring(0, 1) !== 'E') {
        alert('연계설비 상세정보를 보기 위해서는 설비로 선택하셔야 합니다');
        return;
    }

    if(parent.onVerifyAlarmEquipment) {
        parent.onVerifyAlarmEquipment(obj_id.substring(2));
    }
}

function ctrlLight(item, command) {
    const b_use_equip = item.data('available_equip') === 'Y';
    const b_use_sensor = item.data('bUse') === 'Y';
    if(!(b_use_equip && b_use_sensor)) {
        alert('조명설비 항목이 [사용안함]으로 설정되었습니다. 해당 설비의 설비설정과 임계치설정의 내용을 확인하세요');
        return;
    }

    const lvl = item.data('level');
    if(lvl > 3) {
        alert('[응답없음] 혹은 [통신불량] 설비는 제어 명령을 수행할 수 없습니다. 상태를 확인하세요');
        return;
    }

    const ctrl_info = item.data('ctrl_info');
    if(ctrl_info.length === 0) {
        alert('제어 명령이 설정되지 않았습니다. 항목의 사용자 정의를 확인하세요');
        return;
    }

    const ip = item.data('ip');
    const ipv4 = ip.split('.');
    if(ip.length === 0 || ipv4.length !== 4) {
        alert('제어설비의 IP가 정상적으로 설정되지 않았습니다');
        return;
    } else {
        let is_ipv4 = true;
        for(const ip of ipv4) {
            const i = parseInt(ip);
            if(i < 0 || i > 255) {
                is_ipv4 = false;
            }
        }

        if(!is_ipv4) {
            alert('제어설비의 IP가 정상적으로 설정되지 않았습니다');
            return;
        }
    }

    const port = parseInt(item.data('port'));
    if(port < 1 || port > 65535) {
        alert('제어설비의 PORT 번호가 정상범위 밖입니다');
        return;
    }

    const is_ctrl = confirm(item.data('equip_name') + '을 ' + command + '하시겠습니까?');
    if(is_ctrl) {
        $.ajax({
            async: true,
            type: 'POST',
            url: '/api/diagram/lightctrl',
            data: {
                cmd: command,
                equip_id: parseInt(item.data('equip_id')),
                sensor_id: parseInt(item.data('obj_id').substring(2))
            }
        }).done(function(result) {
            alert(result.msg);
            loadItems();
        }).fail(function(err) {
            console.error(err);
            alert('조명의 제어명령을 전달하는데 에러가 발생했습니다');
        });
    }
}
/*************************************************************************************************************/
/* by shkoh 20211229: inline function end                                                                    */
/*************************************************************************************************************/

/*************************************************************************************************************/
/* by shkoh 20220330: event list start                                                                       */
/*************************************************************************************************************/
function displayAccessGridLoading() {
    kendo.ui.progress($('.k-grid-content'), true);
}

function undisplayAccessGridLoading() {
    kendo.ui.progress($('.k-grid-content'), false);
}

function createEventList() {
    g_event_grid = $('#i-events').kendoGrid({
        pageable: false,
        resizable: false,
        selectable: 'row',
        sortable: false,
        groupable: false,
        navigatable: false,
        persistSelection: true,
        scrollable: true,
        noRecords: {
            template:
                '<div style="display:table;width:100%;height:100%;">' +
                    '<h3 style="margin:0px;display:table-cell;vertical-align:middle;">' +
                        '<span id="eventListLabel" class="label label-primary" style="font-size: 1.0rem; border-radius:4px;">' +
                        '</span>' +
                    '</h3>' +
                '</div>'
        },
        columns: [{
            field: 'occurDate',
            title: '발생시간',
            width: 95,
            headerAttributes: {
                class: 'event-header'
            },
            attributes: {
                class: 'event-content-occurdate event-#:data.logStatus#'
            }
        }, {
            field: 'door',
            title: '출입문',
            width: 160,
            headerAttributes: {
                class: 'event-header'
            },
            attributes: {
                class: 'event-content-door event-#:data.logStatus#'
            }
        }, {
            field: 'detail',
            title: '출입기록',
            headerAttributes: {
                class: 'event-header'
            },
            attributes: {
                class: 'event-content-detail event-#:data.logStatus#'
            },
            template: parseDetailTemplate
        }],
        change: function(e) {
            const selected = this.select();
            const { sensor_id } = e.sender.dataItem(selected);
            g_items.SelectItemBySensorId('S_' + sensor_id);
        }
    }).data('kendoGrid');
}

function createEventDataSource() {
    g_event_datasource = new kendo.data.DataSource({
        transport: {
            read: {
                cache: false,
                type: 'GET',
                dataType: 'json',
                contentType: 'application/json',
                url: '/api/diagram/kepco/accesssystem/eventlog'
            },
            parameterMap: function(data, type) {
                if(type === 'read') {
                    return kendo.stringify(data);
                }
            }
        },
        autoSync: true,
        batch: true,
        error: function(e) {
            const { xhr: { responseJSON }, status } = e;
            
            if(status === 'error') {
                console.info(responseJSON.name);
                
                if(responseJSON.name === 'ConnectionError') {
                    $('#eventListLabel').text('출입문 데이터베이스 연결 실패');
                } else if(responseJSON.name === 'RequestError') {
                    $('#eventListLabel').text('데이터 조회 실패');
                }
            }
        },
        requestStart: function(e) {
            $('#eventListLabel').text('데이터베이스 연결 중..');
            if(e.type === 'read') displayAccessGridLoading();
        },
        requestEnd: function(e) {
            if(e.type === 'read' && e.response.length === 0) {
                console.info(e);
            }
        },
        schema: {
            model: {
                id: 'id'
            },
            parse: function(response) {
                response.forEach(function(row) {
                    const { yyyyMMdd, HHmmss, name, sensor, status, logStatus } = row;
                    row.occurDate = parseDate(yyyyMMdd, HHmmss);
                    row.logStatus = Object.keys(g_event_alarm_list).includes(logStatus) ? 'warning' : logStatus === '0' ? 'approve' : 'normal';
                });

                return response;
            }
        }
    });

    g_event_grid.setDataSource(g_event_datasource);
}

function parseDate(yyyyMMdd, HHmmss) {
    return yyyyMMdd.substring(4, 6) + '/' + yyyyMMdd.substring(6, 8) + ' ' + HHmmss.substring(0, 2) + ':' + HHmmss.substring(2, 4) + ':' + HHmmss.substring(4, 6);
}

function parseDetailTemplate({ name, sensor, status }) {
    const target = name.length > 0 ? name : sensor;
    const html =
        '<strong style="font-size: 1.1em;">' + target + '</strong>' +
        '<br>' +
        '<span style="font-size: 0.84em">: ' + status + '</span>';
    
    return html;
    // return '' + target + ': ' + (status === '출입승인' ? '리더기 승인이 실패하였으나 출입을 승인하기로 결정' : status);
}
/*************************************************************************************************************/
/* by shkoh 20220330: event list end                                                                         */
/*************************************************************************************************************/