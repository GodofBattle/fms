let g_grid = undefined;
let g_data_source = undefined;
let g_tree_controller = undefined;
let g_dropdown_controller = undefined;
let g_start_date_controller = undefined;
let g_end_date_controller = undefined;

let g_searching_value = {
    select: {},
    previous_table: '',
    table: '',
    startDate: undefined,
    endDate: undefined
}

let g_grid_index = 1;

const hour_columns = [
    { field: 'MI00', title: '00분', menu: false, format: '{0:n2}', width: 60 },
    { field: 'MI05', title: '05분', menu: false, format: '{0:n2}', width: 60 },
    { field: 'MI10', title: '10분', menu: false, format: '{0:n2}', width: 60 },
    { field: 'MI15', title: '15분', menu: false, format: '{0:n2}', width: 60 },
    { field: 'MI20', title: '20분', menu: false, format: '{0:n2}', width: 60 },
    { field: 'MI25', title: '25분', menu: false, format: '{0:n2}', width: 60 },
    { field: 'MI30', title: '30분', menu: false, format: '{0:n2}', width: 60 },
    { field: 'MI35', title: '35분', menu: false, format: '{0:n2}', width: 60 },
    { field: 'MI40', title: '40분', menu: false, format: '{0:n2}', width: 60 },
    { field: 'MI45', title: '45분', menu: false, format: '{0:n2}', width: 60 },
    { field: 'MI50', title: '50분', menu: false, format: '{0:n2}', width: 60 },
    { field: 'MI55', title: '55분', menu: false, format: '{0:n2}', width: 60 }
];

const day_columns = [
    { field: 'H00', title: '00시', menu: false, format: '{0:n2}', width: 50 },
    { field: 'H01', title: '01시', menu: false, format: '{0:n2}', width: 50 },
    { field: 'H02', title: '02시', menu: false, format: '{0:n2}', width: 50 },
    { field: 'H03', title: '03시', menu: false, format: '{0:n2}', width: 50 },
    { field: 'H04', title: '04시', menu: false, format: '{0:n2}', width: 50 },
    { field: 'H05', title: '05시', menu: false, format: '{0:n2}', width: 50 },
    { field: 'H06', title: '06시', menu: false, format: '{0:n2}', width: 50 },
    { field: 'H07', title: '07시', menu: false, format: '{0:n2}', width: 50 },
    { field: 'H08', title: '08시', menu: false, format: '{0:n2}', width: 50 },
    { field: 'H09', title: '09시', menu: false, format: '{0:n2}', width: 50 },
    { field: 'H10', title: '10시', menu: false, format: '{0:n2}', width: 50 },
    { field: 'H11', title: '11시', menu: false, format: '{0:n2}', width: 50 },
    { field: 'H12', title: '12시', menu: false, format: '{0:n2}', width: 50 },
    { field: 'H13', title: '13시', menu: false, format: '{0:n2}', width: 50 },
    { field: 'H14', title: '14시', menu: false, format: '{0:n2}', width: 50 },
    { field: 'H15', title: '15시', menu: false, format: '{0:n2}', width: 50 },
    { field: 'H16', title: '16시', menu: false, format: '{0:n2}', width: 50 },
    { field: 'H17', title: '17시', menu: false, format: '{0:n2}', width: 50 },
    { field: 'H18', title: '18시', menu: false, format: '{0:n2}', width: 50 },
    { field: 'H19', title: '19시', menu: false, format: '{0:n2}', width: 50 },
    { field: 'H20', title: '20시', menu: false, format: '{0:n2}', width: 50 },
    { field: 'H21', title: '21시', menu: false, format: '{0:n2}', width: 50 },
    { field: 'H22', title: '22시', menu: false, format: '{0:n2}', width: 50 },
    { field: 'H23', title: '23시', menu: false, format: '{0:n2}', width: 50 }
];

const month_columns = [
    { field: 'D01', title: '01일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D02', title: '02일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D03', title: '03일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D04', title: '04일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D05', title: '05일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D06', title: '06일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D07', title: '07일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D08', title: '08일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D09', title: '09일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D10', title: '10일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D11', title: '11일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D12', title: '12일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D13', title: '13일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D14', title: '14일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D15', title: '15일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D16', title: '16일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D17', title: '17일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D18', title: '18일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D19', title: '19일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D20', title: '20일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D21', title: '21일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D22', title: '22일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D23', title: '23일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D24', title: '24일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D25', title: '25일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D26', title: '26일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D27', title: '27일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D28', title: '28일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D29', title: '29일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D30', title: '30일', menu: false, format: '{0:n2}', width: 50 },
    { field: 'D31', title: '31일', menu: false, format: '{0:n2}', width: 50 }
];

