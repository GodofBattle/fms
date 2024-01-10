/**
 *  코드 사전설정에서 사용할 TreeView 생성
 * 
 * @param {String} id TreeView 생성 Element Id
 * @param {String} option TreeView onClick Event
 */
 const TreeView = function(id, option) {
    let m_ztree = undefined;
    const tree_id = id;
    let options = {
        onBeforeClick: undefined,
        onClick: undefined,
        onRightClick: undefined
    };

    options = option;

    function getTreeIconName(iconName) {
        return '/img/tree/' + iconName + '_L_0.png';
    }

    function makeCodeTree(tempData) {
        if(m_ztree != undefined) return;

        let insertedData = [];
        let id, pid, name, iconName, type, treeIcon;
        
        for(let idx = 0; idx < tempData.length; idx++) {
            id = tempData[idx].id;
            pid = tempData[idx].pid;
            name = tempData[idx].name;
            iconName = tempData[idx].icon;
        
            if(id.length >= 5) type = 'code';
            else type = 'groupcode';

            treeIcon = getTreeIconName(iconName);
        
            insertedData.push({
                id: id,
                pId: pid,
                name: name,
                icon: treeIcon,
                open: false,
                type: type
            });
        }

        m_ztree = $.fn.zTree.init($(tree_id), {
            view: { showLine: false },
            data: { simpleData: { enable: true } },
            callback: {
                beforeClick: options.onBeforeClick,
			    beforeRightClick: undefined,
                onClick: options.onClick,
                onRightClick: options.onRightClick
            },
            async: { enable: false }
        }, insertedData);
    }

    /**
     * kdh 20180516 사전코드 목록 데이터 불러옴
     */
    function createTree() {
        $.ajax({
            async: true,
            type: 'GET',
            dataType: 'json',
            url: `/api/predefine/code/codetree`
        }).done(function(items) {
            if(items == undefined) return;
            makeCodeTree(items);
        }).fail(function(err_code) {
            console.error('[코드 트리 항목 조회 실패]' + err_code);
        });
    }

    function selectNode(treeNode) {
        m_ztree.selectNode(treeNode);
    }

    function expandNode(treeNode) {
        m_ztree.expandNode(treeNode, true, true, true);
    }

    function addNode(newNode, codeType, isGroup) {
        if(isGroup == true) parentNode = null;
        else parentNode = m_ztree.getNodeByParam('name', codeType);
        
        m_ztree.addNodes(parentNode, newNode);
    }

    function updateNode(prevId, codeName, editId, iconName) {
        const treeNode = m_ztree.getNodesByParam('id', prevId)[0];

        if(editId == '') treeNode.name = codeName == '' ? prevId : prevId + ' | ' + codeName;
        else {
            treeNode.name = codeName == '' ? editId : editId + ' | ' + codeName;
            treeNode.id = editId;
        }

        if(treeNode.pId == 'E') treeNode.icon = getTreeIconName(iconName);
        else treeNode.icon = getTreeIconName('rack');
        
        m_ztree.updateNode(treeNode);
    }

    function removeNode(codeType, codeId, isGroup) {
        let id = '';
        
        if(isGroup) id = codeType;
        else id = codeId;

        const treeNode = m_ztree.getNodesByParam('id', id)[0];
        m_ztree.removeNode(treeNode);
    }

    function selectTreeNode(id) {
        if(m_ztree == undefined) return;

        cancelSelectedNode();
        
        const node = m_ztree.getNodeByParam('id', id, null);
        m_ztree.selectNode(node, false);
    }

    function cancelSelectedNode() {
        m_ztree.cancelSelectedNode();
    }
    
    /**
     * 트리 name 정렬을 진행함
     */
    function sortTree(codeType) {
        const nodes = m_ztree.getNodes();
        const addNode = m_ztree.getNodeByParam('id', codeType);

        nodes.forEach(function(node) {
            if(node.name < codeType) m_ztree.moveNode(node, addNode, 'next', false);
        });
    }

    /**
     * Child 트리 name 정렬을 진행함
     */
    function sortChildTree(codeType) {
        const nodes = m_ztree.getNodesByParam('pId', codeType);

        nodes.sort(function(a, b) {
            if(a.name > b.name) {
                m_ztree.moveNode(a, b, 'prev', false);
                return 1;
            } else if(a.name < b.name) {
                m_ztree.moveNode(a, b, 'next', false);
                return -1;
            }
            return 0;
        });
    }

    return {
        Create: function() { createTree(); },
        SelectNode: function(treeNode) { selectNode(treeNode); },
        ExpandNode: function(treeNode) { expandNode(treeNode); },
        AddNode: function(newNode, codeType, isGroup) { addNode(newNode, codeType, isGroup); },
        UpdateNode: function(prevId, codeName, editId, iconName) { updateNode(prevId, codeName, editId, iconName); },
        RemoveNode: function(codeType, codeId, isGroup) { removeNode(codeType, codeId, isGroup); },
        SelectTreeNode: function(id) { selectTreeNode(id); },
        CancelSelectedNode: function() { cancelSelectedNode(); },
        SortTree: function(codeType) { sortTree(codeType); },
        SortChildTree: function(codeType) { sortChildTree(codeType); }
    }
 }