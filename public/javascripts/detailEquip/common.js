/// <reference path="../../../typings/jquery/jquery.d.ts"/>
/// <reference path="../../../typings/kendo-ui/kendo.all.d.ts"/>

let g_window_w = 620;
let g_window_h = 600;

let g_AnalogValuesDataSource = undefined;
let g_DigitalValuesDataSource = undefined;
let g_diSensorDataSource = undefined;

let g_start_date = undefined;
let g_end_date = undefined;
let g_sensor_id = undefined;

const g_alarm_color = [ "#0161b8", "#ff9c01", "#f3852e", "#de0303" ];

$(window).on('resize', function() {
    resizeWindow();
});

$(document).ready(function() {
    resizeWindow();

    createAnalogValues();
    createAnalogValuesDatasource();
    createDigitalValues();
    createDigitalValuesDatasource();
    createDISensorHistory();
    createDateTime();
    
    /**
     * by wchoi 20180928: 센서들의 값을 주기적으로 갱신해 상태를 파악한다.
     * 1. 센서타입 AI와 DI의 현재값은 5초마다 현재값과 상태를 갱신한다.
     * 2. AI는 DI와 달리 최소, 평균, 최대값이 존재하므로 AI는 매 시간 10분 주기마다 갱신한다.
     */
    loopAlarm();
    
    initPanel();
    createTab();
    setTab();
    closeChart();

    $('#btn-search').on('click', function() { getSearchResult(); });
});

function resizeWindow() {
    window.resizeTo(g_window_w, g_window_h);
}

/**
 * by wchoi 20180928
 * window open 시 처음 style 설정
 */
function initPanel() {
    g_window_w = 620;
    $('#section-panel').css('width', '100%');
    $('#aside-panel').css('width', '0%');
    $('#aside-panel').css('border-top', '0px');
    $('#aside-panel').css('border-right', '0px');
    $('#aside-panel').css('border-bottom', '0px');
    $('#sensor_title').hide();
    $('#AISensorChartPanel').hide();
    $('#DISensorGridPanel').hide();
    $('#search').hide();
    resizeWindow();
}

/**
 * by wchoi 20180928
 * chart 발현 후 style 설정
 */
function setPanelonChart() {
    g_window_w = 1240;
    $('#section-panel').css('width', '50%');
    $('#aside-panel').css('width', '50%');
    $('#aside-panel').css('height','448px');
    $('#aside-panel').css('border-top', '3px solid #172f51');
    $('#aside-panel').css('border-right', '3px solid #172f51');
    $('#aside-panel').css('border-bottom', '3px solid #172f51');
    $('#sensor_title').show();
    $('#AISensorChartPanel').show();
    resizeWindow();
}

function setPanelonGrid(sensor_id, sensor_name) {
    g_window_w = 1240;
    g_sensor_id = sensor_id;
    $(".grid_title").text('DI Sensor 값 변경 기록 (센서명 : '+ sensor_name + ')') ;
    $('#section-panel').css('width', '50%');
    $('#aside-panel').css('width', '50%');
    $('#aside-panel').css('height','448px');
    $('#aside-panel').css('border-top', '3px solid #172f51');
    $('#aside-panel').css('border-right', '3px solid #172f51');
    $('#aside-panel').css('border-bottom', '3px solid #172f51');
    $('#sensor_title').show();
    $('#DISensorGridPanel').show();
    $('#search').show();
    resizeWindow();
}

/**
 * by wchoi 20180928
 * tab 생성
 */
function createTab() {
    $("#tab-panel").kendoTabStrip({
        tabPosition: "bottom",
        animation: false,
        select: onSelect
    });
}

/**
 * by wchoi 20180928
 * tab 하단 메뉴 클릭 시 이벤트
 * chart가 열려 있는 상태에서 DigitalValues를 선택 시 chart hide 적용
 * @param {Object} e click event object
 */
function onSelect(e) {
    if(e.contentElement.id == 'digitalValuesInfo') {
        initPanel();
    }
}

