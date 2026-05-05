import os
import logging
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from dotenv import load_dotenv
from pathlib import Path
from html import escape

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


async def _send_html_email(subject: str, recipients: list[str], body: str) -> bool:
    if not recipients:
        logger.warning("No recipients provided. Skipping email.")
        return False

    if not conf:
        logger.warning("SMTP configuration is incomplete. Skipping email.")
        return False

    try:
        message = MessageSchema(
            subject=subject,
            recipients=recipients,
            body=body,
            subtype=MessageType.html,
        )
        fm = FastMail(conf)
        await fm.send_message(message)
        logger.info("Successfully sent email '%s' to [redacted]", subject)
        return True
    except Exception as e:
        logger.error("Failed to send email '%s' to [redacted]. Error: %s", subject, str(e))
        return False


async def send_resident_rating_reminder_email(
    user_email: str,
    user_name: str,
    complaint_id: int,
    complaint_type: str,
    complaint_details: str,
):
    if not user_email:
        logger.warning("No resident email address found. Skipping reminder for complaint #%s.", complaint_id)
        return False

    subject = f"Reminder: Please rate your complaint #{complaint_id}"
    body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; padding: 24px;">
            <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
                <div style="background: #1d4ed8; color: #ffffff; padding: 24px;">
                    <h1 style="margin: 0; font-size: 22px;">Please rate your complaint #{complaint_id}</h1>
                </div>
                <div style="padding: 24px;">
                    <p>Hello {escape(user_name or 'Resident')},</p>
                    <p><strong>Complaint Type:</strong> {escape(complaint_type or 'N/A')}</p>
                    <p><strong>Complaint Details:</strong> {escape(complaint_details or 'N/A')}</p>
                    <p>Your complaint has been addressed by the barangay admin. Please open the mobile app and rate our service.</p>
                    <p>Your feedback helps us improve barangay services.</p>
                </div>
            </div>
        </body>
    </html>
    """
    return await _send_html_email(subject=subject, recipients=[user_email], body=body)


async def send_admin_awaiting_rating_alert_email(
    admin_email: str,
    complaint_id: int,
    complaint_type: str,
    complaint_details: str,
    resident_name: str,
    resident_contact_info: str,
):
    if not admin_email:
        logger.warning("No barangay admin email address found. Skipping admin alert for complaint #%s.", complaint_id)
        return False

    subject = f"Alert: Complaint #{complaint_id} awaiting resident rating"
    body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; padding: 24px;">
            <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
                <div style="background: #b91c1c; color: #ffffff; padding: 24px;">
                    <h1 style="margin: 0; font-size: 22px;">Complaint #{complaint_id} is still awaiting a rating</h1>
                </div>
                <div style="padding: 24px;">
                    <p><strong>Complaint Type:</strong> {escape(complaint_type or 'N/A')}</p>
                    <p><strong>Complaint Details:</strong> {escape(complaint_details or 'N/A')}</p>
                    <p>This complaint has been in progress for 7+ days without a resident rating.</p>
                    <p><strong>Resident Name:</strong> {escape(resident_name or 'N/A')}</p>
                    <p><strong>Resident Contact Info:</strong> {escape(resident_contact_info or 'N/A')}</p>
                </div>
            </div>
        </body>
    </html>
    """
    return await _send_html_email(subject=subject, recipients=[admin_email], body=body)


async def send_rating_followup_email(
    user_email: str,
    user_name: str,
    complaint_id: int,
    complaint_type: str,
    complaint_date: str,
):
    if not user_email:
        logger.warning("No resident email address found. Skipping follow-up for complaint #%s.", complaint_id)
        return False

    subject = f"Don't forget to rate your barangay service - Complaint #{complaint_id}"
    body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; padding: 24px;">
            <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
                <div style="background: #1d4ed8; color: #ffffff; padding: 24px;">
                    <h1 style="margin: 0; font-size: 22px;">Quick follow-up for complaint #{complaint_id}</h1>
                </div>
                <div style="padding: 24px;">
                    <p>Hello {escape(user_name or 'Resident')},</p>
                    <p>We noticed you haven't rated your complaint yet.</p>
                    <p><strong>Complaint Type:</strong> {escape(complaint_type or 'N/A')}</p>
                    <p><strong>Date Filed:</strong> {escape(complaint_date or 'N/A')}</p>
                    <p>Your feedback helps us improve our service.</p>
                    <p>Please open the mobile app to submit your rating.</p>
                </div>
            </div>
        </body>
    </html>
    """
    return await _send_html_email(subject=subject, recipients=[user_email], body=body)


async def send_complaint_resolved_email(
    user_email: str,
    user_name: str,
    complaint_id: int,
    complaint_type: str,
    complaint_details: str,
    action_history: str,
):
    if not user_email:
        logger.warning("No resident email address found. Skipping resolved email for complaint #%s.", complaint_id)
        return False

    subject = f"Complaint #{complaint_id} has been resolved"
    body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; padding: 24px;">
            <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
                <div style="background: #16a34a; color: #ffffff; padding: 24px;">
                    <h1 style="margin: 0; font-size: 22px;">Your complaint #{complaint_id} is now resolved</h1>
                </div>
                <div style="padding: 24px;">
                    <p>Hello {escape(user_name or 'Resident')},</p>
                    <p><strong>Complaint Type:</strong> {escape(complaint_type or 'N/A')}</p>
                    <p><strong>Complaint Details:</strong> {escape(complaint_details or 'N/A')}</p>
                    <p><strong>Action History:</strong></p>
                    <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:12px; white-space:pre-line; color:#166534;">{escape(action_history or 'No action history recorded.')}</div>
                    <p style="margin-top:16px;">Thank you for confirming your satisfaction with the barangay action taken.</p>
                </div>
            </div>
        </body>
    </html>
    """
    return await _send_html_email(subject=subject, recipients=[user_email], body=body)

