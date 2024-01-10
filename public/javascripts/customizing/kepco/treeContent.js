const TreeViewContent = function(_id, _options) {
    const id = _id;
    let options = {
        code: undefined,
        pdEquipId: undefined,
        onCheck: undefined,
        hasAddButton: false,
        onAdd: undefined
    }
    
    options = _options;
    
    const m_img_path = '/img/tree/';

    const m_tree_setting = {
        view: {
            showLine: true,
            fontCss: function(treeId, treeNode) {
                if(treeNode.is_available === 'Y') return { 'text-decoration': 'none', 'opacity': treeNode.chkDisabled ? 0.6 : 1 };
                else return { 'text-decoration': 'line-through', 'opacity': 0.6 };
            },
            addHoverDom: addHoverDom,
            removeHoverDom: removeHoverDom
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
            onBeforeClick: undefined,
            onClick: undefined,
            onCheck: options.onCheck
        }
    }

    let m_tree = undefined;

    /***************************************************************************************************************************************/
    /* by shkoh 20200814: create tree view start                                                                                           */
    /***************************************************************************************************************************************/
    function createTreeView() {
        $(id).html('');
        
        const tree_id = id.slice(1) + '-z';
        const inner_html = '<div id="' + tree_id + '" class="ztree"></div>'

        $(id).html(inner_html);
        $(id).mCustomScrollbar({
            theme: 'minimal-dark',
            axis: 'xy',
            scrollbarPosition: 'outside',
            mouseWheel: { preventDefault: true }
        });

        createTreeNode('#' + tree_id);
    }

    function createTreeNode(tree_id) {
        $.ajax({
            async: true,
            type: 'GET',
            url: '/api/reports/tree?type=group'
        }).done(function(data) {
            const tree_data = [];
            data.forEach(function(d) {
                const type = (d.id.substr(0, 1) === 'G') ? 'group' : (d.id.substr(0, 1) === 'E') ? 'equipment' : 'sensor';
                const inserted_item = {
                    id: d.id,
                    pid: d.pid,
                    name: d.name,
                    open: (d.pid === null || d.pid === 'G_0') ? true : false,
                    icon: getTreeIconName(d.icon, (d.isAvailable === 'Y' ? 0 : 6)),
                    type: type,
                    current_level: d.level,
                    iconName: d.icon,
                    pd_equip_id: d.pd_equip_id,
                    is_available: d.isAvailable,
                    equip_code: d.equip_code,
                    equip_type: d.equip_type
                }

                // by shkoh 20200814: Tree를 생성할 때, 특정 설비만 지정하여 Tree를 구성할 때, 우선 group은 모두 추가하나, 설비는 지정된 설비만을 추가함
                // by shkoh 20200814: 우선 추가된 group에서 자식 node를 가지고 있지 않은 그룹만 따로 숨기는 작업을 수행함
                let is_add = false;
                if(type === 'group') {
                    is_add = true;
                } else if((options.code && options.code.includes(d.equip_code)) && options.pdEquipId === undefined) {
                    is_add = true;
                } else if((options.pdEquipId && options.pdEquipId.includes(d.pd_equip_id)) && options.code === undefined) {
                    is_add = true; 
                } else if((options.code && options.code.includes(d.equip_code)) && (options.pdEquipId && options.pdEquipId.includes(d.pd_equip_id))) {
                    is_add = true;
                } else if(options.code === undefined && options.pdEquipId === undefined) {
                    is_add = true;
                }
                
                if(is_add) tree_data.push(inserted_item);
            });
            
            m_tree = $.fn.zTree.init($(tree_id), m_tree_setting, tree_data);
        }).fail(function(err) {
            console.error(err);
        }).then(function() {
            // by shkoh 20200814: options.code가 존재할 때, 즉 특정 코드를 가지고 있는 설비 Tree만이 필요한 경우에 해당 부분을 필터링할 필요가 있다
            if((options.code && options.code.length > 0) || (options.pdEquipId && options.pdEquipId.length > 0)) {
                filterTreeWithCode();
                
                if(options.pdEquipId && options.pdEquipId[0] === 123) expandAllTreeNode();

                // by shkoh 20210428: 우리FIS 구조에 맞춰서 Tree를 펼침. 경우에 따라서 해당 내용을 사용하지 않아도 됨
                if(options.code.includes('E0001') || options.code.includes('E0002')) {
                    const node = m_tree.getNodeByParam('equip_code', options.code);
                    
                    expandTree(node.getParentNode().getParentNode().id);
                }
            }
        });
    }
    /***************************************************************************************************************************************/
    /* by shkoh 20200814: create tree view end                                                                                             */
    /***************************************************************************************************************************************/

    /***************************************************************************************************************************************/
    /* by shkoh 20200814: inline function start                                                                                            */
    /***************************************************************************************************************************************/
    function getTreeIconName(icon, level) {
        return m_img_path + icon + '_L_' + level + '.png';
    }

    function filterTreeWithCode() {
        // by shkoh 20210420: 그룹 중에서 자식노드가 없는 항목들을 반복적으로 검색하여 최종적으로 남을 때까지 삭제하여 원하는 노드들만 남김
        let has_not_children = m_tree.getNodesByFilter(function(node) {
            let is_matching = false;
            
            if(node.type === 'group' && !node.children) is_matching = true;
            else if(node.type === 'group' && node.children && node.children.length === 0) is_matching = true;
            
            return is_matching;
        });

        while(has_not_children.length !== 0) {
            has_not_children.forEach(function(node) {
                m_tree.removeNode(node);
            });

            has_not_children = m_tree.getNodesByFilter(function(node) {
                let is_matching = false;
            
                if(node.type === 'group' && !node.children) is_matching = true;
                else if(node.type === 'group' && node.children && node.children.length === 0) is_matching = true;
                
                return is_matching;
            });
        }
    }

    function getCheckedNodes() {
        if(m_tree === undefined) return undefined;
        return m_tree.getCheckedNodes(true);
    }

    function getNodeNameById(_id) {
        if(m_tree === undefined) return '';
        return m_tree.getNodeByParam('id', 'E_' + _id).name;
    }

    function expandTree(id) {
        let p_node = null;
        if(id === null) p_node = m_tree.getNodeByParam('pid', null);
        else p_node = m_tree.getNodeByParam('id', id);
        
        m_tree.expandNode(p_node, true);
    }

    function expandAllTreeNode() {
        m_tree.expandAll(true);
    }

    function addHoverDom(treeId, treeNode) {
        if(!options.hasAddButton || treeNode.type === 'group' || treeNode.editNameFlag || !treeNode.isHover || $('#' + treeNode.tId + '_add').length > 0) {
            return;
        }

        const span_obj = $('#' + treeNode.tId + '_span');
        const add_html = '<span class="button add" id="' + treeNode.tId + '_add" title="[' + treeNode.name + '] 작업 추가"></span>';
        span_obj.after(add_html);
        
        const add_button = $('#' + treeNode.tId + '_add');
        if(add_button) add_button.on('click', function() { options.onAdd(treeNode); });
    }

    function removeHoverDom(treeId, treeNode) {
        $('#' + treeNode.tId + '_add').off('click').remove();
    }
    /***************************************************************************************************************************************/
    /* by shkoh 20200814: inline function end                                                                                              */
    /***************************************************************************************************************************************/
    
    return {
        CreateTreeView: function() { createTreeView(); },
        GetCheckedNodes: function() { return getCheckedNodes(); },
        GetNodeNameById: function(_id) { return getNodeNameById(_id); },
        ExpandTree: function(id) { return expandTree(id); }
    }
}