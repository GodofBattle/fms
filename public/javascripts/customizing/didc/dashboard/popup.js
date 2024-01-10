/// <reference path="../../../../../typings/jquery/jquery.d.ts"/>

let g_id = new URLSearchParams(location.search).get('id');
let g_window_widths = [ 600, 1000 ];

let g_threshold_ai_text = [
    { id: '.i-threshold-ai-0', label: '하한위험', prop_name: 'a_critical_min' },
    { id: '.i-threshold-ai-1', label: '하한경고', prop_name: 'a_major_min' },
    { id: '.i-threshold-ai-2', label: '하한주의', prop_name: 'a_warning_min' },
    { id: '.i-threshold-ai-3', label: '상한주의', prop_name: 'a_warning_max' },
    { id: '.i-threshold-ai-4', label: '상한경고', prop_name: 'a_major_max' },
    { id: '.i-threshold-ai-5', label: '상한위험', prop_name: 'a_critical_max' }
];

let g_threshold_di_text = [
    { id: '.i-threshold-di-0', title: '0:', prop_label: 'd_value_0_label', prop_level: 'd_value_0_level' },
    { id: '.i-threshold-di-1', title: '1:', prop_label: 'd_value_1_label', prop_level: 'd_value_1_level' },
    { id: '.i-threshold-di-2', title: '2:', prop_label: 'd_value_2_label', prop_level: 'd_value_2_level' },
    { id: '.i-threshold-di-3', title: '3:', prop_label: 'd_value_3_label', prop_level: 'd_value_3_level' },
    { id: '.i-threshold-di-4', title: '4:', prop_label: 'd_value_4_label', prop_level: 'd_value_4_level' },
    { id: '.i-threshold-di-5', title: '5:', prop_label: 'd_value_5_label', prop_level: 'd_value_5_level' },
    { id: '.i-threshold-di-6', title: '6:', prop_label: 'd_value_6_label', prop_level: 'd_value_6_level' },
    { id: '.i-threshold-di-7', title: '7:', prop_label: 'd_value_7_label', prop_level: 'd_value_7_level' },
]

let g_title = undefined;
let g_tree = undefined;
let g_grid = undefined;
let g_data = undefined;

let g_sensor_grid = undefined;

let g_grid_index = 1;

let g_sensor_timer = undefined;

let g_sensor_expand_data = [];

// by shkoh 20230829: WEB Socket을 통한 Noti message를 처리
function redrawViewer(msg) {    
    if(g_tree) {
        g_tree.RedrawTree(msg);
    }

    if(g_grid) {
        g_data.read();
        // g_grid.refresh();
    }
}

$(window).on('resize', function() {
    resizeWindow();
});

$(function() {
    window.resizeTo(g_window_widths[0], window.outerHeight);
    resizeWindow();

    loadSettingData().then(function(data) {
        const { description, equip_ids } = data;

        initTitle(description);
        initTitleSet();
        
        initTree(equip_ids);
        initTreeSetButton();
    
        initDataGrid();
        initDataSource();

        initSensorGrid();
        initSensorDataSource();
    });
});

function resizeWindow() {
    if(g_grid) g_grid.resize();
    if(g_sensor_grid) g_sensor_grid.resize();
    
    calculateTree();
}

function calculateTree() {
    const tree_panel = $('#i-popup-set');
    
    if(tree_panel.length === 1) {
        let except_h = 0;
        const set_panel = tree_panel.find('.i-popup-set-content');

        for(const s_p of set_panel) {
            except_h += s_p.clientHeight;
        }

        const hr = tree_panel.find('hr');
        for(const h of hr) {
            h_s = window.getComputedStyle(h);
            except_h += parseInt(h_s.getPropertyValue('height'));
            except_h += parseInt(h_s.getPropertyValue('margin-top'));
            except_h += parseInt(h_s.getPropertyValue('margin-bottom'));
        }

        const apply_button = tree_panel.find('#i-popup-tree-set');
        except_h += apply_button.outerHeight();
        except_h += parseInt(apply_button.css('margin-top'));

        const tree = tree_panel.find('#i-popup-tree');
        tree.css({ height: 'calc(100vh - 1em - ' + except_h + 'px)' });
    }
}

