/**
 * by shkoh 20210209: 우리FIS 전용 전기 확인명세서 javascript
 * 
 * 전기 확인명세서는 복수의 리포트가 필요하며 리포트의 내용은 아래와 같다
 * 1. BMS 콘트롤러 및 SW(비텍)
 * 2. STS(리테크전기)
 * 3. UPS(이피코리아)
 * 4. UPS(지엠시스템)
 * 5. 무정전절체스위치(지큐시스템즈)
 * 6. 비상발전기(커민스)
 * 
 * key id: electric_spec
 */

let g_dropdown_controller = undefined;
let g_date_controller = undefined;
let g_export_util = new ExportUtil();

const report_config = {
    // by shkoh 20210209: 보고서 형태는 가로방향(landscape)
    is_landscape: true,

    // by shkoh 20210209: 보고서 디자인 시 작성한 colgroup의 수
    columns: {
        count: 24
    },
    pdf: {
        // by shkoh 20210209: PDF Export 시, 기본 font의 크기
        defaultFontSize: 6
    },
    excel: {
        columnWidth: 40,
        // by shkoh 20210208: Excel Export 시, 엑셀 시트의 셀 Column의 전체 수
        // by shkoh 20210208: 보고서 전체 사용 column 수에서 좌우 여백를 고려하여, (보고서에서 사용한 <colgroup> 수) + 2
        columnCount: 26
    },
    data: {
        'elec_spec_1': {
            rows: 16,
            company: '비텍인터네셔널코리아',
            contractMonth: 9,
            contractStart: '-09-01',
            contractEnd: '-08-31',
            contractCharge: '3,700,000',
            contractChargeTax: '4,070,000',
            col0: {
                rowspan: 1,
                colspan: 5,
                class: 'r-border-left r-border-top r-font-info r-font-bold',
                text: [ '기반설비감시시스템(BMS) 유지보수', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '' ],
                id: [ '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '' ]
            },
            col1: {
                rowspan: 1,
                colspan: 4,
                class: 'r-border-left r-border-top r-font-info r-font-bold',
                text: [ 'BMS 콘트롤러 및 S/W', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '' ],
                id: [ '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '' ]
            },
            col2: {
                rowspan: 1,
                colspan: 1,
                class: 'r-border-left r-border-top r-font-info r-font-bold',
                text: [ '16', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '' ],
                id: [ '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '' ]
            },
            col3: {
                rowspan: 1,
                colspan: 3,
                class: 'r-border-left r-border-top r-font-info r-font-bold',
                text: [ '20000246704', '20000246705', '20000246706', '20000246707', '20000246708', '20000246709', '20000246710', '20000246711', '20000246712', '20000246713', '20000246714', '20000246715', '20000246716', '20000246717', '20000246718', '20000246719' ],
                id: [ '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '' ]
            },
            col4: {
                rowspan: 1,
                colspan: 3,
                class: 'r-border-left r-border-top r-font-info r-font-bold',
                text: [ '3,700,000', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '' ],
                id: [ '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '' ]
            },
            col5: {
                rowspan: 1,
                colspan: 2,
                class: 'r-border-left r-border-top r-font-info r-font-bold',
                text: [ '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '' ],
                id: [ 'contract-start', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '' ]
            },
            col6: {
                rowspan: 1,
                colspan: 2,
                class: 'r-border-left r-border-top r-font-info r-font-bold',
                text: [ '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '' ],
                id: [ 'contract-end', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '' ]
            },
            col7: {
                rowspan: 1,
                colspan: 2,
                class: 'r-border-left r-border-top r-font-info r-font-bold',
                text: [ '자동연장', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '' ],
                id: [ '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '' ]
            },
            col8: {
                rowspan: 1,
                colspan: 2,
                class: 'r-border-left r-border-top r-border-right r-font-info r-font-bold',
                text: [ '이덕만 과장', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '' ],
                id: [ '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '' ]
            }
        }
    }
}

$(window).resize(function() {
    resizeWindow();
});

$(document).ready(function() {    
    initTableDropDownList();
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

            // by shkoh 20210209: 명세서의 내용을 채우기 전에 내용을 초기화함
            $('#report-company').text('업체명:');
            $('.r-table-contents > tbody > tr').remove('.spec_row');
            $('#contract-charge').text('');
            $('#contract-charge-tax').text('');
            
            // by shkoh 20210209: 조회할 명세서의 제목 업데이트
            updateSpecTitle();

            // by shkoh 20210209: 명세서 제목 업데이트
            updateReportTitle();
            
            // by shkoh 20210209: 명세서 내역 업데이트
            updateReport();

            undisplayLoading();
        });
    });
});

/**********************************************************************************************************************************************/
/* by shkoh 20210209: resizing start                                                                                                          */
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
/* by shkoh 20210209: resizing end                                                                                                            */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200903: toolbar start                                                                                                           */
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
                name: file_name_info.name + '(' + file_name_info.table + ')'
            }]
        });
    
        workbook.toDataURLAsync().then(function(dataURL) {
            kendo.saveAs({
                dataURI: dataURL,
                fileName: file_name_info.name + '(' + file_name_info.table + ')_' + file_name_info.s_date + '_' + file_name_info.e_date + '.xlsx'
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
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
            precision: 1.0,
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

        finalY = pdf.lastAutoTable.finalY + 4;
        pdf.autoTable({
            startY: finalY,
            margin: 0,
            body: createPDFInfo(),
            columnStyles: {
                0: { cellWidth: 7.2 },
                1: { cellWidth: 7.2 },
                2: { cellWidth: 7.2 },
                3: { cellWidth: 7.2 },
                4: { cellWidth: 7.2 },
                5: { cellWidth: 7.2 },
                6: { cellWidth: 7.2 },
                7: { cellWidth: 7.2 },
                8: { cellWidth: 7.2 },
                9: { cellWidth: 7.2 },
                10: { cellWidth: 7.2 },
                11: { cellWidth: 7.2 },
                12: { cellWidth: 7.2 },
                13: { cellWidth: 7.2 },
                14: { cellWidth: 7.2 },
                15: { cellWidth: 7.2 },
                16: { cellWidth: 7.2 },
                17: { cellWidth: 7.2 },
                18: { cellWidth: 7.2 },
                19: { cellWidth: 7.2 },
                20: { cellWidth: 7.2 },
                21: { cellWidth: 7.2 },
                22: { cellWidth: 7.2 },
                23: { cellWidth: 7.2 }
            }
        });

        finalY = pdf.lastAutoTable.finalY + 2;
        pdf.autoTable({
            startY: finalY,
            margin: 0,
            body: createPDFContents(),
            columnStyles: {
                0: { cellWidth: 7.2 },
                1: { cellWidth: 7.2 },
                2: { cellWidth: 7.2 },
                3: { cellWidth: 7.2 },
                4: { cellWidth: 7.2 },
                5: { cellWidth: 7.2 },
                6: { cellWidth: 7.2 },
                7: { cellWidth: 7.2 },
                8: { cellWidth: 7.2 },
                9: { cellWidth: 7.2 },
                10: { cellWidth: 7.2 },
                11: { cellWidth: 7.2 },
                12: { cellWidth: 7.2 },
                13: { cellWidth: 7.2 },
                14: { cellWidth: 7.2 },
                15: { cellWidth: 7.2 },
                16: { cellWidth: 7.2 },
                17: { cellWidth: 7.2 },
                18: { cellWidth: 7.2 },
                19: { cellWidth: 7.2 },
                20: { cellWidth: 7.2 },
                21: { cellWidth: 7.2 },
                22: { cellWidth: 7.2 },
                23: { cellWidth: 7.2 }
            },
            willDrawCell: function(data) {
                // by shkoh 20200916: 온습도 테이블을 그릴 때 가장 첫번째 셀에서 다음 페이지로 넘겨야 할지 여부를 판단
                if(data.cell.raw.isStart) {
                    const limit_height = data.cell.raw.hasData ? 200 : 230;
                    if(data.cell.y > limit_height) {
                        data.cursor.y = 300;
                    }
                }

                // by shkoh 20200916: 온습도 테이블은 선택한 온습도의 수만큼 그려지는데 각 테이블을 전부 그리면 10 정도의 여백을 두고 다음 테이블을 그림
                if(data.cell.raw.isLast) {
                    data.cursor.y = data.cursor.y + 10;
                }
            },
            didDrawCell: function(data) {
                const pdf_page_size = pdf.internal.pageSize;
                const pdf_page_height = pdf_page_size.height ? pdf_page_size.height : pdf_page_size.getHeight();
                
                // by shkoh 20200915: 해당 cell에 image가 존재하는지 여부를 판단하여 등록
                if(data.cell.raw.hasImage && (data.row.height + data.cell.y) < pdf_page_height && output[image_index]) {
                    pdf.addImage(output[image_index], 'PNG', data.cell.x + 2, data.cell.y + 2, data.cell.width, data.row.height);
                    image_index++
                }
            },
            didDrawPage: function(data) {
                // by shkoh 20200915: PDF Page Footer
                const pdf_page_size = pdf.internal.pageSize;
                const pdf_page_width = pdf_page_size.width ? pdf_page_size.width : pdf_page_size.getWidth();
                const pdf_page_height = pdf_page_size.height ? pdf_page_size.height : pdf_page_size.getHeight();

                pdf.line(10, pdf_page_height - 14, pdf_page_width - 10, pdf_page_height - 14, 'S');
                pdf.setFontSize(11);
                pdf.text($('.r-font-footer').text(), pdf_page_width / 2 - 15, pdf_page_height - 8);                
            }
        });

        pdf.save(file_name_info.name + '(' + file_name_info.table + ')_' + file_name_info.s_date + '_' + file_name_info.e_date + '.pdf', { returnPromise: true }).then(function() {
            undisplayLoading();
        });
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20200903: toolbar end                                                                                                             */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210209: table dropdown list start                                                                                               */
/**********************************************************************************************************************************************/
function initTableDropDownList() {
    g_dropdown_controller = $('#table-picker').kendoDropDownList({
        noDataTemplate: '선택 가능한 전기 확인명세서 없음',
        dataTextField: 'text',
        dataValueField: 'value',
        dataSource: [
            { text: 'BMS 콘트롤러 및 SW(비텍)', value: 'elec_spec_1' },
            { text: 'STS(리테크전기)', value: 'elec_spec_2' },
            { text: 'UPS(이피코리아)', value: 'elec_spec_3' },
            { text: 'UPS(지엠시스템)', value: 'elec_spec_4' },
            { text: '무전정절체스위치(지큐시스템즈)', value: 'elec_spec_5' },
            { text: '비상발전기(커민스)', value: 'elec_spec_6' }
        ],
        index: -1
    }).data('kendoDropDownList');
}
/**********************************************************************************************************************************************/
/* by shkoh 20210209: table dropdown list end                                                                                                 */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210209: datetimepicker start                                                                                                    */
/**********************************************************************************************************************************************/
function initDateTimePicker() {
    g_date_controller = new DatePicker('#searching-date', {
        period: 'month',
        startDate: new Date()
    });
    g_date_controller.CreateDatePicker();
}
/**********************************************************************************************************************************************/
/* by shkoh 20210209: datetimepicker end                                                                                                      */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210209: inline function start                                                                                                   */
/**********************************************************************************************************************************************/
function displayLoading() {
    kendo.ui.progress($(document.body), true);
}

function undisplayLoading() {
    setTimeout(function() {
        kendo.ui.progress($(document.body), false);
    });
}

function createPDFHeader() {
    const rows = [];

    // by shkoh 20200915: 상단 해더 테이블 pdf export
    const header_tr = $('.r-table.r-table-header').find('tr');
    g_export_util.CreatePDFBody(header_tr, rows, g_pdf_default_fontsize);

    return rows;
}

function createPDFInfo() {
    const rows = [];

    // by shkoh 20200915: 온습도 통계 보고서 요약
    const info_tr = $('.r-table.r-table-info').find('tr');
    g_export_util.CreatePDFBody(info_tr, rows, g_pdf_default_fontsize);

    return rows;
}

function createPDFContents() {
    const rows = [];

    const contents_tr = $('.r-table.r-table-contents').find('tr');
    g_export_util.CreatePDFBody(contents_tr, rows, g_pdf_default_fontsize);

    return rows;
}

function createPDFImages() {
    return new Promise(function(resolve, reject) {
        const export_array_buffer = [];
    
        for(const ele of $('.th_chart')) {
            const chart = $(ele).getKendoChart();
            const image_data_url = chart.imageDataURL();

            export_array_buffer.push(image_data_url);
        }

        resolve(export_array_buffer);
    });
}

function updateSpecTitle() {
    $('#spec-title').text(g_dropdown_controller.text());
}

function updateReportTitle() {
    // by shkoh 20210209: 명세서를 선택하지 않으면 아무 일도 일어나지 않는다
    if(g_dropdown_controller.selectedIndex === -1) return;
    
    const yyyy = g_date_controller.GetDate().getFullYear();
    const mm = g_date_controller.GetDate().getMonth() + 1;

    $('#report-title').text(yyyy + '년 ' + mm + '월 유지보수 확인명세서');
}

function updateReport() {
    // by shkoh 20210209: 명세서를 선택하지 않으면 아무 일도 일어나지 않는다
    if(g_dropdown_controller.selectedIndex === -1) return;

    // by shkoh 20210209: 선택할 확인명세서에 따라서 해당 정보를 가져옴
    const report = report_config.data[g_dropdown_controller.value()];

    if(report) {
        // by shkoh 20210209: 업체명을 업데이트함
        $('#report-company').text('업체명: ' + report.company);

        // by shkoh 20210209: 명세서의 특징에 맞춰서 행의 수만큼 내용을 채워 넣음. 채울 내용은 각 열의 정보로 정의된 항목들로 채움
        for(let row_idx = 0; row_idx < report.rows; row_idx++) {
            let row_string = '<tr class="spec_row" height="25">';
            
            let col = '';
            for(let col_idx = 0; col_idx < 9; col_idx++) {
                const rowspan = report['col' + col_idx.toString()].rowspan;
                const colspan = report['col' + col_idx.toString()].colspan;
                const cell_class = report['col' + col_idx.toString()].class;
                const text = report['col' + col_idx.toString()].text[row_idx];
                const id = report['col' + col_idx.toString()].id[row_idx];

                col = '<td scope="col" rowspan="' + rowspan + '" colspan="' + colspan + '" class="' + cell_class + '"' + (id === '' ? id : (' id="' + id + '"')) + '>' + text + '</td>';
                row_string += col;
            }

            row_string += '</tr>';

            // by shkoh 20210929: 최종적으로 만들어진 한 줄의 정보만큼 채워넣음
            $('.r-table-contents > tbody').children(':nth-last-child(2)').before(row_string);
        }

        // by shkoh 20210209: 사전에 미리 정의한 계약기간을 작성
        const mm = g_date_controller.GetDate().getMonth() + 1;
        const yyyy = g_date_controller.GetDate().getFullYear() + (report.contractMonth <= mm ? 0 : -1);

        $('#contract-start').text((yyyy).toString() + report.contractStart);
        $('#contract-end').text((yyyy + 1).toString() + report.contractEnd);

        // by shkoh 20210209: 사전에 미리 정의한 명세 금액을 작성
        $('#contract-charge').text(report.contractCharge);
        $('#contract-charge-tax').text(report.contractChargeTax);
    }
}
/**********************************************************************************************************************************************/
/* by shkoh 20210209: inline function end                                                                                                     */
/**********************************************************************************************************************************************/