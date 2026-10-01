# Developer Extensibility Guide

This guide walks through common extension scenarios without breaking existing code.

---

## 1. How to Add a New Subgraph (e.g. Travel Graph)
Adding a workflow does **not** require rewriting the Main Graph.

### Step 1: Create the Subgraph Directory
```text
src/graph/travel/
├── graph.ts
├── state.ts
└── nodes/
    ├── search-flights.ts
    └── generate-itinerary.ts
```

### Step 2: Implement the Graph Factory
```typescript
import { StateGraph, START, END } from '@langchain/langgraph';
import { ChatStateAnnotation } from '../core/types.js';

export function createTravelGraph() {
  return new StateGraph(ChatStateAnnotation)
    .addNode('search_flights', searchFlightsNode)
    .addNode('generate_itinerary', generateItineraryNode)
    .addEdge(START, 'search_flights')
    .addEdge('search_flights', 'generate_itinerary')
    .addEdge('generate_itinerary', END)
    .compile();
}
```

### Step 3: Register in Subgraph Registry
In `src/graph/core/graph-factory.ts`:
```typescript
const travelGraph = createTravelGraph();
this.register('travel', async (state) => {
  return await travelGraph.invoke(state);
});
```

### Step 4: Map Intent to Route
In `src/graph/main/router.ts`:
```typescript
case 'flight_search':
case 'hotel_booking':
  return 'travel';
```
*The Main Graph coordinates seamlessly without altering Commerce or Support workflows.*

---

## 2. How to Add a New Tool
Create your tool file under `src/tools/`:
```typescript
export class FlightSearchTool implements ApplicationTool {
  name = 'searchFlights';
  description = 'Lookup available commercial flights';
  inputSchema = z.object({ origin: z.string(), destination: z.string() });
  requiredPermission = 'travel.search';

  async execute(input, context) {
    // integration logic
    return { success: true, data: [...] };
  }
}
```
Register it in `src/tools/registry.ts`:
```typescript
this.register(new FlightSearchTool());
```

---

## 3. How to Deploy Frontend and Backend Independently

### Frontend (`chatbot-web`)
Deploy to Vercel, Netlify, or Cloudflare:
```bash
cd chatbot-web
pnpm build
# Point to your deployed AI service URL:
# NEXT_PUBLIC_AI_SERVICE_URL=https://ai.yourdomain.com
```

### Backend (`ai-service`)
Deploy to AWS ECS, Google Cloud Run, or Kubernetes:
```bash
cd ai-service
docker build -t ai-service:latest .
docker run -p 4000:4000 --env-file .env ai-service:latest
```
