/// <reference path="../../../typings/jquery/jquery.d.ts"/>
/// <reference path="../../../typings/kendo-ui/kendo.all.d.ts"/>

let g_tree = undefined;
let g_alarm_grade_list = undefined;

let g_equip_grid = undefined;
let g_sensor_grid = undefined;
let g_ai_threshold_grid = undefined;
let g_di_threshold_grid = undefined;
let g_modbus_grid = undefined;

let g_equip_datasource = undefined;
let g_sensor_datasource = undefined;
let g_ai_threshold_datasource = undefined;
let g_di_threshold_datasource = undefined;
let g_modbus_datasource = undefined;

let g_selected_item = undefined;

let g_selected_sensor_row = undefined;

$(window).resize(function() {
    resizeWindow();
});

$(document).ready(function() {
    resizeWindow();

    initAlarmGradeList();

    createTreeView();

    createPredefineEquipmentGrid();
    createPredefineSensorGrid();
    createPredefineAIThresholdGrid();
    createPredefineDIThresholdGrid();
    createPredefineModbusCmdGrid();

    createPredefineEquipmentDataSource();
    createPredefineSensorDataSource();
    createPredefineAIThresholdDataSource();
    createPredefineDIThresholdDataSource();
    createPredefineModbusCmdDataSource();

    $('#add').click(function(e) {
        if(g_selected_item === undefined) {
            alert('설비코드 혹은 사전설비가 선택되지 않았습니다');
            return;
        }

        if(g_selected_item.type === 'equipgroup') {
            g_equip_grid.addRow();
            g_equip_datasource.sync();
        } else {
            g_sensor_grid.addRow();
            g_sensor_datasource.sync();
        }
    });

    $('#save').click(function(e) {
        if(g_selected_item === undefined) {
            alert('설비코드 혹은 사전설비가 선택되지 않았습니다');
            return;
        }

        if(g_selected_item.type === 'equipgroup') {
            g_equip_datasource.sync();
        } else {
            g_sensor_datasource.sync();
        }
    });

    $('#cancel').click(function(e) {
        if(g_selected_item === undefined) {
            alert('설비코드 혹은 사전설비가 선택되지 않았습니다');
            return;
        }

        if(g_selected_item.type === 'equipgroup') {
            g_equip_datasource.read();
        } else {
            g_sensor_datasource.read();
        }
    });

    $('#delete').click(function(e) {
        if(g_selected_item === undefined) {
            alert('설비코드 혹은 사전설비가 선택되지 않았습니다');
            return;
        }

        if(g_selected_item.type === 'equipgroup') {
            deleteRowOfEquipmentGrid();
        } else {
            deleteRowOfSensorGrid();
        }
    });

    $('#addRowForModal').click(function(e) {
        if(g_selected_sensor_row === undefined) {
            alert('사전설비의 센서항목이 선택되지 않았습니다');
            return;
        }

        if(g_selected_sensor_row.sensor_type.includes('A')) {
            g_ai_threshold_grid.addRow();
            g_ai_threshold_datasource.sync();
        } else if(g_selected_sensor_row.sensor_type.includes('D')) {
            g_di_threshold_grid.addRow();
            g_di_threshold_datasource.sync();
        } else if(g_selected_sensor_row.sensor_type.includes('M')) {
            g_modbus_grid.addRow();
            g_modbus_datasource.sync();
        }
    });

    $('#saveRowForModal').click(function(e) {
        if(g_selected_sensor_row === undefined) {
            alert('사전설비의 센서항목이 선택되지 않았습니다');
            return;
        }

        if(g_selected_sensor_row.sensor_type.includes('A')) {
            g_ai_threshold_datasource.sync();
        } else if(g_selected_sensor_row.sensor_type.includes('D')) {
            g_di_threshold_datasource.sync();
        } else if(g_selected_sensor_row.sensor_type.includes('M')) {
            g_modbus_datasource.sync();
        }
    });

    $('#deleteRowForModal').click(function() {
        if(g_selected_sensor_row === undefined) {
            alert('사전설비의 센서항목이 선택되지 않았습니다');
            return;
        }

        if(g_selected_sensor_row.sensor_type.includes('A')) {
            deleteRowOfThreshold(g_ai_threshold_grid, g_ai_threshold_datasource);
        } else if(g_selected_sensor_row.sensor_type.includes('D')) {
            deleteRowOfThreshold(g_di_threshold_grid, g_di_threshold_datasource);
        } else if(g_selected_sensor_row.sensor_type.includes('M')) {
            deleteRowOfModbus();
        }
    });

    $('#sensorSettingInfo').on('shown.bs.modal', function() {
        if(g_selected_sensor_row && g_selected_sensor_row.sensor_type.includes('A') && g_ai_threshold_datasource) g_ai_threshold_datasource.read();
        if(g_selected_sensor_row && g_selected_sensor_row.sensor_type.includes('D') && g_di_threshold_datasource) g_di_threshold_datasource.read();
        if(g_selected_sensor_row && g_selected_sensor_row.sensor_type.includes('M') && g_modbus_datasource) g_modbus_datasource.read();

        if(g_ai_threshold_grid) g_ai_threshold_grid.resize();
        if(g_di_threshold_grid) g_di_threshold_grid.resize();
        if(g_modbus_grid) g_modbus_grid.resize();
    });

    $('#sensorSettingInfo').on('hidden.bs.modal', function() {
        g_selected_sensor_row = undefined;
    });
});

/**
 * by shkoh 20200612: 공통작업
 */
function calculateHeight() {
    const viewer_height = parent['mainViewer'].innerHeight || parent['mainViewer'].clientHeight;
    return parseFloat(viewer_height) - 54;
}

function resizeWindow() {
    $('#EquipCodeTree, .panel-body').height(calculateHeight());
    $('#equip-grid, #sensor-grid').height(calculateHeight());
    if(g_equip_grid) {
        g_equip_grid.resize();
        g_equip_grid.refresh();
    }
    if(g_sensor_grid) {
        initSensorGridColumnWidth();

        g_sensor_grid.resize();
        g_sensor_grid.refresh();
    }
}

