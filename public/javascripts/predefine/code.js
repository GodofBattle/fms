/// <reference path='../../../typings/jquery/jquery.d.ts'/>
/// <reference path='../../../typings/kendo-ui/kendo.all.d.ts'/>

let g_tree = undefined;
let g_pdCodeDataSource = undefined;

let g_grid_height = 0;
let g_tree_height = 0;

let g_pdCodes = [];
let g_pdCodeIds = [];
let g_pdCodeInts = [];
let g_fileNames = [];

let g_selectedCodeType = undefined;
let g_rightSelectedPdCode = '';
let g_codeId = '';
let g_codeInt = '';

let g_isAdd = undefined;
let g_isEmpty = undefined;
let g_isDuplicate = false;

$(window).on('resize', function() {
    resizeWindow();
});

$(document).ready(function() {
    $('#tree-panel .panel-primary .panel-body').mCustomScrollbar({
        theme: 'minimal-dark',
        axis: 'xy',
        scrollbarPosition: 'outside'
    });

    resizeWindow();

    getfileName();
    createTreeView();
    createPdCodeGrid();
    createPdCodeDataSource();

    // rMenu Modal 팝업창 [저장] 버튼 클릭 시
    $('#savePdCodeDetail').on('click', function() { saveModalPdCodeData(); });

    // 사전코드 테이블 [추가], [저장], [취소], [삭제] 버튼 클릭 시
    $('#addCode').on('click', function() { insertPdCodeData(); });
    $('#saveCode').on('click', function() { updatePdCodeData(); });
    $('#cancelCode').on('click', function() {
        g_codeId = null;
        g_pdCodeDataSource.read();
        g_tree.CancelSelectedNode();
    });
    $('#deleteCode').on('click', function() { deletePdCodeData(); });
});

function resizeWindow() {
    const mainViewer_height = parent['mainViewer'].innerHeight || parent['mainViewer'].clientHeight;
    g_tree_height = $('#tree-panel').height();
    g_grid_height = g_tree_height - 40;

    $('#tree-panel .panel-primary .panel-body').height(mainViewer_height - 63);
    $('#pdCodeGrid').height(g_grid_height);
    if($('#pdCodeGrid').data('kendoGrid') != undefined) $('#pdCodeGrid').data('kendoGrid').setOptions({ height: g_grid_height });
}

/**
 * kdh 20180517 사전코드 TreeView 생성
 */
function createTreeView() {
    if(g_tree !== undefined) return;

	g_tree = new TreeView('#code-tree', { 
        onBeforeClick: onBeforeClick,
        onClick: onClick,
        onRightClick: onRightClick
    });
    g_tree.Create();
}

/**
 * kdh 20181012 Tree Before Click Event
 * 
 * @param {String} treeId  Tree Element Id
 * @param {JSON} treeNode Selected TreeNode Info
 * @param {Number} clickFlag Tree Node 선택 상태
 */
function onBeforeClick(treeId, treeNode, clickFlag) {
    g_tree.ExpandNode(treeNode);
    getCodeDescription();
}

/**
 * kdh 20180517 Tree Click Event
 * 
 * @param {Object} event Tree Click Event Object
 * @param {String} treeId Tree Element Id
 * @param {JSON} treeNode Selected TreeNode Info
 */
function onClick(event, treeId, treeNode) {
    const grid = $('#pdCodeGrid').data('kendoGrid');

    // 선택한 노드가 자식노드인 경우
    if(treeNode.pId != null) {
        if(g_selectedCodeType != treeNode.pId) {
            g_selectedCodeType = treeNode.pId;
        }
    } else g_selectedCodeType = treeNode.name;

    if(g_selectedCodeType == 'E') {
        grid.hideColumn(3);
        grid.showColumn(4);
    } else {
        grid.hideColumn(4);
        grid.showColumn(3);
    }

    g_codeId = treeNode.id;
    g_pdCodeDataSource.read();
    getCodeDescription();
}

