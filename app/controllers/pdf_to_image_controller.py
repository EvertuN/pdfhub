from flask import Blueprint, render_template, request
from app.models.pdf_model import pdf_to_images
import os

pdf_to_image_bp = Blueprint('pdf_to_image', __name__)

@pdf_to_image_bp.route('/pdf-to-image', methods=['GET', 'POST'])
def pdf_to_image():
    images = None
    if request.method == 'POST':
        file = request.files['file']
        file_path = os.path.join('app/static/uploads', file.filename)
        file.save(file_path)
        output_folder = 'app/static/uploads'
        pdf_to_images(file_path, output_folder)
        images = [f for f in os.listdir(output_folder) if f.endswith('.png')]
    return render_template('pdf_to_image.html', images=images)