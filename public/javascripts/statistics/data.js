let g_treeViewController = undefined;

let g_table_dropdown = undefined;

let g_data_grid = undefined;
let g_data_source = undefined;

let g_searching_value = {
    select: {},
    table: '',
    startDate: undefined,
    endDate: undefined
};

let g_start_date_controller = undefined;
let g_end_date_controller = undefined;

let g_grid_index = 1;

$(window).resize(function() {
    resizeWindow();
});

$(document).ready(function() {
    resizeWindow();
    
    initTreeView();
    initTableDropDownList();
    initButton();
    initDateTimePicker();

    initDataStatisticsGrid();
    initDataStatisticsDataSource();

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

        setTimeout(function() {
            g_searching_value.startDate = $('#start-date').val();
            g_searching_value.endDate = $('#end-date').val();

            // by shkoh 20200702: 검색버튼을 클릭하면 page는 처음페이지로 이동
            g_data_source.read().then(function() { g_data_source.page(1); });
        });
    });
});

function resizeWindow() {
    $('#tree-content').height(calculateTreeContentHeight());
    $('#report-page').height(calculateDataContentHeight());

    if(g_data_grid) g_data_grid.resize();
}

function calculateTreeContentHeight() {
    // by shkoh 20200625: 전체 body에서 padding-top과 padding-bottom의 크기 16을 뺀 작업공간의 영역
    const viewer_h = parseFloat(parent['mainViewer'].innerHeight || parent['mainViewer'].clientHeight) - 16;
    const panel_heading_h = parseFloat($('.panel-heading').height()) + 6;
    const panel_heading_padding_h = 8;

    return viewer_h - panel_heading_h - panel_heading_padding_h + 1;
}

function calculateDataContentHeight() {
    // by shkoh 20200625: 전체 body에서 padding-top과 padding-bottom의 크기 16을 뺀 작업공간의 영역
    const viewer_h = parseFloat(parent['mainViewer'].innerHeight || parent['mainViewer'].clientHeight) - 16;
    const header_h = parseFloat($('.panel-header').height()) + 10;
    const border_h = 6;
    // by shkoh 20200625: panel에서 heading의 크기와 border의 크기를 모두 합친 것이 panel-heading의 전체 크기
    const panel_heading_h = parseFloat($('.panel-heading').height()) + 6;
    const panel_heading_padding_h = 8;

    return viewer_h - header_h - border_h - panel_heading_h - panel_heading_padding_h;
}

function displayLoading() {
    kendo.ui.progress($(document.body), true);
}

function undisplayLoading() {
    setTimeout(function() {
        kendo.ui.progress($(document.body), false);
    });
}

/***************************************************************************************************************/
/* by shkoh 20200626: Tree View Start                                                                          */
/***************************************************************************************************************/
function initTreeView() {
    g_treeViewController = new TreeViewContent('#tree-content', {
        onCheck: onTreeViewCheck
    });

    g_treeViewController.CreateTreeView();
}

