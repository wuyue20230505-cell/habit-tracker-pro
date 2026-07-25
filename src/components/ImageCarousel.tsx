import { useEffect, useRef } from 'react';

interface Props {
  images: string[];
  interval?: number;
  className?: string;
}

export default function ImageCarousel({ images, interval = 6000, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (images.length <= 1) return;
    const el = containerRef.current;
    if (!el) return;

    let idx = 0;
    // 预设所有图片为背景
    const layers = el.querySelectorAll<HTMLElement>('.carousel-layer');

    // 初始状态：第一张可见
    layers[0]?.classList.add('opacity-100');

    const timer = setInterval(() => {
      const current = idx;
      idx = (idx + 1) % images.length;
      // 淡出当前
      layers[current]?.classList.remove('opacity-100');
      layers[current]?.classList.add('opacity-0');
      // 淡入下一张
      layers[idx]?.classList.remove('opacity-0');
      layers[idx]?.classList.add('opacity-100');
    }, interval);

    return () => clearInterval(timer);
  }, [images, interval]);

  if (images.length === 0) return null;

  return (
    <div ref={containerRef} className={`absolute inset-0 ${className}`}>
      {images.map((img, i) => (
        <div
          key={img}
          className="carousel-layer absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out opacity-0"
          style={{ backgroundImage: `url(${img})` }}
        />
      ))}
    </div>
  );
}
