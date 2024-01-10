// by shkoh 20181214: 조회 설비
let g_treeViewController = undefined;

let g_alarm_history_grid = undefined;
let g_alarm_history_data_source = undefined;

let g_start_date = undefined;
let g_end_date = undefined;
let g_selected_equip_ids = '';

kendo.pdf.defineFont({
    "Malgun Gothic" : '/fonts/malgun.ttf',
    "Malgun Gothic|Bold" : '/fonts/malgunbd.ttf',
    "WebComponentsIcons": "/component/kendoui-2018.1.221/styles/fonts/glyphs/WebComponentsIcons.ttf"
});

kendo.ui.FilterMenu.fn.options.operators.string = {
    contains: '다음을 포함하는',
    doesnotcontain: '다음을 포함하지 않는',
    eq: '같은',
    neq: '다른'
}

$(window).resize(function() {
    resizeWindow();
});

$(document).ready(function() {
    resizeWindow();
    
    initTreeView();
    initDateTimePicker();

    initAlarmHistoryGrid();
    initAlarmHistoryDataSource();

    // by shkoh 20181219: 조회 장애등급 button에 'toggle' 명령어를 주어 초기화. 초기화를 하지 않으면 첫번째 'change' 이벤트가 활성화 되지 않아 체크가 꼬이게 됨
    $('.btn-check').button('toggle');
    $('.btn-check').on('change', function() {
        if(g_alarm_history_data_source == undefined) return;

        // by shkoh 20181219: 조회할 장애등급 수가 5개(주위, 경고, 위험, 응답없음, 통신불량)인 경우에는 filter 기능을 제거하여 모두 조회 가능하도록 함
        const count = $('.btn-check.active').length;
        if(count == 5) {
            g_alarm_history_data_source.filter({});
        } else if(count == 0) {
            g_alarm_history_data_source.filter({ field: 'alarm_level', operator: 'eq', value: 0 });
        } else {
            let filter_items = [];

            // by shkoh 20181219: 체크가 된 장애등급들로만 조회가 되도록 체크된 장애등급의 level 값으로 필터항목을 지정
            $('.btn-check.active').each(function(idx, item) {
                filter_items.push({
                    field: 'alarm_level',
                    operator: 'eq',
                    value: parseInt($(item).attr('alarm-level'))
                });
            });

            g_alarm_history_data_source.filter({
                logic: 'or',
                filters: filter_items
            });
        }
    });
});

function resizeWindow() {
    const mainViewer_height = parseFloat(parent['mainViewer'].innerHeight || parent['mainViewer'].clientHeight) - 56;
    const seraching_conditions_height = parseFloat($('#searching-conditions').height()) + 8;
    
    $('#tree-content').height(mainViewer_height - seraching_conditions_height);

    $('.report-body').height(mainViewer_height);
    if(g_alarm_history_grid) g_alarm_history_grid.resize();
}

/***************************************************************************************************************/
/* by shkoh 20181217: Tree View Start                                                                          */
/***************************************************************************************************************/
function initTreeView() {
    g_treeViewController = new TreeViewContent('#tree-content', {
        onCheck: onTreeViewCheck
    });

    g_treeViewController.CreateTreeView();
}

function onTreeViewCheck(event, treeId, treeNode) {
    const checked_tree_nodes = g_treeViewController.GetCheckedNodes();

    let checked_equip_ids = [];
    if(checked_tree_nodes == undefined || checked_tree_nodes.length == 0) {
        g_selected_equip_ids = '';
    } else {
        checked_tree_nodes.forEach(function(node) {
            if(node.id.substr(0, 1) == 'E') checked_equip_ids.push(node.id.substr(2));
        });

        g_selected_equip_ids = checked_equip_ids.toString();
    }

    if(g_alarm_history_data_source) g_alarm_history_data_source.read();
}
/***************************************************************************************************************/
/* by shkoh 20181217: Tree View End                                                                            */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20181217: DateTimePicker Start                                                                     */
/***************************************************************************************************************/
function initDateTimePicker() {
    const today_datetime = new Date();
    // by shkoh 20181217: 현재 시간을 기점으로 시작시간은 현재 날짜에서 0시로부터 시작하는 시작일로 지정
    // by shkoh 20181217: 현재 시간을 기점으로 종료시간은 현재 날짜의 시간에서 올림한 시간을 종료일로 지정(예로, 현재 시간이 13시인 경우 14시를 마지막 시간으로 지정)
    const start_datetime = today_datetime.getFullYear() + '/' + (today_datetime.getMonth() + 1) + '/' + today_datetime.getDate() + ' 00:00';
    const end_datetime = today_datetime.getFullYear() + '/' + (today_datetime.getMonth() + 1) + '/' + today_datetime.getDate() + ' ' +  (today_datetime.getHours() + 1) + ':00';
    
    createDateTimePicker('#start-date', start_datetime, (today_datetime.getHours() + 1) + ':00');
    createDateTimePicker('#end-date', end_datetime, (today_datetime.getHours() + 2) + ':00');
}

