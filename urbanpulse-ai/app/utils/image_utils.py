import base64

def convert_to_base64(image_bytes):
    return base64.b64encode(image_bytes).decode("utf-8")
