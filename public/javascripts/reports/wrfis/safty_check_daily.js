/**
 * by shkoh 20210201: 우리FIS - 위험물 일일 점검표 전용 javascript
 */
let g_date_controller = undefined;
let g_export_util = new ExportUtil();
let g_pdf_default_fontsize = 8;

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
/* by shkoh 20210201: resizing start                                                                                                          */
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
/* by shkoh 20210201: resizing start                                                                                                          */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210201: date time picker start                                                                                                  */
/**********************************************************************************************************************************************/
function initDateTimePicker() {
    g_date_controller = new DatePicker('#searching-date', {
        period: 'day',
        startDate: new Date()
    });
    g_date_controller.CreateDatePicker();
}
/**********************************************************************************************************************************************/
/* by shkoh 20210201: date time picker end                                                                                                    */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210201: toolbar start                                                                                                           */
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
        orientation: 'p',
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
        body: createPDFInfo()
    });

    finalY = pdf.lastAutoTable.finalY;

    pdf.autoTable({
        startY: finalY + 1,
        margin: 0,
        body: createPDFRows(),
        columnStyles: {
            // by shkoh 20200902: 각 cell의 크기가 landscape일 경우 268, portrait일 경우에 181.799333.. 를 넘지 않도록 하여 cellWidth 값을 계산
            // by shkoh 20210201: 고객 맞춤이 되는 표 형태에 따라서 크기는 변경되며, 최소단위로 쪼갠 후에 각 cell width 값을 지정
            0: { cellWidth: 5.99 },
            1: { cellWidth: 5.99 },
            2: { cellWidth: 5.99 },
            3: { cellWidth: 5.99 },
            4: { cellWidth: 5.99 },
            5: { cellWidth: 5.99 },
            5: { cellWidth: 5.99 },
            6: { cellWidth: 5.99 },
            7: { cellWidth: 5.99 },
            8: { cellWidth: 5.99 },
            9: { cellWidth: 5.99 },
            10: { cellWidth: 5.99 },
            11: { cellWidth: 5.99 },
            12: { cellWidth: 5.99 },
            13: { cellWidth: 5.99 },
            14: { cellWidth: 5.99 },
            15: { cellWidth: 5.99 },
            16: { cellWidth: 5.99 },
            17: { cellWidth: 5.99 },
            18: { cellWidth: 5.99 },
            19: { cellWidth: 5.99 },
            20: { cellWidth: 5.99 },
            21: { cellWidth: 5.99 },
            22: { cellWidth: 5.99 },
            23: { cellWidth: 5.99 },
            24: { cellWidth: 5.99 },
            25: { cellWidth: 5.99 },
            26: { cellWidth: 5.99 },
            27: { cellWidth: 5.99 },
            28: { cellWidth: 5.99 },
            29: { cellWidth: 5.99 }
        },
        didDrawPage: function(data) {
            // by shkoh 20210201: PDF Page Footer
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
/* by shkoh 20210201: toolbar end                                                                                                             */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210201: inline function start                                                                                                   */
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
    const name = '위험물일일점검표';

    return {
        name: name,
        date: date,
        file_name: date + '_' + name
    }
}

function createExcelColumns() {
    const columns = [];

    // by shkoh 20210201: Excel에서 컬럼의 수는 전체 colgroup의 숫자에 좌우 양옆의 크기(여백)를 column의 수로 포함
    for(let idx = 0; idx < 32; idx++) {
        columns.push({
            index: idx,
            width: (idx === 0 || idx === 31) ? 10 : 25
        });
    }

    return columns;
}

function createExcelRows() {
    const rows = [];
    
    // by shkoh 20200901: 첫줄 공백
    rows.push({ cells: [ { rowSpan: 1, colSpan: 32, background: '#ffffff' } ] });

    // by shkoh 20200901: 상단 해더 테이블 excel export
    const header_tr = $('.r-table.r-table-header').find('tr');
    g_export_util.CreateExcelBody(header_tr, rows);

    // by shkoh 20200901: 일지 작성일 / 작성자 란
    const info_tr = $('.r-table.r-table-info').find('tr');
    g_export_util.CreateExcelBody(info_tr, rows);

    // by shkoh 20200901: DATA 운영관리일지
    const contents_tr = $('.r-table.r-table-contents').find('tr');
    g_export_util.CreateExcelBody(contents_tr, rows);

    // by shkoh 20200901: 하단 풋터 테이블 excel export
    const footer_tr = $('.r-table.r-table-bottom').find('tr');
    g_export_util.CreateExcelBody(footer_tr, rows);

    // by shkoh 20200902: 마지막 줄 공백
    rows.push({ cells: [ { rowSpan: 1, colSpan: 32, background: '#ffffff' } ] });

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

function createPDFRows() {
    const rows = [];

    // by shkoh 20200902: DATA 운영관리일지
    const contents_tr = $('.r-table.r-table-contents').find('tr');
    g_export_util.CreatePDFBody(contents_tr, rows, g_pdf_default_fontsize);

    return rows;
}
/**********************************************************************************************************************************************/
/* by shkoh 20210201: inline function end                                                                                                     */
/**********************************************************************************************************************************************/