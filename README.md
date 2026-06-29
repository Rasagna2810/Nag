# Intelligent Next Best Action Platform

## Team Details

**Team Name:** D&D

**Team Members:**

* K. Rasagna
* P. Roji

---

# Project Overview

## Introduction

The Intelligent Next Best Action Platform is an Agentic Decision Intelligence Platform designed for B2B SaaS Customer Success teams. The platform transforms customer interactions and enterprise knowledge into actionable recommendations that help Customer Success Managers make better and faster decisions.

Customer information is often spread across multiple systems such as CRM records, support tickets, emails, meeting notes, and internal documentation. Manually analyzing all this information is time-consuming and can lead to delayed responses, customer churn, and missed business opportunities.

Our platform uses multiple AI agents that collaborate to:

* Analyze customer interactions.
* Retrieve enterprise knowledge.
* Identify risks and opportunities.
* Generate explainable Next Best Actions.
* Support Human-in-the-Loop approval.
* Learn from previous decisions through memory.

---

## Problem Statement

Customer Success Managers spend significant time manually reviewing:

* CRM records
* Support tickets
* Emails
* Meeting notes
* Previous recommendations
* Internal documentation

This process may result in:

* Missed renewal opportunities
* Delayed escalations
* Customer churn
* Lost expansion opportunities

---

## Business Domain

**Domain:** B2B SaaS Customer Success

The platform helps Customer Success Managers make better decisions for existing customers by providing intelligent recommendations and business insights.

---

## Key Features

### Customer Interaction Analysis

* CRM Updates
* Meeting Notes
* Support Tickets
* Emails
* Historical Recommendations

### Enterprise Knowledge Base (RAG)

* Troubleshooting Guides
* Renewal Playbooks
* Best Practices
* Product Documentation
* Escalation Procedures

### Agentic Workflow

```text
Planner Agent
      ↓
Internal Knowledge Agent
      ↓
Reasoning Agent
      ↓
Recommendation Agent
      ↓
Report Agent
```

### Explainable Recommendations

Each recommendation includes:

* Priority
* Due Date
* Business Impact
* Supporting Evidence
* Execution Steps
* Confidence Score

### Human-in-the-Loop

Users can:

* Approve recommendations
* Reject recommendations
* Provide feedback
* Mark actions as completed

### Memory

The platform stores:

* Approved recommendations
* Rejected recommendations
* Completed actions
* Feedback

Future analyses use this memory to improve recommendations.

---

## Technology Stack

### Frontend

* React.js
* Tailwind CSS
* Vite

### Backend

* FastAPI
* Python
* LangGraph
* LangChain

### Databases

* MongoDB
* Qdrant Vector Database

### AI

* Google Gemini
* Sentence Transformers

### Authentication

* JWT Authentication

---

# GitHub Repository Link

Repository:

https://github.com/Rasagna2810/Nag



---

# Setup Instructions

## Clone Repository

```bash
git clone https://github.com/Rasagna2810/Nag
cd enterprise-ai
```

## Backend Setup

```bash
cd backend
python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### Linux/Mac

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file:

```env
GEMINI_API_KEY=
MONGODB_URL=
MONGODB_DB=
QDRANT_URL=http://localhost:6333
JWT_SECRET=
```

Run the backend server:

```bash
uvicorn main:app --reload
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

Backend URL:

```text
http://localhost:8000
```

---

# Additional Notes

## System Workflow

```text
Customer Selected
        ↓
Analyze Customer
        ↓
Planner Agent
        ↓
Internal Knowledge Agent
        ↓
Reasoning Agent
        ↓
Recommendation Agent
        ↓
Report Agent
        ↓
Human Approval
        ↓
Memory
```

## Success Metrics

* Customer Retention Rate
* Renewal Success Rate
* Churn Reduction
* Expansion Revenue
* Recommendation Acceptance Rate
* Recommendation Completion Rate
* Customer Health Improvement

## Future Enhancements

* Multi-customer prioritization dashboard
* External market intelligence
* Predictive churn scoring
* Automated workflow execution
* Advanced analytics dashboard
* Multi-domain support

---

