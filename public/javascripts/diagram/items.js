/// <reference path='../../../typings/jquery/jquery.d.ts'/>
/// <reference path="../../../typings/cytoscape/cytoscape.d.ts"/>
/// <reference path="../../../typings/cytoscape/cytoscape-node-html-label.d.ts"/>

const Items = function(_id, _options) {
    const m_id = _id;

    let options = {
        hvacCtrl: undefined,
        onDblclickWrfisPms: undefined,
        onDblclickWrfisBms1: undefined,
        isQtip: false
    }

    options = _options;

    let m_clicked_timeout = undefined;
    let m_clicked_node_before = undefined;

    let m_cytoscape = undefined;
    const m_item_level_color = [ '#0161b8', '#ff9c01', '#fe6102', '#de0303', '#511a81', '#000000', '#656565' ];
    /******************************************************************************************************************************************/
    /* by shkoh 20200924: cytoscape predefine start                                                                                           */
    /******************************************************************************************************************************************/
    const m_cytoscape_layout = {
        name: 'preset',
        positions: undefined,
        zoom: 1,
        pan: undefined,
        fit: true,
        padding: 0
    };

    const m_node_style = {
        'font-family': 'MalgunGothic',
        'font-size': '1.4em',
        
        'text-wrap': 'wrap',
        'text-halign': 'center',
        'text-valign': 'center',
        
        'background-color': 'transparent',
        'background-opacity': 0.0,
        'color': '#ffffff',
        
        'shape': 'rectangle'
    };

    const m_node_default_style = {
        'label': 'data(name)',
        
        'text-outline-width': 1,
        'font-weight': 'bolder',
        
        'width': '200px',
        'heigth': '30px',
        'shape': 'rectangle'
    };

    const m_node_icon_style = {
        'text-valign': 'bottom',
        
        'label': 'data(name)',
        'font-size': '1em',
        'text-outline-width': 1.2,
        'font-weight': 'bolder',
        "text-margin-y": "4px",

        "shape": "rectangle",
        'width': '46px',
        'height': '46px',

        'background-image': function(ele) {
            return '/img/alert/' + ele.data('icon') + '_' + (ele.data('bUse') == "Y" && ele.data('level') < 3 ? ele.data('level') : 3) + '.png';
        },
        
        'background-width': '36px',
        'background-height': '36px'
    };

    const m_node_icon_tester_style = {
        'shape': 'roundrectangle',
        'width': '34px',
        'height': '34px',
        
        'label': 'data(name)',
        
        'font-family': 'arial',
        'font-size': '13px',
        'font-weight': 'bolder',
        'text-halign': 'center',
        'text-valign': 'bottom',
        
        'text-outline-width': 0.1,

        'background-color': 'transparent',
        'background-opacity': 0,

        'padding-left': 1,
        'padding-right': 1,
        'padding-top': 1,
        'padding-bottom': 3,

        'color': '#000000',

        'background-image': function(ele) {
            let file_name = ele.data('icon');
            return '/img/diagram/tester/items/' + ele.id() + '/' + file_name;
        },
        'background-width': '32px',
        'background-height': '32px',
        'background-fit': 'none',
        'text-background-color': '#ffffff',
        'text-background-opacity': 0.8,
        'text-background-shape': 'rectangle',
        'text-background-padding': '2px'
    };

    const m_node_icon_tester_selected_style = {
        'shape': 'roundrectangle',
        'background-opacity': 0.5,
        'background-color': '#000000',
        'width': '38px',
        'height': '38px'
    }

    const m_node_hvac_ctrl_style = {
        "width": "118px",
        "height": "62px"
    };

    const m_node_selected = {
        'background-opacity': 0.4,

        'padding': '1px',
        
        'shape': 'rectangle'
    }

    const m_node_hvac_ctrl_selected =  {
        "shape": "rectangle",
        
        "label": "data(name)",
        "font-size": "1em",
        "text-outline-width": 1.2,
        "font-weight": "bolder",
        "text-valign": "bottom",
        "text-margin-y": "6px"
    }

    const m_node_pms_style = {
        'shape': 'rectangle',
        'label': 'data(name)',
        'border-width': 2,
        'border-style': 'solid',
        'border-color': '#333333',
        'background-opacity': 0.8,
        'background-color': function(ele) {
            return m_item_level_color[ele.data('level')];
        },
        'font-size': '20px',
        'text-wrap': 'wrap',
        'text-halign': 'center',
        'text-valign': 'center',
        'width': function(ele) {
            const font_size = Number.parseInt(ele.style('font-size'));
            const name_length = ele.data('name').length;
            
            return ((font_size - 4) * name_length).toString() + 'px';
        }
    };

    const m_node_pms_seleceted = {
        'shape': 'rectangle',
        'background-opacity': 0.3,
        'border-style': 'dotted'
    }

    const m_node_bms_style = {
        'width': '210px',
        'height': '160px'
    }

    const m_node_bms_seleceted = {
        'border-width': 2,
        'border-style': 'solid',
        'border-color': '#666666',
        'background-opacity': 0.2
    }

    const m_node_bms_sys_style = {
        'width': '800px',
        'height': '180px',
    }

    const m_node_bms_rack_style = {
        'width': '150px',
        'height': '125px',
    };

    const m_node_temp_style = {
        'width': '36px',
        'height': '36px',
        'shape': 'roundrectangle',
        'label': 'data(val)',
        'font-size': '10px',
        'background-opacity': 0.1,
        'background-color': '#aaaaaa',
        'text-valign': 'bottom',
        'text-margin-y': '-12px'
    };

    const m_node_temp_selected = {
        'background-color': '#3333aa',
        'background-opacity': 0.3,
        'color': '#ffffff'
    }

    const m_cytoscape_styles = cytoscape.stylesheet()
        .selector('node').style(m_node_style)
        .selector('node.default').style(m_node_default_style)
        .selector('node.icon').style(m_node_icon_style)
        .selector('node.hvacctrl').style(m_node_hvac_ctrl_style)
        .selector('node:selected').style(m_node_selected)
        .selector('node.hvacctrl:selected').style(m_node_hvac_ctrl_selected)
        .selector('node.wrfispms').style(m_node_pms_style)
        .selector('node.wrfispms:selected').style(m_node_pms_seleceted)
        .selector('node.wrfisbms1').style(m_node_bms_style)
        .selector('node.wrfisbms1:selected').style(m_node_bms_seleceted)
        .selector('node.wrfisbmsSys').style(m_node_bms_sys_style)
        .selector('node.wrfisbmsRack').style(m_node_bms_rack_style)
        .selector('node.wrfisbmsSys:selected, node.wrfisbmsRack:selected').style(m_node_bms_seleceted)
        .selector('node.wrfistemp').style(m_node_temp_style)
        .selector('node.wrfistemp:selected').style(m_node_temp_selected)
        .selector('node.icontester').style(m_node_icon_tester_style)
        .selector('node.icontester:selected').style(m_node_icon_tester_selected_style);

    const m_cytoscape_hvacctrl_menu = {
        menuRadius: 8,
        selector: 'node.hvacctrl',
        commands: [{
            content: '가동',
            contentStyle: { 'font-size': '0.8em' },
            select: function(ele) {
                options.hvacCtrl('start', ele);
            }
        }, {
            content: '정지',
            contentStyle: { 'font-size': '0.8em' },
            select: function(ele) {
                options.hvacCtrl('stop', ele);
            }
        }],
        fillColor: 'rgba(0, 0, 0, 0.6)',
        activeFillColor: 'rgba(49, 123, 224, 0.8)',
        activePadding: 4,
        indicatorSize: 20,
        separatorWidth: 4,
        spotlightPadding: 4,
        minSpotlightRadius: 4,
        maxSpotlightRadius: 10,
        itemColor: '#ffffff',
        itemTextShadowColor: '#333333',
        zIndex: 9999,
        openMenuEvents: 'cxttapstart'
    }
    /******************************************************************************************************************************************/
    /* by shkoh 20200924: cytoscape predefine end                                                                                             */
    /******************************************************************************************************************************************/

    /******************************************************************************************************************************************/
    /* by shkoh 20200924: cytoscape function start                                                                                            */
    /******************************************************************************************************************************************/
    function createCytoscape() {
        m_cytoscape = cytoscape({
            container: document.getElementById(m_id),
            panningEnabled: false,
            userPanningEnabled: false,
            zoomingEnabled: false,
            userZoomingEnabled: false,
            motionBlur: true,
            pixelRatio: 1.0,
            styleEnabled: true,
            selectionType: 'single',
            layout: m_cytoscape_layout,
            style: m_cytoscape_styles
        });
    }

    function createNodeHtmlLabel() {
        m_cytoscape.nodeHtmlLabel([{
            query: '.hvacctrl',
            tpl: function(data) {
                const icon_url = getMapIconName('constant_temperature', data.level, data.isRun);
                let temp_level = (!isNaN(data.temp_level) && data.level < 4) ? data.temp_level : data.level;
                let humi_level = (!isNaN(data.humi_level) && data.level < 4) ? data.humi_level : data.level;
                if(data.bUse === 'N') {
                    temp_level = 6;
                    humi_level = 6;
                }

                const html =
                '<div id="node_' + data.obj_id + '" class="hvac-ctrl node-border-level-' + data.level + '">' +
                    '<table>' +
                        '<tr>' +
                            '<td rowspan="2" class="hvac-icon" style="background-image: url(' + icon_url + ')"></td>' +
                            '<td rowspan="2" style="width: 4px;"></td>' +
                            '<td class="th-icon-img" style="background-image: url(/img/diagram/icon/temperature_' + temp_level + '.png);"></td>' +
                            '<td class="th-icon-text">' + (data.temp === undefined ? ' - ' : data.temp) + '<span class="th-icon-text-unit">℃</span></td>' +
                        '</tr>' +
                        '<tr>' +
                            '<td class="th-icon-img" style="background-image: url(/img/diagram/icon/humid_' + humi_level + '.png);"></td>' +
                            '<td class="th-icon-text">' + (data.humi === undefined ? ' - ' : data.humi) + '<span class="th-icon-text-unit">%</span></td>' +
                        '</tr>' +
                    '</table>' +
                '</div>';
                return html;
            }
        }, {
            query: '.wrfisbms1',
            tpl: function(data) {
                const { obj_id, name, level, system_current } = data;
                const current = (level > 3) ? ' - ' : system_current.toFixed(1);

                const html =
                '<div id="node_' + obj_id + '" class="wrfis-bms-item">' +
                    '<div class="bms-title">UPS ' + name + '</div>' +
                    '<div class="bms-contents">' +
                        '<div class="left">' +
                            '<div class="charging lvl' + level + '"></div>' +
                        '</div>' +
                        '<div class="right lvl' + level + '">' +
                            '<div class="text">시스템 전류</div>' +
                            '<div class="value system-value">' + current + ' A</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
                
                return html;
            }
        }, {
            query: '.wrfisbmsSys',
            tpl: function(data) {
                const name = 'UPS ' + data.name.split(' ')[1];
                const { status_lvl, status_val, battery_lvl, battery_val, time_lvl, time_val, time_unit, voltage_lvl, voltage_val, voltage_unit, current_lvl, current_val, current_unit, capacity_lvl, capacity_val, capacity_unit } = data;

                const html =
                '<div id="node_' + data.obj_id + '" class="wrfis-bms-sys-item">' +
                    '<div class="bms-sys-title">' + name + '</div>' +
                    '<div class="bms-sys-text bms-sys-status lvl' + status_lvl + '">' + status_val + '</div>' +
                    '<div class="bms-sys-text bms-sys-battery lvl' + battery_lvl + '">' + battery_val + '</div>' +
                    '<div class="bms-sys-text bms-sys-time lvl' + time_lvl + '">' + time_val + time_unit + '</div>' +
                    '<div class="bms-sys-text bms-sys-vol-curr lvl">' + voltage_val + voltage_unit + ' / ' + current_val + current_unit + '</div>' +
                '</div>';
                return html;
            }
        }, {
            query: '.wrfisbmsRack',
            tpl: function(data) {
                const name = data.name;
                const { status_lvl, status_val, voltage_lvl, voltage_val, voltage_unit, current_lvl, current_val, current_unit, soc_lvl, soc_val, soh_lvl, soh_val } = data;

                const charging_val = (soc_val > 80) ? '100' : (soc_val > 60) ? '80' : (soc_val > 40) ? '40' : (soc_val > 20) ? '20' : '0';

                const html =
                '<div id="node_' + data.obj_id + '" class="wrfis-bms-rack-item">' +
                    '<div class="left">' +
                        '<div class="charging charging_' + charging_val +'"></div>' +
                        '<div class="charging-percent">' + soc_val + '</div>' +
                    '</div>' +
                    '<div class="right">' +
                        '<div class="rack-text rack-title lvl' + status_lvl + '">' + name + '</div>' +
                        '<div class="rack-text rack-value voltage">' + voltage_val + ' ' + voltage_unit + '</div>' +
                        '<div class="rack-text rack-value current">' + current_val + ' ' + current_unit + '</div>' +
                        '<div class="rack-text rack-value soh lvl' + soh_lvl + '">' + soh_val + ' %</div>' +
                    '</div>' +
                '</div>';
                return html;
            }
        }]);
        
        m_cytoscape.cxtmenu(m_cytoscape_hvacctrl_menu);
    }

    function createCytoscapeEvent() {
        m_cytoscape.on('resize', function(e) {
            m_cytoscape.elements().forEach(function(item) {
                item.renderedPosition({
                    x: parseFloat(item.data('pos_x')) * parseFloat($(window).width()),
                    y: parseFloat(item.data('pos_y')) * parseFloat($(window).height())
                });
            });

            m_cytoscape.layout(m_cytoscape_layout).run();
        });

        m_cytoscape.on('click', 'node.wrfispms, node.wrfisbms1', function(evt) {
            let clicked_node = evt.target;

            if(m_clicked_timeout && m_clicked_node_before) {
                clearTimeout(m_clicked_timeout);
            }

            if(m_clicked_node_before == clicked_node) {
                // by shkoh 20190517: double click event
                clicked_node.trigger('doubleclick');
                m_clicked_node_before = undefined;
            } else {
                m_clicked_timeout = setTimeout(function() { m_clicked_node_before = undefined; }, 600);
                m_clicked_node_before = clicked_node;
            }
        });

        m_cytoscape.on('select', 'node', function(e) {
            if($.session.get('user-grade') === 'USR00') $(window).trigger('focus');
        });

        m_cytoscape.on('unselect', 'node', function(e) {
            if($.session.get('user-grade') === 'USR00') $(window).trigger('focusout');
        });

        $(window).on('keydown', function(e) {
            if($.session.get('user-grade') === 'USR00') {
                let _val = 2;

                if(e.altKey) _val *= 5;
                if(e.shiftKey) _val *= 10;

                switch(e.key) {
                    case 'ArrowLeft': {
                        moveItem({ x: -1 * _val, y: 0 });
                        break;
                    }
                    case 'ArrowRight': {
                        moveItem({ x: _val, y: 0 });
                        break;
                    }
                    case 'ArrowUp': {
                        moveItem({ x: 0, y: -1 * _val });
                        break;
                    }
                    case 'ArrowDown': {
                        moveItem({ x: 0, y: _val });
                        break;
                    }
                }
            }
        });
        
        m_cytoscape.on('doubleclick', 'node.wrfispms', options.onDblclickWrfisPms);
        m_cytoscape.on('doubleclick', 'node.wrfisbms1', options.onDblclickWrfisBms1);

        m_cytoscape.on('add', 'node.wrfistemp', function(e) {
            const equip_name = e.target.data('equip_name');
            e.target.qtip({
                content: {
                    text: equip_name === undefined ? '등록오류' : (equip_name + ': ' + e.target.data('name'))
                },
                show: {
                    event: 'select'
                },
                hide: {
                    event: 'unselect remove',
                    cyViewport: false
                },
                style: {
                    classes: 'qtip-wiki qtip-light qtip-shadow'
                },
                position: {
                    container: $('#qtip-container'),
                    adjust: {
                        y: 0,
                        cyViewport: true
                    }
                }
            });
        });

        m_cytoscape.on('data', 'node.wrfistemp', function(e) {
            const qtip_api = e.target.qtip('api');
            if(qtip_api) {
                const equip_name = e.target.data('equip_name');
                qtip_api.set('content.text', equip_name === undefined ? '등록오류' : (equip_name + ': ' + e.target.data('name')));
            }
        });
    }

    function getAllItems() {
        return m_cytoscape.elements();
    }

    function getSelectedItems() {
        return m_cytoscape.elements(':selected');
    }

    function clearItems() {
        m_cytoscape.remove(m_cytoscape.elements());
    }

    function resize() {
        m_cytoscape.resize();
    }
    /******************************************************************************************************************************************/
    /* by shkoh 20200924: cytoscape function end                                                                                              */
    /******************************************************************************************************************************************/

    /******************************************************************************************************************************************/
    /* by shkoh 20200924: data control function start                                                                                         */
    /******************************************************************************************************************************************/
    function parseCytoscapeItems(items) {
        const parse_items = [];

        items.forEach(function(item) {
            // by shkoh 20200923: bUse(사용안함 혹은 다이어그램에는 존재하나 이미 삭제된) 그룹 / 설비 / 센서는 제외하여 표현
            // if(item.bUse === 'Y') {
                const data = {
                    // by shkoh 20200928: diagram 기본정보
                    id: item.index,
                    type: item.type,
                    obj_id: item.obj_id,
                    name: item.name,
                    level: item.bUse === 'N' ? 6 : item.level,
                    pos_x: item.pos_x.toFixed(3),
                    pos_y: item.pos_y.toFixed(3),
                    bUse: item.bUse,
                    // by shkoh 20200925: 아래부터는 node의 특징에 따라서 존재할 수도 있고 없을 수도 있다
                    icon: item.icon
                }

                switch(item.type) {
                    case 'hvacctrl': {
                        // by shkoh 20200925: hvacctrl
                        Object.assign(data, {
                            isRun: item.isRun,
                            temp: item.temp === undefined ? '-' : item.temp,
                            temp_level: item.temp_level,
                            humi: item.humi === undefined ? '-' : item.humi,
                            humi_level: item.humi_level,
                            ctrlId: item.ctrlId
                        });
                        break;
                    }
                    case 'wrfisbms1': {
                        // by shkoh 20210224: wrfis bms
                        Object.assign(data, {
                            system_current: item.system_current === undefined ? '-' : item.system_current
                        });
                        break;
                    }
                    case 'wrfisbmsSys': {
                        Object.assign(data, {
                            status_lvl: item.status_lvl,
                            status_val: item.status_val,
                            battery_lvl: item.battery_lvl,
                            battery_val: item.battery_val,
                            time_lvl: item.time_lvl,
                            time_val: item.time_val,
                            time_unit: item.time_unit,
                            voltage_lvl: item.voltage_lvl,
                            voltage_val: item.voltage_val,
                            voltage_unit: item.voltage_unit,
                            current_lvl: item.current_lvl,
                            current_val: item.current_val,
                            current_unit: item.current_unit,
                            capacity_lvl: item.capacity_lvl,
                            capacity_val: item.capacity_val,
                            capacity_unit: item.capacity_unit
                        });
                        break;
                    }
                    case 'wrfisbmsRack': {
                        Object.assign(data, {
                            status_lvl: item.status_lvl,
                            status_val: item.status_val,
                            voltage_lvl: item.voltage_lvl,
                            voltage_val: item.voltage_val,
                            voltage_unit: item.voltage_unit,
                            current_lvl: item.current_lvl,
                            current_val: item.current_val,
                            current_unit: item.current_unit,
                            soc_lvl: item.soc_lvl,
                            soc_val: item.soc_val,
                            soh_lvl: item.soc_lvl,
                            soh_val: item.soh_val
                        });
                        break;
                    }
                    case 'wrfistemp': {
                        Object.assign(data, {
                            val: item.value + '℃',
                            equip_name: item.equip_name
                        });
                        break;
                    }
                }

                parse_items.push({
                    group: 'nodes',
                    classes: item.type,
                    renderedPosition: {
                        x: item.pos_x.toFixed(3) * $(window).width(),
                        y: item.pos_y.toFixed(3) * $(window).height()
                    },
                    data: data
                });
            // }
        });

        return parse_items;
    }
    
    function redrawItems(items, selected_items) {
        if(m_cytoscape === undefined) return;

        const parsed_items = parseCytoscapeItems(items);
        m_cytoscape.add(parsed_items);

        // by shkoh 20200924: 기존에 이미 선택된 노드가 존재했다면, 해당 노드를 다시 동일하게 선택함
        selected_items.forEach(function(item) {
            m_cytoscape.nodes('#' + item.id()).select();
        });
    }

    function updateItems(items, selected_items) {
        if(m_cytoscape === undefined) return;

        const new_items = parseCytoscapeItems(items);
        new_items.forEach(function(item) {
            const node = m_cytoscape.nodes('#' + item.data.id);
            if(node) {
                node.data(item.data);
                node.position(item.renderedPosition);
                node.classes(item.classes);
            }
        });

        selected_items.forEach(function(item) {
            m_cytoscape.nodes('#' + item.id()).select();
        }); 
    }

    function repositionNodes(items) {
        items.forEach(function(item) {
            let node = m_cytoscape.nodes('#' + item.index);

            if(node) {
                const x = item.pos_x;
                const y = item.pos_y;

                node.data('pos_x', x);
                node.data('pos_y', y);

                node.renderedPosition({
                    x: x * $(window).width(),
                    y: y * $(window).height()
                });
            }
        });
    }

    function alignItem(direction) {
        const selected_nodes = getSelectedItems();

        let min_x = selected_nodes[0].renderedPosition('x');
        let max_x = selected_nodes[0].renderedPosition('x');
        let min_y = selected_nodes[0].renderedPosition('y');
        let max_y = selected_nodes[0].renderedPosition('y');

        selected_nodes.forEach(function(node) {
            min_x = Math.min(min_x, node.renderedPosition('x'));
            max_x = Math.max(max_x, node.renderedPosition('x'));
            min_y = Math.min(min_y, node.renderedPosition('y'));
            max_y = Math.max(max_y, node.renderedPosition('y'));
        });

        selected_nodes.forEach(function(node) {
            switch(direction) {
                case 'left':
                    node.data('pos_x', (min_x / $(window).width()).toFixed(2));
                    node.renderedPosition('x', min_x);
                    break;
                case 'right':
                    node.data('pos_x', (max_x / $(window).width()).toFixed(2));
                    node.renderedPosition('x', max_x);
                    break;
                case 'top':
                    node.data('pos_y', (min_y / $(window).height()).toFixed(2));
                    node.renderedPosition('y', min_y);
                    break;
                case 'bottom':
                    node.data('pos_y', (max_y / $(window).height()).toFixed(2));
                    node.renderedPosition('y', max_y);
                    break;
                case 'horizontal':
                    break;
                case 'vertical':
                    break;
            }
        });
    }

    function moveItem(new_pos) {
        const selected_nodes = getSelectedItems();

        selected_nodes.forEach(function(node) {
            let current_pos = node.renderedPosition();
            current_pos.x += new_pos.x;
            current_pos.y += new_pos.y;

            node.data('pos_x', (current_pos.x / $(window).width()).toFixed(2));
            node.data('pos_y', (current_pos.y / $(window).height()).toFixed(2));
            node.renderedPosition(current_pos);
        });
    }
    /******************************************************************************************************************************************/
    /* by shkoh 20200924: data control function end                                                                                           */
    /******************************************************************************************************************************************/

    /******************************************************************************************************************************************/
    /* by shkoh 20200925: inline function start                                                                                               */
    /******************************************************************************************************************************************/
    function getMapIconName(icon, level, mode) {
        let ext = '.png';
        if(level < 4 && icon === 'constant_temperature' && mode === 'run') ext = '.gif';
        else if(level < 4 && icon === 'humidifier' && mode === 'run') ext = '.gif';

        return '/img/diagram/icon/' + icon + '_' + level + ext;
    }
    /******************************************************************************************************************************************/
    /* by shkoh 20200925: inline function end                                                                                                 */
    /******************************************************************************************************************************************/

    return {
        Create: function() {
            createCytoscape();
            createNodeHtmlLabel();
            createCytoscapeEvent();
        },
        Redraw: function(items) {
            const old_items = getAllItems();
            const selected_items = getSelectedItems();
            
            // if(items.filter(function(item) { return item.bUse == 'Y' }).length != old_items.length) {
            if(items.length != old_items.length) {
                clearItems();
                redrawItems(items, selected_items);
            } else {
                updateItems(items, selected_items);
            }
        },
        GetAllItems: function() { return getAllItems(); },
        RepositionNodes: function(items) { repositionNodes(items); },
        GetSelectedItem: function() { return getSelectedItems(); },
        Align: function(direction) { return alignItem(direction); },
        Resize: function() { resize(); },
        SetQtip: function() { setQtip(); }
    }
}