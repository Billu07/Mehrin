# Mehrin's Memory Lane

Magical scrapbook-style digital diary with 3D page turns and bilingual (Bangla/English) storytelling.

## Experience

- Wizardly book layout with real page-by-page folding
- Bilingual narrative per page
- In-page editor for draggable/rotatable text, image, video, sticker, and secret slots
- Dynamic chapter index generated from `chapter-divider` pages
- Dated notes system managed separately in Admin
- Admin panel focused on page ordering and Notes tab entries only

## Editor Auth and Upload

Copy `.env.example` to `.env` and fill values:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_EDITOR_ALLOWED_EMAILS=
VITE_VIEWER_ACCESS_PASSWORD=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

- If Supabase keys are set, editor access uses Supabase magic-link sign-in.
- Access is allowed when user role is `admin`/`editor` in Supabase `app_metadata`,
  or email is listed in `VITE_EDITOR_ALLOWED_EMAILS` (comma-separated list supported).
- If `VITE_VIEWER_ACCESS_PASSWORD` is set, `/` is password-protected for viewers.
- If Supabase keys are not set, the local passcode fallback is used.
- If Cloudinary keys are set, image/video slots can upload files directly from the in-page inspector.
- Signed-in admins can toggle between full viewer mode and editor tools from the top bar.

## Run

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite.
- Diary view: `/`
- Admin panel: `/admin`

## Checks

```bash
npm run check
npm run lint
npm run build
```

## Main Files

- `src/App.tsx`: scene navigation, dynamic chapter map routing, in-page editor
- `src/components/AdminPanel.tsx`: page ordering and notes management
- `src/content/magicalBook.ts`: page schema, layout templates, initial content
- `src/hooks/useBookPages.ts`: localStorage-backed content persistence
- `src/lib/editorAccess.ts`: Supabase editor access rules
- `src/lib/cloudinary.ts`: direct Cloudinary upload helper
- `src/index.css`: magical book visuals and 3D styles
