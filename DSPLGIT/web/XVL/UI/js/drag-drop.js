(function(){

    var elements = document.getElementsByClassName("drag-drop");

    var x;
    var y;

    for(var i = 0; i < elements.length; i++) {
        elements[i].addEventListener("mousedown", mdown, false);
        elements[i].addEventListener("touchstart", mdown, false);
    }

    function mdown(e) {

        this.classList.add("drag");

        if(e.type === "mousedown") {
            var event = e;
        } else {
            var event = e.changedTouches[0];
        }

        x = event.pageX - this.offsetLeft;
        y = event.pageY - this.offsetTop;
        var drag = this;
        document.body.addEventListener("mousemove", mmove, false);
        document.body.addEventListener("touchmove", mmove, false);

        drag.addEventListener("mouseup", mup, false);
        document.body.addEventListener("mouseleave", mup, false);
        drag.addEventListener("touchend", mup, false);
        document.body.addEventListener("touchleave", mup, false);
    }

    function mmove(e) {

        var drag = document.getElementsByClassName("drag")[0];

        if(e.type === "mousemove") {
            var event = e;
        } else {
            var event = e.changedTouches[0];
        }

        e.preventDefault();

        drag.style.top = event.pageY - y + "px";
        drag.style.left = event.pageX - x + "px";
    }

    function mup(e) {
        var drag = document.getElementsByClassName("drag")[0];

        if (null != drag) {
            document.body.removeEventListener("mousemove", mmove, false);
            drag.removeEventListener("mouseup", mup, false);
            document.body.removeEventListener("touchmove", mmove, false);
            drag.removeEventListener("touchend", mup, false);

            drag.classList.remove("drag");
        }
    }

})()