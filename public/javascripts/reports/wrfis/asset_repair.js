/**
 * by shkoh 20210419: 우리FIS 전용 자산 수리 내역 보고서 javascript
 * 
 * key id: asset_repair
 */
let g_asset_tree = undefined;

let g_s_date_inst = undefined;
let g_e_date_inst = undefined;

let g_searching_value = {
    ids: [],
    startDate: undefined,
    endDate: undefined
}

// by shkoh 20210420: 전체 자산 수리 건수를 기록할 데이터
let g_repair_count = 0;

let g_export_util = new ExportUtil();

/**
 * by shkoh 20210419: 보고서 정의
 */
const report_config = {
    // by shkoh 20210419: 보고서 형태가 가로방향(landscape)인지 세로방향(portrait)인지 여부
    is_landscape: false,
    
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
    initAssetTree();
    initToolbar();
    initDateTimePicker();
    initButton();

    $('.tree-content, #report-page').mCustomScrollbar({
        theme: 'minimal-dark',
        axis: 'y',
        scrollbarPosition: 'outside',
        mouseWheel: {
            preventDefault: true
        }
    });

    resizeWindow();

    $('#search-button').click(function() {
        if(g_searching_value.ids.length === 0) {
            alert('조회항목을 선택하세요');
            return;
        }

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

            // by shkoh 20210420: 조회한 자산의 전체 수를 업데이트
            updateReportAsset();

            // by shkoh 20210420: 자산 수리 내역의 조회 기간 업데이트
            updateSearchingDate();

            // by shkoh 20210420: 자산 수리 내역 보고서 출력일자 업데이트
            updatePrintDate();

            // by shkoh 20210420: 자산 수리 내역 보고서 출력자 업데이트
            updatePrinterName();

            // by shkoh 20210420: 자산 수리 건 수 초기화
            g_repair_count = 0;
            
            // by shkoh 20200904: 선택된 복수의 설비를 Tree에서 지정한대로 순차적으로 실행하기 위해서는 reduce를 사용하여 순차처리함
            g_searching_value.ids.reduce(function(prev, id) {
                return prev.then(function() {
                    // by shkoh 20200904: thDataLoad()가 실행되고 이 함수 내에 결과가 성공(즉, Promise.Resolve())이 될 때 다음으로 진행함
                    return assetRepairDataLoad(id);
                }).catch(function(err) {
                    console.log(err);
                });
            }, Promise.resolve()).then(function() {
                updateRepairCount();
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

    $('.tree-content').height(calculateTreeHeight(viewer_h - viewer_padding_h));
    $('#report-page').height(calculateReportHeight(viewer_h - viewer_padding_h));
}

function calculateTreeHeight(v_h) {
    const panel_heading_h = parseFloat($('.panel-heading').height());
    const panel_heading_padding_h = 6;
    const panel_heading_border_h = 7;   // by shkoh 20200903: border의 크기가 6이 아니고 왜 7인지 살펴볼 여력은 없음

    return v_h - panel_heading_h - panel_heading_border_h - panel_heading_padding_h;
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
/* by shkoh 20210419: asset tree start                                                                                                        */
/**********************************************************************************************************************************************/
function initAssetTree() {
    g_asset_tree = new AssetTree('#asset-tree', {
        enableCheck: true,
        onCheck: onTreeNodeCheck
    });
    g_asset_tree.CreateTree();
}

function onTreeNodeCheck(event, treeId, treeNode) {
    g_searching_value.ids = [];

    const checked_tree_nodes = g_asset_tree.GetCheckedNodes();
    checked_tree_nodes.forEach(function(node) {
        if(node.data.object_code_id !== 'I2000') {
            g_searching_value.ids.push(Number(node.id));
        }
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20210419: asset tree end                                                                                                          */
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
                const pdf_page_height = pdf_page_size.height ? pdf_page_size.height : paf_page_size.getHeight();
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

function assetRepairDataLoad(id) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            async: true,
            type: 'GET',
            dataType: 'json',
            url: '/api/reports/wrfis/assetrepair?id=' + id + '&start=' + g_searching_value.startDate + '&end=' + g_searching_value.endDate
        }).done(function(data) {
            if(data.length > 0) {
                g_repair_count += data.length;
                appendAssetRepairTemplate(id, data);
            }
            resolve(id);
        }).fail(function(err) {
            reject(err);
        });
    });
}

function appendAssetRepairTemplate(id, data) {
    const asset_repair_template = kendo.template($('#asset-change-template').html());

    // by shkoh 20210420: 각 자산의 summery 정보부터 입력
    const summery_html = asset_repair_template({
        header_row: true,
        is_last_row: false,
        repair_count: data.length,
        object_name: data[0].object_name,
        acquisition_date: data[0].acquisition_date === null ? '미설정' : data[0].acquisition_date
    });
    $('#asset-contents-body').append(summery_html);

    data.forEach(function(datum, idx, arr) {
        const is_last = (idx + 1) === arr.length;
        const row_html = asset_repair_template({
            header_row: false,
            index: idx + 1,
            object_name: datum.object_name,
            complete_date: datum.complete_date,
            complete_worker_name: datum.complete_worker_name,
            complete_content: datum.complete_content,
            is_last_row: is_last
        });

        $('#asset-contents-body').append(row_html);
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

function updateReportAsset() {
    $('#report-asset-count').text(g_searching_value.ids.length + ' 개');
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

function updateRepairCount() {
    $('#report-asset-repair-count').text(g_repair_count + ' 건');
}

function createFileNameInfo() {
    const name = '자산수리내역보고서';
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