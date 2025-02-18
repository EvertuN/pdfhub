from flask import Blueprint, render_template, request
from app.models.pdf_model import add_watermark
import os

watermark_bp = Blueprint('watermark', __name__)


@watermark_bp.route('/watermark', methods=['GET', 'POST'])
def watermark():
    if request.method == 'POST':
        pdf = request.files['pdf']
        watermark = request.files['watermark']
        pdf_path = os.path.join('app/static/uploads', pdf.filename)
        watermark_path = os.path.join('app/static/uploads', watermark.filename)
        pdf.save(pdf_path)
        watermark.save(watermark_path)

        output_path = os.path.join('app/static/uploads', 'watermarked.pdf')
        add_watermark(pdf_path, watermark_path, output_path)
    return render_template('watermark.html')