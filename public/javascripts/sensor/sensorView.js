/// <reference path="../../../typings/jquery/jquery.d.ts"/>
/// <reference path="../../../typings/kendo-ui/kendo.all.d.ts"/>

let g_tree = undefined;

const g_usable = [
    { "value": "Y", "text": "Yes" },
    { "value": "N", "text": "No" },
];

let g_units = [];
let g_grade = [];

let g_grid_height = 0;
let g_modbus_grid_height = 250;

let g_basicSensorDataSource = undefined;
let g_aiSensorDataSource = undefined;
let g_diSensorDataSource = undefined;
let g_modbusIdDataSource = undefined;

let g_selectedEquipIds = '';
let g_selectedSensorForModbusId = -1;
let g_selectedEquipIdForModbusId = -1;

let g_selectedFirstCell = [];            // kdh 20181204 최초로 선택한 셀의 정보

$(window).on('resize', function() {
    resizeWindow();
});

$(function() {
    resizeWindow();

    $("#tree-panel .panel-primary .panel-body").mCustomScrollbar({
        theme: "minimal-dark",
        axis: "xy",
        scrollbarPosition: "outside"
    });

    $("#tab-panel").kendoTabStrip({
        tabPosition: "bottom",
        animation: false,
        show: function(e) {
            // by shkoh 20210406: tab이 이동하면서, DI 임계치 부분에 lock이 걸려있는 column이 숨겨진 뒤에 다시 활성화가 되지 않는 버그가 있어서, [DI 임계값 설정] 탭이 보여질 때, locked된 column 중 하나의 sensor_name column의 크기를 재조정함
            if(e.item.id === 's_di') {
                const di_grid = $('#DISensorThresholdGrid').data('kendoGrid');
                di_grid.resizeColumn('sensor_name', 150);
            }
        }
    });

    loadUnits();    // by shkoh 20180424: 센서코드에 연결되는 센서종류의 사전 정의된 정보를 불러옴
    loadGrade();    // by shkoh 20180424: 사전 정의된 장애등급 단계에 대한 정보를 불러옴

    createTreeView();
    createBasicSensor();
    createAISensorThreshold();
    createDISensorThreshold();
    createModbusIdGrid();

    createBasicSensorDataSource();
    createAISensorDataSource();
    createDISensorDataSource();
    createModbusIdDataSource();

    /**
     * modbus id 설정 모달 창이 열릴 때, 로드 순서
     *  1. 열리는 순간 datasource read
     *  2. 열리고 나자마자 grid의 높이에 맞춰서 UI 확정
     */
    $('#mcidConfig').on('show.bs.modal', function() {
        g_modbusIdDataSource.read();
    });

    $('#mcidConfig').on('shown.bs.modal', function() {
        let modbus_sensor_grid = $('#modbusIdGrid').data('kendoGrid');
        if(modbus_sensor_grid != undefined) modbus_sensor_grid.setOptions({ height: g_modbus_grid_height });
    });

    /**
     * 기본 센서 설정 [저장], [일괄변경], [선택변경], [취소] 버튼 클릭 시
     */
    $('#updateSensor').on('click', function() {
        g_basicSensorDataSource.fetch(function() {
            g_basicSensorDataSource.sync();
        });
    });
    $('#batchSensor').on('click', function() { batchSensorData('#basicSensorGrid', 0); });
    $('#batchCellSensor').on('click', function() { batchCellSensorData('#basicSensorGrid', 0); });
    $('#cancelSensor').on('click', function() { g_basicSensorDataSource.read(); });

    /**
     * AI 임계값 설정 [저장], [일괄변경], [선택변경], [취소] 버튼 클릭 시
     */
    $('#updateAIThreshold').on('click', function() {
        g_aiSensorDataSource.fetch(function() {
            g_aiSensorDataSource.sync();
        });
    });
    $('#batchAIThreshold').on('click', function() { batchSensorData('#AISensorThresholdGrid', 1); });
    $('#batchCellAIThreshold').on('click', function() { batchCellSensorData('#AISensorThresholdGrid', 1); });
    $('#cancelAIThreshold').on('click', function() { g_aiSensorDataSource.read(); });

    /**
     * DI 임계값 설정 [저장], [일괄변경], [선택변경], [취소] 버튼 클릭 시
     */
    $('#updateDIThreshold').on('click', function() {
        g_diSensorDataSource.fetch(function() {
            g_diSensorDataSource.sync();
        });
    });
    $('#batchDIThreshold').on('click', function() { batchSensorData('#DISensorThresholdGrid', 2); });
    $('#batchCellDIThreshold').on('click', function() { batchCellSensorData('#DISensorThresholdGrid', 2); });
    $('#cancelDIThreshold').on('click', function() { g_diSensorDataSource.read(); });

    /**
     * Modbus 설정 [추가]. [삭제], [저장] 버튼 클릭 시
     */
    $('#insertModbusBtn').on('click', function() { insertModbusData(); });
    $('#deleteModbusBtn').on('click', function() { deleteModbusData(); });
    $('#updateModbusBtn').on('click', function() { g_modbusIdDataSource.sync(); });
});

function redrawViewer(info) {
    if(g_tree) g_tree.RedrawTree(info);
}

/**
 * 브라우저 창의 크기가 변할 경우 적용
 */
function resizeWindow() {
    const tree_panel_height = $('#tree-panel').height();
    g_grid_height = tree_panel_height - 73;
    $('#basicSensorGrid').height(g_grid_height);
    $('#AISensorThresholdGrid').height(g_grid_height);
    $('#DISensorThresholdGrid').height(g_grid_height);
    $('#modbusIdGrid').height(g_modbus_grid_height);
    $("#tree-panel .panel-primary .panel-body").css("height", tree_panel_height - 40);
    $(".custom-tabstrip-panel .panel-body").css("height", tree_panel_height - 75);

    let basic_sensor_grid = $("#basicSensorGrid").data('kendoGrid');
    let ai_sensor_grid = $('#AISensorThresholdGrid').data('kendoGrid');
    let di_sensor_grid = $('#DISensorThresholdGrid').data('kendoGrid');
    let modbus_sensor_grid = $('#modbusIdGrid').data('kendoGrid');
    
    if(basic_sensor_grid !== undefined) basic_sensor_grid.resize();
    if(ai_sensor_grid !== undefined) ai_sensor_grid.resize();
    if(di_sensor_grid !== undefined) di_sensor_grid.resize();
    if(modbus_sensor_grid !== undefined) modbus_sensor_grid.resize();
}