/**
 * by wchoi 20180928
 * tab 초기 이벤트
 * sensorType의 종류에 따라 해당하지 않는 type을 disable 적용
 * sensorType DI의 경우 두번째 탭에 있으므로 강제 선택 적용
 */
function setTab() {
    const tabStrip = $("#tab-panel").data("kendoTabStrip");
    const splitSensorType = g_sensorType.split(",");

    splitSensorType.forEach(function(item) {
        switch(item) {
            case 'AI':
            case 'AO':
                g_AnalogValuesDataSource.read();
                tabStrip.disable(tabStrip.tabGroup.children().eq(1));
                break;
            case 'DI':
            case 'DO':
                createDISensorHistory();
                g_DigitalValuesDataSource.read();
                tabStrip.select(tabStrip.tabGroup.children("li").eq(1));
                tabStrip.disable(tabStrip.tabGroup.children().eq(0));
                break;
        }
    });
}

function createDateTime() {
    const date = new Date();

    $('#start_date').datetimepicker({
        lang: 'kr',
        value: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' 00:00:00',
        format: 'Y-m-d H:i:s',
        formatTime: 'H:i',
        formatDate: 'Y-m-d',
        mask: true,
        onShow: function(ct) {
            this.setOptions({ maxDate: date });
        }
    });

    $('#end_date').datetimepicker({
        lang: 'kr',
        value: new Date(),
        format: 'Y-m-d H:i:s',
        formatTime: 'H:i',
        formatDate: 'Y-m-d',
        mask: true,
        onShow: function(ct) {
            this.setOptions({ maxDate: date });
        }
    });

    // g_start_date = $('#start_date').val().toString();
    // g_end_date = $('#end_date').val().toString();
}

function createAnalogValues() {
    $('#AnalogValuesGrid').kendoGrid({
        filterable: false,
        resizable: true,
        editable: false,
        noRecords: {
            template:
                '<div style="display:table;width:100%;height:100%;">' +
                    '<h3 style="margin:0px;display:table-cell;vertical-align:middle;">' +
                        '<span class="label label-default" style="border-radius:0px;">' +
                            '설비의 AnalogValues값들이 없습니다.' +
                        '</span>' +
                    '</h3>' +
                '</div>'
        },
        navigatable: true,
        columns: [
            { field: "node_id", title: "Idx", width: 30, headerAttributes: { style: 'text-align:center; font-weight: bold;' } },
            { field: "sensor_name", title: "센서명", width: 165, headerAttributes: { style: 'text-align:center; font-weight: bold;' }, template: "#:sensor_name# #=getSensorChartButton(data)#" },
            { field: "current_value", title: "현재값", width: 85, headerAttributes: { style: 'text-align:center; font-weight: bold;' }, template: "#=setAIAlarmColor(data)#" },
            { field: "minVal", title: "최소", width: 50, headerAttributes: { style: 'text-align:center; font-weight: bold;' }, template: "#:data.minVal# #:data.disp_unit#" },
            { field: "avgVal", title: "평균", width: 50, headerAttributes: { style: 'text-align:center; font-weight: bold;' }, template: "#:data.avgVal# #:data.disp_unit#" },
            { field: "maxVal", title: "최대", width: 50, headerAttributes: { style: 'text-align:center; font-weight: bold;' }, template: "#:data.maxVal# #:data.disp_unit#" }
        ],
        height: g_window_h - 160
    });
}

function createAnalogValuesDatasource() {
    g_AnalogValuesDataSource = new kendo.data.DataSource({
        transport: {
            read: {
                type: "GET",
                dataType: "json",
                async: true,
                url: "/sensor/getDetailSensorInfo?equip_id=" + g_equipId //+ "&sensorType=" + sensorType
            },
            parameterMap: function(data, type) {
                if(type == "read") {
                    return data;
                }
            }
        },
        autoSync: false,
        batch: true,
        schema: {
            model: {
                id: "sensor_id",
                fields: {
                    node_id: { editable: false},
                    sensor_id: { editable: false },
                    sensor_name: { editable: false },
                    current_value: { editable: false },
                    current_level: { editable: false },
                    is_alarm: { editable: false },
                    disp_unit: {editable: false },
                    minVal: { editable: false },
                    maxVal: { editable: false },
                    avgVal: { editable: false }
                }
            }
        }
    });

    $('#AnalogValuesGrid').data('kendoGrid').setDataSource(g_AnalogValuesDataSource);
}