function showGrid(type, has_modbus) {
    if(type === 'equipgroup') {
        $('#equip-grid').show();
        $('#sensor-grid').hide();

        if(g_equip_grid) g_equip_grid.resize();
    } else {
        $('#equip-grid').hide();
        $('#sensor-grid').show();

        if(g_sensor_grid) {
            if(has_modbus) g_sensor_grid.showColumn('mc_id');
            else g_sensor_grid.hideColumn('mc_id');

            initSensorGridColumnWidth();

            g_sensor_grid.resize();
        }
    }

    $('.button-right').show();
}

function settingTitle(title, options) {
    $('#grid-title-name').text(title);
    $('#grid-title-option').text(options);
}

function initSensorGridColumnWidth() {
    // by shkoh 20200615: 사전 설비가 변경 될 때마다 센서리스트를 새로 읽는데, 그 때마다 기본 크기로 컬럼의 폭을 지정함 
    // modbus id 컬럼이 존재할 경우 --> pd_sensor_id: 5% / sensor_name: 15% / sensor_type: 5% / sensor_code: 15% / pd_threshold_id: 15% / oid: 15% / node_id: 5% / div_value: 15% / mc_id: 10%
    // modbus id 컬럼이 없는 경우 --> pd_sensor_id: 7% / sensor_name: 16% / sensor_type: 7% / sensor_code: 16% / pd_threshold_id: 16% / oid: 16% / node_id: 6% / div_value: 16%
    if(g_sensor_grid) {
        let grid_width = $('#sensor-grid').width();
        let has_modbus = !g_sensor_grid.columns.filter(function(c) { return c.field === 'mc_id' })[0].hidden;
        
        g_sensor_grid.columns.forEach(function(c, idx) {
            switch(c.field) {
                case 'sensor_name':
                case 'pd_threshold_id':
                case 'oid':
                case 'sensor_code':
                case 'div_value':
                    g_sensor_grid.resizeColumn(c, parseFloat(grid_width * (has_modbus ? 0.15 : 0.16)));
                    break;
                case 'pd_sensor_id':
                case 'sensor_type':
                    g_sensor_grid.resizeColumn(c, parseFloat(grid_width * (has_modbus ? 0.05 : 0.07)));
                    break;
                case 'node_id':
                    g_sensor_grid.resizeColumn(c, parseFloat(grid_width * (has_modbus ? 0.05 : 0.06)));
                    break;
                case 'mc_id':
                    if(has_modbus) g_sensor_grid.resizeColumn(c, parseFloat(grid_width * 0.1));
                    break;
            }
        });
    }
}

function showModalContent(mode) {
    switch(mode) {
        case 'A': {
            $('#ai-threshold-grid').show();
            $('#di-threshold-grid').hide();
            $('#modbus-cmd-grid').hide();
            break;
        }
        case 'D': {
            $('#ai-threshold-grid').hide();
            $('#di-threshold-grid').show();
            $('#modbus-cmd-grid').hide();
            break;
        }
        case 'M': {
            $('#ai-threshold-grid').hide();
            $('#di-threshold-grid').hide();
            $('#modbus-cmd-grid').show();
            break;
        }
    }
}

function initAlarmGradeList() {
    $.ajax({
        async: true,
        type: 'GET',
        dataType: 'json',
        url: '/api/predefine/equipment/alarmgrade'
    }).done(function(data) {
        g_alarm_grade_list = data;
    }).fail(function(err) {
        console.error(err.responseText);
    });
}

function deleteRowOfEquipmentGrid() {
    const delete_row = g_equip_grid.select();
    if(delete_row.length === 0) {
        alert('삭제하기 위한 사전 설비를 선택하세요');
        return;
    } else {
        const delete_item = g_equip_grid.dataItem(delete_row[0].parentElement);
        const isConfirm = confirm('사전설비 ' + delete_item.equip_name + '(ID: ' + delete_item.pd_equip_id + ')를 삭제하시겠습니까?\n해당 사전설비와 연계된 센서항목과 Modbus 항목들 모두 삭제됩니다');
        if(isConfirm) {
            g_equip_grid.removeRow(delete_row);
            g_equip_datasource.sync();
        }
    }
}

function deleteRowOfSensorGrid() {
    const delete_row = g_sensor_grid.select();
    if(delete_row.length === 0) {
        alert('삭제하기 위한 사전 설비의 항목을 선택하세요');
        return;
    } else {
        const delete_item = g_sensor_grid.dataItem(delete_row[0].parentElement);
        const isConfirm = confirm('사전설비 항목 ' + delete_item.sensor_name + '(ID: ' + delete_item.pd_sensor_id + ')를 삭제하시겠습니까?');
        if(isConfirm) {
            g_sensor_grid.removeRow(delete_row);
            g_sensor_datasource.sync();
        }
    }
}

function deleteRowOfThreshold(grid, datasource) {
    const delete_row = grid.select();
    if(delete_row.length === 0) {
        alert('삭제하기 위한 사전 설비의 임계값 항목을 선택하세요');
        return;
    } else {
        const delete_item = grid.dataItem(delete_row[0].parentElement);
        const isConfirm = confirm('사전설비 임계값 항목 ' + delete_item.pd_threshold_name + '(ID: ' + delete_item.pd_threshold_id + ')를 삭제하시겠습니까?\n임계값을 삭제할 경우에 해당 임계값을 가지고 있는 사전센서 항목들에 설정된 임계값도 모두 초기화됩니다');
        if(isConfirm) {
            grid.removeRow(delete_row);
            datasource.sync();
        }
    }
}

