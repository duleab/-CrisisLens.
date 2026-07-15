# 🚀 CrisisLens Production Deployment Guide

## 📋 Overview

This guide covers deploying the CrisisLens AI Platform from your **Crisis-Lens Optimized-Corrected notebook** to a production-ready web application.

## 🏗️ Architecture Overview

```
Frontend (React + TypeScript)
       ↓
API Gateway (FastAPI + WebSocket)
       ↓
Background Workers (Crisis Processing)
       ↓
Database (PostgreSQL + Redis)
       ↓
AI Services (Gemma + Transformers)
```

---

## 📁 Project Structure

```
crisislens-production/
├── backend/                     # FastAPI Backend
│   ├── app/
│   │   ├── main.py             # Main FastAPI application
│   │   ├── services/           # Business logic
│   │   │   ├── crisis_processor.py  # Your notebook logic
│   │   │   ├── ai_chat.py      # Multi-agent AI system
│   │   │   └── websocket_manager.py
│   │   ├── api/v1/             # REST API endpoints
│   │   ├── models/             # Pydantic models
│   │   ├── core/               # Configuration & database
│   │   └── workers/            # Background tasks
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                    # React Frontend  
│   ├── src/
│   │   ├── components/         # UI components
│   │   │   ├── Dashboard/      # Main dashboard
│   │   │   ├── Chat/          # AI chat interface
│   │   │   └── Map/           # Interactive crisis map
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API integration
│   │   └── types/             # TypeScript definitions
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml          # Multi-service orchestration
├── nginx/                      # Reverse proxy config
└── deployment/                 # Deployment scripts
    ├── kubernetes/             # K8s manifests
    ├── terraform/              # Infrastructure as code
    └── scripts/                # Deployment automation
```

---

## 🔄 Migration Process

### **Step 1: Extract Core Logic**

Your **Crisis-Lens Optimized-Corrected notebook** cells map to these backend services:

| Notebook Cell | Backend Component | Description |
|---------------|-------------------|-------------|
| **Cell 1:** Setup + Model Discovery | `app/core/config.py` + `app/utils/ai_client.py` | Configuration & AI initialization |
| **Cell 2:** Data Sources + Collection | `app/services/crisis_processor.py` | Data source definitions & collectors |
| **Cell 3:** Run Collection | `app/workers/crisis_collector.py` | Background collection worker |
| **Cell 4:** Geographic Filtering | `app/services/crisis_processor.py` | Geographic & crisis relevance filters |
| **Cell 5:** Binary Filter + Classification | `app/services/crisis_processor.py` | AI classification pipeline |
| **Cell 6:** Geocoding + Batch Processing | `app/services/crisis_processor.py` | Geocoding with caching |
| **Cell 7:** Deduplication + Event Fusion | `app/services/crisis_processor.py` | SBERT deduplication |
| **Cell 8:** Confidence Scoring | `app/models/crisis_event.py` | Database models & scoring |
| **Cell 9:** Dashboard | `frontend/src/components/Dashboard/` | React dashboard |
| **Cell 10:** Telegram Alerts | `app/services/telegram_service.py` | Telegram integration |
| **Cell 11:** Telegram Bot Q&A | `app/services/ai_chat.py` | Multi-agent chat system |
| **Cell 12:** Launch Everything | `app/main.py` | FastAPI orchestration |
| **Cell 13:** Gradio Chat | `frontend/src/components/Chat/` | Web-based chat interface |

### **Step 2: Database Migration**

Convert your notebook data structures to PostgreSQL:

```sql
-- Crisis Events Table
CREATE TABLE crisis_events (
    id SERIAL PRIMARY KEY,
    crisis_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    confidence DECIMAL(3,2) NOT NULL,
    location_name VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    raw_text TEXT NOT NULL,
    source_name VARCHAR(100) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    trust_score DECIMAL(3,2) NOT NULL,
    casualties INTEGER,
    magnitude DECIMAL(4,2),
    source_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_crisis_events_created_at ON crisis_events(created_at DESC);
CREATE INDEX idx_crisis_events_location ON crisis_events(latitude, longitude);
CREATE INDEX idx_crisis_events_severity ON crisis_events(severity);
CREATE INDEX idx_crisis_events_type ON crisis_events(crisis_type);
```

### **Step 3: API Endpoints**

Your notebook functionality becomes REST API endpoints:

