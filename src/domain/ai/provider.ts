export interface AIAnalysisResult {
  summary: string;
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface AIProvider {
  /**
   * Processes a transcript to extract insights.
   */
  analyze(transcript: string): Promise<AIAnalysisResult>;
}

export class MockAIProvider implements AIProvider {
  async analyze(transcript: string): Promise<AIAnalysisResult> {
    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      summary: "The audio discusses the mock transcription process and represents a test run.",
      actionItems: ["Verify the mock pipeline", "Implement the real provider"],
      sentiment: "neutral",
    };
  }
}