/**
 * 해당 id를 가진 input 태그에 date_time으로 표기하고 max_time까지 지정할 수 있는 DateTimePicker를 생성
 * 
 * @param {String} id DateTimePicker를 지정할 input 태그의 ID
 * @param {DateTime} date_time Input box에 표현할 date time
 * @param {String} max_time 허용 가능한 최대 시간("hh:mm" 형식)
 */
function createDateTimePicker(id, date_time, max_time) {
    $(id).datetimepicker({
        id: id.substr(1),
        lang: 'kr',
        value: date_time,
        format: 'Y/m/d H:i',
        formatTime: 'H:i',
        formatDate: 'Y/m/d',
        mask: true,
        maxDate: date_time,
        maxTime: max_time,
        closeOnWithoutClick: false,
        onGenerate: function() {
            // by shkoh 20181218: DateTimePicker가 생성될 때 시작시간과 종료시간을 전역변수에 기록
            g_start_date = $('#start-date').val();
            g_end_date = $('#end-date').val();
        },
        onSelectDate: function(changed_datetime, $element) {
            let time = $($element).val().substr(10);
            let date = changed_datetime.getFullYear() + '/' + (changed_datetime.getMonth() + 1) + '/' + changed_datetime.getDate();
            
            this.setOptions({ value: date + time });

            // by shkoh 20181218: DateTimePicker에서 선택 날짜가 변경될 때 시작시간과 종료시간을 전역변수로 기록
            g_start_date = $('#start-date').val();
            g_end_date = $('#end-date').val();
        },
        onChangeDateTime: function(changed_datetime, $element) {
            const today = new Date();

            let max_time = false;
            if(today.toDateString() == changed_datetime.toDateString()) {
                max_time = (today.getHours() + ($($element).attr('id') == 'start-date' ? 1 : 2)) + ':00';
            }

            this.setOptions({ maxTime: max_time, value: $($element).attr('id') == 'start-date' ? g_start_date : g_end_date });
        },
        onClose: function() {
            // by shkoh 20181218: DateTimePicker가 변경되어 닫힐 때 시작시간과 종료시간을 전역변수에 기록 후 페이지 로드
            g_start_date = $('#start-date').val();
            g_end_date = $('#end-date').val();

            if(g_alarm_history_data_source) g_alarm_history_data_source.read();
        }
    });

    $(id).on('blur', function() {
        $(id).datetimepicker('hide');
    });

    $(id).on('keypress', function(event) {
        // by shkoh 20181220: 시간을 작성한 후 [엔터]를 입력하면 시간 조정 창이 닫힌다.
        if(event.which == 13) {
            $(id).datetimepicker('hide');
        }
    });
}
/***************************************************************************************************************/
/* by shkoh 20181217: DateTimePicker End                                                                       */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20181217: Alarm History Start                                                                      */
/***************************************************************************************************************/
function initAlarmHistoryGrid() {
    g_alarm_history_grid = $('#report-page').kendoGrid({
        toolbar: [ 'excel', 'pdf' ],
        groupable: {
            enabled: false
        },
        filterable: {
            extra: false,
            messages: {
                info: '아래의 연산식으로 필터링:',
                filter: '필터적용',
                clear: '필터제거'
            }
        },
        sortable: true,
        resizable: true,
        columnMenu: false,
        editable: false,
        noRecords: {
            template:
            '<div style="display: table; width: 100%; height: 100%;">' +
                '<h3 style="margin: 0px; display: table-cell; vertical-align: middle;">' +
                    '<span class="label label-default" style="border-radius: 0px;">' +
                        '조회 내역에 따른 장애 이력이 존재하지 않습니다' +
                    '</span>' +
                '</h3>' +
            '</div>'
        },
        selectable: 'row',
        navigatable: true,
        pageable: {
            refresh: true
        },
        excel: {
            allPages: true
        },
        pdf: {
            allPages: true,
            avoidLinks: true,
            paperSize: 'A4',
            margin: { top: '1.2cm', left: '1.2cm', right: '1.2cm', bottom: '1.2cm' },
            repeatHeaders: true,
            scale: 0.4
        },
        columns: [
            { field: 'level', title: ' ', filterable: false, groupable: false, width: 40, menu: false, template: '<div class="level-img" style="background-image:url(/img/monitoring/L#:data.alarm_level#.png);"></div>' },
            { field: 'equip_name', title: '설비명', width: 120, filterable: true, hidden: false },
            { field: 'sensor_name', title: '센서명', width: 100, filterable: true, attributes: { 'class': 'sensor_use_#:data.sensor_use#' } },
            { field: 'sensor_kind', title: '센서종류', width: 90, filterable: true, attributes: { 'class': 'sensor_use_#:data.sensor_use#' } },
            { field: 'alarm_msg', title: '장애발생내역', width: 350, filterable: false, attributes: { 'class': 'sensor_use_#:data.sensor_use#', style: 'font-size: 0.84em' } },
            { field: 'occur_date', title: '발생시간', width: 120, filterable: false, attributes: { 'class': 'sensor_use_#:data.sensor_use#' } },
            { field: 'recovery_date', title: '해제시간', width: 120, filterable: false, attributes: { 'class': 'sensor_use_#:data.sensor_use#' } },
            { field: 'action_user_name', title: '조치자', width: 80, filterable: true },
            { field: 'action_date', title: '조치시간', width: 120, filterable: false },
            { field: 'action_content', title: '조치내용', filterable: false, attributes: { style: 'font-size: 0.84em' } },
            { field: 'group_name', title: '그룹명', filterable: true, hidden: true },
            { field: 'alarmHistoryId', title: 'history_id', menu: false, filterable: false, hidden: true },
            { field: 'group_id', title: 'group_id', menu: false, filterable: true, hidden: true },
            { field: 'equip_id', title: '설비', menu: false, filterable: true, hidden: true, groupable: true, aggregates: [ "count" ], groupHeaderTemplate: customGroupHeaderTemplate },
            { field: 'sensor_id', title: 'sensor_id', menu: false, filterable: true, hidden: true }
        ],
        excelExport: function(e) {
            e.workbook.fileName = createFileName('xlsx');
            
            // by shkoh 20181220: 장애등급 열의 너비는 Web의 이미지가 아닌 텍스트로 변경이 됨으로 크기를 90으로 조정
            e.workbook.sheets[0].columns[1].width = 90;

            let group_index = -1;
            let item_index = -1;
            e.workbook.sheets[0].rows.map(function(row, idx, rows) {
                // by shkoh 20181220: 각 셀의 글자크기는 9로 조정
                row.cells.map(function(cell) { cell.fontSize = 9; });

                if(row.type == 'header') {
                    // by shkoh 20181220: Web에서는 공란으로 처리된 장애등급의 헤더 칸에 '장애등급' 텍스트 추가
                    row.cells[1].value = '장애등급';
                } else if(row.type == 'group-header') {
                    group_index++;
                    item_index = 0;
                } else if(row.type == 'data') {
                    let alarm_text = '';
                    switch(e.data[group_index].items[item_index].alarm_level) {
                        case 0: alarm_text = '정상'; break;
                        case 1: alarm_text = '주의'; break;
                        case 2: alarm_text = '경고'; break;
                        case 3: alarm_text = '위험'; break;
                        case 4: alarm_text = '응답없음'; break;
                        case 5: alarm_text = '통신불량'; break;
                    }
                    
                    row.cells[1].value = alarm_text;

                    if(e.data[group_index].items[item_index].sensor_use == 'N') {
                        row.cells.map(function(cell) { cell.color = '#888888'; });
                    }

                    item_index++;
                }
            });
        },
        pdfExport: function(e) {
            g_alarm_history_grid.setOptions({ pdf: { fileName: createFileName('pdf') } });
        }
    }).data('kendoGrid');
}

