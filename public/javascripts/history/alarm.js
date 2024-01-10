let g_grid = undefined;
let g_data_source = undefined;

let g_tree_controller = undefined;

let g_criteria_buttongroup = undefined;

let g_start_date_controller = undefined;
let g_end_date_controller = undefined;

let g_grid_index = 1;

const g_criteria_items = [
    { text: '주의', value: 1, criteria: 'warning', selected: true },
    { text: '경고', value: 2, criteria: 'major', selected: true },
    { text: '위험', value: 3, criteria: 'critical', selected: true },
    { text: '응답없음', value: 4, criteria: 'timeout', selected: true },
    { text: '통신불량', value: 5, criteria: 'disconnect', selected: true }
]

const g_searching_value = {
    ids: [],
    alarmLevels: [],
    startDate: undefined,
    endDate: undefined
}

$(window).resize(function() {
    resizeWindow();
});

$(document).ready(function() {
    resizeWindow();
    
    initTreeView();
    initCriteriaButtonGroup();
    initDateButton();
    initDateTimePicker();

    initAlarmHistoryGrid();
    initAlarmHistoryDataSource();

    $('#search-button').click(function(e) {
        if(g_searching_value.ids.length === 0) {
            alert('조회항목을 선택하세요');
            return;
        }

        if(g_criteria_buttongroup.selectedIndices.length === 0) {
            alert('장애등급을 지정하세요');
            return;
        }

        const start_date = g_start_date_controller.GetDate();
        const end_date = g_end_date_controller.GetDate();

        if(start_date - end_date > 0) {
            alert('조회 시작시간이 종료시간보다 우선일 순 없습니다');
            return;
        }

        setTimeout(function() {
            g_searching_value.startDate = $('#start-date').val();
            g_searching_value.endDate = $('#end-date').val();
            g_searching_value.alarmLevels = g_criteria_buttongroup.selectedIndices.map(function(idx) {
                return g_criteria_items[idx].value;
            });
            
            g_data_source.read().then(function() { g_data_source.page(1); });
        });
    });
});

/**********************************************************************************************************************************************/
/* by shkoh 20200810: resize window start                                                                                                     */
/**********************************************************************************************************************************************/
function resizeWindow() {
    $('#tree-content').height(calculateTreeContentHeight());
    $('#report-page').height(calculateEquipmentReportContentHeight());

    if(g_grid) g_grid.resize();
}

function calculateTreeContentHeight() {
    // by shkoh 20200810: body에서 padding-top과 padding-bottom의 크기 16을 뺀 tree content의 높이
    const viewer_h = parseFloat(parent['mainViewer'].innerHeight || parent['mainViewer'].clientHeight) - 16;
    const panel_heading_h = parseFloat($('.panel-heading').height());
    const panel_heading_border_h = 6;
    const panel_heading_padding_h = 8;

    return viewer_h - panel_heading_h - panel_heading_border_h - panel_heading_padding_h + 1;
}

function calculateEquipmentReportContentHeight() {
    // by shkoh 20200810: body에서 padding-top과 padding-bottom의 크기 16을 뺀 report grid의 높이
    const viewer_h = parseFloat(parent['mainViewer'].innerHeight || parent['mainViewer'].clientHeight) - 16;
    
    // by shkoh 20200810: '검색조건'의 높이를 계산하여 해당 부분도 뺌
    const header_h = parseFloat($('.panel-header').height());
    const header_border_h = 6;
    const header_padding_h = 10;

    // by shkoh 20200810: '검색결과'의 header의 높이를 계산하여 해당 부분을 뺌
    const panel_heading_h = parseFloat($('.panel-heading').height());
    const panel_heading_border_h = 6;
    const panel_heading_padding_h = 8;

    return viewer_h - header_h - header_border_h - header_padding_h - panel_heading_h - panel_heading_border_h - panel_heading_padding_h;
}
/**********************************************************************************************************************************************/
/* by shkoh 20200810: resize window end                                                                                                       */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200810: tree start                                                                                                              */
/**********************************************************************************************************************************************/
function initTreeView() {
    g_tree_controller = new TreeViewContent('#tree-content', {
        onCheck: onTreeViewCheck,
    });

    g_tree_controller.CreateTreeView();
}

