// by shkoh 20180806: TreeView Controller
let g_treeViewController = undefined;

// by shkoh 20180813: Group Setting Controller
let g_groupContentController = undefined;
// by shkoh 20180822: Equipment Setting Controller
let g_equipmentContentController = undefined;
// by shkoh 20190527: TreeContextMenu Controller
let g_treeContextMenuController = undefined;

let g_copy_id = undefined;

$(window).resize(function() {
    contentViewerResizing();
});

$(function() {
    const id = location.pathname.split('/').pop();

    g_treeViewController = new TreeViewContent('#treeViewer', {
        onClick: onTreeViewClick,
        onRightClick: onTreeViewRightClick
    });
    g_treeViewController.CreateTreeView(id);

    showViewer(id);

     // by shkoh 20190527: 그룹/설비 항목에 반복되는 내용들을 쉽게 입력할 수 있도록 내용 추가
     initTreeContextMenu();

    $('#saveSetting').on('click', function() {
        if(g_treeViewController == undefined) return;
        
        const node = g_treeViewController.GetSelectedTreeNode();
        if(node == undefined) {
            alert('저장을 위한 정보가 불분명합니다. 다시 시도해주세요.');
            return;
        }

        const type_name = node.id.substr(0, 1) == 'G' ? '그룹' : '설비';
        const isSave = confirm('[' + type_name + '] ' + node.name + ' 정보를 저장하시겠습니까?');
        if(isSave) {
            const node_id = node.id.substr(2);
            
            if(node.id.substr(0, 1) == 'G') saveGroupInfo(node_id);
            else {
                saveEquipmentInfo(node_id);
            }
        }
    });

    // by shkoh 20190208: Tree가 완전히 생성된 후에 mCustomScrollbar를 생성함
    $('#treeContent').mCustomScrollbar({
        theme: 'minimal-dark',
        axis: 'yx',
        scrollbarPosition: 'outside',
        callbacks: {
            onScrollStart: function() {},
            onScroll: function() {}
        }
    });

    // by shkoh 20180822: 그룹/설비 설정 View에서 사용될 스크롤바 생성
    $('#panelContent').mCustomScrollbar({
        theme: 'minimal-dark',
        axis: 'y',
        scrollbarPosition: 'outside'
    });
});

function contentViewerResizing() {
    const panel_h = parseFloat($('.panel').height());
    const panel_heading_h = parseFloat($('.panel-heading').height());
    const panel_heading_padding_top = parseFloat($('.panel-heading').css('padding-top'));
    const panel_heading_padding_bottom = parseFloat($('.panel-heading').css('padding-bottom'));
    const panel_body_padding_top = parseFloat($('.panel-body').css('padding-top'));
    const panel_body_padding_bottom = parseFloat($('.panel-body').css('padding-bottom'));

    $('#treeContent').height(panel_h - panel_heading_h - panel_heading_padding_top - panel_heading_padding_bottom - panel_body_padding_top - panel_body_padding_bottom);
    $('#panelContent').height(panel_h - panel_heading_h - panel_heading_padding_top - panel_heading_padding_bottom - panel_body_padding_top - panel_body_padding_bottom);
}

function showViewer(id) {
    if(id.substr(0, 1) == 'G') {
        g_groupContentController = new GroupContent('#viewer');
        g_groupContentController.CreateGroupContent(id.substr(2));
    } else {
        g_equipmentContentController = new EquipmentContent('#viewer');
        g_equipmentContentController.CreateEquipmentContent(id.substr(2));
    }

    // by shkoh 20211220: 설비팝업에서 자산표시 여부를 판단
    if($('body').attr('data-asset') === '1') {
        if(id.substr(0, 1) === 'G') window.resizeTo(800, 700);
        else if(id.substr(0, 1) === 'E') window.resizeTo(1200, 700);
    } else {
        window.resizeTo(800, 700);
    }

    contentViewerResizing();
}

function onTreeViewClick(event, treeId, treeNode, clickFlag) {
    if(treeNode == null) return;
    showViewer(treeNode.id);
}

function onTreeViewRightClick(event, treeId, treeNode) {
    if(treeNode == null) return;

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
    }

    g_treeContextMenuController.ShowContextMenu(param);
}

