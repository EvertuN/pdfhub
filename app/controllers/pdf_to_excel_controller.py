from flask import render_template, Blueprint

pdf_to_excel_bp = Blueprint('pdf_to_excel', __name__)

@pdf_to_excel_bp.route('/pdf-to-excel', methods=['GET'])
def pdf_to_excel():
    return render_template('pdf_to_excel.html')