/***********************************************************************************************************************/
/* by shkoh 20230825: Load Data Start                                                                                  */
/***********************************************************************************************************************/
function loadSettingData() {
    return new Promise(function(resovle, reject) {
        $.ajax({
            async: true,
            type: 'GET',
            url: '/api/didc/icomer/popupData?obj_name=' + g_id
        }).done(function(data) {
            resovle(data);
        }).fail(function(err) {
            console.error(err);
            reject();
        });
    });
}
/***********************************************************************************************************************/
/* by shkoh 20230825: Load Data End                                                                                    */
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* by shkoh 20230825: Popup Setting Start                                                                              */
/***********************************************************************************************************************/
function initTitle(default_value) {
    g_title = $('#i-popup-title').kendoTextBox({
        label: '제목',
        value: default_value
    }).data('kendoTextBox');
}

function initTitleSet() {
    $('#i-popup-title-set').kendoButton({
        icon: 'check',
        click: function() {
            setTitle();
        }
    });
}

function initTree(equip_ids) {
    g_tree = new Tree('#i-popup-tree', {});

    const e_ids = equip_ids ? equip_ids.split(',') : [];
    g_tree.CreateTree(e_ids);
}

function initTreeSetButton() {
    $('#i-popup-tree-set').kendoButton({
        icon: 'check',
        click: function() {
            setTreeNode();
        }
    })
}

function setTitle() {
    $.ajax({
        async: true,
        type: 'POST',
        url: '/api/didc/icomer/dashboard/title',
        data: {
            obj: g_id,
            title: g_title.value()
        }
    }).done(function() {
        alert(g_title.value() + '로 설정됐습니다');
        notifyParent();
    }).fail(function(err) {
        console.error(err);
    });
}

function setTreeNode() {
    const ids = getCheckedTreeNode();

    $.ajax({
        async: true,
        type: 'POST',
        url: '/api/didc/icomer/dashboard/equipments',
        data: {
            obj: g_id,
            equip_ids: ids.toString()
        }
    }).done(function() {
        alert(ids.length + '개의 설비가 설정됐습니다');
        
        // by shkoh 20230828: 등록할 설비가 정상적으로 처리가 되었다면 현재 상태를 반영함
        if(g_grid) {
            g_grid.dataSource.read().then(function() {
                // by shkoh 20230829: 선택한 설비가 없는 경우에는, 선택을 해제하고 센서설정 페이지를 해제한다
                const selected = g_grid.select();
                if(selected.length === 0) {
                    g_grid.clearSelection();
                    
                    $('.i-info').hide();
                    $('.i-threshold').hide();
                    window.resizeTo(g_window_widths[0], window.outerHeight);
                }
            });
            g_grid.refresh();
        }

        notifyParent();
    }).fail(function(err) {
        console.error(err);
    });
}

