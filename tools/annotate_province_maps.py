from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
FONT_TITLE = Path(r"C:\Windows\Fonts\simhei.ttf")
FONT_BODY = Path(r"C:\Windows\Fonts\NotoSerifSC-VF.ttf")


def font(path, size):
    return ImageFont.truetype(str(path), size)


TITLE_FONT = font(FONT_TITLE, 28)
BODY_FONT = font(FONT_BODY, 18)


def scale_point(point, size):
    x, y = point
    w, h = size
    return int(x * w), int(y * h)


def draw_label(draw, size, label):
    text = label["text"]
    anchor = scale_point(label["point"], size)
    box_xy = scale_point(label["box"], size)
    lines = text.split("\n")

    padding_x, padding_y = 14, 10
    widths = [draw.textbbox((0, 0), line, font=TITLE_FONT if i == 0 else BODY_FONT)[2] for i, line in enumerate(lines)]
    heights = [draw.textbbox((0, 0), line, font=TITLE_FONT if i == 0 else BODY_FONT)[3] for i, line in enumerate(lines)]
    box_w = max(widths) + padding_x * 2
    box_h = sum(heights) + padding_y * 2 + (len(lines) - 1) * 6
    x, y = box_xy

    fill = (238, 218, 176, 232)
    outline = (107, 75, 38, 255)
    ink = (70, 48, 25, 255)
    line = (95, 72, 47, 255)

    draw.rounded_rectangle((x, y, x + box_w, y + box_h), radius=7, fill=fill, outline=outline, width=2)
    ty = y + padding_y
    for i, row in enumerate(lines):
        draw.text((x + padding_x, ty), row, font=TITLE_FONT if i == 0 else BODY_FONT, fill=ink)
        ty += heights[i] + 6

    ax, ay = anchor
    cx = x if ax < x else x + box_w if ax > x + box_w else x + box_w // 2
    cy = y + box_h // 2
    draw.line((cx, cy, ax, ay), fill=line, width=2)
    r = 7
    draw.ellipse((ax - r, ay - r, ax + r, ay + r), fill=(248, 242, 222, 245), outline=outline, width=2)
    draw.ellipse((ax - 3, ay - 3, ax + 3, ay + 3), fill=outline)


