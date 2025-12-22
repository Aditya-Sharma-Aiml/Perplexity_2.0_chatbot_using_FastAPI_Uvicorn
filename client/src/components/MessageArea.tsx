"use client";

import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

/* ---------------- Typing Animation ---------------- */

const PremiumTypingAnimation = () => {
  return (
    <div className="flex items-center space-x-1.5">
      {[0, 300, 600].map((delay, i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 bg-gray-400/70 rounded-full animate-pulse"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
};

/* ---------------- Search Stages ---------------- */

const StageDot = ({
  title,
  children,
  error = false,
}: {
  title: string;
  children?: React.ReactNode;
  error?: boolean;
}) => (
  <div className="relative">
    <div
      className={`absolute -left-3 top-1 w-2.5 h-2.5 rounded-full shadow-sm ${
        error ? "bg-red-400" : "bg-teal-400"
      }`}
    />
    <div className="pl-2">
      <span className="font-medium">{title}</span>
      {children}
    </div>
  </div>
);

const SearchStages = ({ searchInfo }: any) => {
  if (!searchInfo?.stages?.length) return null;

  return (
    <div className="mb-3 mt-1 relative pl-4">
      <div className="flex flex-col space-y-4 text-sm text-gray-700">
        {searchInfo.stages.includes("searching") && (
          <StageDot title="Searching the web">
            <div className="mt-2">
              <span className="bg-gray-100 text-xs px-3 py-1.5 rounded border">
                🔍 {searchInfo.query}
              </span>
            </div>
          </StageDot>
        )}

        {searchInfo.stages.includes("reading") && (
          <StageDot title="Reading sources">
            <div className="flex flex-wrap gap-2 mt-2">
              {searchInfo.urls?.map((url: string, i: number) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-100 text-xs px-3 py-1.5 rounded border truncate max-w-[220px] hover:bg-gray-50 transition"
                >
                  {new URL(url).hostname}
                </a>
              ))}
            </div>
          </StageDot>
        )}

        {searchInfo.stages.includes("writing") && (
          <StageDot title="Writing answer" />
        )}

        {searchInfo.stages.includes("error") && (
          <StageDot title="Search error" error>
            <p className="text-xs text-red-500 mt-1">
              {searchInfo.error || "Something went wrong"}
            </p>
          </StageDot>
        )}
      </div>
    </div>
  );
};

/* ---------------- Message Area ---------------- */

const MessageArea = ({ messages }: any) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-grow overflow-y-auto bg-[#FCFCF8] border-b border-gray-100">
      <div className="max-w-4xl mx-auto p-6 space-y-5">
        {messages.map((message: any) => (
          <div
            key={message.id}
            className={`flex ${
              message.isUser ? "justify-end" : "justify-start"
            }`}
          >
            <div className="flex flex-col max-w-md">
              {!message.isUser && message.searchInfo && (
                <SearchStages searchInfo={message.searchInfo} />
              )}

              <div
                className={`rounded-lg py-3 px-5 text-sm leading-relaxed ${
                  message.isUser
                    ? "bg-gradient-to-br from-[#5E507F] to-[#4A3F71] text-white rounded-br-none shadow-md"
                    : "bg-[#F3F3EE] text-gray-800 border border-gray-200 rounded-bl-none shadow-sm"
                }`}
              >
                {message.isLoading ? (
                  <PremiumTypingAnimation />
                ) : message.content ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="mb-2 leading-relaxed">{children}</p>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 underline hover:text-teal-700"
                        >
                          {children}
                        </a>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc ml-5 space-y-1">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal ml-5 space-y-1">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => <li>{children}</li>,
                      code: ({ children }) => (
                        <code className="bg-gray-200 text-xs px-1.5 py-0.5 rounded">
                          {children}
                        </code>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold">{children}</strong>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <span className="text-gray-400 text-xs italic">
                    Waiting for response…
                  </span>
                )}
              </div>

              {!message.isUser && message.searchInfo?.urls?.length > 0 && (
                <div className="mt-3 bg-white border rounded-lg p-3 shadow-sm">
                  <div className="text-xs font-semibold text-gray-500 mb-2">
                    🔗 Sources
                  </div>
                  <ul className="space-y-1">
                    {message.searchInfo.urls.map((url: string, i: number) => (
                      <li key={i}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-xs hover:underline break-all"
                        >
                          {i + 1}. {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default MessageArea;
