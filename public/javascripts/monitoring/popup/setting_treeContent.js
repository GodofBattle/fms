const TreeViewContent = function(_id, _options) {
    const tree_id = _id;
    let options = {
        onClick: undefined
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
        callback: {
            onClick: options.onClick,
            onRightClick: options.onRightClick
        }
    }
 
    let m_tree = undefined;
   
    /***************************************************************************************************************/
    /* by shkoh 20180806: Tree View - Initialization Start                                                         */
    /***************************************************************************************************************/
    function createTreeView(selected_id) {
        $(tree_id).html('');
 
        const innerHtml =
        '<div id="group-tree" class="ztree"></div>';
 
        $(tree_id).html(innerHtml);
 
        createGroupTree('#group-tree', selected_id);
    }
 
    function createGroupTree(id, selected_id) {
        $.ajax({
            async: true,
            type: 'GET',
            cache: false,
            url: '/api/popup/set/tree?type=group'
        }).done(function(items) {
            let tree_data = [];

            // kdh 20190201 국민연금 관심설비등록
            if(selected_id.substr(0, 1) == 'A') {
                createAttentionEquipTree(items, id);
                return;
            }

            items.forEach(function(item) {
                tree_data.push({
                    id: item.id,
                    pid: item.pid,
                    name: item.name,
                    pd_equip_id: item.pd_equip_id,
                    open: (item.pid == null || item.pid == 'G_0') ? true : false,
                    icon: getTreeIconName(item.id.substr(0, 1), item.isAvailable, item.icon),
                    type: (item.id.substr(0, 1) == 'E') ? 'equipment' : 'group',
                    bgImg: item.imageName,
                    current_level: item.level,
                    iconName: item.icon,
                    is_available: item.isAvailable
                });
            });
 
            m_tree = $.fn.zTree.init($(id), m_tree_setting, tree_data);
        }).fail(function(err_msg) {
            console.error('[Fail to crate the Group Tree] ' + err_msg);
        }).always(function() {            
            if(selected_id) {
                if(selected_id.substr(0, 1) == 'A') selected_id = selected_id.substr(1);
                selectTreeNode(selected_id);
            }
        });
    }

    // kdh 20190201 국민연금 관심설비등록
    function createAttentionEquipTree(items, htmlId) {
        let tree_data = [];
        
        items.forEach(function(item) {
            tree_data.push({
                id: item.id,
                pId: item.pid,
                name: item.name,
                pd_equip_id: item.pd_equip_id,
                open: (item.pid == null || item.pid == 'G_0') ? true : false,
                icon: getTreeIconName(item.id.substr(0, 1), item.isAvailable, item.icon),
                type: (item.id.substr(0, 1) == 'E') ? 'equipment' : 'group',
                bgImg: item.imageName,
                current_level: item.level,
                iconName: item.icon,
                is_available: item.isAvailable,
                is_attention: item.isAttention,
                nocheck: false,
                chkDisabled: false
            });
        });

        m_tree = $.fn.zTree.init($(htmlId), {
            view: {
                showLine: true,
                fontCss: function(treeId, treeNode) {
                    return treeNode.is_available == 'Y' ? { 'text-decoration': 'none', opacity: 1 } : { 'text-decoration': 'line-through', opacity: 0.6 }
                }
            },
            check: {
                enable: true,
                chkDisabledInherit: true,
                nocheckInherit: true
            },
            data: { simpleData: { enable: true } },
            callback: {
                onClick: options.onClick
            }
        }, tree_data);
    }
    /***************************************************************************************************************/
    /* by shkoh 20180806: Tree View - Initialization End                                                           */
    /***************************************************************************************************************/
   
    /***************************************************************************************************************/
    /* by shkoh 20180806: Tree View - zTree Controll Start                                                         */
    /***************************************************************************************************************/
    function getTreeIconName(type, is_available, icon) {
        if(type == 'E' && is_available == 'N') return m_img_path + icon + '_L_6.png';
        else return m_img_path + icon + '_L_0.png';
    }
 
    function selectTreeNode(selected_id) {
        const node = getTreeNode(selected_id);
        m_tree.selectNode(node, false);
    }
 
    function getTreeNode(selected_id) {
        return m_tree.getNodeByParam('id', selected_id, null);
    }
 
    function getSelectedTreeNode() {
        if(m_tree == undefined) return undefined;
        return m_tree.getSelectedNodes()[0];
    }
    /***************************************************************************************************************/
    /* by shkoh 20180806: Tree View - zTree Controll End                                                           */
    /***************************************************************************************************************/
 
    /***************************************************************************************************************/
    /* kdh 20190201 국민연금 관심설비 Tree View - zTree Controll Start                                                 */
    /***************************************************************************************************************/
    function checkTreeNodes() {
        if(m_tree == undefined) return;

        let nodes = m_tree.getNodesByParam('is_attention', 'Y', null);
        for(let idx=0; idx<nodes.length; idx++) {
            m_tree.checkNode(nodes[idx], true, true,true);
        }
    }

    function checkTreeNode(equip_id) {
        if(m_tree == undefined) return;

        const node = m_tree.getNodeByParam('id', 'E_' + equip_id, null);
        if(node != null) {
            m_tree.checkNode(node, true, true, true);
        }
    }

    function unCheckTreeNode(equip_id) {
        if(m_tree == undefined) return;

        const node = m_tree.getNodeByParam('id', 'E_' + equip_id, null);
        if(node != null) {
            m_tree.checkNode(node, false, true, true);
        }
    }

    function setChkDisabled(bool) {
        let nodes = m_tree.getNodes()[0].children;

        nodes.forEach(function(node) {
            m_tree.setChkDisabled(node, bool, true, true);
        });
    }
    /***************************************************************************************************************/
    /* kdh 20190201 국민연금 관심설비 Tree View - zTree Controll End                                                   */
    /***************************************************************************************************************/

    return {
        CreateTreeView: function(selected_id) { createTreeView(selected_id); },
        GetSelectedTreeNode: function() { return getSelectedTreeNode(); },
        GetTreeNodeById: function(id) { return getTreeNode(id); },
        CheckTreeNodes: function() { checkTreeNodes(); },
        CheckTreeNode: function(equip_id) { checkTreeNode(equip_id); },
        UnCheckTreeNode: function(equip_id) { unCheckTreeNode(equip_id); },
        SetChkDisabled: function(bool) { setChkDisabled(bool); }
    }
}