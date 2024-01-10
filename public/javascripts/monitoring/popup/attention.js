// kdh 20181218 TreeView Controller
let g_treeViewController = undefined;
// Attention Equipment Controller
let g_attendEquipmentController = undefined;
let g_isClear = undefined;

$(window).resize(function() {
    contentViewerResizing();
});

$(document).ready(function() {
    const id = location.pathname.split('/').pop();    

    g_treeViewController = new TreeViewContent('#treeViewer', {
        onClick: onTreeViewClick
    });
    g_treeViewController.CreateTreeView(id);

    showViewer(id);

    // 해제 버튼 클릭 시
    $('#resetSetting').on('click', function() {
        if(g_treeViewController == undefined) return;
        g_isClear = true;

        $('#alarmWeekMon').removeClass('active');
        $('#alarmWeekTue').removeClass('active');
        $('#alarmWeekWed').removeClass('active');
        $('#alarmWeekThu').removeClass('active');
        $('#alarmWeekFri').removeClass('active');
        $('#alarmWeekSat').removeClass('active');
        $('#alarmWeekSun').removeClass('active');

        for(let idx = 0; idx < 24; idx++) {
            $('#alarmHour' + idx.toString()).removeClass('active');
        }

        g_attendEquipmentController.UnCheckUserAllNodes();
    });
    
    // 설정 버튼 클릭 시
    $('#saveSetting').on('click', function() {
        if(g_treeViewController == undefined) return;
        
        const node = g_treeViewController.GetSelectedTreeNode();
        if(node == undefined) {
            alert('저장을 위한 정보가 불분명합니다. 다시 시도해주세요.');
            return;
        }

        let node_id = '';
        if(node.id.substr(0, 1) == 'A') node_id = node.id.substr(3);
        else node_id = node.id.substr(2);

        if(g_isClear == true) {
            const prevUserIds = g_attendEquipmentController.GetPrevCheckedUserId();
            const isClear = confirm(node.name + ' - 관심설비를 해제하시겠습니까?');
            if(isClear) {
                deleteUserInfo(prevUserIds, node_id);
                g_treeViewController.SetChkDisabled(false);
                g_treeViewController.UnCheckTreeNode(node_id);
                g_treeViewController.SetChkDisabled(true);
                g_attendEquipmentController.CreateAttentionContent(node_id);
                g_isClear = false;
            }
            return;
        }

        const isSave = confirm(node.name + ' - 아래의 관심설비 정보를 등록하시겠습니까?');
        if(isSave) saveAttentdEquipInfo(node_id, node.name);
    });

    $('#treeContent').mCustomScrollbar({
        theme: 'minimal-dark',
        axis: 'yx',
        scrollbarPosition: 'outside',
        callbacks: {
            onScrollStart: function() {},
            onScroll: function() {}
        }
    });

    $(document).ready(function() {
        g_treeViewController.SetChkDisabled(false);
        g_treeViewController.CheckTreeNodes();
        g_treeViewController.SetChkDisabled(true);
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
    let node_id = '';

    if(id.substr(0, 1) == 'A') node_id = id.substr(3);
    else node_id = id.substr(2);

    g_attendEquipmentController = new AttentionContent('#viewer');
    g_attendEquipmentController.CreateAttentionContent(node_id);

    // kdh 20190218 알람 시간 title의 tooltip 사용 정의
    $('[data-toggle="tooltip"]').tooltip({
        trigger: 'hover'
	});

    contentViewerResizing();
}

function onTreeViewClick(event, treeId, treeNode, clickFlag) {
    if(treeNode == null) return;

    if(treeNode.id.substr(0, 1) == 'G') {
        g_attendEquipmentController.ClearAttentionContent();
    } else showViewer(treeNode.id);
}

function saveAttentdEquipInfo(equip_id, equip_name) {
    // 사용자 수정 전의 상태를 알기위해(새로 추가인지 수정인지) 관심설비 사용자 리스트 길이 받아옴
    let g_attendEquip = g_attendEquipmentController.GetAttendEquip();
    // 사용자 리스트 체크된 값 받아옴 (변경 전 체크되어있던 값, 변경 후 체크된 모든 값)
    let prevUserIds = g_attendEquipmentController.GetPrevCheckedUserId();
    let userIds = g_attendEquipmentController.GetCheckedUserId();
    // 알람 요일 체크된 값
    const alarmWeek =
        ($('#alarmWeekMon').hasClass('active') ? 'Y' : 'N') +
        ($('#alarmWeekTue').hasClass('active') ? 'Y' : 'N') +
        ($('#alarmWeekWed').hasClass('active') ? 'Y' : 'N') +
        ($('#alarmWeekThu').hasClass('active') ? 'Y' : 'N') +
        ($('#alarmWeekFri').hasClass('active') ? 'Y' : 'N') +
        ($('#alarmWeekSat').hasClass('active') ? 'Y' : 'N') +
        ($('#alarmWeekSun').hasClass('active') ? 'Y' : 'N');
    // 알람 시간 체크된 값
    let alarmHour = '';
	for(let idx = 0; idx < 24; idx++) {
		alarmHour += ($('#alarmHour' + idx.toString()).hasClass('active') ? 'Y' : 'N');
    }

    if(alarmWeek == 'NNNNNNN') {
        alert('알람 요일을 체크해주세요.');
        return;
    }
    if(alarmHour == 'NNNNNNNNNNNNNNNNNNNNNNNN') {
        alert('알람 시간을 체크해주세요.');
        return;
    }
    if(userIds == undefined || userIds.length == 0) {
        alert('관심 사용자를 체크해주세요.');
        return;
    }
    
    // 이미 관심설비로 등록되어있고, 사용자 리스트에서 체크 항목이 추가되었을 때
    if(g_attendEquip > 0 && prevUserIds.length < userIds.length) {
        // 새로 추가할 user_id를 저장해 따로 INSERT
        let insertUser = [];
        userIds.filter(function(user) {
            prevUserIds.indexOf(user) === -1 && insertUser.push(user);
        });
        let _userIds = [];
        userIds.filter(function(user) {
            prevUserIds.indexOf(user) !== -1 && _userIds.push(user);
        });
        userIds = _userIds;

        insertUserInfo(insertUser, equip_id, alarmWeek, alarmHour);
    } else if(g_attendEquip > 0 && prevUserIds.length > userIds.length) {
        // 사용자 리스트에서 체크 항목이 삭제되었을 때 (check -> uncheck 시에 DB Table 사용자id 삭제)
        let delete_user = [];
        prevUserIds.filter(function(user) {
            userIds.indexOf(user) === -1 && delete_user.push(user);;
        });
        deleteUserInfo(delete_user, equip_id);
    }

    let attend_equip_info = [];
    userIds.forEach(function(user) {
        attend_equip_info.push({
            equip_id: equip_id,
            user_id: user,
            week_enable: alarmWeek,
            hour_enable: alarmHour
        });
    });

    $.ajax({
        async: true,
        type: 'POST',
        url: '/equipment/attention/info',
        dataType: 'json',
        data: {
            info: JSON.stringify(attend_equip_info),
            type: g_attendEquip > 0 ? 'UPDATE' : 'INSERT'
        }
    }).done(function() {
        alert(equip_name + (g_attendEquip > 0 ? ' - 관심 설비 정보가 저장되었습니다.' : ' - 관심 설비로 등록되었습니다.'));
    }).fail(function(xhr, textStatus, error) {
        alert(equip_name + ' - 관심 설비 정보 저장에 실패하였습니다.');
        console.log('[관심 설비 정보 저장 실패] ' + xhr.responseText, error);
    }).always(function() {
        if(g_attendEquip == 0) {
            g_treeViewController.SetChkDisabled(false);            
            g_treeViewController.CheckTreeNode(equip_id);
            g_treeViewController.SetChkDisabled(true);
        }
        g_attendEquipmentController.CreateAttentionContent(equip_id);
    });
}

/**
 * kdh 20190212 사용자 리스트에서 관심설비 user 정보 추가로 저장
 * 
 * @param {Array} info 추가로 등록될 관심설비 정보
 */
function insertUserInfo(insertUser, equip_id, alarmWeek, alarmHour) {
    let insert_info = [];
    insertUser.forEach(function(user) {
        insert_info.push({
            equip_id: equip_id,
            user_id: user,
            week_enable: alarmWeek,
            hour_enable: alarmHour
        });
    });

    $.ajax({
        async: true,
        type: 'POST',
        url: '/equipment/attention/info',
        dataType: 'json',
        data: {
            info: JSON.stringify(insert_info),
            type: 'INSERT'
        }
    }).done(function() {
    }).fail(function(xhr, textStatus, error) {
        console.log('[관심 설비 user 추가 저장 실패] ' + xhr.responseText, error);
    });
}

/**
 * kdh 20190212 저장된 사용자 리스트 중에서 관심설비 user 정보 삭제
 * 
 * @param {Array} delete_user 삭제할 관심설비 정보
 * @param {Integer} equip_id 해당 equip_id
 */
function deleteUserInfo(delete_user, equip_id) {
    let delete_info = [];
    delete_user.forEach(function(user) {
        delete_info.push({
            equip_id: equip_id,
            user_id: user
        });
    });

    $.ajax({
        async: true,
        type: 'POST',
        url: '/equipment/attention/info',
        dataType: 'json',
        data: {
            info: JSON.stringify(delete_info),
            type: 'DELETE'
        }
    }).done(function() {
    }).fail(function(xhr, textStatus, error) {
        console.log('[관심 설비 user 정보 삭제 실패] ' + xhr.responseText, error);
    });
}