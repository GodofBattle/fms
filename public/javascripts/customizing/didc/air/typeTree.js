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
    };

    const m_tree_data = [
        { id: '1', pid: null, name: '일반', icon: getTreeIconName('default', 0), open: true, is_use: 'N', iconSkin: 'icon-nouse', type: 'parent' },
        { id: '1-1', pid: '1', name: '기본: Default', icon: getTreeIconName('default', 0), open: true, type: 'default' },

        { id: '2', pid: null, name: '공조기 - 필터', icon: getTreeIconName('conditioning', 0), open: true, is_use: 'N', iconSkin: 'icon-nouse', type: 'parent' },
        { id: '2-1', pid: '2', name: 'FMS(좌 텍스트): d-a-fms', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-fms' },
        { id: '2-2', pid: '2', name: '댐퍼(하 텍스트): d-a-b-damper', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-b-damper' },
        { id: '2-3', pid: '2', name: '댐퍼(좌 텍스트): d-a-damper', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-damper' },
        { id: '2-4', pid: '2', name: 'DPS(하 텍스트): d-a-dps', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-dps' },
        { id: '2-5', pid: '2', name: '기화식 가습기(하 텍스트): d-a-h-filter', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-h-filter' },
        { id: '2-6', pid: '2', name: '실외기(하 텍스트): d-a-outdoor-unit', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-outdoor-unit' },

        { id: '3', pid: null, name: '공조기 - 팬', icon: getTreeIconName('conditioning', 0), open: true, is_use: 'N', iconSkin: 'icon-nouse', type: 'parent' },
        { id: '3-1', pid: '3', name: '팬(좌측): d-a-fan-l', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-fan-l' },
        { id: '3-2', pid: '3', name: '팬(우측): d-a-fan-r', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-fan-r' },

        { id: '4', pid: null, name: '공조기 - 프로브', icon: getTreeIconName('conditioning', 0), open: true, is_use: 'N', iconSkin: 'icon-nouse', type: 'parent' },
        { id: '4-1', pid: '4', name: '온도 프로브: d-a-p-temp', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-p-temp' },
        { id: '4-2', pid: '4', name: '습도 프로브: d-a-p-humi', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-p-humi' },
        { id: '4-3', pid: '4', name: 'CO2 프로브: d-a-p-co2', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-p-co2' },
        { id: '4-4', pid: '4', name: '압력 프로브: d-a-p-pres', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-p-pres' },
        { id: '4-5', pid: '4', name: '연기 프로브: d-a-p-smoke', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-p-smoke' },
        { id: '4-6', pid: '4', name: '온도(하) 프로브: d-a-p-temp-b', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-p-temp-b' },
        { id: '4-7', pid: '4', name: '히터(하) 프로브: d-a-p-heat-b', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-p-heat-b' },

        { id: '5', pid: null, name: '냉동기 냉수 계통도', icon: getTreeIconName('conditioning', 0), open: true, is_use: 'N', iconSkin: 'icon-nouse', type: 'parent' },
        { id: '5-1', pid: '5', name: '냉동기: d-a-chiller', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-chiller' },
        { id: '5-2', pid: '5', name: '펌프(시계방향 회전): d-a-pump-cw', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-pump-cw' },
        { id: '5-2', pid: '5', name: '펌프(반시계반향 회전): d-a-pump-ccw', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-pump-ccw' },
        { id: '5-2', pid: '5', name: '냉각탑 운전/정지: d-a-ct-cw', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-ct-cw' },

        { id: '6', pid: null, name: '텍스트', icon: getTreeIconName('virtual', 0), open: true, is_use: 'N', iconSkin: 'icon-nouse', type: 'parent' },
        { id: '6-1', pid: '6', name: '이름-값(%) - 가로: d-a-text-normal', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-text-normal' },
        { id: '6-1', pid: '6', name: '이름-값(℃) - 세로: d-a-text-temp-v', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-text-temp-v' },
        { id: '6-2', pid: '6', name: '명칭-큰글씨: d-a-text-title-l', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-text-title-l' },
        { id: '6-3', pid: '6', name: '명칭-보통: d-a-text-title', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-text-title' },
        { id: '6-4', pid: '6', name: '명칭-작은글씨: d-a-text-title-s', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-text-title-s' },
        { id: '6-5', pid: '6', name: 'AI 값만: d-a-ai-label', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-ai-label' },
        { id: '6-6', pid: '6', name: 'DI 상태만: d-a-di-label', icon: getTreeIconName('conditioning', 0), open: true, type: 'd-a-di-label' },
    ];

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