const EquipmentTree = function(_id, _options) {
    const id = _id;
    let options = {
        onClick: undefined
    };

    options = _options;

    const m_img_path = '/img/tree/';

    const m_tree_setting = {
        view: {
            showLine: true,
            fontCss: function(treeId, treeNode) {
                if(treeNode.is_available === 'Y') return { 'text-decoration': 'none', opacity: treeNode.chkDisabled ? 0.6 : 1 };
                else return { 'text-decoration': 'line-through', opacity: 0.6 };
            }
        },
        check: {
            enable: false,
            nocheckInherit: false
        },
        data: {
            simpleData: {
                enable: true,
                idKey: 'id',
                pIdKey: 'pid'
            }
        },
        async: {
            enable: false
        },
        callback: {
            beforeClick: onTreeBeforeClick,
            onClick: options.onClick,
            onCheck: options.onCheck
        }
    }

    let m_tree = undefined;
    
    /***************************************************************************************************************************************/
    /* by shkoh 20230519: create tree view start                                                                                           */
    /***************************************************************************************************************************************/
    function createTree(selected_id) {
        $(id).html('');

        const innerHtml = '<div id="group-tree" class="ztree"></div>';

        $(id).html(innerHtml);

        $(id).mCustomScrollbar({
            theme: 'minimal-dark',
            axis: 'xy',
            scrollbarPosition: 'outside',
            mouseWheel: {
                preventDefault: true
            }
        });

        createGroupTree('#group-tree', selected_id);
    }

    function createGroupTree(id, selected_id) {
        $.ajax({
            async: true,
            type: 'GET',
            url: '/api/diagram/tree?type=group'
        }).done(function(items) { 
            if(items && items.length === 0) return;

            let tree_data = [];
            for(const item of items) {
                const type = (item.id.substr(0, 1) === 'G') ? 'group' : (item.id.substr(0, 1) === 'E') ? 'equipment' : 'sensor';
                const insert_item = {
                    id: item.id,
                    pid: item.pid,
                    name: item.name,
                    open: (item.pid == null || item.pid == 'G_0') ? true : false,
                    icon: getTreeIconName(item.icon, (item.isAvailable === 'Y' ? 0 : 6)),
                    type: type,
                    current_level: item.level,
                    iconName: item.icon,
                    pd_equip_id: item.pd_equip_id,
                    is_available: item.isAvailable
                };

                tree_data.push(insert_item);
            }

            m_tree = $.fn.zTree.init($(id), m_tree_setting, tree_data);
        }).fail(function(err) {
            console.error('[Fail to create the Group Tree]' + err.statusText);
        }).then(function() {
            if(selected_id) {
                selectNode(selected_id);
            }
        });
    }
    /***************************************************************************************************************************************/
    /* by shkoh 20230519: create tree view end                                                                                             */
    /***************************************************************************************************************************************/

    /***************************************************************************************************************************************/
    /* by shkoh 20230519: data exchange start                                                                                              */
    /***************************************************************************************************************************************/
    function getSensorList(equip_id) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                async: true,
                type: 'GET',
                url: '/api/diagram/tree?type=sensor&equip_id=' + equip_id
            }).done(function(data) {
                data.forEach(function(datum) {    
                    const { id, pid, name, icon, isAvailable, level, pd_equip_id } = datum;
                    
                    const p_node = m_tree.getNodeByParam('id', pid);
                    m_tree.addNodes(p_node, {
                        id: id,
                        pid: pid,
                        name: name,
                        open: true,
                        icon: getTreeIconName(icon, isAvailable === 'Y' ? level : 6),
                        type: 'sensor',
                        current_level: level,
                        iconName: icon,
                        pd_equip_id: pd_equip_id,
                        is_available: isAvailable
                    }, false);
                });

                resolve();
            }).fail(function(err) {
                console.error(err);
                reject(err);
            });
        });
    }

    function getSensor(sensor_id) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                async: true,
                type: 'GET',
                url: '/api/diagram/getsensor?id=' + sensor_id
            }).done(function(info) {
                const { equip_id } = info;
                resolve(equip_id);
            }).fail(function(err) {
                console.error(err);
                reject(err);
            });
        });
    }
    /***************************************************************************************************************************************/
    /* by shkoh 20230519: data exchange end                                                                                                */
    /***************************************************************************************************************************************/

    /***************************************************************************************************************************************/
    /* by shkoh 20230519: inline function start                                                                                            */
    /***************************************************************************************************************************************/
    function getTreeIconName(icon, level) {
        return m_img_path + icon + '_L_' + level + '.png';
    }

    function onTreeBeforeClick(treeId, treeNode, clickFlag) {
        if(treeNode.type === 'equipment') {
            const equip_id = treeNode.id.substring(2);
            if(!treeNode.isParent) getSensorList(equip_id);
        }
    }

    function selectNode(id) {
        if(id === undefined || id === null || id === '') return;

        const type = id.substring(0, 1);

        if(type === 'S') {
            getSensor(id.substring(2)).then(function(equip_id) {
                const p_node = m_tree.getNodeByParam('id', 'E_' + equip_id, null);
    
                if(p_node.isParent) {
                    const node = m_tree.getNodeByParam('id', id, null);
                    m_tree.selectNode(node, false, true);

                    options.onClick(null, null, node);
                } else {
                    getSensorList(equip_id).then(function() {
                        const node = m_tree.getNodeByParam('id', id, null);
                        m_tree.selectNode(node, false, true);

                        options.onClick(null, null, node);
                    });
                }
            });
        }
        else {
            const node = m_tree.getNodeByParam('id', id, null);
            m_tree.selectNode(node, false, true);

            options.onClick(null, null, node);
        }
    }

    function getSelectNode() {
        return m_tree.getSelectedNodes()[0];
    }
    /***************************************************************************************************************************************/
    /* by shkoh 20230519: inline function end                                                                                              */
    /***************************************************************************************************************************************/

    return {
        CreateTree: function(id) {
            createTree(id);
        },
        SelectNode: function(id) {
            selectNode(id);
        },
        GetSelectNode: function() {
            return getSelectNode();
        }
    }
}