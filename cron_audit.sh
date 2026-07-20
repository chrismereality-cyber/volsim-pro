#!/bin/bash
# Install dependencies if not present
pip install -r requirements.txt
# Run the reconciliation auditor
python reconcile_vault.py
