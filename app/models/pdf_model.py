from PyPDF2 import PdfMerger, PdfReader, PdfWriter
from pdf2image import convert_from_path
from PIL import Image

def merge_pdfs(file_paths, output_path):
    merger = PdfMerger()
    for path in file_paths:
        merger.append(path)
    merger.write(output_path)
    merger.close()

def extract_text_from_pdf(file_path):
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text

def pdf_to_images(file_path, output_folder):
    images = convert_from_path(file_path)
    for i, image in enumerate(images):
        image.save(f"{output_folder}/page_{i + 1}.png", 'PNG')

def images_to_pdf(image_paths, output_path):
    images = [Image.open(path) for path in image_paths]
    images[0].save(output_path, save_all=True, append_images=images[1:])

def add_watermark(input_pdf, watermark_pdf, output_pdf):
    reader = PdfReader(input_pdf)
    watermark_reader = PdfReader(watermark_pdf)
    watermark_page = watermark_reader.pages[0]

    writer = PdfWriter()
    for page in reader.pages:
        page.merge_page(watermark_page)
        writer.add_page(page)

    with open(output_pdf, 'wb') as out_pdf:
        writer.write(out_pdf)

def compress_pdf(input_pdf, output_pdf):
    reader = PdfReader(input_pdf)
    writer = PdfWriter()

    for page in reader.pages:
        page.compress_content_streams()
        writer.add_page(page)

    with open(output_pdf, 'wb') as out_pdf:
        writer.write(out_pdf)