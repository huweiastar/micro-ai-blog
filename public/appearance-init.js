// 在首帧前应用外观偏好（强调色/字体/圆角），避免切换闪烁。与 theme-init.js 同步执行。
(function () {
  try {
    var d = { accent: "violet", font: "sans", radius: "standard" };
    var raw = localStorage.getItem("appearance");
    var p = raw ? Object.assign({}, d, JSON.parse(raw)) : d;
    var el = document.documentElement;
    el.dataset.accent = p.accent;
    el.dataset.font = p.font;
    el.dataset.radius = p.radius;
  } catch (e) {
    /* 忽略：保持默认 */
  }
})();
