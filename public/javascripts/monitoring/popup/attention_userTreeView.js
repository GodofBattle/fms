const UserTreeView = function(_id, _option) {
    const tree_id = _id;
    let option = {
        beforeCheck: undefined,
        onCheck: undefined,
        onClick: undefined        
    }

    option = _option;

    const m_tree_setting = {
        view: {
            showLine: false,
            showIcon: false
        },
        check: {
            enable: true,
            nocheckInherit: false
        },
        data: { simpleData: { enable: true } },
        callback: {
            beforeCheck: option.beforeCheck,
            onCheck: option.onCheck,
            onClick: option.onClick
        }
    }

    let m_user_tree = undefined;

    function createTreeView() {
        $.ajax({
            async: true,
            type: 'GET',
            dataType: 'json',
            url: '/monitoring/attention/user-tree'
        }).done(function(items) {
            let tree_data = [];
            let id, name, mobile, grade;

            items.forEach(function(item) {
                id = item.id;
                name = item.name_mobile;
                mobile = item.mobile;
                grade = item.grade;

                tree_data.push({
                    id: id,
                    name: name,
                    mobile: mobile,
                    grade: grade,
                    nocheck: false,
                    chkDisabled: false
                });
            });

            m_user_tree = $.fn.zTree.init($(tree_id), m_tree_setting, tree_data);
        }).fail(function(err) {
            console.error('[관심설비동록 사용자 리스트 트리 생성 실패] ' + err.responseText);
        });
    }

    function checkTreeNode(user) {
        if(m_user_tree == undefined) return;

        const node = m_user_tree.getNodeByParam('id', user, null);
        if(node != null) {
            m_user_tree.checkNode(node, true, true, true);
        }
    }

    function unCheckTreeNode(user) {
        if(m_user_tree == undefined) return;

        const node = m_user_tree.getNodeByParam('id', user, null);
        if(node != null) {
            m_user_tree.checkNode(node, false, true, true);
        }
    }

    function unCheckAllNodes() {
        if(m_user_tree == undefined) return;

        m_user_tree.checkAllNodes(false);
    }

    function getCheckedNodes() {
        if(m_user_tree == undefined) return undefined;
        return m_user_tree.getCheckedNodes(true);
    }

    function getSelectedNodes() {
        if(m_user_tree == undefined) return;
        return m_user_tree.getSelectedNodes()[0];
    }
    
    function selectNode(user) {
        if(m_user_tree == undefined) return;

        const node = m_user_tree.getNodeByParam('id', user, null);
        m_user_tree.selectNode(node);
    }

    function cancelSelectedNode() {
        if(m_user_tree == undefined) return;

        const nodes = m_user_tree.getSelectedNodes();
        if(nodes.length <= 0) return;
        
        nodes.forEach(function(node) {
            m_user_tree.cancelSelectedNode(node);
        });
    }

    return {
        CreateUserTree: function() { createTreeView(); },
        CheckTreeNodes: function(items) {
            items.forEach(function(item) {
                checkTreeNode(item);
            });
        },
        CheckTreeNode: function(user_id) { checkTreeNode(user_id); },
        UnCheckTreeNode: function(user_id) { unCheckTreeNode(user_id); },
        UnCheckAllNodes: function() { unCheckAllNodes(); },
        GetCheckedNodes: function() { return getCheckedNodes(); },
        GetSelectedNodes: function() { return getSelectedNodes(); },
        SelectNode: function(user_id) { selectNode(user_id); },
        CancelSelectedNode: function() { cancelSelectedNode(); }
    }
}