/**
 * kdh 20180517 Tree Right Click Event
 * 
 * @param {Object} event Tree Ringht Click Event Object
 * @param {String} treeId Tree Element Id
 * @param {JSON} treeNode Selected TreeNode Info
 */
function onRightClick(event, treeId, treeNode) {
    if(treeNode == null) return;

    if(!treeNode.pId) {
        g_tree.SelectNode(treeNode);
        showRmenu(event.clientX, event.clientY);
    } else hideRmemu();

    g_rightSelectedPdCode = treeNode.name;
}

/**
 * kdh 20180517 마우스 오른쪽 클릭하면 나타나는 메뉴 보이기
 * 
 * @param {Int} x 마우스 오른쪽 클릭한 x좌표 위치
 * @param {Int} y 마우스 오른쪽 클릭한 y좌표 위치
 */
function showRmenu(x, y) {
    $('#rMenu ul').show();

    $('#rMenu').css({
        'left': x + 'px',
        'visibility': 'visible'
    });

    if(y > (g_tree_height/3)*2) {
        $('#rMenu').css({ 'top': (y-60) + 'px' });
    } else {
        $('#rMenu').css({ 'top': y + 'px' });
    }

    $('body').bind('mousedown', onClickMouseDown);
}

/**
 * kdh 20180517 마우스 오른쪽 클릭하면 나타나는 메뉴 숨기기
 */
function hideRmemu() {
    if($('#rMenu')) $('#rMenu').css({ 'visibility': 'hidden' });
    $('body').unbind('mousedown', onClickMouseDown);
}

/**
 * kdh 20180517 rMenu가 나타났을 때 다른 곳 마우스 클릭 시, rMenu 숨기기
 * 
 * @param {Object} event Mouse event
 */
function onClickMouseDown(event) {
    if(!(event.target.id == 'rMenu' || $(event.target).parents('#rMenu').length > 0)) {
        $('#rMenu').css({ 'visibility': 'hidden' });
    }
}

/**
 * kdh 20180523 rMenu '사전코드 추가' Button Event
 */
function addPdCode() {
    g_isAdd = true;
    getSelectBoxCodeData();
    $('#pdCodeModalLabel').text('사전코드 추가');
    $('#pdCodeText').val('');
    $('#pdCodeDetail').val('');
    $('#pdCodeText').show();
    $('#pdCodeList').hide();
    $('#pdCodeModal').modal({ keyboard: true });
    hideRmemu();
}

/**
 * kdh 20180523 rMenu '사전코드 수정' Button Event
 */
function updatePdCode() {
    g_isAdd = false;
    getSelectBoxCodeData();
    getrMenuCodeDescription(g_rightSelectedPdCode);
    changeSelectBoxValue();
    $('#pdCodeModalLabel').text('사전코드 수정');
    $('#pdCodeText').hide();
    $('#pdCodeList').show();
    $('#pdCodeModal').modal({ keyboard: true });
    hideRmemu();
}

/**
 * kdh 20180523 rMenu Modal 팝업창 [저장] 버튼 클릭 시 '추가'/'수정' 구분
 */
function saveModalPdCodeData() {
    const codeDescription = $('#pdCodeDetail').val();
    let isNewCode = undefined;

    if(g_isAdd == true) {
        const codeType = $('#pdCodeText').val().toUpperCase();

        if(codeType == '') {
            alert('입력된 사전코드가 없습니다. 확인해 주세요.');
            return;
        }

        g_pdCodes.forEach(function(element) {
            if(element.code_type == codeType) {
                alert('중복된 사전코드가 있습니다. 다시 확인해 주세요.');
                isNewCode = false;
            }
        });

        if(isNewCode != false) addModalPdCodeData(codeType);
    } else {
        const codeType = $('#pdCodeList').val().toUpperCase();

        if(g_isEmpty == true) addModalPdCodeDescription(codeType, codeDescription);
        else updateModalPdCodeData();
    }
}

