const g_id = $('body').attr('data-id');

let g_type_tree = undefined;
let g_equipment_tree = undefined;
let g_name = undefined;
let g_x_pos = undefined;
let g_y_pos = undefined;

$(function() {
    // by shkoh 20220103: 기본설정 데이터를 받아온 후에 데이터를 로드
    loadData().then(function(data) {
        initTypeTree(data.type);
        initEquipmentTree(data.obj_id);

        initName(data.name);
        initXPos(data.pos_x);
        initYPos(data.pos_y);
    });

    $('#saveSetting').on('click', function() {
        saveDiagramItem();
    });
});

/*************************************************************************************************************/
/* by shkoh 20220103: data process start                                                                     */
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

    if(selected_link_node === undefined) {
        alert('해당 아이템과 연계된 그룹/설비/센서 중 하나를 선택해주세요');
        return;
    }
    
    const id = selected_link_node.id.substring(2);
    const save_data = {
        id: g_id,
        group_id: selected_link_node.type === 'group' ? id : '',
        equip_id: selected_link_node.type === 'equipment' ? id : '',
        sensor_id: selected_link_node.type === 'sensor' ? id : '',
        pos_x: g_x_pos.value(),
        pos_y: g_y_pos.value(),
        type: selected_type_node.type
    };

    if(g_name.value() && g_name.value().length > 0) {
        Object.assign(save_data, {
            name: g_name.value()
        });
    }

    $.ajax({
        async: true,
        type: 'PATCH',
        url: '/api/diagram/item',
        data: save_data
    }).done(function() {
        alert('저장됐습니다');
        // by shkoh 20220104: 설정창에서 정보가 변경되는 경우에 해당 정보를 반영하기 위해서 부모창에서 아이템을 다시 로드하는 명령어를 호출함
        if(window.opener && window.opener.loadItems) window.opener.loadItems();
    }).fail(function(err) {
        console.error(err);
    });
}
/*************************************************************************************************************/
/* by shkoh 20220103: data process end                                                                       */
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
    setTypeDetail(treeNode.name);
}
/*************************************************************************************************************/
/* by shkoh 20211230: type tree end                                                                          */
/*************************************************************************************************************/

/*************************************************************************************************************/
/* by shkoh 20211231: group-equipment-sensor tree start                                                      */
/*************************************************************************************************************/
function initEquipmentTree(id) {
    g_equipment_tree = new EquipmentTree('#equipment-tree', {
        onClick: onEquipmentTreeClick
    });
    g_equipment_tree.CreateTree(id);
}

function onEquipmentTreeClick(event, treeId, treeNode, clickFlag) {
    setEquipmentDetail(treeNode);
}
/*************************************************************************************************************/
/* by shkoh 20211231: group-equipment-sensor tree end                                                        */
/*************************************************************************************************************/

/*************************************************************************************************************/
/* by shkoh 20230508: input name start                                                                       */
/*************************************************************************************************************/
function initName(name) {
    g_name = $('#i-name').kendoTextBox({
        placeholder: '공란일 경우 연계 그룹/설비/센서명',
        value: name
    }).data('kendoTextBox');
}
/*************************************************************************************************************/
/* by shkoh 20230508: input name end                                                                         */
/*************************************************************************************************************/

/*************************************************************************************************************/
/* by shkoh 20220103: input x_pos / y_pos start                                                              */
/*************************************************************************************************************/
function initXPos(pos_x) {
    g_x_pos = $('#i-x-pos').kendoNumericTextBox({
        value: pos_x,
        min: 0,
        max: 1,
        step: 0.001,
        decimals: 3,
        format: "n3",
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
        format: "n3",
        restrictDecimals: true
    }).data('kendoNumericTextBox');
}
/*************************************************************************************************************/
/* by shkoh 20220103: input x_pos / y_pos end                                                                */
/*************************************************************************************************************/

/*************************************************************************************************************/
/* by shkoh 20220103: inline function start                                                                  */
/*************************************************************************************************************/
function setTypeDetail(name) {
    let msg = '아이콘 타입을 선택하세요';
    
    if(name) {
        msg = name + '을(를) 선택했습니다';
    }

    $('#i-type').text(msg);
}

function setEquipmentDetail(info) {
    let link_name = '';
    let msg = '연계항목을 선택하세요';

    if(info && info.type) {
        switch(info.type) {
            case 'group': {
                link_name = '그룹';
                msg = '그룹 "' + info.name + '"을(를) 선택했습니다';
                break;
            }
            case 'equipment': {
                link_name = '설비';
                msg = '설비 "' + info.name + '"을(를) 선택했습니다';
                break;
            }
            case 'sensor': {
                link_name = '센서';
                msg = '센서 "' + info.name + '"을(를) 선택했습니다';
                break;
            }
        }
        
        setSensorInfo(info);
    }

    $('#i-link-type-name').text(link_name);
    $('#i-link').text(msg);
}

function setSensorInfo(info) {
    $('#i-sensor-type').text('');
    $('#i-sensor-detail').text('');

    if(info.type === 'sensor') {
        $('#i-sensor-info-table').show();
    } else {
        $('#i-sensor-info-table').hide();
        return;
    }

    $.ajax({
        async: true,
        type: 'GET',
        url: '/api/diagram/getsensorinfowithvalue?id=' + info.id.substring(2)
    }).done(function(sensor_info) {
        const { sensor_type_name, sensor_type, val, unit, label } = sensor_info;
        $('#i-sensor-type').text(sensor_type_name);

        let msg = '';
        if(sensor_type.substring(0, 1) === 'A') {
            msg = val + (unit === null ? '' : ' ' + unit);
        } else {
            msg = val + ':' + (label === null ? '' : ' ' + label);
        }

        $('#i-sensor-detail').text(msg);
    }).fail(function(err) {
        console.error(err);
    });
}
/*************************************************************************************************************/
/* by shkoh 20220103: inline function end                                                                    */
/*************************************************************************************************************/