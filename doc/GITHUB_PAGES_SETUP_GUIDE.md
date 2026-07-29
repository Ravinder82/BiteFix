# Step-by-Step Guide: Hosting Legal & Support Docs on GitHub Pages

Apple requires a public live Web URL for your **Privacy Policy** and **Support Page** when submitting an app to App Store Connect. 

Using **GitHub Pages**, you can host all these documents for **100% free** under your repository (`https://ravinder82.github.io/BiteFix/`).

Follow these step-by-step instructions to deploy them in less than 3 minutes!

---

## Step 1: Create an `docs/` Folder for Web Hosting

We will copy your markdown files into a public `docs/` folder in your repository, converting them or adding simple HTML files for clean browser rendering.

### Quick Setup:
1. In your project root (`/Users/ravinderpoonia/BiteFix`), create a folder named `docs`.
2. Move/copy the markdown files or HTML wrappers into `docs/`:
   - `docs/index.html` (Landing page / Support center)
   - `docs/privacy.html` (Privacy Policy)

*(We have created styled HTML files for you so they render with modern, clean typography in web browsers!)*

---

## Step 2: Push the `docs/` Folder to GitHub

Open your terminal and run:
```bash
git add .
git commit -m "docs: add public legal and support web pages for GitHub Pages deployment"
git push origin main
```

---

## Step 3: Enable GitHub Pages in your Repository

1. Open your browser and go to your GitHub repository:  
   👉 **https://github.com/Ravinder82/BiteFix**
2. Click **Settings** (tab on the far right of the top menu bar).
3. In the left-hand sidebar, under **Code and automation**, click **Pages**.
4. Under **Build and deployment**:
   * **Source**: Select **Deploy from a branch**.
   * **Branch**: Select **`main`** and set the folder to **`/docs`** (instead of `/ (root)`).
5. Click **Save**.

---

## Step 4: Access Your Live Public URLs!

GitHub will automatically publish your pages in about 60 seconds. Your live production URLs will be:

* 🛡️ **Privacy Policy URL:**  
  `https://ravinder82.github.io/BiteFix/privacy.html`

* 📜 **Terms of Service URL:**  
  `https://ravinder82.github.io/BiteFix/terms.html`


## Step 5: Paste URLs into App Store Connect

Now you can copy these live URLs directly into App Store Connect:

1. Log in to [App Store Connect](https://appstoreconnect.apple.com/).
2. Select your app: **BiteFix: Food & Swap Scanner**.
3. Under **App Store** -> **App Information**:
   * Paste `https://ravinder82.github.io/BiteFix/privacy.html` into **Privacy Policy URL**.
4. Under **App Store** -> **[Version 2.0.0 Prepare for Submission]**:
   * Paste `https://ravinder82.github.io/BiteFix/` into **Support URL**.
5. Click **Save** on the top right.

---

🎉 **Done! Your legal and support URLs are now live, professional, and fully compliant with Apple App Store Guidelines!**
