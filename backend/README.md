# Nexora Backend

Backend service for the Nexora Agentic AI Coding Assistant.

## Tech Stack

- **FastAPI** - Web framework
- **LangGraph** - Agentic workflow orchestration
- **LangChain** - LLM integration
- **PostgreSQL + pgvector** - Database and vector storage
- **OpenAI/Ollama** - LLM providers

## Project Structure

```
backend/
├── app/
│   ├── main.py              # Application entry point
│   ├── config.py            # Configuration management
│   ├── dependencies.py      # Dependency injection
│   ├── api/                 # API routes
│   ├── graph/               # LangGraph workflows
│   ├── nodes/               # LangGraph nodes (debug, explain, optimize)
│   ├── prompts/             # Prompt templates
│   ├── models/              # Request/response models
│   ├── services/            # Core services (LLM, embedding, diff)
│   ├── memory/              # Memory and vector store
│   ├── tools/               # Workspace tools (read, write, search)
│   └── utils/               # Utility functions
├── requirements.txt
├── .env.example
└── README.md
```

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Initialize the database:
```bash
# TODO: Add database initialization script
```

## Running

Development mode:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Production mode:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Architecture

### LangGraph Workflow

The backend uses LangGraph to orchestrate agentic workflows:

1. **Context Node** - Gathers workspace context
2. **Memory Node** - Retrieves relevant memory from vector store
3. **Specialized Nodes** - Debug, Explain, or Optimize based on request

### Memory System

- Uses PostgreSQL with pgvector for semantic search
- Stores embeddings of code and conversations
- Enables context-aware responses

### Services

- **LLM Service** - Manages LLM provider (OpenAI/Ollama)
- **Embedding Service** - Generates embeddings for memory
- **Diff Service** - Generates and applies code diffs

## Development

### Adding a New Node

1. Create a new file in `app/nodes/`
2. Implement the node function with signature `async def node_name(state: GraphState) -> Dict[str, Any]`
3. Register the node in `app/graph/builder.py`
4. Add the node to workflow configuration

### Adding a New Tool

1. Create a new file in `app/tools/`
2. Implement the tool functions
3. Add documentation and error handling
4. Integrate with relevant nodes

## Testing

```bash
pytest
```

## TODO

- [ ] Implement all placeholder functions
- [ ] Add comprehensive tests
- [ ] Add monitoring and observability
- [ ] Add rate limiting
- [ ] Add authentication
- [ ] Add streaming support
- [ ] Add more LLM providers