/**
 * kdh 20180523 rMenu Modal 팝업창에서 '추가' 시 data 저장
 * 
 * @param {String} codeType 사전코드타입
 */
function addModalPdCodeData(codeType) {
    const codeId = codeType + '00000'.substr(codeType.length);
    const codeDescription = $('#pdCodeDetail').val();

    $.ajax({
        async: true,
        type: 'POST',
        dataType: 'json',
        url: `/api/predefine/code/info`,
        data: {
            code_id: codeId,
            code_type: codeType,
            code_int: 0,
            code_name: ''
        }
    }).done(function() {
        const newNode = {
            id: codeType,
            pId: null,
            name: codeType,
            icon: '/img/tree/group_L_0.png',
            open: false,
            type: 'groupcode'
        };
        const newChildeNode = {
            id: codeId,
            pId: codeType,
            name: codeId,
            icon: '/img/tree/rack_L_0.png',
            open: false,
            type: 'code'
        };
        g_tree.AddNode(newNode, codeType, true);
        g_tree.AddNode(newChildeNode, codeType, false);
        g_tree.SortTree(codeType);

        if(codeDescription != '') addModalPdCodeDescription(codeType, codeDescription);
        alert('성공적으로 저장되었습니다.');
    }).fail(function(err_code) {
        alert('저장에 실패하였습니다.');
        console.error('[addModalPdCodeData] ' + err_code);
    }).always(function() {
        g_selectedCodeType = codeType;
        loadTableInfo();
    });
}

/**
 * kdh 20180523 rMenu Modal 팝업창에서 '추가' 시 코드 상세내용 data 저장
 * 
 * @param {String} codeType 코드 타입
 * @param {String} codeDescription 코드 상세내용
 */
function addModalPdCodeDescription(codeType, codeDescription) {
    $.ajax({
        async: true,
        type: 'POST',
        dataType: 'json',
        url: `/api/predefine/code/description`,
        data: {
            'codeType': codeType,
            'codeDescription': codeDescription
        }
    }).done(function() {
    }).fail(function(err_code) {
        alert('저장에 실패하였습니다.');
        console.error('[addModalPdCodeDescription] ' + err_code.statusText);
    }).always(function() {
        g_selectedCodeType = codeType;
        loadTableInfo();
    });
}

/**
 * kdh 20181017 사전코드 상세내용 DB 삭제
 */
function deletePdCodeDescription() {
    $.ajax({
        async: true,
        type: 'DELETE',
        dataType: 'json',
        url: `/api/predefine/code/description`,
        data: { 'codeType': g_selectedCodeType }
    }).done(function () {
    }).fail(function(xhr) {
        console.log('[' + xhr.responseText + '] 사전코드 상세내용 삭제에 실패했습니다');
    });
}

/**
 * kdh 20180524 rMenu Modal '수정' 팝업창 콤보박스 데이터
 */
function getSelectBoxCodeData() {
    $.ajax({
        async: true,
        type: 'GET',
        dataType: 'json',
        url: `/api/predefine/code/list`
    }).done(function(data) {
        if(g_isAdd == true) g_pdCodes = data;
        else selectBoxView(data);
    }).fail(function(err_code) {
        console.error('[selectBoxCodeData] ' + err_code);
    });
}

/**
 * kdh 20180524 rMenu Modal '수정' 팝업창 콤보박스뷰
 * 
 * @param {Array} data pdCode 목록 데이터
 */
function selectBoxView(data) {
    $('#pdCodeList').empty();
    // $('#pdCodeList').append('<option value=""></option>');

    for(let idx=0; idx<data.length; idx++) {
        if(data[idx].code_type == g_rightSelectedPdCode) {
            $('#pdCodeList').append('<option value="' + data[idx].code_type + '" selected="selected">' + data[idx].code_type + '</option>');
        } else {
            $('#pdCodeList').append('<option value="' + data[idx].code_type + '">' + data[idx].code_type + '</option>');
        }
    }
}

