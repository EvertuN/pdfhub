from flask import request, jsonify, send_file, Blueprint
from PyPDF2 import PdfReader, PdfWriter
import io

split_pdf_bp = Blueprint('split_pdf', __name__)

@split_pdf_bp.route('/split-pdf', methods=['POST'])
def split_pdf():
    print(f"Recebido método: {request.method}")  # Log para depuração
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'Nenhum arquivo enviado.'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'Nenhum arquivo selecionado.'}), 400

    print(f"Arquivo recebido: {file.filename}")
    filename = file.filename[:50]  # Pega os primeiros 50 caracteres do nome original
    split_option = request.form.get('splitOption')  # 'all' ou 'select'
    selected_pages = request.form.get('selectedPages', '').split(',')  # Páginas selecionadas

    print(f"Opção de divisão: {split_option}")
    print(f"Páginas selecionadas: {selected_pages}")

    # Ler o PDF
    reader = PdfReader(file)

    if split_option == 'all':
        # Criar múltiplos PDFs, um para cada página
        files = []
        for i in range(len(reader.pages)):
            writer = PdfWriter()
            writer.add_page(reader.pages[i])

            output = io.BytesIO()
            writer.write(output)
            output.seek(0)

            page_filename = f"{filename}_pagina_{i+1}.pdf"
            files.append((page_filename, output))

        return send_multiple_files(files)
    else:
        # Criar um único PDF com as páginas selecionadas
        writer = PdfWriter()
        for page_num in selected_pages:
            if page_num.isdigit():
                page_index = int(page_num) - 1
                if 0 <= page_index < len(reader.pages):
                    writer.add_page(reader.pages[page_index])

        output = io.BytesIO()
        writer.write(output)
        output.seek(0)

        return send_file(
            output,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"{filename}_selecionado.pdf"
        )


def send_multiple_files(files):
    """Cria um ZIP para enviar múltiplos arquivos"""
    import zipfile

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w") as zip_file:
        for file_name, file_data in files:
            zip_file.writestr(file_name, file_data.getvalue())

    zip_buffer.seek(0)

    return send_file(
        zip_buffer,
        mimetype="application/zip",
        as_attachment=True,
        download_name="arquivos_divididos.zip"
    )
