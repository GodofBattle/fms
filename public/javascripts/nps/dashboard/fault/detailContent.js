const DetailViewContent = function(_id) {
    const detail_id = _id;

    let m_current_id = undefined;
    let m_current_kind = undefined;
    
    let m_sensor_data_source = undefined;
    let m_equipment_info_interval_id = undefined;
    let m_chart_info_interval_id = undefined;

    function clearDetailView() {
        $(detail_id).empty();
        setDetailViewTitle('그룹 내 설비 통계현황');
    }

    function setDetailViewTitle(title) {
        $('#detail-title').text(title);
    }

    /**
     * 설비 상세보기 정보를 10초마다 갱신하기 위한 Function
     * 설비 상세보기 내역이 존재하지 않을 때 interval을 멈춤
     * 
     * @param {JSON} info 설비상세보기 정보 
     */
    function pollingEquipmentInfoRedraw(info) {
        m_equipment_info_interval_id = setInterval(function() {
            if($('#detail-table').length == 0) {
                clearInterval(m_equipment_info_interval_id);
                return;
            }

            const equip_detail_info = getEquipmentDetailInfo(info);
            Promise.all([ equip_detail_info ]).then(function() {
                m_sensor_data_source.read();
            });
        }, 5000);
    }

    function pollingChartInfoRedraw() {
        m_chart_info_interval_id = setInterval(function() {
            if($('#alarmBarChart').length == 0) {
                clearInterval(m_chart_info_interval_id);
                return;
            }

            const alarm_bar_chart = $('#alarmBarChart').data('kendoChart');
            
            alarm_bar_chart.dataSource.read();
        }, 5000);
    }

    /***************************************************************************************************************/
    /* by shkoh 20190212: Detail View Resize Code Start                                                            */
    /***************************************************************************************************************/
    function detailViewContentResizing() {
        const detail_equipoment_level_chart = $('#alarmBarChart').data('kendoChart');
        const detail_sensor_grid = $('#detail-sensor-table').data('kendoGrid');

        if(detail_equipoment_level_chart) {
            detail_equipoment_level_chart.options.chartArea.height = calcDetailEquipmentLevelChartHeight();
            detail_equipoment_level_chart.redraw();
        }

        if(detail_sensor_grid) {
            $('#detail-sensor-table').height(calcDetailSensorTableHeight());
            detail_sensor_grid.resize();
        }
    }

    function calcDetailEquipmentLevelChartHeight() {
        const detail_view_h = parseFloat($('.panel').height());
        const title_h = parseFloat($('#detail-title').height());

        return detail_view_h - title_h - 6;
    }

    function calcDetailSensorTableHeight() {
        const detail_view_h = parseFloat($('.panel').height());
        const title_h = parseFloat($('#detail-title').height());
        const equip_detail_table_h = parseFloat($('#detail-equip-table').height());

        return detail_view_h - title_h - equip_detail_table_h - 30;
    }
    /***************************************************************************************************************/
    /* by shkoh 20190212: Detail View Resize Code End                                                              */
    /***************************************************************************************************************/

    /***************************************************************************************************************/
    /* by shkoh 20190212: Fault Statistics Dashboard Start                                                         */
    /***************************************************************************************************************/
    function createAlarmBarChartDetailView() {
        const innerHtml =
        '<div id="alarmBarChart">' +
        '</div>';

        $(detail_id).html(innerHtml);
    }

    function createChartLevelStatistics(info) {
        $('#alarmBarChart').kendoChart({
            dataSource: {
                transport: {
                    read: {
                        type: 'GET',
                        dataType: 'json',
                        cache: false,
                        url: `/api/alarm/dashboard/statistics?id=${info.id.substr(2)}`
                    }
                },
                group: { field: 'idx' },
                sort: { field: 'idx', dir: 'desc' },
                requestEnd: function(e) {
                    if(e.type == 'read') {
                        const items = e.response;
                        let max_value = items[0].value;
                        items.forEach(function(item) {
                            max_value = Math.max(max_value, item.value);
                        });

                        let digit = max_value == 0 ? 1 : Math.pow(10, parseInt(Math.log10(max_value)));
                        let result = parseInt(max_value / digit) * (digit / 10);

                        const alarm_bar_chart = $('#alarmBarChart').data('kendoChart');
                        alarm_bar_chart.options.valueAxis.majorUnit = result < 1 ? 1 : result;
                    }
                }
            },
            persistSeriesVisibility: true,
            legend: {
                position: 'top',
                labels: {
                    font: '0.9em Nanum Barun Gothic'
                }
            },
            seriesColors: [ '#0161b8', '#ff9c01', '#fe6102', '#de0303', '#86019b', '#000000', '#656565' ],
            series: [{
                field: 'value',
                name: '#: group.items[0].alarm_name #',
                labels: {
                    visible: true,
                    font: '0.9em Nanum Barun Gothic',
                    margin: {
                        left: 5,
                        bottom: 0
                    },
                    template: '#: dataItem.alarm_name #\n#: value #건'
                },
                spacing: 0.2
            }],
            chartArea: {
                height: calcDetailEquipmentLevelChartHeight()
            },
            valueAxis: {
                majorTicks: {
                    visible: false
                },
                majorGridLines: {
                    dashType: 'dot'
                },
                majorUnit: 2,
            },
            theme: 'bootstrap'
        });
    }
    /***************************************************************************************************************/
    /* by shkoh 20190212: Fault Statistics Dashboard End                                                           */
    /***************************************************************************************************************/

    /***************************************************************************************************************/
    /* by shkoh 20190212: Equipment Detail View Start                                                              */
    /***************************************************************************************************************/
    function createEquipmentDetailView(info) {
        let innerHtml =
        '<div id="detail-table">' +
            '<table id="detail-equip-table" class="table">' +
                '<tbody>' +
                    '<tr>' +
                        '<th>네트워크</th>' +
                        '<td><span id="detail-equip-network"></span></td>' +
                    '</tr>' +
                    '<tr>' +
                        '<th>갱신시간</th>' +
                        '<td><span id="detail-equip-updatetime"></span></td>' +
                    '</tr>' +
                    '<tr>' +
                        '<th>장애등급</th>' +
                        '<td><span id="detail-equip-level"></span></td>' +
                    '</tr>' +
                '</tbody>' +
            '</table>' +
            '<div id="detail-sensor-table">' +
            '</div>'
        '</div>';

        $(detail_id).html(innerHtml);
    }

    function getEquipmentDetailInfo(info) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                async: true,
                type: 'GET',
                dataType: 'json',
                cache: false,
                url: `/api/alarm/dashboard/equipmentinfo?id=${info.id.substr(2)}`
            }).done(function(item) {
                $('#detail-equip-network').text(item.network_msg);
                $('#detail-equip-level').text(item.level_msg);
                $('#detail-equip-updatetime').text(item.update_time);

                markCurrentLevel('#detail-equip-level', item.b_use == 'N' ? 6 : item.current_level);
            }).fail(function(xhr) {
                console.error('[설비세부정보 가져오기 오류] ' + xhr.responseText);
            }).then(function() {
                resolve();
            });
        });
    }

    function getEquipmentSensorDetailInfo(info) {
        return new Promise(function(resolve, reject) {
            m_sensor_data_source = new kendo.data.DataSource({
                transport: {
                    read: {
                        type: 'GET',
                        dataType: 'json',
                        cache: false,
                        url: `/api/alarm/dashboard/sensorlist?parent=${info.id.substr(2)}`
                    }
                },
                autoSync: false,
                batch: false,
                schema: {
                    model: {
                        id: 'id',
                        fields: {
                            id: { type: 'number', editable: false, nullable: true },
                            sensor_id: { type: 'number', editable: false, nullable: true },
                            sensor_type: { type: 'string', editable: false },
                            name: { type: 'string', editable: false },
                            value: { type: 'string', editable: false },
                            unit: { editable: false },
                            event: { editable: false },
                            level: { type: 'number', editable: false },
                            equipAvailable: { editable: false },
                            equipLevel: { editable: false }
                        }
                    }
                }
            });

            $('#detail-sensor-table').kendoGrid({
                dataSource: m_sensor_data_source,
                groupable: false,
                filterable: true,
                sortable: true,
                resizable: true,
                columnMenu: false,
                editable: false,
                noRecords: {
                    template:
                    '<div style="display:table;width:100%;height:100%;">' +
                        '<h4 style="margin:0px;display:table-cell;vertical-align:middle;">' +
                            '<span class="label label-info" style="border-radius:0px;">' +
                                '센서가 존재하지 않습니다' +
                            '</span>' +
                        '</h4>' +
                    '</div>'
                },
                selectable: 'row',
                navigatable: false,
                pageable: false,
                persistSelection: true,
                columns: [
                    { field: 'id', width: 35, title: 'Idx', filterable: false, format: '{0:0}', headerAttributes: { style: 'text-align: center;' }, attributes: { style: 'text-align: center;' } },
                    { field: 'name', title: 'Name', filterable: true, headerAttributes: { style: 'text-align: center;' }, attributes: { style: 'text-align: center;' } },
                    {
                        field: 'value',
                        title: 'value',
                        filterable: false,
                        sortable: false,
                        headerAttributes: { style: 'text-align: center;' },
                        attributes: { style: 'text-align: center;' },
                        template: function(e) {
                            let star = '';
                            if(e.sensor_comm_status == 4) star = '* ';

                            return '<span class="sensor-detail-level_' + e.level + ' sensor-detail-level_' + e.event + '">' + star + e.value + '<span class="detail-unit">' + e.unit + '</span></span>';
                        }
                    }
                ],
                dataBound: function(e) {
                    this.autoFitColumn('name');

                    const grid = this;
                    grid.tbody.find('tr').on('dblclick', function(evt) {
                        const item = grid.dataItem(this);
                        if(item.sensor_type.substr(0, 1) == 'D') {
                            alert('수치값을 제공하는 수집항목만 그래프 조회가 가능합니다');
                            return;
                        }
                        
                        window.open(`/popup/chart?sensor_id=${item.sensor_id}`, `SensorChart_S${item.sensor_id}`, `scrollbars=1, menubar=no, resizable=no, location=no, titlebar=no, toolbar=no, status=no, width=1000, height=400`);
                    });
                },
                height: calcDetailSensorTableHeight()
            });

            resolve();
        });
    }

    /**
     * element_id에 level에 따른 스타일을 적용
     * 
     * @param {String} element_id element id
     * @param {Number} level equipment level
     */
    function markCurrentLevel(element_id, level) {
        let style_value = { "padding": "3px", 'color': '#ffffff', 'border-radius': '4px', 'text-shadow': '1px 1px #111111' };
        switch(level) {
            case 0: style_value['background-color'] = '#0161b8'; break; // by shkoh 20190212: 0 -> 정상
            case 1: style_value['background-color'] = '#ff9c01'; break; // by shkoh 20190212: 1 -> 주의
            case 2: style_value['background-color'] = '#fe6102'; break; // by shkoh 20190212: 2 -> 경고
            case 3: style_value['background-color'] = '#de0303'; break; // by shkoh 20190212: 3 -> 위험
            case 4: style_value['background-color'] = '#511a81'; break; // by shkoh 20190212: 4 -> 응답없음
            case 5: style_value['background-color'] = '#000000'; break; // by shkoh 20190212: 5 -> 통신불량
            case 6: style_value['background-color'] = '#656565'; break; // by shkoh 20190212: 6 -> 사용안함
            default: style_value['color'] = '#000000'; style_value['text-shadow'] = 'none'; break;
        }

        $(element_id).css(style_value);
    }
    /***************************************************************************************************************/
    /* by shkoh 20190212: Equipment Detail View End                                                                */
    /***************************************************************************************************************/

    return {
        ShowDetailView: function(info) {
            if(m_equipment_info_interval_id) clearInterval(m_equipment_info_interval_id);
            if(m_chart_info_interval_id) clearInterval(m_chart_info_interval_id);

            m_current_id = (info == undefined) ? undefined : info.id;
            m_current_kind = (info == undefined) ? undefined : info.kind;

            if(info == undefined) {
                setDetailViewTitle('그룹/설비 상세현황');
                clearDetailView();
            } else if(info.type == 'equipment') {
                setDetailViewTitle(info.name + ' - 설비 세부정보');
                createEquipmentDetailView(info);

                const equip_detail_info = getEquipmentDetailInfo(info);
                const sensor_detail_info = getEquipmentSensorDetailInfo(info);
                Promise.all([ equip_detail_info, sensor_detail_info ]).then(function() {
                    pollingEquipmentInfoRedraw(info);
                });
            } else if(info.type == 'group') {
                setDetailViewTitle('[' + info.name + '] 내 설비 통계현황');

                createAlarmBarChartDetailView();
                createChartLevelStatistics(info);

                pollingChartInfoRedraw();
            }
        },
        
        ResizeDetailView: function() { detailViewContentResizing(); },

        GetCurrentId: function() { return m_current_id; },

        RedrawDetailView: function(info) {
            let redraw_id = (info.type == 'group' ? 'G_' : info.type == 'equipment' ? 'E_' : 'S_') + info.id;

            switch(info.command) {
                case 'delete':
                    if(m_current_id == redraw_id) clearDetailView();
                break;
                case 'notify':
                    if(info.type == 'equipment' && info.level < 4) break;

                    // by shkoh 20190213: DetailView에서 notify에 대한 반응은 Equipment 혹은 Sensor 알람 발생 시 Redraw를 수행
                    if(info.type == 'sensor') redraw_id = 'E_' + info.pid;
                    if(m_current_id == redraw_id) {
                        const info = {
                            id: m_current_id,
                            kind: m_current_kind
                        }

                        const equip_detail_info = getEquipmentDetailInfo(info);
                        Promise.all([ equip_detail_info ]).then(function() {
                            m_sensor_data_source.read();
                        });
                    }
                break;
            }
        }
    }
}