from PyPDF2 import PdfReader, PdfWriter
from flask import Blueprint, render_template, request, redirect, url_for, jsonify, send_file
from app.models.pdf_model import merge_pdfs
import os, io

merge_pdf_bp = Blueprint('merge_pdf', __name__)


@merge_pdf_bp.route('/merge-pdf', methods=['GET', 'POST'])
def merge_pdf():
    if request.method == 'POST':
        files = request.files.getlist('files')
        rotations = request.form.getlist('rotations')  # Recebe a lista de ângulos

        if len(files) != len(rotations):
            return jsonify({'success': False, 'message': 'Erro: Descompasso entre arquivos e rotações.'})

        output = io.BytesIO()
        writer = PdfWriter()

        # Aplicar a rotação ao combinar os PDFs
        for i, file in enumerate(files):
            reader = PdfReader(file)
            rotation = int(rotations[i])  # ângulo de rotação correspondente

            for page in reader.pages:
                page.rotate(rotation)  # Aplica a rotação na página
                writer.add_page(page)

        writer.write(output)
        output.seek(0)

        temp_path = os.path.join('app/static/uploads', 'temp_merged.pdf')
        with open(temp_path, 'wb') as f:
            f.write(output.getvalue())

        return jsonify({
            'success': True,
            'redirectUrl': url_for('merge_pdf.merged_download', _external=True),
        })


    return render_template('merge_pdf.html')


@merge_pdf_bp.route('/merged-download')
def merged_download():
    file_path = os.path.join('app/static/uploads', 'temp_merged.pdf')
    if not os.path.exists(file_path):
        return render_template("download.html", success=False, message="Nenhum arquivo disponível para download.")

    download_url = url_for('static', filename='uploads/temp_merged.pdf', _external=True)
    return render_template("download.html", success=True, download_url=download_url,
                           file_title="Os PDFs foram combinados!", file_type='o PDF combinado')


@merge_pdf_bp.route('/delete-file', methods=['POST'])
def delete_file():
    filename = request.json.get('filename')

    if not filename:
        return jsonify({'success': False, 'message': 'Arquivo não especificado!'})

    file_path = os.path.join('app/static/uploads', filename)

    if os.path.exists(file_path):
        os.remove(file_path)
        return jsonify({'success': True, 'message': 'Arquivo excluído com sucesso!'})
    else:
        return jsonify({'success': False, 'message': 'Arquivo não encontrado!'})


@merge_pdf_bp.route('/rotate-pdf', methods=['POST'])
def rotate_pdf():
    file = request.files['file']
    angle = int(request.form.get('angle', 90))

    reader = PdfReader(file)
    writer = PdfWriter()

    for page in reader.pages:
        # Aplicar a rotação corretamente
        page.rotate(angle)
        writer.add_page(page)

    output = io.BytesIO()
    writer.write(output)
    output.seek(0)

    return send_file(
        output,
        mimetype='application/pdf',
        as_attachment=True,
        download_name='rotated.pdf'
    )
