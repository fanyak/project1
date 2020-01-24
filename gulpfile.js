
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');


async function defaultTask() {
    const files = await imagemin( ['uploads/*.{jpg,png}'], {
        destination: 'build/images',
        plugins: [
            imageminMozjpeg({quality: 50}),
            imageminPngquant({
                quality: [0.6, 0.8]
            })
           
        ]
    });
    console.log(files)
}
  
  exports.default = defaultTask
