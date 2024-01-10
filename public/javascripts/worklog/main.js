let g_start_date_controller = undefined;
let g_end_date_controller = undefined;

let g_grid = undefined;
let g_datasource = undefined;

let g_grid_index = 1;

let g_searching_value = {
    startDate: undefined,
    endDate: undefined
};

// by shkoh 20231116: 작업이력을 필터링할 때, loading 표시를 자연스럽게 표현하기 위해서 timeout 인스턴스를 사용
let undisplay_inst = undefined;
let g_work_date_controller = undefined;

$(window).on('resize', function() {});

$(function() {
    initDateTimePicker();
    initButton();

    initWorkLogGrid();
    initWorkLogDataSource();

    $('#search-button').click(function(e) {
        e.preventDefault();
        
        const start_date = g_start_date_controller.GetDate();
        const end_date = g_end_date_controller.GetDate();
        if(start_date - end_date > 0) {
            alert('조회 시작시간이 종료시간보다 우선일 순 없습니다');
            return;
        }

        setTimeout(function() {
            g_searching_value.startDate = $('#start-date').val();
            g_searching_value.endDate = $('#end-date').val();

            // by shkoh 20231109: 검색버튼을 클릭하면 page는 처음 페이지로 이동한다
            g_datasource.read().then(function() {
                g_datasource.page(1);
            });
        });
    });
});

/******************************************************************************************************/
/* by shkoh 20231109: DateTimePicker start                                                            */
/******************************************************************************************************/
function getDefaultDateTime(_date) {
    const date = new Date(_date);

    let start = undefined;
    let end = undefined;

    const hour = date.getHours();
    const month = date.getMonth();

    end = new Date(date.setHours(hour + 1, 0, 0, 0));
    start = new Date(date.setMonth(month - 1));

    return {
        startDate: start,
        endDate: end
    }
}

function initDateTimePicker() {
    const init_date = getDefaultDateTime(new Date());

    g_start_date_controller = new DatePicker('#start-date', {
        period: 'hour',
        startDate: init_date.startDate
    });
    g_start_date_controller.CreateDatePicker();

    g_end_date_controller = new DatePicker('#end-date', {
        period: 'hour',
        startDate: init_date.endDate
    });
    g_end_date_controller.CreateDatePicker();
}
/******************************************************************************************************/
/* by shkoh 20231109: DateTimePicker end                                                              */
/******************************************************************************************************/

/******************************************************************************************************/
/* by shkoh 20231109: period reset button start                                                       */
/******************************************************************************************************/
function initButton() {
    $('#init-date').kendoButton({
        icon: 'refresh',
        click: function() {
            const init_date = getDefaultDateTime(new Date());
            
            g_start_date_controller.ResetDate(init_date.startDate);
            g_end_date_controller.ResetDate(init_date.endDate);
        }
    });
}
/******************************************************************************************************/
/* by shkoh 20231109: period reset button end                                                         */
/******************************************************************************************************/