```python
# Crisis data endpoints
GET  /api/v1/crisis/events          # Get filtered crisis events
GET  /api/v1/crisis/events/{id}     # Get specific event
GET  /api/v1/crisis/stats           # Dashboard statistics
GET  /api/v1/crisis/map-data        # Map visualization data
POST /api/v1/crisis/collect         # Trigger manual collection

# AI chat endpoints  
POST /api/v1/chat/message           # Send message to AI agent
GET  /api/v1/chat/history           # Get chat history
GET  /api/v1/agents                 # Get available agents

# WebSocket for real-time updates
WS   /ws/{client_id}                # Real-time event stream
```

---

## 🛠️ Development Setup

### **Prerequisites**
- **Python 3.9+** (for backend)
- **Node.js 18+** (for frontend)  
- **Docker & Docker Compose** (for containers)
- **PostgreSQL 15+** (for database)
- **Redis 7+** (for caching)

### **Quick Start**

```bash
# 1. Clone and setup
git clone <your-repo>
cd crisislens-production

# 2. Environment setup
cp .env.example .env
# Edit .env with your API keys and configuration

# 3. Start with Docker (easiest)
docker-compose up -d

# 4. Access the application
Frontend:  http://localhost:3000
Backend:   http://localhost:8000
API Docs:  http://localhost:8000/docs
```

### **Manual Development Setup**

```bash
# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Database setup
createdb crisislens
python -m app.db.init_db

# Start backend
uvicorn app.main:app --reload --port 8000

# Frontend setup (separate terminal)
cd frontend
npm install
npm run dev
```

---

## 🔧 Configuration

### **Environment Variables (.env)**

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/crisislens
REDIS_URL=redis://localhost:6379/0

# API Keys (from your notebook)
GOOGLE_API_KEY=your_gemma_api_key
NEWSAPI_KEY=your_newsapi_key
TELEGRAM_BOT_TOKEN=your_telegram_token

# Security
SECRET_KEY=your-super-secret-key-for-jwt
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Features
DEBUG=false
LOG_LEVEL=info
ENABLE_MONITORING=true
```

### **Production Security**

```bash
# Generate secure keys
SECRET_KEY=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
```

---

## 📊 Data Migration

### **Migrate Your Notebook Cache**

If you have existing classification cache from your notebook:

```python
# migration_script.py
import pickle
import json
import asyncio
from app.core.database import database
from app.models.crisis_event import CrisisEventCreate

async def migrate_notebook_data():
    # Load your notebook cache
    with open('/path/to/your/classification_cache.pkl', 'rb') as f:
        cache_data = pickle.load(f)
    
    # Convert to database format
    for cache_key, event_data in cache_data.items():
        crisis_event = CrisisEventCreate(
            crisis_type=event_data.get('crisis_type', 'other'),
            severity=event_data.get('severity', 'low'),
            confidence=event_data.get('confidence', 0.5),
            location_name=event_data.get('location_name'),
            latitude=event_data.get('latitude'),
            longitude=event_data.get('longitude'),
            raw_text=event_data.get('raw_text', ''),
            source_name=event_data.get('source_name', 'imported'),
            # ... other fields
        )
        
        # Insert into database
        # ... database insertion logic

# Run migration
asyncio.run(migrate_notebook_data())
```

---

## 🚀 Deployment Options

### **Option 1: Simple VPS Deployment**

```bash
# On your server (Ubuntu/Debian)
sudo apt update
sudo apt install docker.io docker-compose-plugin

# Deploy application  
git clone <your-repo>
cd crisislens-production
cp .env.example .env
# Configure .env with production values

docker compose -f docker-compose.yml up -d
```

### **Option 2: Cloud Platform (AWS/GCP/Azure)**

```bash
# Using Terraform for infrastructure
cd deployment/terraform
terraform init
terraform plan
terraform apply

# Deploy with Kubernetes
cd ../kubernetes  
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml
```

### **Option 3: Kubernetes (Production)**

```yaml
# deployment/kubernetes/crisislens-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: crisislens-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: crisislens-backend
  template:
    metadata:
      labels:
        app: crisislens-backend
    spec:
      containers:
      - name: backend
        image: crisislens/backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: crisislens-secrets
              key: database-url
        # ... other environment variables
