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
        onMoveMonitoring: undefined,
        navigator: undefined,
        onDblClickRack: undefined
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
        'font-size': '1.2em',
        'padding': '0.2em'
    };

    const m_node_select_style = {
        'background-opacity': 0.4,
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

    const m_node_rack_style = {
        'width': function(ele) {
            const w = ele.data('width');
            return w ? w : '32px'
        },
        'height': function(ele) {
            const h = ele.data('height');
            return h ? h : '32px'
        },
        'shape': 'rectangle',
        'border-width': '1px',
        'border-style': 'solid',
        'border-color': '#000000',
        'border-opacity': 1,
        'background-fill': 'radial-gradient',
        'background-gradient-stop-colors': function(ele) {
            let color = '#ffffff';
            let color2 = '#888888';
            let val = parseFloat(ele.data('t_val'));
            
            if(isNaN(val)) {
                color = '#222222';
            } else {
                const period = (options.navigator.max - options.navigator.min) / 4;

                const max = options.navigator.max + period;
                const min = options.navigator.min - period;

                if(val > max) val = 0;
                else if(val < min) val = 240;
                else {
                    val = parseFloat((max - val) * 240 / (max - min));
                }
                
                color = hslToHex(val, 100, 50);
                color2 = hslToHex(val, 100, 45);
            }

            return [ color, color2 ];
        },
        'background-gradient-stop-positions': [ '0%', '50%' ],
        'background-opacity': 0.95
    }

    const m_node_rack_select_style = {
        'border-style': 'dashed',
        'background-opacity': 0.8,
        'background-blacken': 0.1,
        'border-opacity': 0.9
    }

    const m_node_rack_hidden_style = {
        'display': 'none'
    }

    const m_node_rack_icon_style = {
        'width': function() {
            const bk_w = $('#cytoscape').width();
            const w = parseFloat(bk_w * 0.03854166);
            return w.toFixed(0) + 'px';
        },
        'height': function() {
            const bk_h = $('#cytoscape').height();
            const h = parseFloat(bk_h * 0.1444444444444);
            return h.toFixed(0) + 'px';
        },
        'shape': 'roundrectangle',
        'background-color': 'transparent',
        'background-opacity': 0.0
    }

    const m_node_rack_icon_select_style = {
        'background-color': '#ffffff',
        'background-opacity': 0.9,
        'padding': '8rem'
    }

    const m_cytoscape_styles = cytoscape.stylesheet()
        .selector('node').style(m_node_style)
        .selector('node:selected').style(m_node_select_style)
        .selector('node.default').style(m_node_default_style)
        .selector('node.default:selected').style(m_node_default_select_style)
        .selector('node.rack, node.rack-TT, node.rack-TM, node.rack-TB').style(m_node_rack_style)
        .selector('node.rack.hidden, node.rack-TT.hidden, node.rack-TM.hidden, node.rack-TB.hidden').style(m_node_rack_hidden_style)
        .selector('node.rack:selected, node.rack-TT:selected, node.rack-TM:selected, node.rack-TB:selected').style(m_node_rack_select_style)
        .selector('node.rackT, node.rackM, node.rackB').style(m_node_rack_icon_style)
        .selector('node.rackT:selected, node.rackM:selected, node.rackB:selected').style(m_node_rack_icon_select_style)

    //by MJ 2023.09.18 : 마우스 우측 메뉴
    const m_cytoscape_default_menu = {
        menuRadius: 50,
        //by MJ 2023.09.18 : m_tree_data = type
        selector: 'node, node.default, node.rack, node.rack-TT, node.rack-TM, node.rack-TB, node.rackT, node.rackM, node.rackB',
        commands: [{
            content: '설정',
            contentStyle: { 'font-size': '0.8em' },
            select: function(ele) {
                options.onSet(ele);
                inactiveNodes();
            }
        }, {
            content: '복제',
            contentStyle: { 'font-size': '0.8em' },
            select: function(ele) {
                options.onDuplicate(ele);
                inactiveNodes();
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
        zIndex: 99999,
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
            //상자 선택 기능을 활성화합니다. options.isIcomer가 true일 경우에만 활성화
            boxSelectionEnabled: options.isIcomer === true,
            //노드와 엣지의 위치 및 스타일을 자동으로 잠금 설정
            autolock: options.isIcomer !== true,
            //그래프의 초기 레이아웃을 지정
            layout: m_cytoscape_layout,
            style: m_cytoscape_styles
        });
    }

    function createNodeHtmlLabel() {
        m_cytoscape.nodeHtmlLabel([{
            //by MJ 2023.09.14 : `query`는 Cytoscape에서 그래프 요소를 선택하거나 대상으로 하는 방법을 지정하는 데 사용되는 속성으로, CSS 선택자와 비슷한 방식으로 동작
            query: '.rackT, .rackM, .rackB',
            //by MJ 2023.09.14 : 렌더링시 html 레이블 템플릿인 'tpl'함수에 적용
            tpl: function(data) {
                const name = data.name === '' ? data.equip_name === null ? '' : data.equip_name : data.name;

                const t_val = data.t_val;
                const t_lvl = data.t_lvl ? data.t_lvl : 0;
                const a_val = data.a_val;
                const b_val = data.b_val;

                const html =
                // by MJ 2023.09.13 : id랑 type으로  구분.
                '<div id="i-rack-' + data.id + '" data-type="' + data.type + '">' +
                    '<div class="i-rack-item">' +
                    '<div class="i-rack-item-name">' + name + '</div>' +
                        // by MJ 2023.09.19 : rack 평균 온도값 위치 변수 지정 (i-rack-item-temp +  lvl-2  + type)
                        (t_val ? '<div class="i-rack-item-temp lvl-' + t_lvl + ' ' + data.type + '">' + t_val + '</div>' : '') +
                        (a_val !== null && b_val !== null ?
                        '<div class="i-rack-item-pdu">' +
                            '<div class="i-rack-item-pud-line">' +
                                (a_val ? '<span class="i-rack-item-pdu-key">A</span><span class="i-rack-item-pdu-value">' + data.a_val + '</span>' : '') +
                            '</div>' +
                            '<div class="i-rack-item-pud-line">' +
                                (b_val ? '<span class="i-rack-item-pdu-key">B</span><span class="i-rack-item-pdu-value">' + data.b_val + '</span>' : '') +
                            '</div>' +
                        '</div>'
                        : '') +
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
            //by MJ 2023.08.29 : rack 클릭시 값이 들어옴
            if($.session.get('user-grade') === 'USR00') $(window).trigger('focus');
        });

        m_cytoscape.on('unselect', 'node', function(e) {
            //by MJ 2023.08.29 : rack 해제시 값이 들어옴
            if($.session.get('user-grade') === 'USR00') $(window).trigger('focusout');
        });

        m_cytoscape.on('add', 'node.rack, node.rack-TT, node.rack-TM, node.rack-TB', function(e) {     
            if($.session.get('user-grade') !== 'USR00') {
                e.target.qtip({
                    content: {
                        text: nodeText(e.target)
                    },
                    show: {
                        event: 'select'
                    },
                    hide: {
                        event: 'unselect remove',
                        cyViewport: false
                    },
                    style: {
                        classes: 'qtip-wiki qtip-light qtip-shadow qtip-tipsy',
                        def: false
                    },
                    position: {
                        container: $('#qtip-container'),
                        adjust: {
                            y: 0,
                            cyViewport: true
                        }
                    }
                });
            }       
        });

        m_cytoscape.on('data', 'node.rack, node.rack-TT, node.rack-TM, node.rack-TB', function(e) {
            // by shkoh 20220105: qtip은 cytoscape의 scratch(cytoscape의 element에서 기능확장을 위해서 사용)에 정의가 되어 있어야 함
            if($.session.get('user-grade') !== 'USR00') {
                if(e.target.scratch().qtip !== undefined) {
                    const qtip_api = e.target.qtip('api');
                    
                    if(qtip_api) {                    
                        qtip_api.set('content.text', nodeText(e.target));
                    }
                }
            }
        });

        m_cytoscape.on('data', 'node.rackT, node.rackM, node.rackB', function(e) {
            if(e.target) {
                // by shkoh 20230609: rack의 배치의 경우 아이템의 순서가 중요할 수 있음으로 z_index를 설정해준다
                const id = e.target.data('id');
                const p_ele = document.getElementById('i-rack-' + id).parentElement;
                const z_index = e.target.data('z_index');
                p_ele.style.zIndex = z_index;
            }
        });

        m_cytoscape.on('tapend', 'node', function(e) {
            options.onTouchEnd(e);
        });
        
        m_cytoscape.on('click', 'node.rack, node.rack-TT, node.rack-TM, node.rack-TB, node.rackT, node.rackM, node.rackB', function(evt) {
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
        
        // by MJ 2023.08.31 : 자산 더블 클릭시 팝업창 (이벤트명, 타겟, 실행함수)
        m_cytoscape.on('doubleclick', 'node.rack, node.rack-TT, node.rack-TM, node.rack-TB, node.rackT, node.rackM, node.rackB', options.onDblClickRack);

        $(window).on('keydown', function(e) {
            if($.session.get('user-grade') === 'USR00') {
                let _val = 1;

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

    //by MJ 2023.08.29 : 마우스 오른쪽 클릭시 설정 메뉴
    function createContextMenu() {        
        const grade = $.session.get('user-grade');
        if(grade === 'USR00') {
            m_cytoscape.cxtmenu(m_cytoscape_default_menu);
        }
    }
    /***********************************************************************************************************************************/
    /* by shkoh 20211229: cytoscape define function end                                                                                */
    /***********************************************************************************************************************************/

    /***********************************************************************************************************************************/
    /* by shkoh 20211229: cytoscape inline function start                                                                              */
    /***********************************************************************************************************************************/
    function parseCytoscapeItems(items, checker) {
        const parse_items = [];

        items.forEach(function(item) {
            // by shkoh 20231027: 랙 모니터링의 경우에 숨김 기능이 필요함
            let hidden = '';

            let data = {
                // by shkoh 20230518: diagram 기본정보
                id: item.index,
                type: item.type,
                level: item.bUse === 'N' ? 6 : item.level,
                pos_x: item.pos_x.toFixed(3),
                pos_y: item.pos_y.toFixed(3),
                bUse: item.bUse,
                // by shkoh 20230518: 아래부터는 node의 특징에 따라서 존재할 수도 있고 없을 수도 있다
                icon: item.icon
            }

            switch(item.type) {
                case 'rack':
                case 'rack-TT':
                case 'rack-TM':
                case 'rack-TB': {
                    Object.assign(data, {
                        equip_id: item.equip_id,
                        name: item.name,
                        equip_name: item.equip_name,
                        p_name: item.p_name,
                        width: item.width,
                        height: item.height,
                        a_val: item.a_val,
                        b_val: item.b_val,
                        t_lvl: item.t_lvl,
                        t_val: item.t_val
                    });

                    hidden = item.type !== 'rack' && checker && Array.isArray(checker) && checker.includes(item.type) ? '' : ' hidden';
                    break;
                }
                case 'rackT':
                case 'rackM':
                case 'rackB': {
                    Object.assign(data, {
                        equip_id: item.equip_id,
                        name: item.name,
                        equip_name: item.equip_name,
                        p_name: item.p_name,
                        width: item.width,
                        height: item.height,
                        a_val: item.a_val,
                        b_val: item.b_val,
                        t_lvl: item.t_lvl,
                        t_val: item.t_val,
                        z_index: item.z_index
                    });
                    break;
                }
            }

            parse_items.push({
                group: 'nodes',
                classes: item.type + hidden,
                renderedPosition: {
                    x: item.pos_x.toFixed(3) * $('#cytoscape').width(),
                    y: item.pos_y.toFixed(3) * $('#cytoscape').height()
                },
                data: data
            });
        });

        return parse_items;
    }
    
    function redrawItems(items, selected_items, checker) {
        if(m_cytoscape === undefined) return;

        const parsed_items = parseCytoscapeItems(items, checker);
        m_cytoscape.add(parsed_items);

        // by shkoh 20200924: 기존에 이미 선택된 노드가 존재했다면, 해당 노드를 다시 동일하게 선택함
        selected_items.forEach(function(item) {
            m_cytoscape.nodes('#' + item.id()).select();
            m_cytoscape.nodes('#' + item.id()).trigger('select');
        });
    }

    function updateItems(items, selected_items, checker) {
        if(m_cytoscape === undefined) return;

        const new_items = parseCytoscapeItems(items, checker);
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

    function inactiveNodes() {
        m_cytoscape.nodes(':active').unactivate();
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

        // by MJ 2023.08. 22 : vertical, horizontal 버튼 부분
        if(direction === 'vertical' || direction === 'horizontal') {
            const is_vertical = direction === 'vertical';
            // by MJ 2023.08.18 : 해당 축 값 기준으로 재정렬
            const result = selected_nodes.sort((a, b) => 
            is_vertical ? a.data('pos_y') - b.data('pos_y') : a.data('pos_x') - b.data('pos_x')
            );
            
            result.forEach((node, index) => {
                const gap = is_vertical ? (max_y - min_y) / (result.length - 1) : (max_x - min_x) / (result.length - 1);
                const new_pos = is_vertical ? min_y + gap * index : min_x + gap * index;
                // by MJ 2023.08.25 : 위치 메모리 저장용
                node.data(is_vertical ? 'pos_y' : 'pos_x', (new_pos / (is_vertical ? $('#cytoscape').height() : $('#cytoscape').width())).toFixed(2));
                // by MJ 2023.08.16 : 축 위치 설정
                node.renderedPosition(is_vertical ? 'y' : 'x', new_pos);
            });
        }else{
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
                }
            });
        }
    }

    function unselectedAllItems() {
        m_cytoscape.elements(':selected').unselect();
    }

    function selectItem(id) {
        m_cytoscape.$('node[obj_id = "' + id + '"]').select();
    }

    function showItems(type) {
        m_cytoscape.elements('.' + type + ':hidden').toggleClass('hidden', false);
    }

    function hiddenItems(type) {
        m_cytoscape.elements('.' + type + ':visible').toggleClass('hidden', true);
    }

    function nodeText(node) {
        const name = node.data('name');
        const equip_name = node.data('equip_name');
        const t_val = node.data('t_val');

        let text = name ? name : equip_name;
        let val = t_val ? t_val : '온도 미설정';
        return text ? (text + ': ' + val) : '미설정';
    }

    function hslToHex(h, s, l) {
        s /= 100;
        l /= 100;

        let c = (1 - Math.abs(2 * l - 1)) * s;
        let x = c * (1 - Math.abs((h / 60) % 2 - 1));
        let m = l - c / 2;
        let r = 0, g = 0, b = 0;

        if(0 <= h && h < 60) {
            r = c; g = x; b = 0;
        } else if(60 <= h && h < 120) {
            r = x; g = c; b = 0;
        } else if(120 <= h && h < 180) {
            r = 0; g = c; b = x;
        } else if(180 <= h && h < 240) {
            r = 0; g = x; b = c;
        } else if(240 <= h && h < 300) {
            r = x; g = 0; b = c;
        } else if(300 <= h && h < 360) {
            r = c; g = 0; b = x;
        }

        r = Math.round((r + m) * 255).toString(16);
        g = Math.round((g + m) * 255).toString(16);
        b = Math.round((b + m) * 255).toString(16);

        if(r.length === 1) r = '0' + r;
        if(g.length === 1) g = '0' + g;
        if(b.length === 1) b = '0' + b;

        return '#' + r + g + b;
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
        Redraw: function(items, checker) {
            const old_items = getAllItems();
            const selected_items = getSelectedItems();
            
            if(items.length != old_items.length) {
                clearItems();
                redrawItems(items, selected_items, checker);
            } else {
                updateItems(items, selected_items, checker);
            }

            inactiveNodes();
        },
        Resize: function() { resize(); },
        GetAllItems: function() { return getAllItems(); },
        GetSelectedItem: function() { return getSelectedItems(); },
        RepositionNodes: function(items) { repositionNodes(items); },
        Align: function(direction) { return alignItem(direction); },
        SelectItemBySensorId: function(s_id) {
            unselectedAllItems();
            selectItem(s_id);
        },
        ShowItems: function(type) {
            showItems(type);
        },
        HiddenItems: function(type) {
            hiddenItems(type);
        }
    }
}