/**
 * 센서코드에 연결되는 센서종류의 사전 정의된 정보를 불러옴
 */
function loadUnits() {
    $.ajax({
        async: true,
        type: 'GET',
        dataType: 'json',
        url: '/api/sensor/type'
    }).done(function(data) {
        g_units = data;
    }).fail(function(err) {
        console.error('[loadUnits Error] ' + err.statusText);
        g_units[0] = 'UNKNOWN';
    });
}

/**
 * 사전 정의된 장애등급 단계에 대한 정보를 불러옴
 */
function loadGrade() {
    $.ajax({
        async: true,
        type: 'GET',
        dataType: 'json',
        url: '/api/sensor/alarmgrade'
    }).done(function(data) {
        g_grade = data;
    }).fail(function(err) {
        console.error('[loadGrade Error] ' + err.statusText);
        g_grade[0] = 'UNKNOWN';
    });
}

/**
 * mode에 따라서 그리드 내 선택한 셀과 동일한 모든 Column의 값을 동일하게 변경
 *  
 * @param {String} id 선택한 그리드의 element id, jQuery ID의 형식으로 #이 포함
 * @param {Int} mode 선택한 그리드의 지정 mode, 0: 센서 기본정보, 1: AI 임계값 그리드, 2: DI 임계값 그리드
 */
function batchSensorData(id, mode) {
    const grid = $(id).data('kendoGrid');
    if(grid.select().length > 1) {
        alert('일괄변경을 하기 위해서는 하나의 셀만 선택되어야 합니다');
        return;
    }

    const selected_first_column_index = grid.cellIndex(grid.select()[0]);
    // by shkoh 20180508: 변경이 필요없는 항목임으로 사전에 차단함
    if(selected_first_column_index == -1) return;

    const selected_first_column_field = grid.columns[selected_first_column_index].field;
    // by shkoh 20180508: 센서 기본정보, AI임계값, DI임계값일 때, 몇 가지 항목에서는 수정할 수 없음
    switch(mode) {
        case 0: // by shkoh 20180508: 센서 기본정보인 경우
            if(selected_first_column_field == 'id' || selected_first_column_field == 'equip_name') return;
        break;
        case 1: // by shkoh 20180508: 센서 AI임계값인 경우
        case 2: // by shkoh 20180508: 센서 DI임계값인 경우
            if(selected_first_column_field == 'sensor_id' || selected_first_column_field == 'sensor_name' || selected_first_column_field == 'current_value' || selected_first_column_field == 'current_value') return;
        break;
        default: return;
    }
    
    const batch_data = grid.dataItem(grid.select()[0].parentNode);
    
    grid.dataItems().forEach(function(item) {
        // by shkoh 20180508: 변경을 원하는 최초의 값에 대해서는 값을 변경할 필요도 dirtyFields를 설정할 이유도 없다.
        // by shkoh 20180508: Grid에서 필터링 여부에 따라서 rowIndex의 값을 참조하거나 하지 않는다
        // by shkoh 20180508: 해당 사항의 일치여부는 row의 id로 판단함
        // by shkoh 20180508: 변경될 항목과의 값이 다른 경우에만 수정함
        if(g_basicSensorDataSource.filter !== undefined && item.id !== batch_data.id && item[selected_first_column_field] !== batch_data[selected_first_column_field]) {
            item[selected_first_column_field] = batch_data[selected_first_column_field];
            item.dirty = true;
            // by shkoh 20180508: 선택된 셀에서 수정여부를 체크하기 위하여 dirtyFields를 만든다
            item.dirtyFields = item.dirtyFields || {};
            item.dirtyFields[selected_first_column_field] = true;
        }
    });

    grid.refresh();
    g_selectedFirstCell = [];
}

/**
 * mode에 따라서 그리드 내 선택한 셀들 중에서 선택한 셀들의 동일한 Column의 값 중 가장 먼저 선택된 값과 동일하게 변경
 *  
 * @param {String} id 선택한 그리드의 element id, jQuery ID의 형식으로 #이 포함
 * @param {Int} mode 선택한 그리드의 지정 mode, 0: 센서 기본정보, 1: AI 임계값 그리드, 2: DI 임계값 그리드
 */
function batchCellSensorData(id, mode) {
    const grid = $(id).data('kendoGrid');
    if(grid.select().length == 1) {
        alert('선택변경을 위해서는 다수의 셀이 선택되어야 합니다');
        return;
    }

    const selected_first_column_index = grid.cellIndex(grid.select()[0]);
    // by shkoh 20180508: 변경이 필요없는 항목들은 사전에 차단함
    if(selected_first_column_index == -1) return;

    const selected_first_column_field = grid.columns[selected_first_column_index].field;
    // by shkoh 20180508: 센서 기본정보, AI임계값, DI임계값일 때, 몇 가지 항목에서는 수정할 수 없음
    switch(mode) {
        case 0: // by shkoh 20180508: 센서 기본정보인 경우
            if(selected_first_column_field == 'id') return;
        break;
        case 1: // by shkoh 20180508: 센서 AI임계값인 경우
        case 2: // by shkoh 20180508: 센서 DI임계값인 경우
            if(selected_first_column_field == 'sensor_id' || selected_first_column_field == 'sensor_name' || selected_first_column_field == 'current_value' || selected_first_column_field == 'current_value') return;
        break;
        default: return;
    }
    // const batch_data = grid.dataItem(grid.select()[0].parentNode);
    const batch_data = g_selectedFirstCell[0];

    for(let idx = 0; idx < grid.select().length; idx++) {
        let selected_data = grid.dataItem(grid.select()[idx].parentNode);
        const selected_column_index = grid.cellIndex(grid.select()[idx]);

        // by shkoh 20180508: 변경할 값과 변경될 값을 비교하여 해당 값이 다른 경우에만 수정함
        if(selected_data.uid != batch_data.uid && selected_first_column_index == selected_column_index && selected_data[selected_first_column_field] != batch_data[selected_first_column_field]) {
            selected_data[selected_first_column_field] = batch_data[selected_first_column_field];
            selected_data.dirty = true;
            selected_data.dirtyFields = selected_data.dirtyFields || {};
            selected_data.dirtyFields[selected_first_column_field] = true;
        }
    }

    grid.refresh();
    g_selectedFirstCell = [];
}

/**
 * Modbus Item Insert
 */
function insertModbusData() {
    $('#modbusIdGrid').data('kendoGrid').addRow();
    g_modbusIdDataSource.sync();
}

/**
 * Modbus Item Delete
 */