function getCheckedTreeNode() {
    const checked = g_tree.GetCheckedNodes();

    const e_ids = [];
    checked.forEach(function(node) {
        const id_type = node.id.substr(0, 1);
        const id = node.id.substr(2);

        switch(id_type) {
            case 'E': e_ids.push(id); break;
        }
    });

    return e_ids;
}
/***********************************************************************************************************************/
/* by shkoh 20230825: Popup Setting End                                                                                */
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* by shkoh 20230825: Popup Equipment List Start                                                                       */
/***********************************************************************************************************************/
function initDataGrid() {
    g_grid = $('.i-list').kendoGrid({
        toolbar: function(e) {
            const toolbar_element = $('<div id="toolbar"></div>').kendoToolBar({
                resizable: false,
                items: [
                    {
                        id: 'setting',
                        type: 'button',
                        text: '설정',
                        icon: 'arrow-chevron-right',
                        click: toggleSettingView
                    }
                ]
            });
            
            return toolbar_element;
        },
        autoBind: true,
        persistSelection: true,
        pageable: {
            alwaysVisible: true,
            numeric: false,
            previousNext: false,
            messages: {
                empty: '지정된 설비가 없습니다',
                display: '지정 설비 수: {2}'
            }
        },
        resizable: true,
        scrollable: true,
        selectable: 'row',
        columns: [
            {
                width: '40px',
                template: '<div class="i-lvl-img i-lvl-img-#:data.lvl#"></div>',
                attributes: {
                    class: 'i-background-white',
                }
            },
            {
                field: 'idx',
                title: '순번',
                width: '60px',
                template: function() {
                    return (g_grid_index++).toLocaleString();
                }
            },
            { field: 'equip_type', title: '종류', width: '30%' },
            { field: 'equip_name', title: '설비명', width: '70%' }
        ],
        dataBinding: function(e) {
            if(e.sender.pager.page() === 1) {
                g_grid_index = 1;
            } else {
                const page = e.sender.pager.page() ? e.sender.pager.page() : 1;
                g_grid_index = (page - 1) * e.sender.pager.pageSize() + 1;
            }
        },
        change: function(e) {
            const selectedRows = this.select();

            // by shkoh 20230829: 설비 변경이 발생할 경우에 관련된 모든 값들을 초기화함
            if(selectedRows.length === 1) {
                if(window.outerWidth < g_window_widths[1]) {
                    window.resizeTo(g_window_widths[1], window.outerHeight);    
                }
    
                if(!$('.i-info').is(':visible')) {
                    $('.i-info').show();
                }

                const e_info = this.dataItem(selectedRows);
                
                setEquipmentInfo(e_info.equip_id);

                // by shkoh 20240109: Sensor Grid의 DetailView를 사용 중이라면 그 때 이를 갱신하지 않기 위해서 무조건 새로 읽지 않도록 함 
                const new_key = '/api/monitoring/sensor?parent=' + e_info.equip_id;
                if(g_sensor_data.options.transport.read.url !== new_key) {
                    g_sensor_data.options.transport.read.url = '/api/monitoring/sensor?parent=' + e_info.equip_id;

                    g_sensor_data.read().then(function() {
                        g_sensor_grid.clearSelection();
                    });
                    
                    // by shkoh 20240109: Sensor Grid는 polling 방식으로 지정된 시간마다 수행하도록 한다
                    playSensorListTimer();
                }
                
            }
        }
    }).data('kendoGrid');
}

function initDataSource() {
    g_data = new kendo.data.DataSource({
        autoSync: true,
        transport: {
            read: {
                cache: false,
                type: 'GET',
                contentType: 'application/json',
                url: '/api/didc/icomer/equipmentlist?pagename=i_dashboard&objectname=' + g_id
            }
        },
        error: function(e) {
            if(e.type === 'read') {
                alert('연계 설비정보를 조회하는데 에러가 발생했습니다');
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
                alert('연계 설비정보를 조회하는데 에러가 발생했습니다');
                undisplayLoading();
            } else if(e.type === 'read' && e.response) {
                undisplayLoading();
            }
        },
        schema: {
            data: function(response) {
                return response;
            },
            model: {
                id: 'equip_id'
            }
        }
    });

    g_grid.setDataSource(g_data);
}

function toggleSettingView(e) {
    // by shkoh 20230901: 설비 등록을 위한 영역을 표시할 때, 우선 기존의 '>', '<' 표시는 모두 제거한 후에
    e.target.find('span.k-icon').removeClass('k-i-arrow-chevron-left k-i-arrow-chevron-right');
    
    // by shkoh 20230901: 설정 영역이 보이는 경우에는 해당 부분을 숨겨지면서 보이지 않게 됨으로 '>' 아이콘으로 변경하고
    if($('#i-popup-set').is(':visible')) {
        e.target.find('span.k-icon').addClass('k-i-arrow-chevron-right');
    } else {
        // by shkoh 20230901: 반대의 경우에는 설정 영역이 보이게 되면서 '<' 아이콘을 표시함
        e.target.find('span.k-icon').addClass('k-i-arrow-chevron-left');
    }

    $('#i-popup-set').toggle('hide');
    calculateTree();
}

