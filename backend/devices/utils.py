import qrcode
import uuid
import json
from io import BytesIO
from django.core.files import File
from rest_framework.exceptions import NotFound, ValidationError


def generate_qr_code(device):
    """Generate a QR code image for a device and save it to the model."""
    qr_payload = {
        'veriva_device': True,
        'device_id': device.pk,
        'serial': device.serial_number,
        'brand': device.brand,
        'model': device.model,
        'owner_reg': device.owner.registration_number,
        'token': str(uuid.uuid4()),
    }
    qr_data = json.dumps(qr_payload, separators=(',', ':'))

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)

    img = qr.make_image(fill_color='black', back_color='white')
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)

    filename = f'device_{device.pk}_{device.serial_number}.png'
    device.qr_data = qr_data
    device.qr_code.save(filename, File(buffer), save=False)
    return device


def find_device_by_qr(qr_data):
    """The device a scanned QR belongs to. The random token in the payload
    means a QR can't be forged from a device's public details alone."""
    from .models import Device

    try:
        payload = json.loads(qr_data)
    except (json.JSONDecodeError, ValueError):
        raise ValidationError({'detail': 'Invalid QR code format.'})

    if not isinstance(payload, dict) or not payload.get('veriva_device'):
        raise ValidationError({'detail': 'Not a VERIVA device QR code.'})

    try:
        return Device.objects.select_related('owner').get(serial_number=payload.get('serial'), qr_data=qr_data)
    except Device.DoesNotExist:
        raise NotFound('Device not found or QR code mismatch.')
