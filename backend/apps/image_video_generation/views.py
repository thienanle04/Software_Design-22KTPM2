import os
import json
import base64
import logging
from io import BytesIO
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from google import genai
from google.genai import types
from PIL import Image
from django.conf import settings

# Set up logging
logger = logging.getLogger(__name__)
# Configure Google API key

GOOGLE_API_KEY = settings.GOOGLE_API_KEY


@csrf_exempt  # Remove this in production
def generate_image(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        # Parse the JSON request
        data = json.loads(request.body)
        prompt = data.get('prompt')

        if not prompt:
            return JsonResponse({'error': 'Prompt is required'}, status=400)

        # Create a Google Gemini AI client
        client = genai.Client(api_key=GOOGLE_API_KEY)

        # Generate image using Gemini
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp-image-generation",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=['Text', 'Image']
            )
        )

        logger.info(f"API response received: {response}")

        # Extract image data
        image_data = None
        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.mime_type.startswith('image/'):
                image_data = part.inline_data.data
                break

        if image_data:
            # Convert image bytes to Base64 for JSON response
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            return JsonResponse({'image_data': image_base64})
        else:
            logger.error(f"Image generation failed. Response: {response}")
            return JsonResponse({'error': 'Image generation failed or no image in response.'}, status=500)

    except Exception as e:
        logger.error(f"Error generating image: {e}")
        return JsonResponse({'error': str(e)}, status=500)
