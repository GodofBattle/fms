/**
 * by shkoh 20200814: 우리FIS 전용 온습도보고서 javascript
 * 
 * key id: temphumi-statistics
 */
let g_ths_tree_inst = undefined;
let g_table_inst = undefined;
let g_s_date_inst = undefined;
let g_e_date_inst = undefined;

let g_searching_value = {
    ids: [],
    table: '',
    startDate: undefined,
    endDate: undefined
}

let g_export_util = new ExportUtil();
let g_pdf_default_fontsize = 6;

$(window).resize(function() {
    resizeWindow();
});

$(document).ready(function() {
    initTreeViewOfTHS();
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
            
            $('#contents-tables').empty();

            g_searching_value.startDate = $('#start-date').val();
            g_searching_value.endDate = $('#end-date').val();

            // by shkoh 20200907: 조회설비의 수를 업데이트
            updateReportEquipment();
            // by shkoh 20200907: 보고서를 만들 때 사용한 통계 데이터의 명칭을 화면에 업데이트
            updateReportTable();
            // by shkoh 20200907: 조회기간을 보고서 내용에 업데이트
            updateSearchingDate();
            // by shkoh 20200907: 출력일자를 보고서 내용에 업데이트
            updatePrintDate();
            // by shkoh 20210420: 출력자를 보고서 내용에 업데이트
            updatePrinterName();
            
            // by shkoh 20200904: 선택된 복수의 설비를 Tree에서 지정한대로 순차적으로 실행하기 위해서는 reduce를 사용하여 순차처리함
            g_searching_value.ids.reduce(function(prev, id) {
                return prev.then(function() {
                    // by shkoh 20200904: thDataLoad()가 실행되고 이 함수 내에 결과가 성공(즉, Promise.Resolve())이 될 때 다음으로 진행함
                    return thDataLoad(id);
                }).catch(function(err) {
                    console.error(err);
                });
            }, Promise.resolve()).then(function() {
                undisplayLoading();
            });
        });
    });
});

/**********************************************************************************************************************************************/
/* by shkoh 20200903: resizing start                                                                                                          */
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
/* by shkoh 20200903: resizing end                                                                                                            */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200814: tree view start                                                                                                         */
/**********************************************************************************************************************************************/
function initTreeViewOfTHS() {
    g_ths_tree_inst = new TreeViewContent('#temphumi-statistics-tree', {
        code: [ 'E0001' ],
        onCheck: onTreeViewCheck
    });

    g_ths_tree_inst.CreateTreeView();
}

