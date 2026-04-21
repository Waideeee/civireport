import os
import logging
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure fastapi-mail
# Handle empty variables gracefully for development/testing
mail_username = os.getenv("MAIL_USERNAME", "")
mail_password = os.getenv("MAIL_PASSWORD", "")
mail_from = os.getenv("MAIL_FROM", "")

# Only initialize config if credentials exist
conf = None
if mail_username and mail_password and mail_from:
    conf = ConnectionConfig(
        MAIL_USERNAME=mail_username,
        MAIL_PASSWORD=mail_password,
        MAIL_FROM=mail_from,
        MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
        MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
        MAIL_STARTTLS=os.getenv("MAIL_STARTTLS", "True") == "True",
        MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS", "False") == "True",
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
        TEMPLATE_FOLDER=Path(__file__).parent / 'templates'
    )

async def send_complaint_update_email(
    user_email: str,
    user_name: str,
    complaint_id: int,
    complaint_title: str,
    new_status: str,
    resolved_notes: str,
    proof_filename: str = None
):
    if not user_email:
        logger.warning(f"No email address found for user. Skipping email for complaint #{complaint_id}.")
        return
        
    if not conf:
        logger.warning(f"SMTP configuration is incomplete. Skipping email for complaint #{complaint_id}.")
        return

    try:
        template_body = {
            "user_name": user_name,
            "complaint_id": f"#{complaint_id:03d}",
            "complaint_title": complaint_title,
            "new_status": new_status,
            "resolved_notes": resolved_notes
        }

        # Handle attachment if proof exists
        attachments = []
        if proof_filename:
            file_path = Path(__file__).parent / "uploads" / proof_filename
            if file_path.exists():
                attachments.append(str(file_path))
            else:
                logger.warning(f"Proof file not found at {file_path}. Proceeding without attachment.")

        msg_kwargs = {
            "subject": f"Update on your complaint #{complaint_id:03d}",
            "recipients": [user_email],
            "template_body": template_body,
            "subtype": MessageType.html
        }
        
        if attachments:
            msg_kwargs["attachments"] = attachments
            
        message = MessageSchema(**msg_kwargs)

        fm = FastMail(conf)
        await fm.send_message(message, template_name="complaint_update.html")
        logger.info(f"Successfully sent status update email to {user_email} for complaint #{complaint_id}")
        
    except Exception as e:
        logger.error(f"Failed to send email to {user_email} for complaint #{complaint_id}. Error: {str(e)}")
