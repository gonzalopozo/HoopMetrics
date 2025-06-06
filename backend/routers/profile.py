from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from ..deps import get_db, get_current_user
from ..models import User, UserProfileUpdate, UserProfileResponse
from ..crud import update_user_profile, get_user_profile
from ..spaces_config import upload_profile_image, delete_profile_image

router = APIRouter(
    prefix="/profile",
    tags=["profile"]
)

@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtiene el perfil del usuario actual"""
    try:
        user = await get_user_profile(db, current_user.id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserProfileResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            profile_image_url=user.profile_image_url,
            role=user.role,
            registration_date=user.registration_date
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving profile: {str(e)}"
        )

@router.put("/update", response_model=UserProfileResponse)
async def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Actualiza el perfil del usuario (solo username por ahora)"""
    try:
        updated_user = await update_user_profile(
            db=db,
            user_id=current_user.id,
            username=profile_data.username,
            profile_image_url=profile_data.profile_image_url
        )
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserProfileResponse(
            id=updated_user.id,
            username=updated_user.username,
            email=updated_user.email,
            profile_image_url=updated_user.profile_image_url,
            role=updated_user.role,
            registration_date=updated_user.registration_date
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating profile: {str(e)}"
        )

@router.post("/upload-image", response_model=dict)
async def upload_profile_image_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Sube una nueva imagen de perfil"""
    try:
        # Validaciones básicas
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file selected"
            )
        
        # Subir imagen a Digital Ocean Spaces
        image_url = await upload_profile_image(current_user.id, file)
        
        if not image_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload image"
            )
        
        # Eliminar imagen anterior si existe
        if current_user.profile_image_url:
            await delete_profile_image(current_user.profile_image_url)
        
        # Actualizar URL en la base de datos
        updated_user = await update_user_profile(
            db=db,
            user_id=current_user.id,
            profile_image_url=image_url
        )
        
        return {
            "message": "Profile image uploaded successfully",
            "image_url": image_url
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading image: {str(e)}"
        )

@router.delete("/delete-image", response_model=dict)
async def delete_profile_image_endpoint(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Elimina la imagen de perfil actual"""
    try:
        if not current_user.profile_image_url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No profile image to delete"
            )
        
        # Eliminar de Digital Ocean Spaces
        deleted = await delete_profile_image(current_user.profile_image_url)
        
        # Actualizar base de datos
        await update_user_profile(
            db=db,
            user_id=current_user.id,
            profile_image_url=None
        )
        
        return {
            "message": "Profile image deleted successfully",
            "spaces_deleted": deleted
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting image: {str(e)}"
        )