function onTreeViewCheck(event, treeId, treeNode) {
    g_searching_value.select = {};
    
    const checked_tree_nodes = g_treeViewController.GetCheckedNodes();

    checked_tree_nodes.forEach(function(node) {
        const type = node.id.substr(0, 1);
        const id = node.id.substr(2);

        if(type === 'S') {
            const pid = node.pid.substr(2);
            
            if(g_searching_value.select[pid] === undefined) g_searching_value.select[pid] = [];
            g_searching_value.select[pid].push(id);
        }
    });
}
/***************************************************************************************************************/
/* by shkoh 20200626: Tree View End                                                                            */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20200626: Statistics Table Dropdown List Start                                                     */
/***************************************************************************************************************/
function initTableDropDownList() {
    g_table_dropdown = $('#table-picker').kendoDropDownList({
        noDataTemplate: '선택 가능한 통계 데이터 없음',
        dataTextField: 'text',
        dataValueField: 'value',
        dataSource: [
            { text: '5분 통계', value: '5minute' },
            { text: '시간 통계', value: 'hour' },
            { text: '일 통계', value: 'day' },
            { text: '월 통계', value: 'month' }
        ],
        index: 1,
        change: function(e) {
            if(g_start_date_controller) {
                g_start_date_controller.Reload(this.value());
            }

            if(g_end_date_controller) {
                g_end_date_controller.Reload(this.value());
            }

            g_searching_value.table = this.value();
        }
    }).data('kendoDropDownList');

    // by shkoh 20200701: 통계 데이터 선택 시 기본값 지정
    g_searching_value.table = g_table_dropdown.value();
}
/***************************************************************************************************************/
/* by shkoh 20200626: Statistics Table Dropdown List End                                                       */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20200701: Period Reset Button Start                                                                */
/***************************************************************************************************************/
function initButton() {
    $('#init-date').kendoButton({
        icon: 'refresh',
        click: function(e) {
            const period = g_table_dropdown.value() === undefined ? 'hour' : g_table_dropdown.value();
            const init_date = getDefaultDateTime(period, new Date());
            
            g_start_date_controller.ResetDate(init_date.startDate);
            g_end_date_controller.ResetDate(init_date.endDate);
        }
    });
}
/***************************************************************************************************************/
/* by shkoh 20200701: Period Reset Button End                                                                  */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20200626: DateTimePicker Start                                                                     */
/***************************************************************************************************************/
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
    const period = g_table_dropdown.value() === undefined ? 'hour' : g_table_dropdown.value();
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
/***************************************************************************************************************/
/* by shkoh 20181217: DateTimePicker End                                                                       */
/***************************************************************************************************************/

