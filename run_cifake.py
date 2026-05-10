#!/usr/bin/env python
"""
CIFAKE Image Classification - Standalone Script
Run this instead of using Jupyter: python run_cifake.py
"""

import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import cv2
import numpy as np
import pickle
from sklearn.metrics import precision_score, recall_score, f1_score, accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt   
from sklearn.metrics import roc_curve, roc_auc_score
from sklearn import metrics
import keras
from keras.utils import to_categorical
from keras.layers import MaxPooling2D, Dense, Dropout, Activation, Flatten, Conv2D
from keras.models import Sequential, load_model, Model
from keras.callbacks import ModelCheckpoint
import tensorflow as tf

print("✓ All imports successful!")

# Define and load class labels
path = "Dataset"
labels = []
X = []
Y = []

print("\nLoading dataset...")
for root, dirs, directory in os.walk(path):
    for j in range(len(directory)):
        name = os.path.basename(root)
        if name not in labels:
            labels.append(name.strip())   

print("Dataset Class Labels: " + str(labels))

# Define function to get class label
def getLabel(name):
    index = -1
    for i in range(len(labels)):
        if labels[i] == name:
            index = i
            break
    return index

# Load dataset images
if os.path.exists("model/X.txt.npy"):
    print("Loading cached images...")
    X = np.load('model/X.txt.npy')
    Y = np.load('model/Y.txt.npy')
else:
    print("Processing dataset images...")
    for root, dirs, directory in os.walk(path):
        for j in range(len(directory)):
            name = os.path.basename(root)
            if 'Thumbs.db' not in directory[j]:
                img = cv2.imread(root+"/"+directory[j])
                img = cv2.resize(img, (32, 32))
                X.append(img)
                label = getLabel(name)
                Y.append(label)
    X = np.asarray(X)
    Y = np.asarray(Y)
    np.save('model/X.txt', X)
    np.save('model/Y.txt', Y)

print("Dataset images loaded")
print("Total images: " + str(X.shape[0]))

# Preprocess
print("\nPreprocessing images...")
X = X.astype('float32')
X = X/255
indices = np.arange(X.shape[0])
np.random.shuffle(indices)
X = X[indices]
Y = Y[indices]
Y = to_categorical(Y)

X_train, X_test, y_train, y_test = train_test_split(X, Y, test_size=0.2)
print("Train images: " + str(X_train.shape[0]))
print("Test images: " + str(X_test.shape[0]))

# Plot class distribution
print("\nGenerating visualizations...")
names, count = np.unique(np.argmax(Y, axis=1), return_counts=True)
plt.figure(figsize=(6, 3))
plt.bar(names, count)
plt.xticks(names, labels)
plt.xlabel("Dataset Class Label")
plt.ylabel("Count")
plt.title("Class Distribution")
plt.savefig('class_distribution.png')
print("✓ Saved: class_distribution.png")

print("\nSetup complete! Ready to train models.")

# Define metrics calculation function
accuracy = []
precision = []
recall = []
fscore = []

def calculateMetrics(algorithm, testY, predict):
    p = precision_score(testY, predict, average='macro') * 100
    r = recall_score(testY, predict, average='macro') * 100
    f = f1_score(testY, predict, average='macro') * 100
    a = accuracy_score(testY, predict) * 100
    accuracy.append(a)
    precision.append(p)
    recall.append(r)
    fscore.append(f)
    print(f"\n{algorithm} Results:")
    print(f"  Accuracy:  {a:.2f}%")
    print(f"  Precision: {p:.2f}%")
    print(f"  Recall:    {r:.2f}%")
    print(f"  F-Score:   {f:.2f}%")

# Train CNN model
print("\n" + "="*60)
print("TRAINING CNN MODEL")
print("="*60)

cnn_model = Sequential()
cnn_model.add(Conv2D(32, (3, 3), input_shape=(X_train.shape[1], X_train.shape[2], X_train.shape[3]), activation='relu'))
cnn_model.add(MaxPooling2D(pool_size=(2, 2)))
cnn_model.add(Conv2D(32, (3, 3), activation='relu'))
cnn_model.add(MaxPooling2D(pool_size=(2, 2)))
cnn_model.add(Flatten())
cnn_model.add(Dense(units=256, activation='relu'))
cnn_model.add(Dense(units=y_train.shape[1], activation='softmax'))

cnn_model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

if not os.path.exists("model/cnn_weights.hdf5"):
    print("Training CNN (this may take a few minutes)...")
    model_check_point = ModelCheckpoint(filepath='model/cnn_weights.hdf5', verbose=0, save_best_only=True)
    hist = cnn_model.fit(X_train, y_train, batch_size=32, epochs=15, validation_data=(X_test, y_test), callbacks=[model_check_point], verbose=1)
    with open('model/cnn_history.pckl', 'wb') as f:
        pickle.dump(hist.history, f)
    print("✓ CNN training complete!")
else:
    print("Loading pre-trained CNN weights...")
    cnn_model.load_weights("model/cnn_weights.hdf5")

predict = cnn_model.predict(X_test, verbose=0)
predict = np.argmax(predict, axis=1)
y_test_labels = np.argmax(y_test, axis=1)
calculateMetrics("CNN Model", y_test_labels, predict)

# Train Extended CNN model with Dropout
print("\n" + "="*60)
print("TRAINING EXTENDED CNN MODEL (with Dropout)")
print("="*60)

extension_model = Sequential()
extension_model.add(Conv2D(32, (3, 3), input_shape=(X_train.shape[1], X_train.shape[2], X_train.shape[3]), activation='relu'))
extension_model.add(MaxPooling2D(pool_size=(2, 2)))
extension_model.add(Dropout(0.3))
extension_model.add(Conv2D(32, (3, 3), activation='relu'))
extension_model.add(MaxPooling2D(pool_size=(2, 2)))
extension_model.add(Dropout(0.3))
extension_model.add(Flatten())
extension_model.add(Dense(units=256, activation='relu'))
extension_model.add(Dense(units=y_train.shape[1], activation='softmax'))

extension_model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

if not os.path.exists("model/extension_weights.hdf5"):
    print("Training Extended CNN (this may take a few minutes)...")
    model_check_point = ModelCheckpoint(filepath='model/extension_weights.hdf5', verbose=0, save_best_only=True)
    hist = extension_model.fit(X_train, y_train, batch_size=32, epochs=15, validation_data=(X_test, y_test), callbacks=[model_check_point], verbose=1)
    with open('model/extension_history.pckl', 'wb') as f:
        pickle.dump(hist.history, f)
    print("✓ Extended CNN training complete!")
else:
    print("Loading pre-trained Extended CNN weights...")
    extension_model.load_weights("model/extension_weights.hdf5")

predict = extension_model.predict(X_test, verbose=0)
predict = np.argmax(predict, axis=1)
calculateMetrics("Extended CNN (with Dropout)", y_test_labels, predict)

# Summary
print("\n" + "="*60)
print("TRAINING SUMMARY")
print("="*60)
print(f"{'Model':<30} {'Accuracy':<12} {'Precision':<12} {'Recall':<12} {'F-Score':<12}")
print("-"*78)
print(f"{'CNN Model':<30} {accuracy[0]:<12.2f} {precision[0]:<12.2f} {recall[0]:<12.2f} {fscore[0]:<12.2f}")
print(f"{'Extended CNN (Dropout)':<30} {accuracy[1]:<12.2f} {precision[1]:<12.2f} {recall[1]:<12.2f} {fscore[1]:<12.2f}")
print("="*78)
print("\n✓ All training complete! Models saved in 'model/' folder.")
