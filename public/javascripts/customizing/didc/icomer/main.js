/// <reference path="../../../../../typings/jquery/jquery.d.ts"/>
/// <reference path="../../../../../typings/kendo-ui/kendo.all.d.ts"/>
let g_icomer_mapping_data = {
    page_name: '',
    object_name: '',
    group_ids: '',
    equip_ids: '',
    sensor_ids: '',
    description: ''
}

let g_tree = undefined;
let g_clicked_span_element = undefined;

$(window).on('resize', function() {
    resizeWindow();
});

$(function() {
    resizeWindow();
    
    initTabPanel();
    initLinkerButton();
    initModal();

    // by shkoh 20210510: 첫번째 페이지를 우선 선택함
    const tabStrip = $('#tab-panel').data('kendoTabStrip');
    g_icomer_mapping_data.page_name = tabStrip.items().item(0).id;
    checkEquipSettings(tabStrip.contentElements[0]);
});

/***********************************************************************************************************************/
/* by shkoh 20210303: resize window start                                                                              */
/***********************************************************************************************************************/
function resizeWindow() {
    const mainViewer_height = parseFloat(parent['mainViewer'].innerHeight || parent['mainViewer'].clientHeight) - 48;
    $('.custom-tabstrip-panel').height(mainViewer_height);
}
/***********************************************************************************************************************/
/* by shkoh 20210303: resize window end                                                                                */
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* by shkoh 20210303: initialize UI & elements start                                                                   */
/***********************************************************************************************************************/
function initTabPanel() {
    $('#tab-panel').kendoTabStrip({
        tabPosition: 'bottom',
        animation: false,
        activate: function(e) {
            g_icomer_mapping_data.page_name = e.item.id;
            checkEquipSettings(e.contentElement);
        }
    });
}

function initLinkerButton() {
    // by shkoh 20210303: 페이지 오브젝트와 fms의 아이템 간의 설정
    $('.custom-link-set').on('click', function() {
        g_icomer_mapping_data.object_name = $(this).parents('li').attr('data');

        const _title = $(this).parents('.list-group').children('.custom-list-title').children('span').text();
        g_icomer_mapping_data.description = _title + (_title.length > 0 ? ' ' : '') + $(this).parent().parent().children('span.obj-name').text();

        g_clicked_span_element = $(this).parent().parent().children('span.obj-name');

        $('#modalDialogTree').modal({ keyboard: false, show: true });
    });

    // by shkoh 20210303: 페이지 오브젝트와 fms의 아이템 간의 설정해제
    $('.custom-link-clear').on('click', function() {
        g_icomer_mapping_data.object_name = $(this).parents('li').attr('data');

        const _title = $(this).parents('.list-group').children('.custom-list-title').children('span').text();
        g_icomer_mapping_data.description = _title + (_title.length > 0 ? ' ' : '') + $(this).parent().parent().children('span.obj-name').text();

        g_clicked_span_element = $(this).parent().parent().children('span.obj-name');

        applyItems(true);
    });

    $('.custom-link-popup').on('click', function() {
        g_icomer_mapping_data.object_name = $(this).parents('li').attr('data');

        g_clicked_span_element = $(this).parent().parent().children('span.is-popup');
        
        $('#modal-popup-setting').modal({ keyboard: false, show: true });
    });
}

function initModal() {
    $('#modalDialogTree').on('show.bs.modal', function() {
        $('#modalTreeTitle').text('ICOMER 연결설비 설정 - ' + g_icomer_mapping_data.description);

        g_tree = new Tree('#modal-tree', {
            onCheck: onCheckTreeNode,
            importItems: importItems,
            isSensor: true
        });

        g_tree.CreateTree();
    });

    $('#modalDialogTree').on('hide.bs.modal', function() {
        $('#modalTreeTitle').text('ICOMER 연결설비 설정');

        if(g_tree) {
            g_tree.DestroyTree();
            g_tree = undefined;
        }

        $('.filter-text').val('');
    });

    $('.modal-body.modal-tree-body').mCustomScrollbar({
        theme: 'minimal-dark',
        axis: 'yx',
        scrollbarPosition: 'outside',
        mouseWheel: {
            preventDefault: true
        }
    });

    $('#btn-modal-tree-link').on('click', function() {
        applyItems(false);
    });

    $('#modal-popup-setting').on('show.bs.modal', function() {
        g_tree = new Tree('#modal-tree-popup', {
            isSensor: false,
            importItems: importPopupItem
        });

        g_tree.CreateTree();
    });

    $('#modal-popup-setting').on('hide.bs.modal', function() {
        g_tree.DestroyTree();
        g_tree = undefined;
    });

    // by shkoh 20210304: popup 설정
    $('#btn-modal-popup-set').on('click', function() {
        popupSet();
    });

    // by shkoh 20210304: popup 해제
    $('#btn-modal-popup-clear').on('click', function() {
        popupClear();
    });

    $('.filter-text').on('input propertychange', function() {
        const text = $(this).val();
        
        if(g_tree) {
            g_tree.FilterTree(text);
        }
    });
}
/***********************************************************************************************************************/
/* by shkoh 20210303: initialize UI & elements end                                                                     */
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* by shkoh 20210303: internal function start                                                                          */
/***********************************************************************************************************************/
function onCheckTreeNode(event, treeId, treeNode) {
    const checked_count = g_tree.GetCheckedNodes().length;

    $('#modalTreeTitle').text('ICOMER 연결설비 설정 - ' + g_icomer_mapping_data.description + ': 항목 ' + checked_count + '개 선택됨');
}

