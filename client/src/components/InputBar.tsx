"use client";

import { useRef, useState } from "react";

/* -------- Voice API (Browser built-in) -------- */
const SpeechRecognition =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    : null;

interface Props {
  currentMessage: string;
  setCurrentMessage: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const InputBar = ({ currentMessage, setCurrentMessage, onSubmit }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const [listening, setListening] = useState(false);

  /* -------- Text Change -------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMessage(e.target.value);
  };

  /* -------- Voice Input -------- */
  const startVoiceInput = () => {
    if (!SpeechRecognition) {
      alert("❌ Voice input not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN"; // Hinglish friendly
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setCurrentMessage((prev) =>
        prev ? prev + " " + transcript : transcript
      );
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  /* -------- File Upload -------- */
  const handleFileSelect = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      alert(`✅ Uploaded: ${data.filename}`);
    } catch {
      alert("❌ File upload failed");
    }
  };

  return (
    <form onSubmit={onSubmit} className="p-4 bg-white">
      <div className="flex items-center bg-[#F9F9F5] rounded-full p-3 shadow-md border border-gray-200">
        {/* Emoji (future use) */}
        <button
          type="button"
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
        >
          😊
        </button>

        {/* Input */}
        <input
          type="text"
          value={currentMessage}
          onChange={handleChange}
          placeholder="Type or speak..."
          className="flex-grow px-4 py-2 bg-transparent focus:outline-none text-gray-700"
        />

        {/* 🎤 Voice */}
        <button
          type="button"
          onClick={startVoiceInput}
          className={`p-2 rounded-full transition ${
            listening
              ? "bg-red-100 text-red-600 animate-pulse"
              : "text-gray-500 hover:bg-gray-100"
          }`}
          title="Voice input"
        >
          🎤
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />

        {/* Attach */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
        >
          📎
        </button>

        {/* Send */}
        <button
          type="submit"
          className="bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-600 hover:to-teal-500 rounded-full p-3 ml-2 shadow-md transition"
        >
          ➤
        </button>
      </div>
    </form>
  );
};

export default InputBar;
