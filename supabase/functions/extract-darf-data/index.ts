import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedData {
  cpf?: string;
  competency?: string;
  due_date?: string;
  amount?: number;
  confidence: {
    cpf: number;
    competency: number;
    due_date: number;
    amount: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log('Processing DARF document:', file.name);

    // Convert PDF to base64 for Google Vision API
    const fileBuffer = await file.arrayBuffer();
    const base64Content = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));

    const googleVisionApiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
    if (!googleVisionApiKey) {
      throw new Error('Google Vision API key not configured');
    }

    // Call Google Vision API for OCR
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Content,
              },
              features: [
                {
                  type: 'DOCUMENT_TEXT_DETECTION',
                  maxResults: 1,
                },
              ],
            },
          ],
        }),
      }
    );

    const visionData = await visionResponse.json();
    
    if (!visionData.responses || !visionData.responses[0]?.textAnnotations) {
      throw new Error('No text detected in document');
    }

    const extractedText = visionData.responses[0].textAnnotations[0]?.description || '';
    console.log('Extracted text length:', extractedText.length);

    // Extract data using regex patterns
    const extractedData: ExtractedData = {
      confidence: { cpf: 0, competency: 0, due_date: 0, amount: 0 }
    };

    // Extract CPF (XXX.XXX.XXX-XX format)
    const cpfRegex = /CPF[:\s]*(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/gi;
    const cpfMatch = extractedText.match(cpfRegex);
    if (cpfMatch) {
      const cpfNumbers = cpfMatch[0].replace(/[^\d]/g, '');
      if (cpfNumbers.length === 11) {
        extractedData.cpf = cpfNumbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        extractedData.confidence.cpf = 0.9;
      }
    }

    // Extract Competência (MM/YYYY format near "Período de Apuração")
    const competencyRegex = /per[ií]odo\s+de\s+apura[çc][ãa]o[:\s]*(\d{2}\/\d{4})/gi;
    const competencyMatch = extractedText.match(competencyRegex);
    if (competencyMatch) {
      const dateMatch = competencyMatch[0].match(/(\d{2}\/\d{4})/);
      if (dateMatch) {
        const [month, year] = dateMatch[1].split('/');
        extractedData.competency = `${year}-${month}-01`; // Convert to YYYY-MM-DD format
        extractedData.confidence.competency = 0.9;
      }
    }

    // Extract Data de Vencimento (DD/MM/YYYY format)
    const dueDateRegex = /data\s+de\s+vencimento[:\s]*(\d{2}\/\d{2}\/\d{4})/gi;
    const dueDateMatch = extractedText.match(dueDateRegex);
    if (dueDateMatch) {
      const dateMatch = dueDateMatch[0].match(/(\d{2}\/\d{2}\/\d{4})/);
      if (dateMatch) {
        const [day, month, year] = dateMatch[1].split('/');
        extractedData.due_date = `${year}-${month}-${day}`; // Convert to YYYY-MM-DD format
        extractedData.confidence.due_date = 0.9;
      }
    }

    // Extract Valor (multiple patterns) - try from most specific to most generic
    const amountPatterns = [
      /valor\s+total\s+do\s+documento[:\s]*R?\$?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/gi,
      /valor[:\s]*R?\$?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/gi,
      /valor\s+a\s+recolher[:\s]*R?\$?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/gi,
      /total\s+a\s+pagar[:\s]*R?\$?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/gi
    ];

    let amountFound = false;
    for (const pattern of amountPatterns) {
      if (amountFound) break;
      
      const amountMatch = extractedText.match(pattern);
      if (amountMatch) {
        console.log('Pattern matched:', pattern.source);
        const valueMatch = amountMatch[0].match(/(\d{1,3}(?:\.\d{3})*,\d{2})/);
        if (valueMatch) {
          // Convert Brazilian format (1.234,56) to decimal (1234.56)
          const cleanValue = valueMatch[1].replace(/\./g, '').replace(',', '.');
          const parsedValue = parseFloat(cleanValue);
          
          // Validate if value is reasonable (between 0.01 and 999999.99)
          if (parsedValue > 0 && parsedValue < 1000000) {
            extractedData.amount = parsedValue;
            extractedData.confidence.amount = 0.9;
            amountFound = true;
            console.log('Value extracted:', parsedValue, 'from pattern:', pattern.source);
          }
        }
      }
    }

    console.log('Extracted data:', extractedData);

    return new Response(JSON.stringify(extractedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in extract-darf-data function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        confidence: { cpf: 0, competency: 0, due_date: 0, amount: 0 }
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});