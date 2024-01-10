const Items = function(_id, _optinos) {
    const m_id = _id;

    let options = {
        isIcomer: false,
        onSet: undefined,
        onDuplicate: undefined,
        onDelete: undefined,
        onTouchEnd: undefined,
        onEquipmentSetting: undefined,
        onMoveMonitoring: undefined,
        onSetEdge: undefined,
        onDeleteEdge: undefined,
        onShowDetailPanel: undefined,
        onHideDetailPanel: undefined,
        onShowTempPanel: undefined,
        onHideTempPanel: undefined
    }

    options = _optinos;

    let m_clicked_timeout_inst = undefined;
    let m_previous_clicked_node = undefined;

    let m_cytoscape = undefined;
    let m_edge_handler = undefined;

    const line_color = {
        hv: '#b92905',
        lv: '#b6a62c'
    }

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

    const m_edge_style = {
        'width': '8px',
        'curve-style': 'taxi',
        'line-fill': 'linear-gradient',
        'line-gradient-stop-colors': [ line_color.hv, line_color.lv ],
        'line-gradient-stop-positions': [ '90%', '100%' ],
        'taxi-direction': 'downward',
        'taxi-turn': function(edge) {
            const has_left_text = edge.target('[type="d-text-l"]');
            return has_left_text.length > 0 ? '100%' : '75%';
        },
        'taxi-turn-min-distance': '8px',
        'z-index': 1
    };

    const m_edge_select_style = {
        'line-opacity': 0.8,
        'line-color': '#3030de',
        'background-color': '#787878',
        'background-opacity': 0.6
    };

    const m_edge_preview_edge_style = {
        'line-opacity': 0.5,
        'line-color': '#ba4848',
    };

    const m_edge_no_power_style = {
        'line-color': '#999999',
        'opacity': 0.2,
        'line-style': 'dashed',
        'z-index': 0
    }

    const m_node_style = {
        'font-family': 'MalgunGothic',
        'font-size': '12px',
        'font-weight': 'bold',
        'padding': '0.3em',
        'text-wrap': 'wrap',
        'text-halign': 'center',
        'text-valign': 'center'
    };

    const m_node_no_power_style = {
        'color': '#999999',
        'opacity': 0.75
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

    const m_node_dkepco_style = {
        'width': '72px',
        'height': '58px',
        'background-opacity': 0,
        'shape': 'rectangle',
        'label': function(ele) {
            const name = ele.data('name');
            return name ? name.replace(/\\n/, '\n') : '';
        },
        'text-valign': 'top'
    }

    const m_node_dsv_style = {
        'width': '70px',
        'height': '35px',
        'background-opacity': 0,
        'shape': 'rectangle',
        'label': function(ele) {
            const name = ele.data('name');
            return name ? name.replace(/\\n/, '\n') : '';
        },
        'text-halign': 'right',
        'text-margin-x': '4px'
    }

    const m_node_dsv_t_style = {
        'width': '70px',
        'height': '35px',
        'background-opacity': 0,
        'shape': 'rectangle',
        'label': function(ele) {
            const name = ele.data('name');
            return name ? name.replace(/\\n/, '\n') : '';
        },
        'text-valign': 'top',
    }

    const m_node_dtr_style = {
        'width': '60px',
        'height': '50px',
        'background-opacity': 0,
        'shape': 'rectangle',
        'label': function(ele) {
            const name = ele.data('name');
            return name ? name.replace(/\\n/, '\n') : '';
        },
        'text-halign': 'right',
        'text-margin-x': '4px'
    }

    const m_node_dlv_style = {
        'width': '60px',
        'height': '50px',
        'background-opacity': 0,
        'shape': 'rectangle',
        'label': function(ele) {
            const name = ele.data('name');
            return name ? name.replace(/\\n/, '\n') : '';
        },
        'text-halign': 'right',
        'text-margin-x': '4px'
    }

    const m_node_dacb_style = {
        'width': '60px',
        'height': '20px',
        'background-opacity': 0,
        'shape': 'rectangle'
    }

    const m_edge_dacb_style = {
        'taxi-direction': 'horizontal',
        'taxi-turn': '0%'
    }

    const m_node_dats_style = {
        'width': '40px',
        'height': '38px',
        'background-opacity': 0,
        'shape': 'rectangle'
    }

    const m_node_dgen_s_style = {
        'width': '25px',
        'height': '25px',
        'background-opacity': 0,
        'shape': 'rectangle',
        'label': function(ele) {
            const name = ele.data('name');
            return name ? name.replace(/\\n/, '\n') : '';
        },
        'text-valign': 'bottom',
    }

    const m_edge_dgen_s_style = {
        'source-arrow-color': line_color.hv,
        'source-arrow-shape': 'triangle',
        'arrow-scale': 0.75
    };

    const m_node_dtext_style = {
        'width': '70px',
        'height': '25px',
        'background-opacity': 0,
        'shape': 'rectangle',
        'label': function(ele) {
            const name = ele.data('name');
            return name ? name.replace(/\\n/, '\n') : '';
        }
    }

    const m_node_dtext_l_style = {
        'width': '70px',
        'height': '25px',
        'background-opacity': 0,
        'shape': 'rectangle',
        'label': function(ele) {
            const name = ele.data('name');
            return name ? name.replace(/\\n/, '\n') : '';
        },
        'text-halign': 'right',
        'text-justification': 'left',
        'text-overflow-wrap': 'anywhere',
        'text-margin-x': '-70px'
    }

    const m_node_dgen_style = {
        'width': '70px',
        'height': '60px',
        'background-opacity': 0,
        'shape': 'rectangle',
        'label': function(ele) {
            const name = ele.data('name');
            return name ? name.replace(/\\n/, '\n') : '';
        },
        'text-valign': 'top',
    }

    const m_cytoscape_styles = cytoscape.stylesheet()
        .selector('edge').style(m_edge_style)
        .selector('edge:selected').style(m_edge_select_style)
        .selector('edge.no-power').style(m_edge_no_power_style)
        .selector('edge.eh-preview').style(m_edge_preview_edge_style)
        .selector('node').style(m_node_style)
        .selector('node:selected').style(m_node_select_style)
        .selector('node.no-power').style(m_node_no_power_style)
        .selector('node.default').style(m_node_default_style)
        .selector('node.default:selected').style(m_node_default_select_style)
        .selector('node.d-kepco').style(m_node_dkepco_style)
        .selector('node.d-sv').style(m_node_dsv_style)
        .selector('node.d-sv-t').style(m_node_dsv_t_style)
        .selector('node.d-tr').style(m_node_dtr_style)
        .selector('node.d-lv').style(m_node_dlv_style)
        .selector('node.d-acb').style(m_node_dacb_style)
        .selector('edge.d-acb').style(m_edge_dacb_style)
        .selector('node.d-ats').style(m_node_dats_style)
        .selector('node.d-gen-start-a, node.d-gen-start-b, node.d-gen-start-c, node.d-gen-start-d, node.d-gen-start-e, node.d-gen-start-f, node.d-gen-start-g').style(m_node_dgen_s_style)
        .selector('edge.d-gen-start-a, edge.d-gen-start-b, edge.d-gen-start-c, edge.d-gen-start-d, edge.d-gen-start-e, edge.d-gen-start-f, edge.d-gen-start-g').style(m_edge_dgen_s_style)
        .selector('node.d-text').style(m_node_dtext_style)
        .selector('node.d-text-l').style(m_node_dtext_l_style)
        .selector('node.d-gen').style(m_node_dgen_style);
    
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

    const m_cytoscape_edge_menu = {
        menuRadius: 50,
        selector: 'edge',
        commands: [{
            content: '삭제',
            contentStyle: { 'font-size': '0.8em' },
            select: function(edge) {
                const node = m_cytoscape.getElementById(edge.data('source'));
                options.onDeleteEdge(node, edge);
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

    const m_cytoscape_edge_config = {
        hoverDelay: 150,
        snap: true,
        snapThreshold: 25,
        snapFrequency: 15,
        noEdgeEventsInDraw: true,
        disableBrowserGestures: true
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
            avoidOverlap: true,
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
            query: 'node.d-kepco',
            tpl: function() {
                const html =
                '<div>' +
                    '<div class="i-power-node i-power-kepco"></div>' +
                '</div>';
                
                return html;
            }
        }, {
            query: 'node.d-sv, node.d-sv-t',
            tpl: function(data) {
                const { lvl } = data;

                const html =
                '<div class="i-power-sv">' +
                    '<div class="i-power-node i-icon lvl-' + lvl + '"></div>' +
                '</div>';
                
                return html;
            }
        }, {
            query: 'node.d-sv.no-power, node.d-sv-t.no-power',
            tpl: function(data) {
                const { lvl } = data;

                const html =
                '<div class="i-power-sv">' +
                    '<div class="i-power-node i-icon no-power lvl-' + lvl + '"></div>' +
                '</div>';
                
                return html;
            }
        }, {
            query: 'node.d-acb',
            tpl: function() {
                const html =
                '<div class="i-power-acb">' +
                    '<div class="i-power-node i-icon"></div>' +
                '</div>';
                
                return html;
            }
        }, {
            query: 'node.d-tr',
            tpl: function(data) {
                const { lvl } = data;

                const html =
                '<div class="i-power-tr">' +
                    '<div class="i-power-node i-icon lvl-' + lvl + '"></div>' +
                '</div>';
                
                return html;
            }
        }, {
            query: 'node.d-tr.no-power',
            tpl: function(data) {
                const { lvl } = data;

                const html =
                '<div class="i-power-tr">' +
                    '<div class="i-power-node i-icon no-power lvl-' + lvl + '"></div>' +
                '</div>';
                
                return html;
            }
        }, {
            query: 'node.d-acb.no-power',
            tpl: function() {
                const html =
                '<div class="i-power-acb">' +
                    '<div class="i-power-node i-icon no-power"></div>' +
                '</div>';
                
                return html;
            }
        }, {
            query: 'node.d-ats',
            tpl: function(data) {
                const { lvl } = data;

                const html =
                '<div class="i-power-ats">' +
                    '<div class="i-power-node i-icon lvl-' + lvl + '"></div>' +
                '</div>';
                
                return html;
            }
        }, {
            query: 'node.d-gen-start-a, node.d-gen-start-b, node.d-gen-start-c, node.d-gen-start-d, node.d-gen-start-e, node.d-gen-start-f, node.d-gen-start-g',
            tpl: function(data) {
                const { type } = data; 
                const mark = type.charAt(type.length - 1);

                const html =
                '<div class="i-power-gen-start">' +
                    '<div class="i-power-node i-icon ' + mark + '"></div>' +
                '</div>';
                
                return html;
            }
        }, {
            query: 'node.d-gen',
            tpl: function() {
                const html =
                '<div class="i-power-gen">' +
                    '<div class="i-power-node i-icon"></div>' +
                '</div>';
                
                return html;
            }
        }, {
            query: 'node.d-lv',
            tpl: function(data) {
                const { lvl } = data;

                const html =
                '<div class="i-power-lv">' +
                    '<div class="i-power-node i-icon lvl-' + lvl + '"></div>' +
                '</div>';
                
                return html;
            }
        }, {
            query: 'node.d-lv.no-power',
            tpl: function(data) {
                const { lvl } = data;

                const html =
                '<div class="i-power-lv">' +
                    '<div class="i-power-node i-icon no-power lvl-' + lvl + '"></div>' +
                '</div>';
                
                return html;
            }
        }]);
    }

    function createCytoscapeEvent() {
        m_cytoscape.on('ehcomplete', function(event, sourceNode, targetNode, addedEdge) {
            if(typeof options.onSetEdge === 'function') options.onSetEdge(sourceNode, targetNode);
        });

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

        m_cytoscape.on('select', 'node.d-sv, node.d-sv-t, node.d-lv', function(e) {
            const selected = getSelectedItems();
            
            if(selected.length === 1) {
                options.onShowDetailPanel(e.target);
            }
        });

        m_cytoscape.on('unselect', 'node.d-sv, node.d-sv-t, node.d-lv', function(e) {
            options.onHideDetailPanel(e.target);
        });

        m_cytoscape.on('select', 'node.d-tr', function(e) {
            const selected = getSelectedItems();

            if(selected.length === 1) {
                options.onShowTempPanel(e.target);
            }
        });

        m_cytoscape.on('unselect', 'node.d-tr', function(e) {
            options.onHideTempPanel(e.target);
        });

        m_cytoscape.on('tapend', 'node', function(e) {
            options.onTouchEnd(e);
        });

        m_cytoscape.on('add', 'edge.d-kepco', function(e) {
            if(e.target.group() === 'edges') {
                e.target.toggleClass('no-power', e.target.target().data('breaker') === 0);
            }
        });

        m_cytoscape.on('add', 'edge.d-sv, edge.d-sv-t, edge.d-lv, edge.d-acb', function(e) {
            if(e.target.group() === 'edges') {
                e.target.toggleClass('no-power', e.target.source().data('breaker') === 0);
            }
        });

        m_cytoscape.on('add', 'edge.d-tr', function(e) {
            if(e.target.group() === 'edges') {
                e.target.toggleClass('no-power', e.target.source().hasClass('no-power'));
            }
        });

        m_cytoscape.on('add', 'node.d-tr', function(e) {
            // by shkoh 20231005: TR 노드는 전기흐름에 대한 판단을 하지 못하는 상태임으로 TR을 추가할 때, 해당 아이템에 전기가 흐르는지 미리 체크하여 반영시켜놓음
            const edge = getEdgeByTargetId(e.target.id());
            const source_breaker = edge.source().data('breaker');

            e.target.toggleClass('no-power', source_breaker === 0);
            e.target.data('breaker', source_breaker);
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
            m_cytoscape.cxtmenu(m_cytoscape_edge_menu);
        }
    }

    function createEdgeHandler() {
        m_edge_handler = m_cytoscape.edgehandles(m_cytoscape_edge_config);
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
            const { index, type, obj_id, name, bUse, level, pos_x, pos_y, icon, edge_targets } = item;

            const data = {
                id: index,
                edges: edge_targets.length > 0 ? edge_targets.split(',') : [],
                name: name,
                pos_x: pos_x.toFixed(3),
                pos_y: pos_y.toFixed(3),
                type,
                breaker: 1,
                lvl: level,
                obj_id
            }

            if(type === 'd-acb' && index % 4 !== 1) {
                data.breaker = 0;
            }

            switch(type) {
                case 'd-sv':
                case 'd-sv-t':
                case 'd-lv': {
                    const { equip_name, update_dt, r, s, t, rs, st, tr, hz, pf, w, wh, mode, vcb, ocr, ocr_level, r_unit, s_unit, t_unit, rs_unit, st_unit, tr_unit, hz_unit, pf_unit, w_unit, wh_unit } = item;
                    Object.assign(data, {
                        equip_name, update_dt, r, s, t, rs, st, tr, hz, pf, w, wh, mode, vcb, ocr, ocr_level, r_unit, s_unit, t_unit, rs_unit, st_unit, tr_unit, hz_unit, pf_unit, w_unit, wh_unit,
                        breaker: ['정상', '운전', 'ON'].includes(vcb) ? 1 : 0
                    });
                    break;
                }
                case 'd-tr': {
                    const { sensor_name, value, unit, update_dt } = item;
                    Object.assign(data, {
                        sensor_name, value, unit, update_dt
                    });
                    break;
                }
            }

            parse_items.push({
                group: 'nodes',
                classes: type + (data.breaker === 1 ? '' : ' no-power'),
                data: data,
                renderedPosition: {
                    x: pos_x.toFixed(3) * $('#cytoscape').width(),
                    y: pos_y.toFixed(3) * $('#cytoscape').height()
                }
            });

            if(data.edges.length > 0) {
                for(const e of data.edges) {
                    parse_items.push({
                        group: 'edges',
                        // classes: type + (type === 'd-tr' ? 'no-power' : ''),
                        classes: type + ' no-power',
                        data: {
                            source: index.toString(),
                            target: e.toString()
                        }
                    });
                }
            }
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

    function getEdgeBySourceId(source_id) {
        return m_cytoscape.edges('[source="' + source_id.toString() + '"]');
    }

    function getEdgeByTargetId(target_id) {
        return m_cytoscape.edges('[target="' + target_id.toString() + '"]');
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

    function enabledEdgeHandling() {
        m_edge_handler.enableDrawMode();
    }

    function disabledEdgeHandling() {
        m_edge_handler.disableDrawMode();
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
            createEdgeHandler();
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
        EnabledEdgeHandling: function() {
            enabledEdgeHandling();
        },
        DisabledEdgeHandling: function() {
            disabledEdgeHandling();
        },
        GetEdgeByTargetId: function(target_id) { return getEdgeByTargetId(target_id); },
        GetNodeById: function(id) { return getNodeById(id); }
    }
}