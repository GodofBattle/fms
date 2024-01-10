let g_tree_controller = undefined;
let g_start_date_controller = undefined;
let g_end_date_controller = undefined;

let g_grid = undefined;
let g_datasource = undefined;

let g_grid_index = 1;

let g_add_info = undefined;
let g_date_inst = undefined;
let g_type_inst = undefined;

const g_searching_value = {
    ids: [],
    startDate: undefined,
    endDate: undefined
};

$(window).on('resize', function() {
    resizeWindow();
});

$(function() {
    initTreeView();
    initDateTimePicker();
    initButton();
    initWorkHistoryGrid();
    initWorkHistoryDataSource();

    initModalDate();
    initModalType();

    $('#search-button').on('click', function() {
        if(g_searching_value.ids.length === 0) {
            alert('조회항목을 선택하세요');
            return;
        }

        const start_date = g_start_date_controller.GetDate();
        const end_date = g_end_date_controller.GetDate();

        if(start_date - end_date > 0) {
            alert('조회 시작 시간이 종료시간보다 우선일 수 없습니다');
            return;
        }

        setTimeout(function() {
            g_searching_value.startDate = $('#start-date').val();
            g_searching_value.endDate = $('#end-date').val();

            g_datasource.read().then(function() { g_datasource.page(1); });
        });
    });

    $('#modal-dialog-add-item').on('show.bs.modal', function() {        
        $('#equip_name').text(g_add_info.name);
        g_date_inst.ResetDate(new Date());
        g_type_inst.value('WK001');
        $('#worker-name').val('');
        $('#working-memo').val('');

        const memo_placeholder = g_add_info.name + ' 설비에 대한 작업내용을 작성합니다.\n띄어쓰기 포함 256자 이내';
        $('#working-memo').attr('placeholder', memo_placeholder);
    });

    // by shkoh 20211228: 작업추가 창이 닫힐 때, 모달 창 안에 모든 항목들은 초기화함
    $('#modal-dialog-add-item').on('hide.bs.modal', function() {
        g_add_info = undefined;
    });

    $('#btn-modal-add').on('click', function() {
        const w_n = $('#worker-name').val();

        if(w_n.length === 0) {
            alert('작업자를 입력하세요');
            $('#worker-name').focus();
            return;
        }

        if(g_add_info !== undefined) {
            addWorkReport(g_add_info);
        } else {
            alert('작업할 설비가 불분명합니다')
        }

    });
});

function resizeWindow() {
    kendo.resize($('#report-page'));
}

/***********************************************************************************************************************/
/* by shkoh 20211224: tree view start                                                                                  */
/***********************************************************************************************************************/
function initTreeView() {
    g_tree_controller = new TreeViewContent('#tree-content', {
        onCheck: onTreeViewCheck,
        hasAddButton: true,
        onAdd: onAddWorkLog
    });

    g_tree_controller.CreateTreeView();
}

function onTreeViewCheck(event, treeId, treeNode) {
    g_searching_value.ids = [];

    const checked_tree_nodes = g_tree_controller.GetCheckedNodes();
    checked_tree_nodes.forEach(function(node) {
        const type = node.id.substring(0, 1);
        const id = node.id.substring(2);

        if(type === 'E') g_searching_value.ids.push(id);
    });
}

function onAddWorkLog(treeNode) {
    g_add_info = treeNode;
    $('#modal-dialog-add-item').modal({ keyboard: true, show: true });
}
/***********************************************************************************************************************/
/* by shkoh 20211224: tree view end                                                                                    */
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* by shkoh 20211224: datetime picker start                                                                            */
/***********************************************************************************************************************/
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
            
            // by shkoh 20211224: 작업이력은 기본 기간을 한달로 정함
            // by shkoh 20211224: 요청에 따라서 변경
            const month = date.getMonth();
            _start = new Date(date.setMonth(month - 1));
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
    const period = 'hour';
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
/***********************************************************************************************************************/
/* by shkoh 20211224: datetime picker end                                                                              */
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* by shkoh 20211224: period reset button start                                                                        */
/***********************************************************************************************************************/
function initButton() {
    $('#init-date').kendoButton({
        icon: 'refresh',
        click: function(e) {
            const period = 'hour';
            const init_date = getDefaultDateTime(period, new Date());
            
            g_start_date_controller.ResetDate(init_date.startDate);
            g_end_date_controller.ResetDate(init_date.endDate);
        }
    });
}
/***********************************************************************************************************************/
/* by shkoh 20211224: period reset button end                                                                          */
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* by shkoh 20211227: modal start                                                                                      */
/***********************************************************************************************************************/
function initModalDate() {
    g_date_inst = new DatePicker('#working-date', {
        period: 'hour',
        startDate: new Date()
    });

    g_date_inst.CreateDatePicker();
}

