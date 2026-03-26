from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Load model, encoder, metadata
print("Loading model and metadata...")
model = joblib.load('model.pkl')
label_encoder = joblib.load('encoder.pkl')
metadata = joblib.load('metadata.pkl')
feature_cols = metadata['feature_cols']
cat_cols = metadata['cat_cols']
num_cols = metadata['num_cols']

print("Loaded features:", feature_cols)
print("API ready!")

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        
        # Extract input
        symptoms_input = data.get('symptoms', [])  # ["Fever", "Cough"]
        age = data.get('age')
        gender = data.get('gender')
        
        # Create input DataFrame with same columns as training
        input_data = {}
        for col in feature_cols:
            input_data[col] = 'No'  # Default No for symptoms
        
        # Set symptoms to Yes (input is list of symptom names)
        for symptom in symptoms_input:
            symptom = symptom.strip().title()  # Normalize: "fever" -> "Fever"
            if symptom in feature_cols:
                input_data[symptom] = 'Yes'
        
        # Set patient data if provided
        if age is not None:
            input_data['Age'] = int(age)
        if gender:
            input_data['Gender'] = gender.title()
        
        # Fill missing with proper defaults
        for col in feature_cols:
            if col not in input_data:
                if col == 'Age':
                    input_data[col] = 30
                elif col == 'Gender':
                    input_data[col] = 'Male'
                elif col == 'Blood Pressure':
                    input_data[col] = 'Normal'
                elif col == 'Cholesterol Level':
                    input_data[col] = 'Normal'
                else:
                    input_data[col] = 'No'
        
        df_input = pd.DataFrame([input_data])
        print("Input data:", df_input[feature_cols].to_dict('records'))
        
        # Predict
        prediction = model.predict(df_input)[0]
        probabilities = model.predict_proba(df_input)[0]
        
        # Top 3 predictions
        top_indices = np.argsort(probabilities)[::-1][:3]
        predictions = []
        for idx in top_indices:
            disease = label_encoder.inverse_transform([idx])[0]
            conf = probabilities[idx]
            predictions.append({'disease': disease, 'confidence': float(conf)})
        
        return jsonify({
            'predictions': predictions,
            'top_prediction': predictions[0]['disease'],
            'disclaimer': 'This is not medical advice. Consult a doctor.'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/')
def home():
    return jsonify({'message': 'Health Guard AI API - POST to /predict'})

if __name__ == '__main__':
    app.run(debug=True)
