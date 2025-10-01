#!/usr/bin/env python3
"""
Script to reset the database - drops all tables and recreates them.
Use this after changing models.
"""
from app import create_app, db

app = create_app()

with app.app_context():
    print("Dropping all tables...")
    db.drop_all()
    print("Creating all tables...")
    db.create_all()
    print("Database reset complete!")
