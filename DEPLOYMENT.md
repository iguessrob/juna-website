# Deploying Juna Website to AWS EC2 (Without Nginx)

This guide provides a production-ready setup for deploying the Next.js application on an AWS EC2 instance without running Nginx.

---

## Architecture Overview: Why & How to Deploy Without Nginx

Traditionally, Nginx is used as a reverse proxy to forward traffic from port 80/443 to port 3000. Without Nginx, you have two optimal strategies:

1. **Option 1: Docker Compose (Recommended)**  
   Docker maps port `80` on the EC2 host directly to port `3000` inside the container (`80:3000`). It is lightweight, isolated, handles automatic restarts upon server reboot, and bypasses Linux non-root port binding restrictions.

2. **Option 2: Native Node.js + PM2 with iptables or setcap**  
   Run Next.js on port 3000 with PM2, and redirect port 80 to 3000 at the OS kernel level via `iptables`, or allow Node to bind port 80 directly with `setcap`.

3. **Option 3: AWS ALB (Application Load Balancer) + ACM SSL**  
   Place an AWS ALB in front of your EC2. The ALB listens on port 80 and 443 (handling free AWS SSL certificates), forwarding requests directly to your EC2 instance on port 3000. Zero web server or reverse proxy needed on the EC2 instance itself.

---

## Step 1: AWS EC2 Security Group Configuration

Before launching or connecting to your EC2 instance, ensure your **Security Group** allows the following inbound traffic:

| Type | Protocol | Port Range | Source | Purpose |
|------|----------|------------|--------|---------|
| **SSH** | TCP | `22` | `My IP` (or `0.0.0.0/0`) | Access your EC2 terminal |
| **HTTP** | TCP | `80` | `0.0.0.0/0` | Public web traffic |
| **HTTPS** | TCP | `443` | `0.0.0.0/0` | Secure web traffic |
| **Custom TCP** | TCP | `3000` | Optional (for ALB or testing) | Direct access if not mapped to 80 |

> **Tip for t2.micro / t3.micro instances:**  
> Next.js builds can run out of memory on 1GB RAM machines. The included `setup-ec2.sh` script automatically provisions a 2GB swap file to guarantee smooth builds.

---

## Step 2: Option 1 — Deploy via Docker (Recommended)

### 1. Connect to your EC2 instance
```bash
ssh -i /path/to/your-key.pem ubuntu@<EC2-PUBLIC-IP>
# or for Amazon Linux:
# ssh -i /path/to/your-key.pem ec2-user@<EC2-PUBLIC-IP>
```

### 2. Clone or copy your project repository
```bash
git clone <your-repo-url>
cd juna-website-master
```

### 3. Run the automated setup script
Make the scripts executable and run `setup-ec2.sh` to install Docker, Docker Compose, and configure swap:
```bash
chmod +x setup-ec2.sh deploy.sh
./setup-ec2.sh
```
*Note: If prompted, log out and log back in, or run `newgrp docker` to activate docker group permissions.*

### 4. Configure environment variables
```bash
cp .env.example .env
nano .env
```
Fill in your secrets:
- `AUTH_SECRET`: Generate one using `openssl rand -base64 32`
- `AUTH_URL`: `http://<YOUR_EC2_PUBLIC_IP_OR_DOMAIN>`
- `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID` (if using UploadThing)

### 5. Start the website
```bash
./deploy.sh
```

Your website is now live at `http://<EC2-PUBLIC-IP>` on port 80!

---

## Step 3: Option 2 — Deploy via Native Node.js & PM2 (No Docker)

If you prefer to run directly on the host OS:

### 1. Install Node.js 20 & PM2
On **Ubuntu**:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```
On **Amazon Linux 2023**:
```bash
sudo dnf install -y nodejs npm
sudo npm install -g pm2
```

### 2. Route Port 80 to Port 3000 (Choose A or B)

#### Method A: Linux `iptables` Port Forwarding (Recommended for non-root PM2)
Run this command to transparently forward external port 80 traffic to port 3000:
```bash
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000
# Persist the rule across reboots:
sudo apt install iptables-persistent -y  # On Ubuntu
```

#### Method B: Grant Node permission to bind Port 80
```bash
sudo setcap 'cap_net_bind_service=+ep' $(which node)
```

### 3. Build & Run with PM2
```bash
npm ci
npm run build

# Start using PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Step 4: Adding Free SSL / HTTPS (Without Nginx)

If you want HTTPS without configuring Nginx or Certbot:

### Method 1: AWS Application Load Balancer (ALB) + AWS Certificate Manager (ACM)
1. In AWS Console, request a **free SSL certificate** in AWS Certificate Manager for your domain.
2. Create an **Application Load Balancer (ALB)**.
3. Set listener on `443` (HTTPS) using your ACM Certificate, and forward target to your EC2 instance on port `80` (or `3000`).
4. Set listener on `80` (HTTP) with a redirect rule to `443` (HTTPS).
5. Point your domain's Route 53 or DNS A-record (Alias) to the ALB.

### Method 2: CloudFront in front of EC2
1. Create an AWS CloudFront distribution with your EC2 public DNS as the origin.
2. CloudFront terminates HTTPS at edge locations worldwide with an ACM certificate and sends traffic to EC2 on HTTP port 80.

---

## Useful Maintenance Commands

| Task | Docker Command | PM2 Command |
|------|---------------|-------------|
| **View logs** | `docker compose logs -f` | `pm2 logs juna-website` |
| **Check status** | `docker compose ps` | `pm2 status` |
| **Restart app** | `docker compose restart` | `pm2 restart juna-website` |
| **Update app** | `git pull && ./deploy.sh` | `git pull && npm run build && pm2 reload juna-website` |
| **Stop app** | `docker compose down` | `pm2 stop juna-website` |
