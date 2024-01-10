const TypeTree = function(_id, _options) {
    let id = _id;
    let options = {
        onClick: undefined
    }

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
                    }
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
        
        { id: '2', pid: null, name: '온도', icon: getTreeIconName('temp', 0), open: true, is_use: 'N', iconSkin: 'icon-nouse', type: 'parent' },
        { id: '2-1', pid: '2', name: '온도분포도 전용: TempDi', icon: getTreeIconName('temp', 0), open: true, type: 'tempdi' },
        
        { id: '3', pid: null, name: '온습도', icon: getTreeIconName('temp_humi', 0), open: true, is_use: 'N', iconSkin: 'icon-nouse', type: 'parent' },
        { id: '3-1', pid: '3', name: '온습도 일반: TH', icon: getTreeIconName('temp_humi', 0), open: true, type: 'th' },
        { id: '3-2', pid: '3', name: '온습도 일반: TH(상단표기)', icon: getTreeIconName('temp_humi', 0), open: true, type: 'thtop' },
        { id: '3-3', pid: '3', name: '온습도 일반: TH(하단표기)', icon: getTreeIconName('temp_humi', 0), open: true, type: 'thbottom' },
        { id: '3-4', pid: '3', name: '온습도 온도만: THOnlyT', icon: getTreeIconName('temp_humi', 0), open: true, type: 'thonlyt' },

        { id: '4', pid: null, name: '카메라', icon: getTreeIconName('dvr', 0), open: true, is_use: 'N', iconSkin: 'icon-nouse', type: 'parent' },
        { id: '4-1', pid: '4', name: '돔 카메라: DOME', icon: getTreeIconName('dvr', 0), open: true, type: 'dome' },

        { id: '5', pid: null, name: '출입문', icon: getTreeIconName('door', 0), open: true, is_use: 'N', iconSkin: 'icon-nouse', type: 'parent' },
        { id: '5-1', pid: '5', name: '출입문 일반: Door', icon: getTreeIconName('door', 0), open: true, type: 'door' },

        { id: '6', pid: null, name: '조명', icon: getTreeIconName('light', 0), open: true, is_use: 'N', iconSkin: 'icon-nouse', type: 'parent' },
        { id: '6-1', pid: '6', name: '기본타입: light', icon: getTreeIconName('light', 0), open: true, type: 'light' },

        { id: '7', pid: null, name: '전력계통도', icon: getTreeIconName('power_system', 0), open: true, is_use: 'N', iconSkin: 'icon-nouse', type: 'parent' },
        { id: '7-1', pid: '7', name: '고전압반: HV', icon: getTreeIconName('power_system', 0), open: true, type: 'hv' },
        { id: '7-2', pid: '7', name: '고전압반: HV - 1/2크기', icon: getTreeIconName('power_system', 0), open: true, type: 'hvhalf' },
        { id: '7-3', pid: '7', name: '저전압반: LV', icon: getTreeIconName('power_system', 0), open: true, type: 'lv' },
        { id: '7-4', pid: '7', name: '변압기: TR', icon: getTreeIconName('power_system', 0), open: true, type: 'tr' },
        { id: '7-5', pid: '7', name: '발전기: GEN', icon: getTreeIconName('power_system', 0), open: true, type: 'gen' },
        { id: '7-6', pid: '7', name: '전력사용량표: PowerT', icon: getTreeIconName('power_system', 0), open: true, type: 'powert' },
        { id: '7-7', pid: '7', name: '인터락: Interlock', icon: getTreeIconName('power_system', 0), open: true, type: 'interlock' },
        { id: '7-8', pid: '7', name: '발전기분전반: GenPanel', icon: getTreeIconName('power_system', 0), open: true, type: 'genpanel' }
    ]

    let m_tree = undefined;

    /***************************************************************************************************************************************/
    /* by shkoh 20211230: create tree view start                                                                                           */
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
    /* by shkoh 20211230: create tree view end                                                                                             */
    /***************************************************************************************************************************************/

    /***************************************************************************************************************************************/
    /* by shkoh 20211231: inline function start                                                                                            */
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
    /* by shkoh 20211231: inline function end                                                                                              */
    /***************************************************************************************************************************************/

    return {
        CreateTree: function(type) {
            createTree(type).then(function() {
                selectNode(type);
            });
        },
        SelectNode: function(type) { selectNode(type); },
        GetSelectNode: function() { return getSelectNode(); }
    }
}