function deleteModbusData() {
    const grid = $('#modbusIdGrid').data('kendoGrid');
    const selected_row = grid.select();
    if(selected_row.length == 0) {
        alert('삭제를 위한 항목을 선택하세요');
        return;
    }

    const isRemove = confirm("선택한 Modbus 설정값을 삭제하시겠습니까?");
    if(isRemove) {
        grid.removeRow(selected_row);
        g_modbusIdDataSource.sync();
    }
}

/**
 * Tree View를 생성
 * by shkoh 20180424: 사용자 계정이 변경될 때마다 TreeView를 생성
 */
function createTreeView() {
    if(g_tree !== undefined) return;

    g_tree = new TreeView('#group-equip-tree', {
        beforeClick: onTreeViewBeforeClick,
        onCheck: onTreeViewCheck
    });
    g_tree.Create();
}

/**
 * 생성된 트리 해제
 */
function destroyTreeView() {
	if(g_tree !== undefined) {
		g_tree.Destroy();
		g_tree = undefined;
	}
}

/**
 * Tree View에서 클릭했을 경우
 * 
 * @param {String} treeId treeView의 Id
 * @param {JSON} treeNode 클릭한 tree Node의 JSON 데이터
 * @param {Number} clickFlag tree Node의 선택 상태
 * 
 * @return {Bool} false일 경우 onClick 콜백이 실행되지 않음
 */
function onTreeViewBeforeClick(treeId, treeNode, clickFlag) {
    // by shkoh 20180424: 특정 센서만 클릭했을 경우에는 앞서 체크한 내용들은 모두 해제함
    // by shkoh 20210503: Tree에 체크된 모든 항목의 체크 상태를 해제
    g_tree.UncheckAllTreeNodes();

    if(treeNode.id.substr(0,1) == 'G') {
        g_selectedEquipIds = '';
        g_tree.ExpandNode(treeNode);
    } else {
        g_selectedEquipIds = treeNode.id.substr(2);
    }

    g_basicSensorDataSource.read();
    g_aiSensorDataSource.read();
    g_diSensorDataSource.read();

    return true;
}

/**
 * Tree View Node에서 Check를 수행한 경우
 * 
 * @param {Object} event event Object
 * @param {String} treeId treeView의 Id
 * @param {JSON} treeNode 체크한 tree Node의 JSON 데이터
 */
function onTreeViewCheck(event, treeId, treeNode) {
    const checked_tree_nodes = g_tree.GetCheckedNodes();
    let checked_equip_ids = [];
    if(checked_tree_nodes.length == 0) {
        g_selectedEquipIds = '';
    } else {
        checked_tree_nodes.forEach(function(node) {
            if(node.id.substr(0, 1) == 'E') checked_equip_ids.push(node.id.substr(2));
        });

        g_selectedEquipIds = checked_equip_ids.toString();
    }

    g_basicSensorDataSource.read();
    g_aiSensorDataSource.read();
    g_diSensorDataSource.read();

    // by shkoh 20180504: 체크박스로 다수의 설비 선택 시 다음 페이지에서 항목 조회 중에 다시 체크가 필요한 경우, 없는 페이지를 바라볼 수 있음으로 1페이지를 바라보지 않을 때에는 항상 1페이지를 보도록 수정함
    if(g_basicSensorDataSource.page() != 1) g_basicSensorDataSource.page(1);
    if(g_aiSensorDataSource.page() != 1) g_aiSensorDataSource.page(1);
    if(g_diSensorDataSource.page() != 1) g_diSensorDataSource.page(1);
}

/**
 * kdh 20181204 첫번째 선택한 셀의 데이터 정보 저장
 */
function changeSensorGrid() {
    let selected = this.select();
    let dataItem = this.dataItem(selected[0].parentNode);

    if(selected.length == 1 && $.inArray(dataItem, g_selectedFirstCell) < 0) {
        g_selectedFirstCell = [];
        g_selectedFirstCell.push(dataItem);
    }
}

/**
 * 센서 기본설정 그리드 생성
 */
function createBasicSensor() {
    $("#basicSensorGrid").kendoGrid({
        groupable: {
            messages: {
                empty: "그룹화할 항목을 이곳으로 드래그 앤 드롭하세요."
            }
        },
        filterable: true,
        sortable: true,
        resizable: true,
        columnMenu: true,
        editable: true,
        noRecords: {
            template:
                '<div style="display:table;width:100%;height:100%;">' +
                    '<h3 style="margin:0px;display:table-cell;vertical-align:middle;">' +
                        '<span class="label label-default" style="border-radius:0px;">' +
                            '센서 설정을 위한 설비를 선택하지 않았습니다' +
                        '</span>' +
                    '</h3>' +
                '</div>'
        },
        selectable: "multiple cell",
        navigatable: true,
        pageable: true,
        change: changeSensorGrid,
        columns: [
            { field: "id", title: "ID", filterable: false, width: 60, format: "{0:0}"  },
            { field: "equip_name", title: "설비명", filterable: false, width: 100, groupable: true, hidden: true, aggregates: [ "count" ], groupHeaderTemplate: groupHeaderTemplateBasic },
            { field: "name", title: "센서명", filterable: true, width: 100, editor: editorSensorName, template: "#= dirtyField(data, 'name') # #: name #" },
            { field: "node", title: "노드", filterable: false, width: 60, format: "{0:0}", template: "#= dirtyField(data, 'node') # #: node #" },
            { field: "sensorType", title: "타입", filterable: true, width: 60, editor: sensorTypeDropDownEditor, template: "#= dirtyField(data, 'sensorType') # #: sensorType #" },
            { field: "unit", title: "종류", filterable: true, width: 85, editor: unitDropDownEditor, template: "#= dirtyField(data, 'unit') # #: getUnitText(unit) #" },
            { field: "divValue", title: "표현식", filterable: false, width: 70, editor: editorDivValue, format: "{0:0}", template: "#= dirtyField(data, 'divValue') # #: divValue #" },
            { field: "userDefine", title: "사용자정의", filterable: false, width: 100, editor: editorUserDefine, template: "#=dirtyField(data, 'userDefine')# #:userDefine == null ? '' : userDefine#" },
            { field: "oid", title: "ADDRESS", filterable: true, width: 100, editor: editorAddress, template: "#=dirtyField(data, 'oid')# #:oid == null ? '' : oid#" },
            { field: "mcid", title: "MODBUS ID", filterable: true, width: 95, editor: sensorMcIdEditor, template: "#=dirtyField(data, 'mcid')# <span id='mcid_#:id#'>#:mcid#</span> #=insertButton(data)#" },
            { field: "bDisplay", title: "표시여부", filterable: true, width: 75, editor: checkYesNo, template: "#=dirtyField(data, 'bDisplay')# #:getUsableText(bDisplay)#" },
            { field: "bEvent", title: "알람여부", filterable: true, width: 75, editor: checkYesNo, template: "#=dirtyField(data, 'bEvent')# #:getUsableText(bEvent)#"},
            { field: "bUse", title: "사용여부", filterable: true, width: 75, editor: checkYesNo, template: "#=dirtyField(data, 'bUse')# #:getUsableText(bUse)#"},
            { field: "bData", title: "1분로그여부", filterable: true, width: 75, hidden: true, editor: checkYesNo, template: "#=dirtyField(data, 'bData')# #:getUsableText(bData)#"}
        ],
        height: g_grid_height
    });
}