function initModalType() {
    g_type_inst = $('#working-type').kendoDropDownList({
        dataSource: {
            transport: {
                read: {
                    type: 'GET',
                    dataType: 'json',
                    url: '/api/workhistory/worktype'
                }
            }
        },
        dataTextField: 'code_name',
        dataValueField: 'code_id',
        messages: {
            noData: '선택할 항목이 없습니다'
        }
    }).data('kendoDropDownList');
}
/***********************************************************************************************************************/
/* by shkoh 20211227: modal end                                                                                        */
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* by shkoh 20211224: work history grid start                                                                          */
/***********************************************************************************************************************/
function initWorkHistoryGrid() {
    g_grid = $('#report-page').kendoGrid({
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
        resizable: false,
        sortable: true,
        navigatable: true,
        pageable: {
            messages: {
                empty: '작업 이력이 없습니다',
                display: '현재 페이지 작업이력: {0}건 ~ {1}건 (전체 작업 이력: {2}건)'
            }
        },
        editable: {
            mode: 'inline',
            createAt: 'top',
            confirmation: '선택한 작업이력을 삭제하시겠습니까?'
        },
        selectable: 'row',
        filterable: { mode: 'row' },
        columns: [
            {
                field: 'num',
                width: 50,
                title: '순번',
                sortable: false,
                filterable: false,
                template: function(e) {
                    e.num = g_grid_index;
                    return g_grid_index++;
                }
            },
            {
                field: 'equip_name',
                width: 200,
                title: '기반 설비명',
                filterable: {
                    cell: { operator: 'contains', showOperators: false }
                }
            },
            {
                field: 'work_dt',
                width: 200,
                title: '작업일자',
                filterable: false,
                editor: function(container, options) {
                    const input = $('<input id="temp_datepicker" style="width: 100%;" data-bind="value:' + options.field + '" data-id="' + options.model.id + '"/>');
                    input.appendTo(container);
                    const dp = new DatePicker('#temp_datepicker', {
                        period: 'hour',
                        startDate: new Date(options.model[options.field]),
                        showEvent: 'click',
                        isCloseAfterFiltering: false,
                        onFilter: function(new_date) {
                            const id = $('#temp_datepicker').attr('data-id');
                            const update_date = g_datasource.get(id);
                            update_date.set('work_dt', kendo.toString(new_date, 'yyyy/MM/dd HH:mm'));
                        }
                    });

                    dp.CreateDatePicker();
                }
            },
            {
                field: 'work_code',
                width: 150,
                title: '작업분류',
                template: '#: work_type_name #',
                filterable: {
                    cell: {
                        template: function(arg) {
                            arg.element.kendoDropDownList({
                                dataSource: arg.dataSource,
                                dataTextField: 'work_type_name',
                                dataValueField: 'work_code',
                                valuePrimitive: true,
                                optionLabel: '',
                                autoWidth: true,
                                messages: {
                                    noData: '선택할 작업분류가 존재하지 않습니다'
                                },
                                open: function(e) {
                                    e.sender.dataSource.read();
                                }
                            });
                        },
                        showOperators: false,
                        inputWidth: '100%'
                    }
                },
                editor: function(container, options) {
                    const input = $('<input data-bind="value:' + options.field + '"/>');
                    input.appendTo(container);
                    input.kendoDropDownList({
                        autoBind: true,
                        dataSource: {
                            transport: {
                                read: {
                                    type: 'GET',
                                    dataType: 'json',
                                    url: '/api/workhistory/worktype'
                                }
                            }
                        },
                        dataTextField: 'code_name',
                        dataValueField: 'code_id',
                        messages: {
                            noData: '선택할 항목이 없습니다'
                        },
                        autoWidth: true,
                    });
                }
            },
            {
                field: 'worker_name',
                width: 150,
                title: '작업자',
                filterable: {
                    cell: { operator: 'contains', showOperators: false }
                }
            },
            {
                field: 'text',
                title: '작업내용',
                sortable: false,
                attributes: { style: 'white-space: pre-wrap;' },
                filterable: {
                    cell: { operator: 'contains', showOperators: false }
                },
                editor: function(container, options) {
                    const input = $('<textarea data-bind="value:' + options.field + '"></textarea>');
                    input.appendTo(container);
                    input.kendoTextArea({
                        placeholder: '작업내용 작성(최대 256자)',
                        maxLength: 256,
                        rows: 6,
                        cols: 80
                    });
                }
            },
            {
                width: 150,
                command: [
                    { name: 'edit', text: { edit: '수정', update: '적용', cancel: '취소' } },
                    { name: 'destroy', text: '삭제' },
                ]
            }
        ],
        dataBinding: function(e) {
            if(e.sender.pager.page() === 1) g_grid_index = 1;
            else g_grid_index = (e.sender.pager.page() - 1) * e.sender.pager.pageSize() + 1;
        },
        dataBound: function(e) {
            // by shkoh 20211228: 데이터가 새로 읽히거나, 페이지 이동 시, 커서를 최상단으로 이동
            g_grid.current(g_grid.tbody.find('tr:first'));
            undisplayLoading();
        },
        cancel: function(e) {
            g_grid_index = e.model.num;
        },
        excelExport: function(e) {
            const file_name = exportFileName('xlsx');
            e.workbook.creator = 'ICOMER';
            e.workbook.fileName = file_name;
            e.workbook.sheets[0].name = '작업이력';

            // by shkoh 20211228: 특정 셀의 값과 포맷을 변경하기 위해서 column index를 지정
            const column_index_num = e.sender.thead.find('th[data-field="num"]')[0].cellIndex;
            const column_index_equip_name = e.sender.thead.find('th[data-field="equip_name"]')[0].cellIndex;
            const column_index_work_dt = e.sender.thead.find('th[data-field="work_dt"]')[0].cellIndex;
            const column_index_work_code = e.sender.thead.find('th[data-field="work_code"]')[0].cellIndex;
            const column_index_worker_name = e.sender.thead.find('th[data-field="worker_name"]')[0].cellIndex;
            const column_index_text = e.sender.thead.find('th[data-field="text"]')[0].cellIndex;

            // by shkoh 20211228: data_index: Excel Export 시, 전체 데이터의 index를 지정
            let data_index = 0;
            // by shkoh 20211228: data_list_index: Grid에 지정된 순번을 표시하기 위해 사용, 전체 데이터의 수가 pageSize를 넘는 경우에는 전체 페이지를 export 하겠다는 의미로 해석
            let data_list_index = e.data.length > e.sender.pager.pageSize() ? 1 : (e.sender.pager.page() - 1) * e.sender.pager.pageSize() + 1;

            // by shkoh 20211228: 작업이력에서 작업내용의 width값을 적당히 크게 잡는다.
            e.workbook.sheets[0].columns[column_index_text].width = 64;

            // by shkoh 20211228: 엑셀 파일에 조회기간을 셀에 추가, 그리고 freezePane의 row값도 함께 추가
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
                if(row.type === 'header') {
                    row.cells.map(function(cell, idx, cells) {
                        cell.verticalAlign = 'center';
                    });
                }

                if(row.type === 'data') {
                    const work_type_name = e.data.at(data_index).work_type_name;

                    row.cells.map(function(cell, idx, cells) {
                        cell.verticalAlign = 'center';

                        switch(idx) {
                            case column_index_num: cell.value = Number(data_list_index); break;
                            case column_index_work_code: cell.value = work_type_name; break;
                            case column_index_text: {
                                cell.wrap = true;
                                break;
                            }
                        }
                    });

                    data_index++;
                    data_list_index++;
                }
            });

            undisplayLoading();
        }
    }).data('kendoGrid');
}

