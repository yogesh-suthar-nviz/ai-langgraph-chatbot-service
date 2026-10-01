import { logger } from './logger.js';

export interface GraphExecutionMetrics {
  graphRunId: string;
  conversationId: string;
  totalDurationMs: number;
  nodeTimings: Record<string, number>;
  toolCallsCount: number;
  estimatedPromptTokens: number;
  estimatedCompletionTokens: number;
  status: 'success' | 'interrupted' | 'error';
}

export class MetricsCollector {
  private startTime: number = Date.now();
  private nodeStartTimes: Map<string, number> = new Map();
  private nodeDurations: Record<string, number> = {};
  private toolCallCount = 0;
  private promptTokens = 0;
  private completionTokens = 0;

  constructor(
    private readonly graphRunId: string,
    private readonly conversationId: string
  ) {}

  startNode(nodeName: string): void {
    this.nodeStartTimes.set(nodeName, Date.now());
  }

  endNode(nodeName: string): void {
    const start = this.nodeStartTimes.get(nodeName);
    if (start) {
      this.nodeDurations[nodeName] = Date.now() - start;
      this.nodeStartTimes.delete(nodeName);
    }
  }

  /**
   * Attributes an already-measured duration to a node. Used when consuming
   * LangGraph's "updates" stream, where a node is only observable on completion.
   */
  recordNodeDuration(nodeName: string, durationMs: number): void {
    this.nodeDurations[nodeName] = (this.nodeDurations[nodeName] || 0) + durationMs;
  }

  recordToolCall(): void {
    this.toolCallCount++;
  }

  recordTokens(prompt: number, completion: number): void {
    this.promptTokens += prompt;
    this.completionTokens += completion;
  }

  finish(status: 'success' | 'interrupted' | 'error' = 'success'): GraphExecutionMetrics {
    const totalDurationMs = Date.now() - this.startTime;
    const metrics: GraphExecutionMetrics = {
      graphRunId: this.graphRunId,
      conversationId: this.conversationId,
      totalDurationMs,
      nodeTimings: this.nodeDurations,
      toolCallsCount: this.toolCallCount,
      estimatedPromptTokens: this.promptTokens,
      estimatedCompletionTokens: this.completionTokens,
      status,
    };

    logger.info('Graph execution completed', {
      metrics,
    });

    return metrics;
  }
}
