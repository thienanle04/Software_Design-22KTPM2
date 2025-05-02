import os
import json
import base64
import logging
from io import BytesIO
import time
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from google import genai
from google.genai import types
from PIL import Image
from django.conf import settings
import io
import requests
from gradio_client import Client, handle_file
from moviepy import ImageSequenceClip, concatenate_videoclips, vfx
import tempfile
import numpy as np

# Set up logging
logger = logging.getLogger(__name__)
# Configure Google API key

GOOGLE_API_KEY = settings.GOOGLE_API_KEY
# api_url = settings.API_URL
# text_to_video_api_url = settings.TEXT_TO_VIDEO_API_URL


@csrf_exempt  # Remove this in production
def generate_image(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        # Parse the JSON request
        data = json.loads(request.body)
        prompt = data.get('prompt')
        style = data.get('style', 'realistic')  # Default style
        resolution = data.get('resolution', '1024x1024')  # Default resolution
        aspect_ratio = data.get('aspect_ratio', '1:1')  # Default aspect ratio
        

        if not prompt:
            return JsonResponse({'error': 'Prompt is required'}, status=400)

        # Create a Google Gemini AI client
        client = genai.Client(api_key=GOOGLE_API_KEY)

        full_prompt = f"{prompt}, style: {style}, resolution: {resolution},({aspect_ratio} aspect ratio)"
        logger.error(f"Prompt: {full_prompt}")

        # Generate image using Gemini
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp-image-generation",
            contents=full_prompt,
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
            img = Image.open(BytesIO(image_data))
            # Resize the image to match the aspect ratio
            width, height = img.size
            aspect_width, aspect_height = map(int, aspect_ratio.split(':'))
            target_width = width
            target_height = int(width * aspect_height / aspect_width)

            if target_height > height:
                target_height = height
                target_width = int(height * aspect_width / aspect_height)

            img = img.resize((target_width, target_height), Image.LANCZOS)
            
            buffred = io.BytesIO()
            img.save(buffred, format="PNG")
            image_base64 = base64.b64encode(buffred.getvalue()).decode('utf-8')
            # Convert image bytes to Base64 for JSON response

            return JsonResponse({
                'image_data': image_base64, 
                'style': style, 
                'resolution': resolution, 
                'aspect_ratio': aspect_ratio}, status=200)
        else:
            logger.error(f"Image generation failed. Response: {response}")
            return JsonResponse({'error': 'Image generation failed or no image in response.'}, status=500)

    except Exception as e:
        logger.error(f"Error generating image: {e}")
        return JsonResponse({'error': str(e)}, status=500)
    

@csrf_exempt
def generate_images_from_story(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        story = data.get('story')
        style = data.get('style', 'realistic')
        resolution = data.get('resolution', '1024x1024')
        aspect_ratio = data.get('aspect_ratio', '16:9')

        if not story:
            return JsonResponse({'error': 'Story is required'}, status=400)

        # Split story into paragraphs
        paragraphs = [p.strip() for p in story.split('\n') if p.strip()]
        
        client = genai.Client(api_key=GOOGLE_API_KEY)
        images_data = []

        for paragraph in paragraphs:
            full_prompt = f"Generate not text image: {paragraph}, style: {style}, resolution: {resolution}, ({aspect_ratio} aspect ratio)"
            
            response = client.models.generate_content(
                model="gemini-2.0-flash-exp-image-generation",
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    response_modalities=['Text', 'Image']
                )
            )

            # Extract image data
            image_data = None
            for part in response.candidates[0].content.parts:
                if part.inline_data and part.inline_data.mime_type.startswith('image/'):
                    image_data = part.inline_data.data
                    break

            if image_data:
                img = Image.open(BytesIO(image_data))
                # Resize to match aspect ratio
                width, height = img.size
                aspect_width, aspect_height = map(int, aspect_ratio.split(':'))
                target_width = width
                target_height = int(width * aspect_height / aspect_width)

                if target_height > height:
                    target_height = height
                    target_width = int(height * aspect_width / aspect_height)

                img = img.resize((target_width, target_height), Image.LANCZOS)
                
                buffered = io.BytesIO()
                img.save(buffered, format="PNG")
                image_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
                images_data.append(image_base64)
            else:
                images_data.append(None)  # Or handle error as you prefer

        return JsonResponse({
            'images_data': images_data,
            'style': style,
            'resolution': resolution,
            'aspect_ratio': aspect_ratio
        }, status=200)

    except Exception as e:
        logger.error(f"Error generating images: {e}")
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def create_video_from_images(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        # Get parameters
        image_files = request.FILES.getlist('images')
        fps = int(request.POST.get('fps', 24))
        duration_per_image = float(request.POST.get('duration', 2.0))
        transition_duration = float(request.POST.get('transition_duration', 1.0))
        
        if len(image_files) < 2:
            return JsonResponse({'error': 'At least 2 images are required'}, status=400)
        
        # Set resolution
        base_width, base_height = None, None
        if resolution := request.POST.get('resolution'):
            base_width, base_height = map(int, resolution.split('x'))
        
        # Calculate dimensions from first image if not provided
        if not base_width:
            with Image.open(image_files[0]) as img:
                base_width, base_height = img.size
        
        # IMPORTANT: Ensure dimensions are even numbers (required by libx264)
        base_width = base_width - (base_width % 2)
        base_height = base_height - (base_height % 2)
        
        # Create temporary directory for storing processed frames
        with tempfile.TemporaryDirectory() as temp_dir:
            clips = []
            
            # Process each image and create clips
            for i, img_file in enumerate(image_files):
                # Create a unique subdirectory for each image's frames
                img_dir = os.path.join(temp_dir, f"img_{i}")
                os.makedirs(img_dir)
                
                # Adjusted duration for overlap
                adjusted_duration = duration_per_image + transition_duration if i < len(image_files) - 1 else duration_per_image
                num_frames = int(fps * adjusted_duration)
                
                # Process image once
                with Image.open(img_file) as img:
                    # Resize to ensure even dimensions
                    img = img.resize((base_width, base_height), Image.LANCZOS)
                    
                    # Generate and save frames to disk instead of keeping them in memory
                    for t in range(num_frames):
                        frame_path = os.path.join(img_dir, f"{t:06d}.jpg")
                        
                        # Calculate zoom factor
                        zoom = 1 + 0.1 * (t / (num_frames - 1)) if num_frames > 1 else 1
                        
                        # Apply zoom effect while ensuring dimensions stay even
                        zoomed_width = int(base_width * zoom)
                        zoomed_height = int(base_height * zoom)
                        # Ensure zoomed dimensions are even
                        zoomed_width = zoomed_width - (zoomed_width % 2)
                        zoomed_height = zoomed_height - (zoomed_height % 2)
                        
                        # Create zoomed image
                        with img.resize((zoomed_width, zoomed_height), Image.LANCZOS) as zoomed_img:
                            # Calculate crop coordinates
                            left = (zoomed_width - base_width) // 2
                            top = (zoomed_height - base_height) // 2
                            right = left + base_width
                            bottom = top + base_height
                            
                            # Crop and save the frame
                            with zoomed_img.crop((left, top, right, bottom)) as cropped_img:
                                # Use quality parameter to reduce file size
                                cropped_img.save(frame_path, 'JPEG', quality=85)
                
                # Create clip from saved frames
                clip = ImageSequenceClip(img_dir, fps=fps)
                clips.append(clip)
            
            # Use different concatenation approach
            padding = -transition_duration if len(clips) > 1 else 0
            final_clip = concatenate_videoclips(clips, method="compose", padding=padding)
            
            # Set output file path
            output_path = os.path.join(temp_dir, 'output.mp4')
            
            # Debug information
            logger.info(f"Creating video with dimensions: {base_width}x{base_height} (both must be even)")
            
            # Write final video with optimized settings
            final_clip.write_videofile(
                output_path,
                fps=fps,
                codec='libx264',
                audio=False,
                threads=min(os.cpu_count() or 4, 8),
                preset='faster',
                ffmpeg_params=['-crf', '24', '-pix_fmt', 'yuv420p'],
                logger='bar',
            )
            
            # Read and encode video with streaming to avoid loading entire file into memory
            with open(output_path, 'rb') as f:
                    video_data = f.read()
                
            video_base64 = base64.b64encode(video_data).decode('utf-8')
            
            return JsonResponse({
                'video_base64': video_base64,
                'resolution': f"{base_width}x{base_height}",
                'frame_count': sum(int(fps * (duration_per_image + (transition_duration if i < len(image_files) - 1 else 0))) 
                                   for i in range(len(image_files))),
                'total_duration': final_clip.duration
            })
    
    except Exception as e:
        logger.error(f"Video creation error: {str(e)}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)

"""
@csrf_exempt
def generate_video_from_image(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        # Get prompt and image from the POST request
        prompt = request.POST.get('prompt', 'Animate this image')
        image_file = request.FILES.get('image')

        if not image_file:
            return JsonResponse({'error': 'Image is required.'}, status=400)

        # Prepare the image for the API (no need to encode to base64, API expects file)
        image_data = image_file.read()
        files = {'image': (image_file.name, image_data, image_file.content_type)}

        # Prepare parameters (matching your local code's defaults where applicable)
        form_data = {
            'positive_prompt': prompt,
            'negative_prompt': 'low quality, worst quality, deformed, distorted',
            'width': '768',
            'height': '512',
            'seed': '0',
            'steps': '30',
            'cfg_scale': '2.5',
            'sampler_name': 'euler',
            'length': '73',
            'fps': '24'
        }


        # Step 1: Submit the job to the API
        response = requests.post(f"{api_url}/submit", data=form_data, files=files)
        if response.status_code != 200:
            return JsonResponse({'error': f'Failed to submit job: {response.text}'}, status=500)

        job_data = response.json()
        job_id = job_data['job_id']

        # Step 2: Poll for job completion
        start_time = time.time()
        timeout = 600  # 10 minutes timeout
        while True:
            status_response = requests.get(f"{api_url}/status/{job_id}")
            if status_response.status_code != 200:
                return JsonResponse({'error': f'Failed to get status: {status_response.text}'}, status=500)

            status_data = status_response.json()
            status = status_data['job_status']['status']

            if status == 'completed':
                break
            elif status == 'failed':
                return JsonResponse({'error': f'Job failed: {status_data["job_status"]["message"]}'}, status=500)
            elif time.time() - start_time > timeout:
                return JsonResponse({'error': 'Job timed out'}, status=500)
            else:
                time.sleep(5)  # Wait 5 seconds before checking again

        # Step 3: Get the base64-encoded video result
        result_response = requests.get(f"{api_url}/result/{job_id}?format=base64")
        if result_response.status_code != 200:
            return JsonResponse({'error': f'Failed to get result: {result_response.text}'}, status=500)

        result_data = result_response.json()
        if 'video_base64' not in result_data:
            return JsonResponse({'error': 'No video data in response'}, status=500)

        video_base64 = result_data['video_base64']

        # Step 4: Return the base64-encoded video in the response
        return JsonResponse({'video_base64': video_base64}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    

@csrf_exempt
def generate_video_from_text(request):
    # Restrict to POST requests
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        # Extract prompt from the request
        data = json.loads(request.body)
        prompt = data.get('prompt')
        if not prompt:
            return JsonResponse({'error': 'Prompt is required.'}, status=400)

        # Define the payload for the FastAPI /submit endpoint
        payload = {
            'positive_prompt': prompt,
            'negative_prompt': 'low quality, worst quality',
            'width': 768,
            'height': 512,
            'seed': 0,
            'steps': 25,
            'cfg_scale': 2.05,
            'sampler_name': 'res_multistep',
            'length': 73,
            'fps': 24
        }

        # Step 1: Submit the job to the FastAPI /submit endpoint
        response = requests.post(f"{text_to_video_api_url}/submit", json=payload)
        if response.status_code != 200:
            return JsonResponse({'error': f'Failed to submit job: {response.text}'}, status=500)

        # Extract job_id from the response
        job_data = response.json()
        job_id = job_data['job_id']

        # Step 2: Poll the job status with a 10-minute timeout
        start_time = time.time()
        timeout = 600  # 10 minutes
        while True:
            status_response = requests.get(f"{text_to_video_api_url}/status/{job_id}")
            if status_response.status_code != 200:
                return JsonResponse({'error': f'Failed to get status: {status_response.text}'}, status=500)

            status_data = status_response.json()
            status = status_data['job_status']['status']

            if status == 'completed':
                break
            elif status == 'failed':
                return JsonResponse({'error': f'Job failed: {status_data["job_status"]["message"]}'}, status=500)
            elif time.time() - start_time > timeout:
                return JsonResponse({'error': 'Job timed out'}, status=500)
            else:
                time.sleep(5)  # Wait 5 seconds before polling again

        # Step 3: Retrieve the base64-encoded video
        result_response = requests.get(f"{text_to_video_api_url}/result/{job_id}?format=base64")
        if result_response.status_code != 200:
            return JsonResponse({'error': f'Failed to get result: {result_response.text}'}, status=500)

        result_data = result_response.json()
        if 'video_base64' not in result_data:
            return JsonResponse({'error': 'No video data in response'}, status=500)

        video_base64 = result_data['video_base64']

        # Step 4: Return the video data to the client
        return JsonResponse({'video_base64': video_base64}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
@csrf_exempt
def generate_video_from_image(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        prompt = request.POST.get('prompt', 'Animate this image')
        image_file = request.FILES.get('image')

        if not image_file:
            return JsonResponse({'error': 'Image is required.'}, status=400)

        # Read the image file and encode as base64
        image_data = image_file.read()
        encoded_image = base64.b64encode(image_data).decode('utf-8')
        
        # Create the image dictionary with base64 data URL
        image_dict = {
            "path": None,
            "url": f"data:{image_file.content_type};base64,{encoded_image}",
            "size": image_file.size,
            "orig_name": image_file.name,
            "mime_type": image_file.content_type,
            "is_stream": False,
            "meta": {}
        }

        logger.info(f"Calling HF client with prompt: {prompt}")

        client = Client("Pyramid-Flow/pyramid-flow", hf_token="hf_token")
        result = client.predict(
            prompt=prompt,
            image=image_dict,
            duration=3,
            guidance_scale=9,
            video_guidance_scale=5,
            frames_per_second=8,
            api_name="/generate_video"
        )

        video_path = result.get('video')
        if video_path and os.path.exists(video_path):
            with open(video_path, 'rb') as f:
                video_base64 = base64.b64encode(f.read()).decode('utf-8')
            return JsonResponse({'video_base64': video_base64}, status=200)
        else:
            return JsonResponse({'error': 'Video generation failed.'}, status=500)

    except Exception as e:
        logger.error(f"Video generation error: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)
"""