/**
 * 센서 기본설정 Datasource를 생성
 */
function createBasicSensorDataSource() {
    g_basicSensorDataSource = new kendo.data.DataSource({
        transport: {
            read: {
                type: 'GET',
                dataType: 'json',
                url: function(options) {
                    if(g_selectedEquipIds == '') {
                        return '/api/sensor/info?ids=unknown';
                    }
                    return '/api/sensor/info?ids=' + g_selectedEquipIds;
                }
            },
            update: {
                type: 'PATCH',
                dataType: 'json',
                url: '/api/sensor/info',
                error: function() {
                    alert('센서 기본정보 설정 저장 중에 문제가 발생했습니다. 다시 시도해주세요.');
                }
            },
            parameterMap: function(data, type) {
                if(type == 'update') {
                    return { updateInfo: JSON.stringify(data.models) }
                } else if(type == 'read') {
                    return data;
                }
            }
        },
        requestEnd: function(e) {
            if(e.type === 'update') {
                g_basicSensorDataSource.read();
                g_aiSensorDataSource.read();
                g_diSensorDataSource.read();
            }
        },
        change: function(e) {
            if(e.action == "itemchange") {
                e.items[0].dirtyFields = e.items[0].dirtyFields || {};
                e.items[0].dirtyFields[e.field] = true;
            }
        },
        group: {
            field: "equip_name", aggregates: [ { field: "equip_name", aggregate: "count" } ]
        },
        sort: {
            field: "id", dir: "asc"
        },
        autoSync: false,
        batch: true,
        pageSize: 100,
        schema: {
            model: {
                id: "id",
                fields: {
                    id: { editable: false, nullable: false, validation: { required: true } },
                    group_id: { editable: false },
                    equip_id: { editable: false },
                    equip_name: { editable: false},
                    name: { editable: true, validation: { required: true } },
                    node: { type: "number", editable: true, validation: { required: true, min: 0 } },
                    sensorType: { editable: true },
                    divValue: { type: "string", editable: true, validation: { required: true }, defaultValue: "VAL" },
                    mcid: { type: "number", editable: true, validation: { required: true }, defaultValue: 0 },
                    bDisplay: { editable: true },
                    bEvent: { editable: true },
                    bUse: { editable: true },
                    bData: { editable: true }
                }
            }
        }
    });

    $('#basicSensorGrid').data('kendoGrid').setDataSource(g_basicSensorDataSource);
}

/**
 * AI 센서 그리드 생성
 */
function createAISensorThreshold() {
    $("#AISensorThresholdGrid").kendoGrid( {
        selectable: "multiple cell",
        groupable: {
            messages: {
                empty: "그룹화할 항목을 이곳으로 드래그 앤 드롭하세요."
            }
        },
        filterable: true,
        sortable: true,
        resizable: true,
        noRecords: {
            template:
                '<div style="display:table;width:100%;height:100%;">' +
                    '<h3 style="margin:0px;display:table-cell;vertical-align:middle;">' +
                        '<span class="label label-default" style="border-radius:0px;">' +
                            '임계값을 설정할 AI 데이터가 존재하지 않습니다' +
                        '</span>' +
                    '</h3>' +
                '</div>'
        },
        columnMenu: true,
        navigatable: true,
        editable: true,
        pageable: true,
        change: changeSensorGrid,
        columns: [
            { field: "sensor_id", title: "ID", filterable: false, width: 60 },
            { field: "equip_name", title: "설비명", width: 150, groupable: true, hidden: true, aggregates: [ "count" ], groupHeaderTemplate: groupHeaderTemplateAI },
            { field: "sensor_name", title: "센서명", filterable: true, width: 150 },
            { field: "b_popup", title: "팝업", filterable: true, width: 70, editor: checkYesNo, template: "#=dirtyField(data, 'b_popup')# #:getUsableText(b_popup)#" },
            { field: "b_sms", title: "SMS", filterable: true, width: 70, editor: checkYesNo, template: "#=dirtyField(data, 'b_sms')# #:getUsableText(b_sms)#" },
            { field: "b_email", title: "Email", filterable: true, width: 75, editor: checkYesNo, template: "#=dirtyField(data, 'b_email')# #:getUsableText(b_email)#" },
            { field: "current_value", title: "현재값", filterable: false, width: 80 },                        
            { field: "a_critical_min", title: "<< 위험", filterable: false, width: 85, template: "#=dirtyField(data, 'a_critical_min')# #:a_critical_min#" },
            { field: "a_major_min", title: "<< 경고", filterable: false, width: 85, template: "#=dirtyField(data, 'a_major_min')# #:a_major_min#" },
            { field: "a_warning_min", title: "<< 주의", filterable: false, width: 85, template: "#=dirtyField(data, 'a_warning_min')# #:a_warning_min#" },
            { field: "a_warning_max", title: "주의 >>", filterable: false, width: 85, template: "#=dirtyField(data, 'a_warning_max')# #:a_warning_max#" },
            { field: "a_major_max", title: "경고 >>", filterable: false, width: 85, template: "#=dirtyField(data, 'a_major_max')# #:a_major_max#" },
            { field: "a_critical_max", title: "위험 >>", filterable: false, width: 85, template: "#=dirtyField(data, 'a_critical_max')# #:a_critical_max#" },
            // by yjjeon 20161005: 우리에프아이에스
            { field: "holding_time", title: "지연시간(초)", filterable: false, width: 80 }
        ],
        height: g_grid_height
    });
}

/**
 * 센서 AI 임계치 설정 Datasource를 생성
 */
