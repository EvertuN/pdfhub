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
        print("Recebendo o arquivo PDF para conversão.")

        # Carregar PDF em memória
        pdf_bytes = io.BytesIO(file.read())
        pdf_bytes.seek(0)

        # Ajustar rotação (se necessário)
        pdf_reader = PdfReader(pdf_bytes)
        pdf_writer = PdfWriter()

        print("Corrigindo rotações (se necessário).")
        for page in pdf_reader.pages:
            rotation = page.get("/Rotate", 0)
            if rotation != 0:
                page.rotate(-rotation)  # Corrigir rotação
            pdf_writer.add_page(page)

        # Criar um PDF corrigido temporário
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
            pdf_writer.write(temp_pdf)
            temp_pdf_path = temp_pdf.name

        print("Conversão do PDF para DOCX iniciada...")

        # Criar um arquivo temporário para armazenar o DOCX
        with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as temp_docx:
            temp_docx_path = temp_docx.name

        # Converter PDF para Word usando caminho de arquivo temporário
        cv = Converter(temp_pdf_path)
        cv.convert(temp_docx_path, start=0, end=None)
        cv.close()

        print("Conversão concluída! Preparando para download.")

        # Ler o arquivo convertido para memória antes de excluí-lo
        with open(temp_docx_path, "rb") as docx_file:
            docx_bytes = io.BytesIO(docx_file.read())

        # Remover arquivos temporários do disco
        import os
        os.remove(temp_pdf_path)
        os.remove(temp_docx_path)

        # Retornar o arquivo DOCX sem salvar no disco permanentemente
        return send_file(
            docx_bytes,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            as_attachment=True,
            download_name=f"{file.filename.rsplit('.', 1)[0]}.docx"
        )

    except Exception as e:
        print(f"Erro ao converter PDF: {e}")
        return jsonify({'success': False, 'message': f'Erro interno: {str(e)}'}), 500



@pdf_to_word_bp.route('/download-word/<filename>')
def download_word(filename):
    """
    Redireciona diretamente o cliente para a URL final do arquivo, sem renderizar página.
    """
    file_path = os.path.join('app/static/uploads', filename)

    # Verifica se o arquivo existe
    if not os.path.exists(file_path):
        return render_template("download.html", success=False, message="O arquivo solicitado não está disponível.")

    # Gera o URL direto do arquivo para redirecionar
    return redirect(url_for('static', filename=f'uploads/{filename}', _external=True))

