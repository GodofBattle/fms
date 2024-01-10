let g_uploader_inst = undefined;
let g_tree_inst = undefined;
let g_items_inst = undefined;
let g_heatmap_inst = undefined;

const g_heatmap_data = {
    min: 10,
    max: 24,
    normal: 18
}

$(window).on('resize', function() {
    resizeWindow();
});

$(function() {    
    initCytoscape();
    initFileUpload();

    loadItems();

    // by shkoh 20200923: 배경 및 아이템 등록/수정/삭제/위치지정/위치저장 버튼들의 기능 정의
    $('#btn-icon-bk-remove').on('click', removeBackgroundImageFile);
    $('#btn-icon-insert').on('click', itemInsert);
    $('#btn-icon-delete').on('click', itemDelete);
    $('#btn-icon-modify').on('click', itemModify);
    $('#btn-icon-save').on('click', itemPositionSave);
    $('#btn-icon-align-left').on('click', itemAlign);
    $('#btn-icon-align-right').on('click', itemAlign);
    $('#btn-icon-align-top').on('click', itemAlign);
    $('#btn-icon-align-bottom').on('click', itemAlign);
    $('#btn-icon-align-horizontal').on('click', itemAlign);
    $('#btn-icon-align-vertical').on('click', itemAlign);

    // by shkoh 20200923: 아이템 등록/수정 modal 창의 기능 정의
    $('#find-equip').on('click', showTree);
    $('#btn-modal-footer-confirm').on('click', itemApply);
    
    $('#modalDialogIcon').on('hide.bs.modal', itemReinitialize);
    
    // by shkoh 20200924: 연결설비 트리 modal 창의 기능 정의
    $('#btn-modal-tree-link').on('click', treeLink);

    $('#modalDialogTree').on('show.bs.modal', createTree);
    $('#modalDialogTree').on('hide.bs.modal', destroyTree);

    $('#modalDialogTree .modal-dialog .modal-content .modal-body').mCustomScrollbar({
        theme: 'minimal-dark',
        axis: 'yx',
        scrollbarPosition: 'outside',
        mouseWheel: {
            preventDefault: true
        }
    });

    // by shkoh 20210222: diagram의 type에 따라서 특정 동작들을 정의
    switch($('#map').attr('data')) {
        case 'PMS04':
        case 'PMS07': {
            definePMSEvent();
            break;
        }
        case 'BMS01':
        case 'BMS02': {
            defineBMSEvent();
            break;
        }
        case 'CFD08': {
            initHeatmap();
            break;
        }
    }
});

function resizeWindow() {
    if(g_items_inst) g_items_inst.Resize();
    if(g_heatmap_inst) g_heatmap_inst.Resize();
}

/******************************************************************************************************/
/* by shkoh 20200923: controll button event start                                                     */
/******************************************************************************************************/
function removeBackgroundImageFile() {
    if($('#img').length === 0) {
        alert('등록된 배경이미지가 존재하지 않습니다');
        return;
    }

    $.ajax({
        async: true,
        type: 'DELETE',
        url: '/api/diagram/wrfis/bkimage?type=' + $('#map').attr('data')
    }).done(function(xhr) {
        alert('배경이미지가 정상적으로 삭제됐습니다');
        location.reload();
    }).fail(function(err) {
        console.log(err);
        alert('배경이미지 삭제에 실패했습니다');
    });
}

function itemInsert() {
    $('#modal-dialog-icon-title').text('아이템 등록');
    $('#btn-modal-footer-confirm').text('등록');

    $('#modalDialogIcon').modal({ keyboard: false, show: true });
}

function itemDelete() {
    const item = g_items_inst.GetSelectedItem();
    if(item.length === 0) {
        alert('삭제하려는 항목을 선택하세요');
        return;
    } else if(item.length > 1) {
        alert('복수의 항목을 삭제할 수 없습니다\n한 개의 항목만 선택해주세요');
        return;
    }

    const item_name = item.data('type') === 'door' ? '출입문 아이콘' : item.data('name');
    const result = confirm(item_name + ' 항목을 삭제하시겠습니까?');
    if(result) {
        deleteItem(item).then(function(is_result) {
            if(is_result) loadItems();
        })
    }
}

