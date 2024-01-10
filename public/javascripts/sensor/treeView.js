/**
 * by shkoh 20210503: 임계치 설정에서 사용할 TreeView
 * 
 * @param {String} _id TreeView에 생성할 Element ID
 * @param {Object} _options TreeView에 사용되는 설정을 위한 Options
 */

const TreeView = function(_id, _options) {
    const tree_id = _id;
    let options = {
        beforeClick: undefined,
        onCheck: undefined
    };
    options = _options;

    const m_img_path = '/img/tree/';
    let m_tree = undefined;

    const m_tree_setting = {
        view: {
            showLine: true,
            fontCss: function(treeId, treeNode) {
                return treeNode.is_available === 'Y' ? { 'text-decoration': 'none', opacity: 1 } : { 'text-decoration': 'line-through', opacity: 0.6 };
            }
        },
        check: {
            enable: true,
            nocheckInherit: false
        },
        data: {
            simpleData: {
                enable: true,
                idKey: 'id',
                pIdKey: 'pid'
            }
        },
        async: { enable: false },
        callback: {
            beforeClick: options.beforeClick,
            onCheck: options.onCheck
        }
    }

    /**********************************************************************************************************************/
    /* by shkoh 20210503: tree view init start                                                                            */
    /**********************************************************************************************************************/
    function createTree() {
        $.ajax({
            async: true,
            type: 'GET',
            dataType: 'json',
            url: '/api/sensor/tree?type=group'
        }).done(function(items) {
            if(items && items.length === 0) return;

            let tree_data = [];
            items.forEach(function(item) {
                const inserted_data = {
                    id: item.id,
                    pid: item.pid,
                    name: item.name,
                    open: (item.pid === null || item.pid === 'G_0') ? true : false,
                    icon: getTreeIconName(item.icon, (item.isAvailable === 'Y' ? item.level : 6)),
                    type: (item.id.substr(0, 1) === 'G') ? 'group' : (item.id.substr(0, 1) === 'E') ? 'equipment' : 'sensor',
                    current_level: item.level,
                    iconName: item.icon,
                    pd_equip_id: item.pd_equip_id,
                    is_available: item.isAvailable,
                    equip_code: item.equip_code,
                    equip_type: item.equip_type
                };

                tree_data.push(inserted_data);
            });

            m_tree = $.fn.zTree.init($(tree_id), m_tree_setting, tree_data);
        }).fail(function(err) {
            console.error(err);
        }).always(function(items) {
            if(items === undefined) return;

            // by shkoh 20210503: 모니터링 페이지에서 임계치설정 페이지로 바로 이동 시, 해당 설비를 자동 체크
            $.get('/sensor', function(data, status, xhr) {
                if(status === 'success') {
                    const equip_id = getUrlParameter('equipId');
                    if(equip_id === undefined) return;

                    checkTreeNode('E_' + equip_id);
                }
            });
        });
    }

    function destroyTree() {
        $.fn.zTree.destroy();
        m_tree = undefined;
    }
    /**********************************************************************************************************************/
    /* by shkoh 20210503: tree view init end                                                                              */
    /**********************************************************************************************************************/

    /**********************************************************************************************************************/
    /* by shkoh 20210503: ztree controller function start                                                                 */
    /**********************************************************************************************************************/
    function checkTreeNode(equip_id) {
        const node = m_tree.getNodeByParam('id', equip_id, null);
        if(node) {
            m_tree.checkNode(node, true, true, true);
            expandNode(node.getParentNode());
        }
    }

    function getCheckedNodes() {
        return m_tree.getCheckedNodes(true);
    }

    function uncheckAllTreeNodes() {
        if(m_tree === undefined) return;
        // by shkoh 20210503: tree 내 체크가 표시된 모든 node를 해제함
        m_tree.checkAllNodes(false);
    }

    function expandNode(parent_node) {
        // by shkoh 20210503: parent_node에서 접혀있다면 해당 node의 자식 노드들을 모두 펼침
        m_tree.expandNode(parent_node, true, false, false);
    }
    /**********************************************************************************************************************/
    /* by shkoh 20210503: ztree controller function end                                                                   */
    /**********************************************************************************************************************/

    /**********************************************************************************************************************/
    /* by shkoh 20210503: tree view inline function start                                                                 */
    /**********************************************************************************************************************/
    function getTreeIconName(icon, level) {
        return m_img_path + icon + '_L_' + level + '.png';
    }

    function getUrlParameter(searching_parameter) {
        const locate = location.search;

        if(locate.indexOf('?') === -1) return undefined;

        const parameter = locate.split('?')[1];
        const parameter_array = parameter.split('&');
        for(let param of parameter_array) {
            const term = param.split('=');
            if(term[0] === searching_parameter) return term[1];
        }

        return undefined;
    }

    /**
     * by shkoh 20210503: 주어진 정보(info)를 토대로 Tree Node를 업데이트함
     * @param {Object} info tree 내 항목을 update 하기 위한 정보
     */
    function updateTreeNode(info) {
        if(m_tree === undefined) return;

        // by shkoh 20210503: 서버로부터 전달받은 info의 id 추출. group / equipment 2종류의 변경 내용이 전달됨
        // by shkoh 20210503: 해당 id로부터 변경할 node를 추출함
        const id = (info.type === 'group' ? 'G_' : 'E_') + info.id;
        
        let update_node = m_tree.getNodeByParam('id', id, null);
        if(update_node === null || update_node === undefined) return;

        let is_sorting = false;

        // by shkoh 20210503: node의 이름이 변경됐을 경우에 이름을 변경하고 이름에 따라서 재정렬함
        if(info.name && info.name !== update_node.name) {
            update_node.naem = info.name;
            is_sorting = true;
        }

        if(info.icon) {
            update_node.iconName = info.icon;
            update_node.icon = getTreeIconName(info.icon, update_node.current_level);
        }

        // by shkoh 20210503: tree notify 정보에서 level이 존재할 경우에, 해당 level로 아이템을 자동변경함
        // by shkoh 20210503: icon이 존재할 경우에는 해당 icon의 변경이 먼저 이루어짐
        if(info.level !== undefined) {
            update_node.current_level = info.level;
            update_node.icon = getTreeIconName(update_node.iconName, info.level);
        }

        // by shkoh 20210503: 변경될 항목 중에서 icon이 존재하고 [사용여부]가 변경됐을 경우에는 해당 부분으로 변경
        if(info.icon && info.is_available && info.is_available !== update_node.is_available) {
            update_node.is_available = info.is_available;
            update_node.icon = getTreeIconName(info.icon, (info.is_available === 'Y' ? update_node.current_level : 6));
        }

        m_tree.updateNode(update_node);

        // by shkoh 20210503: 새로운 트리정보에서 그룹 ID가 변경되었고, 지정된 부모 노드가 존재한다면 새로운 부모 노드의 아래로 이동함
        let parent_node = m_tree.getNodeByParam('id', 'G_' + info.pid, null);
        if(info.pid !== undefined && update_node.pid !== 'G_' + info.pid) {
            if(parent_node) {
                update_node.pid = 'G_' + info.pid;
                m_tree.moveNode(parent_node, update_node, 'inner', false);
                is_available = true;
            }
        }

        // by shkoh 20210503: name이 변경되었거나, 그룹 ID가 변경된 경우에는 해당 Tree 항목을 재정렬함
        if(is_sorting && parent_node) sortTree(m_tree, parent_ndoe, update_node);
    }

    /**
     * by shkoh 20210504: p_node 하위의 설비 속성과 명칭에 따라서 정렬 진행
     * 
     * @param {Object} tree sort를 진행할 Tree Object
     * @param {Object} p_node 정렬이 필요한 Tree 노드의 기준이 될 부모 노드
     * @param {Object} c_node 정렬의 기준으로 삼을 기준 노드
     */
    function sortTree(tree, p_node, c_node) {
        let nodes = tree.getNodesByParam('pid', p_node.id, p_node);

        nodes.some(function(node) {
            let is_move = false;

            if(node.type === c_node.type && node.name !== c_node.name) {
                const node_name_length = node.name.length;
                const c_node_name_length = c_node.name.length;

                const text_length = Math.min(node_name_length, c_node_name_length);
                
                let idx = 0;
                for(idx = 0; idx < text_length; idx++) {
                    let node_char_code = node.name.toUpperCase().charCodeAt(idx);
                    let c_node_char_code = c_node.name.toUpperCase().charCodeAt(idx);

                    // by shkoh 20210503: 2개의 코드 값이 다른 경우에만 비교
                    // by shkoh 20210503: 추가 / 수정된 노드가 비교 노드보다 큰 경우에만 노드 변경을 수행
                    // by shkoh 20210503: 비교 노드보다 작은 경우에는 변경 작업을 하지 않음
                    if(node_char_code !== c_node_char_code) {
                        if(node_char_code < c_node_char_code) is_move = true;

                        break;
                    }
                }
                
                if(is_move === false && idx === text_length && node_name_length < c_node_name_length) is_move = true;
            } else if(node.type < c_node.type && c_node.type === 'group') {
                // by shkoh 20210503: 그룹노드가 추가/변경이 된 경우에는 가장 우선 배치된 설비 앞에 배치를 한 후에 정렬 작업을 마침
                tree.moveNode(node, c_node, 'prev', false);
                return true;
            }

            if(is_move) tree.moveNode(node, c_node, 'next', false);
        });
    }
    /**********************************************************************************************************************/
    /* by shkoh 20210503: tree view inline function end                                                                   */
    /**********************************************************************************************************************/

    return {
        Create: function() { createTree(); },
        Destroy: function() { destroyTree(); },
        GetCheckedNodes: function() { return getCheckedNodes(); },
        UncheckAllTreeNodes: function() { uncheckAllTreeNodes(); },
        ExpandNode: function(parent_node) { expandNode(parent_node); },
        RedrawTree: function(info) {
            switch(info.command) {
                case 'notify': {
                    if(info.type && info.type !== 'sensor') updateTreeNode(info);
                    break;
                }
            }
        }
    }
}