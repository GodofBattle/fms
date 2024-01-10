let g_company_grid = undefined;
let g_company_datasource = undefined;

let g_worker_grid = undefined;
let g_worker_datasource = undefined;

let g_model_grid = undefined;
let g_model_datasource = undefined;

let g_network_grid = undefined;
let g_network_datasource = undefined;

let g_power_grid = undefined;
let g_power_datasource = undefined;

$(window).on('resize', function() {
    resizeWindow();
});

$(function() {
    $('#tab-panel').kendoTabStrip({
        tabPosition: 'bottom',
        animation: false
    });

    resizeWindow();
    
    // by shkoh 20210216: 자산 | 업체관리
    createCompanyGrid();
    createCompanyDataSource();
    defineCompanyEvent();

    // by shkoh 20210216: 자산 | 담당자관리
    createWorkerCode();
    createWorkerCompany();
    createWorkerGrid();
    createWorkerDataSource();
    defineWokerEvent();

    // by shkoh 20210217: 자산 | 모델관리
    createModelCompany();
    createModelGrid();
    createModelDataSource();
    
    createNetworkType();
    createNetworkSpeed();
    createModelNetworkGrid();
    createModelNetworkDataSource();

    createModelPowerGrid();
    createModelPowerDataSource();
    
    defineModelEvent();

    // by shkoh 20210216: 전화번호 형식 입력 시 자동완성으로 활용
    $('#telephone, #fax, #worker-telephone, #worker-phone').on('keyup', function(evt) {
        evt = evt | window.event;
        let _val = this.value.trim();
        this.value = autoHypen(_val);
    });

    // by shkoh 20210218: 숫자 입력 시, 숫자 범위 내에서만 입력 가능하도록 함
    $('#model-rack-unit, #network-port, #power-voltage, #power-current, #power-watt, #power-count').on('input', checkRangeInputNubmer);

    // by shkoh 20210217: 알림 이벤트 팝업이 닫힐 때, 문구를 초기화
    $('#event-popup').on('hide.bs.modal', function() {
        $('#event-message').text('');
    });
});

/**********************************************************************************************************************************************/
/* by shkoh 20210209: resize window start                                                                                                     */
/**********************************************************************************************************************************************/
function resizeWindow() {
    const panel_h = calculatePanelHeight();
    
    $('.custom-grid').height(panel_h);
    $('.custom-grid-half-height').height((panel_h / 2) - 23);

    if(g_company_grid) g_company_grid.resize();
    if(g_worker_grid) g_worker_grid.resize();
    if(g_model_grid) g_model_grid.resize();
    if(g_network_grid) g_network_grid.resize();
    if(g_power_grid) g_power_grid.resize();
}

function calculatePanelHeight() {
    const viewer_h = parseFloat(parent['mainViewer'].innerHeight || parent['mainViewer'].clientHeight) - 16;
    const content_border_h = 2;
    const panel_heading_h = parseFloat($('.custom-text-panel').height()) + 4;
    const tab_h = parseFloat($('#tab-panel > ul').height()) + 1;

    return viewer_h - content_border_h - panel_heading_h - tab_h;
}
/**********************************************************************************************************************************************/
/* by shkoh 20210209: resize window end                                                                                                       */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210215: common inline start                                                                                                     */
/**********************************************************************************************************************************************/
function eventPopup(message) {
    $('#event-message').text(message);
    $('#event-popup').modal('show');
}

function confirmDelete(message, callback) {
    $('#delete-body').text(message);
    
    $('#delete-popup').modal('show');

    $('#btn-delete').on('click', function() { callback(true); });
    $('#btn-delete-cancel').on('click', function() { callback(false); });
}

function autoHypen(tel) {
    tel = tel.replace(/[^0-9]/g, '');

    if(tel.substring(0, 2) === '02') {
        // by shkoh 20210215: 서울국번으로 시작할 경우
        if(tel.length < 3) return tel;
        else if(tel.length < 6) { return ''.concat(tel.substr(0, 2), '-', tel.substr(2)); }
        else if(tel.length < 10) { return ''.concat(tel.substr(0, 2), '-', tel.substr(2, 3), '-', tel.substr(5)); }
        else return ''.concat(tel.substr(0, 2), '-', tel.substr(2, 4), '-', tel.substr(6, 4));
    } else {
        // by shkoh 20210215: 핸드폰 및 타지역 국번으로 시작할 경우
        if(tel.length < 4) return tel;
        else if(tel.length < 7) { return ''.concat(tel.substr(0, 3), '-', tel.substr(3)); }
        else if(tel.length < 11) { return ''.concat(tel.substr(0, 3), '-', tel.substr(3, 3), '-', tel.substr(6)); }
        else return ''.concat(tel.substr(0, 3), '-', tel.substr(3, 4), '-', tel.substr(7));
    }
}

function checkRangeInputNubmer(evt) {
    evt = evt | window.event;
        
    // by shkoh 20210218: 입력값들을 비교하기 전에 입력값들이 정상적인지 판단
    let _val = Number(this.value);
    if(isNaN(_val)) return;
    
    let _max = Number($(this).attr('max'));
    if(isNaN(_max)) return;
    
    let _min = Number($(this).attr('min'));
    if(isNaN(_min)) return;

    if(_val >= _max) this.value = _max;
    else if(_val <= _min) this.value = _min; 
}
/**********************************************************************************************************************************************/
/* by shkoh 20210215: common inline end                                                                                                       */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210209: company grid start                                                                                                      */
/**********************************************************************************************************************************************/
function defineCompanyEvent() {
    $('#add-company').on('click', addCompany);
    $('#update-company').on('click', updateCompany);
    $('#delete-company').on('click', deleteCompany);

    $('#btn-save-company').on('click', function() {
        const type = $('#btn-save-company').attr('action-type');

        if(type === 'insert') insertCompany();
        else if(type === 'update') modifyCompany();
    });

    $('#edit-company-popup').on('hide.bs.modal', function() {
        clearCompanyInfo();
        $('#btn-save-company').removeAttr('action-type');
    });
}