function itemModify() {
    const item = g_items_inst.GetSelectedItem();
    if(item.length === 0) {
        alert('수정하려는 항목을 선택하세요');
        return;
    } else if(item.length > 1) {
        alert('복수의 항목을 수정할 수 없습니다\n한 개의 항목만 선택해주세요');
        return;
    }

    // by shkoh 20200925: 수정에 필요한 항목을 modal 창 내에 적용
    $('#selected-item').attr('value', item.data('obj_id'));
    $('#selected-item').text(item.data('name'));
    $('#dropdownType').val(item.data('type'));
    $('#modal-dialog-icon-title').text('아이콘 수정');
    $('#btn-modal-footer-confirm').text('수정');

    $('#modalDialogIcon').modal({ keyboard: false, show: true });
}

function itemPositionSave() {
    const items = g_items_inst.GetAllItems();
    let saved_nodes = [];
    
    items.forEach(function(node) {
        const render_position = node.renderedPosition();
        const x = parseFloat(render_position.x / $(window).width());
        const y = parseFloat(render_position.y / $(window).height());

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
            g_items_inst.RepositionNodes(saved_nodes);

            if(g_heatmap_inst) loadItems();
        }).fail(function(err) {
            console.error(err);
            alert('항목들의 위치 저장에 실패했습니다');
        });
    }
}

function itemAlign() {
    const selected_items = g_items_inst.GetSelectedItem();
    if(selected_items.length < 2) {
        alert('정렬를 위해서는 2개 이상의 항목을 선택해야 합니다');
        return;
    }
    
    const direction = $(this).attr('data');
    g_items_inst.Align(direction);
}
/******************************************************************************************************/
/* by shkoh 20200923: controll button event end                                                       */
/******************************************************************************************************/

/******************************************************************************************************/
/* by shkoh 20200923: modal dialog event start                                                        */
/******************************************************************************************************/
function showTree() {
    $('#modalDialogTree').modal({ keyboard: false, show: true });
}

function itemReinitialize() {
    // by shkoh 20200923: 아이콘 설정 창이 닫힐 때, 앞서 선택된 설비 혹은 값들이 존재할 경우, 해당 내용들을 초기화 시켜줌
    $('#selected-item').removeAttr('value');
    $('#selected-item').text('');
    
    // by shkoh 20210223: 같은 Mapping 파일이지만 diagram마다 사용될 기본값이 달라짐으로 해당 내용을 적용
    let init_dropdown_type = 'default';
    switch($('#map').attr('data')) {
        case 'PMS04':
        case 'PMS07': {
            init_dropdown_type = 'wrfispms';
            break;
        }
        case 'BMS01':
        case 'BMS02': {
            init_dropdown_type = 'wrfisbms1';
            break;
        }
        case 'CFD08': {
            init_dropdown_type = 'wrfistemp';
            break;
        }
    }
    $('#dropdownType').val(init_dropdown_type);
}

function itemApply() {
    const apply_id = $('#selected-item').attr('value');
    const apply_type = $('#btn-modal-footer-confirm').text();

    let apply_icon_type = $('#dropdownType').val();

    if(apply_icon_type !== 'door' && apply_id === undefined) {
        alert('아이콘과 연결할 설비(혹은 센서)가 선택되어야 합니다');
        return;
    }

    if(apply_type.includes('등록')) {
        addItem().then(function(is_result) {
            if(is_result) loadItems();
        });
    } else if(apply_type.includes('수정')) {
        let result = true;
        
        if(apply_icon_type === 'door' && apply_id !== undefined) {
            result = confirm('출입문 아이콘을 선택할 경우 현재 연결되어 있는 설비(혹은 센서)가 해제됩니다. 계속 진행하시겠습니까?');
        }

        if(result) {
            modifyItem().then(function(is_result) {
                if(is_result) loadItems();
            })
        }
    }

    $('#modalDialogIcon').modal('hide');
}

function createTree() {
    const selected_id = $('#selected-item').attr('value');

    g_tree_inst = new Tree('#modal-tree', {
        treeNodeId: selected_id
    });

    g_tree_inst.CreateTree();
}

function destroyTree() {
    if(g_tree_inst) {
        g_tree_inst.DestroyTree();
        g_tree_inst = undefined;
    }
}

