const Tree = function(_id, _options) {
    const m_id = _id;
    
    let options = {
        code: undefined,
        treeNodeId: undefined
    };
    options = _options;
    
    const m_img_path = '/img/tree/';
    let m_tree = undefined;

    const m_tree_setting = {
        view: {
            showLine: true,
            fontCss: function(treeId, treeNode) {
                if(treeNode.is_available === 'Y') return { 'text-decoration': 'none', opacity: 1 };
                else return { 'text-decoration': 'line-through', opacity: 0.6 };
            }
        },
        data: {
            simpleData: {
                enable: true,
                idKey: 'id',
                pIdKey: 'pid'
            }
        },
        async: { enable: true },
        callback: {
        }
    }

    function createTree() {
        displayLoading();
        
        $.ajax({
            async: true,
            type: 'GET',
            url: '/api/diagram/tree?type=group'
        }).done(function(items) {
            if(items && items.length == 0) return;

            let tree_data = [];
            items.forEach(function(item) {
                const type = (item.id.substr(0, 1) == 'G') ? 'group' : (item.id.substr(0, 1) == 'E') ? 'equipment' : 'sensor';
                const insert_item = {
                    id: item.id,
                    pid: item.pid,
                    name: item.name,
                    open: (item.pid == null || item.pid == 'G_0') ? true : false,
                    icon: getTreeIconName(item.icon, (item.isAvailable == 'Y' ? 0 : 6)),
                    type: type,
                    current_level: item.level,
                    iconName: item.icon,
                    chkDisabled: item.sensor_type == 'D' ? true : false,
                    pd_equip_id: item.pd_equip_id,
                    is_available: item.isAvailable,
                    equip_code: item.equip_code,
                    equip_type: item.equip_type
                }

                let is_add = false;
                if(options.code === undefined || options.code.length === 0 || type === 'group') {
                    is_add = true;
                } else {
                    is_add = options.code.includes(item.equip_code);
                }
                
                if(is_add) tree_data.push(insert_item);
            });

            m_tree = $.fn.zTree.init($(m_id), m_tree_setting, tree_data);
        }).fail(function(err) {
            undisplayLoading();
            console.error('[Fail to create the Group Tree] ' + err.responseText);
        }).then(function() {
            // by shkoh 20200923: Group Tree Node에서 아이템 수가 상당히 많을 경우, 느려질 수 있음으로 우선적으로 Group-Equipment 정보를 로드한 후에, Sensor 정보를 로드하여 추가함
            $.ajax({
                async: true,
                type: 'GET',
                url: '/api/diagram/tree?type=sensor'
            }).done(function(items) {
                let sensor_data = new Object();
                items.forEach(function(item) {
                    if(!sensor_data.hasOwnProperty(item.pid)) {
                        sensor_data[item.pid] = [];
                    }

                    sensor_data[item.pid].push({
                        id: item.id,
                        pid: item.pid,
                        name: item.name,
                        open: false,
                        icon: getTreeIconName(item.icon, (item.isAvailable === 'Y' ? 0 : 6)),
                        type: 'sensor',
                        current_level: item.level,
                        iconName: item.icon,
                        chkDisabled: item.sensor_type === 'D' ? true : false,
                        pd_equip_id: item.pd_equip_id,
                        is_available: item.isAvailable
                    });
                });

                for(const [ key, value ] of Object.entries(sensor_data)) {
                    const p_node = m_tree.getNodeByParam('id', key);
                    
                    if(p_node)
                        m_tree.addNodes(p_node, value, true);
                }
            }).fail(function(err) {
                undisplayLoading();
                console.error('[Fail to load the sensor tree node] ' + err.statusText);
            }).always(function() {
                if(options.treeNodeId) selectTreeNodeById(options.treeNodeId);
                undisplayLoading();
            }).then(function() {
                if(options.code && options.code.length > 0) filterTreeWithCode();
            });
        });
    }

    function destroyTree() {
        $.fn.zTree.destroy();
        m_tree = undefined;
    }

    function createFilterTree(equip_id, filter_text) {
        displayLoading();

        $.ajax({
            async: true,
            type: 'GET',
            url: '/api/diagram/tree?type=filtering&id=' + equip_id + '&filter=' + filter_text
        }).done(function(items) {
            if(items && items.length === 0) return;

            let tree_data = [];
            items.forEach(function(item) {
                const type = (item.id.substr(0, 1) == 'G') ? 'group' : (item.id.substr(0, 1) == 'E') ? 'equipment' : 'sensor';
                const insert_item = {
                    id: item.id,
                    pid: item.pid,
                    name: item.name,
                    open: (item.pid == null || item.pid == 'G_0') ? true : false,
                    icon: getTreeIconName(item.icon, (item.isAvailable == 'Y' ? 0 : 6)),
                    type: type,
                    current_level: item.level,
                    iconName: item.icon,
                    chkDisabled: item.sensor_type === 'D' ? true : false,
                    pd_equip_id: item.pd_equip_id,
                    is_available: item.isAvailable,
                    equip_code: item.equip_code,
                    equip_type: item.equip_type
                }

                tree_data.push(insert_item);
            });

            m_tree = $.fn.zTree.init($(m_id), m_tree_setting, tree_data);
        }).fail(function(err) {
            undisplayLoading();
            console.error(err);
        }).then(function() {
            if(options.treeNodeId) selectTreeNodeById(options.treeNodeId);
            undisplayLoading();

            m_tree.expandAll(true);
        });
    }

    /***************************************************************************************************************/
    /* by shkoh 20190509: tree viewer - ztree controll start                                                       */
    /***************************************************************************************************************/
    function getTreeIconName(icon, level) {
        return m_img_path + icon + '_L_' + level + '.png';
    }

    function getCurrentTreeNode() {
        if(m_tree == undefined) return undefined;
        return m_tree.getSelectedNodes()[0];
    }

    function selectTreeNodeById(id) {
        if(m_tree == undefined) return;

        const node = m_tree.getNodeByParam('id', id, null);
        if(node) m_tree.selectNode(node, false, false);
    }

    function displayLoading() {
        kendo.ui.progress($('#modalDialogTree'), true);
    }
    
    function undisplayLoading() {
        kendo.ui.progress($('#modalDialogTree'), false);
    }

    function filterTreeWithCode() {
        const removed_nodes = m_tree.getNodesByFilter(function(node) {
            return (node.type === 'group' && !node.children) ? true : false;
        });

        removed_nodes.forEach(function(node) {
            m_tree.removeNode(node);
        });
    }
    /***************************************************************************************************************/
    /* by shkoh 20190509: tree viewer - ztree controll end                                                         */
    /***************************************************************************************************************/
    

    return {
        CreateTree: function() { createTree(); },
        CreateFilterTree: function(equip_id, filter_text) { createFilterTree(equip_id, filter_text) },
        DestroyTree: function() { destroyTree(); },
        GetCurrentTreeNode: function() { return getCurrentTreeNode(); },
        SelectTreeNodeById: function(id) { selectTreeNodeById(id); }
    }
}