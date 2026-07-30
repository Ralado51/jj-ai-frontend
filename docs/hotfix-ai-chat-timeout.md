# AI chat timeout hotfix

The shared Axios client has a 10-second default timeout, which is appropriate for regular CRUD requests but too short for local RAG generation through Ollama.

The AI Workspace request now overrides that default with a 190-second timeout, aligned with the backend chat timeout. This prevents the browser from aborting `/api/v1/projects/{project_id}/ask` while the model is still generating a response.
