/**
 * Cloudinary Image Optimizer
 * 
 * Transforms Cloudinary URLs to serve optimized images:
 * - Auto format (WebP/AVIF where supported)
 * - Auto quality compression
 * - Resized to the exact dimensions needed
 * - Reduces image size from ~2MB to ~30-50KB
 */

/**
 * Optimize a Cloudinary image URL with transformations
 * @param {string} url - Original Cloudinary URL
 * @param {object} options - Optimization options
 * @param {number} options.width - Target width in pixels
 * @param {number} options.height - Target height (optional)
 * @param {string} options.quality - Quality: 'auto', 'auto:low', 'auto:eco', 'auto:good', 'auto:best'
 * @param {string} options.crop - Crop mode: 'fill', 'fit', 'thumb', 'scale'
 * @param {string} options.gravity - Focus area: 'auto', 'center', 'face'
 * @returns {string} Optimized URL
 */
export function optimizeCloudinaryUrl(url, options = {}) {
    if (!url || typeof url !== 'string') return url;

    // Only optimize Cloudinary URLs
    if (!url.includes('res.cloudinary.com')) return url;

    const {
        width = 400,
        height,
        quality = 'auto',
        crop = 'fill',
        gravity = 'auto',
        format = 'auto',
    } = options;

    // Build transformation string
    let transforms = `f_${format},q_${quality},c_${crop},g_${gravity},w_${width}`;
    if (height) transforms += `,h_${height}`;

    // Insert transformations into URL
    // Cloudinary URL format: .../image/upload/v1234/folder/image.jpg
    // We insert transforms after "upload/": .../image/upload/f_auto,q_auto,.../v1234/folder/image.jpg
    const optimized = url.replace(
        '/image/upload/',
        `/image/upload/${transforms}/`
    );

    return optimized;
}

/**
 * Pre-configured size presets for common use cases
 */
export const imagePresets = {
    // Product card thumbnail (grid view)
    thumbnail: (url) => optimizeCloudinaryUrl(url, { width: 300, height: 300, quality: 'auto:eco' }),
    
    // Product card in list view
    listItem: (url) => optimizeCloudinaryUrl(url, { width: 200, height: 200, quality: 'auto:eco' }),

    // Subcategory circle icon
    subcategoryIcon: (url) => optimizeCloudinaryUrl(url, { width: 128, height: 128, quality: 'auto:eco', crop: 'thumb' }),

    // Category banner / hero
    banner: (url) => optimizeCloudinaryUrl(url, { width: 800, height: 400, quality: 'auto:good' }),

    // Product detail page (large)
    detail: (url) => optimizeCloudinaryUrl(url, { width: 600, height: 600, quality: 'auto:good' }),

    // Cart item (small)
    cartItem: (url) => optimizeCloudinaryUrl(url, { width: 100, height: 100, quality: 'auto:low' }),
};

export default optimizeCloudinaryUrl;