function importItems() {
    $.ajax({
        async: true,
        type: 'GET',
        dataType: 'json',
        cache: false,
        url: '/api/wrfis/icomer/mapper?pagename=' + g_icomer_mapping_data.page_name + '&objectname=' + g_icomer_mapping_data.object_name
    }).done(function(data) {
        if(data.length === 0) return;

        data.forEach(function(datum) {
            const groups = datum.group_ids === null ? [] : datum.group_ids.split(',');
            const equips = datum.equip_ids === null ? [] : datum.equip_ids.split(',');
            const sensors = datum.sensor_ids === null ? [] : datum.sensor_ids.split(',');

            groups.forEach(function(g) {
                g_tree.SetCheckNode('G_' + g, true, false);
                g_tree.ExpandNode('G_' + g);
            });

            equips.forEach(function(e) {
                g_tree.SetCheckNode('E_' + e, true, false);
                g_tree.ExpandNode('E_' + e);
            });

            sensors.forEach(function(s) {
                g_tree.SetCheckNode('S_' + s, true, false);
                g_tree.ExpandNode('S_' + s);
            });
        });
    }).fail(function(err) {
        console.error(err);
    });
}

function importPopupItem() {
    $.ajax({
        async: true,
        type: 'GET',
        dataType: 'json',
        cache: false,
        url: '/api/wrfis/icomer/mapper?pagename=' + g_icomer_mapping_data.page_name + '&objectname=' + g_icomer_mapping_data.object_name
    }).done(function(data) {
        if(data.length === 0) return;

        data.forEach(function(datum) {
            if(datum.popup_equip_id === null) return;

            g_tree.SetCheckNode('E_' + datum.popup_equip_id);
            g_tree.ExpandNode('E_' + datum.popup_equip_id);
        });
    }).fail(function(err) {
        console.error(err);
    });
}

function checkEquipSettings(ele) {
    $.ajax({
        async: true,
        type: 'GET',
        dataType: 'json',
        cache: false,
        url: '/api/wrfis/icomer/mapper?pagename=' + g_icomer_mapping_data.page_name
    }).done(function(data) {
        data.forEach(function(data) {
            if(data.group_ids !== null || data.equip_ids !== null || data.sensor_ids !== null) {
                $('#' + ele.id + ' li[data="' + data.object_name + '"]').children('span.obj-name').addClass('custom-span');
            }

            if(data.popup_equip_id !== null) {
                $('#' + ele.id + ' li[data="' + data.object_name + '"]').children('span.is-popup').addClass('custom-popup');
            }
        });
    }).fail(function(err) {
        console.error(err);
    });
}

function applyItems(clear) {
    // by shkoh 20210315: clear가 추가로 등록절차가 이루어지나, 실제 체크된 항목이 존재하지 않는 경우에는 자동으로 clear 상태로 진행
    if(g_tree) {
        clear = (clear === false && g_tree.GetCheckedNodes().length === 0) ? true : clear;
    }

    getCheckedTreeNode(clear);

    $.ajax({
        async: true,
        type: 'POST',
        dataType: 'json',
        url: '/api/wrfis/icomer/item',
        data: g_icomer_mapping_data
    }).done(function() {
        alert('설비연결 정보 저장성공');
        $('#modalDialogTree').modal('hide');

        if(clear) g_clicked_span_element.removeClass('custom-span');
        else g_clicked_span_element.addClass('custom-span');
    }).fail(function(err) {
        alert('설비연결 정보 실패');
        console.error(err);
    });
}

function getCheckedTreeNode(clear) {
    const checked_node = (clear === true ? [] : g_tree.GetCheckedNodes());

    const g_ids = [];
    const e_ids = [];
    const s_ids = [];

    checked_node.forEach(function(node) {
        const id_type = node.id.substr(0, 1);
        const id = node.id.substr(2);

        switch(id_type) {
            case 'G': g_ids.push(id); break;
            case 'E': e_ids.push(id); break;
            case 'S': s_ids.push(id); break;
        }
    });

    g_icomer_mapping_data.group_ids = g_ids.toString();
    g_icomer_mapping_data.equip_ids = e_ids.toString();
    g_icomer_mapping_data.sensor_ids = s_ids.toString();
    
    if(clear) g_icomer_mapping_data.description = '';
}

function popupSet() {
    const checked_node = g_tree.GetCheckedNodes();

    if(checked_node.length !== 1) {
        alert('1개의 설비만 선택 가능합니다');
        return;
    }

    const id_type = checked_node[0].id.substr(0, 1);
    if(id_type !== 'E') {
        alert('설비만 선택 가능합니다');
        return;
    }

    const id = Number(checked_node[0].id.substr(2));

    $.ajax({
        async: true,
        type: 'POST',
        dataType: 'json',
        url: '/api/wrfis/icomer/itempopup',
        data: {
            page_name: g_icomer_mapping_data.page_name,
            object_name: g_icomer_mapping_data.object_name,
            popup_equip_id: id
        }
    }).done(function() {
        alert('팝업설정 완료');
        $('#modal-popup-setting').modal('hide');

        g_clicked_span_element.addClass('custom-popup');
    });
}

function popupClear() {
    $.ajax({
        async: true,
        type: 'POST',
        dataType: 'json',
        url: '/api/wrfis/icomer/itempopup',
        data: {
            page_name: g_icomer_mapping_data.page_name,
            object_name: g_icomer_mapping_data.object_name,
            popup_equip_id: ''
        }
    }).done(function() {
        alert('팝업해제 완료');
        $('#modal-popup-setting').modal('hide');

        g_clicked_span_element.removeClass('custom-popup');
    });
}
/***********************************************************************************************************************/
/* by shkoh 20210303: internal function end                                                                            */
/***********************************************************************************************************************/