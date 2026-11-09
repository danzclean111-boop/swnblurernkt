# DanzClean Design System v2 — "Sharp Signal"

Konsep: janji produk adalah *HD tanpa blur*. UI dibuat tajam dan tenang; blur hanya untuk latar.
Elemen khas: **focus brackets** (siku bidik kamera) pada kotak upload/statistik dan animasi **focus-pull** (blur → tajam) pada judul.

## Token (style.css, `:root`)
- Surface: `--bg #060913`, `--surface #0d1430`, `--surface-2 #121a3a`, `--surface-3 #19244f`, garis `--line`, `--line-strong`
- Aksi tunggal: `--primary #4d7cff` (semua CTA). Mint `--accent #36e2a8` hanya untuk status HD/online/sukses. Amber `--amber` untuk donasi. `--danger` untuk bahaya.
- Teks: `--text-main`, `--text-2`, `--text-muted`, `--text-3` (semua >= 4.5:1 di atas surface)
- Font: Plus Jakarta Sans (UI), JetBrains Mono (status, angka). Radius `--r-sm/md/lg/xl`. Easing `--ease`, `--ease-spring`.

## Komponen
Topbar, dock navigasi, modal/popup (satu pola), tombol (`button`, `.btn-ghost`, `.btn-primary`), input, status line, kartu downloader (`.dl-*`), kartu statistik (`.stat-*`).

## Catatan
- Backend, API, auth, dan logika JS tidak diubah. Hanya markup presentasional, class, dan CSS.
- Layout desktop: index berubah menjadi 2 kolom (`.idx-page`), grid preset melebar, topbar/dock dibatasi lebar.

## v3 — Penyempurnaan detail
- Token baru: `--primary-hi/mid/lo`, `--violet`, `--cta-grad`, `--tap` (44px), `--dur-1/2/3`, `--sp-1..6`, `--dock-clear`. Hex liar di komponen diganti token.
- Ikon struktural memakai SVG (`.ic`), bukan emoji. Ikon modal memakai `data-tone` (success/error/warn/info) lewat `setModalTone()` di login & settingakun.
- Tombol modal: `.modal-btn` (utama), `-cs`, `-danger`, `-cancel`; tanpa `style=""` inline.
- Target sentuh minimal 44px; teks minimal 12px (kecuali label dock 11px).
- Konten dan kolom ketik CS diberi ruang `--dock-clear` agar tidak tertutup dock.
