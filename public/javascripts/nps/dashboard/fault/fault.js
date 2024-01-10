let g_treeViewController = undefined;
let g_detailViewController = undefined;
let g_alarmViewController = undefined;

$(window).resize(function() {
    resizeWindow();
});

$(document).ready(function() {
    resizeWindow();

    initTreeView();
    initDetailView();
    initAlarmView();
});

/**
 * info 정보에 포함된 내용을 토대로 모니터링뷰를 새로 그림
 * 
 * @param {JSON} info 새로 추가되거나 변경이 필요한 정보
 */
function redrawViewer(info) {
    if(g_treeViewController) g_treeViewController.RedrawTree(info);
    if(g_detailViewController) g_detailViewController.RedrawDetailView(info);
    if(g_alarmViewController) g_alarmViewController.RedrawAlarmView(info);
}

function resizeWindow() {
    const mainViewer_height = parseFloat(parent['mainViewer'].innerHeight || parent['mainViewer'].clientHeight) - 56;
    $('#tree-content').height(mainViewer_height);
    $('#detail-content').height(mainViewer_height);
    $('#alarm-content').height(mainViewer_height);

    if(g_detailViewController) g_detailViewController.ResizeDetailView();
    if(g_alarmViewController) g_alarmViewController.ResizeAlarmView();
}

function onSelectTreeNode(params) {
    if(g_detailViewController) g_detailViewController.ShowDetailView(params);
    if(g_alarmViewController && g_treeViewController) {
        let equip_tree_nodes = undefined;
        
        if(params.type == 'group') equip_tree_nodes = g_treeViewController.SearchEquipmentNodes(params.id);
        else if(params.type == 'equipment') equip_tree_nodes = [{ id: params.id }];

        g_alarmViewController.FilterAlarmListByEquipId(equip_tree_nodes);
    }
}

/***************************************************************************************************************/
/* by shkoh 20190211: TreeView Control Code Start                                                              */
/***************************************************************************************************************/
function initTreeView() {
    g_treeViewController = new TreeViewContent('#tree-content', {
        onClick: onTreeViewClick,
        onSelectRootNode: onSelectTreeNode
    });

    g_treeViewController.CreateTreeView();
}

function onTreeViewClick(event, treeId, treeNode, clickFlag) {
    if(treeNode == null) return;

    const params = {
        id: treeNode.id,
        parent_id: treeNode.pid,
        name: treeNode.name,
        type: treeNode.type,
        kind: treeNode.iconName
    }

    onSelectTreeNode(params);
}
/***************************************************************************************************************/
/* by shkoh 20190211: TreeView Control Code End                                                                */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20190211: DetailView Control Code Start                                                            */
/***************************************************************************************************************/
function initDetailView() {
    g_detailViewController = new DetailViewContent('#detail-content');
}
/***************************************************************************************************************/
/* by shkoh 20190211: DetailView Control Code End                                                              */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20190211: AlarmView Control Code Start                                                             */
/***************************************************************************************************************/
function initAlarmView() {
    g_alarmViewController = new AlarmViewContent('#alarm-content');
    g_alarmViewController.CreateAlarmView();
}
/***************************************************************************************************************/
/* by shkoh 20190211: AlarmView Control Code End                                                               */
/***************************************************************************************************************/