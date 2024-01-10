var GroupTreeView = function(id, selected_id) {
    var imgPath = "/img/tree/";
    var m_tree = undefined;
    var tree_id = id;
    var _selected_id = 'G_' + selected_id;

    function getTreeIconName(iconName, level) {
        return imgPath + iconName + "_L_" + level + ".png";
    }

    function CreateGroupTree(items) {
        if(m_tree != undefined) return;
        if(items == undefined) return;
        
        let inserted_data = [];
        items.forEach(function(item) {
            let open = false;
            let type = 'group';
            let treeIcon = getTreeIconName(item.icon, item.level);

            if(item.pid == null || item.pid == 'G_0') open = true;

            inserted_data.push({
                id: item.id,
                pId: item.pid,
                name: item.name,
                pd_equip_id: item.pd_equip_id,
                open: open,
                icon: treeIcon,
                type: type,
                bgImg: item.imageName,
                current_level: item.level,
                iconName: item.icon
            });
        });

        m_tree = $.fn.zTree.init($(tree_id), {
            view: { showLine: true },
            data: { simpleData: { enable: true } }
        }, inserted_data);
    }

    function createTree() {
        $.ajax({
            async: true,
            type: 'GET',
            dataType: 'json',
            url: `/api/user/tree?type=onlygroup`
        }).done(function(items) {
            if(items == undefined) return;
            CreateGroupTree(items);
        }).fail(function(err_code) {
            console.log('[그룹 트리 생성 실패] ' + err_code);
        }).then(function() {
            if(_selected_id.substring(2) == null) return;
            selectTreeNode(_selected_id);
        });
    }

    function destoryTree() {
        if(m_tree != undefined) m_tree.destroy();
        m_tree = undefined;
    }

    function selectTreeNode(id) {
        if(m_tree == undefined) return;

        var node = m_tree.getNodeByParam("id", id, null);
        if(node != undefined) m_tree.selectNode(node);
    }

    function getCurrnetTreeNode() {
        if(m_tree == undefined) return undefined;
        return m_tree.getSelectedNodes()[0];
    }

    return {
        CreateGroupTree: function() { createTree(); },
        Destroy: function() { destoryTree(); },
        SelectTreeNode: function(id) { selectTreeNode('G_' + id); },
        GetCurrentNode: function() { return getCurrnetTreeNode(); }
    }
}