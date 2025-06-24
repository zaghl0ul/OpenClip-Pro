# OpenClip Pro Deployment Guide

This guide covers the complete deployment process for OpenClip Pro in production environments.

## Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04 LTS or later (recommended)
- **CPU**: 4+ cores
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 100GB+ SSD (depends on video storage needs)
- **Network**: Stable internet connection

### Software Requirements
- Docker 24.0+
- Docker Compose 2.0+
- Git
- SSL certificates (for HTTPS)

## Quick Start (Recommended)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/openclip-pro.git
cd openclip-pro
```

### 2. Run Deployment Script
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

The script will:
- Check prerequisites
- Create backups
- Set up environment
- Deploy the application
- Run database migrations
- Verify deployment

## Manual Deployment

### 1. Environment Configuration

Copy the environment template:
```bash
cp env.example .env
```

Configure the following variables:
```env
# Required
SECRET_KEY=your_secure_secret_key_here
POSTGRES_PASSWORD=secure_database_password
REDIS_PASSWORD=secure_redis_password

# API Keys
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
ANTHROPIC_API_KEY=your_anthropic_key

# Domain
FRONTEND_URL=https://yourdomain.com
API_BASE_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 2. SSL Certificates

#### Option A: Let's Encrypt (Recommended)
```bash
# Install certbot
sudo apt update
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
```

#### Option B: Self-signed (Development only)
```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### 3. Deploy Application

```bash
# Build and start services
docker-compose up -d

# Wait for services to be healthy
docker-compose ps

# Run database migrations
docker-compose exec backend alembic upgrade head

# Verify deployment
curl -f https://yourdomain.com/health
```

## Cloud Deployment

### AWS EC2 Deployment

#### 1. Launch EC2 Instance
- Instance type: t3.large or larger
- Security groups: Allow HTTP (80), HTTPS (443), SSH (22)
- Storage: 50GB+ EBS volume

#### 2. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 3. Deploy Application
```bash
# Clone repository
git clone https://github.com/yourusername/openclip-pro.git
cd openclip-pro

# Configure environment
cp env.example .env
# Edit .env with your settings

# Deploy
./scripts/deploy.sh
```

### Google Cloud Platform

#### 1. Create VM Instance
```bash
gcloud compute instances create openclip-pro \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud \
  --machine-type=e2-standard-4 \
  --boot-disk-size=100GB \
  --tags=http-server,https-server
```

#### 2. Deploy Application
```bash
# SSH to instance
gcloud compute ssh openclip-pro

# Follow the same deployment steps as above
```

### Digital Ocean Droplet

#### 1. Create Droplet
- Ubuntu 20.04 LTS
- 4GB RAM / 2 CPUs minimum
- Enable backups

#### 2. Deploy Application
```bash
# SSH to droplet
ssh root@your-droplet-ip

# Follow the same deployment steps as above
```

## Advanced Configuration

### Database Scaling

#### Read Replicas
```yaml
# Add to docker-compose.yml
postgres-replica:
  image: postgres:15-alpine
  environment:
    POSTGRES_DB: openclip_pro
    POSTGRES_USER: openclip_user
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    POSTGRES_MASTER_SERVICE: postgres
  command: |
    bash -c "
    pg_basebackup -h postgres -D /var/lib/postgresql/data -U replicator -v -P -W
    echo 'standby_mode = on' >> /var/lib/postgresql/data/recovery.conf
    echo 'primary_conninfo = \"host=postgres port=5432 user=replicator\"' >> /var/lib/postgresql/data/recovery.conf
    postgres
    "
```

### Horizontal Scaling

#### Load Balancer Configuration
```yaml
# Add to docker-compose.yml
backend-2:
  <<: *backend-service
  
backend-3:
  <<: *backend-service

nginx:
  # Update upstream configuration
  volumes:
    - ./nginx/nginx-scaled.conf:/etc/nginx/nginx.conf
```

### CDN Setup

#### CloudFlare Configuration
1. Add your domain to CloudFlare
2. Update DNS records to point to your server
3. Enable SSL/TLS encryption
4. Configure caching rules

#### AWS CloudFront
```yaml
# Example CloudFront distribution
Resources:
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - DomainName: yourdomain.com
            Id: origin1
            CustomOriginConfig:
              HTTPPort: 80
              HTTPSPort: 443
              OriginProtocolPolicy: https-only
```

## Monitoring Setup

### Prometheus & Grafana

#### Enable Monitoring
```bash
# Start with monitoring profile
docker-compose --profile monitoring up -d

# Access Grafana
open http://localhost:3001
# Login: admin / password (from .env)
```

#### Custom Dashboards
1. Import dashboard from `monitoring/dashboards/`
2. Configure data source: `http://prometheus:9090`
3. Set up alerts for critical metrics

### Log Management

#### ELK Stack
```yaml
# Add to docker-compose.yml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
  environment:
    - discovery.type=single-node
    - ES_JAVA_OPTS=-Xms1g -Xmx1g
  
logstash:
  image: docker.elastic.co/logstash/logstash:8.11.0
  volumes:
    - ./monitoring/logstash.conf:/usr/share/logstash/pipeline/logstash.conf
  
kibana:
  image: docker.elastic.co/kibana/kibana:8.11.0
  ports:
    - "5601:5601"
```

## Security Hardening

### System Security
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### Application Security
- Change default passwords
- Enable rate limiting
- Configure CORS properly
- Use HTTPS everywhere
- Regular security updates

## Backup Strategy

### Database Backup
```bash
# Automated backup script
#!/bin/bash
docker-compose exec -T postgres pg_dump -U openclip_user openclip_pro > backup_$(date +%Y%m%d_%H%M%S).sql

# Upload to cloud storage
aws s3 cp backup_*.sql s3://your-backup-bucket/
```

### File System Backup
```bash
# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz backend/uploads/

# Backup entire application
tar -czf app_backup_$(date +%Y%m%d_%H%M%S).tar.gz --exclude=node_modules --exclude=venv .
```

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
docker-compose logs -f [service-name]

# Check health
docker-compose ps
```

#### Database Connection Issues
```bash
# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec backend python -c "
from backend.config import settings
import psycopg2
conn = psycopg2.connect(settings.DATABASE_URL)
print('Database connection successful')
"
```

#### SSL Certificate Issues
```bash
# Verify certificate
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Test SSL
curl -I https://yourdomain.com
```

### Performance Issues

#### High Memory Usage
```bash
# Check container memory usage
docker stats

# Optimize PostgreSQL
# Add to docker-compose.yml
postgres:
  command: postgres -c shared_preload_libraries=pg_stat_statements -c max_connections=200
```

#### Slow Response Times
```bash
# Check application metrics
curl http://localhost:9090/metrics

# Analyze slow queries
docker-compose exec postgres psql -U openclip_user -d openclip_pro -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
"
```

## Maintenance

### Regular Updates
```bash
# Update application
git pull origin main
docker-compose build --no-cache
docker-compose up -d

# Update dependencies
docker-compose exec backend pip install -r requirements.txt --upgrade
```

### Health Checks
```bash
# Application health
curl -f https://yourdomain.com/health

# Database health
docker-compose exec postgres pg_isready

# Redis health
docker-compose exec redis redis-cli ping
```

## Support

For issues and questions:
- Check the troubleshooting section
- Review application logs
- Contact: support@openclippro.com 