function createCompanyGrid() {
    g_company_grid = $('#grid-company').kendoGrid({
        resizable: true,
        sortable: true,
        navigatable: true,
        pageable: {
            messages: {
                display: '전체 업체 수: {2}개'
            }
        },
        selectable: 'single',
        filterable: { mode: 'row' },
        columns: [
            { field: 'name', title: '업체명', width: '23%', filterable: { cell: { showOperators: true, operator: 'contains', inputWidth: '100%' } } },
            { field: 'address', title: '주소', width: '35%', filterable: false },
            { field: 'homepage', title: '홈페이지', width: '14%', filterable: false },
            { field: 'telephone', title: '전화번호', width: '14%', filterable: false, template: function(dataItem) { return autoHypen(dataItem.telephone); } },
            { field: 'fax', title: '팩스번호', width: '14%', filterable: false, template: function(dataItem) { return autoHypen(dataItem.fax); } }
        ]
    }).data('kendoGrid');
}

function createCompanyDataSource() {
    g_company_datasource = new kendo.data.DataSource({
        transport: {
            read: {
                type: 'GET',
                dataType: 'json',
                url: '/api/inventory/company'
            },
            create: {
                type: 'POST',
                dataType: 'json',
                url: '/api/inventory/company',
                complete: function() {
                    // by shkoh 20210216: 업체정보가 정상적으로 입력이 되면 팝업을 숨김
                    $('#edit-company-popup').modal('hide');
                }
            },
            update: {
                type: 'PATCH',
                dataType: 'json',
                url: '/api/inventory/company',
                complete: function() {
                    // by shkoh 20210216: 업체정보가 정상적으로 수정을 완료하면 팝업 숨김
                    $('#edit-company-popup').modal('hide');
                }
            },
            destroy: {
                type: 'DELETE',
                dataType: 'json',
                url: '/api/inventory/company',
                complete: function() {
                    // by shkoh 20210215: 모든 작업을 마친 후에, DB에 등록된 데이터를 새롭게 읽어들임
                    g_company_datasource.read();
                }
            },
            parameterMap: function(data, type) {
                if(type === 'read') return data;
                else if(type === 'create' || type === 'update' || type === 'destroy') {
                    return {
                        info: JSON.stringify(data.models[0])
                    }
                }
            }
        },
        requestEnd: function(e) {
            //  by shkoh 20210216: 정상적으로 추가가 됐을 경우에, 추가된 줄로 이동
            if(e.type === 'create' && e.response) {
                g_company_datasource.read().then(function() {
                    // by shkoh 20210216: 신규 추가된 항목의 ID로 데이터를 읽어들임
                    const new_row = g_company_datasource.get(e.response.id);

                    // by shkoh 20210216: 테이블 row의 uid를 통해서 찾음
                    g_company_grid.current('tr[data-uid="' + new_row.uid + '"]');
                    g_company_grid.select('tr[data-uid="' + new_row.uid + '"]');
                    g_company_grid.table.focus();
                });
            }

            if(e.type === 'update' && e.response) {
                g_company_datasource.read().then(function() {
                    // by shkoh 20210216: 신규 추가된 항목의 ID로 데이터를 읽어들임
                    const new_row = g_company_datasource.get(e.response.id);

                    // by shkoh 20210216: 테이블 row의 uid를 통해서 찾음
                    g_company_grid.current('tr[data-uid="' + new_row.uid + '"]');
                    g_company_grid.select('tr[data-uid="' + new_row.uid + '"]');
                    g_company_grid.table.focus();
                });
            }
            
            if(e.type === 'destroy' && e.response) {
                eventPopup('정상적으로 삭제가 되었습니다');
            }
        },
        error: function(e) {
            eventPopup('작업 중 에러가 발생했습니다');
            g_company_datasource.read();
        },
        autoSync: false,
        batch: true,
        pageSize: 100,
        schema: {
            model: {
                id: 'id',
                fields: {
                    id: { validation: { require: true } },
                    name: { validation: { require: true } },
                    address: { validation: { require: true } },
                    homepage: { validation: { require: true } },
                    telephone: { validation: { require: true } },
                    fax: { validation: { require: true } }
                }
            }
        }
    });

    g_company_grid.setDataSource(g_company_datasource);
}

function clearCompanyInfo() {
    $('#name, #address, #homepage, #telephone, #fax').val('');
}

function addCompany() {
    $('#edit-company-popup').modal('show');
    $('#btn-save-company').attr('action-type', 'insert');
}

function updateCompany() {
    const selected_row = g_company_grid.select();
    if(selected_row.length === 0) {
        eventPopup('업체가 선택되지 않았습니다');
        return;
    }

    const info = g_company_grid.dataItem(selected_row);

    $('#name').val(info.name);
    $('#address').val(info.address);
    $('#homepage').val(info.homepage);
    $('#telephone').val(autoHypen(info.telephone));
    $('#fax').val(autoHypen(info.fax));

    $('#edit-company-popup').modal('show');
    $('#btn-save-company').attr('action-type', 'update');
}

function deleteCompany() {
    const selected_row = g_company_grid.select();
    if(selected_row.length === 0) {
        eventPopup('업체가 선택되지 않았습니다');
        return;
    }

    confirmDelete('선택한 업체를 삭제하시겠습니까?', function(confirm) {
        $('#btn-delete').off('click');
        $('#btn-delete-cancel').off('click');

        if(confirm) {
            g_company_grid.removeRow(selected_row);
            g_company_datasource.sync();
        }
    });
}

function insertCompany() {
    const _name = $('#name').val();
    const _address = $('#address').val();
    const _homepage = $('#homepage').val();
    const _telephone = $('#telephone').val().replace(/[^0-9]/g, '');
    const _fax = $('#fax').val().replace(/[^0-9]/g, '');

    if(_name === '') {
        eventPopup('업체명을 입력하세요');
        return;
    }

    g_company_datasource.add({
        name: _name,
        address: _address,
        homepage: _homepage,
        telephone: _telephone,
        fax: _fax
    });

    g_company_datasource.sync();
}

