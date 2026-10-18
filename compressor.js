/**
 * Kompresi Gambar Otomatis di Sisi Klien (Browser)
 * Menurunkan ukuran file foto tugas siswa (JPG/PNG) hingga sangat hemat kuota
 */
async function compressImageFile(file, maxWidth = 480, quality = 0.3) {
    return new Promise((resolve, reject) => {
        // Jika bukan gambar, kembalikan file asli
        if (!file.type.startsWith('image/')) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Scale Down Proporsional
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert Canvas ke Blob Image (JPEG Compressed)
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            resolve(file);
                            return;
                        }
                        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        // PERBAIKAN: Menggunakan 1024 untuk konversi bytes ke KB yang akurat
                        console.log(`[Kompresi] Ukuran Asli: ${(file.size / 1024).toFixed(1)} KB -> Ukuran Hasil: ${(compressedFile.size / 1024).toFixed(1)} KB`);
                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

/**
 * Validasi File sebelum diunggah
 * Batas Maksimal File: 200 KB
 * Batas Maksimal Gambar: Kompres Otomatis
 */
async function processAndValidateFile(fileInput) {
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        return null;
    }

    let file = fileInput.files[0];
    const fileNameLower = file.name.toLowerCase();

    // 1. Jika File Adalah Gambar (Kompres Otomatis)
    if (file.type.startsWith('image/') || fileNameLower.match(/\.(jpg|jpeg|png)$/)) {
        try {
            file = await compressImageFile(file, 500, 0.25); // Resize max width 500px, quality 25%
        } catch (e) {
            console.warn('Gagal kompres gambar, menggunakan file asli:', e);
        }
    }

    // 2. Batas Maksimal Ukuran File (200 KB) untuk menghemat kuota Supabase 1000+ siswa
    const MAX_SIZE_BYTES = 200 * 1024; // 200 KB yang akurat (1024 bytes per KB)
    if (file.size > MAX_SIZE_BYTES) {
        // PERBAIKAN: Menggunakan / 1024 agar informasi ukuran di alert valid
        alert(`Ukuran file terlalu besar (${(file.size / 1024).toFixed(1)} KB)!\n\nMaksimal batas file setelah kompresi adalah 200 KB agar menghemat kuota sistem.`);
        return false;
    }

    return file;
}
