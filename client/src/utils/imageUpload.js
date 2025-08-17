export const checkImage = (file) => {
    let err = "";
    if(!file){
        return err = "File does not exist.";
    }
//?1 mb
    if(file.size > 1024 * 1024){
         return (err = "File size must be less than 1 Mb.");
    }

    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      return (err = "Image must be jpeg or png.");
    }

    return err;
}

export const imageUpload = async (images) => {
    let imgArr = [];
    try {
        for(const item of images){
            // Temporary solution: Create a compressed data URL for testing
            // In production, replace this with actual Cloudinary upload
            let url;
            if(item.camera) {
                url = item.camera; // Camera already provides data URL
            } else {
                // Convert file to compressed data URL
                url = await new Promise((resolve) => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    
                    img.onload = () => {
                        // Calculate new dimensions (max 800px width/height)
                        const maxSize = 800;
                        let { width, height } = img;
                        
                        if (width > height) {
                            if (width > maxSize) {
                                height = (height * maxSize) / width;
                                width = maxSize;
                            }
                        } else {
                            if (height > maxSize) {
                                width = (width * maxSize) / height;
                                height = maxSize;
                            }
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        
                        // Draw and compress
                        ctx.drawImage(img, 0, 0, width, height);
                        const compressedUrl = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
                        resolve(compressedUrl);
                    };
                    
                    img.src = URL.createObjectURL(item);
                });
            }
            
            const public_id = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            imgArr.push({ 
                public_id: public_id, 
                url: url 
            });
            
            /* 
            // CLOUDINARY CONFIGURATION (for production):
            // 1. Sign up at https://cloudinary.com/
            // 2. Get your credentials from dashboard
            // 3. Replace the above code with:
            
            const formData = new FormData();
            if(item.camera){
                formData.append("file", item.camera);
            }else{
                formData.append("file", item);  
            }
            
            formData.append("upload_preset", "YOUR_UPLOAD_PRESET");
            formData.append("cloud_name", "YOUR_CLOUD_NAME");
            
            const res = await fetch("https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload", {
                method: "POST",
                body: formData
            });
            
            const data = await res.json();
            imgArr.push({ public_id: data.public_id, url: data.secure_url });
            */
        }
        return imgArr;
    } catch (error) {
        console.error('Image upload error:', error);
        throw new Error('Failed to upload image');
    }
}