function modifyCompany() {
    const new_data = {
        name: $('#name').val(),
        address: $('#address').val(),
        homepage: $('#homepage').val(),
        telephone: $('#telephone').val().replace(/[^0-9]/g, ''),
        fax: $('#fax').val().replace(/[^0-9]/g, '')
    }

    if(new_data.name === '') {
        eventPopup('업체명을 입력하세요');
        return;
    }

    // by shkoh 20210216: 선택한 항목의 id 추출
    const selected_row = g_company_grid.select();
    const info = g_company_grid.dataItem(selected_row);

    const update_data = g_company_datasource.get(info.id);
    Object.keys(new_data).forEach(function(key) {
        if(new_data[key] !== update_data[key]) {
            update_data.set(key, new_data[key]);
        }
    });

    g_company_datasource.sync();
}
/**********************************************************************************************************************************************/
/* by shkoh 20210209: company grid end                                                                                                        */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210216: worker grid start                                                                                                       */
/**********************************************************************************************************************************************/
function defineWokerEvent() {
    $('#add-worker').on('click', addWorker);
    $('#update-worker').on('click', updateWorker);
    $('#delete-worker').on('click', deleteWorker);

    $('#btn-save-worker').on('click', function() {
        const type = $('#btn-save-worker').attr('action-type');

        if(type === 'insert') insertWorker();
        else if(type === 'update') modifyWorker();
    });

    $('#edit-worker-popup').on('show.bs.modal', function() {
        const company_dropdown_list = $('#worker-company-id').data('kendoDropDownList');
        company_dropdown_list.dataSource.read();
    });

    $('#edit-worker-popup').on('hide.bs.modal', function() {
        clearWorkerInfo();
        $('#btn-save-worker').removeAttr('action-type');
    });
}

function createWorkerCode() {
    $('#worker-code-id').kendoDropDownList({
        dataSource: {
            transport: {
                read: {
                    type: 'GET',
                    dataType: 'json',
                    url: '/api/inventory/codetype?type=W'
                }
            }
        },
        dataTextField: 'name',
        dataValueField: 'id',
        valuePrimitive: true,
        autoWidth: false,
        index: -1,
        messages: {
            noData: '분류목록을 불러올 수 없습니다'
        }
    });
}

function createWorkerCompany() {
    $('#worker-company-id').kendoDropDownList({
        dataSource: {
            transport: {
                read: {
                    type: 'GET',
                    dataType: 'json',
                    url: '/api/inventory/company'
                }
            },
            sort: { field: 'name', dir: 'asc' }
        },
        dataTextField: 'name',
        dataValueField: 'id',
        valuePrimitive: true,
        autoWidth: false,
        index: -1,
        messages: {
            noData: '분류목록을 불러올 수 없습니다'
        }
    });
}

function createWorkerGrid() {
    g_worker_grid = $('#grid-worker').kendoGrid({
        resizable: true,
        sortable: true,
        navigatable: true,
        pageable: {
            messages: {
                display: '전체 담당자 수: {2}명'
            }
        },
        selectable: 'single',
        filterable: { mode: 'row' },
        columns: [
            {
                field: 'code_id',
                title: '담당자 구분',
                width: '15%',
                sortable: {
                    compare: function(a, b) {
                        return a.company_name.localeCompare(b.company_name);
                    }
                },
                filterable: {
                    cell: {
                        template: function(arg) {
                            arg.element.kendoDropDownList({
                                dataSource: arg.dataSource,
                                dataTextField: 'code_name',
                                dataValueField: 'code_id',
                                valuePrimitive: true,
                                optionLabel: '',
                                open: function(e) {
                                    e.sender.dataSource.read();
                                }
                            });
                        },
                        showOperators: false,
                        inputWidth: '100%'
                    }
                },
                template: function(dataItem) { return dataItem.code_name; }
            },
            {
                field: 'company_id',
                title: '업체명',
                width: '20%',
                sortable: {
                    compare: function(a, b) {
                        if(a.company_name === undefined) return 0;
                        if(b.company_name === undefined) return 0;
                        return a.company_name.localeCompare(b.company_name);
                    }
                },
                filterable: {
                    cell: {
                        template: function(arg) {
                            arg.dataSource.sort({ field: 'company_name', dir: 'asc' });
                            arg.element.kendoDropDownList({
                                dataSource: arg.dataSource,
                                dataTextField: 'company_name',
                                dataValueField: 'company_id',
                                valuePrimitive: true,
                                optionLabel: '',
                                open: function(e) {
                                    e.sender.dataSource.read();
                                }
                            });
                        },
                        showOperators: false,
                        inputWidth: '100%'
                    }
                },
                template: function(dataItem) { return dataItem.company_name; }
            },
            { field: 'name', title: '담당자명', width: '20%', filterable: { cell: { showOperators: true, operator: 'contains', inputWidth: '100%' } } },
            { field: 'telephone', title: '전화번호', width: '15%', filterable: false, template: function(dataItem) { return autoHypen(dataItem.telephone); } },
            { field: 'phone', title: '휴대폰', width: '15%', filterable: false, template: function(dataItem) { return autoHypen(dataItem.phone); } },
            { field: 'email', title: '이메일', width: '15%', filterable: false }
        ]
    }).data('kendoGrid');
}

