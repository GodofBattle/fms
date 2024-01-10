let g_tree = undefined;
let g_tree_popup = undefined;
let g_tree_popup2 = undefined;

let g_date_controller = undefined;

let g_asset_ids = [];
let g_datasource = undefined;

let g_asset_image_list = [];
let g_current_asset_data = undefined;

$('window').on('resize', function() {
    resizeWindow();
});

$(function() {
    resizeWindow();

    // by shkoh 20210405: 자산정보 | 자산목록
    createTree();

    // by shkoh 20210405: 자산정보 | 자산운영정보
    createAssetGrid();
    createAssetDataSource();

    // by shkoh 20210408: 자산정보 | 상세정보
    createModelDropDownList();
    createDateTime();
    createOperatorDropDownList();
    createManagerDropDownList();
    createCompanyDropDownList();
    createImageDropDownList();
    createImageUploder();

    // by shkoh 20210412: 자산정보 | 자산등록 팝업
    createModelDropDownListForPopup();

    // by shkoh 20210412: 자산등록 이벤트
    DefineAssetInsertEvents();

    // by shkoh 20210412: 자산변경 이벤트
    DefineAssetUpdateEvents();
    
    // by shkoh 20210412: 자산삭제 이벤트
    DefineAssetDeleteEvents();

    // by shkoh 20210412: 자산추가 - 상위자산 팝업
    DefineChooseParentAssetForInsert();

    // by shkoh 20210412: 자산상세정보 - 상위자산 팝업
    DefineChooseParentAsset();

    $('#asset-tree, #modal-tree, #asset-detail-content').parent().mCustomScrollbar({
        theme: 'minimal-dark',
        axis: 'yx',
        scrollbarPosition: 'outside',
        mouseWheel: {
            preventDefault: true
        }
    });
});

function displayLoading() {
    kendo.ui.progress($(document.body), true);
}

function undisplayLoading() {
    kendo.ui.progress($(document.body), false);
}

/**********************************************************************************************************************************************/
/* by shkoh 20210412: asset insert start                                                                                                      */
/**********************************************************************************************************************************************/
function DefineAssetInsertEvents() {
    $('#add-asset').on('click', function() {
        $('#add-asset-popup').modal({ keyboard: false, show: true });
    });

    $('#popup-add-object-tree').on('click', function() {
        $('#popup-asset-tree2').modal({ keyboard: false, show: true });
    });

    $('#btn-save-asset').on('click', function() {
        const insert_info = {
            code_id: $('#popup-asset-type').data('kendoDropDownList').value(),
            parent_object_id: $('#popup-add-object-tree').val(),
            name: $('#popup-object-name').val()
        }

        if(insert_info.code_id === '') {
            alert('자산구분을 지정하세요');
            return;
        }

        if(insert_info.parent_object_id === '') {
            alert('상위자산을 지정하세요');
            return;
        }

        if(insert_info.name === '') {
            alert('자산명을 입력하세요');
            return;
        }

        insertAsset(insert_info);
    });

    $('#btn-link2').on('click', function() {
        const selected_node = g_tree_popup2.GetSelectedNode();
        
        $('#popup-parent-name').val(selected_node.name);
        $('#popup-add-object-tree').val(selected_node.id);

        $('#popup-asset-tree2').modal('hide');
    });
}

