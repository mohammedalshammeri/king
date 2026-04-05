# Hostinger Deployment Guide

This project has three deployable parts:

- `kom-backend/kom-backend`: NestJS backend that must run as a Node service.
- `kom-admin-dashboard`: Next.js admin dashboard that must run as a Node service.
- `kom-landing`: Next.js landing page exported as static files.

## 1. Choose the Correct Hostinger Plan

You have two different hosting paths on Hostinger:

### Path A: Shared Hosting

Use this only if you want to deploy the landing page by itself.

- `kom-landing` can work on shared hosting because it builds to static files.
- `kom-admin-dashboard` will not run correctly on plain shared hosting because it needs a Node server.
- `kom-backend` will not run correctly on plain shared hosting because it needs a long-running Node server.

### Path B: VPS Hosting

Use this if you want to deploy all three parts together.

This repository now includes a VPS-ready setup under `hostinger/`:

- `hostinger/docker-compose.yml`
- `hostinger/Caddyfile`
- `hostinger/.env.example`
- `hostinger/backend.env.example`

## 2. Recommended Domain Layout

Use this layout:

- Landing: `kotm.app`
- Admin: `admin.kotm.app`
- API: `api.kotm.app`

Create these DNS records in Hostinger:

- `@` -> your VPS public IP
- `admin` -> your VPS public IP
- `api` -> your VPS public IP

Wait until DNS resolves before starting HTTPS.

## 3. Deploy Everything on Hostinger VPS

These steps assume an Ubuntu VPS.

### Step 1: Connect to the server

```powershell
ssh root@YOUR_SERVER_IP
```

### Step 2: Install Docker and Git on the server

```bash
apt update
apt install -y ca-certificates curl gnupg git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable docker
systemctl start docker
```

### Step 3: Clone the project

```bash
mkdir -p /var/www
cd /var/www
git clone YOUR_GIT_REPO_URL kom
cd /var/www/kom
```

If the project is not on Git yet, upload it manually to the VPS and place it in `/var/www/kom`.

### Step 4: Prepare the Hostinger deployment files

```bash
cd /var/www/kom/hostinger
cp .env.example .env
cp backend.env.example backend.env
```

Edit both files:

```bash
nano /var/www/kom/hostinger/.env
nano /var/www/kom/hostinger/backend.env
```

Set these values carefully:

- In `.env`: your real domains.
- In `backend.env`: database URL, JWT secrets, admin credentials, storage credentials, and optional mail/push settings.

Important:

- The backend code reads `S3_BUCKET`, `S3_ACCESS_KEY`, and `S3_SECRET_KEY`.
- The admin dashboard build reads `NEXT_PUBLIC_API_BASE_URL` from the compose build arg automatically.
- The backend CORS is currently open enough for these domains, so no extra CORS edit is required.

### Step 5: Build and start the containers

```bash
cd /var/www/kom/hostinger
docker compose up -d --build
```

### Step 6: Confirm the containers are healthy

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f admin
docker compose logs -f landing
docker compose logs -f caddy
```

### Step 7: Test the URLs

Open:

- `https://kotm.app`
- `https://admin.kotm.app`
- `https://api.kotm.app/api/v1/health/live`
- `https://api.kotm.app/docs`

## 4. First Production Checks

After deployment, verify these items:

- Landing page loads over HTTPS.
- Admin login screen opens.
- Admin requests are going to `https://api.kotm.app/api/v1`.
- Backend health endpoint responds.
- Swagger docs load.
- File upload works if Cloudinary or S3/R2 is configured.

## 5. If You Only Have Shared Hosting

Deploy only the landing page like this:

### Step 1: Build the static site locally

On Windows PowerShell:

```powershell
Set-Location c:\Users\Dell\Desktop\KOM\kom-landing
npm install
npm run build
```

The final files will be generated in `kom-landing/out`.

### Step 2: Upload the generated files

Upload the contents of `kom-landing/out` into the public web root on Hostinger, usually `public_html`.

### Step 3: Do not upload the backend or admin there

Those two need either:

- Hostinger VPS
- another Node hosting provider
- or a platform such as Fly.io, Railway, Render, or similar

## 6. Updating Later

Whenever you change code:

```bash
cd /var/www/kom
git pull
cd /var/www/kom/hostinger
docker compose up -d --build
```

## 7. Rollback and Debug

Useful commands:

```bash
cd /var/www/kom/hostinger
docker compose ps
docker compose logs --tail=200 backend
docker compose logs --tail=200 admin
docker compose logs --tail=200 landing
docker compose restart backend
docker compose restart admin
docker compose restart landing
```

## 8. Common Mistakes

- DNS does not point to the VPS yet.
- `backend.env` still contains placeholder secrets.
- Database URL is wrong or the database blocks external access.
- Admin was built before `API_DOMAIN` was set correctly.
- You used shared hosting for services that require Node.

## 9. Minimal Deployment Order

If you want the safest order, do it like this:

1. Deploy the backend and make sure `health/live` works.
2. Deploy the admin and confirm it calls the live API.
3. Deploy the landing page last.