function saveGroupInfo(group_id) {
    const group_name = $('#groupName').val();
    const group_parent_id = $('#userSelectButtonForParentGroup').attr('data');
    const group_parent_depth = parseInt($('#userSelectButtonForParentGroup').attr('data_depth'));
    
    // by shkoh 20181016: 부모노드의 depth(zTree에서는 level)에서 1을 더하여 저장할 그룹의 depth 정보를 확인
    const group_depth = group_parent_depth + 1;
    
    if(group_name == '') {
        alert('[그룹명*]은 필수항목입니다');
        $('#groupName').focus();
        return;
    }

    if(group_parent_id == undefined) {
        alert('[상위그룹*]은 필수항목입니다');
        $('#userSelectButtonForParentGroup').focus();
        return;
    }

    // by shkoh 20181016: 하위그룹의 Depth를 조정하기 위해서 하위그룹들의 조정된 depth값을 가진 배열을 생성함
    let children = [];
    getChildrenGroupDepth(children, group_id, group_depth);

    const group_info = {
        group_id: group_id,
        p_group_id: group_parent_id,
        group_name: group_name,
        description: $('#groupDescription').val(),
        imageName: g_groupContentController.GetGroupImageName(),
        depth: group_depth
    }

    $.ajax({
        async: true,
        type: 'PATCH',
        url: '/api/popup/set/group',
        dataType: 'json',
        data: {
            info: JSON.stringify(group_info)
        }
    }).done(function() {
        alert('[그룹] ' + group_info.group_name + ' 정보 저장에 성공하였습니다');
        g_treeViewController.CreateTreeView('G_' + group_id);
    }).fail(function(xhr) {
        alert('[그룹] ' + group_info.group_name + ' 변경 실패');
        console.error('[그룹 설정 정보 저장 실패] ' + xhr.responseText);
    }).always(function() {
        // by shkoh 20181016: 그룹정보 저장이 완료된 후에는 앞서 조정된 group depth도 DB에 반영시켜 줌
        readjustGroupDepth(children);
    });
}

function saveEquipmentInfo(equip_id) {
    const equip_name = $('#equipmentName').val();
    const equip_parent_id = $('#userSelectButtonForParentGroup').attr('data');
    const pd_equip_id = $('#equipmentModel').val();
    const poll_interval = $('#equipmentInterval').val();
    const timeout = $('#equipmentTimeout').val();
    const retry = $('#equipmentRetry').val();
    const ip = $('#equipmentIp').val();

    if(equip_name == '') {
        alert('[설비명*]은 필수항목입니다');
        $('#equipmentName').focus();
        return;
    }

    if(equip_parent_id == undefined) {
        alert('[상위그룹*]은 필수항목입니다');
        $('#userSelectButtonForParentGroup').focus();
        return;
    }

    if(poll_interval == '') {
        alert('[수집주기(초)*]는 필수항목입니다');
        $('#equipmentInterval').focus();
        return;
    }

    if(timeout == '') {
        alert('[응답대기시간(초)*]는 필수항목입니다');
        $('#equipmentTimeout').focus();
        return;
    }

    if(retry == '') {
        alert('[재시도횟수*]는 필수항목입니다');
        $('#equipmentRetry').focus();
        return;
    }

    if(pd_equip_id === 0) {
        alert('[설비모델*]은 필수항목입니다. 정확한 모델을 선택하여 주세요');
        $('#equipmentModel').focus();
        return;
    }

    if(ip != '' && !isCheckedIpFormat(ip)) {
        alert('올바른 IPv4 형식이 아닙니다. 다시 확인해 주세요');
        $('#equipmentIp').focus();
        return;
    }

    const isChangedModel = isChangedEquipementModel({ id: equip_id, pd_equip_id: pd_equip_id });

    const equipment_info = {
        equip_id: equip_id,
        equip_name: equip_name,
        group_id: equip_parent_id,
        ip_address: $('#equipmentIp').val(),
        port_num: $('#equipmentPort').val() === '' ? undefined : $('#equipmentPort').val(),
        device_id: $('#equipmentDeviceId').val(),
        pd_equip_id: $('#equipmentModel').val(),
        b_use: $('#equipmentUse:checked').length == 0 ? 'N' : 'Y',
        community: $('#equipmentCommunity').val(),
        description: $('#equipmentDescription').val(),
        poll_interval: poll_interval,
        timeout: timeout,
        retry: retry,
        user_define: $('#equipmentUserDefine').val()
    }

    if(isChangedModel) {
        alert('[설비모델]이 변경됩니다.\n변경으로 인한 통신방식 및 페이지 구성에 변경이 발생됩니다');
    }

    $.ajax({
        async: true,
        type: 'PATCH',
        url: '/api/popup/set/equipment',
        dataType: 'json',
        data: {
            info: JSON.stringify(equipment_info),
            isChanged: isChangedModel
        }
    }).done(function() {
        // by shkoh 20211221: 자산 등록이 존재하는 경우에는 해당 루틴을 수행함
        if($('body').attr('data-asset') === '1') {
            saveEquipmentAddInfo(equip_id).then(function() {
                alert('[설비] ' + equipment_info.equip_name + ' 정보 저장에 성공하였습니다');
                g_treeViewController.CreateTreeView('E_' + equip_id);
            });
        } else {
            alert('[설비] ' + equipment_info.equip_name + ' 정보 저장에 성공하였습니다');
            g_treeViewController.CreateTreeView('E_' + equip_id);
        }
    }).fail(function(xhr) {
        alert('[그룹] ' + equipment_info.equip_name + ' 변경 실패');
        console.error('[설비 설정 정보 저장 실패] ' + xhr.responseText);
    });
}

