import React, { useState } from "react";

function App() {
  const [image, setImage] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [downloadName, setDownloadName] = useState("gradient_image.png");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setResultUrl(null);
    if (file) {
      // Show a short hash (first 8 chars of sha256) or just the file name
      window.crypto.subtle.digest('SHA-256', file.slice(0, 10000)).then(hashBuffer => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        setSelectedName(`${file.name} (${hashHex.slice(0, 8)})`);
      }).catch(() => setSelectedName(file.name));
      // Set download name
      const dotIdx = file.name.lastIndexOf('.');
      if (dotIdx > 0) {
        setDownloadName(file.name.slice(0, dotIdx) + '_gradient' + file.name.slice(dotIdx));
      } else {
        setDownloadName(file.name + '_gradient');
      }
    } else {
      setSelectedName("");
      setDownloadName("gradient_image.png");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("image", image);
    // const res = await fetch("http://127.0.0.1:5000/process", {
    //   method: "POST",
    //   body: formData,
    // });
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
            onChange={handleImageChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition bg-gray-50"
            required
          />
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
              <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
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