/***************************************************************************************************************/
/* by shkoh 20181221: Data Statistics Start                                                                    */
/***************************************************************************************************************/
function initDataStatisticsGrid() {
    g_data_grid = $('#report-page').kendoGrid({
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
            '<div style="display: table; width: 100%; height: 100%;">' +
                '<h3 style="margin: 0px; display: table-cell; vertical-align: middle;">' +
                    '<span class="label label-default" style="border-radius: 0px;">' +
                        '데이터 통계 내역이 없습니다' +
                    '</span>' +
                '</h3>' +
            '</div>'
        },
        selectable: 'row',
        sortable: true,
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
            { field: 'index', title: '순번', width: 50, template: function(e) { return g_grid_index++; }, sortable: false },
            { field: 'equip_name', title: '설비명', width: 200, filterable: false, sortable: false },
            { field: 'sensor_name', title: '수집항목(단위)', width: 200, filterable: false, sortable: false },
            { field: 'period', title: '주기', width: 300, filterable: false, sortable: false },
            { field: 'min_value', title: '최소값', width: 150, filterable: false, sortable: true, template: '#:min_value# #:unit#' },
            { field: 'avr_value', title: '평균값', width: 150, filterable: false, sortable: true, template: '#:avr_value# #:unit#' },
            { field: 'max_value', title: '최대값', width: 150, filterable: false, sortable: true, template: '#:max_value# #:unit#' },
            { field: 'range_value', title: '범위(최대값 - 최소값)', width: 150, filterable: false, sortable: true },
        ],
        dataBinding: function(e) {
            if(e.sender.pager.page() === 1) g_grid_index = 1;
            else g_grid_index = (e.sender.pager.page() - 1) * e.sender.pager.pageSize() + 1;
        },
        dataBound: function(e) {
            // by shkoh 20200702: 데이터가 새로 읽히거나, 페이지가 이동이 되거나 할 때, 커서를 최상단으로 옮김
            g_data_grid.current(g_data_grid.tbody.find('tr:first'));

            this.tbody.find('tr').on('dblclick', function() {
                const item = e.sender.dataItem(this);
                
                const url = '/popup/chart?sensor_id=' + item.sensor_id;
                const target = 'SensorChart_S' + item.sensor_id;
                window.open(url, target, 'scrollbars=1, menubar=no, resizable=no, location=no, titlebar=no, toolbar=no, status=no, width=1000, height=400');
            });

            undisplayLoading();
        },
        excelExport: function(e) {
            const file_name = exportFileName('xlsx');
            e.workbook.creator = 'ICOMER';
            e.workbook.fileName = file_name;
            // by shkoh 20200706: Excel Sheet 명을 지정함. Sheet의 이름은 최대 31자까지만 허용됨
            // e.workbook.sheets[0].name = file_name.substr(0, 31);
            e.workbook.sheets[0].name = file_name.split('(')[0];

            // by shkoh 20200706: 엑셀 Export에서 특정 셀의 값과 포멧을 변경하기 위해서 column index를 찾음
            const column_index_index = e.sender.thead.find('th[data-field="index"]')[0].cellIndex;
            const column_index_min = e.sender.thead.find('th[data-field="min_value"]')[0].cellIndex;
            const column_index_avr = e.sender.thead.find('th[data-field="avr_value"]')[0].cellIndex;
            const column_index_max = e.sender.thead.find('th[data-field="max_value"]')[0].cellIndex;
            const column_index_range = e.sender.thead.find('th[data-field="range_value"]')[0].cellIndex;
            
            // by shkoh 20200710: data_index: Excel Export에 사용되는 전체 데이터의 index를 지정
            let data_index = 0;
            // by shkoh 20200710: data_list_index: Data Grid에 지정된 순번을 표시하기 위해서 사용. 전체 데이터의 수가 1000개 넘는 경우에는 전체 페이지를 export한다는 의미가 해석함
            let data_list_index = e.data.length > 1000 ? 1 : (e.sender.pager.page() - 1) * e.sender.pager.pageSize() + 1;
            
            // by shkoh 20200706: 엑셀 파일에 조회기간 Cell 추가. Cell이 추가되면서 freezePane의 row 값도 1추가
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
                    let unit = undefined;
                    try {
                        // by shkoh 20200710: Excel Export에 사용된 전체 데이터
                        unit = e.data.at(data_index).unit;
                    } catch(error) {
                        unit = '';
                    }

                    if(row.cells[column_index_index]) {
                        row.cells[column_index_index].value = Number(data_list_index);
                    }

                    if(row.cells[column_index_min]) {
                        row.cells[column_index_min].value = kendo.parseFloat(row.cells[column_index_min].value);
                        row.cells[column_index_min].format = '#,##0.00 "' + unit + '"';
                    }

                    if(row.cells[column_index_avr]) {
                        row.cells[column_index_avr].value = kendo.parseFloat(row.cells[column_index_avr].value);
                        row.cells[column_index_avr].format = '#,##0.00 "' + unit + '"';
                    }

                    if(row.cells[column_index_max]) {
                        row.cells[column_index_max].value = kendo.parseFloat(row.cells[column_index_max].value);
                        row.cells[column_index_max].format = '#,##0.00 "' + unit + '"';
                    }

                    if(row.cells[column_index_range]) {
                        row.cells[column_index_range].value = kendo.parseFloat(row.cells[column_index_range].value);
                        row.cells[column_index_range].format = '#,##0.00';
                    }

                    data_index++;
                    data_list_index++;
                }
            });

            undisplayLoading();
        }
    }).data('kendoGrid');
}

function initDataStatisticsDataSource() {
    g_data_source = new kendo.data.DataSource({
        transport: {
            read: {
                cache: true,
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json',
                url: '/api/data/statistics/get',
                data: function() {
                    return g_searching_value;
                }
            },
            parameterMap: function(data, type) {
                if(type === 'read') {
                    // by shkoh 20200703: 데이터 통계 설비/센서 항목의 수가 많아서 POST 방식으로 데이터 전달
                    return kendo.stringify(data);
                }
            }
        },
        error: function(e) {
            if(e.type === 'read') {
                alert('데이터 통계를 로드하는 동안에 에러가 발생했습니다');

                undisplayLoading();
            }
        },
        requestStart: function(e) {
            if(e.type === 'read') displayLoading();
        },
        requestEnd: function(e) {
            if(e.type === undefined) {
                console.error(e);
                alert('데이터 통계 조회 중 에러가 발생했습니다');

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
            },
            model: {
                fields: {
                    min_value: { type: 'number', parse: function(v) { return kendo.toString(v, 'n2'); } },
                    avr_value: { type: 'number', parse: function(v) { return kendo.toString(v, 'n2'); } },
                    max_value: { type: 'number', parse: function(v) { return kendo.toString(v, 'n2'); } },
                    range_value: { type: 'number', parse: function(v) { return kendo.toString(v, 'n2'); } }
                }
            }
        }
    });

    g_data_grid.setDataSource(g_data_source);
}