// by shkoh 20211221: 설비의 자산정보 저장
function saveEquipmentAddInfo(equip_id) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            async: true,
            type: 'POST',
            url: '/api/popup/set/equipmentaddinfo',
            dataType: 'json',
            data: {
                equip_id: equip_id,
                mgr_name: $('#assetManagerName').val(),
                op_name: $('#assetOperatorName').val(),
                model_name: $('#assetModel').val(),
                serial_info: $('#assetSerial').val(),
                install_date: $('#install-date').val().replace(/\//g, '-'),
                ma_phone: $('#assetMaintenance').val(),
                image_file: $('#assetImageDropdownList').data('kendoDropDownList').text() === '선택안함' ? '' : $('#assetImageDropdownList').data('kendoDropDownList').text()
            }
        }).done(function() {
            resolve();
        }).fail(function(err) {
            console.error(err);
            reject();
        });
    });
}

/**
 * childen의 정보에 따라서 그룹 depth를 변경함
 * 
 * @param {Array} children 그룹ID와 depth 정보를 가지고 있는 하위그룹 배열
 */
function readjustGroupDepth(children) {
    children.forEach(function(child) {
        $.ajax({
            async: true,
            type: 'PATCH',
            url: '/api/popup/set/groupdepth',
            dataType: 'json',
            data: {
                info: JSON.stringify(child)
            }
        }).fail(function(xhr) {
            console.error('[하위 그룹(' + child.group_id + ') Depth 설정 실패] ' + xhr.responseText);
        });
    });
}

/**
 * 파라미터 parent_id를 기준으로 하위 모든 그룹ID와 Depth 정보를 child_groups에 저장
 * 
 * @param {Array} child_groups 하위그룹 정보를 기록할 배열
 * @param {Integer} parent_id 기준이 될 그룹ID
 * @param {Integer} parent_depth 기준이 될 그룹ID의 Depth
 */
function getChildrenGroupDepth(child_groups, parent_id, parent_depth) {
    const node = g_treeViewController.GetTreeNodeById('G_' + parent_id);
    if(node.children == undefined) return;
    
    node.children.forEach(function(child) {
        if(child.type == 'group') {
            child_groups.push({
                group_id: child.id.substr(2),
                depth: parent_depth + 1
            });

            getChildrenGroupDepth(child_groups, child.id.substr(2), parent_depth + 1);
        }
    });
}

/**
 * 주어진 파라미터가 IPv4 Address 형식에 맞는지 체크하는 함수
 * 
 * @param {String} ip 변경하고자 하는 IP
 */
function isCheckedIpFormat(ip) {
    const ips = ip.split('.');
    if(ips.length != 4) return false;
    
    let result = true;
    ips.forEach(function(octet) {
        const o = parseInt(octet);

        if(isNaN(o)) result = false;
        else if(o < 0) result = false;
        else if(o > 255) result = false;
    });

    return result;
}

/**
 * 설비모델이 변경되었는지 체크하는 함수
 * 기존값과 비교하여 변경되었다면 true를 반환
 * 
 * @param {JSON} model 설비모델 ID
 */
function isChangedEquipementModel(model) {
    let isResult = false;
    
    if(g_treeViewController == undefined) return isResult;

    const node = g_treeViewController.GetTreeNodeById('E_' + model.id);
    
    if(node.pd_equip_id != model.pd_equip_id) isResult = true;

    return isResult;
}

/************************************************************************************************/
/* by shkoh 20190527: setting popup tree context menu function start                            */
/************************************************************************************************/
function initTreeContextMenu() {
    $('#menuCopy').on('click', function() {
        g_copy_id = g_treeContextMenuController.getSelectedId();

        if(g_copy_id) alert('선택한 항목을 복사하였습니다');
        g_treeContextMenuController.HideContextMenu();
    });

    $('#menuPaste').on('click', function() {
        if(g_copy_id == undefined) {
            alert('복사할 항목을 우선 지정하세요');
            g_treeContextMenuController.HideContextMenu();
            return;
        }

        const selected_id = g_treeContextMenuController.getSelectedId();
        const selected_type = selected_id.substr(0, 1);
        const copy_type = g_copy_id.substr(0, 1);
        const copy_id = g_copy_id.substr(2);

        if(selected_type != copy_type) {
            let msg = '선택한 항목은 ' + (selected_type == 'G' ? '그룹' : '설비') + '입니다.\n';
            msg += (copy_type == 'G' ? '그룹' : '설비') + '항목을 복사해야 적용됩니다.';
            alert(msg);
            g_treeContextMenuController.HideContextMenu();
            return;
        }

        if(copy_type == 'G') g_groupContentController.PasteGroupInfo(copy_id);
        else g_equipmentContentController.PasteEquipmentInfo(copy_id);

        g_treeContextMenuController.HideContextMenu();
    });

    $('#menuClear').on('click', function() {
        g_copy_id = undefined;
        alert('복사항목이 취소되었습니다');
        g_treeContextMenuController.HideContextMenu();
    });

    g_treeContextMenuController = new TreeContextMenu('#treeContextMenu', onHideTreeContextMenu);
}

function onHideTreeContextMenu(event) {
    if(event.target.id != g_treeContextMenuController.getId() && $(event.target).parents(g_treeContextMenuController.getId()).length == 0) {
        g_treeContextMenuController.HideContextMenu();
    }
}
/************************************************************************************************/
/* by shkoh 20190527: setting popup tree context menu function end                              */
/************************************************************************************************/