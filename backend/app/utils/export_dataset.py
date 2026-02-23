import json
import os
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.fine_tune_data import FineTuneData

def export_to_jsonl(output_file: str, format: str = "alpaca"):
    db = SessionLocal()
    records = db.query(FineTuneData).all()
    
    dataset = []
    for record in records:
        if format == "alpaca":
            dataset.append({
                "instruction": record.prompt,
                "input": "",
                "output": record.completion
            })
        elif format == "sharegpt":
            dataset.append({
                "conversations": [
                    {"from": "human", "value": record.prompt},
                    {"from": "gpt", "value": record.completion}
                ]
            })
        else: # Default raw
            dataset.append({
                "prompt": record.prompt,
                "completion": record.completion,
                "agent": record.agent_role,
                "score": record.score
            })
            
    with open(output_file, 'w') as f:
        for entry in dataset:
            f.write(json.dumps(entry) + '\n')
            
    print(f"Exported {len(dataset)} records to {output_file} in {format} format.")
    db.close()

if __name__ == "__main__":
    export_to_jsonl("editorial_dataset.jsonl", format="alpaca")
