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
    setImages((prev) => prev.filter((img) => alreadyInQueue.has(img.url))); // remove os adicionados
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
        "PNG",
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
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const angle = img.rotated;

        if (angle === 90 || angle === 270) {
          canvas.width = image.height;
          canvas.height = image.width;
        } else {
          canvas.width = image.width;
          canvas.height = image.height;
        }

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((angle * Math.PI) / 180);
        ctx.drawImage(
          image,
          -image.width / 2,
          -image.height / 2,
          image.width,
          image.height
        );

        resolve(canvas.toDataURL("image/png"));
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

      <div style={{ display: "flex", flexWrap: "wrap", marginTop: "1rem", flexDirection: "column" }}>
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
        marginRight: "12px",
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

    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
    <div style={{ display: "flex", flexWrap: "wrap", flexDirection: "column" }}>
      {queue.map((img, idx) => (
        <div
          key={idx}
          className="image-card"
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            margin: "6px",
          }}
        >
          <img
            src={img.url}
            alt={`fila-${idx}`}
            width={240}
            style={{ marginTop: "50px", marginBottom: "50px", transform: `rotate(${img.rotated}deg)` }}
          />
          <button
            onClick={() => removeFromQueue(idx)}
            style={{
    marginTop: "4px",
    marginLeft: "100px",
    backgroundColor: "#FF4D4F",
    color: "#fff",
    border: "none",
    padding: "4px 8px",
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

    {queue.length > 0 && (
      <div className="buttons" style={{ marginTop: "1rem" }}>
        <button onClick={clearQueue} style={{ backgroundColor: "#FF4D4F" }}>
          🧹 Limpar fila
        </button>
      </div>
    )}
  </div>

  <div style={{ marginTop: "2rem" }}>
        <label>
          Nome do PDF:{" "}
          <input
            value={pdfName}
            onChange={(e) => setPdfName(e.target.value)}
            placeholder="meu-arquivo"
          />
        </label>
        <button onClick={generatePdf} style={{ marginLeft: "1rem" }}>
          🧾 Gerar PDF
        </button>
      </div>

    </div>
  );
}

export default App;
