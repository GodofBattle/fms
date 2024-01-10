/**
 * by shkoh 20200819: 우리FIS - DATA 운영관리일지 전용 javascript
 */
let g_date_controller = undefined;
let g_export_util = new ExportUtil();
let g_pdf_default_fontsize = 7;

$(window).resize(function() {
    resizeWindow();
});

$(document).ready(function() {
    initDateTimePicker();
    initToolbar();

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
        setTimeout(function() {
            displayLoading();

            updateDate();

            undisplayLoading();
        });
    });
});

/**********************************************************************************************************************************************/
/* by shkoh 20200819: resizing start                                                                                                          */
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
/* by shkoh 20200819: resizing start                                                                                                          */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200819: date time picker start                                                                                                  */
/**********************************************************************************************************************************************/
function initDateTimePicker() {
    g_date_controller = new DatePicker('#searching-date', {
        period: 'day',
        startDate: new Date()
    });
    g_date_controller.CreateDatePicker();
}
/**********************************************************************************************************************************************/
/* by shkoh 20200819: date time picker end                                                                                                    */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200819: toolbar start                                                                                                           */
/**********************************************************************************************************************************************/
function initToolbar() {
    $('#report-toolbar').kendoToolBar({
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
            name: file_name_info.name,
            frozenRows: 5
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
        orientation: 'l',
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
        startY: finalY + 6,
        margin: 0,
        body: createPDFInfo()
    });

    finalY = pdf.lastAutoTable.finalY;

    pdf.autoTable({
        startY: finalY + 1,
        margin: 0,
        head: createPDFRowsHead(),
        body: createPDFRowsBody(),
        columnStyles: {
            // by shkoh 20200902: 각 cell의 크기를 지정. A4 사이즈를 기준으로 table의 width는 landscape일 경우 268, portrait일 경우에 181.799333..로 전체 table의 크기를 넘지 않도록 하여 cellWidth 값을 계산
            0: { cellWidth: 7.4 },
            1: { cellWidth: 7.4 },
            2: { cellWidth: 7.4 },
            3: { cellWidth: 7.6 },
            4: { cellWidth: 7.6 },
            5: { cellWidth: 7.6 },
            6: { cellWidth: 7.6 },
            7: { cellWidth: 7.6 },
            8: { cellWidth: 7.6 },
            9: { cellWidth: 7.6 },
            10: { cellWidth: 7.6 },
            11: { cellWidth: 7.6 },
            12: { cellWidth: 7.4 },
            13: { cellWidth: 7.4 },
            14: { cellWidth: 7.4 },
            15: { cellWidth: 7.4 },
            16: { cellWidth: 7.4 },
            17: { cellWidth: 7.4 },
            18: { cellWidth: 7.4 },
            19: { cellWidth: 7.4 },
            20: { cellWidth: 7.4 },
            21: { cellWidth: 7.4 },
            22: { cellWidth: 7.4 },
            23: { cellWidth: 7.4 },
            24: { cellWidth: 7.4 },
            25: { cellWidth: 7.4 },
            26: { cellWidth: 7.4 },
            27: { cellWidth: 7.4 },
            28: { cellWidth: 7.4 },
            29: { cellWidth: 7.4 },
            30: { cellWidth: 7.4 },
            31: { cellWidth: 7.4 },
            32: { cellWidth: 7.4 },
            33: { cellWidth: 7.4 },
            34: { cellWidth: 7.4 },
            35: { cellWidth: 7.4 }
        },
        didDrawPage: function(data) {
            // by shkoh 20200902: PDF Page Footer
            const pdf_page_size = pdf.internal.pageSize;
            const pdf_page_width = pdf_page_size.width ? pdf_page_size.width : pdf_page_size.getWidth();
            const pdf_page_height = pdf_page_size.height ? pdf_page_size.height : pdf_page_size.getHeight();

            pdf.setFontSize(11);
            pdf.text($('.r-font-footer').text(), pdf_page_width / 2 - 15, pdf_page_height - 8);
        }
    });

    pdf.save(file_name_info.file_name + '.pdf', { returnPromise: true }).then(function() {
        undisplayLoading();
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20200819: toolbar end                                                                                                             */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200821: inline function start                                                                                                   */
/**********************************************************************************************************************************************/
function displayLoading() {
    kendo.ui.progress($(document.body), true);
}

function undisplayLoading() {
    setTimeout(function() {
        kendo.ui.progress($(document.body), false);
    });
}

function updateDate() {
    const yyyy = g_date_controller.GetDate().getFullYear();
    const month = g_date_controller.GetDate().getMonth() + 1;
    const day = g_date_controller.GetDate().getDate();
    let day_string = '';
    switch(g_date_controller.GetDate().getDay()) {
        case 0: day_string = ' 일요일'; break;
        case 1: day_string = ' 월요일'; break;
        case 2: day_string = ' 화요일'; break;
        case 3: day_string = ' 수요일'; break;
        case 4: day_string = ' 목요일'; break;
        case 5: day_string = ' 금요일'; break;
        case 6: day_string = ' 토요일'; break;
    }

    $('#report-date').text(yyyy + '년 ' + month + '월 ' + day + '일' + day_string);
}

function createFileNameInfo() {
    const date = $('#searching-date').val().replace(/\//g, '');
    const name = '설비일일점검일지';

    return {
        name: name,
        date: date,
        file_name: date + '_' + name
    }
}

function createExcelColumns() {
    const columns = [];

    for(let idx = 0; idx < 38; idx++) {
        columns.push({
            index: idx,
            width: (idx === 0 || idx === 37) ? 10 : 30
        });
    }

    return columns;
}

function createExcelRows() {
    const rows = [];
    
    // by shkoh 20200901: 첫줄 공백
    rows.push({ cells: [ { rowSpan: 1, colSpan: 38, background: '#ffffff' } ] });

    // by shkoh 20200901: 상단 해더 테이블 excel export
    const header_tr = $('.r-table.r-table-header').find('tr');
    g_export_util.CreateExcelBody(header_tr, rows);

    // by shkoh 20200901: 일지 작성일 / 작성자 란
    const info_tr = $('.r-table.r-table-info').find('tr');
    g_export_util.CreateExcelBody(info_tr, rows);

    // by shkoh 20200902: 설비 일일 점검일지
    const contents_tr = $('.r-table.r-table-contents').find('tr');
    g_export_util.CreateExcelBody(contents_tr, rows);

    // by shkoh 20200901: 하단 풋터 테이블 excel export
    const footer_tr = $('.r-table.r-table-bottom').find('tr');
    g_export_util.CreateExcelBody(footer_tr, rows);

    // by shkoh 20200902: 마지막 줄 공백
    rows.push({ cells: [ { rowSpan: 1, colSpan: 38, background: '#ffffff' } ] });

    return rows;
}

function createPDFHeader() {
    const rows = [];

    // by shkoh 20200824: 상단 해더 테이블 pdf export
    const header_tr = $('.r-table.r-table-header').find('tr');
    g_export_util.CreatePDFBody(header_tr, rows, g_pdf_default_fontsize);

    return rows;
}

function createPDFInfo() {
    const rows = [];

    // by shkoh 20200902: 일지 작성일 / 추가내역
    const info_tr = $('.r-table.r-table-info').find('tr');
    g_export_util.CreatePDFBody(info_tr, rows, g_pdf_default_fontsize);

    return rows;
}

function createPDFRowsHead() {
    const rows = [];

    // by shkoh 20200902: DATA 운영관리일지
    const contents_tr = $('.r-table.r-table-contents > thead').find('tr');
    g_export_util.CreatePDFBody(contents_tr, rows, g_pdf_default_fontsize);

    return rows;
}

function createPDFRowsBody() {
    const rows = [];

    // by shkoh 20200902: DATA 운영관리일지
    const contents_tr = $('.r-table.r-table-contents > tbody').find('tr');
    g_export_util.CreatePDFBody(contents_tr, rows, g_pdf_default_fontsize);

    return rows;
}
/**********************************************************************************************************************************************/
/* by shkoh 20200821: inline function end                                                                                                     */
/**********************************************************************************************************************************************/