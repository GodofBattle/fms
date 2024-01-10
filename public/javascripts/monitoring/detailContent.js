const DetailViewContent = function(_id) {
    const detail_id = _id;
    
    let m_current_id = undefined;
    let m_current_kind = undefined;
    
    let m_equipment_info_interval_id = undefined;
    let m_chart_info_interval_id = undefined;
    
    let m_sensor_data_source = undefined;

    /***************************************************************************************************************/
    /* by shkoh 20180524: 상세보기 - Resize 시작                                                                    */
    /***************************************************************************************************************/
    function detailViewContentResizing() {
        const detail_sensor_grid = $('#detail-sensor-table').data('kendoGrid');
        const detail_equipment_level_chart = $('#alarmBarChart').data('kendoChart');
        
        if(detail_sensor_grid) {    
            detail_sensor_grid.setOptions({ height: calcDetailSensorTableHeight() });
            
            $('#detail-sensor-table .k-auto-scrollable').mCustomScrollbar({
                theme: 'minimal-dark',
                axis: 'y',
                scrollbarPosition: 'outside',
                mouseWheel: {
                    preventDefault: false
                }
            });
        }

        if(detail_equipment_level_chart) {
            detail_equipment_level_chart.options.chartArea.height = calcDetailEquipmentLevelChartHeight();
            detail_equipment_level_chart.redraw();
        }
    }

    function calcDetailSensorTableHeight() {
        const detail_view_h = parseFloat($('#grid-detail').height());
        const title_h = parseFloat($('#grid-detail-item-title-bar').height());
        const equip_detail_table_h = parseFloat($('#detail-equip-table').height());

        return detail_view_h - title_h - equip_detail_table_h - 30;
    }

    function calcDetailEquipmentLevelChartHeight() {
        const detail_view_h = parseFloat($('#grid-detail').height());
        const title_h = parseFloat($('#grid-detail-item-title-bar').height());

        return detail_view_h - title_h - 30;
    }
    /***************************************************************************************************************/
    /* by shkoh 20180524: 상세보기 - Resize 끝                                                                      */
    /***************************************************************************************************************/

    /***************************************************************************************************************/
    /* by shkoh 20180524: 상세보기 - 공통 코드 시작                                                                  */
    /***************************************************************************************************************/
    function createDetailView() {
        const innerHtml =
        '<div id="grid-detail-item-title-bar" class="grid-detail item-title grid-item-draggable">' + 
            '<h3 style="display: flex;">' +
                '<span id="grid-detail-item-title" style="flex: 1;">상세보기</span>' +
                '<span class="panel_close_icon"></span>' +
            '</h3>' +
        '</div>' +
        '<div id="grid-detail-content" class="item-content">' +
        '</div>';

        $(detail_id).html(innerHtml);
    }

    function setDetailViewTitle(title) {
        $('#grid-detail-item-title').text(title);
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
            Promise.all([ equip_detail_info ]);

            // by shkoh 20210325: grid에서 데이터를 읽어야 깜빡임이 없다
            // m_sensor_data_source.read();
            $('#detail-sensor-table').data('kendoGrid').dataSource.read();
            $('#detail-sensor-table').data('kendoGrid').refresh();
        }, 5000);
    }

    function pollingChartInfoRedraw() {
        m_chart_info_interval_id = setInterval(function() {
            if($('#alarmBarChart').length == 0) {
                clearInterval(m_chart_info_interval_id);
                return;
            }

            const alarm_bar_chart = $('#alarmBarChart').data('kendoChart');
            if(alarm_bar_chart) alarm_bar_chart.dataSource.read();
        }, 5000);
    }
    /***************************************************************************************************************/
    /* by shkoh 20180524: 상세보기 - 공통 코드 끝                                                                    */
    /***************************************************************************************************************/

    /***************************************************************************************************************/
    /* by shkoh 20180530: 장애 통계 차트 정보보기 js 코드 시작                                                        */
    /***************************************************************************************************************/
    function createAlarmBarChartDetailView() {
        const innerHtml =
        '<div id="alarmBarChart">' +
        '</div>';

        $('#grid-detail-content').html(innerHtml);
    }

    function setLabel(param) {
        const alarm_name = param.dataItem.alarm_name;
        const name_length = alarm_name.length;
        let new_name = '';
        let label_name = ''; 

        for(let idx=0; idx<name_length; idx+=2) {
            new_name += alarm_name.substr(idx, 2) + '\n';
        }
        label_name = new_name + param.dataItem.value + '건';

        return label_name;
    }

    function createChartLevelStatistics(info) {
        $('#alarmBarChart').kendoChart({
            dataSource: {
                transport: {
                    read: {
                        type: 'GET',
                        dataType: 'json',
                        cache: true,
                        url: '/api/monitoring/statistics?type=' + info.type + '&id=' + info.id.substr(2)
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
                        if(alarm_bar_chart.options) {
                            alarm_bar_chart.options.valueAxis.majorUnit = result < 1 ? 1 : result;
                        }
                    }
                }
            },
            persistSeriesVisibility: true,
            legend: {
                position: 'top',
                labels: {
                    font: '10px',
                    color: $('body').is('.wrfis, .kepco') ? '#ffffff' : '#333333'
                }
            },
            seriesColors: [ '#0161b8', '#ff9c01', '#fe6102', '#de0303', '#86019b', '#000000', '#656565', ],
            series: [{
                border: {
                    width: 1,
                    color: '#ffffff'
                },
                field: 'value',
                name: '#: group.items[0].alarm_name #',
                labels: {
                    visible: true,
                    font: '10px',
                    margin: {
                        left: 5,
                        bottom: -5
                    },
                    template: setLabel,
                    color: $('body').is('.wrfis, .kepco') ? '#ffffff' : '#333333'
                },
                spacing: 0.2
            }],
            chartArea: {
                height: calcDetailEquipmentLevelChartHeight(),
                background: ''
            },
            valueAxis: {
                majorGridLines: {
                    dashType: 'dot'
                },
                majorUnit: 1,
                labels: {
                    color: $('body').is('.wrfis, .kepco') ? '#ffffff' : '#333333'
                }
            },
            theme: 'bootstrap'
        });
    }
    /***************************************************************************************************************/
    /* by shkoh 20180530: 장애 통계 차트 정보보기 js 코드 끝                                                         */
    /***************************************************************************************************************/

    /***************************************************************************************************************/
    /* by shkoh 20180517: 설비 정보보기 js 코드 시작                                                                 */
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
            //by MJ 2023.08.28 : 설비 세부정보 테이블 html
            '<div id="detail-sensor-table">' +
            '</div>' +
        '</div>';

        $('#grid-detail-content').html(innerHtml);
    }

    //by MJ 2023.09.04 : 자산 클릭시 컨테인먼트에 나오는 상태창
    function getEquipmentDetailInfo(info) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                async: true,
                type: 'GET',
                dataType: 'json',
                cache: false,
                url: '/api/monitoring/equipment?id=' + info.id.substr(2)
            }).done(function(item) {
                $('#detail-equip-network').text(item.network_msg);
                //by MJ 2023.08.28 : 세부정보 value값 
                $('#detail-equip-level').text(item.level_msg);
                $('#detail-equip-updatetime').text(item.update_time);
                //by MJ 2023.08.28 : 장애등급
                markCurrentLevel('#detail-equip-level', (item.b_use == 'N' ? 6 : item.current_level));
            }).fail(function(err_msg) {
                console.error(err_msg);
            }).then(function() {
                resolve();
            });
        });
    }


    //bt MJ 2023.09.04 : 설비 세부정보 데이터값 
    function getEquipmentSensorDetailInfo(info) {        
        return new Promise(function(resolve, reject) {
            //bt MJ 2023.09.04 : 데이터 가져오기
            m_sensor_data_source = new kendo.data.DataSource({
                transport: {
                    read: {
                        type: 'GET',
                        dataType: 'json',
                        cache: true,
                        url: '/api/monitoring/sensor?parent=' + info.id.substr(2)
                    }
                },
                //by MJ 2023.09.04 : 자동동기화
                autoSync: false,
                //by MJ 2023.09.04 : 데이터 일괄처리
                batch: false,
                //by MJ 2023.09.04 : 스키마란, 데이터를 어떻게 정리하고 표시할지에 대한 규칙이나 설계 도면과 같은 것
                schema: {
                    model: {
                        id: 'id',
                        //by MJ 2023.09.04 : 데이터 key값
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

            //by MJ 2023.08.28 : 설비 세부정보 테이블 킨도그리드 옵션구성
            $('#detail-sensor-table').kendoGrid({
                dataSource: m_sensor_data_source,
                //by MJ 2023.08.28 : 데이터 그룹화 (데이터를 특정 기준에 따라 묶을 수 있음)
                groupable: false,
                //by MJ 2023.08.28 : 데이터 소스 필터링
                filterable: true,
                //by MJ 2023.08.28 : 열 머리글 클릭시 열 필드를 기준으로 그리드를 정렬
                sortable: true,
                //by MJ 2023.08.28 : 크기 조정가능
                resizable: true,
                //by MJ 2023.08.28 : 열 메뉴
                columnMenu: false,
                 //by MJ 2023.08.28 : 데이터 편집기능
                editable: false,
                 //by MJ 2023.08.28 : 데이터 없을때 렌더링되는 템플릿
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
                //by MJ 2023.08.28 : 선택기능
                selectable: 'row',
                //by MJ 2023.08.28 : 키보드 탐색기능
                navigatable: false,
                //by MJ 2023.08.28 : 데이터를 여러 페이지로 나눠서 표시하는 기능
                pageable: false,
                //by MJ 2023.08.28 : 선택유지
                persistSelection: true,
                scrollable: true,
                //by MJ 2023.09.04 : 데이터 가져와서 key값을 대입하여 킨도ui테이블로 그리드 구성
                //by MJ 2023.08.28 : 테이블 열의 구성
                columns: [
                    { field: 'id', width: 35, title: 'Idx', filterable: false, format: '{0:0}', headerAttributes: { style: 'text-align:center;' }, attributes: { style: 'text-align:center' } },
                    { field: 'name', title: 'Name', filterable: true, headerAttributes: { style: 'text-align:center;' }, attributes: { style: 'text-align:center' } },
                    {
                        field: 'value',
                        title: 'Value',
                        filterable: false,
                        sortable: false,
                        headerAttributes: { style: 'text-align:center;' },
                        attributes: { style: 'text-align:center' },
                        template: function(e) {
                            let star = '';
                            if(e.sensor_comm_status == 4) star = '* ';
                            //by MJ 2023.08.29 : <센서레벨 = 0, 이벤트 = 온도만 Y, 나머지는 N> 해당 값 <e.unit=단위> 단위
                            return '<span class="sensor-detail-level_' + e.level + ' sensor-detail-level_' + e.event + '">' + star + e.value + '<span class="detail-unit">' + e.unit + '</span></span>';
                        }
                    }
                ],
                height: calcDetailSensorTableHeight(),
                //by MJ 2023.09.04 : 테이블 행 더블클릭시 팝업창 이벤트
                dataBound: function(e) {
                    this.autoFitColumn('value');

                    const grid = this;
                    grid.tbody.find('tr').on('dblclick', function(evt) {
                        const item = grid.dataItem(this);                        
                        const url = '/popup/chart?sensor_id=' + item.sensor_id;
                        const target = 'SensorChart_S' + item.sensor_id;
                        window.open(url, target, 'scrollbars=1, menubar=no, resizable=no, location=no, titlebar=no, toolbar=no, status=no, width=1000, height=400');
                    });

                    e.sender.element.children('.k-grid-header').css('padding-right', '0px');
                }
            });

            $('#detail-sensor-table .k-auto-scrollable').mCustomScrollbar({
                theme: 'minimal-dark',
                axis: 'y',
                scrollbarPosition: 'outside',
                mouseWheel: {
                    preventDefault: false
                }
            });

            resolve();
        });
    }
    
    function markCurrentLevel(htmlID, level) {
        let style_value = { "padding": "3px", 'color': '#ffffff', 'border-radius': '4px', 'text-shadow': '1px 1px #111111' };
        switch(level) {
            case 0: style_value['background-color'] = '#0161b8'; break; // by shkoh 20180518: 0 -> 정상
            case 1: style_value['background-color'] = '#ff9c01'; break; // by shkoh 20180518: 1 -> 주의
            case 2: style_value['background-color'] = '#fe6102'; break; // by shkoh 20180518: 2 -> 경고
            case 3: style_value['background-color'] = '#de0303'; break; // by shkoh 20180518: 3 -> 위험
            case 4: style_value['background-color'] = '#511a81'; break; // by shkoh 20180518: 4 -> 응답없음
            case 5: style_value['background-color'] = '#000000'; break; // by shkoh 20180518: 5 -> 통신불량
            case 6: style_value['background-color'] = '#656565'; break; // kdh 20181212: 6 -> 사용안함
            default: style_value['color'] = '#000000'; style_value['text-shadow'] = 'none'; break;
        }
        $(htmlID).css(style_value);
    }
    /***************************************************************************************************************/
    /* by shkoh 20180517: 설비 정보보기 js 코드 끝                                                                    */
    /***************************************************************************************************************/

    //by MJ 2023.08.28 : 설비의 네트워크 정보, 갱신 시간 등을 표시
    return {
        CreateDetailView: function() { createDetailView(); },
        
        ResizingDetailView: function() { detailViewContentResizing() },

        ShowDetailView: function(info) {
            //by MJ 2023.09.05 : 반복중단
            if(m_equipment_info_interval_id) clearInterval(m_equipment_info_interval_id);
            if(m_chart_info_interval_id) clearInterval(m_chart_info_interval_id);

            m_current_id = (info == undefined) ? undefined : info.id;
            m_current_kind = (info == undefined) ? undefined : info.kind;
            
            if(info == undefined) {
                createDetailView();
            } else if(info.type == 'equipment') {
                setDetailViewTitle(info.name + ' - 설비 세부정보');
                createEquipmentDetailView(info);
                
                const equip_detail_info = getEquipmentDetailInfo(info);
                const sensor_detail_info = getEquipmentSensorDetailInfo(info);
                Promise.all([ equip_detail_info, sensor_detail_info ]);

                pollingEquipmentInfoRedraw(info);
            } else if(info.type == 'group' || info.type == 'code') {
                setDetailViewTitle('[' + info.name + '] 장애 통계현황');
            
                createAlarmBarChartDetailView();
                createChartLevelStatistics(info);

                pollingChartInfoRedraw();
            }
        },

        GetCurrentId: function() { return m_current_id; },

        RedrawDetailView: function(info) {
            let redraw_id = (info.type == 'group' ? 'G_' : info.type == 'equipment' ? 'E_' : 'S_') + info.id;

            switch(info.command) {
                case 'delete':
                    if(m_current_id == redraw_id) createDetailView();
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
                            if(m_sensor_data_source == undefined) return;
                            
                            m_sensor_data_source.read();
                        });
                    }
                break;
                case 'update':
                    if(m_current_id == redraw_id) {
                        let title = '';
                        
                        if(info.type == 'group' || info.type == 'code') {
                            title = '[' + info.name + '] 장애 통계현황';
                        } else if(info.type == 'equipment') {
                            title = info.name + ' - 설비 세부정보';
                        }

                        setDetailViewTitle(title);
                    }
                break;
            }
        }
    }
}