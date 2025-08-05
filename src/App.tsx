import { useRef, useState } from "react";
import { jsPDF } from "jspdf";

type ImageData = {
  file: File;
  url: string;
  rotated: number;
};

function App() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [queue, setQueue] = useState<ImageData[]>([]);
  const [pdfName, setPdfName] = useState("meu-pdf");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [tempPdfName, setTempPdfName] = useState("");

  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    const newImages: ImageData[] = filesArray.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      rotated: 0,
    }));

    setImages((prev) => [...prev, ...newImages]);
  };

  const addToQueue = () => {
    if (selectedIndex === null) return;
    const selected = images[selectedIndex];
    setQueue((prev) => [...prev, selected]);
  };

  const addAllToQueue = () => {
    const alreadyInQueue = new Set(queue.map((q) => q.url));
    const newOnes = images.filter((img) => !alreadyInQueue.has(img.url));
    setQueue((prev) => [...prev, ...newOnes]);
    setImages((prev) => prev.filter((img) => alreadyInQueue.has(img.url)));
    setSuccessMessage("Imagem adicionada com sucesso!");
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 2000);
  };

  const removeSelectedImage = () => {
  if (selectedIndex === null) return;
  setImages((prev) => prev.filter((_, idx) => idx !== selectedIndex));
  setSelectedIndex(null);
};

const removeAllImages = () => {
  setImages([]);
  setQueue([]);
  setSelectedIndex(null);
};

const removeFromQueue = (index: number) => {
  setQueue((prev) => prev.filter((_, idx) => idx !== index));
};

