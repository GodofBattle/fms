const Tree = function(_id, _options) {
    const id = _id;
    let options = {
        importedItems: undefined
    };

    options = _options;

    const m_img_path = '/img/tree/';

    const m_tree_setting = {
        view: {
            showLine: false,
            nameIsHTML: true,
            fontCss: function(treeId, treeNode) {
                if(treeNode.is_available === 'Y')
                    return { 'text-decoration': 'none', opacity: treeNode.chkDisabled ? 0.6 : 1 };
                else
                    return { 'text-decoration': 'line-through', opacity: 0.6 }
            }
        },
        check: {
            enable: true,
            nocheckInherit: true,
            chkboxType: { 'Y': 'ps', 'N': 'ps' }
        },
        data: {
            simpleData: {
                enable: true,
                idKey: 'id',
                pIdKey: 'pid'
            }
        },
        async: { enable: true }
    }

    let m_tree = undefined;

    /*****************************************************************************************************************/
    /* by shkoh 20230825: create tree view start                                                                     */
    /*****************************************************************************************************************/
    function createTree(e_ids) {
        displayLoading();

        $(id).html('');
        
        const innerHtml = '<div id="i-group-tree" class="ztree"></div>';
        $(id).html(innerHtml);

        $(id).mCustomScrollbar({
            theme: 'minimal-dark',
            axis: 'xy',
            scrollbarPosition: 'outside',
            mouseWheel: {
                preventDefault: true
            }
        });

        createGroupTree('#i-group-tree', e_ids);
    }

    function createGroupTree(element_id, e_ids) {
        $.ajax({
            async: true,
            type: 'GET',
            url: '/api/wrfis/icomer/tree?type=group'
        }).done(function(items) {
            if(!items) return;
            if(items && items.length === 0) return;

            let tree_data = [];
            items.forEach(function(item) {
                const item_type = item.id.substr(0, 1);
                const type = (item_type === 'G') ? 'group' : (item_type === 'E') ? 'equipment' : 'sensor';

                const { id, pid, name, icon, isAvailable, level, sensor_type, pd_equip_id, equip_code, equip_type } = item;

                const insert_item = {
                    id,
                    pid,
                    name,
                    open: pid === null || pid === 'G_0' ? true : false,
                    icon: getTreeIconName(icon, isAvailable === 'Y' ? level : 6),
                    type,
                    current_level: level,
                    iconName: icon,
                    chkDisabled: item_type !== 'S' ? false : true,
                    pd_equip_id,
                    is_available: isAvailable,
                    equip_code,
                    equip_type
                };

                let is_add = false;
                if(options.code === undefined || options.code.length === 0 || type === 'group') is_add = true;
                else is_add = options.code.includes(equip_code);

                if(is_add) tree_data.push(insert_item);
            });

            m_tree = $.fn.zTree.init($(element_id), m_tree_setting, tree_data);
        }).fail(function(err) {
            undisplayLoading();
            console.error('[Fail to create the Group Tree] ' + err.responseText);
        }).then(function() {
            undisplayLoading();
            
            if(e_ids.length > 0) {
                checkedTreeNodes(e_ids);
            }
        });
    }

    function destroyTree() {
        $.fn.zTree.destory();
        m_tree = undefined;
    }
    /*****************************************************************************************************************/
    /* by shkoh 20230825: create tree view end                                                                       */
    /*****************************************************************************************************************/

    /*****************************************************************************************************************/
    /* by shkoh 20230825: ztree control start                                                                        */
    /*****************************************************************************************************************/
    function displayLoading() {
        kendo.ui.progress($(id), true);
    }

    function undisplayLoading() {
        kendo.ui.progress($(id), false);
    }

    function getTreeIconName(icon, level) {
        return m_img_path + icon + '_L_' + level + '.png';
    }

    function getCheckedNodes() {
        return m_tree.getCheckedNodes(true);
    }

    function setCheckNode(id, checked, checkType) {
        const node = m_tree.getNodeByParam('id', id, null);
        if(node) {
            m_tree.checkNode(node, checked, checkType, true);
        }
    }
    
    function expandNode(id) {
        const node = m_tree.getNodeByParam('id', id, null);
        if(node && node.getParentNode()) {
            m_tree.expandNode(node.getParentNode(), true, false, false);
        }
    }

    function checkedTreeNodes(e_ids) {
        e_ids.forEach(function(id) {
            setCheckNode('E_' + id);
            expandNode('E_' + id);
        });
    }

    function updateTreeNode(info) {
        updateGroupTreeNode(info);
    }

    function updateGroupTreeNode(info) {
        if(m_tree == undefined) return;

        const id = (info.type == 'group' ? 'G_' : 'E_') + info.id;
        let node = m_tree.getNodeByParam('id', id, null);

        if(node == null || node == undefined) {
            return;
        }

        let isSorting = false;

        // by shkoh 20230829: 새로운 트리정보에서 name 항목이 존재하고 기존 name과 다르면, 해당 내용 반영 후 정렬 진행
        if(info.name && info.name != node.name) {
            node.name = info.name;
            isSorting = true;
        }

        // by shkoh 20230829: 새로운 icon이 변경되었다면, 새로운 iconName으로 icon변경
        if(info.icon) {
            node.iconName = info.icon;
            node.icon = getTreeIconName(info.icon, (info.is_available == 'Y' ? node.current_level : 6));
        }
        
        if(info.level != undefined) {
            // by shkoh 20230829: 새로운 level이 변경되었다면, 새로운 level로 icon 변경
            node.current_level = info.level;
            node.icon = getTreeIconName(node.iconName, info.level);
        }

        // by shkoh 20181206: 아이콘과 사용여부가 설정되어 있고, 기존의 사용여부와 현재의 사용여부가 다르면
        if(info.icon && info.is_available && info.is_available != node.is_available) {
            node.is_available = info.is_available;
            node.icon = getTreeIconName(info.icon, (info.is_available == 'Y' ? node.current_level : 6));
        }

        m_tree.updateNode(node);
        
        // by shkoh 20230829: 새로운 트리정보에서 그룹 ID가 변경되었고 지정된 부모노드가 존재하다면 새로운 부모 노드 아래로 이동
        let parent_node = m_tree.getNodeByParam('id', 'G_' + info.pid, null);
        if(info.pid != undefined && node.pid != 'G_' + info.pid) {
            if(parent_node) {
                node.pid = 'G_' + info.pid;
                m_tree.moveNode(parent_node, node, 'inner', false);
                isSorting = true;
            }
        }

        // by shkoh 20180920: name이 변경되었거나, 그룹 ID가 변경된 경우에 Tree 리스트를 정렬함
        if(isSorting && parent_node) sortTree(m_tree, parent_node, node);
    }

    function sortTree(tree, p_node, c_node) {
        let nodes = tree.getNodesByParam('pid', p_node.id, p_node);

        nodes.some(function(node) {
            let isMove = 0;

            if(node.type == c_node.type && node.name != c_node.name) {
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
            } else if(node.type < c_node.type && c_node.type == 'group') {
                // by shkoh 20181114: 그룹노드가 추가/변경이 된 경우에는 가장 우선 배치된 설비 앞에 배치한 후 정렬 작업을 마침
                tree.moveNode(node, c_node, 'prev', false);
                return true;
            }

            if(isMove == 2) tree.moveNode(node, c_node, 'next', false);
            else if(isMove == 1) {
                tree.moveNode(node, c_node, 'prev', false);
                return true;
            }
        });
    }
    /*****************************************************************************************************************/
    /* by shkoh 20230825: ztree control end                                                                          */
    /*****************************************************************************************************************/

    return {
        CreateTree: function(e_ids) { createTree(e_ids); },
        DestroyTree: function() { destroyTree(); },
        GetCheckedNodes: function() { return getCheckedNodes(); },
        RedrawTree: function(info) {
            switch(info.command) {
                case 'notify': {
                    if(info.type && info.type !== 'sensor') {
                        updateTreeNode(info);
                    }
                    break;
                }
            }
        }
    }
}