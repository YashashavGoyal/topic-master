***

# 🚀 Topic Master

### An AI-Powered Autonomous Career Growth Agent

![Node.js](https://img.shields.io/badge/Node.js-v20-green) ![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Automated-blue) ![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-orange) ![License](https://img.shields.io/badge/License-MIT-lightgrey)

**Topic Master** is a fully automated, serverless agent designed to facilitate continuous learning in High-Scale System Design and DevOps. 

Instead of manually searching for resources, this agent autonomously scrapes engineering blogs from Big Tech giants (Netflix, Uber, AWS), filters them using **Google Gemini AI** based on a specific career profile, and delivers a structured daily briefing via email. It effectively acts as a "Personal CTO," ensuring I stay updated with industry-standard architecture trends.

---

## 🏗️ System Architecture

The system operates on a **GitOps** model, utilizing GitHub Actions as a scheduler to run ephemeral compute instances.

```mermaid
graph LR
    A[RSS Feeds (Netflix/Uber/YouTube)] -->|Raw Data| B(Node.js Aggregator)
    B -->|Context + Data| C{Gemini 1.5 Flash AI}
    C -->|Analysis & Filtering| D[HTML Generator]
    D -->|Responsive Email| E[Nodemailer SMTP]
    E -->|Daily Briefing| F((User Inbox))
    G[GitHub Actions Cron] -->|Trigger 08:30 IST| B
```

## 🛠️ Tech Stack

*   **Runtime:** Node.js (Asynchronous Event-Driven Architecture)
*   **Artificial Intelligence:** Google Gemini 1.5 Flash (Context-aware filtering and summarization)
*   **Orchestration:** GitHub Actions (CRON-based scheduling)
*   **Data Ingestion:** `rss-parser` (XML/RSS Feed consumption)
*   **Notification Service:** Nodemailer (SMTP/Gmail Integration)

## ✨ Key Features

*   **Intelligent Curation:** Fetches 20+ articles daily but filters down to the **Top 2** most relevant to DevOps & SRE roles using AI semantic understanding.
*   **Daily System Design Drill:** Automatically generates a bite-sized lesson on complex topics (e.g., *CAP Theorem, Consistent Hashing, Raft Consensus*) with interview tips.
*   **Serverless & Free:** Runs entirely on GitHub Actions' free tier and Google's free AI tier. Zero infrastructure cost.
*   **Responsive UI:** Generates a clean, Dark Mode HTML email template for easy reading on mobile or desktop.

---

## 📂 Project Structure

```bash
topic-master/
├── .github/
│   └── workflows/
│       └── daily_agent.yml   # CI/CD Orchestration logic
├── node_modules/             # Dependencies
├── .env                      # Local secrets (Not committed)
├── .gitignore                # Git ignore rules
├── index.js                  # Core Logic (Fetcher, AI, Emailer)
├── package.json              # Dependency manifest
└── README.md                 # Documentation
```

---

## 🚀 Setup & Installation

To run this agent locally on your machine:

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/YashashavGoyal/topic-master.git
    cd topic-master
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory:
    ```env
    GEMINI_API_KEY=your_google_ai_key
    EMAIL_USER=your_gmail_address
    EMAIL_PASS=your_app_password
    TARGET_EMAIL=destination_email_address
    ```

4.  **Run the Agent**
    ```bash
    node index.js
    ```

---

## 🤖 Automation (GitHub Actions)

This project is designed to run automatically. The `.github/workflows/daily_agent.yml` file defines a schedule:

```yaml
on:
  schedule:
    # Runs at 03:00 UTC (08:30 AM IST) daily
    - cron: '0 3 * * *'
```

**Required GitHub Secrets:**
Go to `Settings > Secrets and variables > Actions` and add:
*   `GEMINI_API_KEY`
*   `EMAIL_USER`
*   `EMAIL_PASS`
*   `TARGET_EMAIL`

---

## 📸 Sample Output

*The agent sends a structured HTML email like this:*

> **🚀 Daily Engineering Update**
>
> **Fresh from the Industry**
>
> *   **Netflix Tech Blog:** *Evolution of the Netflix Media Database*
>     *   *Why:* Crucial for understanding how to model data at petabyte scale.
> *   **Hussein Nasser:** *gRPC vs REST*
>     *   *Why:* Essential knowledge for building internal microservices.
>
> **System Design Concept: Consistent Hashing**
> *   **Concept:** A distribution scheme that does not depend on the number of servers, allowing scaling without re-mapping all keys.
> *   **Pro Tip:** In interviews, mention "Virtual Nodes" to solve the problem of uneven data distribution.

---

## 🔮 Future Roadmap

*   [ ] **Database Integration:** Store past topics in MongoDB to prevent repetition.
*   [ ] **Slack/Discord Webhook:** Send alerts to a private discord server instead of Email.
*   [ ] **Voice Briefing:** Use Text-to-Speech to generate a 2-minute audio summary.

---

## 👤 Author

**Yashashav Goyal**
*   *Role:* Aspiring DevOps / SRE Engineer
*   *Focus:* Automation, Cloud Native, Distributed Systems
*   [LinkedIn](https://linkedin.com/in/yashashavgoyal) | [GitHub](https://github.com/YashashavGoyal)

***