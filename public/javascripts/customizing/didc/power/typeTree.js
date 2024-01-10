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

    const m_tree_data = [
        { id: '1', pid: null, name: '일반', icon: getTreeIconName('default', 0), open: true, is_use: 'N', iconSkin: 'icon-nouse', type: 'parent' },
        { id: '1-1', pid: '1', name: '기본: Default', icon: getTreeIconName('default', 0), open: true, type: 'default' },

        { id: '2', pid: null, name: 'POWER', icon: getTreeIconName('power_system', 0), open: true, is_use: 'N', iconSkin: 'icon-nouse', type: 'parent' },
        { id: '2-1', pid: '2', name: '한국전력: d-kepco', icon: getTreeIconName('power_system', 0), open: true, type: 'd-kepco' },
        { id: '2-2', pid: '2', name: '특고압,고압: d-sv', icon: getTreeIconName('power_system', 0), open: true, type: 'd-sv' },
        { id: '2-3', pid: '2', name: '특고압,고압(상단 텍스트): d-sv-t', icon: getTreeIconName('power_system', 0), open: true, type: 'd-sv-t' },
        { id: '2-5', pid: '2', name: '저압: d-lv', icon: getTreeIconName('power_system', 0), open: true, type: 'd-lv' },
        { id: '2-6', pid: '2', name: '변압기: d-tr', icon: getTreeIconName('power_system', 0), open: true, type: 'd-tr' },
        { id: '2-7', pid: '2', name: 'ACB 스위치: d-acb', icon: getTreeIconName('power_system', 0), open: true, type: 'd-acb' },
        { id: '2-8', pid: '2', name: 'ATS: d-ats', icon: getTreeIconName('power_system', 0), open: true, type: 'd-ats' },
        { id: '2-9', pid: '2', name: '발전기: d-gen', icon: getTreeIconName('power_system', 0), open: true, type: 'd-gen' },
        { id: '2-10', pid: '2', name: '발전기 시작점(A): d-gen-start-a', icon: getTreeIconName('power_system', 0), open: true, type: 'd-gen-start-a' },
        { id: '2-11', pid: '2', name: '발전기 시작점(B): d-gen-start-b', icon: getTreeIconName('power_system', 0), open: true, type: 'd-gen-start-b' },
        { id: '2-12', pid: '2', name: '발전기 시작점(C): d-gen-start-c', icon: getTreeIconName('power_system', 0), open: true, type: 'd-gen-start-c' },
        { id: '2-13', pid: '2', name: '발전기 시작점(D): d-gen-start-d', icon: getTreeIconName('power_system', 0), open: true, type: 'd-gen-start-d' },
        { id: '2-14', pid: '2', name: '발전기 시작점(E): d-gen-start-e', icon: getTreeIconName('power_system', 0), open: true, type: 'd-gen-start-e' },
        { id: '2-15', pid: '2', name: '발전기 시작점(F): d-gen-start-f', icon: getTreeIconName('power_system', 0), open: true, type: 'd-gen-start-f' },
        { id: '2-16', pid: '2', name: '발전기 시작점(G): d-gen-start-g', icon: getTreeIconName('power_system', 0), open: true, type: 'd-gen-start-g' },
        { id: '2-17', pid: '2', name: '텍스트(가운데정렬): d-text', icon: getTreeIconName('power_system', 0), open: true, type: 'd-text' },
        { id: '2-18', pid: '2', name: '텍스트(좌측정렬): d-text-l', icon: getTreeIconName('power_system', 0), open: true, type: 'd-text-l' },
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