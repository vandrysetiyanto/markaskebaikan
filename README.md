# Markas Kebaikan

A sedekah & crowdfunding landing page theme (in Bahasa Indonesia) with a **local AI
donation assistant** that runs fully on your machine via [Ollama](https://ollama.com).
No cloud, no API keys, no tracking.

## Quick start

```bash
npm install
npm run dev
```

## Running the local AI

The chatbot talks to Ollama on `http://localhost:11434` (configurable in
`src/campaign.js` under `campaign.ai`).

```bash
# 1. Install Ollama (https://ollama.com/download)
# 2. Pull a model (the theme defaults to llama3.2)
ollama pull llama3.2

# 3. Start the server
ollama serve
```

Open the page, click the chat bubble in the bottom-right corner, and ask about the
campaigns, programs, or donation flow. The connection status and model selector live
in the chat header. If the model you picked isn't pulled yet, Ollama will show an
error in the chat and the status turns amber.

## Customizing the theme

All campaign content lives in one file: `src/campaign.js`.

| Field | Purpose |
| --- | --- |
| `name`, `tagline`, `taglineFull`, `heroTrust` | Branding & hero copy |
| `stats` | Impact counters (numeric values animate up) |
| `categories` | Category labels shown on campaign badges |
| `activeCampaigns` | Live campaigns rendered as cards with funding bars |
| `programs` | Recurring programs rendered as feature cards |
| `completedCampaigns` | Funded campaigns with itemized `report` breakdowns |
| `paymentMethods` | Default payment options shown in the donation modal (admin can override via Pengaturan) |
| `nominalPresets` | Preset donation amounts (Rp 10.000 / 25.000 / 50.000 / 100.000) |
| `contact` | WhatsApp / Instagram / email links in the footer |
| `ai` | Ollama endpoint, default model, model list |
| `aiContext` | System prompt that teaches the local model about your campaign |

The donation flow (Nominal → Identitas & Doa → Pembayaran → Sukses) and the report
modal live in `src/main.js`. Style tokens (colors, radii, fonts) are in
`src/style.css` under `:root`; the design system is documented in `DESIGN.md`.

### Admin settings

The admin panel has a **Pengaturan** tab to manage the payment methods shown to
donors: add QRIS/e-wallet or Virtual Account (VA) methods, edit labels/VA details,
toggle methods on/off, or delete them. Changes are stored in
`localStorage` (`mk_payment_methods`) and immediately apply to the donation modal.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run preview` — preview the build
- `npm test` — unit tests (chat/streaming client + session + campaign data)