/**
 * kdh 20180524 rMenu Modal '수정' 팝업창 콤보박스뷰 값 변경
 */
function changeSelectBoxValue() {
    $('#pdCodeList').change(function() {
        g_rightSelectedPdCode = this.value;

        getrMenuCodeDescription(g_rightSelectedPdCode);
    });
}

/**
* kdh 20180523 rMenu Modal '수정' 팝업창 상세내용 data 받아오기
* 
* @param {String} codeType 
*/
function getrMenuCodeDescription(codeType) {
   $.ajax({
       async: true,
       type: 'GET',
       dataType: 'json',
       url: `/api/predefine/code/description?type=${codeType}`
   }).done(function(data) {
       if(data.length == 0) {
           $('#pdCodeDetail').val('');
           g_isEmpty = true;
       } else {
           $('#pdCodeDetail').val(data[0].code_description);
           g_isEmpty = false;
       }
   }).fail(function(err_code) {
       console.error('[getrMenuCodeDescription] ' + err_code);
   });
}

/**
 * kdh 20180523 rMenu Modal 팝업창에서 '수정' 시 data 저장
 */
function updateModalPdCodeData() {
    $.ajax({
        async: true,
        type: 'PATCH',
        dataType: 'json',
        url: `/api/predefine/code/description`,
        data: {
            'codeType': g_rightSelectedPdCode,
            'codeDescription': $('#pdCodeDetail').val()
        }
    }).done(function(data) {
        // getCodeDescription();
        alert('정상적으로 저장되었습니다.');
    }).fail(function(err_code) {
        alert('저장에 실패하였습니다.');
        console.error('[updateModalPdCodeData] ' + err_code);
    }).always(function() {
        g_selectedCodeType = g_rightSelectedPdCode;
        loadTableInfo();
    });
}

/**
 * kdh 20181030 rMenu Modal 팝업창에서 '추가/수정' 후 해당 테이블 정보 load
 */
function loadTableInfo() {
    const grid = $('#pdCodeGrid').data('kendoGrid');
    
    if(g_selectedCodeType == 'E') {
        grid.hideColumn(3);
        grid.showColumn(4);
    } else {
        grid.hideColumn(4);
        grid.showColumn(3);
    }
    
    $('#pdCodeModal').modal('hide');
    g_tree.SelectTreeNode(g_selectedCodeType);
    g_pdCodeDataSource.read();
    getCodeDescription();
}

/**
 * kdh 20180523 사전코드 상세내용 data 받아오기
 */
function getCodeDescription() {
    $.ajax({
        async: true,
        type: 'GET',
        dataType: 'json',
        url: `/api/predefine/code/description?type=${g_selectedCodeType}`
    }).done(function(data) {
        if(data.length == 0 || data[0].code_description == '') $('#grid-title').text(g_selectedCodeType);
        else $('#grid-title').text(g_selectedCodeType + ' - ' + data[0].code_description);
    }).fail(function(err_code) {
        console.error('[getCodeDescription] ' + err_code);
    });
}

/**
 * kdh 20180528 자식노드 클릭 시, 그리드 Row Focus
 * 
 * @param {Integer} length data length
 */
function focusGridRow(length) {
    if(g_codeId == null) return;

    const TableGrid = $('#pdCodeGrid').data('kendoGrid');
    const len = length + 1;

    for(let idx=1; idx<len; idx++) {
        $('tr:eq(' + idx + ')').removeClass('k-state-selected');
        if($('tr:eq(' + idx + ') td:eq(0)').text() == g_codeId) {
            // TableGrid.current(TableGrid.tbody.find('tr:eq(' + (idx-1) + ')'));
            // TableGrid.table.focus();
            TableGrid.select(TableGrid.tbody.find('tr:eq(' + (idx-1) + ')'));
        }
    }
}

/**
 * kdh 20181107 E코드 상세설명 콤보박스 리스트 Data
 */