const year_columns = [
    { field: 'MO01', title: '01월', menu: false, format: '{0:n2}', width: 60 },
    { field: 'MO02', title: '02월', menu: false, format: '{0:n2}', width: 60 },
    { field: 'MO03', title: '03월', menu: false, format: '{0:n2}', width: 60 },
    { field: 'MO04', title: '04월', menu: false, format: '{0:n2}', width: 60 },
    { field: 'MO05', title: '05월', menu: false, format: '{0:n2}', width: 60 },
    { field: 'MO06', title: '06월', menu: false, format: '{0:n2}', width: 60 },
    { field: 'MO07', title: '07월', menu: false, format: '{0:n2}', width: 60 },
    { field: 'MO08', title: '08월', menu: false, format: '{0:n2}', width: 60 },
    { field: 'MO09', title: '09월', menu: false, format: '{0:n2}', width: 60 },
    { field: 'MO10', title: '10월', menu: false, format: '{0:n2}', width: 60 },
    { field: 'MO11', title: '11월', menu: false, format: '{0:n2}', width: 60 },
    { field: 'MO12', title: '12월', menu: false, format: '{0:n2}', width: 60 }
]

$(window).resize(function() {
    resizeWindow();
});

$(document).ready(function() {
    resizeWindow();

    initTreeView();
    initTableDropDownList();
    initDateTimePicker();
    initPeriodButton();

    initDataReportGrid();
    initDataReportDataSource();

    $('#search-button').click(function(e) {
        if(Object.keys(g_searching_value.select).length === 0) {
            alert('조회항목을 선택하세요');
            return;
        }

        const start_date = g_start_date_controller.GetDate();
        const end_date = g_end_date_controller.GetDate();

        if(start_date - end_date > 0) {
            alert('조회 시작시간이 종료시간보다 우선일 순 없습니다');
            return;
        }

        displayLoading();

        setTimeout(function() {
            g_searching_value.startDate = $('#start-date').val();
            g_searching_value.endDate = $('#end-date').val();

            /**
             * 데이터보고서는 시간 / 일 / 월 / 연 보고서 별로 column이 변경이 됨으로 매번 검색할 때마다 기존에 데이터를 clear하고 선택한 테이블에 맞게 column이 숨기고 보이도록 함
             * 그리고 page는 1페이지로 이동하게 되면 [검색] 버튼을 클릭할 때마다 새로 읽는 효과를 가져다 줌
             * 
             * 일반적인 방법으로 처리를 하게 되면 조회 시 속도에 영향을 끼침으로 아래의 방법으로 진행해야 함
             * column을 재조정할 때에는 grid에 데이터가 없을 때, 가장 속도가 빠름으로 반드시 사전에 데이터를 clear 해줄 필요가 있음
             */

            // by shkoh 20200715: 검색을 시작하면 우선 datasource의 내용을 클리어함
            g_data_source.data([]);
            
            // by shkoh 20200713: 선택한 테이블에 따라서 Grid의 Columns을 변경함
            if(g_searching_value.previous_table !== g_searching_value.table) showDataGridColumns(g_searching_value.previous_table, g_searching_value.table);

            // by shkoh 20200716: datasource에서 1 page로 이동만 하여도 데이터를 새로 읽음
            g_data_source.page(1);
        });
    });
});

/**********************************************************************************************************************************************/
/* by shkoh 20200710: resize window start                                                                                                     */
/**********************************************************************************************************************************************/
function resizeWindow() {
    $('#tree-content').height(calculateTreeContentHeight());
    $('#report-page').height(calculateDataReportContentHeight());

    if(g_grid) {
        g_grid.resize();
        adjustColumns();
    }
}

