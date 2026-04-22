import { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Copy, RefreshCw, Wand2, Play, CheckCircle2, AlertCircle, Youtube, Hash, Image as ImageIcon, AlignLeft, Type as TypeIcon, Download, Loader2, FileText, File } from 'lucide-react';
import { motion } from 'motion/react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

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
  spokenScript: string;
  visualDescription: string;
  characterCount: number;
}

export default function App() {
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('Hindi+English');
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [prompts, setPrompts] = useState<PromptPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const generatePrompts = async () => {
    if (!ai) {
      alert("Gemini API key is missing. Please configure it in your environment variables.");
      return;
    }

    setLoading(true);
    setMetadata(null);
    setPrompts([]);

    let languageInstruction = "";
    if (language === 'Hindi') {
      languageInstruction = 'The spoken text MUST be written strictly in the Devanagari script (e.g., "नमस्ते", NOT "namaste" or Hinglish).';
    } else if (language === 'English') {
      languageInstruction = 'The spoken text MUST be written strictly in English.';
    } else if (language === 'Hinglish') {
      languageInstruction = 'The spoken text MUST be written in Hinglish (Hindi words written using the English alphabet, e.g., "Aap kaise ho").';
    } else if (language === 'Hindi+English') {
      languageInstruction = 'The spoken text MUST be a natural conversational mix of Hindi (written in Devanagari script) and English words.';
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a short YouTube video script about: ${topic || 'A random trending daily topic'}.
The video will be a 4k split-screen portrait video.
Bottom half: A boy looking directly at the camera, speaking the script in ${language}. ${languageInstruction}
Top half: Dynamic visuals related to the script. No text in the visuals, only English words if absolutely necessary.
Visual Style: High contrast, modern social media look, Neon glow edges, Dynamic lighting.

CRITICAL VEO GUIDELINES: All generated visual descriptions FOR THE VIDEO PARTS MUST strictly adhere to Google Veo video generator safety rules and best practices. Veo has strict filters and will FAIL to generate if these are violated:
1. NO REAL PEOPLE OR CELEBRITIES: Never use names of real public figures, politicians, or celebrities. Use generic descriptions (e.g., "a young man", "a female scientist").
2. NO COPYRIGHTED INTELLECTUAL PROPERTY: Never use names of copyrighted characters (e.g., Batman, Mickey Mouse), brands, logos, or specific artist styles (e.g., "in the style of Picasso").
3. STRICTLY SAFE FOR WORK: Absolutely no violence, weapons, blood, gore, injuries, nudity, sexual content, hate speech, or illegal acts.
4. NO TEXT GENERATION: Veo cannot generate text. Do not ask for words, signs, or labels to appear in the video.
5. NO CHILDREN IN DANGER: Do not depict minors in hazardous situations.
6. CINEMATIC DESCRIPTIONS: Use highly descriptive language specifying camera angles (e.g., close-up, wide shot, panning), lighting (e.g., cinematic, volumetric, neon), and motion. Keep it photorealistic.

Also generate YouTube metadata for this video: a catchy Title, an SEO-optimized PRO Description, a list of Tags, and a PRO-LEVEL prompt for generating a YouTube Shorts cover/thumbnail image.

The SEO Description MUST strictly follow this high-converting, copy-paste ready template:
"📄 🔥 SEO DESCRIPTION (Copy-Paste Ready)

In this video, we explain the concept of [Topic/Subject] in a very simple and easy way. This concept is part of [Relevant Context, e.g., NCERT Class / Subject / General Science] and helps you understand [Core Benefit / What it explains].

You will learn:
* [Bullet Point 1: Key concept covered]
* [Bullet Point 2: Main explanation/reasoning]
* [Bullet Point 3: Real-life examples or applications]

This short video is perfect for quick revision and concept clarity.

Watch till the end to understand the concept easily.

Like, Share and Subscribe for more educational videos."

The thumbnail prompt MUST strictly follow this exact structural template, adapted for the video's specific subject:

"Create a highly engaging, colorful YouTube Shorts thumbnail for an educational video titled '[Insert Video Title Here]'.
Include a confident teenage boy teacher (same face as reference image) wearing a dark blue jacket, standing in a modern [Insert relevant environment], slightly pointing toward a visual representation of [Insert core visual subject].

Use bold, large typography:
* '[Catchy Top Text]' in white
* '[MAIN KEYWORD]' in bright [Insert contrasting color, e.g., yellow] (very large, eye-catching)

Add small labeled callouts (if relevant):
* '[Label 1] – [Short description]'
* '[Label 2] – [Short description]'
* '[Label 3] – [Short description]'

Include a tagline: '[Subject] Made Simple!' in a glowing strip.
Use vibrant contrast (dark blue + [Accent Color 1] + [Accent Color 2]), cinematic lighting, soft glow effects, and depth blur background.

Style:
* Clean, modern, educational
* Slight 3D text effect with shadows
* Cartoon + semi-realistic 2D illustration
* High clarity for mobile viewing (portrait 9:16)

Add visual elements:
* Doodles/icons related to the topic ([Insert examples])
* Light bulb icon for 'easy learning'
* [Insert a specific dynamic visual effect related to topic, e.g., splashes, glowing particles]

Emotion:
* Friendly, confident teacher
* Curiosity + simplicity

Make it ultra-clickable, high contrast, and optimized for small screens (mobile-first design)."

Break the video down into sequential parts.
For each part, provide a prompt that is STRICTLY UNDER 900 characters.
Each prompt MUST follow this exact template:
"A 4k split-screen viral video. Bottom half: [ \\"Attached picture boy in a classroom with students\\"] looking directly at the camera with high energy, naturally speaking the script in ${language}: [Insert ${language} Script here], Top half: [Describe dynamic visuals for this part using Google Veo best practices, cinematic lighting, camera motion, without any text]. 🎨 Visual Style: High contrast, modern social media look, Neon glow edges, Dynamic lighting"

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
                    spokenScript: { type: Type.STRING, description: `The ${language} script spoken in this part.` },
                    visualDescription: { type: Type.STRING, description: "The English description of the top half visuals." },
                    characterCount: { type: Type.INTEGER, description: "The character count of the prompt string." }
                  },
                  required: ["partNumber", "prompt", "spokenScript", "visualDescription", "characterCount"]
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

  const copyToClipboard = (text: string, index: number | string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadPDF = async () => {
    const element = document.getElementById('pdf-content');
    if (!element) return;

    setIsGeneratingPDF(true);
    try {
      // html-to-image uses the browser's native rendering, which supports Tailwind v4's oklch colors
      const dataUrl = await toPng(element, { 
        quality: 0.95,
        backgroundColor: '#09090b', // zinc-950
        pixelRatio: 2,
        style: {
          padding: '20px',
          margin: '0'
        }
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(dataUrl);
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${topic ? topic.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'video'}_prompts.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const downloadTXT = () => {
    if (!metadata || prompts.length === 0) return;
    let content = `Topic: ${topic || 'Random'}\n\n`;
    content += `--- YOUTUBE METADATA ---\n`;
    content += `Title: ${metadata.title}\n\n`;
    content += `Description:\n${metadata.description}\n\n`;
    content += `Tags: ${metadata.tags.join(', ')}\n\n`;
    content += `Thumbnail Prompt:\n${metadata.thumbnailPrompt}\n\n`;
    content += `--- VIDEO PARTS ---\n\n`;
    prompts.forEach(p => {
      content += `[Part ${p.partNumber}]\n`;
      content += `Prompt: ${p.prompt}\n\n`;
      content += `Script (${language}): ${p.spokenScript}\n\n`;
      content += `Visuals: ${p.visualDescription}\n\n`;
      content += `------------------------\n\n`;
    });
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic ? topic.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'video'}_prompts.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadWord = () => {
    if (!metadata || prompts.length === 0) return;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
    const footer = "</body></html>";
    let html = `<h1 style="font-family: sans-serif;">Video Prompts: ${topic || 'Random'}</h1>`;
    html += `<h2 style="font-family: sans-serif; color: #d93025;">YouTube Metadata</h2>`;
    html += `<h3 style="font-family: sans-serif;">Title</h3><p style="font-family: sans-serif;">${metadata.title}</p>`;
    html += `<h3 style="font-family: sans-serif;">Description</h3><p style="font-family: sans-serif;">${metadata.description.replace(/\n/g, '<br>')}</p>`;
    html += `<h3 style="font-family: sans-serif;">Tags</h3><p style="font-family: sans-serif;">${metadata.tags.join(', ')}</p>`;
    html += `<h3 style="font-family: sans-serif;">Thumbnail Prompt</h3><p style="font-family: sans-serif;">${metadata.thumbnailPrompt}</p>`;
    html += `<h2 style="font-family: sans-serif; color: #10b981; margin-top: 30px;">Video Parts</h2>`;
    prompts.forEach(p => {
      html += `<h3 style="font-family: sans-serif;">Part ${p.partNumber}</h3>`;
      html += `<h4 style="font-family: sans-serif; color: #666;">Prompt</h4><p style="font-family: monospace; background: #f4f4f4; padding: 10px;">${p.prompt}</p>`;
      html += `<h4 style="font-family: sans-serif; color: #666;">Script (${language})</h4><p style="font-family: sans-serif;">${p.spokenScript}</p>`;
      html += `<h4 style="font-family: sans-serif; color: #666;">Visuals</h4><p style="font-family: sans-serif;">${p.visualDescription}</p>`;
      html += `<hr>`;
    });
    const sourceHTML = header + html + footer;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${topic ? topic.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'video'}_prompts.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-4 md:p-8 font-sans selection:bg-emerald-500/30 print:bg-white print:text-black print:p-0">
      <div className="max-w-4xl mx-auto space-y-12 print:space-y-8 print:max-w-none">
        <header className="text-center space-y-6 pt-8 print:hidden">
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
          className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 md:p-8 backdrop-blur-sm shadow-2xl print:hidden"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter a topic (e.g., 'Facts about Space') or leave blank"
                className="flex-[2] bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-lg"
                onKeyDown={(e) => e.key === 'Enter' && generatePrompts()}
              />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-lg appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
              >
                <option value="Hindi">Hindi (Devanagari)</option>
                <option value="English">English</option>
                <option value="Hinglish">Hinglish</option>
                <option value="Hindi+English">Hindi + English</option>
              </select>
            </div>
            <button
              onClick={generatePrompts}
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg shadow-emerald-500/20 whitespace-nowrap"
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
          <div className="space-y-8 pb-20 print:pb-0">
            
            <div className="flex flex-wrap justify-end gap-3 print:hidden">
              <button
                onClick={downloadTXT}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold px-6 py-3 rounded-xl transition-all border border-zinc-700 hover:border-zinc-600 shadow-lg"
              >
                <FileText className="w-5 h-5" />
                Save as TXT
              </button>
              <button
                onClick={downloadWord}
                className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-semibold px-6 py-3 rounded-xl transition-all border border-blue-500/30 hover:border-blue-500/50 shadow-lg"
              >
                <File className="w-5 h-5" />
                Save as Word
              </button>
              <button
                onClick={downloadPDF}
                disabled={isGeneratingPDF}
                className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold px-6 py-3 rounded-xl transition-all border border-red-500/30 hover:border-red-500/50 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingPDF ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                {isGeneratingPDF ? 'Generating PDF...' : 'Save as PDF'}
              </button>
            </div>

            <div id="pdf-content" className="space-y-8">
              {metadata && (
                <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl print:bg-white print:border-gray-300 print:shadow-none print:break-inside-avoid"
              >
                <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-950/50 flex items-center gap-3 print:bg-gray-50 print:border-gray-300">
                  <Youtube className="w-6 h-6 text-red-500 print:text-red-600" />
                  <h2 className="text-xl font-semibold text-zinc-100 print:text-black">YouTube Metadata</h2>
                </div>
                
                <div className="p-6 md:p-8 space-y-8">
                  {/* Title */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-2 print:text-gray-600">
                        <TypeIcon className="w-4 h-4" /> Title
                      </h3>
                      <button
                        onClick={() => copyToClipboard(metadata.title, 'title')}
                        className="text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 print:hidden"
                      >
                        {copiedIndex === 'title' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedIndex === 'title' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-lg md:text-xl font-medium text-zinc-100 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/30 print:bg-white print:border-gray-300 print:text-black">
                      {metadata.title}
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-2 print:text-gray-600">
                        <AlignLeft className="w-4 h-4" /> Description
                      </h3>
                      <button
                        onClick={() => copyToClipboard(metadata.description, 'description')}
                        className="text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 print:hidden"
                      >
                        {copiedIndex === 'description' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedIndex === 'description' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-sm md:text-base text-zinc-300 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/30 whitespace-pre-wrap print:bg-white print:border-gray-300 print:text-black">
                      {metadata.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-2 print:text-gray-600">
                        <Hash className="w-4 h-4" /> Tags
                      </h3>
                      <button
                        onClick={() => copyToClipboard(metadata.tags.join(', '), 'tags')}
                        className="text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 print:hidden"
                      >
                        {copiedIndex === 'tags' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedIndex === 'tags' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {metadata.tags.map((tag, i) => (
                        <span key={i} className="bg-zinc-800/50 text-zinc-300 border border-zinc-700/50 px-3 py-1 rounded-full text-sm print:bg-gray-100 print:border-gray-300 print:text-black">
                          #{tag.replace(/^#/, '')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Thumbnail Prompt */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-2 print:text-gray-600">
                        <ImageIcon className="w-4 h-4" /> Thumbnail Generation Prompt
                      </h3>
                      <button
                        onClick={() => copyToClipboard(metadata.thumbnailPrompt, 'thumbnail')}
                        className="text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 print:hidden"
                      >
                        {copiedIndex === 'thumbnail' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedIndex === 'thumbnail' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="bg-zinc-950 rounded-xl p-4 font-mono text-sm text-zinc-400 border border-zinc-800/50 relative shadow-inner print:bg-white print:border-gray-300 print:text-black print:shadow-none">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-pink-500 rounded-l-xl opacity-50 print:hidden"></div>
                      {metadata.thumbnailPrompt}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 pt-8 print:border-gray-300">
              <h2 className="text-2xl md:text-3xl font-semibold flex items-center gap-3 print:text-black">
                <span className="w-2 h-8 bg-emerald-500 rounded-full inline-block print:hidden"></span>
                Generated Video Parts
              </h2>
              <span className="text-sm font-medium text-emerald-400 bg-emerald-400/10 px-4 py-1.5 rounded-full border border-emerald-400/20 print:bg-gray-100 print:text-gray-800 print:border-gray-300">
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
                  className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl group hover:border-zinc-700 transition-colors print:bg-white print:border-gray-300 print:shadow-none print:break-inside-avoid"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-zinc-800 bg-zinc-950/50 gap-4 print:bg-gray-50 print:border-gray-300">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-500/20 shadow-inner print:bg-gray-200 print:text-black print:border-gray-300 print:shadow-none">
                        {part.partNumber}
                      </div>
                      <h3 className="font-semibold text-zinc-200 text-lg print:text-black">Part {part.partNumber}</h3>
                    </div>
                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <span className={`text-xs font-mono px-3 py-1.5 rounded-lg ${part.characterCount > 900 ? 'bg-red-500/10 text-red-400 border border-red-500/20 print:bg-red-50 print:text-red-700 print:border-red-200' : 'bg-zinc-950 text-zinc-400 border border-zinc-800 print:bg-white print:text-gray-600 print:border-gray-300'}`}>
                        {part.characterCount}/900 chars
                      </span>
                      <button
                        onClick={() => copyToClipboard(part.prompt, index)}
                        className="flex items-center gap-2 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-xl transition-colors border border-zinc-700 hover:border-zinc-600 print:hidden"
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
                    <div className="bg-zinc-950 rounded-2xl p-5 md:p-6 font-mono text-sm md:text-base text-zinc-300 leading-relaxed border border-zinc-800/50 relative shadow-inner print:bg-white print:border-gray-300 print:text-black print:shadow-none">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-500 to-cyan-500 rounded-l-2xl opacity-50 print:hidden"></div>
                      {part.prompt}
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-zinc-800/50 print:border-gray-300">
                      <div className="space-y-3">
                        <h4 className="text-xs uppercase tracking-widest text-amber-500 font-bold flex items-center gap-2 print:text-amber-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 print:bg-amber-600"></span>
                          Script ({language}) (Bottom Half)
                        </h4>
                        <p className="text-sm md:text-base text-amber-50 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 shadow-inner font-medium leading-relaxed print:bg-amber-50 print:border-amber-200 print:text-amber-900">{part.spokenScript}</p>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-xs uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-2 print:text-gray-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 print:bg-gray-400"></span>
                          Visuals (Top Half)
                        </h4>
                        <p className="text-sm md:text-base text-zinc-400 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/30 print:bg-white print:border-gray-300 print:text-black">{part.visualDescription}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
