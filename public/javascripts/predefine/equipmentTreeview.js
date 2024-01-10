/**
 * 
 * @param {*} onTreeViewClick 
 */
const treeView = function(onClick) {
    let m_ztree = undefined;
    let treeNode = undefined;
    let childTreeNodes = undefined;

    function getTreeIconName(iconName) {
        return "/img/tree/" + iconName + "_L_0.png";
    }
    // ztree 생성
    function makeEquipCodeTree(tempData) {
        let insertedData = [];
        let sorting, id, pid, name, iconName, open, type;
    
        for(let idx = 0; idx < tempData.length; idx++) {
            sorting = tempData[idx].sorting;
            id = tempData[idx].id;
            pid = tempData[idx].pid;
            name = tempData[idx].name;
            iconName = tempData[idx].icon;
            model_name = tempData[idx].model_name;
            io_type_name = tempData[idx].io_type_name;
            has_modbus = tempData[idx].has_modbus === 0 ? false : true;
    
            if(pid.substr(0, 1) == "E") type = "equipment";
            else type = "equipgroup";
            
            treeIcon = getTreeIconName(iconName);
    
            insertedData.push({
                sorting: sorting,
                id: id,
                pId: pid,
                name: name,
                icon: treeIcon,
                open: false,
                type: type,
                model_name: model_name,
                io_type_name: io_type_name,
                has_modbus: has_modbus
            });
        }

        m_ztree = $.fn.zTree.init($("#equip-setting-tree"), {
            view: { 
                showLine: true
            },
            data: { simpleData: { enable: true } },
            callback: {
                beforeClick: undefined,
                beforeRightClick: undefined,
                onRightClick: undefined,
                onClick: onClick
            }
        }, insertedData);
    }

    function createEquipCodeTree() {
        let tempData = [];
        
        $.ajax({
            async: true,
            url: `/api/predefine/equipment/tree`,
            type: 'GET',
            dataType: 'json'
        }).done(function(data) {
            tempData = data;
        }).fail(function(err) {
            tempData = [];
        }).always(function() {
            if(tempData.length == 0) return;
            makeEquipCodeTree(tempData);
        });
    }

    function getCurrentNode() {
        if(m_ztree != undefined) {
            treeNode = m_ztree.getSelectedNodes()[0];

            return treeNode;
        } else { return undefined; }
    }

    function exapandNode(node) {
        m_ztree.expandNode(node);
    }

    function addNode(parentNode,newChildNode) {
        m_ztree.addNodes(parentNode,newChildNode);
        
        const new_node = m_ztree.getNodeByParam('id', newChildNode.id);
        sortTree(parentNode, new_node);
    }

    function updateNode() {
        let newNodeIdx = [];
        childTreeNodes = m_ztree.getNodesByParam("sorting", 2);

        //updateNode를 위해 update index를 구함
        for(let n_idx = 0; n_idx < g_selectedEquipChildNode.length; n_idx++) {
            for(let d_idx = 0; d_idx < childTreeNodes.length; d_idx++) {
                if(g_selectedEquipChildNode[n_idx].id == childTreeNodes[d_idx].id) {
                    newNodeIdx.push(d_idx);
                }
            }
        }

        //update index에 조합된 이름을 넣어 updateNode시킴
        for(let u_idx = 0; u_idx < newNodeIdx.length; u_idx++) {
            if(g_selectedEquipChildNode[u_idx].equip_name == '') {
                childTreeNodes[newNodeIdx[u_idx]].name = '(설비명 미지정)';
            } else {
                childTreeNodes[newNodeIdx[u_idx]].name = g_selectedEquipChildNode[u_idx].equip_name;
            }

            if(g_selectedEquipChildNode[u_idx].equip_model_name == '') {
                childTreeNodes[newNodeIdx[u_idx]].model_name = '';
            } else {
                childTreeNodes[newNodeIdx[u_idx]].model_name = g_selectedEquipChildNode[u_idx].equip_model_name;
            }

            childTreeNodes[newNodeIdx[u_idx]].io_type_name = g_selectedEquipChildNode[u_idx].io_type_name;

            m_ztree.updateNode(childTreeNodes[newNodeIdx[u_idx]]);
        }
    }

    function removeNode() {
        childTreeNodes = m_ztree.getNodesByParam("sorting", 2);

        for(let r_idx = 0; r_idx < childTreeNodes.length; r_idx++){
            if(childTreeNodes[r_idx].id == g_selectedEquipChildId){
                m_ztree.removeNode(childTreeNodes[r_idx]);
            }
        }
    }

    // by shkoh 20200616: 변경이 필요한 항목만을 비교하여 수정
    function updateTreeNode(updateNode) {
        const node = m_ztree.getNodeByParam('id', updateNode.pd_equip_id);
        if(node.name !== updateNode.equip_name) {
            node.name = updateNode.equip_name;
        }

        if(node.model_name !== updateNode.equip_model_name) {
            node.model_name = updateNode.equip_model_name;
        }

        if(node.io_type_name !== updateNode.io_type_name) {
            node.io_type_name = updateNode.io_type_name;
            let has_modbus = undefined;
            if(updateNode.io_type_code === `I0001` || updateNode.io_type_code === `I0005` || updateNode.io_type_code === `I0006`) {
                has_modbus = true;
            } else {
                has_modbus = false;
            }

            if(node.has_modbus !== has_modbus) node.has_modbus = has_modbus;
        }

        m_ztree.updateNode(node);

        let parent_node = m_ztree.getNodeByParam(`id`, node.pId, null);
        if(parent_node) sortTree(parent_node, node);
    }

    function removeTreeNode(id) {
        const node = m_ztree.getNodeByParam('id', id);
        m_ztree.removeNode(node);
    }

    function sortTree(p_node, c_node) {
        let nodes = m_ztree.getNodesByParam(`pId`, p_node.id, p_node);

        nodes.some(function(node) {
            let isMove = 0;

            if(node.name !== c_node.name) {
                const node_name_length = node.name.length;
                const c_node_name_length = node.name.length;

                const text_length = Math.min(node_name_length, c_node_name_length);
                let idx = 0;

                for(idx = 0; idx < text_length; idx++) {
                    let node_char_code = node.name.toUpperCase().charCodeAt(idx);
                    let c_node_char_code = c_node.name.toUpperCase().charCodeAt(idx);

                    if(node_char_code !== c_node_char_code) {
                        if(node_char_code < c_node_char_code) isMove = 2;
                        else isMove = 1;

                        break;
                    }
                }

                if(isMove == false && idx === text_length) {
                    if(node_name_length < c_node_name_length) isMove = 2;
                    else if(node_name_length > c_node_name_length) isMove = 1;
                }
            }

            if(isMove === 2) m_ztree.moveNode(node, c_node, `next`, false);
            else if(isMove === 1) {
                m_ztree.moveNode(node, c_node, `prev`, false);
                return true;
            }
        });
    }

    return {
        Create: function() { createEquipCodeTree(); },
        GetCurrentNode: function() { return getCurrentNode(); },
        ExpandNode: function(node) { exapandNode(node); },
        AddNodes: function(parentNode,newChildNode) { addNode(parentNode,newChildNode); },
        UpdateNodes: function() { updateNode(); },
        RemoveNodes: function() { removeNode(); },
        
        UpdateNode: function(updateNode) { updateTreeNode(updateNode); },
        RemoveNode: function(deleteId) { removeTreeNode(deleteId); }
    }
}