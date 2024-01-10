let g_period = 'hour';
let g_sensor_type = undefined;
let g_equip_id = undefined;
let g_sensor_id = undefined;

let g_date_inst = undefined;

let g_sensor_chart = undefined;
let g_di_threshold = new Array(7);

$(window).resize(function() {
    resizeWindow();
});

$(document).ready(function() {
    resizeWindow();

    g_sensor_type = $('#sensor_chart').attr('data-type');
    g_equip_id = $('#sensor_chart').attr('equip-id');
    g_sensor_id = $('#sensor_chart').attr('data-id');

    initDateTimePicker();
    
    if(g_sensor_type === 'AI') initAISensorChart();
    else initDISensorChart();

    $('.btn-check').on('change', function() {
        // by shkoh 20200916: 시간별 / 일별 추이 선택에 맞춰서 변경함
        g_period = $(this).attr('selected-table');
        g_date_inst.Reload(g_period);
    });

    $('#searching').on('click', function() {
        if(g_sensor_chart) {
            if(g_sensor_type === 'AI') {
                g_sensor_chart.options.categoryAxis.baseUnit = (g_period === 'hour') ? 'hours' : 'days';
                g_sensor_chart.dataSource.read();
            } else {
                const min = calculateDIMinDate(g_period === 'hour' ? g_date_inst.GetDate().setDate(g_date_inst.GetDate().getDate() - 1) : g_date_inst.GetDate().setMonth(g_date_inst.GetDate().getMonth() - 1));
                const max = calculateDIMaxDate(g_date_inst.GetDate());
                
                g_sensor_chart.setOptions({
                    xAxis: {
                        min: min,
                        max: max,
                        majorUnit: calculateDIChartMajorUnit(min, max)
                    }
                });
                
                g_sensor_chart.dataSource.read();
                g_sensor_chart.redraw();
            }
            
        }
    });
});

/**********************************************************************************************************************************************/
/* by shkoh 20200916: resizing start                                                                                                          */
/**********************************************************************************************************************************************/
function calculatePanelSize() {
    const body_h = parseFloat($('body').height());
    const searching_h = parseFloat($('#searching-conditions').height()) + 6;
    const padding_h = 12;

    return body_h - searching_h - padding_h;
}

function calculateChartSize() {
    const panel_head_h = parseFloat($('.panel-heading').height()) + 12;
    const panel_body_padding_h = 8;
    return calculatePanelSize() - panel_head_h - panel_body_padding_h;
}

function calculateChartLengendPosition() {
    const body_w = parseFloat($('body').width());
    return (body_w / 2) - 100;
}

function resizeWindow() {
    $('.panel').height(calculatePanelSize());
    $('#sensor_chart').height(calculateChartSize());

    if(g_sensor_chart) {
        g_sensor_chart.options.legend.offsetX = calculateChartLengendPosition();
        g_sensor_chart.resize();
        g_sensor_chart.refresh();
    }
}
/**********************************************************************************************************************************************/
/* by shkoh 20200916: resizing end                                                                                                            */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200916: datetime picker start                                                                                                   */
/**********************************************************************************************************************************************/
function initDateTimePicker() {
    g_date_inst = new DatePicker('#start-date', {
        period: g_period,
        startDate: new Date()
    });

    g_date_inst.CreateDatePicker();
}
/**********************************************************************************************************************************************/
/* by shkoh 20200916: datetime picker start                                                                                                   */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200916: inline function start                                                                                                   */
/**********************************************************************************************************************************************/
function initDIMinDate() {
    const temp_min = new Date($('#start-date').val());
    return g_period === 'hour' ? temp_min.setDate(temp_min.getDate() - 1) : temp_min.setMonth(temp_min.getMonth() - 1);
}

function initDIMaxDate() {
    return new Date($('#start-date').val());
}

function compareDIMaximunPeriod(_min, _max) {
    const temp_min = new Date(_min);
    g_period === 'hour' ? temp_min.setDate(temp_min.getDate() + 1) : temp_min.setMonth(temp_min.getMonth() + 1);
    
    return (_max - temp_min) > 1;
}

function calculateDIChartMajorUnit(_min, _max) {
    return parseInt((_max - _min) / ((g_period === 'hour' ? 26 : 32) * 1000));
}

function calculateDIMinDate(_min) {
    const temp_min = new Date(_min);
    
    if(g_period === 'hour') {
        temp_min.setHours(temp_min.getHours() - 1, 0, 0, 0);
    } else {
        temp_min.setDate(temp_min.getDate() - 1);
        temp_min.setHours(0, 0, 0, 0);
    }

    return temp_min;
}