function initWorkLogGrid() {
    g_grid = $('#log-page').kendoGrid({
        autoBind: false,
        toolbar: function(e) {
            const toolbar_element = $('<div id="toolbar"></div>').kendoToolBar({
                resizable: false,
                items: [{
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
                }, {
                    id: 'exportPDF',
                    type: 'splitButton',
                    text: 'PDF 내보내기',
                    icon: 'pdf',
                    menuButtons: [{
                        id: 'exportPDFAll',
                        text: '전체 PDF 내보내기',
                        icon: 'pdf',
                        click: exportPDF.bind(this,true)
                    }],
                    click: exportPDF.bind(this,false)
                }]
            });
            
            return toolbar_element;
        },
        noRecords: {
            template:
            '<div style="display: table; width: 100%; height: 100%;">' +
                '<h3 style="margin: 0px; display: table-cell; vertical-align: middle;">' +
                    '<span class="label label-default" style="border-radius: 0px;">' +
                        '작업내용이 없습니다' +
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
                last: '마지마게이지',
                morePages: '더 많은 작업 보기'
            }
        },
        filterable: { mode: 'row' },
        columns: [
            { field: 'index', title: '순번', width: 50, template: function(e) { return g_grid_index++; }, sortable: false, filterable: false },
            {
                field: 'user_ip',
                title: '작업 IP',
                width: 150,
                sortable: false,
                filterable: {
                    cell: {
                        template: function(arg) {
                            arg.element.kendoDropDownList({
                                dataSource: arg.dataSource,
                                dataTextField: 'user_ip',
                                dataValueField: 'user_ip',
                                valuePrimitive: true,
                                optionLabel: 'IP',
                                autoWidth: true,
                                messages: {
                                    noData: '작업 IP를 조회할 수 없습니다'
                                },
                                open: function(e) {
                                    e.sender.dataSource.read();
                                }
                            });
                        },
                        showOperators: false,
                        inputWidth: '100%'
                    }
                }
            }, {
                field: 'user_id',
                title: '작업계정',
                width: 120,
                sortable: false,
                filterable: {
                    cell: {
                        template: function(arg) {
                            arg.element.kendoDropDownList({
                                dataSource: arg.dataSource,
                                dataTextField: 'user_id',
                                dataValueField: 'user_id',
                                valuePrimitive: true,
                                optionLabel: '작업계정',
                                autoWidth: true,
                                messages: {
                                    noData: '작업계정을 조회할 수 없습니다'
                                },
                                open: function(e) {
                                    e.sender.dataSource.read();
                                }
                            });
                        },
                        showOperators: false,
                        inputWidth: '100%'
                    }
                }
            }, {
                field: 'user_name',
                title: '작업자명',
                width: 150,
                sortable: false,
                filterable: {
                    cell: {
                        template: function(arg) {
                            arg.element.kendoDropDownList({
                                dataSource: arg.dataSource,
                                valuePrimitive: true,
                                autoWidth: true,
                                optionLabel: '작업자 선택',
                                dataTextField: 'user_name',
                                dataValueField: 'user_name',
                                messages: {
                                    noData: '작업계정을 조회할 수 없습니다'
                                },
                                open: function(e) {
                                    e.sender.dataSource.read();
                                }
                            });
                        },
                        showOperators: false,
                        inputWidth: '100%'
                    }
                }
            }, {
                field: 'work_date',
                title: '작업일시',
                width: 200,
                filterable: {
                    cell: {
                        template: function(arg) {
                            const _date_id = 'i-filter-work-date';
                            arg.element[0].id = _date_id;

                            g_work_date_controller = new DatePicker('#' + _date_id, {
                                period: 'month',
                                startDate: new Date(),
                                onFilter: function(new_date) {
                                    // by shkoh 20231116: 생성된 DatePicker에서 일자 선택 시 해당 날짜(년/월)를 기준으로 시작하는 문자열로 필티링
                                    const filter_date = kendo.toString(new_date, 'yyyy/MM');
                                    const new_filter = { field: 'work_date', operator: 'startswith', value: filter_date };

                                    let _filter = g_datasource.filter();
                                    if(_filter) {
                                        let has_update = false;
                                        _filter.filters.map(function(f) {
                                            if(f.field === 'work_date' && f.value !== filter_date) {
                                                has_update = true;
                                                f.value = filter_date;
                                            }
                                        });

                                        if(!has_update) _filter.filters.push(new_filter);
                                    } else {
                                        _filter = [new_filter];
                                    }

                                    g_datasource.filter(_filter);
                                }
                            });

                            g_work_date_controller.CreateDatePicker();
                        },
                        showOperators: false,
                        inputWidth: '100%'
                    }
                }
            }, {
                field: 'worker_place',
                title: '작업',
                width: 200,
                sortable: false,
                filterable: {
                    cell: {
                        template: function(arg) {
                            arg.element.kendoDropDownList({
                                dataSource: arg.dataSource,
                                valuePrimitive: true,
                                autoWidth: true,
                                optionLabel: '작업선택',
                                dataTextField: 'worker_place',
                                dataValueField: 'worker_place',
                                messages: {
                                    noData: '작업내용을 조회할 수 없습니다'
                                },
                                open: function(e) {
                                    e.sender.dataSource.read();
                                    e.sender.dataSource.sort({ field: 'worker_place', dir: 'asc' });
                                }
                            });
                        },
                        showOperators: false,
                        inputWidth: '100%'
                    }
                }
            }, {
                field: 'target_name',
                title: '작업대상',
                width: 300,
                sortable: false,
                filterable: { cell: { minLength: 2, dataTextField: 'target_name', operator: 'contains', suggestionOperator: 'contains', showOperators: false } }
            }, {
                field: 'content',
                title: '작업내용',
                attributes: { style: 'white-space: pre-wrap;' },
                sortable: false,
                filterable: { cell: { minLength: 2, dataTextField: 'content', operator: 'contains', suggestionOperator: 'contains', showOperators: false } }
            }
        ],
        dataBinding: function(e) {
            if(e.sender.pager.page() === 1) g_grid_index = 1;
            else {
                g_grid_index = (e.sender.pager.page() - 1) * e.sender.pager.pageSize() + 1;
            }
        },
        dataBound: function(e) {
            // by shkoh 20231109: 데이터가 새로 읽히거나, 페이지가 이동하는 경우에 커서를 최상단으로 옮김
            g_grid.current(g_grid.tbody.find('tr:first'));
            undisplayLoading();
        },
        excelExport: function(e) {
            const file_name = exportFileName('xlsx');
            e.workbook.creator = 'ICOMER';
            e.workbook.fileName = file_name;
            e.workbook.sheets[0].name = '작업이력';

            const column_index_index = e.sender.thead.find('th[data-field="index"]')[0].cellIndex;
            const column_content_index = e.sender.thead.find('th[data-field="content"]')[0].cellIndex;

            let data_index = 0;
            let data_list_index = e.data.length > 100 ? 1 : (e.sender.pager.page() - 1) * e.sender.pager.pageSize() + 1;

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
                    for(let i = 0; i < row.cells.length; i++) {
                        row.cells[i].verticalAlign = 'center';
                    }

                    if(row.cells[column_index_index]) {
                        row.cells[column_index_index].value = Number(data_list_index);
                        row.cells[column_index_index].format = '#,##0';
                    }

                    if(row.cells[column_content_index]) {
                        // by shkoh 20231129: content(작업내용)의 높이에 따라서 행의 높이값을 지정하고, 줄바꿈을 가능하도록 셀을 설정함
                        row.cells[column_content_index].wrap = true;
                        
                        const star_idx = row.cells[column_content_index].value.split('*').length;
                        rows[idx].height = 24 * (star_idx === 0 ? 1 : star_idx + 1);
                    }                    

                    data_index++;
                    data_list_index++;
                }
            });

            e.preventDefault();
            
            const dataUrl = new kendo.ooxml.Workbook(e.workbook).toDataURL();
            exportExcelFile(dataUrl, file_name);
            
            undisplayLoading();
        }
    }).data('kendoGrid');
}

