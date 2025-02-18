from flask import Flask
from config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Registrar Blueprints
    from app.controllers.home_controller import home_bp
    from app.controllers.merge_pdf_controller import merge_pdf_bp
    from app.controllers.extract_text_controller import extract_text_bp
    from app.controllers.pdf_to_image_controller import pdf_to_image_bp
    from app.controllers.image_to_pdf_controller import image_to_pdf_bp
    from app.controllers.watermark_controller import watermark_bp
    from app.controllers.compress_pdf_controller import compress_pdf_bp

    app.register_blueprint(home_bp)
    app.register_blueprint(merge_pdf_bp)
    app.register_blueprint(extract_text_bp)
    app.register_blueprint(pdf_to_image_bp)
    app.register_blueprint(image_to_pdf_bp)
    app.register_blueprint(watermark_bp)
    app.register_blueprint(compress_pdf_bp)

    return app