const GroupTreeView = function(_id, _parent_group_id) {
    const tree_id = _id;
    const m_img_path = '/img/tree/';
    const parent_group_id = 'G_' + _parent_group_id;

    const m_tree_setting = {
        view: { showLine: true, addDiyDom: addDiyDom },
        data: { simpleData: { enable: true } },
        callback: {
            onExpand: undefined,
            onCollapse: undefined
        }
    }

    let m_tree = undefined;

    function addDiyDom(treeId, treeNode) {
        // by shkoh 20200518: Group Tree의 배경이 어둡기 때문에 tree 내 화살표를 흰색으로 표현할 수 있도록 개별 수정
        const tree_span = $(`#${treeNode.tId}`);
        tree_span.addClass('white');
    }

    function createTreeView() {
        $.ajax({
            async: true,
            type: 'GET',
            dataType: 'json',
            url: '/api/popup/set/tree?type=onlygroup'
        }).done(function(items) {
            let tree_data = [];
            items.forEach(function(item) {
                if(item.id.substr(0, 1) == 'G') {
                    tree_data.push({
                        id: item.id,
                        pId: item.pid,
                        name: item.name,
                        pd_equip_id: item.pd_equip_id,
                        open: (item.pid == null || item.pid == 'G_0') ? true : false,
                        icon: getTreeIconName(item.icon, item.level),
                        type: (item.id.substr(0, 1) == 'E') ? 'equipment' : 'group',
                        bgImg: item.imageName,
                        current_level: item.level,
                        iconName: item.icon,
                        depth: item.depth
                    });
                }
            });

            m_tree = $.fn.zTree.init($(tree_id), m_tree_setting, tree_data);
        }).fail(function(err) {
            console.error('[그룹 트리 생성 실패]' + err.responseText);
        }).then(function() {
            if(parent_group_id.substr(2) == null) return;
            selectTreeNode(parent_group_id);
        });
    }

    function destoryTree() {
        if(m_tree != undefined) m_tree.destroy();
        m_tree = undefined;

        $(tree_id).html('');
    }

    /***************************************************************************************************************/
    /* by shkoh 20180821: Tree View - zTree Controll Start                                                         */
    /***************************************************************************************************************/
    function getTreeIconName(icon, level) {
        return m_img_path + icon + '_L_' + level + '.png';
    }

    function selectTreeNode(id) {
        if(m_tree == undefined) return;

        const node = m_tree.getNodeByParam("id", id, null);
        if(node != undefined) m_tree.selectNode(node);
    }

    function getSelectedTreeNode() {
        if(m_tree == undefined) return undefined;
        return m_tree.getSelectedNodes()[0];
    }
    /***************************************************************************************************************/
    /* by shkoh 20180821: Tree View - zTree Controll End                                                           */
    /***************************************************************************************************************/

    return {
        CreateGroupTree: function() { createTreeView(); },
        Destroy: function() { destoryTree(); },
        GetSelectedTreeNode: function() { return getSelectedTreeNode(); }
    }
}