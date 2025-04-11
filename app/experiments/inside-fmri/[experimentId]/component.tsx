"use client";

import axios from "axios";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const SLIDE_INTERVAL_MS = 200;
const SEED_DELAY_MS = 2000;
const INSTRUCTION_DELAY_MS = 5;

type Props = {
  experimentIdList: string[];
};

type WordMap = { [experimentId: string]: string[] };

export default function ExperimentDisplayComponent({
  experimentIdList,
}: Props) {
  const { push } = useRouter();

  const [words, setWords] = useState<WordMap>({});
  const [wordIndex, setWordIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [experimentIndex, setExperimentIdIndex] = useState(0);
  const [isRelaxTime, setIsRelaxTime] = useState(false);
  const [showInstruction, setShowInstruction] = useState(false);
  const [hasShownInstruction, setHasShownInstruction] = useState(false);

  const currentExperimentId = experimentIdList[experimentIndex];

  // 모든 실험 단어 fetch
  const fetchWords = useCallback(async () => {
    const newWords: WordMap = {};
    for (const id of experimentIdList) {
      try {
        const res = await axios.get(`/api/experiments/${id}`);
        newWords[id] = [
          res.data.seedWord,
          ...res.data.words.map((w: { word: string }) => w.word),
        ];
      } catch (err) {
        console.error(`Error fetching words for ${id}:`, err);
      }
    }
    setWords(newWords);
  }, [experimentIdList]);

  // 키 입력 이벤트
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key.toLowerCase() === "s" || e.key === "ㄴ") {
      setIsStarted(true);
    }
  };

  // 단어 fetch (초기)
  useEffect(() => {
    if (experimentIdList.length > 0) fetchWords();
  }, [experimentIdList, fetchWords]);

  // 키 이벤트 등록
  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  useEffect(() => {
    if (!currentExperimentId || hasShownInstruction) return;

    setShowInstruction(true);
    const timer = setTimeout(() => {
      setShowInstruction(false);
      setHasShownInstruction(true);
    }, INSTRUCTION_DELAY_MS);

    return () => clearTimeout(timer);
  }, [currentExperimentId, hasShownInstruction]);

  useEffect(() => {
    if (!isStarted || !currentExperimentId || showInstruction) return;

    const wordList = words[currentExperimentId] || [];
    const isLastWord = wordIndex >= wordList.length - 2;

    const timer = setTimeout(() => {
      if (!isLastWord) {
        setWordIndex((prev) => prev + 1);
      } else {
        setIsRelaxTime(true);
        setTimeout(() => {
          setExperimentIdIndex((prev) => {
            if (experimentIndex < experimentIdList.length) {
              return prev + 1;
            }
            return prev;
          });
          setIsRelaxTime(false);
          setWordIndex(0);
        }, SEED_DELAY_MS);
      }
    }, SLIDE_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [
    currentExperimentId,
    experimentIdList.length,
    experimentIndex,
    isStarted,
    showInstruction,
    wordIndex,
    words,
  ]);

  const isEnded =
    experimentIndex >= experimentIdList.length ||
    (experimentIndex === experimentIdList.length - 1 &&
      words[currentExperimentId] &&
      wordIndex > words[currentExperimentId].length);

  // 시작 전 "+" 화면
  if (!isStarted || isRelaxTime) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white text-6xl">+</div>
      </div>
    );
  }

  if (showInstruction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black px-8 text-center">
        <div className="text-white text-2xl space-y-16 leading-relaxed">
          <p>왼쪽에 흐린 글씨로 이전에 입력한 단어가,</p>
          <p>
            오른쪽에는 여러분이 생각 해야 할 단어가 큰 글씨로 보여질 것입니다.
          </p>
          <p>이전의 기억이나 경험 때문에 단어들을 떠올렸을 수도 있고,</p>
          <p>뚜렷한 이유가 없을 수도 있습니다.</p>
          <p>이 과제도 정답은 없고,</p>
          <p>그저 ‘아 내가 이런 생각으로 이 단어를 떠올렸나 보다’ 하고,</p>
          <p>각 단어에 대해 자신만의 의미를 생각해보세요.</p>
        </div>
      </div>
    );
  }

  // 슬라이드 화면
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <div className="relative w-full max-w-3xl h-100 flex items-center justify-center">
        {isEnded ? (
          <>
            <div
              className="text-6xl text-gray-500 text-center leading-relaxed"
              onClick={() => {
                const idList = new URLSearchParams(experimentIdList.join(","));
                push(`/experiments/rating/${idList.toString()}`);
              }}
            >
              <div>모든 단어를 연상해주셨습니다.</div>
              <div>감사합니다.</div>
            </div>
          </>
        ) : (
          <>
            <div className="absolute left-1/4 transform -translate-x-1/2 text-6xl text-gray-500">
              {wordIndex >= 1
                ? words[currentExperimentId]?.[wordIndex] ?? ""
                : ""}
            </div>
            <div className="absolute right-1/4 transform translate-x-1/2 text-8xl font-bold text-white">
              {words[currentExperimentId]?.[wordIndex + 1] ?? ""}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