function getfileName() {
    $.ajax({
        async: true,
        type: 'GET',
        dataType: 'json',
        url: `/api/predefine/code/treeicon`
    }).done(function(data) {
        data.forEach(function(data) {
            if(data.substr(-5, 1) == 0) {
                if(data.substr(0, 4) == 'null') return;
                g_fileNames.push({ name: data.substr(-0, data.length-8) });
            }
        });
    }).fail(function(xhr, textStatus, error) {
        console.log(xhr.responseText, textStatus, error);
    });
}

/**
 * kdh 20181011 Grid Cell Click Event
 */
function onChange() {
    const selected = $.map(this.select(), function(item) {
        return $(item).text();
    });

    g_tree.SelectTreeNode(selected.join().substring(0, 5));
}

/**
 * kdh 20180517 사전코드 정보 그리드 생성
 */
function createPdCodeGrid() {
    $('#pdCodeGrid').kendoGrid({
        filterable: true,
        sortable: true,
        resizable: true,
        columnMenu: true,
        navigatable: true,
        editable: {
            createAt: 'bottom'
        },
        selectable: 'row',
        noRecords: {
            template: 
            '<div style="display: table; width: 100%; height: 100%;">' +
                '<h3 style="margin: 0px; display: table-cell; vertical-align: middle;">' +
                    '<span class="label label-default" style="border-radius: 0px;">' +
                        '선택한 사전코드 정보가 없습니다.' +
                    '</span>' +
                '</h3>' +
            '</div>'
        },
        change: onChange,
        columns: [
            { field: 'code_id', title: '코드ID', filterable: false, width: '13%' },
            { field: 'code_int', title: 'CODE INT', filterable: false, width: '12%' },
            { field: 'code_name', title: '코드명', filterable: false, width: '25%', editor: editorCodeName },
            { field: 'description', title: '상세설명', filterable: false, width: '35%', editor: editorDescription },
            { field: 'description', title: '상세설명', filterable: false, width: '35%', template: '#=data.description#', editor: descriptionDropDown, hidden: true },
            { field: 'disp_unit', title: 'UNIT', filterable: true, width: '15%', editor: editorDispUnit }
        ],
        height: g_grid_height
    });
}

/**
 * kdh 20180517 사전코드 정보 Datasource 생성
 */
