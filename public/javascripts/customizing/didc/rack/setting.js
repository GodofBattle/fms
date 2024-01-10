const g_id = $('body').attr('data-id');

let g_type_tree = undefined;
let g_equipment_tree = undefined;
let g_x_pos = undefined;
let g_y_pos = undefined;
let g_z_index = undefined;
let g_width = undefined;
let g_height = undefined;
let g_name = undefined;
let g_p_name = undefined;

$(function() {
    loadData().then(function(data) {
        initTypeTree(data.type);
        initEquipmentTree('E_' + data.equip_id);

        initXPos(data.pos_x);
        initYPos(data.pos_y);
        initZIndex(data.z_index);

        initWidth(data.width);
        initHeight(data.height);

        initName(data.name);
        initParentName(data.p_name);
    });

    $('#saveSetting').on('click', function() {
        saveDiagramItem();
    });
});

/*************************************************************************************************************/
/* by shkoh 20230519: data process start                                                                     */
/*************************************************************************************************************/
function loadData() {
    return new Promise(function(resolve, reject) {
        $.ajax({
            async: true,
            type: 'GET',
            url: '/api/rackDiagram/getitem?id=' + g_id
        }).done(function(data) {
            resolve(data);
        }).fail(function(err) {
            console.error(err);
            reject(err);
        });
    });
}

function saveDiagramItem() {
    const selcted_link_node = g_equipment_tree.GetSelectNode();

    if(selcted_link_node === undefined || selcted_link_node.type !== 'equipment') {
        alert('반드시 설비 1개를 선택해주세요');
        return;
    }

    const equip_id = selcted_link_node.id.substring(2);
    const selected_type_node = g_type_tree.GetSelectNode();

    const save_data = {
        id: g_id,
        name: g_name.value(),
        p_name: g_p_name.value(),
        pos_x: g_x_pos.value(),
        pos_y: g_y_pos.value(),
        z_index: g_z_index.value(),
        width: g_width.value(),
        height: g_height.value(),
        type: selected_type_node.type,
        equip_id: parseInt(equip_id)
    }

    $.ajax({
        async: true,
        type: 'PATCH',
        url: '/api/rackDiagram/item',
        data: save_data
    }).done(function() {
        alert('저장됐습니다');

        // by shkoh 20230519: 설정창에서 정보가 변경되는 경우에 해당 정보를 반영하기 위해서 부모창에서 아이템을 다시 로드하는 명령어를 호출함
        if(window.opener && window.opener.loadItems) {
            window.opener.loadItems();
        }
    }).fail(function(err) {
        console.error(err);
    });
}
/*************************************************************************************************************/
/* by shkoh 20230519: data process end                                                                       */
/*************************************************************************************************************/

/*************************************************************************************************************/
/* by shkoh 20211230: type tree start                                                                        */
/*************************************************************************************************************/
function initTypeTree(type) {
    g_type_tree = new TypeTree('#type-tree', {
        onClick: onTypeTreeClick
    });
    g_type_tree.CreateTree(type);
}

function onTypeTreeClick(event, treeId, treeNode, clickFlag) {
    // setTypeDetail(treeNode.name);
}
/*************************************************************************************************************/
/* by shkoh 20211230: type tree end                                                                          */
/*************************************************************************************************************/

/*************************************************************************************************************/
/* by shkoh 20230519: group-equipment tree start                                                             */
/*************************************************************************************************************/
function initEquipmentTree(id) {
    g_equipment_tree = new EquipmentTree('#equipment-tree', {
        onClick: onEquipmentTreeClick
    });
    g_equipment_tree.CreateTree(id);
}

function onEquipmentTreeClick(event, treeId, treeNode, clickFlag) {
    // setEquipmentDetail(treeNode);
}
/*************************************************************************************************************/
/* by shkoh 20230519: group-equipment tree end                                                               */
/*************************************************************************************************************/

/*************************************************************************************************************/
/* by shkoh 20230519: input x_pos / y_pos start                                                              */
/*************************************************************************************************************/
function initXPos(pos_x) {
    g_x_pos = $('#i-x-pos').kendoNumericTextBox({
        value: pos_x,
        min: 0,
        max: 1,
        step: 0.001,
        decimals: 3,
        format: 'n3',
        restrictDecimals: true
    }).data('kendoNumericTextBox');
}

function initYPos(pos_y) {
    g_y_pos = $('#i-y-pos').kendoNumericTextBox({
        value: pos_y,
        min: 0,
        max: 1,
        step: 0.001,
        decimals: 3,
        format: 'n3',
        restrictDecimals: true
    }).data('kendoNumericTextBox');
}

function initZIndex(z_index) {
    g_z_index = $('#i-z-index').kendoNumericTextBox({
        value: z_index,
        min: 0,
        max: 9999,
        step: 1,
        decimals: 0,
        format: 'n0',
        restrictDecimals: true
    }).data('kendoNumericTextBox');
}
/*************************************************************************************************************/
/* by shkoh 20230519: input x_pos / y_pos end                                                                */
/*************************************************************************************************************/

/*************************************************************************************************************/
/* by shkoh 20230519: input width / height start                                                             */
/*************************************************************************************************************/
function initWidth(width) {
    g_width = $('#i-width').kendoTextBox({
        placeholder: '아이템의 가로길이를 정의합니다(예: 12px)',
        value: width,
    }).data('kendoTextBox');
}

function initHeight(height) {
    g_height = $('#i-height').kendoTextBox({
        placeholder: '아이템의 세로길이를 정의합니다(예: 12px)',
        value: height,
    }).data('kendoTextBox');
}
/*************************************************************************************************************/
/* by shkoh 20230519: input width / height end                                                               */
/*************************************************************************************************************/

/*************************************************************************************************************/
/* by shkoh 20230519: input name start                                                                       */
/*************************************************************************************************************/
function initName(name) {
    g_name = $('#i-name').kendoTextBox({
        placeholder: '랙의 명칭. 공란일 경우 설정한 설비명으로 표기됩니다',
        value: name,
    }).data('kendoTextBox');
}

function initParentName(p_name) {
    g_p_name = $('#i-p-name').kendoTextBox({
        placeholder: '랙이 속한 컨테인먼트명을 작성합니다. 공란일 수 있습니다',
        value: p_name,
    }).data('kendoTextBox');
}
/*************************************************************************************************************/
/* by shkoh 20230519: input name end                                                                         */
/*************************************************************************************************************/

/*************************************************************************************************************/
/* by shkoh 20230519: inline function start                                                                  */
/*************************************************************************************************************/
function setEquipmentDetail(info) {
    let msg = '연계 설비를 선택하세요';

    if(info && info.type && info.type === 'equipment') {
        msg = '설비 "' + info.name + '"을(를) 선택했습니다';
    } else {
        msg = '설비만 연계 가능합니다';
    }

    $('#i-link').text(msg);
}
/*************************************************************************************************************/
/* by shkoh 20230519: inline function end                                                                    */
/*************************************************************************************************************/