function treeLink() {
    const selected_tree_node = g_tree_inst.GetCurrentTreeNode();

    if(selected_tree_node) {
        let prefix = '';

        switch(selected_tree_node.type) {
            case 'group': prefix = '[그룹] '; break;
            case 'equipment': prefix = '[설비] '; break;
            case 'sensor': prefix = '[수집항목] '; break;
        }

        $('#selected-item').attr('value', selected_tree_node.id);
        $('#selected-item').text(prefix + selected_tree_node.name);
    }

    $('#modalDialogTree').modal('hide');
}
/******************************************************************************************************/
/* by shkoh 20200923: modal dialog event end                                                          */
/******************************************************************************************************/

/******************************************************************************************************/
/* by shkoh 20200923: cytoscape start                                                                 */
/******************************************************************************************************/
function initCytoscape() {
    g_items_inst = new Items('cytoscape', {
        hvacCtrl: hvacCtrl,
        onDblclickWrfisPms: dblclickWrfisPms,
        onDblclickWrfisBms1: dblclickWrfisBms1,
        isQtip: $('#map').attr('data') === 'CFD08' ? true : false
    });
    g_items_inst.Create();
}
/******************************************************************************************************/
/* by shkoh 20200923: cytoscape end                                                                   */
/******************************************************************************************************/

/******************************************************************************************************/
/* by shkoh 20210511: heat map start                                                                  */
/******************************************************************************************************/
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
/******************************************************************************************************/
/* by shkoh 20210511: heat map end                                                                    */
/******************************************************************************************************/

/******************************************************************************************************/
/* by shkoh 20200923: kendoui upload code start                                                       */
/******************************************************************************************************/
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
            saveUrl: '/api/diagram/wrfis/upload?type=' + $('#map').attr('data'),
            saveField: 'wrfis'
        },
        autoUpload: true,
        select: function(e) {
            displayLoading();

            const upload_file = e.files[0];
            if(!upload_file.rawFile.type.includes('image')) {
                alert(upload_file.name + '파일은 이미지 파일이 아닙니다\n이미지 파일만 추가 가능합니다');
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
/******************************************************************************************************/
/* by shkoh 20200923: kendoui upload code end                                                         */
/******************************************************************************************************/

/******************************************************************************************************/
/* by shkoh 20200923: inline function start                                                           */
/******************************************************************************************************/
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
        url: '/api/diagram/wrfis/item?type=' + $('#map').attr('data')
    }).done(function(items) {
        const adding_items = [];
        items.forEach(function(item) {
            adding_items.push(getDetailItemInfo(item));
        });

        Promise.all(adding_items).then(function(new_items) {
            if(g_items_inst) g_items_inst.Redraw(new_items);
            if(g_heatmap_inst) g_heatmap_inst.SetData(new_items);
        });
    }).fail(function(err) {
        console.error(err);
    });
}

