# app/config.py
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-for-llm-benchmark'
    # Add other configuration settings as needed