```

---

## 🔍 Monitoring & Observability

### **Application Metrics**
- **Health checks:** `/health` endpoint
- **Metrics:** Prometheus integration
- **Logging:** Structured JSON logs
- **Tracing:** OpenTelemetry support

### **Dashboard Monitoring**
- **Grafana dashboards:** Crisis event trends, API performance
- **Alerts:** Critical event notifications, system failures
- **Uptime monitoring:** External service monitoring

### **AI Model Monitoring**
- **Model usage tracking:** API call counts, model performance
- **Accuracy monitoring:** Classification confidence trends
- **Cost tracking:** API usage and billing

---

## 🔐 Security Considerations

### **API Security**
- **Authentication:** JWT tokens, API keys
- **Authorization:** Role-based access control (RBAC)
- **Rate limiting:** Per-user and global limits
- **Input validation:** Pydantic models, SQL injection prevention

### **Data Security**
- **Encryption:** TLS/SSL, encrypted database connections
- **Secrets management:** Environment variables, Kubernetes secrets
- **Backup encryption:** Encrypted database backups
- **Privacy compliance:** GDPR, data anonymization

### **Infrastructure Security**
- **Container security:** Non-root users, minimal base images  
- **Network security:** VPC, security groups, firewalls
- **Updates:** Automated security patches
- **Monitoring:** Security event logging, intrusion detection

---

## 📈 Scaling Considerations

### **Horizontal Scaling**
- **Load balancing:** Multiple backend instances
- **Database:** Read replicas, connection pooling
- **Caching:** Redis cluster, CDN for static assets
- **Message queues:** Celery for background tasks

### **Performance Optimization**
- **Database indexing:** Query optimization
- **API caching:** Response caching, ETags
- **Frontend optimization:** Code splitting, lazy loading
- **CDN:** Static asset delivery

### **Auto-scaling**
- **Kubernetes HPA:** CPU/memory-based scaling
- **Cloud auto-scaling:** AWS Auto Scaling Groups
- **Database scaling:** Aurora Serverless, connection pooling
- **Monitoring-driven:** Metric-based scaling decisions

---

## 🧪 Testing Strategy

### **Backend Testing**
```bash
cd backend
pytest tests/ -v --coverage
```

### **Frontend Testing**  
```bash
cd frontend
npm run test
npm run e2e
```

### **Integration Testing**
```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

### **Load Testing**
```bash
# Using k6 for load testing
k6 run deployment/tests/load-test.js
```

---

## 📋 Migration Checklist

### **Pre-Migration**
- [ ] **Environment setup:** API keys, database configuration
- [ ] **Data export:** Export notebook cache and important data
- [ ] **Testing:** Verify all notebook functions work in isolation
- [ ] **Dependencies:** Install all required packages and models

### **Migration**
- [ ] **Database setup:** Create tables, indexes, initial data
- [ ] **Backend deployment:** API endpoints, background workers
- [ ] **Frontend deployment:** React application, routing
- [ ] **Integration:** WebSocket connections, real-time features

### **Post-Migration**
- [ ] **Data validation:** Verify migrated data integrity
- [ ] **Performance testing:** Load testing, response times
- [ ] **Monitoring setup:** Alerts, dashboards, logging
- [ ] **Documentation:** Update API docs, user guides

### **Go-Live**
- [ ] **DNS configuration:** Domain setup, SSL certificates
- [ ] **Backup strategy:** Database backups, disaster recovery
- [ ] **User training:** Admin panel, monitoring dashboard
- [ ] **Support process:** Incident response, maintenance procedures

---

## 🆘 Troubleshooting

### **Common Issues**

**Database Connection Errors:**
```bash
# Check database connectivity
docker-compose exec postgres pg_isready -U crisislens_user

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

**API Key Issues:**
```bash
# Verify environment variables
docker-compose exec backend env | grep API_KEY

# Test Gemma connection
docker-compose exec backend python -c "from app.utils.ai_client import test_connection; test_connection()"
```

**Frontend Build Issues:**
```bash
# Clear cache and rebuild
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Memory/Performance Issues:**
```bash
# Monitor resource usage
docker stats

# Scale services
docker-compose up -d --scale backend=3
```

---

## 📞 Support & Resources

### **Documentation**
- **API Documentation:** `/api/docs` (Swagger UI)
- **Architecture docs:** `docs/architecture.md`
- **Deployment guides:** `deployment/` folder

### **Community**
- **Issues:** GitHub Issues for bug reports
- **Discussions:** GitHub Discussions for questions
- **Contributing:** `CONTRIBUTING.md` for development guidelines

### **Commercial Support**
- **Enterprise support:** Contact for professional services
- **Custom development:** Feature requests and customizations
- **Training:** On-site training and consultation

---

**🎉 Congratulations! You've successfully transformed your Crisis-Lens notebook into a production-ready web application!**

Your notebook's powerful crisis intelligence is now:
- ✅ **Scalable:** Handle thousands of concurrent users
- ✅ **Real-time:** Live updates and instant notifications  
- ✅ **Multi-platform:** Web, mobile, API access
- ✅ **Production-ready:** Monitoring, security, backups
- ✅ **AI-powered:** Multi-agent conversations and intelligence

**Next Steps:**
1. Deploy to your chosen infrastructure
2. Configure monitoring and alerts  
3. Train your team on the new system
4. Start saving lives with intelligent crisis response! 🚨