function createPdCodeDataSource() {
    g_pdCodeDataSource = new kendo.data.DataSource({
        transport: {
            read: {
                type: 'GET',
                dataType: 'json',
                url: function(options) {
                    if(!g_selectedCodeType) return '/api/predefine/code/info?type=unknown';
                    return '/api/predefine/code/info?type=' + g_selectedCodeType;

                },
                complete: function() {
                    focusGridRow(g_pdCodeDataSource._data.length);
                }
            },
            create: {
                type: 'POST',
                dataType: 'json',
                url: '/api/predefine/code/info',
                complete: function() {
                    g_pdCodeDataSource.read();
                }
            },
            update: {
                type: 'PATCH',
                dataType: 'json',
                url: `/api/predefine/code/info`,
                complete: function() {
                    g_pdCodeDataSource.read();
                }
            },
            destroy: {
                type: 'DELETE',
                dataType: 'json',
                url: `/api/predefine/code/info`,
                complete: function() {
                    g_pdCodeDataSource.read();

                    if(g_pdCodeDataSource.total() == 0) {
                        deletePdCodeDescription();
                        $('#grid-title').text('');
                        g_tree.RemoveNode(g_selectedCodeType, '', true);
                    } else g_tree.RemoveNode('', g_codeId, false);
                }
            },
            parameterMap: function(data, type) {
                switch(type) {
                    case 'read': return data;
                    case 'create': return data.models[0];
                    case 'update': return { info: JSON.stringify(data.models) };
                    case 'destroy': return data.models[0];
                }
            }
        },
        change: function(e) {
            if(e.action == 'add') {
                if(g_selectedCodeType == undefined) return;

                const prev_item = this.at(e.index - 1);
                const strZero = g_selectedCodeType + '00000'.substr(g_selectedCodeType.length);
                const newCodeInt = prev_item['code_int'] + 1;
                const newCodeId = strZero.substr(0, 5-newCodeInt.toString().length) + newCodeInt.toString();

                e.items[0]['code_int'] = g_codeInt = prev_item == undefined ? 1 : newCodeInt;
                e.items[0]['code_id'] = g_codeId = prev_item == undefined ? g_selectedCodeType + '00000'.substr(g_selectedCodeType.length) : newCodeId;
                e.items[0]['code_type'] = g_selectedCodeType;
                
                if(g_selectedCodeType == 'E') e.items[0]['description'] = 'default';
                else e.items[0]['description'] = '';
            }

            if(e.action == 'itemchange') {
                g_pdCodeIds.push(e.items[0]['code_id']);
                e.items[0].dirtyFields = e.items[0].dirtyFields || {};
                e.items[0].dirtyFields[e.field] = true;
            }
        },
        sort: {
            field: 'code_id', dir: 'asc'
        },
        autoSync: false,
        batch: true,
        schema: {
            model: {
                id: 'code_id',
                fields: {
                    code_id: { editable: false, nullable: false },
                    code_int: { type: "number", editable: true, nullable: false, validation: { required: true, min: 0 } },
                    code_name: { editable: true, nullable: false, validation: { required: false } },
                    description: { type: "string", editable: true,  nullable: true, validation: { required: false } },
                    description: { editable: true },
                    disp_unit: { type: "string", editable: true, nullable: true, validation: { required: false } }
                }
            }
        }
    });

    $('#pdCodeGrid').data('kendoGrid').setDataSource(g_pdCodeDataSource);
}

/**
 * kdh 20181107 E코드 상세설명 콤보박스 생성
 * 
 * @param {*} container Cell Editor Element
 * @param {*} options Row 데이터
 */
function descriptionDropDown(container, options)  {
    $('<input required data-bind="value: ' + options.field + '"/>').appendTo(container).kendoDropDownList({
        autoBind: true,
        dataTextField: 'name',
        dataValueField: 'name',
        template: '<span class="k-state-default" style="background-image: url(\'../img/tree/#:data.name#_L_0.png\')"></span>' +
                    '<span class="k-state-default">#: data.name #</span>',
        dataSource: g_fileNames,
        value: 'default',
        change: function(e) {
            let grid = $('#pdCodeGrid').data('kendoGrid');
            let selectedItem = grid.dataItem(grid.select());

            if(selectedItem.description.name) selectedItem.description = selectedItem.description.name;
        }
    });
}

/**
 * kdh 20180524 사전코드 '추가'
 */
function insertPdCodeData() {
    if(g_selectedCodeType == undefined) return;
    let icon = '';

    $('#pdCodeGrid').data('kendoGrid').addRow();
    
    if(5 - g_selectedCodeType.length < g_codeInt.toString().length) {
        alert('사전코드는 총 5자리를 넘을 수 없습니다. 다시 확인해주세요.');
        g_pdCodeDataSource.read();
        return;
    }

    setTimeout(function() {
        document.activeElement.blur();
    });
    
    g_pdCodeDataSource.sync();

    if(g_selectedCodeType == 'E') icon = '/img/tree/default_L_0.png';
    else icon = '/img/tree/rack_L_0.png';

    const newChildeNode = {
        id: g_codeId,
        pId: g_selectedCodeType,
        name: g_codeId,
        icon: icon,
        open: false,
        type: 'code'
    };
    g_tree.AddNode(newChildeNode, g_selectedCodeType, false);
    g_tree.SelectTreeNode(g_codeId);
}

/**
 * kdh 20180528 사전코드 '수정' - code_int 수정 시 code_id도 update
 */
