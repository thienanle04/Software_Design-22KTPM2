import tempfile
import os
import logging
from django.http import FileResponse, JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.core.files import File
from gtts import gTTS
from pydub import AudioSegment
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny
from moviepy import TextClip, CompositeVideoClip, AudioFileClip
from .models import Voice, GeneratedVoice
import logging
from mutagen.mp3 import MP3
import base64
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from elevenlabs import ElevenLabs


logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
@permission_classes([AllowAny])
class GenerateAudioView(View):
    def post(self, request):
        try:
            text = request.POST.get('text')
            language = request.POST.get('language', 'en')
            pitch_shift = float(request.POST.get('pitch_shift', 1.0))
            slow = request.POST.get('slow', 'False').lower() == 'true'
            style = request.POST.get('style', None)

            if not text:
                logger.error("Text is required")
                return JsonResponse({'error': 'Text is required'}, status=400)

            # Create or get Voice object
            voice, _ = Voice.objects.get_or_create(
                provider='gTTS',
                language=language,
                voice_type='default'
            )

            # Create temporary file
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_file:
                temp_path = temp_file.name

            # Generate audio with gTTS
            tts = gTTS(text=text, lang=language, slow=slow)
            tts.save(temp_path)

            # Kiểm tra file gTTS
            if os.path.getsize(temp_path) == 0:
                logger.error("gTTS generated empty file")
                raise ValueError("gTTS generated empty file")

            # Apply pitch shift and effects with pydub
            audio = AudioSegment.from_mp3(temp_path)

            if pitch_shift != 1.0:
                new_rate = int(audio.frame_rate * pitch_shift)
                audio = audio._spawn(audio.raw_data, overrides={'frame_rate': new_rate})
                audio = audio.set_frame_rate(audio.frame_rate)

            # Apply effects based on style
            if style == 'funny':
                audio = audio.speedup(playback_speed=1.1)  # Tăng nhẹ tốc độ

            # Kiểm tra audio sau xử lý
            if len(audio) == 0:
                logger.error("Audio is empty after processing")
                raise ValueError("Generated audio is empty")

            audio.export(temp_path, format='mp3')

            # Save to GeneratedVoice
            generated_voice = GeneratedVoice.objects.create(
                voice=voice,
                text=text,
                pitch_shift=pitch_shift,
                speed=1.0 if not slow else 0.5,
                style=style,
                duration=len(audio) / 1000.0
            )
            with open(temp_path, 'rb') as f:
                django_file = File(f, name=f'audio_{generated_voice.id}.mp3')
                generated_voice.audio_file = django_file
                generated_voice.save()

            # Send file response
            response = FileResponse(open(temp_path, 'rb'), content_type='audio/mpeg')
            response['Content-Disposition'] = f'attachment; filename="{style}_audio.mp3"' if style else 'attachment; filename="output_audio.mp3"'

            # Clean up temporary file after response
            def cleanup():
                try:
                    os.remove(temp_path)
                except Exception as e:
                    logger.error(f"Failed to clean up {temp_path}: {str(e)}")

            response.close = cleanup
            return response

        except Exception as e:

            logger.error(f"Error generating audio: {str(e)}")

            return JsonResponse({'error': f'Failed to send file: {str(e)}'}, status=500)

# @method_decorator(csrf_exempt, name='dispatch')
# @permission_classes([AllowAny])
# class GenerateMultiAudioView(View):
#     def post(self, request):
#         try:
#             text = request.POST.get('text')
#             language = request.POST.get('language', 'en')
#             pitch_shift = float(request.POST.get('pitch_shift', 1.0))
#             slow = request.POST.get('slow', 'False').lower() == 'true'

#             if not text:
#                 return JsonResponse({'error': 'Text is required'}, status=400)
#             if pitch_shift != 1.0:
#                 logger.warning("Pitch shift requires FFmpeg and pydub. Using default pitch_shift=1.0.")
#                 pitch_shift = 1.0

#             # Split text into paragraphs
#             paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
#             if not paragraphs:
#                 return JsonResponse({'error': 'No valid paragraphs found'}, status=400)

#             # Create or get Voice object
#             voice, _ = Voice.objects.get_or_create(
#                 provider='gTTS',
#                 language=language,
#                 voice_type='default'
#             )

