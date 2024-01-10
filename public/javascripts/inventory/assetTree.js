const AssetTree = function(_id, _options) {
    const m_id = _id;

    let options = {
        enableCheck: false,
        selectNodeId: undefined,
        popupSelectNodeId: undefined,
        onClick: undefined,
        onCheck: undefined
    };

    options = _options;

    let m_tree = undefined;
    const m_tree_setting = {
        view: {
            showLine: false
        },
        check: {
            enable: options.enableCheck,
            nocheckInherit: false,
            chkboxType: { 'Y': 'ps', 'N': 'ps' }
        },
        data: {
            simpleData: {
                enable: true,
                idKey: 'id',
                pIdKey: 'pId',
            }
        },
        async: { enable: false },
        callback: {
            onClick: options.onClick,
            onCheck: options.onCheck
        }
    }

    function createTree(code) {
        displayLoading();

        $.ajax({
            async: true,
            type: 'GET',
            cache: false,
            url: '/api/inventory/assets_tree'
        }).done(function(items) {
            let tree_data = [];
            items.forEach(function(item) {
                let data = {
                    id: item.object_id,
                    pId: item.object_parent_id,
                    name: item.object_name,
                    icon: getIcon(item.object_code_type, item.object_code_icon),
                    data: item,
                    asset: true
                }

                if(code === undefined || code === item.object_code_id) tree_data.push(data);
            });

            m_tree = $.fn.zTree.init($(m_id), m_tree_setting, tree_data);
        }).fail(function(err) {
            console.error(err);
        }).always(function() {
            undisplayLoading();
            expandRootNode();
            
            if(options.selectNodeId) selectTreeNode(options.selectNodeId);
            else if(options.popupSelectNodeId) selectTreeNode(options.popupSelectNodeId);
        });
    }

    function destroyTree() {
        $.fn.zTree.destroy(m_id);
        m_tree = undefined;
    }
    /**********************************************************************************************************************************************/
    /* by shkoh 20210405: ztree control start                                                                                                     */
    /**********************************************************************************************************************************************/
    /**********************************************************************************************************************************************/
    /* by shkoh 20210405: ztree control end                                                                                                       */
    /**********************************************************************************************************************************************/

    /**********************************************************************************************************************************************/
    /* by shkoh 20210405: tree data start                                                                                                         */
    /**********************************************************************************************************************************************/
    function getAllChildNodes(parent_node) {
        const child_nodes = m_tree.getNodesByParam('asset', true, parent_node);
        return child_nodes;
    }

    function expandRootNode() {
        const root_node = m_tree.getNodeByParam('pId', null);
        m_tree.expandNode(root_node, true, false, false, false);
    }

    function selectTreeNode(node_id) {
        const node = m_tree.getNodeByParam('id', node_id);
        m_tree.selectNode(node, false);
    }

    function getSelectedNode() {
        return m_tree.getSelectedNodes()[0];
    }

    function moveNode(target_id, new_parent_id) {
        const new_parent_node = m_tree.getNodeByParam('id', new_parent_id);
        const target_node = m_tree.getNodeByParam('id', target_id);

        // m_tree.moveNode(new_parent_node, target_node, 'inner', false);
        sortTree(m_tree, new_parent_node, target_node);
    }

    function getParentNode(target_id) {
        const p_node = m_tree.getNodeByParam('id', target_id).getParentNode();
        return p_node;
    }

    function getNodeInfo(target_id) {
        const target_node = m_tree.getNodeByParam('id', target_id);
        return target_node;
    }

    function getCheckedNodes() {
        return m_tree.getCheckedNodes(true);
    }

    function removeNode(target_id) {
        const removed_node = m_tree.getNodeByParam('id', target_id);
        m_tree.removeNode(removed_node, false);
    }

    function updateNodeName(target_id, new_name) {
        const node = m_tree.getNodeByParam('id', target_id);
        node.name = new_name;
        m_tree.updateNode(node);

        sortTree(m_tree, node.getParentNode(), node);
    }

    function addNode(add_info) {
        const p_node = m_tree.getNodeByParam('id', add_info.object_parent_id);
        const new_node = m_tree.addNodes(p_node, [{
            id: add_info.object_id,
            pId: add_info.object_parent_id,
            name: add_info.object_name,
            icon: getIcon(add_info.object_code_type, add_info.object_code_icon),
            data: add_info,
            asset: true
        }], false);

        sortTree(m_tree, p_node, new_node[0]);

        return new_node[0];
    }
    /**********************************************************************************************************************************************/
    /* by shkoh 20210405: tree data end                                                                                                           */
    /**********************************************************************************************************************************************/

    /**********************************************************************************************************************************************/
    /* by shkoh 20210405: inline function start                                                                                                   */
    /**********************************************************************************************************************************************/
    function displayLoading() {
        kendo.ui.progress($(m_id), true);
    }

    function undisplayLoading() {
        kendo.ui.progress($(m_id), false);
    }

    function getIcon(type, icon_name) {
        const init_url = '/img/inventory/tree/';
        let icon_file_name = '';
    
        if(type === null) icon_file_name = 'tree_default.png';
        else if(icon_name === null) icon_file_name = 'null_L_0.png';
        else icon_file_name = icon_name;
        
        return init_url + icon_file_name;
    }

    /**
     * p_node 하위의 설비 속성과 명칭에 대해서 정렬을 진행함
     * 
     * by shkoh 20190321: NPS에서는 그룹명이 "기타"인 그룹에 대해서는 항상 맨 아래에 배치되도록 해야함으로 해당 부분에 대한 예외처리를 추가함
     * by shkoh 20210412: 우리FIS의 자산설정에 맞게 수정 변경 함
     * 
     * @param {Object} tree sort를 진행할 Tree 객체
     * @param {Object} p_node sort를 진행할 부모 노드
     * @param {Object} c_node 정렬의 기준일 될 기준 노드
     */
     function sortTree(tree, p_node, c_node) {
        let nodes = tree.getNodesByParam('pId', p_node.id, p_node);
        if(nodes.length === 0) {
            tree.moveNode(p_node, c_node, 'inner', false);
            return true;
        }

        nodes.some(function(node) {
            let isMove = 0;

            if(c_node.data.object_code_id == 'I2000' && node.data.object_code_id > c_node.data.object_code_id) {
                // by shkoh 20181114: 그룹노드가 추가/변경이 된 경우에는 가장 우선 배치된 설비 앞에 배치한 후 정렬 작업을 마침
                tree.moveNode(node, c_node, 'prev', false);
                return true;
            } else if(node.data.object_code_id == 'I2000' && c_node.data.object_code_id != 'I2000') {
                // by shkoh 20210412: 비교 노드가 [위치(혹은 그룹)]이고, 기준 대상은 [위치]가 아닌 경우에는 무조건 그룹 아래로 내려보냄
                isMove = 2;
            } else if(node.name != c_node.name) {
                const node_name_length = node.name.length;
                const c_node_name_length = c_node.name.length;

                const text_length = Math.min(node_name_length, c_node_name_length);
                let idx = 0;
                
                for(idx = 0; idx < text_length; idx++) {
                    let node_char_code = node.name.toUpperCase().charCodeAt(idx);
                    let c_node_char_code = c_node.name.toUpperCase().charCodeAt(idx);

                    // by shkoh 20181114: 2개의 코드 값이 다른 경우에만 비교하며,
                    // by shkoh 20181114: 추가/수정된 노드가 비교 노드보다 큰 경우에만 노드 변경을 수행
                    // by shkoh 20181114: 비교 노드보다 작은 경우에는 변경 작업을 하지 않음
                    if(node_char_code != c_node_char_code) {
                        if(node_char_code < c_node_char_code) {
                            isMove = 2;
                        } else {
                            isMove = 1;
                        }

                        break;
                    }
                }
                
                if(isMove == false && idx == text_length) {
                    if(node_name_length < c_node_name_length) isMove = 2;
                    else if(node_name_length > c_node_name_length) isMove = 1;
                }
            }

            if(isMove == 2) tree.moveNode(node, c_node, 'next', false);
            else if(isMove == 1) {
                tree.moveNode(node, c_node, 'prev', false);
                return true;
            }
        });
    }
    /**********************************************************************************************************************************************/
    /* by shkoh 20210405: inline function end                                                                                                     */
    /**********************************************************************************************************************************************/

    return {
        CreateTree: function() { createTree(); },
        CreateTreeWithPlaceItems: function() { createTree('I2000'); },
        DestroyTree: function() { destroyTree(); },
        GetAllChildNodes: function(parentNode) { return getAllChildNodes(parentNode); },
        GetSelectedNode: function() { return getSelectedNode(); },
        GetParentNode: function(target_id) { return getParentNode(target_id); },
        GetNodeInfo: function(target_id) { return getNodeInfo(target_id); },
        GetCheckedNodes: function() { return getCheckedNodes(); },
        MoveNode: function(target_id, new_parent_id) { moveNode(target_id, new_parent_id); },
        SelectNode: function(node_id) { selectTreeNode(node_id); },
        AddNode: function(add_info) { return addNode(add_info); },
        UpdateNodeName: function(target_id, new_name) { updateNodeName(target_id, new_name); },
        RemoveNode: function(target_id) { removeNode(target_id); }
    }
}