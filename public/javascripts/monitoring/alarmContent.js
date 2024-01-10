const AlarmViewContent = function(_id, _option) {
    const alarm_id = _id;
    let option = {
        onFaultEditWindow: undefined,
        onSeachingEquipment: undefined
    };
    option = _option;
    
    let m_alamDataSource = undefined;
    
    /***************************************************************************************************************/
    /* by shkoh 20180528: 장애내역보기 - 크기 조정 시작                                                              */
    /***************************************************************************************************************/
    function m_alarmViewContentResizing() {
        const alarm_grid = $('#alarm-table').data('kendoGrid');
        
        if(alarm_grid) {
            alarm_grid.setOptions({ height: m_calcAlarmGridHeight() });
        }
    }

    function m_calcAlarmGridHeight() {
        const alarm_view_h = parseFloat($('#grid-alarm').height());
        const title_h = parseFloat($('#grid-alarm-item-title').height());

        return alarm_view_h - title_h - 32;
    }
    /***************************************************************************************************************/
    /* by shkoh 20180528: 장애내역보기 - 크기 조정 끝                                                                */
    /***************************************************************************************************************/

    /***************************************************************************************************************/
    /* by shkoh 20180525: 장애내역보기 - 공통 코드 시작                                                              */
    /***************************************************************************************************************/
    function createAlarmView() {
        const innerHtml =
        '<div class="grid-alarm item-title grid-item-draggable">' +
            '<h3>' +
                '<span id="grid-alarm-item-title">장애 목록 - <span id="alarm-count">0</span>건</span>' +
                '<span class="panel_close_icon"></span>' +
            '</h3>' +
        '</div>' +
        '<div id="grid-alarm-content" class="item-content">' +
            '<div id="alarm-table"></div>' +
        '</div>';

        $(alarm_id).html(innerHtml);
    }
    /***************************************************************************************************************/
    /* by shkoh 20180525: 장애내역보기 - 공통 코드 끝                                                                */
    /***************************************************************************************************************/

    /***************************************************************************************************************/
    /* by shkoh 20180528: 장애내역보기 - 알람 그리드 시작                                                            */
    /***************************************************************************************************************/
    function m_createAlarmGrid() {
        $('#alarm-table').kendoGrid({
            pageable: true,
            resizable: true,
            selectable: 'row',
            sortable: true,
            noRecords: {
                template:
                    '<div style="display:table;width:100%;height:100%;">' +
                        '<h3 style="margin:0px;display:table-cell;vertical-align:middle;">' +
                            '<span class="label label-default" style="border-radius:0px;">' +
                                '현재 장애 발생 설비는 없습니다' +
                            '</span>' +
                        '</h3>' +
                    '</div>'
            },
            height: m_calcAlarmGridHeight(),
            columns: [
                { field: 'levelName',  attributes: { class: 'i-alarm-row' }, title: '등급', width: 40, template: '<div class="level-img" style="background-image: url(/img/monitoring/L#:data.alarm_level#.png);"></div>' },
                { field: 'equip_kind', attributes: { class: 'i-alarm-row' }, title: '설비종류', width: 90 },
                { field: 'equip_name', attributes: { class: 'i-alarm-row' }, title: '설비명', width: 120 },
                { field: 'sensor_kind', attributes: { class: 'i-alarm-row' }, title: '센서종류', width: 90 },
                { field: 'sensor_name', attributes: { class: 'i-alarm-row' }, title: '센서명', width: 120 },
                { field: 'occur_date', attributes: { class: 'i-alarm-row' }, title: '발생시간', width: 125 },
                { field: 'alarm_msg', title: '장애내용', attributes: { style: "font-size:0.78em;", class: 'i-alarm-row' } },
                { command: { text: '장애조치', click: onAlarmAction }, title: '', width: 90 }
            ],
            dataBound: function(e) {
                m_setAlarmCount(this.dataSource.total());

                const grid = this;
                grid.tbody.find('tr').on('dblclick', function(evt) {
                    const item = grid.dataItem(this);
                    option.onSeachingEquipment(item.equip_id);
                });
            }
        });
    }

    function m_createAlarmGridDataSource() {
        m_alamDataSource = new kendo.data.DataSource({
            transport: {
                read: {
                    type: 'GET',
                    dataType: 'json',
                    url: '/api/monitoring/alarm'
                }
            },
            autoSync: false,
            batch: true,
            pageSize: 20,
            schema: {
                model: {
                    id: 'equip_id',
                    fields: {
                        equip_id: { validation: { required: true } },
                        equip_name: { validation: { required: true } },
                        equip_kind: { validation: { required: true } },
                        sensor_id: { validation: { required: true } },
                        sensor_name: { validation: { required: true } },
                        sensor_kind: { validation: { required: true } },
                        alarm_level: { validation: { required: true } },
                        alarm_name: { validation: { required: true } },
                        alarm_msg: { validation: { required: true } },
                        occur_date: { validation: { required: true } }
                    }
                }
            }
        });

        $('#alarm-table').data('kendoGrid').setDataSource(m_alamDataSource);
    }

    function onAlarmAction(e) {
        const dataItem = this.dataItem($(e.currentTarget).closest('tr'));
        
        option.onFaultEditWindow('E_' + dataItem.equip_id, dataItem.sensor_id, dataItem.occur_date, dataItem.alarm_level);
    }

    function m_setAlarmCount(alarm_count) {
        $('#alarm-count').text(alarm_count);
    }

    function redrawAlarmView() {
        m_alamDataSource.read();
    }
    /***************************************************************************************************************/
    /* by shkoh 20180528: 장애내역보기 - 알람 그리드 끝                                                              */
    /***************************************************************************************************************/

    return {
        CreateAlarmView: function() {
            createAlarmView();
            m_createAlarmGrid();
            m_createAlarmGridDataSource();
        },
        
        ResizingAlarmView: function() { m_alarmViewContentResizing() },

        RedrawAlarmView: function(info) {
            switch(info.command) {
                case 'update':
                case 'delete':
                    redrawAlarmView();
                break;
                case 'notify':
                    // by shkoh 20181127: 장애목록은 group에 대한 알람에 대해서는 처리하지 않음
                    if(info.type != 'group') redrawAlarmView();
                break;
            }
        }
    }
}