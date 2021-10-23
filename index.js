
var pinch = function (obj) {
  var eleImg = obj.eleImg;
  var autoTransformOrigin = obj.autoTransformOrigin ? obj.autoTransformOrigin : false;
  var store = {
    scale: 1,
    left: null,
    top: null
  };

  // 获取坐标之间的举例
  // var getDistance = function (start, stop) {
  //   return Math.hypot(stop.x - start.x, stop.y - start.y);
  // };
  //这里代码和上面的代码等同
  var getDistance = function (p1, p2) {
    var x = p2.x - p1.x,
      y = p2.y - p1.y;
    return Math.sqrt((x * x) + (y * y));
  };
  /*
   * 获取中点 
   */
  var getMidpoint = function (p1, p2) {
    var x = (p1.clientX + p2.clientX) / 2,
      y = (p1.clientY + p2.clientY) / 2;
    return [x, y];
  }
  /**
   * 获取节点距离可视区边界的位置,和可视大小（缩放后的大小）
   * @param {*} el 
   * @returns 
   */
  var getElementClientPos = function (el) {
    return el.getBoundingClientRect();
  }
  /**
   * 获取节点设置的大小
   * @param {*} el 
   * @param {*} attr 
   * @returns 
   */
  var getElementDefaultSize = function (el, attr) {
    if (["width", "height"].indexOf(attr) == -1) {
      throw new Error("getElementDefaultSize 第二个参数必须为width或height")
    }
    console.log("window.getComputedStyle(el)[attr]", window.getComputedStyle(el)[attr])
    return window.getComputedStyle(el)[attr];
  }
  /**
  * 可视大小（缩放后）
  * @param {*} el 
  * @param {*} attr 
  * @returns 
  */
  var getElementClientSize = function (el, attr) {
    if (["width", "height"].indexOf(attr) == -1) {
      throw new Error("getElementClientSize 第二个参数必须为width或height")
    }
    console.log("getElementClientPos(el)[attr]", getElementClientPos(el)[attr])
    return getElementClientPos(el)[attr];
  }
  /**
   * 获取图片缩放大小
   * @param {*} el 
   * @returns 
   */
  var getScaleSize = function (el) {
    var t = (getElementClientSize(el, "width") * 1000) / (getElementDefaultSize(el, "width") * 1000);
    return parseFloat(t.toFixed(5));
  }
  /**
   * 得到图片的缩放中心点
   * @param {*} el 
   * @param {*} centerClientPosArray 
   * @returns 
   */
  var getElementScaleCenterPos = function (el, centerClientPosArray) {
    var elPosLeft = getElementClientPos(el).left;
    var elPosTop = getElementClientPos(el).top;
    return [centerClientPosArray[0] - elPosLeft, centerClientPosArray[1] - elPosTop]
  }
  /**
   * 注意不要对太多父节点的节点做这个计算，否则很费性能
   * @param {*} el 
   * @returns 
   */
  var getOffsetPos = function (el) {
    var pos = {
      left: el.offsetLeft,
      top: el.offsetTop
    };
    var currElement = el.parentElement;
    var index = 0;
    while (currElement !== null) {
      pos.left += currElement.offsetLeft;
      pos.top += currElement.offsetTop;
      currElement = currElement.parentElement;
      index++;
    }
    if (index > 1000) {
      console.warn("getOffsetPos 函数不建议对父级数超过1000的节点使用")
    }
    return pos;
  }
  // 缩放事件的处理
  eleImg.addEventListener('touchstart', function (event) {
    var touches = event.touches;
    var events = touches[0];
    var events2 = touches[1];

    event.preventDefault();

    // 第一个触摸点的坐标
    store.clientX = events.clientX;
    store.clientY = events.clientY;

    //计算dom的距离body可视区域的左边和右边的距离
    var offsetInfoObj = getOffsetPos(eleImg);
    eleImg.setAttribute("data-left", offsetInfoObj.left)
    eleImg.setAttribute("data-top", offsetInfoObj.top)
    store.left = offsetInfoObj.left;
    store.top = offsetInfoObj.top;

    store.moveable = true;

    if (events2) {
      store.clientX2 = events2.clientX;
      store.clientY2 = events2.clientY;
    }

    store.originScale = store.scale || 1;
  });
  document.addEventListener('touchmove', function (event) {
    if (!store.moveable) {
      return;
    }

    event.preventDefault();

    var touches = event.touches;
    var events = touches[0];
    var events2 = touches[1];
    // 双指移动
    if (events2) {
      // 第2个指头坐标在touchmove时候获取
      if (!store.clientX2) {
        store.clientX2 = events2.clientX;
      }
      if (!store.clientY2) {
        store.clientY2 = events2.clientY;
      }


      // 双指缩放比例计算
      var zoom = getDistance({
        x: events.clientX,
        y: events.clientY
      }, {
        x: events2.clientX,
        y: events2.clientY
      }) /
        getDistance({
          x: store.clientX,
          y: store.clientY
        }, {
          x: store.clientX2,
          y: store.clientY2
        });
      // 应用在元素上的缩放比例
      var newScale = store.originScale * zoom;
      // 最大缩放比例限制
      if (newScale > 3) {
        newScale = 3;
      }
      else if (newScale < 1) {
        newScale = 1;
      }
      // 记住使用的缩放值
      store.scale = newScale;
      if (autoTransformOrigin) {
        // 两个手指头 相对body可视区域坐标的中心点
        var midPointArray = getMidpoint(events, events2);
        //屏幕两指中心点转【图片中心点】
        var transformOrigin = [Math.abs(midPointArray[0] - store.left), Math.abs(midPointArray[1] - store.top)];
        eleImg.style.transformOrigin = transformOrigin[0] + "px " + transformOrigin[1] + "px";
        //document.querySelector("#text") && (document.querySelector("#text").innerHTML = eleImg.style.transformOrigin);
      }

      eleImg.style.transform = 'scale(' + newScale + ')';


    }
  });

  document.addEventListener('touchend', function () {
    store.moveable = false;

    delete store.clientX2;
    delete store.clientY2;
  });
  document.addEventListener('touchcancel', function () {
    store.moveable = false;

    delete store.clientX2;
    delete store.clientY2;
  });
}


//使用=======================================
var el = document.querySelector('#image');
pinch({
  eleImg: el,
  autoTransformOrigin: true
});