let g_tree = undefined;
let g_tree_setting = {
    view: {
        showLine: false,
        fontCss: function(treeId, treeNode) {
            let font_css = { 'text-decoration': 'none', opacity: 1 };
            // by shkoh 20210405: root node의 클릭 이벤트를 보여주지 않기 위한 처리
            if(treeNode.pId === null) {
                font_css = {
                    'cursor': 'default',
                    'color': '#333333'
                }
            }
            return font_css;
        }
    },
    data: {
        simpleData: {
            enable: true,
            idKey: 'id',
            pIdKey: 'pId'
        }
    },
    async: { enable: false },
    callback: {
        onClick: onClick,
        beforeClick: onBeforeClick
    }
};

$(window).on('resize', function() {
    resizeWindow();
});

$(function() {
    resizeWindow();

    createCodeTree();

    createDataGrid();

    $('#code-tree').parent().mCustomScrollbar({
        theme: 'minimal-dark',
        axis: 'yx',
        scrollbarPosition: 'outside',
        mouseWheel: {
            preventDefault: true
        }
    });
});

/**********************************************************************************************************************************************/
/* by shkoh 20210405: resize window start                                                                                                     */
/**********************************************************************************************************************************************/
function resizeWindow() {
    const panel_h = calculatePanelHeight();

    $('.panel-body').height(panel_h);
    $('#in-code').height(panel_h - 4);
}

function calculatePanelHeight() {
    const viewer_h = parseFloat(parent['mainViewer'].innerHeight || parent['mainViewer'].clientHeight) - 16;
    const content_border_h = 6;
    const panel_heading_h = parseFloat($('.i-panel-heading').height()) + 6;
    const panel_body_padding = 8;

    return viewer_h - content_border_h - panel_heading_h - panel_body_padding;
}
/**********************************************************************************************************************************************/
/* by shkoh 20210405: resize window end                                                                                                       */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210405: tree start                                                                                                              */
/**********************************************************************************************************************************************/
function createCodeTree() {
    $.ajax({
        async: true,
        type: 'GET',
        cache: false,
        dataType: 'json',
        url: '/api/inventory/code'
    }).done(function(items) {
        if(items.length === 0) return;

        let tree_data = [];
        items.forEach(function(item) {
            tree_data.push({
                id: item.id,
                pId: item.type,
                name: item.type === null ? item.name : item.id + ' | ' + item.name,
                open: false,
                icon: getIcon(item.type, item.icon),
                data: item
            });
        });

        g_tree = $.fn.zTree.init($('#code-tree'), g_tree_setting, tree_data);
    }).fail(function(err) {
        console.error(err);
    });
}

function getIcon(type, icon_name) {
    const init_url = '/img/inventory/tree/';
    let icon_file_name = '';

    if(type === null) icon_file_name = 'tree_default.png';
    else if(icon_name === null) icon_file_name = 'null_L_0.png';
    else icon_file_name = icon_name;
    
    return init_url + icon_file_name;
}

function onBeforeClick(treeId, treeNode, clickFlag) {
    let isClick = true;

    if(treeNode.pId === null) isClick = false;

    return isClick;
}