function deleteRowOfModbus() {
    const delete_row = g_modbus_grid.select();
    if(delete_row.length === 0) {
        alert('삭제하기 위한 사전 설비의 MODBUS 항목을 선택하세요');
        return;
    } else {
        const delete_item = g_modbus_grid.dataItem(delete_row[0].parentElement);
        const isConfirm = confirm('사전설비의 MODBUS 항목 ID: ' + delete_item.mc_id + '를 삭제하시겠습니까?\n삭제할 경우에 해당 ID를 선택한 사전센서 항목의 MODBUS ID가 모두 초기화됩니다');
        if(isConfirm) {
            g_modbus_grid.removeRow(delete_row);
            g_modbus_datasource.sync();
        }
    }
}

/**
 * by shkoh 20200612: 사전 설비 트리
 */
function createTreeView() {
    g_tree = new treeView(onTreeViewClick);
    g_tree.Create();

    $('#EquipCodeTree').mCustomScrollbar({
        theme: 'minimal-dark',
        axis: 'y',
        scrollbarPosition: 'outside',
        mouseWheel: {
            preventDefault: true
        }
    });
}

function onTreeViewClick(event, treeId, treeNode) {
    g_selected_item = treeNode;

    // by shkoh 20200612: tree click 시, 해당 node를 펼침
    if(treeNode.children && treeNode.open === false) g_tree.ExpandNode(treeNode);

    showPredefinePanel(treeNode);
}

/**
 * 사전설비 리스트에서 특정 설비 모델의 그룹 혹은 설비 모델이 선택되었을 경우에 수행할 일
 * 
 * @param {Object} selectedItem 사전설비모델 트리에서 선택된 Object 정보
 */
function showPredefinePanel(selectedItem) {
    showGrid(selectedItem.type, selectedItem.has_modbus);
    settingTitle(selectedItem.name, selectedItem.type === 'equipgroup' ? '' : ' (PD_EQUIP_ID: ' + selectedItem.id + ', 설비모델명: ' + selectedItem.model_name + ', 통신방식: ' + selectedItem.io_type_name + ')');

    if(selectedItem.type === 'equipgroup') {
        g_equip_datasource.page(1);
        g_equip_datasource.read();
    } else {
        g_sensor_datasource.page(1);
        g_sensor_datasource.read();
    }
}

function createPredefineEquipmentGrid() {
    g_equip_grid = $('#equip-grid').kendoGrid({
        filterable: true,
        sortable: true,
        resizable: true,
        columnMenu: true,
        navigatable: true,
        editable: {
            createAt: 'bottom'
        },
        selectable: 'cell',
        pageable: true,
        noRecords: {
            template:
            '<div style="display:table;width:100%;height:100%;">' +
                '<h3 style="margin:0px;display:table-cell;vertical-align:middle;">' +
                    '<span class="label label-default" style="border-radius:0px;">' +
                        '선택한 사전 설비모델에 속한 사전설비 기본 정보가 존재하지 않습니다' +
                    '</span>' +
                '</h3>' +
            '</div>'
        },
        columns: [
            { field: 'pd_equip_id', title: 'PD_EQUIP_ID', width: '10%', filterable: false },
            { field: 'equip_name', title: '설비명', width: '30%', filterable: false, editor: textBox_max128 },
            { field: 'equip_model_name', title: '설비모델명', width: '30%', filterable: false, editor: textBox_max128 },
            { field: 'io_type_code', title: '통신방식', width: '30%', filterable: false, editor: io_type_codeDropDown, template: io_type_template }
        ]
    }).data('kendoGrid');
}


function createPredefineEquipmentDataSource() {
    g_equip_datasource = new kendo.data.DataSource({
        transport: {
            read: {
                type: 'GET',
                dataType: 'json',
                async: true,
                url: function() {
                    const type = g_selected_item ? g_selected_item.id : 'unknown';
                    return '/api/predefine/equipment/list?type=' + type;
                }
            },
            create: {
                type: 'POST',
                dataType: 'json',
                url: '/api/predefine/equipment/info'
            },
            update: {
                type: 'PATCH',
                dataType: 'json',
                url: '/api/predefine/equipment/info'
            },
            destroy: {
                type: 'DELETE',
                dataType: 'json',
                url: '/api/predefine/equipment/info'
            },
            parameterMap: function(data, type) {
                switch(type) {
                    case 'read': return data;
                    case 'create': return { info: JSON.stringify(data.models[0]) };
                    case 'update': return { info: JSON.stringify(data.models) };
                    case 'destroy': return { info: JSON.stringify(data.models[0]) };
                }
            }
        },
        requestEnd: function(e) {
            switch(e.type) {
                case 'create': {
                    // by shkoh 20200616: 신규로 아이템을 추가했다면, 해당 트리에서 동일하게 사전설비를 추가함
                    if(g_tree) {
                        const new_tree_node = {
                            sorting: 2,
                            id: e.response.insertId,
                            pId: g_selected_item.id,
                            icon: g_selected_item.icon,
                            name: '(설비명 미지정)',
                            model_name: '',
                            io_type_name: 'SNMP'
                        }

                        g_tree.AddNodes(g_selected_item, new_tree_node);
                    }
                    
                    e.sender.read().then(function() {
                        // by shkoh 20200616: pd_equipment 그리드에서 추가가 발생하면 추가가 발생한 페이지로 이동하고 추가할 rows의 설비명부터 수정 가능하도록 변경
                        e.sender.page(e.sender.totalPages());

                        const last_cell = g_equip_grid.tbody.find('tr:last td:eq(1)');
                        g_equip_grid.editCell(last_cell);
                    });
                    break;
                }
                case 'update': {
                    if(g_tree) {
                        const update_items = JSON.parse(e.response.updateItems);
                        update_items.forEach(function(item) {
                            g_tree.UpdateNode(item);
                        });
                    }

                    e.sender.read();
                    break;
                }
                case 'destroy': {
                    if(g_tree) {
                        g_tree.RemoveNode(e.response.pd_equip_id);
                    }
                    break;
                }
            }
        },
        change: function(e) {
            switch(e.action) {
                case 'add': {
                    // by shkoh 20200616: pd_equipment에 설비 추가 시, equip_code를 지정하여 추가함
                    e.items[0].io_type_name = 'SNMP';
                    e.items[0].equip_code = g_selected_item.id;
                    break;
                }
            }
        },
        autoSync: false,
        batch: true,
        pageSize: 100,
        schema: {
            model: {
                id: 'pd_equip_id',
                fields: {
                    pd_equip_id: { editable: false, validation: { required: true } },
                    equip_name: { editable: true, defaultValue: '' },
                    equip_model_name: { editable: true, defaultValue: '' },
                    io_type_code: { editable: true, defaultValue: 'I0000' }
                }
            }
        }
    });

    g_equip_grid.setDataSource(g_equip_datasource);
}

