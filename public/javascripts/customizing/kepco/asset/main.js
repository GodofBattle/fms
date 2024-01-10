let g_tree_controller = undefined;
let g_criteria_dropdowntree = undefined;
let g_criteria_buttongroup = undefined;
let g_grid = undefined;
let g_data_source = undefined;

let g_grid_index = 1;

const g_searching_value = {
    ids: []
}

const g_criteria_items = [
    { text: '공조', value: 0, criteria: '공조', selected: true },
    { text: '전기', value: 1, criteria: '전기', selected: true },
    { text: '보안', value: 2, criteria: '보안', selected: true },
    { text: '환경', value: 3, criteria: '환경', selected: true },
    { text: '기타(미분류)', value: 4, criteria: '기타', selected: true }
]

$(window).on('resize', function() {
    resizeWindow();
});

$(function() {
    resizeWindow();

    initTreeView();
    initCriteriaButtonGroup();

    initAssetGrid();
    initAssetDataSource();

    $('#search-button').on('click', function(e) {
        if(g_searching_value.ids.length === 0) {
            alert('조회항목을 선택하세요');
            return;
        }

        if(g_criteria_buttongroup.selectedIndices.length === 0) {
            alert('설비종류를 지정하세요');
            return;
        }

        setTimeout(function() {
            g_data_source.data([]);
            
            // by shkoh 20220607: 설비종류 선택에 따른 filter 적용
            if(g_criteria_buttongroup.selectedIndices.length > 0) {
                const checked_items = g_criteria_buttongroup.selectedIndices.map(function(idx) {
                    return { field: 'equip_criteria', operator: 'eq', value: g_criteria_items[idx].criteria };
                });

                g_data_source.filter({ logic: 'or', filters: checked_items });
            } else {
                g_data_source.filter([]);
            }

            g_data_source.page(1);
        });
    });
});

function redrawViewer(msg) {
    // by shkoh 20220607: 기반설비 정보의 내용이 변경되면, 그 때, 해당 내용을 새로 읽어드림
    if(msg.command === 'update' && msg.type === 'equipment') {
        g_data_source.read();
    }
}

/**********************************************************************************************************************************************/
/* by shkoh 20220607: resize window start                                                                                                     */
/**********************************************************************************************************************************************/
function resizeWindow() {
    $('#tree-content').height(calculateTreeContentHeight());
    $('#report-page').height(calculateEquipmentReportContentHeight());

    if(g_grid) g_grid.resize();
}

function calculateTreeContentHeight() {
    // by shkoh 20220607: body에서 padding-top과 padding-bottom의 크기 16을 뺀 tree content의 높이
    const viewer_h = parseFloat(parent['mainViewer'].innerHeight || parent['mainViewer'].clientHeight) - 16;
    const panel_heading_h = parseFloat($('.panel-heading').height());
    const panel_heading_border_h = 6;
    const panel_heading_padding_h = 8;

    return viewer_h - panel_heading_h - panel_heading_border_h - panel_heading_padding_h + 1;
}

function calculateEquipmentReportContentHeight() {
    // by shkoh 20220607: body에서 padding-top과 padding-bottom의 크기 16을 뺀 report grid의 높이
    const viewer_h = parseFloat(parent['mainViewer'].innerHeight || parent['mainViewer'].clientHeight) - 16;
    
    // by shkoh 20220607: '검색조건'의 높이를 계산하여 해당 부분도 뺌
    const header_h = parseFloat($('.panel-header').height());
    const header_border_h = 6;
    const header_padding_h = 11;

    // by shkoh 20220607: '검색결과'의 header의 높이를 계산하여 해당 부분을 뺌
    const panel_heading_h = parseFloat($('.panel-heading').height());
    const panel_heading_border_h = 6;
    const panel_heading_padding_h = 8;

    return viewer_h - header_h - header_border_h - header_padding_h - panel_heading_h - panel_heading_border_h - panel_heading_padding_h;
}
/**********************************************************************************************************************************************/
/* by shkoh 20220607: resize window end                                                                                                       */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20220607: tree start                                                                                                              */
/**********************************************************************************************************************************************/
function initTreeView() {
    g_tree_controller = new TreeViewContent('#tree-content', {
        onCheck: onTreeViewCheck,
    });

    g_tree_controller.CreateTreeView();
}

