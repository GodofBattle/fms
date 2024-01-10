/**
 * 사용자 설정에서 사용할 TreeView 생성
 * 
 * @param {String} id TreeView 생성 Element Id
 * @param {String} user_id 그룹 내역을 가지고 올 user_id
 */
const TreeView = function(id, { user_id, start_group_id }) {
    const m_tree_id = id;
    const m_user_id = user_id;
    const m_start_group_id = start_group_id;

    const m_imgPath = "/img/tree/";
    const m_ztree_setting = {
        view: {
            showLine: true,
            fontCss: function(treeId, treeNode) {
                return treeNode.is_available == 'Y' ? { 'text-decoration': 'none', opacity: 1 } : { 'text-decoration': 'line-through', opacity: 0.6 }
            }
        },
        check: {
            enable: true,
            nocheckInherit: false
        },
        data: { simpleData: { enable: true } },
        callback: {
            beforeClick: undefined,
            beforeRightClick: undefined,
            onClick: undefined,
            onRightClick: undefined
        }
    };

    let m_ztree = undefined;

    function getTreeIconName(type, is_available, icon_name) {
        if(type == 'E' && is_available == 'N') return m_imgPath + icon_name + '_L_6.png';
        else return m_imgPath + icon_name + '_L_0.png';
    }

    function createTree() {
        $.ajax({
            async: true,
            type: 'GET',
            dataType: 'json',
            url: '/api/user/tree?type=normal'
        }).done(function(items) {
            if(items == undefined) items = [];

            let tree_data = [];

            items.forEach(function(item) {
                tree_data.push({
                    id: item.id,
                    pId: item.pid,
                    name: item.name,
                    pd_equip_id: item.pd_equip_id,
                    open: (item.pid == 'G_0' ? true : false),
                    icon: getTreeIconName(item.id.substr(0, 1), item.isAvailable, item.icon),
                    type: item.id == 'E' ? 'equipment' : 'group',
                    current_level: item.level,
                    iconName: item.icon,
                    nocheck: false,
                    chkDisabled: false,
                    is_available: item.isAvailable
                });
            });

            m_ztree = $.fn.zTree.init($(m_tree_id), m_ztree_setting, tree_data);
        }).fail(function(err_code) {
            console.error('[그룹 설비 항목 조회 실패]' + err_code);
        }).always(function() {
            const filtering = function(node) {
                return node.id === ('G_' + m_start_group_id);
            };
            
            const filter_nodes = m_ztree.getNodesByFilter(filtering, true);

            const root_node = m_ztree.getNodeByParam('level', '0');
            m_ztree.removeNode(root_node, false);
            m_ztree.addNodes(null, filter_nodes);
        }).then(function() {
            loadUserAlarmEquipmentInfo();
        });
    }

    /**
     * 사용자 알람 설비 목록
     *  
     * @param {String} id 조회할 사용자 ID
     */
    function loadUserAlarmEquipmentInfo() {
        $.ajax({
            async: true,
            type: 'GET',
            dataType: 'json',
            // url: '/user/alarmEquip/' + m_user_id
            url: `/api/user/alarmequipments?user_id=${m_user_id}`
        }).done(function(alarm_equipments) {
            alarm_equipments.forEach(function(item) {
                const node = m_ztree.getNodeByParam('id', 'E_' + item.equip_id, null);
                if(node) m_ztree.checkNode(node, true, true);
            });
        }).fail(function(err_code) {
            alert('[' + err_code + '] ' + m_user_id + '와 연결된 알람설비 목록을 로드할 수 없습니다')
        }).always(function() {
            // by shkoh 20181015: level 0(즉, 루트그룹) 노드를 확장함
            const root_node = m_ztree.getNodeByParam('level', 0, false);
            m_ztree.expandNode(root_node, true, false, false, false);
        });
    }

    function getCheckedNodes() {
        if(m_ztree == undefined) return undefined;

        return m_ztree.getCheckedNodes(true);
    }

    // by shkoh 20170519: 아이콘들과 연결하는 설비 트리를 해제시킴
    function DestoryTree() {
        if(m_ztree == undefined) return;
        m_ztree.destroy();
    }

    return {
        Create: function() { createTree(); },
        
        Destroy: function() { DestoryTree(); },

        GetCheckedNodes: function() { return getCheckedNodes(); },
    }
}