// 首访默认暗色（写入 localStorage 供 next-themes 接管）。
// 外置成静态文件而非内联 <script>，为后续收紧 CSP（去 'unsafe-inline'）做准备。
(function () {
  try {
    var stored = localStorage.getItem("theme");
    if (!stored) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  } catch (e) {}
})();