function calculateDIMaxDate(_max) {
    const temp_max = new Date(_max);
    
    if(g_period === 'hour') {
        temp_max.setHours(temp_max.getHours() + 1, 0, 0, 0);
    } else {
        temp_max.setDate(temp_max.getDate() + 1);
        temp_max.setHours(0, 0, 0, 0);
    }

    return temp_max;
}

function createThreshold(theshold) {
    if(theshold === undefined || theshold.length === 0) {
        for(let idx = 0; idx < g_di_threshold.length; idx++) g_di_threshold[idx] = idx;
    } else {
        for(const [key, value] of Object.entries(theshold[0])) {
            if(key.includes('_label')) {
                const idx = parseInt(key.substr(8));
                g_di_threshold[idx] = value;
            }
        }
    }
}
/**********************************************************************************************************************************************/
/* by shkoh 20200916: inline function end                                                                                                     */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200916: analog value sensor chart start                                                                                         */
/**********************************************************************************************************************************************/
function initAISensorChart() {
    g_sensor_chart = $('#sensor_chart').kendoChart({
        dataSource: {
            transport: {
                read: {
                    type: 'GET',
                    dataType: 'json',
                    cache: false,
                    url: function() {
                        return '/api/popup/chart?sensor_type=' + g_sensor_type + '&period=' + g_period + '&equip_id=' + g_equip_id + '&sensor_id=' + g_sensor_id + '&date=' + $('#start-date').val();
                    }
                }
            },
            serverPaging: false,
            autoSync: false,
            batch: false,
            pageSize: 1000,
            schema: {
                model: {
                    fields: {
                        date_day: { type: 'string' },
                        date_hour: { type: 'string' },
                        sensor_id: { type: 'number' },
                        val: { type: 'number', parse: function(v) { if(v) return parseFloat(v.toString()).toFixed(2); else return; } },
                        min_val: { type: 'number', parse: function(v) { if(v) return parseFloat(v.toString()).toFixed(2); else return; } },
                        max_val: { type: 'number', parse: function(v) { if(v) return parseFloat(v.toString()).toFixed(2); else return; } },
                        unit: { type: 'string' }
                    }
                },
                data: function(response) {
                    // by shkoh 20200917: 데이터의 값에 존재하지 않더라도 항상 특정 기간만큼 보이기 위해서 지정시간만큼 표시함
                    const start_date = new Date(g_date_inst.GetDate());
                    const end_date = new Date(g_date_inst.GetDate());

                    if(g_period === 'hour') start_date.setDate(start_date.getDate() - 1);
                    else start_date.setMonth(start_date.getMonth() - 1);

                    response.unshift({ stat_date: start_date });
                    response.push({ stat_date: end_date });
                    return response;
                }
            }
        },
        persistSeriesVisibility: true,
        legend: {
            position: 'top',
            offsetX: calculateChartLengendPosition()
        },
        seriesDefaults: {
            type: 'line'
        },
        series: [
            { style: 'smooth', field: 'max_val', name: '최대', missingValues: "gap" },
            { style: 'smooth', field: 'val', name: '평균', missingValues: "gap" },
            { style: 'smooth', field: 'min_val', name: '최소', missingValues: "gap" },
        ],
        categoryAxis: {
            type: 'date',
            field: 'stat_date',
            justified: true,
            crosshair: {
                visible: true
            },
            baseUnit: 'hours',
            baseUnitStep: 1,
            labels: {
                skip: 1,
                step: 2,
                dateFormats: {
                    hours: 'MM/dd\nHH:mm',
                    days: 'yyyy\nMM/dd'
                }
            }
        },
        valueAxis: {
            crosshair: {
                visible: true
            }
        },
        tooltip: {
            visible: true,
            shared: true,
            sharedTemplate: function(e) {
                const day = e.points[0].dataItem.date_day.split('/');

                let tooltip_text = '<table><tbody><tr><td colspan="3" style="text-align:center">';
                if(g_period == 'hour') {
                    tooltip_text += (day[1] + '/' + day[2] + ' ' + e.points[0].dataItem.date_hour);
                } else {
                    tooltip_text += (e.points[0].dataItem.date_day);
                }
                tooltip_text += '</td></tr>';
                e.points.forEach(function(p) {
                    const t =
                    '<tr>' +
                        '<td>' +
                            '<span class="k-chart-shared-tooltip-marker" style="background-color:' + p.color + '"></span>' +
                        '</td>' +
                        '<td>' +
                            p.series.name + ': ' +
                        '</td>' +
                        '<td>' +
                            p.value + ' ' + p.dataItem.unit + 
                        '</td>' +
                    '</tr>';
                    
                    tooltip_text += t;
                });
                tooltip_text += '</tbody></table>';

                return tooltip_text;
            }
        },
        theme: 'bootstrap'
    }).data('kendoChart');

    // by shkoh 20190726: chart가 초기화 될 때, [최대], [최소] 항목을 숨김
    g_sensor_chart.findSeriesByIndex(0).toggleVisibility(false);
    g_sensor_chart.findSeriesByIndex(2).toggleVisibility(false);
}
/**********************************************************************************************************************************************/
/* by shkoh 20200916: analog valule sensor chart end                                                                                          */
/**********************************************************************************************************************************************/

