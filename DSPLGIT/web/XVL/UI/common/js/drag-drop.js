/**
 * https://q-az.net/elements-drag-and-drop/
 */
(function() {
	var elements = document.getElementsByClassName('drag-drop');

	var x;
	var y;
	var width;
	var height;

	var parentX;
	var parentY;
	var parentWidth;
	var parentHeight;
	
	var pageX;
	var pageY;
	
    function touchMove(e) {
        e.preventDefault();
    }	

	for (var i = 0; i < elements.length; i++) {
		elements[i].addEventListener('mousedown', mdown, false);
		elements[i].addEventListener('touchstart', mdown, false);
		elements[i].addEventListener('touchmove', touchMove, false);
	}

	function mdown(event) {
		if (event.type === 'mousedown') {
			pageX = event.pageX;
			pageY = event.pageY;
			x      = event.offsetX;
			y      = event.offsetY;
		} else {
			pageX = event.changedTouches[0].pageX;
			pageY = event.changedTouches[0].pageY;
			x      = event.layerX;
			y      = event.layerY;			
		}

		var div  = this.parentNode;
		var rect = div.getBoundingClientRect();

		width  = rect.width
		height = rect.height;

		var clientRect = div.parentNode.getBoundingClientRect();
		parentX      = clientRect.left + window.pageXOffset;
		parentY      = clientRect.top  + window.pageYOffset;
		parentWidth  = clientRect.width;
		parentHeight = clientRect.height;
		
		var parent = document.getElementById(this.id.replace('_header', ''));
		document.body.addEventListener('mousemove', mmove, false);
		document.body.addEventListener('touchmove', mmove, false);

		parent.classList.add('drag');
		parent.addEventListener('mouseup', mup, false);
		parent.addEventListener('touchend', mup, false);
		document.body.addEventListener('mouseleave', mup, false);
		document.body.addEventListener('touchleave', mup, false);
	}

	function mmove(e) {
		var str = '';		
        var drag = document.getElementsByClassName("drag")[0];
        var event = {};

        if(e.type === "mousemove") {
            event = e;
        } else {
            event = e.changedTouches[0];
        }

        e.preventDefault();
        
		if (event.pageX == pageX && event.pageY == pageY) {
			return false;
		}		
		
		var currentX;
		var currentY;
		
		if(e.type === "mousemove") {
			currentX = event.pageX - x - parentX;
			currentY = event.pageY - y - parentY;
		} else {
			currentX = event.pageX - x - parentX;
			currentY = event.pageY - y - parentY;			
		}
		
		if (currentY < 0 || currentY > parentHeight - height) {
			return false;
		}
		if (currentX < 0 || currentX > parentWidth  - width) {
			return false;
		}

		drag.style.left = currentX + 'px';
		drag.style.top  = currentY + 'px';
	}

	function mup(e) {
		var drag = document.getElementsByClassName('drag')[0];
		if (null != drag) {
			document.body.removeEventListener('mousemove', mmove, false);
			drag.removeEventListener('mouseup', mup, false);
			document.body.removeEventListener('touchmove', mmove, false);
			drag.removeEventListener('touchend', mup, false);
			x = 0;
			drag.classList.remove('drag');
		}
	}
})()