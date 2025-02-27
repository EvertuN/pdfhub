from flask import Blueprint, request, jsonify, send_file, render_template, url_for
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

# TODO// ELE ESTÁ "ENDIREITANDO" OS PDFs QUE FORAM "GIRADOS"
# TODO// E AO CONVERTER PDFs QUE TEM IMAGEM ELE ADICIONA UMAS PÁGINAS EM BRANCO
@pdf_to_word_bp.route('/convert-pdf-to-word', methods=['POST'])
def convert_pdf_to_word():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'Nenhum arquivo enviado.'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'Nenhum arquivo selecionado.'}), 400

    try:
        # Salvar o PDF temporariamente
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
            file.save(temp_pdf.name)
            temp_pdf_path = temp_pdf.name

        # Ajustar e corrigir o PDF (opcional, dependendo da necessidade)
        # Aqui é opcional ajustar rotações ou outras alterações
        pdf_reader = PdfReader(temp_pdf_path)
        pdf_writer = PdfWriter()

        for page in pdf_reader.pages:
            rotation = page.get("/Rotate", 0)
            if rotation != 0:
                page.rotate(-rotation)  # Corrigir rotação
            pdf_writer.add_page(page)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as corrected_pdf:
            pdf_writer.write(corrected_pdf)
            corrected_pdf_path = corrected_pdf.name

        # Converter PDF corrigido para Word
        output_docx_path = os.path.join('app/static/uploads', f"{os.path.splitext(file.filename)[0]}.docx")

        cv = Converter(corrected_pdf_path)
        cv.convert(output_docx_path, detailed_analysis=True)
        cv.close()

        # Excluir arquivos temporários
        os.remove(temp_pdf_path)
        os.remove(corrected_pdf_path)

        # Redirecionar para a página de download
        download_url = url_for('pdf_to_word.download_word', filename=os.path.basename(output_docx_path), _external=True)

        return jsonify({'success': True, 'redirectUrl': download_url})
    except Exception as e:
        # Excluir arquivos temporários em caso de erro
        if 'temp_pdf_path' in locals() and os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)
        if 'corrected_pdf_path' in locals() and os.path.exists(corrected_pdf_path):
            os.remove(corrected_pdf_path)
        return jsonify({'success': False, 'message': f'Erro ao converter o PDF: {str(e)}'}), 500


@pdf_to_word_bp.route('/download-word/<filename>')
def download_word(filename):
    """
    Página de download do arquivo Word convertido.
    """
    file_path = os.path.join('app/static/uploads', filename)

    # Verifica se o arquivo existe
    if not os.path.exists(file_path):
        return render_template("download.html", success=False, message="O arquivo solicitado não está disponível.")

    # Gera o URL para baixar diretamente
    direct_download_url = url_for('static', filename=f'uploads/{filename}', _external=True)
    return render_template("download.html", success=True, download_url=direct_download_url,
                           file_title="Seu PDF foi convertido em um WORD editável",
                           file_type='documento Word')