/**
 * by wchoi 20180928
 * 차트를 나타내기 위한 버튼 설정
 * @param {JSON} data 클릭한 grid의 JSON data
 */
function getSensorChartButton(data) {
    return '<button class="btn-chart" type="button" onClick="getDetailAISensorHistory(' + data.sensor_id +  ', \'' + data.sensor_name + '\', \'' + data.disp_unit + '\')"></button>';
}

/**
 * by wchoi 20180928
 * 현재값 및 상태값을 기준으로 알람을 가시적으로 설정
 * @param {JSON} data ajax로 호출된 JSON data
 */
function setAIAlarmColor(data) {
    let alarmColor = null;
    const fontColor = "#ffffff";

    switch(data.current_level) {
        case 0: alarmColor = g_alarm_color[0]; break;
        case 1: alarmColor = g_alarm_color[1]; break;
        case 2: alarmColor = g_alarm_color[2]; break;
        case 3: alarmColor = g_alarm_color[3]; break;
        default: alarmColor = "transparent"; break;
    }

    if(data.is_alarm == 'N') alarmColor = "transparent";
    
    return '<span style="padding: 2px 6px 2px 6px; border-radius: 4px; cursor:default; color:' + fontColor + '; background-color:' + alarmColor + ';">'+ data.current_value + ' ' + data.disp_unit +'</span>';
}

function createDigitalValues() {
    $('#DigitalValuesGrid').kendoGrid({
        filterable: false,
        resizable: true,
        editable: false,
        noRecords: {
            template:
                '<div style="display:table;width:100%;height:100%;">' +
                    '<h3 style="margin:0px;display:table-cell;vertical-align:middle;">' +
                        '<span class="label label-default" style="border-radius:0px;">' +
                            '설비의 DigitalValues값들이 없습니다.' +
                        '</span>' +
                    '</h3>' +
                '</div>'
        },
        navigatable: true,
        columns: [
            { field: 'node_id', title: 'Idx', width: 30, headerAttributes: { style: 'text-align:center; font-weight: bold;' } },
            { field: 'sensor_name', title: '센서명', width: 180, headerAttributes: { style: 'text-align:center; font-weight: bold;' }, template: "#:sensor_name# #=getSensorDIHistoryButton(data)#" },
            { field: '', title: '현재상태', width: 240, headerAttributes: { style: 'text-align:center; font-weight: bold;' }, template: "#=setDIAlarmColor(data)#" }
        ],
        height: g_window_h - 160
    });
}

function createDigitalValuesDatasource() {
    g_DigitalValuesDataSource = new kendo.data.DataSource({
        transport: {
            read: {
                type: "GET",
                dataType: "json",
                async: true,
                url: "/sensor/getDetailSensorInfo?equip_id=" + g_equipId //+ "&sensorType=" + sensorType
            },
            parameterMap: function(data, type) {
                if(type == "read") {
                    return data;
                }
            }
        },
        autoSync: false,
        batch: true,
        schema: {
            model: {
                id: "sensor_id",
                fields: {
                    node_id: { editable: false},
                    sensor_id: { editable: false },
                    sensor_name: { editable: false },
                    d_value_0_label: { editable: false },
                    d_value_1_label: { editable: false },
                    d_value_2_label: { editable: false },
                    d_value_3_label: { editable: false },
                    d_value_4_label: { editable: false },
                    d_value_5_label: { editable: false },
                    d_value_6_label: { editable: false },
                    d_value_7_label: { editable: false }
                }
            }
        }
    });

    $("#DigitalValuesGrid").data("kendoGrid").setDataSource(g_DigitalValuesDataSource);
}

/**
 * by wchoi 20180928
 * 현재값 및 상태값을 기준으로 텍스트 설정
 * @param {JSON} data ajax로 호출된 JSON data
 */
