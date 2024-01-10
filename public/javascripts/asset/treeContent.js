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
                return treeNode.is_available == 'Y' ? { 'text-decoration': 'none', opacity: 1 } : { 'text-decoration': 'line-through', opacity: 0.6 }
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
            url: '/api/data/asset/tree?type=group'
        }).done(function(items) {
            if(items && items.length == 0) return;

            let tree_data = [];
            items.forEach(function(item) {
                tree_data.push({
                    id: item.id,
                    pid: item.pid,
                    name: item.name,
                    open: (item.pid == null || item.pid == 'G_0') ? true : false,
                    icon: getTreeIconName(item.icon, (item.isAvailable == 'Y' ? 0 : 6)),
                    type: (item.id.substr(0, 1) == 'E') ? 'equipment' : 'group',
                    current_level: item.level,
                    iconName: item.icon,
                    pd_equip_id: item.pd_equip_id,
                    is_available: item.isAvailable,
                    equip_code: item.equip_code,
                    equip_type: item.equip_type,
                    isHidden: false,
                    checked: false,
                    chkDisabled: item.io_type === 'VIRTUAL' ? true : false
                });
            });

            m_group_tree = $.fn.zTree.init($(id), m_tree_setting, tree_data);
        }).fail(function(xhr) {
            console.error('[Fail to create the Group Tree] ' + xhr.responseText);
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
        GetCheckedNodes: function() { return getCheckedNodes(); },
    }
}