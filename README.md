# AskShala Website

Static landing page for [askshala.in](https://askshala.in). Pure HTML, CSS, and vanilla JavaScript with no build step and no external dependencies.

## Run Locally

From the repository root:

```bash
python3 -m http.server 8090
```

Open [http://localhost:8090](http://localhost:8090) in your browser.

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings → Pages** in the repository.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Select the **main** branch and **/ (root)** as the folder.
5. Click **Save**. The site will be published within a few minutes.

## Custom Domain (askshala.in)

1. Ensure the `CNAME` file in the repository root contains:

   ```
   askshala.in
   ```

2. Enable GitHub Pages on the **main** branch with the **root** folder as the source (see steps above).

3. In GoDaddy DNS for `askshala.in`, add these **A records** pointing to GitHub Pages:

   | Type | Name | Value             |
   |------|------|-------------------|
   | A    | @    | 185.199.108.153   |
   | A    | @    | 185.199.109.153   |
   | A    | @    | 185.199.110.153   |
   | A    | @    | 185.199.111.153   |

4. Optionally add a **CNAME** record for `www` pointing to your GitHub Pages URL (e.g. `your-username.github.io`).

5. Back in GitHub Pages settings, enter `askshala.in` as the custom domain and wait for DNS to propagate (up to 24 hours).

## File Structure

```
index.html          Main landing page
style.css           All styles
script.js           Navigation, scroll, form validation
CNAME               Custom domain for GitHub Pages
404.html            Branded not-found page
assets/
  oxford-buddy-mascot.png
  favicon.ico
README.md           This file
```

## Notes

- The contact form validates on the client side only and does not submit to a server.
- All asset paths are relative for GitHub Pages compatibility.