function exportFileName(export_ext) {
    const { startDate, endDate, table } = g_searching_value;
    
    const start_date = startDate.substring(0, 10).replace(/\//g, '');
    const start_time = startDate.substr(11).replace(':', '');
    const end_date = endDate.substring(0, 10).replace(/\//g, '');
    const end_time = endDate.substr(11).replace(':', '');

    let period = undefined;
    switch(table) {
        case '5minute': period = '5분'; break;
        case 'hour': period = '시간'; break;
        case 'day': period = '일'; break;
        case 'month': period = '월'; break;
    }

    return '데이터_' + period + '통계(' + start_date + (start_time === '' ? '' : '_') + start_time + '-' + end_date + (end_time === '' ? '' : '_') + end_time + ').' + export_ext;
}

function exportDocumentHeaderText() {
    const { startDate, endDate, table } = g_searching_value;
    let period = '';
    
    switch(table) {
        case '5minute': period = '5분'; break;
        case 'hour': period = '시간'; break;
        case 'day': period = '일'; break;
        case 'month': period = '월'; break;
    }
    
    return '데이터 ' + period + '통계(조회기간: ' + startDate + ' ~ ' + endDate + ')';
}

function exportExcel(isAllPages) {
    const hasData = g_data_source.total();
    if(hasData === 0) {
        alert('엑셀 내보내기할 데이터가 존재하지 않습니다');
        return;
    }

    displayLoading();
    // by shkoh 20200706: UI 상에서 loading 페이지가 나타나야함으로 setTimeout을 주어서 약간의 delay를 발생함
    setTimeout(function() {
        g_data_grid.options.excel.allPages = isAllPages;
        g_data_grid.saveAsExcel();
    });
}

function exportPDF(isAllPages) {
    const hasData = g_data_source.total();
    if(hasData === 0) {
        alert('PDF로 내보내기할 데이터가 존재하지 않습니다');
        return;
    }

    displayLoading();

    // by shkoh 20200709: UI상에서 loading 페이지가 나타나야함으로 setTimeout을 주어서 약간의 delay를 발생시킴
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
    const head_data = [{}];

    // by shkoh 20200709: DataGrid에서 사용하는 column을 통해서 PDF Export 시에 사용할 수 있도록 데이터를 구성함
    g_data_grid.columns.forEach(function(c) {
        head_data[0][c.field] = c.title.normalize('NFC');
    });

    return head_data;
}

function getBodyDataForPDF(isAllPages) {
    const body_data = [];

    // by shkoh 20200728: 전체페이지를 내보낼 경우에는 datasource 전체를 해당 페이지만 내보낼 경우에는 view() 데이터만으로 pdf 문서를 생성함
    const start_index = isAllPages ? 0 : (g_data_source.page() - 1) * g_data_source.pageSize();
    const data = isAllPages ? g_data_source.data() : g_data_source.view();

    data.forEach(function(d, idx) {
        const index = start_index + (idx + 1);

        body_data.push({
            index: index,
            equip_name: d.equip_name,
            sensor_name: d.sensor_name,
            period: d.period,
            min_value: d.min_value + ' ' + d.unit,
            avr_value: d.avr_value + ' ' + d.unit,
            max_value: d.max_value + ' ' + d.unit,
            range_value: d.range_value
        });
    });

    return body_data;
}

function saveAsPDF(headData, bodyData) {
    const page_header_string = exportDocumentHeaderText();

    const pdf = new jsPDF({
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
/***************************************************************************************************************/
/* by shkoh 20181221: Data Statistics End                                                                      */
/***************************************************************************************************************/