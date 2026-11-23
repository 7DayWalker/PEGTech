"""
Google Drive service (optional asset backup).
Uses the connected google_drive connector via Arena.
"""
from typing import Optional, Dict, Any


class GoogleDriveService:
    """Placeholder for Google Drive integration.

    The google_drive connector is available in Arena. Use it to:
    - Upload preview assets (images, PDFs)
    - Backup lead data exports
    - Store campaign templates
    """

    def __init__(self, folder_id: Optional[str] = None):
        self.folder_id = folder_id

    async def upload_file(self, file_path: str, name: str) -> Dict[str, Any]:
        """Upload a file to Google Drive. Requires the google_drive connector."""
        return {
            "success": False,
            "error": "Google Drive upload requires the google_drive connector to be called from Arena",
        }

    async def create_folder(self, name: str) -> Dict[str, Any]:
        """Create a folder in Google Drive."""
        return {
            "success": False,
            "error": "Google Drive folder creation requires the google_drive connector to be called from Arena",
        }


google_drive_service = GoogleDriveService()