function initAlarmHistoryDataSource() {
    g_alarm_history_data_source = new kendo.data.DataSource({
        transport: {
            read: {
                type: 'GET',
                dataType: 'json',
                url: function() {
                    return '/history/alarm/equip?equip_ids=' + g_selected_equip_ids + '&start_date=' + g_start_date + '&end_date=' + g_end_date;
                }
            }
        },
        // by shkoh 20190304: nps에서는 그리드를 grouping하는 것을 원하지 않음으로 해당 부분은 제외함
        // group: [
        //     { field: 'equip_id', aggregates: [{ field: 'equip_id', aggregate: 'count' }] }
        // ],
        sort: {
            field: 'occur_date', dir: 'desc'
        },
        autoSync: false,
        batch: true,
        pageSize: 100,
        schema: {
            model: {
                id: 'alarmHistoryId',
                fields: {
                    alarmHistoryId: { type: 'number' },
                    alarm_level: { editable: false },
                    occur_date: { type: 'datetime', editable: false },
                    recovery_date: { type: 'datetime', editable: false },
                    alarm_msg: { type: 'string', editable: false },
                    action_date: { type: 'datetime', editable: false, nullable: false },
                    action_user_name: { type: 'string', editable: false, nullable: false },
                    action_content: { type: 'string', editable: false, nullable: false },
                    group_id: { type: 'number' },
                    group_name: { type: 'string' },
                    equip_id: { type: 'number' },
                    equip_name: { type: 'string' },
                    equip_kind: { type: 'string' },
                    sensor_id: { type: 'number' },
                    sensor_name: { type: 'string' },
                    sensor_kind: { type: 'string' },
                    sensor_use: { type: 'string '}
                }
            }
        }
    });

    g_alarm_history_grid.setDataSource(g_alarm_history_data_source);
}

