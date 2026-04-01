import { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Copy, RefreshCw, Wand2, Play, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface PromptPart {
  partNumber: number;
  prompt: string;
  hindiScript: string;
  visualDescription: string;
  characterCount: number;
}

export default function App() {
  const [topic, setTopic] = useState('');
  const [prompts, setPrompts] = useState<PromptPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generatePrompts = async () => {
    setLoading(true);
    setPrompts([]);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a short YouTube video script about: ${topic || 'A random trending daily topic'}.
The video will be a 4k split-screen portrait video.
Bottom half: A boy looking directly at the camera, speaking the script in Hindi. The Hindi text MUST be written strictly in the Devanagari script (e.g., "नमस्ते", NOT "namaste" or Hinglish).
Top half: Dynamic visuals related to the script. No Hindi text, only English words if any.
Visual Style: High contrast, modern social media look, Neon glow edges, Dynamic lighting.

Break the video down into sequential parts.
For each part, provide a prompt that is STRICTLY UNDER 900 characters.
Each prompt MUST follow this exact template:
"A 4k split-screen viral video. Bottom half: [ \\"Attached picture boy\\"] looking directly at the camera with high energy, naturally speaking the script in Hindi: [Insert Hindi Script in Devanagari script here], Top half: [Describe dynamic visuals for this part without any Hindi text]. 🎨 Visual Style: High contrast, modern social media look, Neon glow edges, Dynamic lighting"

Return the response as a JSON array.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                partNumber: { type: Type.INTEGER },
                prompt: { type: Type.STRING, description: "The exact prompt text following the template, under 900 chars." },
                hindiScript: { type: Type.STRING, description: "The Hindi script spoken in this part, written strictly in Devanagari script." },
                visualDescription: { type: Type.STRING, description: "The English description of the top half visuals." },
                characterCount: { type: Type.INTEGER, description: "The character count of the prompt string." }
              },
              required: ["partNumber", "prompt", "hindiScript", "visualDescription", "characterCount"]
            }
          }
        }
      });

      const jsonStr = response.text?.trim();
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        setPrompts(parsed);
      }
    } catch (error) {
      console.error("Error generating prompts:", error);
      alert("Failed to generate prompts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-4 md:p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="text-center space-y-6 pt-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center p-4 bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl shadow-emerald-900/20"
          >
            <Play className="w-10 h-10 text-emerald-400 fill-emerald-400" />
          </motion.div>
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
              Daily Shorts Prompts
            </h1>
            <p className="text-zinc-400 max-w-xl mx-auto text-lg md:text-xl">
              Generate partitioned video prompts for AI tools like Veo. Optimized for split-screen YouTube Shorts.
            </p>
          </div>
        </header>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 md:p-8 backdrop-blur-sm shadow-2xl"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a topic (e.g., 'Facts about Space') or leave blank for random"
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-lg"
              onKeyDown={(e) => e.key === 'Enter' && generatePrompts()}
            />
            <button
              onClick={generatePrompts}
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <Wand2 className="w-6 h-6" />
              )}
              {loading ? 'Generating...' : 'Generate Script'}
            </button>
          </div>
        </motion.div>

        {prompts.length > 0 && (
          <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-2xl md:text-3xl font-semibold flex items-center gap-3">
                <span className="w-2 h-8 bg-emerald-500 rounded-full inline-block"></span>
                Generated Video Parts
              </h2>
              <span className="text-sm font-medium text-emerald-400 bg-emerald-400/10 px-4 py-1.5 rounded-full border border-emerald-400/20">
                {prompts.length} Parts Total
              </span>
            </div>
            
            <div className="grid gap-8">
              {prompts.map((part, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={index}
                  className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl group hover:border-zinc-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-zinc-800 bg-zinc-950/50 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-500/20 shadow-inner">
                        {part.partNumber}
                      </div>
                      <h3 className="font-semibold text-zinc-200 text-lg">Part {part.partNumber}</h3>
                    </div>
                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <span className={`text-xs font-mono px-3 py-1.5 rounded-lg ${part.characterCount > 900 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'}`}>
                        {part.characterCount}/900 chars
                      </span>
                      <button
                        onClick={() => copyToClipboard(part.prompt, index)}
                        className="flex items-center gap-2 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-xl transition-colors border border-zinc-700 hover:border-zinc-600"
                      >
                        {copiedIndex === index ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy Prompt</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 md:p-8 space-y-6">
                    <div className="bg-zinc-950 rounded-2xl p-5 md:p-6 font-mono text-sm md:text-base text-zinc-300 leading-relaxed border border-zinc-800/50 relative shadow-inner">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-500 to-cyan-500 rounded-l-2xl opacity-50"></div>
                      {part.prompt}
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-zinc-800/50">
                      <div className="space-y-3">
                        <h4 className="text-xs uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                          Hindi Script (Bottom Half)
                        </h4>
                        <p className="text-sm md:text-base text-zinc-400 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/30">{part.hindiScript}</p>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-xs uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                          Visuals (Top Half)
                        </h4>
                        <p className="text-sm md:text-base text-zinc-400 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/30">{part.visualDescription}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
