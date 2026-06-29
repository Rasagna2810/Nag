Here's a professional **README.md** that matches your hackathon project and can be directly copied into GitHub.

---

#  Intelligent Next Best Action Platform

An **Agentic Decision Intelligence Platform** that transforms customer interactions and enterprise knowledge into actionable recommendations for Customer Success Managers.

The platform analyzes customer context, retrieves organizational knowledge, identifies risks and opportunities, and generates explainable **Next Best Actions (NBA)** using multiple AI agents.

---

#  Problem Statement

Customer Success Managers (CSMs) often spend significant time manually reviewing:

* CRM records
* Support tickets
* Emails
* Meeting notes
* Previous recommendations
* Internal documentation

before deciding how to proceed with a customer.

This process is time-consuming, inconsistent, and may lead to:

* Missed renewal opportunities
* Delayed escalations
* Customer churn
* Lost expansion opportunities

This platform automates customer analysis and recommends the most appropriate actions with supporting evidence.

---

#  Objectives

* Automate customer analysis
* Reduce manual effort for Customer Success Managers
* Identify risks and opportunities
* Generate explainable recommendations
* Support Human-in-the-Loop decision making
* Learn from previous decisions through memory

---

#  Business Domain

**B2B SaaS Customer Success**

The platform helps Customer Success Managers make better decisions for existing customers by analyzing customer interactions and enterprise knowledge.

---

#  Key Features

## Customer Interaction Analysis

The platform ingests:

* CRM Updates
* Meeting Notes
* Support Tickets
* Emails
* Previous Recommendations

---

## Enterprise Knowledge Base (RAG)

The platform retrieves organizational knowledge from a vector database, including:

* Troubleshooting Guides
* Renewal Playbooks
* Best Practices
* Product Documentation
* Escalation Procedures

---

## Agentic Workflow

Multiple AI agents collaborate to perform customer analysis.

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

---

## Explainable Recommendations

Each recommendation includes:

* Priority
* Due Date
* Evidence
* Business Impact
* Confidence
* Execution Steps

---

## Human-in-the-Loop

Recommendations are not automatically executed.

Users can:

* Approve
* Reject
* Provide Feedback
* Mark Actions as Completed

---

## Memory

The platform stores:

* Approved recommendations
* Rejected recommendations
* Completed actions
* Feedback

Future analyses use this information to generate better recommendations.

---

#  System Architecture

```text
Customer Data
      │
      ▼
MongoDB
      │
      ▼
Planner Agent
      │
      ▼
Internal Knowledge Agent
      │
      ├── Customer Interactions
      ├── Customer History
      └── Knowledge Base (Qdrant)
      │
      ▼
Reasoning Agent
      │
      ▼
Recommendation Agent
      │
      ▼
Report Agent
      │
      ▼
Human Review
      │
      ▼
Memory
```

---

#  Technology Stack

## Backend

* FastAPI
* Python
* LangGraph
* LangChain

## Frontend

* React.js
* Vite
* Tailwind CSS

## Databases

* MongoDB
* Qdrant Vector Database

## AI & Embeddings

* Google Gemini
* Sentence Transformers

## Authentication

* JWT Authentication

---

#  Project Structure

```text
enterprise-ai/
│
├── backend/
│   ├── agents/
│   ├── api/
│   ├── services/
│   ├── database/
│   ├── models/
│   └── websockets/
│
└── frontend/
    ├── components/
    ├── pages/
    ├── hooks/
    └── api/
```

---

#  AI Agents

## Planner Agent

* Understands customer context
* Determines analysis strategy
* Generates knowledge search query

---

## Internal Knowledge Agent

Retrieves:

* Customer information
* Emails
* Support tickets
* Meeting notes
* Knowledge articles
* Historical recommendations

---

## Reasoning Agent

Performs:

* Risk analysis
* Opportunity analysis
* Customer health calculation
* Business reasoning

---

## Recommendation Agent

Generates:

* Next Best Actions
* Priorities
* Due dates
* Business impact
* Confidence scores

---

## Report Agent

Creates:

* Executive Summary
* Risk Assessment
* Opportunities
* Final Recommendations

---

#  Knowledge Base

Example knowledge articles:

* Epic EHR Integration Recovery Guide
* Renewal Risk Management Playbook
* Executive Escalation Procedure
* Customer Adoption Best Practices
* Expansion Opportunity Guide
* Feature Request Management Process

---

#  Recommendation Lifecycle

```text
Analysis
    ↓
Recommendations Generated
    ↓
Human Review
    ↓
Approve / Reject
    ↓
Action Center
    ↓
Completion
    ↓
Feedback
    ↓
Memory
```

---

#  Success Metrics

* Customer Retention Rate
* Renewal Success Rate
* Churn Reduction
* Expansion Revenue
* Recommendation Acceptance Rate
* Recommendation Completion Rate
* Customer Health Improvement

---

#  Installation

## Clone Repository

```bash
git clone https://github.com/your-username/enterprise-ai.git
cd enterprise-ai
```

---

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

Create `.env`

```env
GEMINI_API_KEY=
MONGODB_URL=
MONGODB_DB=
QDRANT_URL=http://localhost:6333
JWT_SECRET=
```

Run:

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

---

#  Demo Workflow

1. Login as Customer Success Manager.
2. Select a customer.
3. Click **Analyze Customer**.
4. AI agents collaborate and generate recommendations.
5. Review recommendations.
6. Approve or reject actions.
7. Complete tasks and provide feedback.
8. System learns from previous decisions.

---

#  Future Enhancements

* Multi-customer prioritization dashboard
* External market intelligence
* Predictive churn scoring
* Automated workflow execution
* Advanced analytics dashboard
* Multi-domain support

---

#  License

This project was developed as part of the **XLVentures.AI Hackathon 2026**.

---

#  Team

**Team Name:** *D&D*

* K.Rasagna
* P.Roji


---

#  Final Statement

> **The Intelligent Next Best Action Platform demonstrates how Agentic AI can transform Customer Success operations by combining customer interactions, enterprise knowledge, reasoning, and memory to deliver explainable and actionable recommendations while keeping humans in control of business decisions.**
