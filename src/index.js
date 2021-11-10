var pinch = function (obj) {
  //配置信息====================
  var eleImg = obj.eleImg;
  var autoTransformOrigin = obj.autoTransformOrigin ? obj.autoTransformOrigin : false;
  var maxScale = obj.maxScale && parseInt(obj.maxScale) && obj.maxScale > 1 ? obj.maxScale : 3;
  var doubleTapAutoTransformOrigin = obj.doubleTapAutoTransformOrigin ? obj.doubleTapAutoTransformOrigin : false;
  var doubleTapScale = obj.doubleTapScale && parseInt(obj.doubleTapScale) && obj.doubleTapScale > 1 ? obj.doubleTapScale : 1.5;
  var allowDrag = obj.allowDrag ? obj.allowDrag : false;
  var container = obj.container;
  if (!(container && container instanceof HTMLElement)) {
    throw Error("container为必选项,且为htmlElement")
  }
  //临时变量=====================
  var store = {
    scale: 1,
    translatex: 0,
    translatey: 0,
    preTranslatex: 0,
    preTranslatey: 0,
  };
  var preTime = 0;
  var doubleClick = false;
  var touchStartEvent = {};

  //功能函数======================
  /**
   * 初始化store
   */
  var initStore = function () {
    store = {
      scale: 1,
      translatex: 0,
      translatey: 0,
      preTranslatex: 0,
      preTranslatey: 0,
    };
  }
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
   * 获取容器先对整个body的位置
   * @param {*} touch 
   * @returns 
   */
  var getContainerRelativePos = function () {
    var rect = container.getBoundingClientRect();
    var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    var scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
    var posTop = rect.top + scrollTop;
    var posLeft = rect.left + scrollLeft;
    return {
      posLeft: posLeft,
      posTop: posTop
    }
  }
  /**
   * 获取触碰点 相对容器的位置集合
   * @param {*} event 
   * @param {*} container 
   * @returns 
   */
  var getTouches = function (event, container) {
    return Array.prototype.slice.call(event.touches).map(function (touch) {
      var touchesRelativePos = getContainerRelativePos(touch);
      return {
        x: touch.pageX - touchesRelativePos.posLeft,
        y: touch.pageY - touchesRelativePos.posTop,
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



  var setrTansform = function () {
    eleImg.style.transformOrigin = "0 0";
    eleImg.style.transform = 'translate(' + store.translatex + 'px,' + store.translatey + 'px) scale(' + store.scale + ') ';
    eleImg.setAttribute("data-translatex", store.translatex);
    eleImg.setAttribute("data-translatey", store.translatey);
    eleImg.setAttribute("data-scale", store.scale);

  }

  /**
   * 双击缩放
   */
  var dobleClickScale = function () {
    if (store.scale === 1) {
      //双击位置坐标相对容器的的坐标
      var dbclickPosRelativeContainer = getMidpoint(getTouches(touchStartEvent, container));
      store.preTranslatex = store.translatex = -dbclickPosRelativeContainer[0] * 0.5;//0.5是 1.5和1的差值
      store.preTranslatey = store.translatey = - dbclickPosRelativeContainer[1] * 0.5;

    }
    else {
      store.translatex = 0;
      store.translatey = 0;
      store.preTranslatex = 0;
      store.preTranslatey = 0;
    }
    store.scale = store.scale >= doubleTapScale ? 1 : doubleTapScale;
    setrTansform();

  }
  //拖拽功能
  var Drag = {
    maxLimit: function () {

    },
    initPreTranslate: function () {
      var preTranslatey = eleImg.getAttribute("data-translatey");
      var preTranslatex = eleImg.getAttribute("data-translatex");
      store.preTranslatey = preTranslatey ? preTranslatey : 0;
      store.preTranslatex = preTranslatex ? preTranslatex : 0;
    },
    updateTranslate: function (events) {
      var getClientRects = getElementClientPos(eleImg);//获取图片的视图宽
      var containerRect = container.getBoundingClientRect();//获取容器的视图宽高
      var leftMaxLimit = -Math.ceil(containerRect.left * store.scale);
      var topMaxLimit = -containerRect.top * store.scale;
      var touchStartTouchs = {
        x: touchStartEvent.touches[0].clientX,
        y: touchStartEvent.touches[0].clientY
      }

      var disX = touchStartTouchs.x - events.clientX;
      var disY = touchStartTouchs.y - events.clientY;

      store.translatex = store.preTranslatex - disX;
      store.translatey = store.preTranslatey - disY;


      if (disX < 0 && store.translatex >= leftMaxLimit) {
        store.translatex = leftMaxLimit;
      }
      // else if (disX > 0 && store.translatex < -(getClientRects.width - window.innerWidth)) {
      //   store.translatex = -(getClientRects.width - window.innerWidth);
      // }

      // // console.log("store.translatey", store.translatex, disX, "getClientRects.width", getClientRects.width)
      // if (getClientRects.height >= window.innerHeight) {
      //   if (disY < 0 && store.translatey >= topMaxLimit) {
      //     store.translatey = topMaxLimit;
      //   }
      //   else if (disY > 0 && store.translatey < -(getClientRects.height - window.innerHeight)) {
      //     store.translatey = -(getClientRects.height - window.innerHeight);;
      //   }
      // }
      setrTansform();
    }
  }

  setrTansform();
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


    //拖拽参数，更新
    allowDrag && Drag.initPreTranslate();

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
        initStore();
      }
      var dbclickPosRelativeContainer = getMidpoint(getTouches(event, container));
      var disScale = newScale - store.scale;
      store.translatex = store.preTranslatex - dbclickPosRelativeContainer[0] * disScale;
      store.translatey = store.preTranslatey - dbclickPosRelativeContainer[1] * disScale;
      document.querySelector("#text").innerHTML = `store.translatex ${store.translatex} store.translatey ${store.translatey} dbclickPosRelativeContainer[0]${dbclickPosRelativeContainer[0]} ==disScale${disScale}`;
      // 记住使用的缩放值
      store.scale = newScale;
      store.preTranslatex = store.translatex;
      store.preTranslatey = store.translatey;
      setrTansform();
    }
    else {
      //拖拽参数，更新
      allowDrag && store.scale > 1 && Drag.updateTranslate(events);
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


