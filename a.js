//使用=======================================
var el = document.querySelector('#image');
console.log(typeof el)
pinch({
  eleImg: el,
  container: document.querySelector(".container"),
  autoTransformOrigin: true,
  maxScale: 3,
  doubleTapAutoTransformOrigin: true
});