function createWorkerDataSource() {
    g_worker_datasource = new kendo.data.DataSource({
        transport: {
            read: {
                type: 'GET',
                dataType: 'json',
                url: '/api/inventory/worker'
            },
            create: {
                type: 'POST',
                dataType: 'json',
                url: '/api/inventory/worker',
                complete: function() {
                    // by shkoh 20210216: 업체정보가 정상적으로 입력이 되면 팝업을 숨김
                    $('#edit-worker-popup').modal('hide');
                }
            },
            update: {
                type: 'PATCH',
                dataType: 'json',
                url: '/api/inventory/worker',
                complete: function() {
                    // by shkoh 20210216: 업체정보가 정상적으로 수정을 완료하면 팝업 숨김
                    $('#edit-worker-popup').modal('hide');
                }
            },
            destroy: {
                type: 'DELETE',
                dataType: 'json',
                url: '/api/inventory/worker',
                complete: function() {
                    // by shkoh 20210215: 모든 작업을 마친 후에, DB에 등록된 데이터를 새롭게 읽어들임
                    g_worker_datasource.read();
                }
            },
            parameterMap: function(data, type) {
                if(type === 'read') return data;
                else if(type === 'create' || type === 'update' || type === 'destroy') {
                    return {
                        info: JSON.stringify(data.models[0])
                    }
                }
            }
        },
        requestEnd: function(e) {
            //  by shkoh 20210216: 정상적으로 추가가 됐을 경우에, 추가된 줄로 이동
            if((e.type === 'create' || e.type === 'update') && e.response) {
                g_worker_datasource.read().then(function() {
                    // by shkoh 20210217: 신규 추가된 항목의 ID로 데이터를 읽어들임
                    const new_row = g_worker_datasource.get(e.response.id);

                    // by shkoh 20210217: 테이블 row의 uid를 통해서 찾음
                    g_worker_grid.current('tr[data-uid="' + new_row.uid + '"]');
                    g_worker_grid.select('tr[data-uid="' + new_row.uid + '"]');
                    g_worker_grid.table.focus();
                });
            }
            
            if(e.type === 'destroy' && e.response) {
                eventPopup('정상적으로 삭제가 되었습니다');
            }
        },
        error: function(e) {
            eventPopup('작업 중 에러가 발생했습니다');
            g_worker_datasource.read();
        },
        autoSync: false,
        batch: true,
        pageSize: 100,
        schema: {
            model: {
                id: 'id',
                fields: {
                    id: { validation: { require: true } },
                    code_id: { validation: { require: true } },
                    code_name: { validation: { require: true } },
                    company_id: { validation: { require: true } },
                    company_name: { validation: { require: true } },
                    name: { validation: { require: true } },
                    telephone: { validation: { require: true } },
                    phone: { validation: { require: true } },
                    email: { validation: { require: true } }
                }
            }
        }
    });

    g_worker_grid.setDataSource(g_worker_datasource);
}

function clearWorkerInfo() {
    $('#worker-name, #worker-telephone, #worker-phone, #worker-email').val('');
    
    $('#worker-code-id').data('kendoDropDownList').select(-1);
    $('#worker-company-id').data('kendoDropDownList').select(-1);
}

function addWorker() {
    $('#edit-worker-popup').modal('show');
    $('#btn-save-worker').attr('action-type', 'insert');
}

function updateWorker() {
    const selected_row = g_worker_grid.select();
    if(selected_row.length === 0) {
        eventPopup('담당자가 선택되지 않았습니다');
        return;
    }

    const info = g_worker_grid.dataItem(selected_row);

    $('#worker-code-id').data('kendoDropDownList').value(info.code_id);
    $('#worker-company-id').data('kendoDropDownList').value(info.company_id);
    $('#worker-name').val(info.name);
    $('#worker-telephone').val(autoHypen(info.telephone));
    $('#worker-phone').val(autoHypen(info.phone));
    $('#worker-email').val(info.email);

    $('#edit-worker-popup').modal('show');
    $('#btn-save-worker').attr('action-type', 'update');
}

function deleteWorker() {
    const selected_row = g_worker_grid.select();
    if(selected_row.length === 0) {
        eventPopup('담당자가 선택되지 않았습니다');
        return;
    }

    confirmDelete('선택한 담당자를 삭제하시겠습니까?', function(confirm) {
        $('#btn-delete').off('click');
        $('#btn-delete-cancel').off('click');

        if(confirm) {
            g_worker_grid.removeRow(selected_row);
            g_worker_datasource.sync();
        }
    });
}

function insertWorker() {
    const insert_info = {
        code_id: $('#worker-code-id').data('kendoDropDownList').value(),
        company_id: $('#worker-company-id').data('kendoDropDownList').value(),
        name: $('#worker-name').val(),
        telephone: $('#worker-telephone').val().replace(/[^0-9]/g, ''),
        phone: $('#worker-phone').val().replace(/[^0-9]/g, ''),
        email: $('#worker-email').val()
    }

    if(insert_info.code_id === '') {
        eventPopup('담당자 분류를 선택하세요');
        return;
    }

    if(insert_info.company_id === '') {
        eventPopup('업체를 선택하세요');
        return;
    }

    if(insert_info.name === '') {
        eventPopup('담당자명을 입력하세요');
        return;
    }

    g_worker_datasource.add(insert_info);
    g_worker_datasource.sync();
}

function modifyWorker() {
    const update_info = {
        code_id: $('#worker-code-id').data('kendoDropDownList').value(),
        company_id: $('#worker-company-id').data('kendoDropDownList').value(),
        name: $('#worker-name').val(),
        telephone: $('#worker-telephone').val().replace(/[^0-9]/g, ''),
        phone: $('#worker-phone').val().replace(/[^0-9]/g, ''),
        email: $('#worker-email').val()
    }

    if(update_info.code_id === '') {
        eventPopup('담당자 분류를 선택하세요');
        return;
    }

    if(update_info.company_id === '') {
        eventPopup('업체를 선택하세요');
        return;
    }

    if(update_info.name === '') {
        eventPopup('담당자명을 입력하세요');
        return;
    }

    // by shkoh 20210217: 선택한 항목의 id 추출
    const selected_row = g_worker_grid.select();
    const info = g_worker_grid.dataItem(selected_row);

    const select_data = g_worker_datasource.get(info.id);
    Object.keys(update_info).forEach(function(key) {
        if(update_info[key] !== select_data[key]) {
            select_data.set(key, update_info[key]);
        }
    });

    g_worker_datasource.sync();
}
/**********************************************************************************************************************************************/
/* by shkoh 20210216: worker grid end                                                                                                         */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210217: model grid start                                                                                                        */
/**********************************************************************************************************************************************/
function defineModelEvent() {
    $('#add-model').on('click', addModel);
    $('#update-model').on('click', updateModel);
    $('#delete-model').on('click', deleteModel);

    $('#add-network').on('click', addNetwork);
    $('#update-network').on('click', updateNetwork);
    $('#delete-network').on('click', deleteNetwork);

    $('#add-power').on('click', addPower);
    $('#update-power').on('click', updatePower);
    $('#delete-power').on('click', deletePower);

    $('#btn-save-model').on('click', function() {
        const type = $('#btn-save-model').attr('action-type');

        if(type === 'insert') insertModel();
        else if(type === 'update') modifyModel();
    });

    $('#btn-save-network').on('click', function() {
        const type = $('#btn-save-network').attr('action-type');

        if(type === 'insert') insertNetwork();
        else if(type === 'update') modifyNetwork();
    });

    $('#btn-save-power').on('click', function() {
        const type = $('#btn-save-power').attr('action-type');

        if(type === 'insert') insertPower();
        else if(type === 'update') modifyPower();
    });

    $('#edit-model-popup').on('show.bs.modal', function() {
        const model_dropdown_list = $('#model-company-id').data('kendoDropDownList');
        model_dropdown_list.dataSource.read();
    });

    $('#edit-model-popup').on('hide.bs.modal', function() {
        clearModelInfo();
        $('#btn-save-model').removeAttr('action-type');
    });

    $('#edit-network-popup').on('hide.bs.modal', function() {
        clearNetworkInfo();
        $('#btn-save-network').removeAttr('action-type');
    });

    $('#edit-power-popup').on('hide.bs.modal', function() {
        clearPowerInfo();
        $('#btn-save-network').removeAttr('action-type');
    });
}

