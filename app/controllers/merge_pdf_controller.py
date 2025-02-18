from flask import Blueprint, render_template, request, redirect, url_for
from app.models.pdf_model import merge_pdfs
import os

merge_pdf_bp = Blueprint('merge_pdf', __name__)


@merge_pdf_bp.route('/merge-pdf', methods=['GET', 'POST'])
def merge_pdf():
    if request.method == 'POST':
        files = request.files.getlist('files')
        file_paths = []
        for file in files:
            file_path = os.path.join('app/static/uploads', file.filename)
            file.save(file_path)
            file_paths.append(file_path)

        output_path = os.path.join('app/static/uploads', 'merged.pdf')
        merge_pdfs(file_paths, output_path)
        return redirect(url_for('merge_pdf.merge_pdf'))

    return render_template('merge_pdf.html')