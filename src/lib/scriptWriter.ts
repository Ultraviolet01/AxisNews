import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function writeScript(section: string, articles: any[], edition: 'morning' | 'night', curatedHeadline?: string, curatedLead?: string) {
  try {
    if (!articles?.length) throw new Error(`No articles returned for section: ${section}`);
    
    const headlines = articles.map(a => `- ${a.title} (${a.source?.name ?? 'Unknown'})`).join('\n');

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are ARIA, a sharp AI news anchor for AXIS News.
        Write a ${edition} broadcast script for the ${section} section.
        
        The main story is: "${curatedHeadline}"
        Context: "${curatedLead}"
        
        Supporting headlines:\n${headlines}\n\n
        Return JSON only: { "headline": "string", "lead": "string", "talkingPoints": ["string"], "falPrompt": "string", "duration": "3:30" }`
      }]
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (err: any) {
    console.error(`[AXIS] Claude error for ${section}:`, err.message || err);
    console.warn(`[AXIS] Claude failed for ${section}, using mock script`);
    return {
      headline: `Top Stories in ${section.charAt(0).toUpperCase() + section.slice(1)}`,
      lead: `In our top ${section} stories this morning, we are tracking significant developments that could shape the week ahead.`,
      talkingPoints: [
        `First, a major update regarding international relations and trade.`,
        `Next, how new technological shifts are impacting local markets.`,
        `And finally, what analysts are predicting for the coming quarter.`
      ],
      falPrompt: `cinematic professional news studio background for ${section}, high definition, sharp lighting`,
      duration: "0:45"
    };
  }
}