function setDIAlarmColor(data) {
    let dSensorValues = [ data.d_value_0_label, data.d_value_1_label, data.d_value_2_label, data.d_value_3_label,
        data.d_value_4_label, data.d_value_5_label, data.d_value_6_label, data.d_value_7_label ];

    let alarmColorText = setDIBackgroundColor(data.current_value, data.current_level, data.is_alarm, dSensorValues);

    return alarmColorText;
}

/**
 * by wchoi 20180928
 * 현재값 및 상태값을 기준으로 알람을 가시적으로 설정
 * @param {String} current_value 현재 센서값
 * @param {Number} current_level 현재 알람상태
 * @param {String} is_alarm 센서의 알람여부
 * @param {JSON} dSensorValues ajax로 호출된 현재 상태의 텍스트 구분 JSON 데이터
 */
function setDIBackgroundColor(current_value, current_level, is_alarm, dSensorValues) {
    let innerHTML = '';
    let alarmColor = null;
    const fontColor = "#ffffff";

    switch(current_level) {
        case 0: alarmColor = g_alarm_color[0]; break;
        case 1: alarmColor = g_alarm_color[1]; break;
        case 2: alarmColor = g_alarm_color[2]; break;
        case 3: alarmColor = g_alarm_color[3]; break;
        default: alarmColor = "transparent"; break;
    }

    if(is_alarm == 'N') {
        alarmColor = "transparent";
    }

    dSensorValues.forEach(function(d_value,d_idx) {
        if(current_value == d_idx) {
            innerHTML += '<span style="float: left; padding: 2px 4px 2px 4px; margin: 0px 6px 0px 0px; border-radius: 4px; cursor:default; color:' + fontColor + '; background-color:' + alarmColor + ';">'+ d_value + '</span>  '
        } else {
            innerHTML += '<span style="float: left; padding: 2px 0px 2px 0px; margin: 0px 8px 0px 0px;">' + d_value + '</span>  '
        }
    });

    return innerHTML;
}

/**
 * by wchoi 20180928
 * 일정 시간마다 알람을 갱신하고 발현
 */
function loopAlarm() {
    const splitSensorType = g_sensorType.split(",");

    setInterval(function() {
        try {
            if(splitSensorType.length == 1) {
                switch(g_sensorType) {
                    case 'AI':
                    case 'AO':
                        g_AnalogValuesDataSource.read();
                    case 'DI':
                    case 'DO':
                        g_DigitalValuesDataSource.read();
                }
            } else if(splitSensorType.length == 2) {
                switch(g_sensorType) {
                    case 'AI,AO':
                        g_AnalogValuesDataSource.read();
                    case 'DI,DO':
                        g_DigitalValuesDataSource.read();
                    default :
                        g_AnalogValuesDataSource.read();
                        g_DigitalValuesDataSource.read();
                }
            } else if(splitSensorType.length > 2) {
                g_AnalogValuesDataSource.read();
                g_DigitalValuesDataSource.read();
            }
        } catch (error) {
            console.log(error);
        }
    }, 5000);
}

/**
 * by wchoi 20180928
 * 차트 버튼 클릭 시 오늘 기준 시간당 데이터를 호출
 * @param {Number} sensor_id 센서 id
 * @param {String} sensor_name 센서명
 * @param {String} disp_unit 센서값 단위
 */
function getDetailAISensorHistory(sensor_id, sensor_name, disp_unit) {
    $(".grid_title").text('AI Sensor 값 변경 추이 (센서명 : '+ sensor_name + ')') ;
    $.ajax({
        async: true,
        url: '/sensor/getDetailSensorHistory/' + sensor_id,
        type: 'GET',
        dataType: 'json'
    }).done(function(data) {
        if(data.length == 0) {
            alert('통계데이터를 찾을 수 없습니다. 다시 확인해 주세요.');
            return;
        }

        createChart(data, sensor_name, disp_unit);
    }).fail(function(xhr, textStatus, error) {
        console.log(error);
    });
}

