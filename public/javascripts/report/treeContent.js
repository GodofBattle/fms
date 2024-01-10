const TreeViewContent = function(_id, _options) {
    const tree_id = _id;
    let options = {
        onClick: undefined,
        onCheck: undefined
    }

    options = _options;

    const m_img_path = '/img/tree/';

    const m_tree_setting = {
        view: {
            showLine: true,
            fontCss: function(treeId, treeNode) {
                if(treeNode.is_available === 'Y') return { 'text-decoration': 'none', opacity: treeNode.chkDisabled ? 0.6 : 1 };
                else return{ 'text-decoration': 'line-through', opacity: 0.6 };
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
            onBeforeClick: undefined,
            onClick: options.onClick,
            onCheck: options.onCheck
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
            url: '/api/data/report/tree?type=group'
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
                    is_available: item.isAvailable
                }
                
                tree_data.push(insert_item);
            });

            m_group_tree = $.fn.zTree.init($(id), m_tree_setting, tree_data);
        }).fail(function(err) {
            console.error('[Fail to create the Group Tree] ' + err.statusText);
        }).then(function() {
            // by shkoh 20200706: Group Tree Node에서 아이템 수가 상당히 많을 경우, 느려질 수 있음으로 우선적으로 Group-Equipment 정보를 로드한 후에, Sensor 정보를 로드하여 추가함
            $.ajax({
                async: true,
                type: 'GET',
                url: '/api/data/report/tree?type=sensor'
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
                        icon: getTreeIconName(item.icon, (item.isAvailable == 'Y' ? 0 : 6)),
                        type: 'sensor',
                        current_level: item.level,
                        iconName: item.icon,
                        chkDisabled: item.sensor_type == 'D' ? true : false,
                        pd_equip_id: item.pd_equip_id,
                        is_available: item.isAvailable,
                   });
                });

                for(const [ key, value ] of Object.entries(sensor_data)) {
                    const p_node = m_group_tree.getNodeByParam('id', key);
                    m_group_tree.addNodes(p_node, value, true);
                }
            }).fail(function(err) {
                console.error('[Fail to load the sensor tree node] ' + err.statusText);
            });
        });
    }

    /***************************************************************************************************************/
    /* by shkoh 20181214: Tree View - zTree Controll Start                                                         */
    /***************************************************************************************************************/
    function getTreeIconName(icon, level) {
        return m_img_path + icon + '_L_' + level + '.png';
    }

    function getCheckedNodes() {
        if(m_group_tree == undefined) return undefined;
        return m_group_tree.getCheckedNodes(true);
    }
    /***************************************************************************************************************/
    /* by shkoh 20181214: Tree View - zTree Controll End                                                           */
    /***************************************************************************************************************/

    return {
        CreateTreeView: function() { createTreeView(); },
        GetCheckedNodes: function() { return getCheckedNodes(); }
    }
}