/**
 * by shkoh 20200925
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

function addItem() {
    return new Promise(function(resolve, reject) {
        const id = $('#selected-item').attr('value');

        const group_id = (id === undefined ? null : (id.includes('G') ? id.substr(2) : null));
        const equip_id = (id === undefined ? null : (id.includes('E') ? id.substr(2) : null));
        const sensor_id = (id === undefined ? null : (id.includes('S') ? id.substr(2) : null));

        const data = {
            group_id: group_id,
            equip_id: equip_id,
            sensor_id: sensor_id,
            diagram: $('#map').attr('data').toUpperCase(),
            pos_x: parseFloat(0.5),
            pos_y: parseFloat(0.5),
            type: $('#dropdownType').val()
        }

        $.ajax({
            async: true,
            type: 'POST',
            url: '/api/diagram/item',
            dataType: 'json',
            data: data
        }).done(function() {
            resolve(true);
        }).fail(function(err) {
            console.error(err);
            resolve(false);
        });
    });
}

function modifyItem() {
    return new Promise(function(resolve, reject) {
        const item = g_items_inst.GetSelectedItem();
        if(item.length === 0) return;

        const obj_id = $('#selected-item').attr('value');
        const type = $('#dropdownType').val();
        
        const update_data = {
            id: item.id(),
            group_id: type === 'door' ? null : (obj_id.includes('G') ? obj_id.substr(2) : null),
            equip_id: type === 'door' ? null : (obj_id.includes('E') ? obj_id.substr(2) : null),
            sensor_id: type === 'door' ? null : (obj_id.includes('S') ? obj_id.substr(2) : null),
            pos_x: parseFloat(item.position().x / $(window).width()),
            pos_y: parseFloat(item.position().y / $(window).height()),
            type: type
        };

        $.ajax({
            async: true,
            type: 'PATCH',
            url: '/api/diagram/item',
            data: update_data
        }).done(function() {
            resolve(true);
        }).fail(function(err) {
            console.error(err);
            alert('항목 수정에 실패했습니다\n재확인 바랍니다');
            resolve(false);
        });
    });
}

function deleteItem(item) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            async: true,
            type: 'DELETE',
            url: '/api/diagram/item',
            data: {
                delete_id: item.id()
            }
        }).done(function() {
            resolve(true);
        }).fail(function(err) {
            console.error(err);
            const item_name = item.data('type') === 'door' ? '출입문 아이콘' : item.data('name');
            alert(item_name + ' 항목 삭제에 실패했습니다\n재확인 바랍니다');
            resolve(false);
        });
    });
}

function hvacCtrl(mode, ele) {
    const run_text = mode === 'start' ? '가동' : '정지';
    
    if(ele.data('ctrlId') === undefined || !ele.data('obj_id').includes('E')) {
        alert('항온항습기 설비의 제어ID가 없거나, 제어 가능한 항온항습기 설비로 설정이 되지 않았습니다\n설비 등록 및 설정 관련 부분을 확인하시기 바랍니다');
        return;
    }

    if(ele.data('bUse') === 'N' ) {
        alert('사용 중인 설비가 아닙니다\n' + run_text + ' 명령을 수행할 수 없습니다' );
        return;
    } else if(ele.data('level') > 3) {
        alert('응답없음 혹은 통신불량 설비는 ' + run_text + ' 명령을 수행할 수 없습니다');
        return;
    }    
    
    const isCtrl = confirm('항온항습기 ' + ele.data('name') + '를 ' + run_text + '하시겠습니까?');
    if(isCtrl) {
        $.ajax({
            async: true,
            type: 'POST',
            url: '/api/diagram/ctrl',
            data: {
                mode: mode,
                equip_id: ele.data('obj_id').substr(2),
                sensor_id: ele.data('ctrlId')
            }
        }).done(function(result) {
            alert(result.msg);
        }).fail(function(err) {
            console.error(err);
            alert('제어명령을 전달하는데 에러가 발생했습니다');
        });
    }
}
/******************************************************************************************************/
/* by shkoh 20200923: inline function end                                                             */
/******************************************************************************************************/

/******************************************************************************************************/
/* by shkoh 20210222: custom pms function start                                                       */
/******************************************************************************************************/
function definePMSEvent() {
    $('#pms-navi').on('click', function() {
        if(parent) parent.onSelectViewer('wrfis', '메인', '');
    });
}

function dblclickWrfisPms(e) {
    let id = this.data('obj_id').substr(0, 1) == 'E' ? this.data('obj_id').substr(2) : undefined;
    if(id == undefined) return;

    window.open('/wrfis/pms/popup?id=' + id + '&name=' + this.data('name'), this.data('name'), 'scrollbars=1, menubar=no, resizable=no, location=no, titlebar=no, toolbar=no, status=no');
}
/******************************************************************************************************/
/* by shkoh 20210222: custom pms function end                                                         */
/******************************************************************************************************/

/******************************************************************************************************/
/* by shkoh 20210224: custom bms function start                                                       */
/******************************************************************************************************/
function defineBMSEvent() {
    $('#bms-navi').on('click', function() {
        if(parent) parent.onSelectViewer('wrfis', '메인', '');
    });
}

function dblclickWrfisBms1(e) {
    let id = this.data('obj_id').substr(0, 1) == 'E' ? this.data('obj_id').substr(2) : undefined;
    if(id == undefined) return;

    window.open('/wrfis/bms/popup?id=' + id + '&name=' + this.data('name'), this.data('name'), 'scrollbars=1, menubar=no, resizable=no, location=no, titlebar=no, toolbar=no, status=no');
}
/******************************************************************************************************/
/* by shkoh 20210224: custom bms function end                                                         */
/******************************************************************************************************/

/******************************************************************************************************/
/* by shkoh 20210510: custom cfd function start                                                       */
/******************************************************************************************************/

/******************************************************************************************************/
/* by shkoh 20210510: custom cfd function end                                                         */
/******************************************************************************************************/