/**
 * by shkoh 20210419: 우리FIS 전용 자산 변경 내역 보고서 javascript
 * 
 * key id: asset_change
 */
let g_s_date_inst = undefined;
let g_e_date_inst = undefined;
 
let g_searching_value = {
    startDate: undefined,
    endDate: undefined
}
 
let g_export_util = new ExportUtil();
 
/**
 * by shkoh 20210419: 보고서 정의
 */
const report_config = {
    // by shkoh 20210419: 보고서 형태가 가로방향(landscape)인지 세로방향(portrait)인지 여부
    is_landscape: true,
     
    // by shkoh 20210419: 보고서 디자인 시 작성한 colgroup의 수
    columns: {
        count: $('col').length,
    },
    pdf: {
        // by shkoh 20210208: PDF Export 시, 기본 font의 크기
        defaultFontSize: 7
    },
    excel: {
        columnWidth: 30,
        // by shkoh 20210208: Excel Export 시, 엑셀 시트의 셀 Column의 전체 수
        // by shkoh 20210208: 보고서 전체 사용 column 수에서 좌우 여백를 고려하여, (보고서에서 사용한 <colgroup> 수) + 2
        columnCount: $('col').length + 2
    }
}

$(window).on('resize', function() {
    resizeWindow();
});

$(function() {
    initToolbar();
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

    $('#search-button').on('click', function() {
        const start_date = g_s_date_inst.GetDate();
        const end_date = g_e_date_inst.GetDate();
        if(start_date - end_date > 0) {
            alert('조회 시작시간이 종료시간보다 우선일 순 없습니다');
            return;
        }

        setTimeout(function() {
            displayLoading();

            $('#asset-contents-body').empty();

            g_searching_value.startDate = $('#start-date').val();
            g_searching_value.endDate = $('#end-date').val();

            // by shkoh 20210419: 조회시간을 보고서 내용에 업데이트
            updateSearchingDate();
            // by shkoh 20210419: 출력일자를 보고서에 업데이트
            updatePrintDate();
            // by shkoh 20210419: 출력자를 보고서에 업데이트
            updatePrinterName();

            const asset_change_list = assetChangeDataLoad();
            Promise.all([ asset_change_list ]).then(function(data) {
                // by shkoh 20210419: 조회한 자산 변경 내역의 전체 건 수를 입력
                updateReportAsset(data[0]);
                updateAssetChangeData(data[0]);
            }).catch(function(err) {
                console.error(err);
            }).finally(function() {
                undisplayLoading();
            });
        });
    });
});

/**********************************************************************************************************************************************/
/* by shkoh 20210419: resizing start                                                                                                          */
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
/* by shkoh 20210419: resizing end                                                                                                            */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210419: toolbar start                                                                                                           */
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

    const file_name_info = createFileNameInfo();

    const workbook = new kendo.ooxml.Workbook({
        sheets: [{
            columns: createExcelColumns(),
            rows: createExcelRows(),
            name: file_name_info.name
        }]
    });

    workbook.toDataURLAsync().then(function(dataURL) {
        kendo.saveAs({
            dataURI: dataURL,
            fileName: file_name_info.file_name + '.xlsx'
        })
    }).then(function() {
        undisplayLoading();
    });
}

function exportPDF() {
    displayLoading();

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
        startY: finalY + 2,
        margin: 0,
        head: createPDFContentsHead(),
        body: createPDFRows(),
        columnStyles: definePDFColumnStyles(),
        didDrawCell: function(data) {
            if(data.cell.raw.isLast) {
                const pdf_page_size = pdf.internal.pageSize;
                const pdf_page_height = pdf_page_size.height ? pdf_page_size.height : pdf_page_size.getHeight();
                if(pdf_page_height - data.cell.y < 28) {
                    data.cursor.y = data.cursor.y + 28;
                }
            }
        },
        didDrawPage: function(data) {
            // by shkoh 20210419: PDF Page Footer
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
}
/**********************************************************************************************************************************************/
/* by shkoh 20210419: toolbar end                                                                                                             */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210419: datetimepicker start                                                                                                    */
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
            // by shkoh 20210419: 다른 보고서와는 다르게 자산정보는 1년 단위 기준을 기본으로 설정하도록 수정함
            _start = new Date(date.setMonth(month - 12));
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
        // by shkoh 20210525: 우리FIS 요청으로 기본 날짜는 항상 2009년 1월 1일부터로 지정함
        startDate: new Date('2009-01-01'),
        endDate: _end
    }
}

