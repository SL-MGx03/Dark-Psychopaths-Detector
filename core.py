import asyncio
import os
from predict import report_to_llm
from prompt import SYSTEM_PROMPT
from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.tools import tool
from langchain.agents.middleware import wrap_tool_call
from langchain.messages import ToolMessage
from langchain_groq import ChatGroq

load_dotenv()

processing_lock = asyncio.Lock()

@tool
def get_dark_triad_scores(file_path: str):
    """ 
    Calls a Neural Network (Autoencoder) to analyze personality traits.
    You MUST pass the file_path provided in the user prompt to this tool.
    Returns a list of three floats [Machiavellianism, Narcissism, Psychopathy].
    Scale is 0.0 (low) to 1.0 (high).
    """
    return report_to_llm(file_path)

@tool
def get_trait_definitions():
    """
    Returns the full list of questions and definitions for the Short Dark Triad (SD3) test.
    """
    with open("codebook.txt", "r") as f:
        return f.read()

@wrap_tool_call
def handle_tool_errors(request, handler):
    try:
        return handler(request)
    except Exception as e:
        return ToolMessage(
            content=f"Tool error: {str(e)}",
            tool_call_id=request.tool_call["id"]
        )

def psycho_reader_agent(target_file):
    tools = [get_dark_triad_scores, get_trait_definitions]
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.7, groq_api_key=os.getenv("GROQ_API_KEY"))
    agent = create_agent(
        model=llm,
        tools=tools,
        middleware=[handle_tool_errors],
        system_prompt=SYSTEM_PROMPT
    )


    input_text = f"Analyze my psychopath personality based on the results in this file: {target_file}"
    return agent.invoke({"messages": [{"role": "user", "content": input_text}]})

