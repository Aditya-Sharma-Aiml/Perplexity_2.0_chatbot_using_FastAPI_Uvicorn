
import os

for k in [
    "HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy",
    "ALL_PROXY", "all_proxy"
]:
    os.environ[k] = ""


# Imports

from typing import TypedDict, Annotated, Optional
from uuid import uuid4
import json

from dotenv import load_dotenv

from fastapi import FastAPI, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from langgraph.graph import add_messages, StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessageChunk, ToolMessage

from langchain_tavily import TavilySearch



# ENV
load_dotenv()

# REQUIRED in .env:
# OPENAI_API_KEY=or-xxxxxxxxxxxxxxxx
# OPENAI_BASE_URL=https://openrouter.ai/api/v1
# TAVILY_API_KEY=tvly-xxxxxxxxxxxxxx


# LangGraph State
class State(TypedDict):
    messages: Annotated[list, add_messages]

memory = MemorySaver()

# Tool (Tavily Search)
search_tool = TavilySearch(max_results=4)
tools = [search_tool]

# LLM (OpenRouter via OpenAI-compatible API)
llm = ChatOpenAI(
    model="openai/gpt-4o-mini",   
    temperature=0,
    base_url=os.getenv("OPENAI_BASE_URL"),
    api_key=os.getenv("OPENAI_API_KEY"),
    default_headers={
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Perplexity-Clone",
    },
)

llm_with_tools = llm.bind_tools(tools=tools)


# Graph Nodes

async def model(state: State):
    try:
        result = await llm_with_tools.ainvoke(state["messages"])
        return {"messages": [result]}
    except Exception as e:
        # NEVER crash SSE
        return {
            "messages": [
                AIMessageChunk(content=f"❌ Error: {str(e)}")
            ]
        }

async def tools_router(state: State):
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tool_node"
    return END

async def tool_node(state: State):
    tool_calls = state["messages"][-1].tool_calls
    tool_messages = []

    for call in tool_calls:
        if call["name"] == search_tool.name:
            result = await search_tool.ainvoke(call["args"])
            tool_messages.append(
                ToolMessage(
                    content=str(result),
                    tool_call_id=call["id"],
                    name=call["name"]
                )
            )

    return {"messages": tool_messages}


# Build Graph

graph_builder = StateGraph(State)

graph_builder.add_node("model", model)
graph_builder.add_node("tool_node", tool_node)

graph_builder.set_entry_point("model")
graph_builder.add_conditional_edges("model", tools_router)
graph_builder.add_edge("tool_node", "model")

graph = graph_builder.compile(checkpointer=memory)


# FastAPI App

app = FastAPI()

# ---------------- Title Generator ----------------

@app.post("/title")
def generate_title(payload: dict):
    text = payload.get("text", "")
    prompt = f"""
Generate a short, meaningful chat title (max 4 words).

Rules:
- Ignore greetings like hi, hello, hey.
- Do NOT use quotes.
- Do NOT repeat the input text.
- Title should reflect the topic, not greetings.

User message:
{text}
"""


    response = llm.invoke(prompt)
    title = response.content.strip().strip('"').strip("'")
    return {"title": title}



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Helpers

def serialise_ai_message_chunk(chunk):
    if isinstance(chunk, AIMessageChunk):
        return chunk.content
    raise TypeError("Invalid chunk type")


# SSE Generator

async def generate_chat_responses(message: str, checkpoint_id: Optional[str] = None):
    new_chat = checkpoint_id is None

    if new_chat:
        checkpoint_id = str(uuid4())
        yield f"data: {{\"type\": \"checkpoint\", \"checkpoint_id\": \"{checkpoint_id}\"}}\n\n"

    config = {
        "configurable": {
            "thread_id": checkpoint_id
        }
    }

    events = graph.astream_events(
        {"messages": [HumanMessage(content=message)]},
        version="v2",
        config=config
    )

    async for event in events:
        etype = event["event"]

        if etype == "on_chat_model_stream":
            text = serialise_ai_message_chunk(event["data"]["chunk"])
            safe = text.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")
            yield f"data: {{\"type\": \"content\", \"content\": \"{safe}\"}}\n\n"

        elif etype == "on_tool_end" and event["name"] == search_tool.name:
            output = event["data"]["output"]
            urls = [x["url"] for x in output if isinstance(x, dict) and "url" in x]
            yield f"data: {{\"type\": \"search_results\", \"urls\": {json.dumps(urls)} }}\n\n"

    yield f"data: {{\"type\": \"end\"}}\n\n"



# API Route

@app.get("/chat_stream/{message}")
async def chat_stream(message: str, checkpoint_id: Optional[str] = Query(None)):
    return StreamingResponse(
        generate_chat_responses(message, checkpoint_id),
        media_type="text/event-stream"
    )