function calculateTreeContentHeight() {
    // by shkoh 20200710: body에서 padding-top과 padding-bottom의 크기 16을 뺀 tree content의 높이
    const viewer_h = parseFloat(parent['mainViewer'].innerHeight || parent['mainViewer'].clientHeight) - 16;
    const panel_heading_h = parseFloat($('.panel-heading').height()) + 6;
    const panel_heading_padding_h = 8;

    return viewer_h - panel_heading_h - panel_heading_padding_h + 1;
}

function calculateDataReportContentHeight() {
    // by shkoh 20200710: body에서 padding-top과 padding-bottom의 크기 16을 뺀 report grid의 높이
    const viewer_h = parseFloat(parent['mainViewer'].innerHeight || parent['mainViewer'].clientHeight) - 16;
    const header_h = parseFloat($('.panel-header').height()) + 10;
    const border_h = 6;

    // by shkoh 20200710: panel에서 heading의 크기와 border의 크기를 모두 합친 것을 panel-heading의 전체 크기로 계산함
    const panel_heading_h = parseFloat($('.panel-heading').height()) + 6;
    const panel_heading_padding_h = 8;

    return viewer_h - header_h - border_h - panel_heading_h - panel_heading_padding_h;
}
/**********************************************************************************************************************************************/
/* by shkoh 20200710: resize window end                                                                                                       */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200710: tree start                                                                                                              */
/**********************************************************************************************************************************************/
function initTreeView() {
    g_tree_controller = new TreeViewContent('#tree-content', {
        onCheck: onTreeViewCheck
    });

    g_tree_controller.CreateTreeView();
}

