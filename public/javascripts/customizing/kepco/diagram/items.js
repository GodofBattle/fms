/// <reference path='../../../../../typings/jquery/jquery.d.ts'/>
/// <reference path="../../../../../typings/cytoscape/cytoscape.d.ts"/>
/// <reference path="../../../../../typings/cytoscape/cytoscape-node-html-label.d.ts"/>

const Items = function(_id, _options) {
    const m_id = _id;

    let options = {
        isIcomer: false,
        onSet: undefined,
        onDuplicate: undefined,
        onDelete: undefined,
        onTouchEnd: undefined,
        onPlayCamera: undefined,
        onEquipmentSetting: undefined,
        onCtrlLight: undefined,
        onMoveMonitoring: undefined
    }

    options = _options;
    
    let m_clicked_timeout = undefined;
    let m_clicked_node_before = undefined;
    
    let m_cytoscape = undefined;
    /***********************************************************************************************************************************/
    /* by shkoh 20211229: cytoscape predefine start                                                                                    */
    /***********************************************************************************************************************************/
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
        'padding': '0.3em'
    };

    const m_node_select_style = {
        'background-opacity': 0.4,
        'width': '52px',
        'height': '52px'
    };

    const m_node_default_style = {
        'width': '48px',
        'height': '48px',
        'background-fit': 'contain',
        'background-image': function(ele) {
            return '/img/equip/default_L_0.png';
        },
        'shape': 'roundrectangle'
    };
    
    const m_node_default_select_style = {
        'background-image': function(ele) {
            return '/img/equip/default_L_6.png';
        }
    };

    const m_node_tempdi_style = {
        'width': '30px',
        'height': '30px',
        'shape': 'roundrectangle',
        'label': 'data(val)',
        'background-opacity': 0.01,
        'background-color': '#aaaaaa',
        'text-valign': 'center',
        'color': '#ffffff',
        'text-outline-width': 1.4,
        'text-outline-color': '#090909',
        'text-outline-opacity': 1,
        'font-size': '0.9em'
    };

    const m_node_tempdi_select_style = {
        'background-opacity': 0.3,
        'text-valign': 'center',
        'text-margin-y': '0px',
    };

    const m_node_th_style = {
        'width': '70px',
        'height': '50px',
        'background-color': 'transparent',
        'background-opacity': 0.0,
        'shape': 'roundrectangle',
    }

    const m_node_th_select_style = {
        'background-color': '#aaaaaa',
        'background-opacity': 0.3,
        'label': 'data(name)',
        'text-valign': 'bottom',
        'color': '#ffffff',
        'text-outline-width': 0.8,
        'font-size': '0.9em'
    }

    const m_node_thonlyt_style = {
        'width': '70px',
        'height': '30px',
        'background-color': 'transparent',
        'background-opacity': 0.0,
        'shape': 'roundrectangle',
    }

    const m_node_thonlyt_select_style = {
        'background-color': '#aaaaaa',
        'background-opacity': 0.3,
        'label': 'data(name)',
        'text-valign': 'bottom',
        'color': '#ffffff',
        'text-outline-width': 0.8,
        'font-size': '0.9em'
    }

    const m_node_dome_style = {
        'width': '32px',
        'height': '32px',
        'background-fit': 'contain',
        'background-image': function(ele) {
            const lvl = ele.data('bUse') === 'Y' ? ele.data('level') : 6;
            return '/img/equip/dvr_L_' + lvl + '.png';
        },
        'shape': 'rectangle',
        'background-color': 'transparent',
        'background-opacity': 0.0,
    };

    const m_node_dome_select_style = {
        'label': 'data(name)',
        'text-valign': 'bottom',
        'color': '#ffffff',
        'text-outline-width': 0.8,
        'font-size': '0.9em',
        'text-margin-y': '4px',
    }

    const m_node_door_style = {
        'width': '36px',
        'height': '36px',
        'background-fit': 'cover cover',
        'background-image': function(ele) {
            const lvl = ele.data('available_equip') === 'Y' && ele.data('bUse') === 'Y' ? ele.data('level') : 6;
            const isOpen = lvl < 4 && ele.data('isOpen') === 1 ? 'o' : '';
            return '/img/equip/door_L_' + lvl + isOpen + '.png';
        },
        'shape': 'rectangle',
        'background-color': 'transparent',
        'background-opacity': 0.1,
    };

    const m_node_door_select_style = {
        'width': '40px',
        'height': '40px',
        'shape': 'roundrectangle',
        'label': 'data(equip_name)',
        'font-weight': 'bold',
        'text-valign': 'bottom',
        'color': '#000000',
        'font-size': '0.9em',
        'text-margin-y': '4px',
        'text-outline-width': 0.2,
        'text-background-color': '#ffffff',
        'text-background-opacity': 0.7,
        'text-background-shape': 'rectangle',
        'text-background-padding': '2px',
        'border-width': '4px',
        'border-color': '#0161b8'
    }

    const m_node_light_style = {
        'shape': 'roundrectangle',
        'width': '18px',
        'height': '18px',
        'background-color': 'transparent',
        'background-opacity': 0.0,
    };

    const m_node_light_select_style = {
        'width': '20px',
        'height': '20px',
        'background-color': '#888888',
        'background-opacity': 0.6,
    }

    const m_node_hv_style = {
        'width': function(ele) { return (($('#cytoscape').width() * 55) / 1920); },
        'height': function(ele) { return (($('#cytoscape').height() * 80) / 1080); },
        'background-fit': 'contain',
        'background-image': function() {
            return '/img/customizing/kepco/hv.png';
        },
        'shape': 'rectangle',
        'background-color': 'transparent',
        'background-opacity': 0.0,
    };

    const m_node_hvhalf_style = {
        'width': function(ele) { return (($('#cytoscape').width() * 27.5) / 1920); },
        'height': function(ele) { return (($('#cytoscape').height() * 40) / 1080); },
        'background-fit': 'contain',
        'background-image': function() {
            return '/img/customizing/kepco/hv.png';
        },
        'shape': 'rectangle',
        'background-color': 'transparent',
        'background-opacity': 0.0,
    };

    const m_node_lv_style = {
        'width': function(ele) { return (($('#cytoscape').width() * 55) / 1920); },
        'height': function(ele) { return (($('#cytoscape').height() * 80) / 1080); },
        'background-fit': 'contain',
        'background-image': function() {
            return '/img/customizing/kepco/lv.png';
        },
        'shape': 'rectangle',
        'background-color': 'transparent',
        'background-opacity': 0.0,
    };

    const m_node_tr_style = {
        'width': function(ele) { return (($('#cytoscape').width() * 51) / 1920); },
        'height': function(ele) { return (($('#cytoscape').height() * 78) / 1080); },
        'background-fit': 'contain',
        'background-image': function() {
            return '/img/customizing/kepco/tr.png';
        },
        'shape': 'rectangle',
        'background-color': 'transparent',
        'background-opacity': 0.0,
    };

    const m_node_gen_style = {
        'width': function(ele) { return (($('#cytoscape').width() * 100) / 1920); },
        'height': function(ele) { return (($('#cytoscape').height() * 104) / 1080); },
        'background-fit': 'contain',
        'background-image': function() {
            return '/img/customizing/kepco/gen.png';
        },
        'shape': 'rectangle',
        'background-color': 'transparent',
        'background-opacity': 0.0,
    };

    const m_node_power_icon_select_style = {
        'shape': 'roundrectangle',
        'background-color': '#888888',
        'background-opacity': 0.6,
    }

    const m_node_powert_style = {
        'width': '96px',
        'height': '64px',
        'shape': 'rectangle',
        'background-color': 'transparent',
        'background-opacity': 0.0
    };

    const m_node_powert_select_style = {
        'width': '97px',
        'height': '65px',
        'shape': 'rectangle',
        'background-color': '#888888',
        'background-opacity': 0.6,
    };

    const m_node_interlock_style = {
        'width': function(ele) { return (($('#cytoscape').width() * 253) / 1920); },
        'height': function(ele) { return (($('#cytoscape').height() * 146) / 1080); },
        'background-fit': 'contain',
        'background-image': function() {
            return '/img/customizing/kepco/interlock.png';
        },
        'shape': 'rectangle',
        'background-color': 'transparent',
        'background-opacity': 0.0,
    };

    const m_node_genpanel_style = {
        'width': function(ele) { return (($('#cytoscape').width() * 35) / 1920); },
        'height': function(ele) { return (($('#cytoscape').height() * 68) / 1080); },
        'background-fit': 'contain',
        'background-image': function() {
            return '/img/customizing/kepco/gen_panel.png';
        },
        'shape': 'rectangle',
        'background-color': 'transparent',
        'background-opacity': 0.0,
    };

    const m_cytoscape_styles = cytoscape.stylesheet()
        .selector('node').style(m_node_style)
        .selector('node:selected').style(m_node_select_style)
        .selector('node.default').style(m_node_default_style)
        .selector('node.default:selected').style(m_node_default_select_style)
        .selector('node.tempdi').style(m_node_tempdi_style)
        .selector('node.tempdi:selected').style(m_node_tempdi_select_style)
        .selector('node.th, node.thtop, node.thbottom').style(m_node_th_style)
        .selector('node.thonlyt').style(m_node_thonlyt_style)
        .selector('node.th:selected, node.thtop:selected, node.thbottom:selected').style(m_node_th_select_style)
        .selector('node.thonlyt:selected').style(m_node_thonlyt_select_style)
        .selector('node.dome').style(m_node_dome_style)
        .selector('node.dome:selected').style(m_node_dome_select_style)
        .selector('node.door').style(m_node_door_style)
        .selector('node.door:selected').style(m_node_door_select_style)
        .selector('node.light').style(m_node_light_style)
        .selector('node.light:selected').style(m_node_light_select_style)
        .selector('node.hv').style(m_node_hv_style)
        .selector('node.hv:selected').style(m_node_power_icon_select_style)
        .selector('node.hvhalf').style(m_node_hvhalf_style)
        .selector('node.hvhalf:selected').style(m_node_power_icon_select_style)
        .selector('node.lv').style(m_node_lv_style)
        .selector('node.lv:selected').style(m_node_power_icon_select_style)
        .selector('node.tr').style(m_node_tr_style)
        .selector('node.tr:selected').style(m_node_power_icon_select_style)
        .selector('node.gen').style(m_node_gen_style)
        .selector('node.gen:selected').style(m_node_power_icon_select_style)
        .selector('node.powert').style(m_node_powert_style)
        .selector('node.powert:selected').style(m_node_powert_select_style)
        .selector('node.interlock').style(m_node_interlock_style)
        .selector('node.interlock:selected').style(m_node_power_icon_select_style)
        .selector('node.genpanel').style(m_node_genpanel_style)
        .selector('node.genpanel:selected').style(m_node_power_icon_select_style);
    
    const m_cytoscape_default_menu = {
        menuRadius: 50,
        selector: 'node.default, node.tempdi, node.th, node.thtop, node.thbottom, node.thonlyt, node.door, node.hv, node.hvhalf, node.lv, node.tr, node.gen, node.powert, node.interlock, node.genpanel',
        commands: [{
            content: '설정',
            contentStyle: { 'font-size': '0.8em' },
            select: function(ele) {
                options.onSet(ele);
            }
        }, {
            content: '복제',
            contentStyle: { 'font-size': '0.8em' },
            select: function(ele) {
                options.onDuplicate(ele);
            }
        }, {
            content: '삭제',
            contentStyle: { 'font-size': '0.8em' },
            select: function(ele) {
                options.onDelete(ele);
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
        zIndex: 99,
        openMenuEvents: 'cxttapstart'
    }

    const m_cytoscape_dome_menu = {
        menuRadius: 50,
        selector: 'node.dome',
        commands: [{
            content: '설정',
            contentStyle: { 'font-size': '0.75em' },
            select: function(ele) {
                options.onSet(ele);
            }
        }, {
            content: '자산설정',
            contentStyle: { 'font-size': '0.75em' },
            select: function(ele) {
                options.onEquipmentSetting(ele);
            }
        }, {
            content: '복제',
            contentStyle: { 'font-size': '0.8em' },
            select: function(ele) {
                options.onDuplicate(ele);
            }
        }, {
            content: '삭제',
            contentStyle: { 'font-size': '0.8em' },
            select: function(ele) {
                options.onDelete(ele);
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
        zIndex: 99,
        openMenuEvents: 'cxttapstart'
    }

    const m_cytoscape_light_menu = {
        menuRadius: 50,
        selector: 'node.light',
        commands: [{
            content: 'ON',
            contentStyle: { 'font-size': '0.75em' },
            select: function(ele) {
                options.onCtrlLight(ele, 'ON');
            }
        }, {
            content: 'OFF',
            contentStyle: { 'font-size': '0.75em' },
            select: function(ele) {
                options.onCtrlLight(ele, 'OFF');
            }
        }, {
            content: '설정',
            contentStyle: { 'font-size': '0.75em' },
            select: function(ele) {
                options.onSet(ele);
            }
        }, {
            content: '복제',
            contentStyle: { 'font-size': '0.8em' },
            select: function(ele) {
                options.onDuplicate(ele);
            }
        }, {
            content: '삭제',
            contentStyle: { 'font-size': '0.8em' },
            select: function(ele) {
                options.onDelete(ele);
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
        zIndex: 99,
        openMenuEvents: 'cxttapstart'
    }

    const m_cytoscape_light_admin_menu = {
        menuRadius: 50,
        selector: 'node.light',
        commands: [{
            content: 'ON',
            contentStyle: { 'font-size': '0.75em' },
            select: function(ele) {
                options.onCtrlLight(ele, 'ON');   
            }
        }, {
            content: 'OFF',
            contentStyle: { 'font-size': '0.75em' },
            select: function(ele) {
                options.onCtrlLight(ele, 'OFF');
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
        zIndex: 99,
        openMenuEvents: 'cxttapstart'
    }
    /***********************************************************************************************************************************/
    /* by shkoh 20211229: cytoscape predefine end                                                                                      */
    /***********************************************************************************************************************************/

    /***********************************************************************************************************************************/
    /* by shkoh 20211229: cytoscape define function start                                                                              */
    /***********************************************************************************************************************************/
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
            boxSelectionEnabled: options.isIcomer === true,
            autolock: options.isIcomer !== true,
            layout: m_cytoscape_layout,
            style: m_cytoscape_styles
        });
    }

    function createNodeHtmlLabel() {
        m_cytoscape.nodeHtmlLabel([{
            query: '.th, .thtop, .thbottom',
            tpl: function(data) {
                const equip_lvl = data.bUse === 'Y' ? data.level : 6;
                const temp_value = equip_lvl < 4 && data.temp ? data.temp : '-';
                const humi_value = equip_lvl < 4 && data.humi ? data.humi : '-';

                const html =
                '<div>' +
                    '<div id="i-node-th-' + data.obj_id + '" class="i-th-item i-th-item-type-' + data.type + ' i-th-item-lvl-' + equip_lvl + '">' +
                        '<table>' +
                            '<tbody>' +
                                '<tr>' +
                                    '<td class="i-th-icon-img" style="background-image: url(/img/diagram/icon/temperature_' + equip_lvl + '.png);"></td>' +
                                    '<td class="i-th-icon-text">' + temp_value + '<span class="i-th-icon-text-unit">℃</span></td>' +
                                '</tr>' +
                                '<tr>' +
                                '<td class="i-th-icon-img" style="background-image: url(/img/diagram/icon/humid_' + equip_lvl + '.png);"></td>' +
                                    '<td class="i-th-icon-text">' + humi_value +'<span class="i-th-icon-text-unit">%</span></td>' +
                                '</tr>' +
                            '</tbody>' +
                        '</table>' +
                    '</div>' +
                '</div>';

                return html;
            }
        }, {
            query: '.thonlyt',
            tpl: function(data) {
                const equip_lvl = data.bUse === 'Y' ? data.level : 6;
                const temp_value = equip_lvl < 4 && data.temp ? data.temp : '-';

                const html =
                '<div>' +
                    '<div id="i-node-th-' + data.obj_id + '" class="i-th-item i-th-item-type-' + data.type + ' i-th-item-lvl-' + equip_lvl + ' only-t">' +
                        '<table>' +
                            '<tbody>' +
                                '<tr>' +
                                    '<td class="i-th-icon-img" style="background-image: url(/img/diagram/icon/temperature_' + equip_lvl + '.png);"></td>' +
                                    '<td class="i-th-icon-text">' + temp_value + '<span class="i-th-icon-text-unit">℃</span></td>' +
                                '</tr>' +
                            '</tbody>' +
                        '</table>' +
                    '</div>' +
                '</div>';

                return html;
            }
        }, {
            query: '.light',
            tpl: function(data) {
                const grab_class = data.isGrab ? ' i-light-panel-grab' : '';
                const state = data.val === 0 ? false : true;
                const light_class = state ? ' i-light-item-on' : '';

                const html =
                '<div class="i-light-panel' + grab_class + '">' +
                    '<div id="i-node-light-' + data.obj_id + '" class="i-light-item' + light_class + '">' +
                        '<span class="i-light-item-text">' + (data.sensor_name.length > 4 ? (data.sensor_name.substring(0, 4)) : data.sensor_name ) + '</span>' +
                    '</div>' +
                '</div>';

                return html;
            }
        }, {
            query: '.light:selected',
            tpl: function(data) {
                const grab_class = data.isGrab ? ' i-light-panel-grab-select' : '';
                const state = data.val === 0 ? false : true;
                const light_class = state ? ' i-light-item-on' : '';

                const html =
                '<div class="i-light-panel' + grab_class + '">' +
                    '<div id="i-node-light-' + data.obj_id + '" class="i-light-item' + light_class + '">' +
                        '<span class="i-light-item-text">' + (data.sensor_name.length > 4 ? (data.sensor_name.substring(0, 4)) : data.sensor_name ) + '</span>' +
                    '</div>' +
                '</div>';

                return html;
            }
        }, {
            query: '.powert',
            tpl: function(data) {
                const v = data.level < 6 ? data.v.toFixed(1) : ' - ';
                const a = data.level < 6 ? data.a.toFixed(1) : ' - ';
                const kw = data.level < 6 ? data.kw.toFixed(1) : ' - ';

                const html =
                '<div class="i-power-table-panel">' +
                    '<div class="i-equip-name">' + data.name + '</div>' +
                    '<div class="i-sensor">' +
                        '<span class="i-sensor-key">전압</span>' +
                        '<span class="i-sensor-value">' + v + '</span>' +
                        '<span class="i-sensor-unit">V</span>' +
                    '</div>' +
                    '<div class="i-sensor">' +
                        '<span class="i-sensor-key">전류</span>' +
                        '<span class="i-sensor-value">' + a + '</span>' +
                        '<span class="i-sensor-unit">A</span>' +
                    '</div>' +
                    '<div class="i-sensor">' +
                        '<span class="i-sensor-key">유효전력</span>' +
                        '<span class="i-sensor-value">' + kw + '</span>' +
                        '<span class="i-sensor-unit">kW</span>' +
                    '</div>' +
                '</div>';

                return html;
            }
        }]);
    }

    function createCytoscapeEvent() {
        m_cytoscape.on('resize', function(e) {
            m_cytoscape.elements().forEach(function(item) {
                item.renderedPosition({
                    x: parseFloat(item.data('pos_x')) * parseFloat($('#cytoscape').width()),
                    y: parseFloat(item.data('pos_y')) * parseFloat($('#cytoscape').height())
                });

                // by shkoh 20220921: resize가 발생하는 경우에 해당 노드 스타일을 새로 그려줌
                item.updateStyle();
            });

            m_cytoscape.layout(m_cytoscape_layout).run();
        });

        m_cytoscape.on('select', 'node', function(e) {
            if($.session.get('user-grade') === 'USR00') $(window).trigger('focus');
        });

        m_cytoscape.on('unselect', 'node', function(e) {
            if($.session.get('user-grade') === 'USR00') $(window).trigger('focusout');
        });

        m_cytoscape.on('add', 'node.tempdi', function(e) {
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

        m_cytoscape.on('add', 'node.light', function(e) {
            const equip_name = e.target.data('equip_name');
            e.target.qtip({
                content: {
                    text: equip_name === undefined ? '등록오류' : equip_name
                },
                show: {
                    event: 'click'
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

        m_cytoscape.on('data', 'node.tempdi, node.light', function(e) {
            // by shkoh 20220105: qtip은 cytoscape의 scratch(cytoscape의 element에서 기능확장을 위해서 사용)에 정의가 되어 있어야 함
            if(e.target.scratch().qtip !== undefined) {
                const qtip_api = e.target.qtip('api');
                if(qtip_api) {
                    const equip_name = e.target.data('equip_name');
                    const type = e.target.data('type');
                    
                    let text = '';
                    if(equip_name === undefined) {
                        text = '등록오류';
                    } else if(type === 'tempdi') {
                        text = equip_name + ': ' + e.target.data('name');
                    } else if(type === 'light') {
                        text = equip_name;
                    }
                    
                    qtip_api.set('content.text', text);
                }
            }
        });

        m_cytoscape.on('tapend', 'node', function(e) {
            options.onTouchEnd(e);
        });

        m_cytoscape.on('click', 'node.dome, node.hv, node.hvhalf, node.lv, node.tr, node.gen, node.genpanel', function(evt) {
            let clicked_node = evt.target;

            if(m_clicked_timeout && m_clicked_node_before) {
                clearTimeout(m_clicked_timeout);
            }

            if(m_clicked_node_before == clicked_node) {
                // by shkoh 20220106: double click event
                clicked_node.trigger('doubleclick');
                m_clicked_node_before = undefined;
            } else {
                m_clicked_timeout = setTimeout(function() { m_clicked_node_before = undefined; }, 600);
                m_clicked_node_before = clicked_node;
            }
        });

        m_cytoscape.on('doubleclick', 'node.dome', options.onPlayCamera);

        m_cytoscape.on('doubleclick', 'node.hv, node.hvhalf, node.lv, node.tr, node.gen, node.genpanel', options.onMoveMonitoring);

        m_cytoscape.on('select', 'node.light', function(e) {
            const obj_id = e.target.data('obj_id');
            m_cytoscape.$('node[obj_id = "' + obj_id + '"]').data('isGrab', true);
        });

        m_cytoscape.on('unselect', 'node.light', function(e) {
            const obj_id = e.target.data('obj_id');
            m_cytoscape.$('node[obj_id = "' + obj_id + '"]').data('isGrab', false);
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
    }

    function createContextMenu() {        
        const grade = $.session.get('user-grade');
        if(grade === 'USR00') {
            m_cytoscape.cxtmenu(m_cytoscape_default_menu);
            m_cytoscape.cxtmenu(m_cytoscape_dome_menu);
            m_cytoscape.cxtmenu(m_cytoscape_light_menu);
        } else {
            m_cytoscape.cxtmenu(m_cytoscape_light_admin_menu);
        }
    }
    /***********************************************************************************************************************************/
    /* by shkoh 20211229: cytoscape define function end                                                                                */
    /***********************************************************************************************************************************/

    /***********************************************************************************************************************************/
    /* by shkoh 20211229: cytoscape inline function start                                                                              */
    /***********************************************************************************************************************************/
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
                    case 'tempdi': {
                        const _val = item.equip_level < 4 ? item.value : ' - ';
                        
                        Object.assign(data, {
                            val: _val + '℃',
                            equip_name: item.equip_name,
                            equip_level: item.equip_level
                        });
                        break;
                    }
                    case 'light': {
                        Object.assign(data, {
                            equip_id: item.equip_id,
                            ip: item.ip,
                            port: item.port,
                            equip_name: item.equip_name,
                            sensor_name: item.sensor_name,
                            val: item.val,
                            available_equip: item.available_equip,
                            ctrl_info: item.ctrl_info,
                            isGrab: false
                        });
                        break;
                    }
                    case 'door': {
                        Object.assign(data, {
                            equip_name: item.equip_name,
                            available_equip: item.available_equip,
                            isOpen: item.isOpen
                        });
                        break;
                    }
                    case 'th':
                    case 'thtop':
                    case 'thbottom':
                    case 'thonlyt': {
                        Object.assign(data, {
                            temp: item.temp,
                            humi: item.humi
                        });
                        break;
                    }
                    case 'powert': {
                        Object.assign(data, {
                            v: item.v,
                            a: item.a,
                            kw: item.kw
                        })
                        break;
                    }
                }

                parse_items.push({
                    group: 'nodes',
                    classes: item.type,
                    renderedPosition: {
                        x: item.pos_x.toFixed(3) * $('#cytoscape').width(),
                        y: item.pos_y.toFixed(3) * $('#cytoscape').height()
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
            m_cytoscape.nodes('#' + item.id()).trigger('select');
        });
    }

    function updateItems(items, selected_items) {
        if(m_cytoscape === undefined) return;

        const new_items = parseCytoscapeItems(items);
        new_items.forEach(function(item) {
            const node = m_cytoscape.nodes('#' + item.data.id);
            if(node) {
                node.removeData();
                
                node.data(item.data);
                node.position(item.renderedPosition);
                node.classes(item.classes);
            }
        });

        selected_items.forEach(function(item) {
            m_cytoscape.nodes('#' + item.id()).select();
            m_cytoscape.nodes('#' + item.id()).trigger('select');
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
                    x: x * $('#cytoscape').width(),
                    y: y * $('#cytoscape').height()
                });
            }
        });
    }

    function moveItem(new_pos) {
        const selected_nodes = getSelectedItems();

        selected_nodes.forEach(function(node) {
            let current_pos = node.renderedPosition();
            current_pos.x += new_pos.x;
            current_pos.y += new_pos.y;

            node.data('pos_x', (current_pos.x / $('#cytoscape').width()).toFixed(2));
            node.data('pos_y', (current_pos.y / $('#cytoscape').height()).toFixed(2));
            node.renderedPosition(current_pos);
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
                    node.data('pos_x', (min_x / $('#cytoscape').width()).toFixed(2));
                    node.renderedPosition('x', min_x);
                    break;
                case 'right':
                    node.data('pos_x', (max_x / $('#cytoscape').width()).toFixed(2));
                    node.renderedPosition('x', max_x);
                    break;
                case 'top':
                    node.data('pos_y', (min_y / $('#cytoscape').height()).toFixed(2));
                    node.renderedPosition('y', min_y);
                    break;
                case 'bottom':
                    node.data('pos_y', (max_y / $('#cytoscape').height()).toFixed(2));
                    node.renderedPosition('y', max_y);
                    break;
                case 'horizontal':
                    break;
                case 'vertical':
                    break;
            }
        });
    }

    function unselectedAllItems() {
        m_cytoscape.elements(':selected').unselect();
    }

    function selectItem(id) {
        m_cytoscape.$('node[obj_id = "' + id + '"]').select();
    }
    /***********************************************************************************************************************************/
    /* by shkoh 20211229: cytoscape inline function end                                                                                */
    /***********************************************************************************************************************************/

    return {
        Create: function() {
            createCytoscape();
            createNodeHtmlLabel();
            createCytoscapeEvent();
            createContextMenu();
        },
        Redraw: function(items) {
            const old_items = getAllItems();
            const selected_items = getSelectedItems();
            
            if(items.length != old_items.length) {
                clearItems();
                redrawItems(items, selected_items);
            } else {
                updateItems(items, selected_items);
            }
        },
        Resize: function() { resize(); },
        GetAllItems: function() { return getAllItems(); },
        GetSelectedItem: function() { return getSelectedItems(); },
        RepositionNodes: function(items) { repositionNodes(items); },
        Align: function(direction) { return alignItem(direction); },
        SelectItemBySensorId: function(s_id) {
            unselectedAllItems();
            selectItem(s_id)
        }
    }
}