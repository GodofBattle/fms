const TreeViewContent = function(_id, _options) {
    const tree_id = _id;
    let options = {
        onClick: undefined,
        onSelectRootNode: undefined
    }

    options = _options;

    const m_img_path = '/img/tree/';

    const m_tree_setting = {
        view: {
            showLine: true,
            fontCss: function(treeId, treeNode) {
                return treeNode.is_available == 'Y' ? { 'text-decoration': 'none', opacity: 1 } : { 'text-decoration': 'line-through', opacity: 0.6 }
            }
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
            onClick: options.onClick
        }
    }

    let m_group_tree = undefined;

    function createTreeView() {
        $(tree_id).html('');

        const innerHtml =
        '<div id="group-tree" class="ztree"></div>';

        $(tree_id).html(innerHtml);

        $(tree_id).mCustomScrollbar({
            theme: 'minimal-dark',
            axis: 'xy',
            scrollbarPosition: 'outside',
            mouseWheel: {
                preventDefault: true
            }
        });

        createGroupTree('#group-tree');
    }

    function createGroupTree(id) {
        $.ajax({
            async: true,
            type: 'GET',
            url: '/api/alarm/dashboard/tree'
        }).done(function(items) {
            if(items && items.length == 0) return;

            let tree_data = [];
            items.forEach(function(item) {
                tree_data.push({
                    id: item.id,
                    pid: item.pid,
                    name: item.name,
                    open: (item.pid == null || item.pid == 'G_0') ? true : false,
                    icon: getTreeIconName(item.icon, (item.isAvailable == 'Y' ? item.level : 6)),
                    type: (item.id.substr(0, 1) == 'E') ? 'equipment' : 'group',
                    current_level: item.level,
                    iconName: item.icon,
                    pd_equip_id: item.pd_equip_id,
                    is_available: item.isAvailable,
                    equip_code: item.equip_code,
                    equip_type: item.equip_type
                });
            });

            m_group_tree = $.fn.zTree.init($(id), m_tree_setting, tree_data);
        }).fail(function(xhr) {
            console.error('[Fail to create the Group Tree] ' + xhr.responseText);
        }).always(function() {
            const root_node = getRootNodeInfo();
            selectTreeNode(root_node.id);
            
            const params = {
                id: root_node.id,
                parent_id: root_node.pid,
                name: root_node.name,
                type: root_node.type,
                kind: root_node.iconName
            }
            options.onSelectRootNode(params);
        });
    }

    /***************************************************************************************************************/
    /* by shkoh 20190211: Tree View - zTree Controll Start                                                         */
    /***************************************************************************************************************/
    function getTreeIconName(icon, level) {
        return m_img_path + icon + '_L_' + level + '.png';
    }

    function getRootNodeInfo() {
        if(m_group_tree == undefined) return undefined;
        // by shkoh 20190212: pid가 null인 Tree Node는 루트노드이다
        return m_group_tree.getNodeByParam('pid', null);
    }

    function selectTreeNode(id) {
        if(m_group_tree == undefined) return;

        const node = m_group_tree.getNodeByParam('id', id, null);
        m_group_tree.selectNode(node, false, true);
    }

    function searchEquipmentNodes(parent_id) {
        if(m_group_tree == undefined) return [];

        const parent_node = m_group_tree.getNodeByParam('id', parent_id, null);
        return m_group_tree.getNodesByParam('type', 'equipment', parent_node);
    }

    /**
     * 주어진 정보(info)를 토대로 Tree Node를 업데이트함
     * 
     * @param {JSON} info update를 위한 Tree 정보
     */
    function updateTreeNode(info) {
        if(m_group_tree == undefined) return;

        const id = (info.type == 'group' ? 'G_' : 'E_') + info.id;
        let node = m_group_tree.getNodeByParam('id', id, null);

        if(node == null || node == undefined) return;

        let isSorting = false;

        // by shkoh 20190213: 새로운 트리정보에서 name 항목이 존재하고 기존 name 정보와 다르면, 해당 내용 반영 후 정렬 진행
        if(info.name && info.name != node.name) {
            node.name = info.name;
            isSorting = true;
        }

        // by shkoh 20190213: 새로운 icon이 변경되었다면, 새로운 iconName으로 icon변경
        if(info.icon) {
            node.iconName = info.icon;
            node.icon = getTreeIconName(info.icon, node.current_level);
        }

        // by shkoh 20190213: 새로운 level이 변경되었다면, 새로운 level로 icon 변경
        if(info.level != undefined) {
            node.current_level = info.level;
            node.icon = getTreeIconName(node.iconName, info.level);
        }

        // by shkoh 20190213: 아이콘의 사용여부가 설정되어 있고, 기존의 사용여부와 현재의 사용여부가 다르다면
        if(info.icon && info.is_available && info.is_available != node.is_available) {
            node.is_available = info.is_available;
            node.icon = getTreeIconName(info.icon, (info.is_available == 'Y' ? node.current_level : 6));
        }

        m_group_tree.updateNode(node);

        // by shkoh 20190213: 새로운 트리정보에서 그룹 ID가 변경되었고 지정된 부모노드가 존재하면 새로운 부모 노드 아래로 이동
        let parent_node = m_group_tree.getNodeByParam('id', 'G_' + info.pid, null);
        if(info.pid != undefined && node.pid != 'G_' + info.pid) {
            if(parent_node) {
                node.pid = 'G_' + info.pid;
                m_group_tree.moveNode(parent_node, node, 'inner', false);
                isSorting = true;
            }
        }

        // by shkoh 20190213: name이 변경되었거나, 그룹 ID가 변경된 경우에 Tree 리스트를 정렬함
        if(isSorting && parent_node) sortTree(m_group_tree, parent_node, node);
    }

    /**
     * p_node 하위의 설비 속성과 명칭에 대해서 정렬을 진행함
     * 
     * @param {Object} tree sort를 진행할 Tree 객체
     * @param {Object} p_node sort를 진행할 부모 노드
     * @param {Object} c_node 정렬의 기준일 될 기준 노드
     */
    function sortTree(tree, p_node, c_node) {
        let nodes = tree.getNodesByParam('pid', p_node.id, p_node);

        nodes.some(function(node) {
            let isMove = false;

            if(node.type == c_node.type && node.name != c_node.name) {
                const node_name_length = node.name.length;
                const c_node_name_length = c_node.name.length;

                const text_length = Math.min(node_name_length, c_node_name_length);
                let idx = 0;
                
                for(idx = 0; idx < text_length; idx++) {
                    let node_char_code = node.name.toUpperCase().charCodeAt(idx);
                    let c_node_char_code = c_node.name.toUpperCase().charCodeAt(idx);

                    // by shkoh 20190213: 2개의 코드 값이 다른 경우에만 비교하며,
                    // by shkoh 20190213: 추가/수정된 노드가 비교 노드보다 큰 경우에만 노드 변경을 수행
                    // by shkoh 20190213: 비교 노드보다 작은 경우에는 변경 작업을 하지 않음
                    if(node_char_code != c_node_char_code) {
                        if(node_char_code < c_node_char_code) {
                            isMove = true;
                        }
                        
                        break;
                    }
                }
                
                if(isMove == false && idx == text_length && node_name_length < c_node_name_length) isMove = true;
            } else if(node.type < c_node.type && c_node.type == 'group') {
                // by shkoh 20190213: 그룹노드가 추가/변경이 된 경우에는 가장 우선 배치된 설비 앞에 배치한 후 정렬 작업을 마침
                tree.moveNode(node, c_node, 'prev', false);
                return true;
            }

            if(isMove) tree.moveNode(node, c_node, 'next', false);
        });
    }
    /***************************************************************************************************************/
    /* by shkoh 20190211: Tree View - zTree Controll End                                                           */
    /***************************************************************************************************************/

    return {
        CreateTreeView: function() { createTreeView(); },
        
        SearchEquipmentNodes: function(parent_id) { return searchEquipmentNodes(parent_id); },
        
        RedrawTree: function(info) {
            switch(info.command) {
                case 'notify':
                    if(info.type && info.type != 'sensor') updateTreeNode(info);
                break;
            }
        }
    }
}