function initWorkHistoryDataSource() {
    g_datasource = new kendo.data.DataSource({
        transport: {
            read: {
                cache: false,
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json',
                url: '/api/workhistory/get',
                data: function() {
                    return g_searching_value;
                }
            },
            update: {
                type: 'PATCH',
                dataType: 'json',
                url: '/api/workhistory/job'
            },
            destroy: {
                type: 'DELETE',
                dataType: 'json',
                url: '/api/workhistory/job'
            },
            parameterMap: function(data, type) {
                switch(type) {
                    case 'read': return kendo.stringify(data);
                    case 'update': return data.models[0];
                    case 'destroy': return data.models[0];
                }
            }
        },
        error: function(e) {
            if(e.type === 'read') {
                alert('작업이력을 로드하는 중에 에러가 발생했습니다');
                undisplayLoading();
            }
        },
        requestStart: function(e) {
            // by shkoh 20211227: 조회항목이 선택되지 않았다면 요청을 수행하지 않는다
            if(g_searching_value.ids.length === 0) {
                e.preventDefault();
                return;
            }

            // by shkoh 20211227: 조회기간이 선택되지 않았다면 요청을 수행하지 않는다
            if(g_searching_value.startDate === undefined || g_searching_value.endDate === undefined) {
                e.preventDefault();
                return;
            }

            if(e.type === 'read') displayLoading();
        },
        requestEnd: function(e) {
            if(e.type === undefined) {
                console.error(e);
                alert('작업이력을 불러오는데 실패했습니다');
                undisplayLoading();
            } else if(e.type === 'read') {
                undisplayLoading();
            } else if(e.type === 'update') {
                this.read().then(function() {
                    const update_row = g_datasource.get(e.response.index);
                    const page_num = parseInt(g_datasource.indexOf(update_row) / g_datasource.pageSize()) + 1;

                    g_datasource.page(page_num);

                    g_grid.current('tr[data-uid="' + update_row.uid + '"]');
                    g_grid.select('tr[data-uid="' + update_row.uid + '"]');
                    g_grid.table.focus();
                });
            }
        },
        pageSize: 100,
        autoSync: false,
        batch: true,
        schema: {
            model: {
                id: 'index',
                fields: {
                    index: { editable: false },
                    num: { editable: false },
                    equip_id: { editable: false },
                    equip_name: { editable: false },
                    work_dt: { editable: true },
                    work_code: { editable: true },
                    work_type_name: { editable: false },
                    worker_name: { editable: true },
                    text: { editable: true }
                }
            }
        }
    });

    g_grid.setDataSource(g_datasource);
}
/***********************************************************************************************************************/
/* by shkoh 20211224: work history grid end                                                                            */
/***********************************************************************************************************************/
function exportFileName(export_ext) {
    const { startDate, endDate } = g_searching_value;

    const s_date = kendo.toString(startDate, 'yyyyMMdd_HHmm');
    const e_date = kendo.toString(endDate, 'yyyyMMdd_HHmm');

    return '작업이력_' + s_date + '_' + e_date + '.' + export_ext;
}