function createModelCompany() {
    $('#model-company-id').kendoDropDownList({
        dataSource: {
            transport: {
                read: {
                    type: 'GET',
                    dataType: 'json',
                    url: '/api/inventory/company'
                }
            },
            sort: { field: 'name', dir: 'asc' }
        },
        dataTextField: 'name',
        dataValueField: 'id',
        valuePrimitive: true,
        autoWidth: false,
        index: -1,
        messages: {
            noData: '분류목록을 불러올 수 없습니다'
        }
    });
}

function createModelGrid() {
    g_model_grid = $('#grid-model').kendoGrid({
        resizable: true,
        sortable: true,
        navigatable: true,
        pageable: {
            messages: {
                display: '전체 모델 수: {2}개'
            }
        },
        selectable: 'single',
        filterable: { mode: 'row' },
        columns: [
            {
                field: 'name',
                title: '모델명',
                width: '35%',
                filterable: {
                    cell: {
                        showOperators: true,
                        operator: 'contains',
                        inputWidth: '100%'
                    }
                }
            },
            {
                field: 'company_id',
                title: '제조사명',
                width: '35%',
                sortable: {
                    compare: function(a, b) {
                        if(a.company_name === undefined) return 0;
                        if(b.company_name === undefined) return 0;
                        return a.company_name.localeCompare(b.company_name);
                    }
                },
                filterable: {
                    cell: {
                        template: function(arg) {
                            arg.dataSource.sort({ field: 'company_name', dir: 'asc' });                            
                            arg.element.kendoDropDownList({
                                dataSource: arg.dataSource,
                                dataTextField: 'company_name',
                                dataValueField: 'company_id',
                                valuePrimitive: true,
                                optionLabel: '',
                                open: function(e) {
                                    e.sender.dataSource.read();
                                }
                            });
                        },
                        showOperators: false,
                        inputWidth: '100%'
                    }
                },
                template: function(dataItem) { return dataItem.company_name; }
            },
            { field: 'rack_unit', title: '폼 팩터/높이(RU)', width: '30%', filterable: false }
        ],
        change: function(e) {
            g_network_datasource.read();
            g_power_datasource.read();
        }
    }).data('kendoGrid');
}

function createModelDataSource() {
    g_model_datasource = new kendo.data.DataSource({
        transport: {
            read: {
                type: 'GET',
                dataType: 'json',
                url: '/api/inventory/model'
            },
            create: {
                type: 'POST',
                dataType: 'json',
                url: '/api/inventory/model',
                complete: function() {
                    // by shkoh 20210216: 업체정보가 정상적으로 입력이 되면 팝업을 숨김
                    $('#edit-model-popup').modal('hide');
                }
            },
            update: {
                type: 'PATCH',
                dataType: 'json',
                url: '/api/inventory/model',
                complete: function() {
                    // by shkoh 20210216: 업체정보가 정상적으로 수정을 완료하면 팝업 숨김
                    $('#edit-model-popup').modal('hide');
                }
            },
            destroy: {
                type: 'DELETE',
                dataType: 'json',
                url: '/api/inventory/model',
                complete: function() {
                    // by shkoh 20210215: 모든 작업을 마친 후에, DB에 등록된 데이터를 새롭게 읽어들임
                    g_model_datasource.read();
                }
            },
            parameterMap: function(data, type) {
                if(type === 'read') return data;
                else if(type === 'create' || type === 'update' || type === 'destroy') {
                    return {
                        info: JSON.stringify(data.models[0])
                    }
                }
            }
        },
        requestEnd: function(e) {
            //  by shkoh 20210216: 정상적으로 추가가 됐을 경우에, 추가된 줄로 이동
            if((e.type === 'create' || e.type === 'update') && e.response) {
                g_model_datasource.read().then(function() {
                    // by shkoh 20210217: 신규 추가된 항목의 ID로 데이터를 읽어들임
                    const new_row = g_model_datasource.get(e.response.id);
                    
                    // by shkoh 20210217: 테이블 row의 uid를 통해서 찾음
                    g_model_grid.current('tr[data-uid="' + new_row.uid + '"]');
                    g_model_grid.select('tr[data-uid="' + new_row.uid + '"]');
                    g_model_grid.table.focus();
                });
            }
            
            if(e.type === 'destroy' && e.response) {
                eventPopup('정상적으로 삭제가 되었습니다');
            }
        },
        error: function(e) {
            eventPopup('작업 중 에러가 발생했습니다');
            g_model_datasource.read();
        },
        autoSync: false,
        batch: true,
        pageSize: 100,
        schema: {
            model: {
                id: 'id',
                fields: {
                    id: { validation: { require: true } },
                    name: { validation: { require: true } },
                    comapny_id: { validation: { require: true } },
                    comapny_name: { validation: { require: true } },
                    rack_unit: { validation: { require: true } }
                }
            }
        }
    });

    g_model_grid.setDataSource(g_model_datasource);
}

