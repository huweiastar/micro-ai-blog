# OG 字体（动态分享图用）

`NotoSansSC-Bold.subset.woff2` 供 `app/og/route.tsx` 用 `next/og`（Satori）渲染
品牌化 OG 分享图。它由系统自带的 Noto Sans CJK Bold 提取 SC 字面、子集化为
GB2312 全字符集（约 7800 字形，覆盖现代简体中文）后导出为 woff2，体积约 3.4MB。

## 重新生成

需要 `fonttools` + `brotli`（`pip install fonttools brotli`），系统装有
Noto Sans CJK（`/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc`，SC 为第 2 个字面）：

```python
import json
from fontTools.ttLib import TTFont
from fontTools.subset import Subsetter, Options

pts = set(range(0x20, 0x7F))
for hi in range(0xA1, 0xF8):
    for lo in range(0xA1, 0xFF):
        try:
            pts.add(ord(bytes([hi, lo]).decode("gb2312")))
        except Exception:
            pass
for a, b in [(0x2000, 0x206F), (0x3000, 0x303F), (0xFF00, 0xFFEF), (0x2010, 0x2027)]:
    pts.update(range(a, b + 1))

f = TTFont("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", fontNumber=2, lazy=True)
opts = Options(); opts.flavor = "woff2"; opts.drop_tables += ["DSIG"]
ss = Subsetter(options=opts); ss.populate(unicodes=sorted(pts)); ss.subset(f)
f.save("assets/fonts/NotoSansSC-Bold.subset.woff2")
```

字体版权归 Google / Adobe（Noto CJK，SIL Open Font License 1.1）。
