/**
 * by shkoh 20210421: 우리FIS 전용 UPS 전력 사용현황 보고서 javascript
 * 
 * key id: ups_usage
 */
let g_ups_tree_inst = undefined;
let g_table_inst = undefined;
let g_s_date_inst = undefined;
let g_e_date_inst = undefined;

let g_searching_value = {
    ids: [],
    table: '',
    startDate: undefined,
    endDate: undefined
};

let g_export_util = new ExportUtil();

let g_series_color = [ '#8ebc00', '#1f77b4', '#ff7f0e', '#8a0c0c', '#133079', '#b32fa6' ];

/**
 * by shkoh 20210419: 보고서 정의
 */
 const report_config = {
    // by shkoh 20210419: 보고서 형태가 가로방향(landscape)인지 세로방향(portrait)인지 여부
    is_landscape: false,
     
    // by shkoh 20210419: 보고서 디자인 시 작성한 colgroup의 수
    columns: {
        count: 24,
    },
    pdf: {
        // by shkoh 20210208: PDF Export 시, 기본 font의 크기
        defaultFontSize: 7
    },
    excel: {
        columnWidth: 32,
        // by shkoh 20210208: Excel Export 시, 엑셀 시트의 셀 Column의 전체 수
        // by shkoh 20210208: 보고서 전체 사용 column 수에서 좌우 여백를 고려하여, (보고서에서 사용한 <colgroup> 수) + 2
        columnCount: 24 + 2
    }
}

$(window).resize(function() {
    resizeWindow();
});

$(document).ready(function() {
    initToolbar();
    initTableDropDownList();
    initDateTimePicker();
    initButton();

    $('#report-page').mCustomScrollbar({
        theme: 'minimal-dark',
        axis: 'y',
        scrollbarPosition: 'outside',
        mouseWheel: {
            preventDefault: true
        }
    });
    
    resizeWindow();

    $('#search-button').click(function() {
        const start_date = g_s_date_inst.GetDate();
        const end_date = g_e_date_inst.GetDate();
        if(start_date - end_date > 0) {
            alert('조회 시작시간이 종료시간보다 우선일 순 없습니다');
            return;
        }

        setTimeout(function() {
            displayLoading();

            g_searching_value.startDate = $('#start-date').val();
            g_searching_value.endDate = $('#end-date').val();

            // by shkoh 20210426: 보고서 생성 시 사용한 통계 데이터의 명칭을 화면에 업데이트
            updateReportTable();
            // by shkoh 20210426: 조회기간을 보고서 내용에 업데이트
            updateSearchingDate();
            // by shkoh 20210426: 출력일자를 보고서 내용에 업데이트
            updatePrintDate();
            // by shkoh 20210426: 출력자를 보고서 내용에 업데이트
            updatePrinterName();

            const kw_data_load = kwDataLoad();
            const load_data_load = loadDataLoad();

            Promise.all([ kw_data_load, load_data_load ]).catch(function(err) {
                console.error(err);
            }).finally(function() {
                undisplayLoading();
            });
        }, 0);
    });
});

/**********************************************************************************************************************************************/
/* by shkoh 20210421: resizing start                                                                                                          */
/**********************************************************************************************************************************************/
function resizeWindow() {
    const viewer_h = parseFloat(parent['mainViewer'].innerHeight || parent['mainViewer'].clientHeight);
    const viewer_padding_h = 16;

    $('#report-page').height(calculateReportHeight(viewer_h - viewer_padding_h));
}

function calculateReportHeight(v_h) {
    const header_h = parseFloat($('.panel-header').height());
    const header_border_h = 6;
    const header_margin_bottom_h = 10;

    const panel_heading_h = parseFloat($('.panel-heading').height());
    const panel_heading_border_h = 6;
    const panel_heading_padding_h = 8;

    const toolbar_h = parseFloat($('#report-toolbar').height());
    const toolbar_padding_h = 6;

    return v_h - header_h - header_border_h - header_margin_bottom_h - panel_heading_h - panel_heading_border_h - panel_heading_padding_h - toolbar_h - toolbar_padding_h;
}
/**********************************************************************************************************************************************/
/* by shkoh 20210421: resizing end                                                                                                            */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210421: toolbar start                                                                                                           */
/**********************************************************************************************************************************************/
function initToolbar() {
    $('#report-toolbar').kendoToolBar({
        resizable: false,
        items: [
            {
                id: 'exportExcel',
                type: 'button',
                text: '엑셀 내보내기',
                icon: 'excel',
                click: exportExcel.bind(this)
            },
            {
                id: 'exportPDF',
                type: 'button',
                text: 'PDF 내보내기',
                icon: 'pdf',
                click: exportPDF.bind(this)
            }
        ]
    });
}

