import cv2
import numpy as np
import base64
from PIL import Image
import io

def get_haar_cascade_path():
    """Get the path to the default Haar cascade file"""
    try:
        return cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    except:
        # Fallback for older OpenCV versions
        return 'haarcascade_frontalface_default.xml'

def decode_base64_to_opencv(base64_string):
    """Convert base64 string to OpenCV image"""
    try:
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        image_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_data))
        opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        return opencv_image
    except Exception as e:
        print(f"Error decoding image: {e}")
        return None

def detect_faces_haar(image, cascade):
    """Detect faces using Haar cascade"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30),
        flags=cv2.CASCADE_SCALE_IMAGE
    )
    return faces

def extract_face_region(image, face_rect, target_size=(100, 100)):
    """Extract and resize face region"""
    x, y, w, h = face_rect
    face_region = image[y:y+h, x:x+w]
    return cv2.resize(face_region, target_size)

def calculate_face_histogram(face_image):
    """Calculate histogram features for face comparison"""
    gray_face = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
    hist = cv2.calcHist([gray_face], [0], None, [256], [0, 256])
    return hist.flatten()

def compare_histograms(hist1, hist2):
    """Compare two histograms and return similarity score"""
    try:
        correlation = cv2.compareHist(
            hist1.astype(np.float32),
            hist2.astype(np.float32),
            cv2.HISTCMP_CORREL
        )
        return max(0, correlation * 100)
    except:
        return 0