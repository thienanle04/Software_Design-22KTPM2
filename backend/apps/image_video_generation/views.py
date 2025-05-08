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
from moviepy import ImageSequenceClip, concatenate_videoclips, AudioFileClip, CompositeAudioClip
import tempfile
import numpy as np
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Video, VideoImage
from mutagen.mp3 import MP3

# Set up logging
logger = logging.getLogger(__name__)
logging.getLogger("google.api_core").setLevel(logging.ERROR)
logging.getLogger("google.auth").setLevel(logging.ERROR)
logging.getLogger("google.auth.transport.requests").setLevel(logging.ERROR)
logging.getLogger("gtts").setLevel(logging.ERROR)
logging.getLogger("urllib3").setLevel(logging.ERROR)
logging.getLogger("httpcore").setLevel(logging.ERROR)
logging.getLogger("httpx").setLevel(logging.ERROR)
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

        # Check if response is valid
        if not response.candidates or not response.candidates[0].content:
            logger.error(f"No valid content in response: {response}")
            return JsonResponse({'error': 'No image content returned by API'}, status=500)

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

            # Check if response is valid
            if not response.candidates or not response.candidates[0].content:
                logger.error(f"No valid content in response: {response}")
                return JsonResponse({'error': 'No image content returned by API'}, status=500)

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
                logger.error(f"Image generation failed. Response: {response}")
                return JsonResponse({'error': 'Image generation failed or no image in response.'}, status=500)

        return JsonResponse({
            'images_data': images_data,
            'style': style,
            'resolution': resolution,
            'aspect_ratio': aspect_ratio
        }, status=200)

    except Exception as e:
        logger.error(f"Error generating images: {e}")
        return JsonResponse({'error': str(e)}, status=500)

# @csrf_exempt
# def create_video_from_images(request):
#     if request.method != 'POST':
#         return JsonResponse({'error': 'Method not allowed'}, status=405)
    
#     try:
#         # Get parameters
#         image_files = request.FILES.getlist('images')
#         fps = int(request.POST.get('fps', 24))
#         duration_per_image = float(request.POST.get('duration', 2.0))
#         transition_duration = float(request.POST.get('transition_duration', 1.0))
        
#         if len(image_files) < 2:
#             return JsonResponse({'error': 'At least 2 images are required'}, status=400)
        
#         # Set resolution
#         base_width, base_height = None, None
#         if resolution := request.POST.get('resolution'):
#             base_width, base_height = map(int, resolution.split('x'))
        
#         # Calculate dimensions from first image if not provided
#         if not base_width:
#             with Image.open(image_files[0]) as img:
#                 base_width, base_height = img.size
        
#         # IMPORTANT: Ensure dimensions are even numbers (required by libx264)
#         base_width = base_width - (base_width % 2)
#         base_height = base_height - (base_height % 2)
        
#         # Create temporary directory for storing processed frames
#         with tempfile.TemporaryDirectory() as temp_dir:
#             clips = []
            
#             # Process each image and create clips
#             for i, img_file in enumerate(image_files):
#                 # Create a unique subdirectory for each image's frames
#                 img_dir = os.path.join(temp_dir, f"img_{i}")
#                 os.makedirs(img_dir)
                
#                 # Adjusted duration for overlap
#                 adjusted_duration = duration_per_image + transition_duration if i < len(image_files) - 1 else duration_per_image
#                 num_frames = int(fps * adjusted_duration)
                
#                 # Process image once
#                 with Image.open(img_file) as img:
#                     # Resize to ensure even dimensions
#                     img = img.resize((base_width, base_height), Image.LANCZOS)
                    
#                     # Generate and save frames to disk instead of keeping them in memory
#                     for t in range(num_frames):
#                         frame_path = os.path.join(img_dir, f"{t:06d}.jpg")
                        
#                         # Calculate zoom factor
#                         zoom = 1 + 0.1 * (t / (num_frames - 1)) if num_frames > 1 else 1
                        
