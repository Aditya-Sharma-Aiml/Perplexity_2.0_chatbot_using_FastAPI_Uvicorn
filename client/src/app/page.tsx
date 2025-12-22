"use client";
import { Moon, Sun } from "lucide-react";

import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import InputBar from "@/components/InputBar";
import MessageArea from "@/components/MessageArea";
import Sidebar from "@/components/Sidebar";

/* ---------------- Types ---------------- */

interface SearchInfo {
  stages: string[];
  query: string;
  urls: string[];
}

interface Message {
  id: number;
  content: string;
  isUser: boolean;
  type: string;
  isLoading?: boolean;
  searchInfo?: SearchInfo;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

/* ---------------- Page ---------------- */

const Home = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [currentMessage, setCurrentMessage] = useState("");
  const [checkpointId, setCheckpointId] = useState<string | null>(null);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  /* ---------- Load history ---------- */

  useEffect(() => {
    const saved = localStorage.getItem("perplexity-history");
    if (saved) {
      const parsed: Conversation[] = JSON.parse(saved);
      setConversations(parsed);
      setActiveConversationId(parsed[0]?.id || null);
    } else {
      startNewChat();
    }
  }, []);

  /* ---------- Save history ---------- */

  useEffect(() => {
    localStorage.setItem("perplexity-history", JSON.stringify(conversations));
  }, [conversations]);

  /* ---------- New Chat ---------- */

  const startNewChat = () => {
    const id = crypto.randomUUID();

    const newConversation: Conversation = {
      id,
      title: "New Chat",
      messages: [
        {
          id: Date.now(),
          content: "Hi there, how can I help you?",
          isUser: false,
          type: "message",
        },
      ],
    };

    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(id);
    setCheckpointId(null);
  };

  /* ---------- Delete Chat ---------- */

  const deleteConversation = (id: string) => {
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);
    setActiveConversationId(remaining[0]?.id || null);
  };

  /* ---------- Rename Chat ---------- */

  const renameConversation = (id: string) => {
    const title = prompt("Enter new chat name");
    if (!title) return;

    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );
  };

  /* ---------- Send Message ---------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || !activeConversation) return;

    const userInput = currentMessage;
    setCurrentMessage("");

    const isFirstUserMessage =
      activeConversation.messages.filter((m) => m.isUser).length === 0;

    const userMsgId = Date.now();
    const aiMsgId = userMsgId + 1;

    /* Add user + AI placeholder */
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversationId
          ? {
              ...conv,
              messages: [
                ...conv.messages,
                {
                  id: userMsgId,
                  content: userInput,
                  isUser: true,
                  type: "message",
                },
                {
                  id: aiMsgId,
                  content: "",
                  isUser: false,
                  type: "message",
                  isLoading: true,
                  searchInfo: { stages: [], query: "", urls: [] },
                },
              ],
            }
          : conv
      )
    );

    /* Generate title ONLY once (ChatGPT style) */
    if (isFirstUserMessage) {
      fetch("http://127.0.0.1:8000/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userInput }),
      })
        .then((res) => res.json())
        .then((data) => {
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === activeConversationId
                ? { ...conv, title: data.title || conv.title }
                : conv
            )
          );
        })
        .catch(() => {});
    }

    /* ---------- Streaming ---------- */

    let url = `http://127.0.0.1:8000/chat_stream/${encodeURIComponent(
      userInput
    )}`;

    if (checkpointId) {
      url += `?checkpoint_id=${checkpointId}`;
    }

    const eventSource = new EventSource(url);

    let streamedContent = "";
    let hasReceivedContent = false;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "checkpoint") {
        setCheckpointId(data.checkpoint_id);
      }

      if (data.type === "content") {
        streamedContent += data.content;
        hasReceivedContent = true;

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((m) =>
                    m.id === aiMsgId
                      ? { ...m, content: streamedContent, isLoading: false }
                      : m
                  ),
                }
              : conv
          )
        );
      }

      if (data.type === "end") {
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      if (hasReceivedContent) {
        eventSource.close();
        return;
      }

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? {
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === aiMsgId
                    ? {
                        ...m,
                        content: "Connection issue, please retry.",
                        isLoading: false,
                      }
                    : m
                ),
              }
            : conv
        )
      );

      eventSource.close();
    };
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={setActiveConversationId}
        onNewChat={startNewChat}
        onDelete={deleteConversation}
        onRename={renameConversation}
      />

      <div className="flex flex-col flex-1">
        <Header />
        <MessageArea messages={activeConversation?.messages || []} />
        <InputBar
          currentMessage={currentMessage}
          setCurrentMessage={setCurrentMessage}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default Home;