function createAISensorDataSource() {
    g_aiSensorDataSource = new kendo.data.DataSource( {
        transport: {
            read: {
                type: 'GET',
                dataType: 'json',
                url: function(options) {
                    if(g_selectedEquipIds == '') {
                        return '/api/sensor/threshold?ids=unknown&type=A';
                    }
                    return '/api/sensor/threshold?ids=' + g_selectedEquipIds + '&type=A';
                },
            },
            update: {
                type: 'PATCH',
                dataType: 'json',
                url: `/api/sensor/threshold`,
                error: function() {
                    alert('AI 임계값 설정 저장 중에 문제가 발생했습니다. 다시 시도해주세요.');
                },
                complete: function() {
                    g_aiSensorDataSource.read();
                }
            },
            parameterMap: function(data, type) {
                if(type == "update") {
                    return {
                        updateThresholdInfo: JSON.stringify(data.models),
                        updateType: 'AI'
                    };
                } else if(type == "read") {
                    return data;
                }
            }
        },
        change: function(e) {
            if(e.action == "itemchange") {               
                // by shkoh 20151002: 임계치는 변경된 값의 범위보다 더 크거나 더 작을 수 없다.
                // by shkoh 20200610: 임계값은 항상 등급을 기준으로 범위를 벗어나지 않도록 해야하는데, 기존 방식은 불편함이 많아서 논리적으로 매끄럽도록 수정함
                const { a_critical_min, a_critical_max, a_major_min, a_major_max, a_warning_min, a_warning_max } = e.items[0];
                let isChanged = true;
                let target_name = '';
                let comparison_name = '';
                let decision = '';

                switch(e.field) {
                    case 'a_critical_min': {
                        target_name = '<< 위험';
                        if(a_critical_min > a_major_min) { isChanged = false; comparison_name = '<< 경고'; decision = '작거나'; }
                        break;
                    }
                    case 'a_major_min': {
                        target_name = '<< 경고';
                        if(a_major_min > a_warning_min) { isChanged = false; comparison_name = '<< 주의'; decision = '작거나'; }
                        else if(a_major_min < a_critical_min) { isChanged = false; comparison_name = '<< 위험'; decision = '크거나'; }
                        break;
                    }
                    case 'a_warning_min': {
                        target_name = '<< 주의';
                        if(a_warning_min > a_warning_max) { isChanged = false; comparison_name = '주의 >>'; decision = '작거나'; }
                        else if(a_warning_min < a_major_min) { isChanged = false; comparison_name = '<< 경고'; decision = '크거나'; }
                        break;
                    }
                    case 'a_warning_max': {
                        target_name = '주의 >>';
                        if(a_warning_max > a_major_max) { isChanged = false; comparison_name = '경고 >>'; decision = '작거나'; }
                        else if(a_warning_max < a_warning_min) { isChanged = false; comparison_name = '<< 주의'; decision = '크거나'; }
                        break;
                    }
                    case 'a_major_max': {
                        target_name = '경고 >>';
                        if(a_major_max > a_critical_max) { isChanged = false; comparison_name = '위험 >>'; decision = '작거나'; }
                        else if(a_major_max < a_warning_max) { isChanged = false; comparison_name = '주의 >>'; decision = '크거나'; }
                        break;
                    }
                    case 'a_critical_max': {
                        target_name = '위험 >>';
                        if(a_critical_max < a_major_max) { isChanged = false; comparison_name = '경고 >>'; decision = '크거나'; }
                        break;
                    }
                }

                if(isChanged) {
                    e.items[0].dirtyFields = e.items[0].dirtyFields || {};
                    e.items[0].dirtyFields[e.field] = true;
                } else {
                    e.sender.fetch(function() {
                        e.sender.cancelChanges(e.items[0]);
                    });
                    
                    alert(`"${target_name}"의 값은 "${comparison_name}"의 값보다 ${decision} 같아야 합니다`);
                }
            }
        },
        autoSync: false,
        batch: true,
        group: {
            field: "equip_name", aggregates: [ { field: "equip_name", aggregate: "count" } ]
        },
        sort: {
            field: "sensor_id", dir: "asc"
        },
        pageSize: 100,
        schema: {
            model: {
                id: "sensor_id",
                fields: {
                    sensor_id: { editable: false, nullable: false, validation: { required: true } },
                    sensor_name: { editable: false },
                    b_popup: { editable: true },
                    b_sms: { editable: true },
                    b_email: { editable: true },
                    current_value: { editable: false },
                    a_critical_min: { type: "number", editable: true, parse: parseNullValue },
                    a_major_min: { type: "number", editable: true, parse: parseNullValue },
                    a_warning_min: { type: "number", editable: true, parse: parseNullValue },
                    a_warning_max: { type: "number", editable: true, parse: parseNullValue },
                    a_major_max: { type: "number", editable: true, parse: parseNullValue },
                    a_critical_max: { type: "number", editable: true, parse: parseNullValue },
                    // by yjjeon 20161005: 우리에프아이에스
                    holding_time: { type: "number", editable: true, parse: parseNullValue },
                    group_id: { editable: false },
                    equip_id: { editable: false }
                }
            }
        }
    });

    $('#AISensorThresholdGrid').data('kendoGrid').setDataSource(g_aiSensorDataSource);
}

/**
 * DI 센서 그리드 생성
 */