ANNOTATIONS = {
    "台湾省": [
        {"text": "台北市\n省会城市", "point": (0.650, 0.255), "box": (0.735, 0.230)},
        {"text": "台中市\n中部平原", "point": (0.460, 0.455), "box": (0.190, 0.420)},
        {"text": "台南市\n古城海岸", "point": (0.370, 0.635), "box": (0.135, 0.610)},
        {"text": "高雄市\n南部港湾", "point": (0.360, 0.705), "box": (0.125, 0.720)},
        {"text": "花莲县\n太鲁阁东岸", "point": (0.675, 0.560), "box": (0.735, 0.555)},
        {"text": "台东县\n纵谷海岸", "point": (0.585, 0.700), "box": (0.700, 0.720)},
        {"text": "澎湖县\n海峡群岛", "point": (0.280, 0.450), "box": (0.080, 0.500)},
    ],
    "澳门特别行政区": [
        {"text": "澳门半岛\n历史城区", "point": (0.430, 0.365), "box": (0.125, 0.315)},
        {"text": "氹仔\n旧城与海湾", "point": (0.505, 0.520), "box": (0.690, 0.485)},
        {"text": "路氹城\n新城轴线", "point": (0.535, 0.610), "box": (0.705, 0.625)},
        {"text": "路环\n山海村落", "point": (0.550, 0.725), "box": (0.180, 0.735)},
    ],
    "香港特别行政区": [
        {"text": "香港岛\n维港南岸", "point": (0.530, 0.575), "box": (0.700, 0.535)},
        {"text": "九龙\n维港北岸", "point": (0.520, 0.510), "box": (0.205, 0.470)},
        {"text": "新界\n山海村镇", "point": (0.500, 0.375), "box": (0.160, 0.315)},
        {"text": "大屿山\n离岛门户", "point": (0.360, 0.665), "box": (0.120, 0.665)},
    ],
    "云南省": [
        {"text": "昆明市\n省会滇池", "point": (0.575, 0.485), "box": (0.735, 0.455)},
        {"text": "大理州\n洱海苍山", "point": (0.455, 0.470), "box": (0.170, 0.420)},
        {"text": "丽江市\n雪山古城", "point": (0.420, 0.360), "box": (0.150, 0.305)},
        {"text": "西双版纳州\n热带雨林", "point": (0.610, 0.805), "box": (0.675, 0.785)},
        {"text": "红河州\n梯田南境", "point": (0.570, 0.655), "box": (0.705, 0.640)},
    ],
    "贵州省": [
        {"text": "贵阳市\n省会高原", "point": (0.535, 0.500), "box": (0.705, 0.470)},
        {"text": "遵义市\n黔北山城", "point": (0.495, 0.360), "box": (0.190, 0.315)},
        {"text": "安顺市\n黄果树瀑布", "point": (0.405, 0.550), "box": (0.135, 0.565)},
        {"text": "黔东南州\n苗侗村寨", "point": (0.655, 0.625), "box": (0.695, 0.650)},
        {"text": "铜仁市\n梵净山", "point": (0.660, 0.345), "box": (0.700, 0.325)},
    ],
    "西藏自治区": [
        {"text": "拉萨市\n雪域古城", "point": (0.560, 0.545), "box": (0.705, 0.520)},
        {"text": "日喀则市\n珠峰北麓", "point": (0.420, 0.625), "box": (0.140, 0.600)},
        {"text": "林芝市\n峡谷森林", "point": (0.730, 0.645), "box": (0.735, 0.680)},
        {"text": "那曲市\n高原草原", "point": (0.540, 0.365), "box": (0.705, 0.345)},
        {"text": "阿里地区\n冈仁波齐", "point": (0.245, 0.525), "box": (0.090, 0.455)},
    ],
    "陕西省": [
        {"text": "西安市\n省会长安", "point": (0.520, 0.555), "box": (0.700, 0.525)},
        {"text": "咸阳市\n渭水古都", "point": (0.470, 0.520), "box": (0.165, 0.480)},
        {"text": "延安市\n陕北高原", "point": (0.505, 0.335), "box": (0.150, 0.300)},
        {"text": "榆林市\n长城沙地", "point": (0.540, 0.205), "box": (0.690, 0.210)},
        {"text": "汉中市\n秦巴盆地", "point": (0.440, 0.760), "box": (0.150, 0.755)},
    ],
    "青海省": [
        {"text": "西宁市\n省会河谷", "point": (0.610, 0.425), "box": (0.720, 0.400)},
        {"text": "青海湖\n高原大湖", "point": (0.470, 0.425), "box": (0.160, 0.385)},
        {"text": "海西州\n柴达木盆地", "point": (0.345, 0.560), "box": (0.115, 0.565)},
        {"text": "玉树州\n三江源头", "point": (0.570, 0.720), "box": (0.710, 0.720)},
        {"text": "海东市\n河湟谷地", "point": (0.670, 0.445), "box": (0.725, 0.490)},
    ],
    "宁夏回族自治区": [
        {"text": "银川市\n首府平原", "point": (0.505, 0.365), "box": (0.690, 0.330)},
        {"text": "石嘴山市\n北部黄河", "point": (0.500, 0.260), "box": (0.160, 0.230)},
        {"text": "吴忠市\n黄河灌区", "point": (0.535, 0.475), "box": (0.695, 0.485)},
        {"text": "中卫市\n沙坡头", "point": (0.405, 0.585), "box": (0.135, 0.585)},
        {"text": "固原市\n六盘山", "point": (0.530, 0.735), "box": (0.700, 0.725)},
    ],
    "甘肃省": [
        {"text": "兰州市\n省会黄河", "point": (0.590, 0.585), "box": (0.710, 0.560)},
        {"text": "敦煌市\n莫高鸣沙", "point": (0.230, 0.320), "box": (0.080, 0.290)},
        {"text": "嘉峪关市\n长城西端", "point": (0.345, 0.380), "box": (0.105, 0.410)},
        {"text": "张掖市\n丹霞绿洲", "point": (0.455, 0.430), "box": (0.165, 0.495)},
        {"text": "天水市\n陇东南", "point": (0.715, 0.715), "box": (0.710, 0.735)},
    ],
    "新疆维吾尔自治区": [
        {"text": "乌鲁木齐市\n首府天山", "point": (0.545, 0.445), "box": (0.700, 0.420)},
        {"text": "伊犁州\n河谷草原", "point": (0.355, 0.445), "box": (0.115, 0.405)},
        {"text": "喀什地区\n西域古城", "point": (0.360, 0.720), "box": (0.110, 0.700)},
        {"text": "吐鲁番市\n盆地葡萄", "point": (0.625, 0.500), "box": (0.715, 0.515)},
        {"text": "阿勒泰地区\n北疆山湖", "point": (0.555, 0.235), "box": (0.690, 0.230)},
        {"text": "和田地区\n昆仑绿洲", "point": (0.520, 0.805), "box": (0.695, 0.795)},
    ],
}


def annotate(province):
    image_path = ROOT / province / "images" / f"01-{province}总图.png"
    if not image_path.exists():
        print(f"skip missing: {image_path}")
        return

    backup_path = ROOT / province / "images" / f"01-{province}总图-未标注备份.png"
    if not backup_path.exists():
        backup_path.write_bytes(image_path.read_bytes())

    base = Image.open(image_path).convert("RGBA")
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    for label in ANNOTATIONS[province]:
        draw_label(draw, base.size, label)
    out = Image.alpha_composite(base, layer).convert("RGB")
    out.save(image_path, "PNG")
    print(f"annotated: {image_path}")


def main():
    for province in ANNOTATIONS:
        annotate(province)


if __name__ == "__main__":
    main()