/**********************************************************************************************************************************************/
/* by shkoh 20200916: digital value sensor chart start                                                                                        */
/**********************************************************************************************************************************************/
function initDISensorChart() {
    const min = calculateDIMinDate(g_period === 'hour' ? g_date_inst.GetDate().setDate(g_date_inst.GetDate().getDate() - 1) : g_date_inst.GetDate().setMonth(g_date_inst.GetDate().getMonth() - 1));
    const max = calculateDIMaxDate(g_date_inst.GetDate());

    g_sensor_chart = $('#sensor_chart').kendoChart({
        renderAs: "canvas",
        dataSource: {
            transport: {
                read: {
                    type: 'GET',
                    dataType: 'json',
                    cache: false,
                    url: function() {
                        return '/api/popup/chart?sensor_type=' + g_sensor_type + '&period=' + g_period + '&equip_id=' + g_equip_id + '&sensor_id=' + g_sensor_id + '&date=' + $('#start-date').val();
                    }
                }
            },
            schema: {
                model: {
                    fields: {
                        lDate: { type: 'date' }
                    }
                },
                data: function(response) {
                    createThreshold(response[1]);
                    return response[0];
                }
            }
        },
        xAxis: {
            name: "xAxis",
            majorUnit: calculateDIChartMajorUnit(min, max),
            baseUnit: 'seconds',
            crosshair: {
                visible: true
            },
            narrowRange: false,
            min: min,
            max: max,
            labels: {
                skip: 1,
                step: 2,
                dateFormats: {
                    seconds: 'MM/dd\nHH:mm:ss',
                    minutes: 'MM/dd\nHH:mm',
                    hours: 'MM/dd\nHH:mm',
                    days: 'yyyy\nMM/dd',
                    weeks: 'yyyy\nMM/dd',
                    months: 'yyyy/MM',
                    years: 'yyyy'
                }
            },
            type: 'date',
            majorTicks: {
                visible: true,
                color: '#ffffff'
            }
        },
        series: [{
            type: 'scatterLine',
            xField: 'lDate',
            yField: 'val',
            markers: {
                size: 8,
                type: 'square'
            },
            width: 3,
            visual: function(e) {
                const path = new kendo.drawing.Path({
                    stroke: {
                        color: e.series.color,
                        width: e.series.width
                    }
                });
                
                const points = e.points;
                points.reduce(function(prev, curr, idx, arr) {
                    prev.lineTo(curr.x, curr.y);
                    if(idx + 1 < arr.length) {
                        prev.lineTo(arr[idx + 1].x, curr.y);
                    }
                    return prev;
                }, path.moveTo(points[0]));
                
                return path;
            }
        }],
        yAxis: {
            axisCrossingValue: [ -1 ],
            name: 'threshold',
            majorUnit: 1,
            max: 8,
            min: -1,
            narrowRange: false,         // by shkoh 20200921: y축은 무조건 0부터 시작함,
            crosshair: {
                visible: true
            },
            labels: {
                template: function(e) {
                    return g_di_threshold[e.value] === undefined ? '' : g_di_threshold[e.value];
                }
            }
        },
        tooltip: {
            visible: true,
            template: function(e) {
                return '[' + kendo.toString(e.value.x, 'yyyy/MM/dd HH:mm:ss') + '] ' + g_di_threshold[e.value.y];
            }
        },
        transitions: false,
        theme: 'bootstrap',
        drag: setRange,
        zoom: setRange
    }).data('kendoChart');

    function setRange(e) {
        let chart = e.sender;
        let options = chart.options;

        // Prevent document scrolling on mousewheel zoom
        e.originalEvent.preventDefault();

        let xRange = e.axisRanges.xAxis;
        if(xRange) {
            // Suggested axis ranges
            let xMin = xRange.min;
            let xMax = xRange.max;
          
            // Limit maximum zoom-in
            if(xMax - xMin < 1000 * 60 * 3) {
                return;
            }

            chart.setOptions({
                xAxis: {
                    min: xMin,
                    max: xMax,
                    majorUnit: calculateDIChartMajorUnit(xMin, xMax)
                }
            });
        }
    }
}
/**********************************************************************************************************************************************/
/* by shkoh 20200916: digital value sensor chart end                                                                                          */
/**********************************************************************************************************************************************/