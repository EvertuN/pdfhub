from flask import Blueprint, render_template, request
from app.models.pdf_model import extract_text_from_pdf
import os

extract_text_bp = Blueprint('extract_text', __name__)

@extract_text_bp.route('/extract-text', methods=['GET', 'POST'])
def extract_text():
    text = None
    if request.method == 'POST':
        file = request.files['file']
        file_path = os.path.join('app/static/uploads', file.filename)
        file.save(file_path)
        text = extract_text_from_pdf(file_path)
    return render_template('extract_text.html', text=text)