async def send_complaint_update_email(
    user_email: str,
    user_name: str,
    complaint_id: int,
    complaint_type: str,
    complaint_subtype: str,
    complaint_location: str,
    new_status: str,
    resolved_notes: str,
):
    if not user_email:
        logger.warning(f"No email address found for user. Skipping email for complaint #{complaint_id}.")
        return
        
    if not conf:
        logger.warning(f"SMTP configuration is incomplete. Skipping email for complaint #{complaint_id}.")
        return

    try:
        barangay_contact = os.getenv("BARANGAY_CONTACT_INFO", "Please contact your barangay office for assistance.")
        body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; padding: 24px;">
                <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
                    <div style="background: #1d4ed8; color: #ffffff; padding: 24px;">
                        <h1 style="margin: 0; font-size: 22px;">Update on Your Complaint #{complaint_id}</h1>
                    </div>
                    <div style="padding: 24px;">
                        <p>Hello {user_name},</p>
                        <p>Your complaint has been updated by the barangay office.</p>
                        <p><strong>Complaint Type:</strong> {complaint_type}</p>
                        <p><strong>Complaint Details:</strong> {complaint_subtype}</p>
                        <p><strong>Location:</strong> {complaint_location}</p>
                        <p><strong>Action Taken:</strong> {resolved_notes}</p>
                        <p><strong>Current Status:</strong> {new_status}</p>
                        <p><strong>Barangay Contact Info:</strong> {barangay_contact}</p>
                    </div>
                </div>
            </body>
        </html>
        """

        message = MessageSchema(
            subject=f"Update on Your Complaint #{complaint_id}",
            recipients=[user_email],
            body=body,
            subtype=MessageType.html,
        )

        fm = FastMail(conf)
        await fm.send_message(message)
        logger.info(f"Successfully sent {new_status} update email to [redacted] for complaint #{complaint_id}")

    except Exception as e:
        logger.error(f"Failed to send email to [redacted] for complaint #{complaint_id}. Error: {str(e)}")

async def send_account_resolved_email(
    user_email: str,
    user_name: str
):
    if not user_email:
        logger.warning(f"No email address found for user {user_name}. Skipping account email.")
        return
        
    if not conf:
        logger.warning("SMTP configuration is incomplete. Skipping account email for [redacted].")
        return

    try:
        # Get login URL from env or fallback
        login_url = os.getenv("FRONTEND_LOGIN_URL", "http://localhost:8000/login")
        
        template_body = {
            "user_name": user_name,
            "login_url": login_url
        }

        message = MessageSchema(
            subject="Account Resolved — CiviReport",
            recipients=[user_email],
            template_body=template_body,
            subtype=MessageType.html
        )

        fm = FastMail(conf)
        await fm.send_message(message, template_name="user_resolved.html")
        logger.info("Successfully sent account email to [redacted]")

    except Exception as e:
        logger.error(f"Failed to send account email to [redacted]. Error: {str(e)}")

async def send_auto_resolved_email(
    user_email: str,
    user_name: str,
    complaint_id: int,
    complaint_title: str
):
    if not user_email or not conf:
        return

    try:
        template_body = {
            "user_name": user_name,
            "complaint_id": f"#{complaint_id:03d}",
            "complaint_title": complaint_title
        }

        message = MessageSchema(
            subject=f"Notice: Complaint #{complaint_id:03d} Auto-Resolved",
            recipients=[user_email],
            template_body=template_body,
            subtype=MessageType.html
        )

        fm = FastMail(conf)
        await fm.send_message(message, template_name="auto_resolved.html")
        logger.info("Successfully sent auto-resolution email to [redacted]")

    except Exception as e:
        logger.error(f"Failed to send auto-resolution email to [redacted]. Error: {str(e)}")

async def send_new_complaint_email(
    user_email: str,
    user_name: str,
    complaint_id: int,
    complaint_title: str
):
    if not user_email or not conf:
        return

    try:
        template_body = {
            "user_name": user_name,
            "complaint_id": f"#{complaint_id:03d}",
            "complaint_title": complaint_title
        }

        message = MessageSchema(
            subject=f"Complaint Received #{complaint_id:03d}",
            recipients=[user_email],
            template_body=template_body,
            subtype=MessageType.html
        )

        fm = FastMail(conf)
        await fm.send_message(message, template_name="pending.html")
        logger.info("Successfully sent new complaint email to [redacted]")

    except Exception as e:
        logger.error(f"Failed to send new complaint email to [redacted]. Error: {str(e)}")

async def send_verification_email(
    user_email: str,
    user_name: str,
    verification_url: str
):
    if not user_email or not conf:
        return

    try:
        template_body = {
            "user_name": user_name,
            "verification_url": verification_url
        }

        message = MessageSchema(
            subject="Verify Your Email Address — CiviReport",
            recipients=[user_email],
            template_body=template_body,
            subtype=MessageType.html
        )

        fm = FastMail(conf)
        await fm.send_message(message, template_name="verify_email.html")
        logger.info("Successfully sent verification email to [redacted]")

    except Exception as e:
        logger.error(f"Failed to send verification email to [redacted]. Error: {str(e)}")

async def send_account_verified_email(
    user_email: str,
    user_name: str
):
    if not user_email or not conf:
        return

    try:
        login_url = os.getenv("FRONTEND_LOGIN_URL", "http://127.0.0.1:8000/login")
        barangay_contact_info = os.getenv("BARANGAY_CONTACT_INFO", "Please contact your barangay office for assistance.")
        template_body = {
            "user_name": user_name,
            "registered_email": user_email,
            "login_url": login_url,
            "barangay_contact_info": barangay_contact_info,
        }

        message = MessageSchema(
            subject="Your CiviReport Account Has Been Verified",
            recipients=[user_email],
            template_body=template_body,
            subtype=MessageType.html
        )

        fm = FastMail(conf)
        await fm.send_message(message, template_name="account_verified.html")
        logger.info("Successfully sent account verified email to [redacted]")

    except Exception as e:
        logger.error(f"Failed to send account verified email to [redacted]. Error: {str(e)}")


async def send_barangay_admin_created_email(
    user_email: str,
    user_name: str,
    registered_email: str,
    verification_url: str,
    login_url: str | None = None,
):
    if not user_email:
        logger.warning("No email address provided for new barangay admin. Skipping email.")
        return

    if not conf:
        logger.warning("SMTP configuration is incomplete. Skipping barangay admin welcome email for [redacted].")
        return

    try:
        resolved_login_url = login_url or os.getenv("FRONTEND_LOGIN_URL", "http://localhost:8000/login")
        body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; padding: 24px;">
                <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
                    <div style="background: #1d4ed8; color: #ffffff; padding: 24px;">
                        <h1 style="margin: 0; font-size: 22px;">You have been registered as a Barangay Admin</h1>
                    </div>
                    <div style="padding: 24px;">
                        <p>Hello {user_name},</p>
                        <p>Welcome to CiviReport. Your Barangay Admin account has been created and is currently pending email verification.</p>
                        <p><strong>Registered email:</strong> {registered_email}</p>
                        <p>Click the link below to verify your email address and activate your account.</p>
                        <p>
                            <a href="{verification_url}" style="display:inline-block; background:#1d4ed8; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:8px; font-weight:600;">
                                Verify Email Address
                            </a>
                        </p>
                        <p>This verification link expires after 24 hours.</p>
                        <p>After verification, you can log in here: <a href="{resolved_login_url}">{resolved_login_url}</a></p>
                    </div>
                </div>
            </body>
        </html>
        """

        message = MessageSchema(
            subject="Barangay Admin Account Created — CiviReport",
            recipients=[user_email],
            body=body,
            subtype=MessageType.html,
        )

        fm = FastMail(conf)
        await fm.send_message(message)
        logger.info("Successfully sent barangay admin account email to [redacted]")

    except Exception as e:
        logger.error(f"Failed to send barangay admin account email to [redacted]. Error: {str(e)}")
