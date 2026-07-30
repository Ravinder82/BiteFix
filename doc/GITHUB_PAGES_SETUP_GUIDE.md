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
     * Select `/docs` from the folder dropdown (this tells GitHub to serve files from the `docs` folder).
     * Click **Save**.

5. **Wait for Deployment**:
   GitHub will trigger an automated workflow to deploy the site. Within **1 to 2 minutes**, refresh the Page. A banner will appear at the top saying:
   > "Your site is live at `https://ravinder82.github.io/BiteFix/`"

---

## 🔗 Part 2: Final Legal URLs for App Store Connect

Use these URLs when configuring your app metadata inside **App Store Connect**:

* **Support URL (Support & Contact Page)**:
  `https://ravinder82.github.io/BiteFix/`
  *(Point this here so users and Apple Reviewers can contact you directly or view legal terms)*

* **Privacy Policy URL**:
  `https://ravinder82.github.io/BiteFix/privacy.html`
  *(Apple requires a public privacy policy link for all apps)*

* **App Store Terms of Use / EULA URL**:
  * **Option A: Official Standard Apple EULA (Recommended)**:
    `https://www.apple.com/legal/internet-services/itunes/dev/stgula/`
    *(If you do not want to host a custom license, Apple allows you to point to their standard developer SLA link directly. This is the App Store standard.)*
  * **Option B: Custom EULA**:
    `https://ravinder82.github.io/BiteFix/eula.html`
    *(Use this link if you choose to enforce our custom End User License Agreement instead of Apple's default terms)*

---

## 📧 Part 3: Support Email Setup (No Custom Domain Required)

Since you do not own a custom domain, you can use a free, dedicated Gmail address (like **`bitefixapp@gmail.com`**) to receive user support and feedback.

1. **How Gmail is Integrated**:
   * The app is pre-programmed to direct all support inquiries to `bitefixapp@gmail.com`.
   * When a user taps **Contact Support** or **Send App Feedback**, the app dynamically opens their mail app with the recipient set to `bitefixapp@gmail.com` and automatically pre-fills crucial debug info (such as App Version and OS Platform).
2. **Apple Compliance**:
   * Gmail addresses are fully acceptable to Apple Connect for indie developers. There is no domain verification required for support contacts.
3. **Fallback Web Portal**:
   * If a user doesn't have a mail app configured, the settings group includes a **Web Support Portal** button that opens `https://ravinder82.github.io/BiteFix/` in Safari, which displays your support contact email.
