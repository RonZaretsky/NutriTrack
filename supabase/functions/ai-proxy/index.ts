import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Parse the request body
    const { prompt, file_urls, response_json_schema, model = 'gpt-4o-mini' } = await req.json()

    if (!prompt) {
      throw new Error('Prompt is required')
    }

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: 'You are a nutrition assistant expert. Always respond in Hebrew and provide accurate nutritional information. Be precise with calculations and use the provided weight guidelines.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]

    // Add images if provided
    if (file_urls && file_urls.length > 0) {
      messages[1].content = [
        { type: 'text', text: prompt },
        ...file_urls.map((url: string) => ({
          type: 'image_url',
          image_url: { url }
        }))
      ]
    }

    // Prepare request body
    const requestBody: any = {
      model,
      messages,
      max_tokens: 2000,
      temperature: 0.3
    }

    // Add JSON response format if schema is provided
    if (response_json_schema) {
      requestBody.response_format = { type: 'json_object' }
    }

    // Make request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    // Parse JSON if schema was requested
    let result = content
    if (response_json_schema) {
      try {
        result = JSON.parse(content)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        console.error('Raw content:', content)
        throw new Error('Failed to parse AI response as JSON')
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('AI Proxy Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
}) 