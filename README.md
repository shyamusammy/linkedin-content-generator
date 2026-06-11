# LinkedIn AI Content Generator

An AI-powered LinkedIn content generation platform that creates professional LinkedIn posts using Google Gemini, stores content in Supabase, and orchestrates workflows through n8n.

---

## Overview

This project enables users to generate high-quality LinkedIn content based on:

- Topic
- Audience
- Tone
- Content Type

The application automates:

1. User submission
2. AI content generation
3. Content formatting
4. Database storage
5. API response delivery

---

## Features

### AI Content Generation

- LinkedIn Post Creation
- Post Titles
- CTA Generation
- Hashtag Generation
- Image Prompt Creation

### Workflow Automation

- n8n-powered orchestration
- Webhook-based processing
- Automated database storage

### Database Integration

- User management
- Generated post storage
- Historical content tracking

### Modern Frontend

- Built using Lovable
- Responsive UI
- Easy deployment

---

## Tech Stack

| Layer | Technology |
|---------|------------|
| Frontend | Lovable |
| Workflow Engine | n8n |
| Database | Supabase |
| LLM | Google Gemini |
| Hosting | Vercel / Netlify |
| API Layer | n8n Webhooks |

---

## System Architecture

```text
┌─────────────┐
│   Lovable   │
│  Frontend   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ n8n Webhook │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Google      │
│ Gemini API  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Supabase    │
│ Database    │
└──────┬──────┘
       │
       ▼
    Response
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/linkedin-ai-content-generator.git

cd linkedin-ai-content-generator
```

### Install Dependencies

```bash
npm install
```

---

## Configuration

Create:

```bash
.env
```

Copy values from:

```bash
.env.example
```

---

## Deployment

### Frontend

Deploy using:

- Vercel
- Netlify

### Backend

Deploy n8n:

- Docker
- VPS
- Cloud VM

### Database

Use:

- Supabase Cloud

---

## Workflow Import

Navigate to:

```text
n8n → Workflows → Import
```

Import:

```text
workflows/linkedin-content-generator.json
```

---

## Future Roadmap

### Phase 1

- Content Generation
- Content Storage

### Phase 2

- Content Scheduling
- LinkedIn Publishing

### Phase 3

- Multi-platform Content

### Phase 4

- Analytics Dashboard

### Phase 5

- AI Content Optimization

---

## Security

Never commit:

- API Keys
- Service Role Keys
- Secrets
- Passwords
- Credentials

Use environment variables only.

---

## License

MIT License
