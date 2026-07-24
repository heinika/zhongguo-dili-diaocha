#!/usr/bin/env python3
"""Build the categorized README gallery and lightweight thumbnails."""

from __future__ import annotations

import html
import re
import subprocess
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import quote

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
THUMBNAIL_ROOT = ROOT / "docs" / "thumbnails"
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
THUMBNAIL_SIZE = (240, 360)

COLLECTION_ORDER = {
    "全国省份手绘地图": 0,
    "省市成套补充图集": 1,
    "早期成套系列": 2,
    "历史备份": 3,
    "其他生成图片": 4,
}

PROVINCE_ORDER = [
    "北京市",
    "天津市",
    "河北省",
    "河北",
    "山西省",
    "内蒙古自治区",
    "内蒙古",
    "辽宁省",
    "吉林省",
    "黑龙江省",
    "上海市",
    "江苏省",
    "浙江省",
    "安徽省",
    "福建省",
    "江西省",
    "山东省",
    "河南省",
    "河南",
    "湖北省",
    "湖南省",
    "广东省",
    "广西壮族自治区",
    "海南省",
    "重庆市",
    "四川省",
    "贵州省",
    "云南省",
    "西藏自治区",
    "陕西省",
    "甘肃省",
    "青海省",
    "宁夏回族自治区",
    "新疆维吾尔自治区",
    "香港特别行政区",
    "澳门特别行政区",
    "台湾省",
]
PROVINCE_RANK = {name: index for index, name in enumerate(PROVINCE_ORDER)}

PROVINCE_ALIASES = {
    "内蒙古": "内蒙古自治区",
    "河北": "河北省",
    "河南": "河南省",
}

# These choices were visually reviewed for outline, water-system, label, and
# landmark placement quality. Keeping explicit paths makes future rebuilds
# stable even when older versions remain in the repository.
PREFERRED_PATHS = {
    Path("provinces/内蒙古/00_内蒙古自治区总览.png"),
    Path("provinces/河北/00_河北省总览.png"),
    Path("provinces/河南/00_河南省总览.png"),
    Path("全国省份手绘地图/北京市/images/01-北京市总图-v5-评价修正版.png"),
    Path("全国省份手绘地图/北京市/images/04-朝阳区-v5.png"),
    Path("全国省份手绘地图/北京市/images/10-通州区-v3-温潮减河修正版.png"),
    Path("全国省份手绘地图/上海市/等距微缩城市/images/00_上海市总览_等距微缩城市.png"),
    Path("全国省份手绘地图/江苏省/images/01-江苏省总图-v2.png"),
    Path("全国省份手绘地图/湖南省/images/01-湖南省总图.png"),
    Path("全国省份手绘地图/甘肃省/handdrawn/00_甘肃省总览.png"),
    Path("全国省份手绘地图/西藏自治区/images/02_西藏自治区_标签修正版.png"),
    Path("全国省份手绘地图/广西壮族自治区/images/01-广西壮族自治区总图.png"),
    Path("重庆37区县复古手绘地图/重庆37区县复古手绘地图/00_重庆市总览.png"),
    Path("陕西省/00_陕西省总览.png"),
}

# This file is byte-identical to the Xishuangbanna image and visibly depicts
# tropical rainforest, Dai architecture, elephants, and the Lancang River.
EXCLUDED_PATHS = {
    Path("全国省份手绘地图/黑龙江省/images/02-大兴安岭地区.png"),
}


def tracked_images() -> list[Path]:
    try:
        output = subprocess.check_output(
            ["git", "ls-files", "-z"],
            cwd=ROOT,
            stderr=subprocess.DEVNULL,
        ).decode("utf-8")
        candidates = (Path(item) for item in output.split("\0") if item)
    except (OSError, subprocess.CalledProcessError):
        # Windows Python cannot resolve a WSL-format worktree gitdir. A clean
        # worktree contains the same source files, so filesystem discovery is
        # a reliable fallback for local regeneration.
        candidates = (
            path.relative_to(ROOT)
            for path in ROOT.rglob("*")
            if path.is_file()
        )

    paths = []
    for path in candidates:
        if path.parts[:2] == ("docs", "thumbnails"):
            continue
        if path.suffix.lower() in IMAGE_EXTENSIONS:
            paths.append(path)
    return sorted(paths, key=lambda path: path.as_posix())


def thumbnail_path(source: Path) -> Path:
    return Path("docs") / "thumbnails" / source.with_suffix(".webp")


def make_thumbnail(source: Path) -> tuple[Path, str | None]:
    target = thumbnail_path(source)
    absolute_source = ROOT / source
    absolute_target = ROOT / target
    absolute_target.parent.mkdir(parents=True, exist_ok=True)
    try:
        with Image.open(absolute_source) as opened:
            image = ImageOps.exif_transpose(opened)
            image.seek(0)
            image.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
            if image.mode in {"RGBA", "LA"} or (
                image.mode == "P" and "transparency" in image.info
            ):
                rgba = image.convert("RGBA")
                flattened = Image.new("RGB", rgba.size, "white")
                flattened.paste(rgba, mask=rgba.getchannel("A"))
                image = flattened
            else:
                image = image.convert("RGB")
            image.save(absolute_target, "WEBP", quality=78, method=6)
    except Exception as exc:  # pragma: no cover - command-line reporting
        return source, str(exc)
    return source, None


