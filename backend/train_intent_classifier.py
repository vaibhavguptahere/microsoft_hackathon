import os
import json
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.multiclass import OneVsRestClassifier
from sklearn.preprocessing import MultiLabelBinarizer

# Canonical intents from classifier.py
INTENTS = {
    "HR": [
        "leave_balance", "leave_request", "work_from_home", "attendance",
        "payroll", "employee_benefits", "onboarding", "offboarding",
        "resignation", "compensatory_off", "hr_policy", "performance_review",
    ],
    "IT": [
        "vpn_troubleshooting", "password_reset", "account_access",
        "laptop_request", "network_issue", "email_issue", "software_access",
        "hardware_request", "device_setup", "it_policy",
    ],
    "FINANCE": [
        "travel_reimbursement", "expense_reimbursement", "payment_status",
        "invoice_submission", "purchase_approval", "corporate_card",
        "budget_query", "receipt_submission",
    ],
}

# Generate synthetic training data
# Format: (query, [list_of_intents])
# Intents are formatted as "DOMAIN/intent_name"
TRAIN_DATA = [
    # HR
    ("How many leaves do I have left?", ["HR/leave_balance"]),
    ("I want to apply for sick leave tomorrow", ["HR/leave_request"]),
    ("Can I work from home next week?", ["HR/work_from_home"]),
    ("My attendance is not marked correctly", ["HR/attendance"]),
    ("When will the salary be credited?", ["HR/payroll"]),
    ("What are my health insurance benefits?", ["HR/employee_benefits"]),
    ("I am a new joiner, what is the onboarding process?", ["HR/onboarding"]),
    ("I want to resign from the company", ["HR/resignation"]),
    ("What is the policy for comp off?", ["HR/compensatory_off"]),
    ("Tell me about the HR policies", ["HR/hr_policy"]),
    ("How does the performance review work?", ["HR/performance_review"]),
    
    # IT
    ("My VPN is not connecting", ["IT/vpn_troubleshooting"]),
    ("I forgot my password and need to reset it", ["IT/password_reset"]),
    ("I cannot access my email account", ["IT/account_access", "IT/email_issue"]),
    ("I need a new laptop for my work", ["IT/laptop_request"]),
    ("The wifi is very slow in the office", ["IT/network_issue"]),
    ("My outlook is not syncing", ["IT/email_issue"]),
    ("I need access to Adobe Creative Cloud", ["IT/software_access"]),
    ("Requesting a new mouse and keyboard", ["IT/hardware_request"]),
    ("How do I set up my new device?", ["IT/device_setup"]),
    ("What is the IT security policy?", ["IT/it_policy"]),
    
    # FINANCE
    ("How do I get reimbursement for my business trip?", ["FINANCE/travel_reimbursement"]),
    ("I want to claim my internet expense", ["FINANCE/expense_reimbursement"]),
    ("Has my payment been processed yet?", ["FINANCE/payment_status"]),
    ("Where do I submit the vendor invoice?", ["FINANCE/invoice_submission"]),
    ("Need approval for purchasing a software license", ["FINANCE/purchase_approval"]),
    ("How do I apply for a corporate credit card?", ["FINANCE/corporate_card"]),
    ("What is the budget for our team this quarter?", ["FINANCE/budget_query"]),
    ("Here are the receipts for yesterday's team lunch", ["FINANCE/receipt_submission"]),
    
    # MULTI-INTENT (HR + IT)
    ("My VPN is down and I want to work from home today", ["IT/vpn_troubleshooting", "HR/work_from_home"]),
    ("I am a new joiner, need a laptop and onboarding details", ["IT/laptop_request", "HR/onboarding"]),
    ("I resigned, how do I return my laptop?", ["HR/resignation", "IT/laptop_request"]),
    
    # MULTI-INTENT (IT + FINANCE)
    ("I need to buy a new software and expense it", ["IT/software_access", "FINANCE/expense_reimbursement"]),
    ("My corporate card is blocked and I cannot login to the portal", ["FINANCE/corporate_card", "IT/account_access"]),
    
    # MULTI-INTENT (HR + FINANCE)
    ("I need to travel for a conference, how does the policy work for expenses and leaves?", ["FINANCE/travel_reimbursement", "HR/hr_policy"]),
    ("Can I get my payslip and check my travel reimbursement status?", ["HR/payroll", "FINANCE/payment_status"]),
    
    # MULTI-INTENT (HR + IT + FINANCE)
    ("I need a laptop, how do I expense my travel, and what is the leave policy?", ["IT/laptop_request", "FINANCE/travel_reimbursement", "HR/hr_policy"]),
    ("Onboarding query: I need my laptop, my corporate card, and my payroll setup", ["HR/onboarding", "IT/laptop_request", "FINANCE/corporate_card", "HR/payroll"]),
    
    # OUT OF SCOPE / CLARIFICATION (handled by thresholding)
    ("Tell me a joke", []),
    ("What is the weather today?", []),
    ("Who won the match?", []),
]

# Add some variations to make it robust
import random
random.seed(42)

def augment_data(data):
    augmented = list(data)
    # Just simple duplication for this demo, in reality we'd paraphrase
    for q, labels in data:
        if len(labels) > 0:
            augmented.append((q.lower(), labels))
            augmented.append((q.replace("?", ""), labels))
    return augmented

print("Loading SentenceTransformer model (all-MiniLM-L6-v2)...")
encoder = SentenceTransformer("all-MiniLM-L6-v2")

train_data = augment_data(TRAIN_DATA)
queries = [item[0] for item in train_data]
labels = [item[1] for item in train_data]

print("Encoding queries...")
X_train = encoder.encode(queries)

print("Binarizing labels...")
mlb = MultiLabelBinarizer()
y_train = mlb.fit_transform(labels)

print("Training Multi-Label Logistic Regression...")
# Use OneVsRestClassifier with Logistic Regression for multi-label support
clf = OneVsRestClassifier(LogisticRegression(class_weight="balanced", C=10.0))
clf.fit(X_train, y_train)

# Save the model and binarizer
os.makedirs("app/models", exist_ok=True)
with open("app/models/intent_classifier.pkl", "wb") as f:
    pickle.dump({"clf": clf, "mlb": mlb}, f)

print("Model saved to app/models/intent_classifier.pkl")

# Test it
test_queries = [
    "I need a laptop and my VPN is broken",
    "How to check leave balance and expense travel?",
    "Tell me a joke",
]

print("\n--- Testing Model ---")
X_test = encoder.encode(test_queries)
probs = clf.predict_proba(X_test)

THRESHOLD = 0.3
for q, prob in zip(test_queries, probs):
    predictions = (prob >= THRESHOLD).astype(int)
    predicted_labels = mlb.inverse_transform(np.array([predictions]))[0]
    print(f"Q: {q}")
    print(f"Pred: {predicted_labels}")
    print()
