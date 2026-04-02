import { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Copy, RefreshCw, Wand2, Play, CheckCircle2, AlertCircle, Youtube, Hash, Image as ImageIcon, AlignLeft, Type as TypeIcon } from 'lucide-react';
import { motion } from 'motion/react';

// Initialize Gemini API safely
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
  thumbnailPrompt: string;
}

interface PromptPart {
  partNumber: number;
  prompt: string;
  hindiScript: string;
  visualDescription: string;
  characterCount: number;
}

export default function App() {
  const [topic, setTopic] = useState('');
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [prompts, setPrompts] = useState<PromptPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | string | null>(null);

  const generatePrompts = async () => {
    if (!ai) {
      alert("Gemini API key is missing. Please configure it in your environment variables.");
      return;
    }

    setLoading(true);
    setMetadata(null);
    setPrompts([]);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a short YouTube video script about: ${topic || 'A random trending daily topic'}.
The video will be a 4k split-screen portrait video.
Bottom half: A boy looking directly at the camera, speaking the script in Hindi. The Hindi text MUST be written strictly in the Devanagari script (e.g., "नमस्ते", NOT "namaste" or Hinglish).
Top half: Dynamic visuals related to the script. No Hindi text, only English words if any.
Visual Style: High contrast, modern social media look, Neon glow edges, Dynamic lighting.

Also generate YouTube metadata for this video: a catchy Title, a Description, a list of Tags, and a prompt for generating a Thumbnail image.

Break the video down into sequential parts.
For each part, provide a prompt that is STRICTLY UNDER 900 characters.
Each prompt MUST follow this exact template:
"A 4k split-screen viral video. Bottom half: [ \\"Attached picture boy\\"] looking directly at the camera with high energy, naturally speaking the script in Hindi: [Insert Hindi Script in Devanagari script here], Top half: [Describe dynamic visuals for this part without any Hindi text]. 🎨 Visual Style: High contrast, modern social media look, Neon glow edges, Dynamic lighting"

Return the response as a JSON object containing 'metadata' and 'parts'.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              metadata: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Catchy YouTube video title" },
                  description: { type: Type.STRING, description: "YouTube video description" },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of YouTube tags" },
                  thumbnailPrompt: { type: Type.STRING, description: "Prompt for an AI image generator to create the YouTube thumbnail" }
                },
                required: ["title", "description", "tags", "thumbnailPrompt"]
              },
              parts: {
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
            },
            required: ["metadata", "parts"]
          }
        }
      });

      const jsonStr = response.text?.trim();
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        setMetadata(parsed.metadata);
        setPrompts(parsed.parts);
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
          
          {!ai && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-start gap-3 max-w-2xl mx-auto text-left"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Missing API Key</p>
                <p>The app cannot connect to the Gemini API. If you deployed this to Vercel, you need to add <code className="bg-red-500/20 px-1.5 py-0.5 rounded">GEMINI_API_KEY</code> to your Vercel Environment Variables and trigger a new deployment.</p>
              </div>
            </motion.div>
          )}
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
            {metadata && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl"
              >
                <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-950/50 flex items-center gap-3">
                  <Youtube className="w-6 h-6 text-red-500" />
                  <h2 className="text-xl font-semibold text-zinc-100">YouTube Metadata</h2>
                </div>
                
                <div className="p-6 md:p-8 space-y-8">
                  {/* Title */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-2">
                        <TypeIcon className="w-4 h-4" /> Title
                      </h3>
                      <button
                        onClick={() => copyToClipboard(metadata.title, 'title')}
                        className="text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        {copiedIndex === 'title' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedIndex === 'title' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-lg md:text-xl font-medium text-zinc-100 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/30">
                      {metadata.title}
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-2">
                        <AlignLeft className="w-4 h-4" /> Description
                      </h3>
                      <button
                        onClick={() => copyToClipboard(metadata.description, 'description')}
                        className="text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        {copiedIndex === 'description' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedIndex === 'description' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-sm md:text-base text-zinc-300 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/30 whitespace-pre-wrap">
                      {metadata.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-2">
                        <Hash className="w-4 h-4" /> Tags
                      </h3>
                      <button
                        onClick={() => copyToClipboard(metadata.tags.join(', '), 'tags')}
                        className="text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        {copiedIndex === 'tags' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedIndex === 'tags' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {metadata.tags.map((tag, i) => (
                        <span key={i} className="bg-zinc-800/50 text-zinc-300 border border-zinc-700/50 px-3 py-1 rounded-full text-sm">
                          #{tag.replace(/^#/, '')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Thumbnail Prompt */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> Thumbnail Generation Prompt
                      </h3>
                      <button
                        onClick={() => copyToClipboard(metadata.thumbnailPrompt, 'thumbnail')}
                        className="text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        {copiedIndex === 'thumbnail' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedIndex === 'thumbnail' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="bg-zinc-950 rounded-xl p-4 font-mono text-sm text-zinc-400 border border-zinc-800/50 relative shadow-inner">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-pink-500 rounded-l-xl opacity-50"></div>
                      {metadata.thumbnailPrompt}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 pt-8">
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