function clearModelInfo() {
    $('#model-name').val('');
    $('#model-rack-unit').val(0);

    $('#model-company-id').data('kendoDropDownList').select(-1);
}

function addModel() {
    $('#edit-model-popup').modal('show');
    $('#btn-save-model').attr('action-type', 'insert');
}

function updateModel() {
    const selected_row = g_model_grid.select();
    if(selected_row.length === 0) {
        eventPopup('모델이 선택되지 않았습니다');
        return;
    }

    const info = g_model_grid.dataItem(selected_row);
    $('#model-name').val(info.name);
    $('#model-company-id').data('kendoDropDownList').value(info.company_id);
    $('#model-rack-unit').val(info.rack_unit);

    $('#edit-model-popup').modal('show');
    $('#btn-save-model').attr('action-type', 'update');
}

function deleteModel() {
    const selected_row = g_model_grid.select();
    if(selected_row.length === 0) {
        eventPopup('모델이 선택되지 않았습니다');
        return;
    }

    confirmDelete('선택한 모델을 삭제하시겠습니까?', function(confirm) {
        $('#btn-delete').off('click');
        $('#btn-delete-cancel').off('click');

        if(confirm) {
            g_model_grid.removeRow(selected_row);
            g_model_datasource.sync();
        }
    });
}

function insertModel() {
    const insert_info = {
        name: $('#model-name').val(),
        company_id: $("#model-company-id").data('kendoDropDownList').value(),
        rack_unit: $('#model-rack-unit').val()
    }

    if(insert_info.name === '') {
        eventPopup('모델명을 입력하세요');
        return;
    }

    if(insert_info.company_id === '') {
        eventPopup('제조사를 선택하세요');
        return;
    }

    if(insert_info.rack_unit === '') {
        eventPopup('폼 팩터/높이(RU)를 지정하세요');
        return;
    }

    g_model_datasource.add(insert_info);
    g_model_datasource.sync();
}

function modifyModel() {
    const update_info = {
        name: $('#model-name').val(),
        company_id: $('#model-company-id').data('kendoDropDownList').value(),
        rack_unit: $('#model-rack-unit').val()
    }

    if(update_info.name === '') {
        eventPopup('모델명을 입력하세요');
        return;
    }

    if(update_info.company_id === '') {
        eventPopup('제조사를 선택하세요');
        return;
    }

    if(update_info.rack_unit === '') {
        eventPopup('폼 팩터/높이(RU)를 지정하세요');
        return;
    }

    // by shkoh 20210218: 선택한 항목의 id 추출
    const selected_row = g_model_grid.select();
    const info = g_model_grid.dataItem(selected_row);

    const select_data = g_model_datasource.get(info.id);
    Object.keys(update_info).forEach(function(key) {
        if(update_info[key] !== select_data[key]) {
            select_data.set(key, update_info[key]);
        }
    });

    g_model_datasource.sync();
}
/**********************************************************************************************************************************************/
/* by shkoh 20210217: model grid end                                                                                                          */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210217: model / network grid start                                                                                              */
/**********************************************************************************************************************************************/
function createNetworkType() {
    $('#network-type').kendoDropDownList({
        dataSource: {
            transport: {
                read: {
                    type: 'GET',
                    dataType: 'json',
                    url: '/api/inventory/codetype?type=NT'
                }
            },
            sort: { field: 'name', dir: 'asc' }
        },
        dataTextField: 'name',
        dataValueField: 'id',
        valuePrimitive: true,
        autoWidth: false,
        index: -1,
        messages: {
            noData: '분류목록을 불러올 수 없습니다'
        }
    });
}

function createNetworkSpeed() {
    $('#network-speed').kendoDropDownList({
        dataSource: {
            transport: {
                read: {
                    type: 'GET',
                    dataType: 'json',
                    url: '/api/inventory/codetype?type=NS'
                }
            },
            sort: { field: 'name', dir: 'asc' }
        },
        dataTextField: 'name',
        dataValueField: 'id',
        valuePrimitive: true,
        autoWidth: false,
        index: -1,
        messages: {
            noData: '분류목록을 불러올 수 없습니다'
        }
    });
}

function createModelNetworkGrid() {
    g_network_grid = $('#grid-network').kendoGrid({
        resizable: true,
        sortable: true,
        navigatable: true,
        pageable: false,
        selectable: 'single',
        columns: [
            { field: 'network_type_name', title: '네트워크 타입', width: '25%' },
            { field: 'network_speed_name', title: '네트워크 속도(Gbps)', width: '25%' },
            { field: 'network_port', title: '포트 수', width: '25%' },
            { width: '25%' }
        ]
    }).data('kendoGrid');
}

function createModelNetworkDataSource() {
    g_network_datasource = new kendo.data.DataSource({
        transport: {
            read: {
                type: 'GET',
                dataType: 'json',
                url: function() {
                    const selected_model = g_model_grid.select();
                    if(selected_model.length === 0) return '/api/inventory/model_network?id=';

                    const selected_info = g_model_grid.dataItem(selected_model);
                    return '/api/inventory/model_network?id=' + selected_info.id;
                }
            },
            create: {
                type: 'POST',
                dataType: 'json',
                url: '/api/inventory/model_network',
                complete: function() {
                    // by shkoh 20210216: 업체정보가 정상적으로 입력이 되면 팝업을 숨김
                    $('#edit-network-popup').modal('hide');
                }
            },
            update: {
                type: 'PATCH',
                dataType: 'json',
                url: '/api/inventory/model_network',
                complete: function() {
                    // by shkoh 20210216: 업체정보가 정상적으로 수정을 완료하면 팝업 숨김
                    $('#edit-network-popup').modal('hide');
                }
            },
            destroy: {
                type: 'DELETE',
                dataType: 'json',
                url: '/api/inventory/model_network',
                complete: function() {
                    // by shkoh 20210215: 모든 작업을 마친 후에, DB에 등록된 데이터를 새롭게 읽어들임
                    g_network_datasource.read();
                }
            },
            parameterMap: function(data, type) {
                if(type === 'read') return data;
                else if(type === 'create' || type === 'update' || type === 'destroy') {
                    return {
                        info: JSON.stringify(data.models[0])
                    }
                }
            }
        },
        requestEnd: function(e) {
            //  by shkoh 20210216: 정상적으로 추가가 됐을 경우에, 추가된 줄로 이동
            if((e.type === 'create' || e.type === 'update') && e.response) {
                g_network_datasource.read().then(function() {
                    // by shkoh 20210217: 신규 추가된 항목의 ID로 데이터를 읽어들임
                    const new_row = g_network_datasource.get(e.response.id);
                    
                    // by shkoh 20210217: 테이블 row의 uid를 통해서 찾음
                    g_network_grid.current('tr[data-uid="' + new_row.uid + '"]');
                    g_network_grid.select('tr[data-uid="' + new_row.uid + '"]');
                    g_network_grid.table.focus();
                });
            }
            
            if(e.type === 'destroy' && e.response) {
                eventPopup('정상적으로 삭제가 되었습니다');
            }
        },
        error: function(e) {
            eventPopup('작업 중 에러가 발생했습니다');
            g_network_datasource.read();
        },
        autoSync: false,
        batch: true,
        schema: {
            model: {
                id: 'id',
                fields: {
                    id: { validation: { require: true } },
                    model_id: { validation: { require: true } },
                    network_type: { validation: { require: true } },
                    network_speed: { validation: { require: true } },
                    network_port: { validation: { require: true } }
                }
            }
        }
    });

    g_network_grid.setDataSource(g_network_datasource);
}