def classify(path: Path) -> tuple[str, str, str]:
    parts = path.parts
    if parts[0] == "provinces" and len(parts) >= 3:
        return "早期成套系列", PROVINCE_ALIASES.get(parts[1], parts[1]), "成套图集"

    if parts[0] in {"广西壮族自治区", "陕西省"}:
        return "省市成套补充图集", parts[0], "成套图集"

    if parts[0] == "重庆37区县复古手绘地图":
        return "省市成套补充图集", "重庆市", "37区县成套图集"

    if parts[0] == "全国省份手绘地图" and len(parts) >= 3:
        folder = parts[1]
        if folder.startswith("_backup_") and len(parts) >= 4:
            return "历史备份", parts[2], "未按计划顺序备份"
        if folder == "福建手绘地图生成图":
            return "全国省份手绘地图", "福建省", "生成图归档"

        province = folder
        if len(parts) >= 4:
            series_folder = parts[2]
            series_names = {
                "images": "主图集",
                "handdrawn": "手绘成套图集",
            }
            series = series_names.get(series_folder, series_folder)
        else:
            series = "图集"
        return "全国省份手绘地图", province, series

    return "其他生成图片", parts[0], "其他"


def province_short_name(province: str) -> str:
    for suffix in ("特别行政区", "壮族自治区", "回族自治区", "维吾尔自治区", "自治区", "省", "市"):
        if province.endswith(suffix):
            return province[: -len(suffix)]
    return province


def subject_key(path: Path, province: str) -> str:
    stem = re.sub(r"^\d+[-_]", "", path.stem)
    stem = re.sub(r"[-_]等距微缩城市$", "", stem)
    short_name = province_short_name(province)
    if (
        "总图" in stem
        or "总览" in stem
        or (
            short_name in stem
            and any(marker in stem for marker in ("初版", "标签修正版"))
        )
    ):
        return "__省级总览__"

    return re.sub(
        (
            r"[-_](?:v\d+.*|未标注备份.*|旧版备份.*|未含.*|"
            r"评价修正版.*|标签修正版.*|修正版.*|初版.*)$"
        ),
        "",
        stem,
        flags=re.IGNORECASE,
    )


def selection_score(path: Path) -> int:
    if path in PREFERRED_PATHS:
        return 10_000

    text = path.as_posix()
    score = 0
    if "/images/" in text:
        score += 200
    if "/等距微缩城市/" in text:
        score -= 150
    if text.startswith("provinces/"):
        score += 150
    if "/handdrawn/" in text:
        score += 180
    if "福建手绘地图生成图/" in text:
        score -= 100
    if "_backup_" in text or "备份" in path.stem:
        score -= 500
    if "手绘地图海报_9张/" in text:
        score -= 300
    if "初版" in path.stem:
        score -= 100
    if "评价修正版" in path.stem:
        score += 700
    elif "标签修正版" in path.stem:
        score += 650
    elif "修正版" in path.stem:
        score += 600

    version = re.search(r"(?:^|-)v(\d+)", path.stem, flags=re.IGNORECASE)
    if version:
        score += int(version.group(1)) * 50
    return score


def select_visible_images(images: list[Path]) -> tuple[list[Path], list[Path]]:
    grouped: dict[tuple[str, str], list[Path]] = defaultdict(list)
    hidden = []
    for image in images:
        if image in EXCLUDED_PATHS:
            hidden.append(image)
            continue
        _, province, _ = classify(image)
        grouped[(province, subject_key(image, province))].append(image)

    selected = []
    for candidates in grouped.values():
        winner = max(
            candidates,
            key=lambda path: (selection_score(path), path.as_posix()),
        )
        selected.append(winner)
        hidden.extend(path for path in candidates if path != winner)
    return (
        sorted(selected, key=lambda path: path.as_posix()),
        sorted(hidden, key=lambda path: path.as_posix()),
    )


def province_sort_key(name: str) -> tuple[int, str]:
    return PROVINCE_RANK.get(name, len(PROVINCE_RANK)), name


def url(path: Path) -> str:
    return quote(path.as_posix(), safe="/")


def image_table(paths: list[Path]) -> list[str]:
    lines = ["<table>"]
    for offset in range(0, len(paths), 4):
        lines.append("  <tr>")
        for source in paths[offset : offset + 4]:
            target = thumbnail_path(source)
            label = html.escape(source.stem)
            original_url = url(source)
            thumbnail_url = url(target)
            original_title = html.escape(source.as_posix(), quote=True)
            lines.extend(
                [
                    '    <td width="25%" align="center">',
                    f'      <a href="{original_url}" title="{original_title}">',
                    (
                        f'        <img src="{thumbnail_url}" width="180" '
                        f'alt="{label}" loading="lazy">'
                    ),
                    f"        <br><sub>{label}</sub>",
                    "      </a>",
                    "    </td>",
                ]
            )
        lines.append("  </tr>")
    lines.append("</table>")
    return lines