function updatePdCodeData() {
    let isUpdate = true;

    // code_int 중복 확인
    g_pdCodeInts = [];
    checkCodeInt();

    if(g_isDuplicate == true) {        
        alert('중복된 code int가 있습니다. 다시 확인해 주세요.');
        return;
    }

    g_pdCodeDataSource._data.forEach(function(data) {
        if(data.dirty == true) {
            let prevId = '';
            g_pdCodeIds.forEach(function(items) {
                if(items == data.code_id) prevId = data.old_id = items;
                else prevId = data.old_id = data.code_id;
            });

            if(5 - data.code_type.toString().length < data.code_int.toString().length) {
                alert('사전코드는 총 5자리를 넘을 수 없습니다. 다시 확인해주세요.');
                isUpdate = false;
                return;
            }

            const strZero = g_selectedCodeType + '00000'.substr(g_selectedCodeType.length);
            data.code_id = strZero.substr(0, 5-data.code_int.toString().length) + data.code_int.toString();

            if(data.code_type == 'E') updatePdEquipData(data.old_id, data.code_id);
            g_tree.UpdateNode(prevId, data.code_name, data.code_id, data.description);
        }
    });

    if(isUpdate == false) return;

    g_pdCodeIds = [];    
    g_pdCodeDataSource.sync();
    g_codeId = null;
    g_tree.SortChildTree(g_selectedCodeType);
}

/**
 * kdh 20180528 사전코드 '삭제'
 */
function deletePdCodeData() {
    const tableGrid = $('#pdCodeGrid').data('kendoGrid');
    const selected_row = tableGrid.select();
    const selected_item = tableGrid.dataItem(selected_row);
    let isRemove = '';

    if(selected_row.length == 0) {
        alert('삭제하기 위한 항목을 선택하세요.');
        return;
    }

    if(g_pdCodeDataSource.total() > 1) isRemove = confirm('선택한 사전코드 정보를 삭제하시겠습니까?');
    else isRemove = confirm('선택한 사전코드와 함께 모든 정보가 삭제됩니다.\n삭제하시겠습니까?');

    if(isRemove) {
        g_codeId = selected_item.code_id;
        tableGrid.removeRow(selected_row);
        g_pdCodeDataSource.sync();
    }
}

/**
 * kdh 20181029 테이블 그리드에서 code_int 수정 시 중복 확인
 */
function checkCodeInt() {
    g_isDuplicate = false;

    g_pdCodeDataSource._data.forEach(function(data) {
        g_pdCodeInts.push(data.code_int);
    });

    for(let idx=1; idx<g_pdCodeInts.length; idx++) {
        for(let index=0; index<idx; index++) {
            if(g_pdCodeInts[idx] == g_pdCodeInts[index]) {
                g_isDuplicate = true;
                break;
            }
        }
    }
}

/**
 * 20190222 E코드일 때 index 수정 시, pd_equipment 테이블에도 update
 * 
 * @param {String} prev_id 수정 전 code_id
 * @param {String} code_id 수정 후 code_id
 */
function updatePdEquipData(prev_id, code_id) {
    $.ajax({
        async: true,
        type: 'PATCH',
        dataType: 'json',
        url: `/api/predefine/code/equipment`,
        data: {
            'prev_id': prev_id,
            'code_id': code_id
        }
    }).done(function() {
    }).fail(function(xhr, textStatus, error) {
        console.log(xhr.responseText, textStatus, error);
    });
}

function editorCodeName(container, options) {
    const input = $(`<input name="${options.field}" maxLength="64"/>`);
    input.appendTo(container);
    input.kendoMaskedTextBox();
}

function editorDescription(container, options) {
    const input = $(`<input name="${options.field}" maxLength="512"/>`);
    input.appendTo(container);
    input.kendoMaskedTextBox();
}

function editorDispUnit(container, options) {
    const input = $(`<input name="${options.field}" maxLength="16"/>`);
    input.appendTo(container);
    input.kendoMaskedTextBox();
}