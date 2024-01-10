const AlarmViewContent = function(_id, _option) {
    const alarm_id = _id;

    let m_alarm_data_source = undefined;

    function createAlarmView() {
        const innerHtml =
        '<div id="alarm-table"></div>';

        $(alarm_id).html(innerHtml);
    }

    function alarmViewContentResizing() {
        const alarm_grid = $('#alarm-table').data('kendoGrid');

        if(alarm_grid) {
            $('#alarm-table').height(calcAlarmGridHeight());
            alarm_grid.resize();
        }
    }

    function calcAlarmGridHeight() {
        const alarm_view_h = parseFloat($('.panel').height());
        const title_h = parseFloat($('.panel-heading').height());

        return alarm_view_h - title_h - 6;
    }

    /***************************************************************************************************************/
    /* by shkoh 20190212: Alarm View Content - Kendo Grid Start                                                    */
    /***************************************************************************************************************/
    function createAlarmGrid() {
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
                            '현재 선택한 그룹/설비 내 장애 발생 항목이 존재하지 않습니다' +
                        '</span>' +
                    '</h3>' +
                '</div>'
            },
            columns: [
                { field: 'levelName', title: '등급', width: 40, template: '<div class="level-img" style="background-image: url(/img/monitoring/L#:data.alarm_level#.png);"></div>' },
                { field: 'equip_kind', title: '설비종류', width: 90 },
                { field: 'equip_name', title: '설비명', width: 110 },
                { field: 'sensor_kind', title: '센서종류', width: 90 },
                { field: 'sensor_name', title: '센서명', width: 110 },
                { field: 'occur_date', title: '발생시간', width: 125 },
                { field: 'alarm_msg', title: '장애내용', attributes: { style:"font-size: 0.95em;" } },
                { command: { text: '장애조치', click: onAlarmAction }, title: '', width: 70 }
            ],
            height: calcAlarmGridHeight(),
            dataBound: function(e) {
                setAlarmCountText(this.dataSource.total());
            }
        })
    }

    function createAlarmDataSource() {
        m_alarm_data_source = new kendo.data.DataSource({
            transport: {
                read: {
                    type: 'GET',
                    dataType: 'json',
                    url: `/api/alarm/dashboard/list`
                }
            },
            autoSync: false,
            batch: true,
            pageSize: 100,
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

        $('#alarm-table').data('kendoGrid').setDataSource(m_alarm_data_source);
    }

    function setAlarmCountText(alarm_count) {
        $('#alarm-count').text(alarm_count);
    }

    function onAlarmAction(e) {
        const dataItem = this.dataItem($(e.currentTarget).closest('tr'));

        const equip_id = dataItem.equip_id;
        const sensor_id = dataItem.sensor_id;
        const occur_date = dataItem.occur_date;
        const alarm_level = dataItem.alarm_level;

        window.open(`/popup/fault?equip_id=${equip_id}&sensor_id=${sensor_id === undefined ? '' : sensor_id}&occur_date=${occur_date === undefined ? '' : occur_date}&alarm_level=${alarm_level === undefined ? '' : alarm_level}`, `faultWindow_E_${equip_id}`, `scollbars=1, menubar=no, resizable=no, location=no, titlebar=no, toolbar=no, status=no, width=1100, height=506`);
    }

    function filterAlarmList(filter_items) {
        if(m_alarm_data_source == undefined) return;

        if(filter_items == undefined) {
            m_alarm_data_source.filter({});
            return;
        }

        if(filter_items.length == 0) {
            // by shkoh 20190213: filter_items의 개수가 0인 경우에는 존재하지 않는 equip_id로 강제 필터링함
            m_alarm_data_source.filter({ field: 'equip_id', operator: 'eq', value: -1 });
        } else {
            let items = [];

            filter_items.forEach(function(item) {
                items.push({ field: 'equip_id', operator: 'eq', value: parseInt(item.id.substr(2)) });
            });

            m_alarm_data_source.filter({
                logic: 'or',
                filters: items
            });
        }
    }

    function redrawAlarmView() {
        m_alarm_data_source.read();
    }
    /***************************************************************************************************************/
    /* by shkoh 20190212: Alarm View Content - Kendo Grid End                                                      */
    /***************************************************************************************************************/

    return {
        CreateAlarmView: function() {
            createAlarmView();
            createAlarmGrid();
            createAlarmDataSource();
        },

        ResizeAlarmView: function() { alarmViewContentResizing(); },

        FilterAlarmListByEquipId: function(filtering_items) { filterAlarmList(filtering_items); },

        RedrawAlarmView: function(info) {
            switch(info.command) {
                case 'update':
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