#             audio_results = []
#             temp_files = []

#             for idx, paragraph in enumerate(paragraphs):
#                 # Create temporary file
#                 with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_file:
#                     temp_path = temp_file.name

#                 # Generate audio with gTTS
#                 try:
#                     tts = gTTS(text=paragraph, lang=language, slow=slow)
#                     tts.save(temp_path)
#                 except Exception as e:
#                     logger.error(f"Failed to generate audio for paragraph {idx+1}: {str(e)}")
#                     return JsonResponse({'error': f'Audio generation failed: {str(e)}'}, status=500)

#                 # Get audio duration with mutagen
#                 try:
#                     audio = MP3(temp_path)
#                     audio_duration = audio.info.length
#                 except Exception as e:
#                     logger.error(f"Failed to get audio duration for paragraph {idx+1}: {str(e)}")
#                     return JsonResponse({'error': f'Failed to process audio duration: {str(e)}'}, status=500)

#                 # Read and encode audio as base64
#                 try:
#                     with open(temp_path, 'rb') as f:
#                         audio_data = f.read()
#                         audio_base64 = base64.b64encode(audio_data).decode('utf-8')
#                 except Exception as e:
#                     logger.error(f"Failed to encode audio for paragraph {idx+1}: {str(e)}")
#                     return JsonResponse({'error': f'Failed to encode audio: {str(e)}'}, status=500)

#                 # Save to GeneratedVoice
#                 generated_voice = GeneratedVoice.objects.create(
#                     voice=voice,
#                     text=paragraph,
#                     pitch_shift=pitch_shift,
#                     speed=1.0 if not slow else 0.5,
#                     duration=audio_duration
#                 )
#                 with open(temp_path, 'rb') as f:
#                     django_file = File(f, name=f'audio_{generated_voice.id}.mp3')
#                     generated_voice.audio_file = django_file
#                     generated_voice.save()

#                 # Store result
#                 audio_results.append({
#                     'id': generated_voice.id,
#                     'text': paragraph,
#                     'audio_base64': audio_base64,
#                     'pitch_shift': pitch_shift,
#                     'speed': 1.0 if not slow else 0.5,
#                     'duration': audio_duration
#                 })
#                 temp_files.append(temp_path)

#             # Return JSON response
#             response = JsonResponse({'audios': audio_results})

#             # Clean up temporary files
#             def cleanup():
#                 for temp_path in temp_files:
#                     try:
#                         os.remove(temp_path)
#                     except Exception:
#                         pass

#             response.close = cleanup
#             return response

#         except Exception as e:
#             logger.error(f"GenerateMultiAudioView error: {str(e)}", exc_info=True)
#             return JsonResponse({'error': f'Failed to generate audios: {str(e)}'}, status=500)
        


