let g_tree = undefined;
let g_asset_ids = [];

let g_change_grid = undefined;
let g_change_datasource = undefined;
let g_change_date_controller = undefined;

let g_repair_grid = undefined;
let g_repair_datasource = undefined;
let g_repair_date_controller = undefined;

// by shkoh 20210415: modal controller
let g_modal_date = undefined;
let g_modal_worker = undefined;
let g_model_content = undefined;

$(window).on('resize', function() {
    resizeWindow();
});

$(function() {
    $('#tab-panel').kendoTabStrip({
        tabPosition: 'bottom',
        animation: false
    });

    resizeWindow();

    // by shkoh 20210414: Tree 생성
    createTree();

    // by shkoh 20210414: 변경내역 Grid 생성
    createChangeGrid();
    createChangeDataSource();

    // by shkoh 20210414: 수리내역 Grid 생성
    createRepairGrid();
    createRepairDataSource();
    defineRepairEvent();
    
    initModalDate();
    initModalWorker();
    initModalContent();

    $('#asset-tree').parent().mCustomScrollbar({
        theme: 'minimal-dark',
        axis: 'xy',
        scrollbarPosition: 'outside',
        mouseWheel: {
            preventDefault: true
        }
    });
});

/**********************************************************************************************************************************************/
/* by shkoh 20210414: resize window start                                                                                                     */
/**********************************************************************************************************************************************/
function resizeWindow() {
    const panel_h = calculatePanelHeight();
    const tab_h = parseFloat($('#tab-panel > ul').height()) + 1;

    $('.custom-content-tree').height(panel_h);
    $('.custom-content, .custom-grid').height(panel_h - tab_h);

    kendo.resize($('#change-grid, #repair-grid'));
}

function calculatePanelHeight() {
    const viewer_h = parseFloat(parent['mainViewer'].innerHeight || parent['mainViewer'].clientHeight) - 16;
    const content_border_h = 2;
    const panel_heading_h = parseFloat($('.custom-text-panel').height()) + 4;

    return viewer_h - content_border_h - panel_heading_h;
}
/**********************************************************************************************************************************************/
/* by shkoh 20210414: resize window end                                                                                                       */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210414: tree start                                                                                                              */
/**********************************************************************************************************************************************/
function createTree() {
    g_tree = new AssetTree('#asset-tree', {
        onClick: onTreeNodeClick
    });
    g_tree.CreateTree();
}

function onTreeNodeClick(event, treeId, treeNode, clickFlag) {
    if(treeNode === null) return;

    g_asset_ids = getIds(treeNode);

    g_change_datasource.read().then(function() {
        g_change_datasource.page(0);
    });

    g_repair_datasource.read().then(function() {
        g_repair_datasource.page(0);
    })
}

