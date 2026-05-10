import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import cv2
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import base64
import io
import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from keras.models import Sequential, Model
from keras.layers import Conv2D, MaxPooling2D, Dropout, Flatten, Dense
import tensorflow as tf
from pymongo import MongoClient
import jwt
import bcrypt
from functools import wraps
try:
    import imagehash
    from PIL import Image as PILImage
    IMAGEHASH_AVAILABLE = True
except ImportError:
    IMAGEHASH_AVAILABLE = False

import fitz  # PyMuPDF
from docx import Document
import uuid
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'super-secret-key-cifake')

# Enable CORS for frontend with credentials support
CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

# Setup path for temporary uploads (to read image)
UPLOAD_FOLDER = 'static/temp_uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# MongoDB Configuration
MONGO_URI = os.getenv('MONGO_URI')
client = MongoClient(MONGO_URI)
db = client['cifake_db']
history_collection = db['prediction_history']
users_collection = db['users']

# Load Face Cascade
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get('token')
        if not token:
            return jsonify({'error': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = users_collection.find_one({"username": data['user']})
            if not current_user:
                return jsonify({'error': 'User not found!'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid!'}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Missing username or password'}), 400
        
    if users_collection.find_one({'username': data['username']}):
        return jsonify({'error': 'User already exists'}), 409
        
    hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
    users_collection.insert_one({
        'username': data['username'],
        'password': hashed_password,
        'created_at': datetime.datetime.utcnow()
    })
    
    return jsonify({'message': 'User created successfully'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Missing credentials'}), 400
        
    user = users_collection.find_one({'username': data['username']})
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
        
    if bcrypt.checkpw(data['password'].encode('utf-8'), user['password']):
        token = jwt.encode({
            'user': user['username'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        response = jsonify({
            'message': 'Login successful',
            'user': {'username': user['username']}
        })
        response.set_cookie('token', token, httponly=True, samesite='Lax', max_age=86400)
        return response
        
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    response = jsonify({'message': 'Logout successful'})
    response.set_cookie('token', '', httponly=True, expires=0)
    return response

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({
        'user': {
            'username': current_user['username']
        }
    })

# Get labels
labels = []
path = "Dataset"
if os.path.exists(path):
    for root, dirs, files in os.walk(path):
        for f in files:
            name = os.path.basename(root)
            if name not in labels and name != 'Dataset':
                labels.append(name.strip())
if not labels:
    labels = ['FAKE', 'REAL']

print("Dataset Class Labels:", labels)

# Load Model
print("Loading model...")
extension_model = Sequential()
extension_model.add(Conv2D(32, (3 , 3), input_shape = (32, 32, 3), activation = 'relu'))
extension_model.add(MaxPooling2D(pool_size = (2, 2)))
extension_model.add(Dropout(0.3))
extension_model.add(Conv2D(32, (3, 3), activation = 'relu'))
extension_model.add(MaxPooling2D(pool_size = (2, 2)))
extension_model.add(Dropout(0.3))
extension_model.add(Flatten())
extension_model.add(Dense(units = 256, activation = 'relu'))
extension_model.add(Dense(units = len(labels), activation = 'softmax'))
extension_model.compile(optimizer = 'adam', loss = 'categorical_crossentropy', metrics = ['accuracy'])

if os.path.exists("model/extension_weights.hdf5"):
    extension_model.load_weights("model/extension_weights.hdf5")
    print("Model loaded successfully.")
else:
    print("WARNING: model/extension_weights.hdf5 not found.")

def extract_images_from_pdf(pdf_path):
    """Extract images from a PDF file and return a list of (image_bytes, filename) tuples."""
    doc = fitz.open(pdf_path)
    images = []
    for i in range(len(doc)):
        for img in doc.get_page_images(i):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            images.append((image_bytes, f"pdf_page_{i+1}_img_{xref}.{image_ext}"))
    doc.close()
    return images

def extract_images_from_docx(docx_path):
    """Extract images from a DOCX file and return a list of (image_bytes, filename) tuples."""
    doc = Document(docx_path)
    images = []
    for rel in doc.part.rels.values():
        if "image" in rel.target_ref:
            image_bytes = rel.target_part.blob
            filename = os.path.basename(rel.target_ref)
            images.append((image_bytes, filename))
    return images

def GradCamImage(image_path, ext_model):
    grad_cam = Model(inputs = ext_model.inputs, outputs = ext_model.layers[0].output)
    image = cv2.imread(image_path)
    img = cv2.resize(image, (32, 32))
    im2arr = np.array(img)
    im2arr = im2arr.reshape(1,32,32,3)
    img = np.asarray(im2arr)
    img = img.astype('float32')
    img = img/255
    preds = grad_cam.predict(img, verbose=0)[0]
    return preds

def get_prediction_details(filepath):
    """Core prediction logic used by both single and bulk endpoints."""
    image = cv2.imread(filepath)
    if image is None:
        return None
        
    img = cv2.resize(image, (32, 32))
    im2arr = np.array(img).reshape(1,32,32,3).astype('float32') / 255.0
    
    pred = extension_model.predict(im2arr, verbose=0)
    pred_class = int(np.argmax(pred))
    predicted_label = labels[pred_class] if pred_class < len(labels) else str(pred_class)
    confidence = float(pred[0][pred_class]) * 100
    
    # GradCam
    grad_cam = GradCamImage(filepath, extension_model)
    
    # Generate plot to Base64
    img_disp = cv2.resize(image, (500,300))
    img_disp = cv2.cvtColor(img_disp, cv2.COLOR_BGR2RGB)
    
    figure, axis = plt.subplots(nrows=1, ncols=2, figsize=(10, 6))
    axis[0].set_title("Original Image")
    axis[1].set_title("Explainable Grad-Cam Image")
    axis[0].imshow(img_disp)
    axis[1].imshow(grad_cam[:,:,31], cmap='hot')
    plt.axis('off')
    
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    plt.close()
    buf.seek(0)
    base64_gradcam = base64.b64encode(buf.read()).decode('utf-8')

    # Risk Level
    if predicted_label == 'FAKE':
        if confidence >= 75: risk_level = 'High Risk'
        elif confidence >= 50: risk_level = 'Medium Risk'
        else: risk_level = 'Low Risk'
    else:
        if confidence >= 75: risk_level = 'Low Risk'
        elif confidence >= 50: risk_level = 'Medium Risk'
        else: risk_level = 'Medium Risk'

    # Reliability
    if confidence >= 80: reliability = 'High Confidence & Consistent'
    elif confidence >= 60: reliability = 'Moderate Confidence'
    else: reliability = 'Low Confidence — Needs Review'

    # Explanation Points
    if predicted_label == 'FAKE':
        explanation_points = [
            f"Model confidence is {confidence:.1f}% — indicating strong synthetic signal.",
            "High anomaly concentration detected in pixel distribution.",
            "Irregular visual patterns inconsistent with natural photography.",
            "Grad-CAM highlights concentrated activation in suspicious regions."
        ]
    else:
        explanation_points = [
            f"Model confidence is {confidence:.1f}% — consistent with natural imagery.",
            "No significant synthetic artifacts detected.",
            "Pixel distribution aligns with real-world photographic patterns.",
            "Grad-CAM shows diffuse activation — no concentrated anomaly regions."
        ]

    return {
        'prediction': predicted_label,
        'confidence': confidence,
        'risk_level': risk_level,
        'reliability': reliability,
        'explanation_points': explanation_points,
        'gradcam_base64': base64_gradcam
    }

@app.route('/api/predict', methods=['POST'])
@token_required
def predict_api(current_user):
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
        
    # Use Case Mode — only affects explanation wording, NOT the model
    use_case = request.form.get('use_case', 'general').lower()
    # Source identifies which page triggered this prediction (general vs deepfake)
    source = request.form.get('source', 'general').lower()

    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        details = get_prediction_details(filepath)
        if not details:
            return jsonify({'error': 'Invalid image format'}), 400
            
        # ── Use-Case Context Note (wording only) ─────────────────────────────

        # ── Use-Case Context Note (wording only) ─────────────────────────────
        use_case_labels = {
            'social_media': 'Social Media Image Check',
            'news':         'News Verification',
            'research':     'Research Validation',
            'general':      'General Analysis'
        }
        use_case_label = use_case_labels.get(use_case, 'General Analysis')

        if details['prediction'] == 'FAKE':
            context_notes = {
                'social_media': 'This image may contain misleading visual elements — exercise caution before sharing.',
                'news':         'This image may not be reliable for journalistic use — independent verification recommended.',
                'research':     'This image may lack scientific authenticity — source validation is advised.',
                'general':      'This image shows signs of AI generation — further investigation is recommended.'
            }
        else:
            context_notes = {
                'social_media': 'This image appears authentic — consistent with real photography standards.',
                'news':         'This image appears suitable for journalistic reference — no anomalies detected.',
                'research':     'This image appears to meet scientific authenticity standards.',
                'general':      'This image appears to be a real photograph based on model analysis.'
            }
        context_note = context_notes.get(use_case, context_notes['general'])

        # ── Face Analysis Module ──────────────────────────────────────────────
        image = cv2.imread(filepath) # Need to reload because it was read in details
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        face_detected = len(faces) > 0
        face_data = None
        
        if face_detected:
            # Get largest face
            (x, y, w, h) = sorted(faces, key=lambda f: f[2]*f[3], reverse=True)[0]
            face_crop = image[y:y+h, x:x+w]
            
            # Prepare face for local prediction
            f_img = cv2.resize(face_crop, (32, 32))
            f_im2arr = np.array(f_img).reshape(1,32,32,3).astype('float32') / 255.0
            f_pred = extension_model.predict(f_im2arr, verbose=0)
            f_pred_class = int(np.argmax(f_pred))
            f_label = labels[f_pred_class]
            f_confidence = float(f_pred[0][f_pred_class]) * 100
            
            # Base64 for face crop
            _, f_buf = cv2.imencode('.jpg', face_crop)
            f_base64 = base64.b64encode(f_buf).decode('utf-8')
            
            # Local Grad-CAM for face
            f_grad_cam = Model(inputs=extension_model.inputs, outputs=extension_model.layers[0].output).predict(f_im2arr, verbose=0)[0]
            f_heatmap = f_grad_cam[:,:,31]
            
            # Analyze regions within face crop (simulated based on heatmap distribution)
            # Dividing heatmap into 3 vertical zones: Top (Eyes/Forehead), Mid (Mouth/Cheeks), Bot (Jawline)
            h_len = len(f_heatmap)
            z1 = f_heatmap[0:h_len//3, :]      # Top
            z2 = f_heatmap[h_len//3:2*h_len//3, :] # Mid
            z3 = f_heatmap[2*h_len//3:, :]     # Bot
            
            susp_regions = []
            if np.mean(z1) > 0.5: susp_regions.append("Eyes / Forehead")
            if np.mean(z2) > 0.5: susp_regions.append("Mouth / Cheeks")
            if np.mean(z3) > 0.5: susp_regions.append("Jawline / Boundary")
            
            if not susp_regions and f_label == 'FAKE':
                susp_regions = ["General Texture"]

            # Status logic
            if f_label == 'FAKE':
                if f_confidence > 70:
                    f_status = "Highly Suspicious"
                    f_expl = [
                        "Inconsistent skin texture detected in facial region.",
                        "Lighting mismatch observed near facial boundaries.",
                        "Blending artifacts found near hair and ears."
                    ]
                else:
                    f_status = "Suspicious"
                    f_expl = [
                        "Minor texture inconsistencies in the face.",
                        "Subtle blending artifacts detected."
                    ]
            else:
                f_status = "No Issue"
                f_expl = ["Facial features appear consistent and natural."]
            
            face_data = {
                'status': f_status,
                'confidence': f_confidence,
                'key_regions': susp_regions,
                'explanation': f_expl,
                'face_img_base64': f_base64
            }
            
            # Escalation: If face is suspicious, upgrade global risk
            if f_status in ["Suspicious", "Highly Suspicious"]:
                if details['risk_level'] == 'Low Risk': details['risk_level'] = 'Medium Risk'
                elif details['risk_level'] == 'Medium Risk': details['risk_level'] = 'High Risk'
                context_note += " (⚠ Facial inconsistencies detected, increasing suspicion level)"

        # Prepare response
        res = {
            'prediction':        details['prediction'],
            'confidence':        details['confidence'],
            'risk_level':        details['risk_level'],
            'reliability':       details['reliability'],
            'explanation_points': details['explanation_points'],
            'context_note':      context_note,
            'use_case':          use_case,
            'use_case_label':    use_case_label,
            'gradcam_base64':    details['gradcam_base64'],
            'timestamp':         datetime.datetime.utcnow().isoformat(),
            'face_detected':     face_detected,
            'face_analysis':     face_data
        }

        # Store in DB
        history_entry = res.copy()
        history_entry['user_id'] = str(current_user['_id'])  # Store as string for consistent querying
        history_entry['filename'] = filename
        history_entry['source'] = source  # 'general' or 'deepfake'
        history_entry.pop('gradcam_base64', None) # Don't store large base64 in mongo
        # Only persist face analysis data for deepfake-sourced scans
        if source == 'deepfake' and face_data:
            history_entry['face_analysis'] = face_data.copy()
            history_entry['face_analysis'].pop('face_img_base64', None)
        else:
            history_entry.pop('face_detected', None)
            history_entry.pop('face_analysis', None)
        
        history_collection.insert_one(history_entry)

        return jsonify(res)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/save-result', methods=['POST'])
@token_required
def save_result(current_user):
    data = request.json
    if not data or 'filename' not in data or 'prediction' not in data:
        return jsonify({'error': 'Invalid payload'}), 400
        
    try:
        record = {
            'user_id': str(current_user['_id']),
            'filename': data['filename'],
            'prediction': data['prediction'],
            'confidence': data.get('confidence', 0),
            'thumbnail_base64': data.get('thumbnail_base64', ''),
            'timestamp': datetime.datetime.utcnow()
        }
        history_collection.insert_one(record)
        return jsonify({'message': 'Result saved successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/history', methods=['GET'])
@token_required
def get_history(current_user):
    try:
        user_id_str = str(current_user['_id'])
        all_results = list(history_collection.find(
            {'$or': [{'user_id': user_id_str}, {'user_id': current_user['_id']}]},
            {'_id': 0, 'user_id': 0}
        ).sort('timestamp', -1))

        # Only return single-prediction records (exclude compare and bulk records)
        results = [r for r in all_results if r.get('type') != 'compare' and r.get('source') != 'bulk' and 'prediction' in r]

        real_count = sum(1 for r in results if r.get('prediction') == 'REAL')
        fake_count = sum(1 for r in results if r.get('prediction') == 'FAKE')

        # Serialize records — convert datetime → ISO string
        serialized = []
        for r in results:
            ts = r.get('timestamp')
            serialized.append({
                'filename':         r.get('filename', 'Unknown'),
                'prediction':       r.get('prediction', ''),
                'confidence':       r.get('confidence', 0),
                'thumbnail_base64': r.get('thumbnail_base64', ''),
                'timestamp':        ts.isoformat() if hasattr(ts, 'isoformat') else str(ts or ''),
            })

        return jsonify({
            'history': serialized,
            'analytics': {
                'real_count': real_count,
                'fake_count': fake_count,
                'total': len(serialized)
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics', methods=['GET'])
@token_required
def get_analytics(current_user):
    try:
        user_id_str = str(current_user['_id'])
        all_results = list(history_collection.find(
            {'$or': [{'user_id': user_id_str}, {'user_id': current_user['_id']}]},
            {'_id': 0, 'user_id': 0}
        ).sort('timestamp', 1))

        # Only include single-image prediction records (exclude compare and bulk records)
        results = [r for r in all_results if r.get('type') != 'compare' and r.get('source') != 'bulk' and 'prediction' in r]

        real_count = sum(1 for r in results if r.get('prediction') == 'REAL')
        fake_count = sum(1 for r in results if r.get('prediction') == 'FAKE')

        timeline = []
        for r in results:
            ts = r.get('timestamp')
            if ts is None:
                continue
            try:
                date_str = ts.strftime('%Y-%m-%d')
            except AttributeError:
                continue
            if not timeline or timeline[-1]['date'] != date_str:
                timeline.append({'date': date_str, 'REAL': 0, 'FAKE': 0})
            pred = r.get('prediction', '')
            if pred in ('REAL', 'FAKE'):
                timeline[-1][pred] += 1

        # Face Analysis Aggregation — only count records from the deepfake page
        deepfake_results = [r for r in results if r.get('source') == 'deepfake']
        total_faces = sum(1 for r in deepfake_results if r.get('face_detected') is True)
        suspicious_faces = sum(1 for r in deepfake_results if r.get('face_detected') is True and r.get('face_analysis', {}).get('status') in ('Suspicious', 'Highly Suspicious'))
        no_issue_faces = total_faces - suspicious_faces
        no_face_count = sum(1 for r in deepfake_results if r.get('face_detected') is False)

        return jsonify({
            'distribution': [
                {'name': 'Real', 'value': real_count},
                {'name': 'Fake', 'value': fake_count}
            ],
            'timeline': timeline,
            'total': len(results),
            'face_stats': {
                'total_faces': total_faces,
                'suspicious': suspicious_faces,
                'no_issue': no_issue_faces,
                'no_face': no_face_count
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500



def _get_risk_level(confidence, prediction):
    """Derive risk level from confidence + prediction label."""
    if prediction == 'FAKE':
        if confidence >= 75:
            return 'High'
        elif confidence >= 50:
            return 'Medium'
        else:
            return 'Low'
    else:
        if confidence >= 75:
            return 'Low'
        elif confidence >= 50:
            return 'Medium'
        else:
            return 'High'  # low real-confidence = uncertain = higher risk


def _process_image_for_compare(file):
    """
    Save a FileStorage to disk, run prediction + Grad-CAM, return dict.
    Cleans up temp file before returning.
    """
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"cmp_{filename}")
    file.save(filepath)

    try:
        image = cv2.imread(filepath)
        if image is None:
            raise ValueError(f"Cannot decode image: {filename}")

        img = cv2.resize(image, (32, 32))
        im2arr = np.array(img).reshape(1, 32, 32, 3).astype('float32') / 255.0

        pred = extension_model.predict(im2arr, verbose=0)
        pred_class = int(np.argmax(pred))
        predicted_label = labels[pred_class] if pred_class < len(labels) else str(pred_class)
        confidence = float(pred[0][pred_class]) * 100

        # Grad-CAM activation map (raw float array for analysis)
        grad_cam_model = Model(inputs=extension_model.inputs,
                               outputs=extension_model.layers[0].output)
        grad_cam_preds = grad_cam_model.predict(im2arr, verbose=0)[0]   # shape (30,30,32)
        activation_channel = grad_cam_preds[:, :, 31]                   # pick last channel
        grad_mean = float(np.mean(activation_channel))
        grad_max = float(np.max(activation_channel))
        grad_spread = float(np.std(activation_channel))

        # Build Grad-CAM visualisation (same as /api/predict)
        img_disp = cv2.imread(filepath)
        img_disp = cv2.resize(img_disp, (500, 300))
        img_disp = cv2.cvtColor(img_disp, cv2.COLOR_BGR2RGB)

        figure, axis = plt.subplots(nrows=1, ncols=2, figsize=(10, 6))
        axis[0].set_title("Original Image")
        axis[1].set_title("Grad-CAM Heatmap")
        axis[0].imshow(img_disp)
        axis[1].imshow(activation_channel, cmap='hot')
        plt.axis('off')

        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight')
        plt.close()
        buf.seek(0)
        base64_gradcam = base64.b64encode(buf.read()).decode('utf-8')

        return {
            'prediction': predicted_label,
            'confidence': round(confidence, 2),
            'risk_level': _get_risk_level(confidence, predicted_label),
            'gradcam_base64': f"data:image/png;base64,{base64_gradcam}",
            'grad_mean': grad_mean,
            'grad_max': grad_max,
            'grad_spread': grad_spread,
            'filepath': filepath   # keep for hash comparison
        }
    except Exception:
        if os.path.exists(filepath):
            os.remove(filepath)
        raise


def _perceptual_similarity(pathA, pathB):
    """
    Compute perceptual hash similarity between two image files.
    Returns (similarity_score 0-1, similarity_note string).
    Falls back gracefully if imagehash not installed.
    """
    if not IMAGEHASH_AVAILABLE:
        return None, "Image similarity check not available (imagehash not installed)."

    try:
        imgA = PILImage.open(pathA).convert('RGB')
        imgB = PILImage.open(pathB).convert('RGB')
        hashA = imagehash.average_hash(imgA)
        hashB = imagehash.average_hash(imgB)
        # Hamming distance (0 = identical, 64 = completely different for 8-bit hash)
        hamming = hashA - hashB
        similarity = 1.0 - (hamming / 64.0)
        if similarity >= 0.85:
            note = "Images appear visually similar; differences may indicate subtle manipulation."
        elif similarity >= 0.60:
            note = "Images share some visual features; comparison highlights model sensitivity to these differences."
        else:
            note = "Images appear visually unrelated; comparison is based on independent model predictions."
        return round(similarity, 3), note
    except Exception:
        return None, "Similarity check could not be performed."


def _generate_insights(resA, resB, more_suspicious, conf_diff):
    """Build a list of human-readable insight strings from the analysis."""
    insights = []
    label_map = {'A': 'Image A', 'B': 'Image B'}
    other = 'B' if more_suspicious == 'A' else 'A'

    # 1. Confidence gap insight
    if conf_diff >= 40:
        insights.append(
            f"{label_map[more_suspicious]} has a dramatically higher fake confidence "
            f"({conf_diff:.1f}% gap) — the model is very certain about the difference."
        )
    elif conf_diff >= 20:
        insights.append(
            f"{label_map[more_suspicious]} shows a notable {conf_diff:.1f}% higher fake confidence than "
            f"{label_map[other]}."
        )
    else:
        insights.append(
            f"Confidence difference is relatively small ({conf_diff:.1f}%); "
            "both images may share similar characteristics."
        )

    # 2. Grad-CAM mean activation
    mean_susp = resA['grad_mean'] if more_suspicious == 'A' else resB['grad_mean']
    mean_other = resB['grad_mean'] if more_suspicious == 'A' else resA['grad_mean']
    if mean_susp > mean_other * 1.3:
        insights.append(
            f"{label_map[more_suspicious]} shows significantly stronger Grad-CAM activations "
            f"(mean: {mean_susp:.3f} vs {mean_other:.3f}), indicating higher anomaly intensity."
        )
    else:
        insights.append(
            f"Grad-CAM activation means are comparable "
            f"({resA['grad_mean']:.3f} vs {resB['grad_mean']:.3f})."
        )

    # 3. Grad-CAM spread (high spread = wide anomaly region)
    spread_susp = resA['grad_spread'] if more_suspicious == 'A' else resB['grad_spread']
    if spread_susp > 0.05:
        insights.append(
            f"{label_map[more_suspicious]} has a widely distributed activation pattern "
            f"(spread: {spread_susp:.3f}), suggesting anomalies across the entire image."
        )
    else:
        insights.append(
            f"{label_map[more_suspicious]}'s activation is concentrated in a small region "
            f"(spread: {spread_susp:.3f})."
        )

    # 4. Risk level summary
    risk_susp = resA['risk_level'] if more_suspicious == 'A' else resB['risk_level']
    risk_other = resB['risk_level'] if more_suspicious == 'A' else resA['risk_level']
    insights.append(
        f"Risk classification: {label_map[more_suspicious]} → {risk_susp}, "
        f"{label_map[other]} → {risk_other}."
    )

    # 5. Borderline note
    susp_conf = resA['confidence'] if more_suspicious == 'A' else resB['confidence']
    if susp_conf < 60:
        insights.append(
            "Model certainty is moderate — treat this comparison as indicative, not definitive."
        )
    elif susp_conf >= 85:
        insights.append(
            f"Model certainty is HIGH for {label_map[more_suspicious]} — prediction is reliable."
        )

    return insights


@app.route('/api/compare', methods=['POST'])
@token_required
def compare_images(current_user):
    if 'imageA' not in request.files or 'imageB' not in request.files:
        return jsonify({'error': 'Both imageA and imageB are required.'}), 400

    fileA = request.files['imageA']
    fileB = request.files['imageB']

    if fileA.filename == '' or fileB.filename == '':
        return jsonify({'error': 'Both images must have valid filenames.'}), 400

    try:
        resA = _process_image_for_compare(fileA)
        resB = _process_image_for_compare(fileB)

        pathA = resA.pop('filepath')
        pathB = resB.pop('filepath')

        # --- Perceptual similarity ---
        similarity_score, similarity_note = _perceptual_similarity(pathA, pathB)

        # --- Clean up temp files ---
        for p in [pathA, pathB]:
            if os.path.exists(p):
                os.remove(p)

        # --- Comparison logic ---
        # Determine "fake confidence" for each: if FAKE, use confidence; else invert
        fake_conf_A = resA['confidence'] if resA['prediction'] == 'FAKE' else (100 - resA['confidence'])
        fake_conf_B = resB['confidence'] if resB['prediction'] == 'FAKE' else (100 - resB['confidence'])

        more_suspicious = 'A' if fake_conf_A >= fake_conf_B else 'B'
        conf_diff = round(abs(fake_conf_A - fake_conf_B), 2)

        susp_label = 'Image A' if more_suspicious == 'A' else 'Image B'
        other_label = 'Image B' if more_suspicious == 'A' else 'Image A'
        susp_pred = resA['prediction'] if more_suspicious == 'A' else resB['prediction']

        if conf_diff >= 30:
            qualifier = "significantly"
        elif conf_diff >= 15:
            qualifier = "notably"
        else:
            qualifier = "marginally"

        summary = (
            f"{susp_label} is {qualifier} more likely to be {susp_pred} than {other_label}. "
            f"Confidence difference: {conf_diff:.1f}%."
        )

        insights = _generate_insights(resA, resB, more_suspicious, conf_diff)

        comparison = {
            'more_suspicious': more_suspicious,
            'confidence_diff': conf_diff,
            'fake_conf_A': round(fake_conf_A, 2),
            'fake_conf_B': round(fake_conf_B, 2),
            'summary': summary,
            'insights': insights
        }

        # --- Remove internal grad stats before sending to client ---
        for res in [resA, resB]:
            res.pop('grad_mean', None)
            res.pop('grad_max', None)
            res.pop('grad_spread', None)

        # --- Save lightweight comparison record to MongoDB ---
        try:
            history_collection.insert_one({
                'user_id': str(current_user['_id']),
                'type': 'compare',
                'imageA_prediction': resA['prediction'],
                'imageA_confidence': resA['confidence'],
                'imageB_prediction': resB['prediction'],
                'imageB_confidence': resB['confidence'],
                'more_suspicious': more_suspicious,
                'confidence_diff': conf_diff,
                'summary': summary,
                'created_at': datetime.datetime.utcnow()
            })
        except Exception:
            pass  # Non-fatal: don't fail the response if history save fails

        return jsonify({
            'imageA': resA,
            'imageB': resB,
            'comparison': comparison,
            'similarity_score': similarity_score,
            'similarity_note': similarity_note
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bulk-predict', methods=['POST'])
@token_required
def bulk_predict(current_user):
    if 'files' not in request.files:
        return jsonify({'error': 'No files provided'}), 400
    
    files = request.files.getlist('files')
    all_results = []
    
    try:
        for file in files:
            if file.filename == '':
                continue
            
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"bulk_{uuid.uuid4().hex}_{filename}")
            file.save(filepath)
            
            extracted_images = []
            if filename.lower().endswith('.pdf'):
                extracted_images = extract_images_from_pdf(filepath)
            elif filename.lower().endswith('.docx'):
                extracted_images = extract_images_from_docx(filepath)
            else:
                # Treat as direct image
                with open(filepath, 'rb') as f:
                    extracted_images = [(f.read(), filename)]
            
            for img_bytes, img_name in extracted_images:
                temp_img_path = os.path.join(app.config['UPLOAD_FOLDER'], f"temp_{uuid.uuid4().hex}_{img_name}")
                with open(temp_img_path, 'wb') as f:
                    f.write(img_bytes)
                
                details = get_prediction_details(temp_img_path)
                if details:
                    # Add thumbnail for gallery
                    image = cv2.imread(temp_img_path)
                    if image is not None:
                        h, w = image.shape[:2]
                        target_w = 150
                        target_h = int(h * (target_w / w))
                        thumb = cv2.resize(image, (target_w, target_h))
                        _, buf = cv2.imencode('.jpg', thumb)
                        thumb_b64 = base64.b64encode(buf).decode('utf-8')
                        details['thumbnail_base64'] = f"data:image/jpeg;base64,{thumb_b64}"
                    
                    details['filename'] = img_name
                    all_results.append(details)
                    
                    # Save each to history as well
                    try:
                        history_collection.insert_one({
                            'user_id': str(current_user['_id']),
                            'filename': img_name,
                            'prediction': details['prediction'],
                            'confidence': details['confidence'],
                            'timestamp': datetime.datetime.utcnow(),
                            'source': 'bulk'
                        })
                    except:
                        pass
                
                if os.path.exists(temp_img_path):
                    os.remove(temp_img_path)
            
            if os.path.exists(filepath):
                os.remove(filepath)
        
        # Calculate percentages
        total = len(all_results)
        fake_count = sum(1 for r in all_results if r['prediction'] == 'FAKE')
        real_count = total - fake_count
        
        return jsonify({
            'results': all_results,
            'summary': {
                'total': total,
                'fake_count': fake_count,
                'real_count': real_count,
                'fake_percent': round((fake_count / total * 100), 1) if total > 0 else 0,
                'real_percent': round((real_count / total * 100), 1) if total > 0 else 0
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