function initWorkLogDataSource() {
    g_datasource = new kendo.data.DataSource({
        transport: {
            read: {
                cache: true,
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json',
                url: '/api/worklog/get',
                data: function() {
                    return g_searching_value;
                }
            },
            parameterMap: function(data, type) {
                if(type === 'read') {
                    return kendo.stringify(data);
                }
            }
        },
        error: function(e) {
            if(e.type === 'read') {
                alert('작업이력을 로그하는 동안에 에러가 발생했습니다');
                undisplayLoading();
            }
        },
        requestStart: function(e) {
            if(e.type === 'read') displayLoading();
        },
        requestEnd: function(e) {
            if(e.type === undefined) {
                console.error(e);
                alert('작업이력 조회 중 에러가 발생했습니다');
                undisplayLoading();
            } else if(e.type === 'read' && e.response) {
                undisplayLoading();
            } else if(e.type === 'read') {
                if(!undisplay_inst) {
                    undisplay_inst = setTimeout(function() {
                        undisplayLoading();
                        undisplay_inst = undefined;
                    }, 900);
                }
            }
        },
        serverPaging: false,
        pageSize: 100,
        autoSync: false,
        batch: true,
        schema: {
            data: function(response) {
                return response;
            },
            total: function(response) {
                return response.length;
            },
            model: {
                id: 'work_id',
                fields: {
                    work_id: { editable: false },
                    user_id: { editable: false },
                    user_name: { editable: false },
                    user_ip: { editable: false },
                    work_date: { editable: false },
                    work_place: { editable: false },
                    target_name: { editable: false },
                    content: { editable: false },
                }
            }
        }
    });

    g_grid.setDataSource(g_datasource);
}

function exportExcel(is_all) {
    const hasData = g_datasource.total();
    if(hasData === 0) {
        alert('엑셀 내보내기할 데이터가 존재하지 않습니다');
        return;
    }

    displayLoading();

    setTimeout(function() {
        g_grid.options.excel.allPages = is_all;
        g_grid.saveAsExcel();
    });
}