function createPredefineSensorGrid() {
    g_sensor_grid = $('#sensor-grid').kendoGrid({
        filterable: true,
        sortable: true,
        resizable: true,
        columnMenu: true,
        navigatable: true,
        editable: {
            createAt: 'bottom'
        },
        selectable: 'cell',
        pageable: true,
        noRecords: {
            template:
            '<div style="display:table;width:100%;height:100%;">' +
                '<h3 style="margin:0px;display:table-cell;vertical-align:middle;">' +
                    '<span class="label label-default" style="border-radius:0px;">' +
                        '선택한 사전 설비에 등록된 항목 정보가 존재하지 않습니다' +
                    '</span>' +
                '</h3>' +
            '</div>'
        },
        columns: [
            { field: 'pd_sensor_id', title: 'PD_SENSOR_ID', filterable: false },
            { field: 'sensor_name', title: '명칭', filterable: false, editor: textBox_max32 },
            { field: 'sensor_type', title: '타입', filterable: true, editor: sensorTypeDropDownEditor },
            { field: 'sensor_code', title: '종류', filterable: true, editor: sensorCodeListDropDownEditor, template: sensor_code_template },
            { field: 'pd_threshold_id', title: '임계값 지정', filterable: true, editor: pdThresholdListDropDownEditor, template: pd_threshold_template },
            { field: 'oid', title: 'ADDRESS', filterable: false },
            { field: 'node_id', title: '순번', filterable: false },
            { field: 'div_value', title: '표현식', filterable: false },
            { field: 'mc_id', title: 'MODBUS ID', filterable: false, editor: pdModbusDropDownEditor, template: pd_modbus_template }
        ]
    }).data('kendoGrid');
}

function createPredefineSensorDataSource() {
    g_sensor_datasource = new kendo.data.DataSource({
        transport: {
            read: {
                async: true,
                type: 'GET',
                dataType: 'json',
                url: function() {
                    const id = g_selected_item ? g_selected_item.id : 'unknown';
                    return '/api/predefine/equipment/sensor?id=' + id;
                }
            },
            create: {
                type: 'POST',
                dataType: 'json',
                url: '/api/predefine/equipment/sensor'
            },
            update: {
                type: 'PATCH',
                dataType: 'json',
                url: '/api/predefine/equipment/sensor'
            },
            destroy: {
                type: 'DELETE',
                dataType: 'json',
                url: '/api/predefine/equipment/sensor'
            },
            parameterMap: function(data, type) {
                switch(type) {
                    case 'read': return data;
                    case 'create': return { info: JSON.stringify(data.models[0]) };
                    case 'update': return { info: JSON.stringify(data.models) };
                    case 'destroy': return { info: JSON.stringify(data.models[0]) };
                }
            }
        },
        requestEnd: function(e) {
            switch(e.type) {
                case 'create': {
                    e.sender.read().then(function() {
                        // by shkoh 20200616: pd_equipment 그리드에서 추가가 발생하면 추가가 발생한 페이지로 이동하고 추가할 rows의 설비명부터 수정 가능하도록 변경
                        e.sender.page(e.sender.totalPages());

                        const last_cell = g_sensor_grid.tbody.find('tr:last td:eq(1)');
                        g_sensor_grid.editCell(last_cell);
                    });
                    break;
                }
                case 'update': {
                    e.sender.read();
                    break;
                }
                case 'destroy': {
                    e.sender.read().then(function() {
                        // by shkoh 20200617: 항목을 삭제했을 때, 현재 페이지에 아이템이 존재하지 않게되면, 바로 앞 페이지로 이동함
                        const view_item = e.sender.view();
                        const current_page = e.sender.page();
                        if(view_item.length === 0 && current_page !== 1) {
                            e.sender.page(current_page - 1);
                        }
                    });
                }
            }
        },
        change: function(e) {
            switch(e.action) {
                case 'itemchange': {
                    if(e.field === 'sensor_code') {
                        this.fetch(function() {
                            e.items[0].pd_threshold_id = 0;
                            e.items[0].pd_threshold_name = '임계값 미설정';    
                        });
                    }
                    break;
                }
                case 'add': {
                    e.items[0].pd_equip_id = parseInt(g_selected_item.id);
                    e.items[0].sensor_code_name = 'S0001 | 온도센서 (℃)';
                    break;
                }
            }
        },
        autoSync: false,
        batch: true,
        pageSize: 100,
        schema: {
            model: {
                id: 'pd_sensor_id',
                fields: {
                    pd_sensor_id: { editable: false, validation: { required: true } },
                    sensor_name: { editable: true, defaultValue: '' },
                    sensor_type: { editable: true, defaultValue: 'AI' },
                    sensor_code: { editable: true, defaultValue: 'S0001' },
                    sensor_code_name: { editable: true },
                    pd_threshold_id: { editable: true, defaultValue: 0 },
                    pd_threshold_name: { editable: false, defaultValue: '임계값 미설정' },
                    oid: { editable: true, defaultValue: '' },
                    node_id: { editable: false, type: 'number', validation: { min: 0 } },
                    div_value: { editable: true, defaultValue: 'VAL' },
                    mc_id: { editable: true, defaultValue: 0 }
                }
            }
        }
    });

    g_sensor_grid.setDataSource(g_sensor_datasource);
}

