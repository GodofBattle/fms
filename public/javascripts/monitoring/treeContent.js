const TreeViewContent = function(_id, _options) {
    const tree_id = _id;
    let options = {
        onClick: undefined,
        onRightClick: undefined,
        onRadioEquipTree: undefined,
        onRadioGroupTree: undefined
    };

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
        callback: {
            onClick: options.onClick,
            onRightClick: options.onRightClick,
            onExpand: onTreeExpandAndCollapse,
            onCollapse: onTreeExpandAndCollapse,
            onRemove: onTreeRemove
        },
        async: { enable: false }
    }
    
    let m_group_tree = undefined;
    let m_equip_tree = undefined;
    let m_treeview_slider = undefined;

    /***************************************************************************************************************/
    /* by shkoh 20180607: Tree View - Initialization Start                                                         */
    /***************************************************************************************************************/
    function createTreeView(selected_id) {
        $(tree_id).html('');

        const innerHtml =
        '<div id="item_title_bar" class="grid-tree item-title grid-item-draggable">' +  
            '<h3>' +
                '<span id="item-title-tree">그룹 리스트</span>' +
                '<span class="panel_close_icon"></span>' +
            '</h3>' +
        '</div>' +
        '<div id="radioTree" class="btn-group" data-toggle="buttons">' +
            '<label id="radioEquipTree" class="btn btn-radio">' +
                '<input type="radio" name="treeOptions" autocomplete="off">설비별 보기' +
            '</label>' +
            '<label id="radioGroupTree" class="btn btn-radio active">' +
                '<input type="radio" name="treeOptions" autocomplete="off" checked>그룹으로 보기' +
            '</label>' +                
        '</div>' +
        '<div id="grid-tree-content" class="item-content">' +
            '<ul id="tree-slider" class="bxslider">' +
                '<li>' +
                    '<div id="group-tree" class="ztree"></div>' +
                '</li>' +
                '<li>' +
                    '<div id="equip-tree" class="ztree"></div>' +
                '</li>' +
            '</ul>' +
        '</div>';

        $(tree_id).html(innerHtml);

        $('#grid-tree-content').mCustomScrollbar({
            theme: 'minimal-dark',
            axis: 'y',
            scrollbarPosition: 'outside',
            mouseWheel: {
                preventDefault: true
            },
            keyboard: {
                enable: false
            }
        });

        $("#radioEquipTree").on("click", options.onRadioEquipTree);
        
        $("#radioGroupTree").on("click", options.onRadioGroupTree);

        createSlider('#tree-slider');

        const create_group_tree = createGroupTree('#group-tree');
        const create_equip_tree = createEquipTree('#equip-tree');

        Promise.all([ create_group_tree, create_equip_tree ]).then(function() {
            // by shkoh 20180831: selected_id를 설정한 채로 tree_view를 시작하면 tree를 만든 후에 자동으로 해당 tree를 선택함
            if(selected_id != undefined) selectTreeNode(selected_id);
            else reloadSliderTreeView();
        });
    }

    function createSlider(id) {
        m_treeview_slider = $(id).bxSlider({
            mode: 'fade',
            auto: false,
            pager: false,
            controls: false,
            speed: 50,
            touchEnabled: false,
            adaptiveHeight: true,
            adaptiveHeightSpeed: 200,
            wrapperClass: 'treeView-slider-wrapper'
        });
    }

    function createGroupTree(id) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                async: true,
                type: 'GET',
                url: '/api/monitoring/tree?type=group'
            }).done(function(items) {
                if(items == undefined) return;
                
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
                        is_available: item.isAvailable
                    });
                });
    
                m_group_tree = $.fn.zTree.init($(id), m_tree_setting, tree_data);
    
            }).fail(function(xhr) {
                console.error('[Fail to create the Group Tree] ' + xhr.responseText);
            }).always(function() {
                resolve();
            });
        });
    }

    function createEquipTree(id) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                async: true,
                type: 'GET',
                url: '/api/monitoring/tree?type=code'
            }).done(function(items) {
                if(items == undefined) return;

                let tree_data = [];
                items.forEach(function(item) {
                    tree_data.push({
                        id: item.id,
                        pid: item.pid,
                        name: item.name,
                        open: false,
                        icon: getTreeIconName(item.icon, (item.isAvailable == 'Y' ? item.level : 6)),
                        type: (item.id.substr(0, 1) == 'E') ? 'equipment' : 'code',
                        current_level: item.level,
                        iconName: item.icon,
                        pd_equip_id: item.pd_equip_id,
                        equip_code: item.equip_code,
                        is_available: item.isAvailable
                    });
                });
    
                m_equip_tree = $.fn.zTree.init($(id), m_tree_setting, tree_data);
            }).fail(function(xhr) {
                console.error('[Fail to create the Equipment Tree] ' + xhr.responseText);
            }).always(function() {
                resolve();
            });
        });
    }

    function treeViewContentResizing() {
        const tree_view_h = parseFloat($('#grid-tree').height());
        const title_h = parseFloat($('#item_title_bar').height());
        const radio_btn_h = parseFloat($('#radioTree').height());        

        $('#grid-tree-content').height(tree_view_h - title_h - radio_btn_h - 16);
    }
    /***************************************************************************************************************/
    /* by shkoh 20180607: Tree View - Initialization End                                                           */
    /***************************************************************************************************************/

    /***************************************************************************************************************/
    /* by shkoh 20180607: Tree View - zTree Controll Start                                                         */
    /***************************************************************************************************************/
    function getTreeIconName(icon, level) {
        return m_img_path + icon + '_L_' + level + '.png';
    }

    function onTreeExpandAndCollapse(event, treeId, treeNode) {
        reloadSliderTreeView();
    }

    function onTreeRemove(event, treeId, treeNode) {
        reloadSliderTreeView();
    }

    function getCurrentSelectionTreeNodeInfo() {
        if(m_treeview_slider.getCurrentSlide() == 0) {
            return m_group_tree == undefined ? undefined : m_group_tree.getSelectedNodes()[0];
        } else {
            return m_equip_tree == undefined ? undefined : m_equip_tree.getSelectedNodes()[0];
        }
    }

    function selectTreeNode(id) {
        const tree = m_treeview_slider.getCurrentSlide() == 0 ? m_group_tree : m_equip_tree;
        if(tree == undefined) return;
        
        const node = tree.getNodeByParam('id', id, null);
        tree.selectNode(node, false, true);

        reloadSliderTreeView();
    }

    function getTreeNodeInfo(id) {
        const tree = m_treeview_slider.getCurrentSlide() == 0 ? m_group_tree : m_equip_tree;
        if(tree == undefined) return;
        
        const node = tree.getNodeByParam('id', id, null);
        return node;
    }

    function unselectTreeNode() {
        const selected_node = getCurrentSelectionTreeNodeInfo();
        if(selected_node == undefined) return;

        const tree = m_treeview_slider.getCurrentSlide() == 0 ? m_group_tree : m_equip_tree;
        if(tree == undefined) return;

        tree.cancelSelectedNode(selected_node);
    }

    /**
     * 해당 id와 동일한 트리노드를 확장함
     * 
     * @param {String} id 확장하기 위한 Tree Node의 id(G_XXX 형식)
     */
    function expandTreeNode(id) {
        const tree = m_treeview_slider.getCurrentSlide() == 0 ? m_group_tree : m_equip_tree;
        if(tree == undefined) return;

        const expand_node = getTreeNodeInfo(id);
        if(expand_node == undefined) return;

        tree.expandNode(expand_node, true, false, false, true);
    }

    /**
     * TreeNode에 info 정보에 따라서 node를 추가함
     * 
     * @param {JSON} add_info treeNode에 추가하기 위한 node 정보
     */
    function addTreeNode(add_info) {
        addGroupTreeNode(add_info);
        if(add_info.type != 'group') addEquipmentTreeNode(add_info);
    }

    /**
     * 그룹트리에서 새로운 노드를 추가함
     * 
     * @param {JSON} info 그룹트리에 추가할 노드정보
     */
    function addGroupTreeNode(info) {
        if(m_group_tree == undefined) return;

        const parent_node = m_group_tree.getNodeByParam('id', 'G_' + info.pid, null);
        if(parent_node == null) return;

        const add_node_info = {
            id: (info.type == 'group' ? 'G_' : 'E_') + info.id,
            pid: 'G_' + info.pid,
            name: info.name,
            pd_equip_id: info.type == 'group' ? -1 : info.pd_equip_id,
            open: false,
            icon: getTreeIconName(info.icon, (info.is_available == 'Y' ? 0 : 6)),
            type: info.type,
            current_level: 0,
            iconName: info.icon,
            is_available: info.is_available
        };

        const add_node = m_group_tree.addNodes(parent_node, add_node_info, true);
        sortTree(m_group_tree, parent_node, add_node[0]);
    }

    /**
     * 설비트리에서 새로운 노드를 추가함
     * 
     * @param {JSON} info 설비트리에 추가할 노드정보
     */
    function addEquipmentTreeNode(info) {
        if(m_equip_tree == undefined) return;

        const parent_node = m_equip_tree.getNodeByParam('id', 'G_' + info.equip_code, null);
        if(parent_node == null) return;

        const add_node_info = {
            id: 'E_' + info.id,
            pid: 'G_' + info.equip_code,
            name: info.name,
            pd_equip_id: info.pd_equip_id,
            open: false,
            icon: getTreeIconName(info.icon, info.is_available == 'Y' ? 0 : 6),
            type: info.type,
            current_level: 0,
            iconName: info.icon,
            equip_code: info.equip_code,
            is_available: info.is_available
        };

        const add_node = m_equip_tree.addNodes(parent_node, add_node_info, true);
        sortTree(m_equip_tree, parent_node, add_node[0]);
    }

    /**
     * TreeNode에서 지정한 id를 삭제함
     * 그룹보기 / 설비보기 항목에 대해서 동시에 삭제 진행
     * 
     * @param {String} delete_id treeNode에서 삭제하기 위한 id. 'G_XX', 'E_XX' 형식의 파라메터
     */
    function deleteTreeNode(delete_id) {
        if(m_group_tree) {
            const delete_group_tree_node = m_group_tree.getNodeByParam('id', delete_id, null);
            m_group_tree.removeNode(delete_group_tree_node, true);
        }
        
        if(m_equip_tree) {
            const delete_equip_tree_node = m_equip_tree.getNodeByParam('id', delete_id, null);
            m_equip_tree.removeNode(delete_equip_tree_node, true);
        }
    }

    /**
     * 주어진 정보(info)에 대해서 Tree Node를 업데이트함
     * 
     * @param {JSON} info update를 위한 Tree 정보
     */
    function updateTreeNode(info) {
        updateGroupTreeNode(info);
        updateEquipTreeNode(info);
    }

    /**
     * 그룹트리 내 업데이트를 수행함
     * 
     * @param {Object} info Update가 이뤄진 Group 혹은 Equipment의 정보
     */
    function updateGroupTreeNode(info) {
        if(m_group_tree == undefined) return;

        const id = (info.type == 'group' ? 'G_' : 'E_') + info.id;
        let node = m_group_tree.getNodeByParam('id', id, null);

        if(node == null || node == undefined) {
            return;
        }

        let isSorting = false;

        // by shkoh 20181002: 새로운 트리정보에서 name 항목이 존재하고 기존 name과 다르면, 해당 내용 반영 후 정렬 진행
        if(info.name && info.name != node.name) {
            node.name = info.name;
            isSorting = true;
        }

        // by shkoh 20181002: 새로운 icon이 변경되었다면, 새로운 iconName으로 icon변경
        if(info.icon) {
            node.iconName = info.icon;
            node.icon = getTreeIconName(info.icon, (info.is_available == 'Y' ? node.current_level : 6));
        }
        
        if(info.level != undefined) {
            // by shkoh 20181002: 새로운 level이 변경되었다면, 새로운 level로 icon 변경
            node.current_level = info.level;
            node.icon = getTreeIconName(node.iconName, info.level);
        }

        // by shkoh 20181206: 아이콘과 사용여부가 설정되어 있고, 기존의 사용여부와 현재의 사용여부가 다르면
        if(info.icon && info.is_available && info.is_available != node.is_available) {
            node.is_available = info.is_available;
            node.icon = getTreeIconName(info.icon, (info.is_available == 'Y' ? node.current_level : 6));
        }

        m_group_tree.updateNode(node);
        
        // by shkoh 20181002: 새로운 트리정보에서 그룹 ID가 변경되었고 지정된 부모노드가 존재하다면 새로운 부모 노드 아래로 이동
        let parent_node = m_group_tree.getNodeByParam('id', 'G_' + info.pid, null);
        if(info.pid != undefined && node.pid != 'G_' + info.pid) {
            if(parent_node) {
                node.pid = 'G_' + info.pid;
                m_group_tree.moveNode(parent_node, node, 'inner', false);
                isSorting = true;
            }
        }

        // by shkoh 20180920: name이 변경되었거나, 그룹 ID가 변경된 경우에 Tree 리스트를 정렬함
        if(isSorting && parent_node) sortTree(m_group_tree, parent_node, node);
    }

    /**
     * 설비트리 내 업데이트를 수행함
     * 
     * @param {Object} info Update가 이뤄진 Equipment의 정보
     */
    function updateEquipTreeNode(info) {
        if(m_equip_tree == undefined) return;
        if(info.type == 'group') return;

        const id = 'E_' + info.id;
        let node = m_equip_tree.getNodeByParam('id', id, null);

        if(node == null || node == undefined) {
            // by shkoh 20200520: 설비트리에서 설비변경 혹은 업데이트가 일어나는 경우에 해당 node가 없다면, tree에 추가
            if(info.command === 'update') {
                addEquipmentTreeNode(info);
            }
            return;
        }

        // by shkoh 20181002: 설비모델이 변경될 때에는 equipTree를 새로 그릴 수 밖에 없다
        // by shkoh 20181004: 설비모델 변경 시, 삭제된 모델 혹은 새로 추가된 모델이 발생함으로 새로 그릴 수 밖에 없음
        if((info.pd_equip_id && info.pd_equip_id != node.pd_equip_id) ||
           (info.equip_code && info.equip_code != node.equip_code)) {
            // by shkoh 20181004: 설비 모델 변경 시, 마지막 선택한 그룹 혹은 설비 노드를 가져옴
            const last_selected_tree_node = getCurrentSelectionTreeNodeInfo();
            
            // by shkoh 20181113: 변경작업이 발생하여도 업데이트한 내역을 그대로 유지함
            // by shkoh 20181113: 변경작업 발생 시 [설비]를 보고 있었다면 부모노드를 선택할 수 있도록하고
            // by shkoh 20181113: 변경작업 발생 시 [그룹]을 보고 있었다면 그대로 해당 부모를 선택함
            let select_node_id = undefined;
            let isOpen = false;
            if(last_selected_tree_node.type == 'equipment') {
                select_node_id = last_selected_tree_node.pid;
                isOpen = true;
            }
            else {
                select_node_id = last_selected_tree_node.id;
                isOpen = last_selected_tree_node.open;
            }

            $('#equip-tree').html('');
            createEquipTree('#equip-tree').then(function() {
                if(select_node_id) selectTreeNode(select_node_id);
                if(isOpen) expandTreeNode(select_node_id);
            });
            return;
        }

        let isSorting = false;

        // by shkoh 20181002: 새로운 트리정보에서 name 항목이 존재하고 기존 name과 다르면, 해당 내용 반영 후 정렬 진행
        if(info.name && info.name != node.name) {
            node.name = info.name;
            isSorting = true;
        }

        if(info.level != undefined && info.level != node.current_level) {
            // by shkoh 20181002: 새로운 level이 변경되었다면, 새로운 level로 icon 변경
            node.current_level = info.level;
            node.icon = getTreeIconName(node.iconName, info.level);
        }

        // by shkoh 20181206: 아이콘과 사용여부가 설정되어 있고, 기존의 사용여부와 현재의 사용여부가 다르면
        if(info.icon && info.is_available && info.is_available != node.is_available) {
            node.is_available = info.is_available;
            node.icon = getTreeIconName(info.icon, (info.is_available == 'Y' ? node.current_level : 6));
        }

        m_equip_tree.updateNode(node);

        // by shkoh 20181002: 새로운 트리정보에서 그룹 ID가 변경되었고 지정된 부모노드가 존재하다면 새로운 부모 노드 아래로 이동
        let parent_node = m_equip_tree.getNodeByParam('id', 'G_' + info.equip_code, null);
        if(isSorting && parent_node) sortTree(m_equip_tree, parent_node, node);
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
    /***************************************************************************************************************/
    /* by shkoh 20180607: Tree View - zTree Controll End                                                           */
    /***************************************************************************************************************/

    /***************************************************************************************************************/
    /* by shkoh 20180607: Tree View - bxSlider Controll Start                                                      */
    /***************************************************************************************************************/
    function reloadSliderTreeView() {
        if(m_treeview_slider == undefined) return;
        
        treeViewContentResizing();
        m_treeview_slider.redrawSlider();
    }

    function goToTreeSlider(new_id) {
        if(m_treeview_slider.getCurrentSlide() == new_id) return;

        $('#item-title-tree').text(new_id == 0 ? '그룹 리스트' : '설비별 리스트');
        m_treeview_slider.goToSlide(new_id);
    }
    /***************************************************************************************************************/
    /* by shkoh 20180607: Tree View - bxSlider Controll End                                                        */
    /***************************************************************************************************************/

    return {
        CreateTreeView: function(selected_id) { createTreeView(selected_id); },
        
        ResizingTreeView: function() { reloadSliderTreeView(); },
        
        GetCurrentSelectionTreeNodeInfo: function() { return getCurrentSelectionTreeNodeInfo(); },

        GetCurrentSelectionTreeNodeParentInfo: function() {
            const current_info = getCurrentSelectionTreeNodeInfo();
            if(current_info == undefined) return undefined;
            
            const parent_info = current_info.type == 'E' ? current_info.getParentNode() : current_info;
            return parent_info;
        },

        GoToEquipTree: function() { goToTreeSlider(1); },

        GoToGroupTree: function() { goToTreeSlider(0); },

        SelectTreeNode: function(id) { selectTreeNode(id); },

        GetTreeNodeInfo: function(id) { return getTreeNodeInfo(id); },

        DeleteTreeNode: function(id) { deleteTreeNode(id); },

        RedrawTree: function(info) {
            switch(info.command) {
                case 'insert':
                    addTreeNode(info);
                break;
                case 'update':
                    updateTreeNode(info);
                break;
                case 'delete':
                    const delete_id = (info.type == 'group' ? 'G_' : 'E_') + info.id;

                    deleteTreeNode(delete_id);

                    const node = this.GetCurrentSelectionTreeNodeInfo();
                    if(node != null && node.id == delete_id) {
                        this.SelectTreeNode(info.pid);
                    }
                break;
                case 'notify':
                    if(info.type && info.type != 'sensor') updateTreeNode(info);
                break;
            }

            reloadSliderTreeView();
        }
    }
}