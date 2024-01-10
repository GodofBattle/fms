const Tree = function(_id, _options) {
    const m_id = _id;
    
    let options = {
        onCheck: undefined,
        importItems: undefined,
        isSensor: true
    };
    options = _options;

    const m_img_path = '/img/tree/';
    let m_tree = undefined;

    let m_timeout_id = undefined;
    let m_last_keyword = '';

    const m_tree_setting = {
        view: {
            showLine: true,
            nameIsHTML: true,
            fontCss: function(treeId, treeNode) {
                if(treeNode.is_available === 'Y') return { 'text-decoration': 'none', opacity: 1 };
                else return { 'text-decoration': 'line-through', opacity: 0.6 };
            }
        },
        check: {
            enable: true,
            nocheckInherit: false,
            chkboxType: { 'Y': '', 'N': '' }
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
            onCheck: options.onCheck
        }
    }

    function createTree() {
        displayLoading();

        $.ajax({
            async: true,
            type: 'GET',
            url: '/api/wrfis/wemb/tree?type=group'
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
                    chkDisabled: type === 'group' ? true : false,
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
            if(options.isSensor) {
                $.ajax({
                    async: true,
                    type: 'GET',
                    url: '/api/wrfis/wemb/tree?type=sensor'
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
                            // by shkoh 20210303: wemb 설정창에서는 모든 센서가 선택 가능하다
                            // chkDisabled: item.sensor_type === 'D' ? true : false,
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
    
                    options.importItems();
                });
            } else {
                undisplayLoading();

                options.importItems();
            }
        });
    }

    function destroyTree() {
        $.fn.zTree.destroy();
        m_tree = undefined;
    }

    /***************************************************************************************************************/
    /* by shkoh 20210303: tree view - zTree controll start                                                         */
    /***************************************************************************************************************/
    function getTreeIconName(icon, level) {
        return m_img_path + icon + '_L_' + level + '.png';
    }

    function setCheckNode(id, checked, checkType) {
        const node = m_tree.getNodeByParam('id', id, null);
        if(node) m_tree.checkNode(node, checked, checkType, true);
    }

    function expandNode(id) {
        const node = m_tree.getNodeByParam('id', id, null);
        if(node && node.getParentNode()) m_tree.expandNode(node.getParentNode(), true, false, false);
    }

    function getCheckedNodes() {
        return m_tree.getCheckedNodes(true);
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

    function filtering(text, callback) {
        if(!text) text = '';    // by shkoh 20210330: default

        const nameKey = m_tree.setting.data.key.name;
        const isExpand = true;
        const isHighLight = true;

        const metaChar = '[\\[\\]\\\\\^\\$\\.\\|\\?\\*\\+\\(\\)]';
        const rexMeta = new RegExp(metaChar, 'gi');

        const filter_tree = function(node) {
            if(node && node.oldname && node.oldname.length > 0) {
                node[nameKey] = node.oldname;
            }

            m_tree.updateNode(node);
            if(text.length === 0) {
                m_tree.showNode(node);
                m_tree.expandNode(node, false);
                return true;
            }

            // by shkoh 20210330: 필터링 시에 그룹은 제외한다
            if(node.id.substr(0, 1) === 'G') {
                m_tree.hideNode(node);
                return false;
            }

            if(node[nameKey] && node[nameKey].toLowerCase().indexOf(text.toLowerCase()) != -1) {
                if(isHighLight) {
                    let new_text = text.replace(rexMeta, function(matchStr) {
                        return '\\' + matchStr;
                    });

                    node.oldname = node[nameKey];
                    let rexGlobal = new RegExp(new_text, 'gi');

                    node[nameKey] = node.oldname.replace(rexGlobal, function(original_text) {
                        const highLightText = '<span style="color: whitesmoke; background-color: darkred;">' + original_text + '</span>';
                        return highLightText;
                    });

                    m_tree.updateNode(node);
                }

                m_tree.showNode(node);
                return true;
            }

            m_tree.hideNode(node);
            return false;
        }

        const showing_nodes = m_tree.getNodesByFilter(filter_tree);
        processShowNodes(showing_nodes, text);
    }

    function processShowNodes(showing_nodes, text) {
        if(showing_nodes && showing_nodes.length > 0) {
            if(text.length > 0) {
                $.each(showing_nodes, function(n, obj) {
                    // by shkoh 20210330: get all the ancient nodes including current node
                    const path_of_one = obj.getPath();
                    if(path_of_one && path_of_one.length > 0) {
                        for(let i = 0; i < path_of_one.length - 1; i++) {
                            m_tree.showNode(path_of_one[i]);
                            m_tree.expandNode(path_of_one[i], true);
                        }
                    } 
                });
            } else {
                const root_nodes = m_tree.getNodesByParam('level', '0');
                $.each(root_nodes, function(n, obj) {
                    m_tree.expandNode(obj, true);
                });
            }
        }
    }

    function filterTree(text) {
        if(m_timeout_id) {
            clearTimeout(m_timeout_id);
        }

        m_timeout_id = setTimeout(function() {
            if(m_last_keyword === text) return;

            filtering(text);

            m_last_keyword = text;
        }, 500);
    }
    /***************************************************************************************************************/
    /* by shkoh 20210303: tree view - zTree controll End                                                           */
    /***************************************************************************************************************/
    
    return {
        CreateTree: function() { createTree(); },
        DestroyTree: function() { destroyTree(); },
        SetCheckNode: function(id, checked, checkType) { setCheckNode(id, checked, checkType) },
        ExpandNode: function(id) { expandNode(id); },
        GetCheckedNodes: function() { return getCheckedNodes(); },
        FilterTree: function(text) { filterTree(text); }
    }
}