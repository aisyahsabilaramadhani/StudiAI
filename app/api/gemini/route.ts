import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Initialize the Gemini client utility on the server with user-agent for telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function POST(req: NextRequest) {
  try {
    const { action, content } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Konten materi tidak boleh kosong." }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: "API Key Gemini belum dikonfigurasi. Silakan buka Settings > Secrets di AI Studio." 
      }, { status: 500 });
    }

    // Use gemini-3.5-flash for basic/intermediate text generation tasks
    const model = "gemini-3.5-flash";

    if (action === "summarize") {
      const response = await ai.models.generateContent({
        model,
        contents: `Materi:\n${content}\n\nBuatlah ringkasan materi di atas. Ringkasan harus sangat singkat, padat, menggunakan bullet points (poin-poin) jika memungkinkan, serta ditulis dengan bahasa Indonesia yang mudah dipahami oleh mahasiswa. \nPENTING: Hanya gunakan informasi dari teks Materi di atas saja. Dilarang menambahkan fakta atau informasi tambahan dari luar yang tidak tertulis dalam Materi!`,
        config: {
          systemInstruction: "Anda adalah asisten akademik yang HANYA merangkum materi secara objektif berdasarkan teks yang diberikan oleh user. Jangan pernah menambahkan asumsi, opini, atau materi dari luar teks yang diinput.",
        }
      });

      return NextResponse.json({ result: response.text });

    } else if (action === "explain") {
      const response = await ai.models.generateContent({
        model,
        contents: `Materi:\n${content}\n\nJelaskan konsep, ide, dan materi di atas seperti tutor pribadi untuk mahasiswa pemula. Gunakan bahasa Indonesia yang ramah, santun, terstruktur, serta beri analogi praktis sehari-hari agar sangat mudah dipahami. \nPENTING: Penjelasan Anda wajib didasarkan HANYA pada fakta dan informasi yang ada di dalam teks Materi di atas. Jangan mengarang teori atau membawa konsep eksternal di luar apa yang didefinisikan dalam teks!`,
        config: {
          systemInstruction: "Anda adalah tutor akademik pribadi mahasiswa yang menerangkan materi secara ramah dan sabar, namun HANYA menggunakan konsep yang tertera di dalam teks materi yang disediakan user tanpa menambahkan pengetahuan eksternal di luarnya.",
        }
      });

      return NextResponse.json({ result: response.text });

    } else if (action === "quiz") {
      const response = await ai.models.generateContent({
        model,
        contents: `Materi:\n${content}\n\nBuatlah tepat 5 soal pilihan ganda di bahasa Indonesia dari materi di atas. Setiap soal wajib memiliki 4 opsi pilihan (A, B, C, D) dan sertakan kunci jawaban berupa huruf 'A', 'B', 'C', atau 'D' beserta penjelasan singkat mengapa jawaban tersebut benar. \nPENTING: Pembuatan soal kuis dan kunci jawaban harus 100% berdasarkan informasi dan fakta eksplisit yang dicantumkan dalam Materi di atas saja. Jangan menguji pengetahuan eksternal apa pun!`,
        config: {
          systemInstruction: "Anda adalah dosen yang menyusun kuis evaluasi berkualitas tinggi berdasarkan materi kuliah. Jawaban dan pertanyaan harus 100% merujuk hanya pada fakta yang tertulis di materi yang diberikan. Keluarkan kuis dalam bentuk format JSON terstruktur.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "Daftar berisi tepat 5 pertanyaan kuis pilihan ganda",
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: "Teks pertanyaan kuis dalam bahasa Indonesia" },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Daftar 4 string pilihan jawaban yang berformat seperti 'A. Opsi A', 'B. Opsi B', dll."
                },
                correctAnswer: { type: Type.STRING, description: "Jawaban yang benar, harus berupa string karakter tunggal bernilai 'A', 'B', 'C', atau 'D'" },
                explanation: { type: Type.STRING, description: "Penjelasan edukatif singkat tentang mengapa jawaban tersebut benar" }
              },
              required: ["question", "options", "correctAnswer", "explanation"]
            }
          }
        }
      });

      const responseText = response.text || "[]";
      try {
        const quizData = JSON.parse(responseText.trim());
        return NextResponse.json({ result: quizData });
      } catch (jsonErr) {
        console.error("Failed to parse Gemini quiz JSON response:", jsonErr);
        return NextResponse.json({ 
          error: "Terjadi kesalahan dalam memformat kuis. Silakan coba lagi.",
          rawText: responseText
        }, { status: 500 });
      }

    } else {
      return NextResponse.json({ error: "Aksi tidak valid." }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ 
      error: `Gagal memproses request AI: ${error.message || error}` 
    }, { status: 500 });
  }
}
