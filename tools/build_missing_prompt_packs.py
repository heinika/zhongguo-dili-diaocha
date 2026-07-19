from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "prompts" / "全国未生成省市区"


def safe_name(value: str) -> str:
    return re.sub(r"[\\/:*?\"<>|]", "_", value)


def prompt_block(item: dict) -> str:
    panels = "；".join(f"“{name}—{desc}”" for name, desc in item["panels"])
    labels = "、".join(f"“{name}”" for name, _ in item["panels"])
    return f"""## {item['province']}｜{item['name']}

```text
Use case: stylized-concept
Asset type: high-resolution illustrated regional travel-map poster
Primary request: Create one hand-drawn vintage illustrated travel-map poster for {item['name']}, {item['province']}. Match the established series: antique parchment background, thin ornate Chinese geometric border, large black brush-calligraphy title, raised administrative-region cutout, dense isometric bird's-eye terrain, fine sepia ink linework, watercolor washes and muted natural colors.
Resolution requirement: Generate a high-resolution portrait PNG at the highest available resolution or HD export quality. Preserve the original generated file; do not substitute a screenshot or low-resolution preview.
Text (verbatim): Large title “{item['name']}”. Subtitle “{item['subtitle']}”.
Map basis: {item['basis']}
Key landmark plaques, use only these six short labels: {labels}.
Bottom panels with exact text: {panels}. Draw exactly six equal-width framed scenic vignettes. Every vignette must contain its specified title and one short Chinese explanatory sentence, not an icon alone.
Composition: portrait poster; title area at top; the central map occupies about 68% of the page; bottom panels occupy about 22%; fine callout lines; a decorative compass rose; restrained cloud and corner motifs. Keep rivers, lakes, mountains, coastline, old city, new district, transport corridors and landmarks in their plausible relative positions.
Style/medium: museum-quality vintage Chinese atlas, hand-drawn pen-and-ink illustration with watercolor washes, weathered parchment texture, layered terrain and lively local ecology, architecture, agriculture and transport details.
Text constraints: Render only the specified title, subtitle, six map labels and six bottom-panel captions. Chinese must be short and legible. Do not invent extra words, pinyin or English labels.
Negative constraints: no watermark, no logo, no random or garbled text, no photorealism, no flat vector, no modern UI, no plastic or exaggerated 3D rendering.
```
"""