#                         # Apply zoom effect while ensuring dimensions stay even
#                         zoomed_width = int(base_width * zoom)
#                         zoomed_height = int(base_height * zoom)
#                         # Ensure zoomed dimensions are even
#                         zoomed_width = zoomed_width - (zoomed_width % 2)
#                         zoomed_height = zoomed_height - (zoomed_height % 2)
                        
#                         # Create zoomed image
#                         with img.resize((zoomed_width, zoomed_height), Image.LANCZOS) as zoomed_img:
#                             # Calculate crop coordinates
#                             left = (zoomed_width - base_width) // 2
#                             top = (zoomed_height - base_height) // 2
#                             right = left + base_width
#                             bottom = top + base_height
                            
#                             # Crop and save the frame
#                             with zoomed_img.crop((left, top, right, bottom)) as cropped_img:
#                                 # Use quality parameter to reduce file size
#                                 cropped_img.save(frame_path, 'JPEG', quality=85)
                
#                 # Create clip from saved frames
#                 clip = ImageSequenceClip(img_dir, fps=fps)
#                 clips.append(clip)
            
#             # Use different concatenation approach
#             padding = -transition_duration if len(clips) > 1 else 0
#             final_clip = concatenate_videoclips(clips, method="compose", padding=padding)
            
#             # Set output file path
#             output_path = os.path.join(temp_dir, 'output.mp4')
            
#             # Debug information
#             logger.info(f"Creating video with dimensions: {base_width}x{base_height} (both must be even)")
            
#             # Write final video with optimized settings
#             final_clip.write_videofile(
#                 output_path,
#                 fps=fps,
#                 codec='libx264',
#                 audio=False,
#                 threads=min(os.cpu_count() or 4, 8),
#                 preset='faster',
#                 ffmpeg_params=['-crf', '24', '-pix_fmt', 'yuv420p'],
#                 logger='bar',
#             )
            
#             # Read and encode video with streaming to avoid loading entire file into memory
#             with open(output_path, 'rb') as f:
#                     video_data = f.read()
                
#             video_base64 = base64.b64encode(video_data).decode('utf-8')
            
#             return JsonResponse({
#                 'video_base64': video_base64,
#                 'resolution': f"{base_width}x{base_height}",
#                 'frame_count': sum(int(fps * (duration_per_image + (transition_duration if i < len(image_files) - 1 else 0))) 
#                                    for i in range(len(image_files))),
#                 'total_duration': final_clip.duration
#             })
    
