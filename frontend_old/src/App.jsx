import React, { useState } from "react";

function App() {
  const [image, setImage] = useState(null);
  const [logo, setLogo] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
    setResultUrl(null);
  };

  const handleLogoChange = (e) => {
    setLogo(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("image", image);
    if (logo) formData.append("logo", logo);
    const res = await fetch("http://localhost:5000/process", {
      method: "POST",
      body: formData,
    });
    const blob = await res.blob();
    setResultUrl(URL.createObjectURL(blob));
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <form
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md"
        onSubmit={handleSubmit}
      >
        <h1 className="text-2xl font-bold mb-4 text-center">Image Gradient Fade Tool</h1>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Player Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Logo (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="w-full"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
          disabled={loading}
        >
          {loading ? "Processing..." : "Generate"}
        </button>
      </form>
      {resultUrl && (
        <div className="flex flex-col items-center">
          <img
            src={resultUrl}
            alt="Result"
            className="max-w-full max-h-96 rounded shadow-lg mb-4"
          />
          <a
            href={resultUrl}
            download="gradient_image.png"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Download Image
          </a>
        </div>
      )}
    </div>
  );
}

export default App;