function exportDocumentHeaderText() {
    const { startDate, endDate } = g_searching_value;

    const s_date = kendo.toString(startDate, 'yyyy/MM/dd HH:mm');
    const e_date = kendo.toString(endDate, 'yyyy/MM/dd HH:mm');

    return '조회기간: ' + s_date + ' ~ ' + e_date;
}

function exportExcel(isAllPages) {
    const hasData = g_datasource.total();
    if(hasData === 0) {
        alert('엑셀 내보내기할 데이터가 존재하지 않습니다.');
        return;
    }

    displayLoading();

    setTimeout(function() {
        g_grid.options.excel.allPages = isAllPages;
        g_grid.saveAsExcel();
    });
}

function exportPDF(isAllPages) {
    const hasData = g_datasource.total();
    if(hasData === 0) {
        alert('PDF로 내보내기할 데이터가 존재하지 않습니다');
        return;
    }

    displayLoading();

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

    g_grid.columns.forEach(function(c, idx, columns) {
        // by shkoh 20211228: 마지막 컬럼은 Editor 부분임으로 제외함
        if(idx < columns.length - 1 || c.title !== undefined) {
            head_data[0][c.field] = c.title.normalize('NFC');
        }
    });

    return head_data;
}

function getBodyDataForPDF(isAllPages) {
    const body_data = [];

    const start_index = isAllPages ? 0 : (g_datasource.page() - 1) * g_datasource.pageSize();
    const data = isAllPages ? g_datasource.data() : g_datasource.view();

    data.forEach(function(d, idx) {
        const row = [];

        const index = start_index + (idx + 1);
        
        row.push({
            content: index
        }, {
            content: d.equip_name
        }, {
            content: d.work_dt
        }, {
            content: d.work_type_name
        }, {
            content: d.worker_name
        }, {
            content: d.text
        });

        body_data.push(row);
    });

    return body_data;
}

