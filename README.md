# CarMate AI — Indian New Car Buying Assistant

College Assignment 3: AI Chatbot using Prompt Engineering, LLM integration and an existing dataset.

## What's included
- Six original Parquet files from `bhavabhuthi/tco-india` supplied by the student (CC BY 4.0 dataset; review the source license before redistribution).
- Python Flask backend and responsive HTML/CSS/JS chatbot.
- Dataset loading and relationships via DuckDB, with a schema inspection endpoint.
- Filtering for budget, fuel, transmission, body type, and city where columns exist.
- Gemini API for context-aware answers and optional Google Search grounding.
- Session conversation history, new chat button, and input/API error handling.
- Dataset age warnings and optional source links for grounded web results.

## Setup (Windows, VS Code)
1. Install Python 3.11+.
2. Extract this ZIP, open the `CarMate_AI_2026` folder in VS Code.
3. Open the VS Code terminal and run:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

For Git Bash, activate with `source .venv/Scripts/activate`.

4. Copy `.env.example` to `.env` and replace `PASTE_YOUR_API_KEY_HERE` with your **private** Gemini API key from https://aistudio.google.com/apikey. Do not upload `.env` to GitHub.
5. Run `python app.py` and open http://127.0.0.1:5000.
6. Check http://127.0.0.1:5000/api/status for dataset readiness, and http://127.0.0.1:5000/api/schema for actual columns.

## Important dataset compatibility note
This project includes the exact original uploaded Parquet files. The runtime loader uses conservative schema discovery and explicit joins by brand/model/variant/city IDs. **The file schemas have not been executed/verified in the author's environment** because the Parquet runtime dependency could not be installed here. If `/api/status` shows `Dataset relationship columns not recognized`, send the JSON from `/api/schema` for a precise mapping fix. Do not assume successful loading until tested on your machine.

The loader searches conventional columns (`brand_id`, `model_id`, `variant_id`, etc.) and does not fabricate data. Price column units and price dates must be checked before claiming prices are in INR or current. Model upload dates are not price effective dates. The source dataset may contain historical entries.

## Test cases for assignment
1. "I want a petrol automatic car under 15 lakh in Bhopal."
2. "Which of those has better mileage?"
3. "Compare the available Tata and Hyundai SUVs."
4. "Show me electric cars for city driving."
5. "What is the current ex-showroom price?" (turn on live search and verify sources)
6. Send an empty question (should be rejected).
7. Remove the API key temporarily (should return a clear setup error).
8. Ask for an impossible budget (should explain no matches).

## Architecture
User → Flask → structured filters → Parquet joins (DuckDB) → candidate records → system prompt + Gemini API → response. When opted in, Gemini can use Google Search grounding (subject to model support, limits, billing, and availability).

## Limitations
- This is a **dataset-grounded LLM assistant**, not a trained price-prediction model.
- The built-in budget parser handles phrases such as `under 15 lakh` but not every possible wording.
- The exact dataset schema and data quality still need verification on a machine with DuckDB.
- Google Search grounding does not guarantee real-time accuracy or official dealership quotes.
- For real-world deployment add persistent sessions, API rate limits, authentication and stronger privacy/security protections.


## Saved chats (browser storage)
Chats save automatically in the current browser using localStorage. The sidebar supports new chat, search, rename, delete and reopening conversations. The last 12 turns of the active chat are sent with each message to preserve conversation context. Chats are not synced across devices and are lost if site storage is cleared or the browser is in private mode. No login or database is required.