function createFileName(export_ext) {
    if(g_start_date == undefined || g_end_date == undefined) return '';
    
    const start_date = g_start_date.substring(0, 10).replace(/\//g, '');
    const start_time = g_start_date.substr(11).replace(':', '');
    const end_date = g_end_date.substring(0, 10).replace(/\//g, '');
    const end_time = g_end_date.substr(11).replace(':', '');

    return '장애이력_' + start_date + start_time + '_' + end_date + end_time + '.' + export_ext;
}

function customGroupHeaderTemplate(e) {
    const equip_name = '설비명: ' + e.items[0].equip_name;
    const count_total = ', 장애발생 건수: ' + e.count;

    let alarm_level_text = '';
    
    const count_condition = $('.btn-check.active').length;
    if(count_condition != 0) {
        alarm_level_text = alarm_level_text.concat(' (');

        $('.btn-check.active').each(function(idx, item) {
            const level = parseInt($(item).attr('alarm-level'));
            switch(level) {
                case 1: alarm_level_text = alarm_level_text.concat('주의: ' + e.items.filter(function(item) { return item.alarm_level == 1; }).length).toString(); break;
                case 2: alarm_level_text = alarm_level_text.concat('경고: ' + e.items.filter(function(item) { return item.alarm_level == 2; }).length).toString(); break;
                case 3: alarm_level_text = alarm_level_text.concat('위험: ' + e.items.filter(function(item) { return item.alarm_level == 3; }).length).toString(); break;
                case 4: alarm_level_text = alarm_level_text.concat('응답없음: ' + e.items.filter(function(item) { return item.alarm_level == 4; }).length).toString(); break;
                case 5: alarm_level_text = alarm_level_text.concat('통신불량: ' + e.items.filter(function(item) { return item.alarm_level == 5; }).length).toString(); break;
            }

            if(idx + 1 < $('.btn-check.active').length) {
                alarm_level_text = alarm_level_text.concat(', ');
            }
        });

        alarm_level_text = alarm_level_text.concat(')');
    }
    
    return equip_name + count_total + alarm_level_text;
}
/***************************************************************************************************************/
/* by shkoh 20181217: Alarm History End                                                                        */
/***************************************************************************************************************/