function exportExcel() {
    displayLoading();
    
    const excel_images = createExcelImages();
    const excel_drawings = createExcelDrawings();
    const excel_columns = createExcelColumns();
    const excel_rows = createExcelRows();

    Promise.all([ excel_images, excel_drawings, excel_columns, excel_rows ]).then(function(output) {
        const file_name_info = createFileNameInfo();

        const workbook = new kendo.ooxml.Workbook({
            images: output[0],
            sheets: [{
                drawings: output[1],
                columns: output[2],
                rows: output[3],
                name: file_name_info.sheet_name
            }]
        });

        workbook.toDataURLAsync().then(function(dataURL) {
            kendo.saveAs({
                dataURI: dataURL,
                fileName: file_name_info.file_name + '.xlsx'
            });
        }).then(function() {
            undisplayLoading();
        });
    });
}

function exportPDF() {
    displayLoading();

    createPDFImages().then(function(output) {
        let image_index = 0;
        const file_name_info = createFileNameInfo();

        const pdf = new jsPDF({
            orientation: report_config.is_landscape ? 'l' : 'p',
            unit: 'mm',
            format: 'a4',
            precision: 1,
            compress: false,
            putOnlyUsedFonts: true,
            userUnit: 1.0
        });

        pdf.setLanguage('ko-KR');
        pdf.setFont('MalgunGothic');

        pdf.autoTableSetDefaults({
            theme: 'plain',
            margin: 0,
            styles: {
                font: 'MalgunGothic',
                cellPadding: 0.7
            }
        });

        let finalY = pdf.lastAutoTable.finalY || 12;
        pdf.autoTable({
            startY: finalY,
            margin: 0,
            body: createPDFHeader(),
            columnStyles: {
                0: { cellWidth: 15 },
                1: { cellWidth: 15 },
                2: { cellWidth: 15 },
                3: { cellWidth: 'auto' },
                4: { cellWidth: 15 }
            }
        });

        finalY = pdf.lastAutoTable.finalY;
        pdf.autoTable({
            startY: finalY + 4,
            margin: 0,
            body: createPDFInfo(),
            columnStyles: definePDFColumnStyles()
        });

        finalY = pdf.lastAutoTable.finalY;
        pdf.autoTable({
            startY: finalY + 20,
            margin: 0,
            body: createPDFContents(),
            columnStyles: definePDFColumnStyles(),
            didDrawCell: function(data) {
                const pdf_page_size = pdf.internal.pageSize;
                const pdf_page_height = pdf_page_size.height ? pdf_page_size.height : pdf_page_size.getHeight();

                // by shkoh 20210427: 해당 cell에 image가 존재하는지 여부를 판단하여 등록함
                if(data.cell.raw.hasImage && (data.row.height + data.cell.y) < pdf_page_height && output[image_index]) {
                    pdf.addImage(output[image_index], 'PNG', data.cell.x + 2, data.cell.y + 2, data.cell.width, data.row.height);
                    image_index++;
                }
            },
            didDrawPage: function(data) {
                // by shkoh 20210427: PDF Page Footer
                const pdf_page_size = pdf.internal.pageSize;
                const pdf_page_width = pdf_page_size.width ? pdf_page_size.width : pdf_page_size.getWidth();
                const pdf_page_height = pdf_page_size.height ? pdf_page_size.height : pdf_page_size.getHeight();

                pdf.line(10, pdf_page_height - 14, pdf_page_width - 10, pdf_page_height - 14, 'S');
                pdf.setFontSize(11);
                pdf.text($('.r-font-footer').text(), pdf_page_width / 2 - 15, pdf_page_height - 8);
            }
        });

        pdf.save(file_name_info.file_name + '.pdf', { returnPromise: true }).then(function() {
            undisplayLoading();
        });
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20210421: toolbar end                                                                                                             */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210421: table dropdown list start                                                                                               */
/**********************************************************************************************************************************************/
function initTableDropDownList() {
    g_table_inst = $('#table-picker').kendoDropDownList({
        noDataTemplate: '선택 가능한 통계 데이터 없음',
        dataTextField: 'text',
        dataValueField: 'value',
        dataSource: [
            { text: '시간 통계', value: 'hour' },
            { text: '일 통계', value: 'day' },
            { text: '월 통계', value: 'month' },
        ],
        index: 1,
        change: function(e) {
            if(g_s_date_inst) g_s_date_inst.Reload(this.value());
            if(g_e_date_inst) g_e_date_inst.Reload(this.value());

            g_searching_value.table = this.value();
        }
    }).data('kendoDropDownList');

    g_searching_value.table = g_table_inst.value();
}
/**********************************************************************************************************************************************/
/* by shkoh 20210421: table dropdown list end                                                                                                 */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210421: datetimepicker start                                                                                                    */
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
    const period = g_table_inst.value() === undefined ? 'hour' : g_table_inst.value();
    const init_date = getDefaultDateTime(period, new Date());

    g_s_date_inst = new DatePicker('#start-date', {
        period: period,
        startDate: init_date.startDate
    });
    g_s_date_inst.CreateDatePicker();

    g_e_date_inst = new DatePicker('#end-date', {
        period: period,
        startDate: init_date.endDate
    });
    g_e_date_inst.CreateDatePicker();
}
/**********************************************************************************************************************************************/
/* by shkoh 20210421: datetimepicker end                                                                                                      */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210421: period reset button start                                                                                               */
/**********************************************************************************************************************************************/
function initButton() {
    $('#init-date').kendoButton({
        icon: 'refresh',
        click: function(e) {
            const period = g_table_inst.value() === undefined ? 'hour' : g_table_inst.value();
            const init_date = getDefaultDateTime(period, new Date());

            g_s_date_inst.ResetDate(init_date.startDate);
            g_e_date_inst.ResetDate(init_date.endDate);
        }
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20210421: period reset button end                                                                                                 */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210421: inline function start                                                                                                   */
/**********************************************************************************************************************************************/
function displayLoading() {
    kendo.ui.progress($(document.body), true);
}

function undisplayLoading() {
    setTimeout(function() {
        kendo.ui.progress($(document.body), false);
    });
}

function toBlob(base64, type) {
    const raw_data = base64.substring(base64.indexOf('base64,') + 7);
    const data = atob(raw_data);
    const arr = new Uint8Array(data.length);

    for(let i = 0; i < data.length; i++) arr[i] = data.charCodeAt(i);

    return new Blob([ arr.buffer ], { type: type });
}

function createFileNameInfo() {
    const name = 'UPS전력사용현황';
    const table = $('#report-table').text();
    const s_date = $('#report-period').attr('data-sdate');
    const e_date = $('#report-period').attr('data-edate');

    return {
        name: name,
        table: table,
        s_date: s_date,
        e_date: e_date,
        sheet_name: name + '(' + table + ')',
        file_name: name + '(' + table + ')_' + s_date + '_' + e_date
    }
}
/**********************************************************************************************************************************************/
/* by shkoh 20210421: inline function end                                                                                                     */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210426: inline function - reporting start                                                                                       */
/**********************************************************************************************************************************************/
function convertDateStringToReport(_date, hasDay, hasTime) {
    let date_string = _date.getFullYear() + '년 ' + (_date.getMonth() + 1) + '월';

    if(hasDay) {
        let d_str = '';
        switch(_date.getDay()) {
            case 0: d_str = '일요일'; break;
            case 1: d_str = '월요일'; break;
            case 2: d_str = '화요일'; break;
            case 3: d_str = '수요일'; break;
            case 4: d_str = '목요일'; break;
            case 5: d_str = '금요일'; break;
            case 6: d_str = '토요일'; break;
        }
        date_string = date_string.concat(' ', _date.getDate(), '일 ', d_str);

        if(hasTime) {
            const time = ('0' +_date.getHours()).slice(-2) + '시 ' + ('0' + _date.getMinutes()).slice(-2) + '분';
            date_string = date_string.concat(' ', time);
        }
    }
    return date_string;
}

function updateReportTable() {
    $('#report-table').text(g_table_inst.text());
}

function updateSearchingDate() {
    const hasDay = (g_table_inst.value() === 'month') ? false : true;
    const hasTime = (g_table_inst.value() === '5minute' || g_table_inst.value() === 'hour') ? true : false;

    const s_date = convertDateStringToReport(g_s_date_inst.GetDate(), hasDay, hasTime);
    const e_date = convertDateStringToReport(g_e_date_inst.GetDate(), hasDay, hasTime);
    
    $('#report-period').text(s_date + ' ~ ' + e_date);
    $('#report-period').attr('data-sdate', $('#start-date').val().replace(/\/|:|\s/g, ''));
    $('#report-period').attr('data-edate', $('#end-date').val().replace(/\/|:|\s/g, ''));
}

function updatePrintDate() {
    const p_date = convertDateStringToReport(new Date(), true, true);

    $('#print-date').text(p_date);
}

function updatePrinterName() {
    const p_name = $.session.get('user-name');
    $('#printer-name').text(p_name);
}
/**********************************************************************************************************************************************/
/* by shkoh 20210426: inline function - reporting end                                                                                         */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210426: inline function - ups power chart start                                                                                 */
/**********************************************************************************************************************************************/
function kwDataLoad() {
    return new Promise(function(resolve, reject) {
        $.ajax({
            async: true,
            type: 'GET',
            dataType: 'json',
            url: '/api/reports/wrfis/upspower?id=&table=' + g_searching_value.table + '&start=' + g_searching_value.startDate + '&end=' + g_searching_value.endDate
        }).done(function(data) {
            createPowerChart(data);
            resolve();
        }).fail(function(err) {
            reject(err);
        });
    });
}

function createPowerChart(data) {
    $('.has-image.ups_kw').kendoChart({
        dataSource: {
            data: data,
            schema: {
                data: function(data) {
                    const items = [];
                    data.forEach(function(datum) {
                        const item = {};
                        const set_num = datum.object_name.split('-')[1];
                        const ups_id = datum.object_name.substring(5);
                        const numbering = datum.object_name.split('-')[2];
                        
                        item.name = 'UPS ' + ups_id;
                        item.set = numbering;
                        item.set_name = set_num;
                        item.color = g_series_color[ parseInt(set_num) - 1 ];
                        item.value = datum.val;

                        items.push(item);
                    });                    
                    
                    return items;
                }
            },
            group: { field: 'set' }
        },
        theme: 'metro',
        persistSeriesVisibility: true,
        legend: {
            visible: false
        },
        seriesDefaults: {
            type: 'column',
            gap: 0.6,
            spacing: 0.2,
            labels: {
                visible: true,
                margin: 0,
                font: '9px MalgunGothic',
                template: function(data) {
                    if(data.value) return data.value + 'kW'
                    else return '';
                }
            }
        },
        series: [{
            name: '#: group.items[0].set #',
            categoryField: 'set_name',
            field: 'value',
            colorField: 'color',
            totalField: 'name',
            labels: {
                color: function(data) {
                    return data.dataItem.color;
                }
            },
            tooltip: {
                template: 'UPS #: category #-#: series.name #: #: value #kW'
            }
        }],
        valueAxis: {
            visible: false,
            majorGridLines: { visible: false }
        },
        categoryAxis: [{
            majorTicks: { visible: false },
            majorGridLines: { visible: false },
            labels: {
                format: 'UPS {0}조'
            }
        }],
        tooltip: {
            visible: true,
            shared: false
        },
        chartArea: {
            width: 787,
            height: 320
        }
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20210426: inline function - ups power chart end                                                                                   */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210427: inline function - ups load chart start                                                                                  */
/**********************************************************************************************************************************************/
function loadDataLoad() {
    return new Promise(function(resolve, reject) {
        $.ajax({
            async: true,
            type: 'GET',
            dataType: 'json',
            url: '/api/reports/wrfis/upsload?id=&table=' + g_searching_value.table + '&start=' + g_searching_value.startDate + '&end=' + g_searching_value.endDate
        }).done(function(data) {
            createLoadChart(data);
            resolve();
        }).fail(function(err) {
            reject(err);
        });
    });
}

function createLoadChart(data) {
    $('.has-image.ups_load').kendoChart({
        dataSource: {
            data: data,
            schema: {
                data: function(data) {
                    const items = [];
                    data.forEach(function(datum) {
                        const item = {};
                        const set_num = datum.object_name.split('-')[1];
                        const ups_id = datum.object_name.substring(5);
                        const numbering = datum.object_name.split('-')[2];
                        
                        item.name = 'UPS ' + ups_id;
                        item.set = numbering;
                        item.set_name = set_num;
                        item.color = g_series_color[ parseInt(set_num) - 1 ];
                        item.value = datum.val;

                        items.push(item);
                    });                    
                    
                    return items;
                }
            },
            group: { field: 'set' }
        },
        theme: 'metro',
        persistSeriesVisibility: true,
        legend: {
            visible: false
        },
        seriesDefaults: {
            type: 'column',
            gap: 0.6,
            spacing: 0.2,
            labels: {
                visible: true,
                margin: 0,
                font: '9px MalgunGothic',
                template: function(data) {
                    if(data.value) return data.value + '%'
                    else return '';
                }
            }
        },
        series: [{
            name: '#: group.items[0].set #',
            categoryField: 'set_name',
            field: 'value',
            colorField: 'color',
            totalField: 'name',
            labels: {
                color: function(data) {
                    return data.dataItem.color;
                }
            },
            tooltip: {
                template: 'UPS #: category #-#: series.name #: #: value #%'
            }
        }],
        valueAxis: {
            visible: true,
            majorTicks: { visible: false },
            majorGridLines: {
                visible: true,
                dashType: 'dot'
            },
            min: 0,
            max: 100
        },
        categoryAxis: [{
            majorTicks: { visible: false },
            majorGridLines: { visible: false },
            labels: {
                format: 'UPS {0}조'
            }
        }],
        tooltip: {
            visible: true,
            shared: false
        },
        chartArea: {
            width: 787,
            height: 320
        }
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20210427: inline function - ups load chart end                                                                                    */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210427: inline function - exporting excel start                                                                                 */
/**********************************************************************************************************************************************/
function createExcelImages() {
    return new Promise(function(resolve, reject) {
        const export_array_buffer = [];
    
        for(const ele of $('.ups_kw, .ups_load')) {
            const chart = $(ele).getKendoChart();
            const image_data_url = chart.imageDataURL();
            const blob = toBlob(image_data_url, 'image/png');

            export_array_buffer.push(blob.arrayBuffer());
        }

        Promise.all(export_array_buffer).then(function(output) {
            const image = output.reduce(function(prev, curr, index) {
                prev[(index + 1).toString()] = { type: 'image/png', data: curr };
                return prev;
            }, Object.create({}));

            resolve(image);
        });
    });
}

function createExcelDrawings() {
    return new Promise(function(resolve, reject) {
        const drawings = [];

        const start_row_index = 11;
        let row_cell_index = start_row_index;
        let drawing_cnt = 0;
        
        $('.r-table.r-table-contents').each(function(index, ele) {
            // by shkoh 20210427: UPS 전력사용현황에서는 차트를 연속으로 2개 그림(즉, 보고서의 형태 상, B9에서 그림을 그리고 B11에 그림을 그림)
            drawings.push({
                topLeftCell: 'B' + row_cell_index.toString(),
                offsetX: 5,
                offsetY: 15,
                width: 845,
                height: 320,
                image: (++drawing_cnt).toString()
            });

            const next_row_step = 3;
            row_cell_index = row_cell_index + next_row_step;
        });

        resolve(drawings);
    });
}

function createExcelColumns() {
    return new Promise(function(resolve, reject) {
        const columns = [];
        const column_number = report_config.excel.columnCount;

        for(let idx = 0; idx < column_number; idx++) {
            columns.push({
                index: idx,
                width: (idx === 0 || idx === column_number - 1) ? 10 : report_config.excel.columnWidth
            });
        }

        resolve(columns);
    });
}

function createExcelRows() {
    return new Promise(function(resolve, reject) {
        const column_number = report_config.excel.columnCount;
        const rows = [];

        // by shkoh 20210427: 첫줄공백
        rows.push({ cells: [ { rowSpan: 1, colSpan: column_number, background: '#ffffff' } ] });

        // by shkoh 20210427: 상단 해더 테이블 excel export
        const header_tr = $('.r-table.r-table-header').find('tr');
        g_export_util.CreateExcelBody(header_tr, rows);

        // by shkoh 20210427: 보고서 요약 정보 excel export
        const info_tr = $('.r-table.r-table-info').find('tr');
        g_export_util.CreateExcelBody(info_tr, rows);

        rows.push({ cells: [ { rowSpan: 1, colSpan: column_number, background: '#ffffff' } ] });

        // by shkoh 20210427: UPS 전력 사용현황 보고서 본 내용
        const contents_tr = $('.r-table.r-table-contents').find('tr');
        g_export_util.CreateExcelBody(contents_tr, rows);

        rows.push({ cells: [ { rowSpan: 1, colSpan: column_number, background: '#ffffff' } ] });

        // by shkoh 20210427: 하단 풋터 테이블 excel export
        const footer_tr = $('.r-table.r-table-bottom').find('tr');
        g_export_util.CreateExcelBody(footer_tr, rows);

        // by shkoh 20210427: 마지막줄 공백
        rows.push({ cells: [ { rowSpan: 1, colSpan: column_number, background: '#ffffff' } ] });

        resolve(rows);
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20210427: inline function - exporting excel end                                                                                   */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210427: inline function - exporting pdf start                                                                                   */
/**********************************************************************************************************************************************/
function createPDFImages() {
    return new Promise(function(resolve, reject) {
        const export_array_buffer = [];
    
        for(const ele of $('.ups_kw, .ups_load')) {
            const chart = $(ele).getKendoChart();
            const image_data_url = chart.imageDataURL();

            export_array_buffer.push(image_data_url);
        }

        resolve(export_array_buffer);
    });
}

function createPDFHeader() {
    const rows = [];

    // by shkoh 20210427: 상단 해더 테이블 pdf export
    const header_tr = $('.r-table.r-table-header').find('tr');
    g_export_util.CreatePDFBody(header_tr, rows, report_config.pdf.defaultFontSize);

    return rows;
}

function createPDFInfo() {
    const rows = [];

    // by shkoh 20200915: 온습도 통계 보고서 요약
    const info_tr = $('.r-table.r-table-info').find('tr');
    g_export_util.CreatePDFBody(info_tr, rows, report_config.pdf.defaultFontSize);

    return rows;
}

function createPDFContents() {
    const rows = [];

    const contents_tr = $('.r-table.r-table-contents').find('tr');
    g_export_util.CreatePDFBody(contents_tr, rows, report_config.pdf.defaultFontSize);

    return rows;
}

function definePDFColumnStyles() {
    // by shkoh 20210427: 각 cell의 크기가 landscape일 경우 268, portrait일 경우에 181.799333.. 를 넘지 않도록 하여 cellWidth 값을 계산
    // by shkoh 20210427: 고객 맞춤이 되는 표 형태에 따라서 크기는 변경되며, 최소단위로 쪼갠 후에 각 cell width 값을 지정
    const total_page_width = report_config.is_landscape ? 268 : 181.799333;
    const cell_width = total_page_width / report_config.columns.count;

    const column_styles = new Object();
    for(let idx = 0; idx < report_config.columns.count; idx++) {
        column_styles[idx] = { cellWidth: cell_width };
    }

    return column_styles;
}
/**********************************************************************************************************************************************/
/* by shkoh 20210427: inline function - exporting pdf end                                                                                     */
/**********************************************************************************************************************************************/