function createPredefineAIThresholdGrid() {
    g_ai_threshold_grid = $('#ai-threshold-grid').kendoGrid({
        filterable: true,
        sortable: true,
        resizable: true,
        columnMenu: true,
        navigatable: true,
        editable: {
            createAt: 'bottom'
        },
        selectable: 'cell',
        pageable: false,
        noRecords: {
            template:
            '<div style="display:table;width:100%;height:100%;">' +
                '<h3 style="margin:0px;display:table-cell;vertical-align:middle;">' +
                    '<span class="label label-default" style="border-radius:0px;">' +
                        '선택한 사전 설비 항목과 관련된 AI 임계값 정보가 존재하지 않습니다' +
                    '</span>' +
                '</h3>' +
            '</div>'
        },
        columns: [
            { field: 'pd_threshold_id', title: '임계값 ID', filterable: false, width: 100 },
            { field: 'pd_threshold_name', title: '임계값 명칭', filterable: false, width: 120 },
            { field: 'a_critical_min', title: '<< 위험', filterable: false, width: 100 },
            { field: 'a_major_min', title: '<< 경고', filterable: false, width: 100 },
            { field: 'a_warning_min', title: '<< 주의', filterable: false, width: 100 },
            { field: 'a_warning_max', title: '주의 >>', filterable: false, width: 100 },
            { field: 'a_major_max', title: '경고 >>', filterable: false, width: 100 },
            { field: 'a_critical_max', title: '위험 >>', filterable: false, width: 100 }
        ],
        height: 500
    }).data('kendoGrid');
}

function createPredefineAIThresholdDataSource() {
    g_ai_threshold_datasource = new kendo.data.DataSource({
        transport: {
            read: {
                async: true,
                type: 'GET',
                dataType: 'json',
                url: function() {
                    const code = g_selected_sensor_row ? g_selected_sensor_row.sensor_code : 'unknown';
                    return '/api/predefine/equipment/threshold?code=' + code;
                }
            },
            create: {
                type: 'POST',
                dataType: 'json',
                url: '/api/predefine/equipment/threshold'
            },
            update: {
                type: 'PATCH',
                dataType: 'json',
                url: '/api/predefine/equipment/threshold'
            },
            destroy: {
                type: 'DELETE',
                dataType: 'json',
                url: '/api/predefine/equipment/threshold'
            },
            parameterMap: function(data, type) {
                switch(type) {
                    case 'read': return data;
                    case 'create': return { info: JSON.stringify(data.models[0]) };
                    case 'update': return { info: JSON.stringify(data.models) };
                    case 'destroy': return { info: JSON.stringify(data.models[0]) };
                }
            }
        },
        requestEnd: function(e) {
            switch(e.type) {
                case 'create': {
                    e.sender.read().then(function() {
                        // by shkoh 20200616: pd_equipment 그리드에서 추가가 발생하면 추가가 발생한 페이지로 이동하고 추가할 rows의 설비명부터 수정 가능하도록 변경
                        e.sender.page(e.sender.totalPages());

                        const last_cell = g_ai_threshold_grid.tbody.find('tr:last td:eq(1)');
                        g_ai_threshold_grid.editCell(last_cell);
                    });
                    break;
                }
                case 'update': {
                    e.sender.read();

                    // by shkoh 20200618: 임계값이 변경되면 그 전에 등록된 임계값이 존재하는 센서목록이 있을 수 있음으로 해당 부분을 새로고침
                    g_sensor_datasource.read();
                    break;
                }
                case 'destroy': {
                    e.sender.read().then(function() {
                        // by shkoh 20200617: 항목을 삭제했을 때, 현재 페이지에 아이템이 존재하지 않게되면, 바로 앞 페이지로 이동함
                        const view_item = e.sender.view();
                        const current_page = e.sender.page();
                        if(view_item.length === 0 && current_page !== 1) {
                            e.sender.page(current_page - 1);
                        }
                    });
                    
                    // by shkoh 20200618: 임계값이 삭제되면 그 전에 등록된 임계값이 있는 경우. 해당 값들은 모두 초기화 시킴
                    g_sensor_datasource.read();
                    break;
                }
            }
        },
        change: function(e) {
            switch(e.action) {
                case 'add': {
                    e.items[0].sensor_code = g_selected_sensor_row.sensor_code;
                    break;
                }
            }
        },
        autoSync: false,
        batch: true,
        pageSize: 100,
        schema: {
            model: {
                id: 'pd_threshold_id',
                fields: {
                    pd_threshold_id: { editable: false, nullable: false, validation: { required: true } },
                    pd_threshold_name: { editable: true, defaultValue: '' },
                    a_critical_min: { type: 'number', editable: true, defaultValue: 0 },
                    a_critical_max: { type: 'number', editable: true, defaultValue: 0 },
                    a_major_min: { type: 'number', editable: true, defaultValue: 0 },
                    a_major_max: { type: 'number', editable: true, defaultValue: 0 },
                    a_warning_min: { type: 'number', editable: true, defaultValue: 0 },
                    a_warning_max: { type: 'number', editable: true, defaultValue: 0 }
                }
            }
        }
    });

    g_ai_threshold_grid.setDataSource(g_ai_threshold_datasource);
}

