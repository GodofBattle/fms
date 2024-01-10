const TypeTree = function(_id, _options) {
    let id = _id;
    let options = {
        onClick: undefined
    };

    options = _options;

    const m_img_path = '/img/tree/';

    const m_tree_setting = {
        view: {
            showLine: false,
            fontCss: function(treeId, treeNode) {
                let font_css = {};
                if(treeNode.is_use === 'N') {
                    font_css = {
                        cursor: 'default',
                        color: '#333333'
                    };
                }

                return font_css;
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
            beforeClick: onBeforeClick,
            onClick: options.onClick
        }
    }

    //by MJ 2023.09.19 : Z트리구조
    const m_tree_data = [
        { id: '1', pid: null, name: '일반', icon: getTreeIconName('default', 0), open: true, is_use: 'N', iconSkin: 'icon-nouse', type: 'parent' },
        { id: '1-1', pid: '1', name: '기본: Default', icon: getTreeIconName('default', 0), open: true, type: 'default' },
        { id: '2', pid: null, name: 'RACK', icon: getTreeIconName('rack', 0), open: true, is_use: 'N', iconSkin: 'icon-nouse', type: 'parent' },
        { id: '2-1', pid: '2', name: '랙(일반): Rack', icon: getTreeIconName('rack', 0), open: true, type: 'rack' },
        { id: '2-1', pid: '2', name: '랙(온도센서 상): Rack-TT', icon: getTreeIconName('rack', 0), open: true, type: 'rack-TT' },
        { id: '2-1', pid: '2', name: '랙(온도센서 중): Rack-TM', icon: getTreeIconName('rack', 0), open: true, type: 'rack-TM' },
        { id: '2-1', pid: '2', name: '랙(온도센서 하): Rack-TB', icon: getTreeIconName('rack', 0), open: true, type: 'rack-TB' },
        { id: '2-2', pid: '2', name: '컨테인먼트 랙 - 온도 상: RackT', icon: getTreeIconName('rack', 0), open: true, type: 'rackT' },
        { id: '2-3', pid: '2', name: '컨테인먼트 랙 - 온도 중: RackM', icon: getTreeIconName('rack', 0), open: true, type: 'rackM' },
        { id: '2-4', pid: '2', name: '컨테인먼트 랙 - 온도 하: RackB', icon: getTreeIconName('rack', 0), open: true, type: 'rackB' },
    ]

    let m_tree = undefined;

    /***************************************************************************************************************************************/
    /* by shkoh 20230518: create tree view start                                                                                           */
    /***************************************************************************************************************************************/
    function createTree() {
        return new Promise(function(resovle, reject) {
            $(id).html('');

            const tree_id = id.slice(1) + '-z';
            const inner_html = '<div id="' + tree_id + '" class="ztree"></div>';

            $(id).html(inner_html);
            $(id).mCustomScrollbar({
                theme: 'minimal-dark',
                axis: 'xy',
                scrollbarPosition: 'outside',
                mouseWheel: { preventDefault: true }
            });

            m_tree = $.fn.zTree.init($('#' + tree_id), m_tree_setting, m_tree_data);

            resovle();
        });
    }
    
    function onBeforeClick(treeId, treeNode, clickFlag) {
        return treeNode.is_use === 'N' ? false : true;
    }
    /***************************************************************************************************************************************/
    /* by shkoh 20230518: create tree view end                                                                                             */
    /***************************************************************************************************************************************/

    /***************************************************************************************************************************************/
    /* by shkoh 20230518: inline function start                                                                                            */
    /***************************************************************************************************************************************/
    function getTreeIconName(icon, level) {
        return m_img_path + icon + '_L_' + level + '.png';
    }
    
    function selectNode(type) {
        const node = m_tree.getNodeByParam('type', type);
        m_tree.selectNode(node, false, true);

        options.onClick(null, null, node);
    }

    function getSelectNode() {
        return m_tree.getSelectedNodes()[0];
    }
    /***************************************************************************************************************************************/
    /* by shkoh 20230518: inline function end                                                                                              */
    /***************************************************************************************************************************************/

    return {
        CreateTree: function(type) {
            createTree(type).then(function() {
                selectNode(type);
            });
        },
        SelectNode: function(type) {
            selectNode(type);
        },
        GetSelectNode: function() {
            return getSelectNode();
        }
    }
}