function onTreeViewCheck(event, treeId, treeNode) {
    g_searching_value.ids = [];

    const checked_tree_nodes = g_ths_tree_inst.GetCheckedNodes();
    checked_tree_nodes.forEach(function(node) {
        const type = node.id.substr(0, 1);
        const id = node.id.substr(2);

        if(type === 'E') g_searching_value.ids.push(Number(id));
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20200814: tree view end                                                                                                           */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200903: toolbar start                                                                                                           */
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
        const pdf_contents = createPDFContents();
        if(pdf_contents.length > 0) {
            pdf.autoTable({
                startY: finalY,
                margin: 0,
                body: pdf_contents,
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
        }

        pdf.save(file_name_info.name + '(' + file_name_info.table + ')_' + file_name_info.s_date + '_' + file_name_info.e_date + '.pdf', { returnPromise: true }).then(function() {
            undisplayLoading();
        });
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20200903: toolbar end                                                                                                             */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200903: table dropdown list start                                                                                               */
/**********************************************************************************************************************************************/
function initTableDropDownList() {
    g_table_inst = $('#table-picker').kendoDropDownList({
        noDataTemplate: '선택 가능한 통계 데이터 없음',
        dataTextField: 'text',
        dataValueField: 'value',
        dataSource: [
            { text: '5분 통계', value: '5minute' },
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
/* by shkoh 20200903: table dropdown list end                                                                                                 */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200903: datetimepicker start                                                                                                    */
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
/* by shkoh 20200903: datetimepicker end                                                                                                      */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200903: period reset button start                                                                                               */
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
/* by shkoh 20200903: period reset button end                                                                                                 */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200903: inline function start                                                                                                   */
/**********************************************************************************************************************************************/
function displayLoading() {
    kendo.ui.progress($(document.body), true);
}

function undisplayLoading() {
    setTimeout(function() {
        kendo.ui.progress($(document.body), false);
    });
}

function createFileNameInfo() {
    return {
        name: '온습도보고서',
        table: $('#report-table').text().replace(/ /g, '_'),
        s_date: $('#report-period').attr('data-sdate'),
        e_date: $('#report-period').attr('data-edate')
    }
}

function toBlob(base64, type) {
    const raw_data = base64.substring(base64.indexOf('base64,') + 7);
    const data = atob(raw_data);
    const arr = new Uint8Array(data.length);

    for(let i = 0; i < data.length; i++) arr[i] = data.charCodeAt(i);

    return new Blob([ arr.buffer ], { type: type });
}

function createExcelColumns() {
    return new Promise(function(resolve, reject) {
        const columns = [];

        for(let idx = 0; idx < 26; idx++) {
            columns.push({
                index: idx,
                width: (idx === 0 || idx === 26) ? 10 : 32
            });
        }

        resolve(columns);
    });
}

function createExcelImages() {
    return new Promise(function(resolve, reject) {
        const export_array_buffer = [];
    
        for(const ele of $('.th_chart')) {
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

        const start_row_index = 7;
        let row_cell_index = start_row_index;
        let drawing_cnt = 0;
        $('.r-table.r-table-contents').each(function(index, ele) {
            // by shkoh 20200915: noData 항목이 false로 표기가 됐다면, 이는 차트를 그릴 데이터가 존재함
            const hasData = $(ele).attr('noData').includes('false');
            const next_row_step = hasData ? 5 : 3;
            
            row_cell_index = row_cell_index + next_row_step;
            if(hasData) {
                drawings.push({
                    topLeftCell: 'B' + row_cell_index.toString(),
                    offsetX: 5,
                    offsetY: 15,
                    width: 845,
                    height: 300,
                    image: (++drawing_cnt).toString()
                });
            }
        });

        resolve(drawings);
    });
}

function createExcelRows() {
    return new Promise(function(resolve, reject) {
        const rows = [];

        // by shkoh 20200914: 첫줄공백
        rows.push({ cells: [ { rowSpan: 1, colSpan: 26, background: '#ffffff' } ] });

        // by shkoh 20200914: 상단 해더 테이블 excel export
        const header_tr = $('.r-table.r-table-header').find('tr');
        g_export_util.CreateExcelBody(header_tr, rows);

        // by shkoh 20200914: 보고서 요약 정보 excel export
        const info_tr = $('.r-table.r-table-info').find('tr');
        g_export_util.CreateExcelBody(info_tr, rows);

        // by shkoh 20200914: 온습도 통계 보고서 본 내용
        const contents_tr = $('.r-table.r-table-contents').find('tr');
        g_export_util.CreateExcelBody(contents_tr, rows);

        // by shkoh 20200914: 하단 풋터 테이블 excel export
        const footer_tr = $('.r-table.r-table-bottom').find('tr');
        g_export_util.CreateExcelBody(footer_tr, rows);

        // by shkoh 20200914: 마지막줄 공백
        rows.push({ cells: [ { rowSpan: 1, colSpan: 26, background: '#ffffff' } ] });

        resolve(rows);
    });
}

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

function updateReportEquipment() {
    $('#report-equip').text(g_searching_value.ids.length + ' 개');
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

function thDataLoad(id) {
    // by shkoh 20200907: 설비의 id(equip_id)에서 통계 데이터에 저장된 데이터들을 받아온 후, 해당 내용을 토대로 온습도 template를 생성함
    return new Promise(function(resolve, reject) {
        $.ajax({
            async: true,
            type: 'GET',
            dataType: 'json',
            url: '/api/reports/wrfis/thstat?id=' + id + '&table=' + g_searching_value.table + '&start=' + g_searching_value.startDate + '&end=' + g_searching_value.endDate
        }).done(function(data) {
            appendTHTemplate(id, data);
            resolve(id);
        }).fail(function(err) {
            reject(err);
        });
    });
}

function appendTHTemplate(id, data) {
    // by shkoh 20200907: 검색조건에 따라서 조회할 데이터의 존재 유무에 따라서 template를 가변적으로 생성하여 #content-tables에 추가함
    const th_template = kendo.template($('#th-template').html());
    const html = th_template({ equip_id: id, no_data: (data.length === 0) ? true : false });
    $('#contents-tables').append(html);

    // by shkoh 20200907: 추가가 완료되면 설비명과 chart에 데이터를 그림
    $('.r-table-contents[equipId="'+ id + '"]').ready(function(e) {
        const th_table = $('.r-table-contents[equipId="'+ id + '"]');

        // by shkoh 2020904: insert name
        th_table.find('#name').text(g_ths_tree_inst.GetNodeNameById(id));

        if(data.length > 0) {
            createChart(th_table.find('.th_chart'), data);
            setTempHumiInfoValue(th_table, data);
        }
    });
}

function createChart(ele, th_data) {    
    ele.kendoChart({
        dataSource: {
            data: th_data
        },
        persistSeriesVisibility: true,
        seriesDefaults: {
            type: 'line',
            tooltip: {
                visible: true,
                template: function(s) {
                    let unit = ' \\\℃';
                    if(s.series.name.includes('습도')) unit = ' \\\%';
                    
                    return s.series.name + ': ' + kendo.toString(s.value, '##,#.00' + unit);
                }
            }
        },
        series: [
            { name: '최대온도', style: 'smooth', field: 't_max', color: '#ff1700', aggregate: 'max', missingValues: 'gap' },
            { name: '평균온도', style: 'smooth', field: 't_avg', color: '#ff6800', aggregate: 'avg', missingValues: 'gap' },
            { name: '최소온도', style: 'smooth', field: 't_min', color: '#ff9c00', aggregate: 'min', missingValues: 'gap' },
            { name: '최대습도', style: 'smooth', field: 'h_max', color: '#0017ff', aggregate: 'max', missingValues: 'gap' },
            { name: '평균습도', style: 'smooth', field: 'h_avg', color: '#0068ff', aggregate: 'avg', missingValues: 'gap' },
            { name: '최소습도', style: 'smooth', field: 'h_min', color: '#009cff', aggregate: 'min', missingValues: 'gap' }
        ],
        legend: {
            background: '#ececec',
            width: 65
        },
        categoryAxis: {
            type: 'date',
            name: '시간',
            field: 'stat_date',
            crosshair: {
                visible: true
            },
            justified: false,
            baseUnit: makeBaseUnit(),
            baseUnitStep: 'auto',
            maxDateGroups: 18,
            maxDivisions: 18,
            roundToBaseUnit: true,
            labels: {
                font: "9px Malgun Gothic",
                dateFormats: {
                    milliseconds: 'HH:mm:ss',
                    minutes: 'HH:mm',
                    hours: 'MM/dd\nHH:mm',
                    days: 'MM/dd',
                    weeks: 'yyyy\nMM/dd',
                    months: 'yyyy/MM',
                    years: 'yyyy'
                },
                template: function(e) {
                    if(e.format === 'HH:mm:ss') {
                        switch(g_table_inst.value()) {
                            case '5minute': e.format = 'HH:mm'; break;
                            case 'hour': e.format = 'MM/dd\nHH:mm'; break;
                            case 'day': e.format = 'MM/dd'; break;
                            case 'month': e.format = 'yyyy/MM'; break;
                        }
                    }
                    return kendo.toString(e.value, e.format);
                }
            },
            autoBaseUnitSteps: {
                minutes: [ 5, 10, 30 ],
                hours: [ 1, 2, 3, 4 ],
                months: [1, 3],
                years: [1]
            }
        },
        pannable: {
            lock: 'y'
        },
        zoomable: {
            mousewheel: {
                lock: 'y'
            },
            selection: false
        },
        valueAxis: {
            majorTicks: { visible: false },
            majorGridLines: {
                visible: true,
                dashType: 'dot'
            },
        },
        chartArea: {
            width: 787,
            height: 300
        },
        zoom: function(e) {
            // by shkoh 20200911: 확대일 때(e.delta < 0) 더 이상 확대가 가능할지 판단함
            if(e.axisRanges.시간 && !isZoomable(e.sender, e.axisRanges.시간.min, e.axisRanges.시간.max)) {
                e.preventDefault();
            }

            e.originalEvent.preventDefault();
            e.originalEvent.stopPropagation();
        }
    });
}

function makeBaseUnit() {
    let base_unit = 'minutes';
    switch(g_table_inst.value()) {
        case 'hour': base_unit = 'hours'; break;
        case 'day': base_unit = 'days'; break;
        case 'month': base_unit = 'month'; break;
    }

    return base_unit;
}


function initMinCategory(_min) {
    let min = new Date(_min);

    switch(g_table_inst.value()) {
        case '5minute': min.setMinutes(min.getMinutes() - 5); break;
        case 'hour': min.setHours(min.getHours() - 1); break;
        case 'day': min.setDate(min.getDate() - 1); break;
        case 'month': min.setMonth(min.getMonth() - 1); break;
    }

    return min;
}

function initMaxCategory(_max) {
    let max = new Date(_max);

    switch(g_table_inst.value()) {
        case '5minute': max.setMinutes(max.getMinutes() + 5); break;
        case 'hour': max.setHours(max.getHours() + 1); break;
        case 'day': max.setDate(max.getDate() + 1); break;
        case 'month': max.setMonth(max.getMonth() + 1); break;
    }

    return max;
}

function isZoomable(chart, min, max) {
    const division = chart.options.categoryAxis.maxDivisions;

    let limit_period = 1000 * 60;   // by shkoh 20200911: 기본을 1분으로 선택
    switch(g_table_inst.value()) {
        case '5minute': limit_period = limit_period * 75; break;                    // by shkoh 20200911: 5분통계는 75분부턴 zoom 기능 활성화
        case 'hour': limit_period = limit_period * 60 * 24; break;                  // by shkoh 20200911: 시간통계는 24시부터 zoom 기능 활성화
        case 'day': limit_period = limit_period * 60 * 24 * (division - 5); break;  // 최대 1일
        case 'month': limit_period = limit_period * 60 * 24 * 30 * 12; break;       // by shkoh 20200911: 월통계는 최대 12칸까지 허용
    }

    return (initMaxCategory(max) - initMinCategory(min)) > limit_period;
}

function setTempHumiInfoValue(ele, data) {
    const statistics = data.reduce(function(a, b) {
        return {
            t_min: Math.min(a.t_min, b.t_min),
            t_avg: a.t_avg + b.t_avg,
            t_max: Math.max(a.t_max, b.t_max),
            h_min: Math.min(a.h_min, b.h_min),
            h_avg: a.h_avg + b.h_avg,
            h_max: Math.max(a.h_max, b.h_max),
        }
    });

    statistics.t_avg = statistics.t_avg / data.length;
    statistics.h_avg = statistics.h_avg / data.length;

    ele.find('.temp_min').text(kendo.toString(statistics.t_min, '##,#.00'));
    ele.find('.temp_avg').text(kendo.toString(statistics.t_avg, '##,#.00'));
    ele.find('.temp_max').text(kendo.toString(statistics.t_max, '##,#.00'));
    ele.find('.humi_min').text(kendo.toString(statistics.h_min, '##,#.00'));
    ele.find('.humi_avg').text(kendo.toString(statistics.h_avg, '##,#.00'));
    ele.find('.humi_max').text(kendo.toString(statistics.h_max, '##,#.00'));
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
/**********************************************************************************************************************************************/
/* by shkoh 20200903: inline function end                                                                                                     */
/**********************************************************************************************************************************************/