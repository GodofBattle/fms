let g_work_history_grid = undefined;
let g_work_history_datasource = undefined;

let g_date_inst = undefined;
let g_type_inst = undefined;

let g_filter_date_inst = undefined;

$(window).on('resize', function() {
    resizeWindow();
});

$(function() {
    createWorkHistoryGrid();
    createWorkHistoryDataSource();
    
    initModalDate();
    initModalType();

    $('#add-item').on('click', function() {
        $('#modal-dialog-add-item').modal({ keyboard: true, show: true });
    });

    $('#modal-dialog-add-item').on('show.bs.modal', function() {
        // by shkoh 20211222: 작업추가 Dialog가 보여질 때, 해당 값들을 모두 초기화함
        g_date_inst.ResetDate(new Date());
        g_type_inst.value('WK001');
        $('#worker-name').val('');
        $('#working-memo').val('');
    });

    $('#btn-modal-add').on('click', function() {
        const w_n = $('#worker-name').val();

        if(w_n.length === 0) {
            alert('작업자를 입력하세요');
            $('#worker-name').focus();
            return;
        }

        addWorkReport();
    });
});

function resizeWindow() {
    kendo.resize($('#work-history-grid'));
}

function createWorkHistoryGrid() {
    g_work_history_grid = $('#work-history-grid').kendoGrid({
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
                field: 'work_dt',
                title: '작업일자',
                width: '15%',
                filterable: {
                    cell: {
                        template: function(arg) {
                            const _date_id = 'filter_work_dt';
                            arg.element[0].id = _date_id;

                            g_filter_date_inst = new DatePicker('#' + _date_id, {
                                period: 'month',
                                startDate: new Date(),
                                onFilter: function(new_date) {
                                    const filter_date = kendo.toString(new_date, 'yyyy/MM');
                                    const new_filter = { field: 'work_dt', operator: 'startswith', value: filter_date };

                                    let _filter = g_work_history_datasource.filter();

                                    if(_filter) {
                                        let has_update = false;
                                        _filter.filters.map(function(f) {
                                            if(f.field === 'work_dt' && f.value !== filter_date) {
                                                has_update = true;
                                                f.value = filter_date;
                                            }
                                        });

                                        if(!has_update) _filter.filters.push(new_filter);
                                    } else {
                                        _filter = [ new_filter ];
                                    }

                                    g_work_history_datasource.filter(_filter);
                                }
                            });

                            g_filter_date_inst.CreateDatePicker();
                        },
                        showOperators: false,
                        inputWidth: '100%'
                    }
                },
                editor: function(container, options) {
                    const input = $('<input id="temp_datepicker" style="width: 100%;" data-bind="value:' + options.field + '" data-id="' + options.model.id + '"/>');
                    input.appendTo(container);
                    const dp = new DatePicker('#temp_datepicker', {
                        period: 'hour',
                        startDate: new Date(options.model[options.field]),
                        showEvent: 'click',
                        onFilter: function(new_date) {
                            const id = $('#temp_datepicker').attr('data-id');
                            const update_date = g_work_history_datasource.get(id);
                            update_date.set('work_dt', kendo.toString(new_date, 'yyyy/MM/dd HH:mm'));
                        }
                    });

                    dp.CreateDatePicker();
                }
            },
            {
                field: 'work_code',
                title: '작업분류',
                width: '10%',
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
                title: '작업자',
                width: '10%',
                filterable: {
                    cell: { operator: 'contains', showOperators: false }
                }
            },
            {
                field: 'text',
                title: '작업내용',
                width: '40%',
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
                width: '15%',
                command: [
                    { name: 'edit', text: { edit: '수정', update: '적용', cancel: '취소' } },
                    { name: 'destroy', text: '삭제' },
                ]
            }
        ]
    }).data('kendoGrid');
}

function createWorkHistoryDataSource() {
    g_work_history_datasource = new kendo.data.DataSource({
        transport: {
            read: {
                type: 'GET',
                dataType: 'json',
                url: function() {
                    return '/api/workhistory/worklist?equip_id=' + $('body').attr('data-id')
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
                    case 'read': return data;
                    case 'update': return data.models[0];
                    case 'destroy': return data.models[0];
                }
            }
        },
        requestEnd: function(e) {
            switch(e.type) {
                case 'update': {
                    this.read().then(function() {
                        const update_row = g_work_history_datasource.get(e.response.index);
                        const page_num = parseInt(g_work_history_datasource.indexOf(update_row) / g_work_history_datasource.pageSize()) + 1;

                        g_work_history_datasource.page(page_num);

                        g_work_history_grid.current('tr[data-uid="' + update_row.uid + '"]');
                        g_work_history_grid.select('tr[data-uid="' + update_row.uid + '"]');
                        g_work_history_grid.table.focus();
                    });
                    break;
                }
            }
        },
        pageSize: 20,
        autoSync: false,
        batch: true,
        schema: {
            model: {
                id: 'index',
                fields: {
                    index: { editable: false },
                    equip_id: { editable: false },
                    work_dt: { editable: true },
                    work_code: { editable: true },
                    work_type_name: { editable: false },
                    worker_name: { editable: true },
                    text: { editable: true }
                }
            }
        }
    });

    g_work_history_grid.setDataSource(g_work_history_datasource);
}

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

function addWorkReport() {
    $.ajax({
        async: true,
        type: 'POST',
        dataType: 'json',
        url: '/api/workhistory/work',
        data: {
            equip_id: $('body').attr('data-id'),
            work_dt: kendo.toString(g_date_inst.GetDate(), 'yyyy-MM-dd HH:00'),
            work_code: g_type_inst.value(),
            worker_name: $('#worker-name').val(),
            text: $('#working-memo').val()
        }
    }).done(function(result) {
        alert(result.msg);

        $('#modal-dialog-add-item').modal('hide');

        g_work_history_datasource.read().then(function() {
            const update_row = g_work_history_datasource.get(result.insertId);
            const page_num = parseInt(g_work_history_datasource.indexOf(update_row) / g_work_history_datasource.pageSize()) + 1;

            g_work_history_datasource.page(page_num);

            g_work_history_grid.current('tr[data-uid="' + update_row.uid + '"]');
            g_work_history_grid.select('tr[data-uid="' + update_row.uid + '"]');
            g_work_history_grid.table.focus();
        });
    }).fail(function(err) {
        console.error(err.responseText);
        alert('작업이력 등록에 실패했습니다. 다시 확인 바랍니다');
    })
}