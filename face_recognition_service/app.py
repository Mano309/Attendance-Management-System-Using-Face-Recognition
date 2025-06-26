import cv2
import numpy as np
import base64
import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
import time
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Initialize face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Create directories
os.makedirs('trained_data', exist_ok=True)
os.makedirs('captured_images', exist_ok=True)

# In-memory storage for trained faces
trained_faces = {}
user_database = {}

def decode_base64_image(base64_string):
    """Decode base64 image to OpenCV format"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to OpenCV format
        opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        return opencv_image
    except Exception as e:
        print(f"Error decoding image: {e}")
        return None

def detect_faces(image):
    """Detect faces in image using Haar cascade"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30),
        flags=cv2.CASCADE_SCALE_IMAGE
    )
    return faces

def extract_face_features(image, face_rect):
    """Extract face region and basic features"""
    x, y, w, h = face_rect
    face_region = image[y:y+h, x:x+w]
    
    # Resize to standard size
    face_resized = cv2.resize(face_region, (100, 100))
    
    # Convert to grayscale for feature extraction
    gray_face = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)
    
    # Calculate histogram as a simple feature
    hist = cv2.calcHist([gray_face], [0], None, [256], [0, 256])
    
    return {
        'face_region': face_resized,
        'histogram': hist.flatten(),
        'size': (w, h),
        'position': (x, y)
    }

def compare_faces(features1, features2):
    """Compare two face features and return similarity score"""
    try:
        # Compare histograms using correlation
        correlation = cv2.compareHist(
            features1['histogram'].astype(np.float32),
            features2['histogram'].astype(np.float32),
            cv2.HISTCMP_CORREL
        )
        
        # Convert correlation to percentage
        similarity = max(0, correlation * 100)
        return similarity
    except:
        return 0

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Face Recognition Service',
        'opencv_version': cv2.__version__,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/recognize', methods=['POST'])
def recognize_face():
    """Recognize face from base64 image data"""
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Decode image
        image = decode_base64_image(data['image'])
        if image is None:
            return jsonify({'error': 'Invalid image data'}), 400
        
        # Detect faces
        faces = detect_faces(image)
        
        if len(faces) == 0:
            return jsonify({
                'recognized': False,
                'message': 'No faces detected'
            })
        
        # Process the largest face
        largest_face = max(faces, key=lambda f: f[2] * f[3])
        face_features = extract_face_features(image, largest_face)
        
        # Compare with trained faces
        best_match = None
        best_score = 0
        threshold = 60  # Minimum similarity threshold
        
        for user_id, trained_data in trained_faces.items():
            for trained_feature in trained_data['features']:
                score = compare_faces(face_features, trained_feature)
                if score > best_score and score > threshold:
                    best_score = score
                    best_match = user_id
        
        if best_match:
            user_info = user_database.get(best_match, {})
            return jsonify({
                'recognized': True,
                'user_id': best_match,
                'confidence': round(best_score, 2),
                'user_info': user_info,
                'face_count': len(faces),
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'recognized': False,
                'message': 'No matching face found',
                'face_count': len(faces),
                'max_similarity': round(best_score, 2) if best_score > 0 else 0
            })
    
    except Exception as e:
        print(f"Recognition error: {e}")
        return jsonify({'error': 'Recognition failed'}), 500