function onTreeViewCheck(event, treeId, treeNode) {
    g_searching_value.select = {};

    const checked_tree_nodes = g_tree_controller.GetCheckedNodes();
    checked_tree_nodes.forEach(function(node) {
        const type = node.id.substr(0, 1);
        const id = node.id.substr(2);

        if(type === 'S') {
            const pid = node.pid.substr(2);
            if(g_searching_value.select[pid] === undefined) g_searching_value.select[pid] = new Array();
            
            g_searching_value.select[pid].push(id);
        }
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20200710: tree end                                                                                                                */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200710: report table dropdown list start                                                                                        */
/**********************************************************************************************************************************************/
function initTableDropDownList() {
    g_dropdown_controller = $('#table-picker').kendoDropDownList({
        noDataTemplate: '선택 가능한 보고서 데이터 없음',
        dataTextField: 'text',
        dataValueField: 'value',
        dataSource: [
            { text: '시간별 보고서', value: 'hour' },
            { text: '일별 보고서', value: 'day' },
            { text: '월별 보고서', value: 'month' },
            { text: '연별 보고서', value: 'year' }
        ],
        index: 1,
        change: function(e) {
            if(g_start_date_controller) g_start_date_controller.Reload(this.value());
            if(g_end_date_controller) g_end_date_controller.Reload(this.value());

            g_searching_value.table = this.value();            
        }
    }).data('kendoDropDownList');

    g_searching_value.previous_table = g_dropdown_controller.value();
    g_searching_value.table = g_dropdown_controller.value();
}
/**********************************************************************************************************************************************/
/* by shkoh 20200710: report table dropdown list end                                                                                          */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200710: datetime picker start                                                                                                   */
/**********************************************************************************************************************************************/
function getDefaultDateTime(_period, _date) {
    const date = new Date(_date);

    let _start = undefined;
    let _end = undefined;

    switch(_period) {
        case 'hour': {
            const hour = date.getHours();
            _end = new Date(date.setHours(hour + 1, 0));

            const day = date.getDate();
            _start = new Date(date.setDate(day - 1));
            break;
        }
        case 'day': {
            const hour = date.getHours();
            _end = new Date(date.setHours(hour + 1, 0));

            const month = date.getMonth();
            _start = new Date(date.setMonth(month - 1));
            break;
        }
        case 'month': {
            const hour = date.getHours();
            _end = new Date(date.setHours(hour + 1, 0));

            const year = date.getFullYear();
            _start = new Date(date.setFullYear(year - 1));
            break;
        }
        case 'year': {
            const hour = date.getHours();
            _end = new Date(date.setHours(hour + 1, 0));

            const year = date.getFullYear();
            _start = new Date(date.setFullYear(year - 10));
            break;
        }
    }

    return {
        startDate: _start,
        endDate: _end
    }
}

function initDateTimePicker() {
    const period = g_dropdown_controller.value() === undefined ? 'day' : g_dropdown_controller.value();
    const init_date = getDefaultDateTime(period, new Date());

    g_start_date_controller = new DatePicker('#start-date', {
        period: period,
        startDate: init_date.startDate
    });
    g_start_date_controller.CreateDatePicker();

    g_end_date_controller = new DatePicker('#end-date', {
        period: period,
        startDate: init_date.endDate
    });
    g_end_date_controller.CreateDatePicker();
}
/**********************************************************************************************************************************************/
/* by shkoh 20200710: datetime picker end                                                                                                     */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200710: period button start                                                                                                     */
/**********************************************************************************************************************************************/
function initPeriodButton() {
    $('#init-date').kendoButton({
        icon: 'refresh',
        click: function(e) {
            const period = g_dropdown_controller.value() === undefined ? 'day' : g_dropdown_controller.value();
            const init_date = getDefaultDateTime(period, new Date());

            g_start_date_controller.ResetDate(init_date.startDate);
            g_end_date_controller.ResetDate(init_date.endDate);
        }
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20200710: period button end                                                                                                       */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200710: data report grid start                                                                                                  */
/**********************************************************************************************************************************************/
function initDataReportGrid() {
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
                        click: exportExcel.bind(this, false),
                        menuButtons: [{
                            id: 'exportExcelAll',
                            text: '전체 엑셀 내보내기',
                            icon: 'excel',
                            click: exportExcel.bind(this, true)
                        }]
                    },
                    {
                        id: 'exportPDF',
                        type: 'splitButton',
                        text: 'PDF 내보내기',
                        icon: 'pdf',
                        click: exportPDF.bind(this, false),
                        menuButtons: [{
                            id: 'exportPDFAll',
                            text: '전체 PDF 내보내기',
                            icon: 'pdf',
                            click: exportPDF.bind(this, true)
                        }]
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
                        데이터 보고서 내역이 존재하지 않습니다\
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
        columns: [
            { field: 'index', title: '순번', width: 50, locked: true, template: function(e) { return g_grid_index++; } },
            { field: 'equip_name', title: '설비명', width: 140, locked: true },
            { field: 'sensor_name', title: '수집항목(단위)', width: 150, locked: true, template: '#:sensor_name##if (unit) { #(#:unit#)# }#' },
            { field: 'stat_date', title: '조회시간', width: 120, locked: true },
            { field: 'hour', title: '시간별 데이터', hidden: true, columns: hour_columns },
            { field: 'day', title: '일별 데이터', hidden: false, columns: day_columns },
            { field: 'month', title: '월별 데이터', hidden: true, columns: month_columns },
            { field: 'year', title: '연별 데이터', hidden: true, columns: year_columns }
        ],
        dataBinding: function(e) {
            if(e.sender.pager.page() === 1) g_grid_index = 1;
            else g_grid_index = (e.sender.pager.page() - 1) * e.sender.pager.pageSize() + 1;
        },
        dataBound: function(e) {
            // by shkoh 20200713: 데이터가 새로 읽히거나, 페이지 이동이 되었을 때에는 커서를 최상단으로 이동함
            e.sender.current(e.sender.tbody.find('tr:first'));

            if(e.sender.dataItems().length > 0) undisplayLoading();
        },
        excelExport: function(e) {
            const file_name = exportFileName('xlsx');
            e.workbook.creator = 'ICOMER';
            e.workbook.fileName = file_name;

            // by shkoh 20200716: Excel Sheet명은 최대 31자까지만 허용됨
            e.workbook.sheets[0].name = file_name.split('(')[0];

            // by shkoh 20200716: 엑셀 Export 시에 특정 셀의 값과 포멧을 변경하기 위해서는 column index를 사전에 찾아야함
            // by shkoh 20200716: 데이터보고서의 경우에는 [순번] [설비명] [수집항목(단위)] [조회시간]은 column에 lock을 해두었기 때문에 lockedHeader를 참조함
            // by shkoh 20200716: 실제 데이터에서 excel index의 값을 계산할 때에는 lockedheader의 수(e.sender.lockedHeader.find('th').length)를 합함
            const column_index_index = e.sender.lockedHeader.find('th[data-field="index"]')[0].cellIndex;
            const column_index_sensor = e.sender.lockedHeader.find('th[data-field="sensor_name"]')[0].cellIndex;

            const column_index_last_lockedheader = e.sender.lockedHeader.find('th').length - 1;

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
            e.workbook.sheets[0].freezePane.rowSplit = 3;

            e.workbook.sheets[0].rows.map(function(row, idx, rows) {
                if(row.type === 'data') {
                    let unit = undefined;
                    try { unit = e.data.at(data_index).unit;
                    } catch(error) { unit = ''; }

                    row.cells.forEach(function(cell, index, cells) {
                        if(index === column_index_index) {
                            cell.value = Number(data_list_index);
                        }

                        if(index === column_index_sensor && unit !== '') {
                            cell.value = cell.value + '(' + unit + ')';
                        }

                        if(index > column_index_last_lockedheader) {
                            cell.value = kendo.parseFloat(cell.value);
                            cell.format = '#,##0.00';
                        }
                    });

                    data_index++;
                    data_list_index++;
                }
            });

            undisplayLoading();
        }
    }).data('kendoGrid');
}
                        
function initDataReportDataSource() {
    g_data_source = new kendo.data.DataSource({
        autoSync: false,
        transport: {
            read: {
                cache: true,
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json',
                url: '/api/data/report/get',
                data: function() {
                    return g_searching_value;
                }
            },
            parameterMap: function(data, type) {
                if(type === 'read') {
                    // by shkoh 20200713: 데이터 보고서에서 설비/수집항목의 수를 전체로 택할 경우 parameter의 길이 제한문제가 발생함으로 POST 방식으로 전달
                    return kendo.stringify(data);
                }
            }
        },
        error: function(e) {
            if(e.type === 'read') {
                alert('데이터 보고서를 로드하는 동안에 에러가 발생했습니다');
                undisplayLoading();
            }
        },
        requestStart: function(e) {
            if(e.type === 'read') displayLoading();
        },
        requestEnd: function(e) {
            // by shkoh 20200715: e.type이 존재하지 않는 경우는 에러가 발생한 경우로 판단함
            if(e.type === undefined) {
                console.error(e);
                alert('데이터 보고서 조회 중 에러가 발생했습니다');
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
                return response.length;
            }
        }
    });
    
    g_grid.setDataSource(g_data_source);
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
            const head_data = getHeadDataForPDF();
            const body_data = getBodyDataForPDF(isAllPages);

            saveAsPDF(head_data, body_data);
        } catch(err) {
            console.error(err);
            undisplayLoading();
        }
    });
}

function getHeadDataForPDF() {
    const head_data = [ [], [] ];
    
    g_grid.columns.forEach(function(c, index) {
        if(index < 4) {
            head_data[0].push({
                dataKey: c.field,
                content: c.title.normalize('NFC'),
                rowSpan: 2,
                styles: { valign: 'middle' }
            });
        } else if(c.hidden === false) {
            head_data[0].push({
                dataKey: c.field,
                content: c.title.normalize('NFC'),
                colSpan: c.columns.length,
                styles: { valign: 'middle' }
            });
            
            c.columns.forEach(function(c1, index) {
                head_data[1].push({
                    dataKey: c1.field,
                    content: c1.title.normalize('NFC'),
                    styles: { valign: 'middle' }
                });
            });
        }
    });

    return head_data;
}

function getBodyDataForPDF(isAllPages) {
    const body_data = [];
    const show_column = g_grid.columns.filter(function(c) { return c.hidden === false; })[0];
    
    const start_index = isAllPages ? 0 : (g_data_source.page() - 1) * g_data_source.pageSize();
    const data = isAllPages ? g_data_source.data() : g_data_source.view();

    data.forEach(function(d, idx) {
        const index = start_index + (idx + 1);
        
        const row = [
            { dataKey: 'index', content: index },
            { dataKey: 'eqiup_name', content: d.equip_name },
            { dataKey: 'sensor_name', content: d.unit === '' ? d.sensor_name : d.sensor_name + '(' + d.unit + ')' },
            { dataKey: 'stat_date', content: d.stat_date }
        ];

        show_column.columns.forEach(function(c) {
            row.push({
                dataKey: c.field,
                content: d[c.field] === null ? '' : kendo.toString(d[c.field], 'n2')
            });
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
            cellPadding: g_searching_value.table === 'month' ? 0.4 : 0.8,
            textColor: '#000000',
            fontSize: g_searching_value.table === 'month' ? 4 : 6,
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
            // by shkoh 20200717: PDF Page Header
            pdf.setFontSize(7);
            pdf.setFontStyle('bold');
            pdf.setTextColor('#303030');

            pdf.text(page_header_string, data.settings.margin.left, 8);

            // by shkoh 20200717: PDF Page Footer
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
/* by shkoh 20200710: data report grid end                                                                                                    */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200713: inline function start                                                                                                   */
/**********************************************************************************************************************************************/
function displayLoading() {
    kendo.ui.progress($(document.body), true);
}

function undisplayLoading() {
    setTimeout(function() {
        kendo.ui.progress($(document.body), false);
    });
}

function showDataGridColumns(previous_table, new_table) {
    g_grid.hideColumn(previous_table);
    g_grid.showColumn(new_table);
    
    g_searching_value.previous_table = new_table;
    
    adjustColumns();
}

function adjustColumns() {
    let column_count = 0;
    let default_column_width = 0;
    switch(g_searching_value.table) {
        case 'hour': {
            column_count = hour_columns.length;
            default_column_width = hour_columns[0].width;
            break;
        }
        case 'day': {
            column_count = day_columns.length;
            default_column_width = day_columns[0].width;
            break;
        }
        case 'month': {
            column_count = month_columns.length;
            default_column_width = month_columns[0].width;
            break;
        }
        case 'year': {
            column_count = year_columns.length;
            default_column_width = year_columns[0].width;
            break;
        }
    }
    
    const content_div = g_grid.wrapper.children('.k-grid-content');
    
    const grid_div_width = content_div.width() - kendo.support.scrollbar();
    const column_width = parseInt(grid_div_width / column_count);
    
    if(column_width > default_column_width) {
        const thead = g_grid.thead.parent().find('col');
        for(const col of Object.values(thead)) {
            $(col).width(column_width);
        }
        
        const tbody = g_grid.tbody.parent().children('colgroup').find('col');
        for(const col of Object.values(tbody)) {
            $(col).width(column_width);
        }
    }
}

function exportFileName(export_ext) {
    const { startDate, endDate, table } = g_searching_value;

    const start_date = startDate.substring(0, 10).replace(/\//g, '');
    const start_time = startDate.substr(11).replace(/:/, '');
    const end_date = endDate.substring(0, 10).replace(/\//g, '');
    const end_time = endDate.substr(11).replace(/:/, '');

    let period = '';
    switch(table) {
        case 'hour': period = '시간별'; break;
        case 'day': period = '일별'; break;
        case 'month': period = '월별'; break;
        case 'year': period = '연별'; break;
    }

    return '데이터_' + period + '보고서(' + start_date + (start_time === '' ? '' : '_') + start_time + '-' + end_date + (end_time === '' ? '' : '_') + end_time + ').' + export_ext;
}

function exportDocumentHeaderText() {
    const { startDate, endDate, table } = g_searching_value;
    
    let period = '';
    switch(table) {
        case 'hour': period = '시간별'; break;
        case 'day': period = '일별'; break;
        case 'month': period = '월별'; break;
        case 'year': period = '연별'; break;
    }

    return '데이터 ' + period + ' 보고서(조회기간: ' + startDate + '~' + endDate + ')';
}
/**********************************************************************************************************************************************/
/* by shkoh 20200713: inline function end                                                                                                     */
/**********************************************************************************************************************************************/

function setColumnTitle() {
    const title = createColumnTitle();

    g_report_grid.thead.find('[data-field=' + g_selected_searching_data + ']').text(title);
    g_report_grid.thead.find('[data-field=' + g_selected_searching_data + ']').attr('data-title', title);
}

function createColumnTitle() {
    let title = '';
    switch(g_selected_searching_data) {
        case 'year': title = '년 데이터'; break;
        case 'month': title = '월별 데이터'; break;
        case 'day': title = '일별 데이터'; break;
        case 'hour': title = '시간 별 데이터'; break;
    }

    let start_date = convertDate(g_start_date);
    let end_date = convertDate(g_end_date);
    let detail_text = '(조회 데이터기간: ' + start_date + ' ~ ' + end_date + ')';

    return title + detail_text;
}