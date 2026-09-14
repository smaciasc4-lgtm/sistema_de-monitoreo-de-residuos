// Procesamiento local: las imágenes originales nunca se suben.
window.FotosReportes = {
    maxFotos: 3,
    maxOriginal: 20 * 1024 * 1024,
    maxSalida: 500 * 1024,
    async comprimir(archivo) {
        if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(archivo.type)) {
            throw new Error('Usa fotografías JPG, PNG o WebP. HEIC requiere un navegador compatible.');
        }
        if (archivo.size > this.maxOriginal) throw new Error('Cada fotografía original debe pesar como máximo 20 MB.');
        const url = URL.createObjectURL(archivo);
        const imagen = new Image();
        try {
            await new Promise((resolve, reject) => {
                imagen.onload = resolve;
                imagen.onerror = () => reject(new Error('No se pudo abrir la fotografía. Si es HEIC, conviértela a JPG e intenta otra vez.'));
                imagen.src = url;
            });
            if (!imagen.naturalWidth || !imagen.naturalHeight) throw new Error('La fotografía está dañada.');
            const canvas = document.createElement('canvas');
            let escala = Math.min(1, 1600 / Math.max(imagen.naturalWidth, imagen.naturalHeight));
            for (let paso = 0; paso < 6; paso++) {
                canvas.width = Math.max(1, Math.round(imagen.naturalWidth * escala));
                canvas.height = Math.max(1, Math.round(imagen.naturalHeight * escala));
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(imagen, 0, 0, canvas.width, canvas.height);
                for (const calidad of [0.85, 0.7, 0.55]) {
                    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', calidad));
                    if (blob && blob.size <= this.maxSalida) {
                        return new File([blob], 'foto.jpg', { type: 'image/jpeg' });
                    }
                }
                escala *= 0.75;
            }
            throw new Error('No se pudo reducir la fotografía. Prueba con otra imagen.');
        } finally {
            URL.revokeObjectURL(url);
        }
    }
};