@method_decorator(csrf_exempt, name='dispatch')
@permission_classes([IsAuthenticated])
class GenerateMultiAudioView(View):
    def post(self, request):
        try:
            # Get parameters
            text = request.POST.get('text')
            language = request.POST.get('language', 'en')
            pitch_shift = float(request.POST.get('pitch_shift', 1.0))
            slow = request.POST.get('slow', 'False').lower() == 'true'

            if not text:
                return JsonResponse({'error': 'Text is required'}, status=400)

            # Log warning for pitch_shift (ElevenLabs doesn't support direct pitch shift)
            if pitch_shift != 1.0:
                logger.warning("ElevenLabs does not support pitch_shift. Using stability adjustment.")
                # Map pitch_shift to stability (0.0 to 1.0)
                stability = max(0.0, min(1.0, 1.0 / pitch_shift))
            else:
                stability = 0.5  # Default stability

            # Map slow to speed (ElevenLabs doesn't have a direct slow parameter)
            speed = 0.8 if slow else 1.0  # Approximate slow effect

            # Split text into paragraphs
            paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
            if not paragraphs:
                return JsonResponse({'error': 'No valid paragraphs found'}, status=400)

            # Create or get Voice object
            voice, _ = Voice.objects.get_or_create(
                provider='ElevenLabs',
                language=language,
                voice_type='JBFqnCBsd6RMkjVDRZzb'  # Match voice_id
            )

            audio_results = []
            temp_files = []

            # Initialize ElevenLabs client
            api_key = os.getenv('ELEVEN_LABS_API_KEY')
            if not api_key:
                return JsonResponse({'error': 'ElevenLabs API key not configured'}, status=500)
            client = ElevenLabs(api_key=api_key)

            for idx, paragraph in enumerate(paragraphs):
                # Generate audio with ElevenLabs
                try:
                    logger.info(f"Generating audio for paragraph {idx+1}: {paragraph[:50]}...")
                    audio_stream = client.text_to_speech.convert(
                        text=paragraph,
                        voice_id="JBFqnCBsd6RMkjVDRZzb",
                        model_id="eleven_flash_v2_5",
                        output_format="mp3_44100_128",
                        voice_settings={
                            "stability": stability,
                            "similarity_boost": 0.5,
                            "style": 0.0,
                            "use_speaker_boost": True
                        }
                    )

                    # Read audio data
                    audio_data = b''
                    for chunk in audio_stream:
                        audio_data += chunk
                except Exception as e:
                    logger.error(f"Failed to generate audio for paragraph {idx+1}: {str(e)}")
                    return JsonResponse({'error': f'Audio generation failed: {str(e)}'}, status=500)

                # Save to temporary file
                with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_file:
                    temp_path = temp_file.name
                    temp_file.write(audio_data)

                # Get audio duration with mutagen
                try:
                    audio = MP3(temp_path)
                    audio_duration = audio.info.length
                except Exception as e:
                    logger.error(f"Failed to get audio duration for paragraph {idx+1}: {str(e)}")
                    return JsonResponse({'error': f'Failed to process audio duration: {str(e)}'}, status=500)

                # Encode audio as base64
                try:
                    audio_base64 = base64.b64encode(audio_data).decode('utf-8')
                except Exception as e:
                    logger.error(f"Failed to encode audio for paragraph {idx+1}: {str(e)}")
                    return JsonResponse({'error': f'Failed to encode audio: {str(e)}'}, status=500)

                # Save to GeneratedVoice
                generated_voice = GeneratedVoice.objects.create(
                    voice=voice,
                    text=paragraph,
                    pitch_shift=pitch_shift,
                    speed=speed,
                    duration=audio_duration
                )
                with open(temp_path, 'rb') as f:
                    django_file = File(f, name=f'audio_{generated_voice.id}.mp3')
                    generated_voice.audio_file = django_file
                    generated_voice.save()

                # Store result
                audio_results.append({
                    'id': generated_voice.id,
                    'text': paragraph,
                    'audio_base64': audio_base64,
                    'pitch_shift': pitch_shift,
                    'speed': speed,
                    'duration': audio_duration
                })
                temp_files.append(temp_path)

            # Return JSON response
            response = JsonResponse({'audios': audio_results})

            # Clean up temporary files
            def cleanup():
                for temp_path in temp_files:
                    try:
                        os.remove(temp_path)
                        logger.info(f"Cleaned up temporary file: {temp_path}")
                    except Exception:
                        pass

            response.close = cleanup
            return response

        except Exception as e:
            logger.error(f"GenerateMultiAudioView error: {str(e)}", exc_info=True)
            return JsonResponse({'error': f'Failed to generate audios: {str(e)}'}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
@permission_classes([AllowAny])
class GenerateVideoView(View):
    def post(self, request):
        temp_audio_file = None
        temp_video_file = None
        video_file = None
        text_clip = None
        audio_clip = None
        video = None

        # Define cleanup function at the beginning to avoid UnboundLocalError
        def cleanup():
            try:
                if video_file:
                    video_file.close()
                if temp_audio_file and os.path.exists(temp_audio_file.name):
                    os.remove(temp_audio_file.name)
                if temp_video_file and os.path.exists(temp_video_file.name):
                    os.remove(temp_video_file.name)
                if text_clip:
                    text_clip.close()
                if audio_clip:
                    audio_clip.close()
                if video:
                    video.close()
            except Exception:
                pass

        try:
            text = request.POST.get('text')
            language = request.POST.get('language', 'en')
            pitch_shift = float(request.POST.get('pitch_shift', 1.0))
            slow = request.POST.get('slow', 'False').lower() == 'true'
            style = request.POST.get('style', None)

            if not text:
                logger.error("Text is required")
                return JsonResponse({'error': 'Text is required'}, status=400)

            # Create or get Voice object
            voice, _ = Voice.objects.get_or_create(
                provider='gTTS',
                language=language,
                voice_type='default'
            )

            # Create temporary files with delete=False
            temp_audio_file = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False)
            temp_video_file = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)

            # Generate audio with gTTS
            tts = gTTS(text=text, lang=language, slow=slow)
            tts.save(temp_audio_file.name)

            # Kiểm tra file gTTS
            if os.path.getsize(temp_audio_file.name) == 0:
                logger.error("gTTS generated empty file")
                raise ValueError("gTTS generated empty file")

            # Apply pitch shift and effects with pydub
            audio = AudioSegment.from_mp3(temp_audio_file.name)

            if pitch_shift != 1.0:
                new_rate = int(audio.frame_rate * pitch_shift)
                audio = audio._spawn(audio.raw_data, overrides={'frame_rate': new_rate})
                audio = audio.set_frame_rate(audio.frame_rate)

            # Apply effects based on style
            if style == 'funny':
                audio = audio.speedup(playback_speed=1.1)  # Tăng nhẹ tốc độ

            # Kiểm tra audio sau xử lý
            if len(audio) == 0:
                logger.error("Audio is empty after processing")
                raise ValueError("Generated audio is empty")

            audio.export(temp_audio_file.name, format='mp3')

            # Create video with moviepy
            duration = len(audio) / 1000.0
            text_clip = TextClip(text, fontsize=50, color='white', bg_color='black', size=(1280, 720))
            text_clip = text_clip.set_duration(duration)
            audio_clip = AudioFileClip(temp_audio_file.name)
            video = CompositeVideoClip([text_clip]).set_audio(audio_clip)
            video.write_videofile(temp_video_file.name, fps=24, codec='libx264', audio_codec='aac')

            # Save to GeneratedVoice
            generated_voice = GeneratedVoice.objects.create(
                voice=voice,
                text=text,
                pitch_shift=pitch_shift,
                speed=1.0 if not slow else 0.5,
                style=style,
                duration=duration
            )

            # Save audio file
            audio_file = open(temp_audio_file.name, 'rb')
            generated_voice.audio_file.save(f'audio_{generated_voice.id}.mp3', File(audio_file), save=False)
            audio_file.close()

            # Save video file
            video_file_for_storage = open(temp_video_file.name, 'rb')
            generated_voice.video_file.save(f'video_{generated_voice.id}.mp4', File(video_file_for_storage), save=False)
            video_file_for_storage.close()

            # Save the GeneratedVoice instance
            generated_voice.save()

            # Open video file for response
            video_file = open(temp_video_file.name, 'rb')
            response = FileResponse(video_file, content_type='video/mp4')
            response['Content-Disposition'] = f'attachment; filename="{style}_video.mp4"' if style else 'attachment; filename="output_video.mp4"'
            response['X-Duration'] = str(duration)

            # Attach cleanup to response
            response.close = cleanup
            return response

        except Exception as e:
            logger.error(f"Error generating video: {str(e)}")
            cleanup()
            return JsonResponse({'error': f'Failed to generate video: {str(e)}'}, status=500)
        

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_all_audios(request):
    """
    Delete all GeneratedVoice records and their associated audio files.
    """
    try:
        # Get all GeneratedVoice records
        voices = GeneratedVoice.objects.all()
        count = voices.count()

        # Delete associated audio files from disk
        for voice in voices:
            if voice.audio_file and os.path.exists(voice.audio_file.path):
                try:
                    os.remove(voice.audio_file.path)
                    logger.info(f"Deleted audio file: {voice.audio_file.path}")
                except Exception as e:
                    logger.warning(f"Failed to delete audio file {voice.audio_file.path}: {str(e)}")

        # Delete all records from the database
        voices.delete()
        logger.info(f"Deleted {count} GeneratedVoice records")

        return JsonResponse({
            'message': f'Successfully deleted {count} audio entries',
            'count': count
        }, status=200)

    except Exception as e:
        logger.error(f"Error deleting audio entries: {str(e)}", exc_info=True)
        return JsonResponse({
            'error': f'Failed to delete audio entries: {str(e)}'
        }, status=500)