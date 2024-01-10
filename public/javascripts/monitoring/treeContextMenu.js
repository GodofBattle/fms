const TreeContextMenu = function(_id, _onHideContextMenu) {
    const id = _id;

    let m_parent_id = undefined;
    let m_tree_node_id = undefined;

    function m_showRootMenu() {
        $('#menu_add_group').show();
        $('#menu_add_equip').show();
        $('#menu_modify_group').show();

        $('#menu_del_group').hide();
        $('#menu_del_equip').hide();
        $('#menu_detail_equip').hide();
        $('#menu_modify_equip').hide();
        $('#menu_attention_equip').hide();
        $('#menu_set_sensor').hide();
        $('#menu_working').hide();
        $('#menu_fault').hide();
        $('#menu_communication_log').hide();

        $('#menu_group_hr').show();
        $('#menu_equip_hr').hide();
        $('#menu_sensor_hr').hide();
        $('#menu_fault_hr').hide();
    }

    function m_showGroupMenu() {
        $('#menu_add_group').show();
        $('#menu_del_group').show();
        $('#menu_modify_group').show();
        $('#menu_add_equip').show();

        $('#menu_del_equip').hide();
        $('#menu_detail_equip').hide();
        $('#menu_modify_equip').hide();
        $('#menu_attention_equip').hide();
        $('#menu_set_sensor').hide();
        $('#menu_working').hide();
        $('#menu_fault').hide();
        $('#menu_communication_log').hide();

        $('#menu_group_hr').show();
        $('#menu_equip_hr').hide();
        $('#menu_sensor_hr').hide();
        $('#menu_fault_hr').hide();
    }

    function m_showEquipmentMenu() {
        $('#menu_modify_equip').show();
        $('#menu_del_equip').show();
        $('#menu_detail_equip').show();
        $('#menu_attention_equip').show();
        $('#menu_set_sensor').show();
        $('#menu_fault').show();
        $('#menu_communication_log').show();

        $('#menu_add_group').hide();
        $('#menu_del_group').hide();
        $('#menu_modify_group').hide();
        $('#menu_add_equip').hide();

        $('#menu_group_hr').hide();
        $('#menu_equip_hr').show();
        $('#menu_sensor_hr').show();
        $('#menu_fault_hr').show();

        // by shkoh 20211221: 설비자산 서비스가 포함된 경우
        if($('body').attr('data-asset') === '1') {
            $('#menu_working').show();
        } else {
            $('#menu_working').hide();
        }
    }

    function m_showDVRMenu() {
        $('#menu_modify_equip').show();
        $('#menu_del_equip').show();
        $('#menu_detail_equip').show();

        $('#menu_add_group').hide();
        $('#menu_del_group').hide();
        $('#menu_modify_group').hide();
        $('#menu_add_equip').hide();
        $('#menu_attention_equip').hide();
        $('#menu_set_sensor').hide();
        $('#menu_fault').hide();
        $('#menu_communication_log').show();

        $('#menu_group_hr').hide();
        $('#menu_equip_hr').hide();
        $('#menu_sensor_hr').hide();
        $('#menu_fault_hr').hide();
    }

    function showContextMenu(info) {
        switch(info.type) {
            case 'root': m_showRootMenu(); break;
            case 'group': m_showGroupMenu(); break;
            case 'equipment': m_showEquipmentMenu(); break;
            case 'dvr': m_showDVRMenu(); break;
        }

        // by shkoh 20180710: TreeView에서 context menu 팝업 시에 parent_id를 가지고 있는다
        m_parent_id = info.parent_id;
        m_tree_node_id = info.selected_id;

        $(id).css({ top: info.y + 'px', left: info.x + 'px', visibility: 'visible' });

        $(document).bind('mousedown', _onHideContextMenu);
    }

    function hideContextMenu() {
        // by shkoh 20180710: context menu가 닫힐 때에는 parent_id를 초기화 함
        m_parent_id = undefined;
        m_tree_node_id = undefined;
        
        $(id).css({ visibility: 'hidden' });
        $(document).unbind('mousedown');
    }

    return {
        ShowContextMenu: function(info) { showContextMenu(info); },
        HideContextMenu: function() { hideContextMenu(); },
        getId: function() { return id; },
        getParentId: function() { return m_parent_id; },
        getSelectedId: function() { return m_tree_node_id; }
    }
}