function createDISensorThreshold() {
    $("#DISensorThresholdGrid").kendoGrid({
        selectable: "multiple cell",
        groupable: {
            messages: {
            empty: "그룹화할 항목을 이곳으로 드래그 앤 드롭하세요."
            }
        },
        filterable: true,
        sortable: true,
        resizable: true,
        noRecords: {
            template:
                '<div style="display:table;width:100%;height:100%;">' +
                    '<h3 style="margin:0px;display:table-cell;vertical-align:middle;">' +
                        '<span class="label label-default" style="border-radius:0px;">' +
                            '임계값을 설정할 DI 데이터가 존재하지 않습니다' +
                        '</span>' +
                    '</h3>' +
                '</div>'
        },
        columnMenu: true,
        navigatable: true,
        editable: true,
        pageable: true,
        change: changeSensorGrid,
        columns: [
            { field: "equip_name", title: "설비명", width: 150, groupable: true, hidden: true, locked: true, aggregates: [ "count" ], groupHeaderTemplate: groupHeaderTemplateDI },
            { field: "sensor_id", title: "ID", filterable: false, width: 80, locked: true },
            { field: "sensor_name", title: "센서명", filterable: true, width: 180, locked: true },
            { field: "b_popup", title: "팝업", filterable: true, width: 75, locked: true, editor: checkYesNo, template: "#=dirtyField(data, 'b_popup')# #:getUsableText(b_popup)#" },
            { field: "b_sms", title: "SMS", filterable: true, width: 75, locked: true, editor: checkYesNo, template: "#=dirtyField(data, 'b_sms')# #:getUsableText(b_sms)#" },
            { field: "b_email", title: "Email", filterable: true, width: 80, locked: true, editor: checkYesNo, template: "#=dirtyField(data, 'b_email')# #:getUsableText(b_email)#" },
            { field: "current_value", title: "현재값", filterable: false, width: 90, locked: true },
            { field: "d_value_0_level", title: "0:등급", filterable: false, width: 100, editor: gradeDropDownEditor, template: "#=dirtyField(data, 'd_value_0_level')# #:getGradeText(d_value_0_level)#" },
            { field: "d_value_0_label", title: "0:표기", filterable: false, width: 85, editor: editorThresholdLabel, template: "#=dirtyField(data, 'd_value_0_label')# #:d_value_0_label == null ? '' : d_value_0_label#" },
            { field: "d_value_1_level", title: "1:등급", filterable: false, width: 100, editor: gradeDropDownEditor, template: "#=dirtyField(data, 'd_value_1_level')# #:getGradeText(d_value_1_level)#" },
            { field: "d_value_1_label", title: "1:표기", filterable: false, width: 85, editor: editorThresholdLabel, template: "#=dirtyField(data, 'd_value_1_label')# #:d_value_1_label == null ? '' : d_value_1_label#" },
            { field: "d_value_2_level", title: "2:등급", filterable: false, width: 100, editor: gradeDropDownEditor, template: "#=dirtyField(data, 'd_value_2_level')# #:getGradeText(d_value_2_level)#" },
            { field: "d_value_2_label", title: "2:표기", filterable: false, width: 85, editor: editorThresholdLabel, template: "#=dirtyField(data, 'd_value_2_label')# #:d_value_2_label == null ? '' : d_value_2_label#" },
            { field: "d_value_3_level", title: "3:등급", filterable: false, width: 100, editor: gradeDropDownEditor, template: "#=dirtyField(data, 'd_value_3_level')# #:getGradeText(d_value_3_level)#" },
            { field: "d_value_3_label", title: "3:표기", filterable: false, width: 85, editor: editorThresholdLabel, template: "#=dirtyField(data, 'd_value_3_label')# #:d_value_3_label == null ? '' : d_value_3_label#" },
            { field: "d_value_4_level", title: "4:등급", filterable: false, width: 100, editor: gradeDropDownEditor, template: "#=dirtyField(data, 'd_value_4_level')# #:getGradeText(d_value_4_level)#" },
            { field: "d_value_4_label", title: "4:표기", filterable: false, width: 85, editor: editorThresholdLabel, template: "#=dirtyField(data, 'd_value_4_label')# #:d_value_4_label == null ? '' : d_value_4_label#" },
            { field: "d_value_5_level", title: "5:등급", filterable: false, width: 100, editor: gradeDropDownEditor, template: "#=dirtyField(data, 'd_value_5_level')# #:getGradeText(d_value_5_level)#" },
            { field: "d_value_5_label", title: "5:표기", filterable: false, width: 85, editor: editorThresholdLabel, template: "#=dirtyField(data, 'd_value_5_label')# #:d_value_5_label == null ? '' : d_value_5_label#" },
            { field: "d_value_6_level", title: "6:등급", filterable: false, width: 100, editor: gradeDropDownEditor, template: "#=dirtyField(data, 'd_value_6_level')# #:getGradeText(d_value_6_level)#" },
            { field: "d_value_6_label", title: "6:표기", filterable: false, width: 85, editor: editorThresholdLabel, template: "#=dirtyField(data, 'd_value_6_label')# #:d_value_6_label == null ? '' : d_value_6_label#" },
            { field: "d_value_7_level", title: "7:등급", filterable: false, width: 100, editor: gradeDropDownEditor, template: "#=dirtyField(data, 'd_value_7_level')# #:getGradeText(d_value_7_level)#" },
            { field: "d_value_7_label", title: "7:표기", filterable: false, width: 85, editor: editorThresholdLabel, template: "#=dirtyField(data, 'd_value_7_label')# #:d_value_7_label == null ? '' : d_value_7_label#" },
            // by yjjeon 20161005: 우리에프아이에스
            { field: "holding_time", title: "지연시간(초)", filterable: false, width: 80 }
        ],
        height: g_grid_height
    });
}

/**
 * 센서 DI 임계치 설정 Datasource를 생성
 */
function createDISensorDataSource() {
    g_diSensorDataSource = new kendo.data.DataSource( {
        transport: {
            read: {
                type: 'GET',
                dataType: 'json',
                url: function(options) {
                    if(g_selectedEquipIds == '') {
                        return '/api/sensor/threshold?ids=unknown&type=D';
                    }
                    return '/api/sensor/threshold?ids=' + g_selectedEquipIds + '&type=D';
                },
            },
            update: {
                type: 'PATCH',
                dataType: 'json',
                url: `/api/sensor/threshold`,
                error: function() {
                    alert('DI 임계값 설정 저장 중에 문제가 발생했습니다. 다시 시도해주세요.');
                },
                complete: function() {
                    g_diSensorDataSource.read();
                }
            },
            parameterMap: function(data, type) {
                if(type == "update") {
                    return {
                        updateThresholdInfo: JSON.stringify(data.models),
                        updateType: 'DI'
                    };
                } else if(type == "read") {
                    return data;
                }
            }
        },
        change: function(e) {
            if(e.action == "itemchange") {
                e.items[0].dirtyFields = e.items[0].dirtyFields || {};
                e.items[0].dirtyFields[e.field] = true;
            }
        },
        autoSync: false,
        batch: true,
        group: {
            field: "equip_name", aggregates: [ { field: "equip_name", aggregate: "count" } ]
        },
        sort: {
            field: "sensor_id", dir: "asc"
        },
        pageSize: 100,
        schema: {
            model: {
                id: "sensor_id",
                fields: {
                    sensor_id : { editable: false, nullable: false, validation: { required: true } },
                    equip_name: { editable: false },
                    sensor_name: { editable: false },
                    b_popup: { editable: true },
                    b_sms: { editable: true },
                    b_email: { editable: true },
                    current_value: { editable: false },
                    d_value_0_level: { editable: true, parse: parseEmptyValue },
                    d_value_0_label: { editable: true },
                    d_value_1_level: { editable: true, parse: parseEmptyValue },
                    d_value_1_label: { editable: true },
                    d_value_2_level: { editable: true, parse: parseEmptyValue },
                    d_value_2_label: { editable: true },
                    d_value_3_level: { editable: true, parse: parseEmptyValue },
                    d_value_3_label: { editable: true },
                    d_value_4_level: { editable: true, parse: parseEmptyValue },
                    d_value_4_label: { editable: true },
                    d_value_5_level: { editable: true, parse: parseEmptyValue },
                    d_value_5_label: { editable: true },
                    d_value_6_level: { editable: true, parse: parseEmptyValue },
                    d_value_6_label: { editable: true },
                    d_value_7_level: { editable: true, parse: parseEmptyValue },
                    d_value_7_label: { editable: true },
                    // by yjjeon 20161005: 우리에프아이에스
                    holding_time: { type: "number", editable: true, parse: parseNullValue },
                    group_id: { editable: false },
                    equip_id: { editable: false }
                }
            }
        }
    });

    $('#DISensorThresholdGrid').data('kendoGrid').setDataSource(g_diSensorDataSource);
}

