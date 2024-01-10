/// <reference path='../../../../typings/jquery/jquery.d.ts'/>

const TreeViewContent = function(_id, _options) {
    const tree_id = _id;
    let options = {};

    options = _options;

    const m_tree_setting = {
        view: {
            showLine: true,
            addHoverDom: addHoverDom,
            removeHoverDom: removeHoverDom
        },
        data: {
            simpleData: {
                enable: true,
                idKey: 'id',
                pIdKey: 'pid'
            }
        },
        edit: {
            enable: true,
            renameTitle: '항목 이름변경',
            removeTitle: '항목 제거',
            showRemoveBtn: setRemoveBtn
        },
        async: { enable: false },
        callback: {
        }
    }

    let m_tree = undefined;

    function createTreeView() {
        $.ajax({
            async: true,
            type: 'GET',
            url: '/nps/center/datacenter/info',
        }).done(function(items) {
            if(items && items.length == 0) return;

            let tree_data = [];
            items.forEach(function(item) {
                tree_data.push({
                    id: item.id,
                    pid: item.pid,
                    name: item.name,
                    open: item.pid == null ? true : false,
                    icon: '/img/tree/building_L_0.png'
                });
            });

            m_tree = $.fn.zTree.init($(tree_id), m_tree_setting, tree_data);
        }).fail(function(xhr) {
            console.error('[Fail to create a Datacenter Info Tree] ' + xhr.responseText);
        });
    }

    /***************************************************************************************************************/
    /* by shkoh 20190218: ztree controll function start                                                            */
    /***************************************************************************************************************/
    /**
     * zTree 내 마우스 오버 시에 추가 기능을 구현할 함수
     * 
     * @param {String} treeId zTree Id
     * @param {JSON} treeNode mouse over 시 선택한 node의 JSON 정보
     */
    function addHoverDom(treeId, treeNode) {
        const span_obj = $('#' + treeNode.tId + '_span');
        if(treeNode.editNameFlag || $('#' + treeNode.tId + '_add').length > 0) return;

        const add_html =
        '<span class="button add" id="' + treeNode.tId + '_add" title="항목 추가"></span>';

        span_obj.after(add_html);

        const add_button = $('#' + treeNode.tId + '_add');
        if(add_button) add_button.bind('click', function() { addTreeNode(treeNode) });
    }

    /**
     * zTree 내 마우스 오버가 끝났을 때 기능 해제를 구현할 함수
     * 
     * @param {String} treeId zTree Id
     * @param {JSON} treeNode mouse over 해제 시 선택했던 node의 JSON 정보
     */
    function removeHoverDom(treeId, treeNode) {
        $('#' + treeNode.tId + '_add').unbind().remove();
    }

    /**
     * 선택한 node에서 [삭제] 버튼 허용여부를 설정함
     * 
     * @param {String} treeId zTree Id
     * @param {JSON} treeNode 선택한 node의 JSON 정보
     */
    function setRemoveBtn(treeId, treeNode) {
        return treeNode.pid != null && !treeNode.isParent;
    }

    let newCount = 1;
    function addTreeNode(treeNode) {
        if(!confirm(treeNode.name + ' 내에 새로운 항목을 추가하시겠습니까?')) return false;

        $.ajax({
            async: true,
            type: 'POST',
            url: '/nps/center/datacenter/add',
            data: {
                insert_info: JSON.stringify({
                    pid: treeNode.id,
                    type: 'NPS01'
                })
            }
        });
        
        const new_node = m_tree.addNodes(treeNode, { id: (100 + newCount), pid: treeNode.id, name: 'new node' + (newCount++) }, false);
        return false;
    }
    /***************************************************************************************************************/
    /* by shkoh 20190218: ztree controll function end                                                              */
    /***************************************************************************************************************/

    return {
        CreateTreeView: function() { createTreeView(); }
    };
}