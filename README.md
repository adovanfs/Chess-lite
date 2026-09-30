<div align="center">

# ♟️ Chess Lite

**Permainan catur modern di browser — dengan bot AI, animasi halus, dan tampilan dark elegan.**

[![Live Demo](https://img.shields.io/badge/🎮_Live_Demo-Coba_Sekarang-c9a961?style=for-the-badge)](https://adovanfs.github.io/)
[![GitHub Pages](https://img.shields.io/badge/Hosted_on-GitHub_Pages-181717?style=for-the-badge&logo=github)](https://pages.github.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

[![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/docs/Web/HTML)
[![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)

</div>

---

## ✨ Fitur

| Fitur | Deskripsi |
|---|---|
| 🤖 **Bot AI** | Minimax + Alpha-Beta Pruning, kedalaman 3 langkah |
| ♟️ **Aturan Catur Lengkap** | Semua langkah legal, skak, skakmat, stalemate |
| 🏰 **Castling** | Raja & benteng bisa geser bareng |
| 👑 **Promosi Pion** | Pion sampai ujung otomatis jadi ratu |
| 🎯 **En Passant** | Tangkap pion lawan secara khusus |
| 🎬 **Animasi Smooth** | Bidak meluncur dengan cubic-bezier, bukan lompat |
| 🎨 **Dark Elegant UI** | Tema hitam minimalis dengan aksen emas |
| 📜 **Riwayat Langkah** | Catat setiap langkah yang terjadi |
| 📱 **Responsive** | Jalan mulus di HP dan laptop |
| 🚀 **Zero Dependency** | HTML + CSS + JS murni, tanpa framework |

---

## 🎮 Cara Main

1. Buka **[Live Demo](https://adovanfs.github.io/)**
2. Kamu otomatis jadi **Putih**, bot jadi **Hitam**
3. Klik bidak putih → kotak akan di-highlight
4. Klik kotak tujuan → bidak meluncur ke sana
5. Tunggu bot mikir (status jadi **"Bot berpikir..."**)
6. Ulangi sampai salah satu menang! 🏆

| Aksi | Cara |
|---|---|
| Pilih bidak | Tap / klik bidak |
| Jalan | Tap / klik kotak tujuan |
| Batal pilih | Tap kotak kosong lain |
| Main ulang | Klik tombol **New Game** |

---

## ⚙️ Konfigurasi

Mau ubah tingkat kesulitan bot? Buka `index.html`, cari baris ini di bagian `<script>`:

```javascript
var BOT_ENABLED = true;   // false = main 2 orang di 1 device
var BOT_COLOR = 'b';      // bot main sebagai hitam
var BOT_DEPTH = 3;        // 2 = mudah, 3 = sedang, 4 = susah (lebih lambat)