function exportExcelFile(uri, file_name) {
    const anchor = document.createElement('a');
    anchor.setAttribute('href', uri);
    anchor.setAttribute('download', file_name);
    anchor.setAttribute('rel', 'noopener');
    anchor.setAttribute('target', '_blank');
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
}

function exportPDF(is_all) {
    const hasData = g_datasource.total();
    if(hasData === 0) {
        alert('PDF로 내보내기할 데이터가 존재하지 않습니다');
        return;
    }

    displayLoading();

    setTimeout(function() {
        try {
            const head_data = getHeadDataForPDF();
            const body_data = getBodyDataForPDF(is_all);


            saveAsPDF(head_data, body_data);
        } catch(err) {
            console.error(err);
            undisplayLoading();
        }
    });
}

function displayLoading() {
    kendo.ui.progress($(document.body), true);
}

function undisplayLoading() {
    setTimeout(function() {
        kendo.ui.progress($(document.body), false);
    });
}

function exportFileName(export_ext) {
    const { startDate, endDate } = g_searching_value;

    const start_date = startDate.substring(0, 10).replace(/\//g, '');
    const start_time = startDate.substr(11).replace(':', '');
    const end_date = endDate.substring(0, 10).replace(/\//g, '');
    const end_time = endDate.substr(11).replace(':', '');

    return '작업이력(' + start_date + '_' + start_time + '-' + end_date + '_' + end_time + ').' + export_ext;
}

function exportDocumentHeaderText() {
    const { startDate, endDate } = g_searching_value;
    return '작업이력(조회기간: ' + startDate + ' ~ ' + endDate + ')';
}

function getHeadDataForPDF() {
    const head_data = [{}];

    // by shkoh 20231129: DataGrid에서 사용하는 column을 통해서 PDF Export 시에 사용할 수 있도록 데이터를 구성함
    g_grid.columns.forEach(function(c) {
        head_data[0][c.field] = c.title.normalize('NFC');
    });

    return head_data;
}

function getBodyDataForPDF(is_all) {
    const body_data = [];
    // by shkoh 20231129: 전체페이지를 내보낼 경우에는 datasource.data()를 사용, 페이지만 내보낼 경우에는 view() 데이터만으로 PDF 문서를 생성함
    const start_index = is_all ? 0 : (g_datasource.page() - 1) * g_datasource.pageSize();
    const data = is_all ? g_datasource.data() : g_datasource.view();

    data.forEach(function(d, idx) {
        const index = start_index + (idx + 1);

        body_data.push({
            index: index,
            user_ip: d.user_ip,
            user_id: d.user_id,
            user_name: d.user_name,
            work_date: d.work_date,
            worker_place: d.worker_place,
            target_name: d.target_name,
            content: d.content
        });
    });

    return body_data;
}

function saveAsPDF(headData, bodyData) {
    const page_header_string = exportFileName('').split('.')[0];

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
            cellPadding: 0.8,
            textColor: '#000000',
            fontSize: 6,
            lineColor: [ 12, 12, 12 ],
            lineWidth: 0.08
        }
    });

    let finalY = pdf.lastAutoTable.finalY || 12;

    pdf.autoTable({
        startY: finalY,
        margin: 0,
        head: headData,
        body: bodyData,
        styles: {
            valign: 'middle'
        },
        headStyles: {
            fillColor: [ 229, 229, 229 ]
        },
        columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 20 },
            2: { cellWidth: 20 },
            3: { cellWidth: 20 },
            4: { cellWidth: 30 },
            5: { cellWidth: 30 },
            6: { cellWidth: 30 },
            7: { cellWidth: 'auto' },
        },
        didDrawCell: function(data) {
            if(data.column.index === 7) {
                const pdf_page_size = pdf.internal.pageSize;
                const pdf_page_height = pdf_page_size.height ? pdf_page_size.height : pdf_page_size.getHeight();

                if(pdf_page_height - data.cell.y < 38) {
                    data.cursor.y = data.cursor.y + 38;
                }
            }
        },
        didDrawPage: function(data) {
            // by shkoh 20231129: PDF Page Header
            pdf.setFontSize(8);
            pdf.setFontStyle('bold');
            pdf.setTextColor('#303030');

            pdf.text(page_header_string, data.settings.margin.left, 8);

            // by shkoh 20231129: PDF Page Footter
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