function clearNetworkInfo() {
    $('#network-type').data('kendoDropDownList').select(-1);
    $('#network-speed').data('kendoDropDownList').select(-1);
    $('#network-port').val(0);
}

function addNetwork() {
    const selected_row = g_model_grid.select();
    if(selected_row.length === 0) {
        eventPopup('모델이 선택되지 않았습니다');
        return;
    }
    
    $('#edit-network-popup').modal('show');
    $('#btn-save-network').attr('action-type', 'insert');
}

function updateNetwork() {
    const selected_model = g_model_grid.select();
    if(selected_model.length === 0) {
        eventPopup('모델이 선택되지 않았습니다');
        return;
    }

    const selected_network = g_network_grid.select();
    if(selected_network.length === 0) {
        eventPopup('모델 / 네트워크 정보가 선택되지 않았습니다');
        return;
    }

    const info = g_network_grid.dataItem(selected_network);
    $('#network-type').data('kendoDropDownList').value(info.network_type);
    $('#network-speed').data('kendoDropDownList').value(info.network_speed);
    $('#network-port').val(info.network_port);

    $('#edit-network-popup').modal('show');
    $('#btn-save-network').attr('action-type', 'update');
}

function deleteNetwork() {
    const selected_model = g_model_grid.select();
    if(selected_model.length === 0) {
        eventPopup('모델이 선택되지 않았습니다');
        return;
    }

    const selected_network = g_network_grid.select();
    if(selected_network.length === 0) {
        eventPopup('모델 / 네트워크 정보가 선택되지 않았습니다');
        return;
    }

    confirmDelete('선택한 네트워크 정보를 삭제하시겠습니까?', function(confirm) {
        $('#btn-delete').off('click');
        $('#btn-delete-cancel').off('click');

        if(confirm) {
            g_network_grid.removeRow(selected_network);
            g_network_datasource.sync();
        }
    });
}

function insertNetwork() {
    const insert_info = {
        model_id: g_model_grid.dataItem(g_model_grid.select()).id,
        network_type: $('#network-type').data('kendoDropDownList').value(),
        network_speed: $('#network-speed').data('kendoDropDownList').value(),
        network_port: $('#network-port').val()
    }

    if(insert_info.model_id === undefined) {
        eventPopup('모델을 선택하세요');
        return;
    }

    if(insert_info.network_type === '') {
        eventPopup('네트워크 타입을 선택하세요');
        return;
    }

    if(insert_info.network_speed === '') {
        eventPopup('네트워크 속도를 선택하세요');
        return;
    }

    if(insert_info.network_port === '') {
        eventPopup('네트워크 포트 수를 지정하세요');
        return;
    }

    g_network_datasource.add(insert_info);
    g_network_datasource.sync();
}

function modifyNetwork() {
    const update_info = {
        network_type: $('#network-type').data('kendoDropDownList').value(),
        network_speed: $('#network-speed').data('kendoDropDownList').value(),
        network_port: $('#network-port').val()
    };

    if(update_info.network_type === '') {
        eventPopup('네트워크 타입을 선택하세요');
        return;
    }

    if(update_info.network_speed === '') {
        eventPopup('네트워크 속도를 선택하세요');
        return;
    }

    if(update_info.network_port === '') {
        eventPopup('네트워크 포트 수를 지정하세요');
        return;
    }

    const selected_row = g_network_grid.select();
    const info = g_network_grid.dataItem(selected_row);

    const select_data = g_network_datasource.get(info.id);
    Object.keys(update_info).forEach(function(key) {
        if(update_info[key] !== select_data[key]) {
            select_data.set(key, update_info[key]);
        }
    });

    g_network_datasource.sync();
}
/**********************************************************************************************************************************************/
/* by shkoh 20210217: model / network grid end                                                                                                */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210217: model / power grid start                                                                                                */
/**********************************************************************************************************************************************/
function createModelPowerGrid() {
    g_power_grid = $('#grid-power').kendoGrid({
        resizable: true,
        sortable: true,
        navigatable: true,
        pageable: false,
        selectable: 'single',
        columns: [
            { field: 'power_voltage', title: '전압(V)', width: '25%' },
            { field: 'power_current', title: '전류(A)', width: '25%' },
            { field: 'power_watt', title: '전력(kW)', width: '25%' },
            { field: 'power_count', title: '파워 수', width: '25%' }
        ]
    }).data('kendoGrid');
}