def build_readme(
    images: list[Path],
    source_count: int,
    hidden_count: int,
) -> str:
    grouped: dict[str, dict[str, dict[str, list[Path]]]] = defaultdict(
        lambda: defaultdict(lambda: defaultdict(list))
    )
    for image in images:
        collection, province, series = classify(image)
        grouped[collection][province][series].append(image)

    lines = [
        "# 中国地理调查",
        "",
        "中国地理调查：省份手绘地理图与文旅地图资料项目。",
        "",
        "## 图片总览",
        "",
        (
            f"仓库共有 **{source_count} 张已生成图片**，当前 README 精选展示"
            f" **{len(images)} 张**；同一省份、城市或地区只保留一个最佳版本。"
            "所有画面均使用轻量缩略图，点击后可打开仓库中的 PNG、JPEG、"
            "WebP 或 GIF 原图。"
        ),
        "",
        (
            f"> 已隐藏 {hidden_count} 个旧版、备份、镜像重复或内容误归类入口；"
            "原始文件仍完整保留。本画廊由 `tools/build_readme_gallery.py` "
            "根据已审核选择规则自动生成。"
        ),
        "",
        "## 分类导航",
        "",
        "| 分类 | 省份或系列数 | 图片数 |",
        "| --- | ---: | ---: |",
    ]

    for collection in sorted(
        grouped,
        key=lambda item: (COLLECTION_ORDER.get(item, 99), item),
    ):
        province_groups = grouped[collection]
        count = sum(
            len(paths)
            for series in province_groups.values()
            for paths in series.values()
        )
        lines.append(f"| [{collection}](#{quote(collection)}) | {len(province_groups)} | {count} |")

    lines.extend(
        [
            "",
            "## 项目内容",
            "",
            "| 目录 | 内容 |",
            "| --- | --- |",
            "| `全国省份手绘地图/` | 各省级行政区总览图、地级行政区分图与归档系列 |",
            "| `provinces/` | 内蒙古、河北、河南等早期成套手绘地图 |",
            "| `copywriting/` | 小红书发布配文 |",
            "| `docs/` | 生成流程、说明文档与 README 缩略图 |",
            "",
        ]
    )

    for collection in sorted(
        grouped,
        key=lambda item: (COLLECTION_ORDER.get(item, 99), item),
    ):
        lines.extend([f"## {collection}", ""])
        for province in sorted(grouped[collection], key=province_sort_key):
            series_groups = grouped[collection][province]
            province_count = sum(len(paths) for paths in series_groups.values())
            lines.extend(
                [
                    "<details>",
                    (
                        f"<summary><strong>{html.escape(province)}</strong>"
                        f" · {province_count} 张</summary>"
                    ),
                    "",
                ]
            )
            for series in sorted(series_groups):
                series_images = sorted(
                    series_groups[series],
                    key=lambda path: path.as_posix(),
                )
                lines.extend(
                    [
                        (
                            f"<h4>{html.escape(series)}"
                            f" · {len(series_images)} 张</h4>"
                        ),
                        "",
                        *image_table(series_images),
                        "",
                    ]
                )
            lines.extend(["</details>", ""])

    lines.extend(
        [
            "## 说明",
            "",
            "- 缩略图仅用于 README 快速浏览，原图保持原始分辨率和文件格式。",
            "- 同一地理主题只展示一张：修正版和评价版优先，正式主图优先于备份与镜像归档。",
            "- 隐藏仅影响 README 和缩略图目录，不删除任何原始生成图片。",
            "- 部分 ZIP 压缩包使用 Git LFS 管理，不计入图片总数。",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> None:
    source_images = tracked_images()
    if not source_images:
        raise SystemExit("No tracked images found.")
    images, hidden_images = select_visible_images(source_images)

    with ThreadPoolExecutor(max_workers=6) as executor:
        results = list(executor.map(make_thumbnail, images))
    failures = [(path, error) for path, error in results if error]
    if failures:
        for path, error in failures:
            print(f"FAILED {path}: {error}")
        raise SystemExit(f"{len(failures)} thumbnail(s) failed.")

    expected = {thumbnail_path(source) for source in images}
    if THUMBNAIL_ROOT.exists():
        for existing in THUMBNAIL_ROOT.rglob("*.webp"):
            relative = existing.relative_to(ROOT)
            if relative not in expected:
                existing.unlink()

    (ROOT / "README.md").write_text(
        build_readme(
            images,
            source_count=len(source_images),
            hidden_count=len(hidden_images),
        ),
        encoding="utf-8",
    )
    print(
        f"Selected {len(images)} of {len(source_images)} images; "
        f"hid {len(hidden_images)} duplicate or inaccurate entries."
    )


if __name__ == "__main__":
    main()
