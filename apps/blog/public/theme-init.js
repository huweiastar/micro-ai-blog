// 首屏主题判定（在 next-themes 接管前同步执行，避免闪白/闪暗）。
// 品牌默认暗色，但首访时若系统明确偏好亮色（prefers-color-scheme: light）则尊重之。
// 外置成静态文件而非内联 <script>，为后续收紧 CSP（去 'unsafe-inline'）做准备。
(function () {
  try {
    var stored = localStorage.getItem("theme");
    if (!stored) {
      var prefersLight =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: light)").matches;
      stored = prefersLight ? "light" : "dark";
      localStorage.setItem("theme", stored);
    }
    if (stored === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch (e) {}
})();
