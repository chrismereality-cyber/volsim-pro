# VOLSIM PRO Render Deployment Guide

This guide helps you deploy VOLSIM PRO Dashboard to Render in one shot.

## Prerequisites

- GitHub repository with your `volsim-pro` project
- Node.js >= 24
- `web-dashboard.js` and `dashboard.html` present in the repo
- `package.json` with `"type": "module"` and dependencies installed

## Render Web Service Setup

1. Go to https://dashboard.render.com
2. Click **New → Web Service**
3. Connect your GitHub repo (`volsim-pro`)
4. Select **Branch:** `main`

## Configure Service

- **Name:** volsim-pro
- **Environment:** Node
- **Region:** Any
- **Instance Type:** Free / Starter
- **Build Command:**