function getIds(node) {
    const list = [ node.data.object_id ];
    g_tree.GetAllChildNodes(node).forEach(function(n) {
        list.push(n.data.object_id);
    });

    return list;
}
/**********************************************************************************************************************************************/
/* by shkoh 20210414: tree end                                                                                                                */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210414: change grid start                                                                                                       */
/**********************************************************************************************************************************************/
function createChangeGrid() {
    g_change_grid = $('#change-grid').kendoGrid({
        resizable: true,
        sortable: true,
        navigatable: true,
        pageable: {
            messages: {
                empty: '변경 내역이 없습니다',
                display: '현재 페이지: {0}건 ~ {1}건 (전체 변경 내역: {2}건)'
            }
        },
        selectable: 'row',
        filterable: { mode: 'row' },
        columns: [
            {
                field: 'update_date',
                width: '10%',
                title: '변경일자',
                filterable: {
                    cell: {
                        template: function(arg) {
                            const update_date_id = 'filter_update_date';
                            arg.element[0].id = update_date_id;

                            g_change_date_controller = new DatePicker('#' + update_date_id, {
                                period: 'month',
                                startDate: new Date(),
                                onFilter: function(new_date) {
                                    // by shkoh 20210415: 생성된 DatePicker에서 일자 선택 시, 해당 날짜(년/월)를 기준으로 시작하는 문자열로 필터링
                                    const filter_date = kendo.toString(new_date, 'yyyy/MM');
                                    const new_filter = { field: 'update_date', operator: 'startswith', value: filter_date };

                                    let _filter = g_change_datasource.filter();
                                    
                                    if(_filter) {
                                        let has_update = false;
                                        _filter.filters.map(function(f) {
                                            if(f.field === 'update_date' && f.value !== filter_date) {
                                                has_update = true;
                                                f.value = filter_date;
                                            }
                                        });

                                        if(!has_update) _filter.filters.push(new_filter);
                                    }
                                    else _filter = [ new_filter ];

                                    g_change_datasource.filter(_filter);
                                }
                            });
                            
                            g_change_date_controller.CreateDatePicker();
                        },
                        showOperators: false,
                        inputWidth: '100%'
                    }
                }
            },
            {
                field: 'object_code_id',
                width: '10%',
                title: '자산구분',
                sortable: false,
                filterable: {
                    cell: {
                        template: function(arg) {
                            arg.element.kendoDropDownList({
                                dataSource: arg.dataSource,
                                dataTextField: 'object_code_name',
                                dataValueField: 'object_code_id',
                                valuePrimitive: true,
                                optionLabel: '',
                                autoWidth: true,
                                messages: {
                                    noData: '자산구분 항목이 존재하지 않습니다'
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
                template: function(dataItem) { return dataItem.object_code_name; }
            },
            { field: 'object_name', width: '20%', title: '자산명', filterable: { cell: { operator: 'contains', showOperators: false } } },
            {
                field: 'event_code_id',
                width: '10%',
                title: '변경구분',
                sortable: false,
                filterable: {
                    cell: {
                        template: function(arg) {
                            arg.element.kendoDropDownList({
                                dataSource: arg.dataSource,
                                dataTextField: 'event_code_name',
                                dataValueField: 'event_code_id',
                                valuePrimitive: true,
                                optionLabel: '',
                                autoWidth: true,
                                messages: {
                                    noData: '변경구분 항목이 존재하지 않습니다'
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
                template: function(dataItem) { return dataItem.event_code_name; }
            },
            {
                field: 'item_name',
                width: '10%',
                title: '변경항목',
                filterable: {
                    cell: {
                        template: function(arg) {
                            arg.dataSource.sort({ field: 'item_name', dir: 'asc' });
                            arg.element.kendoDropDownList({
                                dataSource: arg.dataSource,
                                dataTextField: 'item_name',
                                dataValueField: 'item_name',
                                valuePrimitive: true,
                                optionLabel: ' ',
                                autoWidth: true,
                                messages: {
                                    noData: '변경항목이 존재하지 않습니다'
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
            },
            { field: 'item_before_data', width: '20%', title: '변경 전', filterable: { cell: { operator: 'contains', showOperators: false } } },
            { field: 'item_after_data', width: '20%', title: '변경 후', filterable: { cell: { operator: 'contains', showOperators: false } } }
        ]
    }).data('kendoGrid');
}

function createChangeDataSource() {
    g_change_datasource = new kendo.data.DataSource({
        transport: {
            read: {
                type: 'GET',
                cache: false,
                dataType: 'json',
                url: function() {
                    return '/api/inventory/change?ids=' + g_asset_ids.toString();
                }
            }
        },
        pageSize: 100,
        autoSync: false,
        batch: true,
        schema: {
            model: {
                id: 'id',
                fields: {
                    id: { editable: false },
                    object_id: { editable: false },
                    object_name: { editable: false },
                    update_date: { editable: false },
                    object_code_id: { editable: false },
                    object_code_name: { editable: false },
                    event_code_id: { editable: false },
                    event_code_name: { editable: false },
                    item_name: { editable: false },
                    item_before_data: { editable: false },
                    item_after_data: { editable: false }
                }
            }
        }
    });

    g_change_grid.setDataSource(g_change_datasource);
}
/**********************************************************************************************************************************************/
/* by shkoh 20210414: change grid end                                                                                                         */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210414: repair grid start                                                                                                       */
/**********************************************************************************************************************************************/
function createRepairGrid() {
    g_repair_grid = $('#repair-grid').kendoGrid({
        resizable: true,
        sortable: true,
        navigatable: true,
        pageable: {
            messages: {
                empty: '수리 내역이 없습니다',
                display: '현재 페이지: {0}건 ~ {1}건 (전체 수리 내역: {2}건)'
            }
        },
        editable: {
            mode: 'inline',
            createAt: 'top',
            confirmation: '해당 자산 수리내역을 삭제하시겠습니까?'
        },
        selectable: 'row',
        filterable: { mode: 'row' },
        columns: [
            {
                field: 'complete_date',
                width: '10%',
                title: '수리일자',
                editor: function(container, options) {
                    const input = $('<input id="temp_dp" style="width: 100%" data-bind="value:' + options.field + '" data-id="' + options.model.id + '"/>'); 
                    input.appendTo(container);
                    const dp = new DatePicker('#temp_dp', {
                        period: 'day',
                        startDate: new Date(options.model[options.field]),
                        showEvent: 'click',
                        onFilter: function(new_date) {
                            const id = $('#temp_dp').attr('data-id');
                            const update_date = g_repair_datasource.get(id);
                            update_date.set('complete_date', kendo.toString(new_date, 'yyyy/MM/dd'));
                        }
                    });

                    dp.CreateDatePicker();
                },
                filterable: {
                    cell: {
                        template: function(arg) {
                            const _date_id = 'filter_repair_date';
                            arg.element[0].id = _date_id;

                            g_repair_date_controller = new DatePicker('#' + _date_id, {
                                period: 'month',
                                startDate: new Date(),
                                onFilter: function(new_date) {
                                    // by shkoh 20210415: 생성된 DatePicker에서 일자 선택 시, 해당 날짜(년/월)를 기준으로 시작하는 문자열로 필터링
                                    const filter_date = kendo.toString(new_date, 'yyyy/MM');
                                    const new_filter = { field: 'complete_date', operator: 'startswith', value: filter_date };

                                    let _filter = g_repair_datasource.filter();
                                    
                                    if(_filter) {
                                        let has_update = false;
                                        _filter.filters.map(function(f) {
                                            if(f.field === 'complete_date' && f.value !== filter_date) {
                                                has_update = true;
                                                f.value = filter_date;
                                            }
                                        });

                                        if(!has_update) _filter.filters.push(new_filter);
                                    }
                                    else _filter = [ new_filter ];

                                    g_repair_datasource.filter(_filter);
                                }
                            });
                            
                            g_repair_date_controller.CreateDatePicker();
                        },
                        showOperators: false,
                        inputWidth: '100%'
                    }
                }
            },
            { field: 'object_name', width: '18%', title: '자산명', filterable: { cell: { operator: 'contains', showOperators: false } } },
            {
                field: 'complete_worker_id',
                width: '12%',
                title: '담당자',
                sortable: false,
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
                                    url: '/api/inventory/worker'
                                }
                            },
                            sort: { field: 'name', dir: 'asc' }
                        },
                        dataTextField: 'name',
                        dataValueField: 'id',
                        filter: 'contains',
                        messages: {
                            noData: '선택할 항목이 없습니다'
                        },
                        autoWidth: true,
                        optionLabelTemplate: '선택안함',
                        template: '#: name # | #: company_name #',
                        valueTemplate: '#: name # | #: company_name #'
                    });
                },
                filterable: {
                    cell: {
                        template: function(arg) {
                            arg.element.kendoDropDownList({
                                dataSource: arg.dataSource,
                                dataTextField: 'complete_worker_name',
                                dataValueField: 'complete_worker_id',
                                valuePrimitive: true,
                                optionLabel: '',
                                autoWidth: true,
                                messages: {
                                    noData: '담당자가 존재하지 않습니다'
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
                template: '#: complete_worker_name #'
            },
            {
                field: 'complete_content',
                width: '40%',
                title: '수리내용',
                sortable: false,
                editor: function(container, options) {
                    const input = $('<textarea data-bind="value:' + options.field + '"></textarea>');
                    input.appendTo(container);
                    input.kendoTextArea({
                        placeholder: '수리내역 작성(최대 500자)',
                        maxLength: 500,
                        rows: 5,
                        cols: 100
                    });
                },
                attributes: { style: 'white-space: pre-wrap;' },
                filterable: { cell: { operator: 'contains', showOperators: false } }
            },
            { width: '10%', command: [
                { name: 'edit', text: { edit: '수정', update: '적용', cancel: '취소' } },
                { name: 'destroy', text: '삭제' }
            ] }
        ],
        beforeEdit: function(e) {
            if(e.model.isNew()) {
                console.log('add');
            }
        }
    }).data('kendoGrid');
}

function createRepairDataSource() {
    g_repair_datasource = new kendo.data.DataSource({
        transport: {
            read: {
                type: 'GET',
                cache: false,
                dataType: 'json',
                url: function() {
                    return '/api/inventory/repair?ids=' + g_asset_ids.toString();
                }
            },
            create: {
                type: 'POST',
                dataType: 'json',
                url: '/api/inventory/repair'
            },
            update: {
                type: 'PATCH',
                dataType: 'json',
                url: '/api/inventory/repair'
            },
            destroy: {
                type: 'DELETE',
                dataType: 'json',
                url: '/api/inventory/repair'
            },
            parameterMap: function(data, type) {
                switch(type) {
                    case 'read': return data;
                    case 'create': return data.models[0];
                    case 'update': return data.models[0];
                    case 'destroy': return data.models[0];
                }
            }
        },
        requestEnd: function(e) {
            switch(e.type) {
                case 'update': {
                    this.read().then(function() {
                        const update_row = g_repair_datasource.get(e.response.id);
                        const page_num = parseInt(g_repair_datasource.indexOf(update_row) / g_repair_datasource.pageSize()) + 1;

                        g_repair_datasource.page(page_num);
                        
                        g_repair_grid.current('tr[data-uid="' + update_row.uid + '"]');
                        g_repair_grid.select('tr[data-uid="' + update_row.uid + '"]');
                        g_repair_grid.table.focus();
                    });
                    break;
                }
            }
        },
        pageSize: 100,
        autoSync: false,
        batch: true,
        change: function(e) {
            if(e.action === 'itemchange') {
                console.log(e);
            }
        },
        schema: {
            model: {
                id: 'id',
                fields: {
                    id: { editable: false },
                    object_id: { editable: false },
                    object_name: { editable: false },
                    complete_date: { editable: true },
                    complete_worker_id: { editable: true },
                    complete_worker_name: { editable: false },
                    complete_content: { editable: true }
                }
            }
        }
    });

    g_repair_grid.setDataSource(g_repair_datasource);
}

function defineRepairEvent() {
    $('#add-repair').on('click', function() {
        const selected_tree_node = g_tree.GetSelectedNode();
        if(selected_tree_node === undefined) {
            alert('자산목록에서 수리 내역을 작성할 자산을 선택하세요');
            return;
        } else if(selected_tree_node.data.object_code_id === 'I2000') {
            alert('위치자산에는 수리 내역을 추가할 수 없습니다\n실 설비자산을 선택하세요');
            return;
        }

        $('#add-repair-popup').modal({ keyboard: true, show: true });

        // by shkoh 20210416: 자산 추가 버튼 클릭 시, 선택한 노드의 정보를 불러옴
        let node_name = ''
        const p_node = selected_tree_node.getParentNode();
        if(p_node) node_name = p_node.name + ' >> '
        $('#repair_object_name').text(node_name + selected_tree_node.name);
    });

    $('#add-repair-popup').on('show.bs.modal', function() {
        // by shkoh 20210416: 자산 수리내역 추가 팝업이 발생할 때, 관련된 정보를 모두 초기화함
        g_modal_date.ResetDate(new Date());
        g_modal_worker.value(-1);
        g_modal_textarea.value('');
    });

    $('#add-repair-popup').on('hide.bs.modal', function() {
        // by shkoh 20210416: 자산 수리내역 추가 팝업이 닫힐 때, 팝업 내, 자산명을 초기화함
        $('#repair_object_name').text('');
    });

    $('#btn-save-repair').on('click', function() {
        const selected_node = g_tree.GetSelectedNode();
        if(selected_node === undefined) {
            alert('자산목록에서 수리 내역을 작성할 자산을 선택하세요');
            return;
        }

        if(g_modal_worker.selectedIndex === -1) {
            alert('담당자를 지정하세요');
            return;
        }

        $.ajax({
            async: true,
            type: 'POST',
            dataType: 'json',
            url: '/api/inventory/repair',
            data: {
                object_id: selected_node.id,
                complete_date: kendo.toString(g_modal_date.GetDate(), 'yyyy/MM/dd'),
                complete_worker_id: g_modal_worker.dataItem().id,
                complete_content: g_modal_textarea.value()
            }
        }).done(function(xhr) {
            alert('자산의 수리내역 등록이 완료됐습니다');

            $('#add-repair-popup').modal('hide');
            g_repair_datasource.read().then(function() {
                const update_row = g_repair_datasource.get(xhr.insertId);
                const page_num = parseInt(g_repair_datasource.indexOf(update_row) / g_repair_datasource.pageSize()) + 1;

                g_repair_datasource.page(page_num);
                
                g_repair_grid.current('tr[data-uid="' + update_row.uid + '"]');
                g_repair_grid.select('tr[data-uid="' + update_row.uid + '"]');
                g_repair_grid.table.focus();
            });
        }).fail(function(err) {
            console.error(err);
            alert('자산 수리내역 등록에 실패했습니다');
        });
    });
}

function initModalDate() {
    g_modal_date = new DatePicker('#repair_complete_date', {
        period: 'day',
        startDate: new Date(),
        // by shkoh 20210503: 수리내역 추가 시, 캘린더에서 [특정일]을 선택하고 창 닫는게 귀찮아서 닫게 해달라고 요청함
        // by shkoh 20210503: onFilter 기능 활성화 시에 캘린더에서 [특정일] 선택 완료시에 자동으로 창이 닫히게 됨
        onFilter: function() {}
    });
    
    g_modal_date.CreateDatePicker();
}

function initModalWorker() {
    g_modal_worker = $('#repair_complete_worker').kendoDropDownList({
        dataSource: {
            transport: {
                read: {
                    type: 'GET',
                    dataType: 'json',
                    url: '/api/inventory/worker'
                }
            },
            sort: { field: 'name', dir: 'asc' },
            schema: {
                models: {
                    id: 'id',
                    fields: {
                        id: { editable: false },
                        name: { editable: false },
                        company_name: { editable: false }
                    }
                }
            }
        },
        messages: {
            noData: '선택할 항목이 없습니다'
        },
        template: '#: name # | #: company_name #',
        valueTemplate: '#: name # | #: company_name #'
    }).data('kendoDropDownList');
}

function initModalContent() {
    g_modal_textarea = $('#repair_complete_content').kendoTextArea({
        placeholder: '수리내역 작성(최대 500자)',
        maxLength: 500,
        rows: 10,
        cols: 100
    }).data('kendoTextArea');
}
/**********************************************************************************************************************************************/
/* by shkoh 20210414: repair grid end                                                                                                         */
/**********************************************************************************************************************************************/