function initDateTimePicker() {
    const period = 'day';
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
/* by shkoh 20210419: datetimepicker end                                                                                                      */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210419: period reset button start                                                                                               */
/**********************************************************************************************************************************************/
function initButton() {
    $('#init-date').kendoButton({
        icon: 'refresh',
        click: function(e) {
            const period = 'day';
            const init_date = getDefaultDateTime(period, new Date());

            g_s_date_inst.ResetDate(init_date.startDate);
            g_e_date_inst.ResetDate(init_date.endDate);
        }
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20210419: period reset button end                                                                                                 */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210419: inline function start                                                                                                   */
/**********************************************************************************************************************************************/
function displayLoading() {
    kendo.ui.progress($(document.body), true);
}

function undisplayLoading() {
    setTimeout(function() {
        kendo.ui.progress($(document.body), false);
    });
}

function convertDateStringToReport(_date, hasDay, hasTime) {
    let date_string = kendo.toString(_date, 'yyyy년 M월');

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
        date_string = date_string.concat(' ', _date.getDate(), '일 ' + d_str);

        if(hasTime) {
            const time = kendo.toString(_date, 'HH시 mm분');
            date_string = date_string.concat(' ', time);
        }
    }

    return date_string;
}

function updateSearchingDate() {
    const s_date = convertDateStringToReport(g_s_date_inst.GetDate(), true, false);
    const e_date = convertDateStringToReport(g_e_date_inst.GetDate(), true, false);

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

function assetChangeDataLoad() {
    return new Promise(function(resolve, reject) {
        $.ajax({
            async: true,
            type: 'GET',
            dataType: 'json',
            url: '/api/reports/wrfis/assetchange?start=' + g_searching_value.startDate + '&end=' + g_searching_value.endDate
        }).done(function(data) {
            resolve(data);
        }).fail(function(err) {
            reject(err);
        });
    });
}

function updateReportAsset(count) {
    $('#report-asset-count').text(count.length + '건');
}

function updateAssetChangeData(data) {
    const asset_change_template = kendo.template($('#asset-chagne-template').html());
    
    data.forEach(function(datum, idx, arr) {
        const is_last = (idx + 1) === arr.length;
        
        const html = asset_change_template({
            index: idx + 1,
            object_code_name: datum.object_code_name,
            object_name: datum.object_name,
            event_code_name: datum.event_code_name,
            update_date: datum.update_date,
            item_name: datum.item_name,
            item_before_data: datum.item_before_data,
            item_after_data: datum.item_after_data,
            is_last_row: is_last
        });

        $('#asset-contents-body').append(html);
    });
}

function createFileNameInfo() {
    const name = '자산변경내역보고서';
    const s_date = $('#report-period').attr('data-sdate');
    const e_date = $('#report-period').attr('data-edate');

    return {
        name: name,
        s_date: s_date,
        e_date: e_date,
        file_name: name + '_' + s_date + '_' + e_date
    }
}

function createExcelColumns() {
    const columns = [];
    const column_number = report_config.excel.columnCount;

    for(let idx = 0; idx < column_number; idx++) {
        columns.push({
            index: idx,
            width: (idx === 0 || idx === column_number - 1) ? 10 : report_config.excel.columnWidth
        });
    }

    return columns;
}

function createExcelRows() {
    const column_number = report_config.excel.columnCount;
    const rows = [];

    // by shkoh 20210419: 첫줄 공백
    rows.push({ cells: [ { rowSpan: 1, colSpan: column_number, background: '#ffffff' } ] });

    // by shkoh 20210419: 상단 헤더 테이블 excel export
    const header_tr = $('.r-table.r-table-header').find('tr');
    g_export_util.CreateExcelBody(header_tr, rows);

    // by shkoh 20210419: 보고서 요약 정보 excel export
    const info_tr = $('.r-table.r-table-info').find('tr');
    g_export_util.CreateExcelBody(info_tr, rows);

    // by shkoh 20210419: 보고서 요약과 본 내용 사이에 공백 추가
    rows.push({ cells: [ { rowSpan: 1, colSpan: column_number, background: '#ffffff' } ] });

    // by shkoh 20210419: 자산정보 보고서 본 내용
    const contents_tr = $('.r-table.r-table-contents').find('tr');
    g_export_util.CreateExcelBody(contents_tr, rows);

    // by shkoh 20210419: 하단 풋터 테이블 excel export
    const footer_tr = $('.r-table.r-table-bottom').find('tr');
    g_export_util.CreateExcelBody(footer_tr, rows);

    // by shkoh 20210419: 마지막줄 공백
    rows.push({ cells: [ { rowSpan: 1, colSpan: column_number, background: '#ffffff' } ] });

    return rows;
}

function createPDFHeader() {
    const rows = [];

    // by shkoh 20210419: 상단 해더 테이블 pdf export
    const header_tr = $('.r-table.r-table-header').find('tr');
    g_export_util.CreatePDFBody(header_tr, rows, report_config.pdf.defaultFontSize);

    return rows;
}

function createPDFInfo() {
    const rows = [];

    // by shkoh 20210419: 일지 작성일 / 추가내역
    const info_tr = $('.r-table.r-table-info').find('tr');
    g_export_util.CreatePDFBody(info_tr, rows, report_config.pdf.defaultFontSize);

    return rows;
}

function createPDFContentsHead() {
    const rows = [];

    // by shkoh 20210419: 자산정보 보고서 본 내용
    const contents_tr = $('.r-table.r-table-contents > thead').find('tr');
    g_export_util.CreatePDFBody(contents_tr, rows, report_config.pdf.defaultFontSize);

    return rows;
}

function createPDFRows() {
    const rows = [];

    // by shkoh 20210419: 자산정보 보고서 본 내용
    const contents_tr = $('#asset-contents-body').find('tr');
    g_export_util.CreatePDFBody(contents_tr, rows, report_config.pdf.defaultFontSize);

    return rows;
}

function definePDFColumnStyles() {
    // by shkoh 20210419: 각 cell의 크기가 landscape일 경우 268, portrait일 경우에 181.799333.. 를 넘지 않도록 하여 cellWidth 값을 계산
    // by shkoh 20210419: 고객 맞춤이 되는 표 형태에 따라서 크기는 변경되며, 최소단위로 쪼갠 후에 각 cell width 값을 지정
    const total_page_width = report_config.is_landscape ? 268 : 181.799333;
    const cell_width = total_page_width / report_config.columns.count;

    const column_styles = new Object();
    for(let idx = 0; idx < report_config.columns.count; idx++) {
        column_styles[idx] = { cellWidth: cell_width };
    }

    return column_styles;
}
/**********************************************************************************************************************************************/
/* by shkoh 20210419: inline function end                                                                                                     */
/**********************************************************************************************************************************************/