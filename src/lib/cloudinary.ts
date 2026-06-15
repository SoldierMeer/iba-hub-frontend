// lib/cloudinary.ts
export const optimizeImage = (url: string | undefined, width: number, height: number): string => {
    if (!url) return '';
    
    // If it's a default generic avatar or a Google/Github OAuth URL, leave it alone
    if (!url.includes('cloudinary.com')) return url;
  
    // Cloudinary URLs look like this:
    // https://res.cloudinary.com/cloud_name/image/upload/v1234567/folder/image.jpg
    // We need to inject our parameters right after 'upload/'
    
    const parts = url.split('upload/');
    if (parts.length !== 2) return url;
  
    // c_fill = crop to fill the exact dimensions without stretching
    // f_auto = auto format (WebP/AVIF)
    // q_auto = auto quality (AI compression)
    return `${parts[0]}upload/w_${width},h_${height},c_fill,f_auto,q_auto/${parts[1]}`;
  };