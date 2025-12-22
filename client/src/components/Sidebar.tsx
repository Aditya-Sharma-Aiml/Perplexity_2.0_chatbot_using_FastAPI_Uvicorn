"use client";

interface Conversation {
  id: string;
  title: string;
}

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string) => void;
}

const Sidebar = ({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
  onRename,
}: SidebarProps) => {
  return (
    <div className="w-64 bg-[#FCFCF8] border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-[#4A3F71] to-[#5E507F]">
        <button
          onClick={onNewChat}
          className="w-full bg-white/10 text-white text-sm py-2 rounded-lg hover:bg-white/20 transition"
        >
          + New Chat
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto py-2">
        {conversations.map((conv) => {
          const isActive = activeId === conv.id;

          return (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`group mx-2 mb-1 px-3 py-2 rounded-lg cursor-pointer text-sm flex items-center justify-between transition
                ${
                  isActive
                    ? "bg-gradient-to-r from-[#4A3F71] to-[#5E507F]"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
            >
              {/* Title */}
              <span className="truncate max-w-[170px] font-medium">
                {conv.title?.trim() || "New chat"}
              </span>

              {/* Actions */}
              <div className="hidden group-hover:flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRename(conv.id);
                  }}
                  className={`text-xs ${
                    isActive
                      ? "text-white/80 hover:text-white"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  ✏️
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  className={`text-xs ${
                    isActive
                      ? "text-white/80 hover:text-red-300"
                      : "text-gray-400 hover:text-red-500"
                  }`}
                >
                  🗑
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