function onClick(event, treeId, treeNode) {
    const grid = $('#in-code').data('kendoGrid');

    if(grid) {
        grid.dataSource.read();
    }
}
/**********************************************************************************************************************************************/
/* by shkoh 20210405: tree end                                                                                                                */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20210405: data grid start                                                                                                         */
/**********************************************************************************************************************************************/
function createDataGrid() {
    $('#in-code').kendoGrid({
        dataSource: {
            transport: {
                read: {
                    type: 'GET',
                    dataType: 'json',
                    url: function(options) {
                        if(g_tree === undefined) return;

                        const selected_tree_node = g_tree.getSelectedNodes()[0];
                        if(selected_tree_node === undefined || selected_tree_node.data.type === null) return;

                        return '/api/inventory/codetype?type=' + selected_tree_node.data.type;
                    }
                },
                create: {
                    type: 'POST',
                    dataType: 'json',
                    url: '/api/inventory/code'
                },
                update: {
                    type: 'POST',
                    dataType: 'json',
                    url: '/api/inventory/code'
                },
                destroy: {
                    type: 'DELETE',
                    dataType: 'json',
                    url: '/api/inventory/code'
                },
                parameterMap: function(data, type) {
                    switch(type) {
                        case 'read': return data;
                        case 'create': return data.models[0];
                        case 'update': return data;
                        case 'destroy': return data;
                    }
                }
            },
            requestEnd: function(e) {
                switch(e.type) {
                    case 'update':
                        const node = g_tree.getNodeByParam('id', e.response.id);
                        const node_item = {
                            id: e.response.id,
                            pId: e.response.type,
                            name: e.response.type === null ? e.response.name : e.response.id + ' | ' + e.response.name,
                            icon: getIcon(e.response.type, e.response.icon),
                            data: e.response
                        }
                        
                        if(node === null) {
                            const parent_node = g_tree.getNodeByParam('id', e.response.type);
                            g_tree.addNodes(parent_node, node_item);
                        } else {
                            node.id = node_item.id;
                            node.pId = node_item.type;
                            node.name = node_item.name;
                            node.icon = getIcon(e.response.type, e.response.icon);
                            node.data = e.response;

                            g_tree.updateNode(node);
                        }
                        break;
                    case 'destroy':
                        const removed_tree_node = g_tree.getNodeByParam('id', e.response.id);
                        g_tree.removeNode(removed_tree_node, false);
                        break;
                }
            },
            change: function(e) {
                if(e.action === 'add') {
                    const added_node_family = g_tree.getSelectedNodes()[0];

                    Object.assign(e.items[0], {
                        id: added_node_family.id.substr(0, 3),
                        type: added_node_family.pId,
                        name: '',
                        icon: null,
                        description: null
                    });
                } else if(e.action === 'remove') {
                    console.log(e);
                }
            },
            schema: {
                model: {
                    id: 'id',
                    fields: {
                        id: {
                            type: 'string',
                            editable: true,
                            validation: {
                                custom: function(input) {
                                    if(input.is('[name="id"]')) {
                                        this.options.messages.custom = 'ID가 중복되었습니다';
                                        this.options.messages.required = '코드명을 작성하세요';
                                        const _val = input.val();
                                        const is_duplicate = $('#in-code').data('kendoGrid').dataSource.data().filter(function(d) { return d.id === _val; }).length < 2;
                                        return is_duplicate;
                                    }
                                    return true;
                                }
                            }
                        },
                        name: { type: 'string', editable: true, validation: { required: true } }
                    }
                }
            }
        },
        toolbar: [ { name: 'create', text: '코드추가' } ],
        sortable: true,
        resizable: true,
        editable: {
            mode: 'inline',
            createAt: 'bottom',
            confirmation: '해당 자산코드를 삭제하시겠습니까?'
        },
        selectable: 'row',
        columns: [
            { field: 'type', title: '코드타입', sortable: false, editable: function() { return false; } },
            {
                field: 'id',
                title: '코드 ID',
                sortable: false,
                editor: function(container, options) {
                    const input = $('<input name="' + options.field +'" minlength="5" maxlength="5"/>');
                    input.appendTo(container);
                    input.kendoTextBox();

                    input.on('input', function(e) {
                        const prefix = g_tree.getSelectedNodes()[0].id.substr(0, 3);
                        const _previous_val = this.value.substr(0, 3);
                        if(prefix !== _previous_val) {
                            this.value = prefix;
                            e.preventDefault();
                        }
                    });
                }
            },
            { field: 'name', title: '코드명' },
            {
                field: 'icon',
                title: '코드 아이콘',
                sortable: false,
                editable: function(dataItem) {
                    return dataItem.type === 'O';
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
                                    url: '/api/inventory/codeicon'
                                }
                            }
                        },
                        dataTextField: 'name',
                        dataValueField: 'icon',
                        value: 'null_L_0.png',
                        autoWidth: true,
                        optionLabel: { name: "[선택안함]", icon: null },
                        template: kendo.template($('#code-tree-icon-template').html()),
                        valueTemplate: kendo.template($('#code-tree-icon-template').html())
                    });
                },
                template: function(dataItem) {
                    if(dataItem.type !== 'O') return '';
                    else if(dataItem.icon === null) dataItem.icon = 'null_L_0.png';
                    
                    const _template = kendo.template($('#code-tree-icon-template').html());
                    return _template(dataItem).toString();
                }
            },
            { field: 'description', title: '설명', sortable: false },
            { command: [
                { name: 'edit', text: { edit: '수정', update: '적용', cancel: '취소' } },
                { name: 'destroy', text: '삭제' }
            ] }
        ],
        beforeEdit: function(e) {
            if(e.model.isNew()) {
                if(g_tree.getSelectedNodes().length === 0) {
                    alert('추가하기 위한 자산코드를 선택해 주세요');
                    e.sender.cancelChanges();
                }
            }
        }
    });
}
/**********************************************************************************************************************************************/
/* by shkoh 20210405: data grid end                                                                                                           */
/**********************************************************************************************************************************************/