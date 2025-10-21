Here’s the **SunLMS Integration Guide** in clean, developer-friendly **Markdown format**.

# 🔗 SunLMS Integration Guide

**Version:** 1.0  
**Last Updated:** Oct 2025  
**Audience:** Developers integrating SunLMS into an existing platform

---

## 👋 Welcome

Welcome to **SunLMS** — a multi-tenant learning management platform for delivering professional, CPD-accredited learning experiences.

This guide explains how to integrate your system with SunLMS to provide a **seamless experience** for your users.

---

## 🗂️ Contents

1. [How SunLMS Works](#️-how-sunlms-works)  
2. [Your Subdomain](#your-subdomain)  
3. [SSO Integration (Single Sign-On)](#sso-integration-single-sign-on)  
4. [Course Completion & CPD Tracking](#course-completion--cpd-tracking)  
5. [Branding Your LMS](#branding-your-lms)  
6. [Optional: Custom Domain](#optional-custom-domain)  
7. [Developer Checklist](#developer-checklist)  
8. [Support & Contact](#support--contact)  

---

## ⚙️ How SunLMS Works

SunLMS is hosted at `sunlms.com`. Each organization gets a dedicated **subdomain**:

```
https://yourorg.sunlms.com
```

Each subdomain is:
- Branded with your logo
- Scoped to your courses, users, and CPD records

---

## 🌐 Your Subdomain

You'll receive a subdomain like:

```
https://agahf.sunlms.com
```

> Use this domain to access the LMS, set up branding, and begin SSO integration.

---

## 🔐 SSO Integration (Single Sign-On)

To let users access the LMS without logging in twice, implement **JWT-based SSO**.

### 🔁 Flow

1. User logs into your system  
2. Your server generates a signed JWT  
3. You redirect the user to:

```
https://yourorg.sunlms.com/sso-login?token=YOUR_JWT
```

4. SunLMS verifies the token and logs the user in

---

### 🔐 JWT Payload Example

```json
{
  "email": "jane@yourorg.com",
  "name": "Jane Doe",
  "tenant": "yourorg",
  "exp": 1699999999
}
```

- **Algorithm:** `HS256`  
- **Sign with:** the secret provided by SunLMS

---

### 🔗 Redirect with Optional Course

You may optionally direct users to a specific course:

```
https://yourorg.sunlms.com/sso-login?token=...&redirect=/courses/ethics-101
```

---

## 📬 Course Completion & CPD Tracking

SunLMS can send data to your system when a user completes a course.

### ✅ Option A: Webhook

You provide an endpoint like:

```
POST https://yourorg.com/api/cpd/update
```

**Payload Example:**

```json
{
  "email": "jane@yourorg.com",
  "courseId": "ethics-101",
  "cpdPoints": 3,
  "completedAt": "2025-10-17T14:00:00Z"
}
```

---

### 🔄 Option B: Pull from API

Query user progress from our API:

```
GET /api/tenant/yourorg/users/{email}/progress
Authorization: Bearer <api_key>
```

---

## 🎨 Branding Your LMS

You can brand your LMS with:

- ✅ Your logo  
- ✅ Organization name  
- ✅ (Optional) Brand color *(coming soon)*

### API:

```http
POST /api/tenant/yourorg/branding
{
  "logo_url": "https://yourcdn.com/logo.png"
}
```

Or provide during registration.

---

## 🌐 Optional: Custom Domain

To use a branded domain like `lms.yourorg.com`:

1. Set a CNAME:

   ```
   lms.yourorg.com → cname.vercel-dns.com
   ```

2. Notify us, and we'll link it and provision SSL.

---

## 🧰 Developer Checklist

| Task                         | Status             |
| ---------------------------- | ------------------ |
| ✅ Subdomain confirmed        | yourorg.sunlms.com |
| 🔑 JWT secret received       | Yes / No           |
| 🔐 SSO flow implemented      | Yes / No           |
| 📬 Webhook endpoint provided | Yes / No           |
| 🎨 Branding/logo configured  | Yes / No           |
| 🧪 Test account created      | Yes / No           |

---

## 📞 Support & Contact

- 📧 Email: `support@sunlms.com`  
- 📘 Docs: [https://docs.sunlms.com](https://docs.sunlms.com)  
- 🧑‍💻 Dev Chat: *(available by request)*

---

> Thank you for choosing **SunLMS**! We’re here to support your team and your learners.





follow easily.

🔗 SunLMS Integration Guide

Version: 1.0
Last Updated: Oct 2025
For: Developers integrating SunLMS into their organization's platform

👋 Welcome

Welcome to SunLMS — a multi-tenant learning management platform that allows organizations to deliver professional, CPD-accredited learning experiences with zero setup overhead.

This guide explains how to integrate your existing system or web platform with SunLMS, providing a seamless user experience for your members or employees.

🗂️ Contents

How SunLMS Works

Your Subdomain

SSO Integration (Single Sign-On)

Course Completion + CPD Tracking

Branding Your LMS

Optional: Custom Domain Setup

Support & Contact

⚙️ How SunLMS Works

SunLMS is a multi-tenant LMS hosted at sunlms.com. Each organization gets a unique subdomain, for example:

https://yourorg.sunlms.com


This subdomain is:

Branded with your logo and theme

Scoped to your users only

Shows only your courses and CPD activity

🌐 Your Subdomain

Upon registration, your organization is assigned a subdomain:

Example: https://agahf.sunlms.com

To get started:

You’ll receive a welcome email confirming your subdomain.

You can now configure access via SSO or embed it in your website.

🔐 SSO Integration

To allow your users to access the LMS without a second login, you can implement JWT-based Single Sign-On (SSO).

🔁 SSO Flow

User logs into your platform (e.g. agahf.com)

You generate a JWT for the user

Redirect them to:

https://<your-subdomain>.sunlms.com/sso-login?token=YOUR_JWT


SunLMS validates the token and logs them in automatically

🔐 JWT Format

Use HS256 to sign the token. Here's an example payload:

{
  "email": "jane@yourorg.com",
  "name": "Jane Doe",
  "tenant": "yourorg",      // your subdomain slug
  "exp": 1699999999         // expiration timestamp
}


Sign the JWT with your shared secret (provided by SunLMS).

Note: You must keep this secret safe — anyone with it can generate valid tokens.

🧪 Sample Redirect URL
https://yourorg.sunlms.com/sso-login?token=eyJhbGciOiJIUzI1...

✅ Optional Parameters

redirect=/courses/ethics-101 — direct the user to a specific course after login.

📬 Course Completion & CPD Tracking

When a user completes a course, SunLMS can notify your platform to track CPD points.

Option A: Webhook (Recommended)

Provide us with a POST endpoint on your system, e.g.:

https://yourorg.com/api/cpd/update


We'll send a payload like:

{
  "email": "jane@yourorg.com",
  "courseId": "ethics-101",
  "cpdPoints": 3,
  "completedAt": "2025-10-17T14:00:00Z"
}

Option B: API Pull

You can also pull course completion data from our API:

GET https://sunlms.com/api/tenant/yourorg/users/{email}/progress
Authorization: Bearer <api_key>

🎨 Branding Your LMS

SunLMS allows you to customize your LMS with your:

✅ Organization name

✅ Logo (PNG or SVG)

✅ Primary brand color (coming soon)

You can set these during registration or via the branding API:

POST /api/tenant/yourorg/branding
{
  "logo_url": "https://yourcdn.com/logo.png"
}

🌐 Optional: Custom Domain

If you prefer to host the LMS at a branded domain like lms.yourorg.com:

Set a CNAME record:

lms.yourorg.com → cname.vercel-dns.com


Inform us, and we’ll provision SSL and link the domain to your tenant

🧰 Developer Checklist
Task	Status
✅ Subdomain confirmed	e.g. yourorg.sunlms.com
🔑 JWT secret received	Keep it safe
🔐 SSO redirect set up	Your platform → LMS
📬 Webhook endpoint (optional)	For CPD tracking
🎨 Logo uploaded	For branded experience
🧪 Test account created	For integration testing
📞 Support & Contact

Need help? Contact us at:

📧 Email: support@sunlms.com

📄 Docs: https://docs.sunlms.com

🛠️ Slack/Discord: (available for enterprise customers)

Thank you for choosing SunLMS! We're excited to power your learning experience.