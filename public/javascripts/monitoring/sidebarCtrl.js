/**
 * 사이드바 컨트롤 클래스
 * 
 * @param {JSON} options
 *      pathA_id: '',
 *      pathB_id: '',
 *      pathC_id: '',
 *      wrapper_id: '',
 *      trigger_id: '',
 *      sidebar_id: '',
 *      slider_id: ''
 */

const SideBarCtrl = function(_options) {
    let options = {
        pathA_id: '',
        pathB_id: '',
        pathC_id: '',
        wrapper_id: '',
        trigger_id: '',
        sidebar_id: '',
        slider_id: ''
    };

    // by shkoh 20180515: SideBarCtrl 생성 시 _options 값을 넣음
    options = _options;

    let beginAC = 80, endAC = 320, beginB = 80, endB = 320;
    let toCloseIcon = true;

    let pathA_id = options.pathA_id;
    let pathB_id = options.pathB_id;
    let pathC_id = options.pathC_id;
    let wrapper_id = options.wrapper_id;
    let trigger_id = options.trigger_id;
    let sidebar_id = options.sidebar_id;
    let slider_id = options.slider_id;

    function inAC(s) {
        s.draw('80% - 240', '80%', 0.3, {
	        delay: 0.1,
	        callback: function() { inAC2(s) }
	    });
    }

    function inAC2(s) {
	    s.draw('100% - 545', '100% - 305', 0.6, {
	        easing: ease.ease('elastic-out', 1, 0.3)
	    });
    }
    
    function inB(s) {
	    s.draw(beginB - 60, endB + 60, 0.1, {
	        callback: function() { inB2(s) }
	    });
    }
    
    function inB2(s) {
	    s.draw(beginB + 120, endB - 120, 0.3, {
	        easing: ease.ease('bounce-out', 1, 0.3)
	    });
    }
    
    /* Out animations (to burger icon) */
	function outAC(s) {
	    s.draw('90% - 240', '90%', 0.1, {
	        easing: ease.ease('elastic-in', 1, 0.3),
	        callback: function() { outAC2(s) }
	    });
    }
    
    function outAC2(s) {
	    s.draw('20% - 240', '20%', 0.3, {
	        callback: function() { outAC3(s) }
	    });
	}

	function outAC3(s) {
	    s.draw(beginAC, endAC, 0.7, {
	        easing: ease.ease('elastic-out', 1, 0.3)
	    });
	}

	function outB(s) {
	    s.draw(beginB, endB, 0.7, {
	        delay: 0.1,
	        easing: ease.ease('elastic-out', 2, 0.4)
	    });
    }
    
    /* Scale functions */
	function addScale(m) {
		m.className = 'menu-icon-wrapper scaled';
	}

	function removeScale(m) {
		m.className = 'menu-icon-wrapper';
    }

    /**
     * 설정한 사이드 바 항목을 나타나게 함
     */
    function open_panel() {
        slideIt();
        
        var sidebarDiv = document.getElementById(sidebar_id);
        sidebarDiv.setAttribute("id", "sidebarOpen");
    }
    
    /**
     * 설정한 사이드 바 항목을 집어넣음
     */
    function close_panel() {
        slideIn();
        
        var sidebarDiv = document.getElementById("sidebarOpen");
        sidebarDiv.setAttribute("id", sidebar_id);
    }

    function slideIt() {
        var slidingDiv = document.getElementById(slider_id);
        var stopPosition = 0;
        if(parseInt(slidingDiv.style.right) < stopPosition) {
            slidingDiv.style.right = parseInt(slidingDiv.style.right) + 5 + "px";
            setTimeout(slideIt, 1);
        }
    }
    
    function slideIn() {
        var slidingDiv = document.getElementById(slider_id);
        var stopPosition = -100;
        if(parseInt(slidingDiv.style.right) > stopPosition) {
            slidingDiv.style.right = parseInt(slidingDiv.style.right) - 5 + "px";
            setTimeout(slideIn, 1);
        }
    }
    
    function create() {
        const pathA = document.getElementById(pathA_id);
        const pathB = document.getElementById(pathB_id);
        const pathC = document.getElementById(pathC_id);

        let segmentA = new Segment(pathA, beginAC, endAC);
        let segmentB = new Segment(pathB, beginB, endB);
        let segmentC = new Segment(pathC, beginAC, endAC);

        let wrapper = document.getElementById(wrapper_id);
        let trigger = document.getElementById(trigger_id);

        wrapper.style.visibility = 'visible';
        trigger.onclick = function() {
            addScale(wrapper);
            if(toCloseIcon) {
                inAC(segmentA);
                inB(segmentB);
                inAC(segmentC);

                open_panel();
            } else {
                outAC(segmentA);
                outB(segmentB);
                outAC(segmentC);

                close_panel();
            }

            toCloseIcon = !toCloseIcon;

            setTimeout(function() { removeScale(wrapper); }, 450);
        }
    }

    return {
        Create: function() { create(); }
    }
}