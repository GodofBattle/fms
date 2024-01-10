const AttentionContent = function(_id) {
    const content_id = _id;
    let innerHtml = '';
    // kdh 20190123 관심설비등록 페이지 '사용자 리스트' TreeView Controller
    let g_userTreeViewController = undefined;
    let g_isAttend = 0;
    let g_userIds = [];

    function createAttentionContent(selected_id) {
        $(content_id).html('');

        innerHtml =
        '<table id="attention" class="table" cellspacing="0" cellpadding="0" style="font-size: 13px;">' +
            '<tbody>' +
                    '<th class="title" scope="row">알람 요일</th>' +
                '</tr>' +
                '<tr>' +
                    '<th>' +
                        '<div class="btn-group" data-toggle="buttons">' +
                            '<label id="alarmWeekMon" class="btn btn-check alarmWeek" setElement>' +
                                '<input type="checkbox" autocomplete="off"> 월 ' +
                            '</label>' +
                            '<label id="alarmWeekTue" class="btn btn-check alarmWeek" setElement>' +
                                '<input type="checkbox" autocomplete="off"> 화 ' +
                            '</label>' +
                            '<label id="alarmWeekWed" class="btn btn-check alarmWeek" setElement>' +
                                '<input type="checkbox" autocomplete="off"> 수 ' +
                            '</label>' +
                            '<label id="alarmWeekThu" class="btn btn-check alarmWeek" setElement>' +
                                '<input type="checkbox" autocomplete="off"> 목 ' +
                            '</label>' +
                            '<label id="alarmWeekFri" class="btn btn-check alarmWeek" setElement>' +
                                '<input type="checkbox" autocomplete="off"> 금 ' +
                            '</label>' +
                            '<label id="alarmWeekSat" class="btn btn-check alarmWeek" setElement>' +
                                '<input type="checkbox" autocomplete="off"> 토 ' +
                            '</label>' +
                            '<label id="alarmWeekSun" class="btn btn-check alarmWeek" setElement>' +
                                '<input type="checkbox" autocomplete="off"> 일 ' +
                            '</label>' +
                        '</div>' +
                    '</th>' +
                '</tr>' +
                '<tr>' +
                    '<th class="title" scope="row" class="control-label">' +
                        '<button id="reset" data-toggle="tooltip" data-placement="right" title="클릭 시 전체 선택 / 전체 해제">알람 시간</button>' +
                    '</th>' +
                '</tr>' +
                '<tr>' +
                    '<th>' +
                        '<div class="btn-group" data-toggle="buttons">';
        createAlarmTime();
        innerHtml +=
                        '</div>' +
                    '</th>' +
                '</tr>' +
                '<tr>' +
                    '<th class="title" scope="row">관심 사용자 리스트</th>' +
                '</tr>' +
                '<tr>' +
                    '<th>' +
                        '<div id="userTreeViewer"  style="height: 310px;">' +
                            '<div id="userListTree" class="ztree"></div>' +
                        '</div>' +
                    '</th>' +
                '</tr>' +
            '</tbody>' +
        '</table>';

        $(content_id).html(innerHtml);

        $('#reset').on('click', function() {
            let index = 0;
            for(let idx=0; idx<24; idx++) {
                if($("#alarmHour" + idx.toString()).hasClass('active')) index++;
            }

            for(let idx=0; idx<24; idx++) {
                if(index > 0) $('#alarmHour' + idx.toString()).removeClass('active');
                else $('#alarmHour' + idx.toString()).addClass('active');
            }
        });

        $('#userTreeViewer').mCustomScrollbar({
            theme: 'minimal-dark',
            axis: 'y',
            scrollbarPosition: 'outside'
        });

        g_userTreeViewController = new UserTreeView('#userListTree', {
            beforeCheck: beforeTreeViewCheck,
            onCheck: onTreeViewCheck,
            onClick: onTreeViewClick
        });
        g_userTreeViewController.CreateUserTree();

        loadAttendEquipInfo(selected_id);
    }

    function createAlarmTime() {
        for(let idx = 0; idx < 24; idx++) {
            innerHtml +=
                '<label id="alarmHour' + idx + '" class="btn btn-check alarmHour" style="margin-right: 1px;" setElement>';
            if(idx.toString().length == 2) {
                innerHtml += '<input type="checkbox" autocomplete="off"> ' + idx + ':00 ';
            } else {
                innerHtml += '<input type="checkbox" autocomplete="off">' + ' 0' + idx + ':00 ';
            }
            innerHtml += '</label>';
        }

        return innerHtml;
    }

    function beforeTreeViewCheck(treeId, treeNode) {
        if(treeNode.mobile == '') {
            alert('mobile 번호가 등록되어있지 않아서 선택할 수 없습니다.');
            return false;
        }
    }

    function onTreeViewCheck(event, treeId, treeNode) {
        if(g_isAttend == 0) return;
        g_userTreeViewController.CancelSelectedNode();
        g_userTreeViewController.SelectNode(treeNode.id);
    }

    function onTreeViewClick(event, treeId, treeNode, clickFlag) {
        if(treeNode == null) return;

        if(g_userTreeViewController.GetSelectedNodes().checked == false) {
            g_userTreeViewController.CheckTreeNode(treeNode.id);
        } else g_userTreeViewController.UnCheckTreeNode(treeNode.id);
    }

    function loadAttendEquipInfo(selected_id) {
        $.ajax({
            async: true,
            type: 'GET',
            url: '/equipment/attention/info/' + selected_id
        }).done(function(info) {            
            fillAttendEquipInfo(info);
        }).fail(function(xhr) {
            console.error(xhr.responseText);
        });
    }

    function fillAttendEquipInfo(info) {
        g_userIds = [];
        if(info.length == undefined) {
            g_isAttend = g_userIds.length;
            return;
        }

        // kdh 20190130 알람 요일
        info[0].AlarmWeekMon == 'Y' ? $('#alarmWeekMon').addClass('active') : $('#alarmWeekMon').removeClass('active');
        info[0].AlarmWeekTue == 'Y' ? $('#alarmWeekTue').addClass('active') : $('#alarmWeekTue').removeClass('active');
        info[0].AlarmWeekWed == 'Y' ? $('#alarmWeekWed').addClass('active') : $('#alarmWeekWed').removeClass('active');
        info[0].AlarmWeekThu == 'Y' ? $('#alarmWeekThu').addClass('active') : $('#alarmWeekThu').removeClass('active');
        info[0].AlarmWeekFri == 'Y' ? $('#alarmWeekFri').addClass('active') : $('#alarmWeekFri').removeClass('active');
        info[0].AlarmWeekSat == 'Y' ? $('#alarmWeekSat').addClass('active') : $('#alarmWeekSat').removeClass('active');
        info[0].AlarmWeekSun == 'Y' ? $('#alarmWeekSun').addClass('active') : $('#alarmWeekSun').removeClass('active');
        // kdh 20190130 알람 시간
        for(let idx = 0; idx < 24; idx++) {
            info[0]['AlarmHour' + idx.toString()] == 'Y' ? $('#alarmHour' + idx.toString()).addClass('active') : $("#alarmHour" + idx.toString()).removeClass('active');
        }
        // kdh 20190130 관심 사용자 리스트 ztree 체크
        info.forEach(function(items) {
            g_userIds.push(items.user_id);
        });
        g_userTreeViewController.CheckTreeNodes(g_userIds);

        // 수정, 추가인지 구별하기 위한 값
        g_isAttend = g_userIds.length;
    }

    function getCheckedUserId() {
        const checked_tree_nodes = g_userTreeViewController.GetCheckedNodes();
        let checked_user_ids = [];

        if(checked_tree_nodes == undefined || checked_tree_nodes.length == 0) return;
        else {
            checked_tree_nodes.forEach(function(node) {
                checked_user_ids.push(node.id);
            });
        }

        return checked_user_ids;
    }

    function unCheckUserAllNodes() {
        g_userTreeViewController.UnCheckAllNodes();
    }

    return {
        CreateAttentionContent: function(selected_id) { createAttentionContent(selected_id); },
        ClearAttentionContent: function() { 
            $(content_id).html('하위 설비를 클릭해주세요.');
            return;
        },
        GetCheckedUserId: function() { return getCheckedUserId(); },
        GetAttendEquip: function() { return g_isAttend; },
        GetPrevCheckedUserId: function() { return g_userIds; },
        UnCheckUserAllNodes: function() { unCheckUserAllNodes(); }
    }
}