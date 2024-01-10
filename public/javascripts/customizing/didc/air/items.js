const Items = function(_id, _optinos) {
    const m_id = _id;

    let options = {
        isIcomer: false,
        onSet: undefined,
        onDuplicate: undefined,
        onDelete: undefined,
        onTouchEnd: undefined,
        onEquipmentSetting: undefined,
        onMoveMonitoring: undefined
    }

    options = _optinos;

    let m_clicked_timeout_inst = undefined;
    let m_previous_clicked_node = undefined;

    let m_cytoscape = undefined;

    const line_color = {
        hv: '#eb4a32',
        lv: '#4363c3'
    }

    const m_item_info = [
        { key: 'd-a-fms', unit: 'CMH', text_which: 'left', w: 120.0, h: 54.0 },
        { key: 'd-a-b-damper', unit: '%', text_which: 'bottom', w: 54.0, h: 124.0 },
        { key: 'd-a-damper', unit: '%', text_which: 'left', w: 122.0, h: 55.0 },
        { key: 'd-a-dps', unit: '', text_which: 'bottom', w: 38.0, h: 121.0 },
        { key: 'd-a-h-filter', unit: '', text_which: 'bottom', w: 46.0, h: 122.0 },
        { key: 'd-a-outdoor-unit', unit: '', text_which: 'bottom', w: 95.0, h: 92.0 },
        { key: 'd-a-fan-l', unit: '', text_which: 'left', w: 119.0, h: 92.0 },
        { key: 'd-a-fan-r', unit: '', text_which: 'left', w: 90.0, h: 120.0 },
        { key: 'd-a-p-temp', unit: '℃', text_which: 'left', w: 101.0, h: 39.0 },
        { key: 'd-a-p-humi', unit: '%', text_which: 'left', w: 99.0, h: 42.0 },
        { key: 'd-a-p-co2', unit: 'PPM', text_which: 'left', w: 99.0, h: 60.0 },
        { key: 'd-a-p-pres', unit: 'MMAQ', text_which: 'left', w: 38.0, h: 42.0 },
        { key: 'd-a-p-smoke', unit: '', text_which: 'left', w: 74.0, h: 90.0 },
        { key: 'd-a-p-temp-b', unit: '℃', text_which: 'bottom', w: 35.0, h: 97.0 },
        { key: 'd-a-p-heat-b', unit: '', text_which: 'bottom', w: 68.0, h: 146.0 },
        { key: 'd-a-text-normal', unit: '%', text_which: 'left', w: 0, h: 0 },
        { key: 'd-a-text-temp-v', unit: '℃', text_which: 'center', w: 0, h: 0 },
        { key: 'd-a-text-title-l', unit: '', text_which: 'center', w: 0, h: 0 },
        { key: 'd-a-text-title', unit: '', text_which: 'center', w: 0, h: 0 },
        { key: 'd-a-text-title-s', unit: '', text_which: 'center', w: 0, h: 0 },
        { key: 'd-a-ai-label', unit: '', text_which: 'center', w: 0, h: 0 },
        { key: 'd-a-di-label', unit: '', text_which: 'center', w: 0, h: 0 },
        { key: 'd-a-chiller', unit: '', w: 240.0, h: 100.0 },
        { key: 'd-a-pump-cw', w: 75.0, h: 141.0 },
        { key: 'd-a-pump-ccw', w: 75.0, h: 141.0 },
        { key: 'd-a-ct-cw', w: 50.0, h: 68.0 },
    ];

    /***********************************************************************************************************************************/
    /* by shkoh 20230802: cytoscape predefine Start                                                                                    */
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
        'font-size': '12px',
        'font-weight': 'bold',
        'padding': '0.3em',
        'text-wrap': 'wrap',
        'text-halign': 'center',
        'text-valign': 'center',
        'background-repeat': 'no-repeat'
    };

    const m_node_select_style = {
        'background-opacity': 0.5,
        'border-width': '2px',
        'border-color': '#656565',
        'border-style': 'dashed'
    }

    const m_node_default_style = {
        'width': '48px',
        'height': '48px',
        'background-fit': 'contain',
        'background-image': function() {
            return '/img/equip/default_L_0.png';
        },
        'shape': 'roundrectangle'
    };

    const m_node_default_select_style = {
        'background-image': function() {
            return '/img/equip/default_L_6.png';
        }
    };

    const m_node_d_a_fms_style = {
        'width': function() {
            const img_w = 120;
            const canvas_w = parseFloat($('#cytoscape').width()) / 1920.0;
            return parseFloat(img_w * canvas_w) + 'px';
        },
        'height': function() {
            const img_h = 54;
            const canvas_h = parseFloat($('#cytoscape').height()) / 1080.0;
            return parseFloat(img_h * canvas_h) + 'px';
        },
        'background-opacity': 0,
        'shape': 'rectangle',
    };

    const m_node_d_a_b_damper_style = {
        'width': function() {
            const img_w = 54;
            const canvas_w = parseFloat($('#cytoscape').width()) / 1920.0;
            return parseFloat(img_w * canvas_w) + 'px';
        },
        'height': function() {
            const img_h = 124;
            const canvas_h = parseFloat($('#cytoscape').height()) / 1080.0;
            return parseFloat(img_h * canvas_h) + 'px';
        },
        'background-opacity': 0,
        'shape': 'rectangle',
    };

    const m_node_d_a_damper_style = {
        'width': function() {
            const img_w = 122;
            const canvas_w = parseFloat($('#cytoscape').width()) / 1920.0;
            return parseFloat(img_w * canvas_w) + 'px';
        },
        'height': function() {
            const img_h = 55;
            const canvas_h = parseFloat($('#cytoscape').height()) / 1080.0;
            return parseFloat(img_h * canvas_h) + 'px';
        },
        'background-opacity': 0,
        'shape': 'rectangle',
    };

    const m_node_d_a_dsp_style = {
        'width': function() {
            const img_w = 38;
            const canvas_w = parseFloat($('#cytoscape').width()) / 1920.0;
            return parseFloat(img_w * canvas_w) + 'px';
        },
        'height': function() {
            const img_h = 121;
            const canvas_h = parseFloat($('#cytoscape').height()) / 1080.0;
            return parseFloat(img_h * canvas_h) + 'px';
        },
        'background-opacity': 0,
        'shape': 'rectangle',
    };

    const m_node_d_a_humidity_filter_style = {
        'width': function() {
            const img_w = 46;
            const canvas_w = parseFloat($('#cytoscape').width()) / 1920.0;
            return parseFloat(img_w * canvas_w) + 'px';
        },
        'height': function() {
            const img_h = 122;
            const canvas_h = parseFloat($('#cytoscape').height()) / 1080.0;
            return parseFloat(img_h * canvas_h) + 'px';
        },
        'background-opacity': 0,
        'shape': 'rectangle',
    };

    const m_node_d_a_outdoor_unit_style = {
        'width': function() {
            const img_w = 95;
            const canvas_w = parseFloat($('#cytoscape').width()) / 1920.0;
            return parseFloat(img_w * canvas_w) + 'px';
        },
        'height': function() {
            const img_h = 92;
            const canvas_h = parseFloat($('#cytoscape').height()) / 1080.0;
            return parseFloat(img_h * canvas_h) + 'px';
        },
        'background-opacity': 0,
        'shape': 'rectangle',
    }

    const m_node_d_a_fan_left_style = {
        'width': function() {
            const img_w = 119;
            const canvas_w = parseFloat($('#cytoscape').width()) / 1920.0;
            return parseFloat(img_w * canvas_w) + 'px';
        },
        'height': function() {
            const img_h = 92;
            const canvas_h = parseFloat($('#cytoscape').height()) / 1080.0;
            return parseFloat(img_h * canvas_h) + 'px';
        },
        'background-opacity': 0,
        'shape': 'rectangle',
    };

    const m_node_d_a_fan_right_style = {
        'width': function() {
            const img_w = 90;
            const canvas_w = parseFloat($('#cytoscape').width()) / 1920.0;
            return parseFloat(img_w * canvas_w) + 'px';
        },
        'height': function() {
            const img_h = 120;
            const canvas_h = parseFloat($('#cytoscape').height()) / 1080.0;
            return parseFloat(img_h * canvas_h) + 'px';
        },
        'background-opacity': 0,
        'shape': 'rectangle',
    };

    const m_node_d_a_p_temp_style = {
        'width': function() {
            const img_w = 101;
            const canvas_w = parseFloat($('#cytoscape').width()) / 1920.0;
            return parseFloat(img_w * canvas_w) + 'px';
        },
        'height': function() {
            const img_h = 39;
            const canvas_h = parseFloat($('#cytoscape').height()) / 1080.0;
            return parseFloat(img_h * canvas_h) + 'px';
        },
        'background-opacity': 0,
        'shape': 'rectangle',
    };

    const m_node_d_a_p_humi_style = {
        'width': function() {
            const img_w = 99;
            const canvas_w = parseFloat($('#cytoscape').width()) / 1920.0;
            return parseFloat(img_w * canvas_w) + 'px';
        },
        'height': function() {
            const img_h = 42;
            const canvas_h = parseFloat($('#cytoscape').height()) / 1080.0;
            return parseFloat(img_h * canvas_h) + 'px';
        },
        'background-opacity': 0,
        'shape': 'rectangle',
    };

    const m_node_d_a_p_co2_style = {
        'width': function() {
            const img_w = 99;
            const canvas_w = parseFloat($('#cytoscape').width()) / 1920.0;
            return parseFloat(img_w * canvas_w) + 'px';
        },
        'height': function() {
            const img_h = 60;
            const canvas_h = parseFloat($('#cytoscape').height()) / 1080.0;
            return parseFloat(img_h * canvas_h) + 'px';
        },
        'background-opacity': 0,
        'shape': 'rectangle',
    };

    const m_node_d_a_p_pres_style = {
        'width': function() {
            const img_w = 38;
            const canvas_w = parseFloat($('#cytoscape').width()) / 1920.0;
            return parseFloat(img_w * canvas_w) + 'px';
        },
        'height': function() {
            const img_h = 42;
            const canvas_h = parseFloat($('#cytoscape').height()) / 1080.0;
            return parseFloat(img_h * canvas_h) + 'px';
        },
        'background-opacity': 0,
        'shape': 'rectangle',
    };

    const m_node_d_a_p_smoke_style = {
        'width': function() {
            const img_w = 74;
            const canvas_w = parseFloat($('#cytoscape').width()) / 1920.0;
            return parseFloat(img_w * canvas_w) + 'px';
        },
        'height': function() {
            const img_h = 90;
            const canvas_h = parseFloat($('#cytoscape').height()) / 1080.0;
            return parseFloat(img_h * canvas_h) + 'px';
        },
        'background-opacity': 0,
        'shape': 'rectangle',
    };

    const m_node_d_a_p_temp_b_style = {
        'width': function() {
            const img_w = 35;
            const canvas_w = parseFloat($('#cytoscape').width()) / 1920.0;
            return parseFloat(img_w * canvas_w) + 'px';
        },
        'height': function() {
            const img_h = 97;
            const canvas_h = parseFloat($('#cytoscape').height()) / 1080.0;
            return parseFloat(img_h * canvas_h) + 'px';
        },
        'background-opacity': 0,
        'shape': 'rectangle',
    };

    const m_node_d_a_p_heat_b_style = {
        'width': function() {
            const img_w = 68;
            const canvas_w = parseFloat($('#cytoscape').width()) / 1920.0;
            return parseFloat(img_w * canvas_w) + 'px';
        },
        'height': function() {
            const img_h = 146;
            const canvas_h = parseFloat($('#cytoscape').height()) / 1080.0;
            return parseFloat(img_h * canvas_h) + 'px';
        },
        'background-opacity': 0,
        'shape': 'rectangle',
    };

    const m_node_d_a_chiller = {
        'width': function() {
            const img_w = 240;
            const canvas_w = parseFloat($('#cytoscape').width()) / 1920.0;
            return parseFloat(img_w * canvas_w) + 'px';
        },
        'height': function() {
            const img_h = 100;
            const canvas_h = parseFloat($('#cytoscape').height()) / 1080.0;
            return parseFloat(img_h * canvas_h) + 'px';
        },
        'background-opacity': 0,
        'shape': 'rectangle'
    }

    const m_node_d_a_pump = {
        'width': function() {
            const img_w = 75;
            const canvas_w = parseFloat($('#cytoscape').width()) / 1920.0;
            return parseFloat(img_w * canvas_w) + 'px';
        },
        'height': function() {
            const img_h = 141;
            const canvas_h = parseFloat($('#cytoscape').height()) / 1080.0;
            return parseFloat(img_h * canvas_h) + 'px';
        },
        'background-opacity': 0,
        'shape': 'rectangle'
    }

    const m_node_d_a_ct_cw = {
        'width': function() {
            const img_w = 50;
            const canvas_w = parseFloat($('#cytoscape').width()) / 1920.0;
            return parseFloat(img_w * canvas_w) + 'px';
        },
        'height': function() {
            const img_h = 68;
            const canvas_h = parseFloat($('#cytoscape').height()) / 1080.0;
            return parseFloat(img_h * canvas_h) + 'px';
        },
        'background-opacity': 0,
        'shape': 'rectangle'
    }

    const m_node_d_a_text_normal = {
        'width': function(ele) {
            const w = $('#text-' + ele.data('id')).width();
            return w ? w : '120px';
        },
        'height': function(ele) {
            const h = $('#text-' + ele.data('id')).height();
            return h ? h : '30px';
        },
        'background-opacity': 0,
        'shape': 'rectangle',
    }

    const m_node_d_a_text_temp = {
        'width': function(ele) {
            const w = $('#text-' + ele.data('id')).width();
            return w ? w : '120px';
        },
        'height': function(ele) {
            const h = $('#text-' + ele.data('id')).height();
            return h ? h : '30px';
        },
        'background-opacity': 0,
        'shape': 'rectangle',
    }

    const m_node_d_a_text_title = {
        'width': function(ele) {
            const w = $('#text-' + ele.data('id')).width();
            return w ? w : '200px';
        },
        'height': function(ele) {
            const h = $('#text-' + ele.data('id')).height();
            return h ? h : '30px';
        },
        'background-opacity': 0,
        'shape': 'rectangle',
    }

    const m_node_d_a_label = {
        'width': function(ele) {
            const w = $('#text-' + ele.data('id')).width();
            return w ? w : '80px';
        },
        'height': function(ele) {
            const h = $('#text-' + ele.data('id')).height();
            return h ? h : '30px';
        },
        'background-opacity': 0,
        'shape': 'rectangle',
    }

    const m_cytoscape_styles = cytoscape.stylesheet()
        .selector('node').style(m_node_style)
        .selector('node:selected').style(m_node_select_style)
        .selector('node.default').style(m_node_default_style)
        .selector('node.default:selected').style(m_node_default_select_style)
        .selector('node.d-a-fms').style(m_node_d_a_fms_style)
        .selector('node.d-a-b-damper').style(m_node_d_a_b_damper_style)
        .selector('node.d-a-damper').style(m_node_d_a_damper_style)
        .selector('node.d-a-dps').style(m_node_d_a_dsp_style)
        .selector('node.d-a-h-filter').style(m_node_d_a_humidity_filter_style)
        .selector('node.d-a-outdoor-unit').style(m_node_d_a_outdoor_unit_style)
        .selector('node.d-a-fan-l').style(m_node_d_a_fan_left_style)
        .selector('node.d-a-fan-r').style(m_node_d_a_fan_right_style)
        .selector('node.d-a-p-temp').style(m_node_d_a_p_temp_style)
        .selector('node.d-a-p-humi').style(m_node_d_a_p_humi_style)
        .selector('node.d-a-p-co2').style(m_node_d_a_p_co2_style)
        .selector('node.d-a-p-pres').style(m_node_d_a_p_pres_style)
        .selector('node.d-a-p-smoke').style(m_node_d_a_p_smoke_style)
        .selector('node.d-a-p-temp-b').style(m_node_d_a_p_temp_b_style)
        .selector('node.d-a-p-heat-b').style(m_node_d_a_p_heat_b_style)
        .selector('node.d-a-chiller').style(m_node_d_a_chiller)
        .selector('node.d-a-pump-cw, node.d-a-pump-ccw').style(m_node_d_a_pump)
        .selector('node.d-a-ct-cw').style(m_node_d_a_ct_cw)
        .selector('node.d-a-text-normal').style(m_node_d_a_text_normal)
        .selector('node.d-a-text-temp-v').style(m_node_d_a_text_temp)
        .selector('node.d-a-text-title-l, node.d-a-text-title, node.d-a-text-title-l').style(m_node_d_a_text_title)
        .selector('node.d-a-ai-label, node.d-a-di-label').style(m_node_d_a_label)
        ;
    
    const m_cytoscape_default_menu = {
        menuRadius: 50,
        selector: 'node',
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
        zIndex: 10,
        openMenuEvents: 'cxttapstart'
    }
    /***********************************************************************************************************************************/
    /* by shkoh 20230802: cytoscape predefine End                                                                                      */
    /***********************************************************************************************************************************/

    /***********************************************************************************************************************************/
    /* by shkoh 20230802: cytoscape define function Start                                                                              */
    /***********************************************************************************************************************************/
    function createCytoscape() {
        m_cytoscape = cytoscape({
            container: document.getElementById(m_id),
            panningEnabled: false,
            userPanningEnabled: false,
            zoomingEnabled: false,
            userZoomingEnabled: false,
            motionBlur: false,
            pixelRatio: 'auto',
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
            query: 'node.d-a-fms, node.d-a-b-damper, node.d-a-damper, node.d-a-dps, node.d-a-h-filter, node.d-a-fan-l, node.d-a-fan-r, node.d-a-p-temp, node.d-a-p-humi, node.d-a-p-co2, node.d-a-p-pres, node.d-a-p-smoke, node.d-a-p-temp-b, node.d-a-p-heat-b, node.d-a-chiller, node.d-a-outdoor-unit',
            tpl: function(data) {
                const { type, name, lvl, value } = data;                
                const { unit, text_which, w, h } = m_item_info.find(function(i) { return i.key === type; });

                const ratio_wh = {
                    w: parseFloat(w * 100.0 / 1920.0) + 'vw',
                    h: parseFloat(h * 100.0 / 1080.0) + 'vh'
                };

                const alert_class = lvl > 1 ? ' i-lvl-' + lvl + ' i-twinkling' : '';

                const html =
                '<div class="i-d-air-icon " style="width:' + ratio_wh.w + ';height:' + ratio_wh.h + ';">' +
                    '<div class="i-d-a-img i-' + type + ' i-src"></div>' +
                    '<div class="i-d-a-img i-' + type + ' i-mask' + alert_class + '"></div>' +
                    '<div class="i-d-a-text ' + text_which + (value != undefined  ? '' : ' i-not-value') + '">' +
                        '<div class="i-d-a-text-wrap">' +
                            (name ? '<span class="i-d-a-name">' + name.replace(/\\n/, '<br>') + '</span>' : '') +
                            (value !== undefined ? '<span class="i-d-a-value">' + value + '</span>' : '') +
                            (value !== undefined && unit ? '<span class="i-d-a-unit">' + unit + '</span>' : '') +
                        '</div>' +
                    '</div>' +
                '</div>';
                
                return html;
            }
        }, {
            query: 'node.d-a-fan-l, node.d-a-fan-r',
            tpl: function(data) {
                const { type, name, lvl, value, current_value } = data;                
                const { unit, text_which, w, h } = m_item_info.find(function(i) { return i.key === type; });

                const ratio_wh = {
                    w: parseFloat(w * 100.0 / 1920.0) + 'vw',
                    h: parseFloat(h * 100.0 / 1080.0) + 'vh'
                };

                const alert_class = lvl > 1 ? ' i-lvl-' + lvl + ' i-twinkling' : '';

                const html =
                '<div class="i-d-air-icon " style="width:' + ratio_wh.w + ';height:' + ratio_wh.h + ';">' +
                    '<div class="i-d-a-img i-' + type + ' i-src"></div>' +
                    '<div class="i-d-a-img i-' + type + ' i-mask' + alert_class + '"></div>' +
                    '<div class="i-d-a-fan-cw i-' + type + (current_value === 1 ? ' i-d-a-fan-cw-start' : '') + '"></div>' +
                    '<div class="i-d-a-text ' + text_which + (value ? '' : ' i-not-value') + '">' +
                        '<div class="i-d-a-text-wrap">' +
                            (name ? '<span class="i-d-a-name">' + name.replace(/\\n/, '<br>') + '</span>' : '') +
                            (value !== undefined ? '<span class="i-d-a-value">' + value + '</span>' : '') +
                            (value !== undefined && unit ? '<span class="i-d-a-unit">' + unit + '</span>' : '') +
                        '</div>' +
                    '</div>' +
                '</div>';
                
                return html;
            }
        }, {
            query: 'node.d-a-chiller',
            tpl: function(data) {
                const { type, name, lvl, value } = data;
                const { w, h } = m_item_info.find(function(i) { return i.key === type; });

                const ratio_wh = {
                    w: parseFloat(w * 100.0 / 1920.0) + 'vw',
                    h: parseFloat(h * 100.0 / 1080.0) + 'vh'
                };

                const alert_class = lvl > 1 ? ' i-lvl-' + lvl + ' i-twinkling' : '';

                const html =
                '<div class="i-d-air-icon " style="width:' + ratio_wh.w + ';height:' + ratio_wh.h + ';">' +
                    '<div class="i-d-a-img i-' + type + ' i-src"></div>' +
                    '<div class="i-d-a-img i-' + type + ' i-mask' + alert_class + '"></div>' +
                    '<div class="i-d-a-text i-' + type + (value ? '' : ' i-not-value') + '">' +
                        '<div class="i-d-a-text-wrap">' +
                            (name ? '<span class="i-d-a-name">' + name.replace(/\\n/, '<br>') + '</span>' : '') +
                        '</div>' +
                    '</div>' +
                '</div>';
                
                return html;
            }
        }, {
            query: 'node.d-a-pump-cw, node.d-a-pump-ccw',
            tpl: function(data) {
                const { type, lvl, value } = data;
                const { w, h } = m_item_info.find(function(i) { return i.key === type; });

                const ratio_wh = {
                    w: parseFloat(w * 100.0 / 1920.0) + 'vw',
                    h: parseFloat(h * 100.0 / 1080.0) + 'vh'
                };

                const alert_class = lvl > 1 ? ' i-lvl-' + lvl + ' i-twinkling' : '';

                const html =
                '<div class="i-d-air-icon " style="width:' + ratio_wh.w + ';height:' + ratio_wh.h + ';">' +
                    '<div class="i-d-a-img i-' + type + ' i-src"></div>' +
                    '<div class="i-d-a-img i-' + type + ' i-mask' + alert_class + '"></div>' +
                    '<div class="i-d-a-pump-fan i-' + type + (value === 1 ? ' i-d-a-pump-start' : '') + '"></div>' +
                '</div>';
                
                return html;
            }
        }, {
            query: 'node.d-a-ct-cw',
            tpl: function(data) {
                const { type, lvl, value } = data;
                const { w, h } = m_item_info.find(function(i) { return i.key === type; });

                const ratio_wh = {
                    w: parseFloat(w * 100.0 / 1920.0) + 'vw',
                    h: parseFloat(h * 100.0 / 1080.0) + 'vh'
                };

                const alert_class = lvl > 1 ? ' i-lvl-' + lvl + ' i-twinkling' : '';

                const html =
                '<div class="i-d-air-icon " style="width:' + ratio_wh.w + ';height:' + ratio_wh.h + ';">' +
                    '<div class="i-d-a-img i-' + type + ' i-src"></div>' +
                    '<div class="i-d-a-img i-' + type + ' i-mask' + alert_class + '"></div>' +
                    '<div class="i-d-a-ct-fan i-' + type + (value === 1 ? ' i-d-a-ct-start' : '') + '"></div>' +
                '</div>';
                
                return html;
            }
        }, {
            query: 'node.d-a-text-normal',
            tpl: function(data) {
                const { id, type, name, value } = data;
                const { unit } = m_item_info.find(function(i) { return i.key === type; });
                
                const html =
                '<div id="text-' + id + '" class="i-d-air-text" style="width:max-content; height:max-content;">' +
                    '<div class="i-d-a-text-wrap">' +
                        (name ? '<span class="i-d-a-name">' + name.replace(/\\n/, '<br>') + '</span>' : '') +
                        (value !== undefined ? '<span class="i-d-a-value">' + value + '</span>' : '') +
                        (value !== undefined && unit ? '<span class="i-d-a-unit">' + unit + '</span>' : '') +
                    '</div>' +
                '</div>';

                return html;
            }
        }, {
            query: 'node.d-a-text-temp-v',
            tpl: function(data) {
                const { id, type, name, value } = data;
                const { unit } = m_item_info.find(function(i) { return i.key === type; });
                
                const html =
                '<div id="text-' + id + '" class="i-d-air-text '+ type +'" style="text-align: center; width:max-content; height:max-content;">' +
                    '<div class="i-d-a-text-wrap">' +
                        (name ? '<div class="i-d-a-name">' + name.replace(/\\n/, '<br>') + '</div>' : '') +
                        '<div>' +
                            (value !== undefined ? '<span class="i-d-a-value">' + value + '</span>' : '') +
                            (value !== undefined && unit ? '<span class="i-d-a-unit">' + unit + '</span>' : '') +
                        '</div>' +
                    '</div>' +
                '</div>';

                return html;
            }
        }, {
            query: 'node.d-a-text-title-l, node.d-a-text-title, node.d-a-text-title-s',
            tpl: function(data) {
                const { id, type, name } = data;
                
                const html =
                '<div id="text-' + id + '" class="i-d-air-text ' + type + '" style="width:max-content; height:max-content;">' +
                    '<div class="i-d-a-text-wrap">' +
                        (name ? '<span class="i-d-a-name">' + name.replace(/\\n/, '<br>') + '</span>' : '') +
                    '</div>' +
                '</div>';

                return html;
            }
        }, {
            query: 'node.d-a-ai-label',
            tpl: function(data) {
                let { id, type, value, unit, lvl, bUse, bEvent } = data;

                if(bUse === 'N') value = '-';
                else {
                    value = value.toFixed(1);
                }
                
                const html =
                '<div id="text-' + id + '" class="i-d-air-text ' + type + '" style="width:max-content; height:max-content;">' +
                    '<div class="i-d-a-text-wrap i-lvl-' + lvl + '">' +
                        (value !== undefined ? '<span class="i-d-a-value">' + value + '</span>' : '') +
                        (value !== undefined && unit !== undefined ? '<span class="i-d-a-unit">' + unit + '</span>' : '') +
                    '</div>' +
                '</div>';

                return html;
            }
        }, {
            query: 'node.d-a-di-label',
            tpl: function(data) {
                const { id, type, value } = data;
                
                const html =
                '<div id="text-' + id + '" class="i-d-air-text ' + type + '" style="width:max-content; height:max-content;">' +
                    '<div class="i-d-a-text-wrap">' +
                        (value ? '<span class="i-d-a-name">' + value + '</span>' : '') +
                    '</div>' +
                '</div>';

                return html;
            }
        }]);
    }

    function createCytoscapeEvent() {
        m_cytoscape.on('resize', function(e) {
            m_cytoscape.nodes().forEach(function(item) {
                item.renderedPosition({
                    x: parseFloat(item.data('pos_x')) * parseFloat($('#cytoscape').width()),
                    y: parseFloat(item.data('pos_y')) * parseFloat($('#cytoscape').height())
                });

                // by shkoh 20230807: resize가 발생하는 경우에 해당 노드 스타일을 새로 그려줌
                item.updateStyle();
            });

            m_cytoscape.layout(m_cytoscape_layout).run();
        });

        m_cytoscape.on('select', 'node', function(e) {
            if(options.isIcomer) {
                window.addEventListener('keydown', windowKeyDownEvent, false);
                // by shkoh 20230807: 각 node에 keydown 이벤트가 활성화되려면, node가 선택됐을 때, window 창에 포커스가 되도록 해야한다
                $(window).trigger('focus');
            }
        });

        m_cytoscape.on('unselect', 'node', function(e) {
            if(options.isIcomer) {
                $(window).trigger('focusout');
                window.removeEventListener('keydown', windowKeyDownEvent);
            }
        });

        m_cytoscape.on('tapend', 'node', function(e) {
            options.onTouchEnd(e);
        });

        const windowKeyDownEvent = function(e) {
            if(e.isDefaultPrevented) {
                return;
            }

            if(options.isIcomer) {
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

            e.preventDefault();
        };
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

    function createContextMenu() {
        if(options.isIcomer) {
            m_cytoscape.cxtmenu(m_cytoscape_default_menu);
        }
    }
    /***********************************************************************************************************************************/
    /* by shkoh 20230802: cytoscape define function End                                                                                */
    /***********************************************************************************************************************************/

    /***********************************************************************************************************************************/
    /* by shkoh 20230802: cytoscape inline function Start                                                                              */
    /***********************************************************************************************************************************/
    function parseCytoscapeItems(items) {
        const parse_items = [];

        items.forEach(function(item) {
            const { index, type, obj_id, name, bUse, level, pos_x, pos_y, icon, value } = item;

            const data = {
                id: index,
                name: name,
                pos_x: pos_x.toFixed(3),
                pos_y: pos_y.toFixed(3),
                type,
                lvl: level,
                obj_id,
                value,
                bUse
            }

            switch(type) {
                case 'd-a-ai-label': {
                    Object.assign(data, {
                        unit: item.unit,
                        bEvent: item.bEvent
                    });
                    break;
                }
                case 'd-a-fan-l':
                case 'd-a-fan-r': {
                    Object.assign(data, {
                        current_value: item.current_value
                    });
                    break;
                }
            }

            parse_items.push({
                group: 'nodes',
                classes: type,
                data: data,
                renderedPosition: {
                    x: pos_x.toFixed(3) * $('#cytoscape').width(),
                    y: pos_y.toFixed(3) * $('#cytoscape').height()
                }
            });
        });

        return parse_items;
    }

    function getAllItems() {
        return m_cytoscape.elements();
    }

    function getAllNodes() {
        return m_cytoscape.nodes();
    }

    function getSelectedItems() {
        return m_cytoscape.nodes(':selected');
    }

    function getNodeById(id) {
        return m_cytoscape.getElementById(id);
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
                // by shkoh 20230609: 새로운 데이터를 갱신할 때, 기존의 data를 지우는 과정이 필요한 것인지 확인해볼 필요가 있다.
                // node.removeData();
                
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
    /***********************************************************************************************************************************/
    /* by shkoh 20230802: cytoscape inline function End                                                                                */
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
        GetAllNodes: function() { return getAllNodes(); },
        GetSelectedItem: function() { return getSelectedItems(); },
        RepositionNodes: function(items) { repositionNodes(items); },
        Align: function(direction) { return alignItem(direction); },
        GetNodeById: function(id) { return getNodeById(id); }
    }
}