function createPredefineDIThresholdGrid() {
    g_di_threshold_grid = $('#di-threshold-grid').kendoGrid({
        filterable: true,
        sortable: true,
        resizable: true,
        columnMenu: true,
        navigatable: true,
        editable: {
            createAt: 'bottom'
        },
        selectable: 'cell',
        pageable: false,
        noRecords: {
            template:
            '<div style="display:table;width:100%;height:100%;">' +
                '<h3 style="margin:0px;display:table-cell;vertical-align:middle;">' +
                    '<span class="label label-default" style="border-radius:0px;">' +
                        '선택한 사전 설비 항목과 관련된 DI 임계값 정보가 존재하지 않습니다' +
                    '</span>' +
                '</h3>' +
            '</div>'
        },
        columns: [
            { field: 'pd_threshold_id', title: '임계값 ID', filterable: false, width: 100, locked: true },
            { field: 'pd_threshold_name', title: '임계값 명칭', filterable: false, width: 180, locked: true },
            { field: 'd_value_0_level', title: '0:등급', filterable: false, width: 100, editor: gradeDropDownEditor, template: '#: digitalLevelTemplate(d_value_0_level) #' },
            { field: 'd_value_0_label', title: '0:표기', filterable: false, width: 100 },
            { field: 'd_value_1_level', title: '1:등급', filterable: false, width: 100, editor: gradeDropDownEditor, template: '#: digitalLevelTemplate(d_value_1_level) #' },
            { field: 'd_value_1_label', title: '1:표기', filterable: false, width: 100 },
            { field: 'd_value_2_level', title: '2:등급', filterable: false, width: 100, editor: gradeDropDownEditor, template: '#: digitalLevelTemplate(d_value_2_level) #' },
            { field: 'd_value_2_label', title: '2:표기', filterable: false, width: 100 },
            { field: 'd_value_3_level', title: '3:등급', filterable: false, width: 100, editor: gradeDropDownEditor, template: '#: digitalLevelTemplate(d_value_3_level) #' },
            { field: 'd_value_3_label', title: '3:표기', filterable: false, width: 100 },
            { field: 'd_value_4_level', title: '4:등급', filterable: false, width: 100, editor: gradeDropDownEditor, template: '#: digitalLevelTemplate(d_value_4_level) #' },
            { field: 'd_value_4_label', title: '4:표기', filterable: false, width: 100 },
            { field: 'd_value_5_level', title: '5:등급', filterable: false, width: 100, editor: gradeDropDownEditor, template: '#: digitalLevelTemplate(d_value_5_level) #' },
            { field: 'd_value_5_label', title: '5:표기', filterable: false, width: 100 },
            { field: 'd_value_6_level', title: '6:등급', filterable: false, width: 100, editor: gradeDropDownEditor, template: '#: digitalLevelTemplate(d_value_6_level) #' },
            { field: 'd_value_6_label', title: '6:표기', filterable: false, width: 100 },
            { field: 'd_value_7_level', title: '7:등급', filterable: false, width: 100, editor: gradeDropDownEditor, template: '#: digitalLevelTemplate(d_value_7_level) #' },
            { field: 'd_value_7_label', title: '7:표기', filterable: false, width: 100 }
        ],
        height: 500
    }).data('kendoGrid');
}

function createPredefineDIThresholdDataSource() {
    g_di_threshold_datasource = new kendo.data.DataSource({
        transport: {
            read: {
                async: true,
                type: 'GET',
                dataType: 'json',
                url: function() {
                    const code = g_selected_sensor_row ? g_selected_sensor_row.sensor_code : 'unknown';
                    return '/api/predefine/equipment/threshold?code=' + code;
                }
            },
            create: {
                type: 'POST',
                dataType: 'json',
                url: '/api/predefine/equipment/threshold'
            },
            update: {
                type: 'PATCH',
                dataType: 'json',
                url: '/api/predefine/equipment/threshold'
            },
            destroy: {
                type: 'DELETE',
                dataType: 'json',
                url: '/api/predefine/equipment/threshold'
            },
            parameterMap: function(data, type) {
                switch(type) {
                    case 'read': return data;
                    case 'create': return { info: JSON.stringify(data.models[0]) };
                    case 'update': return { info: JSON.stringify(data.models) };
                    case 'destroy': return { info: JSON.stringify(data.models[0]) };
                }
            }
        },
        requestEnd: function(e) {
            switch(e.type) {
                case 'create': {
                    e.sender.read().then(function() {
                        e.sensor.page(e.sender.totalPages());

                        const last_cell = g_di_threshold_grid.tbody.find('tr:last td:eq(1)');
                        g_di_threshold_grid.editCell(last_cell);
                    });
                    break;
                }
                case 'update': {
                    e.sender.read();
                    g_sensor_datasource.read();
                    break;
                }
                case 'destroy': {
                    e.sender.read().then(function() {
                        const view_item = e.sender.view();
                        const current_page = e.sender.page();
                        if(view_item.length === 0 && current_page !== 1) {
                            e.sender.page(current_page - 1);
                        }
                    });
                    g_sensor_datasource.read();
                    break;
                }
            }
        },
        change: function(e) {
            switch(e.action) {
                case 'add': {
                    e.items[0].sensor_code = g_selected_sensor_row.sensor_code;
                    break;
                }
            }
        },
        autoSync: false,
        batch: true,
        pageSize: 100,
        schema: {
            model: {
                id: 'pd_threshold_id',
                fields: {
                    pd_threshold_id: { editable: false, nullable: false, validation: { required: true } },
                    pd_threshold_name: { editable: true, defaultValue: '' },
                    d_value_0_level: { editable: true, defaultValue: null, parse: parseEmptyValue },
                    d_value_0_label: { type: 'string', editable: true, defaultValue: '' },
                    d_value_1_level: { editable: true, defaultValue: null, parse: parseEmptyValue },
                    d_value_1_label: { type: 'string', editable: true, defaultValue: '' },
                    d_value_2_level: { editable: true, defaultValue: null, parse: parseEmptyValue },
                    d_value_2_label: { type: 'string', editable: true, defaultValue: '' },
                    d_value_3_level: { editable: true, defaultValue: null, parse: parseEmptyValue },
                    d_value_3_label: { type: 'string', editable: true, defaultValue: '' },
                    d_value_4_level: { editable: true, defaultValue: null, parse: parseEmptyValue },
                    d_value_4_label: { type: 'string', editable: true, defaultValue: '' },
                    d_value_5_level: { editable: true, defaultValue: null, parse: parseEmptyValue },
                    d_value_5_label: { type: 'string', editable: true, defaultValue: '' },
                    d_value_6_level: { editable: true, defaultValue: null, parse: parseEmptyValue },
                    d_value_6_label: { type: 'string', editable: true, defaultValue: '' },
                    d_value_7_level: { editable: true, defaultValue: null, parse: parseEmptyValue },
                    d_value_7_label: { type: 'string', editable: true, defaultValue: '' }
                }
            }
        }
    });

    g_di_threshold_grid.setDataSource(g_di_threshold_datasource);
}