const clearQueue = () => {
  setQueue([]);
};

  const generatePdf = async () => {
    if (queue.length === 0) return;
    const pdf = new jsPDF();

    for (let i = 0; i < queue.length; i++) {
      const img = queue[i];
      const imgData = await rotateImage(img);
      const imgProps = pdf.getImageProperties(imgData);
      const ratio = Math.min(
        pdf.internal.pageSize.getWidth() / imgProps.width,
        pdf.internal.pageSize.getHeight() / imgProps.height
      );

      if (i !== 0) pdf.addPage();
      pdf.addImage(
        imgData,
        "JPEG",
        0,
        0,
        imgProps.width * ratio,
        imgProps.height * ratio
      );
    }

    pdf.save(`${pdfName || "meu-pdf"}.pdf`);
  };

  const rotateImage = (img: ImageData): Promise<string> => {
  return new Promise((resolve) => {
    const image = new Image();
    image.src = img.url;
    image.onload = () => {
      const angle = img.rotated;
      const maxWidth = 1000;

      let width = image.width;
      let height = image.height;

      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      if (angle === 90 || angle === 270) {
        canvas.width = height;
        canvas.height = width;
      } else {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((angle * Math.PI) / 180);
      ctx.drawImage(
        image,
        -width / 2,
        -height / 2,
        width,
        height
      );

      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
  });
};


  return (
    <div style={{ padding: "2rem" }}>
      <h1>Gerador de PDF com Imagens</h1>
      <input
        type="file"
        multiple
        accept="image/png, image/jpeg"
        ref={inputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <button
  onClick={() => inputRef.current?.click()}
  style={{
    backgroundColor: "#009E60",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    fontSize: "16px",
    borderRadius: "6px",
    cursor: "pointer",
    marginRight: "1rem",
  }}
>
  📁 Escolher Imagens
</button>
        <label>
          Nome do PDF:{" "}
          <input
            value={pdfName}
            onChange={(e) => setPdfName(e.target.value)}
            placeholder="meu-arquivo"
          />
        </label>
        <button onClick={generatePdf} style={{ marginLeft: "1rem", marginRight: "1rem" }}>
          🧾 Gerar PDF
        </button>
            {queue.length > 0 && (
        <button onClick={clearQueue} style={{ backgroundColor: "#FF4D4F" }}>
          🧹 Limpar fila
        </button>
    )}
    <span style={{ marginLeft: "15px", fontSize: "18px" }}>Imagens Incluídas: {queue.length}</span>

      <div style={{ display: "flex", flexWrap: "wrap", marginTop: "1rem", flexDirection: "row" }}>
        {images.map((img, idx) => (
  <div
    key={idx}
    style={{
      display: "flex",
      alignItems: "center",
      margin: "10px 0",
    }}
  >
<div
      style={{
        position: "relative",
        width: "300px",
        height: "300px",
        overflow: "hidden",
        marginRight: "2px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        border: "1px solid #ccc",
        borderRadius: "6px",
        backgroundColor: "#f9f9f9",
      }}
      onDoubleClick={() => {
        const selected = images[idx];
        if (!queue.some((q) => q.url === selected.url)) {
          setQueue((prev) => [...prev, selected]);
          setImages((prev) => prev.filter((_, i) => i !== idx));
          setSuccessMessage("Imagem adicionada com sucesso!");
          setShowSuccessMessage(true);
          setTimeout(() => {
            setShowSuccessMessage(false);
          }, 2000);
        }

      }}
    >
      <img
        src={img.url}
        alt={`thumb-${idx}`}
        style={{
          transform: `rotate(${img.rotated}deg)`,
          maxWidth: "100%",
          maxHeight: "100%",
          display: "block",
          border: "1px solid #ccc",
          borderRadius: "6px",
          objectFit: "contain",
          zIndex: 1,
        }}
      />
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginRight: "25px" }}>
      <button
        onClick={() => {
          setImages((prev) =>
            prev.map((imgItem, i) =>
              i === idx
                ? { ...imgItem, rotated: (imgItem.rotated + 90) % 360 }
                : imgItem
            )
          );
        }}
        style={{
          backgroundColor: "#FFC107",
          border: "none",
          padding: "6px 10px",
          fontSize: "14px",
          borderRadius: "6px",
          cursor: "pointer",
          color: "#000",
        }}
      >
        🔄 Girar
      </button>

      <button
        onClick={() => {
          if (!queue.some((q) => q.url === img.url)) {
            setQueue((prev) => [...prev, img]);
            setImages((prev) => prev.filter((_, i) => i !== idx));
            setSuccessMessage("Imagem adicionada com sucesso!");
            setShowSuccessMessage(true);
            setTimeout(() => {
              setShowSuccessMessage(false);
            }, 2000);
          }
        }}
        style={{
          backgroundColor: "#009E60",
          color: "#fff",
          border: "none",
          padding: "6px 10px",
          fontSize: "14px",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        ➕ Incluir
      </button>
      <button
  onClick={() => {
    setModalImage(img.url);
    setTempPdfName(pdfName);
    setShowModal(true);
  }}
  style={{
    backgroundColor: "#17A2B8",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    fontSize: "14px",
    borderRadius: "6px",
    cursor: "pointer",
  }}
>
  🔍 Ampliar
</button>

    </div>
  </div>
))}


      </div>

      {selectedIndex !== null && (
  <div style={{ marginTop: "1rem" }}>
    <button onClick={addToQueue} style={{ marginLeft: "1rem" }}>
      ➕ Incluir na fila
    </button>
    <button onClick={removeSelectedImage} style={{ marginLeft: "1rem", color: "red" }}>
      ❌ Remover imagem
    </button>
  </div>
)}

{images.length > 0 && (
  <div style={{ marginTop: "1rem" }}>
    <button onClick={addAllToQueue}>➕ Incluir todas na fila</button>
    <button onClick={removeAllImages} style={{ marginLeft: "1rem", color: "red" }}>
      🗑️ Remover todas
    </button>
  </div>
)}

  <div style={{ marginTop: "2rem" }}>
    <h3>Fila:</h3>
  </div>
    <div style={{ display: "flex", flexWrap: "wrap", flexDirection: "row" }}>
      {queue.map((img, idx) => (
        <div
  key={idx}
  style={{
    width: "300px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    border: "1px solid #ccc",
    borderRadius: "6px",
    padding: "12px",
    backgroundColor: "#f9f9f9",
  }}
>
  <img
    src={img.url}
    alt={`fila-${idx}`}
    style={{
      width: "100%",
      height: "300px",
      objectFit: "contain",
      transform: `rotate(${img.rotated}deg)`,
      marginBottom: "12px",
    }}
  />
  <button
    onClick={() => removeFromQueue(idx)}
    style={{
      backgroundColor: "#FF4D4F",
      color: "#fff",
      border: "none",
      padding: "6px 12px",
      fontSize: "14px",
      borderRadius: "6px",
      cursor: "pointer",
    }}
  >
    ❌ Remover
  </button>
</div>

      ))}
    </div>
    {successMessage && (
  <div
    style={{
      position: "fixed",
      top: "20px",
      right: "20px",
      backgroundColor: "#d4edda",
      color: "#155724",
      border: "1px solid #c3e6cb",
      borderRadius: "6px",
      padding: "12px 20px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      fontSize: "16px",
      opacity: showSuccessMessage ? 1 : 0,
      transition: "opacity 0.5s ease-in-out",
      zIndex: 1000,
    }}
  >
    {successMessage}
  </div>
)}
      {showModal && modalImage && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
      flexDirection: "column",
      padding: "2rem",
    }}
  >
    <img
      src={modalImage}
      alt="Ampliada"
      style={{
        maxWidth: "80%",
        maxHeight: "70vh",
        borderRadius: "8px",
        boxShadow: "0 0 10px rgba(0,0,0,0.5)",
        marginBottom: "1rem",
      }}
    />
    <input
      type="text"
      placeholder="Digite o nome do PDF"
      value={tempPdfName}
      onChange={(e) => setTempPdfName(e.target.value)}
      style={{
        padding: "8px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        marginBottom: "1rem",
        width: "300px",
      }}
    />
    <button
      onClick={() => {
        setPdfName(tempPdfName);
        setShowModal(false);
        setModalImage(null);
      }}
      style={{
        padding: "10px 20px",
        backgroundColor: "#009E60",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "16px",
      }}
    >
      ✅ Aplicar
    </button>
  </div>
)}

    </div>
  );
}

export default App;
