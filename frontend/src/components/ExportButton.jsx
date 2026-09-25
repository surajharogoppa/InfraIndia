import { toBlob } from 'html-to-image';
import { Download, Share2 } from 'lucide-react';

export default function ExportButton({ targetId, fileName }) {
  const handleDownload = async () => {
    const element = document.getElementById(targetId);
    if (!element) return;
    
    const originalBg = element.style.background;
    element.style.background = 'var(--bg-card)';
    
    const filter = (node) => {
      return !node.classList?.contains('no-export');
    };
    
    // Temporarily reset zoom to capture full map
    const zoomGroup = element.querySelector('#map-zoom-group');
    let originalTransform = '';
    let originalTransition = '';
    if (zoomGroup) {
      originalTransform = zoomGroup.style.transform;
      originalTransition = zoomGroup.style.transition;
      zoomGroup.style.transition = 'none';
      zoomGroup.style.transform = 'translate(0px, 0px) scale(1)';
    }

    // Crop cleanly at the bottom of the map when exporting full map
    const isMap = targetId === 'full-map-export-wrapper';
    let originalWidth = element.style.width;
    let originalHeight = element.style.height;
    let originalOverflow = element.style.overflow;
    let mapSvg = element.querySelector('#map-container-export');
    let originalSvgHeight = '';
    let originalSvgWidth = '';
    let mapWrap = element.querySelector('.map-wrap');
    let originalMapWrapHeight = '';
    let originalMapWrapMaxHeight = '';
    let originalMapWrapMinHeight = '';
    let originalMapWrapOverflow = '';
    
    if (isMap) {
      element.style.width = '900px';
      element.style.height = 'auto';
      element.style.overflow = 'hidden';
      if (mapWrap) {
        originalMapWrapHeight = mapWrap.style.height;
        originalMapWrapMaxHeight = mapWrap.style.maxHeight;
        originalMapWrapMinHeight = mapWrap.style.minHeight;
        originalMapWrapOverflow = mapWrap.style.overflow;
        mapWrap.style.height = '620px';
        mapWrap.style.maxHeight = '620px';
        mapWrap.style.minHeight = '0px';
        mapWrap.style.overflow = 'hidden';
      }
      if (mapSvg) {
        originalSvgHeight = mapSvg.style.height;
        originalSvgWidth = mapSvg.style.width;
        mapSvg.style.width = '100%';
        mapSvg.style.height = '675px';
      }
    }

    // Wait for a tick to allow the DOM to update the layout
    await new Promise(r => setTimeout(r, 200));
    
    try {
      const blob = await toBlob(element, { filter, pixelRatio: 2, backgroundColor: '#ffffff' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export chart:', err);
    } finally {
      element.style.background = originalBg;
      if (isMap) {
        element.style.width = originalWidth;
        element.style.height = originalHeight;
        element.style.overflow = originalOverflow;
        if (mapWrap) {
          mapWrap.style.height = originalMapWrapHeight;
          mapWrap.style.maxHeight = originalMapWrapMaxHeight;
          mapWrap.style.minHeight = originalMapWrapMinHeight;
          mapWrap.style.overflow = originalMapWrapOverflow;
        }
        if (mapSvg) {
          mapSvg.style.height = originalSvgHeight;
          mapSvg.style.width = originalSvgWidth;
        }
      }
      if (zoomGroup) {
        zoomGroup.style.transition = originalTransition;
        zoomGroup.style.transform = originalTransform;
      }
    }
  };

  const handleShare = async () => {
    const element = document.getElementById(targetId);
    if (!element) return;
    
    const originalBg = element.style.background;
    element.style.background = 'var(--bg-card)';
    
    const filter = (node) => {
      return !node.classList?.contains('no-export');
    };
    
    // Temporarily reset zoom to capture full map
    const zoomGroup = element.querySelector('#map-zoom-group');
    let originalTransform = '';
    let originalTransition = '';
    if (zoomGroup) {
      originalTransform = zoomGroup.style.transform;
      originalTransition = zoomGroup.style.transition;
      zoomGroup.style.transition = 'none';
      zoomGroup.style.transform = 'translate(0px, 0px) scale(1)';
    }

    // Crop cleanly at the bottom of the map when exporting full map
    const isMap = targetId === 'full-map-export-wrapper';
    let originalWidth = element.style.width;
    let originalHeight = element.style.height;
    let originalOverflow = element.style.overflow;
    let mapSvg = element.querySelector('#map-container-export');
    let originalSvgHeight = '';
    let originalSvgWidth = '';
    let mapWrap = element.querySelector('.map-wrap');
    let originalMapWrapHeight = '';
    let originalMapWrapMaxHeight = '';
    let originalMapWrapMinHeight = '';
    let originalMapWrapOverflow = '';
    
    if (isMap) {
      element.style.width = '900px';
      element.style.height = 'auto';
      element.style.overflow = 'hidden';
      if (mapWrap) {
        originalMapWrapHeight = mapWrap.style.height;
        originalMapWrapMaxHeight = mapWrap.style.maxHeight;
        originalMapWrapMinHeight = mapWrap.style.minHeight;
        originalMapWrapOverflow = mapWrap.style.overflow;
        mapWrap.style.height = '620px';
        mapWrap.style.maxHeight = '620px';
        mapWrap.style.minHeight = '0px';
        mapWrap.style.overflow = 'hidden';
      }
      if (mapSvg) {
        originalSvgHeight = mapSvg.style.height;
        originalSvgWidth = mapSvg.style.width;
        mapSvg.style.width = '100%';
        mapSvg.style.height = '675px';
      }
    }

    // Wait for a tick to allow the DOM to update the layout
    await new Promise(r => setTimeout(r, 200));
    
    try {
      const blob = await toBlob(element, { filter, pixelRatio: 2, backgroundColor: '#ffffff' });
      if (!blob) return;
      const file = new File([blob], `${fileName}.png`, { type: 'image/png' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: fileName,
          files: [file]
        });
      } else if (navigator.clipboard && window.ClipboardItem && window.isSecureContext) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        alert("Image copied to clipboard!");
      } else {
        // Ultimate fallback: Just download it
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert("Sharing not supported, so the image was downloaded instead.");
      }
    } catch (err) {
      console.error('Failed to share chart:', err);
      alert("Failed to share chart. It may be due to browser security restrictions or unsupported chart elements.");
    } finally {
      element.style.background = originalBg;
      if (isMap) {
        element.style.width = originalWidth;
        element.style.height = originalHeight;
        element.style.overflow = originalOverflow;
        if (mapWrap) {
          mapWrap.style.height = originalMapWrapHeight;
          mapWrap.style.maxHeight = originalMapWrapMaxHeight;
          mapWrap.style.minHeight = originalMapWrapMinHeight;
          mapWrap.style.overflow = originalMapWrapOverflow;
        }
        if (mapSvg) {
          mapSvg.style.height = originalSvgHeight;
          mapSvg.style.width = originalSvgWidth;
        }
      }
      if (zoomGroup) {
        zoomGroup.style.transition = originalTransition;
        zoomGroup.style.transform = originalTransform;
      }
    }
  };

  return (
    <div className="no-export" style={{ display: 'flex', gap: '8px', zIndex: 10 }}>
      <button 
        type="button" 
        className="btn btn-ghost btn-icon btn-sm" 
        onClick={handleDownload} 
        title="Download Image"
      >
        <Download size={14} />
      </button>
      <button 
        type="button" 
        className="btn btn-ghost btn-icon btn-sm" 
        onClick={handleShare} 
        title="Share or Copy"
      >
        <Share2 size={14} />
      </button>
    </div>
  );
}
