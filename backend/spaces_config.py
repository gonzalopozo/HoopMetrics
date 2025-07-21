import boto3
from botocore.exceptions import ClientError
from typing import Optional
import uuid
from fastapi import UploadFile
import logging
from config import get_settings

env = get_settings()

logger = logging.getLogger(__name__)

# Configuración de Cloudflare R2
SPACES_BUCKET = env.SPACES_BUCKET
# R2 endpoint construction
R2_ENDPOINT = f"https://{env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
# Public URL for accessing files
PUBLIC_URL = env.R2_PUBLIC_URL

# Cliente de S3 compatible con Cloudflare R2
def get_spaces_client():
    return boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=env.SPACES_ACCESS_KEY,
        aws_secret_access_key=env.SPACES_SECRET_KEY
    )

async def upload_profile_image(user_id: int, file: UploadFile) -> Optional[str]:
    """
    Sube una imagen de perfil a Cloudflare R2
    Retorna la URL pública de la imagen subida
    """
    try:
        # Validar tipo de archivo
        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if file.content_type not in allowed_types:
            raise ValueError(f"Tipo de archivo no permitido: {file.content_type}")
        
        # Validar tamaño (máximo 5MB)
        file_content = await file.read()
        if len(file_content) > 5 * 1024 * 1024:  # 5MB
            raise ValueError("El archivo es demasiado grande (máximo 5MB)")
        
        # Generar nombre único para el archivo
        file_extension = file.filename.split('.')[-1] if file.filename else 'jpg'
        unique_filename = f"profile-images/{user_id}/{uuid.uuid4()}.{file_extension}"
        
        # Configurar cliente de R2
        spaces_client = get_spaces_client()
        
        # Subir archivo
        spaces_client.put_object(
            Bucket=SPACES_BUCKET,
            Key=unique_filename,
            Body=file_content,
            ContentType=file.content_type,
            CacheControl='max-age=31536000'  # Cache por 1 año
        )
        
        # Retornar URL pública
        public_url = f"{PUBLIC_URL}/{unique_filename}"
        logger.info(f"Imagen subida exitosamente: {public_url}")
        
        return public_url
        
    except ClientError as e:
        logger.error(f"Error subiendo imagen a R2: {e}")
        raise Exception("Error subiendo imagen")
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        raise

async def delete_profile_image(image_url: str) -> bool:
    """
    Elimina una imagen de perfil de Cloudflare R2
    """
    try:
        # Extraer el key de la URL
        if PUBLIC_URL in image_url:
            key = image_url.replace(f"{PUBLIC_URL}/", "")
        else:
            return False
        
        spaces_client = get_spaces_client()
        spaces_client.delete_object(Bucket=SPACES_BUCKET, Key=key)
        
        logger.info(f"Imagen eliminada exitosamente: {key}")
        return True
        
    except ClientError as e:
        logger.error(f"Error eliminando imagen: {e}")
        return False