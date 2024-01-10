const HeatMap = function(_id, _options) {
    const m_id = _id;

    let options = {
        min: 10,
        max: 26,
        normal: 18
    };
    options = _options;

    let m_heatmap_inst = undefined;
    /******************************************************************************************************************************************/
    /* by shkoh 20210511: heat map function start                                                                                             */
    /******************************************************************************************************************************************/
    function createHeatmap() {
        const image = document.getElementById(m_id);
        m_heatmap_inst = new temperature_map_gl(image, {
            canvas: null,
            p: 1.35,
            opacity: 0.6,
            gamma: 1.2,
            range_factor: 0.00390625,
            brightness: 0.001,
            show_points: false,
            framebuffer_factor: 2,
            point_text: function(val) {
                return val.toFixed(1) + '℃';
            }
        });

        const max_radius = Math.max($(window).width(), $(window).height());
        m_heatmap_inst.resize(max_radius, max_radius);
    }

    function setHeatmapData(items) {
        const temp_point = items.map(function(item) {
            // by shkoh 20210513: temperature-map-gl 라이브러리는 기본적으로 설정한 min, max 값과는 별도로 등록된 값들 중에서 max와 min을 찾음으로 우리가 지정할 범위를 넘지 않도록 값을 지정함
            let val = item.value;
            
            // if(val > options.max) val = options.max;
            // else if(val <= options.min) val = 0;

            return [
                parseFloat(item.pos_x) * parseFloat($(window).width()),
                parseFloat(item.pos_y) * parseFloat($(window).height()),
                val
            ];
        });
        
        // by shkoh 20210512: 온도분포도 외곽의 포인트를 강제로 그려넣음
        const point_number = 20;
        const position_interval = 5;
        const x_step = $(window).width() / point_number;
        const y_step = $(window).height() / point_number;

        let x = position_interval;
        let y = position_interval;
        
        for(let x_idx = 0; x_idx < point_number; x_idx++) {    
            for(let y_idx = 0; y_idx < point_number; y_idx++) {    
                if(x_idx === 0 || y_idx === 0) {
                    temp_point.push([x, y, 0]);
                } else if(x_idx === point_number - 1 && y_idx === point_number - 1) {
                    temp_point.push([$(window).width() - position_interval, $(window).height() - position_interval, 0]);
                } else if(x_idx === point_number - 1) {
                    temp_point.push([$(window).width() - position_interval, y, 0]);
                } else if(y_idx === point_number - 1) {
                    temp_point.push([x, $(window).height() - position_interval, 0]);
                }
                
                y += y_step;
            }

            x += x_step;
            y = position_interval;
        }
        
        m_heatmap_inst.set_points(temp_point, 0, options.max + 2, options.normal);
        m_heatmap_inst.draw();
    }

    function resizingHeatmap() {
        const max_radius = Math.max($(window).width(), $(window).height());
        m_heatmap_inst.resize(max_radius, max_radius);
    }

    function updateOption(new_opt) {
        m_heatmap_inst.update_options(new_opt);
    }
    /******************************************************************************************************************************************/
    /* by shkoh 20210511: heat map function end                                                                                               */
    /******************************************************************************************************************************************/

    return {
        Create: function() { createHeatmap(); },
        SetData: function(items) { setHeatmapData(items); },
        Resize: function() { resizingHeatmap(); },
        UpdateOption: function(new_opt) { updateOption(new_opt); }
    }
}