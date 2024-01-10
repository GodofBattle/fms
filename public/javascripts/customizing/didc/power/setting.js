const g_id = $('body').attr('data-id');

let g_type_tree = undefined;
let g_equipment_tree = undefined;
let g_x_pos = undefined;
let g_y_pos = undefined;
let g_name = undefined;

$(function() {
    loadData().then(function(data) {
        initTypeTree(data.type);
        initEquipmentTree(data.obj_id);

        initXPos(data.pos_x);
        initYPos(data.pos_y);

        initName(data.name);
    });

    $('#i-diselected-equipment').on('click', function() {
        if(g_equipment_tree) {
            g_equipment_tree.CancelSelectedNode();
        }
    });

    $('#saveSetting').on('click', function() {
        saveDiagramItem();
    });
});

/*************************************************************************************************************/
/* by shkoh 20230802: data process Start                                                                     */
/*************************************************************************************************************/
function loadData() {
    return new Promise(function(resolve, reject) {
        $.ajax({
            async: true,
            type: 'GET',
            url: '/api/diagram/getitem?id=' + g_id
        }).done(function(data) {
            resolve(data);
        }).fail(function(err) {
            console.error(err);
            reject(err);
        });
    });
}

function saveDiagramItem() {
    const selected_type_node = g_type_tree.GetSelectNode();
    const selected_link_node = g_equipment_tree.GetSelectNode();

    let group_id = undefined;
    let equip_id = undefined;
    let sensor_id = undefined;
    
    if(selected_link_node) {
        console.info(selected_link_node);
        const [ type, id ] = selected_link_node.id.split('_');
        switch(type) {
            case 'G': { group_id = parseInt(id); break; }
            case 'E': { equip_id = parseInt(id); break; }
            case 'S': { sensor_id = parseInt(id); break; }
        }
    }

    const save_data = {
        id: g_id,
        name: g_name.value(),
        pos_x: g_x_pos.value(),
        pos_y: g_y_pos.value(),
        type: selected_type_node.type,
        group_id,
        equip_id,
        sensor_id
    };

    $.ajax({
        async: true,
        type: 'PATCH',
        url: '/api/diagram/item',
        data: save_data
    }).done(function() {
        alert('저장됐습니다');

        // by shkoh 20230803: 설정창에서 정보가 변경되는 경우에 해당 정보를 반영하기 위해서 부모창에서 아이템을 다시 로드하는 명령어를 호출함
        if(window.opener && window.opener.loadItems) {
            window.opener.loadItems();
        }
    }).fail(function(err) {
        console.error(err);
    });
}
/*************************************************************************************************************/
/* by shkoh 20230802: data process End                                                                       */
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
/*************************************************************************************************************/
/* by shkoh 20230519: input x_pos / y_pos end                                                                */
/*************************************************************************************************************/

/*************************************************************************************************************/
/* by shkoh 20230519: input name start                                                                       */
/*************************************************************************************************************/
function initName(name) {
    g_name = $('#i-name').kendoTextBox({
        placeholder: '아이콘의 명칭. 공란일 경우 표시되지 않습니다',
        value: name,
    }).data('kendoTextBox');
}
/*************************************************************************************************************/
/* by shkoh 20230519: input name end                                                                         */
/*************************************************************************************************************/