function onTreeViewCheck(event, treeId, treeNode) {
    g_searching_value.ids = [];

    const checked_tree_nodes = g_tree_controller.GetCheckedNodes();
    checked_tree_nodes.forEach(function(node) {
        const type = node.id.substr(0, 1);
        const id = node.id.substr(2);

        if(type === 'E') {
            g_searching_value.ids.push(id);
        }
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20220607: tree end                                                                                                                */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20220607: button group start                                                                                                      */
/**********************************************************************************************************************************************/
function initCriteriaButtonGroup() {
    g_criteria_buttongroup = $('#asset-criteria').kendoButtonGroup({
        selection: 'multiple',
        items: g_criteria_items
    }).data('kendoButtonGroup');
}
/**********************************************************************************************************************************************/
/* by shkoh 20220607: button group end                                                                                                        */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20220607: asset grid start                                                                                                        */
/**********************************************************************************************************************************************/
function initAssetGrid() {
    g_grid = $('#report-page').kendoGrid({
        autoBind: false,
        toolbar: function(e) {
            const toolbar_element = $('<div id="toolbar"></div>').kendoToolBar({
                resizable: false,
                items: [
                    {
                        id: 'exportExcel',
                        type: 'button',
                        text: '엑셀 내보내기',
                        icon: 'excel',
                        click: exportExcel.bind(this, false)
                    },
                    {
                        id: 'exportPDF',
                        type: 'button',
                        text: 'PDF 내보내기',
                        icon: 'pdf',
                        click: exportPDF.bind(this, false)
                    }
                ]
            });
            
            return toolbar_element;
        },
        noRecords: {
            template:
            '<div style="display:table; width: 100%; height: 100%;">\
                <h3 style="margin: 0px; display: table-cell; vertical-align: middle;">\
                    <span class="label label-default" style="border-radius: 0px;>\
                        해당 조건에 맞는 기반설비정보가 존재하지 않습니다\
                    </span>\
                </h3>\
            </div>'
        },
        selectable: 'row',
        pageable: {
            numeric: false,
            previousNext: false,
            messages: {
                empty: '검색결과 없음',
                display: '검색된 기반설비 수: {2:n0}',
                previous: '이전페이지',
                next: '다음페이지',
                first: '처음페이지',
                last: '마지막페이지',
                morePages: '더 많은 페이지 보기'
            }
        },
        sortable: true,
        groupable: {
            messages: {
                empty: '그룹화할 항목을 이곳으로 드래그 앤 드롭하세요'
            }
        },
        columns: [
            { field: 'index', title: '순번', groupable: false, sortable: false, width: 70, template: function(e) { return g_grid_index++; } },
            {
                field: 'equip_criteria',
                title: '기반설비분류',
                menu: false,
                width: 90,
                sortable: {
                    initialDirection: 'asc',
                    compare: criteriaSort
                },
                groupable: {
                    sort: {
                        compare: criteriaSort
                    }
                },
                aggregates: [ "count" ],
                groupHeaderTemplate: customCriteriaGroupHeaderTemplate,
                attributes: {
                    'class': 'asset_use_#:data.bUse#'
                }
            },
            { field: 'equip_type', title: '종류', width: 100, attributes: { 'class': 'asset_use_#:data.bUse#' }, aggregates: [ "count" ], groupHeaderTemplate: customGroupHeaderTemplate },
            { field: 'equip_name', title: '기반설비명', width: 200, attributes: { 'class': 'asset_use_#:data.bUse#' }, aggregates: [ "count" ], groupHeaderTemplate: customGroupHeaderTemplate },
            { field: 'model_name', title: '제품모델명', width: 160, attributes: { 'class': 'asset_use_#:data.bUse#' }, aggregates: [ "count" ], groupHeaderTemplate: customGroupHeaderTemplate },
            { field: 'serial_info', title: '시리얼정보', width: 120, groupable: false },
            { field: 'install_date', title: '자산도입일', width: 100, attributes: { 'class': 'asset_use_#:data.bUse#' }, aggregates: [ "count" ], groupHeaderTemplate: customGroupHeaderTemplate },
            { field: 'mgr_name', title: '관리자명', width: 100, attributes: { 'class': 'asset_use_#:data.bUse#' }, aggregates: [ "count" ], groupHeaderTemplate: customGroupHeaderTemplate },
            { field: 'op_name', title: '운영자명', width: 100, attributes: { 'class': 'asset_use_#:data.bUse#' }, aggregates: [ "count" ], groupHeaderTemplate: customGroupHeaderTemplate },
            { field: 'ma_phone', title: '유지보수정보', width: 200, groupable: false, attributes: { 'class': 'asset_use_#:data.bUse#' } },
            { field: 'description', title: '기타정보(위치)', groupable: false, attributes: { 'class': 'asset_use_#:data.bUse#', style: 'font-size: 0.84em; white-space: pre-wrap;' } },
        ],
        dataBinding: function(e) {
            if(e.sender.pager.page() === 1) g_grid_index = 1;
            else g_grid_index = (e.sender.pager.page() - 1) * e.sender.pager.pageSize() + 1;
        },
        dataBound: function(e) {
            // by shkoh 20220607: 기반설비 아이템 더블클릭 시, 자산 설정 페이지 오픈
            const grid = this;
            grid.tbody.find('tr').dblclick(function(e) {
                const dataItem = grid.dataItem(this);
                const equip_id = 'E_' + dataItem.equip_id;
                
                window.top.g_setting_window_opener = window.open('/popup/set/' + equip_id, 'fmsSettingWindow', 'scrollbars=1, menubar=no, resizable=no, location=no, titlebar=no, toolbar=no, status=no, width=800, height=600');
            });

            // by shkoh 20220607: 데이터가 새로 읽히거나, 페이지의 이동이 될 때는 커서를 최상단으로 이동시킴
            e.sender.current(e.sender.tbody.find('tr:first'));

            if(e.sender.dataItems().length > 0) undisplayLoading();
        },
        excelExport: function(e) {
            const file_name = exportFileName('xlsx');
            e.workbook.create = 'ICOMER';
            e.workbook.fileName = file_name;
            e.workbook.sheets[0].name = 'DCIM 기반설비정보';
            
            const column_index_index = e.sender.thead.find('th[data-field="index"]')[0].cellIndex;
            // by shkoh 20220607: 사용안함 장비의 class에 asset_use_N이 등록되어 있음으로 해당 클래스의 index만을 찾아서 사용하지 않는 장비의 값을 받아옴
            const no_used_equipment = e.sender.tbody.find('td[class="asset_use_N"]').parent().find('td[data-field="index"]');
            
            // by shkoh 20220607: export를 할 때 [순번]은 grid 생성시에 임의로 지정하기 때문에 export할 때에 순번을 강제로 넣기 위해서 data_list_index를 사용
            let data_list_index = 1;
            e.workbook.sheets[0].rows.map(function(row, idx, rows) {
                if(row.type === 'data') {
                    if(row.cells[column_index_index]) {
                        row.cells[column_index_index].value = Number(data_list_index);
                    }

                    // by shkoh 20220607: 사용안함 설비목록에서는 text color를 그레이로 표현하여 '사용안함' 설비로 보이게끔 수정함
                    const not_used_equipment_index = no_used_equipment.filter(function() {
                        return Number($(this).text()) === data_list_index;
                    })

                    if(not_used_equipment_index.length > 0) {
                        row.cells.map(function(cell) { cell.color = '#cccccc'; });
                    }

                    data_list_index++;
                }
            });

            undisplayLoading();
        }
    }).data('kendoGrid');
}

function initAssetDataSource() {
    g_data_source = new kendo.data.DataSource({
        autoSync: false,
        transport: {
            read: {
                cache: false,
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json',
                url: '/api/data/asset/kepco',
                data: function() {
                    return g_searching_value
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
                alert('설비정보 조회하는 중에 에러가 발생했습니다');
                undisplayLoading();
            }
        },
        requestStart: function(e) {
            if(e.type === 'read') displayLoading();
        },
        requestEnd: function(e) {
            if(e.type === undefined) {
                console.error(e);
                alert('설비정보 조회 중 에러가 발생했습니다');
                undisplayLoading();
            } else if(e.type === 'read' && e.response) {
                undisplayLoading();
            }
        }
    });
    
    g_grid.setDataSource(g_data_source);
}

function customCriteriaGroupHeaderTemplate(e) {
    const criteria_text = e.value;
    const criteria_count = ' 설비: ' + e.count + '개';

    return criteria_text + criteria_count;
}

function customGroupHeaderTemplate(e) {
    return e.value + ': ' + e.count + '개';
}

function criteriaSort(a, b) {
    const a_order_value = g_criteria_items.find(function(item) { return item.criteria === (a.value || a.equip_criteria); }).value;
    const b_order_value = g_criteria_items.find(function(item) { return item.criteria === (b.value || b.equip_criteria); }).value;

    return a_order_value - b_order_value;
}

function ipPortSort(a, b) {
    // by shkoh 20220607: IP가 존재하지 않는 경우에 '-' 로 표시하는데 해당 기호는 최상단으로 정렬됨으로 해당 데이터만 선별하여 최하단으로 정렬할 필요가 있음
    if(a.value == ' - ' && b.value != ' - ') return 1;
    else if(a.value != ' - ' && b.value == ' - ') return -1;
    else if(a.value == b.value) return 0;
    else {
        const a_ip_port = a.value.split(':');
        const b_ip_port = b.value.split(':');

        if(a_ip_port[0] == b_ip_port[0]) {
            if(parseInt(a_ip_port[1]) > parseInt(b_ip_port[1])) return 1;
            else return -1;
        } else {
            const a_ip = a_ip_port[0].split('.');
            const b_ip = b_ip_port[0].split('.');

            let compare_result = 0;

            for(let idx = 0; idx < 4; idx++) {
                if(parseInt(a_ip[idx]) > parseInt(b_ip[idx])) {
                    compare_result = 1;
                    break;
                } else if(parseInt(a_ip[idx]) < parseInt(b_ip[idx])) {
                    compare_result = -1;
                    break;
                }
            }

            return compare_result;
        }
    };
}

function exportExcel() {
    const hasData = g_data_source.total();
    if(hasData === 0) {
        alert('엑셀 내보내기할 데이터가 존재하지 않습니다');
        return;
    }

    displayLoading();

    setTimeout(function() {
        g_grid.saveAsExcel();
    });
}

function exportPDF() {
    const hasData = g_data_source.total();
    if(hasData === 0) {
        alert('PDF로 내보내기할 데이터가 존재하지 않습니다');
        return;
    }

    displayLoading();

    setTimeout(function() {
        try {
            const head_data = getHeadDataForPDF();
            const body_data = getBodyDataForPDF();

            saveAsPDF(head_data, body_data);
        } catch(err) {
            console.error(err);
            undisplayLoading();
        }
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20220607: asset grid end                                                                                                          */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20220607: inline function start                                                                                                   */
/**********************************************************************************************************************************************/
function displayLoading() {
    kendo.ui.progress($(document.body), true);
}

function undisplayLoading() {
    setTimeout(function() {
        kendo.ui.progress($(document.body), false);
    });
}

function exportFileName(export_ext) {
    const today = new Date();
    const date = today.getFullYear() + ('0' + (today.getMonth() + 1)).slice(-2) + ('0' + today.getDate()).slice(-2);
    const time = ('0' + today.getHours()).slice(-2) + ('0' + today.getMinutes()).slice(-2);
    return 'DCIM_기반설비정보목록_' + date + time + '.' + export_ext;
}

function getHeadDataForPDF() {
    const head_data = [{}];

    g_grid.thead.find('th').map(function(index, ele) {
        const data_field = $(ele).attr('data-field');
        head_data[0][data_field ? data_field : 'field_' + index] = $(ele).text();
    });

    return head_data;
}

function getBodyDataForPDF() {
    const body_data = [];

    g_grid.tbody.find('tr').map(function(index, tr) {
        const row = [];
        const is_not_used = $(tr).find('[class="asset_use_N"]').length;
        
        $(tr).find('td').map(function(index, td) {
            const col_span = Number($(td).attr('colSpan'));
            const row_data = {
                content: $(td).text(),
                colSpan: isNaN(col_span) ? 1 : col_span,
                styles: {}
            }

            if(!isNaN(col_span) || $(td).hasClass('k-group-cell')) {
                row_data['styles']['fillColor'] = [ 229, 229, 229 ];
            }

            if(is_not_used) {
                row_data['styles']['textColor'] = [ 204, 204, 204 ];
            }

            row.push(row_data);
        });

        body_data.push(row);
    });

    return body_data;
}

function saveAsPDF(headData, bodyData) {
    const page_header_string = exportFileName('').split('.')[0];

    const pdf = new jsPDF({
        orientation: 'l',
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
            fontSize: 6,
            lineColor: [ 12, 12, 12 ],
            lineWidth: 0.08
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
        didDrawPage: function(data) {
            // by shkoh 20220607: PDF Page Header
            pdf.setFontSize(8);
            pdf.setFontStyle('bold');
            pdf.setTextColor('#303030');
            
            pdf.text(page_header_string, data.settings.margin.left, 8);
            
            // by shkoh 20220607: PDF Page Footer
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
/**********************************************************************************************************************************************/
/* by shkoh 20220607: inline function end                                                                                                     */
/**********************************************************************************************************************************************/