function saveAsPDF(headData, bodyData) {
    const page_header_string = exportDocumentHeaderText();

    const pdf = new jsPDF({
        orientation: 'p',
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
            fontSize: 8,
            lineColor: [ 12, 12, 12 ],
            lineWidth: 0.08,
            valign: 'middle'
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
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 34 },
            2: { cellWidth: 28 },
            3: { cellWidth: 18 },
            4: { cellWidth: 18 },
            5: { cellWidth: 'wrap' }
        },
        didDrawPage: function(data) {
            pdf.setFontSize(8);
            pdf.setFontStyle('bold');
            pdf.setTextColor('#303030');

            pdf.text(page_header_string, data.settings.margin.left, 8);

            const footter_text = pdf.internal.getNumberOfPages();
            const pdf_page_size = pdf.internal.pageSize;
            const pdf_page_width = pdf_page_size.width ? pdf_page_size.width : pdf_page_size.getWidth();
            const pdf_page_height = pdf_page_size.height ? pdf_page_size.height : pdf_page_size.getHeight();

            pdf.text(footter_text.toString(), pdf_page_width / 2 - 3, pdf_page_height - 8);
        }
    });

    const export_filename = exportFileName('pdf');
    pdf.save(export_filename, { returnPromise: true }).then(function() {
        undisplayLoading();
    });
}

/***********************************************************************************************************************/
/* by shkoh 20211227: inline function start                                                                            */
/***********************************************************************************************************************/
function displayLoading() {
    kendo.ui.progress($(document.body), true);
}

function undisplayLoading() {
    setTimeout(function() {
        kendo.ui.progress($(document.body), false);
    });
}

function addWorkReport(info) {
    $.ajax({
        async: true,
        type: 'POST',
        dataType: 'json',
        url: '/api/workhistory/work',
        data: {
            equip_id: parseInt(info.id.substring(2)),
            work_dt: kendo.toString(g_date_inst.GetDate(), 'yyyy-MM-dd HH:00'),
            work_code: g_type_inst.value(),
            worker_name: $('#worker-name').val(),
            text: $('#working-memo').val()
        }
    }).done(function(result) {
        alert(result.msg);

        $('#modal-dialog-add-item').modal('hide');

        g_datasource.read().then(function() {
            const update_row = g_datasource.get(result.insertId);

            if(update_row !== undefined) {
                const page_num = parseInt(g_datasource.indexOf(update_row) / g_datasource.pageSize()) + 1;
    
                g_datasource.page(page_num);
    
                g_grid.current('tr[data-uid="' + update_row.uid + '"]');
                g_grid.select('tr[data-uid="' + update_row.uid + '"]');
                g_grid.table.focus();
            }
        });
    }).fail(function(err) {
        console.error(err.responseText);
        alert('작업이력 등록에 실패했습니다. 다시 확인 바랍니다');
    })
}
/***********************************************************************************************************************/
/* by shkoh 20211227: inline function end                                                                              */
/***********************************************************************************************************************/