function createPredefineModbusCmdGrid() {
    g_modbus_grid = $('#modbus-cmd-grid').kendoGrid({
        filterable: true,
        sortable: true,
        resizable: true,
        columnMenu: true,
        navigatable: true,
        editable: {
            createAt: 'bottom'
        },
        selectable: 'cell',
        pageable: false,
        noRecords: {
            template:
            '<div style="display:table;width:100%;height:90%;">' +
                '<h3 style="margin:0px;display:table-cell;vertical-align:middle;">' +
                    '<span class="label label-default" style="border-radius:0px;">' +
                        '선택한 사전 설비 항목의 Modbus Cmd 정보가 존재하지 않습니다' +
                    '</span>' +
                '</h3>' +
            '</div>'
        },
        columns: [
            { field: 'mc_id', title: 'ID', filterable: false, width: 60, format: '{0:0}' },
            { field: 'function_code', title: 'Func', filterable: false, width: 60, format: '{0:0}' },
            { field: 'start_addr', title: '시작주소', filterable: false, width: 80, format: '{0:0}' },
            { field: 'point_cnt', title: '포인트 수', filterable: false, width: 80, format: '{0:0}' },
            { field: 'data_type', title: '타입', filterable: false, width: 90, editor: modbusDataTypeDropDownEditor, template: '#= description #' }
        ],
        height: 300
    }).data('kendoGrid');
}

function createPredefineModbusCmdDataSource() {
    g_modbus_datasource = new kendo.data.DataSource({
        transport: {
            read: {
                async: true,
                type: 'GET',
                dataType: 'json',
                url: function() {
                    const id = g_selected_sensor_row ? g_selected_sensor_row.pd_equip_id : 'unknown';
                    return '/api/predefine/equipment/modbus?id=' + id;
                }
            },
            create: {
                type: 'POST',
                dataType: 'json',
                url: '/api/predefine/equipment/modbus'
            },
            update: {
                type: 'PATCH',
                dataType: 'json',
                url: '/api/predefine/equipment/modbus'
            },
            destroy: {
                type: 'DELETE',
                dataType: 'json',
                url: '/api/predefine/equipment/modbus'
            },
            parameterMap: function(data, type) {
                switch(type) {
                    case 'read': return data;
                    case 'create': return { info: JSON.stringify(data.models[0]) };
                    case 'update': return { info: JSON.stringify(data.models) };
                    case 'destroy': return { info: JSON.stringify(data.models[0]) };
                }
            }
        },
        requestEnd: function(e) {
            switch(e.type) {
                case 'create': {
                    e.sender.read().then(function() {
                        e.sender.page(e.sender.totalPages());

                        const last_cell = g_modbus_grid.tbody.find('tr:last td:eq(1)');
                        g_modbus_grid.editCell(last_cell);
                    });
                    break;
                }
                case 'update': {
                    e.sender.read();
                    g_sensor_datasource.read();
                    break;
                }
                case 'destroy': {
                    e.sender.read().then(function() {
                        const view_item = e.sender.view();
                        const current_page = e.sender.page();
                        if(view_item.length === 0 && current_page !== 1) e.sender.page(current_page - 1);
                    });
                    g_sensor_datasource.read();
                    break;
                }
            }
        },
        change: function(e) {
            switch(e.action) {
                case 'add': {
                    e.items[0].pd_equip_id = g_selected_sensor_row.pd_equip_id;
                    break;
                }
            }
        },
        autoSync: false,
        batch: true,
        schema: {
            model: {
                id: 'mc_id',
                fields: {
                    mc_id: { editable: false, validation: { required: true } },
                    function_code: { type: 'number', editable: true, defaultValue: 0, validation: { min: 0 } },
                    start_addr: { type: 'number', editable: true, defaultValue: 0, validation: { min: 0 } },
                    point_cnt: { type: 'number', editable: true, defaultValue: 0, validation: { min: 0 } },
                    data_type: { editable: true, defaultValue: 'I2' },
                    description: { editable: false }
                }
            }
        }
    });

    g_modbus_grid.setDataSource(g_modbus_datasource);
}

function textBox_max32(container, options) {
    const input = $('<input name="' + options.field + '" maxLength="32"/>');
    input.appendTo(container);
    input.kendoMaskedTextBox();
}

function textBox_max128(container, options) {
    const input = $('<input name="' + options.field + '" maxLength="128"/>');
    input.appendTo(container);
    input.kendoMaskedTextBox();
}

function io_type_codeDropDown(container, options) {
    const input = $('<input required data-bind="value:' + options.field + '"/>');
    input.appendTo(container);
    input.kendoDropDownList({
        autoBind: true,
        dataTextField: 'code_string',
        dataValueField: 'code_id',
        dataSource: {
            transport: {
                read: {
                    async: true,
                    type: 'GET',
                    dataType: 'json',
                    url: '/api/predefine/equipment/iolist'
                }
            }
        },
        select: function(e) {
            options.model.io_type_name = e.dataItem.code_name;
        }
    });
}

function sensorTypeDropDownEditor(container, options) {
    const input = $('<input required data-bind="value:' + options.field + '"/>');
    input.appendTo(container)
    input.kendoDropDownList({
        autoBind: true,
        dataTextField: 'text',
        dataValueField: 'value',
        dataSource: [
            { text: 'AI', value: 'AI' },
            { text: 'AO', value: 'AO' },
            { text: 'DI', value: 'DI' },
            { text: 'DO', value: 'DO' }
        ],
     });
}

