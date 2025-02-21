from flask import Blueprint, render_template, request, jsonify, send_file, url_for
from PyPDF2 import PdfReader, PdfWriter
import os
import io
import zipfile

split_pdf_bp = Blueprint('split_pdf', __name__, template_folder='../templates')

UPLOAD_FOLDER = "app/static/uploads"
OUTPUT_FOLDER = "app/static/output"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)


@split_pdf_bp.route('/split-pdf', methods=['GET'])
def split_pdf():
    return render_template('split_pdf.html')


@split_pdf_bp.route('/upload-pdf', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'Nenhum arquivo enviado.'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'Nenhum arquivo selecionado.'}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    reader = PdfReader(file_path)
    num_pages = len(reader.pages)

    return jsonify({'success': True, 'fileName': file.filename, 'numPages': num_pages})


@split_pdf_bp.route('/process-split', methods=['POST'])
def process_split():
    file_name = request.form.get('fileName')
    split_option = request.form.get('splitOption')
    selected_pages = request.form.get('selectedPages', '')

    file_path = os.path.join(UPLOAD_FOLDER, file_name)
    if not os.path.exists(file_path):
        return jsonify({'success': False, 'message': 'Arquivo não encontrado.'}), 400

    try:
        # Ler o arquivo PDF original
        reader = PdfReader(file_path)
        base_name = os.path.splitext(file_name)[0]

        # Criar um buffer ZIP em memória
        zip_file_path = os.path.join(OUTPUT_FOLDER, f"{base_name}_dividido.zip")

        with zipfile.ZipFile(zip_file_path, "w", zipfile.ZIP_DEFLATED) as zip_file:
            if split_option == 'all':
                # Gerar um PDF para cada página
                for i, page in enumerate(reader.pages):
                    writer = PdfWriter()
                    writer.add_page(page)

                    # Criar um buffer para o PDF da página
                    pdf_buffer = io.BytesIO()
                    writer.write(pdf_buffer)
                    pdf_buffer.seek(0)

                    # Nome do arquivo no ZIP
                    page_filename = f"{base_name}_pagina_{i + 1}.pdf"

                    # Adicionar ao ZIP
                    zip_file.writestr(page_filename, pdf_buffer.getvalue())
            else:
                # Criar PDFs individuais para as páginas selecionadas
                selected_pages = [int(p) - 1 for p in selected_pages.split(',') if p.isdigit()]

                for i, page_index in enumerate(selected_pages):
                    if 0 <= page_index < len(reader.pages):
                        writer = PdfWriter()
                        writer.add_page(reader.pages[page_index])

                        # Criar um buffer para o PDF da página
                        pdf_buffer = io.BytesIO()
                        writer.write(pdf_buffer)
                        pdf_buffer.seek(0)

                        # Nome do arquivo no ZIP
                        page_filename = f"{base_name}_pagina_{page_index + 1}.pdf"

                        # Adicionar ao ZIP
                        zip_file.writestr(page_filename, pdf_buffer.getvalue())

        # Gerar link de download e redirecionar
        download_url = url_for("static", filename=f"output/{base_name}_dividido.zip", _external=True)
        return jsonify({'success': True, 'redirect_url': url_for('split_pdf.download', download_url=download_url)})

    except Exception as e:
        # Pleno controle de erros para diagnóstico
        print(f"Erro ao processar PDF: {e}")
        return jsonify({'success': False, 'message': 'Erro ao processar o PDF: ' + str(e)}), 500


@split_pdf_bp.route('/download', methods=['GET'])
def download():
    # Pega a URL do arquivo a ser baixado (via query string)
    download_url = request.args.get('download_url', None)

    if not download_url:
        return render_template("download.html", success=False, message="Nenhum arquivo disponível para download.")

    # Renderiza o template de download com o link do arquivo
    return render_template("download.html", success=True, download_url=download_url, file_type="o PDF dividido")
