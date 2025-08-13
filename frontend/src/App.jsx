import React, { useState, useEffect } from "react";

function App() {
  const [image, setImage] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [downloadName, setDownloadName] = useState("gradient_image.png");

  const setImageFromFile = (file) => {
    setImage(file);
    setResultUrl(null);
    if (file) {
      window.crypto.subtle.digest('SHA-256', file.slice(0, 10000)).then(hashBuffer => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        const baseName = file.name && file.name.trim() ? file.name : 'pasted_image';
        setSelectedName(`${baseName} (${hashHex.slice(0, 8)})`);
      }).catch(() => setSelectedName(file.name || 'pasted_image'));
      const nameToUse = file.name && file.name.includes('.') ? file.name : (file.name || 'pasted_image.png');
      const dotIdx = nameToUse.lastIndexOf('.');
      if (dotIdx > 0) {
        setDownloadName(nameToUse.slice(0, dotIdx) + '_gradient' + nameToUse.slice(dotIdx));
      } else {
        setDownloadName(nameToUse + '_gradient');
      }
    } else {
      setSelectedName("");
      setDownloadName("gradient_image.png");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFromFile(file);
  };

  const handlePasteAreaPaste = async (e) => {
    if (loading) return;
    const items = e.clipboardData?.items || [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) setImageFromFile(file);
        e.preventDefault();
        return;
      }
    }
    const files = e.clipboardData?.files || [];
    if (files.length > 0) {
      setImageFromFile(files[0]);
      e.preventDefault();
      return;
    }
    const text = e.clipboardData?.getData('text/plain');
    if (text && /^https?:\/\//i.test(text)) {
      try {
        const res = await fetch(text);
        const blob = await res.blob();
        if (blob.type && blob.type.startsWith('image/')) {
          const ext = (blob.type.split('/')[1] || 'png').split(';')[0];
          const file = new File([blob], `pasted_image.${ext}`, { type: blob.type });
          setImageFromFile(file);
          e.preventDefault();
        }
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    const onPaste = async (e) => {
      if (loading) return;
      const items = e.clipboardData?.items || [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) setImageFromFile(file);
          return;
        }
      }
      const files = e.clipboardData?.files || [];
      if (files.length > 0) {
        setImageFromFile(files[0]);
        return;
      }
      const text = e.clipboardData?.getData('text/plain');
      if (text && /^https?:\/\//i.test(text)) {
        try {
          const res = await fetch(text);
          const blob = await res.blob();
          if (blob.type && blob.type.startsWith('image/')) {
            const ext = (blob.type.split('/')[1] || 'png').split(';')[0];
            const file = new File([blob], `pasted_image.${ext}`, { type: blob.type });
            setImageFromFile(file);
          }
        } catch {
          // Ignore paste text fetch errors
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("image", image);
    const res = await fetch("https://image-gradient-backend.onrender.com/process", {
      method: "POST",
      body: formData,
    });
    const blob = await res.blob();
    setResultUrl(URL.createObjectURL(blob));
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 py-8 px-2">
      <form
        className="bg-white shadow-2xl rounded-3xl px-8 pt-10 pb-12 mb-8 w-full max-w-md border border-gray-100 flex flex-col items-center"
        onSubmit={handleSubmit}
      >
        <h1 className="text-3xl font-extrabold mb-8 text-center text-indigo-700 tracking-tight drop-shadow-lg">Image Gradient Fade Tool</h1>
        <div className="mb-8 w-full">
          <label className="block text-gray-700 text-base font-semibold mb-3 text-left">
            Upload Your Image
          </label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition bg-gray-50"
            required={!image}
          />
          <div className="mt-2 text-xs text-gray-500">Tip: You can also paste an image (Cmd+V / Ctrl+V). On mobile, tap the box below, long-press, then Paste.</div>
          <div
            className="mt-3 w-full border-2 border-dashed border-indigo-300 rounded-lg p-4 text-sm text-gray-600 bg-indigo-50/40"
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label="Paste image here"
            onPaste={handlePasteAreaPaste}
          >
            Tap here, then long-press and choose Paste to paste an image or image URL on mobile.
          </div>
          {selectedName && (
            <div className="mt-3 flex items-center">
              <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-mono rounded-full px-3 py-1 border border-indigo-200 shadow-sm">
                {selectedName}
              </span>
            </div>
          )}
        </div>
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl w-full shadow-lg transition disabled:opacity-60 text-lg"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a 8 8 0 018-8v8z"></path></svg>
              Processing...
            </span>
          ) : (
            "Generate"
          )}
        </button>
      </form>
      {resultUrl && (
        <div className="flex flex-col items-center w-full max-w-md">
          <img
            src={resultUrl}
            alt="Result"
            className="w-full max-h-96 rounded-2xl shadow-xl mb-6 object-contain border border-gray-200 bg-white"
          />
          <a
            href={resultUrl}
            download={downloadName}
            className="bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white font-bold py-3 px-8 rounded-2xl shadow-xl transition text-lg mb-2 border-2 border-green-500"
          >
            Download Image
          </a>
        </div>
      )}
      <footer className="mt-10 text-gray-400 text-xs text-center w-full">&copy; {new Date().getFullYear()} Image Gradient Tool</footer>
    </div>
  );
}

export default App;
