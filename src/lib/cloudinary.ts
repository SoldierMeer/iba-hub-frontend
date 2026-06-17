export const optimizeImage = (url: string | undefined, width: number, height?: number): string => {
    if (!url) return '';
    
    // If it's a default generic avatar or a Google/Github OAuth URL, leave it alone
    if (!url.includes('cloudinary.com')) return url;
  
    const parts = url.split('upload/');
    if (parts.length !== 2) return url;
  
    // 🚀 If height is provided, use it. Otherwise, scale only by width to prevent distortion.
    const sizeParams = height ? `w_${width},h_${height}` : `w_${width}`;
    
    return `${parts[0]}upload/${sizeParams},c_scale,f_auto,q_auto/${parts[1]}`;
};