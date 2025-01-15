import { useState, useEffect } from "react";

const ImageWithFallback = ({ src, fallbackSrc, alt, className }) => {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    // Reset to the original src when it changes
    setImgSrc(src);
  }, [src]);

  const handleError = () => {
    // When error occurs, switch to fallback
    if (imgSrc !== fallbackSrc.src) {
      setImgSrc(fallbackSrc.src);
    }
  };

  return (
    <img src={imgSrc} alt={alt} className={className} onError={handleError} />
  );
};

export default ImageWithFallback;
