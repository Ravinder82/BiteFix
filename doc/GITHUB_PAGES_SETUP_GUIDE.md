# BiteFix: App Store Connect legal URLs & Webpage Setup Guide

To meet Apple App Store Guidelines (Section 5.1.1 for Privacy and Section 3.1.2 for Subscriptions), your app must point to live, public URLs for the **Privacy Policy**, **EULA/Terms**, and **Support/Contact Page**.

The necessary pages are created inside the `docs/` folder of your repository. Once hosted on GitHub Pages, they will serve as your official app legal site.

---

## 🌎 Part 1: How to Enable GitHub Pages (Step-by-Step)

Follow these steps to host your legal pages for free directly from your GitHub repository:

1. **Go to GitHub**:
   Open your browser and navigate to your repository page:
   👉 [https://github.com/Ravinder82/BiteFix](https://github.com/Ravinder82/BiteFix)

2. **Navigate to Settings**:
   Click on the **Settings** tab (the gear icon ⚙️) in the top menu bar of your repository.

3. **Open Pages Section**:
   On the left-side navigation sidebar, scroll down to the **Code and automation** section and click on **Pages**.

4. **Configure Build and Deployment**:
   * **Source**: Select **Deploy from a branch** from the dropdown menu.
   * **Branch**: 
     * Select `main` from the branch dropdown.
     * Select `/docs` from the folder dropdown (this tells GitHub to serve files from the `docs` folder we just populated).
     * Click **Save**.

5. **Wait for Deployment**:
   GitHub will trigger an automated workflow to deploy the site. Within **1 to 2 minutes**, refresh the Page. A banner will appear at the top saying:
   > "Your site is live at `https://ravinder82.github.io/BiteFix/`"

---

## 🔗 Part 2: Final Legal URLs for App Store Connect

Once your GitHub Pages site is live, use these exact URLs when submitting the app in **App Store Connect**:

* **Support URL (Marketing & Support page)**:
  `https://ravinder82.github.io/BiteFix/`
* **Privacy Policy URL**:
  `https://ravinder82.github.io/BiteFix/privacy.html`
* **Terms of Service / EULA URL**:
  `https://ravinder82.github.io/BiteFix/eula.html`

---

## 📧 Part 3: Setting Up Your App's Email Links

The app's support flow is configured to use `support@bitefixapp.com` and `feedback@bitefixapp.com`. To ensure emails sent by users are received correctly, you have three options to set up these addresses:

### Option A: Email Forwarding (Recommended - Free)
If you own the domain name `bitefixapp.com` (e.g. registered on Namecheap, GoDaddy, Google Domains/Squarespace):
1. Log in to your Domain Registrar console.
2. Go to **DNS Settings** -> **Email Forwarding**.
3. Create a redirect rule:
   * **Alias**: `support` -> **Forwards to**: *your personal email* (e.g., `ravinderpoonia@gmail.com`)
   * **Alias**: `feedback` -> **Forwards to**: *your personal email*
4. Incoming support emails will land instantly in your personal inbox for free.

### Option B: Professional Workspace (Paid)
If you want to reply directly from your professional address (e.g., `support@bitefixapp.com`):
1. Sign up for **Google Workspace** or **Microsoft 365** using your domain name.
2. Verify domain ownership by adding the required **MX records** in your Domain Registrar's DNS panel.
3. Create individual mailboxes or a shared inbox alias for `support` and `feedback`.

### Option C: Fallback Web Contact
In the event that a user does not have a native email client configured on their iPhone (or uses a third-party app), we added a **Web Support Portal** button in the app settings. This button opens `https://ravinder82.github.io/BiteFix/` in Safari, which provides a web link to click and send support requests.