function setEquipmentInfo(equip_id) {
    $.ajax({
        async: true,
        type: 'GET',
        cache: false,
        url: '/api/monitoring/equipment?id=' + equip_id
    }).done(function(info) {
        const { network_msg, update_time, level_msg } = info;
        
        $('#i-network-value').text(network_msg ? network_msg : '-');
        $('#i-updatetime-value').text(update_time ? update_time : '-');
        
        $('#i-level-value')
            .removeClass('i-lvl-0 i-lvl-1 i-lvl-2 i-lvl-3 i-lvl-4 i-lvl-5 i-lvl-6')
            .addClass('i-lvl-' + (info.b_use === 'N' ? 6 : info.current_level));
        $('#i-level-value').text(level_msg ? level_msg : '');
    }).fail(function(err) {
        console.error(err);
    });
}
/***********************************************************************************************************************/
/* by shkoh 20230825: Popup Equipment List End                                                                         */
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* by shkoh 20230828: Popup Sensor List Start                                                                          */
/***********************************************************************************************************************/
function initSensorGrid() {
    g_sensor_grid = $('.i-sensor-list').kendoGrid({
        autoBind: false,
        resizable: true,
        selectable: 'row',
        persistSelection: true,
        scrollable: true,
        pageable: {
            alwaysVisible: true,
            numeric: false,
            previousNext: false,
            messages: {
                empty: '지정 설비의 수집항목이 없습니다',
                display: '수집항목 수: {2}'
            }
        },
        detailTemplate: kendo.template($('#i-threshold').html()),
        columns: [
            { field: 'id', width: '60px', title: '순번' },
            { field: 'name', width: '50%', title: '수집항목명' },
            {
                field: 'value',
                width: '40%',
                title: '값',
                template: setSensorValue
            }
        ],
        detailInit: function(e) {
            getThresholdInfo(e.detailRow, e.data);
        },
        detailExpand: function(e) {
            const node_id = g_sensor_grid.dataItem(e.masterRow).id - 1;
            g_sensor_expand_data.push(node_id);
        },
        detailCollapse: function(e) {
            const node_id = g_sensor_grid.dataItem(e.masterRow).id - 1;
            const idx = g_sensor_expand_data.findIndex(function(id) {
                return id === node_id;
            });
            g_sensor_expand_data.splice(idx, 1);
        }
    }).data('kendoGrid');
}

function initSensorDataSource() {
    g_sensor_data = new kendo.data.DataSource({
        autoSync: false,
        batch: true,
        transport: {
            read: {
                cache: false,
                type: 'GET'
            }
        },
        error: function(e) {
            if(e.type === 'read') {
                alert('수집항목 정보를 조회하는데 에러가 발생했습니다');
            }
        },
        requestEnd: function(e) {
            if(e.type === undefined) {
                console.error(e);
                alert('수집항목 정보를 조회하는데 에러가 발생했습니다');
            }
        },
        schema: {
            model: {
                id: 'id'
            }
        }
    });

    g_sensor_grid.setDataSource(g_sensor_data);
}

function setSensorList(equip_id) {
    // by shkoh 20230830: 센서정보를 갱신할 때, kendo UI의 DataSource를 갱신해버리면 임계치 설정 페이지가 초기화되는 문제가 있어서, 해당 부분은 직접 DOM을 수정하는 방식으로 하여 정보를 갱신처리함
    $.ajax({
        async: true,
        type: 'GET',
        dataType: 'json',
        url: '/api/monitoring/sensor?parent=' + equip_id
    }).done(function(data) {
        if(g_sensor_grid) {
            const name_idx = g_sensor_grid.columns.findIndex(function(c) { return c.field === 'name' }) + 1;
            const value_idx = g_sensor_grid.columns.findIndex(function(c) { return c.field === 'value' }) + 1;

            data.forEach(function(sensor, idx) {
                g_sensor_grid.tbody.find('tr.k-master-row:eq(' + idx + ') td:eq(' + name_idx + ')').text(sensor.name);
                g_sensor_grid.tbody.find('tr.k-master-row:eq(' + idx + ') td:eq(' + value_idx + ')').html(setSensorValue(sensor));
            });
        }
    });
}

function playSensorListTimer() {
    if(g_sensor_timer) clearInterval(g_sensor_timer);

    g_sensor_timer = setInterval(function() {
        const select_equipment = g_grid.select();

        if(select_equipment.length === 1) {
            const e_info = g_grid.dataItem(select_equipment);
            setEquipmentInfo(e_info.equip_id);
            if(g_sensor_grid) {
                setSensorList(e_info.equip_id);
            }
        } else {
            clearInterval(g_sensor_timer);
        }
    }, 5000);
}