/**
 * Modbus ID 그리드 생성
 */
function createModbusIdGrid() {
    $("#modbusIdGrid").kendoGrid({
        groupable: false,
        filterable: false,
        sortable: true,
        resizable: false,
        noRecords: {
            template:
                '<div style="display:table;width:100%;height:100%;">' +
                    '<h4 style="margin:0px;display:table-cell;vertical-align:middle;">' +
                        '<span class="label label-warning" style="border-radius:0px;">' +
                            '모드버스 통신설비가 아니거나, 설정이 되지 않았습니다' +
                        '</span>' +
                    '</h4>' +
                '</div>'
        },
        columnMenu: false,
        editable: {
            createAt: 'bottom'
        },
        selectable: "cell",
        navigatable: true,
        columns: [
            { field: "mcid", title: "ID", filterable: false, width: 60, format: "{0:0}" },
            { field: "funcCode", title: "Func", filterable: false, width: 60, format: `{0:0}` },
            { field: "startAddr", title: "시작주소", filterable: false, width: 80, format: "{0:0}" },
            { field: "pointCnt", title: "포인트 수", filterable: false, width: 80, format: "{0:0}" },
            { field: "type", title: "타입", filterable: false, width: 90, editor: dropdownDataType, template: "#=description#" }
        ],
        height: g_modbus_grid_height
    });
}

/**
 * Modbus ID DataSource 생성
 */
function createModbusIdDataSource() {
    g_modbusIdDataSource = new kendo.data.DataSource({
        transport: {
            read: {
                type: 'GET',
                dataType: 'json',
                url: function(options) {
                    if(g_selectedSensorForModbusId == -1) {
                        return '/api/sensor/mcid?id=unknown';
                    }
                    return '/api/sensor/mcid?id=' + g_selectedSensorForModbusId;
                },
            },
            update: {
                type: 'PATCH',
                dataType: 'json',
                url: '/api/sensor/mcid',
                complete: function() {
                    g_modbusIdDataSource.read();
                }
            },
            create: {
                type: 'POST',
                dataType: 'json',
                url: '/api/sensor/mcid',
                complete: function() {
                    g_modbusIdDataSource.read();
                }
            },
            destroy: {
                type: 'DELETE',
                dataType: 'json',
                url: '/api/sensor/mcid',
                complete: function() {
                    g_modbusIdDataSource.read();
                }
            },
            parameterMap: function(data, type) {
                if(type == "read") {
                    return data;
                } else if(type == 'create' || type == 'update' || type == 'destroy') {
                    return {
                        command: type,
                        mcidInfo: JSON.stringify(data.models)
                    }
                }
            }
        },
        change: function(e) {
            if(e.action == 'add') {
                const prev_item = this.at(e.index - 1);
                e.items[0]['mcid'] = prev_item == undefined ? 1 : prev_item['mcid'] + 1;
                e.items[0]['equip_id'] = g_selectedEquipIdForModbusId;
                
                if(prev_item != undefined) {
                    e.items[0]['funcCode'] = prev_item['funcCode'];
                    e.items[0]['type'] = prev_item['type'];
                }
            }
        },
        autoSync: false,
        batch: true,
        schema: {
            model: {
                id: "mcid",
                fields: {
                    mcid: { editable: false, nullable: false, validation: { required: true } },
                    funcCode: { type: "number", editable: true, validation: { required: true, min: 0, max: 255 }, defaultValue: 3 },
                    startAddr: { type: "number", editable: true, validation: { required: true, min: 0 } },
                    pointCnt: { type: "number", editable: true, validation: { required: true, min: 1 }, defaultValue: 1 },
                    type: { type: "string", editable: true, defaultValue: 'I2' },
                    description: { editable: false },
                    equip_id: { editable: false }
                }
            }
        }
    });

    $("#modbusIdGrid").data("kendoGrid").setDataSource(g_modbusIdDataSource);
}

/**
 * Yes / No Dropdown Editor 생성
 * 
 * @param {Object} container Cell Editor Element
 * @param {JSON} options Row 데이터
 */
function checkYesNo(container, options) {
    $(`<input required data-bind="value:${options.field}"/>`).appendTo(container).kendoDropDownList({
        autoBind: true,
        dataTextField: "booleanName",
        dataValueField: "booleanValue",
        dataSource: [
            { booleanName: "Yes", booleanValue: "Y" },
            { booleanName: "No", booleanValue: "N" },
        ] 
    });
}

/**
 * sensor Type DropDown Editor 생성
 * 
 * @param {Object} container Cell Editor Element
 * @param {JSON} options Row 데이터
 */
function sensorTypeDropDownEditor(container, options) {
    $(`<input required data-bind="value:${options.field}"/>`).appendTo(container).kendoDropDownList({
        autoBind: true,
        dataTextField: "sensorTypeName",
        dataValueField: "sensorType",
        dataSource: [
            { sensorTypeName: "AI", sensorType: "AI" },
            { sensorTypeName: "AO", sensorType: "AO" },
            { sensorTypeName: "DI", sensorType: "DI" },
            { sensorTypeName: "DO", sensorType: "DO" }
        ],
     });
}

/**
 * 센서특성 Dropdown Editor
 * 
 * by shkoh 20160407: 선택된 센서의 값 중에서 unit이 정의되어 있지 않다면 기본값으로 S0000으로 강제 지정해줌
 * by shkoh 20160407: 아래의 예외처리를 하지 않으면 unit이 null일 경우에 단번에 저장되지 않는 문제가 발생함(2번에 걸쳐서 저장을 해야 지정된 값이 저장됨)
 *
 * @param {Object} container Cell Editor Element
 * @param {JSON} options Row 데이터
 */
