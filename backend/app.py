import os
import json
from flask import Flask, jsonify, request
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

READINGS_DIR = 'readings'
USER_DATA_FILE = os.path.join('usersdata', 'user_performance.json')

def get_user_performance():
    """Reads user performance data from the JSON file."""
    if not os.path.exists(USER_DATA_FILE):
        return {"completed_readings": []}
    with open(USER_DATA_FILE, 'r') as f:
        # Handle empty file case
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {"completed_readings": []}

def save_user_performance(data):
    """Saves user performance data to the JSON file."""
    with open(USER_DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

def parse_reading_id(reading_id):
    """Parses a reading_id (e.g., 'a1_1') into level and key."""
    parts = reading_id.split('_')
    level = parts[0]
    key = parts[1]
    return level, key

@app.route('/api/reading/<level>', methods=['GET'])
def get_reading(level):
    """Gets an unread reading passage for the specified level."""
    level_file = os.path.join(READINGS_DIR, f"{level}.json")
    if not os.path.exists(level_file):
        return jsonify({"error": "Invalid level"}), 404

    with open(level_file, 'r', encoding='utf-8') as f:
        all_readings_for_level = json.load(f)

    user_performance = get_user_performance()
    completed_readings = user_performance.get("completed_readings", [])

    # Create full reading IDs (e.g., 'a1_1', 'a1_2')
    possible_reading_ids = [f"{level}_{key}" for key in all_readings_for_level.keys()]
    
    # Find which IDs the user has not completed yet
    unread_ids = [rid for rid in possible_reading_ids if rid not in completed_readings]

    if not unread_ids:
        return jsonify({"message": "You have completed all readings for this level!"})

    selected_id = random.choice(unread_ids)
    _, selected_key = parse_reading_id(selected_id)
    
    reading_data = all_readings_for_level[selected_key]

    return jsonify({
        "id": selected_id, # e.g., "a1_1"
        "title": reading_data["title"],
        "text": reading_data["text"]
    })

@app.route('/api/questions/<reading_id>', methods=['GET'])
def get_questions(reading_id):
    """Gets the questions for a specific reading passage."""
    try:
        level, key = parse_reading_id(reading_id)
    except IndexError:
        return jsonify({"error": "Invalid reading ID format"}), 400

    level_file = os.path.join(READINGS_DIR, f"{level}.json")
    if not os.path.exists(level_file):
        return jsonify({"error": "Reading not found"}), 404

    with open(level_file, 'r', encoding='utf-8') as f:
        all_readings_for_level = json.load(f)
    
    reading_data = all_readings_for_level.get(key)
    if not reading_data:
        return jsonify({"error": "Reading key not found in level file"}), 404

    questions = reading_data.get("questions", [])
    vocabulary = reading_data.get("vocabulary", [])
    all_questions = questions + vocabulary

    # Remove the answers before sending to the frontend
    for q in all_questions:
        if 'answer' in q:
            del q['answer']

    return jsonify(all_questions)


@app.route('/api/submit', methods=['POST'])
def submit_answers():
    """Submits user answers and saves the performance."""
    submission = request.get_json()
    reading_id = submission.get('readingId')
    user_answers = submission.get('answers')

    try:
        level, key = parse_reading_id(reading_id)
    except IndexError:
        return jsonify({"error": "Invalid reading ID format"}), 400
    
    level_file = os.path.join(READINGS_DIR, f"{level}.json")
    if not os.path.exists(level_file):
        return jsonify({"error": "Reading not found"}), 404

    with open(level_file, 'r', encoding='utf-8') as f:
        all_readings_for_level = json.load(f)

    reading_data = all_readings_for_level.get(key)
    if not reading_data:
        return jsonify({"error": "Reading key not found in level file"}), 404

    all_questions = reading_data.get("questions", []) + reading_data.get("vocabulary", [])
    correct_answers = {str(q['id']): q['answer'] for q in all_questions}

    score = 0
    results = {}
    for question_id, user_answer in user_answers.items():
        is_correct = user_answer == correct_answers.get(question_id)
        if is_correct:
            score += 1
        results[question_id] = {
            "user_answer": user_answer,
            "correct_answer": correct_answers.get(question_id),
            "is_correct": is_correct
        }

    user_performance = get_user_performance()
    if reading_id not in user_performance.get("completed_readings", []):
        user_performance.setdefault("completed_readings", []).append(reading_id)

    performance_entry = {
        "reading_id": reading_id,
        "score": score,
        "total_questions": len(all_questions),
        "results": results,
    }
    
    user_performance.setdefault("performance", []).append(performance_entry)
    save_user_performance(user_performance)

    return jsonify({"message": "Submission successful!", "score": score, "total": len(all_questions), "results": results})


if __name__ == '__main__':
    app.run(debug=True)