function DefineChooseParentAssetForInsert() {
    $('#add-asset-popup').on('hide.bs.modal', function() {
        $('#popup-asset-type').data('kendoDropDownList').value('I2000');
        $('#popup-parent-name').val('');
        $('#popup-add-object-tree').val(-1);
        $('#popup-object-name').val('');
    });

    $('#popup-asset-tree2').on('show.bs.modal', function() {
        g_tree_popup2 = new AssetTree('#modal-tree2', {
            selectNodeId: $('#popup-add-object-tree').val()
        });
        g_tree_popup2.CreateTreeWithPlaceItems();
    });

    $('#popup-asset-tree2').on('hide.bs.modal', function() {
        if(g_tree_popup2) {
            g_tree_popup2.DestroyTree();
            g_tree_popup2 = undefined;
        }
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20210412: asset insert end                                                                                                        */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210412: asset update start                                                                                                      */
/**********************************************************************************************************************************************/
function DefineAssetUpdateEvents() {
    $('#update-asset').on('click', function() {
        if(g_current_asset_data === undefined) {
            alert('수정을 위한 자산을 선택하세요');
            return;
        }
        
        updateAsset();
    });

    $('#popup-object-tree').on('click', function() {
        $('#popup-asset-tree').modal({ keyboard: false, show: true, node: $('#popup-object-tree').val() });
    });

    $('#btn-link').on('click', function() {
        const selected_node = g_tree_popup.GetSelectedNode();
        
        $('#object_parent_name').val(selected_node.name);
        $('#popup-object-tree').val(selected_node.id);

        $('#popup-asset-tree').modal('hide');
    });
}

function DefineChooseParentAsset() {
    // by shkoh 20210412: 상위자산 설정하기 위한 팝업: [추가] 팝업에서도 동일하게 동작하도록 수행
    $('#popup-asset-tree').on('show.bs.modal', function() {
        g_tree_popup = new AssetTree('#modal-tree', {
            selectNodeId: $('#popup-object-tree').val()
        });
        g_tree_popup.CreateTreeWithPlaceItems();
    });

    $('#popup-asset-tree').on('hide.bs.modal', function() {
        if(g_tree_popup) {
            g_tree_popup.DestroyTree();
            g_tree_popup = undefined;
        }
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20210412: asset update end                                                                                                      */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210412: asset delete start                                                                                                      */
/**********************************************************************************************************************************************/
function DefineAssetDeleteEvents() {
    $('#delete-asset').on('click', function() {
        if(g_current_asset_data === undefined) {
            alert('삭제를 위한 자산을 선택하세요');
            return;
        }

        const is_confirm = confirm('[자산구분: ' + g_current_asset_data.object_code_name + '] ' + g_current_asset_data.object_name + '로 등록된 자산을 삭제하시겠습니까?');
        if(is_confirm) deleteAsset();
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20210412: asset delete end                                                                                                        */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210405: resize window start                                                                                                     */
/**********************************************************************************************************************************************/
function resizeWindow() {
    const panel_h = calculatePanelHeight();

    $('.custom-content').height(panel_h);
    $('#asset-grid').height(panel_h);
}

function calculatePanelHeight() {
    const viewer_h = parseFloat(parent['mainViewer'].innerHeight || parent['mainViewer'].clientHeight) - 16;
    const content_border_h = 2;
    const panel_heading_h = parseFloat($('.custom-text-panel').height());

    return viewer_h - content_border_h - panel_heading_h;
}
/**********************************************************************************************************************************************/
/* by shkoh 20210405: resize window end                                                                                                       */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210405: tree start                                                                                                              */
/**********************************************************************************************************************************************/
function createTree() {
    g_tree = new AssetTree('#asset-tree', {
        onClick: onTreeNodeClick
    });
    g_tree.CreateTree();
}

function onTreeNodeClick(event, treeId, treeNode, clickFlag) {
    if(treeNode === null) return;

    // by shkoh 20210409: Tree 아이템을 클릭할 때마다 자산 상세내역을 숨김
    $('#asset-detail-content').hide();
    // by shkoh 20210409: 현재 DB에서 가지고 있는 자산의 값을 초기화
    clearAssetDetailValue();

    g_asset_ids = getIds(treeNode);
    g_datasource.read().then(function() {
        if(treeNode.data.object_code_id !== 'I2000') {
            const selecting_row = g_datasource.get(treeNode.id);
            
            const grid = $('#asset-grid').data('kendoGrid');
            grid.current('tr[data-uid="' + selecting_row.uid + '"]');
            grid.select('tr[data-uid="' + selecting_row.uid + '"]');
            grid.table.focus();
        }
    });
}

function getIds(node) {
    const list = [ node.data.object_id ];
    g_tree.GetAllChildNodes(node).forEach(function(n) {
        list.push(n.data.object_id);
    });
    
    return list;
}
/**********************************************************************************************************************************************/
/* by shkoh 20210405: tree end                                                                                                                */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210405: grid start                                                                                                              */
/**********************************************************************************************************************************************/
function createAssetGrid() {
    $('#asset-grid').kendoGrid({
        resizable: true,
        navigatable: true,
        selectable: 'row',
        pageable: {
            numeric: false,
            previousNext: false,
            messages: {
                empty: '선택한 자산 내역이 없습니다',
                display: '선택 자산 수: {2}개'
            }
        },
        sortable: true,
        filterable: { mode: 'row' },
        columnMenu: {
            componentType: 'classic',
            filterable: false,
            sortable: false,
            messages: {
                columns: '항목 보기/숨기기'
            }
        },
        columns: [
            {
                width: 150,
                field: 'object_code_id',
                title: '자산구분',
                sortable: {
                    compare: function(a, b) {
                        if(a.object_code_name === undefined) return 0;
                        if(b.object_code_name === undefined) return 0;
                        return a.object_code_name.localeCompare(b.object_code_name);
                    }
                },
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
                                open: function(e) {
                                    e.sender.dataSource.read();
                                }
                            });
                        },
                        showOperators: false,
                        inputWidth: '100%'
                    }
                },
                menu: false,
                template: function(dataItem) { return dataItem.object_code_name; }
            },
            {
                width: 180,
                field: 'object_parent_id',
                title: '상위자산',
                menu: false,
                sortable: {
                    compare: function(a, b) {
                        if(a.object_parent_name === undefined) return 0;
                        if(b.object_parent_name === undefined) return 0;
                        return a.object_parent_name.localeCompare(b.object_parent_name);
                    }
                },
                filterable: false,
                template: function(dataItem) { return dataItem.object_parent_name; }
            },
            { width: 280, field: 'object_name', title: '자산명', menu: false, filterable: { cell: { showOperators: false, autoWidth: true, operator: 'contains', inputWidth: '100%' } } },
            {
                width: 180,
                field: 'model_name',
                title: '모델명',
                filterable: {
                    cell: {
                        showOperators: false,
                        operator: 'contains',
                        inputWidth: '100%'
                    }
                }
            },
            { width: 150, field: 'inst_date', title: '설치일자', filterable: { cell: { showOperators: false, autoWidth: true, operator: 'contains', inputWidth: '100%' } } },
            { width: 150, field: 'operator_name', title: '운영담당자', filterable: { cell: { showOperators: false, autoWidth: true, operator: 'contains', inputWidth: '100%' } } },
            { width: 150, field: 'manager_name', title: '관리담당자', hidden: true, filterable: { cell: { showOperators: false, autoWidth: true, operator: 'contains', inputWidth: '100%' } } },
            { width: 200, field: 'company_name', title: '협력업체', hidden: true, filterable: { cell: { showOperators: false, autoWidth: true, operator: 'contains', inputWidth: '100%' } } },
        ],
        change: function(e) {
            const selected_rows = this.select();
            const data = this.dataItem(selected_rows[0]);

            applyAssetDetailValue(data);
            showAssetDetailItems(data);
        }
    });
}

function createAssetDataSource() {
    g_datasource = new kendo.data.DataSource({
        transport: {
            read: {
                type: 'GET',
                dataType: 'json',
                cache: false,
                url: function() {
                    return '/api/inventory/assets_list?ids=' + g_asset_ids.toString();
                }
            }
        },
        autoSync: true,
        batch: false,
        schema: {
            model: {
                id: 'object_id',
                fields: {
                    object_id: { editable: false },
                    object_name: { editable: false },
                    object_parent_id: { editable: false },
                    object_parent_name: { editable: false },
                    object_image_name: { editable: false },
                    object_code_id: { editable: false },
                    object_code_name: { editable: false },
                    object_code_type: { editable: false },
                    object_code_icon: { editable: false },
                    company_id: { editable: false },
                    company_name: { editable: false },
                    manager_id: { editable: false },
                    manager_name: { editable: false },
                    model_id: { editable: false },
                    model_name: { editable: false },
                    operator_id: { editable: false },
                    operator_name: { editable: false },
                    mapping_id: { editable: false },
                    mapping_name: { editable: false },
                    inst_date: { editable: false }
                }
            }
        }
    });

    $('#asset-grid').data('kendoGrid').setDataSource(g_datasource);
}
/**********************************************************************************************************************************************/
/* by shkoh 20210405: grid end                                                                                                                */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210405: detail start                                                                                                            */
/**********************************************************************************************************************************************/
function createModelDropDownList() {
    $('#asset-model').kendoDropDownList({
        dataSource: {
            transport: {
                read: {
                    type: 'GET',
                    dataType: 'json',
                    url: '/api/inventory/model'
                }
            }
        },
        dataTextField: 'name',
        dataValueField: 'id',
        optionLabel: { id: null, name: '선택안함' },
        filter: 'contains',
        messages: {
            noData: '선택할 항목이 없습니다'
        }
    });
}

function createDateTime() {
    g_date_controller = new DatePicker('#inst_date', {
        period: 'day',
        startDate: new Date(),
        // by shkoh 20210503: 수리내역 추가 시, 캘린더에서 [특정일]을 선택하고 창 닫는게 귀찮아서 닫게 해달라고 요청함
        // by shkoh 20210503: onFilter 기능 활성화 시에 캘린더에서 [특정일] 선택 완료시에 자동으로 창이 닫히게 됨
        onFilter: function() {}
    });

    g_date_controller.CreateDatePicker();
}

function createOperatorDropDownList() {
    $('#asset-operator').kendoDropDownList({
        dataSource: {
            transport: {
                read: {
                    type: 'GET',
                    dataType: 'json',
                    url: '/api/inventory/worker'
                }
            },
            // by shkoh 20210503: 우리FIS에서는 운영담당자별로 사람을 구분하여 사용하지 않는다
            // filter: {
            //     logic: 'or',
            //     filters: [
            //         { field: 'code_id', operator: 'eq', value: 'I1000' },
            //         { field: 'code_id', operator: 'eq', value: 'I1002' }
            //     ]
            // },
            sort: { field: 'name', dir: 'asc' }
        },
        dataTextField: 'name',
        dataValueField: 'id',
        optionLabel: { id: null, name: '선택안함', value: null },
        filter: 'contains',
        messages: {
            noData: '선택할 항목이 없습니다'
        },
        optionLabelTemplate: '선택안함',
        template: '#: name # | #: company_name #',
        valueTemplate: '#: name # | #: company_name #'
    });
}

function createManagerDropDownList() {
    $('#asset-manager').kendoDropDownList({
        dataSource: {
            transport: {
                read: {
                    type: 'GET',
                    dataType: 'json',
                    url: '/api/inventory/worker'
                }
            },
            // by shkoh 20210503: 우리FIS에서는 운영담당자별로 사람을 구분하여 사용하지 않는다
            // filter: {
            //     logic: 'or',
            //     filters: [
            //         { field: 'code_id', operator: 'eq', value: 'I1001' },
            //         { field: 'code_id', operator: 'eq', value: 'I1002' }
            //     ]
            // },
            sort: { field: 'name', dir: 'asc' },
            schema: {
                model: {
                    id: 'id',
                    fields: {
                        id: { editable: false },
                        name: { editable: false }
                    }
                }
            }
        },
        dataTextField: 'name',
        dataValueField: 'id',
        optionLabel: { id: null, name: '선택안함', value: null },
        filter: 'contains',
        messages: {
            noData: '선택할 항목이 없습니다'
        },
        optionLabelTemplate: '선택안함',
        template: '#: name # | #: company_name #',
        valueTemplate: '#: name # | #: company_name #'
    });
}

function createCompanyDropDownList() {
    $('#asset-company').kendoDropDownList({
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
        optionLabel: { id: null, name: '선택안함' },
        filter: 'contains',
        messages: {
            noData: '선택할 항목이 없습니다'
        }
    }); 
}

function createImageDropDownList() {
    $('#object_image_name').kendoDropDownList({
        dataSource: {
            transport: {
                read: {
                    async: true,
                    type: 'GET',
                    dataType: 'json',
                    url: '/api/inventory/assetimage'
                }
            },
            requestEnd: function(e) {
                if(e.type === 'read') {
                    // by shkoh 20210409: File Upload 후, 파일 중복 체크에 사용할 코드 추가
                    g_asset_image_list = e.response;
                }
            }
        },
        optionLabel: {
            name: '선택안함',
            path: ''
        },
        dataTextField: 'name',
        dataValueField: 'path',
        noDataTemplate: '서버에 등록된 이미지가 존재하지 않습니다',
        height: 400,
        autoWidth: true,
        template: kendo.template($('#asset-image-template').html()),
        change: function(e) {
            const path = this.value();
            applyAssetImage(path);
        },
        dataBound: function(e) {
            // by shkoh 20210409: image dropdownlist에서 X 버튼 클릭 했을 때, 삭제 동작
            $('.custom-close-icon').on('click', function() {
                const name = this.dataset.name;
                
                const is_delete = confirm('등록된 자산 이미지 ' + name + ' 파일을 삭제하시겠습니까?\n삭제할 경우 해당 이미지를 사용하는 모든 자산 항목에 영향을 끼칩니다');
                if(is_delete) {
                    $.ajax({
                        async: true,
                        type: 'DELETE',
                        dataType: 'json',
                        url: '/api/inventory/assetimage',
                        data: { image_name: name }
                    }).done(function(xhr) {
                        alert(xhr.msg);
                        e.sender.dataSource.read().then(function() {
                            const previous_image_name = e.sender.text();
                            e.sender.select(function(dataItem) { return dataItem.name === previous_image_name; });
                            e.sender.trigger('change');
                        });
                    }).fail(function(err) {
                        console.error(err);
                        alert(name + ' 이미지 파일 삭제 중 에러가 발생했습니다\n 브라우저 로그를 확인하시기 바랍니다');
                    });
                }
            });
        }
    });
}

function createImageUploder() {
    $('#apply_image').kendoUpload({
        multiple: false,
        showFileList: false,
        localization: { select: '+' },
        autoUpload: true,
        validation: { maxFileSize: 100000000 },
        async: {
            saveUrl: '/api/inventory/assetimage',
            saveField: 'assetimage'
        },
        select: function(e) {
            displayLoading();

            const upload_file = e.files[0];
            
            // by shokh 20210409: file 중복 체크
            if(g_asset_image_list.length > 0) {
                // by shkoh 20210409: 기존 image file list에서 중복 파일 찾기
                const is_overlap = g_asset_image_list.some(function(item) { return item.name.normalize('NFC') === upload_file.name.normalize('NFC') });
                if(is_overlap && !confirm(upload_file.name + '와 동일한 파일이 이미 존재합니다\n계속 진행 시, 해당 파일은 새로 등록된 파일로 대체됩니다\n계속 진행하시겠습니까?')) {
                    undisplayLoading();
                    e.preventDefault();
                }
            }

            // by shkoh 20210409: 이미지 파입 타입 체크
            if(!upload_file.rawFile.type.includes('image')) {
                alert(upload_file.name + ' 파일은 이미지 파일이 아닙니다\n이미지 파일만 등록 가능합니다');
                undisplayLoading();
                e.preventDefault();
            }

            // by shkoh 20210409: 파일명 길이 체크
            if(upload_file.name.length > 64) {
                alert('파일명의 길이는 64를 초과할 수 없습니다');
                undisplayLoading();
                e.preventDefault();
            }

            // by shkoh 20210409: 파일의 크기 체크. 100MB까지만 허용
            if(upload_file.size > 100000000) {
                alert('최대 100MB 이하의 파일만 업로드 가능합니다');
                undisplayLoading();
                e.preventDefault();
            }
        },
        progress: function(e) {
            $('.k-loading-text').text(e.percentComplete + '%');
        },
        success: function(e) {
            if(e.operation === 'upload') {
                alert(e.response.msg);
                $('#object_image_name').data('kendoDropDownList').dataSource.read().then(function() {
                    $('#object_image_name').data('kendoDropDownList').trigger('change');
                });
            }
        },
        error: function(e) {
            console.error(e);
            if(e.operation === 'upload') {
                alert('자산 이미지 ' + e.files[0].name + ' 파일 업로드 중 에러가 발생했습니다\n' + e.XMLHttpRequest.statusText);
            }
        },
        complete: function(e) {
            undisplayLoading();
        }
    });
}

function clearAssetDetailValue() {
    g_current_asset_data = undefined;
    
    $('#object_code_name').text('');

    $('#object_parent_name').val('');
    $('#popup-object-tree').val(-1);

    $('#object_name').val('');

    $('#asset-model').data('kendoDropDownList').value(-1);

    $('#inst_date').val('');

    $('#asset-operator').data('kendoDropDownList').value(-1);

    $('#asset-manager').data('kendoDropDownList').value(-1);

    $('#asset-company').data('kendoDropDownList').value(-1);

    $('#object_image_name').data('kendoDropDownList').value(-1);
}

function applyAssetDetailValue(data) {
    g_current_asset_data = data;
    
    $('#object_code_name').text(data.object_code_name);
    
    // by shkoh 20210409: 상위자산명
    $('#object_parent_name').val(data.object_parent_name);
    $('#popup-object-tree').val(data.object_parent_id);

    $('#object_name').val(data.object_name);

    $('#asset-model').data('kendoDropDownList').value(data.model_id);

    if(data.inst_date === null) {
        $('#inst_date').val('');
    } else {
        g_date_controller.ResetDate(new Date(data.inst_date));
    }

    $('#asset-operator').data('kendoDropDownList').value(data.operator_id);

    $('#asset-manager').data('kendoDropDownList').value(data.manager_id);

    $('#asset-company').data('kendoDropDownList').value(data.company_id);

    // by shkoh 20210409: 자산 이미지
    const path = '/img/inventory/equip/' + data.object_image_name;
    $('#object_image_name').data('kendoDropDownList').value(path);
    applyAssetImage(path);
}

function showAssetDetailItems(data) {
    $('#asset-detail-content').show();

    // by shkoh 20210409: 선택한 자산이 '위치' 인 경우
    if(data.object_code_id === 'I2000') {
        $('.asset-item-option').hide();
    } else {
        $('.asset-item-option').show();
    }
}

function applyAssetImage(path) {
    if(path === undefined || path === '') $('#object_image').attr({ src: '' }).hide();
    else {
        $('#object_image').attr({
            src: path + '?' + (new Date().getTime()),
            style: 'width: 100%; height: 100%'
        }).show();
    }
}

function insertAsset(info) {
    $.ajax({
        async: true,
        type: 'POST',
        dataType: 'json',
        url: '/api/inventory/object',
        data: { info: JSON.stringify(info) }
    }).done(function(data) {
        alert('자산이 정상등록 됐습니다\n자산에 대한 상세정보는 자산 상세정보창에서 입력하세요');
        const added_node = g_tree.AddNode(data);
        g_tree.SelectNode(added_node.id);
        g_asset_ids = getIds(added_node);

        g_datasource.read().then(function() {
            const update_row = g_datasource.get(added_node.id);
            
            const grid = $('#asset-grid').data('kendoGrid');
            grid.current('tr[data-uid="' + update_row.uid + '"]');
            grid.select('tr[data-uid="' + update_row.uid + '"]');
            grid.table.focus();
        });

        $('#add-asset-popup').modal('hide');
    }).fail(function(err) {
        console.error(err);
        alert('자산등록에 실패했습니다. 다시 확인 바랍니다');
    });
}

function updateAsset() {
    const update_info = {
        id: g_current_asset_data.object_id
    }

    // by shkoh 20210409: 상위자산 변경 확인
    const parent_object_id = Number($('#popup-object-tree').val());
    if(g_current_asset_data.object_parent_id !== parent_object_id) Object.assign(update_info, { group: { parent_object_id: parent_object_id } });

    // by shkoh 20210409: 자산명 변경 확인
    const object_name = $('#object_name').val();
    if(g_current_asset_data.object_name !== object_name) {
        if(update_info.object === undefined) Object.assign(update_info, { object: {} });
        Object.assign(update_info.object, { name: object_name });
    }

    const object_image_name = $('#object_image_name').data('kendoDropDownList').text();
    if(g_current_asset_data.object_image_name !== object_image_name) {
        if(update_info.object === undefined) Object.assign(update_info, { object: {} });
        Object.assign(update_info.object, { image: object_image_name });
    }
    
    // by shkoh 20210409: 위치자산이 아닐 경우
    if(g_current_asset_data.object_code_id !== 'I2000') {
        // by shkoh 20210409: 자산 추가정보 변경 확인
        const model_id = $('#asset-model').data('kendoDropDownList').dataItem().id;
        if(g_current_asset_data.model_id !== model_id) {
            if(update_info.info === undefined) Object.assign(update_info, { info: {} });
            Object.assign(update_info.info, { model_id: model_id });
        }

        const operator_id = $('#asset-operator').data('kendoDropDownList').dataItem().id;
        if(g_current_asset_data.operator_id !== operator_id) {
            if(update_info.info === undefined) Object.assign(update_info, { info: {} });
            Object.assign(update_info.info, { operator_id: operator_id });
        }
        
        const manager_id = $('#asset-manager').data('kendoDropDownList').dataItem().id;
        if(g_current_asset_data.manager_id !== manager_id) {
            if(update_info.info === undefined) Object.assign(update_info, { info: {} });
            Object.assign(update_info.info, { manager_id: manager_id });
        }
        
        const company_id = $('#asset-company').data('kendoDropDownList').dataItem().id;
        if(g_current_asset_data.company_id !== company_id) {
            if(update_info.info === undefined) Object.assign(update_info, { info: {} });
            Object.assign(update_info.info, { company_id: company_id });
        }

        const inst_date = convertYYYYMMDD(g_date_controller.GetDate());
        if(g_current_asset_data.inst_date !== inst_date) {
            if(update_info.info === undefined) Object.assign(update_info, { info: {} });
            Object.assign(update_info.info, { acquisition_date: inst_date });
        }
    }

    $.ajax({
        async: true,
        type: 'PATCH',
        dataType: 'json',
        url: '/api/inventory/object',
        data: { update: JSON.stringify(update_info) }
    }).done(function(data) {
        alert(g_current_asset_data.object_name + ' 자산의 상세정보를 변경했습니다');
        
        // by shkoh 20210409: 상위자산이 변경됐음으로 트리를 새로 그린다
        if(data.group) {
            g_tree.MoveNode(data.id, data.group.parent_object_id);
            g_tree.SelectNode(data.id);
            const node = g_tree.GetSelectedNode();
            g_asset_ids = getIds(node);
        }

        if(data.object && data.object.name) {
            g_tree.UpdateNodeName(data.id, data.object.name);
        }

        g_datasource.read().then(function() {
            const update_row = g_datasource.get(g_current_asset_data.object_id);
            
            const grid = $('#asset-grid').data('kendoGrid');
            grid.current('tr[data-uid="' + update_row.uid + '"]');
            grid.select('tr[data-uid="' + update_row.uid + '"]');
            grid.table.focus();
        });
    }).fail(function(err) {
        console.error(err);
        alert('자산 정보 변경 중 문제가 발생하여, 정상적으로 변경되지 않았습니다\n재확인 바랍니다.');
    });
}

function convertYYYYMMDD(_date) {    
    const yyyy = _date.getFullYear();
    const MM = ('0' + (_date.getMonth() + 1)).slice(-2);
    const dd = ('0' + _date.getDate()).slice(-2);

    return yyyy + '/' + MM + '/' + dd;
}

function deleteAsset() {
    const delete_info = {
        id: g_current_asset_data.object_id
    }

    const delete_node = g_tree.GetNodeInfo(delete_info.id);
    if(delete_node.isParent) {
        alert('삭제하려는 자산 아래에 기 등록된 자산이 존재합니다\n하위 자산이 존재하지 않아야 삭제가 가능합니다');
        return;
    }

    $.ajax({
        async: true,
        type: 'DELETE',
        dataType: 'json',
        url: '/api/inventory/object',
        data: { delete: JSON.stringify(delete_info) }
    }).done(function(data) {
        const p_node = g_tree.GetParentNode(data.delete_id);
        if(p_node !== null) {
            g_tree.SelectNode(p_node.id);
            g_asset_ids = getIds(p_node);
        } else {
            g_asset_ids = [];
        }

        g_tree.RemoveNode(data.delete_id);

        g_datasource.read().then(function() {
            $('#asset-detail-content').hide();
            clearAssetDetailValue();
        });
    }).fail(function(err) {
        console.error(err);
        alert('자산 삭제 진행 중 문제가 발생하여, 정상적으로 삭제되지 않았습니다\n재확인 바랍니다.');
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20210405: detail end                                                                                                              */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210412: popup detail start                                                                                                      */
/**********************************************************************************************************************************************/
function createModelDropDownListForPopup() {
    $('#popup-asset-type').kendoDropDownList({
        dataSource: {
            transport: {
                read: {
                    type: 'GET',
                    dataType: 'json',
                    url: '/api/inventory/codetype?type=O'
                }
            },
            sort: { field: 'name', dir: 'asc' }
        },
        dataTextField: 'name',
        dataValueField: 'id',
        value: 'I2000',
        messages: {
            noData: '선택할 항목이 없습니다'
        }
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20210412: popup detail end                                                                                                        */
/**********************************************************************************************************************************************/