function unitDropDownEditor(container, options) {
    if(options.model.unit == null) {
        options.model.unit = "S0000";
    }

    $(`<input required data-bind="value:${options.field}"/>`).appendTo(container).kendoDropDownList({
        autoBind: true,
        autoWidth: true,
        dataTextField: 'text',
        dataValueField: 'value',
        dataSource: {
            transport: {
                read: {
                    type: 'GET',
                    dataType: 'json',
                    url: '/api/sensor/type'
                }
            }
        }
    });
}

/**
 * Modbus Id 설정 Editor
 * 
 * @param {Object} container Cell Editor Element
 * @param {JSON} options Row 데이터
 */
function sensorMcIdEditor(container, options) {
    $(`<input required data-bind="value:${options.field}"/>`).appendTo(container).kendoDropDownList({
        autoBind: true,
        dataTextField: 'mcidText',
        dataValueField: 'mcid',
        optionLabel: {
            mcidText: 'none',
            mcid: 0
        },
        noDataTemplate: `Modbus ID 미설정`,
        dataSource: {
            transport: {
                read: {
                    type: 'GET',
                    dataType: 'json',
                    url: '/api/sensor/mcid?id=' + options.model.id
                }
            }
        }
    });
}

/**
 * 장애등급 설정 Editor
 * 
 * @param {Object} container Cell Editor Element
 * @param {JSON} options Row 데이터
 */
function gradeDropDownEditor(container, options) {
    $(`<input data-bind="value:${options.field}"/>`).appendTo(container).kendoDropDownList({
        autoBind: true,
        dataTextField: `text`,
        dataValueField: `value`,
        optionLabel: {
            text: `선택안함`,
            value: null
        },
        dataSource: {
            transport: {
                read: {
                    type: `GET`,
                    dataType: `json`,
                    url: `/api/sensor/alarmgrade`
                }
            }
        }
    });
}

function dropdownDataType(container, options) {
    $(`<input required data-bind="value:${options.field}"/>`).appendTo(container).kendoDropDownList({
        autoBind: true,
        dataTextField: 'description',
        dataValueField: 'code_name',
        dataSource: {
            transport: {
                read: {
                    type: 'GET',
                    dataType: 'json',
                    url: `/api/sensor/modbusdatatype`,
                }
            }
        },
        select: function(e) {
            options.model.description = e.dataItem.description;
        }
    });
}

/**
 * 그리드가 받는 값(value)가 null을 받을 경우에 0으로 변경처리
 * 
 * @param {String} value 그리드가 받는 값
 */
function parseNullValue(value) {
    return value == null ? 0 : value;
}

/**
 * by shkoh 20206010
 * DataSource를 통하여 DB로 부터 전달받을 값과 UI 상에 보여줄 값들이 불일치하여 해당 부분을 중간에 변경하기 위해서 처리하는 함수
 * 
 * @param {Object | Number} value DI 임계값 중 각 level에서 보내주는 value
 */
function parseEmptyValue(value) {
    if(value === null || value === '') return null;
    else if(typeof value === 'object') return value.value;
    else return value;
}

/**
 * 실행될 설비의 통신 Modbus Id 설정 Modal 페이지 활성화
 * 
 * @param {String} equip_name 설비명칭
 * @param {Int} group_id 그룹 ID
 * @param {Int} equip_id 설비 ID
 * @param {Int} sensor_id 센서 ID
 */
function showMcIdConfig(equip_name, group_id, equip_id, sensor_id) {
    $('#mcidConfigLabel').text('MODBUS Config - ' + equip_name);
    g_selectedSensorForModbusId = sensor_id;
    g_selectedEquipIdForModbusId = equip_id;
    
    $('#mcidConfig').modal({ keyboard: true });
}

function insertButton(data) {
    return '<button id="mcid_' + data.id + '" type="button" class="btn btn_mcid" style="float:right;width:20px;height:20px;" onclick="showMcIdConfig(\'' + data.equip_name  + '\', ' + data.group_id + ', ' + data.equip_id + ', ' + data.id + ')">...</button>';
}

function dirtyField(data, cellIndex) {
    if(data.dirty && data.dirtyFields[cellIndex]) {
        return '<span class="k-dirty"></span>';
    } else {
        return '';
    }
}

function getUsableText(data) {
    var result = "";
    for(var idx = 0; idx < g_usable.length; idx++) {
        if(g_usable[idx].value == data) {
            result = g_usable[idx].text;
            break;
        }
    }
    return result;
}

function getUnitText(data) {
    var result = "";
    for(var idx = 0; idx < g_units.length; idx++) {
        if(g_units[idx].value == data) {
            result = g_units[idx].text;
            break;
        }
    }
    return result;
}

function getGradeText(data) {
    if(data === undefined || data === null || data === '') return '';
    else if(typeof data === 'number') {
        return g_grade[data].text;
    } else return data.text;
}

function groupHeaderTemplateBasic(data) {
    if(data === undefined || data === null || data === '')
        return '';
    else if(data.value === undefined)
        return '';
    else
        return '설비명: ' + data.value + ', 센서수: ' + data.count;
}

function groupHeaderTemplateAI(data) {
    if(data === undefined || data === null || data === '')
        return '';
    else if(data.value === undefined)
        return '';
    else
        return '설비명: ' + data.value + ', 임계치 설정 가능 AI 센서수: ' + data.count;
}

function groupHeaderTemplateDI(data) {
    if(data === undefined || data === null || data === '')
        return '';
    else if(data.value === undefined)
        return '';
    else
        return '설비명: ' + data.value + ', 임계치 설정 가능 DI 센서수: ' + data.count;
}

function editorSensorName(container, options) {
    const input = $(`<input name="${options.field}" maxLength="64"/>`);
    input.appendTo(container);
    input.kendoMaskedTextBox();
}

function editorDivValue(container, options) {
    const input = $(`<input name="${options.field}" maxLength="64"/>`);
    input.appendTo(container);
    input.kendoMaskedTextBox();
}

function editorUserDefine(container, options) {
    const input = $(`<input name="${options.field}" maxLength="512"/>`);
    input.appendTo(container);
    input.kendoMaskedTextBox();
}

function editorAddress(container, options) {
    const input = $(`<input name="${options.field}" maxLength="512"/>`);
    input.appendTo(container);
    input.kendoMaskedTextBox();
}

function editorThresholdLabel(container, options) {
    const input = $(`<input name="${options.field}" maxLength="50"/>`);
    input.appendTo(container);
    input.kendoMaskedTextBox();
}