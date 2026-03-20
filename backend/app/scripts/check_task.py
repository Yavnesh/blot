import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from app.models.task_progress import TaskProgress

def check_status(task_id):
    db = SessionLocal()
    try:
        task = db.query(TaskProgress).filter(TaskProgress.task_id == task_id).first()
        if not task:
            print(f"Task {task_id} not found.")
            return
            
        print(f"Task: {task.task_id}")
        print(f"Topic: {task.topic}")
        print(f"Status: {task.status}")
        print(f"Current Step: {task.current_step}")
        print("Steps:")
        for s in task.steps:
            print(f"  - {s['name']}: {s['status']}")
            
        print("\nLast 3 Logs:")
        for log in task.logs[-3:]:
             print(f"  - Agent: {log['agent_name']}, Status: {log['status']}, Error: {log.get('error')}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        check_status(sys.argv[1])
    else:
        print("Please provide a task_id")