function getThresholdInfo(parent, sensor) {
    const { sensor_id, sensor_type } = sensor;

    parent.attr('sensor-id', sensor_id);

    $.ajax({
        async: true,
        type: 'GET',
        url: '/api/sensor/sensorthreshold?id=' + sensor_id
    }).done(function(threshold) {
        if(sensor_type === 'AI') {
            for(const text of g_threshold_ai_text) {
                parent.find(text.id).kendoNumericTextBox({
                    label: text.label,
                    decimals: 1,
                    format: '#,###.#',
                    value: threshold[text.prop_name]
                });
            }
        } else {
            for(const text of g_threshold_di_text) {
                parent.find(text.id + ' .i-threshold-di-label').kendoTextBox({
                    label: text.title,
                    value: threshold[text.prop_label]
                });

                parent.find(text.id + ' .i-threshold-di-level').kendoDropDownList({
                    dataSource: {
                        data: [
                            { value: 0, text: '정상' },
                            { value: 1, text: '주의' },
                            { value: 2, text: '경고' },
                            { value: 3, text: '위험' }
                        ]
                    },
                    dataTextField: 'text',
                    dataValueField: 'value',
                    optionLabel: {
                        value: -1,
                        text: '-'
                    },
                    value: threshold[text.prop_level],
                    valueTemplate: function(data) {
                        const html =
                        '<span class="i-dropdownlist-lvl i-lvl-' + data.value + '">' +
                            data.text +
                        '</span>';
                        
                        return html;
                    }
                })
            }
        }

        parent.find('.i-threshold-set').kendoButton({
            icon: 'check',
            click: function() {
                setThreshold(parent, sensor_id, sensor_type);
            }
        });
    });
}
/***********************************************************************************************************************/
/* by shkoh 20230828: Popup Sensor List End                                                                            */
/***********************************************************************************************************************/

/***********************************************************************************************************************/
/* by shkoh 20230828: Inline Function Start                                                                            */
/***********************************************************************************************************************/
function displayLoading() {
    kendo.ui.progress($(document.body), true);
}

function undisplayLoading() {
    setTimeout(function() {
        kendo.ui.progress($(document.body), false);
    });
}

function setSensorValue(sensor_data) {
    let star = '';
    if(sensor_data.sensor_comm_status === 4) star = '* ';

    const html =
    '<span class="i-sensor-value i-lvl-' + sensor_data.level + ' i-is-event-' + sensor_data.event + '">' +
        star + sensor_data.value +
        '<span class="i-unit">' + sensor_data.unit + '</span>'
    '</span>';

    return html;
}

function setThreshold(parent, sensor_id, type) {    
    const set = {};
    
    if(type === 'AI') {
        for(const text of g_threshold_ai_text) {
            const val = parent.find(text.id + '[data-role=numerictextbox]').data('kendoNumericTextBox').value();
            set[text.prop_name] = Number(val);
        }
    } else if(type === 'DI') {
        for(const text of g_threshold_di_text) {
            const label = parent.find(text.id + ' .i-threshold-di-label.k-input').data('kendoTextBox').value();
            const value = parent.find(text.id + ' div.i-threshold-di-level').data('kendoDropDownList').value();
            
            set[text.prop_label] = label;
            if(Number.isInteger(value)) {
                set[text.prop_level] = value === -1 ? null : Number(value);
            }
        }
    }

    $.ajax({
        async: true,
        type: 'PATCH',
        url: '/api/sensor/sensorthreshold?id=' + sensor_id + '&type=' + type,
        data: set
    }).done(function(result) {
        alert(result.msg);
    }).fail(function(err) {
        console.error(err);
        alert('임계치 설정에 실패했습니다');
    });
}

function notifyParent() {
    // by shkoh 20230904: 부모에게 데이터 변경이 있었음을 알려줌
    if(window.opener && window.opener.loadDataValue) {
        window.opener.loadDataValue();
    }

    if(window.opener && window.opener.loadDataAlert) {
        window.opener.loadDataAlert();
    }

    if(window.opener && window.opener.loadContainment) {
        window.opener.loadContainment();
    }
}
/***********************************************************************************************************************/
/* by shkoh 20230828: Inline Function End                                                                              */
/***********************************************************************************************************************/