/**
 * by wchoi 20180928
 * 가져온 데이터로 차트를 생성
 * @param {JSON} data 호출된 시간 단위 통계데이터
 * @param {String} sensor_name 센서명
 * @param {String} disp_unit 센서값 단위
 */
function createChart(data, sensor_name, disp_unit) {
    let chartData = [];
    let chartcategories = [];
    data.forEach(function(item) {
        chartData.push(item.value);
        chartcategories.push(item.date);
    });

    $("#AISensorChartPanel").kendoChart({
        title: {
            text: "1일 동안의 평균값 그래프"
        },
        legend: {
            position: "bottom"
        },
        seriesDefaults: {
            type: "line"
        },
        series: [{
            name: sensor_name,
            data: data
        }],
        valueAxis: {
            labels: {
                format: "{0}" + disp_unit
            }
        },
        categoryAxis: {
            categories: chartcategories,
            labels: {
                format: "{0}h"
            }
        },
        tooltip: {
            visible: true,
            template: "#= value #" + disp_unit
        }
    });
    setPanelonChart();
}

/**
 * by wchoi 20180928
 * 차트가 발현된 창을 닫고 싶을 때 적용
 */
function closeChart() {
    $('#btn-close').click(function() {
        initPanel();
    });
}

function getSensorDIHistoryButton(data) {
    return '<button class="btn-grid" type="button" onClick="setPanelonGrid(' + data.sensor_id + ', \'' + data.sensor_name + '\')"></button>';
    //return '<button class="btn-grid" type="button" onClick="getDISensorHistory(' + data.sensor_id + ', \'' + data.sensor_name + '\')"></button>';
}

function createDISensorHistory() {
    $('#DISensorGridPanel').kendoGrid({
        filterable: false,
        resizable: true,
        editable: false,
        noRecords: {
            template:
                '<div style="display:table;width:100%;height:100%;">' +
                    '<h3 style="margin:0px;display:table-cell;vertical-align:middle;">' +
                        '<span class="label label-default" style="border-radius:0px; font-size: 14px;">' +
                            '해당 센서의 변경 기록이 없습니다.' +
                        '</span>' +
                    '</h3>' +
                '</div>'
        },
        navigatable: true,
        columns: [
            { field: 'idx', title: 'Idx', width: 30, headerAttributes: { style: 'text-align:center; font-weight: bold;' } },
            { field: 'current_value', title: '상태', width: 180, headerAttributes: { style: 'text-align:center; font-weight: bold;' } },
            { field: 'create_dateTime', title: '시간', width: 240, headerAttributes: { style: 'text-align:center; font-weight: bold;' } }
        ],
        height: g_window_h - 222
    });
}

function getDISensorHistory() {
    g_diSensorDataSource = new kendo.data.DataSource({
        transport: {
            read: {
                type: 'GET',
                dataType: 'json',
                async: true,
                url: '/sensor/getDiSensorHistory?equip_id=' + g_equipId + '&sensor_id=' + g_sensor_id + '&start_date=' + g_start_date + '&end_date=' + g_end_date
            }
        },
        parameterMap: function(data, type) {
            if(type == "read") {
                return data;
            }
        },
        change: function(e) {
            e.items.forEach(function(item, index) {
                item.idx = index + 1;
            })
        },
        autoSync: false,
        batch: true,
        schema: {
            model: {
                id: "hst_id",
                fields: {
                    idx: { editable: false },
                    create_dateTime: { editable: false },
                    current_value: { editable: false }
                }
            }
        }
    });

    $("#DISensorGridPanel").data("kendoGrid").setDataSource(g_diSensorDataSource);
}

function getSearchResult() {
    g_start_date = $('#start_date').val().toString();
    g_end_date = $('#end_date').val().toString();

    if(!g_start_date) {
        alert('시작일을 입력하세요.');
        return;
    }
    if(g_start_date > g_end_date) {
        alert('날짜 범위를 확인하세요.');
        return; 
    }
    if(!g_end_date) {
        alert('종료일을 입력하세요.');
        return;
    }
    getDISensorHistory();
}