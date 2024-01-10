/**
 * by shkoh 20210421: 우리FIS 전용 PMS 사용현황 보고서 javascript
 * 
 * key id: pms
 */
let g_pms_tree_inst = undefined;

let g_searching_value = {
    ids: [],
    fourth: 0,
    seventh: 0
};

let g_export_util = new ExportUtil();

/**
 * by shkoh 20210422: 보고서 정의
 */
 const report_config = {
    // by shkoh 20210422: 보고서 형태가 가로방향(landscape)인지 세로방향(portrait)인지 여부
    is_landscape: false,
    
    // by shkoh 20210422: 보고서 디자인 시 작성한 colgroup의 수
    columns: {
        count: 24,
    },
    pdf: {
        // by shkoh 20210208: PDF Export 시, 기본 font의 크기
        defaultFontSize: 6
    },
    excel: {
        columnWidth: 30,
        // by shkoh 20210208: Excel Export 시, 엑셀 시트의 셀 Column의 전체 수
        // by shkoh 20210208: 보고서 전체 사용 column 수에서 좌우 여백를 고려하여, (보고서에서 사용한 <colgroup> 수) + 2
        columnCount: 24 + 2
    }
}

$(window).on('resize', function() {
    resizeWindow();
});

$(function() {
    initTreeViewOfPMS();
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

    $('#search-button').on('click', function() {
        if(g_searching_value.ids.length === 0) {
            alert('조회항목을 선택하세요');
            return;
        }

        setTimeout(function() {
            displayLoading();

            $('#contents-tables').empty();

            // by shkoh 20210422: 조회 대상 업데이트
            updateReportEquipment();
            // by shkoh 20210422: 출력일자 업데이트
            updatePrintDate();
            // by shkoh 20210422: 출력자 업데이트
            updatePrinterName();

            g_searching_value.ids.reduce(function(prev, id) {
                return prev.then(function() {
                    return pmsDataLoad(id);
                }).catch(function(err) {
                    console.error(err);
                });
            }, Promise.resolve()).then(function() {
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

    $('.tree-content').height(calculateTreeHeight(viewer_h - viewer_padding_h));
    $('#report-page').height(calculateReportHeight(viewer_h - viewer_padding_h));
}

function calculateTreeHeight(v_h) {
    const panel_heading_h = parseFloat($('.panel-heading').height());
    const panel_heading_padding_h = 6;
    const panel_heading_border_h = 7;   // by shkoh 20210421: border의 크기가 6이 아니고 왜 7인지 살펴볼 여력은 없음

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
/* by shkoh 20210421: resizing end                                                                                                            */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210421: tree view start                                                                                                         */
/**********************************************************************************************************************************************/
function initTreeViewOfPMS() {
    g_pms_tree_inst = new TreeViewContent('#pms-tree', {
        code: [ 'E0005' ],
        pdEquipId: [ 123 ],
        onCheck: onTreeViewCheck
    });

    g_pms_tree_inst.CreateTreeView();
}

function onTreeViewCheck(event, treeId, treeNode) {
    g_searching_value.ids = [];
    g_searching_value.fourth = 0;
    g_searching_value.seventh = 0;

    const checked_tree_nodes = g_pms_tree_inst.GetCheckedNodes();
    checked_tree_nodes.forEach(function(node) {
        const type = node.id.substr(0, 1);
        const id = node.id.substr(2);

        if(type === 'E') {
            g_searching_value.ids.push(Number(id));

            const p_node = node.getParentNode();
            if(p_node.name.includes('4F')) g_searching_value.fourth += 1;
            if(p_node.name.includes('7F')) g_searching_value.seventh += 1;
        }
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20210421: tree view end                                                                                                           */
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

    g_searching_value.ids.reduce(function(prev, id) {
        return prev.then(function() {
            const finalY = pdf.lastAutoTable.finalY;
            if(finalY === 12) pdf.addPage();
            return drawContentsForPDF(pdf, finalY, id);
        }).catch(function(err) {
            console.error(err);
        });
    }, Promise.resolve()).then(function() {
        pdf.save(file_name_info.file_name + '.pdf', { returnPromise: true }).then(function() {
            undisplayLoading();
        });
    });

    // pdf.autoTable({
    //     startY: finalY + 2,
    //     margin: 0,
    //     head: createPDFContentsHead(),
    //     body: createPDFRows(),
    //     columnStyles: definePDFColumnStyles(),
    //     didDrawCell: function(data) {
    //         if(data.cell.raw.isLast) {
    //             const pdf_page_size = pdf.internal.pageSize;
    //             const pdf_page_height = pdf_page_size.height ? pdf_page_size.height : paf_page_size.getHeight();
    //             if(pdf_page_height - data.cell.y < 28) {
    //                 data.cursor.y = data.cursor.y + 28;
    //             }
    //         }
    //     },
    //     didDrawPage: function(data) {
    //         // by shkoh 20210419: PDF Page Footer
    //         const pdf_page_size = pdf.internal.pageSize;
    //         const pdf_page_width = pdf_page_size.width ? pdf_page_size.width : pdf_page_size.getWidth();
    //         const pdf_page_height = pdf_page_size.height ? pdf_page_size.height : pdf_page_size.getHeight();

    //         pdf.line(10, pdf_page_height - 14, pdf_page_width - 10, pdf_page_height - 14, 'S');
    //         pdf.setFontSize(11);
    //         pdf.text($('.r-font-footer').text(), pdf_page_width / 2 - 15, pdf_page_height - 8);
    //     }
    // });

    // pdf.save(file_name_info.file_name + '.pdf', { returnPromise: true }).then(function() {
    //     undisplayLoading();
    // });
}
/**********************************************************************************************************************************************/
/* by shkoh 20210421: toolbar end                                                                                                             */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210422: inline function start                                                                                                   */
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

function updateReportEquipment() {
    $('#report-equip').text('◼ 4F K-뱅크: ' + g_searching_value.fourth +'대\n◼ 7F 차세대: ' + g_searching_value.seventh + '대');
}

function updatePrintDate() {
    const p_date = convertDateStringToReport(new Date(), true, true);
    $('#print-date').text(p_date);
}

function updatePrinterName() {
    const p_name = $.session.get('user-name');
    $('#printer-name').text(p_name);
}

function pmsDataLoad(id) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            async: true,
            type: 'GET',
            dataType: 'json',
            url: '/api/reports/wrfis/pms?id=' + id
        }).done(function(data) {
            appendPmsTemplate(id, data);
            resolve(id);
        }).fail(function(err) {
            reject(err);
        });
    });
}

function appendPmsTemplate(id, data) {
    const pms_template = kendo.template($('#pms-template').html());

    const sum = calculateData(data);

    const pms_html = pms_template({
        equip_id: id,
        no_data: false,
        group_name: data[0].group_name,
        equip_name: data[0].equip_name,
        breaker_data: data,
        sum_current: kendo.toString(sum.current, 'n1'),
        sum_power: kendo.toString(sum.power, 'n0'),
        sum_power_amount: kendo.toString(sum.power_amount, 'n2')
    });

    $('#contents-tables').append(pms_html);
}

function calculateData(data) {
    const _sum = {
        current: 0,
        power: 0,
        power_amount: 0
    }

    data.forEach(function(datum) {
        _sum.current += datum.current_value;
        _sum.power += datum.power;
        _sum.power_amount += datum.power_amount;
    });

    return _sum;
}

function createFileNameInfo() {
    const name = 'PMS_사용현황_보고서';

    return {
        name: name,
        file_name: name
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

function createPDFContentsHeadType1(id) {
    const rows = [];

    // by shkoh 20210419: 자산정보 보고서 본 내용
    const contents_tr = $('.r-table.r-table-contents[equipId=' + id + '] > thead.type1').find('tr');
    g_export_util.CreatePDFBody(contents_tr, rows, report_config.pdf.defaultFontSize);

    return rows;
}

function createPDFContentsHeadType2(id) {
    const rows = [];

    // by shkoh 20210419: 자산정보 보고서 본 내용
    const contents_tr = $('.r-table.r-table-contents[equipId=' + id + '] > thead.type2').find('tr');
    g_export_util.CreatePDFBody(contents_tr, rows, report_config.pdf.defaultFontSize);

    return rows;
}

function createPDFRows(id) {
    const rows = [];

    // by shkoh 20210419: 자산정보 보고서 본 내용
    const contents_tr = $('.r-table.r-table-contents[equipId=' + id + '] > tbody, .r-table.r-table-contents[equipId=' + id + '] > tfoot').find('tr');
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

function drawContentsForPDF(pdf, finalY, id) {
    return new Promise(function(resolve, reject) {
        pdf.autoTable({
            startY: finalY,
            margin: 0,
            head: createPDFContentsHeadType1(id),
            columnStyles: definePDFColumnStyles()
        });

        let new_finalY = pdf.lastAutoTable.finalY;

        pdf.autoTable({
            startY: new_finalY,
            margin: 0,
            head: createPDFContentsHeadType2(id),
            body: createPDFRows(id),
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

        pdf.lastAutoTable.finalY = 12;

        resolve(id);
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20210422: inline function end                                                                                                     */
/**********************************************************************************************************************************************/