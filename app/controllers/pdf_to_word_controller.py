from flask import Blueprint, request, jsonify, send_file, render_template, url_for, redirect
from pdf2docx import Converter
from PyPDF2 import PdfReader, PdfWriter
import os
import io
import tempfile

pdf_to_word_bp = Blueprint('pdf_to_word', __name__)

@pdf_to_word_bp.route('/pdf-to-word', methods=['GET'])
def pdf_to_word():
    return render_template('pdf_to_word.html')


@pdf_to_word_bp.route('/upload-pdf-to-word', methods=['POST'])
def upload_pdf_to_word():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'Nenhum arquivo enviado.'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'Nenhum arquivo selecionado.'}), 400

    try:
        # Ler o número de páginas do PDF
        pdf_reader = PdfReader(file)
        num_pages = len(pdf_reader.pages)

        return jsonify({'success': True, 'fileName': file.filename, 'numPages': num_pages})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao processar o PDF: {str(e)}'}), 500

@pdf_to_word_bp.route('/convert-pdf-to-word', methods=['POST'])
def convert_pdf_to_word():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'Nenhum arquivo enviado.'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'Nenhum arquivo selecionado.'}), 400

    try:
        # Ler o arquivo PDF em memória
        pdf_stream = io.BytesIO(file.read())
        pdf_reader = PdfReader(pdf_stream)

        # Corrigir a rotação das páginas (se necessário)
        pdf_writer = PdfWriter()
        for page in pdf_reader.pages:
            rotation = page.get("/Rotate", 0)
            if rotation != 0:
                page.rotate(-rotation)  # Corrigir rotação
            pdf_writer.add_page(page)

        # Salvar o PDF corrigido em um arquivo temporário em memória
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
            pdf_writer.write(temp_pdf)
            temp_pdf_path = temp_pdf.name

        # Converter PDF corrigido para Word em memória
        word_stream = io.BytesIO()
        cv = Converter(temp_pdf_path)
        cv.convert(word_stream)
        cv.close()

        word_stream.seek(0)

        # Excluir o arquivo temporário após a conversão
        import os
        os.remove(temp_pdf_path)

        # Retornar o arquivo Word para o usuário
        return send_file(
            word_stream,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            as_attachment=True,
            download_name=f"{file.filename.rsplit('.', 1)[0]}.docx"
        )
    except Exception as e:
        # Excluir o arquivo temporário em caso de erro
        if 'temp_pdf_path' in locals() and os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)
        return jsonify({'success': False, 'message': f'Erro ao converter o PDF: {str(e)}'}), 500

@pdf_to_word_bp.route('/download-hub', methods=['GET'])
def download_hub():
    # Renderiza a página de sucesso após o download
    return render_template('download.html')