function sensorCodeListDropDownEditor(container, options) {
    const input = $('<input required data-bind="value:' + options.field + '"/>');
    input.appendTo(container)
    input.kendoDropDownList({
        autoBind: true,
        dataValueField: 'value',
        template: '#: value # | #: text #',
        valueTemplate: '#: value # | #: text #',
        dataSource: {
            transport: {
                read: {
                    async: true,
                    type: 'GET',
                    dataType: 'json',
                    url: '/api/predefine/equipment/sensorcodelist'
                }
            }
        },
        select: function(e) {
            options.model.sensor_code_name = e.dataItem.value + ' | ' + e.dataItem.text;
        }
     });
}

function pdThresholdListDropDownEditor(container, options) {
    const input = $('<input required data-bind="value:' + options.field + '"/>');
    input.appendTo(container);
    input.kendoDropDownList({
        autoBind: true,
        dataTextField: 'pd_threshold_name',
        dataValueField: 'pd_threshold_id',
        dataSource: {
            transport: {
                read: {
                    async: true,
                    type: 'GET',
                    dataType: 'json',
                    url: '/api/predefine/equipment/threshold?code=' + options.model.sensor_code
                }
            }
        },
        value: options.model.pd_threshold_id,
        optionLabel: {
            pd_threshold_id: 0,
            pd_threshold_name: '임계값 미설정'
        },
        select: function(e) {
            options.model.pd_threshold_name = e.dataItem.pd_threshold_name;
        }
    });
}

function pdModbusDropDownEditor(container, options) {
    const input = $('<input data-bind="value:' + options.field + '"/>');
    input.appendTo(container);
    input.kendoDropDownList({
        autoBind: true,
        dataTextField: 'mc_id',
        dataValueField: 'mc_id',
        dataSource: {
            transport: {
                read: {
                    async: true,
                    type: 'GET',
                    dataType: 'json',
                    url: '/api/predefine/equipment/modbus?id=' + options.model.pd_equip_id
                }
            }
        },
        noDataTemplate: '설정 가능한 모드버스 명령어 없음',
        optionLabel: {
            mc_id: 0,
            mc_id: '모드버스 설정안함'
        }
    });
}

function gradeDropDownEditor(container, options) {
    const input = $('<input data-bind="value:' + options.field + '"/>');
    input.appendTo(container)
    input.kendoDropDownList({
        autoBind: true,
        dataTextField: 'text',
        dataValueField: 'value',
        optionLabel: {
            text: '선택안함',
            value: null
        },
        dataSource: {
            transport: {
                read: {
                    type: 'GET',
                    dataType: 'json',
                    url: '/api/predefine/equipment/alarmgrade'
                }
            }
        }
    });
}

function modbusDataTypeDropDownEditor(container, options) {
    const input = $('<input data-bind="value:' + options.field + '"/>');
    input.appendTo(container);
    input.kendoDropDownList({
        autoBind: true,
        dataTextField: 'description',
        dataValueField: 'code_name',
        dataSource: {
            transport: {
                read: {
                    async: true,
                    type: 'GET',
                    dataType: 'json',
                    url: '/api/predefine/equipment/modbusdatatype'
                }
            }
        },
        select: function(e) {
            options.model.description = e.dataItem.description;
        }
    });
}

function io_type_template(data) {
    if(data.io_type_code === undefined || data.io_type_code === null || data.io_type_code === 0) return '미설정';
    else return data.io_type_code + ' | ' + data.io_type_name;
}

function sensor_code_template(data) {
    return data.sensor_code_name;
}

function pd_threshold_template(data) {
    let button_html = '<button class="btn btn-modal-threshold" type="button" onclick="showThresholdInfo(' + JSON.stringify(data).replace(/\"/g, '\'') + ')" title="' + data.sensor_code_name + ' 임계값 설정 팝업 열기">...</button>';
    let name = data.pd_threshold_name;

    if(data.pd_threshold_name === undefined || data.pd_threshold_name === null || data.pd_threshold_name === 0) name = '임계값 미설정';
    
    return name + button_html;
}

function pd_modbus_template(data) {
    let button_html = ' <button class="btn btn-modal-threshold" type="button" onclick="showModbusInfo(' + JSON.stringify(data).replace(/\"/g, '\'') + ')">...</button>';
    let name = data.mc_id;

    if(data.mc_id === undefined || data.mc_id === null || data.mc_id === 0) name = '모드버스 설정안함';
    
    return name + button_html;
}

function parseEmptyValue(value) {
    if(value === null || value === '') return null;
    else if(typeof value === 'object') return value.value;
    else return value;
}

function digitalLevelTemplate(data) {
    if(data === undefined || data === null || data === '' || data === -1) return '';
    else if(typeof data === 'number') {
        return g_alarm_grade_list[data].caption;
    } else return data.text;
}

function showThresholdInfo(data) {
    g_selected_sensor_row = data;

    const title = '임계값 설정 - ID: ' + data.pd_sensor_id + ' / 항목명: ' + data.sensor_name + ' / 코드: ' + data.sensor_code + ' / 타입: ' + data.sensor_type;
    $('#sensorSettingLabel').text(title);

    const type = data.sensor_type.includes('A') ? 'A' : 'D';
    showModalContent(type);
    
    $('#sensorSettingInfo').modal({ keyboard: true });
}

function showModbusInfo(data) {
    g_selected_sensor_row = data;
    g_selected_sensor_row.sensor_type = 'M';
    
    const title = 'MODBUS CMD 설정 - ' + g_selected_item.model_name + '(PD_EQUIP_ID: ' + g_selected_item.id + ')';
    $('#sensorSettingLabel').text(title);
    
    showModalContent('M');
    $('#sensorSettingInfo').modal({ keyboard: true });
}