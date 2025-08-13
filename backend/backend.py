from flask import Flask, request, send_file
from flask_cors import CORS
from PIL import Image, ImageDraw, ImageEnhance
import numpy as np
import io
import os

app = Flask(__name__)
CORS(app)

def get_bottom_dominant_color(image, sample_height=40):
    # Crop the bottom sample_height pixels
    width, height = image.size
    bottom = image.crop((0, height - sample_height, width, height))
    arr = np.array(bottom)
    arr = arr.reshape(-1, arr.shape[-1])
    # Ignore alpha if present
    if arr.shape[1] == 4:
        arr = arr[:, :3]
    # Get mean color
    mean_color = tuple(np.mean(arr, axis=0).astype(int))
    return mean_color

def apply_gradient(image, color, fade_height_ratio=0.45):
    width, height = image.size
    fade_height = int(height * fade_height_ratio)
    # Convert image to RGBA for transparency
    faded = image.convert('RGBA')
    # Create bottom color gradient
    bottom_gradient = Image.new('RGBA', (width, fade_height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(bottom_gradient)
    for y in range(fade_height):
        # Alpha fades from transparent at the top to opaque at the bottom
        alpha = int(255 * ((y + 1) / fade_height))
        draw.line([(0, y), (width, y)], fill=color + (alpha,))
    faded.paste(bottom_gradient, (0, height - fade_height), bottom_gradient)
    # Create top white transparent gradient
    top_height = height - fade_height
    if top_height > 0:
        white_gradient = Image.new('RGBA', (width, top_height), (0, 0, 0, 0))
        top_draw = ImageDraw.Draw(white_gradient)
        for y in range(top_height):
            # Alpha fades from subtle white at the bottom of this section to full transparency at the top
            alpha = int(255 * ((top_height - y) / top_height) * 0.3) # Adjusted for subtlety
            top_draw.line([(0, y), (width, y)], fill=(255, 255, 255, alpha))
        faded.paste(white_gradient, (0, 0), white_gradient)
    return faded

def overlay_logo(image, logo, margin=0, scale=0.5):
    img_w, img_h = image.size
    # Resize logo
    logo = logo.convert('RGBA')
    logo_w = int(img_w * scale)
    logo_h = int(logo_w * logo.height / logo.width)
    logo = logo.resize((logo_w, logo_h), Image.LANCZOS)
    # Position at bottom right
    pos = (img_w - logo.width - margin + 50, img_h - logo.height - margin + 50)
    image.paste(logo, pos, logo)
    return image

def crop_to_aspect(image, target_width, target_height):
    # Crop the image to the target aspect ratio, centered
    img_w, img_h = image.size
    target_ratio = target_width / target_height
    img_ratio = img_w / img_h
    if img_ratio > target_ratio:
        # Image is too wide
        new_w = int(target_ratio * img_h)
        offset = (img_w - new_w) // 2
        box = (offset, 0, offset + new_w, img_h)
    else:
        # Image is too tall
        new_h = int(img_w / target_ratio)
        offset = (img_h - new_h) // 2
        box = (0, offset, img_w, offset + new_h)
    return image.crop(box)

@app.route('/process', methods=['POST'])
def process():
    if 'image' not in request.files:
        return {'error': 'No image uploaded'}, 400
    image_file = request.files['image']
    image = Image.open(image_file).convert('RGBA')
    # Get dominant color from bottom
    color = get_bottom_dominant_color(image)
    # Apply gradient
    faded = apply_gradient(image, color)
    # Resize to half of 1080x1350 (540x675) with aspect ratio preserved
    fixed_size = (540, 675)
    faded = crop_to_aspect(faded, *fixed_size)
    faded = faded.resize(fixed_size, Image.LANCZOS)
    # Overlay logo if provided
    logo_file = request.files.get('logo')
    if logo_file:
        logo = Image.open(logo_file)
    else:
        # Use default logo from backend_assets
        default_logo_path = os.path.join(os.path.dirname(__file__), 'backend_assets', 'logo.png')
        logo = Image.open(default_logo_path)
    faded = overlay_logo(faded, logo)
    # Save to buffer
    buf = io.BytesIO()
    faded.save(buf, format='PNG')
    buf.seek(0)
    return send_file(buf, mimetype='image/png')

if __name__ == '__main__':
    app.run()