function onTreeViewCheck(event, treeId, treeNode) {
    g_searching_value.ids = [];

    const checked_tree_nodes = g_tree_controller.GetCheckedNodes();
    checked_tree_nodes.forEach(function(node) {
        const type = node.id.substr(0, 1);
        const id = node.id.substr(2);

        if(type === 'E') {
            g_searching_value.ids.push(Number(id));
        }
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20200810: tree end                                                                                                                */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200810: button group start                                                                                                      */
/**********************************************************************************************************************************************/
function initCriteriaButtonGroup() {
    g_criteria_buttongroup = $('#alarm-criteria').kendoButtonGroup({
        selection: 'multiple',
        items: g_criteria_items
    }).data('kendoButtonGroup');
}
/**********************************************************************************************************************************************/
/* by shkoh 20200810: button group end                                                                                                        */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200810: date button start                                                                                                       */
/**********************************************************************************************************************************************/
function initDateButton() {
    $('#init-date').kendoButton({
        icon: 'refresh',
        click: function(e) {
            const init_date = getDefaultDateTime('day', new Date());
            
            g_start_date_controller.ResetDate(init_date.startDate);
            g_end_date_controller.ResetDate(init_date.endDate);
        }
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20200810: date button end                                                                                                         */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200810: DateTimePicker start                                                                                                    */
/**********************************************************************************************************************************************/
function getDefaultDateTime(_period, _date) {
    const date = new Date(_date);

    let _start = undefined;
    let _end = undefined;
    
    const m = date.getMinutes();
    const new_m = (parseInt(m / 5) + 1) * 5;

    switch(_period) {
        case '5minute': {
            _end = new Date(date.setMinutes(new_m));
            
            const hour = date.getHours();
            _start = new Date(date.setHours(hour - 1));
            break;
        }
        case 'hour': {
            const hour = date.getHours();
            _end = new Date(date.setHours(hour + 1, 0));
            
            const day = date.getDate();
            _start = new Date(date.setDate(day - 1));
            break;
        }
        case 'day': {
            _end = new Date(date.setMinutes(new_m));
            
            const month = date.getMonth();
            _start = new Date(date.setMonth(month - 1));
            break;
        }
        case 'month': {
            _end = new Date(date.setMinutes(new_m));
            const year = date.getFullYear();
            _start = new Date(date.setFullYear(year - 1));
            break;
        }
    }

    return {
        startDate: _start,
        endDate: _end
    }
}

function initDateTimePicker() {
    const init_date = getDefaultDateTime('day', new Date());

    g_start_date_controller = new DatePicker('#start-date', {
        period: '5minute',
        startDate: init_date.startDate
    });
    g_start_date_controller.CreateDatePicker();

    g_end_date_controller = new DatePicker('#end-date', {
        period: '5minute',
        startDate: init_date.endDate
    });
    g_end_date_controller.CreateDatePicker();
}
/**********************************************************************************************************************************************/
/* by shkoh 20200810: DateTimePicker end                                                                                                      */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200810: alarm history grid start                                                                                                */
/**********************************************************************************************************************************************/
function initAlarmHistoryGrid() {
    g_grid = $('#report-page').kendoGrid({
        autoBind: false,
        toolbar: function(e) {
            const toolbar_element = $('<div id="toolbar"></div>').kendoToolBar({
                resizable: false,
                items: [
                    {
                        id: 'exportExcel',
                        type: 'splitButton',
                        text: '엑셀 내보내기',
                        icon: 'excel',
                        menuButtons: [{
                            id: 'exportExcelAll',
                            text: '전체 엑셀 내보내기',
                            icon: 'excel',
                            click: exportExcel.bind(this, true)
                        }],
                        click: exportExcel.bind(this, false)
                    },
                    {
                        id: 'exportPDF',
                        type: 'splitButton',
                        text: 'PDF 내보내기',
                        icon: 'pdf',
                        menuButtons: [{
                            id: 'exportPDFAll',
                            text: '전체 PDF 내보내기',
                            icon: 'pdf',
                            click: exportPDF.bind(this, true)
                        }],
                        click: exportPDF.bind(this, false)
                    }
                ]
            });
            return toolbar_element;
        },
        noRecords: {
            template:
            '<div style="display:table; width: 100%; height: 100%;">\
                <h3 style="margin: 0px; display: table-cell; vertical-align: middle;">\
                    <span class="label label-default" style="border-radius: 0px;>\
                        해당 조건에 맞는 장애이력이 존재하지 않습니다\
                    </span>\
                </h3>\
            </div>'
        },
        selectable: 'row',
        pageable: {
            messages: {
                empty: '검색결과 없음',
                display: '현재 페이지 건수: {0:n0} ~ {1:n0}, 전체 건수: {2:n0}',
                previous: '이전페이지',
                next: '다음페이지',
                first: '처음페이지',
                last: '마지막페이지',
                morePages: '더 많은 페이지 보기'
            }
        },
        sortable: false,
        groupable: false,
        columns: [
            { field: 'level', title: ' ', filterable: false, groupable: false, width: 40, menu: false, template: '<div class="level-img" style="background-image:url(/img/monitoring/L#:data.alarm_level#.png);"></div>' },
            { field: 'index', title: '순번', width: 50, template: function(e) { return g_grid_index++; } },
            { field: 'group_name', title: '그룹명', width: 100, attributes: { 'class': 'sensor_use_#:data.sensor_use#' } },
            { field: 'equip_name', title: '설비명', width: 100, attributes: { 'class': 'sensor_use_#:data.sensor_use#' } },
            { field: 'sensor_name', title: '센서명', width: 100, attributes: { 'class': 'sensor_use_#:data.sensor_use#' } },
            { field: 'sensor_kind', title: '센서종류', width: 90, attributes: { 'class': 'sensor_use_#:data.sensor_use#' } },
            { field: 'alarm_msg', title: '장애발생내역', width: 350, attributes: { 'class': 'sensor_use_#:data.sensor_use#', style: 'font-size: 0.84em;'  } },
            { field: 'occur_date', title: '발생시간', width: 120, attributes: { 'class': 'sensor_use_#:data.sensor_use#' } },
            { field: 'recovery_date', title: '해제시간', width: 120, attributes: { 'class': 'sensor_use_#:data.sensor_use#' } },
            { field: 'period', title: '장애기간', width: 120, attributes: { 'class': 'sensor_use_#:data.sensor_use#' } },
            { field: 'action', title: '조치내역', attributes: { 'class': 'sensor_use_#:data.sensor_use#', style: 'font-size: 0.84em; white-space: pre-wrap;' } }
        ],
        dataBinding: function(e) {
            if(e.sender.pager.page() === 1) g_grid_index = 1;
            else g_grid_index = (e.sender.pager.page() - 1) * e.sender.pager.pageSize() + 1;
        },
        dataBound: function(e) {
            const grid = this;
            grid.tbody.find('tr').dblclick(function(e) {
                const dataItem = grid.dataItem(this);
                const equip_id = dataItem.equip_id;
                const sensor_id = dataItem.sensor_id;
                const occur_date = dataItem.occur_date;
                const alarm_level = dataItem.alarm_level;
                
                window.open('/popup/fault?equip_id=' + equip_id + '&sensor_id=' + (sensor_id === undefined || sensor_id === null ? '-1' : sensor_id) + '&occur_date=' + (occur_date === undefined ? '' : occur_date) + '&alarm_level=' + (alarm_level === undefined ? '' : alarm_level), 'faultWindow_' + equip_id, 'scollbars=1, menubar=no, resizable=no, location=no, titlebar=no, toolbar=no, status=no, width=1100, height=506');
            });

            e.sender.current(e.sender.tbody.find('tr:first'));

            if(e.sender.dataItems().length > 0) undisplayLoading();
        },
        excelExport: function(e) {
            const file_name = exportFileName('xlsx');
            e.workbook.fileName = file_name;
            e.workbook.creator = 'ICOMER';
            e.workbook.sheets[0].name = file_name.split('(')[0];

            const column_index_level = e.sender.thead.find('th[data-field="level"]')[0].cellIndex;
            const column_index_index = e.sender.thead.find('th[data-field="index"]')[0].cellIndex;
            const column_index_action = e.sender.thead.find('th[data-field="action"]')[0].cellIndex;

            let data_index = 0;
            let data_list_index = e.data.length > 1000 ? 1 : (e.sender.pager.page() - 1) * e.sender.pager.pageSize() + 1;

            e.workbook.sheets[0].rows.unshift({
                cells: [{
                    value: exportDocumentHeaderText(),
                    bold: true,
                    colSpan: e.workbook.sheets[0].columns.length,
                    textAlign: 'left'
                }]
            });
            e.workbook.sheets[0].freezePane.rowSplit = 2;

            e.workbook.sheets[0].rows.map(function(row, idx, rows) {
                if(row.type === 'data') {
                    let alarm_level_text = e.data.at(data_index).alarm_level_text;
                    let isUsed = e.data.at(data_index).sensor_use === 'Y' ? true : false;

                    row.cells.map(function(cell, idx, cells) {
                        cell.verticalAlign = 'center';

                        switch(idx) {
                            case column_index_level: cell.value = alarm_level_text; break;
                            case column_index_index: cell.value = Number(data_list_index); break;
                            case column_index_action: cell.wrap = true; break;
                        }

                        if(!isUsed) cell.color = '#cccccc';
                    });

                    data_index++;
                    data_list_index++;
                }
            });

            undisplayLoading();
        }
    }).data('kendoGrid');
}

function initAlarmHistoryDataSource() {
    g_data_source = new kendo.data.DataSource({
        autoSync: false,
        transport: {
            read: {
                cache: false,
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json',
                url: '/api/alarm/history/get',
                data: function() {
                    return g_searching_value
                }
            },
            parameterMap: function(data, type) {
                if(type === 'read') {
                    return kendo.stringify(data);
                }
            }
        },
        error: function(e) {
            if(e.type === 'read') {
                alert('장애이력을 조회하는 중에 에러가 발생했습니다');
                undisplayLoading();
            }
        },
        requestStart: function(e) {
            if(e.type === 'read') displayLoading();
        },
        requestEnd: function(e) {
            if(e.type === undefined) {
                console.error(e);
                alert('장애이력을 조회하는 중에 에러가 발생했습니다');
                undisplayLoading();
            } else if(e.type === 'read' && e.response) {
                undisplayLoading();
            }
        },
        serverPaging: false,
        pageSize: 1000,
        schema: {
            data: function(response) {
                return response;
            },
            total: function(response) {
                return response.length
            },
            parse: function(response) {
                response.forEach(function(row) {
                    if(row.alarmActionHistoryId === null) {
                        row.action = '';
                    } else {
                        row.action = '조치시간: ' + row.action_date + ', 조치자: ' + row.action_user_name + '\n조치내역: ' + row.action_content; 
                    }
                });
                return response;
            },
            model: {
                fields: {
                    period: { parse: convertPeriodDateTime }
                }
            }
        }
    });

    g_grid.setDataSource(g_data_source);
}

function convertPeriodDateTime(second) {
    // by shkoh 20200811: 장애가 현재 진행형인 경우에는 최종 해제시간을 알 수 없음으로 공백으로 표기
    if(second === null) return '';
    // by shkoh 20200811: 장애기간이 1분보다 짧을 경우
    else if(second < 60) return second + '초';
    // by shkoh 20200811: 장애기간이 1시간보다 짧을 경우
    else if(second < 3600) return parseInt(second / 60) + '분 ' + (second % 60) + '초';
    // by shkoh 20200811: 장애기간이 1시간보다 길 경우
    else return parseInt(second / 3600) + '시간 ' + parseInt((second % 3600) / 60) + '분 ' + (second % 60) + '초';
}

function exportExcel(isAllPages) {
    const hasData = g_data_source.total();
    if(hasData === 0) {
        alert('엑셀 내보내기할 데이터가 존재하지 않습니다');
        return;
    }

    displayLoading();

    setTimeout(function() {
        g_grid.options.excel.allPages = isAllPages;
        g_grid.saveAsExcel();
    });
}

function exportPDF(isAllPages) {
    const hasData = g_data_source.total();
    if(hasData === 0) {
        alert('PDF로 내보내기할 데이터가 존재하지 않습니다');
        return;
    }

    displayLoading();

    setTimeout(function() {
        try {
            const head_data = getHeaderDataForPDF();
            const body_data = getBodyDataForPDF(isAllPages);

            saveAsPDF(head_data, body_data);
        } catch(err) {
            console.error(err);
            undisplayLoading();
        }
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20200810: alarm history grid end                                                                                                  */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200810: inline function start                                                                                                   */
/**********************************************************************************************************************************************/
function displayLoading() {
    kendo.ui.progress($(document.body), true);
}

function undisplayLoading() {
    setTimeout(function() {
        kendo.ui.progress($(document.body), false);
    });
}

function exportFileName(export_ext) {
    const { startDate, endDate } = g_searching_value;

    const start_date = startDate.substring(0, 10).replace(/\//g, '');
    const start_time = startDate.substr(11).replace(':', '');
    const end_date = endDate.substring(0, 10).replace(/\//g, '');
    const end_time = endDate.substr(11).replace(':', '');

    return 'FMS장애이력(' + start_date + start_time + '_' + end_date + end_time + ').' + export_ext;
}

function exportDocumentHeaderText() {
    const { startDate, endDate } = g_searching_value;
    return 'FMS 장애이력(조회기간: ' + startDate + ' ~ ' + endDate + ')';
}

function getHeaderDataForPDF() {
    const head_data = [{}];

    g_grid.columns.forEach(function(c) {
        head_data[0][c.field] = c.title.normalize('NFC');
    });

    return head_data;
}

function getBodyDataForPDF(isAllPages) {
    const body_data = [];

    const start_index = isAllPages ? 0 : (g_data_source.page() - 1) * g_data_source.pageSize();
    const data = isAllPages ? g_data_source.data() : g_data_source.view();

    data.forEach(function(d, idx) {
        const row = [];
        
        const index = start_index + (idx + 1);
        const text_color = d.sensor_use === 'Y' ? [ 0, 0, 0 ] : [ 229, 229, 229 ];

        row.push({
            content: d.alarm_level_text,
            styles: { textColor: text_color }
        }, {
            content: index,
            styles: { textColor: text_color }
        }, {
            content: d.group_name,
            styles: { textColor: text_color }
        }, {
            content: d.equip_name,
            styles: { textColor: text_color }
        }, {
            content: d.sensor_name === null ? '' : d.sensor_name,
            styles: { textColor: text_color }
        }, {
            content: d.sensor_kind === null ? '' : d.sensor_kind,
            styles: { textColor: text_color }
        }, {
            content: d.alarm_msg,
            styles: { textColor: text_color }
        }, {
            content: d.occur_date,
            styles: { textColor: text_color }
        }, {
            content: d.recovery_date,
            styles: { textColor: text_color }
        }, {
            content: d.period,
            styles: { textColor: text_color }
        }, {
            content: d.action,
            styles: { textColor: text_color }
        });

        body_data.push(row);
    });

    return body_data;
}

function saveAsPDF(headData, bodyData) {
    const page_header_string = exportDocumentHeaderText();

    const pdf = new jsPDF({
        orientation: 'l',
        unit: 'mm',
        format: 'a4',
        precision: 8,
        compress: false,
        putOnlyUsedFonts: true,
        userUnit: 1.0
    });
    
    pdf.setLanguage('ko-KR');
    pdf.setFont('MalgunGothic');
    
    pdf.autoTableSetDefaults({
        theme: 'plain',
        useCss: false,
        margin: 12,
        styles: {
            font: 'MalgunGothic',
            cellPadding: 0.8,
            textColor: '#000000',
            fontSize: 6,
            lineColor: [ 12, 12, 12 ],
            lineWidth: 0.08
        }
    });
    
    pdf.autoTable({
        startY: 12,
        margin: 0,
        head: headData,
        body: bodyData,
        headStyles: {
            fillColor: [ 229, 229, 229 ]
        },
        didDrawPage: function(data) {
            // by shkoh 20200709: PDF Page Header
            pdf.setFontSize(8);
            pdf.setFontStyle('bold');
            pdf.setTextColor('#303030');
            
            pdf.text(page_header_string, data.settings.margin.left, 8);
            
            // by shkoh 20200709: PDF Page Footer
            const footer_text = pdf.internal.getNumberOfPages();
            const pdf_page_size = pdf.internal.pageSize;
            const pdf_page_width = pdf_page_size.width ? pdf_page_size.width : pdf_page_size.getWidth();
            const pdf_page_height = pdf_page_size.height ? pdf_page_size.height : pdf_page_size.getHeight();
            pdf.text(footer_text.toString(), pdf_page_width / 2 - 3, pdf_page_height - 8);
        }
    });

    const export_filename = exportFileName('pdf');
    pdf.save(export_filename, { returnPromise: true }).then(function() {
        undisplayLoading();
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20200810: inline function end                                                                                                     */
/**********************************************************************************************************************************************/

// /***************************************************************************************************************/
// /* by shkoh 20181217: Alarm History Start                                                                      */
// /***************************************************************************************************************/
// function initAlarmHistoryGrid() {
//     g_alarm_history_grid = $('#report-page').kendoGrid({
//         toolbar: [ 'excel', 'pdf' ],
//         groupable: {
//             enabled: true
//         },
//         filterable: {
//             extra: false,
//             messages: {
//                 info: '아래의 연산식으로 필터링:',
//                 filter: '필터적용',
//                 clear: '필터제거'
//             }
//         },
//         sortable: true,
//         resizable: true,
//         columnMenu: false,
//         editable: false,
//         noRecords: {
//             template:
//             '<div style="display: table; width: 100%; height: 100%;">' +
//                 '<h3 style="margin: 0px; display: table-cell; vertical-align: middle;">' +
//                     '<span class="label label-default" style="border-radius: 0px;">' +
//                         '조회 내역에 따른 장애 이력이 존재하지 않습니다' +
//                     '</span>' +
//                 '</h3>' +
//             '</div>'
//         },
//         selectable: 'row',
//         navigatable: true,
//         pageable: {
//             refresh: true
//         },
//         excel: {
//             allPages: true
//         },
//         pdf: {
//             allPages: true,
//             avoidLinks: true,
//             paperSize: 'A4',
//             margin: { top: '1.2cm', left: '1.2cm', right: '1.2cm', bottom: '1.2cm' },
//             repeatHeaders: true,
//             scale: 0.4
//         },
//         columns: [
//             { field: 'level', title: ' ', filterable: false, groupable: false, width: 40, menu: false, template: '<div class="level-img" style="background-image:url(/img/monitoring/L#:data.alarm_level#.png);"></div>' },
//             { field: 'sensor_name', title: '센서명', width: 100, filterable: true, attributes: { 'class': 'sensor_use_#:data.sensor_use#' } },
//             { field: 'sensor_kind', title: '센서종류', width: 90, filterable: true, attributes: { 'class': 'sensor_use_#:data.sensor_use#' } },
//             { field: 'alarm_msg', title: '장애발생내역', width: 350, filterable: false, attributes: { 'class': 'sensor_use_#:data.sensor_use#', style: 'font-size: 0.84em' } },
//             { field: 'occur_date', title: '발생시간', width: 120, filterable: false, attributes: { 'class': 'sensor_use_#:data.sensor_use#' } },
//             { field: 'recovery_date', title: '해제시간', width: 120, filterable: false, attributes: { 'class': 'sensor_use_#:data.sensor_use#' } },
//             { field: 'action_user_name', title: '조치자', width: 80, filterable: true },
//             { field: 'action_date', title: '조치시간', width: 120, filterable: false },
//             { field: 'action_content', title: '조치내용', filterable: false, attributes: { style: 'font-size: 0.84em' } },
//             { field: 'group_name', title: '그룹명', filterable: true, hidden: true },
//             { field: 'alarmHistoryId', title: 'history_id', menu: false, filterable: false, hidden: true },
//             { field: 'group_id', title: 'group_id', menu: false, filterable: true, hidden: true },
//             { field: 'equip_id', title: '설비', menu: false, filterable: true, hidden: true, groupable: true, aggregates: [ "count" ], groupHeaderTemplate: customGroupHeaderTemplate },
//             { field: 'equip_name', title: '설비명', filterable: true, hidden: true },
//             { field: 'sensor_id', title: 'sensor_id', menu: false, filterable: true, hidden: true }
//         ],
//         excelExport: function(e) {
//             e.workbook.fileName = createFileName('xlsx');
            
//             // by shkoh 20181220: 장애등급 열의 너비는 Web의 이미지가 아닌 텍스트로 변경이 됨으로 크기를 90으로 조정
//             e.workbook.sheets[0].columns[1].width = 90;

//             let group_index = -1;
//             let item_index = -1;
//             e.workbook.sheets[0].rows.map(function(row, idx, rows) {
//                 // by shkoh 20181220: 각 셀의 글자크기는 9로 조정
//                 row.cells.map(function(cell) { cell.fontSize = 9; });

//                 if(row.type == 'header') {
//                     // by shkoh 20181220: Web에서는 공란으로 처리된 장애등급의 헤더 칸에 '장애등급' 텍스트 추가
//                     row.cells[1].value = '장애등급';
//                 } else if(row.type == 'group-header') {
//                     group_index++;
//                     item_index = 0;
//                 } else if(row.type == 'data') {
//                     let alarm_text = '';
//                     switch(e.data[group_index].items[item_index].alarm_level) {
//                         case 0: alarm_text = '정상'; break;
//                         case 1: alarm_text = '주의'; break;
//                         case 2: alarm_text = '경고'; break;
//                         case 3: alarm_text = '위험'; break;
//                         case 4: alarm_text = '응답없음'; break;
//                         case 5: alarm_text = '통신불량'; break;
//                     }
                    
//                     row.cells[1].value = alarm_text;

//                     if(e.data[group_index].items[item_index].sensor_use == 'N') {
//                         row.cells.map(function(cell) { cell.color = '#888888'; });
//                     }

//                     item_index++;
//                 }
//             });
//         },
//         pdfExport: function(e) {
//             g_alarm_history_grid.setOptions({ pdf: { fileName: createFileName('pdf') } });
//         }
//     }).data('kendoGrid');
// }

// function initAlarmHistoryDataSource() {
//     g_alarm_history_data_source = new kendo.data.DataSource({
//         transport: {
//             read: {
//                 type: 'GET',
//                 dataType: 'json',
//                 url: function() {
//                     return '/history/alarm/equip?equip_ids=' + g_selected_equip_ids + '&start_date=' + g_start_date + '&end_date=' + g_end_date;
//                 }
//             }
//         },
//         group: [
//             { field: 'equip_id', aggregates: [{ field: 'equip_id', aggregate: 'count' }] }
//         ],
//         sort: {
//             field: 'occur_date', dir: 'desc'
//         },
//         autoSync: false,
//         batch: false,
//         pageSize: 100,
//         schema: {
//             model: {
//                 id: 'alarmHistoryId',
//                 fields: {
//                     alarmHistoryId: { type: 'number' },
//                     alarm_level: { editable: false },
//                     occur_date: { type: 'datetime', editable: false },
//                     recovery_date: { type: 'datetime', editable: false },
//                     alarm_msg: { type: 'string', editable: false },
//                     action_date: { type: 'datetime', editable: false, nullable: false },
//                     action_user_name: { type: 'string', editable: false, nullable: false },
//                     action_content: { type: 'string', editable: false, nullable: false },
//                     group_id: { type: 'number' },
//                     group_name: { type: 'string' },
//                     equip_id: { type: 'number' },
//                     equip_name: { type: 'string' },
//                     equip_kind: { type: 'string' },
//                     sensor_id: { type: 'number' },
//                     sensor_name: { type: 'string' },
//                     sensor_kind: { type: 'string' },
//                     sensor_use: { type: 'string '}
//                 }
//             }
//         }
//     });

//     g_alarm_history_grid.setDataSource(g_alarm_history_data_source);
// }

// function createFileName(export_ext) {
//     if(g_start_date == undefined || g_end_date == undefined) return '';
    
//     const start_date = g_start_date.substring(0, 10).replace(/\//g, '');
//     const start_time = g_start_date.substr(11).replace(':', '');
//     const end_date = g_end_date.substring(0, 10).replace(/\//g, '');
//     const end_time = g_end_date.substr(11).replace(':', '');

//     return '장애이력_' + start_date + start_time + '_' + end_date + end_time + '.' + export_ext;
// }

// function customGroupHeaderTemplate(e) {
//     const equip_name = '설비명: ' + e.items[0].equip_name;
//     const count_total = ', 장애발생 건수: ' + e.count;

//     let alarm_level_text = '';
    
//     const count_condition = $('.btn-check.active').length;
//     if(count_condition != 0) {
//         alarm_level_text = alarm_level_text.concat(' (');

//         $('.btn-check.active').each(function(idx, item) {
//             const level = parseInt($(item).attr('alarm-level'));
//             switch(level) {
//                 case 1: alarm_level_text = alarm_level_text.concat('주의: ' + e.items.filter(function(item) { return item.alarm_level == 1; }).length).toString(); break;
//                 case 2: alarm_level_text = alarm_level_text.concat('경고: ' + e.items.filter(function(item) { return item.alarm_level == 2; }).length).toString(); break;
//                 case 3: alarm_level_text = alarm_level_text.concat('위험: ' + e.items.filter(function(item) { return item.alarm_level == 3; }).length).toString(); break;
//                 case 4: alarm_level_text = alarm_level_text.concat('응답없음: ' + e.items.filter(function(item) { return item.alarm_level == 4; }).length).toString(); break;
//                 case 5: alarm_level_text = alarm_level_text.concat('통신불량: ' + e.items.filter(function(item) { return item.alarm_level == 5; }).length).toString(); break;
//             }

//             if(idx + 1 < $('.btn-check.active').length) {
//                 alarm_level_text = alarm_level_text.concat(', ');
//             }
//         });

//         alarm_level_text = alarm_level_text.concat(')');
//     }
    
//     return equip_name + count_total + alarm_level_text;
// }
/***************************************************************************************************************/
/* by shkoh 20181217: Alarm History End                                                                        */
/***************************************************************************************************************/