#     except Exception as e:
#         logger.error(f"Video creation error: {str(e)}", exc_info=True)
#         return JsonResponse({'error': str(e)}, status=500)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_video_from_images(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        # Get parameters
        image_files = request.FILES.getlist('images')
        audio_files = request.FILES.getlist('audios')
        fps = int(request.POST.get('fps', 24))
        durations = json.loads(request.POST.get('durations', '[]'))
        transition_duration = float(request.POST.get('transition_duration', 1.0))
        prompt = request.POST.get('prompt', '')

        # Validate inputs
        if len(image_files) < 2:
            return JsonResponse({'error': 'At least 2 images are required'}, status=400)
        if not durations:
            return JsonResponse({'error': 'Durations list is required'}, status=400)
        if len(durations) != len(image_files):
            return JsonResponse({'error': 'Number of durations must match number of images'}, status=400)
        if len(audio_files) != len(image_files):
            return JsonResponse({'error': 'Number of audios must match number of images'}, status=400)
        if not all(isinstance(d, (int, float)) and d > 0 for d in durations):
            return JsonResponse({'error': 'All durations must be positive numbers'}, status=400)

        # Set resolution
        base_width, base_height = None, None
        if resolution := request.POST.get('resolution'):
            base_width, base_height = map(int, resolution.split('x'))
        
        # Calculate dimensions from first image if not provided
        if not base_width:
            with Image.open(image_files[0]) as img:
                base_width, base_height = img.size
        
        # Ensure dimensions are even numbers (required by libx264)
        base_width = base_width - (base_width % 2)
        base_height = base_height - (base_height % 2)

        image_base64_list = []
        for img_file in image_files:
            img_file.seek(0)
            img_data = img_file.read()
            img_base64 = base64.b64encode(img_data).decode('utf-8')
            img_base64 = f"data:image/png;base64,{img_base64}"
            image_base64_list.append(img_base64)
        
        # Create temporary directory for storing processed frames and audios
        with tempfile.TemporaryDirectory() as temp_dir:
            clips = []
            audio_clips = []
            effect_duration = 5.0  # Max duration for zoom effect
            current_time = 0.0  # Track start time for each clip

            # Process each image and create clips

            for i, (img_file, duration, audio_file) in enumerate(zip(image_files, durations, audio_files)):
                img_dir = os.path.join(temp_dir, f"img_{i}")
                os.makedirs(img_dir)

                # Save audio file temporarily with explicit file closing
                audio_path = os.path.join(temp_dir, f"audio_{i}.mp3")
                with open(audio_path, 'wb') as f:
                    f.write(audio_file.read())
                    f.flush()  # Ensure all data is written
                    os.fsync(f.fileno())  # Force write to disk

                # Validate audio duration with mutagen
                try:
                    audio_info = MP3(audio_path)
                    audio_duration = audio_info.info.length
                except Exception as e:
                    logger.error(f"Invalid audio file {audio_path}: {str(e)}")
                    return JsonResponse({'error': f'Invalid audio file for clip {i+1}'}, status=400)

                # Adjusted duration for overlap
                adjusted_duration = duration + transition_duration if i < len(image_files) - 1 else duration
                total_frames = int(fps * adjusted_duration)
                effect_frames = int(min(adjusted_duration, effect_duration) * fps)

                # Process image
                with Image.open(img_file) as img:
                    img = img.resize((base_width, base_height), Image.LANCZOS)
                    base_frames = []

                    for t in range(effect_frames):
                        zoom = 1 + 0.1 * (t / (effect_frames - 1)) if effect_frames > 1 else 1
                        zoomed_width = int(base_width * zoom) - (int(base_width * zoom) % 2)
                        zoomed_height = int(base_height * zoom) - (int(base_height * zoom) % 2)

                        with img.resize((zoomed_width, zoomed_height), Image.LANCZOS) as zoomed_img:
                            left = (zoomed_width - base_width) // 2
                            top = (zoomed_height - base_height) // 2
                            right = left + base_width
                            bottom = top + base_height
                            
                            # Crop and save the frame
                            with zoomed_img.crop((left, top, right, bottom)) as cropped_img:
                                base_frames.append(cropped_img.copy())

                    # Repeat base frames to fill total_frames
                    full_frames = []
                    while len(full_frames) < total_frames:
                        for frame in base_frames:
                            if len(full_frames) >= total_frames:
                                break
                            full_frames.append(frame)

                    for j, frame in enumerate(full_frames):
                        frame_path = os.path.join(img_dir, f"{j:06d}.jpg")
                        frame.save(frame_path, 'JPEG', quality=85)

                # Create video clip
                clip = ImageSequenceClip(img_dir, fps=fps).with_duration(adjusted_duration)
                clips.append(clip)

                # Create audio clip with proper resource management
                audio_clip = None
                try:
                    audio_clip = AudioFileClip(audio_path).with_start(current_time)
                    if audio_duration > duration:
                        audio_clip = audio_clip.subclip(0, duration)  # Trim to image duration
                    audio_clips.append(audio_clip)
                except Exception as e:
                    logger.error(f"Failed to load audio clip {audio_path}: {str(e)}")
                    if audio_clip:
                        audio_clip.close()  # Ensure clip is closed on error
                    return JsonResponse({'error': f'Failed to process audio clip {i+1}'}, status=500)

                # Update current_time (no overlap for audio)
                current_time += duration

            # Concatenate video clips with transitions
            padding = -transition_duration if len(clips) > 1 else 0
            final_clip = concatenate_videoclips(clips, method="compose", padding=padding)

            # Combine audio clips
            if audio_clips:
                final_audio = CompositeAudioClip(audio_clips)
                final_clip = final_clip.with_audio(final_audio)

            # Set output file path
            output_path = os.path.join(temp_dir, 'output.mp4')
            
            # Debug information
            logger.info(f"Creating video with dimensions: {base_width}x{base_height} (both must be even)")
            
            # Write final video with optimized settings
            try:
                final_clip.write_videofile(
                    output_path,
                    fps=fps,
                    codec='libx264',
                    audio_codec='aac',
                    threads=min(os.cpu_count() or 4, 8),
                    preset='faster',
                    ffmpeg_params=['-crf', '24', '-pix_fmt', 'yuv420p'],
                    logger=None,
                )
            except Exception as e:
                logger.error(f"Failed to write video: {str(e)}")
                return JsonResponse({'error': f'Video rendering failed: {str(e)}'}, status=500)
            finally:
                # Clean up MoviePy resources
                for clip in clips:
                    clip.close()
                for audio_clip in audio_clips:
                    audio_clip.close()
                if 'final_audio' in locals():
                    final_audio.close()
                if 'final_clip' in locals():
                    final_clip.close()

            # Read and encode video
            with open(output_path, 'rb') as f:
                video_data = f.read()

            video_base64 = base64.b64encode(video_data).decode('utf-8')
            
            # Save video to database
            video = Video.objects.create(
                user=request.user,
                video_base64=video_base64,
                resolution=f"{base_width}x{base_height}",
                frame_count=sum(int(fps * (durations[i] + (transition_duration if i < len(image_files) - 1 else 0)))
                               for i in range(len(image_files))),
                total_duration=final_clip.duration if final_clip else sum(durations),
                prompt=prompt
            )

            for order, img_base64 in enumerate(image_base64_list):
                VideoImage.objects.create(
                    video=video,
                    image_base64=img_base64,
                    order=order + 1
                )
            
            return JsonResponse({
                'video_id': video.id,
                'video_base64': video_base64,
                'resolution': f"{base_width}x{base_height}",
                'frame_count': video.frame_count,
                'total_duration': final_clip.duration if final_clip else sum(durations),
                'prompt': prompt
            })
    
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid durations format'}, status=400)
    except Exception as e:
        logger.error(f"Video generation error: {str(e)}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)
    finally:
        # Ensure any remaining MoviePy resources are closed
        if 'clips' in locals():
            for clip in clips:
                clip.close()
        if 'audio_clips' in locals():
            for audio_clip in audio_clips:
                audio_clip.close()
        if 'final_audio' in locals():
            final_audio.close()
        if 'final_clip' in locals():
            final_clip.close()
    
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_video(request, video_id):
    try:
        video = Video.objects.get(id=video_id, user=request.user)
        video.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Video.DoesNotExist:
        return Response({'error': 'Video not found or you do not have permission to delete it'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Video deletion error: {str(e)}", exc_info=True)
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_video(request, video_id):
    try:
        video = Video.objects.get(id=video_id, user=request.user)
        return Response({
            'id': video.id,
            'video_base64': video.video_base64,
            'resolution': video.resolution,
            'frame_count': video.frame_count,
            'total_duration': video.total_duration,
            'prompt': video.prompt,
            'created_at': video.created_at,
            'images': [
                {
                    'id': img.id,
                    'image_base64': img.image_base64,
                    'order': img.order
                }
                for img in video.images.order_by('order')
            ]
        })
    except Video.DoesNotExist:
        return Response({'error': 'Video not found or you do not have permission to access it'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Video retrieval error: {str(e)}", exc_info=True)
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_image(request, image_id):
    try:
        image = VideoImage.objects.get(id=image_id, video__user=request.user)
        return Response({
            'id': image.id,
            'image_base64': image.image_base64,
            'order': image.order
        })
    except VideoImage.DoesNotExist:
        return Response({'error': 'Image not found or you do not have permission to access it'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Image retrieval error: {str(e)}", exc_info=True)
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserVideosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        videos = Video.objects.filter(user=request.user).order_by('-created_at')
        video_data = [
            {
                'id': video.id,
                'video_base64': video.video_base64,
                'resolution': video.resolution,
                'frame_count': video.frame_count,
                'total_duration': video.total_duration,
                'prompt': video.prompt,
                'created_at': video.created_at,
                'image_ids': [img.id for img in video.images.order_by('order')]
            }
            for video in videos
        ]
        return Response(video_data)
    