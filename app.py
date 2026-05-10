import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import cv2
import numpy as np
import matplotlib
matplotlib.use('Agg') # required for headless saving
import matplotlib.pyplot as plt
from flask import Flask, render_template, request, redirect, url_for, session, send_from_directory
from werkzeug.utils import secure_filename
from keras.models import Sequential, Model
from keras.layers import Conv2D, MaxPooling2D, Dropout, Flatten, Dense
import tensorflow as tf

app = Flask(__name__)
app.secret_key = 'welcome'

# Setup path for uploads
UPLOAD_FOLDER = 'static/uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Get labels exactly as in the notebook
labels = []
path = "Dataset"
if os.path.exists(path):
    for root, dirs, files in os.walk(path):
        for f in files:
            name = os.path.basename(root)
            if name not in labels and name != 'Dataset':
                labels.append(name.strip())
if not labels:
    labels = ['FAKE', 'REAL'] # fallback

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

# Load weights if exist
if os.path.exists("model/extension_weights.hdf5"):
    extension_model.load_weights("model/extension_weights.hdf5")
    print("Model loaded successfully.")
else:
    print("WARNING: model/extension_weights.hdf5 not found. Please run run_cifake.py first to train.")

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

@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html')

@app.route('/AdminLogin')
def admin_login():
    return render_template('AdminLogin.html', msg='')

@app.route('/AdminLoginAction', methods=['POST'])
def admin_login_action():
    user = request.form['t1']
    pwd = request.form['t2']
    if user == 'admin' and pwd == 'admin':
        return redirect(url_for('predict'))
    else:
        return render_template('AdminLogin.html', msg='Invalid Login Credentials!')

@app.route('/Predict')
def predict():
    return render_template('Predict.html', msg='')

@app.route('/PredictAction', methods=['POST'])
def predict_action():
    if 't1' not in request.files:
        return render_template('Predict.html', msg='No file uploaded.')
    
    file = request.files['t1']
    if file.filename == '':
        return render_template('Predict.html', msg='No file selected.')
        
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Predict
        image = cv2.imread(filepath)
        img = cv2.resize(image, (32, 32))
        im2arr = np.array(img)
        im2arr = im2arr.reshape(1,32,32,3)
        img_model = np.asarray(im2arr)
        img_model = img_model.astype('float32')
        img_model = img_model/255
        
        pred = extension_model.predict(img_model, verbose=0)
        pred_class = np.argmax(pred)
        predicted_label = labels[pred_class] if pred_class < len(labels) else str(pred_class)
        
        # GradCam
        grad_cam = GradCamImage(filepath, extension_model)
        
        # Save output image
        img_disp = cv2.imread(filepath)
        img_disp = cv2.resize(img_disp, (500,300))
        img_disp = cv2.cvtColor(img_disp, cv2.COLOR_BGR2RGB)
        
        figure, axis = plt.subplots(nrows=1, ncols=2, figsize=(10, 6))
        axis[0].set_title("Original Image")
        axis[1].set_title("Explainable Grad-Cam Image")
        axis[0].imshow(img_disp)
        axis[1].imshow(grad_cam[:,:,31], cmap='hot')
        plt.axis('off')
        
        result_filename = f"result_{filename}.png"
        result_path = os.path.join('static', result_filename)
        plt.savefig(result_path)
        plt.close()
        
        msg = f"<h2>Predicted As : {predicted_label}</h2><br/><img src='{url_for('static', filename=result_filename)}' width='800'>"
        return render_template('Predict.html', msg=msg)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
