# 🧭 Vocation

**Vocation** is an AI-driven educational planner designed to help Miami Dade College students clearly understand their complete academic and professional journey — from their first MDC program to their dream career.

---

## 🌟 Inspiration

When students evaluate career choices, they often feel lost trying to understand the full academic and professional journey required to reach them.  

We wanted to create something meaningful that brings **clarity to every step**. This led us to build **Vocation**, an AI-powered platform that lays out complete educational pathways — starting with the right MDC program and including **transfer plans, articulation agreements, internships, and required exams or certifications**.  

By providing clear options and personalized routes, we help students turn **long-term ambitions into organized, guided plans**.

---

## 💡 Problem Statement

Many students struggle to understand the full academic and professional pathway needed to reach their desired careers. Most people lack exposure to a clear, systematic approach to career planning — one that shows how **programs, transfer routes, certification exams, and advanced study options** fit together.  

Without this clarity, students often feel unsure about their next steps, leading to confusion, delays, and incomplete decision-making.

---

## 🚀 Elevator Pitch

> **Vocation** is a personalized, AI-powered educational planner that helps students map their complete journey from **Miami Dade College** to their **dream career** — integrating degrees, certifications, transfers, and professional milestones into one clear and interactive roadmap.

---

## 🧩 Solution

Vocation addresses the problem through four key features:

### 1️⃣ Career-to-Educational Pathway  
Students input a desired career such as **Architect** or **Mechanical Engineer**, and the system instantly generates a complete academic pathway.

### 2️⃣ Integrated Transfer Planning  
Displays recommended **bachelor's and graduate programs**, articulation agreements, partner universities, and links for in-depth transfer information.

### 3️⃣ Professional Requirements  
Highlights crucial milestones including **certification exams**, **licenses**, and **internships** (e.g., FE and PE exams for engineers) with direct links for more details.

### 4️⃣ Beneficiaries  
- **Primary:** MDC students seeking clarity on their academic and career pathways  
- **Secondary:** Academic advisors supporting students in planning their journeys  

---

## 🏁 Getting Started

Run **Vocation** locally in four steps.

### Prerequisites
- **Node.js 18.17+** (required by Next.js 14)
- A free **Google Gemini API key** — grab one at [Google AI Studio](https://aistudio.google.com/app/apikey)

### 1. Clone and install
```bash
git clone https://github.com/<your-username>/Vocation.git
cd Vocation
npm install
```

### 2. Add your API key
Copy the example env file and drop in your Gemini key:
```bash
cp .env.example .env.local
```
Then edit `.env.local`:
```bash
GEMINI_API_KEY=your_actual_key_here
```
> ⚠️ All AI features (career suggestions, pathway generation, the career quiz, and exam lookups) require this key. Without it, those API routes return `"API key not configured"`. `.env.local` is gitignored, so your key stays private.

### 3. Run the dev server
```bash
npm run dev
```

### 4. Open the app
Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

### Available scripts
| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run the Next.js linter |
| `npm test` | Run the unit test suite (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

---

## 🛠️ How We Built It

We designed and built **Vocation** using:

- 🖥️ **Next.js (Node.js, React, Tailwind)** – for the web application  
- 🤖 **Google Gemini API & Canvas** – for AI-driven pathway generation and visualization  
- 🧑‍💻 **Cursor** – for development and pair programming  
- 🗂️ **GitHub** – for version control  
- 💬 **Discord / WhatsApp** – for team communication  

---

## ⚙️ Challenges We Ran Into

- ⚡ **Understanding and implementing the Gemini API** – Required deep research, testing, and debugging to ensure proper integration.  
- 🔗 **Ensuring correct educational pathway links** – We validated every link for accuracy and reliability.  
- 🎓 **Differentiating similar majors** – Handling programs with multiple variations was a challenge for categorization and display accuracy.

---

## 🏆 Accomplishments We’re Proud Of

- ✅ **Improved accuracy of pathway links** – All degree and program links are now reliable and functional.  
- ✅ **Enhanced flowchart precision** – Pathway structures now accurately reflect academic progression.  
- ✅ **Delivered under time constraints** – Built and deployed a working prototype within the hackathon timeframe.

---

## 📚 What We Learned

- 🕒 **Be more linear with time** – Sequential tasking proved far more effective than multitasking under time pressure.  
- 🤝 **Stronger team collaboration** – Clear communication, shared responsibilities, and version control streamlined our workflow.  
- 🎯 **Prioritize a single user flow first** – Focusing on one solid flow prevented unnecessary complexity and made iteration smoother.

---

## 🔮 What’s Next

- 📊 Add **new visualization options** for pathway structures (graphs, charts, timelines).  
- 🔁 Implement **pathway comparison** so students can evaluate multiple routes side by side.  
- ⚡ Continue **iterating and optimizing** the prototype for full deployment.

---

## 👥 Team

- **Developed by:** Team Vocation  
- **Built for:** Miami Dade College Hackathon  
- **Powered by:** Google Gemini API, Next.js, and Tailwind CSS  

---

### 💬 “Helping students see the bigger picture, one pathway at a time.”
