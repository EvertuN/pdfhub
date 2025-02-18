from flask import Blueprint, render_template, request
from app.models.pdf_model import compress_pdf
import os

compress_pdf_bp = Blueprint('compress_pdf', __name__)


@compress_pdf_bp.route('/compress-pdf', methods=['GET', 'POST'])
def compress_pdf():
    if request.method == 'POST':
        file = request.files['file']
        file_path = os.path.join('app/static/uploads', file.filename)
        file.save(file_path)

        output_path = os.path.join('app/static/uploads', 'compressed.pdf')
        compress_pdf(file_path, output_path)
    return render_template('compress_pdf.html')