def main() -> None:
    data = []
    for data_path in sorted(OUT_DIR.glob("prompt_data_*.json")):
        data.extend(json.loads(data_path.read_text(encoding="utf-8")))
    if not data:
        raise ValueError("no prompt_data_*.json files found")
    groups: dict[str, list[dict]] = defaultdict(list)
    seen: set[tuple[str, str]] = set()
    normalized = []
    for raw in data:
        if isinstance(raw, list):
            group, province, name, subtitle, basis, panels = raw
            item = {
                "group": group,
                "province": province,
                "name": name,
                "subtitle": subtitle,
                "basis": basis,
                "panels": panels,
            }
        else:
            item = raw
        normalized.append(item)
        key = (item["province"], item["name"])
        if key in seen:
            raise ValueError(f"duplicate record: {key}")
        seen.add(key)
        if len(item["panels"]) != 6:
            raise ValueError(f"{key} must contain exactly six panels")
        groups[item["group"]].append(item)

    data = normalized

    generated = []
    for group, items in groups.items():
        title = f"# 全国尚未生成省市区手绘提示词｜{group}\n\n"
        intro = (
            "> 口径：仅收录盘点时既没有正式 PNG、也没有现成专属提示词的项目。"
            "每条提示词可单独复制用于高清生图；实际生图前仍应打开最新官方地图复核边界和道路、水系细节。\n\n"
        )
        body = "\n".join(prompt_block(item) for item in items)
        path = OUT_DIR / f"{safe_name(group)}.md"
        path.write_text(title + intro + body, encoding="utf-8", newline="\n")
        generated.append((path.name, len(items)))

    lines = [
        "# 全国尚未生成省市区手绘提示词索引",
        "",
        f"本目录新增完整提示词 **{len(data)} 条**，均为当前正式成果中尚无 PNG、且其他文档尚未覆盖的项目。",
        "",
        "## 新增提示词包",
        "",
    ]
    lines.extend(f"- [{name}]({name})：{count} 条" for name, count in generated)
    lines.extend(
        [
            "",
            "## 已有提示词但图片尚未生成",
            "",
            "- 上海市 16 区：见仓库根目录 `上海市16区手绘地图提示词.md`。",
            "- 湖北省 17 个市州及省直管地区：见仓库根目录 `湖北省手绘地图提示词.md`。",
            "",
            "## 已有省级总览",
            "",
            "34 个省级行政区总览均已有初版，所以本批不重复生成省级总览提示词。港澳台按当前项目约定只做区域总图，不向下拆分。",
            "",
            "## 使用说明",
            "",
            "1. 每次复制一个完整代码块进行生图，不要批量塞入同一轮生成。",
            "2. 生图前用最新官方行政区地图复核边界、主要水系、山脉、海岸和地标方位。",
            "3. 输出最高可用分辨率的原始 PNG，并按省份目录归档。",
            "4. 若中文小字不清，可只做文字修正版，不改动地理骨架和构图。",
            "",
        ]
    )
    (OUT_DIR / "README.md").write_text("\n".join(lines), encoding="utf-8", newline="\n")

    existing = {
        "上海市": [
            "浦东新区", "闵行区", "宝山区", "松江区", "嘉定区", "青浦区", "普陀区", "杨浦区",
            "奉贤区", "徐汇区", "静安区", "金山区", "长宁区", "虹口区", "崇明区", "黄浦区",
        ],
        "湖北省": [
            "武汉市", "黄冈市", "襄阳市", "荆州市", "孝感市", "宜昌市", "恩施土家族苗族自治州",
            "十堰市", "咸宁市", "荆门市", "黄石市", "随州市", "天门市", "仙桃市", "鄂州市",
            "潜江市", "神农架林区",
        ],
    }
    checklist = [
        "# 当前尚未生成图片的省市区总清单",
        "",
        f"合计 **{len(data) + sum(map(len, existing.values()))} 项**：新增完整提示词 {len(data)} 项，已有专属提示词 {sum(map(len, existing.values()))} 项。",
        "",
        "## 本目录新增完整提示词",
        "",
    ]
    by_province: dict[str, list[str]] = defaultdict(list)
    for item in data:
        by_province[item["province"]].append(item["name"])
    for province, names in by_province.items():
        checklist.append(f"- {province}（{len(names)}）：{'、'.join(names)}")
    checklist.extend(["", "## 已有提示词、尚无正式 PNG", ""])
    checklist.append(f"- 上海市（16）：{'、'.join(existing['上海市'])}。提示词见 `../../上海市16区手绘地图提示词.md`。")
    checklist.append(f"- 湖北省（17）：{'、'.join(existing['湖北省'])}。提示词见 `../../湖北省手绘地图提示词.md`。")
    checklist.extend(
        [
            "",
            "## 口径说明",
            "",
            "- 34 个省级总览已有初版，因此没有列入。",
            "- 地级行政区按本项目现行大陆口径核对；湖北另含 3 个省直管县级市和神农架林区。",
            "- 直辖市中，北京现有 16 区图片；重庆按项目采用的 2025 年调整后 37 区县口径已有图片；上海和天津区级缺口列入。",
            "- 港澳台按当前项目约定只做区域总图，暂不向下拆分。",
            "",
        ]
    )
    (OUT_DIR / "待生成总清单.md").write_text("\n".join(checklist), encoding="utf-8", newline="\n")

    manifest = {
        "new_prompt_count": len(data),
        "groups": {name: count for name, count in generated},
        "existing_prompt_only": {"上海市": 16, "湖北省": 17},
        "province_overviews_missing": 0,
    }
    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )


if __name__ == "__main__":
    main()
