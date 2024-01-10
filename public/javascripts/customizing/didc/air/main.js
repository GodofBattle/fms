let g_items = undefined;
let g_uploader_inst = undefined;
let g_type = undefined;

$(window).on('resize', windowResize);

$(function() {
    if($.session.get('user-grade') === 'USR00') {
        initFloatingActionButton();
        initFileUpload();
    }

    initCytoscape();

    loadItems();

    g_type = $('#map').attr('data');
});

function windowResize() {
    if(g_items) {
        g_items.Resize();
    }
}

/*************************************************************************************************************/
/* by shkoh 20230802: Cytoscape Start                                                                        */
/*************************************************************************************************************/
function initCytoscape() {
    g_items = new Items('cytoscape', {
        isIcomer: $.session.get('user-grade') === 'USR00',
        onSet: setItem,
        onDuplicate: duplicateItem,
        onDelete: deleteItem,
        onTouchEnd: repositionItem,
        onEquipmentSetting: popupEquipmentSetting,
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

function setItem(item) {
    const size = {
        w: 1200,
        h: 650
    };

    const pos = {
        left: (window.screenLeft + (window.innerWidth / 2)) - (size.w / 2),
        top: (window.screenTop + (window.innerHeight / 2)) - (size.h / 2)
    };

    if(item) {
        window.open('/didc/airDiagram/popup?id=' + item.id(), 'DiagramItem_' + item.id(), 'scrollbars=1, menubar=no, resizable=yes, location=no, titlebar=no, toolbar=no, status=no, top=' + pos.top + ', left=' + pos.left + ', width=' + size.w + ', height=' + size.h);
    }
}

function duplicateItem(item) {
    const is_corfirm = confirm('선택한 아이템을 복제 하시겠습니까?');
    if(is_corfirm) {
        const obj_id = item.data('obj_id');
        const type = obj_id && typeof obj_id === 'string' ? item.data('obj_id').substring(0, 1) : '';
        const id = obj_id && typeof obj_id === 'string' ? item.data('obj_id').substring(2) : '';

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
                name: item.data('name'),
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
        // by shkoh 20230807: cytoscape의 element가 이동 이벤트 발생
        // by shkoh 20230807: 해당 기능은 관리자권한에서만 적용됨
        const repositioning_items = getRepositioningItems();
        if(repositioning_items.length > 0) {
            resaveItemPosition(repositioning_items).then(function() {
                loadItems();
            });
        }
    }
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

function getRepositioningItems() {
    const items = g_items.GetAllNodes();
    let saved_nodes = [];
    
    items.forEach(function(node) {
        const render_position = node.renderedPosition();
        const x = parseFloat(render_position.x / $('#cytoscape').width());
        const y = parseFloat(render_position.y / $('#cytoscape').height());

        // by shkoh 20200925: node들 중 위치가 변경된 node들만 저장
        if(node.data('pos_x') !== x.toFixed(3) || node.data('pos_y') !== y.toFixed(3)) {
            saved_nodes.push({
                index: node.data('id'),
                pos_x: x.toFixed(3),
                pos_y: y.toFixed(3)
            });
        }
    });

    return saved_nodes;
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
/*************************************************************************************************************/
/* by shkoh 20230802: Cytoscape End                                                                          */
/*************************************************************************************************************/

/*************************************************************************************************************/
/* by shkoh 20230508: Floating Action Button Start                                                           */
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

    $('.k-fab-item.i-fab-set-edge').on('click', function(e) {
        itemPositionSave(false);        
    })
}
/*************************************************************************************************************/
/* by shkoh 20230508: Floating Action Button End                                                             */
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
            saveUrl: '/api/diagram/didc/upload?type=' + $('#map').attr('data'),
            saveField: 'didc'
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
/* by shkoh 20230802: inline function Start                                                                  */
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
        url: '/api/diagram/didc/items?type=' + $('#map').attr('data')
    }).done(function(items) {
        // by shkoh 20220323: 각 아이템의 상세한 정보는 WEB Server 내에서 처리하도록 함        
        if(g_items) g_items.Redraw(items);
    }).fail(function(err) {
        console.error(err);
    });
}

function addBackgroundImage() {
    $('#file-upload').trigger('click');
}

function removeBackgroundImage() {
    $.ajax({
        async: true,
        type: 'DELETE',
        url: '/api/diagram/didc/bkimage?type=' + $('#map').attr('data')
    }).done(function() {
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

function itemPositionSave(is_alert = true) {
    const items = g_items.GetAllNodes();
    let saved_nodes = [];
    
    items.forEach(function(node) {
        const render_position = node.renderedPosition();
        const x = parseFloat(render_position.x / $('#cytoscape').width());
        const y = parseFloat(render_position.y / $('#cytoscape').height());

        // by shkoh 20200925: node들 중 위치가 변경된 node들만 저장
        if(node.data('pos_x') !== x.toFixed(3) || node.data('pos_y') !== y.toFixed(3)) {
            saved_nodes.push({
                index: node.data('id'),
                pos_x: x.toFixed(3),
                pos_y: y.toFixed(3)
            });
        }
    });

    if(saved_nodes.length === 0) {
        if(is_alert) alert('위치가 변경된 항목이 존재하지 않습니다.\n위치를 저장할 항목이 없습니다');
    } else {
        $.ajax({
            async: true,
            type: 'PATCH',
            url: '/api/diagram/itempositions',
            data: {
                new_pos: JSON.stringify(saved_nodes)
            }
        }).done(function(results) {
            if(is_alert) alert(results.msg);
            g_items.RepositionNodes(saved_nodes);
        }).fail(function(err) {
            console.error(err);
            alert('항목들의 위치 저장에 실패했습니다');
        });
    }
}
/*************************************************************************************************************/
/* by shkoh 20230802: inline function End                                                                    */
/*************************************************************************************************************/