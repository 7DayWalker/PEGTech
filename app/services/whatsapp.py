"""
WhatsApp Business service via Meta Graph API.
Requires WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.
"""
import httpx
from typing import Dict, Any

from app.config import settings


class WhatsAppService:
    def __init__(self):
        self.access_token = settings.whatsapp_access_token
        self.phone_number_id = settings.whatsapp_phone_number_id
        self.base_url = "https://graph.facebook.com/v18.0"

    async def send(self, to: str, body: str) -> Dict[str, Any]:
        """Send a WhatsApp text message. Returns {success, message_id, error}."""
        if not self.access_token or not self.phone_number_id:
            return {
                "success": False,
                "message_id": None,
                "error": "WhatsApp credentials not configured",
            }

        phone = to.strip()
        if not phone.startswith("+"):
            phone = "+" + phone

        url = f"{self.base_url}/{self.phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": phone,
            "type": "text",
            "text": {"body": body},
        }

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(url, headers=headers, json=payload)
                data = resp.json()

            if resp.status_code == 200 and data.get("messages"):
                return {"success": True, "message_id": data["messages"][0].get("id"), "error": None}

            error_msg = data.get("error", {}).get("message", f"HTTP {resp.status_code}")
            return {"success": False, "message_id": None, "error": error_msg}
        except Exception as e:
            return {"success": False, "message_id": None, "error": str(e)}


whatsapp_service = WhatsAppService()