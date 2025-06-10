import boto3
from botocore.exceptions import ClientError
from typing import Optional
import uuid
from fastapi import UploadFile
import logging
from config import get_settings

env = get_settings()

logger = logging.getLogger(__name__)

# Configuración de Digital Ocean Spaces
SPACES_REGION = env.SPACES_REGION
SPACES_BUCKET = env.SPACES_BUCKET
SPACES_ENDPOINT = f"https://{SPACES_REGION}.digitaloceanspaces.com"
CDN_ENDPOINT = f"https://{SPACES_BUCKET}.{SPACES_REGION}.cdn.digitaloceanspaces.com"

# Cliente de S3 compatible con Digital Ocean Spaces
def get_spaces_client():
    return boto3.client(
        's3',
        region_name=SPACES_REGION,
        endpoint_url=SPACES_ENDPOINT,
        aws_access_key_id=env.SPACES_ACCESS_KEY,
        aws_secret_access_key=env.SPACES_SECRET_KEY
    )

async def upload_profile_image(user_id: int, file: UploadFile) -> Optional[str]:
    """
    Sube una imagen de perfil a Digital Ocean Spaces
    Retorna la URL de CDN de la imagen subida
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
        
        # Configurar cliente de Spaces
        spaces_client = get_spaces_client()
        
        # Subir archivo
        spaces_client.put_object(
            Bucket=SPACES_BUCKET,
            Key=unique_filename,
            Body=file_content,
            ACL='public-read',  # Hacer la imagen pública
            ContentType=file.content_type,
            CacheControl='max-age=31536000'  # Cache por 1 año
        )
        
        # Retornar URL del CDN
        cdn_url = f"{CDN_ENDPOINT}/{unique_filename}"
        logger.info(f"Imagen subida exitosamente: {cdn_url}")
        
        return cdn_url
        
    except ClientError as e:
        logger.error(f"Error subiendo imagen a Spaces: {e}")
        raise Exception("Error subiendo imagen")
    except Exception as e:
        logger.error(f"Error inesperado: {e}")
        raise

async def delete_profile_image(image_url: str) -> bool:
    """
    Elimina una imagen de perfil de Digital Ocean Spaces
    """
    try:
        # Extraer el key de la URL
        if CDN_ENDPOINT in image_url:
            key = image_url.replace(f"{CDN_ENDPOINT}/", "")
        else:
            return False
        
        spaces_client = get_spaces_client()
        spaces_client.delete_object(Bucket=SPACES_BUCKET, Key=key)
        
        logger.info(f"Imagen eliminada exitosamente: {key}")
        return True
        
    except ClientError as e:
        logger.error(f"Error eliminando imagen: {e}")
        return False