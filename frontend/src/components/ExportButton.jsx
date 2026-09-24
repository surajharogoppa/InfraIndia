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

    // Force 3:4 ratio on the export wrapper if it's the map
    const isMap = targetId === 'full-map-export-wrapper';
    let originalWidth = element.style.width;
    let originalHeight = element.style.height;
    let mapSvg = element.querySelector('#map-container-export');
    let originalSvgHeight = '';
    
    if (isMap) {
      element.style.width = '900px';
      element.style.height = '1200px'; // 3:4 ratio
      if (mapSvg) {
        originalSvgHeight = mapSvg.style.height;
        mapSvg.style.height = '1000px'; // fill most of the 1200px
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
        if (mapSvg) mapSvg.style.height = originalSvgHeight;
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

    // Force 3:4 ratio on the export wrapper if it's the map
    const isMap = targetId === 'full-map-export-wrapper';
    let originalWidth = element.style.width;
    let originalHeight = element.style.height;
    let mapSvg = element.querySelector('#map-container-export');
    let originalSvgHeight = '';
    
    if (isMap) {
      element.style.width = '900px';
      element.style.height = '1200px'; // 3:4 ratio
      if (mapSvg) {
        originalSvgHeight = mapSvg.style.height;
        mapSvg.style.height = '1000px'; // fill most of the 1200px
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
        if (mapSvg) mapSvg.style.height = originalSvgHeight;
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
