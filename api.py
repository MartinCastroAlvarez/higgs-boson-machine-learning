import os
from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from tensorflow.keras.models import load_model
from flask_cors import CORS

MODEL = os.environ.get('MODEL', 'model.h5')
STATS = os.environ.get('STATS', 'stats.csv')

if not os.path.isfile(MODEL):
    raise ValueError(f'Invalid Keras model: {MODEL}')
if not os.path.isfile(STATS):
    raise ValueError(f'Invalid stats CSV: {STATS}')

# Loading Keras model and stats DataFrame.
model = load_model(MODEL)
stats = pd.read_csv(STATS)

app = Flask(__name__)
CORS(app, resources={r"/v1/*": {"origins": "*"}})


def get_events():
    events = request.get_json(force=True).get('events', [])
    for index, event in enumerate(events):
        for _, row in stats.iterrows():
            key = row[0]
            if key != 'signal':
                if key not in event:
                    return jsonify({"error": f"Missing '{key}' at #{index}"}), 400
                value = float(event[key])
                if value > row.Max:
                    return jsonify({"error": f"Value of '{key}' at #{index} is too high: {row.Max}"}), 400
                if value < row.Min:
                    return jsonify({"error": f"Value of '{key}' at #{index} is too low: {row.Min}"}), 400
                event[key] = (value - row.Mean) / row.Std
    return events


@app.route('/v1/schema', methods=['GET'])
def schema():
    try:
        return jsonify({
            row[0]: {
                'min': row.Min,
                'max': row.Max,
                'std': row.Std,
                'mean': row.Mean,
            }
            for index, row in stats.iterrows()
            if row[0] != 'signal'
        })
    except Exception as error:
        return jsonify({'error': str(error)}), 400


@app.route('/v1/predict', methods=['POST'])
def predict():
    try:
        events = get_events()
        X_pred = pd.DataFrame(events, index=[0])
        print(X_pred)
        y_pred = model.predict(X_pred)
        return jsonify({
            'prediction': y_pred.tolist()
        })
    except Exception as error:
        return jsonify({'error': str(error)}), 400


if __name__ == '__main__':
    app.run(debug=True, port=10000)
