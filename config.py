import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'uma_chave_muito_secreta_e_muito_segura'
    UPLOAD_FOLDER = 'app/static/uploads'
    ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}

    @staticmethod
    def init_app(app):
        pass