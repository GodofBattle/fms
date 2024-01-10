let g_resize_inst = undefined;

let g_grid = undefined;
let g_datasource = undefined;

$(window).on('resize', function() {
    clearTimeout(g_resize_inst);
    g_resize_inst = setTimeout(resizeWindow, 500);
});

$(function() {
    initRotationSet();
    
    initGrid();
    initDataSource();
});

function resizeWindow() {
    if(g_grid) g_grid.resize();
}

function notifyParent() {
    // by shkoh 20230925: 부모에게 데이터 변경이 있었음을 알려줌
    if(window.opener && window.opener.loadContainment) {
        window.opener.loadContainment();
    }
}

function initRotationSet() {
    const interval = localStorage.getItem('rotationInterval');

    $('#i-rotation').kendoNumericTextBox({
        label: '변경주기(초)',
        decimals: 0,
        format: '#,###',
        value: interval ? interval : 10
    });

    $('#i-rotation-set-button').kendoButton({
        icon: 'check',
        click: function() {
            const rotate = $('#i-rotation').data('kendoNumericTextBox');
            localStorage.setItem('rotationInterval', rotate.value());
        }
    });
}

function initGrid() {
    g_grid = $('#i-containment-list').kendoGrid({
        toolbar: [
            { template: '<a class="k-button k-button-icon" onclick="addContainment()"><i class="k-icon k-i-plus"></i></a>' }
        ],
        persistSelection: true,
        pageable: {
            alwaysVisisble: true,
            numeric: false,
            previousNext: false,
            messages: {
                empty: '등록된 컨테인먼트가 없습니다',
                display: '등록 컨테인먼트 수: {2}'
            }
        },
        resizable: true,
        scrollable: true,
        selectable: 'row',
        editable: {
            mode: 'incell'
        },
        columns: [
            {
                editable: function() {
                    return false;
                },
                field: 'id',
                width: '10%',
                title: 'ID'
            },
            {
                field: 'name',
                title: '컨테인먼트명'
            },
            {
                editable: function() {
                    return false;
                },
                width: '25%',
                attributes: {
                    class: 'i-grid-icons'
                },
                template: function(data) {
                    const html =
                    '<a class="k-button k-button-icon" onclick="updateContainment(' + data.id + ')"><i class="k-icon k-i-save"></i></a>' +
                    '<a class="k-button k-button-icon" onclick="deleteContainment(' + data.id + ')"><i class="k-icon k-i-delete"></i></a>';

                    return html;
                }
            }
        ]
    }).data('kendoGrid');
}

function initDataSource() {
    g_datasource = new kendo.data.DataSource({
        autoSync: false,
        transport: {
            read: {
                cache: false,
                type: 'GET',
                contentType: 'application/json',
                url: '/api/didc/icomer/ds/containmentlist?pagename=i_dashboard'
            }
        },
        error: function(e) {
            if(e.type === 'read') {
                alert('컨테인먼트 정보를 로드하는 중에 에러가 발생했습니다');
                undisplayLoading();
            }
        },
        requestStart: function(e) {
            if(e.type === 'read') {
                displayLoading();
            }
        },
        requestEnd: function(e) {
            if(e.type === undefined) {
                console.error(e);
                alert('컨테인먼트 정보를 조회하는데 에러가 발생했습니다');
                undisplayLoading();
            } else if(e.type === 'read' && e.response) {
                undisplayLoading();
            }
        },
        schema: {
            data: function(response) {
                return response.map(function(item) {
                    return {
                        id: item.id,
                        name: item.name
                    }
                });
            },
            model: {
                id: 'id',
                fields: {
                    id: { editable: false },
                    name: { editable: true }
                }
            }
        }
    });

    g_grid.setDataSource(g_datasource);
}

function addContainment() {
    displayLoading();

    $.ajax({
        async: true,
        type: 'POST',
        url: '/api/didc/icomer/dashboard/containment'
    }).done(function() {
        g_datasource.read();
        notifyParent();
        undisplayLoading();
    }).fail(function(err) {
        console.error(err);
        alert('컨테인먼트 추가에 실패했습니다');
        undisplayLoading();
    });
}

function updateContainment(id) {
    const item = g_datasource.get(id);

    displayLoading();
    
    $.ajax({
        async: true,
        type: 'PATCH',
        url: '/api/didc/icomer/dashboard/containment',
        data: {
            id: id,
            description: item.name
        }
    }).done(function() {
        g_datasource.read();
        notifyParent();
        undisplayLoading();
    }).fail(function(err) {
        console.error(err);
        alert('컨테인먼트 변경에 실패했습니다');
        undisplayLoading();
    });
}

function deleteContainment(id) {
    displayLoading();

    $.ajax({
        async: true,
        type: 'DELETE',
        url: '/api/didc/icomer/dashboard/containment',
        data: {
            id: id
        }
    }).done(function() {
        g_datasource.read();
        notifyParent();
        undisplayLoading();
    }).fail(function(err) {
        console.error(err);
        alert('컨테인먼트 변경에 실패했습니다');
        undisplayLoading();
    });
}
/***********************************************************************************************************************/
/* by shkoh 20230920: Inline Function Start                                                                            */
/***********************************************************************************************************************/
function displayLoading() {
    kendo.ui.progress($(document.body), true);
}

function undisplayLoading() {
    setTimeout(function() {
        kendo.ui.progress($(document.body), false);
    });
}
/***********************************************************************************************************************/
/* by shkoh 20230920: Inline Function End                                                                              */
/***********************************************************************************************************************/