// ImageCarousel.js
import React, { useState, useEffect } from 'react';
import './ImageCarousel.css'; // 請建立此 CSS 檔案

const ImageCarousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images]);

  return (
    <div className="carousel-container">
      {images.length > 0 && (
        // 利用 key 使圖片每次更新時都重新 mount 觸發動畫
        <img
          key={currentIndex}
          src={images[currentIndex]}
          alt={`Slide ${currentIndex}`}
          className="carousel-image"
        />
      )}
    </div>
  );
};

export default ImageCarousel;
