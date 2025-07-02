#!/usr/bin/env python3
"""
Script to create a test user for development
"""
import uuid
from models.database import SessionLocal, User
from auth.auth_handler import auth_handler

def create_test_user():
    db = SessionLocal()
    try:
        # Check if test user already exists
        existing_user = db.query(User).filter(User.email == "test@example.com").first()
        if existing_user:
            print(f"Test user already exists: {existing_user.email}")
            return existing_user.id
        
        # Create test user
        test_user = User(
            id=str(uuid.uuid4()),
            email="test@example.com",
            full_name="Test User",
            hashed_password=auth_handler.get_password_hash("testpassword123"),
            is_active=True,
            is_verified=True,
            roles=["user"]
        )
        
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print(f"Created test user: {test_user.email} (ID: {test_user.id})")
        return test_user.id
        
    except Exception as e:
        print(f"Error creating test user: {e}")
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user() 