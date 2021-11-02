var pinch = function (obj) {
  //配置信息====================
  var eleImg = obj.eleImg;
  var autoTransformOrigin = obj.autoTransformOrigin ? obj.autoTransformOrigin : false;
  var maxScale = obj.maxScale && parseInt(obj.maxScale) && obj.maxScale > 1 ? obj.maxScale : 3;
  var doubleTapAutoTransformOrigin = obj.doubleTapAutoTransformOrigin ? obj.doubleTapAutoTransformOrigin : false;
  var doubleTapScale = obj.doubleTapScale && parseInt(obj.doubleTapScale) && obj.doubleTapScale > 1 ? obj.doubleTapScale : 1.5;
  var container = obj.container;
  if (!(container && container instanceof HTMLElement)) {
    throw Error("container为必选项,且为htmlElement")
  }
  //临时变量=====================
  var store = {
    scale: 1,
    left: null,
    top: null
  };
  var preTime = 0;
  var doubleClick = false;
  var touchStartEvent = {};
  //功能函数======================
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


  var sum = function (a, b) {
    return a + b;
  };
  /*
     * 获取中点 
     */
  var getMidpoint = function (vectors) {
    return [
      vectors.map(function (v) { return v.x; }).reduce(sum) / vectors.length,
      vectors.map(function (v) { return v.y; }).reduce(sum) / vectors.length
    ];
  };
  /**
   * 获取触碰点 相对容器的位置集合
   * @param {*} event 
   * @param {*} container 
   * @returns 
   */
  var getTouches = function (event, container) {
    var rect = container.getBoundingClientRect();
    var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    var scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
    var posTop = rect.top + scrollTop;
    var posLeft = rect.left + scrollLeft;

    return Array.prototype.slice.call(event.touches).map(function (touch) {
      return {
        x: touch.pageX - posLeft,
        y: touch.pageY - posTop,
      };
    });
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
  * 可视大小（缩放后）
  * @param {*} el 
  * @param {*} attr 
  * @returns 
  */
  var getElementViewSize = function (el, attr) {
    if (["width", "height"].indexOf(attr) == -1) {
      throw new Error("getElementClientSize 第二个参数必须为width或height")
    }
    console.log("getElementClientPos(el)[attr]", getElementClientPos(el)[attr])
    return getElementClientPos(el)[attr];
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
  /**
   * 对元素设置缩放
   * @param {} newScale 
   */
  var setScale = function (newScale) {
    eleImg.style.transform = 'scale(' + newScale + ')';
    eleImg.setAttribute("data-scale", newScale)
  }
  /**
   * 设置缩放中心点
   * @param {*} x 
   * @param {*} y 
   */
  var setScaleOrigin = function (x, y) {
    // 两个手指头 相对body可视区域坐标的中心点
    eleImg.style.transformOrigin = x + " " + y;

  }
  /**
   * 双击缩放
   */
  var dobleClickScale = function () {
    eleImg.style.transformOrigin = "center center";
    store.scale = store.scale >= doubleTapScale ? 1 : doubleTapScale;

    if (doubleTapAutoTransformOrigin) {
      //两个手指头 相对body可视区域坐标的中心点
      var midPointArray = getMidpoint(getTouches(touchStartEvent, container));
      setScaleOrigin(midPointArray[0] + "px", midPointArray[1] + "px");
    }
    else {
      setScaleOrigin("center", "center");
    }
    setScale(store.scale);

  }

  // 缩放事件的处理
  eleImg.addEventListener('touchstart', function (event) {

    var touches = event.touches;
    var events = touches[0];
    var events2 = touches[1];
    var timeDis = new Date().getTime() - preTime;
    if (!events2 && timeDis > 0 && timeDis <= 200) {
      doubleClick = true;
    }
    else {
      doubleClick = false;
    }
    touchStartEvent = event;
    preTime = new Date().getTime();
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
      if (newScale > maxScale) {
        newScale = maxScale;
      }
      else if (newScale < 1) {
        newScale = 1;
      }
      // 记住使用的缩放值
      store.scale = newScale;
      if (autoTransformOrigin) {
        //两个手指头 相对body可视区域坐标的中心点
        var midPointArray = getMidpoint(getTouches(event, container));
        setScaleOrigin(midPointArray[0] + "px", midPointArray[1] + "px");
      }
      else {
        setScaleOrigin("center", "center");
      }
      setScale(newScale);
    }
  });

  document.addEventListener('touchend', function () {
    store.moveable = false;
    //双击，缩放
    doubleClick && dobleClickScale();
    delete store.clientX2;
    delete store.clientY2;
  });
  document.addEventListener('touchcancel', function () {
    store.moveable = false;

    delete store.clientX2;
    delete store.clientY2;
  });
}


