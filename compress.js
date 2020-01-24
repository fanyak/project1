// compress images
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');

async function compress(file) {
    return imagemin([file], {
        destination: 'uploads/img',
        plugins: [
            imageminMozjpeg({quality: 50}),
            imageminPngquant({
                quality: [0.1, 0.8]
            })
        ]
    });
}

exports.compress =compress;
