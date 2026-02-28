from PIL import Image, ImageDraw, ImageFont
import io
import base64
import sys

# 读取参数
album_title = sys.argv[1] if len(sys.argv) > 1 else "专辑名称"
artist_name = sys.argv[2] if len(sys.argv) > 2 else "歌手名"
user_image_data = sys.argv[3] if len(sys.argv) > 3 else ""

# 移除base64前缀
if user_image_data.startswith('data:image/'):
    user_image_data = user_image_data.split(',')[1]

# 创建3000x3000画布
canvas = Image.new('RGB', (3000, 3000), color='#2a2a2a')
draw = ImageDraw.Draw(canvas)

# 加载模板图片
try:
    template = Image.open('template.png')
    template = template.resize((3000, 3000), Image.LANCZOS)
    # 添加阴影效果
    shadow = Image.new('RGBA', (3000, 3000), (255, 0, 0, 76))  # 30% opacity red
    canvas.paste(shadow, (0, 0), shadow)
    canvas.paste(template, (0, 0))
except:
    pass

# 加载用户上传的图片
if user_image_data:
    try:
        user_image = Image.open(io.BytesIO(base64.b64decode(user_image_data)))
        user_image = user_image.resize((3000, 3000), Image.LANCZOS)
        canvas.paste(user_image, (0, 0))
    except:
        pass

# 加载字体
try:
    font = ImageFont.truetype('LogoSCUnboundedSans-Regular-2.ttf', 24)
except:
    font = ImageFont.load_default()

# 绘制文字
# 计算文字位置
title_bbox = draw.textbbox((0, 0), album_title, font=font)
title_width = title_bbox[2] - title_bbox[0]
title_height = title_bbox[3] - title_bbox[1]

title_x = (3000 - title_width) // 2
title_y = 220

artist_bbox = draw.textbbox((0, 0), artist_name, font=font)
artist_width = artist_bbox[2] - artist_bbox[0]

artist_x = (3000 - artist_width) // 2
artist_y = 271

# 绘制文字阴影
draw.text((title_x + 1, title_y + 1), album_title, font=font, fill=(255, 0, 0, 76))
draw.text((artist_x + 1, artist_y + 1), artist_name, font=font, fill=(255, 0, 0, 76))

# 绘制文字
draw.text((title_x, title_y), album_title, font=font, fill=(255, 255, 255))
draw.text((artist_x, artist_y), artist_name, font=font, fill=(179, 179, 179))

# 保存为JPG
buffer = io.BytesIO()
canvas.save(buffer, format='JPEG', quality=90)
buffer.seek(0)

# 输出base64编码
print(base64.b64encode(buffer.getvalue()).decode('utf-8'))