@app.route('/train', methods=['POST'])
def train_face():
    """Train face recognition model with provided images"""
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data or 'images' not in data:
            return jsonify({'error': 'Missing user_id or images'}), 400
        
        user_id = data['user_id']
        images = data['images']
        user_info = data.get('user_info', {})
        
        if len(images) < 2:
            return jsonify({'error': 'At least 2 images required for training'}), 400
        
        # Store user info
        user_database[user_id] = user_info
        
        # Process training images
        features_list = []
        valid_images = 0
        
        for i, img_data in enumerate(images):
            image = decode_base64_image(img_data)
            if image is None:
                continue
            
            # Detect faces
            faces = detect_faces(image)
            if len(faces) == 0:
                continue
            
            # Use the largest face
            largest_face = max(faces, key=lambda f: f[2] * f[3])
            features = extract_face_features(image, largest_face)
            features_list.append(features)
            
            # Save training image
            img_path = f"captured_images/{user_id}_train_{i}.jpg"
            cv2.imwrite(img_path, image)
            valid_images += 1
        
        if valid_images < 2:
            return jsonify({'error': 'Not enough valid face images for training'}), 400
        
        # Store trained features
        trained_faces[user_id] = {
            'features': features_list,
            'trained_at': datetime.now().isoformat(),
            'image_count': valid_images
        }
        
        # Save training data
        training_data = {
            'user_id': user_id,
            'user_info': user_info,
            'trained_at': datetime.now().isoformat(),
            'image_count': valid_images
        }
        
        with open(f"trained_data/{user_id}.json", 'w') as f:
            json.dump(training_data, f, indent=2)
        
        return jsonify({
            'success': True,
            'message': 'Face training completed successfully',
            'user_id': user_id,
            'images_processed': valid_images,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        print(f"Training error: {e}")
        return jsonify({'error': 'Training failed'}), 500

@app.route('/trained_users', methods=['GET'])
def get_trained_users():
    """Get list of all trained users"""
    try:
        users = []
        for user_id, data in trained_faces.items():
            user_info = user_database.get(user_id, {})
            users.append({
                'user_id': user_id,
                'user_info': user_info,
                'trained_at': data['trained_at'],
                'image_count': data['image_count']
            })
        
        return jsonify({
            'trained_users': users,
            'total_count': len(users)
        })
    except Exception as e:
        print(f"Error getting trained users: {e}")
        return jsonify({'error': 'Failed to get trained users'}), 500

@app.route('/delete_user/<user_id>', methods=['DELETE'])
def delete_trained_user(user_id):
    """Delete a trained user"""
    try:
        if user_id in trained_faces:
            del trained_faces[user_id]
        
        if user_id in user_database:
            del user_database[user_id]
        
        # Remove files
        json_file = f"trained_data/{user_id}.json"
        if os.path.exists(json_file):
            os.remove(json_file)
        
        # Remove training images
        for file in os.listdir("captured_images"):
            if file.startswith(f"{user_id}_"):
                os.remove(os.path.join("captured_images", file))
        
        return jsonify({
            'success': True,
            'message': f'User {user_id} deleted successfully'
        })
    except Exception as e:
        print(f"Error deleting user: {e}")
        return jsonify({'error': 'Failed to delete user'}), 500

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get service statistics"""
    try:
        return jsonify({
            'total_trained_users': len(trained_faces),
            'opencv_version': cv2.__version__,
            'service_uptime': time.time(),
            'available_cascades': len([f for f in os.listdir(cv2.data.haarcascades) if f.endswith('.xml')]),
            'storage_info': {
                'trained_data_files': len(os.listdir('trained_data')),
                'captured_images': len(os.listdir('captured_images'))
            }
        })
    except Exception as e:
        print(f"Error getting stats: {e}")
        return jsonify({'error': 'Failed to get stats'}), 500

if __name__ == '__main__':
    print("Starting Face Recognition Service...")
    print(f"OpenCV version: {cv2.__version__}")
    print("Available Haar cascades:")
    
    # List available cascades
    cascade_dir = cv2.data.haarcascades
    cascades = [f for f in os.listdir(cascade_dir) if f.endswith('.xml')]
    for cascade in cascades:
        print(f"  - {cascade}")
    
    print("\nService endpoints:")
    print("  GET  /health - Health check")
    print("  POST /recognize - Recognize face from image")
    print("  POST /train - Train face recognition model")
    print("  GET  /trained_users - Get trained users list")
    print("  GET  /stats - Get service statistics")
    print("  DELETE /delete_user/<id> - Delete trained user")
    
    app.run(host='0.0.0.0', port=5001, debug=True)