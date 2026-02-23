# Tews CRM - Django to FastAPI Migration

This project is a migration of the original Tews CRM from Django to a modern FastAPI backend with a React frontend.

## Project Structure
- `backend/`: FastAPI application using Clean Architecture.
- `frontend/`: React application using Vite and Tailwind CSS.

---

## 🚀 Getting Started

### 1. Backend Setup (FastAPI)

1.  **Navigate to backend**:
    ```bash
    cd backend
    ```
2.  **Create and activate virtual environment**:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```
3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
4.  **Configure Environment**:
    Update `app/core/config.py` with your API keys:
    - `GEMINI_API_KEY_1-3`
    - `STABLE_HORDE_API_KEY`
    - `TWITTER_API_KEYS`
5.  **Run the server**:
    ```bash
    python3 -m uvicorn app.main:app --reload --port 8000
    ```

**API Documentation**:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- Redoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### 2. Frontend Setup (React)

1.  **Navigate to frontend**:
    ```bash
    cd frontend
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Run the development server**:
    ```bash
    npm run dev
    ```
4.  **Access the app**: [http://localhost:5173](http://localhost:5173)

---

## ✅ Verification & Testing

### Backend CRUD Test
Run the automated verification script to ensure the API and database are working:
```bash
cd backend
python3 verify_api.py
```

### Blog Generation Pipeline
You can trigger the full blog generation pipeline manually:
1. Open [http://localhost:8000/docs](http://localhost:8000/docs)
2. Locate the **generation** section.
3. Use the `POST /api/v1/generation/trigger` endpoint with a `limit` of 2 or 5.
4. Monitor logs in the terminal to see progress (Trends -> Scraping -> LLM Generation -> Image Generation).
