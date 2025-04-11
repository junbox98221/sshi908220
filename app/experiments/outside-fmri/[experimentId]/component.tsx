"use client";

import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ExperimentPage({
  experimentId,
}: {
  experimentId: string;
}) {
  const [words, setWords] = useState<string[]>([]);
  const [inputWord, setInputWord] = useState("");
  const [wordCount, setWordCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const isRequestInProgress = useRef<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchExperiment() {
      try {
        const response = await axios.get(`/api/experiments/${experimentId}`);
        setWords([response.data.seedWord]);
        setWordCount(0);
      } catch (error) {
        console.error("Error fetching experiment data:", error);
      }
    }
    fetchExperiment();
  }, [experimentId]);

  useEffect(() => {
    if (wordCount >= 21) {
      router.push("/experiments");
      return;
    }
  }, [wordCount]);

  const handleAddWord = async () => {
    if (!inputWord.trim() || loading || isRequestInProgress.current) return;

    isRequestInProgress.current = true;
    setLoading(true);

    console.log("📢 단어 추가 요청 중...");

    try {
      await axios.post("/api/words", {
        experimentId,
        word: inputWord,
      });

      console.log("✅ 서버 응답: 단어 추가 성공");
      setWords((prevWords) => [...prevWords.slice(-1), inputWord]);
      setInputWord("");
      setWordCount((prevCount) => prevCount + 1);
    } catch (error) {
      console.error("Error adding word:", error);
    } finally {
      setTimeout(() => {
        isRequestInProgress.current = false;
        setLoading(false);
      }, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!loading && !isRequestInProgress.current) {
        handleAddWord();
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <p className="text-lg text-gray-700">단어 입력: {wordCount}/21</p>

      <div className="relative w-full max-w-2xl h-48 flex flex-col items-center justify-center mt-6">
        <p className="absolute top-1/3 text-4xl font-bold text-black">
          {words[words.length - 1] ?? ""}
        </p>
      </div>

      <div className="flex">
        <input
          type="text"
          placeholder="단어 입력"
          value={inputWord}
          onChange={(e) => setInputWord(e.target.value)}
          onKeyDown={handleKeyPress}
          className="mt-4 p-2 border border-gray-300 rounded-lg text-black"
        />
        <button
          onClick={handleAddWord}
          disabled={loading}
          className={`mt-2 px-4 py-2 text-white rounded-lg ${
            loading ? "bg-gray-400" : "bg-green-500 hover:bg-green-700"
          }`}
        >
          단어 추가
        </button>
      </div>
    </div>
  );
}