function createModelPowerDataSource() {
    g_power_datasource = new kendo.data.DataSource({
        transport: {
            read: {
                type: 'GET',
                dataType: 'json',
                url: function() {
                    const selected_model = g_model_grid.select();
                    if(selected_model.length === 0) return '/api/inventory/model_power?id=';

                    const selected_info = g_model_grid.dataItem(selected_model);
                    return '/api/inventory/model_power?id=' + selected_info.id;
                }
            },
            create: {
                type: 'POST',
                dataType: 'json',
                url: '/api/inventory/model_power',
                complete: function() {
                    // by shkoh 20210216: 업체정보가 정상적으로 입력이 되면 팝업을 숨김
                    $('#edit-power-popup').modal('hide');
                }
            },
            update: {
                type: 'PATCH',
                dataType: 'json',
                url: '/api/inventory/model_power',
                complete: function() {
                    // by shkoh 20210216: 업체정보가 정상적으로 수정을 완료하면 팝업 숨김
                    $('#edit-power-popup').modal('hide');
                }
            },
            destroy: {
                type: 'DELETE',
                dataType: 'json',
                url: '/api/inventory/model_power',
                complete: function() {
                    // by shkoh 20210215: 모든 작업을 마친 후에, DB에 등록된 데이터를 새롭게 읽어들임
                    g_power_datasource.read();
                }
            },
            parameterMap: function(data, type) {
                if(type === 'read') return data;
                else if(type === 'create' || type === 'update' || type === 'destroy') {
                    return {
                        info: JSON.stringify(data.models[0])
                    }
                }
            }
        },
        requestEnd: function(e) {
            //  by shkoh 20210216: 정상적으로 추가가 됐을 경우에, 추가된 줄로 이동
            if((e.type === 'create' || e.type === 'update') && e.response) {
                g_power_datasource.read().then(function() {
                    // by shkoh 20210217: 신규 추가된 항목의 ID로 데이터를 읽어들임
                    const new_row = g_power_datasource.get(e.response.id);
                    
                    // by shkoh 20210217: 테이블 row의 uid를 통해서 찾음
                    g_power_grid.current('tr[data-uid="' + new_row.uid + '"]');
                    g_power_grid.select('tr[data-uid="' + new_row.uid + '"]');
                    g_power_grid.table.focus();
                });
            }
            
            if(e.type === 'destroy' && e.response) {
                eventPopup('정상적으로 삭제가 되었습니다');
            }
        },
        error: function(e) {
            eventPopup('작업 중 에러가 발생했습니다');
            g_power_datasource.read();
        },
        autoSync: false,
        batch: true,
        schema: {
            model: {
                id: 'id',
                fields: {
                    id: { validation: { require: true } },
                    model_id: { validation: { require: true } },
                    power_voltage: { validation: { require: true } },
                    power_current: { validation: { require: true } },
                    power_watt: { validation: { require: true } },
                    power_count: { validation: { require: true } }
                }
            }
        }
    });
    
    g_power_grid.setDataSource(g_power_datasource);
}

function clearPowerInfo() {
    $('#power-voltage, #power-current, #power-watt, #power-count').val(0);
}

function addPower() {
    const selected_row = g_model_grid.select();
    if(selected_row.length === 0) {
        eventPopup('모델이 선택되지 않았습니다');
        return;
    }

    $('#edit-power-popup').modal('show');
    $('#btn-save-power').attr('action-type', 'insert');
}

function updatePower() {
    const selected_model = g_model_grid.select();
    if(selected_model.length === 0) {
        eventPopup('모델이 선택되지 않았습니다');
        return;
    }

    const selected_power = g_power_grid.select();
    if(selected_power.length === 0) {
        eventPopup('모델 / 전력 정보가 선택되지 않았습니다');
        return;
    }

    const info = g_power_grid.dataItem(selected_power);
    $('#power-voltage').val(info.power_voltage);
    $('#power-current').val(info.power_current);
    $('#power-watt').val(info.power_watt);
    $('#power-count').val(info.power_count);

    $('#edit-power-popup').modal('show');
    $('#btn-save-power').attr('action-type', 'update');
}

function deletePower() {
    const selected_model = g_model_grid.select();
    if(selected_model.length === 0) {
        eventPopup('모델이 선택되지 않았습니다');
        return;
    }

    const selected_power = g_power_grid.select();
    if(selected_power.length === 0) {
        eventPopup('모델 / 전력 정보가 선택되지 않았습니다');
        return;
    }

    confirmDelete('선택한 전력 정보를 삭제하시겠습니까?', function(confirm) {
        $('#btn-delete').off('click');
        $('#btn-delete-cancel').off('click');

        if(confirm) {
            g_power_grid.removeRow(selected_power);
            g_power_datasource.sync();
        }
    });
}

function insertPower() {
    const insert_info = {
        model_id: g_model_grid.dataItem(g_model_grid.select()).id,
        power_voltage: $('#power-voltage').val(),
        power_current: $('#power-current').val(),
        power_watt: $('#power-watt').val(),
        power_count: $('#power-count').val()
    }

    if(insert_info.model_id === undefined) {
        eventPopup('모델을 선택하세요');
        return;
    }

    if(insert_info.power_watt === '') {
        eventPopup('모델의 전력을 지정하세요');
        return;
    }

    if(insert_info.power_count === '') {
        eventPopup('모델의 파워 수를 지정하세요');
        return;
    }

    g_power_datasource.add(insert_info);
    g_power_datasource.sync();
}

function modifyPower() {
    const update_info = {
        power_voltage: $('#power-voltage').val(),
        power_current: $('#power-current').val(),
        power_watt: $('#power-watt').val(),
        power_count: $('#power-count').val()
    }

    if(update_info.power_watt === '') {
        eventPopup('모델의 전력을 지정하세요');
        return;
    }

    if(update_info.power_count === '') {
        eventPopup('모델의 파워 수를 지정하세요');
        return;
    }

    const selected_row = g_power_grid.select();
    const info = g_power_grid.dataItem(selected_row);

    const select_data = g_power_datasource.get(info.id);
    Object.keys(update_info).forEach(function(key) {
        if(update_info[key] !== select_data[key]) {
            select_data.set(key, update_info[key]);
        }
    });

    g_power_datasource.sync();
}
/**********************************************************************************************************************************************/
/* by shkoh 20210217: model / power grid end                                                                                                  */
/**********************************************************************************************************************************************/