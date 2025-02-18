from flask import Blueprint, render_template, request
from app.models.pdf_model import images_to_pdf
import os

image_to_pdf_bp = Blueprint('image_to_pdf', __name__)


@image_to_pdf_bp.route('/image-to-pdf', methods=['GET', 'POST'])
def image_to_pdf():
    if request.method == 'POST':
        files = request.files.getlist('files')
        image_paths = []
        for file in files:
            file_path = os.path.join('app/static/uploads', file.filename)
            file.save(file_path)
            image_paths.append(file_path)

        output_path = os.path.join('app/static/uploads', 'output.pdf')
        images_to_pdf(image_paths, output_path)
    return render_template('image_to_pdf.html')