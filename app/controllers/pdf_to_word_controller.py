import os
import tempfile
from flask import Blueprint, request, jsonify, send_file, render_template
from pdf2docx import Converter
import io

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
        from PyPDF2 import PdfReader
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

    temp_pdf_path = None
    temp_docx_path = None

    try:
        # Criar um arquivo temporário para o PDF enviado
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_pdf:
            temp_pdf.write(file.read())
            temp_pdf_path = temp_pdf.name

        # Criar um caminho temporário para o arquivo Word gerado
        temp_docx_path = tempfile.mktemp(suffix='.docx')

        # Converter o PDF para DOCX
        cv = Converter(temp_pdf_path)
        cv.convert(temp_docx_path)  # Gera o arquivo Word no caminho especificado
        cv.close()  # Fecha a conversão para liberar o arquivo

        # Retornar o arquivo Word gerado para o cliente (streaming)
        return send_file(
            open(temp_docx_path, 'rb'),  # Abre o arquivo em modo leitura binária
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            as_attachment=True,
            download_name=f"{os.path.splitext(file.filename)[0]}.docx"
        )

    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao converter o PDF: {str(e)}'}), 500

    finally:
        # Limpeza de arquivos temporários
        if temp_pdf_path and os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)
        if temp_docx_path and os.path.exists(temp_docx_path):
            try:
                os.remove(temp_docx_path)
            except PermissionError:
                pass  # Suprimir erro de exclusão se o arquivo ainda estiver em uso
