from PyPDF2 import PdfReader, PdfWriter
from PyPDF2.generic import NameObject, NumberObject
from flask import Blueprint, render_template, request, url_for, jsonify, send_file
import os, io

merge_pdf_bp = Blueprint('merge_pdf', __name__)

@merge_pdf_bp.route('/merge-pdf', methods=['GET', 'POST'])
def merge_pdf():
    if request.method == 'POST':
        files = request.files.getlist('files')
        rotations = request.form.getlist('rotations')  # Recebe a lista de rotações

        if len(files) != len(rotations):
            return jsonify({'success': False, 'message': 'Erro: Descompasso entre arquivos e rotações.'})

        output = io.BytesIO()
        writer = PdfWriter()

        # Aplicar rotação para cada PDF individualmente
        for i, file in enumerate(files):
            reader = PdfReader(file)
            rotation = int(rotations[i])  # Obtém a rotação do arquivo específico

            for page in reader.pages:
                # Aplica a rotação acumulada
                current_rotation = page.get("/Rotate") or 0  # Obtém a rotação existente
                new_rotation = (current_rotation + rotation) % 360  # Calcula rotação acumulativa
                page.rotate(new_rotation)  # Aplica a rotação corretamente
                writer.add_page(page)  # Adiciona ao arquivo final

        writer.write(output)
        output.seek(0)

        # Salva como arquivo temporário
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

@merge_pdf_bp.route('/rotate_pdf', methods=['POST'])
def rotate_pdf():
    """Rota responsável por processar a rotação do PDF no servidor."""
    from PyPDF2 import PdfReader, PdfWriter

    try:
        file_name = request.form.get('file_name')  # Nome único do arquivo
        rotation = int(request.form.get('rotation'))  # Ângulo de rotação

        # Identifica o arquivo no diretório (ajuste conforme a lógica do seu sistema de arquivos)
        input_path = f"./uploads/{file_name}"
        output_path = f"./uploads/rotated_{file_name}"

        # Rotacionar PDF
        reader = PdfReader(input_path)
        writer = PdfWriter()

        for page in reader.pages:
            page.rotate(rotation)
            writer.add_page(page)

        # Salva o resultado como um novo arquivo rotacionado
        with open(output_path, "wb") as output_file:
            writer.write(output_file)

        # Retorna sucesso ao frontend
        return jsonify({"status": "success", "file_name": f"rotated_{file_name}"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
